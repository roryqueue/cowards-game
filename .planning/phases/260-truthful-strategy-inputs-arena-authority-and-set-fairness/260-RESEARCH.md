# Phase 260: Truthful Strategy Inputs, Arena Authority, and Set Fairness — Research

**Researched:** 2026-07-16
**HEAD revalidated:** `352563ef7cf852229da938be29729d8764ca450a`
**Confidence:** HIGH for the current code seams, ownership boundaries, compatibility work, persistence migration, and validation architecture. MEDIUM for the final generated-file layout because that layout is explicitly discretionary and should be selected for the smallest reviewable code generation surface.

<user_constraints>
## User Constraints

### Implementation Decisions

#### Initiative observation
- **D-01:** `StrategyInput` includes `initialInitiativePlayerId` plus `hasInitialInitiative`; validators require absolute and player-relative values to agree.
- **D-02:** Each Round selection also includes `roundInitiativePlayerId` plus `hasRoundInitiative`; Strategies do not infer current initiative from Round parity.
- **D-03:** The kernel derives and signs all initiative values from canonical state per `selectActivations` invocation. Runtime-service and adapters only transport them.
- **D-04:** Existing Strategy Revisions require real execution/revalidation under the new ABI tuple. Source may ignore added fields, but compatibility is never inferred from additive JSON behavior.

#### Advance-state observation
- **D-05:** `hasAdvancedThisActivation` becomes true only after the acting Soldier successfully changes position through its own Advance, including moving into a successfully pushed Soldier's former square. TURN, blocked MOVE/PUSH, and being pushed do not set it.
- **D-06:** Every `SoldierBrainInput` reports authoritative state before the requested Action: false until an earlier Cycle in that slot Advanced, then true for every later call in the slot.
- **D-07:** Reset the field to false for each newly selected activation slot, even if the same Soldier acted previously. It is scheduler state, never StrategyMemory or SoldierMemory.
- **D-08:** The field is observational only. It does not add `HOLD`/`END_ACTIVATION`, change Action legality, or alter no-Advance cleanup.

#### Arena authority and duplicate geometry
- **D-09:** One spec-owned versioned manifest defines official arena IDs, versions, bounds, terrain, semantic geometry hashes, aliases/status, and any arena-owned setup. All TypeScript, Go, persistence, replay, UI, and fixture consumers use generated or validated projections.
- **D-10:** Designate one of Smoke/Open Field as the active schedulable empty geometry and preserve the other ID as a historical alias sharing the same semantic geometry hash. It never counts as distinct diversity.
- **D-11:** Semantic geometry identity hashes versioned canonical bounds, sorted terrain, and arena-owned setup fields. Exclude IDs, names, descriptions, UI metadata, and source ordering. Rules-owned starting positions remain identified by the rules/tuple.
- **D-12:** Phase 260 may consolidate, validate, alias, and deduplicate only. It cannot add or alter official geometry. Future geometry requires separate approval, catalog/tuple versioning, symmetry and semantic validation, and fresh evidence.

#### Set condition matrix
- **D-13:** Every two-entrant semantic arena scenario contains four Matches covering the full Cartesian matrix of entrant A bottom/top crossed with A first/not-first; entrant B receives the complementary full matrix.
- **D-14:** Persist scenario ID, arena semantic hash, bottom/top entrants, and initial-initiative owner explicitly. Use a shared deterministic base seed unless another non-game identifier is required; seed suffixes never encode fairness semantics.
- **D-15:** Assign deterministic condition IDs in canonical order, create the complete Set atomically, and freeze Strategy Revisions plus arena catalog before execution. Runtime completion order cannot affect scoring.
- **D-16:** A Set counts only after all four conditions have valid terminal evidence. Retry system-failed conditions from identical scenario/request identity under bounded policy; partial matrices are pending/degraded and non-counted. Player violations are valid canonical terminal evidence.

### the agent's Discretion
- Exact field naming beyond the locked semantics, canonical ordering labels, which duplicate empty ID remains active, and generated-manifest layout are for research/planning.

### Deferred Ideas
- `HOLD`/`END_ACTIVATION` remains separately approval-gated.
- New official arena geometries and the competitive Strategy factory remain later milestones.
</user_constraints>

<phase_requirements>
## Requirements and Phase Boundary

| ID | Required result | Research implication |
|---|---|---|
| STRAT-01 | `StrategyInput` exposes explicit canonical initial initiative across every supported language envelope. | Add absolute and player-relative initial and current-Round initiative to the kernel-built, signed input; version and recertify the ABI. [VERIFIED: `.planning/REQUIREMENTS.md`; `260-CONTEXT.md`] |
| STRAT-02 | `SoldierBrainInput` exposes scheduler-owned `hasAdvancedThisActivation` across every supported language envelope. | Feed the existing activation-slot `advanced` fact into every pre-Action SoldierBrain input; never reconstruct it in adapters or memory. [VERIFIED: `.planning/REQUIREMENTS.md`; `packages/engine/src/activation.ts`; `packages/engine/src/kernel/step.ts`] |
| STRAT-03 | Direct execution, runtime-service, generated contracts, examples, and SDK/Workshop documentation agree. | Change schemas, invocation examples, generated artifacts, four fixture programs, workshop templates, and service transport together under one successor tuple. [VERIFIED: `.planning/REQUIREMENTS.md`; repository runtime and Workshop seams] |
| STRAT-04 | Strategy execution remains behind runtime-service, Runtime Broker, and provider boundaries. | Keep Go, web, API, persistence, and replay structural/transport-only; no new evaluator outside the existing hostile-runtime boundary. [VERIFIED: `.planning/REQUIREMENTS.md`; `AGENTS.md`] |
| SET-01 | All consumers derive official arenas from one versioned authority. | Add a spec-owned manifest and generate or validate TypeScript, Go, persistence, replay, UI, fixture, and scheduler projections. [VERIFIED: `.planning/REQUIREMENTS.md`; duplicate definitions in `packages/map-configs`, `packages/persistence`, and `apps/go-backend`] |
| SET-02 | Semantic geometry identity prevents duplicate empty arenas from counting as diversity. | Hash geometry-only material; retain one active empty arena and one exact historical alias with the same semantic hash. [VERIFIED: `.planning/REQUIREMENTS.md`; `packages/map-configs/src/index.ts`] |
| SET-03 | Every counted scenario explicitly covers entrant side and initial initiative. | Replace two side mirrors with four persisted, named conditions per entrant pair, semantic geometry, and base seed. [VERIFIED: `.planning/REQUIREMENTS.md`; current TypeScript and Go mirror generators] |
| SET-04 | TypeScript, Go, persistence, and service-backed tests prove the entrant-level Cartesian matrix. | Share fixtures/policy, validate exact four-condition membership, and test permutations, retry identity, atomicity, and non-counting partial matrices. [VERIFIED: `.planning/REQUIREMENTS.md`; Phase 260 success criteria] |
| SET-05 | The repair adds no geometry and changes no valid v1.4 gameplay. | Preserve exact bounds/terrain and historical dispatch; treat explicit initial initiative as a successor Match input/condition, not a rules rewrite. [VERIFIED: `.planning/REQUIREMENTS.md`; canonical rules references] |

Phase 260 owns observation truth, arena authority, and Set condition identity. It does not own `HOLD`, new geometry, Strategy-factory work, final milestone release proof, or a broad UI redesign. [VERIFIED: `260-CONTEXT.md`; `.planning/REQUIREMENTS.md`; `.planning/ROADMAP.md`]
</phase_requirements>

## Summary

Phase 260 should ship one coordinated successor semantic tuple, not three independent patches. Strategy observations change the runtime ABI; the arena manifest changes the arena-catalog tuple component; and the four-condition contract changes the Set-policy component. Existing revisions and Phase 259 certificates must remain immutable historical evidence and must not be reused to claim current compatibility. [VERIFIED: `260-CONTEXT.md` D-04, D-09, D-15; Phase 256 and Phase 259 closure artifacts]

The engine already contains the fact needed for `hasAdvancedThisActivation`: every activation slot starts with `advanced: false`, and the kernel carries `slot.advanced || action.advanced` after action resolution. Movement reports `advanced: true` only when the acting Soldier successfully changes position, including the pusher moving into the displaced Soldier's square. [VERIFIED: `packages/engine/src/activation.ts`; `packages/engine/src/kernel/step.ts`; `packages/engine/src/movement.ts`]

The current initiative source is also singular but incomplete for the new contract. Initial initiative is seed-derived during initial-state construction, only current `initiativePlayerId` is stored, and Round advancement flips that current value. `createStrategyInput` currently emits neither the initial nor current-Round initiative fact. [VERIFIED: `packages/engine/src/kernel/create-initial-state.ts`; `packages/engine/src/kernel/step.ts`; `packages/engine/src/runtime-inputs.ts`]

The current arena and scheduling seams reproduce both audited defects. Smoke and Open Field are separate IDs with identical empty 12-by-12 geometry, while TypeScript and Go independently hand-author arena/preset data. The pairwise schedulers create an original and `:mirror` seed variant, so side and seed-derived initiative can remain coupled rather than covering their Cartesian product. [VERIFIED: `packages/map-configs/src/index.ts`; `packages/persistence/src/presets.ts`; `packages/persistence/src/competition.ts`; `apps/go-backend/live_backend.go`; v1.37 audit F-20 and F-22]

The recommended repair keeps `arena:smoke:v1` active because it is the default and the only empty arena currently seeded by both normal Go presets; it preserves `arena:open-field:v1` as a non-schedulable historical alias. This minimizes identifier migration while retaining exact historical lookup. [RECOMMENDATION based on verified consumers in `packages/persistence/src/presets.ts`, `packages/persistence/src/seed.ts`, and `apps/go-backend/live_backend.go`]

## Revalidated Baseline at `352563e`

The checkout was revalidated at full HEAD `352563ef7cf852229da938be29729d8764ca450a`. Two pre-existing worktree changes were present in `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md`; this research does not rely on or modify either working-tree change, and canonical spec inspection used HEAD bytes. [VERIFIED: `git rev-parse HEAD`; `git status --short`; `git show HEAD:CowardsGameSpec_Full_Consolidated_v1.md`]

Phase 259 is closed by its verification and completion artifacts even though one roadmap progress table is stale. Its current product includes four real certified language lanes, the current per-slot Chronicle grammar, v1.18 supervisor/service evidence, and a current semantic tuple whose gameplay runtime ABI component remains v1.17. [VERIFIED: `.planning/STATE.md`; Phase 259 summaries and `259-VERIFICATION.md`; `packages/spec/src/versions.ts`; `packages/spec/src/runtime-invocation-v1-18.ts`]

The string `strategy-runtime-abi-v1.18` is already used by the Phase 259 supervisor invocation/certificate family while the canonical semantic tuple still names `strategy-runtime-abi-v1.17`. Reusing v1.18 for the observation ABI would make two different contracts share an identity. [VERIFIED: `packages/spec/src/versions.ts`; `packages/spec/src/runtime-invocation-v1-18.ts`; Phase 259 certificate artifacts]

## Standard Stack

No dependency addition is warranted. Phase 260 can use the existing workspace libraries and code-generation patterns. [VERIFIED: repository manifests and generated-contract seams]

| Layer | Existing component | Phase-260 use |
|---|---|---|
| Workspace | pnpm 11.1.2, TypeScript 6 | Spec manifest, schemas, deterministic generators, package boundary checks. [VERIFIED: root `package.json`] |
| Validation/tests | Zod 4 and Vitest 4 | Strict input/cross-field validation, geometry/policy invariants, unit/property/permutation tests. [VERIFIED: package manifests] |
| Engine | Existing pure transition kernel | Own initial/current initiative, activation-slot Advance observation, and successor initial-state construction. [VERIFIED: `AGENTS.md`; `packages/engine/src/kernel`] |
| Persistence | PostgreSQL and existing transactional repositories | Additive historical-safe columns/tables, atomic four-condition creation, immutable catalog freeze, scoring gate. [VERIFIED: `packages/persistence/src/migrations`; match-set repositories] |
| Control plane | Go 1.25 with pgx | Consume generated catalog/policy data, create exact four-condition rows, enforce structural parity without executing Strategy code. [VERIFIED: `apps/go-backend/go.mod`; `apps/go-backend/live_backend.go`] |
| Identity | Existing canonical JSON, SHA-256, Ed25519, domain-framed hashes | Geometry hash, scenario/condition identity, signed request binding, tuple/certificate identities. [VERIFIED: `packages/spec/src/canonical-json-encode.ts`; Phase 258 identity modules] |
| Conformance | Existing golden corpus and four supervised lanes | Publish a new immutable corpus version, run three fresh executions per lane, and install successor certificates. [VERIFIED: `packages/golden/src/v1-37-conformance-corpus.ts`; Phase 259 closure artifacts] |

### Package legitimacy audit

Not applicable: the recommended design adds no package, parser, code-generation framework, property-testing dependency, or cryptographic primitive. [VERIFIED: all required primitives already exist in the repository]

## Project Constraints

- The engine remains deterministic, pure, serializable, and free from wall clock, random host state, filesystem, network, and database access. [VERIFIED: `AGENTS.md`]
- React/web code renders approved projections and never owns rules, initiative derivation, arena semantics, scheduling fairness, or Strategy execution. [VERIFIED: `AGENTS.md`]
- Go owns normal competition creation and structural admission but never executes Strategy code or recreates engine transitions/Chronicle semantics. [VERIFIED: `AGENTS.md`; Phase 259 Go closure]
- Every hostile runtime boundary performs strict raw/schema admission, preserves the exclusive success/player-violation/system-failure model, and commits no state on system failure. [VERIFIED: `AGENTS.md`; Phase 258/259 closure artifacts]
- Strategy Revisions and historical evidence remain immutable; compatibility is exact tuple evidence, not assumed source tolerance. [VERIFIED: Phase 256 and Phase 259 context/closure]
- Public/default contracts expose privacy-safe IDs, statuses, classifications, and approved hashes only; source, artifacts, memories, objectives, diagnostics, and host/security internals remain private. [VERIFIED: `AGENTS.md`; `packages/spec/src/match-execution-contract.ts`]
- Tests must distinguish player violation from system failure and cover deterministic replay/integrity, board realism, runtime capabilities/resources, and boundary ownership. [VERIFIED: `AGENTS.md`]

## Current Responsibility and Defect Map

| Concern | Current owner/seam | Verified gap | Required owner after Phase 260 |
|---|---|---|---|
| Strategy initiative observation | `createStrategyInput` in engine | Input has phase/Round/board/memories but no initiative fields. [VERIFIED: `packages/engine/src/runtime-inputs.ts`; `packages/spec/src/types.ts`; `packages/spec/src/schemas.ts`] | Engine kernel builds all four fields from canonical state; spec validates; runtimes transport. |
| Per-slot Advance observation | `ActivationSlotState.advanced` and kernel | Fact exists but `createSoldierBrainInput` receives no slot state. [VERIFIED: `packages/engine/src/types.ts`; `packages/engine/src/kernel/step.ts`] | Kernel passes `slot.advanced` before every SoldierBrain request. |
| Runtime ABI | spec v1.17 semantics plus v1.18 supervisor envelope | Phase 259 certificates bind old observation corpus/tuple. [VERIFIED: `packages/spec/src/versions.ts`; Phase 259 artifacts] | Add immutable observation ABI v1.19 and successor tuple/corpus/certificates. |
| Arena definitions | map-configs, persistence seeds, Go, replay allow-list | Handwritten definitions and ID lists disagree; Smoke/Open Field duplicate geometry. [VERIFIED: corresponding files] | Spec manifest is authority; all others generated/validated projections. |
| Pairwise scheduling | TS/Go preset loops | Only original/mirror side swaps; seed suffix participates in seed-derived initiative. [VERIFIED: `packages/persistence/src/competition.ts`; `apps/go-backend/live_backend.go`] | Spec Set policy defines four conditions; TS/Go consume it. |
| Persistence | `match_sets.matrix`, `matches`, `match_set_matches`, arena rows | Side and seed persist, but no scenario, semantic geometry, condition, or explicit initial-initiative identity. [VERIFIED: persistence migrations/schema/repositories] | Add successor metadata and exact matrix validation inside atomic creation. |
| Completion/scoring | match status and score services | Terminal-match waiting is not exact four-condition completeness. [VERIFIED: persistence match-set status/scoring modules] | Gate counted score on valid terminal evidence for every condition in every scenario. |
| Replay/public DTO | Chronicle reproducibility and app contract | Arena ID is carried; scenario/condition/semantic geometry/explicit initiative are absent. [VERIFIED: `packages/replay/src/record.ts`; `packages/spec/src/match-execution-contract.ts`] | Bind safe condition metadata into reproducibility/evidence and project it publicly without private runtime data. |
| Workshop/examples | persistence Workshop templates and golden fixtures | Templates and all four fixture languages encode the old observation contract. [VERIFIED: `packages/persistence/src/workshop.ts`; `packages/golden/src/v1-37-conformance-corpus`] | Regenerate examples/docs/fixtures and execute them under the successor ABI. |

## Recommended Architecture

```text
spec-owned contracts
├── strategy observation ABI v1.19
├── canonical arena manifest v1.37
└── four-condition Set policy v1.37
        │
        ├── engine: derives/signs observations and executes explicit initial condition
        ├── generated TS/Go projections: catalog + condition enumerations
        ├── persistence: freezes scenario and inserts four conditions atomically
        ├── runtime lanes: transport exact signed inputs and recertify
        └── replay/public contracts: validate and safely expose condition identity
```

This topology preserves one semantic owner for each new fact while leaving transitions in the engine, scheduling control in Go/persistence, and Strategy execution in the runtime provider boundary. [RECOMMENDATION consistent with verified `AGENTS.md` ownership]

### 1. Successor observation ABI

Use these exact public fields:

```ts
interface StrategyInput {
  initialInitiativePlayerId: PlayerId
  hasInitialInitiative: boolean
  roundInitiativePlayerId: PlayerId
  hasRoundInitiative: boolean
  // existing fields unchanged
}

interface SoldierBrainInput {
  hasAdvancedThisActivation: boolean
  // existing fields unchanged
}
```

Name the successor observation identity `strategy-runtime-abi-v1.19` and the successor tuple key `runtime-v1.19`. Preserve v1.17 semantic and v1.18 supervisor artifacts as immutable explicit dispatch records. [RECOMMENDATION based on verified v1.17/v1.18 identity collision risk]

Add immutable `initialInitiativePlayerId` to successor `GameState`; retain `initiativePlayerId` as the authoritative current-Round owner. Successor initial-state input should accept an explicit initial owner, validate that it is exactly one entrant, and set both fields initially. Historical tuple dispatch keeps seed-derived construction unchanged. [RECOMMENDATION preserving D-02/D-14 and historical behavior]

For direct/non-Set successor Matches, the caller must still provide the explicit initial owner; a helper may deterministically choose it from the existing seed only before the signed Match request is created. Once created, the kernel reads state and never re-infers initiative from seed or Round parity. [RECOMMENDATION preserving D-03]

Add an exported spec validator such as `validateStrategyInitiativeObservation(input, observingPlayerId)` and invoke it at every direct/service/provider admission seam. It must require both absolute IDs to be entrant IDs and require each relative boolean to equal the corresponding absolute-ID comparison. Do not add a redundant observer field merely to make the schema self-contained; the signed invocation context already owns the observing player. [RECOMMENDATION]

Change `createSoldierBrainInput` to require `hasAdvancedThisActivation` as an explicit argument. Both kernel call sites—normal observation and yielded-Soldier continuation—must pass the selected slot's `advanced` value before the requested Action. No adapter, memory object, event scan, or board comparison may compute the value. [RECOMMENDATION based on verified kernel call sites]

Keep the existing action-resolution update `slot.advanced || action.advanced`. The movement resolver already supplies the required success semantics, so Phase 260 should expose that fact without editing Action legality, slot termination, or no-Advance cleanup. [RECOMMENDATION based on verified `movement.ts` and `step.ts` behavior]

### 2. Spec-owned arena authority

Create a public spec module such as `packages/spec/src/arena-catalog-v1-37.ts` and a generated data artifact checked into the repository. Use these version identities:

- catalog: `canonical-arena-catalog-v1.37`
- geometry hash profile: `arena-semantic-geometry-v1`
- active empty arena: `arena:smoke:v1`
- historical empty alias: `arena:open-field:v1`, `aliasOf: "arena:smoke:v1"`, `status: "historical_alias"`, `schedulable: false`
- active nonempty arena: `arena:standard-cross:v1`

These are recommendations resolving the discretionary choices; they preserve all existing geometry bytes and the most widely used default ID. [RECOMMENDATION based on verified current consumers]

Each manifest record should include `id`, `version`, `name`, `status`, `schedulable`, optional `aliasOf`, `initialBounds`, canonically sorted `terrainStones`, required `arenaOwnedSetup`, and `semanticGeometryHash`. UI label/description fields may exist but must not enter the semantic hash. [RECOMMENDATION implementing D-09/D-11]

Define the semantic preimage exactly as canonical JSON of:

```ts
{
  hashProfileVersion: "arena-semantic-geometry-v1",
  initialBounds: { minX, maxX, minY, maxY },
  terrainStones: [{ x, y }, ...sortedByYThenX],
  arenaOwnedSetup: {}
}
```

Use the repository's canonical encoder and domain-framed SHA-256 helper. IDs, aliases, names, descriptions, display order, source order, and rules-owned starting positions must not be in this preimage. [RECOMMENDATION implementing D-11 with existing identity primitives]

Reject a catalog build when an alias hash differs from its target, two active schedulable records share a semantic hash, terrain is duplicated/out of bounds, or a historical alias is scheduled as diversity. Do not silently deduplicate malformed input at runtime. [RECOMMENDATION]

Generate a small Go data file from the spec manifest and compare its committed digest in parity tests. TypeScript consumers should import the spec projection directly where package boundaries permit; `@cowards/map-configs` becomes a compatibility facade rather than another authority. Persistence seeds, Go arena insertion, replay allow-lists, fixtures, preset summaries, and UI labels must consume the projection instead of repeating IDs/config. [RECOMMENDATION based on verified duplication seams]

Arena persistence must become immutable-by-version. Replace Go's current `ON CONFLICT ... DO UPDATE` semantics for canonical released records with insert-or-exact-match validation; a different config/hash for the same catalog version and arena ID is a system integrity failure. [RECOMMENDATION based on verified `ensureCompetitionArenas` behavior]

### 3. Four-condition Set policy

Create a spec-owned module such as `packages/spec/src/set-condition-policy-v1-37.ts` with identity `canonical-set-policy-v1.37-four-condition-v1`. Define one canonical ordered enumeration from entrant A's perspective:

| Ordinal | Condition ID suffix | Bottom | Top | Initial initiative |
|---:|---|---|---|---|
| 0 | `a-bottom-a-first` | A | B | A |
| 1 | `a-bottom-b-first` | A | B | B |
| 2 | `a-top-a-first` | B | A | A |
| 3 | `a-top-b-first` | B | A | B |

This order is deterministic, makes every persisted row legible, and proves the Cartesian product without seed interpretation. [RECOMMENDATION implementing D-13/D-15]

Define a semantic arena scenario as the immutable tuple `(setPolicyVersion, arenaCatalogVersion, semanticGeometryHash, entrantAKey, entrantBKey, baseSeed)`. Derive `scenarioId` with the existing domain-framed canonical hash helper; derive each `conditionId` from the scenario ID plus the canonical suffix. Match display IDs may include ordinals, but identity validators must read explicit fields rather than parse the ID. [RECOMMENDATION implementing D-14]

Use the same `baseSeed` in all four condition records. Persist `scenarioId`, `conditionId`, `conditionOrdinal`, `arenaCatalogVersion`, `arenaSemanticGeometryHash`, bottom/top player and entrant keys, and `initialInitiativePlayerId` plus `initialInitiativeEntrantKey`. Never append `:mirror`, `:first`, or similar text to encode side/initiative semantics. [RECOMMENDATION implementing D-14]

The engine's successor Match request must therefore carry explicit initial initiative. This decouples fairness condition identity from pseudo-random seed parity while leaving all other deterministic seed uses unchanged. Historical requests remain on the historical seed-derived constructor. [RECOMMENDATION preserving exact dispatch]

Both TypeScript and Go scheduling paths must call/consume the same canonical condition table. They may implement language-local iteration, but parity fixtures must compare canonical bytes for the complete generated scenario matrix. Go remains a structural scheduler and request producer; it does not derive gameplay state or execute Strategy code. [RECOMMENDATION consistent with STRAT-04]

### 4. Persistence, completion, and retry

Use an additive migration so historical rows remain readable. Recommended storage:

- immutable catalog entries keyed by `(arena_catalog_version, arena_id)` with config, status, alias target, and semantic hash;
- a scenario record keyed by `(match_set_id, scenario_id)` with policy/catalog version, semantic hash, entrant A/B keys, and base seed;
- successor Match columns for `scenario_id`, `condition_id`, `condition_ordinal`, `arena_catalog_version`, `arena_semantic_geometry_hash`, and explicit initial-initiative player/entrant identity;
- a uniqueness constraint on `(match_set_id, scenario_id, condition_id)` plus exact-range and membership validation before insertion.

Historical rows may keep these additive columns null; current tuple rows must satisfy a strict all-present policy validator. [RECOMMENDATION preserving historical bytes]

Extend the existing match-set transaction so revision locks and catalog exact-match/freeze occur before scenario insertion, all four Matches are validated in memory, and scenario plus conditions commit together. Any missing/duplicate/mismatched condition aborts the transaction before jobs become visible. [RECOMMENDATION based on verified existing transactional insertion]

Persist one stable request identity per condition. A system failure may create a bounded new attempt, but the scenario ID, condition ID, sides, initial initiative, seed, strategy revisions, arena/catalog identity, semantic tuple, and signed Match request hash must remain identical. A changed value is a different condition, not a retry. [RECOMMENDATION implementing D-16 with existing retry semantics]

Player violations remain valid terminal Match evidence because the engine owns their canonical consequences. System failures remain no-mutation infrastructure failures and never satisfy terminal condition evidence until an identical retry succeeds or produces a valid player terminal result. [VERIFIED: Phase 258/259 failure ownership; RECOMMENDATION applying D-16]

Update status/scoring so a scenario is countable only when the exact four expected condition IDs each have valid terminal evidence under the frozen tuple/catalog/revisions. A partial or system-failed matrix is `pending` while retryable or `degraded` when retry policy is exhausted; neither exposes counted standings. Scoring must sort by canonical scenario/condition identity, not completion timestamp. [RECOMMENDATION implementing D-15/D-16]

### 5. Replay and public contracts

Add the safe condition identity to current Chronicle reproducibility and signed completion evidence: scenario ID, condition ID/ordinal, arena catalog version, semantic geometry hash, bottom/top entrant keys, and explicit initial-initiative entrant/player identity. Validate it against the persisted Match before accepting Chronicle bytes. [RECOMMENDATION based on verified `packages/replay/src/record.ts` and Chronicle-store seams]

Historical Chronicles keep their exact schema and arena ID. Current replay resolves the persisted catalog version and alias explicitly, then validates board geometry through the manifest projection; it must remove the handwritten `canonicalArenaVariantIds` set and never guess an alias from current display names. [RECOMMENDATION based on verified `apps/web/app/matches/replay-ready.ts`]

Extend `PublicMatchEvidenceDto`/`MatchExecutionMatchResultV1` additively or version the app contract if strict consumers require it. Public output may include condition ID/label, sides, initial-initiative entrant, catalog version, and semantic geometry hash; it must not include Strategy source, artifacts, memories, objectives, raw diagnostics, host receipts, or security internals. [RECOMMENDATION consistent with verified public contract privacy]

No broad UI work is required. Existing Match/Set/replay views may render contract-derived arena status and condition labels, but UI code must not calculate hashes, alias equivalence, or fairness completeness. [RECOMMENDATION; NO-UI determination]

### 6. Generated examples, SDK/Workshop, and four-language conformance

Create a new immutable conformance corpus version rather than editing the reviewed Phase 259 corpus in place. Every TypeScript, Python, Rust, and Zig fixture must actually observe the four initiative fields and `hasAdvancedThisActivation` in deterministic outputs/memory/objective behavior so transport omissions cannot pass unnoticed. [RECOMMENDATION implementing D-04 and STRAT-03]

Include cases that prove false on the first SoldierBrain call; true on the next call after successful self Advance; persistent true in later Cycles of the same slot; false after TURN, blocked MOVE/PUSH, or being pushed; and reset to false when the same Soldier is selected in a later slot. Include both initial/current-Round absolute-relative initiative agreement and a later Round whose current owner differs from the initial owner. [RECOMMENDATION based on D-01 through D-08]

Update the Workshop TypeScript/Python/Rust/Zig templates and public generated input examples to name/read the fields. Documentation must state that `hasAdvancedThisActivation` is pre-Action scheduler state, not an instruction to stop and not a memory field. [RECOMMENDATION based on verified `packages/persistence/src/workshop.ts`]

Run three fresh complete corpus executions for each real lane under exact successor identities and mint/install new current certificates. Old Phase 259 certificates remain valid only for their exact old tuple/corpus and cannot promote a successor revision. [RECOMMENDATION required by verified Phase 259 certification rules and D-04]

### 7. Tuple activation order

Prepare all successor data before changing current defaults:

1. Add immutable spec records for ABI v1.19, arena catalog v1.37, Set policy v1.37, and the successor six-component tuple while preserving all historical records.
2. Implement engine, generated projections, persistence, Go, replay, public contract, fixtures, and validators behind explicit successor dispatch.
3. Generate/review the new corpus and exact TS/Go catalog/policy artifacts.
4. Run focused suites, database parity, four-language three-run recertification, and boundary monitors.
5. Install successor certificates/authority and atomically flip the small current-default set.
6. Re-run full tuple, service, persistence, replay, Go, and public-contract verification after the flip.

This ordering prevents mixed tuples and makes rollback a default-pointer change rather than mutation of released evidence. [RECOMMENDATION following verified Phase 258/259 preactivation pattern]

## Exact File and Symbol Seams

| Area | Primary edits | Required result |
|---|---|---|
| Input types/schemas | `packages/spec/src/types.ts`, `schemas.ts`, new immutable ABI module, generated examples | Strict fields and cross-field consistency validator; historical schemas unchanged. |
| Tuple authority | `packages/spec/src/versions.ts`, `integrity-authority.ts` | Add ABI v1.19, arena catalog v1.37, Set policy v1.37, successor tuple; preserve v1.17/v1.18 records. |
| Engine input construction | `packages/engine/src/runtime-inputs.ts`, `kernel/create-initial-state.ts`, `kernel/step.ts`, state types | Store initial owner, use current owner, pass slot `advanced` pre-Action, sign exact input. |
| Engine behavior tests | runtime-input, activation, lifecycle, compatibility, current-kernel runtime tests | Prove truth table and no legality/no-Advance/gameplay drift. |
| Arena authority | new spec catalog + generator; `packages/map-configs/src/index.ts` | One manifest, two active semantic geometries, Open Field historical alias, exact hashes. |
| Persistence | migrations, schema, repositories, presets, competition, matchset status/scoring, seed | Immutable catalog freeze, explicit scenario/condition columns, atomic four rows, full-matrix scoring gate. |
| Go | generated catalog/policy file, `live_backend.go`, semantic integrity/parity tests | No handwritten official arena/preset semantics; exact four conditions and explicit initiative. |
| Runtime/service | runtime ABI bridges, invocation contract/service transport, service tests | Transport signed fields unchanged; no derivation or gameplay logic. |
| Golden/certification | new `v1-37-conformance-corpus/v3` (or next immutable version), generator, traces, lane certificates | Four fixtures consume fields; three fresh runs per lane under successor tuple. |
| Replay | record/validate/reconstruct/current grammar, Chronicle store, web replay readiness | Bind and validate condition/catalog evidence; manifest-backed alias lookup; historical route frozen. |
| Public contract/UI | spec match-execution DTO/schema/examples; web Match/Set/replay consumers | Privacy-safe condition projection only; no client fairness computation. |
| Workshop/SDK | `packages/persistence/src/workshop.ts`, generated contract/docs surfaces | All examples and languages agree on field semantics and ABI identity. |
| Drift guards | boundary monitor scripts/tests | Detect handwritten arena authorities, seed-parsed fairness, fewer/more than four conditions, mixed tuple/certificates, and private leakage. |

## Runtime State Inventory

This phase includes a persisted authority consolidation, so state outside source declarations must be handled explicitly. [VERIFIED: current arena/match-set data is persisted]

| State category | Current state | Migration/verification requirement |
|---|---|---|
| Stored database data | Arena rows store ID/name/config; Match/Set rows store side assignments, seeds, matrix JSON, tuple/evidence metadata, but not successor scenario/condition fields. [VERIFIED: persistence migrations/repositories] | Add nullable historical-safe columns/tables; exact-validate released rows; do not rewrite historical Chronicles or old matrices. |
| Live service configuration | Runtime authority/certificate publications and current tuple defaults are repository/DB managed; no separate arena service configuration was found. [VERIFIED: Phase 259 authority install seams and repository search] | Install successor authority only after new certificates; validate default flip and fail closed on stale old evidence. |
| OS-managed state | No launchd/systemd arena or Set configuration is part of this repository design. [VERIFIED: repository search and project architecture] | None; counted runtime supervisors retain existing OS/container proof boundaries. |
| Secrets/environment | Database URLs and existing signing/trust configuration remain external; Phase 260 introduces no new secret class. [VERIFIED: existing test/run scripts and identity architecture] | Do not record values in artifacts; run DB/service proof through existing environment variables. |
| Build/generated artifacts | Spec examples, Go projections, corpus, traces, hashes, and certificates encode the old tuple/inputs. [VERIFIED: generated artifact and Phase 259 directories] | Generate new immutable successor artifacts; retain old bytes and explicit historical dispatch. |

## Validation Architecture

### Validation layers

| Layer | Proves | Focused evidence |
|---|---|---|
| Spec unit/schema | Field presence, absolute-relative agreement, catalog/hash/policy invariants | New spec tests for observation validator, catalog aliases/hashes, and exact condition enumeration. |
| Engine unit/invariant | Kernel-owned initiative and precise pre-Action slot Advance truth | Runtime-input and activation tests including push, pushed Soldier, blocked actions, Round change, and slot reset. |
| Compatibility/differential | No Action legality, no-Advance, geometry, or historical behavior drift | Existing v1.4 compatibility fixtures plus successor-only observation assertions. |
| Generator parity | TS manifest and committed Go/catalog/policy artifacts are exact | Generate/check mode; canonical digest equality; no handwritten duplicate allow-lists. |
| Persistence transaction | Four conditions/frozen inputs commit together; partial/mismatch rolls back | PostgreSQL tests for constraints, duplicate/missing rows, catalog mutation, completion permutations, retry identity. |
| Go parity/service | Normal Go creation produces exact entrant-level Cartesian rows and structural completion admission | Go unit/DB tests and service-backed creation evidence using generated fixtures. |
| Runtime conformance | Every real lane receives and uses the same fields | New corpus version, three fresh runs/lane, new certs bound to tuple/corpus/artifacts. |
| Replay/public | Condition/catalog evidence survives Chronicle/persistence/replay and remains privacy safe | Record/validate/reconstruct tests, historical alias fixtures, public schema snapshots and leak scans. |
| Boundary monitors | No duplicate authority or fairness/ABI shortcuts reappear | Searches/AST monitors for official arena literals, seed-semantic parsing, Strategy execution imports, stale tuple IDs. |

### Wave 0 test gaps

Create the following before or alongside implementation so every later plan has an executable target:

- spec observation consistency tests and successor ABI fixtures;
- spec arena manifest/hash/alias tests and generation check;
- spec Set policy exact four-row/permutation tests;
- engine `hasAdvancedThisActivation` transition table and initial/current initiative tests;
- persistence schema/atomic matrix/status/scoring/retry tests;
- Go generated catalog/policy parity and entrant-level Cartesian DB tests;
- new four-language corpus inputs/traces and certificate candidate checks;
- replay reproducibility/catalog alias/historical dispatch tests;
- match-execution public schema/privacy fixtures;
- boundary monitors for duplicate arena definitions, seed-suffix fairness, mixed tuple IDs, and execution ownership.

These are new tests because current suites cover old input shapes, arena structure, side mirrors, and Phase 259 conformance but not the successor semantics. [VERIFIED: current test inventory]

### Recommended focused commands

Use existing scripts rather than inventing a new test runner. Exact package script names should be confirmed during planning because some DB/service commands require established environment variables. [VERIFIED: repository package manifests]

```bash
pnpm --filter @cowards/spec test
pnpm --filter @cowards/engine test
pnpm --filter @cowards/map-configs test
pnpm --filter @cowards/persistence test
pnpm --filter @cowards/replay test
pnpm --filter @cowards/golden test
pnpm go:parity
pnpm boundary:monitors
```

Database-backed tests must use the existing isolated PostgreSQL harness/URL, and real certification must use the Phase 259 supervised counted-lane workflow rather than local synthetic substitutes. [VERIFIED: Phase 259 closure and existing test scripts]

### Required assertions

1. For every selection request, both initiative IDs equal canonical state and both booleans equal observer comparisons; a mismatch is rejected before runtime execution. [RECOMMENDATION]
2. `hasAdvancedThisActivation` follows the complete D-05 through D-07 truth table and does not alter the transition/event/outcome trace when a Strategy ignores it. [RECOMMENDATION]
3. Smoke and Open Field have byte-equal semantic geometry hashes, only Smoke is schedulable, and existing Standard Cross geometry is unchanged. [RECOMMENDATION]
4. Every scenario contains exactly the four canonical condition IDs, each entrant appears twice per side and twice as initial-initiative owner, and all four use one base seed. [RECOMMENDATION]
5. Every insertion order and completion order produces identical counted result bytes; missing/system-failed conditions never count. [RECOMMENDATION]
6. Player-violation terminal evidence occupies its expected condition and counts without being mislabeled as infrastructure failure. [RECOMMENDATION]
7. System retries retain the exact request/scenario/condition hash and bounded-attempt policy. [RECOMMENDATION]
8. Historical arena IDs, tuple records, Chronicles, and Phase 259 certificates remain byte-immutable and route only through exact historical dispatch. [RECOMMENDATION]
9. Web/API/Go bundles contain no Strategy evaluator/runtime execution path, and public fixtures contain none of the prohibited private fields. [RECOMMENDATION]

## Security Domain

Phase 260 changes hostile-input schemas, authenticated identity, persistence integrity, and public projection, so security validation is required even though it adds no authentication feature. [VERIFIED: affected boundaries]

| ASVS area | Phase-260 treatment |
|---|---|
| V2 Authentication | No authentication mechanism changes; retain existing entrant/user identity binding. [VERIFIED: phase boundary] |
| V3 Session management | No session lifecycle changes. [VERIFIED: phase boundary] |
| V4 Access control | Preserve existing MatchSet ownership and owner/public replay authorization while adding safe condition metadata. [RECOMMENDATION based on existing access seams] |
| V5 Validation/sanitization | Strictly validate initiative consistency, manifest aliases/hashes, exact condition membership, DB rows, Go projections, Chronicle bindings, and public DTOs. [RECOMMENDATION] |
| V6 Cryptography | Reuse canonical JSON, domain separation, SHA-256, Ed25519, and installed trust roots; do not invent hashing/signing. [VERIFIED: existing identity stack] |
| V7 Error/logging | Classify tampering/integrity mismatch as restricted system failure; public messages expose no raw input, source, memory, host path, receipt, or key detail. [RECOMMENDATION consistent with existing failure/privacy rules] |
| V8 Data protection | Keep Strategy observations inside signed private invocation evidence; expose only approved condition/catalog identifiers publicly. [RECOMMENDATION] |
| V10 Malicious code | Strategy code remains exclusively in supervised provider lanes; new fields do not authorize execution in Go/web/API. [RECOMMENDATION; STRAT-04] |
| V13 API | Version strict schemas/contracts and reject mixed old/new tuple payloads before mutation. [RECOMMENDATION] |

Threat tests must cover forged relative initiative, unknown initiative player, manifest alias hash substitution, an active duplicate semantic hash, condition omission/duplication, seed suffix masquerading as fairness, completion-order bias, stale-certificate reuse, retry identity drift, current evidence relabeled with a historical alias, and private-field leakage. [RECOMMENDATION]

## Do Not Hand-Roll

- Do not create another arena registry in map-configs, Go, persistence, replay, UI, or fixtures; project the spec manifest. [RECOMMENDATION]
- Do not parse condition semantics from Match IDs, seed text, array index, or completion order; persist explicit fields. [RECOMMENDATION]
- Do not calculate initiative in adapters or infer it from Round parity; read kernel state. [RECOMMENDATION]
- Do not reconstruct slot Advance state from events, position diffs, or memory; pass `slot.advanced`. [RECOMMENDATION]
- Do not reuse Phase 259 corpus hashes/certificates after ABI/tuple change; mint successor evidence. [RECOMMENDATION]
- Do not duplicate canonical JSON, hashing, signing, retry, transaction, or historical dispatch primitives. [RECOMMENDATION based on verified existing facilities]
- Do not make Go a Chronicle rules engine or Strategy evaluator while adding structural parity fields. [RECOMMENDATION]

## Common Pitfalls

1. Treating additive JSON as backward compatible would violate D-04 and allow old certificates to promote unexecuted observations. [VERIFIED: locked decision]
2. Naming the new semantic ABI v1.18 would collide with the already released supervisor invocation identity. [VERIFIED: existing v1.18 contract]
3. Deriving initial initiative from the shared seed cannot produce both initiative states for one four-condition scenario; explicit initial owner is required. [INFERENCE from verified current seed-derived constructor and D-13/D-14]
4. Swapping sides with a `:mirror` seed suffix can preserve entrant-level initiative coupling and therefore does not prove the Cartesian matrix. [VERIFIED: current generator and audit F-22]
5. Keeping both empty IDs schedulable while sharing a hash still lets presets overstate diversity; alias status must affect scheduling admission. [INFERENCE from D-10]
6. Updating only `createSoldierBrainInput` misses the yielded-Soldier kernel call site; both invocation paths require the slot fact. [VERIFIED: `packages/engine/src/kernel/step.ts`]
7. Setting Advance after being pushed confuses actor movement with target displacement and violates D-05. [VERIFIED: locked decision and movement ownership]
8. Making current catalog rows upsertable permits released geometry to drift under the same identity. [VERIFIED: current Go upsert; INFERENCE from immutable authority requirement]
9. Waiting for four generic terminal Matches is insufficient if a condition is duplicated and another omitted; completion must validate exact IDs and frozen identities. [INFERENCE from D-15/D-16]
10. Adding public condition evidence by copying internal Match records risks source/memory/receipt leakage; use explicit safe DTO projections. [VERIFIED: established privacy boundary]

## No-UI Determination

No `UI-SPEC.md` or design phase is needed. Phase 260 is contract, engine, scheduling, persistence, conformance, and integrity work; the only UI changes are mechanical rendering of manifest/condition fields already approved by public schemas. Any broader Match/Set/replay redesign remains out of scope. [RECOMMENDATION based on Phase 260 boundary and requirements]

## Open Questions

No blocking research questions remain. The discretionary choices are resolved above: Smoke remains active, Open Field becomes a historical alias, the condition order is explicit, and the successor observation ABI uses v1.19 to avoid the existing v1.18 identity. Planners may adjust generated-file placement without changing these semantics. [RECOMMENDATION]

## Assumptions Log

- No undocumented external arena authority or Set scheduler exists outside the repository/database seams inspected. If deployment discovery during implementation finds one, stop and add it to the manifest projection/drift-guard plan before activation. [ASSUMPTION based on repository-wide search]
- Phase 261 remains responsible for final integrated release proof, standings/governance recomputation, archive, and tag; Phase 260 must nevertheless leave focused service-backed SET-04 evidence. [VERIFIED: `.planning/ROADMAP.md`; `.planning/REQUIREMENTS.md`]

## Sources and Provenance

All research used repository-local canonical and closure evidence; no web research was necessary because the phase requires no new dependency or external protocol and all implementation seams are present in the checkout. [VERIFIED: research log]

Primary sources:

- `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `AGENTS.md`
- `260-CONTEXT.md` and canonical Phase 256–259 context files
- Phase 259 plans, summaries, reviews, validation, and verification closure artifacts
- v1.37 audit F-11, F-20, F-22
- HEAD versions of `CowardsGameSpec_Full_Consolidated_v1.md` and `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `packages/spec`, `packages/engine`, `packages/map-configs`, `packages/persistence`, `packages/replay`, `packages/golden`, runtime packages/services, `apps/go-backend`, and `apps/web` current seams

## Research Metadata

**Research scope:** locked Phase 260 only
**External research:** skipped; repository sufficient and no new dependency recommended
**Historical posture:** immutable explicit dispatch
**Recommended active empty arena:** `arena:smoke:v1`
**Recommended historical alias:** `arena:open-field:v1`
**Recommended successor observation ABI:** `strategy-runtime-abi-v1.19`
**Recommended Set policy:** `canonical-set-policy-v1.37-four-condition-v1`
**Planning readiness:** READY
