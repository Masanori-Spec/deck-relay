# Verification record

Version 0.1.0, 2026-10-04 UTC. Source-review stage; no publication or browser execution has occurred.

## Passed locally

- Node 24.19.0 syntax and 39 Node tests, including identity/order, shared relationship isolation, no-op byte identity, relationship reuse, unsupported/mixed selection rejection, stale plans, namespace aliases, nested shapes, exact UTF-8 BOM preservation and adversarial package parsing
- Deterministic standalone-worker/source consistency and execution in isolated JavaScript globals
- Independent Python ZIP/XML oracle on the original and remapped synthetic fixture, with separately authored expected carrier paths and destination IDs
- 8 slides, 3 intended edits, 26 unselected click/hover carriers preserved, 44 untouched package members, 3 appended relationships, exact opaque media witness hash
- python-pptx 1.0.2 reads and checks 16 supported whole-shape actions on each package. It is not used to write the production result
- 22 semantic/structural mutation rejections plus one byte-identical no-op positive; mutated package and changed-part hashes are refreshed before checking
- Eleven independent reviewer tests, including 64 shared-reference batch combinations, XML/ZIP identity counterexamples and actual UI-handler stale-result/error regressions
- Isolated namespace-allocation regression completes safely with a 128 MiB Node heap cap; inherited namespace frames are shared and explicit attribute/binding/work limits apply
- Modified ZIP members preserve legacy comment encoding flags; replay plans use fatal UTF-8 decoding
- Static build and aggregate checks

## LibreOffice evidence

The supplied official runtime includes LibreOfficeDev 26.8.0.0.alpha0 (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`). It opened the input/output fixtures and produced eight PDF pages for each. All eight corresponding 96-DPI PNGs are byte-identical. Every remapped slide was visually inspected and found legible without clipping or overlap.

The fixture preparation initially used prefixed package Relationships/Content_Types roots, which this LibreOffice build would not open although the independent parsers accepted them. The fixture authoring step now emits conventional default namespaces for those roots. Production code does not normalize or rewrite unrelated XML. A writable temporary font cache was supplied for the renderer; no sandbox or browser restrictions were bypassed.

This is a specific LibreOffice parse/render check on an original synthetic deck, not a native PowerPoint slideshow or universal compatibility result. The binary media witness is an unused opaque member; real image/video rendering is not established by that witness.

## Authored but not run

Twelve Chromium browser scenarios: JA/EN UI and screenshots; keyboard skip/selection; exact preview and shared-reference visibility; actual PPTX/receipt/plan downloads with independent oracle; stale/unsupported replay plans; no-op; repeated reimport and malformed replacement retention; interrupted/oversized/reset flows; offline-after-load workflow; hostile imported text/no external requests; responsive widths and print; cleared reload state and no uncaught errors.

Hosted workflow: four Node 22/24 × UTC/Asia/Tokyo jobs, sandbox-enabled Chromium on ubuntu-22.04, and an official Ubuntu LibreOffice/Poppler render job. These hosted stages are unrun. Local browser launch is already known restricted, so it was not attempted or bypassed.

## Remaining gates

1. Frozen source/archive reconciliation after the completed independent review
2. Authorized exact-commit publication and hosted CI, followed by inspection of actual screenshots, downloads and render artifacts
3. Native PowerPoint slideshow tests, other engines/OSes, real mobile devices, real printers and formal accessibility/screen-reader audits
4. Permission-cleared real-world export corpus, rejection/false-positive measurement and usefulness interviews

No full OOXML validation, malware-safety, native PowerPoint, demand, revenue or novelty claim is made. Resource bounds and unsupported contexts are explicit.
