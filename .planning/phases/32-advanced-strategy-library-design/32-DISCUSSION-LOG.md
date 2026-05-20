# Phase 32: Advanced Strategy Library Design - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 32-Advanced Strategy Library Design
**Areas discussed:** Advanced Tier Placement, Archetype Roster and Naming, Metadata and Public Card Contract, Fork/Apply and Source Visibility

---

## Advanced Tier Placement

| Question | Option | Selected |
| --- | --- | --- |
| Primary location | Separate Advanced Library section in Workshop | ✓ |
| Primary location | Tier/filter inside existing Starter Library | |
| Primary location | Dedicated `/strategies/advanced` library route | |
| Primary location | Both route and Workshop section | |
| Visual relationship | Adjacent but clearly tiered | ✓ |
| Visual relationship | Below Starters as a continuation | |
| Visual relationship | Separate tab | |
| Visual relationship | Prominent benchmark panel | |
| Public availability | Public cards yes, no dedicated browse route yet | ✓ |
| Public availability | Dedicated public browse route too | |
| Public availability | Workshop-only in Phase 32 | |
| Public availability | Only evidence/report links, no public cards yet | |
| Labels | Starter and Advanced seed | ✓ |
| Labels | Beginner and Advanced | |
| Labels | Template and Benchmark | |
| Labels | Library and Lab | |

**User's choice:** Advanced Strategies live in a distinct Workshop section adjacent to Starters, get public cards in Phase 32, and use `Starter` / `Advanced seed` labels.
**Notes:** The Advanced tier should be visible and useful without turning this phase into a public browsing feature.

---

## Archetype Roster and Naming

| Question | Option | Selected |
| --- | --- | --- |
| Archetype slots | One primary slot per required archetype | ✓ |
| Archetype slots | Freeform 10 strongest with coverage review | |
| Archetype slots | Pairs of counters | |
| Archetype slots | Teaching progression from simple to advanced | |
| Naming | Flavor name plus explicit archetype label | ✓ |
| Naming | Purely canonical tactical names | |
| Naming | Vivid fantasy-style names | |
| Naming | Numbered advanced seeds | |
| Count | Target 10 with quality escape hatch | ✓ |
| Count | Exactly 8 | |
| Count | Exactly 10 | |
| Count | 8 now, 2 deferred | |
| Memory distribution | At least half memory-using, no maximum when useful | ✓ |
| Memory distribution | At least 3 stateless and 3 memory-using | |
| Memory distribution | Exactly half memory-using | |
| Memory distribution | Memory only where archetype demands it | |
| Memory distribution | Most Advanced Strategies should use memory | |

**User's choice:** Reserve primary archetype coverage, use flavor names with explicit labels, target 10 with a documented quality escape hatch to 8-9, and require at least half memory-using with no maximum when memory is useful.
**Notes:** User clarified: "at least half memory using, no maximum memory using, but don't force stateless if memory is useful for the strategy."

---

## Metadata and Public Card Contract

| Question | Option | Selected |
| --- | --- | --- |
| Card emphasis | Doctrine and archetype plus evidence summary | ✓ |
| Card emphasis | Public record first | |
| Card emphasis | Validation/provenance first | |
| Card emphasis | Compact card with detail expansion | |
| Strength framing | Advanced seed plus archetype plus profile-scoped caveats | ✓ |
| Strength framing | Numerical difficulty | |
| Strength framing | Competitive/teaching badges | |
| Strength framing | No strength language | |
| Evidence links | Evidence packet links plus MatchSet/replay samples | ✓ |
| Evidence links | Only MatchSet/result links | |
| Evidence links | Report-only links | |
| Evidence links | No evidence links in Phase 32 | |
| Mandatory public fields | Full public-safe doctrine, validation, compatibility, evidence, and provenance fields | ✓ |
| Mandatory public fields | Compact public fields only | |
| Mandatory public fields | Full contract but collapsed | |
| Mandatory public fields | Card references report instead of carrying fields | |

**User's choice:** The interactive picker was unavailable after context compaction, so the recommended choices were applied to preserve continuity with Phase 30/31 decisions.
**Notes:** These choices keep Strategy cards useful on their own while avoiding durable-rating language and source leakage.

---

## Fork/Apply and Source Visibility

| Question | Option | Selected |
| --- | --- | --- |
| Apply behavior | Apply to draft with confirmation | ✓ |
| Apply behavior | Fork to account only | |
| Apply behavior | Benchmark-only no apply | |
| Apply behavior | Same as Starter apply | |
| Source visibility | Workshop/apply only, public cards no source | ✓ |
| Source visibility | Public source for system seeds | |
| Source visibility | Hidden until fork | |
| Source visibility | Benchmark-only no source | |
| Warning/framing | Concise Advanced seed label and benchmark/template copy | ✓ |
| Warning/framing | Modal warning | |
| Warning/framing | No warning | |
| Warning/framing | Difficulty badges | |
| Lineage | Dedicated Advanced lineage fields | ✓ |
| Lineage | Generalize Starter lineage | |
| Lineage | Tags only | |
| Lineage | No lineage | |

**User's choice:** The interactive picker was unavailable after context compaction, so the recommended choices were applied.
**Notes:** The selected path preserves intentional user action, public privacy, and traceable seed lineage.

---

## the agent's Discretion

- Exact Advanced Strategy names.
- Exact metadata property names and storage shape.
- Exact card layout and apply-flow copy.
- Whether to implement lineage as dedicated fields or a generalized seed lineage type, as long as the Advanced identity is explicit.

## Deferred Ideas

- Gauntlet evidence generation and tuning are deferred to Phase 33.
- Example MatchSet generation is deferred to Phase 34.
- Demo tournament generation is deferred to Phase 35.
- Replay review and tuning are deferred to Phase 36.
