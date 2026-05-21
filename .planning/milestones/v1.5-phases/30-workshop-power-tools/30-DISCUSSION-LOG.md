# Phase 30: Workshop Power Tools - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 30-Workshop Power Tools
**Areas discussed:** Gauntlet Matrix Shape, Revision Comparison Flow, Diagnostics and Replay Handoff, Performance Summary Vocabulary

---

## Gauntlet Matrix Shape

| Question | Option | Selected |
| --- | --- | --- |
| Default launch experience | Guided smoke first | ✓ |
| Default launch experience | Matrix-first power mode | |
| Default launch experience | Two-mode split | |
| Default launch experience | Profile templates first | |
| Guided Smoke opponent set | Curated v1.4 benchmark subset | ✓ |
| Guided Smoke opponent set | All 10 v1.4 Starters | |
| Guided Smoke opponent set | Weak-to-strong ramp | |
| Guided Smoke opponent set | Player-picked subset | |
| Matrix size limits | Hard preset caps with preview | ✓ |
| Matrix size limits | Soft warning then allow | |
| Matrix size limits | Queue budget meter | |
| Matrix size limits | Only fixed profiles at first | |
| Matrix orientation | Rows are candidate revisions, columns are opponents | ✓ |
| Matrix orientation | Rows are opponents, columns are candidate revisions | |
| Matrix orientation | Toggle orientation | |
| Matrix orientation | No grid initially; summary list only | |

**User's choice:** Guided Smoke first, curated v1.4 benchmark subset, hard preset caps with match-count preview, rows as candidate revisions and columns as opponents.
**Notes:** The guided path should make the first gauntlet credible without overwhelming the author.

---

## Revision Comparison Flow

| Question | Option | Selected |
| --- | --- | --- |
| Comparison location | Dedicated Compare tab in Workshop | ✓ |
| Comparison location | Inline from revision history | |
| Comparison location | Result-first compare from gauntlet runs | |
| Comparison location | Separate route | |
| Default comparison pair | Current selected revision vs previous revision | ✓ |
| Default comparison pair | User chooses both revisions manually | |
| Default comparison pair | Latest valid revision vs best gauntlet performer | |
| Default comparison pair | Starter/Advanced seed vs user fork | |
| Result delta comparability | Exact profile match only | ✓ |
| Result delta comparability | Warn but allow approximate deltas | |
| Result delta comparability | Axis-normalized deltas | |
| Result delta comparability | No result deltas in Phase 30 | |
| Source diff visibility | Owner-only source diff, public never | ✓ |
| Source diff visibility | Owner-only for user revisions, public for system seeds | |
| Source diff visibility | Diff only after explicit Load source consent | |
| Source diff visibility | No source diff in Phase 30 | |

**User's choice:** Dedicated Compare tab, current selected revision vs previous revision by default, exact matching gauntlet profile hash for result deltas, and owner-only/local Workshop source diff.
**Notes:** Public pages should never expose Strategy source through comparison.

---

## Diagnostics and Replay Handoff

| Question | Option | Selected |
| --- | --- | --- |
| Diagnostics priority | Grouped failure categories first | ✓ |
| Diagnostics priority | Editor-native markers first | |
| Diagnostics priority | Replay-first diagnostics | |
| Diagnostics priority | Full diagnostic console | |
| Default context depth | Public-safe tactical context | ✓ |
| Default context depth | Minimal context by default | |
| Default context depth | Owner-expanded context | |
| Default context depth | Replay handles the details | |
| Owner-debug replay links | Only when server-authorized and next to public replay | ✓ |
| Owner-debug replay links | Inside a detail drawer only | |
| Owner-debug replay links | Owner-debug as primary in Workshop | |
| Owner-debug replay links | Public replay only in Phase 30 | |
| Replay deep links | Nice-to-have, not required | ✓ |
| Replay deep links | Required for diagnostics | |
| Replay deep links | Only for first failure / interesting event | |
| Replay deep links | Defer entirely | |

**User's choice:** Grouped failure categories first, public-safe tactical context by default, server-authorized owner-debug links next to public replay, and replay deep links as optional.
**Notes:** The privacy/usefulness tradeoff should favor structured public-safe context plus server-side authorization.

---

## Performance Summary Vocabulary

| Question | Option | Selected |
| --- | --- | --- |
| Top-level summary emphasis | Gauntlet record and reliability | ✓ |
| Top-level summary emphasis | Opponent matchup texture | |
| Top-level summary emphasis | Survival behavior | |
| Top-level summary emphasis | Balanced scorecard | |
| Summary term | Gauntlet results | ✓ |
| Summary term | Performance summary | |
| Summary term | Benchmark report | |
| Summary term | Test results | |
| System failure treatment | Separate reliability bucket, never Strategy performance | ✓ |
| System failure treatment | Exclude from headline, show in details | |
| System failure treatment | Show warning and block summary | |
| System failure treatment | Count everything plainly | |
| Avoiding durable rating language | Profile-scoped language everywhere | ✓ |
| Avoiding durable rating language | One disclaimer near the summary | |
| Avoiding durable rating language | Use demo labels only for generated examples | |
| Avoiding durable rating language | No special copy needed | |

**User's choice:** Emphasize gauntlet record and reliability, call them Gauntlet results, put system failures in a separate reliability bucket, and use profile-scoped language everywhere.
**Notes:** Avoid durable rating, ladder, Elo, or permanent ranking implications.

---

## the agent's Discretion

- Exact component boundaries, migration shape, internal DTO names, and polling mechanics.
- Whether replay deep links are cheap enough to include as a nice-to-have.

## Deferred Ideas

None.
