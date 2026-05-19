# Phase 15: MatchSet Competition Model - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 15-MatchSet Competition Model
**Areas discussed:** Competition presets, entrant model, Match composition, scoring points, tie-breakers, stale revision behavior, publication timing, public entrant labels

---

## Competition Presets

| Option | Description | Selected |
| --- | --- | --- |
| Smoke Exhibition + Standard Exhibition | Smoke for validation, Standard for public alpha. | ✓ |
| Smoke + Standard + Stress | Broader coverage but slower/noisier. | |
| Standard only | Simpler but weaker diagnostics. | |
| You decide | Planner chooses from existing presets. | |

**User's choice:** Smoke Exhibition + Standard Exhibition.
**Notes:** Smoke is diagnostic; Standard is public default.

---

## Entrant Model

| Option | Description | Selected |
| --- | --- | --- |
| Revision snapshots as entrants | Lock exact immutable Strategy Revision evidence. | ✓ |
| Strategy as entrant, latest revision resolved at start | Easier UX but latest/stale ambiguity. | |
| Player slot as entrant | Flexible but too abstract for v1.2. | |
| You decide | Planner chooses smallest immutable model. | |

**User's choice:** Revision snapshots as entrants.
**Notes:** Results must answer exactly which immutable revision competed.

---

## Match Composition

| Option | Description | Selected |
| --- | --- | --- |
| All pairwise, mirrored sides | Every distinct pair plays the preset matrix; mirror when preset says so. | ✓ |
| Round-robin with capped pair count | Adds selection/capping policy. | |
| Seeded head-to-head only | Simple but weaker for small competition/self-play. | |
| You decide | Planner chooses from current matrix patterns. | |

**User's choice:** All pairwise, mirrored sides.
**Notes:** Entrant cap handled in Phase 16/18.

---

## Scoring Points

| Option | Description | Selected |
| --- | --- | --- |
| Win/loss/draw points plus penalties | Win=3, draw=1, loss=0, explicit strategy failure penalty. | ✓ |
| Current ranking fields only | Minimal change but less transparent. | |
| Survival-weighted score | More nuanced but harder to explain. | |
| You decide | Planner defines policy from current scoring. | |

**User's choice:** Win/loss/draw points plus penalties.
**Notes:** Survival metrics support tie-breaks.

---

## Tie-Breakers

| Option | Description | Selected |
| --- | --- | --- |
| Wins, head-to-head, surviving Soldiers, survival turns, revision hash | Outcome first, then direct comparison and evidence. | ✓ |
| Points, surviving Soldiers, survival turns, revision id/hash | Simpler, weaker direct comparison. | |
| Points, fewest failures, survival metrics, hash | Reliability emphasized but may duplicate penalties. | |
| You decide | Planner chooses deterministic tie-breakers. | |

**User's choice:** Outcome/head-to-head/survival/hash order.
**Notes:** No timestamps, DB order, or worker scheduling.

---

## Stale Revision Behavior

| Option | Description | Selected |
| --- | --- | --- |
| Snapshot stays valid after lock | Locked snapshot competes despite newer revision/archive. | ✓ |
| Withdrawal/archive blocks until start | More user control, more state complexity. | |
| Latest revision replaces until execution starts | Convenient but weakens immutability. | |
| You decide | Planner chooses immutability-preserving policy. | |

**User's choice:** Snapshot stays valid after lock.
**Notes:** Incompatible entries rejected before lock.

---

## Publication Timing

| Option | Description | Selected |
| --- | --- | --- |
| Public after MatchSet completes or degrades | Publish finished/degraded/evidence-backed results. | ✓ |
| Public immediately with live statuses | Adds live/partial-result complexity. | |
| Private until manually published | Adds admin/manual publication policy. | |
| You decide | Planner picks smallest public-result model. | |

**User's choice:** Public after completion/degradation/evidence-backed failure.
**Notes:** No live partial competition surface in v1.2.

---

## Public Entrant Labels

| Option | Description | Selected |
| --- | --- | --- |
| Handle + revision label + short hash | Readable and evidence-friendly. | ✓ |
| Handle + revision id only | Precise but raw. | |
| Display name + handle + revision label | Friendly but weaker evidence without hash. | |
| You decide | Planner balances readability and provenance. | |

**User's choice:** Handle + revision label + short hash.
**Notes:** Example: `@rory / "Cautious fork" / a1b2c3d4e5`.

## the agent's Discretion

- Exact preset ids and scoring policy version names.
- Exact strategy failure penalty value if not finalized until Phase 18.
- Storage schema for entrant snapshots.

## Deferred Ideas

- Ranked ladders and ratings.
- Public live competition pages.
- Latest-revision entry semantics.
