# Phase 41: Evidence Explorer UX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 41-Evidence Explorer UX
**Areas discussed:** Explorer Navigation Shape, Sort and Filter Priority, Drilldown Depth, Empty and Failure States

---

## Explorer Navigation Shape

| Option | Description | Selected |
| --- | --- | --- |
| Dedicated route plus Workshop entry points | Own route/page with reloadable URL state; Workshop links into selected drilldowns. | ✓ |
| Embedded Workshop panel only | Explorer lives inside Workshop. |  |
| Modal/drawer from heatmap cells | Heatmap opens explorer detail in drawer/modal. |  |

**User's choice:** Dedicated route plus Workshop entry points.
**Notes:** Supports drilldowns, browser verification, and future replay deep links.

| Option | Description | Selected |
| --- | --- | --- |
| Master-detail layout | Filterable matchup list plus detail pane. | ✓ |
| Step-by-step breadcrumb drilldown | Separate Strategy -> opponent -> MatchSet -> Match states. |  |
| Table-first layout | Dense table with expandable rows. |  |

**User's choice:** Master-detail layout.
**Notes:** Mobile adapts to stacked panes.

---

## Sort and Filter Priority

| Option | Description | Selected |
| --- | --- | --- |
| Evidence band, opponent tier/archetype, and sort | First-class controls; advanced tray for other filters. | ✓ |
| All filters visible | Every filter on the surface. |  |
| Search/sort first, filters in drawer | Hide all filters in drawer. |  |

**User's choice:** Evidence band, tier/archetype, and sort as first-class controls.
**Notes:** Advanced filters still summarize active chips.

| Option | Description | Selected |
| --- | --- | --- |
| Weakness-finding default | Unfavorable outcomes first, then evidence strength/count, then stable order. | ✓ |
| Evidence-confidence default | Strong evidence first, then unfavorable outcomes. |  |
| Stable neutral default | Tier/archetype/label until user chooses sort. |  |

**User's choice:** Weakness-finding default.
**Notes:** Reliability remains visible so weak/unreliable evidence is not overread.

---

## Drilldown Depth

| Option | Description | Selected |
| --- | --- | --- |
| Evidence summary plus Match list | Show MatchSet summary and safe Match list before replay handoff. | ✓ |
| Full MatchSet page embedded | Recreate most MatchSet page details inside explorer. |  |
| MatchSet link only | Minimal summary and link out. |  |

**User's choice:** Evidence summary plus Match list.
**Notes:** Existing MatchSet page remains linked for full provenance.

| Option | Description | Selected |
| --- | --- | --- |
| Sticky compact Strategy summary | Keep selected Strategy/profile-run context visible. | ✓ |
| Header only | Context only at top. |  |
| No persistent Strategy context | Assume user remembers context. |  |

**User's choice:** Sticky compact Strategy summary.
**Notes:** Mobile can collapse it to a sticky summary bar.

---

## Empty and Failure States

| Option | Description | Selected |
| --- | --- | --- |
| Action-oriented neutral copy | “No counted replay-backed evidence…” plus actions. | ✓ |
| Blank/empty table | Minimal empty state. |  |
| Diagnostic-style explanation | Detailed reason list for missing evidence. |  |

**User's choice:** Action-oriented neutral copy.
**Notes:** Differentiate filter-empty and data-empty states.

| Option | Description | Selected |
| --- | --- | --- |
| Reliability-first row treatment | Prominent reliability label before outcome metrics. | ✓ |
| Outcome-first with warning icon | W-L-D/points first with warning. |  |
| Hide unreliable rows by default | Filter out unreliable rows unless enabled. |  |

**User's choice:** Reliability-first row treatment.
**Notes:** System failure remains platform evidence.

## the agent's Discretion

- Auto-lock choices clearly implied by prior deterministic evidence, privacy, compatibility, failure taxonomy, readability, and phase-boundary decisions.

## Deferred Ideas

None.
