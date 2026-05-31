# v1.27 UI Review

**Reviewer:** GSD UI auditor plus browser pass
**Status:** Pass after fixes

## Findings Fixed

- Replay timeline/controls were below the first desktop viewport. Controls now sit immediately below the board and are visible in the initial workbench viewport.
- Complete fixture copy could imply missing evidence. Empty standings now explain that the fixture omits standings while Match ledger evidence remains available.
- Mobile ledgers depended on horizontal scrolling. Tables stack into readable rows below 760px.
- Primary result cards exposed raw enum/key copy. Primary state labels are now humanized; raw keys remain only in lower evidence/provenance-style rows where useful.
- Replay privacy copy dominated the header. Header now uses a concise `Public-safe projection` cue.
- Replay visual proof was too shallow. Board proof anchors now assert Soldier and terrain positions are in bounds.

## Visual Judgment

The result/replay experience now reads as a serious operational workbench: dense, inspectable, and public-safe, without hero/marketing framing. The fixture catalog is intentionally utilitarian and remains gated as test support.
