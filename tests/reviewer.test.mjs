import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {inspectPackage,makePlan,preview,applyPlan,LIMITS} from '../src/core.mjs';
import {directory,openZip,encode,decode,sha256} from '../src/zip.mjs';
import {xml} from '../src/xml.mjs';
import {createDOM} from './reviewer-dom.mjs';

const sourceBytes=new Uint8Array(await readFile('tests/fixtures/workshop.pptx'));
const ctx=await inspectPackage(sourceBytes,'review.pptx');
const sourcePart='ppt/slides/slide10.xml';
// Independently resolved with Python XML, not copied from production carrier discovery.
const paths=[[0,1,4,0,0,1],[0,1,5,0,0,0],[0,1,6,2,2,1,0,0]];
const carrierIds=paths.map(p=>sourcePart+'#'+p.join('.'));
const b64=b=>Buffer.from(b).toString('base64');
function python(script,data){const r=spawnSync('python3',['-c',script],{input:JSON.stringify(data),encoding:'utf8',maxBuffer:32*1024*1024,timeout:30000});assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);}
function pythonZip(entries){return Uint8Array.from(Buffer.from(python(`import sys,json,io,zipfile,base64
x=json.load(sys.stdin);b=io.BytesIO()
with zipfile.ZipFile(b,'w',compression=zipfile.ZIP_STORED) as z:
 for n,v in x:z.writestr(n,v)
print(json.dumps(base64.b64encode(b.getvalue()).decode()))`,entries),'base64'));}

const batchOracle=String.raw`import sys,json,base64,io,zipfile,posixpath,hashlib
from xml.dom import minidom
x=json.load(sys.stdin); original=base64.b64decode(x['source']); before=zipfile.ZipFile(io.BytesIO(original)); part='ppt/slides/slide10.xml'; relpart='ppt/slides/_rels/slide10.xml.rels'; R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'; P='http://schemas.openxmlformats.org/presentationml/2006/main'
def doc(z,n):return minidom.parseString(z.read(n))
def elems(n):return [c for c in n.childNodes if c.nodeType==c.ELEMENT_NODE]
def at(root,path):
 for i in path:root=elems(root)[i]
 return root
def targets(z):
 root=doc(z,relpart);return {n.getAttribute('Id'):n.getAttribute('Target') for n in root.getElementsByTagNameNS('*','Relationship')}
pr=doc(before,'ppt/_rels/presentation.xml.rels'); prs={n.getAttribute('Id'):n.getAttribute('Target') for n in pr.getElementsByTagNameNS('*','Relationship')}; presentation=doc(before,'ppt/presentation.xml'); slideparts={n.getAttribute('id'):posixpath.normpath(posixpath.join('/ppt',prs[n.getAttributeNS(R,'id')])).lstrip('/') for n in presentation.getElementsByTagNameNS(P,'sldId')}
for case in x['cases']:
 raw=base64.b64decode(case['output']);after=zipfile.ZipFile(io.BytesIO(raw));receipt=case['receipt']; edits=case['edits']; assert before.namelist()==after.namelist()
 actual=[e for e in edits if e['toSlideId']!='256']; assert len(receipt['changes'])==len(actual);assert receipt['selectedCount']==len(edits);assert receipt['noOpCount']==len(edits)-len(actual)
 assert receipt['inputSha256']==hashlib.sha256(original).hexdigest();assert receipt['outputSha256']==hashlib.sha256(raw).hexdigest()
 expected_change_parts={part,relpart} if actual else set();changed={n for n in before.namelist() if before.read(n)!=after.read(n)};assert changed==expected_change_parts,(changed,expected_change_parts)
 assert {p['part'] for p in receipt['changedParts']}==changed
 assert receipt['unchangedPartCount']==len(before.namelist())-len(changed)
 for record in receipt['changedParts']:
  assert record['beforeSha256']==hashlib.sha256(before.read(record['part'])).hexdigest();assert record['afterSha256']==hashlib.sha256(after.read(record['part'])).hexdigest()
 assert receipt['slideOrder']==[{'id':sid,'part':name} for sid,name in slideparts.items()]
 plan={'schema':'deck-relay-plan-v1','inputSha256':receipt['inputSha256'],'edits':[{'carrierId':e['carrierId'],'toSlideId':e['toSlideId']} for e in edits]}
 assert receipt['planSha256']==hashlib.sha256(json.dumps(plan,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
 if not actual:assert raw==original
 else:
  a=doc(before,part);b=doc(after,part);rels=targets(after)
  for e in actual:
   path=e['path']; old=at(a.documentElement,path);new=at(b.documentElement,path);rid=new.getAttributeNS(R,'id'); target=posixpath.normpath(posixpath.join('/ppt/slides',rels[rid])).lstrip('/');assert target==slideparts[e['toSlideId']]
   record=next(c for c in receipt['changes'] if c['carrierPath']==path)
   assert record['sourcePart']==part and record['sourceSlideId']=='261' and record['fromSlideId']=='256' and record['toSlideId']==e['toSlideId']
   assert record['oldRid']=='rIdSharedMenu' and record['newRid']==rid and record['fromPart']==slideparts['256'] and record['toPart']==target
   assert record['kind']==('run' if len(path)==8 else 'shape')
   old.removeAttributeNS(R,'id');new.removeAttributeNS(R,'id')
  assert a.toxml()==b.toxml(),'unpermitted source XML difference'
  old=elems(doc(before,relpart).documentElement);new=elems(doc(after,relpart).documentElement);assert [n.toxml() for n in old]==[n.toxml() for n in new[:len(old)]]
  needed={e['toSlideId'] for e in actual};assert len(new)-len(old)==len(needed)
  old_ids={n.getAttribute('Id') for n in old};new_ids=[n.getAttribute('Id') for n in new];assert len(new_ids)==len(set(new_ids));assert all(n.getAttribute('Id') not in old_ids for n in new[len(old):])
 for n in before.namelist():
  if n not in changed:assert before.read(n)==after.read(n)
print(json.dumps({'cases':len(x['cases']),'ok':True}))`;

test('review: independent DOM/ZIP oracle checks 64 selective shared-reference batches',async()=>{
  const cases=[];
  for(let code=0;code<64;code++){
    let n=code;const edits=[];
    for(let i=0;i<3;i++){const choice=n%4;n=Math.floor(n/4);if(choice)edits.push({carrierId:carrierIds[i],toSlideId:['','256','260','263'][choice],path:paths[i]});}
    const plan=makePlan(ctx,edits),shown=preview(ctx,plan);assert.deepEqual(shown.rows.map(r=>r.carrierId),edits.map(e=>e.carrierId));
    const out=await applyPlan(ctx,plan);cases.push({output:b64(out.output),receipt:out.receipt,edits});
  }
  assert.deepEqual(python(batchOracle,{source:b64(sourceBytes),cases}),{cases:64,ok:true});
});
test('review: selected plan input is immutable and output cannot replay against a different source hash',async()=>{
  const plan=makePlan(ctx,[{carrierId:carrierIds[0],toSlideId:'260'}]),before=JSON.stringify(plan),hash=await sha256(sourceBytes),out=await applyPlan(ctx,plan);
  assert.equal(JSON.stringify(plan),before);assert.equal(await sha256(sourceBytes),hash);const next=await inspectPackage(out.output);assert.throws(()=>preview(next,plan),e=>e.code==='stale-plan');
  assert.equal(await sha256(encode(JSON.stringify(out.plan))),out.receipt.planSha256);
});
test('review: XML parser agrees with independent rejection of malformed lexical/namespace input',()=>{
  const bad=['<r\u00a0a="1"/>','\u00a0<r/>','<!--before--><?xml version="1.0"?><r/>','<r xmlns:xml="urn:wrong"/>','<r xmlns:xmlns="urn:x"/>','<r xmlns:x=""><x:a/></r>','<r xmlns:x="urn:x"><x:/></r>'];
  assert.deepEqual(python(`import json,sys,xml.etree.ElementTree as E
out=[]
for s in json.load(sys.stdin):
 try:E.fromstring(s);out.append(False)
 except E.ParseError:out.append(True)
print(json.dumps(out))`,bad),bad.map(()=>true));
  for(const s of bad)assert.throws(()=>xml(s),s);
  assert.equal(xml('<?xml version="1.0"?><r a="1"\t b="2">\u00a0</r>').text,'\u00a0');
});
test('review: unflagged non-ASCII ZIP names cannot silently acquire a different identity',()=>{
  const valid=pythonZip([['media/é.bin','x']]);assert.equal(directory(valid).entries.has('media/é.bin'),true);
  const bytes=valid.slice(),v=new DataView(bytes.buffer),central=v.getUint32(bytes.length-22+16,true);v.setUint16(6,0,true);v.setUint16(central+8,0,true);
  assert.deepEqual(python(`import sys,json,base64,io,zipfile
print(json.dumps(zipfile.ZipFile(io.BytesIO(base64.b64decode(json.load(sys.stdin)))).namelist()))`,b64(bytes)),['media/├⌐.bin']);
  assert.throws(()=>directory(bytes));assert.equal(directory(pythonZip([['plain.bin','x']])).entries.has('plain.bin'),true);
});

async function uiHarness(){
  const dom=createDOM(),workers=[],urls=new Map();let nextURL=0;
  const saved={document:globalThis.document,window:globalThis.window,Worker:globalThis.Worker,CSS:globalThis.CSS,create:URL.createObjectURL,revoke:URL.revokeObjectURL};
  class Worker{constructor(){workers.push(this);}postMessage(data){this.message=data;}terminate(){this.terminated=true;}async respond(){const d=this.message,c=await inspectPackage(d.bytes,d.name);let reply;if(d.type==='inspect')reply={id:d.id,type:'inspected',model:c.model};if(d.type==='preview')reply={id:d.id,type:'previewed',preview:preview(c,d.plan)};if(d.type==='export'){const out=await applyPlan(c,d.plan);reply={id:d.id,type:'exported',...out};}this.reply=reply;this.onmessage({data:reply});}}
  Object.assign(globalThis,{...dom,Worker,CSS:{escape:x=>x}});URL.createObjectURL=blob=>{const id='blob:review-'+(++nextURL);urls.set(id,blob);return id;};URL.revokeObjectURL=id=>urls.delete(id);
  await import('../src/app.mjs?review='+Math.random());const $=id=>dom.document.getElementById(id),click=id=>$(id).onclick({target:$(id)});
  return {$,click,workers,async load(){await $('file').onchange({target:{files:[new File([sourceBytes],'review.pptx')],value:''}});await workers.at(-1).respond();},async showPlan(target){const plan=makePlan(ctx,[{carrierId:carrierIds[0],toSlideId:target}]);await $('plan-file').onchange({target:{files:[new File([JSON.stringify(plan)],'plan.json')],value:''}});await workers.at(-1).respond();},cleanup(){for(const w of workers)w.terminate();Object.assign(globalThis,{document:saved.document,window:saved.window,Worker:saved.Worker,CSS:saved.CSS});URL.createObjectURL=saved.create;URL.revokeObjectURL=saved.revoke;}};
}
test('review: actual handlers remove old downloads before importing a different plan',async()=>{
  const ui=await uiHarness();try{await ui.load();await ui.showPlan('260');ui.click('export');await ui.workers.at(-1).respond();assert.ok(ui.$('download-pptx'));
    const plan=makePlan(ctx,[{carrierId:carrierIds[0],toSlideId:'263'}]);const pending=ui.$('plan-file').onchange({target:{files:[new File([JSON.stringify(plan)],'other.json')],value:''}});assert.equal(ui.$('download-pptx'),null);await pending;await ui.workers.at(-1).respond();assert.equal(ui.$('download-pptx'),null);assert.ok(ui.$('preview-panel').textContent.includes('ID 263'));
  }finally{ui.cleanup();}
});
test('review: stale worker errors and duplicate completion cannot replace a newer request',async()=>{
  const ui=await uiHarness();try{await ui.load();ui.click('demo');const old=ui.workers.at(-1);ui.click('demo');const current=ui.workers.at(-1);old.onerror(new Error('late'));assert.equal(current.terminated,undefined);await current.respond();assert.ok(ui.$('notice').textContent.includes('読み込み')||ui.$('notice').textContent.includes('loaded'));
    const currentReply=current.reply;ui.click('demo');current.onmessage({data:currentReply});assert.equal(ui.workers.at(-1).terminated,undefined);
  }finally{ui.cleanup();}
});
test('review: a rejected old plan read cannot overwrite reset status',async()=>{
  const ui=await uiHarness();try{await ui.load();let reject;const promise=new Promise((_,r)=>reject=r);const pending=ui.$('plan-file').onchange({target:{files:[{size:10,arrayBuffer:()=>promise}],value:''}});
    const dialog=ui.$('reset-dialog');dialog.returnValue='reset';dialog.onclose({target:dialog});const before=ui.$('notice').textContent;reject(Error('old file error'));await pending;assert.equal(ui.$('notice').textContent,before);
  }finally{ui.cleanup();}
});
test('review: malformed UTF-8 plan bytes are rejected before a preview request',async()=>{
  const ui=await uiHarness();try{await ui.load();const plan={...makePlan(ctx,[{carrierId:carrierIds[0],toSlideId:'260'}]),note:'X'};const raw=Buffer.from(JSON.stringify(plan));raw[raw.indexOf(Buffer.from('"X"'))+1]=255;const before=ui.workers.length;
    await ui.$('plan-file').onchange({target:{files:[new File([raw],'bad.json')],value:''}});assert.equal(ui.workers.length,before);assert.ok(ui.$('notice').className.includes('error'));assert.equal(ui.$('preview-panel'),null);
  }finally{ui.cleanup();}
});
test('review: filtering keeps hidden selections in the complete batch preview',async()=>{
  const ui=await uiHarness();try{await ui.load();ui.click('demo-selection');ui.$('source-filter').onchange({target:{value:'256'}});const hidden=ui.$('workspace').querySelector('.hidden-note');assert.ok(hidden.textContent.includes('3'));ui.click('preview');await ui.workers.at(-1).respond();assert.equal(ui.$('preview-panel').querySelectorAll('.preview-row').length,3);assert.equal(ui.workers.at(-1).message.plan.edits.length,3);
  }finally{ui.cleanup();}
});
test('review: namespace-heavy bounded XML completes without exhausting an isolated 128 MiB heap',()=>{
  const code=`import {xml} from './src/xml.mjs';const text='<r '+Array.from({length:3000},(_,i)=>'xmlns:n'+i+'="urn:'+i+'"').join(' ')+'>'+ '<n/>'.repeat(3000)+'</r>';try{xml(text);console.log(JSON.stringify({status:'accepted'}));}catch(e){if(!e.code)throw e;console.log(JSON.stringify({status:'bounded-rejection',code:e.code}));}`;
  const r=spawnSync(process.execPath,['--max-old-space-size=128','--input-type=module','-e',code],{encoding:'utf8',timeout:8000,maxBuffer:1024*1024});assert.equal(r.status,0,r.stderr);const parsed=JSON.parse(r.stdout);assert.ok(['accepted','bounded-rejection'].includes(parsed.status));
});
test('review: changing XML preserves the encoding interpretation of an untouched legacy ZIP comment',async()=>{
  const raw=python(`import sys,json,base64,io,zipfile
src=zipfile.ZipFile(io.BytesIO(base64.b64decode(json.load(sys.stdin))));b=io.BytesIO()
with zipfile.ZipFile(b,'w') as out:
 for info in src.infolist():
  if info.filename=='ppt/slides/slide10.xml':info.comment=bytes([0x82])
  out.writestr(info,src.read(info.filename))
print(json.dumps(base64.b64encode(b.getvalue()).decode()))`,b64(sourceBytes));
  const input=Uint8Array.from(Buffer.from(raw,'base64')),c=await inspectPackage(input),out=await applyPlan(c,makePlan(c,[{carrierId:carrierIds[0],toSlideId:'260'}]));
  const values=python(`import sys,json,base64,io,zipfile
print(json.dumps([[z.getinfo('ppt/slides/slide10.xml').flag_bits&2048,z.getinfo('ppt/slides/slide10.xml').comment.hex()] for z in [zipfile.ZipFile(io.BytesIO(base64.b64decode(s))) for s in json.load(sys.stdin)]]))`,[raw,b64(out.output)]);
  assert.deepEqual(values,[[0,'82'],[0,'82']]);
});
