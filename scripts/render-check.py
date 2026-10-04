"""Read/open/render the original and remapped synthetic deck in LibreOffice.
Does not prove native PowerPoint slideshow behavior. No user deck is sent out.
"""
from pathlib import Path
import subprocess, shutil, tempfile, hashlib, json, re, os
root=Path(__file__).resolve().parents[1];out=root/'tests/render-evidence';out.mkdir(exist_ok=True)
soffice=shutil.which('libreoffice') or shutil.which('soffice')
if not soffice:raise SystemExit('LibreOffice is unavailable; render check was not run')
for tool in ['pdfinfo','pdftoppm']:
 if not shutil.which(tool):raise SystemExit(tool+' is unavailable; render check was not run')
records={}
for name,source in [('source',root/'tests/fixtures/workshop.pptx'),('remapped',root/'tests/generated/remapped.pptx')]:
 with tempfile.TemporaryDirectory(prefix='deckrelay-lo-') as td:
  td=Path(td);temp=td/(name+'.pptx');shutil.copyfile(source,temp);(td/'cache').mkdir();env={**os.environ,'XDG_CACHE_HOME':str(td/'cache')}
  run=subprocess.run([soffice,'-env:UserInstallation='+ (td/'profile').as_uri(),'--headless','--convert-to','pdf','--outdir',str(out),str(temp)],timeout=90,capture_output=True,text=True,env=env)
  if run.returncode:
   (out/'results.json').write_text(json.dumps({'status':'blocked','stage':'LibreOffice conversion','returnCode':run.returncode,'stdout':run.stdout,'stderr':run.stderr,'nativePowerPointTested':False},indent=2)+'\n')
   raise SystemExit('LibreOffice conversion failed: '+run.stderr+run.stdout)
 pdf=out/(name+'.pdf');assert pdf.exists(),name+' PDF missing'
 info=subprocess.check_output(['pdfinfo',str(pdf)],text=True);pages=int(re.search(r'Pages:\s+(\d+)',info).group(1));assert pages==8
 subprocess.run(['pdftoppm','-r','96','-png',str(pdf),str(out/name)],check=True,timeout=90,capture_output=True)
 hashes=[hashlib.sha256((out/f'{name}-{i}.png').read_bytes()).hexdigest() for i in range(1,9)]
 records[name]={'inputPptxSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pages':pages,'pdfSha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),'pagePngSha256':hashes}
assert records['source']['pagePngSha256']==records['remapped']['pagePngSha256'],'Rendered pixels changed'
record={'status':'passed','renderer':subprocess.check_output([soffice,'--version'],text=True).strip(),'sameRenderedPixelsAllEightSlides':True,'nativePowerPointTested':False,'outputs':records}
(out/'results.json').write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2))
