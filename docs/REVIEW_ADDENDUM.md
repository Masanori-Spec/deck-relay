# Hosted verification addendum

2026-10-04 UTC. This builder/publication evidence addendum supplements the original independent engineering review; it does not rewrite that review or expand its author's claimed work.

## Preserved independent review

`docs/INDEPENDENT_REVIEW.md` remains byte-for-byte unchanged (SHA-256 `92bfd386c56076bd4660a42c6c6cc0846be6273d879efbdf606039abe1f6ab74`). Its 39-test total and pending browser gates describe the earlier source-review stage. The two later test-only worker-gate checks bring the current aggregate to 41. The original eleven reviewer tests and DOM double remain unchanged.

## Evidence closing the hosted gates

[Run 37180574361](https://github.com/Masanori-Spec/deck-relay/actions/runs/37180574361) at implementation commit `2ad560fe0c8cdbfdca6c203cd94cc115fca55793` passed all six jobs: four model jobs, sandbox-enabled Chromium and LibreOffice render.

- All 12 browser scenarios passed with no uncaught page errors
- The publication verifier inspected desktop/mobile/narrow-screen views and the one-page print preview
- Actual downloaded PPTX, receipt and replay plan passed exact replay and the independent intended-selection oracle
- Repeat export and no-op bytes matched their expected packages
- All eight source/output LibreOffice PNG pairs matched; every output slide was inspected
- Local evidence checks independently reverified the selected hashes, exact rendered PPTX input binding, downloaded plan/output/receipt equality and Python package oracle

The first hosted run's interrupted-import assertion used a 400 ms timer that could expire during a large Playwright file transfer. Independent read-only review confirmed both valid handler orderings and found no application fix indicated. The corrected test gates real worker responses and explicitly invokes their captured callbacks after cancel, oversized rejection and reset. The independent reviewer also inspected that gate without finding a browser-platform blocker. Production application code was unchanged by this correction.

## Limits and final-head distinction

All bundled hosted artifacts remain pinned to `2ad560fe…`. The subsequent documentation/evidence package does not claim to be that commit, and `npm run package` does not rerun hosted CI. The publisher separately audits the final remote file set and final documentation-head CI.

Native PowerPoint slideshow behavior, other browsers/OSes, real mobile hardware/printers, assistive technology, a real-world multi-editor corpus and user demand remain unverified. Static LibreOffice renders do not exercise slideshow actions. The [verification record](VERIFICATION.md) and [evidence manifest](evidence/manifest.json) contain exact sources, hashes and remaining scope.
