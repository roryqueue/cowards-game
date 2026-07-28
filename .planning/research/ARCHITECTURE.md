# Architecture Research: v1.38 Competitive Strategy Factory and Adversarial League

**Domain:** Reproducible adversarial Strategy search and lab-only rules experimentation over a deterministic programmable-game engine
**Researched:** 2026-07-27
**Confidence:** HIGH for repository integration, trust boundaries, and build order; MEDIUM for the eventual throughput and oracle implementations until the planner spike measures them

## Executive Recommendation

Build v1.38 as an **offline research control plane beside the product**, not as another backend and not as another game engine. The lab may construct candidates, schedule deterministic work, solve empirical meta-games, and retain private evidence, but every Match transition must still pass through the selected `@cowards/engine` `MATCH_KERNEL`. Production runtime-service, Go orchestration, canonical persistence, counted scheduling, Chronicle admission, and public DTOs remain closed to experimental profiles.

Use three deliberately different artifact classes:

1. **Lab candidate artifacts** are content-addressed source/provenance nodes used by the factory and league. They are not canonical `StrategyRevision` or `StrategyArtifact` records.
2. **Current-profile certification artifacts** link an exact lab candidate source hash to a separately admitted canonical Strategy Revision and the ordinary runtime-service/Chronicle/persistence proof. This one-way bridge is available only when the profile is the canonical current start.
3. **Experimental-profile artifacts** remain `lab-only` forever in v1.38. They use a separate trace envelope, private artifact store, evaluator receipt, and decision packet. They never become canonical Chronicles, Match evidence, counted results, or public product data.

The serious current-rules league must reach an immutable freeze before any inward-rank or bracket profile manifest can be materialized. After that freeze, fork the same frozen population and the same precommitted budget into three independent experiment namespaces: current edge rank, inward rank, and bracket shield. Retrain all three; do not treat transferred fixed Strategies as final evidence. Freeze all three final populations and their equal human/model attacks before a separate holdout evaluator opens the common sealed holdout once.

The most important negative design decision is what **not** to add: do not add `initialStateProfile`, `experimentId`, or a generic rule-profile bag to `RunMatchInput`, runtime-service requests, the six-part canonical compatibility tuple, arena records, Set conditions, Match rows, Chronicle headers, or public DTOs. An optional production field would be an eventual production reachability path. The lab instead starts from the canonical v1.19 Match machine, applies a position-only adapter at the unstarted `match_start` boundary, and then advances only by calling the existing kernel step function.

## Baseline Authorities to Preserve

The shipped v1.37 foundation already supplies the boundaries v1.38 needs. These are inputs, not redesign targets.

| Authority | Current seam | v1.38 posture |
|---|---|---|
| Selected semantic authority | `packages/spec/src/current-semantic-authority-source.ts`, key `runtime-v1.19` | Unchanged |
| Atomic tuple | rules, engine, runtime ABI, Chronicle, arena catalog, Set policy in `packages/spec/src/integrity-authority.ts` | Unchanged; experiment identity lives outside it |
| Rules | `cowards-rules-v1.4` | Unchanged |
| Transition engine | `@cowards/engine` `MATCH_KERNEL` and `stepMatch` | Sole transition authority for every lab Match |
| Canonical initial state | `createCandidateInitialGameStateV119` and fixed start constants | Unchanged for product/current certification |
| Arena authority | `canonical-arena-catalog-v1.37`; `arenaOwnedSetup` is strictly empty | Unchanged; formations are not arenas |
| Set fairness | `canonical-set-policy-v1.37-four-condition-v1` | Reused as the side-by-initiative condition shape |
| Runtime execution | runtime-service / Runtime Broker / supervised language providers | Reused for finalist certification; provider adapters reused by the offline lab |
| Chronicle/replay | engine recorder material -> `@cowards/replay` canonical recorder/validator | Reused only for canonical current-profile certification |
| Normal orchestration | Go-owned jobs, completion, persistence handoff, scoring, retries, public evidence | Unchanged; does not run the lab |
| Public projections | service/Go/web source-free, memory-free, objective-free DTOs | Unchanged; no lab or holdout fields |

The certified v1.37 baseline binds:

- rules: `cowards-rules-v1.4`;
- engine: `engine-kernel-v1.37-candidate-1`;
- runtime ABI: `strategy-runtime-abi-v1.19`;
- Chronicle: `chronicle-recorder-current-events-v1.37-candidate-1`;
- arena catalog: `canonical-arena-catalog-v1.37`;
- Set policy: `canonical-set-policy-v1.37-four-condition-v1`.

Every v1.38 manifest must bind the exact selected tuple id rather than copying these labels optimistically. If the selected tuple changes, all unexecuted work becomes stale and must be regenerated or explicitly requalified.

## Recommended Architecture

### System Overview

```text
OFFLINE AUTHORING / RESEARCH CONTROL PLANE — never deployed as product backend

  Measurement freeze      Human/model intake        Independent oracle packages
  budgets + gates          untrusted source          structured | search | synthesis
          |                       |                           |
          +-----------------------+---------------------------+
                                  v
                       Candidate Factory + Provenance DAG
                        immutable source/build/fingerprint
                                  |
                                  v
                     Deterministic Search-Node Ledger
                    fixed work units, preassigned node ids
                                  |
                                  v
                   League Coordinator + Payoff Matrix
                  population snapshots -> meta-solver -> targets
                                  |
                                  v
         Lab runtime bridge -> existing supervised providers -> MATCH_KERNEL
                  hostile source boundary                 sole transitions
                                  |
                                  v
                Lab Trace / Metrics / Replay-Review Bundles
                                  |
                   +--------------+---------------+
                   |                              |
                   v                              v
          Open development store        Sealed Holdout Evaluator
          graph, ledgers, matrix         private arenas/opponents
                                                  |
                                                  v
                                      one-shot signed evaluation receipt

CURRENT-PROFILE-ONLY PROMOTION BRIDGE

  frozen current finalist source hash
          -> ordinary canonical revision admission
          -> runtime-service certification
          -> canonical Chronicle + replay
          -> Go/persistence/E2E proof

EXPERIMENTAL PROFILES

  lab artifacts -> causal decision packet -> later milestone input only
  [no canonical registration, persistence, counted scheduling, or public read]
```

### Package and Process Boundaries

```text
packages/
├── strategy-lab/
│   └── src/
│       ├── contracts/             # strict lab-only schemas and tagged ids
│       ├── identity/              # canonical encoding and domain-separated hashes
│       ├── factory/               # candidate nodes, edges, validation, fingerprints
│       ├── ledger/                # deterministic work scheduler and ledger shards
│       ├── league/                # populations, payoff cells, meta-distributions
│       ├── profiles/              # current identity profile; post-freeze lab adapter
│       ├── traces/                # non-Chronicle LabTraceEnvelope and metrics
│       ├── equal-compute/         # allocation and consumption auditors
│       └── decision/              # causal report and decision-packet builder
├── strategy-oracle-structured/
│   └── src/                       # hierarchical planner / optimizer implementation
├── strategy-oracle-search/
│   └── src/                       # high-level search teacher and distillation
└── strategy-oracle-synthesis/
    └── src/                       # explicit-program model-assisted search

apps/
├── strategy-lab/
│   └── src/
│       ├── cli.ts                 # one-command coordinator
│       ├── artifact-store.ts      # content-addressed open/restricted evidence
│       ├── runtime-bridge.ts      # existing provider/supervisor invocation
│       ├── league-worker.ts       # deterministic matchup work
│       └── red-team-intake.ts     # quarantine and immutable attempt records
└── strategy-holdout/
    └── src/
        ├── evaluator.ts           # separate process and filesystem role
        ├── commitment.ts          # sealed-manifest commitment verification
        └── receipt.ts             # aggregate/private result receipt

scripts/
├── check-v1-38-lab-boundaries.ts
├── check-v1-38-oracle-independence.ts
├── check-v1-38-negative-reachability.ts
├── evaluate-v1-38-current-certification.ts
├── evaluate-v1-38-equal-compute.ts
└── evaluate-v1-38-final-proof.ts
```

Use a small number of packages with hard import rules rather than a new service fleet. Separate oracle packages are justified because implementation independence is an experimental variable. They may depend on `@cowards/strategy-lab` contracts and a narrow allowlist of literal geometry/legality helpers, but they must not depend on each other or import a shared activation selector, mission selector, Action scorer, search tree, or learned parameter set.

The coordinator and holdout evaluator must be different executable packages or independently permissioned processes. The coordinator must not have read access to sealed holdout preimages. The evaluator receives frozen population roots and candidate blobs, evaluates them using the same kernel/runtime bridge, and returns a bounded receipt. A TypeScript module boundary alone is not enough for a sealed holdout.

## New Versus Modified Components

### New Components

| Component | Owns | Must not own |
|---|---|---|
| Lab contract/identity module | Strict schemas, tagged ids, canonical encoding, domain-separated hashes, evidence-class vocabulary | Production tuple, production rules, canonical registration |
| Candidate factory | Immutable candidate/source/build nodes, lineage edges, validation, behavior fingerprints | Match transitions or runtime penalties |
| Deterministic work scheduler | Search node ids, seeds, ordered reduction, candidate/search/Match budgets | Wall-clock-driven branching |
| Search-node ledger | Every attempted node and rejection/failure, chained immutable shards, consumption totals | Mutable “latest candidate” rows |
| Oracle adapters | One bounded mechanism per independent family | Shared global selector/scorer |
| League coordinator | Frozen populations, complete payoff matrix, meta-distribution, target sets, response-round close | Strategy execution or hidden-state Action choice |
| Red-team intake | Quarantine, model/human provenance, exact budgets, failed and successful attacks | Direct import into canonical Workshop or competition |
| Lab runtime bridge | Converts kernel effect requests to existing supervised provider calls | Web/API/Go execution; gameplay classification |
| Lab trace recorder | Wraps kernel recorder material with lab profile and experiment identity | Canonical Chronicle identity |
| Holdout custodian/evaluator | Sealed preimages, one-shot evaluation, release receipt | Candidate tuning, oracle development, public DTO projection |
| Formation profile adapter | Position-only initial-state transformation after current freeze | Rule, arena, cap, MOVE, Backstab, timing, runtime, or Set changes |
| Equal-compute auditor | Compares allocations and actual deterministic work consumption across profiles | Post-result budget adjustment |
| Current-only promotion bridge | Exact source-hash join from a current-profile finalist to ordinary canonical revision admission | Experimental-profile promotion |
| Decision packet builder | Causal comparison, locked gates, result, limitations, later-milestone recommendation | Production activation |

### Existing Components That Remain Unchanged

| Existing component | Required non-change |
|---|---|
| `@cowards/spec` canonical tuple and current selector | No experiment/profile field or new current version |
| `@cowards/engine` rules and `createInitialGameState` facade | No alternate production start and no profile dispatch |
| `MATCH_KERNEL.stepMatch` | Reused exactly; no copied Phase/Round/Activation/Cycle/Contraction logic |
| Canonical arena catalog | No inward/bracket entries and no nonempty `arenaOwnedSetup` |
| Canonical four-condition Set policy | No experimental scenario type in counted scheduling |
| runtime-service Match request schemas | No lab profile or holdout request path |
| Go backend and job lifecycle | No lab coordinator, profile switch, or evaluator route |
| Production persistence schema | No experimental Match, Chronicle, evidence, standings, or public rows |
| Canonical Chronicle recorder/validator | Does not accept `LabTraceEnvelope` |
| Public service and web DTOs | No candidate source, lab ids, sealed ids, or private evaluator fields |

### Existing Components Modified Only for Proof

| Component | Permitted modification |
|---|---|
| Workspace/package manifests | Register offline packages; exclude them from production dependency and image graphs |
| Boundary monitors | Add negative import, route, schema, persistence, public-output, and deployment checks |
| Test utilities | Add current-path trace-equivalence fixtures and profile-diff assertions |
| Runtime provider packages | Expose an offline invocation adapter only if the existing public adapter cannot be reused; do not change execution semantics |
| Proof scripts | Bind v1.37 release identity, lab roots, current certification receipts, equal-compute receipts, holdout receipt, and decision packet |

No engine change is required for the formation experiment. The lab can use the already exported `MATCH_KERNEL.createMachineV119` and `MATCH_KERNEL.stepMatch`. If implementation discovers a typing inconvenience, solve it in the lab package with an inferred adapter type; do not add a general `runMatchFromArbitraryInitialState` production export. That would recreate the stale alternate-entry risk v1.37 removed.

## Artifact and Identity Model

All machine-readable manifests should be strict, canonical-JSON encodable, content-addressed, and immutable. Reuse the existing canonical JSON and domain-framed SHA-256 utilities. Adopt the provenance shape of subject, build definition, resolved inputs, builder/run identity, and byproducts; do not claim SLSA certification.

Timestamps, elapsed time, host paths, and log locations are operational metadata and must not participate in deterministic ids. Git commit, selected tuple id, runtime/toolchain identity, source bytes, configuration, deterministic seeds, and work-unit budgets do participate.

### Required Artifacts

| Artifact | Identity binds | Key references |
|---|---|---|
| `MeasurementContractManifestV1` | selected v1.37 tuple, scoring, conditions, metrics, gates, split policy, holdout commitment, all budget schemas | predecessor release proof |
| `ComputeBudgetManifestV1` | candidate counts, search nodes, response iterations, Match cells, model/prompt/token budget, human procedure, replay review, runtime caps, hardware class | measurement contract |
| `CandidateBuildManifestV1` | build type, factory commit, oracle version, external/internal parameters, resolved source/material hashes, deterministic seed | oracle run |
| `CandidateNodeV1` | exact source identity, compatibility, build manifest, doctrine/oracle family, parent-edge root | source blob, validation |
| `CandidateEdgeV1` | child, parent(s), relation, target population/mixture, teacher or submission provenance | candidate nodes |
| `BehaviorFingerprintV1` | fixed probe-suite id, ordered Chronicle-derived feature vector, invariance results | candidate id |
| `SearchRunManifestV1` | oracle, target mixture/pure targets, budget, deterministic scheduler version | frozen population |
| `SearchLedgerShardV1` | previous shard hash, ordered node attempts, consumption deltas | search run |
| `PopulationManifestV1` | sorted candidate ids, evidence class, profile id, generation/round | prior population |
| `PayoffCellV1` | profile, two candidates, arena/scenario, explicit side/initiative condition, seed, tuple, runtime, trace root | lab Match result |
| `PayoffMatrixManifestV1` | sorted complete cell ids, missing/failure policy, matrix dimensions | population |
| `MetaDistributionV1` | matrix root, solver version/config, exact rational or canonical numeric weights | league round |
| `LeagueRoundManifestV1` | input population, matrix, meta-distribution, oracle targets/budgets, accepted/rejected responses | next population |
| `RedTeamAttemptV1` | channel, author/model/prompt/tool identity, budget, frozen target, submitted source, validation/result | current/profile freeze |
| `FreezeManifestV1` | immutable root set, thresholds, population, ledgers, matrices, red-team closure, unconsumed exceptions | prior freeze |
| `InitialStateProfileManifestV1` | exact starting positions/facing, canonical parent tuple, evidence class, current-freeze prerequisite | formation experiment |
| `HoldoutCommitmentV1` | secret-salted commitment to private arena/opponent/schedule manifests and evaluator version | measurement contract |
| `HoldoutEvaluationReceiptV1` | all frozen profile roots, commitment verification, one open event, aggregate/private result roots | decision packet |
| `CurrentFinalistPromotionReceiptV1` | current profile id, candidate/source hash, canonical revision id/source hash, service/runtime/Chronicle proof roots | current freeze |
| `DecisionPacketV1` | experiment manifest, equal-compute audit, profile freezes, holdout receipt, causal report, pass/reject result | milestone audit |

### Candidate and Lineage Graph

Do not extend the canonical `StrategyArtifactKind` union with `lab-candidate`. Define a separate closed `LabCandidateNode`:

```typescript
interface LabCandidateNodeV1 {
  schemaVersion: "strategy-lab-candidate-v1"
  evidenceClass: "lab-development" | "lab-frozen"
  candidateId: `candidate:sha256:${string}`
  source: {
    originalSha256: `sha256:${string}`
    normalizedSha256: `sha256:${string}`
    bytes: number
    language: "typescript" | "python" | "rust" | "zig"
  }
  compatibility: {
    semanticTupleId: `sha256:${string}`
    runtimeProfileId: string
  }
  doctrineFamily: string
  oracleFamily: string
  buildManifestId: `build:sha256:${string}`
  parentEdgeRoot: `graph-root:sha256:${string}`
  validationArtifactId: `validation:sha256:${string}`
  behaviorFingerprintId?: `fingerprint:sha256:${string}`
}
```

Keep edges as separate immutable artifacts. Relations should be explicit: `seeded_from`, `mutated_from`, `distilled_from`, `best_response_to_mixture`, `best_response_to_pure`, `human_submission`, `model_synthesis`, and `promoted_as_current_revision`. A node is never edited to add a child.

### Deterministic Search-Node Ledger

The search ledger is the reproducibility spine, not a debug log.

- Preassign every work item a monotonically ordered `nodeOrdinal`.
- Derive its seed from `(searchRunId, nodeOrdinal, oracleFamily)`; never from time, worker id, or completion order.
- Derive `searchNodeId` from the run id, ordinal, parent ids, and proposal/preimage hash.
- Dispatch nodes in parallel, but reduce results in `nodeOrdinal` order.
- Record accepted, rejected, clone, invalid, runtime violation, system failure, and budget-exhausted outcomes. Preserve failed attempts.
- Precommit whether system failures consume the deterministic budget; the recommended rule is that attempted work consumes budget while retry is governed by a separate fixed retry allowance.
- Chain ledger shards with `previousShardHash` and close each run with a root plus consumed-unit totals.
- Make rerun comparison byte- or canonical-hash-based. Wall time may be reported, but cannot choose branches or stop the search.

This prevents a faster worker, process race, or lucky crash from changing the candidate population.

### Payoff Matrix and League State

One payoff cell represents one exact deterministic condition. It must bind:

- current or experimental profile id;
- candidate A and candidate B ids;
- arena semantic geometry hash;
- both entrant assignments;
- explicit initial-initiative assignment;
- deterministic seed/scenario identity;
- selected semantic tuple id;
- runtime profile and source/artifact identities;
- outcome/Set points;
- lab trace root and diagnostic metric root.

System failure is not a draw or player loss. A matrix with a missing or system-failed required cell is incomplete. Duplicate cell identities with different results are an integrity failure.

Close each PSRO/double-oracle iteration as a snapshot:

```text
Population N
  -> complete matrix N
  -> meta-distribution N
  -> frozen oracle target/budget manifests
  -> candidate attempts and validation
  -> accepted novel positive responses
  -> Population N+1
```

Do not mutate the population while response workers are still evaluating it. The robust pure finalist selection is a separate artifact over a frozen matrix; the meta-distribution remains diagnostic/training evidence and is not a deployable entrant.

## Initial-State Profile Boundary

### Profile Contract

Profiles are separate lab manifests, not rules, arenas, or compatibility tuples.

```typescript
type InitialStateProfileV1 =
  | {
      id: "profile:current-edge-rank:v1"
      evidenceClass: "canonical-current"
      prerequisiteCurrentFreezeId: string
      starts: CanonicalCurrentStarts
    }
  | {
      id:
        | "profile:lab-inward-rank:v1"
        | "profile:lab-bracket-shield:v1"
      evidenceClass: "lab-experimental"
      registerable: false
      countable: false
      public: false
      prerequisiteCurrentFreezeId: string
      starts: ExplicitStartingSoldiers
    }
```

The schema contains only start positions and the existing inward facings. It has no fields for Cycle cap, Actions, MOVE, reversal, Backstab geometry, Backstab timing, activation counts, arenas, runtime, or Set policy. Absence is a causal control and a security boundary.

| Profile | Top starts, facing DOWN | Bottom starts, facing UP |
|---|---|---|
| Current edge rank | `y=0, x=2..9` | `y=11, x=2..9` |
| Inward-rank control | `y=1, x=2..9` | `y=10, x=2..9` |
| Edge-anchored bracket | `y=0, x={2,3,8,9}` and `y=1, x={4,5,6,7}` | `y=11, x={2,3,8,9}` and `y=10, x={4,5,6,7}` |

### Adapter Algorithm

1. Verify the referenced current-rules `FreezeManifestV1`. Refuse to materialize any experimental profile without it.
2. Call `MATCH_KERNEL.createMachineV119` with ordinary current inputs. The returned machine must be at `match_start`, ordinal zero, with no events or pending effects.
3. For the current profile, return the machine unchanged.
4. For an experimental profile, clone only the GameState/Soldier structures and replace the 16 starting positions according to the strict profile manifest.
5. Prove that all other fields are equal: tuple, versions, players, Strategy Revision ids, Soldier ids/status/facing/reversal history/memory, initiative, bounds, terrain, arena, Phase, Round, activation count, seed, and outcome.
6. Validate unique occupancy, bounds, terrain non-overlap, eight ACTIVE Soldiers per side, exact profile positions, and ordinary `validateCanonicalGameState` semantics.
7. Replace both `machine.state` and `machine.initialState` with the same frozen adapted state. Do not add a transition or pretend the adapter is gameplay.
8. Advance exclusively through `MATCH_KERNEL.stepMatch` with a generic effect pump. Do not call movement, activation, Backstab, contraction, or outcome helpers directly.
9. Wrap recorder material in `LabTraceEnvelopeV1` containing the profile, experiment, population, and Match-cell identities.
10. Never pass an experimental result to `recordChronicleFromExecution`, runtime-service Match completion, canonical persistence, Go completion, standings, or public replay projection.

The effect pump is orchestration around the engine-owned step function; it must contain no Phase/Round/Cycle logic. A current-profile equivalence test must compare its transition root, final state, events, observations, and memory with `runVersionedMatchV119` over a fixed corpus. This is the proof that v1.38 did not create a second engine.

## Runtime and Strategy Execution Boundary

Candidate source is hostile even when the factory produced it.

```text
Oracle/author/model emits source bytes
        |
        v
Quarantine + exact identity + source/package validation
        |
        v
Existing runtime provider / supervisor process
        |
 canonical request/result envelope
        |
        v
Lab runtime bridge -> MATCH_KERNEL effect request/resume
```

The lab coordinator may run trusted teacher/search code as offline tooling, including privileged counterfactual scoring, but an emitted deployable decision must reproduce using only legal `StrategyInput` or `SoldierBrainInput`, objective, and memory. Privileged teacher state is provenance metadata, never an extra runtime input.

Do not use the production HTTP Match endpoint as the 500,000-Match inner loop. Reuse provider/supervisor adapters directly in the offline process boundary, with the same raw ABI, canonical JSON, source limits, output limits, timeout/resource classifications, and no-capability posture. Final current-profile candidates then pay the ordinary runtime-service path to prove the optimization harness did not hide service/runtime drift.

No Strategy source executes in web, API, or Go. Models and networks may be used only in offline authoring workers; no model, network, clock, filesystem, or external service is available to Strategy code during a Match.

## Red-Team Intake

Human and model attacks enter a quarantine boundary, not the canonical Workshop/API.

1. Intake records channel, authorization, exact target freeze, rules/API bundle, disclosed source/replays, model/provider/version, prompt hash, token/tool budget, human procedure, and submission time as provenance.
2. Source is stored as an immutable blob and receives a lab candidate id only after strict validation.
3. The same legality, hostile-runtime, behavior-fingerprint, clone, and response-gain gates apply to every channel.
4. Failed, invalid, duplicate, timing-out, and negative attacks remain in the ledger.
5. Red-team authors and models never receive sealed holdout contents or evaluator diagnostics.
6. A successful attack becomes an oracle response against the next frozen development population; it does not silently replace a finalist.

Independence evidence should include dependency/import graphs, shared-helper allowlist checks, source-structure distance, behavior distance on a fixed probe suite, and a written doctrine/core-algorithm explanation. Different prompts against one shared selector are not independent oracles.

## Sealed Holdout Architecture

The holdout is a trust boundary, not merely a hidden folder name.

### Roles

| Role | Can read | Can write |
|---|---|---|
| Lab coordinator | design/validation data, holdout commitment, frozen receipt | development artifacts and freeze requests |
| Holdout custodian | private arena/opponent/schedule preimages, frozen candidate blobs | sealed evaluation records |
| Holdout evaluator process | one requested frozen population set and private preimages | bounded receipt/output root |
| Report builder | released aggregate receipt and approved safe metrics | decision packet |
| Product services | none of the above | none of the above |

Commit a secret-salted or keyed commitment to the exact private manifest before tuning; a bare hash of a small enumerable arena/opponent set may reveal the preimage. The secret/salt stays with the custodian. The committed artifact contains the commitment, schema/evaluator version, split cardinalities, allowed metric projection, and open policy.

The open request must bind all three frozen profile population roots, all budgets, all thresholds, and the common evaluation schedule. The evaluator opens the common holdout once for the batch, not once per profile. Its receipt records commitment verification, request root, evaluator/runtime/kernel identities, result roots, disclosed aggregate metrics, and `openOrdinal: 1`. A second open against the same holdout is a hard failure unless a separately approved protocol explicitly supports it.

After disclosure, no candidate, threshold, metric definition, report interpretation, or profile budget may change. If the run is invalidated, create a new holdout version and new milestone decision; do not “reseal” disclosed material.

Private holdout opponent source, arena preimages, raw evaluator traces, StrategyMemory, SoldierMemory, objectives, model prompts, private diagnostics, and host/runtime details are never emitted in public/default artifacts. The committed repository may contain commitments and safe receipts; sealed preimages belong in an access-controlled untracked volume or external secret store.

## Data Flows

### Flow 1 — Measurement Freeze

```text
v1.37 annotated tag + post-tag proof
  -> selected semantic tuple and regression matrix reproduced
  -> metrics/gates/splits/budgets/retry policy fixed
  -> holdout custodian creates commitment
  -> MeasurementContractManifestV1 frozen
```

Do not begin candidate tuning until the measurement contract root exists.

### Flow 2 — Candidate Creation

```text
frozen oracle run input
  -> deterministic work-node proposal
  -> source/build provenance blob
  -> validation and supervised runtime probes
  -> fixed behavior fingerprint/invariance suite
  -> immutable candidate node + edge
  -> accepted/rejected ledger entry
```

Source validation is necessary but not sufficient. A candidate joins a league population only when it is legal, deterministic, runtime-valid, novel in source and behavior, and positive on untouched validation conditions.

### Flow 3 — Current-Rules League

```text
current canonical profile
  -> complete four-condition, multi-arena payoff matrix
  -> meta-distribution + strongest pure targets
  -> independent response runs
  -> accepted candidates
  -> repeat for precommitted rounds/budget
  -> current red team
  -> current population + finalist freeze
```

The current edge-rank profile uses canonical starts and must be trace-equivalent to ordinary execution. Current league evidence freezes before alternate profile source/manifests exist.

### Flow 4 — Current Finalist Certification

```text
frozen current candidate source hash
  -> ordinary revision validation/admission
  -> exact source-hash join
  -> runtime-service supported-language execution
  -> canonical Chronicle semantic/reconstruction validation
  -> Go completion/persistence/replay/privacy/E2E
  -> CurrentFinalistPromotionReceiptV1
```

The lab candidate is not converted in place. Canonical admission creates a separate immutable revision through existing rules. The receipt proves byte identity between them.

### Flow 5 — Equal-Compute Formation Experiment

```text
current league freeze
  -> formation experiment manifest
  -> fork identical frozen seed population into 3 namespaces
       current / inward / bracket
  -> allocate identical deterministic budget vectors
  -> independently retrain and run response oracles
  -> identical human/model attack procedure
  -> close ledgers and audit actual consumption
  -> freeze all 3 populations
```

Warm-starting is allowed only from the same frozen source snapshot. Candidates discovered in one branch do not leak into another branch during training. If a common later seed is desired, it must be precommitted and applied symmetrically.

### Flow 6 — One-Shot Holdout and Decision

```text
3 frozen profile roots + locked thresholds
  -> one holdout open request
  -> same private schedule for all profiles
  -> signed/hashed evaluation receipt
  -> causal comparison and gate evaluation
  -> DecisionPacketV1: reject | eligible_for_later_consideration
```

There is no `ship` decision in the v1.38 packet. A passing bracket sets `productionAuthorization: false` and becomes input to a later approved rules milestone.

## Equal-Compute Controls

“Equal compute” must be represented as deterministic work, not equal elapsed time.

| Budget dimension | Required control |
|---|---|
| Doctrine/oracle families | Same eligible families and versions per profile |
| Candidate creation | Same attempted candidate and accepted-candidate ceilings |
| Search | Same node counts, depth/beam limits, retry allowance, seed derivation |
| League | Same response rounds, target rules, matrix completeness, Match cells |
| Model | Same model/version class, prompt family, token/tool limits, attempt count |
| Human | Same written procedure, access, time envelope, attempt/review count |
| Runtime | Same source/output/memory/call limits and provider profiles |
| Scenario | Same arenas, sides, initiatives, base seeds, split policy |
| Holdout | Same unopened batch and schedule |
| Replay review | Same sampled trace count and reviewer procedure |
| Hardware | Same declared class; differences reported but not used for branching |

The allocation auditor runs before any profile branch. The consumption auditor runs before population freeze and fails on overuse, underuse that could advantage one branch, missing cells, asymmetric retries, or unrecorded work. If one profile cannot consume its allocation for a principled reason, the comparison is incomplete; do not silently redistribute budget.

## Replay and Evidence Integration

Current-profile certification uses the canonical path unchanged. Experimental evidence does not.

| Evidence | Recorder | Store | Viewer/reviewer | Eligible for product |
|---|---|---|---|---|
| Canonical current finalist certification | `@cowards/replay` Chronicle recorder | normal canonical persistence through Go | existing replay validation/viewer | Yes, only after ordinary eligibility |
| Current-profile development Match | `LabTraceEnvelopeV1` over kernel recorder material | lab artifact store | offline lab reviewer | No |
| Inward/bracket Match | `LabTraceEnvelopeV1` | lab artifact store | offline lab reviewer | No |
| Sealed holdout raw trace | private evaluator envelope | sealed store | authorized evaluator only | No |
| Decision summary | safe aggregate packet | committed proof artifacts | planning/audit consumers | Later-milestone input only |

The lab trace must preserve enough information to reproduce state/event/observation/memory hashes and render a private replay-review bundle. It must have a distinct schema/media type and include `evidenceClass: "lab-only"`. It must not satisfy `ChronicleSchema`, `RecordChronicleFromExecutionInput`, or any canonical persistence interface.

Public-safe projections may report aggregate pass/fail, response gap, interaction metrics, and opaque artifact roots. They must omit source, artifacts, memories, objectives, raw observations, sealed identities/preimages, private evaluator state, raw diagnostics, host details, credentials, and security internals.

## Trust Boundaries

| Boundary | Untrusted/private input | Enforcement | Allowed output |
|---|---|---|---|
| Human/model -> intake | source, prompts, attachments, tool output | quarantine, strict schemas, exact hashing, provenance, no execution | immutable attempt blob |
| Candidate -> runtime | hostile Strategy source/artifact | existing supervisor/provider restrictions, canonical raw ABI, limits | three-way invocation result |
| Runtime -> kernel | result envelope | schema/identity/budget verification | success, player violation, or system failure |
| Kernel -> lab evidence | states/events/private memory | recorder hashing and lab wrapper | content-addressed lab trace |
| Oracle -> league | candidate and claimed response gain | validation split, clone tests, complete cells | accepted/rejected response artifact |
| Coordinator -> holdout | frozen roots and open request | separate role/process, commitment check, one-open policy | bounded receipt |
| Lab -> canonical revision | current candidate source | current-profile-only predicate, exact source hash, ordinary admission | canonical revision + promotion receipt |
| Lab -> product/public | aggregate claims | safe packet schema and privacy scan | no raw/private lab data |

Runtime system failure never becomes a Match loss or payoff. The league records it as incomplete evidence and applies the precommitted retry/budget policy.

## Negative-Reachability Proof

The milestone needs executable proof of absence, not only labels.

| Forbidden destination | Structural proof | Dynamic/mutation proof |
|---|---|---|
| Canonical Strategy registration | Canonical `StrategyArtifactKind` remains closed and contains no lab kind; production packages do not depend on `@cowards/strategy-lab` | Attempt to pass a lab candidate/profile through revision admission; reject. Current-only promotion succeeds only with canonical profile and exact source hash |
| Canonical initial state | `CreateInitialGameStateInputV119` and engine facade remain profile-free; no new arbitrary-state public runner | Inject `initialStateProfile`; strict request schemas reject; canonical start fixture hashes remain unchanged |
| Arena registration | Catalog retains empty `arenaOwnedSetup` and only released canonical ids | Attempt inward/bracket as arena/setup; parse/admission fails |
| Counted scheduling | Four-condition Set schema remains profile-free; Go/TS schedulers import no lab code | Add a profile field or lab id to a counted request; strict admission and claim gates reject |
| Canonical persistence | Production migrations/repositories have no lab evidence type/table/column; lab app cannot import `@cowards/persistence` | Attempt lab trace/decision packet at Match/Chronicle completion; reject before write |
| Canonical Chronicle/replay | `LabTraceEnvelopeV1` is not a Chronicle and canonical recorder has no profile metadata | Feed lab envelope to Chronicle validation/store; fail closed |
| Runtime-service Match endpoint | Request/receipt schemas remain current canonical shapes | Submit experimental profile field; fail schema/identity admission |
| Go backend | no lab package, route, request field, generated authority, or job kind | route inventory and Go tests prove no lab dispatch |
| Public/default reads | DTO/OpenAPI hashes unchanged for execution/replay; no lab fields | privacy scanner seeds source, memory, objective, holdout, evaluator, and lab-id markers and finds none |
| Production deployment | lab apps absent from production Docker/compose/image/route manifests | topology test proves product runs with lab packages unavailable |
| Rule combinations | profile schema contains positions/facing only | mutation attempts to change cap, MOVE, Backstab, timing, arenas, or runtime are rejected; full non-position state diff is zero |
| Pre-freeze formation work | experimental manifest requires a valid current freeze id | materialization before current freeze fails deterministically |

The import monitor should allow `@cowards/strategy-lab` only from offline lab apps, oracle packages, dedicated proof scripts, and tests. It should fail if the dependency appears in `apps/web`, `apps/go-backend`, `apps/runtime-service` Match handling, `apps/worker`, `packages/persistence`, `packages/service`, canonical `packages/spec` authorities, canonical `packages/replay` admission, or production package manifests.

## Rollback and Invalidations

The architecture should make rollback mostly deletion of offline capability, not a semantic migration.

- Disabling/removing the lab apps and oracle packages must leave the selected semantic authority, engine outputs, runtime-service requests, Go behavior, database schema, public DTOs, and historical evidence unchanged.
- Open lab artifacts are immutable. Correct mistakes with an append-only invalidation/supersession artifact, never by editing ledgers, matrices, freezes, or receipts.
- A canonical current finalist revision remains immutable if later disqualified. Existing governance can mark it ineligible or exclude future entry without deleting its source/evidence.
- Experimental candidates have no product state to roll back because they never cross the promotion boundary.
- A disclosed holdout cannot be rolled back to “sealed.” Invalidate the receipt, create a new holdout version/commitment, and rerun only under a separately approved protocol.
- Freeze manifests must name exact predecessor roots. A stale tuple, code commit, oracle implementation, metric, threshold, budget, or holdout commitment creates a new branch, not an in-place refresh.

The rollback proof compares pre/post lab-disable hashes for the current semantic authority source, canonical tuple registry, arena catalog, Set policy, runtime-service request schemas, Go authority projection, production migrations, Chronicle admission, and public DTO/OpenAPI artifacts.

## Architectural Patterns

### Pattern 1: Functional Core, Offline Control Plane

The engine owns transitions; the lab owns experiments and orchestration. The lab sends runtime results to the same pure step function and records outputs as evidence.

**Trade-off:** A small effect pump is duplicated outside the normal runner, but no gameplay scheduler or resolver is. Current-profile transition-root equivalence makes the boundary auditable.

### Pattern 2: Content-Addressed Append-Only Experiment State

Every candidate, edge, ledger shard, population, matrix, distribution, freeze, and receipt is a new immutable artifact. “Current” is a pointer in a run manifest, not an updated row.

**Trade-off:** More artifacts and joins, but exact reproduction, branching, review, and invalidation become tractable.

### Pattern 3: Frozen-Snapshot PSRO

Response oracles target one frozen population/matrix/meta-distribution. Accepted responses form the next snapshot only after the round closes.

**Trade-off:** Less opportunistic asynchronous speed, but no target drift and a defensible empirical game.

### Pattern 4: Deterministic Work Units

Candidate, node, Match, prompt/token, and human-procedure budgets are primary. Wall time is diagnostic.

**Trade-off:** Requires explicit scheduling and ordered reduction; avoids hardware/race-driven experimental bias.

### Pattern 5: Evidence-Class Types

`lab-development`, `lab-frozen`, `canonical-current-certification`, and `public-safe-summary` are different strict schemas, not a mutable boolean on one universal record.

**Trade-off:** Conversion code is explicit. That friction is the desired safety property.

### Pattern 6: Separate Holdout Custodian

The iterative lab sees a commitment, not private contents. The custodian evaluates all frozen profiles in one batch and returns a bounded receipt.

**Trade-off:** More operational setup; materially stronger protection against adaptive tuning.

### Pattern 7: One-Way Current-Only Promotion

Promotion re-admits exact source through the ordinary pipeline and records a hash join. No lab metadata widens canonical execution contracts.

**Trade-off:** Duplicate artifact records by design; avoids a generic lab-to-production conversion path.

## Anti-Patterns

### Optional Profile Field on Production Match Inputs

An optional field defaults safely today and becomes a production switch tomorrow. Keep production request schemas closed.

### Encoding Formation as an Arena

Arena geometry owns bounds and terrain. Soldier start placement is not arena geometry, and the current catalog deliberately has empty `arenaOwnedSetup`.

### A Forked or Parameterized Second Engine

Do not copy `state.ts`, `match.ts`, movement, Backstab, contraction, or outcome logic into the lab. Do not add experimental branches inside canonical transitions.

### Canonical Chronicles for Experimental Starts

The current tuple and Chronicle identities denote canonical evidence. Wrapping an experimental start in them would contaminate replay and persistence semantics.

### One Shared “Independent” Scorer

Different parameter sets or prompts over one selector/Action scorer are not materially independent response mechanisms.

### Mutable Candidate/League Rows

Updating lineage, scores, fingerprints, or population membership destroys the exact target each oracle faced.

### Completion-Order Search

Accepting the first worker result or stopping on elapsed time makes the candidate field hardware- and race-dependent.

### Holdout Feedback to the Factory

Even aggregate repeated feedback can become a tuning signal. The common holdout opens once after every profile freezes.

### Fixed-Agent Formation Comparison

Current Strategies transferred unchanged can screen a profile but cannot be final balance evidence. Each profile requires equal adaptation.

### Automatic Production Promotion on “Pass”

A passing bracket produces only `eligible_for_later_consideration`; it never flips current selectors, rules, registration, or scheduling.

## Dependency-Correct Build Order

```text
0 Predecessor/release gate
  -> 1 Contracts, identity, proof skeleton, measurement freeze
  -> 2 Hierarchical planner feasibility spike
  -> 3 Factory, artifact store, runtime bridge, deterministic ledger
  -> 4 Independent oracle packages, fingerprinting, red-team intake
  -> 5 Current-rules PSRO league and response closure
  -> 6 Current league freeze + current-only production certification
  -> 7 Post-freeze formation adapter and negative-reachability proof
  -> 8 Equal-compute three-profile retraining and equal red teams
  -> 9 Three population freezes + one-shot sealed holdout
  -> 10 Causal decision packet, final privacy/boundary proof, audit/archive/tag
```

### Step 0 — Predecessor and Baseline Gate

- Verify v1.37 archive/tag/post-tag closure and exact selected tuple.
- Reproduce the current persisted matrix as a regression fixture.
- Verify the existing current-start trace, arena, Set, runtime, replay, persistence, privacy, and boundary proof.
- Stop and return defects to the integrity foundation; do not repair them in v1.38.

### Step 1 — Lab Contracts and Measurement Freeze

- Add lab-only schemas, identity domains, artifact-store contract, split vocabulary, retry/consumption rules, metrics, thresholds, and equal-compute vector.
- Create the holdout commitment through the separate custodian.
- Add negative import/deployment/public-schema monitors before lab execution exists.
- Freeze `MeasurementContractManifestV1`.

### Step 2 — Legal Hierarchical Planner Spike

- Prove full-board ordered assignment plus local 5x5 SoldierBrain feasibility.
- Prove source/objective/memory/runtime limits, deterministic node budgets, legal fallback, and hostile inputs.
- Stop if the controller cannot fit the contract; do not hide the issue in more compute.

### Step 3 — Reproducible Factory Substrate

- Implement source/build identities, candidate DAG, validation, behavior fingerprint, deterministic ledger, artifact store, and runtime bridge.
- Add one-command rerun and byte/root equality checks.
- Prove current-profile lab effect-pump equivalence to the canonical runner.

### Step 4 — Independent Response Mechanisms

- Implement structured optimizer, search teacher/distillation, and model-guided explicit-program synthesis in separate packages.
- Add human/external intake.
- Enforce shared-helper allowlist and source/behavior independence evidence.

### Step 5 — Serious Current-Rules League

- Build complete mirrored multi-arena matrices.
- Solve meta-distributions, target mixture and strongest pure policies, accept only legal/novel/positive responses, and iterate for the precommitted budget.
- Run the current-profile model/human red team and one final response closure.
- No alternate start profile code or manifest exists yet.

### Step 6 — Current Freeze and Certification

- Freeze current sources, population, matrices, distributions, ledgers, red-team attempts, thresholds, and holdout policy.
- Select portfolio and robust pure finalists.
- Admit exact finalist source through the ordinary canonical revision path and certify runtime-service, Chronicle, persistence, replay, privacy, and E2E.
- Only a valid `CurrentLeagueFreezeManifestV1` unlocks Step 7.

### Step 7 — Formation Boundary

- Implement the current/inward/bracket profile manifests and position-only adapter.
- Prove unchanged non-position state and unchanged transition code.
- Prove every negative destination rejects experimental artifacts.

### Step 8 — Equal-Compute Training

- Fork identical seed population roots into three namespaces.
- Allocate identical deterministic budgets and retrain independently.
- Run equal model/human attacks, feed permitted development counters back through the same response policy, audit actual consumption, and close each branch.

### Step 9 — Freeze and Holdout

- Freeze all three populations before any holdout access.
- Send one batch request to the custodian.
- Open the common holdout once, verify the receipt, and prohibit further tuning.

### Step 10 — Decision and Closure

- Produce the causal comparison, explicit gate outcomes, limitations, accepted/rejected profile decision, and later-milestone-only packet.
- Run full privacy, information-boundary, independence, determinism, negative reachability, rollback, and public-surface scans.
- Audit, archive, and tag without changing production rules.

## Scaling Considerations

This milestone scales by Match and artifact count, not by public users.

| Pressure | First response | Do not do |
|---|---|---|
| Quadratic payoff matrix growth | Content-addressed cells, evaluate only missing cells for a newly appended policy, deterministic sharding | Approximate away required complete cells silently |
| Runtime invocation overhead | Long-lived supervised provider workers or bounded batches with exact per-call resets | Execute source in coordinator/web/Go |
| Parallel search | Preassigned node ids/seeds and ordered reduction | Completion-order acceptance |
| Ledger volume | Immutable compressed shards plus index/root manifests | Mutable SQL row per “current” candidate |
| Trace volume | Retain full traces for required/review samples; content-dedupe and retain hashes/metrics by policy | Drop failed attacks or holdout evidence |
| Holdout secrecy | Separate role, volume, commitment, and bounded receipt | Shared repository directory or module-only hiding |

The first bottleneck is likely search-heavy Strategy runtime, not the pure kernel. Measure it in the planner spike before fixing the full Match budget. The next bottleneck is the complete matrix as population size grows; reuse exact cells because deterministic candidate/profile/condition identities make caching safe.

## Verification Architecture

| Proof layer | Required evidence |
|---|---|
| Identity | canonical re-encoding, domain separation, hash vectors, strict unknown-field rejection |
| Factory | source/build reproduction, immutable lineage, complete failed-attempt ledger |
| Determinism | repeated search-run roots, worker-count invariance, ordered-reduction mutation tests |
| Oracle independence | import graph, shared-helper allowlist, source-structure and behavior distance |
| Kernel | current profile equality with canonical runner; no copied transition logic |
| Runtime | hostile source isolation, three-way failure semantics, no system-failure payoff |
| League | complete cells, population snapshot closure, meta-solver reproduction, response acceptance |
| Freeze | all referenced roots exist and are closed; no post-freeze writes |
| Formation | exact position-only diff, current-freeze prerequisite, no combined rule field |
| Equal compute | allocation and actual-consumption equality across three branches |
| Holdout | commitment verification, separate role, one batch open, no post-open tuning |
| Current certification | exact source join through runtime-service, canonical Chronicle/replay/persistence/E2E |
| Negative reachability | registration, initial state, arena, scheduling, persistence, Chronicle, runtime-service, Go, public, deployment rejection |
| Privacy | source, artifacts, memories, objectives, holdout/evaluator data, diagnostics, host/security markers absent from public/default outputs |
| Rollback | canonical authority, schemas, DB, Go, replay, DTO, and product topology hashes unchanged when lab is disabled |

## Research Flags for Planning

- **Planner/runtime feasibility:** needs a spike before committing full compute budgets.
- **Deterministic parallel search:** needs design-level tests; ordinary seeded randomness is insufficient if reduction depends on worker completion.
- **Oracle independence:** needs explicit acceptance criteria before implementations share utilities.
- **Holdout custody:** needs an operational decision about the private volume/key/role before the measurement contract can freeze.
- **Lab replay review:** needs a narrow private viewer/bundle decision without widening canonical Chronicle admission.
- **Current finalist promotion:** needs exact source-identity join design, but should reuse ordinary revision admission rather than add a lab artifact kind.
- **Formation adapter:** high-risk boundary; implement only after the current freeze and pair it with negative reachability tests in the same phase.

## Sources

### Primary Repository Evidence — HIGH Confidence

- `.planning/PROJECT.md`
- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md`
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`
- `.planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md`
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/{PROPOSAL,REQUIREMENTS,ROADMAP}.md`
- `.planning/milestones/v1.37-{REQUIREMENTS,ROADMAP,MILESTONE-AUDIT}.md`
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- Current code, especially:
  - `packages/spec/src/{integrity-authority,current-semantic-authority-source,arena-catalog-v1-37,set-condition-policy-v1-37,types}.ts`
  - `packages/engine/src/{state,versioned-match,kernel/create-initial-state,kernel/driver,kernel/step,kernel/validate,kernel/types}.ts`
  - `packages/replay/src/{record,validate,reconstruct,project}.ts`
  - `packages/persistence/src/{repositories,matchset-service,competition,chronicle-store,semantic-authority-selection-head}.ts`
  - `apps/runtime-service/src/{execute-match,server,runtime-config,runtime-evidence-authority}.ts`
  - `apps/go-backend/{current_semantic_authority_generated,arena_set_authority_v1_37_generated,runtime_service_client,integrity_evidence}.go`

### External Primary Sources — MEDIUM Confidence for Adaptation

- Lanctot et al., [A Unified Game-Theoretic Approach to Multiagent Reinforcement Learning](https://papers.neurips.cc/paper/7007-a-unified-game-theoretic-approach-to-multiagent-reinforcement-learning.pdf) — PSRO population, empirical payoff table, response-oracle, and meta-solver loop.
- [SLSA Provenance v1.1](https://slsa.dev/spec/v1.1/provenance) — provenance separation among artifact subject, build definition, resolved dependencies, builder identity, run details, and byproducts. Used as a shape, not a certification claim.
- Dwork et al., [Generalization in Adaptive Data Analysis and Holdout Reuse](https://proceedings.neurips.cc/paper/2015/hash/bad5f33780c42f2588878a9d07405083-Abstract.html) — repeated adaptive holdout inspection can overfit the holdout, motivating one-shot separation.

---
*Architecture research for: Coward's Game v1.38 Competitive Strategy Factory and Adversarial League*
*The formation experiment remains post-freeze, lab-only, and unable to authorize production behavior.*
