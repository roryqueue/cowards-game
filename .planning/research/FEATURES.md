# Feature Research

**Domain:** Reproducible competitive Strategy generation, adversarial league evaluation, and lab-only starting-formation research for a deterministic programmable game
**Project:** Coward's Game v1.38 Competitive Strategy Factory and Adversarial League
**Researched:** 2026-07-27
**Confidence:** HIGH for milestone scope, production boundaries, dependency order, and required behavior; MEDIUM for the initial numeric gates until they are calibrated and frozen; intentionally UNKNOWN for which Strategy or formation will win

## Executive Recommendation

v1.38 should deliver a research system, not a hand-authored champion and not a rules release. Its minimum credible outcome is:

1. a frozen measurement contract and reproducible direct-engine lab;
2. a legal hierarchical planner that proves strong Strategies fit the real information, source, memory, objective, determinism, and runtime limits;
3. an immutable Strategy factory with materially independent response-oracle families;
4. a complete current-rules PSRO/double-oracle league, model and human red teams, a diverse pure portfolio, and a separately chosen robust pure finalist;
5. a hard current-rules freeze before any alternate start exists;
6. separately retrained, equal-compute current/inward/bracket populations;
7. one-time sealed evaluation, precommitted rejection gates, and an explicit pass/fail result;
8. production-path certification for current-rules finalists only; and
9. independent verification, adversarial review, audit, archive, and annotated tag.

The scientific claim must stay narrow: the league measures practical, **oracle-relative** resistance to the implemented and independently budgeted response channels. It cannot prove exact exploitability, mathematical optimality, permanent balance, or that a frozen deterministic game will never develop a meta.

The starting-formation work is strictly post-freeze and lab-only. A bracket pass creates evidence for a later rules milestone. It does not register an arena or rules profile, alter canonical initial state, create counted Matches, persist canonical evidence, change public product behavior, or authorize a production rule change.

## Scope Classification

This report uses three deliberately different categories:

- **Table stakes:** required to complete v1.38 credibly. A missing item invalidates the competitive evidence or leaves the milestone incomplete.
- **Differentiators:** contract-required research qualities that make the result stronger than an ordinary benchmark harness. They are not permission to expand production scope.
- **Anti-features:** forbidden, misleading, or explicitly later work. Their exclusion is testable milestone behavior.

There is no optional product-surface expansion on the critical path. If the required gates finish early, use the remaining budget for stronger independent attacks, mutation tests, replay review, and evidence quality rather than new UI, rules, languages, arenas, or competition operations.

## Feature Landscape

### Table Stakes (Required Milestone Capabilities)

| Feature | Why Expected | Complexity | Testable operator/researcher-visible behavior |
|---------|--------------|------------|-----------------------------------------------|
| Prerequisite integrity admission | Strategy evidence is meaningless if it runs on a contaminated engine, ABI, Chronicle, Set policy, or runtime boundary. | MEDIUM | The runner resolves and records the exact v1.37-certified rules/engine/runtime ABI/Chronicle/arena/Set identities. Missing, mixed, stale, or incompatible identities stop the lab. Integrity defects are returned to the foundation milestone rather than repaired or normalized in v1.38. |
| Persisted current-rules regression fixture | The audited 540-Match matrix is useful as a regression and throughput floor even though it is not balance evidence. | LOW | One command reproduces the persisted current-rules matrix and explains any drift before candidate search begins. Smoke and Open Field aliases are not counted as distinct strategic conditions. |
| Frozen measurement contract | Thresholds, budgets, and interpretation must exist before tuning or sealed results. | HIGH | A versioned immutable manifest freezes scoring, draw value, sides, entrant-level initiative states, design arenas, development/validation/sealed splits, holdout identities or commitments, opponent splits, candidate counts, response iterations, search-node budgets, Match budgets, model/version/prompt/token budgets, human procedure, replay-review effort, runtime limits, metrics, failure handling, and pass/fail interpretation. |
| Separate process and metagame gates | A scientifically sound run may discover an exploitable field; that is not the same as a broken experiment. | MEDIUM | Reports classify `process/integrity failure`, `valid metagame failure`, `formation rejection`, and `formation pass` separately. A failed empirical anti-dominance gate remains a valid result and cannot trigger threshold softening or an unplanned rules change. |
| One-command reproducible direct-engine lab | Large candidate fields need cheap deterministic execution without using production persistence or sandbox paths as the training loop. | HIGH | A clean run from an immutable manifest rebuilds candidates, schedules all declared conditions, emits content-addressed artifacts, and reproduces payoff and telemetry outputs. It imports the canonical transition engine and contains no copied resolver or rules fork. |
| Legal hierarchical planner feasibility spike | The highest-risk uncertainty is whether a serious full-board planner and local controller fit the actual Strategy contract. | HIGH | `selectActivations` enumerates or beam-searches ordered Soldier/mission assignments; the 5x5 SoldierBrain considers all nine Actions, stale objectives, exact visible rules, authoritative Advance state, and a cheap legal fallback. Forced tactic/defense, legality, determinism, hostile-input, source, objective, memory, and runtime suites must pass before factory scale-up. |
| Mission-capable global controller | Competitive play requires coordination beyond independent directional weights. | HIGH | The planner can represent evacuation, rear entry, edge push, screen, anchor, graph-cut STONE, reserve, recovery, bait, and pincer missions and scores hard survival/tactical constraints lexicographically under both initiative hypotheses. |
| Rule-correct local controller | A global plan is not deployable unless each Soldier can react legally under partial observation and interleaved Cycles. | HIGH | On every Cycle the SoldierBrain uses only the canonical self snapshot, 5x5 Awareness Grid, objective, SoldierMemory, and scheduler fields; it detects stale objectives, evaluates legal Actions, handles immediate threats/opportunities, and falls back deterministically before budget exhaustion. |
| Immutable Strategy factory output | Candidates must be auditable, reproducible Strategy Revisions rather than mutable training checkpoints. | HIGH | Every emitted candidate preserves exact source bytes/hash, compatibility tuple, factory version, lineage, doctrine family, oracle family, deterministic build manifest, validation status, runtime profile, behavior fingerprint, and development/evaluation split. Accepted revisions never mutate. |
| Legal deployment distillation | Offline search and model assistance are allowed only if Match-time behavior remains deterministic and self-contained. | HIGH | Every accepted candidate is package-free, synchronous, JSON-only, within canonical source/objective/memory/output limits, and reproducible from legal serialized inputs. Network, filesystem, clock, nondeterministic randomness, imports, dynamic code, workers, external services, and live model inference are absent during Matches. |
| Legal information-set boundary | A privileged offline teacher must not leak hidden engine facts into a deployed choice. | HIGH | Candidates receive only serialized canonical Strategy/SoldierBrain inputs. Privileged state may score offline counterfactuals but cannot directly select an emitted Action; labels aggregate by legal information-set key, teacher provenance is disclosed, and every decision reproduces from stored source, legal input, objective, and memory alone. |
| Material oracle independence | Several labels wrapped around one selector would reproduce the Advanced-library evidence defect. | HIGH | At least three response mechanisms have separate planner cores, training methods, and failure modes: structured tactical optimization; high-level search teacher with deterministic distillation; and model-guided explicit program synthesis. Shared helpers are limited to literal legality, geometry, schemas, artifact creation, and reporting. |
| Human/external-submission channel | Human reasoning can discover discontinuous programs and exploits missed by automated search. | MEDIUM | A separately documented channel records disclosure, reviewer/submission budgets, source provenance, immutable revisions, validation, acceptance/rejection, and failures. Human candidates pass the same legality, novelty, information, runtime, and evaluation gates as automated candidates. |
| Offline model red-team channel | Independently prompted models can generate qualitatively different explicit programs without violating no-live-inference rules. | HIGH | The contract freezes model identity, prompts, context disclosure, token/attempt budgets, critique/mutation procedure, and retention rules. The model runs only offline; output is distilled to deterministic source and receives no hidden Match state at runtime. |
| Complete mirrored payoff matrix | A meta-distribution and best-response graph require complete, condition-balanced empirical payoffs. | HIGH | For every frozen population, the runner evaluates every required pairing across both sides, both entrant-level initiative states, and each semantically distinct design arena. Partial matrices, duplicate arena identities, or system failures cannot silently produce a league result. |
| PSRO/double-oracle response loop | A fixed tournament cannot reveal counters to provisional leaders or mixtures. | HIGH | Each iteration freezes its population and conditions, solves the empirical zero-sum meta-distribution, trains each oracle against both the mixture and strongest pure policies, evaluates on untouched validation conditions, adds only legal novel positive responses, then recomputes the matrix, best-response graph, and oracle-relative response gap. |
| Clone and false-diversity rejection | Source renaming and near-identical behavior must not inflate doctrine counts or finalist diversity. | HIGH | Candidates receive source-structure and Chronicle-derived behavior comparisons. Clones and cosmetic variants are rejected with reasons. Doctrine-family and independent-core claims remain backed by stored evidence. |
| Diverse pure portfolio | Non-transitive games require preserving multiple strong pure doctrines, not collapsing to one score leader. | HIGH | The frozen output contains at least the precommitted number of legal, materially distinct pure Strategies spanning the required behavioral families and planner cores, with complete lineage, payoff, and behavior evidence. |
| Separately selected robust pure finalist | The PSRO mixture is diagnostic, while the product deploys one immutable Strategy Revision at a time. | HIGH | A precommitted selection rule chooses a pure finalist using mixture performance, strongest-pure responses, pure-policy worst case, validation/probe results, robustness invariances, legality, and runtime fitness. It does not simply choose highest aggregate win rate. |
| Current-rules development red team | Alternate starts cannot begin while obvious counters to the current field remain unexplored under the allocated budget. | HIGH | Provisional leaders receive the frozen automated, model, and human attack budgets. Successful counters feed a declared response iteration; failed attacks remain stored evidence. No attack is discarded merely because it failed. |
| Current-rules pre-formation freeze gate | The formation experiment needs a fixed baseline rather than a moving target. | HIGH | Before any alternate-profile manifest, initial state, or candidate population is constructed, current-rules sources, population, finalists, thresholds, development/validation results, red-team logs, compute ledger, holdout policy/commitments, and interpretation are content-addressed and immutable. |
| Pre-formation current-rules certification | The baseline must be legal and reproducible before it is reused as the control arm. | HIGH | Current-profile finalists pass direct execution, source/memory/objective/output limits, deterministic repeat, information-boundary, runtime-profile, replay-review, and preliminary compatibility checks. The common sealed holdout remains unopened. |
| Versioned lab-only initial-state boundary | The three starts must differ only in initial placement and then use the canonical engine unchanged. | HIGH | A single versioned test/lab interface produces one of exactly three declared initial states. Transition 1 onward uses the unchanged canonical kernel. Structural checks reject alternate transition rules or per-profile engine code. |
| Three exact formation profiles | Reproducibility requires literal geometry, facing, and identity rather than descriptive labels. | MEDIUM | The lab creates: current edge rank (`x=2..9`, top `y=0`, bottom `y=11`); inward rank (`x=2..9`, top `y=1`, bottom `y=10`); and bracket shield (top `y=0 x={2,3,8,9}`, `y=1 x={4,5,6,7}`, vertically mirrored for bottom). Every Soldier retains current inward facing. |
| Experimental-path containment | Lab evidence must be incapable of becoming production behavior by accident. | HIGH | Experimental profiles cannot be registered as canonical rules/arenas/Strategies, selected by normal constructors, persisted as canonical Match/Chronicle evidence, scheduled as counted play, included in standings, or exposed through public/default DTOs and pages. Positive bypass probes and mutation-tested monitors prove these denials. |
| Equal-compute separate retraining | Fixed-agent transfer comparisons confound the formation with each policy's adaptation history. | VERY HIGH | All three profiles retrain separately with identical doctrine families, candidate counts, response iterations, oracle/model/human budgets, search nodes, Match schedules, sides, initiative states, arena corpus, split policy, runtime limits, hardware class, and replay-review effort. Any warm-start rule is identical and frozen before divergence. |
| Same causal rules across profiles | A formation result is uninterpretable if Cycle, MOVE, Backstab, or timing also changes. | MEDIUM | The Cycle cap, activation counts, facing/reversal MOVE contract, collision/push, Backstab geometry and scan timing, Contraction, outcomes, arenas, runtime contract, scoring, and all other rules have identical hashes across the three manifests. |
| Formation-specific telemetry | Aggregate win rate cannot distinguish a lively formation from a scripted or inert meta. | HIGH | Reports include opening selection entropy, viable openings, forced evacuation, unselected first-Contraction reserves, first Awareness/contact/push/Backstab/STONE/decisive event, Backstabs by timing and cause, pushes/blocks, no-Advance STONE, center/wing/convoy/turtle patterns, draws, Match length, Contractions, ACTIVE survival, response gap, worst-case pure payoff, and best-response graph. |
| Equal model/human attack process for all profiles | A challenger cannot receive more creativity or scrutiny than the control. | HIGH | Each frozen profile receives the same independently budgeted model and human attack procedure, disclosure, validation, replay review, and response handling. Compute and reviewer ledgers show equality or mark the comparison invalid. |
| Freeze-all-before-open sealed holdout | Holdouts cease to be holdouts once a population is tuned against them. | HIGH | Current, inward, and bracket populations, pure finalists, thresholds, and red-team outputs are frozen before the common sealed arena/opponent holdout is opened exactly once. Holdout access is logged; after disclosure, no candidate, threshold, selection rule, or report interpretation is tuned. |
| Invariance and leakage tests | A leading result must reflect doctrine rather than IDs, ordering, failure paths, or private information. | HIGH | Side, initiative, horizontal symmetry, opaque player/Soldier IDs, Soldier/source ordering, deterministic-repeat, and held-out-opponent tests pass. Accepted evidence has zero information-boundary violations, runtime violations, system failures, or private-data leaks. |
| Precommitted formation rejection decision | A visually appealing bracket must fail when adaptive opponents reveal degeneracy. | HIGH | The bracket is rejected if independently retrained responses converge on a robust scripted opening, convoy/STONE-shield turtle, materially lower interaction, or worse oracle-relative exploitability under the frozen thresholds. The decision is automatic or mechanically reviewable from declared metrics. |
| Later-milestone decision packet on pass | A pass is input to governance, not authority to mutate production. | MEDIUM | A passing bracket produces a content-addressed packet containing the causal protocol, manifests, equal-compute attestation, populations, matrices, red-team/holdout evidence, uncertainty, pass rationale, rejected interactions, risks, and required later validation. The packet states that no rule has shipped. |
| Explicit failure/rejection record | Negative results are valuable evidence and must survive milestone closure. | MEDIUM | A failed current anti-dominance gate, failed oracle attempt, invalid candidate, leaked/invalid experiment, or rejected bracket is retained with its cause. Results are never rewritten into success and thresholds are never relaxed after inspection. |
| Current-rules finalist production-path certification | Only current canonical behavior may enter runtime-service, replay, persistence, privacy, standings, and E2E proof. | VERY HIGH | Frozen current-rules finalists execute through supported runtime lanes and runtime-service, reconstruct through Chronicle/replay, persist with canonical evidence, preserve privacy, and traverse the existing competition/E2E path. Experimental-profile artifacts remain lab evidence only. |
| Persistent research evidence set | Roadmap and later rules work need immutable inputs, not an ephemeral notebook. | HIGH | The milestone preserves runner, compute manifests, legal corpus, lineage, fingerprints, independence reports, populations, payoff matrices, meta-distributions, best-response graphs, accepted/rejected ledger, oracle and red-team logs including failures, holdout access proof, current finalist certification, profile manifests, causal comparison, and final report. |
| Verification, adversarial review, audit, archive, and tag | The milestone is not complete at “experiments ran.” | HIGH | Independent verification replays declared runs, adversarial review attacks boundaries and claims, privacy/information scans pass, requirements trace completely, the milestone audit records pass/fail without overrides, artifacts are archived, and the archive commit receives the annotated release tag. |

### Differentiators (Contract-Required Research Quality)

These features distinguish v1.38 from a generic tournament script. They are valuable because they improve what can honestly be inferred, not because they add product scope.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Independent program-generation oracles | Different search biases can discover qualitatively different coordination schemes and counters. | VERY HIGH | Require at least the frozen minimum of materially independent planner cores; shared legality/geometry code must not collapse decisions into one selector or Action scorer. |
| Strategy lineage plus behavioral fingerprinting | Makes doctrine diversity and counter discovery auditable rather than label-based. | HIGH | Fingerprints should derive from canonical Chronicle behavior across a declared probe corpus, not source tokens alone. |
| Mixture-targeted and pure-targeted responses | Protects against both overfitting to the current leader and hiding a brittle pure policy inside a robust mixture. | HIGH | Every response iteration attacks the empirical meta-distribution and the strongest/potentially vulnerable pure policies. |
| Failed attacks as first-class evidence | Reveals which independent channels were actually tried and prevents success-only publication bias. | MEDIUM | Preserve invalid, legal-but-weak, duplicate, and unsuccessful attacks with budget and rejection reason. Do not publish private source by default. |
| Portfolio plus robust pure finalist | Respects non-transitivity while producing a legally deployable deterministic output. | HIGH | The portfolio is evidence and future training material; the pure finalist is selected separately. The meta-distribution is never presented as one deployable entrant. |
| Best-response graph and oracle-relative response gap | Shows who counters whom and how much unaddressed response pressure the implemented oracles found. | HIGH | Always qualify the graph and gap by population, conditions, oracle families, and budgets. |
| Hard freeze provenance | Converts each experimental stage into a reviewable fact and prevents later edits from contaminating causal comparisons. | HIGH | Content-address sources, manifests, populations, splits, thresholds, red-team inputs, and access logs at each gate. |
| One-open common holdout | Gives the three profiles a genuinely untouched comparison rather than three differently contaminated tests. | HIGH | A leak or premature access invalidates the sealed claim; it is not fixed by quietly substituting a new convenient holdout. |
| Equal human/model scrutiny | Extends equal compute beyond automated search to the creative channels most likely to be uneven. | HIGH | Freeze attempt counts, tokens, context, model identities, reviewer-hours, submission limits, and replay-review effort per profile. |
| Causal starting-formation ablation | Isolates the setup question while preserving the entire current rules contract after initialization. | HIGH | Current edge rank is the control, inward rank isolates “move all inward,” and the bracket tests partial evacuation relief plus decaying rear protection. |
| Degeneracy-sensitive opening metrics | Detects a formation that wins by scripting, inactivity, or shielding rather than richer counterplay. | HIGH | Opening entropy and behavior incidence complement final Set score; metrics diagnose but do not replace Match outcomes as the objective. |
| Outcome-honest milestone closure | A rigorous negative result can still complete the research milestone. | MEDIUM | Process success and empirical success remain separate in requirements, reports, and audit status. |

### Useful Enhancements Only After P1 Obligations

These are optional implementation refinements, not new milestone promises:

| Enhancement | Trigger | Constraint |
|-------------|---------|------------|
| Additional behaviorally distinct student representation | Only after the required search teacher distills at least one legal strong student | Must use the same validation and compute accounting; cannot delay freeze. |
| More independent external submissions | Only while the frozen human-channel budget permits | Do not extend one profile's budget or disclose sealed conditions. |
| Richer private research visualizations | Only if derived from already-required artifacts | Must remain operator/researcher-only and exclude private source, memory, objective, evaluator state, and sealed identities from public/default paths. |
| Extra doctrine niches | Only if the required family/core minimum is already met | A new label needs structural and behavioral independence evidence. |

### Anti-Features (Forbidden or Later Work)

| Feature | Why Requested | Why Problematic | Required Alternative |
|---------|---------------|-----------------|----------------------|
| One handcrafted “champion” | Faster path to a strong demo | Says nothing about counters, diversity, or robustness and invites author overfitting. | Build the factory, portfolio, response loop, and separately selected pure finalist. |
| More parameter variants of one global scorer | Inflates population size cheaply | Repeats the current Advanced-library independence defect. | Require independent planner cores, lineage, and behavior evidence. |
| Treating Starter/Advanced wins as balance proof | Existing field is convenient and stable | The strategies share weak/generated structure; beating them is only a regression gate. | Use independent probe, response, red-team, and sealed fields. |
| Aggregate win-rate champion selection | Simple leaderboard story | Can hide catastrophic pure counters, side bias, and non-transitivity. | Use precommitted robust-pure selection with worst-case, mixture, probe, and invariance evidence. |
| Deploying the PSRO mixture as one entrant | The mixture may be harder to exploit | Current API deploys one deterministic immutable revision; runtime mixing would change the contract. | Keep the mixture as training/diagnostic evidence and deploy a separately selected pure Strategy. |
| Exact exploitability, Nash, optimality, or “meta solved” claims | Stronger headline | Approximate oracles and a restricted empirical population cannot support them. | Say oracle-relative response gap and practical anti-dominance under named budgets/conditions. |
| Live model inference or live human control | More adaptive Match behavior | Violates deterministic autonomous play and the runtime capability boundary. | Use models/humans offline, then freeze deterministic self-contained source. |
| Privileged teacher state in emitted decisions | Could improve student strength | Leaks information unavailable to legal Strategies and creates contradictory labels. | Aggregate by canonical legal information set; disclose teacher-only state and prove the student reproduces from legal inputs. |
| Training through production sandbox, API, persistence, standings, or web | Appears end-to-end from day one | Makes search expensive, couples research to product paths, and risks hostile execution ownership creep. | Train through the canonical direct engine; certify only frozen current-rules finalists through expensive paths. |
| Copied or reimplemented transition rules in the lab | Easier instrumentation | Creates a second rules authority and invalidates replay/evidence equivalence. | Import the canonical engine and instrument transitions/events externally. |
| Invalid output, timeout, runtime failure, nondeterminism, or ID ordering as tactics | Can produce accidental wins | Exploits failure classification rather than game rules and contaminates evidence. | Reject the candidate/result and require zero accepted violations/system failures. |
| Post-hoc thresholds or selection rules | Can rescue an appealing result | Converts a test into tuning and destroys the sealed claim. | Freeze thresholds and interpretation before search; record failure unchanged. |
| Tuning after sealed holdout disclosure | May improve the final candidate | Makes the holdout development data. | Open once after all populations freeze; no post-open candidate or threshold changes. |
| Different compute or red-team effort by profile | Could focus effort on the promising bracket | Confounds formation quality with adaptation opportunity. | Use identical doctrine, candidate, oracle, model/human, Match, node, hardware, and review budgets. |
| Fixed current-rules Strategies as final formation evidence | Saves retraining cost | Rewards profiles suited to transferred policies and cannot measure adapted response pressure. | Retrain separately for all three profiles; fixed transfer is screening evidence only. |
| Bundling Cycle-cap reduction with formation | Might produce a stronger combined result | Makes attribution impossible. | Hold the current Cycle cap fixed; evaluate caps only in a separately approved future profile. |
| Bundling facing-only MOVE or reversal changes | May reduce formation congestion | Changes Action legality and tempo, confounding start geometry. | Preserve current MOVE/reversal rules in the primary ablation. |
| Bundling attacker-facing Backstab | Might make the bracket look balanced | Changes kill geometry as well as rear protection. | Preserve current Backstab geometry. |
| Bundling Backstab scan-timing changes | May simplify event interpretation | Changes tactical boundaries and causal attribution. | Preserve current scan timing; test later under separate approval. |
| Adding new arenas during the primary comparison | More variety seems safer | Changes the experimental condition and may leak or dilute the sealed design. | Freeze the canonical design/holdout arena corpus before tuning. |
| Registerable experimental rules or arenas | Makes lab invocation convenient | Creates a path into canonical persistence, counted scheduling, or public behavior. | Use a test/lab-only initial-state interface with explicit deny monitors. |
| Persisting lab Matches as canonical Chronicle evidence | Reuses existing analytics | Mislabels noncanonical initial states as production history. | Store content-addressed research artifacts outside canonical Match/standings evidence. |
| Public formation toggle, preview, or profile selector | Lets users try the experiment | Turns research into shipped behavior and widens privacy/scope obligations. | Keep experiment surfaces researcher/operator-only; ship nothing from v1.38. |
| Automatically promoting a passing bracket | Treats the experiment as a release gate | The milestone has no authority to change production rules or migration contracts. | Produce a later-milestone decision packet only. |
| Repairing foundation/runtime defects inside v1.38 | Keeps work moving | Hides prerequisite contamination and mixes trust repair with metagame evidence. | Stop, report, and return the defect to the integrity foundation. |
| New Strategy languages, packages, or runtime technology migration | More oracle implementation choices | Expands conformance/containment scope and is unrelated to the research question. | Use the supported contract and offline tooling; emit currently legal source. |
| Durable ratings, prizes, tournaments, creator publishing, or broad league UI | “Adversarial league” sounds product-facing | These are competition-operations/product milestones, not the research league. | Preserve current trial competition posture and private lab artifacts. |
| Public raw logs, source, memory, objectives, sealed identities, or evaluator state | More transparency | Leaks private Strategy/security data and contaminates holdouts. | Publish only approved privacy-safe summaries and hashes when later authorized. |

## Gate and Outcome Model

### Gate Sequence

| Gate | Must be true before advancing | Failure disposition |
|------|-------------------------------|---------------------|
| G0 — Foundation admission | Exact certified v1.37 tuple, canonical engine, Strategy observations, Set fairness, runtime semantics, and privacy boundaries resolve cleanly. | Stop. Return prerequisite defects to the integrity foundation. No authoritative Strategy evidence. |
| G1 — Measurement freeze | Conditions, splits, budgets, metrics, thresholds, selection, holdout, red-team, and interpretation are immutable. | Stop and complete the contract before candidate tuning. |
| G2 — Planner feasibility | Hierarchical planner and local brain pass legal-information, tactics, source, memory, objective, hostile-input, determinism, and runtime tests. | Valid feasibility failure. Do not scale the factory; report which contract limit failed. |
| G3 — Factory/oracle readiness | Immutable artifacts, at least three materially independent mechanisms, human channel, clone checks, complete scheduling, and reproducible runner work. | Process failure; repair without changing frozen outcome thresholds. |
| G4 — Current-rules league completion | Precommitted response budget is exhausted, matrix complete, portfolio and pure finalists selected, model/human red team complete, artifacts reproducible. | A metagame gate may fail validly. A process/integrity failure blocks later comparison. |
| G5 — Current-rules pre-formation freeze | Sources, population, thresholds, red-team logs, compute ledger, holdout commitments, and pre-formation certification are frozen; no alternate profile exists earlier. | Do not construct or evaluate inward/bracket profiles. |
| G6 — Equal-compute profile freeze | All three profiles completed identical retraining/attack protocols; populations, finalists, manifests, and ledgers are frozen. | Mark comparison invalid if equality cannot be proved. Do not open sealed holdout. |
| G7 — One-time sealed evaluation | Common holdout opens once; no tuning follows; invariance, privacy, and information-boundary tests run. | A leak/premature open invalidates the sealed claim. Record it explicitly. |
| G8 — Formation decision | Precommitted scripted-opening, turtle/convoy/STONE-shield, interaction, and oracle-relative response gates produce pass/reject. | Rejection is a valid result. No production change. |
| G9 — Current finalist certification | Current-rules finalists pass supported runtimes, runtime-service, Chronicle/replay, persistence, privacy, standings, and E2E. | Do not label or use the finalist as certified. Experimental artifacts remain lab-only regardless. |
| G10 — Release closure | Independent verification, adversarial review, privacy scans, audit, archive, and annotated tag complete. | Milestone remains incomplete/release-ready at most. |

### Outcome Semantics

| Outcome | Meaning | May the milestone close? | May production rules change? |
|---------|---------|--------------------------|------------------------------|
| Process/integrity failure | Evidence is not trustworthy or reproducible. | Only as an explicitly failed/blocked research result if the approved workflow permits; never as a successful competitive proof. | No. |
| Valid current-rules metagame failure | The frozen independent oracles found dominance or a large response gap under the precommitted gates. | Yes, as an honest empirical failure if all process gates and required reporting complete. Formation may proceed only if the measurement process remains valid and the baseline is frozen as precommitted. | No. |
| Bracket rejection | Adaptive equal-compute evidence found scripted, inert, turtle, or worse response behavior. | Yes. Preserve the causal rejection report. | No. |
| Bracket pass | The bracket cleared every precommitted causal, robustness, sealed, and integrity gate. | Yes, after the remaining certification/audit/archive/tag obligations. | No. Only a later decision packet is authorized. |
| Holdout contamination | Holdout identity/data influenced candidates, thresholds, or interpretation before freeze. | The sealed-evaluation claim fails; record contamination and follow the precommitted invalidation policy. | No. |

## Starting Competitive Gates to Calibrate and Freeze

The activation prompt supplies starting values, not results. Planning should adopt them or replace them with justified values **before candidate output is inspected**:

| Gate family | Starting commitment |
|-------------|---------------------|
| Safety | Zero accepted runtime violations, system failures, information-boundary violations, or private-data leaks. |
| Deployability | Source below the canonical 64KB cap, preferably below 48KB; direct execution target below 5ms p99 under one fixed benchmark. |
| Population independence | At least 12 league Strategies across six behavioral families and five genuinely independent planner cores. |
| Finalist diversity | At least three structurally and behaviorally distinct finalists. |
| Response progress | Two consecutive response iterations above 55% Set score against the preceding frozen mixture on untouched conditions. |
| Independent strength | At least one deployable Strategy above 60% against an independent probe field. |
| Regression only | Above 70% against the current Advanced library; never interpret this as balance evidence. |
| Targeted red team | A fresh red team cannot exceed 60% against the robust finalist, or it finds a counter and the next declared response iteration adapts against the updated mixture. |
| Confounder resistance | No leading result depends materially on side, initiative, duplicate arenas, opaque IDs, Soldier/source order, invalid output, runtime failure, or tie-break artifacts. |

Threshold granularity must reflect deterministic Set point counts. If calibration changes a number, the rationale and final value belong in the frozen pre-search contract; no result-dependent adjustment is allowed.

## Robust Finalist Selection Contract

The league must freeze the selection rule before candidates are ranked. The rule should:

1. exclude any candidate failing legality, information, determinism, identity, source/memory/objective/output, runtime, privacy, or clone gates;
2. require structurally and behaviorally distinct finalists rather than several builds from one core;
3. score each pure candidate against the frozen meta-distribution;
4. test it directly against the strongest pure policies and every accepted targeted counter;
5. include pure-policy worst-case Set payoff, not only aggregate points;
6. require side, initiative, arena, symmetry, ID, ordering, and repeat robustness;
7. include independent validation/probe evidence without exposing the sealed holdout;
8. retain runtime/source efficiency only as a feasibility constraint or predeclared tie-break, never as a hidden substitute for Match outcomes; and
9. choose one robust pure finalist separately from the diverse portfolio and diagnostic meta-distribution.

If no pure candidate clears the frozen rule, report “no robust pure finalist found under these oracles and budgets.” Do not deploy the mixture, relax the gate, or cherry-pick a public winner.

## Model and Human Red-Team Behavior

### Model Channel

- Freeze model/provider/version identity, prompts, rules/API context, replay/source disclosure policy, temperature or deterministic settings where relevant, token budget, attempt count, critique/mutation rounds, and acceptance procedure.
- Keep the model outside Match execution. Only validated deterministic source enters the candidate ledger.
- Separate model-guided program synthesis from the structured optimizer and search teacher; it must not merely tune the same shared selector.
- Record every attempt and whether it was invalid, duplicate, legal-but-weak, accepted, or withheld for a documented privacy reason.
- Apply the same process independently to current, inward, and bracket populations under equal budgets.

### Human / External Channel

- Freeze submission window, eligible inputs, source/replay disclosure, reviewer-hours, number of revisions/attempts, collaboration rules, and conflict/independence declarations.
- Convert each accepted submission into an immutable, provenance-bound candidate.
- Apply the same hostile-input, legal-information, clone, runtime, and untouched-validation gates as every other oracle.
- Preserve failed attacks and substantive review notes in private research evidence.
- Do not give humans sealed arena/opponent identities, private evaluator state, StrategyMemory, SoldierMemory, objective payloads, or undisclosed source.

## Equal-Compute Three-Profile Experiment

### Profile Contract

| Profile | Initial placement | Purpose |
|---------|-------------------|---------|
| Current edge rank | Top `y=0`, bottom `y=11`, both `x=2..9` | Canonical control: all rear squares start off-board, all eight Soldiers face first-Contraction evacuation pressure. |
| Full inward rank | Top `y=1`, bottom `y=10`, both `x=2..9` | Control for moving every Soldier one row inward and removing compulsory first-boundary evacuation. |
| Edge-anchored bracket shield | Top rear wings `y=0, x={2,3,8,9}` and forward center `y=1, x={4,5,6,7}`; vertically mirrored for bottom | Challenger: retain four boundary Soldiers, seal the four center rear squares initially, keep every directly inward square empty, and let protection decay as wing guards move. |

All Soldiers retain current inward facing. No other initial state, terrain, rule, or runtime field changes.

### Equal-Compute Ledger

The runner must compare and fail on inequality across:

- doctrine families and independent planner cores;
- initial seed/warm-start rule;
- candidate counts and accepted-response slots;
- response-oracle iterations;
- structured-search/evolution evaluations;
- teacher search nodes and distillation budget;
- model identities, prompts, tokens, and attempts;
- human reviewer-hours and submission attempts;
- training, validation, probe, and sealed Match schedules;
- both sides and both entrant-level initiative states;
- design arena corpus and holdout commitments;
- runtime/source/memory/objective/output limits;
- hardware class or normalized deterministic work units;
- Chronicle telemetry and replay-review effort; and
- clone, novelty, legality, and finalist-selection rules.

Wall-clock equality alone is not sufficient because implementations and hardware may differ. Prefer deterministic work-unit ledgers (candidate evaluations, search nodes, model tokens/attempts, reviewer-hours, and Match conditions) plus hardware/runtime metadata.

### Formation Rejection Gates

The frozen contract must operationalize “materially” with numeric or distributional thresholds before results. Reject the bracket if any required integrity gate fails or if adapted independent evidence finds:

- convergence on one robust scripted opening with low viable-opening/selection entropy;
- convoy behavior, reserve hoarding, persistent turtle play, or STONE-shield protection that dominates the response graph;
- materially later or rarer Awareness/contact/push/Backstab/decisive interaction without a predeclared compensating benefit;
- materially higher draw rate, inactivity, Match length, no-Advance STONE, or pathological blocking;
- worse oracle-relative response gap or pure-policy worst-case payoff than the frozen comparison rule allows;
- dependence on one side, initial initiative, ID assignment, Soldier/source ordering, duplicate geometry, invalid output, or runtime/system failure; or
- a profile-specific compute, disclosure, replay-review, or holdout advantage.

An attractive average Set score cannot override a mandatory rejection gate.

### Later-Milestone Decision Packet

A passing result should create a packet with:

- exact current/inward/bracket initial-state manifests and hashes;
- proof that the canonical transition engine and all non-start rules were identical;
- the frozen measurement, equal-compute, red-team, holdout, and finalist-selection contracts;
- full population lineage, source/behavior independence evidence, matrices, meta-distributions, response graphs, and pure finalists;
- compute and review ledgers;
- formation telemetry distributions and causal comparison;
- model/human attacks, including failures;
- one-time sealed access record and invariance results;
- uncertainty, oracle/budget limits, and claims the experiment cannot support;
- exact pass/reject gate evaluation;
- privacy and experimental-path containment proof;
- risks, unresolved questions, and separately scoped cap/MOVE/Backstab/scan interactions;
- the smallest proposed later rules decision and the production contracts that a future milestone would have to migrate and re-prove; and
- a prominent statement that v1.38 changed no canonical rule, registration, persistence, counted scheduling, standings, replay semantics, or public surface.

If the bracket fails, preserve the same causal evidence as a rejection report. Do not create a promotion packet or substitute a different unplanned profile.

## Feature Dependencies

```text
v1.37 Certified Foundation
  -> G0 Prerequisite Admission
      -> Current-Matrix Regression Fixture
      -> G1 Frozen Measurement Contract
          -> G2 Legal Hierarchical Planner Spike
              -> Reproducible Direct-Engine Runner
              -> Immutable Strategy Factory
                  -> Structured Tactical Oracle
                  -> Search-Teacher/Distillation Oracle
                  -> Model-Guided Program Oracle
                  -> Human/External Channel
                      -> Clone/Independence Gate
                          -> Complete Current-Rules Payoff Matrix
                              -> PSRO/Double-Oracle Iterations
                                  -> Diverse Pure Portfolio
                                  -> Robust Pure Finalist
                                  -> Current Model/Human Red Team
                                      -> G5 Current-Rules Freeze
                                          -> Lab-Only Profile Boundary
                                              -> Current Retraining
                                              -> Inward Retraining
                                              -> Bracket Retraining
                                                  -> Equal-Compute Audit
                                                  -> Equal Profile Red Teams
                                                      -> G6 Freeze All Populations
                                                          -> G7 Open Common Sealed Holdout Once
                                                              -> Invariance/Leakage Tests
                                                                  -> G8 Pass or Reject Bracket
                                                                      -> Current-Rules Production Certification
                                                                      -> Pass-only Later Decision Packet
                                                                          -> Independent Verification
                                                                              -> Audit
                                                                                  -> Archive
                                                                                      -> Annotated Tag

Experimental Profile Boundary --must not reach--> Canonical Registration
Experimental Profile Boundary --must not reach--> Canonical Persistence/Chronicle Evidence
Experimental Profile Boundary --must not reach--> Counted Scheduling/Standings
Experimental Profile Boundary --must not reach--> Public/Default Product Surfaces

Cap Change --conflicts with--> Primary Formation Causality
Facing-Only MOVE --conflicts with--> Primary Formation Causality
Attacker-Facing Backstab --conflicts with--> Primary Formation Causality
Backstab Scan Change --conflicts with--> Primary Formation Causality
Post-Holdout Tuning --invalidates--> Sealed Evaluation
```

### Dependency Notes

- **Foundation admission precedes all Strategy claims:** v1.38 consumes the v1.37 transition, observation, ABI, Chronicle, arena, fairness, and runtime authorities. It must not repair them locally.
- **Measurement freeze precedes tuning:** candidate search, red-team disclosure, and threshold selection share one contract so outcomes cannot influence the test.
- **Planner feasibility precedes scale:** source, information, and runtime feasibility are the largest technical unknowns; millions of Matches do not rescue a controller that cannot legally deploy.
- **Factory precedes league:** the league needs immutable candidates, provenance, validation, fingerprints, and repeatable builds before its payoff matrix is meaningful.
- **Independent oracles precede anti-dominance claims:** one search method can only measure its own blind spots.
- **Complete condition-balanced payoffs precede meta-solving:** missing pairings or coupled side/initiative comparisons distort the empirical game.
- **Current development/red team precedes current freeze:** counters discovered within the declared budget must enter the response loop before the baseline is sealed.
- **Current freeze precedes alternate profile construction:** even creating or tuning the alternate boundary early risks baseline leakage and moving-target comparison.
- **All three populations freeze before sealed access:** the same untouched arena/opponent field must test all profiles without adaptive tuning.
- **Formation decision precedes any decision packet:** the packet reports a precommitted causal result; it is not a vehicle to rescue a failed bracket.
- **Only current-rules finalists receive production certification:** alternate-profile artifacts cannot cross canonical runtime/persistence/standings/public boundaries.
- **Audit, archive, and tag are completion features:** reports and code are not a shipped milestone until the proof loop closes.

## Milestone Definition

### Launch With (v1.38 Required)

- [ ] Exact foundation admission and current-matrix regression fixture.
- [ ] Immutable pre-search measurement, budget, split, holdout, metric, threshold, and interpretation contract.
- [ ] Legal hierarchical planner feasibility proof.
- [ ] One-command deterministic direct-engine runner and immutable compute manifests.
- [ ] Immutable candidate factory with lineage, validation, runtime profile, behavior fingerprints, and accepted/rejected ledger.
- [ ] Three materially independent automated response mechanisms plus a separately documented human/external channel.
- [ ] Complete mirrored current-rules payoff matrices and PSRO/double-oracle iterations.
- [ ] At least the frozen population/family/core minimum, three distinct finalists, a diverse pure portfolio, and separately selected robust pure finalist—or an explicit gate failure.
- [ ] Current-rules model/human red team, failed-attack evidence, pre-formation certification, and hard baseline freeze.
- [ ] Versioned lab-only current/inward/bracket initial-state boundary with production-path denial proof.
- [ ] Separate equal-compute retraining and equal model/human attack process for all three profiles.
- [ ] Freeze-all-before-open common sealed evaluation and invariance/leakage proof.
- [ ] Formation telemetry, oracle-relative comparisons, best-response graphs, and explicit bracket pass/reject decision.
- [ ] Pass-only later-milestone decision packet; rejection report otherwise.
- [ ] Current-rules finalist supported-runtime/runtime-service/Chronicle/replay/persistence/privacy/standings/E2E certification.
- [ ] Complete persistent artifacts, independent verification, adversarial review, privacy scans, audit, archive, and annotated tag.

### Add After Validation (Within v1.38 Only if P1 Is Complete)

- [ ] Additional independent oracle or external-submission attempts within a newly frozen extension budget.
- [ ] Additional private visual diagnostics derived from existing artifacts.
- [ ] Additional deterministic student representations for already-required search-teacher output.

These enhancements may not delay freeze, change thresholds, open holdouts, widen product surfaces, or create unequal profile budgets.

### Future Consideration (Separate Approval and Milestone)

- [ ] Production adoption or rejection of a passing bracket profile.
- [ ] Cycle-cap sequence `12/8/6/5/4`.
- [ ] Facing-only MOVE and reversal-history experiments.
- [ ] Attacker-facing or Advance-causal Backstab experiments.
- [ ] Backstab scan-timing simplification.
- [ ] Interaction profiles combining any surviving rule candidates.
- [ ] New official arena geometries.
- [ ] Competitive Strategy publication/creator ecosystem, durable ratings, tournaments, prizes, moderation, recovery, or broad public league UX.
- [ ] New Strategy languages, package ecosystems, runtime-technology migration, or production sandbox certification expansion.

## Feature Prioritization Matrix

| Feature Group | Research/User Value | Implementation Cost | Priority |
|---------------|---------------------|---------------------|----------|
| Foundation admission and measurement freeze | HIGH | MEDIUM/HIGH | P1 |
| Hierarchical planner feasibility | HIGH | HIGH | P1 |
| Reproducible runner and immutable factory | HIGH | HIGH | P1 |
| Independent automated oracles | HIGH | VERY HIGH | P1 |
| Human and model red-team channels | HIGH | HIGH | P1 |
| PSRO league, complete matrices, and response graphs | HIGH | VERY HIGH | P1 |
| Portfolio and robust pure finalist selection | HIGH | HIGH | P1 |
| Current-rules freeze and certification | HIGH | VERY HIGH | P1 |
| Lab-only three-profile boundary and containment | HIGH | HIGH | P1 |
| Equal-compute separate retraining | HIGH | VERY HIGH | P1 |
| Sealed evaluation and formation rejection decision | HIGH | HIGH | P1 |
| Persistent evidence, verification, audit, archive, tag | HIGH | HIGH | P1 |
| Extra oracle/student variants | MEDIUM | HIGH | P2 only after P1 |
| Private research visualizations | MEDIUM | MEDIUM | P2 only after P1 |
| Production formation adoption | Deferred | VERY HIGH | Not v1.38 |
| Cap/MOVE/Backstab/scan experiments | Deferred | VERY HIGH | Not primary v1.38 experiment |
| Public league/product expansion | Deferred | VERY HIGH | Separate milestone |

## Research Precedent Analysis

| Precedent | Useful Pattern | Limit | Coward's Game Approach |
|-----------|----------------|-------|------------------------|
| Original PSRO | Restricted empirical payoff game, meta-strategy, approximate responses to mixtures, iterative population expansion | Approximate policies/oracles do not establish exact full-game equilibrium | Use PSRO/double-oracle mechanics, but report oracle-relative response gaps and preserve pure deployable Strategies. |
| OpenSpiel | Explicit game/policy interfaces and reusable learning/evaluation metrics | A general framework is not the project's canonical rules authority | Reuse the research discipline, not a second engine; the lab imports Coward's Game's canonical transition kernel. |
| AlphaStar league | Frozen populations, diverse strategies/counter-strategies, and specialized exploiters | Neural, distributed, live learned-policy architecture is far beyond and mismatched to the legal runtime contract | Use frozen populations and targeted exploiters as precedent; distill all output to compact deterministic Strategy source. |
| Current Advanced library | Stable smoke/regression corpus | Shared generator and duplicate arenas overstate strategic independence | Retain it only as regression input; require independent planner cores, behavior fingerprints, and sealed response evidence. |

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Milestone boundary and required feature set | HIGH | Binding activation prompt, current PROJECT milestone contract, synchronized research/seed handoffs. |
| Production and privacy exclusions | HIGH | Activation prompt, PROJECT hard boundaries, canonical specs, and audited v1.37 foundation all agree. |
| Dependency and freeze order | HIGH | Causal validity requires measurement-before-tuning, current-before-alternates, freeze-all-before-holdout, and audit/archive/tag closure. |
| Legal Strategy constraints and information boundary | HIGH | Canonical specs plus v1.37 certified Strategy/runtime foundation. |
| Need for independent oracles and empirical payoff loop | HIGH | Local audit evidence and PSRO/OpenSpiel/league primary literature align. |
| Exact starting gate values | MEDIUM | Values are explicitly starting calibration targets and must be finalized before results. |
| Equal-compute dimensions | HIGH | Activation contract enumerates the dimensions; work-unit normalization details still need planning. |
| Actual current-rules robustness | UNKNOWN by design | Must be discovered by the frozen league and red teams. |
| Actual bracket pass/reject result | UNKNOWN by design | Must be discovered only after separate retraining and sealed evaluation. |
| Schedule/Match-count envelope | MEDIUM | Local research gives a planning envelope, but strong-controller throughput must be measured during the planner/factory spikes. |

## Sources

### Binding and Repository-Local Sources (HIGH confidence)

- [v1.38 activation prompt](../milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md)
- [Competitive Strategy Factory and Adversarial League research handoff](competitive-strategy-factory-and-adversarial-league.md)
- [SEED-002](../seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md)
- [Project contract](../PROJECT.md)
- [Core-rules, runtime, and metagame audit](v2.0-core-rules-enforcement-runtime-and-metagame-audit.md)
- [Audit reproduction artifact](../artifacts/v2.0-core-rules-audit/README.md)
- [v2.0 proposal](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/PROPOSAL.md)
- [v2.0 draft requirements](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/REQUIREMENTS.md)
- [v2.0 draft roadmap](../milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/ROADMAP.md)
- [v1.37 requirements](../milestones/v1.37-REQUIREMENTS.md)
- [v1.37 roadmap](../milestones/v1.37-ROADMAP.md)
- [v1.37 milestone audit](../milestones/v1.37-MILESTONE-AUDIT.md)
- [v1.37 Strategy evaluation foundation](../artifacts/v1.37-strategy-evaluation-foundation.md)
- [Canonical consolidated specification](../../CowardsGameSpec_Full_Consolidated_v1.md)
- [Canonical v1.4 Cycle-interleaving specification](../../CowardsGameSpec_CycleInterleaved_v1.4.md)

### Primary Research Sources (MEDIUM confidence for transfer to this project)

- Lanctot et al., [A Unified Game-Theoretic Approach to Multiagent Reinforcement Learning](https://arxiv.org/abs/1711.00832) — original PSRO formulation and approximate best responses to policy mixtures.
- Lanctot et al., [OpenSpiel: A Framework for Reinforcement Learning in Games](https://arxiv.org/abs/1908.09453) — reproducible game-learning and evaluation concepts.
- Vinyals et al., [Grandmaster level in StarCraft II using multi-agent reinforcement learning](https://www.nature.com/articles/s41586-019-1724-z) — diverse adapting league and counter-strategy precedent, not a directly transplantable architecture.

---
*Feature research for Coward's Game v1.38 Competitive Strategy Factory and Adversarial League.*
*The valid result may be a failed anti-dominance gate or rejected bracket; neither authorizes a production rules change.*
