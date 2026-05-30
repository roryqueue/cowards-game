# Phase 192: v1.25 App Contract Baseline and Result/Replay UX Inventory - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-30
**Phase:** 192-v1.25 App Contract Baseline and Result/Replay UX Inventory
**Areas discussed:** Inventory Shape, Coupling Standard, UX Evidence Bar, Carry-Forward Defaults

---

## Inventory Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One combined baseline artifact | A single `v1.27-result-replay-ux-inventory.md` ties frozen contract surfaces, result UX, replay UX, fixtures, privacy, and coupling risks together. | ✓ |
| Separate focused inventories | Split contract, result, replay, and fixture/privacy into separate docs for sharper ownership, at the cost of more navigation. | |
| Hybrid index plus appendices | One short index doc with separate appendix docs if the inventory gets large. | |

**User's choice:** One combined baseline artifact.
**Notes:** The agent recommended this because planners need one canonical map before later implementation phases split the work.

---

## Coupling Standard

| Option | Description | Selected |
|--------|-------------|----------|
| Strict boundary taxonomy | Every touched surface is classified as frozen app contract, public service projection, owner/test-only, execution-internal, persistence-internal, or intentionally unstable. Any UI dependency outside frozen/public DTOs becomes a finding. | ✓ |
| Practical risk-only taxonomy | Classify only dependencies that are likely to affect v1.27 implementation. | |
| Lightweight notes only | Record obvious coupling risks, but avoid a formal taxonomy. | |

**User's choice:** Strict boundary taxonomy.
**Notes:** The agent recommended this because v1.27 is explicitly about building in front of `match-execution-app-v1` without execution-internal coupling.

---

## UX Evidence Bar

| Option | Description | Selected |
|--------|-------------|----------|
| Heuristic audit plus screenshots of current pages | Inventory current result/replay layouts, state copy, fixture URLs, desktop/mobile risks, and capture current screenshots only where easy. Detailed redesign/proof happens later. | |
| Full visual audit now | Run a deeper UI review before implementation, including desktop/mobile screenshots and scoring. | ✓ |
| Text inventory only | Identify UX gaps from code and planning docs without browser proof yet. | |

**User's choice:** Full visual audit now.
**Notes:** This is intentionally stronger than the agent's initial recommendation. Phase 192 should capture current desktop/mobile screenshots or browser evidence, score current workbench gaps, and hand later phases a sharper visual baseline.

---

## Carry-Forward Defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Carry all three forward | Use one canonical artifact per phase when practical, classify boundaries strictly, and include visual/browser evidence wherever the phase touches user-facing result/replay UI. | ✓ |
| Carry only boundary strictness | Keep the strict taxonomy across the milestone, but decide artifact shape and browser evidence phase by phase. | |
| Decide phase by phase | Treat Phase 192 choices as local only. | |

**User's choice:** Carry all three forward.
**Notes:** Closure and audit phases may summarize instead of creating large new inventory documents.

---

## the agent's Discretion

- The agent may choose exact inventory headings, screenshot filenames, and visual scoring rubric.

## Deferred Ideas

None.
