import importlib.util, sys, json, re, copy, tempfile, zipfile, hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('deck_oracle',root/'tests/oracle.py')
o=importlib.util.module_from_spec(spec);sys.modules[spec.name]=o;spec.loader.exec_module(o)
source=root/'tests/fixtures/workshop.pptx'
output=root/'tests/generated/remapped.pptx'
receipt=root/'tests/generated/receipt.json'
expect=root/'tests/fixtures/expected-selection.json'
with zipfile.ZipFile(source) as z:before={n:z.read(n) for n in z.namelist()}
with zipfile.ZipFile(output) as z:good={n:z.read(n) for n in z.namelist()}
r=json.loads(receipt.read_text());results=[]
slide='ppt/slides/slide10.xml';rels='ppt/slides/_rels/slide10.xml.rels'
def sub(entries, part, old, new):
 assert old in entries[part],(part,old)
 entries[part]=entries[part].replace(old,new,1)
def edit_selected_tag(entries, fn):
 tag=re.search(rb'<a:hlinkClick r:id="rIdDeckRelay1"[^>]*>',entries[slide]).group()
 sub(entries,slide,tag,fn(tag))
def change_entries(name,mutate,expected_error,edit_receipt=None):
 with tempfile.TemporaryDirectory(prefix='deckrelay-oracle-') as td:
  td=Path(td);entries=copy.deepcopy(good);mutate(entries)
  dest=td/'out.pptx'
  with zipfile.ZipFile(dest,'w',zipfile.ZIP_DEFLATED) as z:
   for n,b in entries.items():z.writestr(n,b)
  rr=copy.deepcopy(r);rr['outputSha256']=o.sha(dest.read_bytes());rr['changedParts']=[{'part':n,'beforeSha256':o.sha(before[n]),'afterSha256':o.sha(b)} for n,b in entries.items() if n in before and b!=before[n]]
  if edit_receipt:edit_receipt(rr)
  rp=td/'receipt.json';rp.write_text(json.dumps(rr))
  try:o.verify(source,dest,rp,expect)
  except Exception as e:
   assert expected_error in str(e),(name,type(e).__name__,str(e));results.append((name,str(e)))
  else:raise AssertionError(name+' unexpectedly passed')
change_entries('unselected click',lambda e:sub(e,slide,b'<a:hlinkClick r:id="rIdSharedMenu"',b'<a:hlinkClick r:id="rIdDeckRelay1"'),'XML changed beyond')
change_entries('hover shared relationship',lambda e:sub(e,slide,b'<a:hlinkHover r:id="rIdSharedMenu"',b'<a:hlinkHover r:id="rIdDeckRelay1"'),'XML changed beyond')
change_entries('selected tooltip',lambda e:edit_selected_tag(e,lambda t:t.replace(b'tooltip="Synthetic navigation"',b'tooltip="Changed tooltip"')),'XML changed beyond')
change_entries('selected action',lambda e:edit_selected_tag(e,lambda t:t.replace(b'action="ppaction://hlinksldjump"',b'action="ppaction://hlinkshowjump?jump=nextslide"')),'not an explicit named-slide')
change_entries('selected sound child',lambda e:edit_selected_tag(e,lambda t:t.replace(b'/>',b'><a:snd r:embed="rIdUnknown"/></a:hlinkClick>')),'XML changed beyond')
change_entries('shared original target',lambda e:sub(e,rels,b'Target="/ppt/slides/slide80.xml"',b'Target="/ppt/slides/slide90.xml"'),'existing relationship changed')
change_entries('unused added relationship',lambda e:sub(e,rels,b'</Relationships>',b'<Relationship Id="unused" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="/ppt/slides/slide90.xml"/></Relationships>'),'not used by a selected')
change_entries('slide content edit',lambda e:sub(e,slide,b'<a:t>',b'<a:t>tamper '),'XML changed beyond')
change_entries('media byte edit',lambda e:e.__setitem__('ppt/media/preservation-witness.bin',e['ppt/media/preservation-witness.bin']+b'tamper'),'unselected/unrelated part changed')
change_entries('added ZIP entry',lambda e:e.__setitem__('added.txt',b'new'),'ZIP entry set changed')
change_entries('removed ZIP entry',lambda e:e.pop('ppt/media/preservation-witness.bin'),'ZIP entry set changed')
change_entries('DTD',lambda e:e.__setitem__(slide,b'<!DOCTYPE x>'+e[slide]),'DTD/entity')
change_entries('unsafe entry',lambda e:e.__setitem__('../outside',b'x'),'unsafe ZIP entry')
change_entries('missing destination',lambda e:sub(e,rels,b'/ppt/slides/slide90.xml',b'/ppt/slides/missing.xml'),'target is absent')
change_entries('wrong target matching wrong receipt',lambda e:sub(e,rels,b'/ppt/slides/slide90.xml',b'/ppt/slides/slide20.xml'),'independently authored',lambda rr:rr['changes'][0].update(toPart='ppt/slides/slide20.xml',toSlideId='259'))
# Malformed receipt, duplicates and skipped changes, with unchanged correct output.
for name,edit,why in [
 ('wrong path',lambda rr:rr['changes'][0].update(carrierPath=[0]),'independently authored'),
 ('wrong old relation ID',lambda rr:rr['changes'][0].update(oldRid='wrong'),'relationship ID mismatch'),
 ('wrong source ID',lambda rr:rr['changes'][0].update(sourceSlideId='256'),'independently authored'),
 ('omitted selection',lambda rr:rr['changes'].pop(),'independently authored'),
 ('duplicate selection',lambda rr:rr['changes'].append(copy.deepcopy(rr['changes'][0])),'independently authored'),
 ('omitted changed part',lambda rr:rr['changedParts'].pop(),'exactly enumerate'),
 ('duplicate changed part',lambda rr:rr['changedParts'].append(copy.deepcopy(rr['changedParts'][0])),'duplicate/unexpected')]:
 change_entries(name,lambda e:None,why,edit)
# No-op contract and intended empty set.
with tempfile.TemporaryDirectory(prefix='deckrelay-noop-') as td:
 td=Path(td);rp=td/'receipt.json';ep=td/'expected.json'
 rr={'schema':o.SCHEMA,'inputSha256':o.sha(source.read_bytes()),'outputSha256':o.sha(source.read_bytes()),'changes':[],'changedParts':[]}
 rp.write_text(json.dumps(rr));ep.write_text('[]')
 result=o.verify(source,source,rp,ep);assert result['selectedChanges']==0 and result['unchangedEntries']==50
 results.append(('no-op positive','passed'))
print(json.dumps({'checks':len(results),'cases':results},indent=2))
