# Phase 33: Deterministic Gauntlet Validation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 33-Deterministic Gauntlet Validation
**Areas discussed:** Gauntlet Suite Shape, Evidence and Profile Identity, Acceptance and Tuning Gates

---

## Gauntlet Suite Shape

| Question | Option | Selected |
| --- | --- | --- |
| Starter validation | Advanced vs all 10 v1.4 Starters | ✓ |
| Starter validation | Selected benchmark subset only | |
| Starter validation | Smoke first, full later | |
| Advanced field | Complete deterministic round robin | ✓ |
| Advanced field | Equivalent complete MatchSet suite | |
| Advanced field | Swiss-style sample | |
| Counter gauntlets | Required named curated counter profiles | ✓ |
| Counter gauntlets | Optional if round robin is rich enough | |
| Counter gauntlets | Manual replay review only | |

**User's choice:** Applied recommended defaults from milestone requirements and prior evidence decisions.
**Notes:** The full starter and advanced suites provide a hard evidence base; curated counters protect archetype claims that aggregate standings can hide.

---

## Evidence and Profile Identity

| Question | Option | Selected |
| --- | --- | --- |
| Canonical artifact | Phase 31 JSON packet plus generated Markdown | ✓ |
| Canonical artifact | Markdown-only report | |
| Canonical artifact | Script stdout only | |
| Profile identity | Stable profile hash plus readable label | ✓ |
| Profile identity | Opaque run id only | |
| Profile identity | Human label only | |
| Representative links | Deterministic sample categories | ✓ |
| Representative links | Top standing examples only | |
| Representative links | Manual curation only | |
| Failures | Separate system/non-counted from Strategy performance | ✓ |
| Failures | Include all failures in standings | |
| Failures | Hide failed runs from report | |

**User's choice:** Applied Phase 31 evidence model choices to Phase 33.
**Notes:** Evidence must stay reproducible, privacy-safe, and profile-scoped.

---

## Acceptance and Tuning Gates

| Question | Option | Selected |
| --- | --- | --- |
| Strategy acceptance | Role replay plus close/favorable matchup | ✓ |
| Strategy acceptance | Aggregate winning record required | |
| Strategy acceptance | Manual acceptance only | |
| Dominance trigger | Champion has no close or unfavorable advanced matchup | ✓ |
| Dominance trigger | Win-rate threshold only | |
| Dominance trigger | Points gap threshold only | |
| Tuning trigger | Documented review/replay/privacy/missing-role trigger | ✓ |
| Tuning trigger | Tune any weak aggregate record | |
| Tuning trigger | No tuning in validation phase | |
| Rerun policy | New source hash/provenance and rerun affected gauntlets plus smoke regression | ✓ |
| Rerun policy | Rerun everything every time | |
| Rerun policy | Rerun only the failed matchup | |

**User's choice:** Applied recommended defaults.
**Notes:** Specialists are allowed to be specialist-shaped; the gate is credible tactical purpose, not uniform dominance.

---

## the agent's Discretion

- Exact script boundaries and command names.
- Exact curated counter profile names.
- Exact rerun minimization strategy.
- Exact local artifact filenames.

## Deferred Ideas

- Example MatchSet selection is deferred to Phase 34.
- Tournament generation is deferred to Phase 35.
- Final browser/docs verification is deferred to Phase 37.
