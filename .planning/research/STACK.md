# Technology Stack

**Project:** Coward's Game v1.38 Competitive Strategy Factory and Adversarial League
**Researched:** 2026-07-27
**Scope:** Offline strategy search, current-rules league evaluation, sealed holdouts, and a post-freeze lab-only starting-formation comparison
**Overall confidence:** HIGH for repository-local stack and boundary recommendations; MEDIUM for optional external tooling

## Executive Recommendation

Keep the production stack unchanged. v1.38 needs an offline research harness, not a second game platform, a new Strategy runtime, or an ML service. Add one private TypeScript workspace package, proposed as `@cowards/strategy-lab`, that composes the existing canonical engine, spec, replay, and runtime-service interfaces. No new npm dependency is required for the milestone's core path.

The package must have two deliberately different execution paths:

1. **Current-rules league path:** generates candidates offline, exports only explicit current-rules candidates, and certifies those candidates through the existing hostile-code runtime, canonical Match, MatchSet, Chronicle, persistence, and public-safety paths.
2. **Formation-lab path:** runs the predeclared `current-edge`, `inward-rank`, and `bracket-shield` profiles through a lab-only state-construction seam, then advances every Activation with `MATCH_KERNEL.stepMatch`. Its inputs and receipts use schemas that production registration, persistence, counted scheduling, and public APIs cannot parse.

Do not weaken canonical initial-state validation to enable the formation experiment. Construct the normal v1.19 machine with `MATCH_KERNEL.createMachineV119`, clone only the Soldier starting positions under a closed lab profile, validate the resulting state with the engine's general canonical-state validator plus a stricter lab-profile validator, and then return to the canonical transition kernel. The lab changes initial placement only; it does not copy rules, add feature flags to production DTOs, or create a second transition loop.

Use deterministic, manifest-driven parallelism. Enumerate every job before execution, derive an independent random stream from the root seed and stable job identity, execute trusted CPU work in a bounded `worker_threads` pool, and merge results in canonical job-ID order. Worker count, completion order, retries, and shard layout must not change result bytes. Treat crashes and missing shards as system failures that invalidate the run, never as losses or silently skipped samples.

Store research artifacts as immutable, content-addressed files outside the production database. Bind every counted result to exact source, corpus, candidate, opponent, split, algorithm, budget, semantic-version tuple, runtime, toolchain, platform, and commit identities. Use the repository's canonical JSON, domain-framed SHA-256, and Ed25519 evidence patterns. Keep sealed holdout material and its opening secret outside the repository and ordinary CI; the repository should contain only a commitment and privacy-safe metadata until the one-way opening.

## Recommended Stack

### Core Framework

| Technology | Version / identity | Purpose | Why |
|------------|--------------------|---------|-----|
| Node.js | `24.x`; record the exact patch, V8, and OpenSSL versions in each run manifest | Offline lab host, deterministic task planner, bounded worker pool, artifact tooling | Already the canonical TypeScript host. `worker_threads` are appropriate for trusted CPU-intensive search but are not a security boundary. |
| pnpm workspaces | `pnpm@11.1.2` | Package isolation and reproducible installs | Already pinned at the repository root; supports a lab package without another build system. |
| TypeScript | `6.0.3` resolved | Search algorithms, manifests, schemas, league analysis, and lab orchestration | Existing language of the canonical spec/engine/replay seams and the shortest path to typed reuse. |
| `@cowards/strategy-lab` | New private workspace package, `0.1.0` | Offline candidate factory, league driver, holdout gate, formation lab, and evidence assembly | Creates a physical dependency boundary while keeping research code out of engine, web, API, persistence, and worker production paths. |
| `@cowards/engine` | Existing workspace package; bind `engine-kernel-v1.37-candidate-1` in manifests | Sole Match transition authority | The lab must call `MATCH_KERNEL.createMachineV119` and `MATCH_KERNEL.stepMatch`; it must not reproduce Move, Backstab, scan, Cycle, Round, or board-contraction rules. |
| `@cowards/spec` | Existing workspace package; bind `cowards-rules-v1.4`, `strategy-runtime-abi-v1.19`, and `canonical-json-v1.1` | Canonical types, Zod schemas, canonical serialization, hashes, runtime envelopes | Reuse existing contracts and evidence primitives; define new lab schemas in the lab package so production schemas remain closed. |
| `@cowards/replay` | Existing workspace package; bind `chronicle-recorder-current-events-v1.37-candidate-1` | Sampled trace reconstruction and finalist verification | Reuse for current-rules proof and selected lab diagnostics without making the Chronicle a bulk search database. |
| Existing runtime-service and supervisor | Bind `runtime-execution-service-v1.18` and exact provider identity | Hostile Strategy execution and final current-rules certification | Any model-, human-, or search-emitted source is untrusted. Worker threads and direct imports must never replace the existing process/runtime boundary. |

### Database and Artifact Storage

| Technology | Version / format | Purpose | Why |
|------------|------------------|---------|-----|
| Content-addressed filesystem store | Canonical JSON manifest roots; canonical-JSON-per-line NDJSON or canonical-JSON shard records | Candidate populations, scenario matrices, compact outcomes, sampled traces, and signed receipts | Offline runs are append-only and naturally keyed by hashes. A production database would add mutable state, migrations, and accidental reachability without helping reproducibility. |
| Existing canonical JSON | `canonical-json-v1.1` | Byte-stable manifests, commitments, and receipts | Avoids introducing another canonicalization implementation and preserves existing verification semantics. |
| Node `crypto` | Node `24.x`; SHA-256, HMAC-SHA-256, Ed25519 | Domain-separated task seeds, content IDs, holdout commitments, and signed run roots | Built-in, already compatible with repository evidence patterns, and sufficient for deterministic derivation and integrity. |
| Existing PostgreSQL | Production version already owned by service topology | Current-rules finalist persistence only | Do not add lab tables. Only candidates that explicitly cross the normal current-rules export/certification boundary may enter existing Strategy Revision, MatchSet, Chronicle, and evidence persistence. |
| Optional `age` CLI | `1.3.1`, only if an encrypted holdout bundle must live near the repository | Recipient-based encryption for sealed holdout bytes | Operationally simple and independently keyed. The decrypting identity must remain with the custodian and outside the repository, CI secrets available to ordinary jobs, and lab artifact store. |

### Infrastructure

| Technology | Version / identity | Purpose | Why |
|------------|--------------------|---------|-----|
| `node:worker_threads` | Node `24.x` built-in | Parallel trusted search and canonical Match evaluation | CPU-oriented, available without a dependency, and controllable through a fixed-size pool. Use `AsyncResource` or equivalent job attribution for diagnostics. |
| Node `fs` and atomic rename | Built-in | Immutable shard writes and restart-safe publication | Write a complete temporary shard, validate its digest/count, then atomically rename it. Filesystem access belongs in lab orchestration, never in engine logic. |
| Node `child_process` | Built-in; only through approved adapters/commands | Provider-neutral oracle adapters and existing runtime-service interaction | Keeps model and language tools out of the Match loop and makes every invocation recordable. Never interpolate source into a shell command. |
| Git and lockfile hashing | Exact commit plus `pnpm-lock.yaml` digest | Source and dependency identity | A counted result without exact code and dependency identity is not reproducible evidence. |
| Existing CI | Current repository workflows | Unit, boundary, and small deterministic reproduction checks | CI should verify algorithms and replay a compact golden run. Large searches and sealed holdout openings belong in an explicitly authorized offline environment. |
| Existing production Playwright/service/Go proof lanes | Resolved repository versions | Certification of current-rules finalists | Reuse only after candidate export. Formation-lab artifacts must fail before these lanes can schedule or persist them. |

### Supporting Libraries and Built-ins

| Library / facility | Version | Purpose | When to Use |
|--------------------|---------|---------|-------------|
| Zod | `4.4.3` resolved | Lab manifest, candidate, profile, receipt, and ingest schemas | Validate every file/process boundary. Use disjoint discriminants instead of optional `experimental` fields on production schemas. |
| Vitest | `4.1.6` resolved | Determinism, algorithm, property-style, tamper, and negative-boundary tests | Primary proof harness for the lab package. |
| Vitest benchmark API | `4.1.6` resolved | Local throughput and p99 observation | Diagnostic only. Bind benchmark results to an exact machine manifest; never use wall-clock time as an equal-compute scientific budget. |
| `tsx` | `4.22.0` resolved | Repository-local lab commands | Use for small CLI entrypoints following the project's existing write/check conventions. |
| Playwright | `1.60.0` resolved | Final browser/privacy regression for exported current-rules finalists | Not part of search and not used to inspect lab-only formations. |
| Native arrays, maps, typed arrays, and small matrix helpers | ECMAScript / local TypeScript | Payoff matrices, regret state, graph analysis, fingerprints | The matrices are small enough to keep the implementation transparent and golden-testable. |

## Package and Dependency Boundary

The new package should be private and offline:

```json
{
  "name": "@cowards/strategy-lab",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@cowards/engine": "workspace:*",
    "@cowards/replay": "workspace:*",
    "@cowards/spec": "workspace:*",
    "zod": "4.4.3"
  }
}
```

`@cowards/replay` may be omitted from the package's runtime dependencies if trace verification is implemented as a separate dev command. No production package or app may depend on `@cowards/strategy-lab`.

Enforce the direction with the repository's import/dependency monitor:

```text
@cowards/strategy-lab
  -> @cowards/engine
  -> @cowards/spec
  -> @cowards/replay (verification only)

production engine/spec/replay/runtime/persistence/service/web/worker
  -X-> @cowards/strategy-lab

@cowards/strategy-lab
  -X-> production persistence DTOs
  -X-> counted MatchSet scheduling internals
  -X-> web/public API surfaces
```

The runtime boundary is about trust, not package convenience:

- Repository-authored parametric controllers used solely as search teachers may run directly against the canonical engine because they are trusted test code.
- Candidate Strategy source produced by search, a model, or a human is hostile input. Validate it, store its exact bytes, and evaluate it through the existing runtime-service/supervisor/provider path.
- Do not use `new Function`, `eval`, Node `vm`, or `worker_threads` as a sandbox.
- A provider crash, timeout, schema rejection, or transport failure is a system/strategy failure with the existing typed semantics; it is not converted into a gameplay result by the lab.

## Required Additions

### 1. A Versioned, Manifest-First Task Model

Enumerate the complete run before executing it. A stable task identity should bind at least:

```ts
type LabTaskIdentityV1 = {
  runRoot: string
  stage: "factory" | "current-league" | "formation-lab"
  oracleId: string
  iteration: number
  candidateId: string
  opponentId: string
  arenaId: string
  sideAssignment: "A" | "B"
  initiativeAssignment: "candidate-first" | "opponent-first"
  formationProfileId?: FormationProfileIdV1
}
```

Sort and canonically serialize the task list before work begins. A task's seed must be derived independently, for example:

```text
HMAC-SHA-256(
  key = decoded root seed,
  data = "cowards-game/strategy-lab/task-seed/v1" || 0x00 || canonical(task identity)
)
```

Expand bytes with a versioned counter stream or a small repository-owned deterministic PRNG whose golden vectors are committed. Never share a mutable generator between tasks. Never use `Math.random`, system time, worker ID, process ID, filesystem order, or completion order.

Scientific budgets must be structural and countable:

- candidate proposals;
- search nodes or beam expansions;
- Matches per matrix cell;
- oracle prompt/token budget;
- review minutes under a recorded protocol.

Wall-clock duration may be reported for operations, but it must not define equal effort or decide which candidates receive more evaluation.

### 2. A Deterministic Worker and Shard Runner

Use a bounded worker pool for trusted CPU-heavy tasks. The coordinator owns the manifest and publication:

1. Read and validate the frozen run manifest.
2. Allocate tasks by stable hash or contiguous canonical ranges.
3. Give each worker complete task data and its independently derived seed.
4. Write one result per task to a temporary shard.
5. Flush the temporary file, validate task coverage, uniqueness, record schemas, and shard hash, then atomically rename and flush the containing directory.
6. Merge in canonical task-ID order.
7. Sign and publish the immutable run root only when the matrix is complete.

Prove byte identity across one worker, multiple worker counts, shuffled completion, crash/restart, and different shard counts. Retrying the same task must reproduce the same bytes. Missing, duplicate, conflicting, or schema-invalid tasks invalidate the run. Never silently impute, skip, or score them.

Worker threads may run canonical engine transitions and trusted search logic. They must not execute arbitrary Strategy source. Untrusted candidates remain behind the existing runtime provider boundary, even if that is slower.

### 3. Repository-Owned, Auditable Search Algorithms

Implement the small algorithms directly in TypeScript:

| Algorithm | Use | Determinism contract |
|-----------|-----|----------------------|
| Hierarchical beam/adversarial search | Structured parameter exploration and candidate refinement | Fixed enumeration order, explicit beam width/depth, canonical tie-break by candidate fingerprint |
| Deterministic discrete optimizer or MAP-Elites-style archive | Behavioral diversity and coverage | Versioned bins, fixed proposal budget, stable replacement rule |
| Fixed-iteration regret matching or multiplicative weights | Approximate current population meta-distribution | Integer/fixed-point Set payoff inputs, explicit iteration count, stable normalization and tie-breaks |
| Tarjan strongly connected components | Counter-cycle and dominance-graph analysis | Canonical node ordering and stable component labels |
| Small local matrix/fingerprint utilities | Payoff summaries, clustering, duplicate detection | Canonical row/column identities and golden fixtures |

These implementations must never be described as proving an optimal strategy. Results are conditional on the frozen oracle set, search budget, arenas, side/initiative schedule, runtime version, and Set policy.

### 4. Provider-Neutral Model and Human Oracle Ingest

Model calls must occur outside the lab runner and outside Match execution. Use file contracts rather than an SDK:

```text
lab prepare-prompt -> immutable request bundle
external authorized operator/provider -> immutable response bundle
lab ingest-response -> schema validation, provenance record, candidate source hash
existing runtime-service -> compile/execute/certify
```

Bind model/provider name, exact reported model version, prompt-template hash, system/context hashes, sampling settings, token budget, response bytes, and operator/custody receipt. Human candidates get the same source/provenance treatment. This keeps the lab provider-neutral and makes missing provider access a workflow concern rather than a code dependency.

Do not add OpenAI, Anthropic, LangChain, or agent-framework SDKs to the repository for v1.38.

### 5. Immutable Content-Addressed Run Storage

Use a task-specific configured path such as `COWARDS_STRATEGY_LAB_STORE`; do not default to a production storage mount. A recommended layout is:

```text
<store>/
  objects/sha256/<digest>
  runs/<run-root>/
    manifest.json
    task-index.json
    shards/<shard-id>.ndjson
    candidates/<candidate-id>.json
    matrices/<matrix-id>.json
    samples/<trace-id>.json
    receipt.json
    receipt.sig
```

The signed run root should bind:

- exact Git commit and dirty-state declaration;
- lockfile hash;
- Node, V8, OpenSSL, OS, architecture, and relevant hardware identity;
- rules, engine, runtime ABI, Chronicle, canonical JSON, arena catalog, and Set policy identities;
- algorithm, PRNG, task-schema, profile-catalog, and artifact-schema versions;
- root seed commitment;
- population, corpus, candidate, opponent, arena, and split hashes;
- structural budgets;
- task count, shard hashes, matrix dimensions, and sampled-trace policy;
- custody/opening receipts for any sealed holdout.

Keep compact outcome and required telemetry for every Match. Store full Chronicle/trace data only for a precommitted deterministic sample, failures, and finalists. This prevents evidence volume from silently changing the evaluated population while avoiding unnecessary bulk.

The object store is private research infrastructure. Any derived public-safe report must omit Strategy source, StrategyMemory, SoldierMemory, raw objective payloads, sealed holdout contents, and private runtime diagnostics, matching the existing replay and competition privacy boundary.

### 6. Sealed Holdout Custody and One-Way Opening

The preferred holdout stack is operational separation, not repository encryption:

1. An independent custodian holds raw holdout bytes and an HMAC key outside the repository, normal developer worktree, ordinary CI, and lab storage mount.
2. Before search, publish `HMAC-SHA-256(key, domain || canonical holdout bundle)` plus privacy-safe metadata such as schema version and expected entry count.
3. Freeze candidates, source, current-rules matrix, budgets, and scoring protocol.
4. Authorize a single opening. Verify the revealed bytes against the commitment and write an immutable opening receipt.
5. Evaluate only the frozen run root. Do not feed holdout outcomes back into admission, tuning, search, or replacement.
6. A later reproduction may rerun the exact frozen root; it is not a second development look.

If an encrypted bundle must be stored near the repository, use the optional `age` CLI and keep its identity with the custodian. Encryption is not separation if the same routine CI job can decrypt it. Never commit the key, embed it in an npm script, or log decrypted objective/source material.

### 7. Physically and Schema-Separated Formation Profiles

Define a closed lab-only catalog:

```ts
const FormationProfileIdV1 = z.enum([
  "current-edge",
  "inward-rank",
  "bracket-shield",
])

const FormationLabPolicyManifestV1 = z.object({
  kind: z.literal("formation-lab-policy/v1"),
  labProfileId: FormationProfileIdV1,
  productionEligible: z.literal(false),
  rulesVersion: z.literal("cowards-rules-v1.4"),
  engineVersion: z.literal("engine-kernel-v1.37-candidate-1"),
  runtimeAbiVersion: z.literal("strategy-runtime-abi-v1.19"),
  // hashes and unchanged-rule assertions omitted here
}).strict()
```

This type must not extend or union into `StrategyRevisionSchema`, canonical Match registration, counted MatchSet requests, persistence records, or public DTOs. There is no `toStrategyRevision`, `toMatchRequest`, or generic cast/export helper.

The lab builder should:

1. call `MATCH_KERNEL.createMachineV119` with the normal canonical tuple and arena;
2. clone the initial serializable state;
3. replace only the declared Soldier positions for the selected profile;
4. verify Soldier identity/count, board bounds, occupancy, terrain legality, unchanged non-position state, and the exact profile fingerprint;
5. validate with the general canonical-game-state validator and lab schema;
6. run all subsequent transitions through `MATCH_KERNEL.stepMatch`.

Do not relax the canonical initial-state validator, add a formation parameter to production Match creation, or branch inside the engine kernel. All three comparison arms, including `current-edge`, should use the same lab path so the control and experimental profiles differ only in the declared positions.

A stage-gate receipt must prove that the serious current-rules league was frozen before the formation command can run. The formation manifest must also assert identical rules, cap, MOVE cost, Backstab, scan timing, activation/initiative policy, arenas, Strategy population, runtime, budgets, and scoring. Adding any fourth profile requires a new catalog version and explicit approval.

### 8. Explicit Current-Rules Export Gate

Keep these artifact types disjoint:

```ts
type CurrentRulesCandidateManifestV1 = {
  kind: "current-rules-candidate/v1"
  productionEligibility: "requires-normal-certification"
  sourceBundleHash: string
  provenanceRoot: string
}

type FormationLabReceiptV1 = {
  kind: "formation-lab-receipt/v1"
  productionEligible: false
  profileCatalogHash: string
  frozenCurrentLeagueRoot: string
}
```

Only the first type may start the existing immutable Strategy Revision submission and provider certification flow. Even then, lab success is not certification: the candidate must pass the ordinary runtime, invalid-output, timeout, source/memory, arena, MatchSet, Chronicle, persistence, privacy, and end-to-end tests.

Runtime negative tests must prove that a formation manifest/receipt is rejected by:

- Strategy Revision registration;
- canonical Match creation;
- production persistence codecs;
- counted MatchSet scheduling;
- evidence aggregation;
- replay/public DTO serialization;
- web and API routes.

## Testing and Verification Stack

### Determinism and Algorithm Tests

Use Vitest for:

- PRNG/HMAC derivation golden vectors and domain separation;
- task enumeration and stable task IDs;
- byte-identical results across worker counts, scheduling orders, shards, and restart boundaries;
- complete Cartesian coverage of arena, side, initiative, candidate, opponent, and declared profile factors;
- canonical matrix row/column ordering and tie-breaks;
- golden games for beam/archive/regret/SCC helpers;
- invariant tests under candidate IDs, input ordering, safe coordinate symmetries, and replay reconstruction;
- candidate fingerprint and duplicate detection stability;
- fixed-budget enforcement independent of elapsed time.

### Runtime and Failure Tests

Reuse existing runtime tests for every exported current-rules candidate:

- invalid output and schema rejection;
- timeout and action/compute budget exhaustion;
- forbidden capabilities and import attempts;
- source, memory, and output limits;
- provider process crash versus Strategy failure;
- exact source/artifact identity;
- deterministic rerun under the same provider identity.

Add lab-runner tests showing that a worker crash, truncated shard, duplicate task, missing result, conflicting retry, digest mismatch, or malformed oracle response invalidates the artifact root rather than altering the score.

### Formation Boundary and Realism Tests

For each profile:

- every Soldier position lies inside declared board bounds;
- no Soldiers overlap forbidden terrain or each other;
- the canonical arenas contain every declared profile position;
- Soldier IDs, teams, headings where not part of the approved profile, HP, memory, turn state, terrain, and objective payload are unchanged;
- after construction, every transition is produced by `MATCH_KERNEL.stepMatch`;
- current-edge built by the lab matches the canonical opening state byte-for-byte where the profile says it should;
- clone/fingerprint checks detect any non-position mutation;
- a representative visual/replay diagnostic shows a plausible full opening rather than clipped or off-screen pieces.

The visual diagnostic is internal lab evidence only. Do not expose lab traces through the public replay service.

### Holdout and Artifact Tests

Prove:

- sealed data cannot be read before an authorized opening;
- wrong key, modified bytes, or wrong domain fails commitment verification;
- opening before candidate/population freeze is rejected;
- post-open candidate admission or scoring-policy changes are rejected;
- rerun accepts only the exact frozen root;
- canonical manifest serialization and root signatures verify;
- object tampering, partial publication, and mutable overwrite are detected;
- full artifact verification works from a clean checkout plus the declared external object store.

### Performance Measurement

Vitest benchmarks may measure task throughput, engine steps per second, memory, and p99 latency on a fully identified machine. Treat these as capacity-planning observations only. Equal-compute comparisons must use fixed countable budgets, not a benchmark duration or fastest-machine advantage.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Game/search platform | Existing TypeScript engine plus local lab package | OpenSpiel | OpenSpiel is a strong reference for PSRO and game-learning algorithms, but adopting its C++/Python game interface would create a second Coward's Game implementation and cross-language authority problem. |
| Search implementation | Small deterministic TypeScript algorithms | TensorFlow, PyTorch, JAX, RLlib | v1.38 searches structured strategies and payoff matrices, not neural policies. These stacks add nondeterministic kernels, Python environments, accelerators, and opaque checkpoints without a demonstrated need. |
| Distributed execution | Bounded local Node worker pool and deterministic shards | Ray, Kubernetes jobs, Kafka, Redis queues | Premature operational surface. Deterministic shard files are sufficient; scale out later only from measured runtime and with the same manifest protocol. |
| Meta solver | Fixed-iteration regret matching or multiplicative weights | LP package / exact Nash solver | The milestone needs a reproducible approximate evaluation distribution, not an unqualified equilibrium proof. Add an exact solver only if a later requirement specifies semantics and independent audit. |
| Optional exact-solver audit | External HiGHS command, isolated and manifest-bound | Native npm solver dependency in core lab | If later required, use it as a cross-check rather than the sole authority; native package/toolchain variation should not enter the initial core path. |
| Artifact store | Immutable content-addressed files | PostgreSQL, SQLite, Parquet/Arrow, object-store SDK | Current scale and audit needs favor inspectable files. Add columnar/object infrastructure only after profiling shows a concrete bottleneck. |
| Model integration | Provider-neutral request/response bundles | OpenAI/Anthropic/LangChain SDK | Prevents provider coupling and accidental online inference inside Match execution; exact bytes and provenance are easier to freeze. |
| Hostile-code execution | Existing runtime-service/provider boundary | Node `vm`, `new Function`, direct worker-thread evaluation | None is an acceptable security boundary for hostile Strategy code. |
| Formation integration | Lab-only closed schema and state-construction seam | Production feature flag or optional `startingFormation` field | Optional production fields are reachable, persistable, and likely to become accidental rules. Physical and schema separation keeps the experiment non-shipping. |
| Holdout custody | External custodian plus HMAC commitment | Repository secret, reversible obfuscation, ordinary CI secret | Anyone/process with both bytes and secret can inspect early. Custody separation enforces the experimental protocol. |
| Holdout encryption | Optional external `age` CLI | New npm crypto wrapper or custom encryption | Custom crypto and embedded library keys add risk without improving custody. |
| New runtime/language | None | Python research service or Rust search engine | Would duplicate schemas/algorithms and complicate exact reproduction. The existing runtime lanes remain candidate execution targets, not lab orchestration stacks. |

## Explicitly Do Not Add

- a second Match engine or any copied transition/rules implementation;
- OpenSpiel as a production dependency;
- Python notebooks as authoritative evidence or a Python lab service;
- TensorFlow, PyTorch, JAX, RLlib, Ray, MLflow, or a feature store;
- LangChain, provider-specific model SDKs, or live model inference in Match execution;
- a new runtime language, WASM ABI, sandbox, or compiler lane;
- Node `vm`, `eval`, `new Function`, or worker threads as hostile-code containment;
- Redis/Kafka queues, Kubernetes orchestration, or a new hosted service;
- lab tables in production PostgreSQL;
- a second Chronicle/event-store format;
- SQLite, Parquet, Arrow, or dataframe dependencies before measured need;
- an optimizer or LP dependency in the core implementation;
- an experimental flag, formation field, or lab union member in production registration/persistence/public schemas;
- public UI/API routes for formation experiments;
- extra rule variants, unit-cap experiments, MOVE-cost changes, Backstab changes, or scan-timing changes;
- claims of optimality, permanent balance, or meta-game solution beyond the frozen oracle/budget scope.

## Version and Identity Matrix

| Layer | Required identity in a counted run |
|-------|------------------------------------|
| Repository | Exact commit plus explicit clean/dirty state and patch digest if dirty |
| Dependencies | `pnpm@11.1.2` and exact `pnpm-lock.yaml` hash |
| Host | Node `24.x`, exact patch, V8, OpenSSL, OS, architecture, CPU identity, worker count |
| Compiler/tools | TypeScript `6.0.3`, `tsx 4.22.0`, Vitest `4.1.6`, Zod `4.4.3` |
| Rules | `cowards-rules-v1.4` |
| Engine | `engine-kernel-v1.37-candidate-1` |
| Runtime ABI | `strategy-runtime-abi-v1.19` |
| Chronicle | `chronicle-recorder-current-events-v1.37-candidate-1` |
| Canonical JSON | `canonical-json-v1.1` |
| Runtime service | `runtime-execution-service-v1.18` plus provider/compiler identities |
| Arenas | Exact `smoke` / `standard-cross` catalog identity and arena hashes as applicable |
| Set policy | Exact four-condition Set-policy identity |
| Lab | Task schema, artifact schema, PRNG derivation, algorithm suite, profile catalog, split protocol, and custody protocol versions |
| Optional encryption | `age 1.3.1`, recipient fingerprint, ciphertext hash, and separate custody receipt |

The repository-local versions above are observed identities for this project, not a recommendation to float to newer releases during the milestone. If any resolved identity changes, it creates a different evidence root and requires regeneration/reproduction rather than silent reuse.

## Installation and Commands

Core implementation needs no new external package:

```bash
pnpm install --frozen-lockfile

# After adding packages/strategy-lab to the existing workspace:
pnpm --filter @cowards/strategy-lab test
pnpm --filter @cowards/strategy-lab typecheck
```

Recommended command surface:

```bash
pnpm lab manifest --check <run-manifest>
pnpm lab prepare-prompt --manifest <run-manifest> --oracle <oracle-id>
pnpm lab ingest-response --manifest <run-manifest> --response <bundle>
pnpm lab run-current --manifest <frozen-manifest>
pnpm lab freeze-current --run <run-root>
pnpm lab run-formation --manifest <formation-manifest>
pnpm lab verify --run <run-root>
```

Exact script names can follow repository conventions during planning. The semantic split is mandatory: `run-formation` must require a valid frozen-current receipt, and no command may export a formation artifact into production.

Optional holdout encryption is an operator dependency, not an npm dependency:

```bash
age --version
```

Do not add the encryption identity or decrypting key to the package manifest, repository, or ordinary CI.

## Roadmap Implications

The stack implies this implementation order:

1. **Lab package and boundary contracts** — private workspace, import-direction proof, disjoint schemas, artifact and task manifests.
2. **Deterministic primitives** — seed derivation, PRNG vectors, fingerprints, canonical task enumeration, shard writer/verifier, worker-count invariance.
3. **Strategy factory and oracle ingest** — trusted parameter search plus hostile-source export through the existing runtime path.
4. **Current-rules league and analysis** — complete side/initiative/arena matrix, meta-distribution, dominance/cycle reporting, sealed holdout gate, and normal finalist certification.
5. **Current-league freeze receipt** — immutable population/source/budget/results root; this is the hard prerequisite for any formation work.
6. **Formation lab** — closed three-profile catalog, lab-only initial-state seam, identical transition/runtime/population conditions, and no production export.
7. **Evidence and boundary proof** — clean-checkout reproduction, tamper/custody tests, production-schema rejection, and privacy-safe reporting.

The deterministic runner and artifact protocol must precede search algorithms; otherwise later evidence cannot prove that comparisons used equal work or complete matrices. The current-rules freeze must precede formation implementation/execution as an enforceable command/schema gate, not merely documentation.

## Sources

### Repository and project sources — confidence HIGH

- `.planning/PROJECT.md`
- `.planning/milestones/v1.38-ACTIVATION-PROMPT.md`
- `.planning/milestones/v1.38-COMPETITIVE-STRATEGY-RESEARCH.md`
- `.planning/milestones/v1.38-COMPETITIVE-STRATEGY-SEED.md`
- `.planning/milestones/v1.37-REQUIREMENTS.md`
- `.planning/milestones/v1.37-ROADMAP.md`
- `.planning/milestones/v1.37-MILESTONE-AUDIT.md`
- `.planning/research/STRATEGY-EVALUATION-FOUNDATION.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGame_Technical_Architecture_Spec_V1.md`
- Root `package.json`, `pnpm-lock.yaml`, workspace manifests, engine/spec/replay/runtime-service exports and tests

### Official external sources — confidence MEDIUM

- [Node.js v24 `worker_threads` documentation](https://nodejs.org/download/release/v24.16.0/docs/api/worker_threads.html) — workers are appropriate for CPU-intensive JavaScript and benefit from pooling/`AsyncResource`; this does not make them a hostile-code security boundary.
- [Node.js v24 `crypto` documentation](https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html) — built-in SHA-256, HMAC, signing, and Ed25519 support.
- [OpenSpiel repository](https://github.com/google-deepmind/open_spiel) and [algorithm catalog](https://openspiel.readthedocs.io/en/latest/algorithms.html) — useful reference for PSRO/game-learning methods, but its C++ core and Python bindings would introduce a second game representation.
- [Policy-Space Response Oracles paper](https://arxiv.org/abs/1711.00832) — conceptual basis for oracle-relative population evaluation, not a claim that the proposed lab solves Coward's Game.
- [Vitest benchmarking guide](https://main.vitest.dev/guide/benchmarking) — benchmark support for diagnostics; results remain environment-sensitive.
- [`age` official repository](https://github.com/FiloSottile/age) — optional recipient-based file encryption and release identity.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Existing stack and versions | HIGH | Verified from repository manifests, lockfile, exports, and milestone evidence. |
| Engine/runtime ownership | HIGH | Directly established by code and non-negotiable project contracts. |
| Lab-only formation seam | HIGH | Follows the approved milestone boundary and preserves the canonical transition owner without weakening production schemas. |
| Deterministic runner/artifact design | HIGH | Uses standard deterministic task decomposition and existing repository hashing/canonicalization patterns. |
| Search/meta algorithms | MEDIUM | Suitable and auditable for the stated oracle-relative goal; exact budgets and parameters require phase planning and empirical calibration. |
| Worker-thread scaling | MEDIUM | Officially supported for CPU work, but useful pool size and storage volume require measurement on the execution host. |
| Sealed holdout operations | HIGH conceptually; MEDIUM operationally | Custody separation is the right control; named custodian, storage location, and opening authorization remain project decisions. |
| Optional `age` use | MEDIUM | Official tool and clear fit, but unnecessary if physical custody separation is available. |

## Open Decisions for Phase Planning

- Select the named holdout custodian and authorized one-way opening procedure.
- Fix structural search, model-token, Match, and reviewer budgets before implementation evidence can count.
- Choose the exact task-shard size only after a deterministic benchmark on the intended host; worker count must remain evidence metadata, not a semantic input.
- Decide the deterministic sampled-Chronicle policy and retention limit before the first counted run.
- Specify the exact coordinates/fingerprints for `inward-rank` and `bracket-shield` in the versioned lab profile catalog.
- Decide whether an exact LP solver is needed as an independent audit. It is not required for the core v1.38 stack.
