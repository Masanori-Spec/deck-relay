# DeckRelay independent engineering review

Review date: 2026-10-04

## Recommendation

Proceed to authorized publication and sandboxed hosted CI after verifying the final source/archive hashes and refreshed render binding. No blocking issue remains in the tested scope after the corrections below. Native PowerPoint slideshow behavior and all 12 authored browser scenarios remain unverified.

The final local aggregate passed **39 tests, with no failures or skips**, plus the existing independent Python package checks and adversarial mutation suite. This review adds **11 tests**, including an independently implemented Python DOM/ZIP oracle over **64 selective batches**. These checks support the narrow remapping/preservation contract; they do not certify every OOXML package, presentation viewer or user workflow.

## What was independently checked

The review covered package/slide/carrier identity, shared relationships, permitted XML changes, plan/receipt binding, resource limits and actual UI event handlers. No shared browser or publication action was used.

The 64-case oracle varies three explicit click carriers on the same source slide across four choices each: unselected, original destination, and two distinct new destinations. The original click/hover carriers share one relationship. Independently resolved element-child paths, rather than production carrier discovery, identify the selected shape and text-run clicks.

Python `zipfile` and `xml.dom.minidom` inspect every resulting package. They verify:

- The exact package member set and order remain unchanged
- The source slide DOM changes only at selected `r:id` attributes; text, hover, unselected clicks and other attributes/children remain equal
- Original relationship elements retain their order/content; only necessary new destination relationships are appended, without duplicate IDs
- Each selected click resolves to its intended stable slide ID, irrespective of slide filenames or duplicate titles
- Unselected and no-op-only batches retain the appropriate original targets; wholly no-op output is byte-identical
- All unaffected members retain their bytes
- Receipt changes/counts, source/destination parts and IDs, old/new relationship IDs, input/output/plan hashes, changed-part hashes and slide order agree with the independently inspected packages

Additional tests exercise source/plan nonmutation, stale-plan rejection, malformed XML comparison with Python ElementTree, ZIP filename/comment encoding, a namespace-heavy isolated-heap case, malformed UTF-8 plan import, hidden selections and stale asynchronous callbacks.

The UI tests invoke the actual application handlers through `tests/reviewer-dom.mjs`. The double has no rendering, browser task queue or accessibility tree. It establishes state-handler behavior only.

## Corrected findings

### New previews retained old downloads

After exporting plan A, importing a different valid plan B updated the preview/selection/target but retained A's exported PPTX, receipt and plan. The UI could therefore show one proposed change above another batch's download buttons. New preview/plan-import requests now invalidate prepared/exported state. The regression checks that old downloads disappear before the new read/preview completes and stay absent until a new export succeeds.

### Old asynchronous failures could replace current state

A stale worker error could stop a newer worker because its error callback lacked a captured ownership/generation check. Terminal worker callbacks are now sealed to their originating worker/request. Separately, a rejected old plan-file read could overwrite the cleared status after reset; its catch now checks the request token. Tests cover stale errors, duplicate completion, superseding requests and delayed rejection after reset.

### Plan imports silently replaced malformed UTF-8

`File.text()` decoded malformed bytes with replacement characters. A malformed plan containing byte `0xFF` could be accepted after that silent conversion. Plan import now uses a bounded `arrayBuffer()` read, a post-read byte check and fatal UTF-8 decoding. The real-File regression rejects malformed bytes before creating a preview worker.

### The XML reader accepted malformed syntax and namespace bindings

The reader accepted NBSP as markup/outside-document whitespace, a declaration after a comment and an invalid binding of the reserved `xml` prefix. Python ElementTree rejected the same strings. The corrected reader uses XML whitespace, permits a declaration only at the start after an optional BOM, validates QName components and namespace bindings, and applies XML attribute-whitespace/text-line-ending normalization. Invalid comments and inherited-object namespace ambiguities were also closed. These are well-formedness safeguards, not full OOXML schema validation.

### Namespace copying amplified small XML input

The old namespace pass copied every inherited binding onto every child. A 78,787-byte document with 3,000 root bindings and 3,000 children exhausted an isolated 128 MiB Node heap instead of returning a bounded error. The implementation now shares unchanged immutable contexts and creates frames only for local changes. Explicit attribute, in-scope binding, namespace-URI and expanded-name-work limits apply before expanded structures grow. The regression now completes with a normal bounded rejection under that heap cap.

### Unflagged non-ASCII ZIP names had ambiguous identities

The ZIP reader always assumed UTF-8. With the UTF-8 flag cleared, bytes displayed as `media/é.bin` by DeckRelay were read as `media/├⌐.bin` by Python's legacy ZIP decoder. The narrow input profile now rejects non-ASCII filenames without the UTF-8 flag, while retaining legacy ASCII and flagged UTF-8 names.

### Changed members reinterpreted legacy comments

The writer forced the UTF-8 flag on changed entries but retained their original comment bytes. An ASCII filename with a CP437 comment byte `0x82` consequently acquired an invalid UTF-8 comment interpretation. Changed entries now preserve their original encoding flag, and flagged UTF-8 comments are validated. The independent Python regression confirms both the comment bytes and their encoding flag remain unchanged.

## Verification record

Independently executed:

```sh
npm run build
npm run check
```

Results:

- 39 Node tests passed, including the 11 reviewer tests and 64-case batch oracle
- Syntax and no-network/no-persistent-storage source checks passed
- Deterministic standalone worker consistency/execution passed
- Existing Python ZIP/XML intended-selection oracle passed: 8 slides, 3 intended changes, 26 unselected click/hover actions, 44 untouched members and one binary media witness
- Existing python-pptx action checks passed for 16 supported whole-shape actions on each package
- Existing mutation suite rejected 22 altered packages/receipts after hash refresh; its byte-identical no-op positive passed
- Static build passed

The builder reran LibreOffice after the final ZIP encoding-flag repair. This review independently verified the recorded source/output PPTX hashes, all 16 PNG hashes and byte equality of all eight source/output PNG pairs. The final source hash is `5a4ae6ac2625de6882967b6c873734d19915132b1667df4dd62de441969bbcc7`; the rendered output hash is `52d928e1567d4bfafbca3672fa8d8c10b9ef1c05f0b95640f32bafdb94d75266`. Renderer execution and individual visual inspection belong to the builder's separate verification record; this review does not claim a PowerPoint or browser visual pass.

## Sources and interpretation limits

The named-slide action and its relationship-based destination are described in [Microsoft's hlinkClick implementation notes](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/7ff3db24-b7b9-4ffe-aa78-3ec47cab2489). Slide-list and package-part structure are documented in [Microsoft's PresentationML overview](https://learn.microsoft.com/en-us/office/open-xml/presentation/structure-of-a-presentationml-document). The lexical checks were compared with [W3C XML 1.0](https://www.w3.org/TR/xml/) and the filename/comment issue with [PKWARE APPNOTE Appendix D](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT).

Only eligible explicit named-slide clicks are changed. Hover, relative actions, external links, unsupported carriers and master/layout actions remain outside editing scope. The app is not a broad malware scanner or an OOXML schema validator. A receipt is reproducible evidence for one exact input/plan/output, not a signature or independent guarantee of slideshow behavior.

Remaining release gates:

1. Verify the exact source/archive manifests, emitted worker and refreshed renderer input/output hashes; after authorized publication, verify the remote commit
2. Run the hosted Node/Python matrix and all 12 sandboxed browser scenarios on that exact revision
3. Inspect browser desktop/mobile/print artifacts and actual downloads, including the corrected plan replacement and cancellation/error flows
4. Open the output in native PowerPoint and exercise selected/unselected click and hover actions in slideshow mode
5. Expand to permission-cleared real decks from multiple editors, including unusual relationships, groups, rich text and larger packages

No native PowerPoint, other browser engine, real mobile-device, assistive-technology, customer-deck corpus or real-printer claim is made by this review.
