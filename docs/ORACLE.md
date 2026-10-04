# Independent package verification

`tests/oracle.py` is a read-only Python verifier. It imports no DeckRelay production JavaScript, generated app model, or browser parser. Python's `zipfile` and `xml.etree.ElementTree` independently read both packages. The `python-pptx` action API provides a second check of supported whole-shape named-slide targets.

## Run

The verification dependency is `python-pptx==1.0.2`. With that dependency available:

```sh
python3 tests/oracle.py INPUT.pptx OUTPUT.pptx RECEIPT.json
```

For the supplied fixture, also establish intended selection independently:

```sh
python3 tests/oracle.py tests/fixtures/workshop.pptx OUTPUT.pptx RECEIPT.json \
  --expected-selection tests/fixtures/expected-selection.json
```

The optional file contains a JSON array of literal objects with `sourcePart`, `sourceSlideId`, `carrierPath`, `kind`, `fromSlideId` and `toSlideId`. Comparison is order-independent, duplicates fail, and no production scanner generates the expectations. The result explicitly reports `intendedSelectionVerified`; it is false when this optional file is omitted.

Success prints a JSON result and exits 0. Any discrepancy, unsupported condition, missing dependency or read failure prints an error JSON and exits 1. The script does not extract files, save either presentation, fetch links, run macros or write a report file. Redirect stdout if a saved result is needed.

## Receipt v1

```json
{
  "schema": "deck-relay-receipt-v1",
  "inputSha256": "lowercase hex SHA-256 of the entire input PPTX",
  "outputSha256": "lowercase hex SHA-256 of the entire output PPTX",
  "changes": [
    {
      "sourcePart": "ppt/slides/slide6.xml",
      "sourceSlideId": "261",
      "carrierPath": [0, 0, 2, 0, 0, 0],
      "kind": "shape",
      "oldRid": "rId2",
      "newRid": "rId5",
      "fromSlideId": "256",
      "toSlideId": "260",
      "fromPart": "ppt/slides/slide1.xml",
      "toPart": "ppt/slides/slide5.xml"
    }
  ],
  "changedParts": [
    {
      "part": "ppt/slides/slide6.xml",
      "beforeSha256": "SHA-256 of the uncompressed original entry",
      "afterSha256": "SHA-256 of the uncompressed output entry"
    }
  ]
}
```

This illustrates the field layout, not a runnable fixture. Every actually changed entry, including a changed relationship part, needs its own `changedParts` record. Additional metadata fields are permitted. Duplicate JSON keys, duplicate selected carriers and duplicate changed-part records fail verification.

- `sourceSlideId`, `fromSlideId` and `toSlideId` are string-valued `p:sldId/@id` values from the presentation, not one-based positions, filenames or titles
- Part names have no initial slash
- `carrierPath` follows zero-based **element-child** indexes from the source slide's `p:sld` root to the selected `a:hlinkClick`. Text, comments and processing instructions do not consume an index. The verifier nevertheless preserves their contents
- `kind` is `shape` for `p:cNvPr/a:hlinkClick` belonging to a shape, or `run` for `a:r/a:rPr/a:hlinkClick`
- Only actual destination changes appear in `changes`; same-target selections are omitted
- The UI identity `${sourcePart}#${carrierPath.join('.')}` is convenient, but the oracle resolves the structured fields itself

## What the oracle establishes

1. Input and output file hashes match the receipt. ZIP entry names are unique and safe, compression is supported, CRC checks pass, sizes stay within bounds, and neither package has the supported profile's macro/signature markers
2. The package's root office-document relationship identifies the main presentation. Its `p:sldIdLst` and corresponding slide relationships establish the same ordered `(slide ID, slide part)` pairs before and after. Slide filenames and duplicate titles never decide identity
3. Every selected path resolves in both versions to exactly one supported click. Its action is exactly `ppaction://hlinksldjump`, and its relationship resolves to an internal slide present in that ordered presentation
4. Each selected old/new relationship ID and source/destination ID/part agrees with the receipt. The new destination differs from the old one
5. Every selected slide has identical XML structure, expanded names, namespace scope, attributes, text, tails, comments and processing instructions, except for the listed click `r:id` attributes. XML declaration and attribute ordering are not compared as byte identity in changed XML
6. All old relationships retain their content and order. New relationships are append-only, internal slide relationships, and each is used by a selected carrier. A selected carrier may reuse an existing relationship to its new target. The existing relationship's target cannot be mutated, even if multiple buttons share it
7. All other ZIP members retain identical **uncompressed bytes**, including media, notes, layouts, masters, metadata and presentation order. ZIP headers, compression output and timestamps are not promised byte-identical. Media hashes are included in the result
8. `changedParts` is the exact set of changed entries, with independently calculated before/after hashes
9. `python-pptx` independently resolves slide order and all exposed whole-shape named-slide targets in both packages, including nested group children. Missing/ambiguous shapes or API disagreement fail rather than becoming skipped passes. Text-run links remain covered by the independent XML/relationship checks, not by an unsupported `python-pptx` run-action API

Click and hover are separate XML elements. The complete XML check protects every unselected click and every hover link, even when they share a relationship ID with a selected click. Relative jumps, custom shows and other actions are preserved but cannot be selected under this profile. Masters/layouts and their links are outside the editing surface and remain unchanged entries.

## Independent expectations are still necessary

A receipt proves what an output changed, but it cannot prove the user intended those selections. A fixture test must separately supply hand-authored expected source slide IDs, carrier paths, old targets and new targets. Never generate those expectations by calling DeckRelay's own scanner or copying its produced receipt. A wrong selection and a matching wrong receipt must fail that fixture test even though their internal consistency may pass this oracle.

Use a stable authored presentation containing eight slides, two menus, repeated Return buttons and duplicate visible labels. At least one source slide should contain two buttons sharing an original relationship ID, and a hover link should share it too. Retarget only one selected button to the second menu. Include a separate text-run link, a grouped shape, an unchanged Home link and a relative Next action.

Required positive cases:

- Mixed whole-shape/text-run selection with independently written destination expectations
- One selected button from a shared relationship, with other button and hover unchanged
- Reuse of an existing relationship to the selected new destination
- Group-child carrier, duplicate labels and presentation order differing from filename order
- No-op: empty changes and changedParts, with identical complete output bytes for a wholly no-op plan

Required negative mutations, applied to copies of a known-good output and with receipt hashes refreshed so checksum detection cannot hide semantic defects:

- Change an unselected click, hover, slide label/text, media member or slide order
- Retarget the shared original relationship instead of isolating the selected carrier
- Delete, alter or reorder an original relationship; add an unrelated unused relationship
- Alter the selected action, tooltip, sound child or another attribute besides `r:id`
- Change receipt path, source ID, old/new relationship ID, destination ID/part or changedParts membership
- Omit/duplicate a changed entry, selected carrier or JSON key
- Supply a malformed/missing target, duplicate ZIP entry, unsafe entry name, DTD/entity declaration or unsupported package profile

The `python-pptx` 1.0.2 `Presentation.slides` property renames slide part names **in memory** when accessed. Its second-reader comparison therefore uses stable slide IDs/order and `target_slide.slide_id`, while the independent XML reader verifies original package part names. This does not modify either file.

No `python-pptx` round-trip save is involved: such a save could change unrelated package parts and would undermine the preservation check. Fixture creation and output generation are separate from the independent verifier.

## Limits

This is a deliberately conservative verifier for the app's bounded transitional OOXML profile: at most 25 MiB compressed, 100 MiB expanded, 10,000 entries, 300 slides, 3,000 changed carriers and bounded XML depth. It is not complete ECMA-376 schema validation, a malware scanner, a document sanitizer or a rendering-equivalence proof. Existing unsupported or malformed whole-shape named links can make the verifier reject an otherwise limited edit. It does not certify inherited master links, custom-show behavior, Zoom or relative navigation semantics.

Passing means the checked package structure and target/preservation contract agree. It does not mean Microsoft PowerPoint was run. Native PowerPoint slideshow behavior must be reported separately; a LibreOffice render is useful additional evidence but does not substitute for that check.

## Primary references

- [Microsoft Open XML: HyperlinkOnClick](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.drawing.hyperlinkonclick?view=openxml-3.0.1) documents `a:hlinkClick`, parent carriers, `r:id`, action/tooltip attributes and optional sound/extension children
- [python-pptx hyperlink analysis](https://python-pptx.readthedocs.io/en/latest/dev/analysis/shp-hyperlink.html) distinguishes click/hover and named-slide relationships from relative and other actions
- [python-pptx action API](https://python-pptx.readthedocs.io/en/latest/api/action.html) documents supported `ActionSetting.target_slide` behavior and its limits
- [Python zipfile](https://docs.python.org/3/library/zipfile.html) and [ElementTree](https://docs.python.org/3/library/xml.etree.elementtree.html) document the independent readers

## Verification performed on the supplied fixture

The authored eight-slide fixture passed with three independently specified changes, 26 preserved unselected clicks/hover links, 44 byte-identical unaffected entries, one unchanged binary media witness, three added relationships and 16 whole-shape target checks per input/output package. A wholly no-op positive case also passed.

A separate temporary mutation harness exercised 22 negative cases against copies. It refreshed file and entry hashes so semantic defects could not fail solely because a stale checksum exposed them. All were rejected: unselected click/hover edits; selected tooltip/action/sound edits; changing the original shared target; an unused added relationship; slide-text/media modifications; ZIP entry addition/removal/traversal; DTD; missing destination; a wrong destination paired with a matching wrong receipt; wrong path/source/relationship IDs; omitted/duplicate selections; and omitted/duplicate changed-part records. These are recorded execution results, not a claim that the temporary harness is part of this verifier's three-argument CLI. Native PowerPoint was not run.
