---
phase: 265
slug: serious-current-rules-league-and-development-red-team
status: source-audited
# Blocking OPEN threats only: severity >= workflow.security_block_on (high).
threats_open: 1
asvs_level: 1
block_on: high
register_authored_at_plan_time: true
audited_source: 9394176caed71cfef4f9ceb4a3a81456baf356c7
created: 2026-09-15
---

# Phase 265 — Security

Source-only mitigation audit against frozen source `9394176c`. This verifies the
22 declared threat-register entries, not empirical league completion. No Phase 265
allocation, real run result, provider/model/human/external activity, or retained
empirical result exists; those later run-dependent checks remain pending and are
not represented as closed here.

## Trust Boundaries

| Boundary | Description | Data crossing |
|---|---|---|
| Factory evidence to league admission | Candidate, supervision, and assessment artifacts are untrusted until canonical/root joins pass. | Private source/evidence roots |
| Terminal evidence to snapshot | Worker/runtime terminal records must be complete, unique, and cell-bound before solver reduction. | Private terminal/projection roots |
| Persisted candidate to runtime | Reopened bytes must be re-admitted by the host; callers never possess a provider capability. | Private source bytes and nonserializable provider |
| Snapshot to solver/PSRO | Partial or modified payoff transport and response evidence must not select a distribution or close a round. | Rooted payoff, solver, and response records |
| Private evidence to report | Private source/memory/objective and unqualified claims must not enter a report or public/deployment path. | Root-qualified private aggregates only |
| Allocation to dispatch | Every prospective channel, resource, provenance, and retry bound must be rooted before a run. | Immutable private allocation |

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status / implementation evidence |
|---|---|---|---|---|---|---|
| T-265-01 | Tampering | league contracts and roots | high | mitigate | Exact-key canonical schemas and rederived domain roots | **closed** — canonical/rooted parser rejects non-exact or rerooted objects in `packages/strategy-lab/src/league/contracts.ts:23-40`; domain-specific root derivations are registered in `packages/strategy-lab/src/league/identity.ts:23-63`. |
| T-265-02 | Repudiation | charged ledger input | high | mitigate | Mandatory start/terminal/allocation roots; omitted capacity represented | **closed** — terminal schema binds cell/projection and process validity in `packages/strategy-lab/src/league/contracts.ts:146-152`; repository persists a validated start before a terminal in `packages/strategy-lab/src/league/repository.ts:103-115`; PSRO derives charge and terminal roots from the receipt in `packages/strategy-lab/src/league/psro.ts:80-95`. |
| T-265-03 | Elevation | candidate provenance | high | mitigate | Authenticated Phase 264 candidate/supervision evidence, not a boolean/source claim | **closed** — import admission checks Phase 264, canonical publication/assessment/supervision joins in `packages/strategy-lab/src/league/contracts.ts:62-99`, then requires a host issuer verdict in `packages/strategy-lab/src/league/contracts.ts:101-105`. |
| T-265-04 | Tampering | cell-to-snapshot joins | high | mitigate | Exact joins, one-cell coverage, canonical reduction, fault fixtures | **closed** — reducer rejects invalid matrix coverage, stale/duplicate terminals, process-invalid terminals, and projection join mismatch before emitting bytes in `packages/strategy-lab/src/league/matrix.ts:296-391`; fault cases are asserted in `packages/strategy-lab/src/league/matrix.test.ts:157-173`. |
| T-265-05 | Integrity | arena and condition enumeration | high | mitigate | Active semantic hashes and explicit v1.37 condition rows | **closed** — only two distinct active schedulable semantic hashes are admitted in `packages/strategy-lab/src/league/matrix.ts:136-145`; `createSetScenarioV137` generates the four conditions and cardinality must equal `8 × C(n,2)` in `packages/strategy-lab/src/league/matrix.ts:181-260`; alias/duplicate regression is in `packages/strategy-lab/src/league/matrix.test.ts:138-155`. |
| T-265-06 | Denial of service | full-scale manifest retention | medium | mitigate | Bounded chunk descriptors and maximum-shape test | **open — below high threshold (non-blocking)** — chunk descriptors and a 528-cell/262144-byte test are present (`packages/strategy-lab/src/league/matrix.ts:46-105`, `packages/strategy-lab/src/league/matrix.test.ts:207-215`), but two independent source-review findings remain pending main-owned repair: (1) ordinary terminal publication charges terminal reserve (`scripts/run-v1-38-serious-league.ts:47-55`) while the next start again requires the full `6 × 262144`/24 terminal headroom (`scripts/run-v1-38-serious-league.ts:50-53`), although allocation accepts that exact minimum (`packages/strategy-lab/src/league/allocation.ts:44-46`); (2) matrix size is unbounded above the cardinality formula (`packages/strategy-lab/src/league/matrix.ts:258-260`) while solver transport admits at most 262144 bytes (`packages/strategy-lab/src/league/solver.ts:40-45`), so the reported 16-candidate/960-cell synthetic transport is rejected even though allocation permits that population. The source test only covers 12 candidates/528 cells and one descriptor (`packages/strategy-lab/src/league/matrix.test.ts:207-215`), not either boundary. Pending focused regressions; neither finding was independently reproduced by this audit. |
| T-265-07 | Elevation | connected runner | high | mitigate | Factory issuer, WeakSet capability, source closure, provider identity, reopen denial | **closed** — persisted closure root/hash joins and fresh factory admission occur before host construction in `packages/strategy-lab/src/league/connected-runner.ts:59-100`; `WeakSet`/`WeakMap` issuance is required at the execution boundary in `packages/strategy-lab/src/league/connected-runner.ts:103-135`; forged caller-provider coverage is in `packages/strategy-lab/src/league/connected-runner.test.ts:88-96`. |
| T-265-08 | Tampering | retained terminals | high | mitigate | Charge-first roots, immutable publication, digest verification, tamper/reopen checks | **closed** — content-addressed atomic writes reject differing overwrite bytes in `packages/strategy-lab/src/league/repository.ts:73-83`; terminal publication requires its already-recorded start and matching cell in `packages/strategy-lab/src/league/repository.ts:103-111`; digest check is enforced in `packages/strategy-lab/src/league/repository.ts:94-101`. |
| T-265-09 | Information disclosure | reopen projection | high | mitigate | Bounded data-only reopen with root-only private links | **closed** — reopen validates byte/record limits and returns `issued: false` inspection evidence only in `packages/strategy-lab/src/league/repository.ts:114-155`; no execution provider is exposed. Non-authorizing reopening is also asserted in `packages/strategy-lab/src/league/repository.test.ts:69-88`. |
| T-265-10 | Tampering | solver selection/output | high | mitigate | Synthetic comparator, rooted manifest, exact arithmetic, byte-golden invariance | **closed** — exact `bigint` rational operations and canonical byte admission are implemented in `packages/strategy-lab/src/league/solver.ts:16-47`; the sole synthetic selection requires golden/permutation/boundary success in `packages/strategy-lab/src/league/solver.ts:292-309`; canonical-layout and tamper regressions are in `packages/strategy-lab/src/league/solver.test.ts:70-125`. |
| T-265-11 | Repudiation | response loop | high | mitigate | Round/target/admission roots and charge-first terminals retain all outcomes | **closed** — round target, mixture, and charge are rooted before admission in `packages/strategy-lab/src/league/psro.ts:63-77`; response terminal receipts derive both charge and terminal roots, never caller success flags, in `packages/strategy-lab/src/league/psro.ts:80-95`. |
| T-265-12 | Integrity | counter re-entry | high | mitigate | Reject early closure and require fresh population/snapshot | **open** — main reconciled the independent deep review CR-06: the pure state machine correctly returns `fresh_snapshot_required`, but the last-round connected CLI can still emit `bounded_league_complete` and its retained verifier does not require a closed terminal state. The helper's existence and local test do not close the end-to-end mitigation. See `265-REVIEW.md`, CR-06; repair and final-round acceptance/reopen regressions are required. |
| T-265-13 | Spoofing | diversity/finalist evidence | high | mitigate | Receipt-derived dimensions, conjunctive gates, no-finalist reduction | **closed** — fingerprint bytes are re-admitted and bound to retained evidence in `packages/strategy-lab/src/league/selection.ts:24-43`; final selection recomputes rooted evidence gates and emits `no_robust_pure_finalist_found` whenever any gate fails in `packages/strategy-lab/src/league/selection.ts:124-175`. |
| T-265-14 | Information disclosure | report projection | high | mitigate | Explicit safe projection, schema/key denial, bounded reopening | **closed** — recursive report projection rejects source/memory/objective/holdout/formation/public/deployment keys and forbidden claims in `packages/strategy-lab/src/league/report.ts:21-37`; publication enforces exact projection keys in `packages/strategy-lab/src/league/report.ts:53-97`; denial tests are at `packages/strategy-lab/src/league/report.test.ts:45-56`. |
| T-265-15 | Repudiation | qualified claims | medium | mitigate | Report binds policy/solver/population/allocation roots and claim vocabulary | **closed** — report publication joins snapshot, manifest, solver, mixture, portfolio, issued finalist, reopen inventory, and red-team root in `packages/strategy-lab/src/league/report.ts:66-96`; reopen revalidates descriptor/chunk root bindings in `packages/strategy-lab/src/league/report.ts:106-123`. |
| T-265-16 | Repudiation | channel allocation/attempts | high | mitigate | All-channel rows, start-before-work terminals, unused/failed charge retention | **closed** — all four channels and all nine probes are required in `packages/strategy-lab/src/league/red-team.ts:68-87`; starts reserve capacity before work and terminals retain their full charge in `packages/strategy-lab/src/league/red-team.ts:90-115`; closure retains unused capacity in `packages/strategy-lab/src/league/red-team.ts:154-164`. |
| T-265-17 | Elevation | league CLI dispatch | high | mitigate | Complete root-bound allocation and fresh host-issued provider identity | **closed** — complete exact-key allocation validation runs before provider/producer/directory mutation in `packages/strategy-lab/src/league/allocation.ts:33-90`; CLI permits no provider argument and requires root-matching empirical allocation for `run` in `scripts/run-v1-38-serious-league.ts:567-577`; injected caller-provider/partial-allocation denials are at `scripts/run-v1-38-serious-league.test.ts:109-116`. |
| T-265-18 | Tampering | invariance/counter evidence | high | mitigate | Rooted nine-probe receipts and mandatory PSRO re-entry | **closed** — every allocated probe pair is schema/root checked, has an identity or bounded-contrast criterion, and is rooted in `packages/strategy-lab/src/league/red-team.ts:118-131`; ledger closure rejects missing probe coverage and accepted counters without re-entry in `packages/strategy-lab/src/league/red-team.ts:154-164`. |
| T-265-19 | Spoofing | fixture evidence | high | mitigate | Fixture labels/roots/dispositions, integration, allocation-gated command | **closed** — all 16 fixture groups are labeled `injected_fixture`, prohibit dispatch, and set `empiricalRequirementsComplete: false` in `packages/strategy-lab/src/league/fixtures.ts:3-52`; CLI only accepts empirical allocations for `run` and makes `verify-retained` read-only in `scripts/run-v1-38-serious-league.ts:560-577`. |
| T-265-20 | Elevation | imports/exports/CI | high | mitigate | AST graph scan, injected closure tests, explicit source-only CI gate | **closed** — graph checker traverses private/restricted imports, detects hostile execution/unresolved private loaders, and denies public/deployment reachability in `scripts/check-v1-38-serious-league-boundaries.ts:12-51`; named source-only CI gate is installed in `.github/workflows/ci.yml:34-40`. |
| T-265-21 | Tampering | allocation approval | high | mitigate | Complete immutable root; reject partial/default/inherited values; bounded reopen | **closed** — allocation construction requires every named policy, opportunity, operation, burn, participant, channel, probe, and schedule field before deriving its root in `packages/strategy-lab/src/league/allocation.ts:33-82`; re-admission rederives and compares that root in `packages/strategy-lab/src/league/allocation.ts:85-90`; command test rejects partial/stale input before repository effects at `scripts/run-v1-38-serious-league.test.ts:109-116`. |
| T-265-SC | Tampering | package installs | high | mitigate | Preserve lockfile and workspace-only stack | **closed** — the Phase 265 source interval `363e993a^..9394176c` has no change to `package.json`, package manifests, or `pnpm-lock.yaml`; the lab manifest uses only workspace dependencies in `packages/strategy-lab/package.json:10`. |

*Status: open · closed · open — below high threshold (non-blocking).*  
*Severity: critical > high > medium > low. Only OPEN entries at or above `block_on: high` contribute to `threats_open`.*

## Unregistered Flags

None. Plans 01–04 and 06 contain no `## Threat Flags` section; Plan 05 explicitly records no new attack surface in `265-05-SUMMARY.md:117-119`. There are no flag-to-threat mappings to add.

## Accepted Risks Log

No accepted risks. No disposition in the Phase 265 planned register is `accept` or `transfer`, and this audit did not create an acceptance for T-265-06.

## Security Audit Trail

| Audit Date | Source | Threats Total | Closed | Blocking Open | Non-blocking Open | Run By |
|---|---|---:|---:|---:|---:|---|
| 2026-09-15 | `9394176caed71cfef4f9ceb4a3a81456baf356c7` | 22 | 21 | 0 | 1 | gsd-security-auditor |
| 2026-09-15 | `9394176caed71cfef4f9ceb4a3a81456baf356c7` | 22 | 20 | 1 | 1 | main reconciliation with independent CR-06 |

## Sign-Off

- [x] All 22 plan-authored threats have a disposition and source-audit status.
- [ ] `threats_open: 0` for the configured `block_on: high` gate; T-265-12 remains open after connected-review reconciliation.
- [ ] T-265-06 retention-reservation repair and focused regression are pending; it is medium severity and non-blocking, not accepted.
- [ ] Source-only audit is not empirical Phase 265 completion, allocation approval, production readiness, or milestone sign-off.

**Approval:** pending independent-review closeout and the separate allocation decision.
