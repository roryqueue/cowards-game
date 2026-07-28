# Pitfalls Research

**Domain:** Coward's Game v1.38 Competitive Strategy Factory and Adversarial League
**Researched:** 2026-07-27
**Overall confidence:** HIGH

## Scope and Confidence

This report covers the failure modes introduced by a reproducible Strategy factory, independent response oracles, a PSRO/double-oracle league, model and human red-team channels, sealed holdouts, deterministic compute accounting, clone detection, current-rules freeze manifests, equal-compute three-profile retraining, and a non-authorizing formation decision packet.

The binding milestone contract is the v1.38 activation prompt. The serious current-rules league must freeze before alternate starting profiles are constructed or evaluated. The only variable in the primary formation experiment is initial Soldier position. Cycle cap, MOVE, Backstab geometry, Backstab scan timing, activation counts, arenas, runtime contract, and every other rule remain fixed. Experimental-profile artifacts must be unreachable from canonical registration, canonical persistence/evidence, counted scheduling, and public/default product surfaces. A passing profile yields only a later-rules-milestone decision packet.

Confidence is **HIGH** for repository-specific boundaries because they are explicit in the activation prompt, v1.37 proof artifacts, canonical specifications, and prior audit reproductions. Confidence is **MEDIUM** for general methodological prescriptions that adapt PSRO, adaptive-holdout, preregistration, empirical-RL, and reproducible-build guidance to this specific deterministic game.

The phase names below are recommended ownership seams for roadmap creation; final phase numbers may differ:

1. **Measurement and Containment Contract** — freeze claims, metrics, thresholds, stopping rules, condition identities, budgets, holdout custody, evidence schemas, and lab/production separation.
2. **Legal Planner and Factory Substrate** — prove legal deterministic planners, immutable candidate builds, information boundaries, hostile-code handling, and reproducible execution.
3. **Independent Oracles and Red-Team Intake** — build materially independent response mechanisms, clone/independence evidence, and isolated model/human submission channels.
4. **Current-Rules League and Freeze** — run the complete current-rules PSRO/double-oracle process, preserve failures, select finalists, red-team them, and freeze the baseline.
5. **Three-Profile Formation Lab** — create only lab initial states, retrain each profile separately under equal compute, and diagnose scripted openings, convoy/STONE turtles, interaction, and response gaps.
6. **Sealed Certification, Decision Packet, and Release Proof** — open the common holdout once, certify current-rules finalists through real product boundaries, produce the non-authorizing packet, independently verify, audit, archive, tag, and post-check.

## Critical Pitfalls

### Pitfall 1: A lab profile becomes production-reachable

**Confidence:** HIGH

**What goes wrong:**
The inward-rank or bracket profile is added to a shared rules/arena enum, generic Match request, database schema, Go preset, replay fixture switch, or feature-flagged factory. It can then be registered as a canonical Strategy condition, persisted as canonical Match evidence, selected by a counted scheduler, or exposed by a public/default DTO. A passing experiment silently becomes deployable behavior; even a failed experiment leaves an unauthorized production seam.

**Why it happens:**
Reusing production types and persistence is convenient, and “disabled by default” feels equivalent to unreachable. It is not. Environment flags, test adapters, generic optional fields, migrations, and UI query parameters are all future activation paths.

**How to avoid:**
Create a versioned lab-only initial-state boundary outside production registration and scheduling contracts. It may construct an initial state for the canonical engine, but it must not add a production rules version, official arena, counted condition, Strategy eligibility field, canonical Match row, or public replay mode. Use separate artifact storage and lab identities. Make import direction one-way: the lab may consume canonical engine/spec contracts; production packages may not import lab profile definitions.

**Warning signs:**

- `initialStateProfile` appears in a public Match/MatchSet request or generated service contract.
- Go, persistence, competition, Workshop, replay, or discovery code knows `inward` or `bracket`.
- A `testOnly`, `experimental`, or environment boolean is the only guard.
- Lab evidence uses canonical Match IDs or standings rows.
- Public replay fixtures resolve profile geometry from a query parameter.

**Mandatory negative proof:**

- Attempt current/inward/bracket profile IDs through Strategy registration, account save, canonical Match persistence, exhibition and counted scheduling, Go/API creation, replay/result/discovery reads, and public DTO serialization.
- Require all experimental attempts to fail before write or produce no reachable field/route.
- Run an import/identifier monitor proving production packages and generated contracts contain no experimental-profile dependency.
- Run the same proof against a synthetic “passing bracket” result to show a positive decision still changes no production selector.

**Phase to address:** Phase 1 designs the boundary; Phase 5 implements it; Phase 6 reruns production-reachability proof.

---

### Pitfall 2: Formation work contaminates the current-rules baseline before freeze

**Confidence:** HIGH

**What goes wrong:**
Alternate starts, bracket-aware missions, formation-specific telemetry, or profile results influence current-rules candidate design, oracle prompts, thresholds, red-team tactics, or finalist selection. The “current-rules baseline” is no longer an independent pre-experiment reference.

**Why it happens:**
Teams parallelize the interesting work, share one candidate pool, or prepare profile support before the current league is complete. A chronological promise in prose does not prevent data or code from flowing backward.

**How to avoid:**
Make the current-rules freeze an executable dependency. Its root manifest must bind the current population, sources, thresholds, condition set, oracle/red-team logs, compute receipts, holdout commitment, and selected finalists. Profile construction and training must reject a missing or invalid freeze receipt. After freeze, any change to a bound current-rules artifact invalidates all downstream profile results.

**Warning signs:**

- Formation source or replay appears in a current-league prompt or candidate lineage.
- The current population is still changing after the first alternate-profile run.
- One mutable “latest population” directory serves baseline and profile work.
- Thresholds mention patterns first observed in bracket runs.
- The freeze is a date or branch name rather than a content-addressed root.

**Mandatory negative proof:**

- Demonstrate that the profile runner refuses to start without the exact current-freeze root.
- Prove every profile manifest has the current-freeze digest as an ancestor while no current-freeze artifact depends on a profile artifact.
- Mutate one byte of the current population, threshold contract, or holdout commitment and require all profile manifests to become invalid.
- Verify the current-freeze timestamp precedes all inward/bracket sources, runs, and review records.

**Phase to address:** Phase 1 defines the freeze schema; Phase 4 creates it; Phase 5 enforces it.

---

### Pitfall 3: The sealed holdout leaks without anyone opening its files

**Confidence:** HIGH

**What goes wrong:**
Candidate builders learn holdout structure through scores, pass/fail responses, replay excerpts, arena counts, opponent fingerprints, error messages, prompt context, model-provider retention, human hints, filenames, or repeated queries. Later “sealed” performance is adaptively overfit.

**Why it happens:**
Evaluation feedback is itself information. A static ACL protects bytes but not score channels, summaries, logs, screenshots, or trusted reviewers who also tune candidates.

**How to avoid:**
Commit opaque holdout hashes and split policy before training. Assign a custodian who is not a candidate author or oracle operator. Keep holdout material out of external model prompts and provider APIs. Log every access and query. Freeze all three profile populations before one scripted opening. Return only the predeclared final report, not iterative per-candidate diagnostics. Retire the holdout after disclosure.

**Warning signs:**

- Holdout score checks exist in development CI.
- Reviewers can see held-out replays before candidate freeze.
- A model red team receives hidden opponent source, arena geometry, or derived summaries.
- The same holdout is used for early stopping, clone calibration, and final certification.
- Someone says “we only looked at aggregate scores.”

**Mandatory negative proof:**

- Holdout access ledger has no pre-freeze reads and exactly the declared final-open operation.
- Secret markers from holdout files are absent from prompts, candidate source, logs, Chronicles, screenshots, caches, and public artifacts.
- A second open and any post-open training/candidate registration are rejected.
- Inject an unauthorized score query and prove it records contamination and blocks confirmatory publication.

**Phase to address:** Phase 1 establishes custody and information-release policy; Phase 6 opens and retires the holdout.

---

### Pitfall 4: Thresholds or stopping rules soften after results are visible

**Confidence:** HIGH

**What goes wrong:**
The team lowers the response threshold, redefines “materially lower interaction,” excludes an inconvenient arena, changes draw scoring, adds response iterations only for a favored profile, stops on a lucky run, or converts a hard rejection criterion into commentary. A failed gate becomes a passing narrative.

**Why it happens:**
The milestone is costly, thresholds are initially described as calibration targets, and deterministic results tempt exact post-hoc tuning. Ambiguous denominators and exception clauses create researcher degrees of freedom.

**How to avoid:**
Before candidate search, freeze exact metric definitions, units, denominators, missing-cell policy, confidence/replication treatment, pass/fail logic, stopping rules, budget exhaustion behavior, and permitted calibration window. Separate exploratory telemetry from confirmatory gates. Deviations remain possible only as explicitly labeled exploratory reruns that cannot replace the preregistered result.

**Warning signs:**

- Threshold files are modified after their bound payoff cells exist.
- “Two consecutive iterations” is selected from a longer series after inspection.
- Failed/system-error Matches disappear from denominators.
- Interaction or turtle definitions change by profile.
- A final report omits the originally planned analysis.

**Mandatory negative proof:**

- Hash thresholds, scoring, metric code, and stopping rules into every run manifest.
- Mutating any threshold after the first bound result must invalidate the run and decision.
- Feed a deliberately failing result through the report generator and prove it emits a valid failed milestone outcome without requesting a rescue run.
- Require the report to render both preregistered and any exploratory analyses, never just the favorable one.

**Phase to address:** Phase 1 freezes the contract; Phases 4–6 enforce it.

---

### Pitfall 5: Three oracle names conceal one correlated decision core

**Confidence:** HIGH

**What goes wrong:**
The structured optimizer, search teacher, model-guided synthesis, and human channel all inherit one selector, Action scorer, opening book, replay diagnosis, or candidate seed. They rediscover the same strengths and blind spots. “No oracle found a counter” is then one failure repeated under several labels.

**Why it happens:**
Shared code accelerates development. Literal legality and geometry helpers are safe to share; strategic scoring, mission choice, candidate ranking, replay prioritization, or prompts are not. Humans can also become correlated after reading model output or the same analyst memo.

**How to avoid:**
Define an allowlist of shareable literal infrastructure and a denylist of strategic cores. Preserve dependency DAGs, separate authorship/prompt histories, independent candidate rankings, and per-oracle failure logs. Keep at least three materially independent response mechanisms and a separately documented human/external channel. Measure cross-oracle action/trajectory and target-selection correlation on a probe corpus; do not infer independence from labels.

**Warning signs:**

- All candidates call one global `scoreAction`, mission selector, or rollout evaluator.
- Model prompts contain the structured oracle's recommended counter.
- Human review starts from model-generated candidate code.
- Oracles agree nearly perfectly on counterfactual probes.
- Removing one shared helper collapses every family.

**Mandatory negative proof:**

- Static dependency analysis rejects strategic-core sharing while allowing only approved legality/geometry/build/reporting helpers.
- Run counterfactual decision probes and Chronicle fingerprint correlation across oracle families against precommitted independence criteria.
- Independently regenerate at least one response from each oracle without access to other oracle outputs.
- Reclassify correlated channels as one oracle and fail the minimum-oracle gate rather than waive it.

**Phase to address:** Phase 3; independence is rechecked when Phase 4 freezes the league.

---

### Pitfall 6: Approximate response failure is reported as convergence or exact exploitability

**Confidence:** HIGH

**What goes wrong:**
No bounded oracle finds a profitable response, so the league is called converged, unexploitable, or Nash-like. The reported “exploitability” is actually only a response gap relative to the attempted oracle set. Standard PSRO/double-oracle restricted mixtures can also become more exploitable between early iterations.

**Why it happens:**
Exact best responses are intractable, familiar game-theory language sounds authoritative, and a plateau looks like evidence of optimality even when all oracles share blind spots.

**How to avoid:**
Use “oracle-relative response gap” everywhere. Report oracle families, budgets, targets, failed searches, and the strongest response found. Attack both the meta-distribution and strongest pure policies. Preserve the full iteration curve; do not assume monotonic improvement. Stop by the precommitted rule or exhausted budget, not by an unqualified “no counter.”

**Warning signs:**

- Reports use “exact exploitability,” “solved,” “Nash,” or “unbeatable.”
- Only the restricted-game equilibrium is evaluated.
- The final iteration is reported without the earlier response-gap curve.
- A failed optimizer run is counted as evidence of no best response.
- Pure-policy worst cases are absent.

**Mandatory negative proof:**

- Claim lint rejects mathematical-optimality and permanent-balance language.
- A weak or deliberately disabled oracle must not produce a low-gap certification.
- Add a fresh independently budgeted post-freeze attack; if it finds a counter, the process records the counter without rewriting the original claim scope.
- Verify reports expose the oracle set, budgets, response targets, and uncertainty/limitations beside every response-gap number.

**Phase to address:** Phase 1 defines claims; Phase 4 computes oracle-relative evidence; Phase 6 audits language.

---

### Pitfall 7: Clone detection is either cosmetic or destructive

**Confidence:** HIGH

**What goes wrong:**
Source formatting, renamed variables, table reshaping, or generated boilerplate evade source-similarity checks, so one policy family fills the league. Conversely, two independently reasoned Strategies that agree on a narrow probe set are discarded as clones, reducing real diversity.

**Why it happens:**
Source and behavior each provide incomplete evidence. Behavioral similarity depends on which states, opponents, sides, initiative conditions, and arenas are probed.

**How to avoid:**
Combine immutable lineage, shared-core/dependency inventory, normalized source/AST similarity, canonical legal-input decision fingerprints, Chronicle-derived trajectories, matchup response vectors, and manual review of borderline clusters. Calibrate clone thresholds before the league. Store the reason and evidence for each accepted/rejected candidate.

**Warning signs:**

- Clone rejection uses only source hash or edit distance.
- Behavior fingerprints come only from the Advanced library or current league leaders.
- Doctrine labels count toward diversity.
- Clone thresholds change after seeing which finalist would be removed.
- Rejected candidates have no reviewable cluster evidence.

**Mandatory negative proof:**

- A syntactically rewritten semantic clone is rejected.
- A shared-selector family with different numeric parameters is clustered.
- Two independent policies that match on smoke probes but diverge on counterfactual/held-out development probes are not automatically collapsed.
- ID renaming, horizontal mirroring, source formatting, and harmless build variation do not change the clone decision.

**Phase to address:** Phase 2 defines immutable fingerprints; Phase 3 calibrates independence; Phase 4 applies the frozen detector.

---

### Pitfall 8: Optimizing the dashboard games the experiment

**Confidence:** HIGH

**What goes wrong:**
Candidates maximize aggregate win rate against weak opponents, inflate opening entropy through opaque-ID branching, trigger meaningless early contact, self-stone to shorten Matches, create superficial behavioral diversity, or exploit duplicate conditions. A weighted score allows strong telemetry to compensate for a runtime violation, private leak, catastrophic pure counter, scripted opening, or turtle.

**Why it happens:**
Every diagnostic becomes a target once it affects selection. Aggregate scores hide intransitivity and worst cases; composite metrics conceal which hard property failed.

**How to avoid:**
Keep Match/Set outcome primary. Use non-compensating hard gates for legality, runtime, privacy, information boundaries, matrix completeness, pure-policy worst case, scripted-opening convergence, lower interaction, and turtle behavior. Treat entropy, contact, Backstab, pushes, blocks, STONE, length, and survival as separately reported diagnostics with canonicalized definitions. Advanced-library performance remains only a regression gate.

**Warning signs:**

- One composite “quality score” decides acceptance.
- High entropy disappears after ID canonicalization.
- More interactions are all self-destructive or strategically irrelevant.
- A strong average hides one severe pure counter.
- Smoke/Open-like duplicate geometries inflate sample size.

**Mandatory negative proof:**

- Fixtures with ID-keyed fake entropy, suicidal early interaction, excellent mean score plus one catastrophic pure counter, and duplicate scenario labels must fail the correct gates.
- Remove one diagnostic from the weighted score and prove hard decisions do not change because hard gates are independent.
- Render per-condition payoff and telemetry distributions, not only means.
- Manual replay review samples both apparent successes and suspicious metric extremes.

**Phase to address:** Phase 1 freezes metric semantics; Phases 4 and 5 apply them; Phase 6 reviews representative replays.

---

### Pitfall 9: “Equal compute” is only equal Match count

**Confidence:** HIGH

**What goes wrong:**
Profiles or oracle families receive the same number of Matches but different search nodes, cached payoff reuse, warm starts, model calls/tokens, human effort, candidate attempts, compiler optimization, hardware, retries, replay review, or early-stopping opportunities. The winner reflects unequal adaptation rather than the initial state.

**Why it happens:**
Wall time and Match count are easy to record. Actual search work spans several incomparable resources, and unused budget or failed attempts are often silently redistributed.

**How to avoid:**
Freeze both planned budgets and actual-consumption receipts for doctrine families, candidate count, response iterations, search nodes, model/version/prompt/tokens/calls, human procedure/time/submissions, Match schedule, sides, initiative, arenas, retries, runtime limits, hardware class, cache policy, and replay review. Predeclare whether unused budget burns or is symmetrically reallocated. Failed attempts consume budget.

**Warning signs:**

- Only elapsed time or Match count appears in manifests.
- One profile inherits cached rollouts or compiled candidates from another.
- Human effort is “best effort.”
- Model retries or prompt revisions are omitted.
- Failed/system-error runs are replaced for free.

**Mandatory negative proof:**

- A budget validator rejects missing units, overspend, unauthorized transfer, unlogged cache hits, and profile-specific early stopping.
- Actual receipts reconcile to planned caps for every profile and channel.
- Swapping hardware class, model version, prompt hash, or cache policy changes identity and prevents comparison.
- Injected failed attempts remain charged and visible.

**Phase to address:** Phase 1 defines accounting; Phase 3 records oracle/red-team work; Phase 5 enforces profile parity.

---

### Pitfall 10: Cross-profile reuse gives one formation a hidden warm-start advantage

**Confidence:** HIGH

**What goes wrong:**
Current-profile finalists, learned opening tables, profile-specific replay diagnoses, tuned parameters, teacher datasets, or payoff caches are reused for inward/bracket training—or discoveries from one alternate profile flow into another. “Separate retraining” becomes fine-tuning along an unequal path.

**Why it happens:**
Reuse is efficient and a shared base seems fair. It is fair only if the shared seed is profile-agnostic, frozen before any profile result, copied identically, and followed by isolated learning.

**How to avoid:**
Define the only allowed common seed corpus and clone it into separate identity namespaces before profile training. Permit shared doctrine specifications and literal infrastructure, not learned profile outputs. No profile's candidates, weights, tables, replays, scores, teacher labels, or caches may feed another. Run each profile from the same orchestration contract with isolated stores.

**Warning signs:**

- A profile lineage points to a candidate trained on another profile.
- Cache keys omit profile identity.
- Current finalists are called “initial population” without equal frozen copies and budgets.
- Alternate-profile teams exchange successful openings before freeze.
- One profile starts from later-generation candidates.

**Mandatory negative proof:**

- Training DAGs contain no cross-profile edges after the allowed common root.
- Cache poisoning tests prove profile identity is part of every key.
- Learned artifact hashes are distinct across namespaces unless they are the explicitly allowed frozen base.
- Reorder profile execution and reproduce the same outputs, showing no prior-profile dependency.

**Phase to address:** Phase 1 defines allowed common roots; Phase 5 enforces isolated retraining.

---

### Pitfall 11: The formation ablation changes more than initial position

**Confidence:** HIGH

**What goes wrong:**
The experiment also lowers the Cycle cap, changes facing-only MOVE, removes reversal history, requires attacker-facing Backstab, alters Backstab scan timing, changes arenas, modifies activation counts, or uses a different runtime/engine path. Any result becomes causally uninterpretable.

**Why it happens:**
These are plausible related improvements, and implementation convenience encourages a general “rules profile” switch that bundles them.

**How to avoid:**
Use one narrow initial-state constructor and the unchanged canonical transition engine after state creation. Bind exact rules/engine/runtime/Chronicle/arena/Set identities into all three manifests. Define an executable manifest diff allowlist containing only the declared Soldier positions and profile identity. Keep cap, MOVE, Backstab, and scan experiments as separately approved future work.

**Warning signs:**

- The lab profile object contains fields other than start positions.
- Transition traces use an experimental engine or event vocabulary.
- Different profiles select different arena or runtime versions.
- A result is explained by changed contact timing caused by a cap change.
- Follow-up experiments appear in the primary decision packet.

**Mandatory negative proof:**

- Pairwise manifest comparison fails on every difference except the exact declared starting coordinates/profile ID.
- From the first post-initialization transition onward, identical state/action inputs produce identical canonical transitions and hashes across profiles.
- Mutation tests that change cap, MOVE, Backstab geometry, scan timing, activation count, arena, or runtime must be rejected before execution.
- The final packet lists these factors as fixed and future interactions as unrun.

**Phase to address:** Phase 1 freezes the causal contract; Phase 5 implements and proves it.

---

### Pitfall 12: Opening entropy hides convergence on one strategic script

**Confidence:** HIGH

**What goes wrong:**
Bracket Strategies vary Soldier IDs, symmetric branches, or inconsequential Action order while all execute the same robust opening: evacuate the same wings, preserve the same pocket, establish the same screen, and delay interaction. Raw entropy looks healthy even though independent best responses converge on one exploitable or stagnant script.

**Why it happens:**
Deterministic games make scripted openings efficient, and naive entropy counts syntactic choices rather than strategic equivalence.

**How to avoid:**
Canonicalize openings under player orientation, horizontal symmetry, opaque-ID renaming, and equivalent selected-Soldier roles. Cluster mission/selection/Action sequences through first interaction and first Contraction. Compare across independent oracle families and held-out development opponents. Treat robust scripted convergence as a bracket rejection gate, not merely a diversity note.

**Warning signs:**

- Entropy falls sharply after symmetry/ID canonicalization.
- Different sources share the same first-Contraction state.
- Best responses differ only after the scripted opening.
- A single opening dominates every finalist and oracle family.
- The bracket's sealed pocket dictates fixed wing-guard timing.

**Mandatory negative proof:**

- ID-renamed and mirrored copies collapse to one canonical opening.
- A deliberately obfuscated scripted family triggers the convergence gate.
- Report both raw and canonical strategic entropy plus cluster mass.
- Replay review samples the dominant canonical clusters and documents whether opponents can force meaningful deviations.

**Phase to address:** Phase 1 defines the metric; Phase 5 evaluates it; Phase 6 confirms on sealed evidence.

---

### Pitfall 13: Convoy or STONE-shield turtling passes as robustness

**Confidence:** HIGH

**What goes wrong:**
The bracket promotes wing-guard convoys, sealed-center reserve hoarding, deliberate no-Advance STONE walls, or long low-contact turtles. These policies survive and draw well against the known field, lowering measured exploitability while making interaction and counterplay worse.

**Why it happens:**
Survival, draw avoidance/acceptance, STONE terrain, and reduced compulsory evacuation interact. A weak or correlated oracle set may fail to attack the structure. Aggregate outcome metrics do not reveal why it succeeds.

**How to avoid:**
Predefine convoy, persistent STONE shield, reserve-hoarding, and turtle classifiers using Chronicle causes and durations. Measure first Awareness/contact/push/Backstab/decisive event, no-Advance STONE by cause, wing-guard persistence, unselected ACTIVE reserves, draw rate, Match length, Contractions, and response gap. Give independent red teams explicit turtle-breaking targets without revealing holdouts. Reject materially lower interaction or robust turtle convergence.

**Warning signs:**

- High survival coincides with later first contact and more draws.
- STONE incidence rises mainly through planned no-Advance cleanup.
- Center pockets remain sealed through several Rounds.
- Winning relies on opponent impatience rather than forced counterplay.
- Red teams share the same rush doctrine and all fail similarly.

**Mandatory negative proof:**

- Curated convoy, reserve-hoard, and STONE-shield fixtures trigger the classifiers.
- A candidate cannot offset lower interaction with higher survival or aggregate Set score.
- Independent attack families target wing guards, pocket opening, graph cuts, and contraction timing.
- The bracket fails automatically when any precommitted degeneration threshold is crossed.

**Phase to address:** Phase 1 defines rejection criteria; Phase 5 runs them; Phase 6 applies the sealed decision.

---

### Pitfall 14: A privileged teacher leaks illegal information into a legal-looking student

**Confidence:** HIGH

**What goes wrong:**
An offline search teacher uses hidden full state, enemy source, future transitions, holdout identity, authoritative data absent from the legal input, or cross-Soldier private memory to choose labels. The distilled deterministic Strategy contains decisions that could not have been learned consistently from its legal information set, even though Match-time code calls no forbidden API.

**Why it happens:**
Offline privileged scoring is allowed for counterfactual analysis, and distillation can hide the provenance of each decision. Identical legal inputs may receive different labels because hidden states differ.

**How to avoid:**
Key training examples by the exact serialized legal Strategy/SoldierBrain input, objective, and memory. Aggregate hidden-state samples within an information set instead of emitting contradictory privileged labels. Record teacher features and provenance. Audit every student decision for deterministic reproduction from allowed inputs only. Keep initiative and `hasAdvancedThisActivation` authoritative fields aligned with v1.37.

**Warning signs:**

- The teacher dataset contains engine-only fields.
- Identical legal-input hashes map to inconsistent target Actions.
- Student performance collapses when IDs or Soldier order change.
- Objectives encode hidden opponent identities or future events.
- Teacher provenance cannot explain which information was used.

**Mandatory negative proof:**

- Construct hidden-state pairs with identical legal observations; emitted policy decisions must remain identical for the same legal input/memory.
- Strip all privileged fields and reproduce student outputs from stored deployable inputs.
- Run opaque-ID, Soldier-order, symmetry, deterministic-repeat, and held-out-opponent invariance tests.
- Static/runtime monitors reject candidate imports or access to engine internals beyond the serialized ABI.

**Phase to address:** Phase 2 for planner/distillation contracts; Phase 3 for teacher/model oracles; Phase 6 for finalist audit.

---

### Pitfall 15: Human and model red teams are unequal, correlated, or contaminated

**Confidence:** HIGH

**What goes wrong:**
One channel gets more time, tokens, retries, tooling, source access, or replay feedback. Humans copy model ideas; models receive human notes; both see holdout-derived clues. Successful attacks are retained while failed attempts, invalid submissions, and resource use disappear.

**Why it happens:**
Human work is hard to meter, model APIs change, external submissions arrive asynchronously, and collaboration naturally shares promising ideas.

**How to avoid:**
Freeze separate adversary models and procedures. Record model/provider/version, prompt and tool hashes, source disclosure, temperature/determinism settings, calls, tokens, candidates, retries, and failures. Record human participants/roles, time windows, allowed materials, review effort, submissions, and failures. Use quarantined intake, immutable candidate identity, identical legality/runtime gates, and no holdout access. Cross-pollination creates a combined channel, not extra independence.

**Warning signs:**

- “Human review” has no protocol or effort record.
- Model versions/prompts drift between profiles.
- Only accepted red-team candidates are archived.
- External submissions can arrive after holdout disclosure.
- One channel sees another channel's private work before freeze.

**Mandatory negative proof:**

- Prompt/log scans contain no holdout markers or unauthorized private data.
- Budget receipts include failed and rejected attempts.
- Late or over-budget submissions are quarantined as exploratory and cannot alter frozen results.
- A correlated human/model workflow is counted once for independence and fails any minimum-channel gate if no replacement exists.

**Phase to address:** Phase 3 defines and runs intake; Phase 4 freezes current-rules attacks; Phase 6 repeats equal profile attacks and audits them.

---

### Pitfall 16: The fast offline lab weakens the hostile Strategy runtime boundary

**Confidence:** HIGH

**What goes wrong:**
To achieve high throughput, external/model/human Strategy source is imported into the lab or engine process. It reads files, environment, holdouts, other candidates, network, clock, or host randomness; exhausts memory; mutates shared state; or contaminates later runs. Direct-engine results then look deterministic while bypassing the project's hostile-code model.

**Why it happens:**
Production runtime-service certification is expensive, and a direct in-process loop is attractive. Trusted factory representations and untrusted submitted source are easily conflated.

**How to avoid:**
Separate the canonical pure engine from candidate execution. Only explicitly trusted factory-owned policy representations may use a bounded direct adapter. Treat all model/human/external source as hostile and execute it through an isolated, schema-validated lab runtime with no host capabilities, strict limits, clean per-run state, and no silent fallback. Finalists still require unchanged supported-runtime/runtime-service certification.

**Warning signs:**

- `eval`, dynamic import, source compilation, or module loading occurs in the evaluator process.
- Candidate and holdout files share a mounted directory.
- Network, filesystem, clock, environment, or process APIs are available.
- A timeout leaves the worker/process alive for the next Match.
- An unavailable runtime silently falls back to trusted in-process execution.

**Mandatory negative proof:**

- Hostile probes cover filesystem, network, environment, process, time/randomness, dynamic code/import, oversized source/output/memory, deep JSON, timeout, crash, malformed result, and cross-run state.
- Strategy failure and system failure remain distinct; system failure never becomes a player loss or payoff cell.
- No-fallback tests stop the run when the required lab or production runtime is unavailable.
- Final current-rules certification traverses the real runtime-service, Chronicle, persistence, replay, privacy, and evidence path.

**Phase to address:** Phase 2 establishes the lab boundary; Phase 3 applies it to intake; Phase 6 certifies finalists.

---

### Pitfall 17: Immutable revisions do not make the experiment reproducible

**Confidence:** HIGH

**What goes wrong:**
Source is hashed, but its generator, prompt, model, normalization, compiler, dependencies, build flags, runtime, candidate-selection history, or input datasets are mutable or missing. Rebuilding the “same” revision yields different bytes or behavior. Payoff cells no longer identify exactly what played.

**Why it happens:**
A source hash proves only those bytes. It does not prove how they were produced, which artifact executed, or which evidence belongs to them.

**How to avoid:**
For every candidate, bind original and normalized source, build artifact, factory version, source commit, dependency/toolchain/runtime identities, prompts/model settings where applicable, doctrine/oracle family, parent lineage, candidate-selection decision, validation result, behavior fingerprint, and development/evaluation split. Every payoff cell binds both exact candidate manifests plus exact condition and execution receipt.

**Warning signs:**

- “Rebuild latest” is needed to rerun an old cell.
- A candidate ID resolves through a mutable registry.
- Prompt/model/toolchain versions are human notes rather than manifest fields.
- Payoff matrices reference names instead of content hashes.
- The same revision hash can select different runtime artifacts.

**Mandatory negative proof:**

- Change one source, artifact, prompt, toolchain, runtime, condition, or manifest byte and require dependent payoff cells, matrices, freezes, and decisions to invalidate.
- Rebuild accepted candidates in a clean environment and compare required artifact/behavior hashes.
- Resolve every matrix cell from content-addressed manifests without a mutable “latest” lookup.
- Preserve failed and rejected candidate manifests, not only finalists.

**Phase to address:** Phase 2 defines candidate provenance; Phase 4 binds league evidence; Phase 6 clean-room reproduces it.

---

### Pitfall 18: The payoff matrix is incomplete but the meta-solver fills the gaps

**Confidence:** HIGH

**What goes wrong:**
Missing side/initiative/arena cells, system failures, invalid candidates, or timeouts are treated as draws, zeros, priors, or ignored observations. The meta-distribution and best-response graph are computed from a matrix that was never actually played.

**Why it happens:**
Complete matrices grow quadratically; solvers often accept sparse data; retries and failures create pressure to impute.

**How to avoid:**
Use the v1.37 explicit condition identities and require every declared mirrored side-by-initiative condition for each distinct design arena. Store cell status separately from payoff. System failure makes the matrix incomplete and blocks solving; it is not a gameplay result. Incrementally compute only new rows/columns, but never impute confirmatory evidence.

**Warning signs:**

- `null`, failed, or absent cells become `0.5`.
- Side/initiative is inferred from seed spelling.
- Duplicate arena IDs count as distinct evidence.
- The solver runs before all expected cells are complete.
- Retry exhaustion disappears from the final matrix.

**Mandatory negative proof:**

- Delete or corrupt one required condition and require meta-solving, finalist selection, and freezing to fail closed.
- Inject a system failure and prove it is neither loss nor draw.
- Enumerate entrant-level side-by-initiative coverage explicitly for every pairing.
- Geometry identity, not display ID, determines distinct arena coverage.

**Phase to address:** Phase 1 defines completeness; Phase 4 enforces it for current rules; Phase 5 repeats it per profile.

---

### Pitfall 19: Failed attacks and invalid runs are silently censored

**Confidence:** HIGH

**What goes wrong:**
Only successful candidates, completed Matches, or impressive red-team attacks survive. Invalid output, timeouts, weak candidates, clone rejections, human failures, and system faults are discarded or rerun until clean. Reported efficiency, independence, and robustness are biased.

**Why it happens:**
Negative artifacts are voluminous and make the factory look less polished. Retrying feels operational rather than methodological.

**How to avoid:**
Use an append-only attempt ledger. Every candidate generation, validation, clone decision, attack, Match attempt, retry, and failure consumes budget and retains a safe result. Player violations reject the candidate under the frozen policy. System failures block/redo only under a predeclared bounded retry rule and never enter gameplay scoring. Report funnel counts and failure classes.

**Warning signs:**

- Candidate IDs have unexplained gaps.
- Compute receipts reconcile only accepted candidates.
- Red-team logs contain successes but no failed hypotheses.
- System-error Matches are absent from schedule totals.
- Retries have no idempotency or attempt identity.

**Mandatory negative proof:**

- Inject invalid output, timeout, runtime unavailable, malformed envelope, and persistence failure; verify distinct ledger entries and frozen budget charges.
- Reconstruct the candidate funnel from requested through rejected/accepted/frozen counts.
- A report with deleted negative attempts must fail root-manifest verification.
- Strategy/player failures cannot be reclassified as system failures to obtain free retries.

**Phase to address:** Phase 1 defines evidence/failure policy; Phases 2–5 populate it; Phase 6 audits completeness.

---

### Pitfall 20: Chronicle-derived telemetry drifts from canonical semantics or leaks private data

**Confidence:** HIGH

**What goes wrong:**
Opening, Backstab-cause, convoy, STONE, interaction, or response metrics are derived from ad hoc engine hooks or malformed Chronicles. Lab artifacts expose source, StrategyMemory, SoldierMemory, objectives, Awareness details, raw diagnostics, holdout identities, host data, or evaluator state. Public-looking proof becomes a privacy and integrity breach.

**Why it happens:**
New metrics need details not present in default public projections, and dumping raw events is the fastest analysis path. Experimental evidence may bypass the v1.37 Chronicle validator because it is “not production.”

**How to avoid:**
Derive telemetry from version-strict semantically validated canonical transitions/Chronicles with explicit private-lab and public-safe schemas. Keep experimental evidence outside canonical persistence but hold it to equivalent integrity checks. Publish aggregates, safe categories, opaque hashes, and representative public-safe replays only. Never publish sealed holdouts or evaluator internals.

**Warning signs:**

- Metrics read mutable engine state rather than bound transitions.
- Backstab cause is inferred differently by profile.
- Raw objective or memory appears in analysis JSON.
- Public decision packets embed full manifests, paths, or diagnostics.
- A Chronicle validation failure is waived because the run is experimental.

**Mandatory negative proof:**

- Mutation tests corrupt event order, subject/state agreement, version, or terminal data and require telemetry admission to fail.
- Privacy scans cover APIs, pages, reports, logs, prompts, replay artifacts, compute manifests, and archive contents using key and value markers.
- Public/default projections exclude source, artifacts, memories, objectives, Awareness details, raw diagnostics, holdout IDs/content, host paths, credentials, security internals, and private evaluator state.
- Recompute metrics from the frozen Chronicle/transition hashes and obtain identical output.

**Phase to address:** Phase 1 defines schemas; Phases 4–5 generate metrics; Phase 6 performs privacy and reconstruction proof.

---

### Pitfall 21: The report makes a claim broader than the experiment

**Confidence:** HIGH

**What goes wrong:**
“Robust pure finalist” becomes “unbeatable Strategy”; “oracle-relative response gap” becomes “exploitability”; a passed bracket becomes “balanced,” “meta-free,” “better game,” or “ready to ship”; Advanced-library wins become balance proof; a fixed deterministic snapshot becomes a permanent claim.

**Why it happens:**
Short product language strips qualifiers, and a successful costly experiment creates pressure for a decisive conclusion.

**How to avoid:**
Define an allowed claim vocabulary and require every claim to name its frozen field, oracle set, compute budget, conditions, date/version tuple, and limitations. Distinguish process success, current-rules empirical gate result, bracket empirical gate result, and production decision. State that future stronger humans/models may find counters.

**Warning signs:**

- “Optimal,” “solved,” “permanent balance,” “cannot develop a meta,” or “production-ready” appears.
- The current Advanced library is the headline benchmark.
- A mixed PSRO distribution is presented as a deployable entrant.
- Failures and scope limits are relegated to an appendix.
- A bracket pass is copied into player-facing rules.

**Mandatory negative proof:**

- Claim lint and report schema reject prohibited or unscoped assertions.
- Every headline result links to the exact root manifest and limitation block.
- A failed current-rules or bracket gate still produces a complete, publishable final report.
- Public copy and canonical rules remain unchanged after a synthetic pass.

**Phase to address:** Phase 1 freezes claims; Phase 6 produces and audits the final report/packet.

---

### Pitfall 22: The decision packet becomes de facto authorization to ship

**Confidence:** HIGH

**What goes wrong:**
The packet includes an implementation toggle, migration plan, production version ID, or “recommended default” that downstream work treats as approval. The bracket enters canonical rules without a separately approved rules milestone and migration/evidence program.

**Why it happens:**
Decision packets naturally recommend action, and the code already contains a lab constructor that appears easy to promote.

**How to avoid:**
Make the packet explicitly non-authorizing. It may state pass/fail, causal evidence, limitations, and what a future milestone would need to decide. It must not create a production rules version, selector, migration, counted policy, or public announcement. A later milestone must independently approve specification, compatibility, engine, Chronicle, persistence, replay, product, and migration work.

**Warning signs:**

- Packet status is `approved` rather than `empirical-pass`/`empirical-fail`.
- Production code links to or parses the decision packet.
- A rules version is reserved or activated inside v1.38.
- The packet bundles cap/MOVE/Backstab follow-ups.
- Public copy says the formation “will ship.”

**Mandatory negative proof:**

- No production selector, registry, migration, or rules spec changes when a pass fixture is substituted.
- Boundary monitors prove production packages do not consume the packet.
- Packet schema contains explicit `production_authorized: false` and fixed-rule exclusions.
- Audit verifies any later promotion requires a new milestone/approval chain.

**Phase to address:** Phase 6.

---

### Pitfall 23: Archive and tag proof creates a cosmetic chain of custody

**Confidence:** HIGH

**What goes wrong:**
The tag points to a commit before final artifacts, an ordinary tag is assumed immutable, the archive omits failed attempts or compute receipts, reports were regenerated after tagging, the post-tag checker reads the dirty working tree, or a digest covers only summaries rather than the full dependency graph.

**Why it happens:**
Git history looks authoritative, and teams optimize for a clean release rather than a verifiable join from source and holdout commitment to decision.

**How to avoid:**
Create one root manifest binding code commit, engine/runtime/toolchain identities, measurement contract, holdout commitment and access ledger, candidates, attempts, matrices, Chronicles, compute receipts, freeze manifests, reports, decision packet, and audit. Independently reproduce before archive. Commit the complete archive, create an annotated/protected tag at that exact commit, then run a post-tag checker from the tagged tree and verify every content hash and required negative artifact.

**Warning signs:**

- `git status` is dirty during proof.
- The tag or archive commit is absent from the report.
- Artifacts use mutable paths or “latest.”
- Post-tag verification reads files outside the tag.
- A signing/attestation step is treated as proof that the methodology was valid.

**Mandatory negative proof:**

- Remove a failed attack, access-log record, compute receipt, or matrix cell and require root verification to fail.
- Move/substitute the tag target and require the post-tag join to fail.
- Run the one-command reproducer in a clean checkout of the tag with no hidden local cache.
- Verify attestations/signatures and independently evaluate their policy/content; provenance alone cannot turn a bad experiment into a valid one.

**Phase to address:** Phase 6, with root-manifest inputs accumulated in every earlier phase.

## Moderate Pitfalls

### Pitfall 24: Deterministic code still depends on unstable iteration or concurrency

**Confidence:** HIGH

**What goes wrong:**
Candidate ordering, floating-point reduction, parallel completion order, filesystem enumeration, map iteration, cache eviction, or worker scheduling changes selection and manifests.

**Prevention:**
Use canonical ordering, integer/fixed-point scoring where practical, deterministic tie-breaks independent of opaque IDs, explicit seeds only for offline algorithms, deterministic merge/reduction, and repeated execution under permuted worker counts.

**Mandatory negative proof:**
Run with different concurrency, shard order, filesystem order, and clean caches; accepted candidates, matrix cells, freeze roots, and decisions must match.

**Phase to address:** Phases 1–4; repeat for all profiles in Phase 5.

### Pitfall 25: Opaque IDs or source order become strategic entropy

**Confidence:** HIGH

**What goes wrong:**
Strategies branch on player/Soldier IDs, array order, manifest order, or seed spelling. They appear diverse or strong but collapse under renaming.

**Prevention:**
Canonicalize player-forward geometry, make tie-breaks symmetry-safe, and test ID, Soldier-order, source-order, side, initiative, and horizontal-mirror invariance.

**Mandatory negative proof:**
Rename every opaque ID and permute serialized Soldier/source order without changing strategically equivalent outputs or aggregate evidence.

**Phase to address:** Phase 2; applied in Phases 4–6.

### Pitfall 26: Shared caches cross evidence boundaries

**Confidence:** HIGH

**What goes wrong:**
A cached payoff, teacher label, compile artifact, replay metric, or model answer is reused under a different profile, condition, engine/runtime identity, prompt, or candidate.

**Prevention:**
Content-address cache keys over the complete dependency identity. Separate development, current-freeze, profile, and holdout cache namespaces. Treat cache hits as compute/evidence receipts.

**Mandatory negative proof:**
Mutate each key dimension and prove a cache miss; attempt cross-profile poisoning and require rejection.

**Phase to address:** Phase 1 contract; implementation in Phases 2–5.

### Pitfall 27: The robust pure finalist is selected from the same data used to estimate it

**Confidence:** MEDIUM

**What goes wrong:**
The pure finalist is chosen for best observed worst case on the development matrix and the same matrix is presented as unbiased evidence.

**Prevention:**
Separate candidate selection from final validation. Freeze selection logic and finalist identities before sealed evaluation. Report selection-set and held-out results separately.

**Mandatory negative proof:**
The holdout runner accepts only predeclared finalist hashes and cannot nominate a different winner after results.

**Phase to address:** Phase 4 selects/finalizes; Phase 6 evaluates.

### Pitfall 28: Human replay review becomes an undocumented override

**Confidence:** HIGH

**What goes wrong:**
Reviewers excuse a failed gate, choose favorable replays, relabel turtle/script causes, or allocate extra attacks based on subjective impressions.

**Prevention:**
Freeze sampling, rubric, reviewer independence, disagreement resolution, and override policy. Human review explains and validates telemetry; it cannot replace a hard gate.

**Mandatory negative proof:**
Reviewer labels are reproducible on a blinded sample, disagreements remain visible, and no review field can alter hard pass/fail logic.

**Phase to address:** Phase 1 defines procedure; Phases 4–6 execute it.

### Pitfall 29: Current Advanced Strategies regain authority through convenience

**Confidence:** HIGH

**What goes wrong:**
Factory strength and formation balance are judged mainly by beating the Advanced library because it is stable and cheap.

**Prevention:**
Keep Starter/Advanced Strategies as regression, runtime, replay, and onboarding fixtures only. The independent probe field, current league, red teams, and sealed holdouts own competitive claims.

**Mandatory negative proof:**
A candidate that clears Advanced above 70% but fails independent response/pure-worst-case gates cannot become a finalist.

**Phase to address:** Phase 1 claim contract; Phases 4 and 6.

### Pitfall 30: A model or tool version changes mid-experiment

**Confidence:** HIGH

**What goes wrong:**
Remote model aliases, prompts, tokenizers, safety settings, compiler channels, or runtime images drift, making profile budgets and candidate provenance incomparable.

**Prevention:**
Pin exact identities where the provider exposes them; record request/response and policy metadata safely; stop rather than substitute when exact replay is impossible. Treat unavoidable provider drift as a new experimental block applied equally to all profiles.

**Mandatory negative proof:**
Alias or toolchain drift invalidates pending comparison; no silent substitution or fallback can continue one profile.

**Phase to address:** Phases 1 and 3; checked in Phase 5.

### Pitfall 31: The one-command runner works only on the author’s machine

**Confidence:** HIGH

**What goes wrong:**
Hidden caches, absolute paths, unpinned tools, local services, environment variables, manual secrets, or unrecorded data make the lab irreproducible.

**Prevention:**
Define preflight, exact inputs, toolchain/runtime identities, clean cache mode, resource requirements, resume semantics, and safe failure behavior. Separate secret holdout custody from reproducible public/dev inputs.

**Mandatory negative proof:**
An independent clean checkout can reproduce all non-secret stages and verify sealed output hashes without access to private content; missing prerequisites fail loudly.

**Phase to address:** Phase 2 builds the runner; Phase 6 performs clean-room proof.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|---|---|---|---|
| Add a generic production `initialStateProfile` enum | Easy three-profile execution | Creates a permanent route from lab evidence to canonical play | Never |
| Guard profiles with `testOnly` or an environment flag | Fast containment story | Flags drift, leak into deployment, and are hard to prove unreachable | Never |
| Share one global selector/Action scorer across oracles | Less implementation work | Correlated blind spots invalidate independence claims | Only literal legality/geometry helpers may be shared |
| Count Match totals as compute | Simple accounting | Hides search, model, human, cache, retry, and hardware inequality | Screening only, never final comparison |
| Use source hash as the full candidate manifest | Small artifacts | Cannot reproduce build, lineage, toolchain, or executed bytes | Never for accepted evidence |
| Detect clones by source similarity alone | Cheap | Obfuscation evades it; generated boilerplate creates false positives | Preliminary triage only |
| Detect clones by current-league behavior alone | Cheap | Narrow probes miss latent divergence and common blind spots | Preliminary triage only |
| Impute missing payoff cells as draws | Keeps solver running | Converts system/integrity failure into strategic evidence | Never |
| Reuse learned populations/caches across profiles | Saves compute | Destroys separate-retraining and causal claims | Only an identical pre-result common root explicitly frozen in Phase 1 |
| Let human review override thresholds | Flexible | Reintroduces post-hoc outcome selection | Never; human review may flag invalid measurement only |
| Publish raw lab manifests for transparency | Easy audit access | Leaks source, holdouts, diagnostics, host data, and evaluator state | Never on public/default surfaces |
| Regenerate clean artifacts just before tag | Tidy archive | Breaks lineage to actual runs and erases negative evidence | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|---|---|---|
| Lab initial-state boundary → canonical engine | Generalize production rules/profile selection | Construct only the initial lab state, then call the unchanged canonical transition kernel |
| Factory → Strategy runtime | Import candidate source into evaluator/engine | Execute hostile source in an isolated schema-validated runtime; allow direct trusted representations only by explicit policy |
| Factory → candidate registry | Mutable names and latest aliases | Content-address every revision/build and bind complete provenance |
| Oracle outputs → league population | Add any positive result | Require legal, novel, clone-reviewed, budget-valid immutable responses |
| League → meta-solver | Solve sparse/error-filled matrix | Require complete declared condition cells and no system-failure imputation |
| Model API → red-team channel | Send holdout/replay/private source for convenience | Use authorized development inputs only; log exact prompt/model/tool budget; never send holdouts |
| Human/external intake → lab | Trust uploads or run them locally | Quarantine, size/schema scan, immutable provenance, hostile runtime, safe diagnostics |
| Chronicle → telemetry | Derive from ad hoc hooks or unvalidated events | Use version-strict semantic validation and reconstructable canonical transitions |
| Lab artifacts → persistence | Store them as canonical Matches for reuse | Keep a separate lab evidence store with no counted/public registration path |
| Lab results → public report | Reuse canonical public result DTOs with hidden fields | Create a purpose-built aggregate, privacy-safe decision-packet projection |
| Current freeze → formation runner | Check a human-readable status file | Require and verify the exact content-addressed current-freeze receipt |
| Archive → annotated tag | Tag before all artifacts are committed | Archive complete root, tag that exact commit, then verify from tagged checkout |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|---|---|---|---|
| Recompute the whole payoff matrix every iteration | Quadratic Match growth dominates oracle work | Preserve immutable cells; compute only new rows/columns; verify complete root before solve | As population and condition count grow beyond the first dozen Strategies |
| Certify every candidate through full service/four-language paths | Runtime-service/toolchain cost overwhelms search | Direct canonical screens for trusted candidates; hostile lab runtime for submissions; expensive certification only for frozen finalists | During hundreds/thousands of candidate attempts |
| Recompile identical source per Match | Build latency exceeds Match latency | Content-address compiled artifacts and bind cache receipts to full identity | Immediately for Rust/Zig/WASM-heavy fields |
| Store full raw traces in one monolithic JSON | Memory, parsing, and corruption recovery become unbounded | Chunk/content-address transitions, matrices, and receipts with root manifests | Hundreds of thousands of Matches |
| Run behavior clone comparisons across all pairs and all traces | O(n²) similarity and I/O dominate | Stage hash/AST triage, probe fingerprints, then deep review only candidate clusters | Large candidate funnels |
| Open holdout because development evaluation is slow | Methodological shortcut masquerades as debugging | Build separate development probes and fail-loud observability; never use sealed evidence diagnostically | First serious system failure near release |
| Parallel completion determines acceptance order | Different worker counts yield different populations | Canonical batch boundaries, ordering, and deterministic admission after all batch results | Any concurrent oracle/factory run |
| Unlimited retries hide flaky runtime and overspend | “Eventually green” matrices | Precommit retry classes/counts; charge attempts; block on exhaustion | As soon as hostile or remote/model channels are used |

## Security and Privacy Mistakes

| Mistake | Risk | Prevention |
|---|---|---|
| Execute human/model/external source in the lab process | Host/holdout exfiltration, arbitrary code, nondeterminism | Isolated hostile runtime, no capabilities, bounded schemas/resources, clean state, no fallback |
| Mount holdout and candidate workspaces together | Candidate can inspect sealed inputs or other source | Split custody/processes/filesystems and pass only legal serialized inputs |
| Include holdout content in remote model prompts | Permanent contamination or provider disclosure | Never send sealed material; use development attacks and offline custody |
| Trust source filtering as a sandbox | Bypass through language/runtime behavior | Enforced runtime isolation and executable abuse probes |
| Accept archives/uploads without structural limits | Path traversal, decompression bombs, oversized artifacts | Quarantine, canonical paths, byte/file/depth caps, no symlinks, schema and capability validation |
| Publish raw errors/logs/manifests | Source, memory, paths, tokens, security internals, evaluator state leak | Separate private diagnostics and public-safe categories; scan keys and values |
| Reuse owner/debug replay projection in reports | Private memory/objective/Awareness exposure | Purpose-built aggregate decision projection |
| Sign artifacts but never verify signatures/policy | False confidence in provenance | Verify subject digest, signer/workflow identity, timestamp, and policy during admission/post-tag check |
| Treat provenance as correctness | A reproducible or signed bad experiment is still bad | Independently validate methodology, completeness, thresholds, and negative evidence |
| Let a Strategy failure masquerade as a system failure | Free retry and competitive manipulation | Central three-way classification with player/system negative tests |

## UX and Communication Pitfalls

| Pitfall | User/Reviewer Impact | Better Approach |
|---|---|---|
| Label lab profiles as “beta rules” | Implies future shipping and invites production coupling | “Lab-only initial-state profile; not registerable, counted, persisted, or public” |
| Call response gap “exploitability” | Overstates what bounded oracles prove | “Oracle-relative response gap against named frozen oracle set” |
| Present the PSRO mixture as a Strategy | Suggests a deployable adaptive entrant | Show mixture as training/diagnostic evidence; publish separate pure finalists |
| Hide failed attacks and invalid candidates | Makes factory look stronger and more efficient than it was | Publish safe funnel counts and failure categories |
| Report only aggregate win rate | Conceals side/initiative bias, intransitivity, and pure counters | Show condition-complete matrix, worst pure response, graph, and diagnostic distributions |
| Celebrate high opening entropy without canonicalization | Confuses cosmetic variation with doctrine diversity | Show raw versus symmetry/ID-canonical strategic entropy |
| Frame turtle rejection as aesthetic judgment | Makes gate seem arbitrary | Publish precommitted causal classifiers and representative safe replays |
| Phrase a bracket pass as a rule decision | Bypasses later approval | Explicit empirical pass/fail plus `production_authorized: false` |
| Use Advanced-library result as headline | Reinstates toy agents as balance authority | Label it regression-only beside independent-field evidence |
| Bury limitations | Encourages permanent/meta-free claims | Put scope, oracle budgets, holdout policy, and non-authorization beside the headline result |

## “Looks Done But Isn’t” Checklist

- [ ] **Measurement freeze:** Contract is content-addressed and includes exact claims, metrics, thresholds, denominators, stopping, retries, budgets, condition identities, and report logic.
- [ ] **Holdout seal:** Opaque commitment, custodian, access/query ledger, one-open script, retirement policy, and contamination response are executable.
- [ ] **Lab containment:** Experimental profiles fail registration, canonical persistence, counted scheduling, API/Go creation, replay/result/discovery, and public DTO tests.
- [ ] **Current-rules chronology:** Formation runner requires the exact current-freeze receipt; current artifacts have no dependency on profile artifacts.
- [ ] **Factory reproducibility:** Accepted and rejected candidates bind source, artifact, build, toolchain/runtime, lineage, oracle, fingerprints, and selection decisions.
- [ ] **Hostile execution:** External/model/human source passes capability, timeout, memory/output, malformed-result, clean-state, and no-fallback probes.
- [ ] **Oracle independence:** Shared-core inventory and counterfactual correlation evidence prove at least three materially independent response mechanisms.
- [ ] **Clone detection:** Syntactic rewrite, shared-selector, behavioral clone, symmetry/ID, and false-positive cases are tested before league admission.
- [ ] **Payoff completeness:** Every pairing has every declared side/initiative/distinct-arena condition; missing/system-failure cells block solving.
- [ ] **Failure ledger:** Failed attacks, rejected candidates, player violations, system failures, and retries are retained and charged to budget.
- [ ] **Current league freeze:** Population, sources, matrices, meta-distribution, pure finalists, thresholds, budgets, red-team logs, and holdout commitment share one root.
- [ ] **Profile isolation:** Current/inward/bracket training DAGs share only the permitted frozen root and have no cross-profile learned/cache edges.
- [ ] **Equal compute:** Planned budgets and actual receipts reconcile across doctrine, candidate, oracle, model, human, node, Match, condition, hardware, and replay-review units.
- [ ] **Causal diff:** Pairwise profile manifests differ only in exact initial Soldier positions/profile identity.
- [ ] **Opening gate:** Raw and canonical strategic entropy plus dominant opening clusters are reported; scripted convergence is a hard rejection.
- [ ] **Turtle gate:** Convoy, persistent STONE shield, reserve-hoarding, lower interaction, draw, and Match-length thresholds are non-compensating.
- [ ] **Information boundary:** Identical legal information sets cannot yield hidden-state-conditioned deployed decisions.
- [ ] **Sealed open:** All populations/finalists freeze before the single holdout evaluation; post-open tuning and second open fail.
- [ ] **Current-rules certification:** Supported runtimes, runtime-service, Chronicle, replay, persistence, privacy, and evidence paths pass for frozen current finalists.
- [ ] **Decision packet:** Contains causal result, limitations, failed gates, fixed-rule list, future questions, and explicit non-authorization; production selectors remain unchanged.
- [ ] **Privacy:** APIs, pages, prompts, logs, traces, manifests, reports, proofs, and archive pass key/value scans.
- [ ] **Clean reproduction:** Independent tagged checkout verifies root manifests and reproduces all non-secret stages without hidden local state.
- [ ] **Archive/tag join:** Complete archive commit, annotated/protected tag, and independent post-tag checker agree on exact identities.
- [ ] **Claim calibration:** No exact exploitability, mathematical optimality, permanent balance, meta-free, or automatic-shipping claim appears.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---|---|---|
| Holdout leaked or queried early | HIGH | Mark it contaminated, preserve the incident, create a genuinely new holdout under new custody, refreeze all affected populations, and rerun confirmatory evaluation |
| Threshold changed after results | HIGH | Restore original preregistered analysis as the only confirmatory result; label changed analysis exploratory; rerun only with a new contract/holdout if a new claim is needed |
| Oracle families found correlated | MEDIUM–HIGH | Reclassify them as one family, fail the independence gate, build a genuinely separate oracle, and rerun affected league iterations |
| Cross-profile learned reuse discovered | HIGH | Discard all affected profile evidence and retrain isolated populations from the permitted common root |
| Unequal compute or unlogged retries | HIGH | Reconcile receipts; if parity cannot be proved, discard the comparison and rerun every profile under a new frozen budget block |
| Formation profile reached production/persistence | CRITICAL | Disable the path fail-closed, inventory and quarantine affected evidence, prove no counted/public contamination, add structural negatives, and rerun the milestone audit |
| System failure entered a payoff | MEDIUM–HIGH | Remove no source evidence; mark the matrix incomplete, repair classification, replay the exact condition under the frozen retry policy, and regenerate dependent roots |
| Clone detector admitted a correlated family | MEDIUM | Preserve original ledger, recalibrate only on development data, re-cluster, invalidate affected population/matrix roots, and rerun selection |
| Teacher information leakage | HIGH | Reject descendant candidates, remove contaminated datasets, rebuild from legal information-set keys, and rerun all dependent evidence |
| Turtle/script metric was wrong | HIGH | Keep original confirmatory outcome, fix the metric as a new contract, generate a new evaluation split/holdout, and do not retroactively rescue the bracket |
| Privacy leak in proof/archive | HIGH | Remove access immediately, rotate exposed secrets, preserve a private incident record, regenerate only public-safe projections, and issue a corrected archive/tag rather than mutating the old one |
| Broken provenance/root manifest | HIGH | Do not reconstruct missing history from memory; mark affected claim unverifiable, rerun from the last intact root, and create a new archive identity |
| Overstated public claim | MEDIUM | Publish a scoped correction linked to exact evidence, retain the old report for audit, and add claim-lint regression coverage |
| Tag/archive mismatch | HIGH | Do not move the published tag silently; create a corrected archive and new tag, document supersession, and rerun independent post-tag verification |

## Pitfall-to-Phase Mapping

| Pitfall | Primary Prevention Phase | Required Verification |
|---|---|---|
| Lab profile production reachability | 1 and 5 | Registration/persistence/scheduling/API/public negative matrix; production import monitor |
| Baseline contaminated before freeze | 4 | Current-freeze root and one-way dependency proof |
| Holdout leakage | 1 and 6 | Access/query ledger, secret scans, one-open and post-open rejection |
| Threshold/stopping softening | 1 | Hash-bound contract; mutation invalidation; failed-result report proof |
| Correlated oracles | 3 | Shared-core dependency audit and counterfactual correlation matrix |
| Approximate response overstated | 4 and 6 | Oracle/budget-scoped response report and claim lint |
| Clone detector failure | 2 and 3 | Rewrite/shared-core/behavior/symmetry/false-positive corpus |
| Metric gaming | 1, 4, and 5 | Adversarial metric fixtures plus non-compensating hard gates |
| Equal-compute theater | 1 and 5 | Planned-versus-actual multi-resource receipt reconciliation |
| Cross-profile reuse | 5 | Isolated training DAGs, stores, cache keys, and order-independence |
| Formation causal confounding | 5 | Exact manifest diff allowlist and canonical transition identity |
| Scripted opening convergence | 5 and 6 | Symmetry/ID-canonical clusters and dominant-mass rejection |
| Convoy/STONE turtle | 5 and 6 | Causal telemetry classifiers, targeted independent attacks, hard rejection |
| Privileged teacher leakage | 2 and 3 | Legal-information-set reproducibility and hidden-state pair tests |
| Unequal/contaminated red teams | 3 and 6 | Prompt/human logs, budget receipts, separation and holdout scans |
| Offline runtime weakening | 2 | Hostile matrix, clean-state, three-way failure, no-fallback proof |
| Incomplete candidate provenance | 2 | Clean rebuild and dependency-hash invalidation |
| Sparse/error payoff matrix | 4 and 5 | Complete condition enumeration; missing/error cell blocks solver |
| Failure censorship | All; owned by 1 | Append-only attempt ledger and funnel reconciliation |
| Telemetry drift/privacy leak | 4–6 | Semantic Chronicle/reconstruction equality and artifact-wide privacy scans |
| Misleading claims | 1 and 6 | Claim schema/lint and evidence-scoped headlines |
| Decision packet authorizes shipping | 6 | Production selectors unchanged; `production_authorized: false`; no consumer imports |
| Cosmetic archive/tag proof | 6 | Clean tagged-checkout reproduction and tag-to-root post-check |
| Nondeterministic orchestration | 2–5 | Worker/shard/order/cache permutation reproduction |

## Roadmap Research Flags

| Recommended Phase | Risk | Deeper Research / Spike Required |
|---|---|---|
| 1. Measurement and Containment Contract | CRITICAL | Formalize non-compensating gates, exact denominators, sequential stopping, compute unit ontology, holdout custody, contamination response, and lab/production reachability matrix before implementation |
| 2. Legal Planner and Factory Substrate | CRITICAL | Spike hierarchical planner feasibility, trusted-vs-hostile execution split, clean reproducible build, legal information-set distillation, deterministic parallelism, and full candidate provenance |
| 3. Independent Oracles and Red-Team Intake | CRITICAL | Demonstrate actual planner-core independence, calibrate clone thresholds on development probes, define model/human budgets and confidentiality, and test hostile external submission intake |
| 4. Current-Rules League and Freeze | CRITICAL | Validate complete-matrix scaling, solver behavior under deterministic Set scoring, approximate-response interpretation, pure-finalist selection, and a content-addressed freeze root |
| 5. Three-Profile Formation Lab | CRITICAL | Prove single-variable initial-state seam, cache/store isolation, equal-compute receipts, canonical opening equivalence, and convoy/STONE/lower-interaction classifiers before full runs |
| 6. Sealed Certification, Decision Packet, and Release Proof | CRITICAL | Dry-run one-open mechanics on a sacrificial mock holdout, public/private projections, clean tagged-checkout reproduction, archive/tag/post-check join, and non-authorizing packet enforcement |

## Sources

### Binding and repository-local primary sources

- `.planning/milestone-proposals/v1.38-competitive-strategy-factory-and-adversarial-league/ACTIVATION-PROMPT.md`
- `.planning/research/competitive-strategy-factory-and-adversarial-league.md`
- `.planning/seeds/SEED-002-competitive-strategy-factory-and-adversarial-league.md`
- `.planning/PROJECT.md`
- `.planning/research/v2.0-core-rules-enforcement-runtime-and-metagame-audit.md`
- `.planning/artifacts/v2.0-core-rules-audit/README.md`
- `.planning/milestone-proposals/v2.0-rules-integrity-and-metagame-renewal/{PROPOSAL,REQUIREMENTS,ROADMAP}.md`
- `.planning/milestones/v1.37-{REQUIREMENTS,ROADMAP,MILESTONE-AUDIT}.md`
- `.planning/artifacts/v1.37-strategy-evaluation-foundation.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGameSpec_CycleInterleaved_v1.4.md`
- `CowardsGame_Technical_Architecture_Spec_V1.md`

### External methodology and provenance sources

- Lanctot et al., [A Unified Game-Theoretic Approach to Multiagent Reinforcement Learning](https://arxiv.org/abs/1711.00832) — PSRO uses approximate best responses and identifies policy correlation/overfitting risk.
- Bighashdel et al., [Policy Space Response Oracles: A Survey](https://www.ijcai.org/proceedings/2024/0880) — strategy exploration and restricted-population quality are central PSRO challenges.
- McAleer et al., [Anytime PSRO for Two-Player Zero-Sum Games](https://arxiv.org/abs/2201.07700) — ordinary early-stopped PSRO need not improve exploitability monotonically.
- Patterson et al., [Empirical Design in Reinforcement Learning](https://www.jmlr.org/papers/v25/23-0183.html) — implementation choices, hyperparameters, aggregation, variation, and experimenter bias can invalidate comparisons.
- Dwork et al., [Generalization in Adaptive Data Analysis and Holdout Reuse](https://arxiv.org/abs/1506.02629) — repeated adaptive holdout reuse can overfit through evaluation feedback.
- Hardwicke and Wagenmakers, [Reducing bias, increasing transparency and calibrating confidence with preregistration](https://www.nature.com/articles/s41562-022-01497-2) — freeze study and analysis choices before outcomes are known and disclose deviations.
- OpenAI, [A shared playbook for trustworthy third-party evaluations](https://openai.com/index/trustworthy-third-party-evaluations-foundations/) — harness, tools, budgets, contamination, reward hacking, and claim scope must be reported.
- [Reproducible Builds definition](https://reproducible-builds.org/docs/definition/) — reproducibility binds source, environment, instructions, and bit-identical artifacts.
- GitHub Docs, [Artifact attestations](https://docs.github.com/en/actions/concepts/security/artifact-attestations) — provenance must be verified and does not itself prove artifact security or methodological validity.
- GitHub Docs, [Immutable releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases) — protected tag/assets and release attestations strengthen, but do not replace, the experiment's evidence chain.

---
*Pitfalls research for Coward's Game v1.38 Competitive Strategy Factory and Adversarial League.*
