# Phase 40: Matchup Heatmaps - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 40-Matchup Heatmaps
**Areas discussed:** Heatmap Cell Language, Visual Encoding, Row/Column Grouping, Comparison Controls

---

## Heatmap Cell Language

| Option | Description | Selected |
| --- | --- | --- |
| Outcome-first compact cell | Top line W-L-D, secondary points/evidence count, evidence badge. |  |
| Evidence-first compact cell | Top line evidence band/count, secondary W-L-D/points. |  |
| Balanced two-line cell | Top line W-L-D + points; bottom line band + evidence count + replay marker. | ✓ |

**User's choice:** Balanced two-line cell.
**Notes:** The cell should stay honest about evidence while still being useful for scanning performance.

| Decision | Result |
| --- | --- |
| Exceptional cells | System-failed and degraded/non-counted cells prioritize reliability state over ordinary outcome text. Thin evidence keeps outcome visible but must show band/count. Replay-unavailable is a marker, not a failed-cell state by itself. |

**User's choice:** Confirmed.

| Option | Description | Selected |
| --- | --- | --- |
| Compact mobile symbols/short labels | Desktop shows fuller two-line text; mobile uses compact face and tap details. | ✓ |
| Same text everywhere | Full two-line text on desktop and mobile. |  |
| Mobile switches to list view | Replace heatmap with grouped list on mobile. |  |

**User's choice:** Compact mobile symbols/short labels.
**Notes:** Requires legend and browser verification for non-overlap.

---

## Visual Encoding

| Option | Description | Selected |
| --- | --- | --- |
| Diverging outcome color | Color encodes favorable/unfavorable result direction. |  |
| Evidence-band color only | Color encodes confidence/reliability; outcome stays text-only. |  |
| Subtle outcome fill + evidence border/badge | Fill encodes outcome lightly; border/badge encodes evidence band/reliability. | ✓ |

**User's choice:** Subtle outcome fill plus evidence border/badge.
**Notes:** Color is never the only signal.

| Option | Description | Selected |
| --- | --- | --- |
| Details only | Side split appears only in cell details/drilldown. |  |
| Small side-bias marker | Show marker only when bias is meaningful; details reveal full split. | ✓ |
| Separate side-bias heatmap mode | Toggle heatmap into side-bias visualization. |  |

**User's choice:** Small side-bias marker.
**Notes:** No marker when profile lacks mirrored side coverage or evidence is too thin.

---

## Row/Column Grouping

| Option | Description | Selected |
| --- | --- | --- |
| Tier then archetype | Group opponents by Starter/Advanced/Custom, then archetype/tag. | ✓ |
| Pure deterministic order | Sort by ids/labels without grouping. |  |
| Archetype first | Group by archetype across tiers. |  |
| Persisted user-selected default | Let users choose and remember grouping. |  |

**User's choice:** Tier then archetype.
**Notes:** Supports identifying weak archetypes while keeping Starter vs Advanced clear.

| Option | Description | Selected |
| --- | --- | --- |
| Revision label first | Show readable label; expose hash/id in tooltip/details. | ✓ |
| Source hash/id first | Use deterministic ids/hashes as primary labels. |  |
| Strategy grouping with revision rows | Group rows by Strategy, then nested revision rows. |  |

**User's choice:** Revision label first.
**Notes:** User noted similar readability-with-safe-disambiguation decisions can be auto-locked going forward.

---

## Comparison Controls

| Option | Description | Selected |
| --- | --- | --- |
| Delta overlay mode | Cells show directional deltas after selecting baseline/current. |  |
| Side-by-side run selector | One selected run plus comparison summary panel. |  |
| Toggle between absolute and delta view | Default current run; toggle into compact delta mode. | ✓ |

**User's choice:** Toggle between absolute and delta view.
**Notes:** Incompatible comparisons show mismatch checklist and no delta.

| Option | Description | Selected |
| --- | --- | --- |
| Points delta + W-L-D swing marker | Cell face shows points change and compact W-L-D swing. | ✓ |
| Evidence-band delta first | Confidence change is primary. |  |
| Full mini-delta stack | Show all deltas in cell. |  |

**User's choice:** Points delta plus W-L-D swing marker.
**Notes:** Evidence/failure/replay deltas go in details.

## the agent's Discretion

- Auto-lock choices that clearly follow from prior deterministic evidence, privacy, compatibility, failure taxonomy, and readable-label-with-safe-id decisions.

## Deferred Ideas

None.
