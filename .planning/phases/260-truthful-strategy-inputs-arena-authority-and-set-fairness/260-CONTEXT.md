# Phase 260: Truthful Strategy Inputs, Arena Authority, and Set Fairness - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase adds truthful kernel-owned initiative and Advance observations to the shared ABI, consolidates existing official arenas under one semantic authority without changing geometry, and makes counted Sets cover the complete side-by-initiative condition matrix. It does not add HOLD, alter gameplay, add arenas, or build the later Strategy factory.

</domain>

<decisions>
## Implementation Decisions

### Initiative observation
- **D-01:** `StrategyInput` includes `initialInitiativePlayerId` plus `hasInitialInitiative`; validators require absolute and player-relative values to agree.
- **D-02:** Each Round selection also includes `roundInitiativePlayerId` plus `hasRoundInitiative`; Strategies do not infer current initiative from Round parity.
- **D-03:** The kernel derives and signs all initiative values from canonical state per `selectActivations` invocation. Runtime-service and adapters only transport them.
- **D-04:** Existing Strategy Revisions require real execution/revalidation under the new ABI tuple. Source may ignore added fields, but compatibility is never inferred from additive JSON behavior.

### Advance-state observation
- **D-05:** `hasAdvancedThisActivation` becomes true only after the acting Soldier successfully changes position through its own Advance, including moving into a successfully pushed Soldier's former square. TURN, blocked MOVE/PUSH, and being pushed do not set it.
- **D-06:** Every `SoldierBrainInput` reports authoritative state before the requested Action: false until an earlier Cycle in that slot Advanced, then true for every later call in the slot.
- **D-07:** Reset the field to false for each newly selected activation slot, even if the same Soldier acted previously. It is scheduler state, never StrategyMemory or SoldierMemory.
- **D-08:** The field is observational only. It does not add `HOLD`/`END_ACTIVATION`, change Action legality, or alter no-Advance cleanup.

### Arena authority and duplicate geometry
- **D-09:** One spec-owned versioned manifest defines official arena IDs, versions, bounds, terrain, semantic geometry hashes, aliases/status, and any arena-owned setup. All TypeScript, Go, persistence, replay, UI, and fixture consumers use generated or validated projections.
- **D-10:** Designate one of Smoke/Open Field as the active schedulable empty geometry and preserve the other ID as a historical alias sharing the same semantic geometry hash. It never counts as distinct diversity.
- **D-11:** Semantic geometry identity hashes versioned canonical bounds, sorted terrain, and arena-owned setup fields. Exclude IDs, names, descriptions, UI metadata, and source ordering. Rules-owned starting positions remain identified by the rules/tuple.
- **D-12:** Phase 260 may consolidate, validate, alias, and deduplicate only. It cannot add or alter official geometry. Future geometry requires separate approval, catalog/tuple versioning, symmetry and semantic validation, and fresh evidence.

### Set condition matrix
- **D-13:** Every two-entrant semantic arena scenario contains four Matches covering the full Cartesian matrix of entrant A bottom/top crossed with A first/not-first; entrant B receives the complementary full matrix.
- **D-14:** Persist scenario ID, arena semantic hash, bottom/top entrants, and initial-initiative owner explicitly. Use a shared deterministic base seed unless another non-game identifier is required; seed suffixes never encode fairness semantics.
- **D-15:** Assign deterministic condition IDs in canonical order, create the complete Set atomically, and freeze Strategy Revisions plus arena catalog before execution. Runtime completion order cannot affect scoring.
- **D-16:** A Set counts only after all four conditions have valid terminal evidence. Retry system-failed conditions from identical scenario/request identity under bounded policy; partial matrices are pending/degraded and non-counted. Player violations are valid canonical terminal evidence.

### the agent's Discretion
- Exact field naming beyond the locked semantics, canonical ordering labels, which duplicate empty ID remains active, and generated-manifest layout are for research/planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/PROJECT.md` — No gameplay/new-arena scope and Strategy runtime ownership.
- `.planning/REQUIREMENTS.md` — STRAT-01 through STRAT-04 and SET-01 through SET-05.
- `.planning/ROADMAP.md` — Phase 260 boundary and success criteria.
- `.planning/phases/256-counted-safety-and-canonical-authority/256-CONTEXT.md` — Exact tuple, eligibility, and historical alias treatment.
- `.planning/phases/257-canonical-transition-kernel-and-v1-4-semantic-integrity/257-CONTEXT.md` — Canonical Advance and preserved v1.4 behavior.
- `.planning/phases/258-canonical-json-failure-semantics-and-artifact-identity/258-CONTEXT.md` — Shared ABI and signed invocation contract.
- `.planning/phases/259-executable-four-language-and-chronicle-conformance/259-CONTEXT.md` — Revalidation and certification rules.
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md` — F-11 initiative gap, F-20 duplicate arenas, and F-22 initiative mirroring defect.
- `CowardsGameSpec_Full_Consolidated_v1.md` — Canonical Advance definition and arena/setup semantics.
- `CowardsGameSpec_CycleInterleaved_v1.4.md` — Activation-slot and no-Advance semantics.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/engine/src/runtime-inputs.ts`: Existing Strategy/SoldierBrain builders become the sole source of new scheduler-owned fields.
- `packages/engine/src/activation.ts`: Existing slot `advanced` state already tracks the authoritative fact and must feed input construction.
- `packages/map-configs/src/index.ts`: Existing arena definitions become generated/validated projections of the spec manifest.
- `packages/persistence` and `apps/go-backend`: Existing MatchSet creation, arena rows, side assignments, and scoring are the fairness migration seams.
- `packages/spec/src/match-execution-contract.ts`: Existing scenario/result DTOs can carry explicit condition identity and safe evidence.

### Established Patterns
- Generated spec artifacts and Go parity checks already synchronize selected TypeScript contracts across language/service ownership.
- Strategy Revisions are immutable before competition, supporting atomic four-condition scheduling.
- MatchSet scoring already waits on terminal Match evidence; the completion rule must become full-matrix aware.

### Integration Points
- ABI schemas, generated examples, SDK/Workshop docs, and all four fixture programs receive the new fields.
- Arena catalog generation replaces handwritten duplicates in TypeScript/Go/persistence/fixtures.
- Go-owned scheduling persists explicit side/initiative conditions rather than deriving them from seeds.
- Phase 261 service proof verifies the full four-condition matrix through persistence and standings.

</code_context>

<specifics>
## Specific Ideas

- Provide both absolute and player-relative initiative facts, validated against each other.
- Treat semantic geometry identity as a gameplay hash independent of marketing labels.
- A four-Match matrix is necessary to separate side and initiative effects; two mirrored Matches cover marginals but keep the variables coupled.

</specifics>

<deferred>
## Deferred Ideas

- `HOLD`/`END_ACTIVATION` remains separately approval-gated.
- New official arena geometries and the competitive Strategy factory remain later milestones.

</deferred>

---

*Phase: 260-truthful-strategy-inputs-arena-authority-and-set-fairness*
*Context gathered: 2026-07-12*
