# Research and bounded product decision

Research checked 2026-10-04. No customer contact, paid service, university access or patent-candidate publication was involved.

## Existing products and workflows

- [Microsoft PowerPoint](https://support.microsoft.com/en-us/powerpoint/training/add-a-hyperlink-to-a-slide) supports linking individual objects to specific slides and testing the links
- [PowerPointPipe](https://datamystic.com/powerpointpipe) already performs bulk hyperlink replacement and logs changes; batch link editing is not new
- [PPTools macro](https://www.rdpslides.com/pptfaq/FAQ00773_Batch_Search_and_Replace_for_Hyperlinks-_OLE_links-_movie_links_and_sound_links.htm) already edits hyperlink Address/SubAddress values globally
- [PPTX Link Editor](https://github.com/angbadillo/pptx-link-editor) focuses on external relationships and linked chart data
- [ImageToolHub splitter](https://www.imagetoolhub.com/powerpoint/tools/split) already produces browser-local editable excerpts and handles links to removed slides

DeckRelay deliberately keeps the full deck and provides an exact, author-reviewed selection of click carriers. Its proposed distinction is selecting only certain Return buttons while leaving Home/hover actions alone, even when they share one package relationship, then exporting independently checkable evidence of the narrow patch. This is a workflow hypothesis. No world-first, demand, market-size, adoption or patent claim is made.

## Primary technical sources

- [Microsoft Open XML: PresentationML document structure](https://learn.microsoft.com/en-us/office/open-xml/presentation/structure-of-a-presentationml-document): slide list and package relationships define slide identity/order
- [Microsoft HyperlinkOnClick](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.drawing.hyperlinkonclick?view=openxml-3.0.1): the DrawingML click element and its schema-qualified name
- [python-pptx maintainer analysis: shape hyperlinks](https://python-pptx.readthedocs.io/en/latest/dev/analysis/shp-hyperlink.html): click and hover are independent; named slide jumps use the hlinksldjump action and an internal slide relationship; auxiliary attributes/children may exist
- [python-pptx action API](https://python-pptx.readthedocs.io/en/latest/api/action.html): a second reading API for supported whole-shape named-slide targets

These sources support the narrow file-format operation. They do not guarantee that a particular exported file behaves identically in all versions of native PowerPoint. LibreOffice rendering and XML validation provide distinct, limited evidence.

## Next useful validation

After independent source review and hosted browser testing, use a permission-cleared multi-editor corpus with nested groups, complex text, real media and larger decks. Measure rejected-package rates and ask authors whether selection/preview/receipt saves time. External contact and user-file sharing require separate authorization.
