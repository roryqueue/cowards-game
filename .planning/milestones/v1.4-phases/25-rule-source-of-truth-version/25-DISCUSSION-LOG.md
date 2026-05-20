# Phase 25: Rule Source-of-Truth Version - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 25-Rule Source-of-Truth Version
**Areas discussed:** Rules Version Shape, Cycle-Interleaved Example Contract, Backstab Boundary Vocabulary, Architecture Impact Map, Compatibility and Provenance Labels

---

## Rules Version Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Consolidated + note | Create a corrected consolidated canonical spec and add a short supersession note that points to exact old v1 language being replaced. | ✓ |
| Addendum only | Write a focused correction document that supersedes current sections without producing a full new consolidated spec. | |
| Inline patch only | Directly update existing source specs in place and rely on git/history for the version boundary. | |

**User's choice:** Consolidated + note.
**Notes:** The user also selected archiving old v1 files as historical references, using exact-section supersession, and adding visible root canonical v1.4 files beside the historical v1 specs.

---

## Cycle-Interleaved Example Contract

| Option | Description | Selected |
|--------|-------------|----------|
| Layer table + skip cases | Include the required slot order plus a Cycle-layer table showing repeated Cycle layers and ended/skipped Activations. | ✓ |
| Slot order only | Show selected Soldier order and state that it repeats for each Cycle layer while active. | |
| Full scenario walkthrough | Include a longer example with movement, Backstab, stoning, and match-end interruption across interleaved Cycles. | |

**User's choice:** Layer table + skip cases.
**Notes:** The user selected Round 2 and Round 3 examples, explicit ended-slot skip behavior in the Cycle-layer table, no additional SoldierBrain calls or memory writes for skipped slots, and separate Backstab examples.

---

## Backstab Boundary Vocabulary

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with Cycle-end | Replace `post-advance` as a standalone boundary; Advance can affect the Cycle-end snapshot but does not trigger an extra Backstab check. | ✓ |
| Compatibility alias | Keep `post-advance` as compatibility vocabulary meaning the Cycle-end check after an Advance, with no additional boundary. | |
| Retain both boundaries | Keep Cycle-start, Cycle-end, and post-Advance as separate checks. | |

**User's choice:** Replace with Cycle-end.
**Notes:** The user selected Cycle-start before SoldierBrain input, Cycle-end after every Action resolution, and repeated simultaneous all-board ACTIVE snapshot wording in every Backstab boundary section.

---

## Architecture Impact Map

| Option | Description | Selected |
|--------|-------------|----------|
| Strict checklist with owners | List every affected surface as a must-update checklist: docs, spec versions, engine scheduler, Chronicle grammar, replay reconstruction, runtime input assumptions, fixtures, starters/templates, demo data, persistence/provenance, UI/debug copy, tests. | ✓ |
| Narrative impact map | Explain impacted areas in prose without a strict checklist. | |
| Minimal dependency list | Only name major packages/docs and leave exact updates to planners. | |

**User's choice:** Strict checklist with owners.
**Notes:** The user selected behavior contract rather than implementation algorithm, required old-artifact compatibility/provenance policy, and required test obligations per impacted surface.

---

## Compatibility and Provenance Labels

| Option | Description | Selected |
|--------|-------------|----------|
| Dedicated rules version | Introduce a clear rule/spec label such as `cowards-rules-v1.4` and propagate it through docs, Chronicle metadata/provenance, demo data, and public evidence where applicable. | ✓ |
| Engine version only | Use the engine package/version as the source of truth for rules behavior. | |
| Chronicle schema version only | Treat Chronicle schema compatibility as the rule-version indicator. | |

**User's choice:** Dedicated rules version.
**Notes:** The user selected exposing the rule-version label at every evidence boundary, labeling old v1.3 evidence historical and not directly comparable, and requiring v1.4 counted/demo entries to be regenerated or revalidated under `cowards-rules-v1.4`.

---

## the agent's Discretion

- The planner may choose exact v1.4 root file names if they are visibly canonical.
- The planner may choose exact table/checklist format for the architecture impact map.

## Deferred Ideas

None.
