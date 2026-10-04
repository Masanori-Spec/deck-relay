"""Prepare original interoperability fixtures from the editable artifact-tool deck.
This is fixture authoring only. Production never runs Python or python-pptx.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo
import xml.etree.ElementTree as ET
import posixpath, json, base64, hashlib
ROOT=Path(__file__).resolve().parents[1]
P='http://schemas.openxmlformats.org/presentationml/2006/main';A='http://schemas.openxmlformats.org/drawingml/2006/main';R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';PKG='http://schemas.openxmlformats.org/package/2006/relationships';CT='http://schemas.openxmlformats.org/package/2006/content-types'
for pre,ns in [('p',P),('a',A),('r',R)]: ET.register_namespace(pre,ns)
q=lambda n,l:'{'+n+'}'+l
with ZipFile(ROOT/'tests/fixtures/demo-base.pptx') as z:data={n:z.read(n) for n in z.namelist()}
# Part names intentionally do not match presentation order.
new_names=['slide80.xml','slide30.xml','slide60.xml','slide20.xml','slide90.xml','slide10.xml','slide70.xml','slide40.xml']
rename={'ppt/slides/slide%d.xml'%(i+1):'ppt/slides/'+n for i,n in enumerate(new_names)}
def relsource(path):
 if path=='_rels/.rels':return ''
 return path.replace('/_rels/','/').removesuffix('.rels')
def relpart(path):return posixpath.join(posixpath.dirname(path),'_rels',posixpath.basename(path)+'.rels')
def ser(root):
 if root.tag.startswith('{'+PKG+'}') or root.tag.startswith('{'+CT+'}'):ET.register_namespace('',root.tag[1:].split('}')[0])
 return ET.tostring(root,encoding='utf-8',xml_declaration=True)
for path,raw in list(data.items()):
 if path.endswith('.rels'):
  root=ET.fromstring(raw);source=relsource(path)
  for rel in root:
   if rel.get('TargetMode')=='External':continue
   target=rel.get('Target');resolved=posixpath.normpath(posixpath.join(posixpath.dirname(source),target)) if not target.startswith('/') else target[1:]
   if resolved in rename:rel.set('Target','/'+rename[resolved])
  data[path]=ser(root)
types=ET.fromstring(data['[Content_Types].xml'])
for node in types:
 p=node.get('PartName','').lstrip('/')
 if p in rename:node.set('PartName','/'+rename[p])
ET.SubElement(types,q(CT,'Default'),{'Extension':'bin','ContentType':'application/octet-stream'})
data['[Content_Types].xml']=ser(types)
for old,new in rename.items():
 data[new]=data.pop(old)
 if relpart(old) in data:data[relpart(new)]=data.pop(relpart(old))
expected=[]
for index,part in enumerate(rename.values(),1):
 root=ET.fromstring(data[part]);rp=relpart(part);rels=ET.fromstring(data[rp]);by_text={''.join(s.itertext()):s for s in []}
 shapes=root.findall('.//'+q(P,'sp'))
 def shape(text):return next(s for s in shapes if ''.join(s.find(q(P,'txBody')).itertext())==text)
 def relation(target,rid):ET.SubElement(rels,q(PKG,'Relationship'),{'Id':rid,'Type':R+'/slide','Target':'/'+target})
 def click(s,rid,action='ppaction://hlinksldjump',run=False,hover=False):
  parent=s.find('.//'+q(A,'rPr')) if run else s.find('./'+q(P,'nvSpPr')+'/'+q(P,'cNvPr'))
  name=q(A,'hlinkHover' if hover else 'hlinkClick')
  e=ET.Element(name,{q(R,'id'):rid,'action':action,'tooltip':'Synthetic navigation','highlightClick':'1'})
  parent.insert(0,e)
  return e
 if index in [1,5]:
  relation(list(rename.values())[index],'rIdDemoOverview');relation(list(rename.values())[index+1],'rIdDemoPractice')
  click(shape('Open overview'),'rIdDemoOverview');click(shape('Open practice'),'rIdDemoPractice')
 else:
  relation(list(rename.values())[0],'rIdSharedMenu')
  click(shape('Return'),'rIdSharedMenu');click(shape('Home'),'rIdSharedMenu');click(shape('Return in text'),'rIdSharedMenu',run=True)
  click(shape('Next'),'','ppaction://hlinkshowjump?jump=nextslide')
  # Deliberately duplicated human names; numeric shape IDs remain unique.
  for text in ['Return','Home']:shape(text).find('./'+q(P,'nvSpPr')+'/'+q(P,'cNvPr')).set('name','Return')
  if index==6:click(shape('Return'),'rIdSharedMenu',hover=True)
 data[part]=ser(root);data[rp]=ser(rels)
# Opaque unused media fixture proves preservation of binary members, not rendering fidelity.
data['ppt/media/preservation-witness.bin']=bytes(range(256))*4
with ZipFile(ROOT/'tests/fixtures/workshop.pptx','w',ZIP_DEFLATED) as z:
 for name,body in data.items():
  info=ZipInfo(name,(2026,10,4,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,body)
# Literal expected selection by XML structure authored independently of the JS parser.
for index,kind,label in [(6,'shape','Return'),(7,'run','Return in text'),(8,'shape','Return')]:
 part=list(rename.values())[index-1];root=ET.fromstring(data[part])
 paths={id(root):[]}
 def visit(n,path):
  paths[id(n)]=path
  for i,c in enumerate(n):visit(c,path+[i])
 visit(root,[])
 selected_shape=next(s for s in root.findall('.//'+q(P,'sp')) if ''.join(s.find(q(P,'txBody')).itertext())==label)
 carrier=selected_shape.find(('.//'+q(A,'rPr') if kind=='run' else './'+q(P,'nvSpPr')+'/'+q(P,'cNvPr'))+'/'+q(A,'hlinkClick'))
 expected.append({'sourcePart':part,'carrierPath':paths[id(carrier)],'kind':kind,'fromSlideId':'256','toSlideId':'260','sourceSlideId':str(255+index)})
(ROOT/'tests/fixtures/expected-selection.json').write_text(json.dumps(expected,indent=2)+'\n')
(ROOT/'src/demo-data.mjs').write_text("// Original synthetic eight-slide interoperability fixture.\nexport const DEMO_BASE64="+json.dumps(base64.b64encode((ROOT/'tests/fixtures/workshop.pptx').read_bytes()).decode())+';\nexport const DEMO_SHA256='+json.dumps(hashlib.sha256((ROOT/'tests/fixtures/workshop.pptx').read_bytes()).hexdigest())+';\n')
print('Prepared eight-slide workshop fixture with shared click/hover relationships and literal selected paths')
