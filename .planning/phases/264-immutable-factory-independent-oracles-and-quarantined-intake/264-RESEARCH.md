# Phase 264: Immutable Factory, Independent Oracles, and Quarantined Intake - Research

**Researched:** 2026-09-13
**Domain:** Private, deterministic strategy-candidate factory with immutable provenance, hostile-source supervision, clone evidence, and independent oracle boundaries
**Confidence:** HIGH for repository boundaries and required scope; MEDIUM for empirical calibration cutoffs

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Carry-forward integrity and containment
- **D-01:** Phase 262's admitted authority and immutable measurement/custody contract and Phase 263's passed feasibility, task-identity, deterministic-runner, and hostile-runtime receipts are mandatory inputs. A missing or failed predecessor gate stops Phase 264.
- **D-02:** Candidate, attempt, oracle, intake, and fingerprint artifacts are private, content-addressed, immutable, and never addressed through mutable `latest`.
- **D-03:** All emitted source—whether produced by search, a model, a human, or an external submitter—is hostile and executes only through the existing supervised provider/runtime boundary. The coordinator, lab worker, web, API, and Go never import or execute it, and no fallback lane converts a failure into a result.
- **D-04:** Exact three-way success/player-violation/system-failure semantics apply. Invalid, failed, retried, duplicate, weak, rejected, or system-failed attempts remain charged evidence and cannot be erased or scored as gameplay.
- **D-05:** The factory remains private and production-unreachable. It must not write production Strategy Revision tables, registration schemas, persistence, Chronicle, schedules, standings, or public/default DTOs.

### Immutable candidate repository and attempt ledger
- **D-06:** Store candidates in a private revision-like content-addressed repository, not production revision tables. Reuse proven source/artifact identity concepts without making lab candidates canonical Strategies.
- **D-07:** Each candidate binds exact source bytes/hash, build and toolchain identity, compatibility tuple, factory/algorithm/schema versions, parent lineage, doctrine and oracle families, split, validation, native language/provider/runtime lane, runtime profile, and behavior fingerprints.
- **D-08:** Acceptance never mutates a candidate. Rebuilds, provider changes, prompt changes, validation changes, or metadata corrections create a new artifact and lineage edge.
- **D-09:** The append-only attempt ledger records the task and budget identity, authoring mechanism, inputs, immutable outputs, validation, duplicate/clone evidence, retry relation, resource consumption, and final disposition for accepted, rejected, invalid, duplicate, legal-but-weak, failed, retried, and system-failed work.
- **D-10:** Do not impose artificial language quotas or translate candidates to manufacture diversity. Each accepted candidate remains on its exact declared native lane; later certification must test that exact source and lane without inferred coverage or fallback.

### Clone and correlation evidence
- **D-11:** Diversity evidence combines frozen source-structure, lineage, dependency, legal-input decision, Chronicle-behavior, and matchup-response fingerprints. Source hashes, doctrine labels, cosmetic rewrites, or parameter changes alone are insufficient.
- **D-12:** Calibrate clone and correlation thresholds on a development-only corpus containing semantic rewrites, shared-selector variants, symmetry/opaque-ID variants, near-identical behavior, genuine latent divergence, and expected false positives; freeze thresholds before Phase 265 league admission.
- **D-13:** Borderline clone or independence cases are `unresolved` and quarantined. They do not count toward family, core, finalist, or independent-oracle gates until affirmative evidence resolves them.

### Materially independent automated response channels
- **D-14:** Provide three physically separate private strategic-core packages: a structured tactical optimizer, a search teacher/distiller, and a provider-neutral frozen-bundle program synthesizer.
- **D-15:** The structured tactical optimizer owns its own strategic selector, mission scoring, Action scoring, search state, and response-generation logic.
- **D-16:** The search teacher/distiller may use privileged counterfactuals offline, but its emitted student is explicit deterministic source whose deployed choices reproduce from the canonical legal information set only.
- **D-17:** The model-synthesis channel records immutable provider/model/version/settings/prompt/context/token/attempt request-response bundles. Model calls happen outside deterministic Match/search execution; runners consume frozen bundles and validated explicit source only.
- **D-18:** Shared code is limited to an audited allowlist for literal legality, geometry, strict schemas, canonical identity/artifact creation, supervised execution adapters, and reporting. Shared strategic selectors, mission/Action scorers, search trees, learned parameters, response logic, or prompts invalidate independence.
- **D-19:** Every independence claim is supported by dependency, authorship, source, behavior, counterfactual-correlation, clone, and failure-mode evidence. A package name or separate process is not sufficient.
- **D-20:** Provider/model identity drift or an unavailable exact identity fails loudly and creates a new versioned attempt/block; it is never silently substituted into the same evidence root.

### Human and external quarantine
- **D-21:** Human/external intake has a separately documented private channel with frozen disclosure, submission count/time, reviewer budget, reviewer reuse, independence/conflict declarations, confidentiality, provenance, validation, and acceptance/rejection policy.
- **D-22:** Intake accepts only explicit deterministic source and complete provenance. Advice, prose, opaque binaries without required identity, live agents, or a claim that cannot pass the exact hostile validation/runtime path cannot enter the factory.
- **D-23:** Reviewers see only the disclosure class authorized by the frozen protocol. Raw holdout material, other private candidate source, StrategyMemory, SoldierMemory, objectives, evaluator state, host data, credentials, and security internals remain unavailable.
- **D-24:** Failed and rejected human/model/external attacks remain in the same evidence root and consume their declared budgets; reviewers cannot selectively resubmit or conceal unfavorable work.

### the agent's Discretion
- Exact package names below the three required strategic-core boundaries, internal APIs, store layout, and reviewer tooling are technical choices if import, provenance, and privacy tests enforce the decisions above.
- Clone thresholds, correlation statistics, and independence materiality cutoffs are chosen only after the required Phase 264 calibration spike and then frozen before league admission.
- The factory may choose efficient fingerprint representations and trace sampling consistent with Phase 262 retention and privacy rules; it may not reduce the required fingerprint dimensions.

### Deferred Ideas (OUT OF SCOPE)

- Complete payoff matrices, meta-solving, response admission, portfolio/finalist selection, and development red team belong to Phase 265.
- Current-league freezing belongs to Phase 266; formation artifacts remain prohibited until that root passes.
- Equal profile-specific model/human allocations belong to Phase 268, and sealed evaluation belongs to Phase 269.
- Production publication, new languages/packages, broad sandbox claims, and public league features remain outside v1.38.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Keep engine code pure, deterministic, serializable, and side-effect free; do not implement game rules in React. [VERIFIED: AGENTS.md]
- Hostile Strategy source must never execute in web/API processes; Node `vm` is not an isolation boundary, and every runtime boundary needs schema validation. [VERIFIED: AGENTS.md]
- Engine logic must not use time, randomness, filesystem, network, or database access. [VERIFIED: AGENTS.md]
- Preserve canonical vocabulary and immutable submitted Strategy Revisions; public replay must not expose source, memories, or objective payloads. [VERIFIED: AGENTS.md]
- Tests must distinguish strategy failure from system failure; replay/Match changes require deterministic reconstruction, integrity, and board-realism checks. [VERIFIED: AGENTS.md]
- Planning documentation changes must be committed. [VERIFIED: AGENTS.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|---|---|---|
| FACT-05 | Immutable revision-like candidate evidence | Private candidate DAG, identity schemas, immutable publication and lineage rules. |
| FACT-06 | Preserve and charge every attempt/disposition | Append-only ledger with one typed terminal disposition per attempt and budget/task roots. |
| FACT-07 | Hostile emitted source uses supervised boundary only | Reuse `runCanonicalLabMatch`/provider evidence; prohibit direct imports, execution, and fallback. |
| FACT-08 | Six-dimensional clone/correlation evidence | Development calibration corpus, frozen six-dimensional fingerprints, unresolved quarantine. |
| ORCL-01 | Three independent automated mechanisms + intake | Three leaf strategic-core packages plus separately controlled intake protocol. |
| ORCL-02 | Structured tactical optimizer | Private leaf owns selector, mission/action scoring, search state and emission. |
| ORCL-03 | Privileged teacher with legal-information student | Teacher-only counterfactual boundary and emitted-source information-set regression tests. |
| ORCL-04 | Frozen provider-neutral model bundles | Typed request/response bundle, exact identity check, no invocation from Match/search path. |
| ORCL-05 | Quarantined human/external submissions | Frozen protocol, disclosure class, provenance, budget and immutable review receipts. |
| ORCL-06 | Audited shared-helper allowlist | Import graph denylist proves no shared strategic core or prompt reuse. |
| ORCL-07 | Multi-axis independence evidence and retained failures | Dependency/authorship/source/behavior/correlation/clone/failure receipts rooted in the ledger. |
</phase_requirements>

## Summary

Phase 264 should be one private factory subsystem rooted in the existing `@cowards/strategy-lab` canonical identity and supervised Match bridge, with three *leaf* strategic-core packages and a fourth quarantine intake adapter. [VERIFIED: `packages/strategy-lab/src/contracts.ts`, `runtime-bridge.ts`, `264-CONTEXT.md`] The factory coordinator may construct, validate, fingerprint, and record immutable artifacts, but it must never import candidate source as code, call an oracle's strategic internals, create production revisions, schedule Matches, or publish DTOs. [VERIFIED: `264-CONTEXT.md`, `AGENTS.md`]

The correct minimum is not a new persistence service or a live model integration. Use canonical JSON plus domain-separated SHA-256 roots already present in the lab; represent every candidate, attempt, request/response bundle, fingerprint, intake packet, and readiness receipt as a bounded, immutable private value. [VERIFIED: `packages/strategy-lab/src/contracts.ts`, `identity.ts`] Provenance should capture externally controlled inputs, resolved dependencies, builder/version, invocation identity, and outputs; this is a useful schema discipline, not a claim of SLSA conformance. [CITED: https://slsa.dev/spec/v1.0/provenance]

**Primary recommendation:** Extend `@cowards/strategy-lab` for factory contracts and admission, create three dependency-isolated private oracle packages, and prove their separation and evidence flow with static graph plus deterministic fixture tests before Phase 265—not with new large-scale Match measurements. [VERIFIED: `264-CONTEXT.md`, `264-CONTEXT.md` D-14 through D-19]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|---|---|---|---|
| Candidate/artifact and append-only attempt ledger | Private offline lab | Filesystem artifact store | The lab owns canonical identity and evidence; it must remain outside production persistence. [VERIFIED: `264-CONTEXT.md` D-05 through D-09] |
| Candidate validation/execution | Runtime-service supervised boundary | Private lab bridge | Only the trusted provider bridge may execute hostile source and classify results. [VERIFIED: `packages/strategy-lab/src/runtime-bridge.ts`] |
| Tactical optimizer, teacher/distiller, model synthesizer | Separate private oracle packages | Lab admission API | Strategic cores must be physically separated; admission is the common non-strategic boundary. [VERIFIED: `264-CONTEXT.md` D-14 through D-18] |
| Clone/fingerprint calibration | Private offline lab | Canonical engine/runtime traces | Fingerprints are private evidence produced after validation; no public or league ownership exists yet. [VERIFIED: `264-CONTEXT.md` D-11 through D-13] |
| Human/external intake | Private quarantine module | Lab admission API | Untrusted submissions require controlled disclosure and the same hostile validation path. [VERIFIED: `264-CONTEXT.md` D-21 through D-24] |
| Production/web/API/Go | — | — | Explicitly excluded; none may import or execute factory candidate source. [VERIFIED: `264-CONTEXT.md` D-03, D-05] |

## Standard Stack

### Core

| Library / component | Version | Purpose | Why Standard |
|---|---:|---|---|
| `@cowards/strategy-lab` | `0.1.0` | Private canonical roots, bounded schemas, task identity, runner, and supervised bridge | Existing private package already depends only on spec, engine, and runtime JS. [VERIFIED: `packages/strategy-lab/package.json`, `contracts.ts`] |
| `@cowards/spec` | `0.1.0` | Canonical JSON admission and strategy/runtime contracts | Reuse identity concepts without widening production revision storage. [VERIFIED: `packages/spec/package.json`, `264-CONTEXT.md`] |
| `@cowards/engine` | `0.1.0` | Canonical `MATCH_KERNEL` only | Preserves a single rules/transition authority. [VERIFIED: `packages/strategy-lab/src/runtime-bridge.ts`] |
| `@cowards/runtime-js` | `0.1.0` | Existing supervised hostile-source adapter path | Lab bridge already checks exact runtime identity and maps three-way results. [VERIFIED: `packages/strategy-lab/package.json`, `runtime-bridge.ts`] |
| TypeScript | `6.0.3` | Typed private contracts/packages | Current repository toolchain. [VERIFIED: `package.json`] |
| Vitest | `4.1.6` | Deterministic focused contract tests | Current repository test runner. [VERIFIED: `package.json`] |

### Supporting

| Component | Purpose | When to Use |
|---|---|---|
| `labRoot(domain, value)` | Canonical domain-separated SHA-256 root | Every immutable artifact identity and cross-artifact link. [VERIFIED: `packages/strategy-lab/src/contracts.ts`] |
| `LabRuntimeEvidence` / `runCanonicalLabMatch` | Bound provider evidence and exact three-way classification | Candidate runtime validation/fingerprint collection only. [VERIFIED: `packages/strategy-lab/src/runtime-bridge.ts`] |
| `scripts/check-v1-38-lab-boundaries.ts` pattern | Private-to-production import/deployment denial | Extend for each new oracle/quarantine package. [VERIFIED: `263-VERIFICATION.md`] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|---|---|---|
| Private content-addressed factory artifacts | Production Strategy Revision tables | Rejected: would make experimental candidates product-reachable and violate D-05/D-06. [VERIFIED: `264-CONTEXT.md`] |
| Frozen bundle plus explicit source | Live model calls in Match/search | Rejected: would violate deterministic execution and provenance requirements. [VERIFIED: `264-CONTEXT.md` D-17] |
| Three separate strategic cores | One shared optimizer with labels | Rejected: labels/process names do not establish strategic independence. [VERIFIED: `264-CONTEXT.md` D-18, D-19] |

**Installation:** No external package installation is recommended or needed. [VERIFIED: `packages/strategy-lab/package.json`, `264-CONTEXT.md`]

## Architecture Patterns

### System Architecture Diagram

```text
frozen protocol + task/budget roots
              |
              v
 three separate oracle packages -----> explicit source / immutable bundle
 tactical | teacher/distiller | model -------------------+
                                                     human/external packet
                                                               |
                                                               v
              private factory admission --> validate --> supervised runtime bridge
                     |                    |             | success/player/system
                     |                    |             v
                     |                    +--> six fingerprint dimensions
                     v
 candidate DAG + append-only attempt ledger --> clone/independence receipt
                     |                                  |
                     +------ unresolved/rejected <------+---- accepted snapshot
                     |
                     +-- private only; no production DB, routes, Chronicle, or DTOs
```

### Recommended Project Structure

```text
packages/
├── strategy-lab/                 # common non-strategic factory contracts/admission/fingerprints
├── strategy-oracle-tactical/     # owns its tactical strategic core
├── strategy-oracle-teacher/      # owns offline teacher and legal student distillation
└── strategy-oracle-model/        # owns frozen bundle parsing/source emission only
scripts/
└── check-v1-38-factory-boundaries.ts # graph, denylist, production-reachability checks
```

The fourth channel should be a non-executable `strategy-lab/intake` module or private script, not a web UI: it validates a frozen packet and forwards explicit source through the same admission interface. [VERIFIED: `264-CONTEXT.md` D-21 through D-24]

### Pattern 1: Immutable admission, not mutable updates

**What:** Build a new candidate root from complete immutable metadata and write a new lineage edge for every rebuild, correction, prompt/provider change, retry, or disposition. [VERIFIED: `264-CONTEXT.md` D-07 through D-09]

**When to use:** All factory paths, including rejected or system-failed attempts. [VERIFIED: `264-CONTEXT.md` D-04]

```ts
// Source: packages/strategy-lab/src/contracts.ts (adapt the existing pattern)
const candidateRoot = labRoot("factory-candidate-v1", candidateEnvelope)
const attemptRoot = labRoot("factory-attempt-v1", {
  candidateRoot, taskRoot, budgetRoot, authoringMechanism, disposition,
})
// publish once; never replace candidateEnvelope or address it as "latest"
```

### Pattern 2: Common admission boundary, isolated strategic cores

**What:** Oracles depend inward only on literal legality/geometry/schema/identity/supervision/reporting allowlisted helpers; the factory depends on their emitted data contracts, never their strategic selectors. [VERIFIED: `264-CONTEXT.md` D-18]

**When to use:** Package configuration and static dependency tests before implementing oracle strategies. [VERIFIED: `264-CONTEXT.md` D-14 through D-19]

### Pattern 3: Frozen model bundle, no runtime call

**What:** A model request is an externally controlled input; capture exact provider/model/version/settings/prompt/context/token/attempt identities and raw response as private immutable bytes. A missing exact identity is a terminal block/new attempt, not substitution. [VERIFIED: `264-CONTEXT.md` D-17, D-20] [CITED: https://slsa.dev/spec/v1.0/provenance]

### Pattern 4: Six-dimensional clone evidence with fail-closed ambiguity

**What:** Compute and root source-structure, lineage, dependency, legal-input-decision, Chronicle-behavior, and matchup-response fingerprints. Threshold calibration runs against only a development corpus; `unresolved` never counts as diverse/independent. [VERIFIED: `264-CONTEXT.md` D-11 through D-13]

### Anti-Patterns to Avoid

- **`latest` aliases or upserts:** erase the original evidence and make later selection non-reproducible. [VERIFIED: `264-CONTEXT.md` D-02, D-08]
- **A shared strategic helper hidden behind a package facade:** invalidates material independence even when processes/packages differ. [VERIFIED: `264-CONTEXT.md` D-18, D-19]
- **Translating or normalizing source across native lanes:** manufactures apparent diversity and breaks exact-lane certification. [VERIFIED: `264-CONTEXT.md` D-10]
- **Recording only successful submissions:** censors budget consumption and invalidates independence/attack evidence. [VERIFIED: `264-CONTEXT.md` D-04, D-24]
- **Treating a model bundle as deterministic source:** only validated explicit emitted source may cross the supervised boundary. [VERIFIED: `264-CONTEXT.md` D-03, D-17]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| Canonical content identity | Ad-hoc JSON stringify/hash | `admitCanonicalJsonValue` plus `labRoot` | Existing code bounds hostile objects and domain-separates roots. [VERIFIED: `packages/strategy-lab/src/contracts.ts`] |
| Match transition/legality | Factory-local resolver or simulator | `MATCH_KERNEL` through `runCanonicalLabMatch` | One authoritative engine and established identity checks. [VERIFIED: `packages/strategy-lab/src/runtime-bridge.ts`] |
| Hostile source execution | `eval`, dynamic import, `vm`, or direct worker execution | Existing supervised provider/runtime bridge | AGENTS prohibits direct execution and rejects Node `vm` as a security boundary. [VERIFIED: `AGENTS.md`] |
| Failure taxonomy | Boolean pass/fail | Existing success/player-violation/system-failure model | System faults must not become gameplay evidence. [VERIFIED: `packages/strategy-lab/src/contracts.ts`, `runtime-bridge.ts`] |
| Production store/UI | New DB tables/routes/forms | Private artifact packets and command/script intake | D-05 excludes production reachability and a UI is unnecessary. [VERIFIED: `264-CONTEXT.md` D-05, D-21] |

**Key insight:** this phase is an evidence and boundary problem; reuse the trusted canonical/supervised primitives and keep all strategic novelty behind separately auditable private leaves. [VERIFIED: `264-CONTEXT.md`]

## Common Pitfalls

### Pitfall 1: Confusing package separation with independence
**What goes wrong:** Three packages share selector logic, prompts, learned parameters, or a search tree but are declared independent. [VERIFIED: `264-CONTEXT.md` D-18, D-19]

**How to avoid:** Freeze an allowlist and emit dependency, authorship, source, behavior, counterfactual-correlation, clone, and failure-mode receipts; fail `unresolved` closed. [VERIFIED: `264-CONTEXT.md` D-13, D-19]

### Pitfall 2: Mutable provenance or erased negative work
**What goes wrong:** a correction overwrites a candidate/attempt, or a rejected/failed retry disappears from totals. [VERIFIED: `264-CONTEXT.md` D-02, D-04, D-08, D-09]

**How to avoid:** define append-only terminal records and verify every allocation/budget reference has exactly one terminal attempt disposition. [VERIFIED: `264-CONTEXT.md` D-09]

### Pitfall 3: Teacher or model information leaks into deployed source
**What goes wrong:** privileged counterfactual state or a live provider affects Match-time choices. [VERIFIED: `264-CONTEXT.md` D-16, D-17]

**How to avoid:** retain only explicit deterministic source, run existing legal-information regressions, and make bundle-to-source conversion a separate immutable admission step. [VERIFIED: `packages/strategy-lab/src/planner/information-boundary.test.ts`, `264-CONTEXT.md`]

### Pitfall 4: Treating clone thresholds as discovered truth
**What goes wrong:** calibrating on league or holdout outcomes or allowing a borderline candidate to count. [VERIFIED: `264-CONTEXT.md` D-12, D-13]

**How to avoid:** use the required development-only labeled corpus, freeze thresholds/versions before Phase 265, and quarantine ambiguity. [VERIFIED: `264-CONTEXT.md` D-12, D-13]

## Code Examples

### Supervised source path

```ts
// Source: packages/strategy-lab/src/runtime-bridge.ts
const execution = await runCanonicalLabMatch({ match, providers })
// completed: runtime results retain success/player-violation distinctions.
// failure: private system_failure remains non-gameplay evidence.
```

### Bounded immutable packet validation

```ts
// Source: packages/strategy-lab/src/contracts.ts (same schema pattern)
const packet = FactoryIntakePacketSchema.parse(untrustedPacket)
const packetRoot = labRoot("factory-intake-packet-v1", packet)
// No source execution occurs during parsing/rooting.
```

## State of the Art

| Old Approach | Current Approach | Impact |
|---|---|---|
| Fixed shared strategy library/matrix | Immutable candidates plus independent response mechanisms and clone/correlation evidence | A later league can make only oracle-relative empirical claims, not infer diversity from labels. [VERIFIED: `.planning/research/competitive-strategy-factory-and-adversarial-league.md`, `264-CONTEXT.md`] |
| Model invocation during strategy development without an auditable artifact | Frozen provider-neutral bundle followed by validated explicit source | Provider drift and hidden live dependencies fail closed. [VERIFIED: `264-CONTEXT.md` D-17, D-20] |

**Deprecated/outdated:** Starter/Advanced strategies remain fixtures and regression smoke tests, not evidence of strategic independence or balance authority. [VERIFIED: `.planning/research/competitive-strategy-factory-and-adversarial-league.md`]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|---|---|---|
| A1 | No new external package is needed for the factory contracts, repository layout, or test spikes. [ASSUMED] | Standard Stack | A later implementation may need an approved dependency or a simpler local artifact layout. |
| A2 | New private oracle package names can use the proposed `strategy-oracle-*` convention. [ASSUMED] | Architecture Patterns | Naming may need adjustment to current workspace conventions, without changing the separation requirement. |

## Open Questions

1. **Which external model/provider and which human/external submitter will actually participate?**
   - What we know: no provider/model identity or human/external participant/protocol evidence is present in the supplied Phase 264 context; exact identity must be pinned and drift must fail closed. [VERIFIED: `264-CONTEXT.md` D-17, D-20 through D-24]
   - Recommendation: implement provider-neutral bundle and intake schemas, validators, refusal/disposition paths, and static boundaries now; create no provider call, human review, external submission, or acceptance claim until an operator supplies the frozen participant/provider protocol. [VERIFIED: `264-CONTEXT.md`]

2. **What clone/correlation and independence cutoffs should be frozen?**
   - What we know: the dimensions and development-only corpus categories are locked, but numeric cutoffs are explicitly discretionary after the calibration spike. [VERIFIED: `264-CONTEXT.md` D-11 through D-13]
   - Recommendation: implement labeled corpus harness and threshold-free report first; one bounded calibration fixture may propose versioned thresholds, which remain `unresolved` until frozen before Phase 265. [VERIFIED: `264-CONTEXT.md`]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|---|---|---:|---|---|
| Node.js | TypeScript factory/tools | ✓ | `v24.15.0` | — [VERIFIED: local command] |
| pnpm | Workspace tests/typecheck | ✓ | `11.1.2` | — [VERIFIED: local command] |
| Docker | Existing supervised runtime path only | ✓ | `29.4.0` | Existing selected runtime image/bridge. [VERIFIED: local command, `contracts.ts`] |
| Python | Existing runtime lane; not a new factory dependency | ✓ | `3.9.6` | Do not add lane/fallback. [VERIFIED: local command, `264-CONTEXT.md`] |
| External model/provider | ORCL-04 actual bundle acquisition | ✗ / unspecified | — | Implement frozen-bundle schema and terminal blocked attempt only. [VERIFIED: `264-CONTEXT.md` D-17, D-20] |
| Human/external reviewer/submission channel | ORCL-05 actual intake | ✗ / unspecified | — | Implement protocol/validator and immutable rejection/blocked receipts only. [VERIFIED: `264-CONTEXT.md` D-21 through D-24] |

**Missing dependencies with no fallback:** an actual model provider identity and actual authorized human/external protocol are required before an ORCL-04/ORCL-05 evidence claim, but do not block factory infrastructure. [VERIFIED: `264-CONTEXT.md`]

## Validation Architecture

### Test Framework

| Property | Value |
|---|---|
| Framework | Vitest `4.1.6` [VERIFIED: `package.json`] |
| Config file | package-level scripts; no separate config required by current `@cowards/strategy-lab`. [VERIFIED: `packages/strategy-lab/package.json`] |
| Quick run command | `pnpm --filter @cowards/strategy-lab test -- --runInBand` is not supported by Vitest; use `pnpm --filter @cowards/strategy-lab test -- src/factory/*.test.ts` after files exist. [VERIFIED: `packages/strategy-lab/package.json`] |
| Full suite command | `pnpm turbo test --concurrency=1` [VERIFIED: `package.json`, project memory guidance] |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---|---|---|---|---|
| FACT-05/06 | Root stability, immutable lineage, complete charged terminal ledger | unit/property | `pnpm --filter @cowards/strategy-lab test -- src/factory/ledger.test.ts` | ❌ Wave 0 |
| FACT-07 | Direct execution/import/fallback denial and three-way runtime disposition | unit/integration | `pnpm --filter @cowards/strategy-lab test -- src/factory/admission.test.ts` | ❌ Wave 0 |
| FACT-08 | Six dimensions, labeled calibration corpus, `unresolved` exclusion | unit/property | `pnpm --filter @cowards/strategy-lab test -- src/factory/fingerprint.test.ts` | ❌ Wave 0 |
| ORCL-01/02/03 | Strategic-core physical isolation and legal-input-only student | static/unit | `pnpm exec tsx scripts/check-v1-38-factory-boundaries.ts` | ❌ Wave 0 |
| ORCL-04 | Exact frozen bundle, drift/missing identity terminal block, no runner call | unit | `pnpm --filter @cowards/strategy-lab test -- src/factory/model-bundle.test.ts` | ❌ Wave 0 |
| ORCL-05 | Disclosure/provenance/budget policy and failed/rejected retention | unit | `pnpm --filter @cowards/strategy-lab test -- src/factory/intake.test.ts` | ❌ Wave 0 |
| ORCL-06/07 | Helper denylist plus multi-axis independence receipt | static/unit | `pnpm exec tsx scripts/check-v1-38-factory-boundaries.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** targeted package tests plus factory boundary monitor. [VERIFIED: existing package test pattern]
- **Per wave merge:** `pnpm turbo test --concurrency=1` and `pnpm turbo typecheck`. [VERIFIED: `package.json`, project memory guidance]
- **Phase gate:** all phase requirement tests and the boundary monitor green; no Match/league score claim required or authorized. [VERIFIED: `264-CONTEXT.md`]

### Wave 0 Gaps

- [ ] `packages/strategy-lab/src/factory/{contracts,identity,ledger,admission,fingerprint}.ts` and focused tests.
- [ ] Three private oracle package manifests/entry points with no shared strategic-core imports.
- [ ] `scripts/check-v1-38-factory-boundaries.ts` for production reachability, helper allowlist, oracle cross-import, and prohibited execution paths.
- [ ] Provider-neutral frozen-bundle and quarantined-intake test fixtures with no real provider, reviewer, or guest execution.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---|---|---|
| V2 Authentication | no | No web/API intake surface is in scope. [VERIFIED: `264-CONTEXT.md` D-05] |
| V3 Session Management | no | No session or public UI is in scope. [VERIFIED: `264-CONTEXT.md` D-05] |
| V4 Access Control | yes | Frozen private disclosure class and explicit reviewer conflict declarations; do not expose holdout/private candidate inputs. [VERIFIED: `264-CONTEXT.md` D-21 through D-23] |
| V5 Input Validation | yes | Canonical bounded schemas at every packet/bundle/artifact/runtime boundary. [VERIFIED: `packages/strategy-lab/src/contracts.ts`, `AGENTS.md`] |
| V6 Cryptography | yes | Reuse SHA-256 canonical identity primitives; no bespoke cryptographic protocol. [VERIFIED: `packages/strategy-lab/src/contracts.ts`] |
| V14 Configuration | yes | Pin exact provider/model/settings/prompt/context identities and fail closed on drift. [VERIFIED: `264-CONTEXT.md` D-17, D-20] |

### Known Threat Patterns for the factory stack

| Pattern | STRIDE | Standard Mitigation |
|---|---|---|
| Hostile source executes in coordinator/worker/web/API/Go | Elevation of privilege | Schema-only admission; existing supervised provider bridge; static denylist. [VERIFIED: `264-CONTEXT.md`, `AGENTS.md`] |
| Mutable/omitted failed evidence | Tampering/repudiation | Content-addressed immutable candidate and append-only charged attempt roots. [VERIFIED: `264-CONTEXT.md` D-02, D-04, D-09] |
| Private source/memory/holdout exposure to reviewer or DTO | Information disclosure | Frozen disclosure classes and privacy scans; no product/public projection. [VERIFIED: `264-CONTEXT.md` D-05, D-23] |
| Provider drift or hidden substitution | Tampering | Exact identity bundle and terminal block/new versioned attempt. [VERIFIED: `264-CONTEXT.md` D-20] |
| Correlated oracle disguised as independence | Spoofing | Helper denylist plus dependency/authorship/source/behavior/correlation/failure evidence. [VERIFIED: `264-CONTEXT.md` D-18, D-19] |

## Sources

### Primary (HIGH confidence)
- `264-CONTEXT.md` — locked factory, oracle, quarantine, and scope decisions.
- `packages/strategy-lab/src/contracts.ts`, `identity.ts`, `runtime-bridge.ts` — existing canonical identity, bounded schema, task, and supervised execution seams.
- `packages/strategy-lab/package.json`, root `package.json`, `AGENTS.md` — current package/tooling and project constraints.
- `263-TIMING-CALIBRATION.md` — passed prospective Phase 263 prerequisite and preserved budget envelope.

### Secondary (MEDIUM confidence)
- [Lanctot et al., PSRO](https://arxiv.org/abs/1711.00832) — joint-policy correlation and approximate best responses to mixtures; not proof of optimality.
- [SLSA provenance specification](https://slsa.dev/spec/v1.0/provenance) — provenance input/dependency/builder/output schema discipline; v1.0 page is retired, so it is used only as a conceptual checklist.
- [NIST SSDF](https://csrc.nist.gov/projects/ssdf) — provenance/integrity treatment for first- and third-party components; not a required compliance regime for this private experiment.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all recommended components already exist in the repository; no new package is proposed.
- Architecture: HIGH — locked context and existing lab seams agree on private/supervised boundaries.
- Pitfalls: HIGH for local boundary violations; MEDIUM for calibrated independence/clone cutoffs because they must be empirically set by the prescribed development spike.

**Research date:** 2026-09-13
**Valid until:** 2026-10-13, except Phase 264 cutoff/protocol decisions must be rechecked immediately before execution.
