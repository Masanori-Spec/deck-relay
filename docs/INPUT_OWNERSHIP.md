# ZIP input ownership repair

2026-10-04 UTC. Local maintenance revision following the published DeckRelay implementation. The narrow [independent review](INPUT_OWNERSHIP_REVIEW.md) passed; exact-head hosted verification for this repair is pending.

## Confirmed impact

The exported JavaScript API also runs on Node. Passing the `Buffer` returned by `fs.readFile()` directly to `inspectPackage()` retained that Buffer inside the ZIP context. Unlike ordinary Uint8Array `slice()`, Buffer `slice()` creates a shared view. Central-directory/header copies therefore still referenced caller storage, and the writer's DataViews could address the underlying buffer from its beginning.

A real synthetic fixture reproduction changed **21 caller input bytes** and `applyPlan()` failed output reinspection with `zip-limit`. The input SHA-256 changed from `5a4ae6ac2625de6882967b6c873734d19915132b1667df4dd62de441969bbcc7` to `490844331d615de9dcbf3731146ee1da98d8611e3031138715ecd5ff1cd1b3a8`. This was an in-memory caller-buffer mutation; the API did not write the source file to disk. The browser import path supplied an ordinary Uint8Array and did not exhibit this Buffer-specific header aliasing.

Even ordinary typed-array/ArrayBuffer inputs previously remained caller-owned during asynchronous inspection. The repair also isolates that retained snapshot from later caller mutation.

## Narrow correction

- `src/zip.mjs`: public `directory()` validates input type/size, then makes one owned ordinary Uint8Array copy before parsing. ArrayBuffer input is explicitly copied rather than merely viewed
- `openZip()` reuses that owned snapshot for inflation and the retained context
- The generated standalone worker was rebuilt from the same modules
- No change to carrier discovery, selection, relationship rewiring or XML edits

The original Buffer reproduction now succeeds with **zero changed caller bytes**. Accepted ZIP input representations are Uint8Array (including Node Buffer) and ArrayBuffer. The existing 25 MiB input bound is checked before the ownership copy.

## Regression evidence

Six tests in `tests/input-ownership.test.mjs` cover:

1. Node Buffer input
2. Nonzero-offset Buffer subarray with untouched prefix/suffix
3. Nonzero-offset Uint8Array subarray with untouched prefix/suffix
4. ArrayBuffer input with an independently retained snapshot
5. Public `directory()` header/result ownership and no-op output ownership
6. Caller mutation immediately after starting inspection, before the first asynchronous inflation completes

For each full API representation, the intended three edits reopen correctly and reproduce the exact earlier browser PPTX and receipt. Caller memory remains unchanged. Mutating the no-op result does not affect caller memory or the retained context. Mutating caller memory after inspection does not alter repeated hash-bound export.

The full local aggregate passes **47 Node tests**, the independent ZIP/XML and python-pptx intended-selection checks, the 64-case reviewer matrix, 22 adversarial mutation rejections plus no-op, and the pinned actual-download evidence checks. The output PPTX remains `52d928e1567d4bfafbca3672fa8d8c10b9ef1c05f0b95640f32bafdb94d75266`. Existing render artifacts are still bound to those identical PPTX bytes; no new renderer/browser execution is claimed for this repair.

The independent maintenance reviewer reproduced the original failure and passed 17 additional storage cases, 11 input rejection cases and a pooled-Buffer direct-directory writing check. Its report distinguishes those local checks from the separate full aggregate and prior hosted evidence.

Original independent-review files and hosted artifacts are preserved unchanged. The bundled hosted evidence remains pinned to commit `2ad560fe0c8cdbfdca6c203cd94cc115fca55793` / run `37180574361`; it does not certify this later source revision. Native PowerPoint and the other limits in [VERIFICATION.md](VERIFICATION.md) remain unverified.
