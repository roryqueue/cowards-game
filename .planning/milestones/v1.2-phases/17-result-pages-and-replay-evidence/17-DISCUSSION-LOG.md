# Phase 17: Result Pages and Replay Evidence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 17-Result Pages and Replay Evidence
**Areas discussed:** Result page layout, scoring breakdown depth, Match evidence presentation, provenance visibility, degraded/failed result language, owner-only affordances, result discovery/history

---

## Result Page Layout

| Option | Description | Selected |
| --- | --- | --- |
| Standings first, evidence below | Show status/standings/summary first; audit details below. | ✓ |
| Evidence ledger first | Strong for disputes but colder. | |
| Match timeline first | Better for running status than final results. | |
| You decide | Planner designs compact page. | |

**User's choice:** Standings first, evidence below.
**Notes:** Users should know who won, then audit why.

---

## Scoring Breakdown Depth

| Option | Description | Selected |
| --- | --- | --- |
| Expandable per-entrant breakdown | Default summary plus expanded head-to-head/tie-breaker details. | ✓ |
| Full table always visible | Transparent but dense. | |
| Summary only with Match links | Too weak for fair scoring evidence. | |
| You decide | Planner balances density and clarity. | |

**User's choice:** Expandable per-entrant breakdown.
**Notes:** Keeps page scannable and dispute-ready.

---

## Match Evidence Presentation

| Option | Description | Selected |
| --- | --- | --- |
| Match ledger table | Entrants, status, score contribution, markers, Chronicle hash, replay link. | ✓ |
| Replay-card grid | More visual but bulky. | |
| Only link from scoring details | Too minimal for provenance. | |
| You decide | Planner chooses from existing UI patterns. | |

**User's choice:** Match ledger table.
**Notes:** Ledger style suits public evidence.

---

## Provenance Visibility

| Option | Description | Selected |
| --- | --- | --- |
| Compact provenance panel plus copyable IDs | Key ids/versions/hashes visible without raw dump. | ✓ |
| Hidden in details only | Cleaner but less dispute-friendly. | |
| Full JSON provenance download/view | Useful but riskier/noisier. | |
| You decide | Planner chooses provenance depth. | |

**User's choice:** Compact provenance panel plus copyable IDs.
**Notes:** Enough to audit, not a dump.

---

## Degraded/Failed Result Language

| Option | Description | Selected |
| --- | --- | --- |
| Plain status banner plus per-Match reasons | Complete/degraded/failed banner and public reason categories. | ✓ |
| Hide failed details from public page | Safer-looking but undermines trust. | |
| Verbose diagnostics public | Useful for devs, but leak risk. | |
| You decide | Planner selects privacy-safe visibility. | |

**User's choice:** Plain status banner plus per-Match reasons.
**Notes:** Explain what happened without private internals.

---

## Owner-Only Affordances

| Option | Description | Selected |
| --- | --- | --- |
| Signed-in owner sees private links/actions | Public page stays public, owner gets server-gated private affordances. | ✓ |
| No owner affordances on result page | Safest, less convenient. | |
| Owner mode toggle on result page | Useful but blurs public/private more. | |
| You decide | Planner chooses smallest privacy-safe option. | |

**User's choice:** Signed-in owner sees private links/actions.
**Notes:** Every private endpoint must independently authorize.

---

## Result Page Discovery/History

| Option | Description | Selected |
| --- | --- | --- |
| Direct link only in v1.2 | User lands after create and can revisit by URL. | ✓ |
| Account exhibition history | Adds dashboard/history surface. | |
| Public recent MatchSets page | Starts spectator/history product. | |
| You decide | Planner chooses whether history belongs. | |

**User's choice:** Direct link only in v1.2.
**Notes:** Build result evidence first; history can come later.

## the agent's Discretion

- Exact layout/component split.
- Responsive table behavior.
- Copy button implementation.
- Placement of owner-only affordances.

## Deferred Ideas

- Account exhibition history.
- Public recent MatchSets.
- Full JSON provenance view.
- Live spectator UI.
