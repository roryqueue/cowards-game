# Phase 260: Truthful Strategy Inputs, Arena Authority, and Set Fairness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.

**Date:** 2026-07-12
**Phase:** 260-truthful-strategy-inputs-arena-authority-and-set-fairness
**Areas discussed:** Initiative observation, Advance-state observation, arena authority and duplicate geometry, Set condition matrix

## Initiative observation

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Initial fields | Absolute + relative; relative only; absolute only | Absolute + relative |
| Round fields | Initial + current; initial only; current only | Initial + current |
| Ownership | Kernel signed; request metadata; adapter-derived | Kernel signed |
| Old revisions | Revalidate; auto-compatible; require source edit | Revalidate |

## Advance-state observation

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Meaning | Own successful displacement; any MOVE; any displacement | Own successful displacement |
| Timing | Pre-Action accumulated; predicted; previous Action only | Pre-Action accumulated |
| Reset | Each slot; each Round; each Cycle | Each slot |
| Scope | Observational only; add HOLD now | Observational only |

## Arena authority and duplicate geometry

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Owner | Spec manifest; map-configs; database | Spec manifest |
| Empty duplicate | Active + alias; both active; delete one | Active + alias |
| Geometry hash | Gameplay geometry; entire record; terrain only | Gameplay geometry |
| Changes | Consolidation only; allow fixes | Consolidation only |

## Set condition matrix

| Decision | Options considered | Selected |
|----------|--------------------|----------|
| Coverage | Four Cartesian; two marginal; eight duplicated | Four Cartesian |
| Identity | Explicit fields; seed suffix; unrelated seeds | Explicit fields |
| Scheduling | Atomic canonical order; adaptive; randomized | Atomic canonical order |
| Completion | Full valid matrix; partial score; recreate all | Full valid matrix |

**User's choice:** Selected recommended options except initially selecting two Matches; after the side/initiative coupling distinction, explicitly selected the four-Match Cartesian matrix.

## the agent's Discretion

- Exact names, generated format, active empty-arena alias choice, and condition-label strings.

## Deferred Ideas

- HOLD, new arenas, and Strategy-factory work remain deferred.
