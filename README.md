# DeckRelay

必要なクリックだけ、新しいメニューへ。  
Selective local remapping of internal PowerPoint click actions.

DeckRelay lets a presentation author select exact buttons or text runs, preview their new named-slide destination, and export an editable PPTX with a hash-bound plan and receipt. It keeps the existing slide set and order. Files remain on the device and external links are never visited.

## What it changes

Only an explicit DrawingML `a:hlinkClick` with action `ppaction://hlinksldjump`, an internal slide relationship, and a supported slide-local shape/run location is editable.

The engine resolves presentation order and stable slide IDs through package relationships. It does not infer identity from `slideN.xml`, titles or shape names. When two buttons share a relationship, the selected button receives a new or reused relationship ID. The old relationship target is never globally overwritten.

Unselected click/hover elements remain unchanged. Original relationships retain their content and order; needed slide relationships are appended. Every other ZIP member keeps exactly the same uncompressed bytes, and unchanged local ZIP records are copied verbatim. No-op plans produce the original complete PPTX bytes.

## 使い方 / Workflow

1. Open one unsigned, macro-free, unencrypted `.pptx`, or try the eight-slide synthetic demo
2. Filter by source slide, current destination, text or shape name
3. Select the exact editable actions, including selections outside the current filter if intended
4. Choose the new slide and review the complete selected set
5. Verify/export, then save the PPTX, verification receipt and replay plan
6. Perform the final slideshow check in native PowerPoint

デモの「3 件を選択」は、後半の Return 2 件とテキスト区間 1 件だけを、新しいメニューに移します。同じ関係を使う Home、未選択のテキスト区間、ホバー動作は元の行き先に残ります。計画の読み込みは入力 SHA-256 と一致する場合だけ受け付けます。画面では 1 回につき 1 つの新しい行き先を扱います。

The three demo edits are two whole-shape clicks and one text-run click in the second module. Home and other unselected actions keep their old destinations. A replay plan is accepted only for its exact input SHA-256. The interface applies one new destination per batch; the pure API also accepts multiple explicit destinations in one validated plan.

## Verification status

Passed locally on 2026-10-04:

- 41 Node tests, syntax checks and deterministic standalone-worker consistency/execution
- Independent Python ZIP/XML oracle with separately authored intended selections: 8 slides, 3 selected changes, 26 unselected click/hover actions preserved, 44 untouched package entries and one exact binary media witness
- A second oracle using python-pptx 1.0.2 checks 16 supported whole-shape actions on each package
- 22 adversarial mutation rejections after refreshing their hashes, plus a byte-identical no-op positive
- Independent reviewer checks include 64 shared-reference batch combinations and actual UI-handler regressions for stale plans, downloads and worker callbacks
- LibreOffice opened and rendered source/output. All eight corresponding rendered PNGs are byte-identical, and each remapped slide was visually inspected

Initial hosted run [37180171221](https://github.com/Masanori-Spec/deck-relay/actions/runs/37180171221) at `432f22ef49edb724f1ff4565cd9be9751724680d`: all four model jobs and LibreOffice rendering passed. Seven of twelve browser scenarios passed, including actual download/oracle checks; the interruption scenario exposed a wall-clock timing assumption in its test harness. It now holds real worker responses behind an explicit release gate. The corrected browser suite awaits a new exact-head run. Local browser execution is restricted; no bypass was attempted.

Native PowerPoint, other browser engines, real mobile devices, real printers, formal accessibility/screen-reader conformance, real customer decks and a multi-editor corpus are unverified. The local renderer is the supplied LibreOfficeDev 26.8.0.0.alpha0 build; its result is a limited interoperability check, not PowerPoint slideshow certification.

Independent review is complete: [review report](docs/INDEPENDENT_REVIEW.md). See [verification record](docs/VERIFICATION.md), [independent oracle](docs/ORACLE.md), and [scope / research](docs/RESEARCH.md). Initial source publication has occurred; corrected-head browser verification is pending. No project license has been selected.

## Run

Runtime application: no dependencies, backend, external fonts/assets, analytics, account or API key. Verification requires Node 22+ and Python 3.12 with python-pptx 1.0.2.

```sh
npm run build
npm run check
npm run serve
# http://127.0.0.1:4177
```

`build` regenerates the static worker bundle and creates `dist/`. After editing a worker module, rebuild before running aggregate checks. The committed demo is an original artifact-tool-authored editable deck, then prepared with controlled hyperlink fixtures. `scripts/prepare-demo.py` deterministically rebuilds those fixtures from the committed base.

Browser validation, only where sandboxed Chromium is permitted:

```sh
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm run serve
npm run test:browser
```

LibreOffice validation, using an installed official distribution plus Poppler:

```sh
node scripts/fixture-output.mjs
npm run test:render
```

The CI workflow uses read-only repository permissions and sandboxed Chromium on `ubuntu-22.04`. The render job installs LibreOffice Impress, Poppler and fonts from the Ubuntu package repository. No billing, access-grant or repository-settings change is configured. Review runner support before retirement.

## Scope and deliberate exclusions

Supported whole-shape locations are slide-local shapes, pictures and connectors, including shapes nested in ordinary groups. Supported text carriers are explicit `a:rPr/a:hlinkClick` entries on an `a:r` text run inside a supported slide shape or graphic frame. Group-wide actions, default text properties, fields, alternate/extension contexts and Zoom are not silently approximated.

Hover, relative First/Next/Previous/Last actions, custom shows, external/general hyperlinks, programs, macro actions and OLE actions are listed outside editing scope and preserved. Master/layout links are counted but never edited. Selecting an unsupported carrier through a plan is an error, not a skipped row. The app does not remove other existing actions from the deck or certify that opening an arbitrary deck is safe.

No slide splitting/reordering, layout editing, automatic broken-link repair, new-deck design, thumbnail rendering, full OOXML schema validation or native slideshow behavior claim. Strict OOXML namespaces and unsupported package variants are rejected. Titles and text excerpts are capped at 512 characters; exact part/path/slide IDs disambiguate them.

## Security and preservation limits

- Input and output ZIP: 25 MiB; total declared expanded bytes: 100 MiB; one entry: 30 MiB
- XML: 4 MiB and 100,000 nodes per inspected part, 16 MiB and 200,000 nodes across inspected XML, depth 80
- Per element: 128 attributes; 128 in-scope namespace bindings; namespace URIs up to 512 characters; expanded-name work 4 MiB per part / 16 MiB overall
- Replay plan JSON: 1 MiB with fatal UTF-8 decoding; malformed bytes are rejected
- 2,500 ZIP entries, 300 slides, 3,000 click/hover carriers, 5,000 relationships
- Inflation ratio cap 200 with a 1 KiB minimum allowance; streaming actual-output caps and CRC/size checks
- No encrypted, signed, macro-enabled, ZIP64, multi-disk or symlink packages
- Duplicate/case-aliased, non-NFC, unsafe paths, overlap/gaps, ambiguous Unicode ZIP path extras and malformed relationship identities fail closed
- UTF-8 XML only; DTDs and custom entities are rejected, while predefined/numeric character references are supported
- XML S whitespace, declaration position, QNames and reserved namespace bindings are checked
- Non-ASCII ZIP names require the UTF-8 flag; unflagged ASCII remains supported
- Unknown external targets are never fetched or activated
- Unsupported data and unrelated assets are preserved as bytes, not interpreted
- Worker termination cancels work; request generations prevent old results from replacing newer input
- Every preview/export reparses the exact source bytes and checks the plan fingerprint
- Imported UI strings are escaped. No automatic storage, network transmission or content in URLs

The app rejects some otherwise legitimate complex packages in order to keep this contract narrow. A successful check is not a complete OOXML validity verdict or a broad malware scan.

## Evidence contracts

`deck-relay-plan-v1`: exact input SHA-256 and explicit `{carrierId, toSlideId}` edits. The carrier ID is its package part plus zero-based element-child path.

`deck-relay-receipt-v1`: input/output/plan hashes, actual old/new relationship and slide identities, changed part hashes, untouched-part count, original slide order and unchanged media hashes. Same-destination selections are counted separately and omitted from actual changes.

The independent Python verifier checks the full changed XML modulo only selected relationship-ID attributes and necessary relationship additions. It rejects changes to unselected hover, source text, auxiliary hyperlink attributes/children, shared original targets, media, part sets and incomplete receipts. [Oracle details](docs/ORACLE.md)

## Why this exists

Bulk hyperlink replacement already exists. The proposed difference is explicit carrier selection, shared-reference isolation and preservation evidence in a browser-local workflow. This is a usefulness hypothesis, not proven demand or a novelty claim. [Competitive research](docs/RESEARCH.md) · [Interview narrative](docs/INTERVIEW.md)
