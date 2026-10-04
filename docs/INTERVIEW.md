# Interview narrative / 面接での説明

## 30 seconds / 30 秒

PowerPoint のメニュー構成を変えるとき、特定の Return ボタンだけを新しいメニューへ移すツールです。同じ内部関係を Home やホバーも使っている場合、関係の行き先を一括置換すると巻き添えになります。DeckRelay は選択したクリック参照だけを新しい関係へ付け替え、未変更のパーツとメディアをハッシュで検証し、編集可能な PPTX と証跡を返します。

DeckRelay changes selected internal click targets in an existing PPTX. It treats a shared relationship as shared data, creates or reuses a new relationship, and patches only the selected carrier. Independent XML and python-pptx checks verify destinations and preservation, while the receipt ties the result to exact input/output bytes.

## Decisions worth discussing

1. Slide identity comes from the presentation relationship graph, not filenames, titles or screen order alone
2. Relationship reuse is safe only when the selected click's reference changes; mutating a shared target is not a selective edit
3. A narrow patch preserves existing markup instead of round-tripping the entire deck through a presentation writer
4. The UI shows every selected source, current destination and new destination before export; selection changes invalidate the preview
5. Separate Python and JavaScript implementations test the same behavior. The independent oracle also checks the intended selection, so a consistently wrong receipt cannot authorize itself
6. Refreshed-hash mutation tests demonstrate that semantic checks catch collateral edits instead of merely rejecting stale hashes
7. Reopening output, byte checks and rendering answer different questions. None proves native PowerPoint slideshow behavior
8. Input and XML resource limits are part of the supported contract, and unsupported selections fail visibly

## Demo

- Open the eight-slide workshop. Notice that the slide part names are shuffled and two slides share the title Practice
- Select the three demo edits in the second module, then preview the move to slide ID 260
- Show the shared relationship on slide ID 261: Return, Home, a text run and hover initially point to the old menu
- Export and inspect the receipt: only three selected carriers change, while 26 unselected click/hover carriers and 44 ZIP entries are preserved
- Show the independent Python oracle and the byte-identical before/after LibreOffice slide renders
- Explain the unrun browser stages and native-PowerPoint limitation honestly

Existing tools already do bulk hyperlink replacement. The portfolio story is controlled selective editing, exact evidence and a usable local workflow, not invention of hyperlink editing or proven customer demand.
