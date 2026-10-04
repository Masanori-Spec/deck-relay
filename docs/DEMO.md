# Original synthetic deck

The eight-slide editable base was authored with `@oai/artifact-tool`. It contains two menus, a first module and a second module; two slides intentionally share the title Practice. Its straightforward native text boxes are the click-carrier test surface, not a supplied customer presentation.

`scripts/prepare-demo.py` adds controlled hyperlink fixtures and intentionally shuffled part names to the committed base. It also creates the independent literal intended-selection list and the bundled browser sample. The selected edits are:

- Slide ID 261, whole-shape Return
- Slide ID 262, explicit text run Return in text
- Slide ID 263, whole-shape Return

All three start at slide ID 256 (Workshop menu) and move to slide ID 260 (Module B menu). On slide 261, Return, Home, the text run and hover initially share `rIdSharedMenu`; only the selected click changes. Next actions remain relative and unsupported. Duplicate human shape names are intentional; numeric IDs and paths disambiguate them.

An unused opaque binary part under `ppt/media/` is a preservation witness. Its hash verifies byte preservation, not real-media playback or rendering.

The original base is preserved at `tests/fixtures/demo-base.pptx`; the input fixture is `tests/fixtures/workshop.pptx`. Neither came from a customer, third-party presentation or university source. No license has been selected for this project.
