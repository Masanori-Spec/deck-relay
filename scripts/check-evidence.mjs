// Check the archived, exact-commit evidence; this does not run hosted CI.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {inspectPackage,applyPlan} from '../src/core.mjs';
const base='docs/evidence/',json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=await json(base+'manifest.json'),seen=new Set();
assert.equal(manifest.commit,'2ad560fe0c8cdbfdca6c203cd94cc115fca55793');
assert.equal(manifest.runId,'37180574361');
for(const file of manifest.files){
  assert.match(file.path,/^(browser|render)\/[a-z0-9.-]+$/);
  assert.ok(!seen.has(file.path),'Duplicate evidence path');seen.add(file.path);
  const bytes=await readFile(base+file.path);assert.equal(bytes.length,file.bytes);assert.equal(hash(bytes),file.sha256);
}
assert.equal(seen.size,19);
const browser=await json(base+'browser/results.json'),render=await json(base+'render/results.json');
assert.equal(browser.status,'passed');assert.equal(browser.chromiumSandbox,true);assert.equal(browser.checks.length,12);assert.deepEqual(browser.uncaughtErrors,[]);
assert.equal(render.status,'passed');assert.equal(render.sameRenderedPixelsAllEightSlides,true);
assert.deepEqual(render.outputs.source.pagePngSha256,render.outputs.remapped.pagePngSha256);
assert.equal(render.outputs.source.pages,8);assert.equal(render.outputs.remapped.pages,8);
for(let i=1;i<=8;i++)assert.equal(hash(await readFile(base+`render/remapped-${i}.png`)),render.outputs.remapped.pagePngSha256[i-1]);
assert.equal(hash(await readFile(base+'render/remapped.pdf')),render.outputs.remapped.pdfSha256);
const input=new Uint8Array(await readFile('tests/fixtures/workshop.pptx')),output=new Uint8Array(await readFile(base+'browser/remapped.pptx'));
assert.equal(hash(input),render.outputs.source.inputPptxSha256);assert.equal(hash(output),render.outputs.remapped.inputPptxSha256);
const plan=await json(base+'browser/plan.json'),receipt=await json(base+'browser/receipt.json');
const replay=await applyPlan(await inspectPackage(input,'workshop.pptx'),plan);
assert.deepEqual(replay.output,output);assert.deepEqual(replay.receipt,receipt);
execFileSync('python3',['tests/oracle.py','tests/fixtures/workshop.pptx',base+'browser/remapped.pptx',base+'browser/receipt.json','--expected-selection','tests/fixtures/expected-selection.json'],{stdio:'inherit'});
console.log('Pinned hosted evidence: 19 exact file hashes, render binding, actual plan replay and independent output oracle passed');
