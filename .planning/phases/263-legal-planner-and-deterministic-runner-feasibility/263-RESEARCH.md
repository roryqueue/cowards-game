# Phase 263: Legal Planner and Deterministic Runner Feasibility - Research

**Researched:** 2026-09-09 (local date)
**Domain:** Deterministic legal Strategy planning and private offline execution
**Confidence:** MEDIUM — official-document cross-check tier returned by `query classify-confidence --provider websearch --verified`; source/runtime feasibility remains unmeasured.

<user_constraints>
## User Constraints (from CONTEXT.md)

The following decision/discretion/deferred blocks are verbatim from `263-CONTEXT.md`. [VERIFIED: 263-CONTEXT.md]
DATA_6dc834af_START

## Implementation Decisions

### Carry-forward integrity and containment
- **D-01:** Phase 262's admitted tuple, measurement contract, budgets, retry/burn policy, privacy classes, and custody commitment are immutable inputs. Missing or mismatched inputs stop Phase 263.
- **D-02:** The selected canonical `MATCH_KERNEL` is the sole transition authority. The lab may coordinate its public machine/effect API but may not copy Action legality, resolution, scheduling, event order, or state transitions into a second loop.
- **D-03:** Trusted repository-owned search and teacher representations may call the canonical engine for offline analysis. Any emitted Strategy source is hostile and executes only through the existing supervised provider/runtime boundary with exact success, player-violation, and system-failure semantics.
- **D-04:** The lab remains a private offline dependency. Production packages, apps, Go code, images, routes, generated contracts, and deployment manifests must not import it or expose its artifacts.
- **D-05:** Every task, attempt, failure, retry, shard, and unused allocation is content-addressed and charged. Missing, duplicate, conflicting, invalid, system-failed, or tampered work cannot enter a reduction.

### Hierarchical planner contract
- **D-06:** The full-board planner deterministically enumerates or beam-searches ordered Soldier/mission assignments under both entrant-level initiative hypotheses. Canonical ordering and tie-breaks must make identical legal inputs produce identical output.
- **D-07:** The mission vocabulary is evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer. Each mission has explicit objective, stale-objective, completion, failure, and cheap fallback semantics.
- **D-08:** Hard survival, legality, immediate tactical, and mission-consistency constraints are applied lexicographically before soft preferences. A soft score cannot compensate for a failed hard constraint.
- **D-09:** The 5x5 SoldierBrain evaluates all nine canonical concrete Actions—four `MOVE` directions, four `TURN` directions, and `TURN_TO_STONE`—and handles immediate legal threats/opportunities, stale objectives, the authoritative `hasAdvancedThisActivation` value, and budget exhaustion.
- **D-10:** A cheap deterministic legal fallback is always reserved before optional search. Exhausting a soft-search budget must not create invalid output, hidden fallback compute, or a system failure.
- **D-11:** Emitted decisions reproduce from only canonical `StrategyInput` or `SoldierBrainInput`, the assigned objective, `StrategyMemory`, and `SoldierMemory`. Privileged teacher state may score or label offline examples but can never be serialized into an emitted decision dependency.

### Feasibility gate
- **D-12:** Forced-tactic, defense, legality, hidden-state-pair, stale-objective, hostile-input, determinism, source-size, objective, memory, output, and runtime tests must pass before factory scale. Paired states that are identical under the legal information set must produce identical deployed choices.
- **D-13:** Accepted output is synchronous, package-free, capability-free, self-contained deterministic source. It performs no live inference, human interaction, network, filesystem, clock, random, dynamic import, or host-capability access during a Match.
- **D-14:** The exact Phase 262 source and runtime limits control the gate. Unless Phase 262 validly calibrated replacements, this means a 64 KB hard source cap, a preferred under-48 KB target, and a below-5 ms p99 direct-execution target on the one identified benchmark.
- **D-15:** Feasibility failure is a valid stop result. It blocks scaled factory work and is preserved with full evidence; it cannot be hidden by extra compute, a larger source, weaker information rules, an easier runtime lane, or a relaxed threshold.

### Deterministic lab runner
- **D-16:** Use one private `@cowards/strategy-lab` core for contracts, identity, task planning, ledgers, artifacts, canonical reduction, and profile-neutral orchestration. It is an offline package/CLI, not a network service or production database client.
- **D-17:** The runner pre-enumerates the complete bounded task graph before execution. Each task identity binds the admitted root, algorithm/version, inputs, split, budget, ordinal, and purpose; independent deterministic streams derive from that identity with domain-separated hashing.
- **D-18:** Task assignment occurs before workers run. Trusted `worker_threads` may provide CPU parallelism, but worker count, shard size, completion order, restart, and resume may not change task identities or reduced bytes.
- **D-19:** Workers write complete temporary shards, validate strict bounded schemas, coverage, identities, and digests, then publish atomically. Reduction reads shards in canonical task-id order and rejects gaps, duplicates, conflicts, truncation, stale identities, or tampering.
- **D-20:** One non-secret command rebuilds the declared feasibility candidates, schedules, outcomes, telemetry, and roots from an immutable manifest. It records the exact Git/dirty state, lockfile, Node/V8/OpenSSL/OS/architecture/CPU identity, worker configuration, algorithm/PRNG/schema versions, and selected semantic/runtime tuple.
- **D-21:** The lab drives `MATCH_KERNEL.createMachineV119`/`stepMatch` (or the exact currently selected equivalents) and resumes effects only with supervised runtime results. `new Function`, `eval`, Node `vm`, a copied `resolveRound`, or an alternate legality/transition implementation is forbidden.
- **D-22:** Byte-identical reduction is required across the precommitted worker/shard/order/restart/resume matrix. Wall-clock timing is operational metadata and capacity evidence, never a search identity or equal-compute currency.

### the agent's Discretion
- Beam width, search representation, mission scoring details, objective encoding, and fallback heuristics are selected after the planner/source/runtime spike, provided they satisfy the locked legal-information, hard-before-soft, determinism, and budget rules.
- Task-id field names, shard size, trusted worker-pool size, artifact directory layout, and canonical reduction implementation are technical choices, provided the required invariance and tamper tests pass.
- Trace-retention sampling follows the Phase 262 contract; implementation may choose compression and internal review tooling without creating a canonical Chronicle or public replay.


## Deferred Ideas

- Scaled immutable candidate production, clone fingerprints, independent oracle packages, and human/external intake belong to Phase 264.
- PSRO/double-oracle solving and current-rules red-team execution belong to Phase 265.
- Executable current/inward/bracket states remain prohibited until after the valid Phase 266 freeze.
- Production/runtime migrations and all rule experiments remain outside this phase and milestone.


DATA_6dc834af_END
</user_constraints>

## Summary

Phase 262 is now complete: the current Plan203 continuation and current verification record 24/24 supervised fixture successes, twelve identical four-root pairs, complete cleanup and 16/16 requirements. The old denial line in Phase263 CONTEXT and lower historical sections of PROJECT/STATE/SUMMARY are superseded, not fresh permission checks. Closure is `31c0bb1c`; the result covers three arena labels but two geometries and establishes fixture feasibility, not new-planner feasibility or competitive strength. [VERIFIED: 262-203-SUMMARY.md; 262-VERIFICATION.md; STATE.md]

Build the smallest vertical slice: bounded legal-input planner and controller → emitted self-contained source → supervised invocation → canonical kernel → private compact results → deterministic reduction. Keep source development and synthetic validation separate from the charged empirical gate. Reuse existing engine, schema, runtime and boundary-test seams; do not import Phase262's repeated custody/controller generations or build a league now. [VERIFIED: 263-CONTEXT.md D-02–D-22; packages/engine/src/kernel/driver.ts; scripts/lib/v1-38-lean-container-match-session.ts]

**Primary recommendation:** Plan seven cohesive implementation/proof slices, with the measured planner feasibility gate before worker-scale execution. Seven is a planning decomposition, not a newly authorized cap or budget. Exact runtime binding, complete accounting, information-boundary proof and deterministic reduction are mandatory; formal custody, certification and new review-chain machinery are not Phase263 deliverables. [VERIFIED: 263-CONTEXT.md; STATE.md current completion]

## Architectural Responsibility Map

Prescriptive assignment under D-02–D-04/D-16; no browser, SSR, API database or Go ownership is added. [VERIFIED: 263-CONTEXT.md]

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Mission search and local policy | Private offline build/test; deployed Strategy runtime | Canonical legal input builders | Search teacher may inspect full state offline; deployed methods receive only admitted legal inputs. |
| Rule legality, ordering, outcomes | Pure engine | Spec validation | Only MATCH_KERNEL changes Match state. |
| Hostile source invocation | Existing supervised runtime adapter/provider | Private CLI supervisor | Worker thread is not the hostile-code security boundary. |
| Stable task graph and scheduling | Private offline CLI/core | Trusted workers | Identity precedes scheduling and excludes worker assignment. |
| Shards, ledger, reduction | Private filesystem artifacts/core | CLI publication coordinator | No production database, routes or canonical registration. |
| Isolation and privacy proof | Repository test/boundary scripts | Existing production-surface inventory | Check forbidden reverse reachability without introducing a production dependency. |

## Project Constraints (from AGENTS.md)

All directives below are binding project constraints. [VERIFIED: AGENTS.md]

- Read PROJECT, REQUIREMENTS, ROADMAP, STATE and research/SUMMARY before implementation; use the two primary specs and current canonical authority for semantics.
- Keep the engine pure, deterministic, serializable and side-effect free. Do not put game rules in React.
- No Strategy execution in web/API. No Node `vm` security boundary. Treat source as hostile and validate every runtime boundary with schemas.
- Engine logic must not use Math.random, Date.now, system time, filesystem, network or database access.
- Preserve Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle terminology.
- Strategy Revisions become immutable on submission for Match/MatchSet play.
- Public replay must not expose source, StrategyMemory, SoldierMemory or objective payloads by default.
- Follow roadmap build ordering: foundation/spec → pure engine → Chronicle/replay → runtime → orchestration/persistence → workshop → replay/E2E.
- Engine changes need focused and invariant/property-style tests; replay needs deterministic reconstruction and integrity tests.
- Replay/Match creation changes need board bounds and canonical-start realism checks and local browser validation where a rendered replay changes.
- Runtime tests cover invalid output, timeouts, forbidden capabilities, memory/source caps and schemas; worker tests distinguish Strategy and system failure.
- E2E expectations cover edit → submit → MatchSet → execute → replay; this private phase must not fabricate a product-path execution to satisfy a lab gate.
- Use discuss/plan/execute GSD flow; keep changed planning docs committed.
- No project-specific skills were found at the checked `.codex/skills` or `.agents/skills` locations. [VERIFIED: filesystem discovery]

<phase_requirements>
## Phase Requirements

Descriptions copied from REQUIREMENTS.md. [VERIFIED: .planning/REQUIREMENTS.md]

| ID | Description | Research Support |
|---|---|---|
| PLAN-01 | Researchers can deterministically enumerate or beam-search ordered Soldier and mission assignments with a full-board planner that evaluates both initiative hypotheses and enforces hard survival and tactical constraints before soft preferences. | Planner/controller fixtures, boundary and runner tests below. |
| PLAN-02 | The planner can represent evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer missions with explicit objective and fallback semantics. | Planner/controller fixtures, boundary and runner tests below. |
| PLAN-03 | A 5x5 SoldierBrain can consider all nine canonical Actions, detect stale objectives, use authoritative `hasAdvancedThisActivation`, handle immediate legal threats and opportunities, and choose a cheap deterministic legal fallback before budget exhaustion. | Planner/controller fixtures, boundary and runner tests below. |
| PLAN-04 | Every deployed choice is reproducible from only canonical StrategyInput or SoldierBrainInput, objective, StrategyMemory, and SoldierMemory; privileged offline teacher state cannot directly select emitted Actions. | Planner/controller fixtures, boundary and runner tests below. |
| PLAN-05 | Every accepted planner output is deterministic, synchronous, package-free, capability-free, self-contained source within canonical source/objective/memory/output limits and performs no live model inference or human interaction during Matches. | Planner/controller fixtures, boundary and runner tests below. |
| PLAN-06 | Forced-tactic, defense, legality, hidden-state-pair, stale-objective, hostile-input, determinism, source-size, memory, objective, output, and runtime feasibility gates pass before factory-scale search; an honest feasibility failure is preserved rather than hidden by extra compute or relaxed runtime limits. | Planner/controller fixtures, boundary and runner tests below. |
| FACT-01 | The competitive lab is a private offline package and executable set whose dependency graph may import canonical spec, engine, replay helpers, and supervised runtime adapters while production packages, apps, images, routes, generated contracts, and deployment manifests cannot import the lab. | Planner/controller fixtures, boundary and runner tests below. |
| FACT-02 | All research Matches advance through the exact selected canonical `MATCH_KERNEL`; the lab contains no copied resolver, second transition loop, alternate Action legality, or profile-specific transition code. | Planner/controller fixtures, boundary and runner tests below. |
| FACT-03 | One non-secret command rebuilds declared candidates, schedules, payoffs, telemetry, and roots from an immutable manifest; the lab pre-enumerates stable task identities, derives independent deterministic streams from a root commitment, assigns tasks before execution, and produces byte-identical reductions across worker counts, shard sizes, completion order, restart, and resume. | Planner/controller fixtures, boundary and runner tests below. |
| FACT-04 | Lab schemas, algorithms, PRNGs, manifests, shards, matrices, traces, receipts, and roots use strict bounded validation, canonical encoding, domain-separated identities, complete coverage checks, atomic publication, and tamper detection. | Planner/controller fixtures, boundary and runner tests below. |
</phase_requirements>

## Standard Stack

Use the existing locked workspace; no new external package installation or upgrade is recommended. Versions below are repository declarations or executable observations, not claims about newest registry releases. The emitted Strategy remains package-free even though the trusted builder uses workspace tools. [VERIFIED: package.json; packages/spec/package.json; 263-CONTEXT.md D-13]

| Component | Existing version/identity | Purpose |
|---|---|---|
| Node | Observed 24.15.0 | Trusted offline orchestration, crypto, fs, workers. [VERIFIED: node --version] |
| pnpm | Observed/pinned 11.1.2 | Existing workspace commands. [VERIFIED: package.json; pnpm --version] |
| TypeScript | Root range ^6.0.3 | Existing build/type checking; retain lockfile. [VERIFIED: package.json] |
| Vitest | Observed 4.1.6 | Existing focused synthetic tests. [VERIFIED: pnpm exec vitest --version] |
| tsx | Root range ^4.22.0 | Existing repository CLI execution. [VERIFIED: package.json] |
| Zod | Spec dependency ^4.4.3 | Reuse canonical schemas; declare strict bounded lab envelopes. [VERIFIED: packages/spec/package.json; schemas.ts] |
| Internal spec/engine/runtime/replay | Workspace source at admitted commit | Exact kernel/ABI and canonical encoding; selected replay helpers only. [VERIFIED: 263-CONTEXT.md; kernel/driver.ts] |
| New internal strategy-lab package | Proposed workspace-private 0.1.0 | Offline core, not external dependency or published package. [VERIFIED: 263-CONTEXT.md D-16] |

**Installation:** None beyond normal existing lockfile-based workspace setup. Package Legitimacy Audit is not applicable because this research recommends no new external installation. Do not turn existing-package version ranges into upgrade tasks. [VERIFIED: scoped recommendation; package.json]

**Alternatives:** Distributed queues, databases, third-party worker pools and general game-search frameworks add no required capability to this bounded phase. Use built-in workers only when the serial proof is established; official Node documentation recommends pooling CPU workers rather than one thread per task. [CITED: https://nodejs.org/docs/latest-v24.x/api/worker_threads.html]

## Architecture Patterns

### System Architecture Diagram

Design prescription derived from the phase's locked responsibilities. [VERIFIED: 263-CONTEXT.md]

```text
Immutable manifest + admitted roots
       |
       v
Strict admission --> mismatch / unavailable allocation --> stop receipt
       |
       v
Pre-enumerated task IDs + domain streams --> trusted fixed task workers
       |                                         |
       |                          canonical kernel yields legal-input effect
       |                                         |
       |                          supervised hostile-source provider
       |                                         |
       |                          bound success / player violation / system failure
       |                                         |
       |                          kernel resumes; system failure = no scored result
       v                                         v
Complete expected inventory <---- validated private task records
       |
Temp shard -> validate -> single-writer atomic publication
       |
Coverage + identity + digest checks -> sorted semantic reduction
       |
Private roots + bounded feasibility receipt (no production/public admission)
```

### Recommended Project Structure and Reusable Analogs

New paths are prescriptions, not claims that files exist. `packages/strategy-lab` was absent during inspection. [VERIFIED: filesystem discovery]

| Proposed ownership | Reusable analog | Reuse boundary |
|---|---|---|
| `packages/strategy-lab/src/contracts.ts`, `identity.ts` | spec canonical-json-encode/parse and runtime-budget-profile-v1-18 framing; scripts/lib/v1-38-measurement.ts | Reuse canonical bytes, domain framing and bounded schemas, not ad hoc JSON.stringify hashes. |
| `src/planner/{missions,assign,brain,emit}.ts` | Existing persistence Starter/Advanced descriptors; detailed competitive-strategy research mission list | Descriptors/source packaging are analogs, not evidence those policies solve required tactics. |
| `src/runtime-bridge.ts` | engine kernel driver/types; runtime-js supervised-subprocess-adapter | Core accepts a typed injected supervisor; never a callback evaluating hostile source locally. |
| `scripts/run-v1-38-planner-feasibility.ts` | lean-container-match-session and current lean CLI | CLI owns container lifecycle; do not rerun consumed Phase262 commands or reuse fixture-only revision authorization. |
| `src/{tasks,ledger,shards,reduce}.ts` | lean-runner-feasibility strict terminal rederivation/hash helper | Scientific record identity independent of physical shard layout; append-only failure accounting. |
| `scripts/check-v1-38-lab-boundaries.ts` | check-v1-37-integrity-boundaries.ts and service-boundary-imports checker | Extend source/reference analysis to lab dependency/transitive entry points; include dynamic imports and deployment assets. |
| `src/**/*.test.ts` | kernel-contract, semantic-boundaries, runtime-ownership; canonical-json tests; lean session tests | Test doubles prove protocol wiring only; never stand in for emitted-source empirical feasibility. |

[VERIFIED: named repository source files; 263-CONTEXT.md canonical references]

### Canonical effect pump, not a second game loop

`MATCH_KERNEL` exposes createMachineV119, stepMatch, runMatchV119 and activation equivalents. Step results are effect, transition, completed or failure. Effects bind request ID, effect kind, semantic tuple and coordinates. A lab pump may advance/resume this protocol but must not own Phase/Round/Cycle scheduling or mutate machine state; compare its complete records with the canonical driver using fixed trusted effects before involving hostile code. [VERIFIED: packages/engine/src/kernel/driver.ts; types.ts; step.ts]

The existing runtime-service entry is a behavioral analog, not a reason for the core to import an app. The lean runner currently imports `apps/runtime-service/src/execute-match.ts` and builds fixture revisions; neither makes it a generic Phase263 library. Keep package dependencies one-way, inject the existing supervised adapter from the CLI and reuse its request/result admission. Test request/response identity mismatch, replayed request, player violation, system failure and cleanup. [VERIFIED: scripts/run-v1-38-lean-runner-feasibility.ts; apps/runtime-service/src/execute-match.ts; 263-CONTEXT.md D-03/D-04/D-21]

### Mission planner feasibility

Use a small fixed-width beam over ordered distinct Soldier/mission assignments, truncating by deterministic structural node count. Evaluate both initiative hypotheses and compare hard-constraint vectors lexicographically before integer-valued soft preferences. Reserve fallback evaluation before optional expansion. Beam width/node cap are outputs of the bounded source/runtime spike, not guessed performance facts. [VERIFIED: 263-CONTEXT.md D-06–D-10]

Give each of the ten mission kinds a versioned compact packet with target/intent, completion predicate, stale predicate, failure disposition and fallback. Require a fixture that actually activates each semantic branch; ten labels selecting the same behavior do not demonstrate ten missions. Specify graph-cut STONE as a justified local commitment, not generic stoning whenever search fails. Keep bait/pincer bounded and adversarially testable, not primitive full-Match MCTS. [VERIFIED: 263-CONTEXT.md D-07; competitive-strategy-factory-and-adversarial-league.md mission/controller sections]

Every local call enumerates all nine concrete Actions, but schema validity is not a proof of successful Advance or tactical safety. Test blocked MOVE, reversal history, facing, pushed-versus-self-moved ambiguity, post-Advance behavior, no-Advance cleanup and contraction. Use authoritative hasAdvancedThisActivation. Do not reimplement resolution to obtain certainty; use canonical-engine fixtures offline to check the controller's predictions, and serialize only legal-input-derived intent into source decisions. [VERIFIED: schemas.ts; runtime-inputs.ts; 257-CONTEXT.md D-09–D-12; 263-CONTEXT.md D-09/D-11]

### Legal-information proof

Construct two valid canonical states, project each through the same input builder, and assert byte-equal legal input before asserting equal deployed outputs including returned memory. For SoldierBrain, vary enemies/terrain outside the 5x5, enemy private memories, future schedule/private evaluator metadata, while holding its legal self/grid/objective/memory fixed. For full-board Strategy, do not hide publicly visible board changes: vary only information outside that actual full-board schema. Exercise both methods in fresh and reused supervisor contexts to expose ambient state. [VERIFIED: runtime-inputs.ts; schemas.ts; 263-CONTEXT.md D-11/D-12]

Add positive controls: changing a meaningful legal threat or stale objective should change at least a selected fixture's decision. Equal output from a constant TURN policy is otherwise a vacuous information-boundary pass. In offline teacher-to-student work, equality is conditioned on the final legal objective and memories as well as immediate observation; prior full-board information legally encoded in objectives is not itself leakage. [VERIFIED: 263-CONTEXT.md D-11 and D-12; research design prescription]

### Stable identities, physical shards and scientific roots

Pre-enumerate task identity from admitted commitment, algorithm/schema version, inputs, split, declared structural budget, purpose and ordinal. Give task, stream, attempt, shard and result separate domains. Derive per-task/per-purpose streams; never seed from completion order, worker ID, Date.now or opaque Soldier IDs. Use safe integers and canonical byte ordering, not localeCompare. [VERIFIED: 263-CONTEXT.md D-17/D-22; spec/canonical-json-encode.ts; detailed research identity guidance]

Separate the scientific result root from execution metadata: worker count, shard-size, host timing, retry/attempt history and paths are retained and hashed as operational evidence, but cannot be fields of the bytes required identical across those variants. Physical shard roots may differ by packing; root the same task-sorted semantic record sequence. Failure/attempt ledgers still charge every execution; do not normalize actual system failures into wins, draws or missing data. [VERIFIED: 263-CONTEXT.md D-05/D-18/D-22; logical consequence of invariance requirement]

Resume only already-published, schema-valid, identity-valid complete task records. Reject duplicate semantic task coverage even if bytes match; resume chooses not to enqueue a verified completed task rather than reducing it twice. Reject incomplete/conflicting shards; temp files are never accepted evidence. A lost worker consumes an attempt; a fresh attempt requires remaining frozen retry allocation. Restart does not mint a new scientific task or free compute. [VERIFIED: 263-CONTEXT.md D-05/D-19; research design prescription]

Use one publisher and same-directory temporary shards; validate bytes and expected coverage before publication. Recheck existing destinations rather than overwriting them. Test interruption before write completion, before publish, after publish and before ledger observation. Node fs supports exclusive creation and rename, but concurrent writes require coordination; do not claim rename alone proves no-clobber or power-loss durability. [CITED: https://nodejs.org/docs/latest-v24.x/api/fs.html]

## Don't Hand-Roll

| Problem | Do not build | Use instead |
|---|---|---|
| Rules/turn progression | Mission-specific resolver, copied resolveRound, replay execution loop | MATCH_KERNEL only. [VERIFIED: kernel/driver.ts; D-02] |
| Hostile execution | eval/new Function/vm or worker-thread sandbox | Existing supervised provider adapter. [VERIFIED: D-03/D-21; supervised-subprocess-adapter.ts] |
| Legal observation | Handwritten 5x5 or full-board projection | createStrategyInputV119/createSoldierBrainInputV119. [VERIFIED: runtime-inputs.ts] |
| Canonical bytes/hash input | Sorted JSON.stringify, locale key sorting | Existing canonical JSON parser/encoder and explicit hash domain. [VERIFIED: canonical-json-encode.ts] |
| Scientific admission | New custody/signing infrastructure | Existing admitted roots + narrow strict phase receipt. [VERIFIED: D-01; current STATE.md] |
| Production protection | Private=true as sole guard | Import/reference/deployment negative tests and safe output DTO tests. [VERIFIED: D-04; integrity-boundary checker] |

## Common Pitfalls

1. **Fixture pass mistaken for planner pass.** Phase262 used Starter/Advanced fixtures, not the new hierarchical emitted program. Require measured source/controller gate before factory scale. [VERIFIED: 262-VERIFICATION.md; PLAN-06]
2. **Wrong time budget.** DEFAULT_RUNTIME_LIMITS has 1000ms generic timeout, while runtime-budget-profile-v1-18 contains 50ms invocation wall and its own compute/memory/output vector. Bind the exact admitted lane/profile and do not select whichever makes a test pass. The 120-second cell/60-minute outer closeout bounds are infrastructure, not extra Strategy thinking time. [VERIFIED: runtime.ts; runtime-budget-profile-v1-18.ts; 262-203-SUMMARY.md]
3. **False strictness.** Current input V119 schemas are strict; Action/result schemas shown in schemas.ts use z.object without strict. Do not assert that importing any existing schema rejects all extra lab metadata. Lab envelopes need their own strict bounded validation without changing canonical Strategy semantics. [VERIFIED: schemas.ts]
4. **Stale spec assumptions.** Older research says Advance must be inferred and discusses attacker-facing Backstab. Current input builders expose Advance; predecessor compatibility preserves victim-rear semantics without attacker-facing. Follow the selected kernel/tuple, not old prose. [VERIFIED: runtime-inputs.ts; 257-CONTEXT.md D-12; detailed research old controller text]
5. **Packaging smuggles private state.** Full-state teacher snapshots, closures, globals, host IDs or private diagnostics must not enter emitted dependencies; use byte-identical legal-input pairs through actual source. [VERIFIED: PLAN-04/PLAN-05]
6. **Invariance includes varying metadata.** A root containing worker count or elapsed time cannot be identical across a changed execution configuration. Preserve both scientific and operational roots explicitly. [VERIFIED: FACT-03; D-20/D-22]
7. **A successful local test runs a consumed route.** Existing CLI live selectors are historical single-use execution authority. Reuse source patterns, not their command dispatch/markers/artifacts. [VERIFIED: STATE.md current completion; 262-203-SUMMARY.md]

## Code Examples

Source-based patterns, not executed during research. [VERIFIED: named source files]

### Canonical observation pair

```typescript
// Existing public signatures: packages/engine/src/runtime-inputs.ts
const left = createSoldierBrainInputV119(stateA, soldierId, cycleIndex, advanced, objective);
const right = createSoldierBrainInputV119(stateB, soldierId, cycleIndex, advanced, objective);
// Test helper: compare canonical encoded bytes first.
// Then invoke the SAME immutable emitted source through the supervisor on each.
// Compare action AND returned soldierMemory; no trusted direct eval substitute.
```

### Domain-separated canonical identity

```typescript
// Existing encoder API: packages/spec/src/canonical-json-encode.ts
// Framing via a canonical array avoids ambiguous raw string concatenation.
const encoded = encodeCanonicalJson(
  ["cowards:strategy-lab:task:v1", identityFields],
  { context: "canonical-manifest" },
);
if (!encoded.ok) throw new Error("LAB_IDENTITY_REJECTED");
const taskId = createHash("sha256").update(encoded.bytes).digest("hex");
// identityFields deliberately excludes worker/shard/timing execution metadata.
```

### Kernel protocol boundary

```typescript
// Existing discriminated unions: packages/engine/src/kernel/types.ts
const next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" });
if (next.kind === "effect") {
  // bridge is an injected supervised invocation, NEVER source evaluation here.
  const resume = await bridge(next.request);
  const resumed = MATCH_KERNEL.stepMatch(next.machine, resume);
  // Consume transition/completed/failure exactly; do not mutate next.machine.
}
```

## Bounded Planning Guidance

Seven slices are a recommended organization, not a claim of completion duration. Keep routine corrections within their owning slice. [VERIFIED: scope-to-component mapping above; design prescription]

1. **Private spine and admitted feasibility manifest:** bounded schemas, exact inherited roots, source/benchmark/budget identity, no production dependencies, deterministic corpus inventory.
2. **Mission planner and objective semantics:** ten mission branches, ordered beam, both initiative hypotheses, lexicographic hard constraints, structural counters and fallback reserve.
3. **Local controller and emitted source:** all nine Actions, stale handling, canonical Advance, size/memory/objective limits and self-contained synchronous build.
4. **Supervised feasibility gate:** legal-input paired tests, forced tactics/defense and hostile outputs, actual-source direct-call benchmark inside supervised boundary, exact runtime profile, pass/stop receipt.
5. **Canonical kernel bridge and semantic equivalence:** matched effect corpus, no private-public crossover, three-way failure and cleanup; limited authorized current-formation end-to-end work only.
6. **Tasks, worker pool, shards and resume:** immutable assignment, domain streams, complete coverage, atomic publication, restart accounting; synthetic worker/shard/order matrix first.
7. **One-command reconstruction and phase proof:** bounded real gate plus declared invariance matrix, safe receipt, exact requirement trace, negative production reachability, stop or handoff to Phase264.

### Recommended lean manifest and allocation

Freeze these implementation choices in the phase plan/manifest before inspecting measured outputs; ordinary bounded fixtures are within current Phase263 scope and need no new literal authorization machinery. These are recommendations, not empirical performance promises or changes to inherited scientific gates. [VERIFIED: STATE.md current completion; 263-CONTEXT.md discretion]

- One immutable hierarchical candidate, one exact source/build root, current canonical formation only, the admitted tuple/runtime profile, and the existing Advanced revision as the fixed opponent. Starter remains an optional synthetic regression analog, not another live matchup dimension.
- Twelve pre-enumerated matchup tasks: three existing arena labels × both candidate sides × both initial initiative states. Record the two distinct geometries honestly. Execute each twice, charging **24 total Match attempts**: baseline one worker/shard-size1; reproduction two trusted workers/shard-size3 with reversed dispatch. Compare task-sorted semantic outputs, not physical shard roots or durations.
- **No automatic retry** in this spike allocation. A failed or interrupted attempt remains charged and yields an honest non-pass, not extra work. Resume completed tasks without rerunning them; prove interruption/lost-worker/ambiguous publication branches through injected synthetic faults before real work. If the fixed two-run empirical matrix cannot complete, record the failed gate instead of topping up the budget.
- A proposed operational ceiling of **120 seconds per Match and60 minutes total** is a conservative bounded phase implementation choice, not a measured forecast and not an extension of any consumed Phase262 route. Keep all selected per-method, source, memory and output limits unchanged. Include source builds, benchmark and supervised startup/cleanup in the overall timebox or declare their separate bounded accounting explicitly before execution.
- Benchmark each method on **1000 fixed measured invocations after100 fixed warm-up invocations** (2200 charged invocations total), with a fixed legal-input corpus, fixed order, exact machine/runtime identity, and nearest-rank p99 recorded per method. Measure the method body inside the existing supervised boundary; preserve separate transport/total timings. The inherited benchmark implementation wins if it specifies a different sample policy; these defaults may fill missing implementation details but may not replace that protocol or soften its strictly-below5ms gate.
- Start the structural source spike with **beam width4, at most256 assignment expansions and64 optional local evaluations per call**, deterministic counters and a reserved nine-Action fallback pass. Treat these as tunable pre-measurement implementation parameters, not scientific equal-compute increases; keep the same final frozen counters for all compared tasks. Each of ten missions needs at least one positive and one stale/failure synthetic fixture, plus the legal-information/tactical corpus.
- Retain compact outcomes/accounting for every attempt and the inherited required full-trace sample/failure traces; bind the sample IDs before scheduling. Manifest fields include schema/algorithm/source/corpus/opponent/tuple/budget roots, task/stream domains, allocation, worker variants, trace policy, result projection version and stop rule. Keep operational metadata in its own root.

The numerical defaults above are planner recommendations within the stated discretion; validate them against the existing study allocation/benchmark contract while planning. Only a demonstrated conflict with an immutable contract needs escalation; missing incidental field names or fixture counts do not. [VERIFIED: 263-CONTEXT.md D-01/D-06/D-14/D-17 and discretion; design prescription]

**Time/compute feasibility:** No measured p99, bytes-per-Match or throughput exists for the new planner in this research. The proposed60-minute ceiling is a stop boundary, not an estimate that the experiment will finish. [ASSUMED: new planner performance is unknown until implementation measurement]

## Open Questions

1. **Executable benchmark binding:** pre-search-measurement-policy.json names `v1.38-direct-execution-benchmark-v1`, `profile-neutral-fixed-hardware-class-v1` and a strict below-5ms p99 hard gate; those labels alone do not describe warm-up, corpus, sample count or timing region. Planner must resolve the admitted implementation root and materialize the fixed benchmark protocol before viewing planner results; do not choose a friendlier benchmark afterward. [VERIFIED: .planning/artifacts/v1.38-pre-search-measurement-policy.json; scripts/lib/v1-38-measurement.ts]
2. **Generic runtime bridge:** current lean source is fixture-specific and imports runtime-service. Verify a package-only injected bridge preserves actual selected request/result accounting without production imports or copied classification. If reuse requires a runtime API change, isolate it and prove behavior preservation, not a production migration. [VERIFIED: lean CLI imports; runtime-service execute-match.ts; D-04]
3. **Phase-specific empirical allocation:** the consumed Phase262 route cannot be reused. The fresh bounded Phase263 fixture allocation above is a proposed ordinary implementation choice under the current staged-work scope, not a new candidate-factory or league run. Account it against the frozen study contract; escalate only if an actual immutable allocation conflict is found, and never invent free retries. [VERIFIED: STATE.md; D-01/D-05/D-15]
4. **Trace sampling:** load the exact inherited sample policy, retain required failure/review traces privately and compact outcomes for all work; storage throughput and peak memory remain unmeasured for the new planner. [VERIFIED: SUMMARY.md trace guidance; D-01/discretion]

## Environment Availability

Read-only observations, not fresh runtime readiness or preflight evidence. [VERIFIED: commands run during research]

| Dependency | Available | Observed version | Required action |
|---|---|---|---|
| Node | Yes | 24.15.0 | Capture exact execution identity; preserve selected lane. |
| pnpm | Yes | 11.1.2 | Use existing workspace. |
| Vitest | Yes | 4.1.6 | Existing root config; focused suites before broad regression. |
| Docker CLI | Yes | 29.4.0 | Daemon/image/runtime health not probed in this research; read-only availability check before any approved consuming gate. |
| Supervised container lane | Prior fixture evidence only | Exact image/profile in lean runner | Reverify current availability at execution; never fall back to in-process source. |
| PostgreSQL/Redis/Go service | Not required | — | No new dependency or service startup for this offline phase. |

No live Match, preflight, formation, holdout or source benchmark was run. Missing runtime availability has no weaker-lane fallback; source-only synthetic work may continue without claiming feasibility. [VERIFIED: research action log; D-15]

## Validation Architecture

Nyquist validation is enabled in config; root Vitest config includes test/spec TS files and excludes two exact historical correction suites. [VERIFIED: .planning/config.json; vitest.config.ts]

| Property | Value |
|---|---|
| Framework | Existing Vitest 4.1.6 |
| Config | `vitest.config.ts` |
| Quick proposed command | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/planner/brain.test.ts` |
| Full phase command after implementation | `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab scripts/check-v1-38-lab-boundaries.test.ts` |
| Existing seam regression | `pnpm exec vitest run --maxWorkers=1 packages/engine/src/kernel/kernel-contract.test.ts packages/engine/src/kernel/runtime-ownership.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts` |
| Types | `pnpm --filter @cowards/strategy-lab typecheck` after package creation |

Proposed commands are not available before Wave0 and are not evidence of a green suite. Aim for each focused synthetic file under30 seconds; duration must be measured rather than claimed now. Actual runtime p99 and supervised empirical gate belong to a separately bounded command, not a timer assertion in routine CI. [VERIFIED: package absence; config; design prescription]

| Req ID | Behavior | Test type | Proposed automated command / file | Exists? |
|---|---|---|---|---|
| PLAN-01 | Ordered assignments; both hypotheses; hard-before-soft | Unit/property | vitest run `packages/strategy-lab/src/planner/assign.test.ts` | No, Wave0 |
| PLAN-02 | Ten mission success/stale/failure/fallback branches | Unit | vitest run `packages/strategy-lab/src/planner/missions.test.ts` | No, Wave0 |
| PLAN-03 | Nine Actions; Advance; cheap fallback; tactics | Unit/canonical fixtures | vitest run `packages/strategy-lab/src/planner/brain.test.ts` | No, Wave0 |
| PLAN-04 | Legal-input paired source outputs/memory | Supervised integration | vitest run `packages/strategy-lab/src/planner/information-boundary.test.ts` | No, Wave0 |
| PLAN-05 | Source capability/size/schema bounds and synchronization | Unit + supervised | vitest run `packages/strategy-lab/src/planner/emission.test.ts` | No, Wave0 |
| PLAN-06 | Actual-source fixed p99, forced tactics and exact-runtime feasibility | Bounded empirical | Proposed CLI `scripts/run-v1-38-planner-feasibility.ts`; flags frozen in plan | No; not synthetic-only |
| FACT-01 | One-way source/transitive/deployment graph | Static negative integration | vitest run `scripts/check-v1-38-lab-boundaries.test.ts` | No, Wave0 |
| FACT-02 | Kernel effect equivalence and failure rollback | Integration | vitest run `packages/strategy-lab/src/runtime-bridge.test.ts` | No, Wave0 |
| FACT-03 | worker/shard/order/restart/resume semantic byte equality | Property/integration | vitest run `packages/strategy-lab/src/runner-invariance.test.ts` | No, Wave0 |
| FACT-04 | Strict raw bytes, tampering, duplicates, gaps, partial publication | Unit/fault injection | vitest run `packages/strategy-lab/src/shards.test.ts` | No, Wave0 |

All commands use the `pnpm exec` prefix and `--maxWorkers=1` for routine test orchestration; runner tests explicitly exercise their declared internal worker variants. [VERIFIED: proposed validation design]

**Sampling:** focused affected test per commit; full phase synthetic suite per wave; exact canonical/runtime regression and bounded empirical pass before phase verification. Add shared valid-state/legal-input fixtures in Wave0 and fixed manifest/benchmark fixtures before measured execution. Use explicit 1/2 worker and at least two shard layouts plus reversed/shuffled completion and crash boundaries as a proposed minimum matrix; planner binds exact variants and charges any real reruns before execution. Do not assume synthetic invariance demonstrates actual emitted source determinism. [VERIFIED: D-12/D-22; design prescription]

## Security Domain

Security enforcement is not explicitly disabled, so this section applies. This is an offline hostile-code lab review, not ASVS certification. ASVS5 has reorganized categories; the supplied V2-auth/V3-session/V4-access/V5-validation/V6-crypto template reflects older numbering. Use category names with the actual version, not false ASVS5 IDs. [VERIFIED: config; CITED: https://owasp.org/www-project-application-security-verification-standard/]

| Control area | Applies here | Standard control |
|---|---|---|
| Authentication/session | No new login/session surface | Preserve existing runtime authentication/binding; do not create web auth. |
| Access control | Yes: artifacts/runtime capabilities | Private non-public artifact root, bounded IDs, no production registration. |
| Input validation/encoding | Yes | Canonical raw-byte admission before conversion; strict bounded lab schema, source capability gate. |
| Cryptography/integrity | Yes | Existing SHA-256 domain framing; hashes detect tamper, not independently trusted custody. |
| File handling | Yes | Path allowlist/generated names, no arbitrary traversal, complete publication, no blind overwrite. |
| Data protection/logging | Yes | Safe receipt allowlist; private source/memory/objectives/traces never public/default. |

[VERIFIED: AGENTS.md; 263-CONTEXT.md D-03/D-04/D-19; runtime invocation contracts; CITED: https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x10-V1-Encoding-and-Sanitization.md]

| Threat | STRIDE | Required proof |
|---|---|---|
| Emitted-source host capability escape | Elevation of privilege | Existing supervised adapter plus forbidden-capability hostile tests; no worker/vm security substitution. |
| Changed/truncated shard or manifest | Tampering | Raw-byte bound, strict schema, digest/identity/coverage failure. |
| Privileged teacher leakage | Information disclosure | Paired legal-input outputs and explicit serialization dependency test. |
| Timeout/crash reported as result | Tampering/denial of service | Three-way failure and unchanged-state evidence; no score for system failure. |
| Resume loses/spends work twice | Repudiation/tampering | Fixed tasks, charged attempts, exact coverage and crash-boundary tests. |
| Lab import or artifact reaches product | Information disclosure | Transitive negative import/deployment/safe-output tests. |

[VERIFIED: phase threat derivation from D-03–D-05/D-11/D-19; existing kernel/runtime semantics]

## State of the Art

| Superseded assumption | Current authority | Impact |
|---|---|---|
| CONTEXT says Phase263 denied | Current Phase262 verification and STATE admit staged work | Do not restart consumed fixture gate. |
| SoldierBrain infers Advance | ABI v1.19 authoritative field | Use exact field and pair tests. |
| Replay-owned execution/contiguous activation loop | Canonical machine/effect kernel | Pump effects only, no copied lifecycle. |
| Generic timeout chosen ad hoc | Exact selected signed budget vector + fixed direct benchmark | Bind both operational enforcement and planner p99. |

[VERIFIED: current STATE.md; runtime-inputs.ts; driver.ts; runtime-budget-profile-v1-18.ts; measurement-policy.json]

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | New planner performance/source size/throughput have not yet been established by an implemented spike. | Bounded Planning Guidance | An optimistic inferred beam or wall-time budget could cause an invalid gate; measure within frozen allocation. |

Design prescriptions above are proposed implementation choices, not locked new scientific thresholds. No new package, custody guarantee or authorization is inferred. [VERIFIED: scope of this research]

## Sources

### Repository primary sources

- `263-CONTEXT.md`, current REQUIREMENTS/ROADMAP/STATE and `262-203-SUMMARY.md`/`262-VERIFICATION.md`: scope, current admission and inherited authority.
- `AGENTS.md`, primary consolidated/rules/architecture specs; 257/258/260 CONTEXT: engine ownership, compatibility, legal inputs and failure semantics.
- `packages/engine/src/kernel/{driver,types,step}.ts`, `runtime-inputs.ts`: exact protocol and observation builders.
- `packages/spec/src/{schemas,runtime,runtime-invocation-v1-17,runtime-budget-profile-v1-18,canonical-json-encode}.ts`: schemas, limits, signed invocation and canonical bytes.
- `apps/runtime-service/src/execute-match.ts`; `packages/runtime-js/src/supervised-subprocess-adapter.ts`; lean runner/session source: existing supervision and fixture-specific limitations.
- `scripts/check-v1-37-integrity-boundaries.ts`, kernel/canonical-json/session tests, root package/config: reusable tests and boundary monitors.
- `.planning/artifacts/v1.38-pre-search-measurement-policy.json`, `scripts/lib/v1-38-measurement.ts`, foundation handoff and competitive-strategy research: fixed p99/source targets, mission concepts and older assumptions.
- All local claims are tagged with their repository source; they are not registry-legitimacy assertions. [VERIFIED: research read/search log]

### Official external documentation

- https://nodejs.org/docs/latest-v24.x/api/worker_threads.html — CPU worker pools and message data; existing APIs only, no newer-minor API dependency.
- https://nodejs.org/docs/latest-v24.x/api/fs.html — file publication primitives and concurrent-write caveats.
- https://owasp.org/www-project-application-security-verification-standard/ — version-aware security review scope.
- https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/en/0x10-V1-Encoding-and-Sanitization.md — code/data injection prevention.
[CITED: official URLs above]

## Metadata

Research seam selected Jina for three official-URL scrape questions. Jina and Context7 tools were unavailable; official pages were opened with the built-in web tool. Classification seam returned MEDIUM for cross-checked websearch, LOW for unrecognized codebase/webfetch provider labels; these are routing confidence labels, not an empirical planner pass. Digests were cached conservatively at LOW. No external package gate was needed because no external package installation is proposed. [VERIFIED: research-plan/classify-confidence/research-store tool results]

**Confidence breakdown:** standard stack MEDIUM (existing declarations/executables and official Node cross-check); architecture MEDIUM (locked scope plus exact source seams); pitfalls MEDIUM (current code/contract cross-check); throughput and planner feasibility LOW/unmeasured. [VERIFIED: confidence seam; cited source inspection; no empirical run performed]

**Valid until:** Recheck on any selected tuple/runtime/source/contract change; recheck environment immediately before authorized execution. This is a source-level planning handoff, not a benchmark result or production certification.
