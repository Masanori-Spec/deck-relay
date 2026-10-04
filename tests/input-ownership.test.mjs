import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inspectPackage,makePlan,applyPlan} from '../src/core.mjs';
import {directory,writeZip,sha256} from '../src/zip.mjs';
const fixture=new Uint8Array(await readFile(new URL('./fixtures/workshop.pptx',import.meta.url)));
const expected=JSON.parse(await readFile(new URL('./fixtures/expected-selection.json',import.meta.url),'utf8'));
const golden=new Uint8Array(await readFile(new URL('../docs/evidence/browser/remapped.pptx',import.meta.url)));
const goldenReceipt=JSON.parse(await readFile(new URL('../docs/evidence/browser/receipt.json',import.meta.url),'utf8'));
const inputs=[
  ['Node Buffer',()=>{const backing=Buffer.from(fixture);return {input:backing,backing};}],
  ['nonzero-offset Buffer subarray',()=>{const backing=Buffer.alloc(fixture.length+83,0xa5);backing.set(fixture,37);return {input:backing.subarray(37,37+fixture.length),backing};}],
  ['nonzero-offset Uint8Array subarray',()=>{const backing=new Uint8Array(fixture.length+83).fill(0xa5);backing.set(fixture,37);return {input:backing.subarray(37,37+fixture.length),backing};}],
  ['ArrayBuffer',()=>{const backing=fixture.slice();return {input:backing.buffer,backing};}]
];
for(const [label,create] of inputs)test(`${label} remapping owns its snapshot and never changes caller or no-op bytes`,async()=>{
  const {input,backing}=create(),before=Uint8Array.from(backing),ctx=await inspectPackage(input,'workshop.pptx');
  assert.equal(ctx.zip.bytes.constructor,Uint8Array);assert.ok(ctx.zip.bytes.buffer!==backing.buffer,'retained input owns its backing store');
  assert.equal(ctx.model.input.sha256,await sha256(fixture));
  const plan=makePlan(ctx,expected.map(x=>({carrierId:x.sourcePart+'#'+x.carrierPath.join('.'),toSlideId:x.toSlideId})));
  const out=await applyPlan(ctx,plan);
  assert.deepEqual(Uint8Array.from(backing),before,'all caller bytes, including prefix/suffix, stay unchanged');
  assert.deepEqual(out.output,golden);assert.deepEqual(out.receipt,goldenReceipt);
  const reopened=await inspectPackage(out.output);
  for(const edit of plan.edits)assert.equal(reopened.model.carriers.find(c=>c.id===edit.carrierId).currentSlideId,edit.toSlideId);
  const noop=await applyPlan(ctx,makePlan(ctx,[]));assert.deepEqual(noop.output,fixture);
  noop.output.fill(0);assert.deepEqual(Uint8Array.from(backing),before);assert.deepEqual(ctx.zip.bytes,fixture);
  // A later caller mutation must not change the retained context or hash-bound export.
  backing.fill(0);assert.deepEqual(ctx.zip.bytes,fixture);
  const repeated=await applyPlan(ctx,plan);assert.deepEqual(repeated.output,golden);assert.deepEqual(repeated.receipt,goldenReceipt);
});
test('public directory snapshots Buffer and offset views before caller or result mutation',()=>{
  for(const [,create]of inputs){
    const {input,backing}=create(),before=Uint8Array.from(backing),zip=directory(input),record=[...zip.entries.values()][0];
    assert.equal(zip.bytes.constructor,Uint8Array);assert.deepEqual(zip.bytes,fixture);
    record.central.fill(0);record.local.fill(0);zip.endRecord.fill(0);
    assert.deepEqual(Uint8Array.from(backing),before);assert.deepEqual(zip.bytes,fixture);
    const noop=writeZip(zip,new Map());assert.deepEqual(noop,fixture);noop.fill(0);
    assert.deepEqual(zip.bytes,fixture);assert.deepEqual(Uint8Array.from(backing),before);
    backing.fill(0);assert.deepEqual(zip.bytes,fixture);
  }
});
test('the input snapshot is fixed before the first asynchronous inflation',async()=>{
  for(const [,create]of inputs){
    const {input,backing}=create(),pending=inspectPackage(input,'workshop.pptx');
    backing.fill(0);const ctx=await pending;
    assert.deepEqual(ctx.zip.bytes,fixture);assert.equal(ctx.model.input.sha256,await sha256(fixture));
    const plan=makePlan(ctx,expected.map(x=>({carrierId:x.sourcePart+'#'+x.carrierPath.join('.'),toSlideId:x.toSlideId})));
    const result=await applyPlan(ctx,plan);assert.deepEqual(result.output,golden);assert.deepEqual(result.receipt,goldenReceipt);
  }
});
