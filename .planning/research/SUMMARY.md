# Project Research Summary

**Project:** Coward's Game v1.38 Competitive Strategy Factory and Adversarial League

**Domain:** Reproducible offline Strategy generation, adversarial empirical-league evaluation, and lab-only causal starting-formation research

**Researched:** 2026-07-27

**Confidence:** HIGH for scope, trust boundaries, and dependency order; MEDIUM for final budgets, throughput, and oracle implementation details; outcomes intentionally UNKNOWN

## 2026-08-12 Binding Local-Seal Revision

The operator confirmed that no external custody system exists and approved `single_operator_local_seal_v1` for future routing. One named repository operator controls a restricted out-of-repository store and one closed opening command; local-seal mechanics and independent verification of their evidence are still pending. This is procedural sealing, not independent custody, and it makes no independent/third-party custody, separate-permissioning, non-collusion, comprehensive-host-monitoring, cryptographic-erasure, forensic-deletion, or malicious-owner-resistance claim. ADMIT-03 remains blocked, SEAL-01 remains pending, and candidate search, Phase 263, formation, holdout opening, public exposure, activation, and production remain unauthorized until the exact two-latch activation join passes.

Commitment-secret ingress is only `<absolute-local-seal-root>/input/commitment-secret.bin` under the owner/type/mode/size/no-follow/read-once/zero-fill/unlink/parent-fsync contract in the binding activation prompt. Secret bytes never enter CLI, environment, logs, Git, tests, receipts, artifacts, or output. Historical external-custody decisions and terminal roots remain truthful immutable history; this section supersedes their future routing only.

## Executive Summary

v1.38 should build a private, reproducible research control plane beside Coward's Game, not a second game engine, production backend, runtime, rules version, or public league feature. The lab should reuse the exact v1.37-certified semantic tuple and the existing canonical `MATCH_KERNEL` as the sole transition authority. It should add deterministic task planning, immutable provenance, content-addressed evidence, materially independent response oracles, complete empirical payoff matrices, a frozen PSRO/double-oracle league, and current-rules finalist certification. Candidate source emitted by search, models, humans, or external submitters remains hostile and must execute behind the existing supervised runtime boundary; no Strategy source may execute in web, API, or Go.

The dependency order is binding. First admit the v1.37 foundation, reproduce the persisted current-rules matrix as a regression fixture, and freeze measurement, budget, claim, red-team, failure, holdout, and selection contracts. Then prove a legal hierarchical planner, build the immutable factory and independent oracles, run and red-team the serious current-rules league, and freeze its complete evidence root. Only that valid current-rules freeze may unlock executable formation-profile materialization. The formation study must then retrain current-edge, inward-rank, and bracket-shield populations separately from one precommitted common root under equal deterministic work, equal model/human scrutiny, isolated stores and caches, and the unchanged engine and rules. All three populations freeze before the common operator-sealed local holdout opens once.

The principal risks are experimental code becoming production-reachable, baseline or holdout contamination, post-result threshold changes, correlated “independent” oracles, unequal cross-profile adaptation, hostile-source/runtime boundary erosion, privacy leakage, and claims broader than bounded evidence supports. Prevent these with disjoint evidence schemas, executable negative-reachability tests, separate holdout custody, append-only failed-attempt ledgers, content-addressed freeze receipts, exact equal-compute reconciliation, claim lint, and independent tagged-checkout verification. A failed practical anti-dominance gate, no robust pure finalist, or a rejected bracket is a valid empirical result when the process is sound. No result in v1.38 may claim mathematical optimality, exact exploitability, permanent balance, or authorize a production rule change.

## Binding Interpretation and Conflict Reconciliation

The [v1.38 activation prompt](../milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md) is the controlling contract. The research reports are consistent on the hard boundaries but differ in implementation granularity and phase grouping. Roadmapping should use these resolutions:

1. **Core package versus separate oracle packages:** Use one private `@cowards/strategy-lab` core package for contracts, identity, ledgers, matrices, profile-independent orchestration, evidence, and analysis. Put the structured optimizer, search teacher/distiller, and model-guided explicit-program synthesizer in separate packages with a shared-helper allowlist. The stack report's single-package shape is the minimum; the architecture report's stronger physical separation should prevail because oracle independence is an experimental variable. CLI entry points and the holdout evaluator are offline executables, not new network services.
2. **Direct-engine speed versus hostile-source isolation:** Trusted repository-owned search/teacher representations may call the canonical engine directly. Emitted Strategy source from any search, model, human, or external channel is hostile and must use the existing supervised provider/runtime boundary. There is no `eval`, `new Function`, Node `vm`, dynamic import, or worker-thread “sandbox.”
3. **Current freeze versus formation protocol precommitment:** Phase 1 must precommit the exact three-profile scientific protocol, coordinate definitions, equal-compute dimensions, telemetry, and rejection logic. It must not materialize executable inward/bracket initial states, profile run manifests, or profile-trained candidates. Those artifacts require the later current-league freeze receipt.
4. **Current league versus current-edge experimental control:** The pre-formation current-rules league establishes and freezes the serious baseline, oracle field, protocol, and permitted common root. After that freeze, the formation experiment independently retrains all three arms—including the current-edge control—under equal budgets. Fixed current-rules Strategies are screening inputs, not final formation evidence.
5. **Pre-formation versus final certification:** Before freeze, current finalists need legal-information, deterministic-repeat, source/memory/objective/output, runtime-profile, and replay-review feasibility proof. Full product-path certification—supported runtime, runtime-service, canonical Chronicle/replay, Go completion, persistence, privacy, standings, and E2E—applies only to current-rules finalists and must be complete before milestone closure. Experimental artifacts never enter those paths.
6. **Development evaluation versus sealed evaluation:** The current league may use frozen development, validation, and independent probe fields before formation. The common sealed arena/opponent holdout remains unopened until the separately retrained current, inward, and bracket populations, finalists, thresholds, and red-team outputs are all frozen.
7. **Canonical Chronicle versus lab trace:** Current-rules finalist certification uses canonical Chronicle and persistence. Development Matches and all three formation-arm Matches use a distinct private `lab-only` trace/evidence class. Even the current-edge control in the formation experiment does not become canonical Match evidence merely because its starting coordinates match production.
8. **“Exploitability” language:** Reports may state an **oracle-relative response gap** under named frozen oracles, budgets, populations, conditions, and versions. They may not report exact exploitability, convergence to Nash, an optimal Strategy, a solved game, permanent balance, or a meta-free future.

## Key Findings

### Recommended Stack

Keep the production stack and production dependency graph unchanged. Add offline packages and scripts using already pinned tools; the core path needs no new npm dependency.

**Core technologies:**

- **Node.js 24.x:** Offline lab host, exact task planner, built-in cryptography, and bounded trusted worker pool. Every run records the exact Node patch, V8, OpenSSL, OS, architecture, CPU, and worker count.
- **pnpm 11.1.2 workspaces:** Private package isolation and frozen-lockfile reproduction.
- **TypeScript 6.0.3:** Lab contracts, search algorithms, provenance, orchestration, matrices, analysis, and report generation alongside the existing TypeScript engine/spec/replay seams.
- **`@cowards/strategy-lab`:** New private core package. No production package, app, image, route, or generated contract may depend on it.
- **Separate oracle packages:** Structured tactical optimizer, high-level search teacher/distillation, and model-guided explicit program synthesis. They may share literal legality, geometry, schemas, artifact creation, and reporting—not selectors, mission scoring, Action scoring, search trees, learned parameters, or prompts.
- **`@cowards/engine`:** Sole transition authority through the exact selected `MATCH_KERNEL.createMachineV119` and `MATCH_KERNEL.stepMatch` identities.
- **`@cowards/spec`:** Canonical types, strict Zod schemas, canonical JSON, hashes, runtime envelopes, semantic-tuple resolution, arena identity, and Set-condition identity.
- **`@cowards/replay`:** Canonical current-finalist certification and sampled current-path reconstruction; it does not admit experimental traces.
- **Existing runtime-service / Runtime Broker / supervisors:** Hostile Strategy validation and execution, with three-way success/player-violation/system-failure semantics and no fallback.
- **Zod 4.4.3:** Strict lab manifests and process/file boundary validation using disjoint discriminants rather than optional experimental fields in production schemas.
- **Vitest 4.1.6:** Determinism, property/invariant, tamper, hostile-input, boundary, matrix-completeness, algorithm, and negative-reachability tests. Benchmarks are capacity observations only.
- **`tsx` 4.22.0:** Repository-local lab CLI entry points.
- **Content-addressed filesystem artifacts:** Immutable canonical JSON/NDJSON objects, shards, roots, matrices, traces, receipts, and signatures outside production PostgreSQL.
- **Node `crypto`:** Domain-separated SHA-256, HMAC-SHA-256, and Ed25519 evidence primitives using repository conventions.
- **`worker_threads`:** Trusted CPU parallelism only, with preassigned tasks/seeds and canonical reduction. Worker count and completion order must not alter result bytes.
- **Existing PostgreSQL, Go, Playwright, service, replay, and public-proof lanes:** Used only for ordinary current-rules finalist admission and final product-path certification.
- **No new custody dependency:** Use the restricted out-of-repository local-seal store and existing Node cryptographic/filesystem primitives. Do not add a fake external identity, service, signer, or package.

**Required identity binding:**

Every counted research root binds the exact Git commit and dirty-state declaration, lockfile digest, host/toolchain identities, selected semantic tuple, rules, engine, runtime ABI, Chronicle, arena catalog, Set policy, canonical JSON version, runtime/provider identities, algorithm and PRNG versions, task/profile/artifact schemas, corpus/split hashes, structural budgets, retry policy, task coverage, shard roots, and local-seal receipts. Observed labels include `cowards-rules-v1.4`, `engine-kernel-v1.37-candidate-1`, `strategy-runtime-abi-v1.19`, `chronicle-recorder-current-events-v1.37-candidate-1`, `canonical-arena-catalog-v1.37`, and `canonical-set-policy-v1.37-four-condition-v1`; implementations must resolve the selected tuple rather than trust copied strings.

**Storage and execution rules:**

- Lab artifacts live in a task-specific private store, not production tables.
- Write complete temporary shards, validate coverage/digests, atomically publish, and merge in canonical task-id order.
- System failure, missing work, duplicate/conflicting results, schema errors, or truncated shards invalidate the matrix/root; they are never imputed as losses or draws.
- Keep full traces only for a precommitted sample, failures, finalist review, and sealed custody needs; retain compact outcomes and required telemetry for every Match.
- Model calls occur outside the runner through immutable request/response bundles. Do not add provider SDKs, agent frameworks, live inference, or network access to Match execution.
- No Match-time Strategy may access live models or humans, network, filesystem, clock, nondeterministic randomness, dynamic code, imports, external services, or other host capabilities. Offline authoring must distill to deterministic, self-contained, package-free source within the canonical ABI and limits.
- Public/default reports, DTOs, pages, replays, logs, proofs, and archives must omit Strategy source and artifact bytes, StrategyMemory, SoldierMemory, objective payloads, raw observations/Awareness data, raw diagnostics, sealed identities/preimages, private evaluator state, host paths, environment values, credentials/tokens, database details, and security internals. Private research evidence stays access-controlled and receives a separate safe aggregate projection.

### Expected Features

#### Must Have — Table Stakes

1. **Foundation admission and regression:** Verify the v1.37 archive/tag/post-tag closure and exact selected tuple; reproduce the persisted current-rules matrix and treat Starter/Advanced only as smoke/regression fixtures.
2. **Immutable measurement contract:** Freeze scoring, sides, initiative conditions, semantically distinct arenas, splits, opponent fields, candidate/node/Match budgets, model/prompt/token budgets, human procedure, replay review, runtime limits, retries, metrics, thresholds, stopping, finalist selection, claims, holdout commitment, and failure interpretation before candidate tuning.
3. **Process/outcome separation:** Distinguish process or integrity failure, valid current-rules metagame failure, bracket rejection, bracket empirical pass, and holdout contamination. Failed empirical gates do not authorize threshold changes or rules changes.
4. **Deterministic one-command lab:** Enumerate all work first, derive per-task streams from a root commitment and stable identity, reproduce results across worker/shard/order/restart permutations, and preserve append-only attempts and failures.
5. **Legal hierarchical planner spike:** Prove full-board ordered Soldier/mission assignment and a 5x5 SoldierBrain that considers all nine Actions, stale objectives, exact visible rules, authoritative Advance state, both initiative hypotheses, and a cheap legal fallback within source/objective/memory/runtime limits.
6. **Mission-capable coordination:** Support evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer missions with lexicographic survival/tactical constraints.
7. **Immutable Strategy factory:** Emit exact source/build identities, compatibility, lineage, doctrine/oracle family, deterministic manifests, validation, runtime profile, behavior fingerprint, split identity, and accepted/rejected ledger entries. Accepted candidates never mutate.
8. **Legal information-set enforcement:** Deployed decisions reproduce from canonical Strategy/SoldierBrain input, objective, and memory only. Privileged offline teachers may score counterfactuals but cannot leak hidden facts into emitted choices.
9. **Independent response channels:** At least three materially independent automated response mechanisms plus a separately documented human/external channel. Preserve failed, invalid, duplicate, legal-but-weak, and successful attempts.
10. **Complete current-rules league:** Complete mirrored payoff cells across both sides, both entrant-level initiative states, and each distinct design arena; frozen-snapshot PSRO/double-oracle iterations; mixture- and pure-targeted responses; clone rejection; meta-distributions; best-response graphs; and oracle-relative gaps.
11. **Portfolio and robust pure selection:** Preserve a diverse pure portfolio and select a separate deployable pure finalist using precommitted mixture, strongest-pure, pure-worst-case, probe, invariance, legality, and runtime evidence. The mixture is diagnostic, never a deployable entrant.
12. **Current-rules red team and hard freeze:** Exhaust the declared automated, model, and human attack budget; feed successful development counters through the frozen response policy; retain failed attacks; then freeze sources, populations, matrices, distributions, thresholds, ledgers, red-team logs, finalist choices, holdout policy, and interpretation before formation artifacts exist.
13. **Exact lab-only profile boundary:** After the current freeze, materialize exactly current edge rank, full inward rank, and the specified edge-anchored bracket shield through a position-only initial-state adapter. All subsequent transitions use the unchanged canonical kernel.
14. **Negative production reachability:** Experimental profiles and artifacts must fail canonical Strategy registration, account save, Match creation, runtime-service Match requests, arena admission, canonical Chronicle validation, persistence, counted/exhibition scheduling as canonical play, standings, Go/API creation, replay/result/discovery reads, public DTOs, and production deployment graphs.
15. **Separate equal-compute retraining:** Retrain all three profiles independently with equal doctrine/core eligibility, common-root policy, candidate counts, response iterations, search nodes, model/human budgets, Match schedules, sides, initiatives, arena corpus, split/holdout policy, runtime limits, hardware class, cache/retry rules, and replay-review effort. No learned artifact or cache crosses profile namespaces.
16. **Formation diagnostics and hard rejection gates:** Measure canonicalized opening entropy and clusters, forced evacuation, unselected first-Contraction reserves, first interaction, Backstabs by timing/cause, pushes/blocks, no-Advance STONE, center/wing/convoy/turtle behavior, draws, Match length, Contractions, ACTIVE survival, response gap, pure-policy worst case, and best-response graph.
17. **Freeze all before one open:** Freeze every profile population, finalist, threshold, red-team output, and compute ledger before the common arena/opponent holdout opens once. No post-open tuning, candidate admission, threshold change, interpretation change, or second diagnostic query.
18. **Invariance, leakage, and privacy proof:** Test side, initiative, horizontal symmetry, opaque IDs, Soldier/source ordering, deterministic repeat, held-out opponents, legal information sets, runtime boundaries, and private-data markers.
19. **Current-only product certification:** Certify frozen current-rules finalists through supported runtimes, runtime-service, canonical Chronicle reconstruction, Go completion, persistence, replay, privacy, standings, and E2E. Experimental artifacts remain private lab evidence.
20. **Persistent evidence and release closure:** Preserve runner, manifests, legal corpus, lineage, fingerprints, independence proof, populations, matrices, distributions, response graphs, attempt/failure logs, holdout access proof, current certification, profile manifests, causal comparison, and final report; finish with independent verification, adversarial review, privacy scans, complete requirements trace, audit, archive, annotated tag, and post-tag verification from the tagged tree.

#### Starting Gates to Calibrate and Freeze

These are activation-prompt starting values, not outcomes or permission to tune after seeing candidates:

- zero accepted runtime violations, system failures, information-boundary violations, or private-data leaks;
- source below 64 KB, preferably below 48 KB, and direct execution targeting below 5 ms p99 on one fixed identified benchmark;
- at least 12 league Strategies across six behavioral families and five genuinely independent planner cores;
- at least three structurally and behaviorally distinct finalists;
- two consecutive response iterations above 55% Set score against the preceding frozen mixture on untouched conditions;
- at least one deployable Strategy above 60% against an independent probe field;
- above 70% against Advanced remains regression-only evidence;
- a fresh red team either cannot exceed 60% against the robust finalist or finds a counter to which the next declared response iteration adapts; and
- no leading result depends materially on side, initiative, duplicate arenas, opaque IDs, source/Soldier order, invalid output, runtime failure, or tie-break artifacts.

Planning may justify different calibrated values only inside the pre-search contract. The final values and exact denominators must freeze before candidate output is inspected.

#### Exact Formation Contract

The Phase 1 measurement contract precommits these literal profiles, but executable alternate-profile manifests, initial states, candidates, traces, and results cannot be materialized until the current-league freeze:

| Profile | Top Soldiers | Bottom Soldiers | Role |
|---|---|---|---|
| Current edge rank | `y=0, x=2..9` | `y=11, x=2..9` | Canonical control |
| Full inward rank | `y=1, x=2..9` | `y=10, x=2..9` | Control for moving the complete rank inward |
| Edge-anchored bracket shield | Rear wings `y=0, x={2,3,8,9}`; forward center `y=1, x={4,5,6,7}` | Rear wings `y=11, x={2,3,8,9}`; forward center `y=10, x={4,5,6,7}` | Partial evacuation-relief challenger |

Every Soldier retains the current inward facing. The bracket rationale is part of the experiment contract:

- rear-wing behind squares are off-board;
- the four empty center rear squares form an initially sealed pocket;
- all eight directly inward squares are empty;
- only four Soldiers remain on the first-Contraction boundary; and
- protection decays as the formation moves rather than disabling Backstab globally.

All three arms use the same lab-only construction path. The current Cycle cap, MOVE and reversal rules, collision and push behavior, Backstab geometry and scan timing, activation counts, arenas, runtime contract, scoring, Set conditions, Contraction, outcome rules, and every other non-position field remain byte- or identity-equivalent under the declared comparison. Cap, MOVE, Backstab, and scan changes require separately approved later experiments after the primary causal result.

#### Should Have — Research Differentiators

- source-structure, lineage, dependency, legal-input decision, Chronicle-behavior, and matchup-response fingerprinting rather than label- or source-hash-only diversity;
- mixture-targeted and strongest-pure-targeted responses in every declared response round;
- failed attacks and rejected candidates as first-class, budget-charged evidence;
- immutable stage roots and one-way dependency proofs;
- a one-open common holdout under separate custody;
- equal model and human scrutiny, disclosure, and replay-review effort across all profiles;
- canonicalized opening/script and convoy/STONE/turtle classifiers with representative private replay review;
- a privacy-safe causal decision packet containing explicit limitations and `production_authorized: false`; and
- outcome-honest closure when the current gate fails, no pure finalist clears selection, or the bracket is rejected.

#### Defer or Forbid

- production adoption of inward/bracket starts, a generic production `initialStateProfile`, experimental rules/arena registration, canonical lab Chronicles, public profile toggles, or automatic promotion;
- Cycle-cap reduction, facing-only MOVE, reversal changes, attacker-facing Backstab, Backstab scan changes, or combined interaction profiles in the primary experiment;
- new official arenas, Strategy languages, package ecosystems, runtime migrations, production sandbox claims, durable ratings, prizes, tournaments, publishing, moderation, recovery, or broad league UI;
- OpenSpiel as a game implementation, ML frameworks, distributed orchestration platforms, new databases/queues, provider SDKs, or exact-solver dependencies without a later measured need;
- one handcrafted champion, one shared scorer under several oracle labels, aggregate-win-rate-only selection, or PSRO-mixture deployment; and
- exact exploitability, Nash/optimality, solved-game, permanent-balance, or “cannot develop a meta” claims.

### Architecture Approach

Use a functional canonical core with an offline content-addressed control plane and explicit evidence classes.

**Major components:**

1. **Lab contracts and identity:** Strict schemas, tagged ids, canonical encoding, domain-separated hashes, evidence classes, and artifact roots; owns no production tuple or registration.
2. **Measurement and budget contracts:** Conditions, splits, metrics, gates, retries, work units, report logic, equal-compute vectors, and holdout commitment.
3. **Candidate factory and provenance DAG:** Immutable source/build nodes, lineage edges, validation, behavior fingerprints, split identity, and accepted/rejected decisions.
4. **Deterministic scheduler and search ledger:** Preassigned node/task ordinals, independent seeds, bounded retries, canonical reductions, chained shards, and actual-consumption receipts.
5. **Independent oracle packages:** Structured optimizer, search teacher/distiller, and explicit-program synthesis with enforced strategic-core isolation.
6. **Human/model red-team intake:** Quarantine, exact prompts/model/tool/personnel/budget provenance, immutable source, strict validation, and preserved failures.
7. **Lab runtime bridge:** Existing supervised providers and canonical ABI envelopes; never web/API/Go execution and never gameplay classification.
8. **League coordinator and meta analysis:** Frozen populations, complete matrices, meta-distributions, strongest-pure targets, response admission, graphs, and oracle-relative metrics.
9. **Lab trace and private artifact store:** Distinct non-Chronicle evidence envelopes, immutable artifacts, private replay review, and privacy-safe aggregate projections.
10. **Current-league freeze gate:** One root binding every source, population, matrix, threshold, ledger, red-team attempt, finalist choice, holdout commitment, and interpretation.
11. **Post-freeze position adapter:** Exact current/inward/bracket positions only; verifies zero non-position state drift and uses `stepMatch` exclusively afterward.
12. **Equal-compute auditor:** Compares planned allocations and actual consumption across profile branches, including cache, retry, model, human, hardware, Match, and review units.
13. **Closed operator-local holdout evaluator:** Private preimages and one-shot batch evaluation under `single_operator_local_seal_v1`; the iterative coordinator sees only a commitment and bounded released receipt.
14. **Current-only promotion bridge:** Re-admits exact current finalist source through ordinary canonical Strategy Revision validation and proves the source-hash join.
15. **Decision and release proof:** Causal report, explicit pass/reject, non-authorization, privacy projection, independent reproduction, audit root, archive, annotated tag, and tagged-tree post-check.

**Required data flow:**

```text
v1.37 admission
  -> measurement, claim, budget, custody, and failure freeze
  -> legal planner feasibility
  -> deterministic factory + independent response channels
  -> complete current-rules league + model/human red team
  -> immutable current-league freeze
  -> executable formation-profile materialization
  -> isolated equal-compute current/inward/bracket retraining + equal red teams
  -> freeze all three branches
  -> one common sealed holdout open
  -> causal pass/reject packet + current-only product certification
  -> independent verification, audit, archive, annotated tag, post-tag check
```

**Production-denial direction:**

```text
lab/oracle/holdout packages -> canonical engine/spec/runtime adapters

engine/spec/replay/runtime-service/Go/persistence/service/web/worker
  -X-> strategy-lab profiles, traces, decision packets, or holdout data

experimental artifacts
  -X-> canonical registration
  -X-> canonical persistence or Chronicle admission
  -X-> counted scheduling or standings
  -X-> public/default product surfaces
  -X-> production deployment manifests
```

### Critical Pitfalls

1. **Lab profiles become production-reachable:** Optional production fields, shared enums, flags, canonical rows, or public replay switches are activation paths. Prevent them with disjoint schemas/stores, one-way imports, closed production DTOs, mutation-tested denial matrices, and proof that a synthetic passing bracket changes no selector.
2. **Baseline or holdout contamination:** Formation work, score feedback, filenames, prompts, aggregate diagnostics, or shared reviewers can leak backward without a raw file open. Require an executable current-freeze prerequisite, separate custody/process/filesystem roles, one bounded batch release, access/query ledgers, contamination tests, and retirement after disclosure.
3. **Post-hoc methods or unequal adaptation:** Threshold softening, sparse-cell imputation, profile-specific stopping, free retries, cached cross-profile work, or unequal model/human effort can manufacture a preferred result. Hash the analysis and stopping code, require complete matrices, charge failures, isolate branches/caches, and reconcile planned versus actual multi-resource budgets.
4. **False independence or overstated convergence:** Several names around one selector and a bounded oracle plateau do not establish robustness. Enforce a shared-helper allowlist, dependency and counterfactual-correlation evidence, preserve pure worst cases and full iteration curves, and scope every response claim to the frozen oracle set and budget.
5. **Runtime, provenance, privacy, or release-chain erosion:** Direct hostile-source imports, mutable “latest” artifacts, system failures scored as gameplay, private lab/holdout data in reports, or tags that omit actual attempts invalidate the result. Use supervised execution, complete content identities, three-way failure semantics, artifact-wide key/value privacy scans, one root manifest, clean tagged-checkout reproduction, and an annotated tag at the exact complete archive commit.

## Implications for Requirements and Roadmap

Requirements should be organized by evidence gate rather than by UI or package. Each requirement needs an observable artifact or executable denial, an explicit failure disposition, and a statement of whether it applies to current canonical play, private lab evidence, or both.

Recommended requirement groups:

- **ADMIT:** v1.37 tuple admission, predecessor proof, regression matrix, and fail-closed prerequisite handling.
- **CONTRACT:** measurement, scoring, conditions, budgets, splits, metrics, thresholds, claims, retries, finalist selection, holdout, and report logic.
- **PLANNER:** hierarchical planning, mission coverage, legal 5x5 brain, information-set discipline, deterministic fallback, and deployability limits.
- **FACTORY:** immutable source/build provenance, lineage, ledger, reproducibility, behavior fingerprints, clone handling, and hostile-source validation.
- **ORACLE:** three materially independent automated mechanisms, separate human/external intake, model/human procedures, and failed-attempt retention.
- **LEAGUE:** complete mirrored matrices, frozen-snapshot responses, meta-distributions, pure targets, portfolio, robust pure selection, red-team closure, and oracle-relative reporting.
- **FREEZE:** current-league root, one-way dependency graph, preliminary current certification, and executable prohibition on pre-freeze formation materialization.
- **LAB:** exact three-profile position-only seam, canonical current equivalence, private trace class, unchanged rules/kernel, and negative production reachability.
- **EQUAL:** isolated branches, common-root policy, planned/actual compute reconciliation, equal model/human attack, and no cross-profile learned/cache reuse.
- **SEALED:** three freezes, separate custody, commitment verification, one open, no post-open tuning, invariance/leakage proof, and contamination disposition.
- **DECIDE:** precommitted formation rejection logic, causal comparison, limitations, safe aggregate packet, rejection report or empirical-pass packet, and explicit non-authorization.
- **CERTIFY:** current-only supported-runtime, runtime-service, Chronicle/replay, Go, persistence, privacy, standings, and E2E proof.
- **CLOSE:** independent reproduction, adversarial review, requirement trace, audit, archive root, annotated tag, and tagged-tree post-check.

### Suggested Phase Structure

### Phase 1: Foundation Admission, Measurement Contract, Custody, and Containment Skeleton

- **Rationale:** No candidate or empirical result is meaningful until the exact v1.37 authority, conditions, claims, budgets, and information-release policy are immutable. Containment expectations must exist before lab code can widen dependency graphs.
- **Delivers:** Predecessor admission; current-matrix regression; exact tuple resolution; measurement/budget/claim/failure/finalist contracts; compute-unit ontology; profile protocol precommitment without executable alternate states; named holdout role and commitment procedure; privacy classifications; artifact/evidence schemas; negative import/deployment/schema monitors.
- **Addresses:** ADMIT, CONTRACT, the policy part of LAB/EQUAL/SEALED, and starting-gate calibration.
- **Avoids:** Contaminated baseline, post-hoc thresholds, holdout feedback, equal-compute theater, and production reachability.
- **Stop condition:** Any predecessor defect returns to the integrity foundation. Do not repair canonical engine/runtime defects in v1.38.

### Phase 2: Legal Planner Feasibility and Deterministic Runner

- **Rationale:** Planner legality, deployability, and throughput are the largest technical uncertainties. Prove them before scaling candidate generation or fixing final Match budgets.
- **Delivers:** Full-board ordered assignment spike; mission vocabulary; 5x5 all-Action SoldierBrain; legal-information-set and hidden-state-pair tests; source/objective/memory/runtime limits; cheap fallback; task identity/seed derivation; worker/shard/restart invariance; current-path effect-pump equivalence; one-command non-secret reproduction.
- **Addresses:** PLANNER and the deterministic execution spine of FACTORY.
- **Avoids:** Privileged teacher leakage, completion-order search, illegal undeployable planners, hidden machine state, and author-machine-only runs.
- **Valid result:** Feasibility may fail honestly; do not compensate with more compute or relaxed runtime limits.

### Phase 3: Immutable Factory, Independent Oracles, and Red-Team Intake

- **Rationale:** The league needs immutable candidates, complete provenance, genuine strategic independence, clone evidence, and safely handled hostile submissions before payoffs can support claims.
- **Delivers:** Candidate/lineage DAG; content-addressed store; append-only attempts; supervised runtime bridge; behavior fingerprints; clone corpus and frozen thresholds; three separate strategic-core packages; provider-neutral model bundles; human/external quarantine; exact budget/provenance records; shared-helper allowlist and independence proof.
- **Addresses:** FACTORY and ORACLE.
- **Avoids:** Mutable revisions, false diversity, correlated channels, hostile-source execution in the coordinator, censored failures, and provider drift.
- **Gate:** At least three materially independent automated mechanisms plus the documented human channel must pass readiness before league claims.

### Phase 4: Serious Current-Rules League and Development Red Team

- **Rationale:** A fixed tournament cannot reveal counters, non-transitivity, or pure-policy brittleness. The canonical current field must be attacked to the full precommitted development budget before it can serve as a baseline.
- **Delivers:** Complete side/initiative/distinct-arena matrices; deterministic meta-solver; frozen-snapshot PSRO/double-oracle rounds; mixture and strongest-pure targets; legal/novel/positive response admission; response-gap curves; best-response graph; diverse pure portfolio; robust pure finalist rule; independent probe field; model/human red team; one final declared response closure.
- **Addresses:** LEAGUE and current development evaluation.
- **Avoids:** Sparse-matrix solving, aggregate-win-rate champions, Advanced-library authority, PSRO-mixture deployment, weak-oracle “convergence,” and hidden pure counters.
- **Boundary:** No executable inward/bracket state, run manifest, candidate, replay, or profile result exists in this phase.

### Phase 5: Current-League Freeze and Pre-Formation Gate

- **Rationale:** Formation causality requires a fixed, reviewable current-rules baseline and an executable one-way gate, not a date, branch, or mutable “latest” directory.
- **Delivers:** One immutable root binding current sources, populations, matrices, meta-distributions, attempt/failure ledgers, thresholds, budgets, red-team logs, finalists, probe results, holdout commitment, and claim interpretation; preliminary legal/runtime/replay certification; source-hash promotion design; dependency proof that no current artifact depends on formation work.
- **Addresses:** FREEZE.
- **Avoids:** Moving-target comparisons, bracket-aware baseline tuning, retrospective threshold edits, and profile code racing ahead.
- **Valid result:** A process-valid current metagame gate may fail and still be frozen as an honest result. Formation may proceed only if the process/evidence root is valid; a process or integrity failure blocks it.

### Phase 6: Post-Freeze Formation Boundary and Negative-Reachability Proof

- **Rationale:** Only the valid current freeze may unlock experimental state construction. The state seam and production denial belong together so convenience cannot create a latent shipping path.
- **Delivers:** Exact current-edge, inward-rank, and bracket-shield manifests; position-only adapter; current-control byte/transition equivalence; zero non-position diff; board-bounds/occupancy/terrain/facing realism; distinct private trace schema; registration/arena/runtime/Go/persistence/scheduling/Chronicle/replay/public/deployment denial matrix; rollback proof with canonical hashes unchanged.
- **Addresses:** LAB.
- **Avoids:** Generic production profile switches, formation-as-arena, forked rules, canonical experimental Chronicles, public previews, and combined cap/MOVE/Backstab/scan changes.

### Phase 7: Equal-Compute Three-Profile Retraining, Equal Red Teams, and Branch Freezes

- **Rationale:** Fixed-policy transfer and equal Match counts do not measure adapted formation quality. Every arm needs isolated learning and equal creative pressure from the same frozen common root.
- **Delivers:** Separate current/inward/bracket namespaces and stores; identical allocation manifests; isolated cache/lineage DAGs; separate retraining; complete matrices; equal automated/model/human attacks; actual-consumption audit; canonicalized opening/script diagnostics; convoy/STONE/turtle and interaction metrics; per-profile populations, pure finalists, and freeze roots.
- **Addresses:** EQUAL and the experimental part of LEAGUE.
- **Avoids:** Cross-profile warm starts, cache poisoning, unequal retries/tokens/review, cosmetic entropy, robust scripted openings, inert reserves, convoy or STONE-shield turtles, and compensating composite scores.
- **Gate:** Any unproved compute/disclosure/review equality or cross-profile learned dependency invalidates the comparison and blocks holdout opening.

### Phase 8: One-Shot Sealed Evaluation, Current Certification, Decision, and Release Closure

- **Rationale:** Confirmatory evidence must be one-way and untouched, and a research result is not complete until claims, privacy, production boundaries, lineage, and the tagged archive are independently checked.
- **Delivers:** One batch holdout request for all frozen profiles; commitment/opening receipt; no-second-open and no-post-open-tuning proof; side/initiative/symmetry/ID/order/repeat/held-out-opponent invariance; exact gate evaluation; bracket rejection report or later-milestone-only empirical-pass packet with `production_authorized: false`; full current-only runtime-service/Chronicle/replay/Go/persistence/privacy/standings/E2E certification; independent clean reproduction; adversarial review; privacy and claim scans; milestone audit; archive root; annotated tag; tagged-tree post-check.
- **Addresses:** SEALED, DECIDE, CERTIFY, and CLOSE.
- **Avoids:** Adaptive holdout use, selective reporting, private-data leakage, de facto rule authorization, cosmetic provenance, archive/tag mismatch, and overbroad claims.
- **Terminal outcomes:** Process failure, valid current-rules empirical failure, bracket rejection, or bracket empirical pass are all reported without changing production rules. Only process-valid evidence can support a completed research claim.

### Phase Ordering Rationale

- Measurement and claims freeze before tuning; otherwise results influence the test.
- Planner feasibility precedes scale; otherwise large compute is spent on a controller that cannot legally deploy.
- Factory provenance and oracle independence precede payoffs; otherwise matrix rows do not represent stable or genuinely distinct policies.
- Complete current development/red-team evidence precedes the current freeze; counters found within budget belong in the declared response loop.
- The current freeze precedes executable alternate-profile materialization; this is an enforced dependency, not prose chronology.
- All three arms retrain separately and freeze before the common holdout opens; fixed transfer and repeated holdout feedback are not final evidence.
- Only current-rules finalists may cross ordinary product certification; formation artifacts remain lab-only even on empirical pass.
- Verification, audit, archive, annotated tag, and tagged-tree post-check are release requirements, not aftercare.

### Research Flags

Phases needing deeper research or a contained spike during planning:

- **Phase 1:** Exact gate denominators, deterministic compute-unit ontology, retry/burn policy, named holdout custody, contamination response, and report logic.
- **Phase 2:** Planner/source/runtime feasibility, effect-pump equivalence, deterministic parallelism, throughput, and trace-retention envelope.
- **Phase 3:** Strategic-core independence criteria, clone calibration, provider/model identity drift, external submission confidentiality, and hostile intake.
- **Phase 4:** Complete-matrix scaling, canonical numeric meta-solver behavior, pure-finalist selection, and interpretation of bounded response gaps.
- **Phase 6:** Position-only state seam, private replay-review format, and exhaustive negative-reachability/rollback proof.
- **Phase 7:** Equal-work normalization, allowed common root, cache policy, canonical opening clusters, interaction/turtle classifiers, and branch-isolation tests.
- **Phase 8:** Sacrificial mock one-open drill, safe receipt projection, full root-manifest verification, annotated-tag/post-tag join, and non-authorizing packet enforcement.

Phase with established patterns that can usually skip a separate research pass:

- **Phase 5:** Content-addressed freeze assembly and preliminary current-only certification should reuse the artifact, source-identity, runtime, replay, privacy, and release-evidence patterns already proven through v1.37. Planning still needs explicit acceptance criteria, but not a new technology survey.

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Repository versions, package ownership, canonical engine/runtime boundaries, and available built-ins are directly verified by local research. Optional external tooling remains MEDIUM. |
| Features | HIGH for required scope; MEDIUM for numeric calibration | The activation prompt and project contract agree on table stakes and anti-features. Starting percentages and final Match budgets must freeze before results. |
| Architecture | HIGH for boundaries/order; MEDIUM for throughput/oracle details | One transition authority, disjoint evidence classes, current-only promotion, negative reachability, and one-open custody are well supported. Pool size, matrix volume, and oracle implementations need spikes. |
| Pitfalls | HIGH for repository risks; MEDIUM for methodological transfer | Local boundaries and failure cases are explicit. PSRO, preregistration, holdout, and reproducibility guidance is appropriately adapted but does not predict empirical outcomes. |
| Current-rules robustness | UNKNOWN by design | Must be discovered by the frozen league, independent probes, and red teams. |
| Formation result | UNKNOWN by design | Must be discovered only after equal retraining, three freezes, and one-shot sealed evaluation. |

**Overall confidence:** HIGH that the recommended scope, architecture boundaries, and order are correct; MEDIUM that initial budgets and phase sizing will hold after planner/runtime measurements.

### Gaps and Open Decisions

These must be resolved at the named gate, not improvised during evaluation:

- **Holdout custody:** Name the custodian, private storage/volume, keyed or secret-salted commitment method, authorized opening actor, safe release projection, contamination response, and retirement policy in Phase 1.
- **Compute contract:** Fix candidate/node/Match budgets, model tokens/attempts, human effort, retries, cache accounting, unused-budget disposition, hardware class, and replay-review effort before search.
- **Gate definitions:** Operationalize “materially lower interaction,” robust scripted opening, convoy, persistent STONE shield, reserve hoarding, turtle behavior, pure-worst-case failure, and response progress with exact denominators and hard/non-compensating logic.
- **Oracle independence:** Freeze the strategic-helper denylist, authorship/prompt separation, dependency tests, source/behavior/counterfactual correlation criteria, and remediation when channels correlate.
- **Clone calibration:** Build a development-only corpus covering semantic rewrites, parameterized shared selectors, symmetry/ID variants, latent behavioral divergence, and false positives.
- **Meta-solver:** Choose fixed-iteration regret matching or multiplicative weights, canonical numeric representation, tie-breaks, and whether an external exact-solver audit is useful. It is not required for core v1.38.
- **Common-root policy:** Define the exact profile-agnostic seed population and any symmetric warm-start rule before the current freeze; prohibit all later cross-profile learned reuse.
- **Runtime throughput:** Measure strong planner/provider latency and matrix growth before freezing full budgets. Wall-clock time remains operational metadata, never equal-compute currency.
- **Trace and retention:** Precommit which Matches retain full private traces, failure/finalist sampling, replay-review counts, compression, and artifact retention.
- **Model/human availability:** Pin exposed provider/model/version/settings and human submission/reviewer procedures. Drift or unavailable exact identity must fail loudly or create a new equally applied block.
- **Finalist selection:** Freeze the robust-pure rule and the distinction between development selection, independent validation, common sealed evaluation, and product certification.
- **Archive mechanics:** Define the complete root manifest, offline-store verification, clean-checkout reproducer, annotated tag policy, and post-tag checker before the final run.

None of these gaps permits a production rules change or stronger mathematical claim. If a prerequisite cannot be resolved without changing the experiment after results, the correct outcome is an explicit process failure or a new approved contract.

## Sources

### Primary Repository Sources — HIGH Confidence

- [v1.38 activation prompt](../milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md)
- [Project contract](../PROJECT.md)
- [Stack research](STACK.md)
- [Feature research](FEATURES.md)
- [Architecture research](ARCHITECTURE.md)
- [Pitfalls research](PITFALLS.md)
- [Competitive Strategy research handoff](competitive-strategy-factory-and-adversarial-league.md)
- [SEED-002](../seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md)
- [v1.37 requirements](../milestones/v1.37-REQUIREMENTS.md)
- [v1.37 roadmap](../milestones/v1.37-ROADMAP.md)
- [v1.37 milestone audit](../milestones/v1.37-MILESTONE-AUDIT.md)
- [v1.37 Strategy evaluation foundation](../artifacts/v1.37-strategy-evaluation-foundation.md)
- [Core-rules, runtime, and metagame audit](v2.0-core-rules-enforcement-runtime-and-metagame-audit.md)
- [Core-rules audit reproductions](../artifacts/v2.0-core-rules-audit/README.md)
- [Canonical consolidated specification](../../CowardsGameSpec_Full_Consolidated_v1.md)
- [Canonical Cycle-interleaved v1.4 specification](../../CowardsGameSpec_CycleInterleaved_v1.4.md)
- [Technical architecture specification](../../CowardsGame_Technical_Architecture_Spec_V1.md)
- Repository manifests, lockfile, and current spec/engine/replay/runtime-service/Go/persistence implementations cited by the four research reports

### External Primary and Official Sources — MEDIUM Confidence for Project Adaptation

- Lanctot et al., [Policy-Space Response Oracles](https://arxiv.org/abs/1711.00832) — restricted empirical games, meta-strategies, and approximate response oracles.
- Lanctot et al., [OpenSpiel](https://arxiv.org/abs/1908.09453) — reproducible game-learning interfaces and evaluation concepts; not a second Coward's Game engine recommendation.
- McAleer et al., [Anytime PSRO](https://arxiv.org/abs/2201.07700) — early PSRO iterations need not improve exploitability monotonically.
- Dwork et al., [Generalization in Adaptive Data Analysis and Holdout Reuse](https://arxiv.org/abs/1506.02629) — adaptive feedback can overfit a holdout without direct file disclosure.
- Patterson et al., [Empirical Design in Reinforcement Learning](https://www.jmlr.org/papers/v25/23-0183.html) — implementation, hyperparameter, aggregation, and experimenter choices affect validity.
- Hardwicke and Wagenmakers, [Preregistration and confidence calibration](https://www.nature.com/articles/s41562-022-01497-2) — freeze study and analysis choices before outcomes and disclose deviations.
- [SLSA Provenance v1.1](https://slsa.dev/spec/v1.1/provenance) — useful provenance shape, not a certification claim.
- [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/) — reproduction binds source, environment, and instructions.
- [Node.js 24 worker threads](https://nodejs.org/download/release/v24.16.0/docs/api/worker_threads.html) and [crypto](https://nodejs.org/download/release/v24.16.0/docs/api/crypto.html) — trusted CPU parallelism and built-in integrity primitives.
- [`age` official repository](https://github.com/FiloSottile/age) — optional encrypted bundle transport under separate custody.

---
*Research completed: 2026-07-27*

*Ready for requirements and roadmap: yes*
