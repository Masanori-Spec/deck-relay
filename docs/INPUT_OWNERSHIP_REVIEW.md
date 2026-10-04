# Independent review: ZIP input ownership

Reviewed locally on 2026-10-04 UTC with Node v24.19.0. Scope: the owned-input snapshot repair in `src/zip.mjs`, its generated worker, and the new ownership regressions. No implementation or earlier review files were edited during this review.

## Result

No defect found within the checks below. The reader copies the accepted view's bytes into an ordinary Uint8Array before any asynchronous inflation. Header slices consequently have independent storage, and `openZip()` retains that same snapshot. Against the prior source archive, only `src/zip.mjs` and generated `src/worker-source.mjs` changed among existing runtime modules.

The old direct `fs.readFile()` Buffer failure was independently reproduced: `applyPlan()` raised `zip-limit` and changed **21 caller bytes**. The repaired implementation changed **zero caller bytes** and preserved the prior successful ordinary-Uint8Array output and receipt. The corrupted old-buffer hash differed from the earlier reproduction; that broken writer addressed backing storage without its view offset, so the corrupted result is storage-layout dependent.

## Checks run

- `node --test tests/input-ownership.test.mjs`: all 6 regressions passed
- `npm test`: all 47 tests passed, including the independent 64-case DOM/ZIP selection matrix and exact generated-worker/source comparison
- An independent temporary script exercised 17 full-API storage cases: direct file Buffer; Buffer offsets 1, 31 and 4093; Uint8Array offset 4093; Buffer and Uint8Array views backed by allocations larger than the 25 MiB input limit; ArrayBuffer; a Uint8Array subclass whose slice/species throw; resizable and shared backing views; immediate ArrayBuffer transfer or resize after starting inspection; and Buffer, offset Buffer and ArrayBuffer representations of an all-stored ZIP variant
- Every applicable case compared caller storage before/after export, output bytes and `JSON.stringify(receipt)` against the prior implementation's ordinary-Uint8Array result. Later caller mutation and no-op-result mutation were also checked. Immediate transfer/resize cases still exported the original snapshot
- 11 direct-directory negative cases produced the expected `input-type` or `input-size`: null, plain array, string, DataView, Uint16Array, plain object, bare SharedArrayBuffer, short Buffer, over-limit Buffer/ArrayBuffer and already-detached ArrayBuffer
- A separate 148-byte Python-generated stored ZIP was placed in a pooled Buffer at byte offset 8269 within a 65,536-byte backing allocation. Direct directory parsing, changed-entry writing/reopening, no-op writing and header mutation preserved every byte of that backing allocation. All copied headers and retained snapshot had zero byte offsets

The synthetic workshop output exactly matches the earlier browser-download PPTX. Its SHA-256 remains `52d928e1567d4bfafbca3672fa8d8c10b9ef1c05f0b95640f32bafdb94d75266`. The complete serialized receipt equals the prior result; SHA-256 of `JSON.stringify(receipt)` is `9dd0b77bd59edd7efa70306b5bb5085affbc3f5605179ecc22a66089b849e32a`. The parsed receipt also equals the retained browser receipt.

## Reviewed identity and limits

- Prior source archive SHA-256: `ff93185fe899ce834da70bccadb9715283b980144e5b64b340db01abcc45ea2b`
- `src/zip.mjs`: `b186c9b0647a2806461b045643cde9aa06d250bf6bfbfff6a81f6195d45d0cab`
- `src/worker-source.mjs`: `34392bdeb0f29373ca786dd68780125cab7615a075b5cd880a57d08fbae5164f`
- `tests/input-ownership.test.mjs`: `d1422c5e91f742a5b851be0cd43a0349b635d5d840a19a02579cee1d20e2a320`

This was a narrow local maintenance review, not a new complete audit. No browser, hosted CI, renderer, native PowerPoint, network or publication operations were performed. The standalone Python intended-selection oracle and 22-mutation script were not rerun by this reviewer. Shared-memory coverage used sequential writes; no atomic snapshot guarantee against simultaneous writes from another thread was tested. Existing hosted/browser/render evidence remains evidence for its recorded revision and bytes, not for this later source revision.
