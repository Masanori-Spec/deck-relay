# Verification record

Version 0.1.0, 2026-10-04 UTC. Hosted evidence is pinned to implementation commit [`2ad560fe0c8cdbfdca6c203cd94cc115fca55793`](https://github.com/Masanori-Spec/deck-relay/tree/2ad560fe0c8cdbfdca6c203cd94cc115fca55793), [run 37180574361](https://github.com/Masanori-Spec/deck-relay/actions/runs/37180574361). All six jobs passed. Later documentation/package revisions require their own exact-head audit; running `npm run package` does not rerun hosted CI.

## Local model and independent checks

- Node syntax and **47 tests**: identity/order, shared relationship isolation, no-op byte identity, relationship reuse, unsupported/mixed selection rejection, stale plans, namespace aliases, nested shapes, exact UTF-8 BOM preservation and adversarial package parsing
- Deterministic standalone-worker/source consistency and execution in isolated JavaScript globals
- Independent Python ZIP/XML oracle with separately authored expected carrier paths and destination IDs: 8 slides, 3 intended edits, 26 unselected click/hover carriers, 44 untouched members, 3 appended relationships and an exact opaque media witness
- python-pptx 1.0.2 reads and checks 16 supported whole-shape actions on each package; it does not write production output
- 22 semantic/structural mutation rejections plus one byte-identical no-op positive; mutated package/part hashes are refreshed before checking
- Eleven independent reviewer tests, including 64 shared-reference batch combinations and actual UI-handler stale-result/error regressions
- Namespace-allocation regression completes safely under a 128 MiB Node heap; shared namespace frames and explicit attribute/binding/work caps apply
- Modified ZIP members preserve legacy comment encoding flags; replay plans use fatal UTF-8 decoding
- Two response-gate tests validate captured real-event delivery, termination tracking, generation isolation and restoration of the native Worker constructor
- Static build and no-network/no-persistent-storage source checks

## Subsequent input-ownership maintenance

The exported Node API accepted `Buffer` inputs without taking ownership. Its `slice()` calls retained shared header views, so a changed ZIP write could mutate the caller's input and fail output reinspection. This was reproduced with the synthetic fixture: 21 original bytes changed and `applyPlan` failed with `zip-limit`.

`directory()` now checks input type/size and takes one owned ordinary Uint8Array snapshot before any header slicing or asynchronous inflation. `openZip()` reuses that snapshot. Six new regressions cover Buffer, nonzero-offset Buffer/Uint8Array, ArrayBuffer, original prefix/suffix preservation, caller mutation after inspection, repeat export and independent no-op output storage. The original reproduction now changes zero caller bytes. The actual earlier browser output and receipt are still reproduced byte-for-byte, and their independent oracle still passes.

The 47-test local aggregate includes these six tests. The [independent maintenance review](INPUT_OWNERSHIP_REVIEW.md) passed all 47 tests, 17 additional storage cases, 11 rejection cases and a pooled-Buffer direct-directory write check. Hosted CI for this later repair is pending; no browser run is claimed for the maintenance revision. Earlier hosted artifacts below retain their original commit/run binding. [Full repair record](INPUT_OWNERSHIP.md)

## Hosted Chromium evidence

The four model jobs passed on Node 22/24 × UTC/Asia/Tokyo. Sandboxed Chromium on ubuntu-22.04 passed **all 12 browser scenarios**, with zero uncaught page errors:

1. Japanese/English UI, keyboard skip and eight-slide inventory
2. Exact three-carrier preview, shared references and stable identities
3. Actual PPTX/receipt/plan downloads, repeated export and independent oracle
4. Selection/target invalidation and hidden selections
5. Hash-bound plan replay and stale/unsupported/malformed UTF-8 rejection
6. Byte-identical no-op export
7. Reopen, repeated same-file import and malformed replacement retention
8. Cancel, oversized replacement and pending-reset flows, with explicitly delivered stale worker callbacks
9. Import/preview/export offline after initial page load
10. Escaped hostile imported text and no external requests
11. Keyboard selection, 1440/768/390/320 px layouts and printed preview
12. Unique DOM IDs, cleared reload state and no uncaught errors

The publication verifier inspected JA/EN desktop, Japanese mobile, 320 px English preview, and the **single-page printed change preview**. Actual downloaded PPTX and receipt passed the independent oracle. The actual downloaded plan reproduces both the exact output bytes and receipt. Repeat-export and no-op bytes were checked. `scripts/check-evidence.mjs` rechecks the 19 selected artifact hashes, source/output/render binding, replay and independent oracle locally; it is not another browser execution.

Selected actual artifacts:

- [Japanese desktop](evidence/browser/desktop-ja.png), [English preview](evidence/browser/desktop-en-preview.png), [Japanese mobile](evidence/browser/mobile-ja.png), [320 px preview](evidence/browser/responsive-320.png)
- [One-page change preview](evidence/browser/change-preview.pdf)
- [Editable remapped PPTX](evidence/browser/remapped.pptx), [receipt](evidence/browser/receipt.json), [replay plan](evidence/browser/plan.json), [browser results](evidence/browser/results.json)

## LibreOffice evidence

Hosted **LibreOffice 7.3.7.2 30(Build:2)** on ubuntu-22.04 opened the exact input/output PPTX files and produced eight PDF pages each. All eight corresponding 96-DPI PNG pairs are byte-identical. The publication verifier inspected every remapped slide and reported no clipping or overlap. [Remapped PDF](evidence/render/remapped.pdf) · [Render results](evidence/render/results.json) · [Eight slide PNGs and complete hashes](evidence/manifest.json)

- Input PPTX SHA-256: `5a4ae6ac2625de6882967b6c873734d19915132b1667df4dd62de441969bbcc7`
- Output PPTX SHA-256: `52d928e1567d4bfafbca3672fa8d8c10b9ef1c05f0b95640f32bafdb94d75266`

A separate local check used the supplied LibreOfficeDev 26.8.0.0.alpha0 build (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`), also with eight identical source/output PNG pairs. Cross-version PNG equality is not claimed.

Fixture preparation initially used prefixed package Relationships/Content_Types roots, which the local LibreOffice build would not open although independent parsers accepted them. Fixture authoring now emits conventional default namespaces. Production code does not normalize unrelated XML. The media witness is an unused opaque member; it establishes byte preservation, not real image/video rendering.

## Artifact provenance

The [evidence manifest](evidence/manifest.json) records the exact run/commit, selected file byte lengths/hashes, checks, inputs and limits. The publication verifier checked these downloaded archive SHA-256 digests before extraction:

- Browser: `7d364d962eceb44e5d404dce5cebc2a288e80996fbd0db39d4f529ed2ab9aea9`
- Render: `d49ef6d3587ed09be12870ee01800a8f8a01756c4a3cab8f9c2924a702305fb5`

The selected files were then independently hash-checked locally. Their bytes are original hosted artifacts, not recreated screenshots or mockups. Source ZIP/manifests enumerate the final documentation/evidence package; the publisher separately audits the final published head.

## Earlier failed run and correction

Initial [run 37180171221](https://github.com/Masanori-Spec/deck-relay/actions/runs/37180171221), commit `432f22ef49edb724f1ff4565cd9be9751724680d`, passed model/render jobs and the first seven browser scenarios. Scenario eight assumed a fixed 400 ms worker delay exceeded the transfer time for a 25 MiB oversized replacement. The previous valid import could legitimately complete first. Independent handler checks passed both orderings. The corrected test holds actual worker responses, then releases their callbacks after cancel/rejection/reset; production code was unchanged. The corrected run passed all twelve scenarios. Local browser restrictions were not bypassed.

## Unverified scope

- Native PowerPoint slideshow click/hover behavior
- Other browser engines/OSes, real mobile hardware and printers
- Formal accessibility or screen-reader conformance
- Permission-cleared real-world multi-editor decks and rejection/false-positive rates
- Usefulness interviews, adoption, demand and revenue

No full OOXML validation, malware-safety, universal visual-fidelity or novelty claim is made. Receipts are hash-bound evidence for the narrow transformation, not signatures or universal viewer guarantees. See the unchanged [independent review](INDEPENDENT_REVIEW.md) and dated [hosted verification addendum](REVIEW_ADDENDUM.md).
