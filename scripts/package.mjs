import {execFileSync} from 'node:child_process';import {readFile,writeFile,mkdir} from 'node:fs/promises';
await mkdir('../deck-relay-output',{recursive:true});const log=execFileSync('npm',['run','check'],{encoding:'utf8',maxBuffer:16*1024*1024});await writeFile('../deck-relay-output/local-check.log',log);const count=Number(log.match(/ℹ tests (\d+)/)?.[1]);if(!count)throw Error('Test count missing');
execFileSync('python3',['-c',`from pathlib import Path
import hashlib,json,zipfile
root=Path('.');out=Path('../deck-relay-output');files=[]
for p in sorted(root.rglob('*')):
 if not p.is_file() or any(x in {'.git','node_modules','dist','__pycache__','artifacts','generated','render-evidence'} for x in p.parts) or p.suffix=='.pyc':continue
 files.append(p)
with zipfile.ZipFile(out/'deck-relay-source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in files:
  i=zipfile.ZipInfo('deck-relay/'+p.as_posix(),(2026,10,4,0,0,0));i.compress_type=zipfile.ZIP_DEFLATED;i.external_attr=0o100644<<16;z.writestr(i,p.read_bytes())
a=out/'deck-relay-source.zip';manifest={'schema':'deck-relay-source-manifest-v1','version':'0.1.0','status':'frozen-with-pinned-hosted-evidence','files':[{'path':p.as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files],'verification':{'nodeTests':${count},'independentOracle':'3 intended changes, 26 unselected carriers, 44 untouched members, 16 whole-shape checks each package','mutationOracle':'22 rejections plus no-op positive','independentReview':'Eleven reviewer tests including 64 selective batch cases and actual UI handlers; see docs/INDEPENDENT_REVIEW.md','libreOffice':'local eight-slide before/after rendered PNG equality and individual visual inspection passed','browser':'12 passed at pinned implementation commit; see docs/evidence/manifest.json','hostedCI':{'commit':'2ad560fe0c8cdbfdca6c203cd94cc115fca55793','run':'https://github.com/Masanori-Spec/deck-relay/actions/runs/37180574361','modelJobs':'4 passed with 41 tests each','libreOffice':'passed; eight source/output PNG pairs identical','browser':'12 passed, sandbox enabled, no uncaught errors','scope':'Bundled artifacts are pinned to this implementation commit. Packaging checks local source/evidence only; it does not rerun hosted CI or prove later documentation heads.'},'pinnedEvidence':'19 artifact file hashes, rendered PPTX binding, actual plan replay and independent output oracle rechecked locally','nativePowerPoint':'unrun','publication':'implementation published; final documentation-head audit is external'},'archive':{'name':a.name,'bytes':a.stat().st_size,'sha256':hashlib.sha256(a.read_bytes()).hexdigest()}}
(out/'source-manifest.json').write_text(json.dumps(manifest,indent=2)+'\\n')
with zipfile.ZipFile(a) as z:
 assert z.testzip() is None
 for f in manifest['files']:assert hashlib.sha256(z.read('deck-relay/'+f['path'])).hexdigest()==f['sha256']
(out/'archive-verification.json').write_text(json.dumps({'status':'passed','files':len(files),'archiveSha256':manifest['archive']['sha256']},indent=2)+'\\n')
print(json.dumps({'files':len(files),'archive':manifest['archive']},indent=2))
`],{stdio:'inherit'});
