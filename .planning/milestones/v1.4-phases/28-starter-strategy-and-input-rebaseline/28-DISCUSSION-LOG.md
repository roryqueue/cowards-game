# Phase 28: Starter Strategy and Input Rebaseline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 28-Starter Strategy and Input Rebaseline
**Areas discussed:** Starter Versioning and Lineage, Doctrine Retuning Bar, Strategy API Guidance, Demo Entrant Revalidation, Starter Test Gauntlet

---

## Starter Versioning and Lineage

| Option | Description | Selected |
|--------|-------------|----------|
| Same IDs, new starter version | Keep stable starter IDs, bump `version` to `v1.4`, update source hashes/lineage, and make old v1 revisions stale/historical. | ✓ |
| New IDs per v1.4 starter | Create IDs like `starter:v14:centerline-bully`, leaving old IDs untouched. | |
| Overwrite v1 in place | Keep IDs and `version: "v1"`, updating source only. | |

**User's choice:** Same IDs, new starter version.
**Notes:** Public/private metadata should distinguish v1 from v1.4 lineage. Old v1 forks are stale for counted/demo v1.4 play. Because there is no real usage yet, old starter-fork source may be aggressively auto-upgraded/replaced with v1.4 starter equivalents.

---

## Doctrine Retuning Bar

| Option | Description | Selected |
|--------|-------------|----------|
| Tactical pass for all 10 | Update all 10 starters so each behaves credibly under interleaving, blocked-move-as-cycle-cost, and Cycle-boundary Backstab. | ✓ |
| Minimum terminology pass | Only update comments/metadata and obvious broken assumptions. | |
| Replace weak doctrines freely | Retune or replace any weak starter, even if it changes the doctrine set significantly. | ✓ |

**User's choice:** Tactical pass for all 10 and replace weak doctrines freely.
**Notes:** Emphasize adaptive tactical awareness. Keep about 10 starters with a hard minimum of 8. Use concise concept comments. Do not enforce fixed win-rate targets.

---

## Strategy API Guidance

| Option | Description | Selected |
|--------|-------------|----------|
| Interleaved observation model | Teach that SoldierBrain may observe board changes caused by other selected Soldiers between its own Cycles and should re-check state. | ✓ |
| Backstab boundaries | Lead with Cycle-start/Cycle-end Backstab safety. | |
| Blocked movement as cost | Lead with blocked MOVE/PUSH consuming a Cycle but not ending the selected slot. | |

**User's choice:** Interleaved observation model.
**Notes:** Update all template/sample code, update or remove stale failure-mode samples, describe blocked MOVE/PUSH as tactical cost rather than death, and explain memory as adaptation support that does not replace current-state checks.

---

## Demo Entrant Revalidation

| Option | Description | Selected |
|--------|-------------|----------|
| Regenerate from v1.4 starters | Regenerate all preconfigured/demo entrants from v1.4 starter sources and mark old v1.3 entrants stale/historical. | ✓ |
| Revalidate old entrants in place | Keep old demo entrant source if it validates under v1.4. | |
| Defer to Phase 29 | Only mark them stale in Phase 28; regenerate during demo rebuild. | |

**User's choice:** Regenerate from v1.4 starters.
**Notes:** Phase 28 prepares reusable generation path/metadata, while Phase 29 runs the demo rebuild. Delete old v1.3 demo entrants once v1.4 generation is ready. Generated demo revisions include `cowards-rules-v1.4`, starter version, source hash, and generation provenance.

---

## Starter Test Gauntlet

| Option | Description | Selected |
|--------|-------------|----------|
| Validation + smoke + behavior signal | Each starter validates, runs in at least one smoke Match, and has at least one observable behavior signal tied to doctrine or v1.4 adaptation. | ✓ |
| Validation + smoke only | Each starter validates and runs, but behavior signals are optional. | |
| Validation only | Source validation is enough for Phase 28. | |

**User's choice:** Validation + smoke + behavior signal.
**Notes:** Gauntlet should prove interaction diversity, every starter must participate in at least one Match reaching board contraction, public metadata privacy checks are required, and Phase 28 should include a human-readable starter rebaseline summary.

---

## the agent's Discretion

- The planner may choose which starter doctrines to replace if they mislead under v1.4.
- The planner may choose exact behavior signals per starter.

## Deferred Ideas

- Full demo ladder rebuild.
- Standalone public starter library.
- Public power rankings or difficulty labels.
