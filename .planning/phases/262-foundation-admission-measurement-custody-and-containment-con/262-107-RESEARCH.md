# Phase 262 Plan 107: Live Controller Custody Recovery - Research

**Researched:** 2026-08-28
**Domain:** Immutable executable-source custody, sealed-envelope continuity, and pre-effect recovery
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Evidence is immutable and content-addressed. There is no mutable `latest`; a changed input, policy, implementation, or result creates a new branch with a new root.
- **D-02:** Missing, stale, incompatible, contaminated, incomplete, mismatched, or non-reproducible evidence fails closed. Process/integrity failure is distinct from a process-valid empirical failure and blocks authoritative progress.
- **D-03:** The exact selected canonical `MATCH_KERNEL` remains the only transition authority, and hostile Strategy source remains behind the supervised runtime-service / Runtime Broker boundary. No copied rules, alternate scheduler, or Strategy execution in the coordinator, web, API, or Go is permitted.
- **D-04:** Lab evidence remains private and unreachable from production registration, persistence, scheduling, Chronicle, replay, standings, and public/default surfaces. Only exact eligible pre-formation current-league source hashes may later enter ordinary certification.
- **D-05:** Every attempt, retry, rejection, invalid output, duplicate, failure, system failure, and unused allocation remains charged and visible in its proper evidence ledger; accepted evidence cannot omit inconvenient work.
- **D-06:** Cycle-cap, MOVE/reversal, Backstab geometry/timing, scan timing, arena, runtime, product/public, and combined-rule changes remain unavailable in v1.38.
- **D-16:** Zero accepted runtime violations, system failures, legal-information violations, private-data leaks, missing cells, duplicate/conflicting results, or unproved identity joins is a hard evidence condition. System-failed work remains charged but can never be converted into gameplay or an accepted cell.
- **D-18:** Reports maintain separate fields for `process_status`, current-rules outcome, formation rejection/pass, and holdout contamination. A valid empirical failure is publishable evidence; threshold softening, selective failure omission, or stronger-than-oracle-relative claims are not.
- **D-23R:** The operator authorizes an additive successor retry route and supersedes the prior no-retry admission rule for future Phase 262 work. This is standing authority for the precommitted bounded retry envelope selected by research and planning; it does not require a new operator literal for each route ordinal or attempt inside that envelope.
- **D-24R:** Every prior authorization, route, calibration identity, consumption marker, terminal result, and charged allocation remains immutable, non-retryable, and non-reusable. The successor contract must use fresh versioned destinations and attempt identities, preserve cumulative accounting, and bind the exact source and policy lineage before any execution.
- **D-25R:** The retry envelope must be finite and frozen before its first live attempt. It must terminate on the first literal 540/540 accepted reproduction, any integrity or contamination failure, or exhaustion of its declared attempt/resource/time bounds. It may not soften the 200 ms sampling rule, inclusive 2,500-basis-point gate, eight-attempt/four-shard calibration allocation, conditional 540-cell reproduction, canonical runtime/kernel predicates, or any gameplay, privacy, and formation-absence bound after observing results.
- **D-26R:** The assurance class remains `single_operator_local_seal_v1`; the retry revision makes no independent-custody claim. No candidate search, Phase 263 work, formation materialization, holdout opening, public/canonical publication, activation, production, or counted-play authority exists until an independently checked successor joins a valid seal with a fresh literal 540/540 result.
- **D-27R:** The completed Plan 262-74 obstruction and all earlier route branches remain truthful archived history. The successor must be planned and reviewed additively and must not revive Plan 262-62, its obsolete review paths, or any consumed no-retry authorization bytes.
- **D-28R:** After the first finite successor envelope exhausted at fresh `0/540`, the operator authorizes exactly one additional additive bounded retry envelope under the existing frozen bounds. This is a new envelope, not an extension, retry, reinterpretation, or reuse of `retry-envelope:v1` or any prior authorization, route, observation, calibration, reproduction, receipt, journal, terminal, seal, correction, or charged identity.
- **D-29R:** The new envelope inherits unchanged: at most three route starts, at most twelve preflight observations, exactly eight calibration attempts across four shards per started route, at most one conditional exact 540-cell reproduction, a four-hour lifetime from its first preflight observation, at least five minutes after a preflight refusal, at least fifteen minutes after a process-valid calibration failure, 200 ms sampling, and the inclusive 2,500-basis-point headroom gate.
- **D-30R:** Planning derives the next versioned envelope, journal, terminal, private-receipt, reproduction, source-seal, disposition, correction, lifecycle, and activation destinations from the current clean committed lineage at source commit `9e7087b34f0bd6fa12d8b265f09d4c656eb044b0`. All v1 evidence remains byte-immutable and fully charged.
- **D-31R:** The authorization expires at the first literal 540/540 accepted result, the first terminal integrity/contamination/reproduction failure, exhaustion of three route starts or twelve observations, or the four-hour deadline. It grants no third envelope and no authority to weaken, reset, reclaim, or expand any frozen bound after observing results.
- **D-32R:** `single_operator_local_seal_v1` remains the exact assurance class. No candidate, Phase 263, formation, holdout-opening, public, product, production, counted-play, gameplay-change, archive, or tag authority exists unless a fresh independently verified 540/540 result produces a new pass-only activation root.

### the agent's Discretion

- Exact schema, module, command, storage, and typed-reason names are left to research and planning within the locked evidence and privacy boundaries.
- The exact finite retry count, scheduling window, preflight cadence, and safe autonomous backoff are left to research and planning, provided they are frozen before execution and cannot be expanded after results are observed.
- Exact budget values, materiality thresholds, classifier cutoffs, commitment primitive, encrypted-storage mechanism, and retention sampling are chosen only after the required contained Phase 262 spikes, then frozen before candidate output is inspected.
- A managed signing identity may be used if one already exists; Phase 262 must not create an ad hoc signing trust system to simulate custody.

### Deferred Ideas (OUT OF SCOPE)

- Planner and deterministic runner implementation belongs to Phase 263.
- Candidate factory, independent oracles, and quarantined intake belong to Phase 264.
- League execution and current-league freeze belong to Phases 265–266.
- Executable formation materialization, equal retraining, sealed opening, decision, certification, and release closure belong to Phases 267–270.
- Cap, MOVE, Backstab, scan-timing, arena, runtime, product, and combined-rule experiments require separately approved later work.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMIT-03 | Reproduce the persisted current-rules matrix before candidate search. | The same sealed v3 envelope may reach its first effect only through independently reviewed successor executable custody. [VERIFIED: REQUIREMENTS.md; Plan-93 stop] |
| ADMIT-04 | Missing or drifting authority stops rather than being normalized. | The Plan-93 stop remains immutable protected history; the correction is additive and fail-closed. [VERIFIED: Plan-93 stop; CONTEXT.md D-01/D-02] |
| MEAS-02 | Keep the frozen retry/resource budget. | The supplement binds the same envelope root, policy, identities, and zero counters. [VERIFIED: envelope-v3] |
| MEAS-04 | Accept no system/integrity/privacy failure as gameplay evidence. | The new owner preserves the producer/adjudicator split and cannot publish reproduction or activation. [VERIFIED: Plans 93/94 contracts] |
| MEAS-09 | Separate integrity stop, empirical outcome, and later formation outcome. | Plan 93 stays `pre_start_integrity_stop`; Plan 110 will own only a future live terminal. [PRESCRIPTIVE] |
| MEAS-10 | Preserve containment and non-authorization. | Supplement and live owner carry exhaustive false downstream authority. [PRESCRIPTIVE] |
| SEAL-01 | Preserve the reduced `single_operator_local_seal_v1` assurance boundary. | No independent-custody or stronger host-resistance claim is introduced. [VERIFIED: seal-v13; Plan-93 stop] |
</phase_requirements>

## Summary

The same-envelope recovery is feasible and is safer than creating another envelope. Plan 93 invoked one command chain, but the v7 pair checker completed before the production controller failed at its pre-effect reviewed-closure gate. No envelope identity was reserved: route starts, preflight observations, calibration identities, reproduction identities, accepted cells, journal, private receipts, and terminal all remain zero or absent. Seal-v13 and envelope-v3 are still byte-identical to pair commit `8080ff66`, and the envelope remains `sealed_inactive`. [VERIFIED: `262-93-PRESTART-INTEGRITY-STOP.md`; Git object hashes; canonical artifacts]

The root cause is an executable-custody split. `scripts/run-v1-38-bounded-retry-envelope-v3.ts` hardcodes Plan-101 v5 as `sourceReview`, requires that artifact to be `zero_findings`, and calls that validator before live effects. Plan 101 is immutably and correctly blocked with one self-reference finding. Plan 103's zero-finding payload/carrier instead reviews the additive v6 non-recursive review consumer, and Plan 105 reviews the v7 pair publisher/checker; neither changes the live controller's Plan-101 gate. [VERIFIED: live controller lines 80-91, 239-535, 1938-1971, 2100-2250; Plan-101/103/105 artifacts]

**Primary recommendation:** use `262-107 additive versioned live adapter -> 262-108 independent exact-source review -> 262-109 one executable-custody supplement -> 262-110 new explicit live owner -> revised 262-94 -> revised 262-95 -> 262-106`. Never edit or republish seal-v13 or envelope-v3, never count the Plan-93 invocation as a route/observation/charge, and never create a third envelope. [PRESCRIPTIVE]

## Feasibility Decision

**Decision: FEASIBLE, with a narrow supplement.** D-31R expires this envelope on a literal pass, a *terminal* integrity/contamination/reproduction failure, bound exhaustion, or the four-hour deadline. Plan 93 created no terminal and crossed no live effect boundary; the repository's authoritative stop record explicitly calls the envelope unconsumed and requires additive correction plus a new explicit execution decision. Therefore the invocation is preserved as one pre-start command attempt but is not converted into an envelope route or capacity event. [VERIFIED: CONTEXT.md D-31R; Plan-93 stop; ROADMAP current verdict]

The supplement must not claim that seal-v13's existing `sourceRoot` or `reviewRoot` was wrong. Those roots correctly bind the Plan-102/103 pair-derivation custody used to create the inactive pair. The missing fact is a separately reviewed executable-source root for the code that will cross the live boundary. The supplement adds that fact and supersedes only the live executable-custody predicate. [VERIFIED: v7 `deriveArtifacts`; seal-v13; inference from source split]

## Project Constraints (from AGENTS.md)

- Keep engine logic pure, deterministic, serializable, and side-effect free; this recovery changes only the offline evidence controller. [VERIFIED: AGENTS.md]
- Do not execute Strategy code in web/API processes; the existing supervised runtime path and `MATCH_KERNEL` remain mandatory. [VERIFIED: AGENTS.md; controller]
- Treat Strategy/runtime boundaries as hostile and schema-validate every input. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary or add rule logic to React. [VERIFIED: AGENTS.md]
- Preserve canonical terminology and immutable Strategy Revisions. [VERIFIED: AGENTS.md]
- Do not expose Strategy source, StrategyMemory, SoldierMemory, or objectives through public replay/evidence. [VERIFIED: AGENTS.md]
- Runtime tests must cover invalid output, timeout, forbidden capabilities, limits, schema validation, and strategy-versus-system failure separation. [VERIFIED: AGENTS.md]
- Keep planning documents committed when updated. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Frozen envelope policy/counters | Database / Storage (Git artifacts) | Offline controller | The canonical pair remains the sole capacity record. [VERIFIED: envelope-v3] |
| Executable-source custody | Offline controller / evidence plane | Database / Storage | A new review and supplement authenticate actual executed bytes without rewriting the pair. [PRESCRIPTIVE] |
| Live retry effects | API / Backend (supervised runtime-service) | Offline controller | The existing producer owns reservations and effects; Strategy execution stays behind runtime-service. [VERIFIED: controller; AGENTS.md] |
| Independent admission | Offline independent checker | Database / Storage | Revised Plan 94 consumes terminal evidence but does not trust the producer verdict. [VERIFIED: Plan-94 contract] |
| Lifecycle projection | Root orchestrator | Planning ledgers | Plans 95/106 retain their two-stage ownership. [VERIFIED: Plans 95/106] |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Repository TypeScript | Existing workspace | Additive live adapter, review checker, supplement schema | Preserves the reviewed producer/model/native modules. [VERIFIED: codebase] |
| Node.js built-ins | 24.15.0 installed | Raw bytes, canonical hashing, no-follow reads | Already used by v3 custody; no package is needed. [VERIFIED: environment; codebase] |
| `/usr/bin/git` | 2.50.1 Apple Git-155 | Exact blobs, modes, ancestry, no-rewrite proof | Existing native custody pins isolated Git behavior. [VERIFIED: environment; native custody source] |
| Existing v7 pair checker | Current committed source | Authenticate B3, unchanged seal-v13/envelope-v3, Plan-103 lineage | Reuse it rather than rederive or republish the pair. [VERIFIED: v7 source]
| Existing v3 producer | Current committed source | Journal/receipt/terminal effects | Call only through a reviewed adapter using `validateInputs:false` plus an injected already-authenticated pair. [VERIFIED: exported producer API] |
| Vitest | 4.1.6 workspace | Adversarial and disposable-repository review | Existing v3 suites use it. [VERIFIED: workspace; Plan-105 review] |

**Installation:** None. [VERIFIED: recommended architecture]

## Package Legitimacy Audit

No external package is installed; the package-legitimacy gate is not applicable. [VERIFIED: recommended architecture]

## Architecture Patterns

### System Architecture Diagram

```text
Plan-93 immutable pre-start stop (one command attempt; zero envelope consumption)
        |
        v
Plan 107: additive live-v8 adapter + tests
        |
        v
Plan 108: independent exact Git/source review + disposable no-effect exercise
        |
        v
Plan 109: publish ONE executable-custody supplement
        |    binds unchanged sealRoot + envelopeRoot + status/counters/policy
        |    binds Plan-93 stop + Plan-107 source + Plan-108 zero review
        |    changes no pair byte and creates no capacity
        v
new explicit execution decision
        |
        v
Plan 110: new sole live owner
        |-- authenticate v7 committed pair unchanged
        |-- authenticate supplement and current executed closure
        |-- invoke existing producer exactly once with validated pair injected
        |-- post-check same executed closure
        v
same journal-v3 / private-v3 / terminal-v3 destinations
        |
        v
revised Plan 94 -> revised Plan 95 -> Plan 106
```

### Recommended Project Structure

```text
scripts/
├── run-v1-38-bounded-retry-envelope-v3-live-v8.ts
├── run-v1-38-bounded-retry-envelope-v3-live-v8.test.ts
├── check-v1-38-plan-262-108-live-controller-custody-v8.ts
└── check-v1-38-plan-262-108-live-controller-custody-v8.test.ts
.planning/
├── artifacts/v1.38-plan-262-108-live-controller-custody-review-payload-v8.json
├── artifacts/v1.38-plan-262-108-live-controller-custody-review-carrier-v1.json
├── artifacts/v1.38-successor-source-seal-v13-executable-custody-supplement-v1.json
└── phases/.../262-108-REVIEW.md
```

### Pattern 1: Additive Adapter, Not Historical Rewrite

The Plan-107 adapter must import `runV138V3ProductionLive`, `checkV138Plan262104CommittedInactivePair`, and the native execution-closure authenticator. It must implement the Plan-103/108/supplement gate itself, then call the producer with `validateInputs:false` and an injected v7-authenticated pair. `validateInputs:false` is safe only inside this closed adapter because the adapter replaces every skipped check and exposes no generic bypass. [PRESCRIPTIVE; APIs VERIFIED: codebase]

```typescript
// Source pattern: existing repository exports; illustrative, not implementation.
const pair = checkV138Plan262104CommittedInactivePair(repoRoot)
const custody = authenticateSuccessorExecutableCustody(repoRoot, pair)
const before = authenticateV138RetryV3ExecutionClosure(repoRoot, custody.closure)
await runV138V3ProductionLive(repoRoot, {
  validateInputs: false,
  checkPair: () => ({ seal: pair.seal, envelope: pair.envelope }),
})
const after = authenticateV138RetryV3ExecutionClosure(repoRoot, custody.closure)
if (after.executionClosureRoot !== before.executionClosureRoot) failClosed()
```

### Pattern 2: Scoped Successor Supplement

The supplement must be canonical JSON with a domain-separated root over its body excluding only `supplementRoot`. It must contain, at minimum: unchanged seal/envelope paths, raw SHA-256/blob/mode, `sealRoot`, `envelopeRoot`, pair commit B3, `sealed_inactive`, exact zero counters, frozen policy root, protected-history root, Plan-93 stop document/commit/root and zero-consumption facts, Plan-107 source commit/tree/parent/file manifest, Plan-108 payload/REVIEW/carrier roots and literal-zero verdict, current executable-closure root, `supersessionScope:"executable_source_custody_only"`, `createsEnvelope:false`, `createsCapacity:false`, `resetsCounters:false`, and exhaustive false downstream authority. [PRESCRIPTIVE]

It must explicitly state that `seal.sourceRoot`, `seal.reviewRoot`, `seal.sealRoot`, `envelope.sourceRoot`, `envelope.reviewRoot`, `envelope.sealRoot`, `envelope.envelopeRoot`, policy, identities, counters, and status remain authoritative and unchanged. [PRESCRIPTIVE]

### Pattern 3: Non-Recursive Independent Review

Reuse the Plan-103 semantic-payload plus external-carrier pattern. The payload owns a semantic root excluding its own root; the carrier owns exact payload and REVIEW byte custody without claiming its own Git blob. Plan 108 must exercise actual source-only, supplement derive, supplement publish/check, and synthetic no-effect live-adapter branches in an owner-only disposable repository before publishing literal zero. [PRESCRIPTIVE; pattern VERIFIED: Plan 103/105]

### Anti-Patterns to Avoid

- **Editing `run-v1-38-bounded-retry-envelope-v3.ts`:** violates Plan-100 no-later-rewrite custody. Use a new versioned adapter. [VERIFIED: Plan-101 carrier]
- **Changing seal-v13 or envelope-v3:** creates a new root/pair and risks an unauthorized third envelope. Keep both blobs exact. [VERIFIED: D-28R/D-31R]
- **Counting the Plan-93 CLI invocation as a route:** invents consumption with no reserved identity or journal record. Preserve it only as a pre-start command attempt. [VERIFIED: Plan-93 stop]
- **Calling `validateInputs:false` directly:** bypasses the broken gate without replacement custody. Only the closed reviewed adapter may use it after stronger successor checks. [VERIFIED: producer API]
- **Letting the supplement authorize execution by itself:** Plan 110 still requires a new explicit execution decision. [VERIFIED: Plan-93 stop]

## Minimal Corrective Topology

| Plan | Wave | Depends On | Ownership | Must Not Do |
|------|------|------------|-----------|-------------|
| 262-107 | 93 | 262-93 stop history | Additive live-v8 adapter and focused tests; no canonical artifacts. [PRESCRIPTIVE] | No live mode invocation, pair edit, charge, or downstream artifact. |
| 262-108 | 94 | 262-107 | Independent raw-byte/source review with non-recursive payload/REVIEW/carrier and actual disposable no-effect exercise. [PRESCRIPTIVE] | No canonical supplement, live evidence, or authority. |
| 262-109 | 95 | 262-108 | Publish and commit exactly one executable-custody supplement, then check it. [PRESCRIPTIVE] | No seal/envelope rewrite, new envelope, capacity, counter, journal, or terminal. |
| 262-110 | 96 | 262-109 plus explicit dispatch | Sole successor live owner of the unchanged v3 envelope and existing live destinations. [PRESCRIPTIVE] | No reproduction-v17, disposition, correction, activation, readiness, lifecycle, or downstream authority. |
| 262-94 revised | 97 | 262-110 | Independent adjudication, additionally binding supplement/107/108/109/110 and Plan-93 stopped history. [PRESCRIPTIVE] | Do not trust producer terminal or reinterpret Plan 93 as consumption. |
| 262-95 revised | 98 | 262-94 | Stage-1 readiness/validation/verification with new custody chain. [PRESCRIPTIVE] | No lifecycle mutation. |
| 262-106 | 99 | 262-95 | Existing Stage-2 lifecycle owner, with new custody inputs threaded through readiness. [PRESCRIPTIVE] | No broadened Phase-263 or product authority. |

Plan 93 remains immutable incomplete pre-start-stop history; it is not made complete, summarized, retried, or used as the dependency that authorizes Plan 110. Plans 94 and 95 are unexecuted and should be revised in place to consume the new chain; Plan 106 keeps its ownership but moves after revised Plan 95. [PRESCRIPTIVE; current state VERIFIED: filesystem]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pair authentication | A new seal/envelope validator | v7 committed-pair checker | It already proves B3 topology, canonical bytes, roots, no rewrite, and zero counters. [VERIFIED: v7 source] |
| Live effects | A copied controller | Existing exported producer behind the closed adapter | Avoids diverging reservations, backoffs, receipts, and terminal behavior. [VERIFIED: producer exports] |
| Git/runtime custody | Shell parsing or decoded blobs | Existing native custody/authenticator | Preserves raw bytes, modes, isolated Git, installed closure, and native roots. [VERIFIED: native custody source] |
| Review self-custody | Whole-file fixed point | Plan-103 payload/carrier pattern | Avoids the exact Plan-101 failure. [VERIFIED: Plan-101/103] |
| Canonical encoding | Ad hoc JSON stringify | Existing canonical JSON encoder | Root stability depends on one encoding. [VERIFIED: codebase] |

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | Seal-v13 and envelope-v3 exist as exact committed Git blobs; journal/private/terminal/reproduction-v17 are absent. [VERIFIED: Git; filesystem] | Preserve pair bytes; add one supplement only after review. No data migration. |
| Live service config | No runtime-service/provider effect began; live effect boundary was not crossed. [VERIFIED: Plan-93 stop] | None. The new live owner performs ordinary preflight later. |
| OS-registered state | No v3 lock, intent, journal, receipt directory, or terminal remains from Plan 93. [VERIFIED: filesystem audit] | None. Runtime locks remain ephemeral and existing native helpers own them. |
| Secrets/env vars | Plan 93 did not access the local secret, and the supplement contains roots/identities only. [VERIFIED: Plan-93 stop and controller failure location] | Do not rename or read any secret/env input during correction/review/publication. |
| Build artifacts / installed packages | Existing Node/pnpm/Git/native compiler closure is present; no new package is required. [VERIFIED: environment] | Review must bind the actual installed closure; no reinstall or capacity migration. |

## Common Pitfalls

### Pitfall 1: Treating Plan 103 as a Review of the Live Controller

**What goes wrong:** the planner points the old live gate at the Plan-103 payload even though its `correctedSource.files` are the v6 review contract/consumer/test, not the live producer. [VERIFIED: Plan-103 payload]

**How to avoid:** review the actual additive live-v8 adapter and every executed dependency as a new closure in Plan 108. [PRESCRIPTIVE]

### Pitfall 2: Accidental Third Envelope

**What goes wrong:** a replacement seal/envelope or reset status creates new authorization semantics after the one additional envelope. [VERIFIED: D-28R/D-31R]

**How to avoid:** supplement assertions must prove exact pair blob equality and `createsEnvelope:false`, `createsCapacity:false`, `resetsCounters:false`. [PRESCRIPTIVE]

### Pitfall 3: Incomplete Replacement for `validateInputs:false`

**What goes wrong:** the producer skips source/custody reads and runs from ambient unchecked code. [VERIFIED: producer implementation]

**How to avoid:** Plan-107 adapter must authenticate pair, supplement, review trio, raw executed files, installed closure, protected history, destination absence, and before/after root equality before invoking the producer. [PRESCRIPTIVE]

### Pitfall 4: Reusing Plan 93 as the Live Owner

**What goes wrong:** the historical failed command is presented as retried or completed, contradicting its stop record. [VERIFIED: Plan-93 stop]

**How to avoid:** Plan 110 is a new explicit live owner; Plan 93 is an immutable non-authorizing predecessor. [PRESCRIPTIVE]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.6 [VERIFIED: workspace] |
| Config file | Workspace package configuration [VERIFIED: repository] |
| Quick run | `pnpm exec vitest run scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --bail=1` [PRESCRIPTIVE] |
| Full focused run | Run live-v8, Plan-108 reviewer, v7 pair, Plan-103, and existing v3 producer suites serially. [PRESCRIPTIVE] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIT-03/04 | Broken Plan-101 gate cannot reach effects; reviewed supplement chain can only in synthetic/disposable mode | integration | live-v8 focused suite | No - Wave 0 |
| MEAS-02/04 | Same envelope roots/counters; no reset; producer failure classes preserved | adversarial | live-v8 + reviewer suites | No - Wave 0 |
| MEAS-09/10 | Pre-start stop distinct from route/terminal and all authority false | unit/integration | reviewer suite | No - Wave 0 |
| SEAL-01 | Assurance class unchanged and stronger claims false | unit | supplement schema tests | No - Wave 0 |

### Sampling Rate

- **Per task commit:** relevant focused suite. [PRESCRIPTIVE]
- **Per wave merge:** combined five-suite serial run plus `pnpm exec tsc --noEmit --pretty false`. [PRESCRIPTIVE]
- **Phase gate:** all focused tests, canonical checkers, `git diff --check`, and forbidden-destination absence pass before Plan 110 dispatch. [PRESCRIPTIVE]

### Wave 0 Gaps

- [ ] `scripts/run-v1-38-bounded-retry-envelope-v3-live-v8.test.ts` - adapter, no generic bypass, exact pair/supplement closure, before/after root.
- [ ] `scripts/check-v1-38-plan-262-108-live-controller-custody-v8.test.ts` - raw custody, non-recursive roots, disposable modes, mutation matrix.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | No user authentication is introduced. [VERIFIED: scope] |
| V3 Session Management | no | No session state is introduced. [VERIFIED: scope] |
| V4 Access Control | yes | Existing repository-operator, owner-only private paths, and native retained-root locks. [VERIFIED: existing controller] |
| V5 Input Validation | yes | Exact schemas, canonical rerenders, raw Git blob/mode/ancestry, no-follow paths, exhaustive keys. [PRESCRIPTIVE; patterns VERIFIED] |
| V6 Cryptography | yes | Existing SHA-256 domain-separated roots and native custody; never invent a new primitive. [VERIFIED: codebase] |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale blocked review accepted as current | Spoofing | Exact Plan-108 carrier plus supplement binding; Plan-101 remains blocked history. [PRESCRIPTIVE] |
| Pair rewrite disguised as correction | Tampering | Exact B3 blob/mode/root/no-later-rewrite checks before every effect. [PRESCRIPTIVE] |
| Invocation converted to capacity | Repudiation / Elevation | Preserve one command attempt separately; capacity derives only from journal reservations. [PRESCRIPTIVE] |
| Generic validation bypass | Elevation | Closed adapter only; no exported unguarded live CLI. [PRESCRIPTIVE] |
| Private receipt leakage | Information Disclosure | Existing owner-only receipt store and safe root/count projections only. [VERIFIED: producer contract] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | None. All feasibility facts derive from current committed code/artifacts; proposed names and plan boundaries are prescriptions, not assumed facts. | — | — |

## Open Questions

None blocking. Exact type/schema names remain at the agent's discretion, but the scope and root relationships above are mandatory. [PRESCRIPTIVE]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TypeScript CLIs | yes | 24.15.0 | none [VERIFIED: environment] |
| pnpm | tests/typecheck | yes | 11.1.2 | none [VERIFIED: environment] |
| `/usr/bin/git` | raw custody | yes | 2.50.1 Apple Git-155 | none [VERIFIED: environment] |
| `/usr/bin/cc` | existing native helper | yes | Apple clang 21.0.0 | none [VERIFIED: environment] |

**Missing dependencies:** none. [VERIFIED: environment]

## Sources

### Primary (HIGH confidence)

- `scripts/run-v1-38-bounded-retry-envelope-v3.ts` - hardcoded Plan-101 gate, producer injection surface, pre-effect ordering, live destinations. [VERIFIED: codebase]
- `scripts/run-v1-38-bounded-retry-envelope-v3-review-v7.ts` - committed pair authentication and seal/envelope derivation. [VERIFIED: codebase]
- `.planning/artifacts/v1.38-plan-262-103-bounded-retry-source-rereview-{payload-v6,carrier-v1}.json` - exact scope of Plan-103 reviewed source. [VERIFIED: codebase]
- `.planning/artifacts/v1.38-plan-262-105-pair-publication-source-review-v1.json` and `262-105-REVIEW.md` - exact scope of Plan-105 four-mode review. [VERIFIED: codebase]
- `.planning/artifacts/v1.38-successor-source-seal-v13.json` and `.planning/artifacts/v1.38-plan-262-90-retry-envelope-v3.json` - unchanged roots, policy, zero counters, sealed-inactive state. [VERIFIED: canonical artifacts and Git]
- `262-93-PRESTART-INTEGRITY-STOP.md` - one invocation, stop code, no effect boundary, zero consumption, absent destinations. [VERIFIED: committed stop record]
- `262-CONTEXT.md` - D-01/D-02 and D-23R through D-32R authority boundaries. [VERIFIED: locked context]

### Secondary / Tertiary

None. This is codebase-only research; no external or training-data claim is used. [VERIFIED: research method]

## Metadata

**Confidence breakdown:**
- Feasibility: HIGH - exact stop ordering, zero state, and pair equality are committed and directly inspected. [VERIFIED]
- Architecture: HIGH - required APIs and established non-recursive/pair-check patterns already exist. [VERIFIED]
- Pitfalls: HIGH - each is the observed failure or a direct locked-authority violation. [VERIFIED]

**Research date:** 2026-08-28
**Valid until:** Until any listed source, seal, envelope, Plan-103/105 evidence, or Plan-93 stop byte changes; such change must fail closed rather than refresh this recommendation. [PRESCRIPTIVE]
