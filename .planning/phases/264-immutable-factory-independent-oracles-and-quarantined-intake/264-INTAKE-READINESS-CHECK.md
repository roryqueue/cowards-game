---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-06-private-intake-readiness
checked: 2026-09-14
status: passed
targeted_test: 15/15 passed
score: 2/2 must-have truths fully verified
recheck: 2026-09-14
repaired_source_commit: 8fd69582
open_gaps: 0
---

# Phase 264 Plan 06 Intake Readiness Check

This is a bounded code-and-focused-test review of the private intake mechanics. No provider, guest, source execution, Match, network, or genuine participant/external evidence was used. The fixtures and opaque authorization identifiers are synthetic.

## Evidence checked

- `packages/strategy-lab/src/factory/intake-protocol.ts`
- `packages/strategy-lab/src/factory/intake.ts`
- `packages/strategy-lab/src/factory/ledger.ts`
- `packages/strategy-lab/src/factory/repository.ts`
- `packages/strategy-lab/src/factory/admission.ts`
- `packages/strategy-lab/src/factory/intake-protocol.test.ts`
- `packages/strategy-lab/src/factory/intake.test.ts`
- Plan 06 and its summary

Targeted command: `./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/intake-protocol.test.ts packages/strategy-lab/src/factory/intake.test.ts` — **15 tests passed** after the `8fd69582` repair. The unfiltered `strategy-lab` TypeScript build also passed (reported by the main verifier).

## Re-check after `8fd69582`

All eight initial intake findings are closed by the repaired source and focused regressions. Explicit review acceptance, reviewer/provenance equality, same-protocol retry lineage, static source validation, packet build/runtime root binding, protocol-scoped elapsed budgets, and fail-closed accounting are exercised. Unsupported native languages are rejected before common admission.

| Check | Result | Evidence |
|---|---|---|
| Explicit review and reviewer identity | PASS (mechanics) | Omitted review disposition is terminal `rejected`; only `accept` proceeds. Provenance reviewer ID must equal the charged reviewer ID. |
| Source/provenance authenticity | PASS (mechanics) | UTF-8 and `validateStrategySource` checks reject prose/opaque bytes without source execution; builder/toolchain/runtime roots are compared to packet build/native-lane roots. |
| Retry, time, and acceptance budgets | PASS (mechanics) | Retry parent must belong to the active protocol and same candidate packet; usage and elapsed totals are filtered to the active protocol; caller ordinals cannot set accounting. |
| Accounting and ledger cross-links | PASS (mechanics) | Missing/corrupt accounting fails closed; accounting binds task/candidate/budget/input roots; bounded regular files are checked; start/terminal filename roots, duplicate records, orphan terminals/starts, and terminal/start pairings are rejected before budget reconstruction. |
| Invalid protocol handling | PASS (mechanics) | Invalid protocol configuration returns a frozen discriminated `blocked_configuration` result with `attemptRoot: null`, `authorized: false`, `allocation: "none"`, and a published immutable blocked artifact. The path does not read source bytes, allocate an attempt, or create a gameplay/admission record. |

The focused fixtures remain synthetic and do not establish real participant authorization, external attack evidence, candidate validity, gameplay, or provider participation.

## Historical initial review (superseded findings retained)

The original 9-test review recorded eight gaps: optional review, reviewer mismatch, cross-protocol retry, malformed-protocol charging, declarative-only source kind, unbound provenance roots, accounting reset, and cross-protocol elapsed totals. The 14-test recheck closed seven and identified the remaining blocked-artifact and ledger-crosslink work; `8fd69582` closes those final findings. The historical failure details below are retained as superseded evidence.

## Historical goal-backward truths (superseded)

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | A separately controlled private intake channel accepts only complete explicit deterministic source and provenance. | **FAILED** | Protocol, roots-only reviewer projection, packet schema, source-byte hash, and common `admitFactory` forwarding are substantive. However arbitrary prose/opaque bytes can pass: `admitFactory` checks source length/hash identity but performs no source-kind or deterministic-source validation. Acceptance also does not require `reviewDisposition === "accept"`; omission reaches common admission. `admitProvenance` checks protocol membership but not `provenance.reviewerId === input.reviewerId`, and its builder/toolchain/runtime roots are not compared with packet build/native-lane roots. |
| 2 | Disclosure/conflict/budget/reviewer details are frozen and rejected work is retained in the common ledger root. | **FAILED** | Protocol/projection values and ledger records are frozen; atomic repository writes, pre-packet charge, retained terminal dispositions, and repository-derived submission/reviewer/acceptance/time accounting are present. But malformed protocol input fails at `admitFrozenIntakeProtocol(input?.protocol)` before a start record can be charged; a valid `retryParentRoot` may match any prior attempt rather than one belonging to the same protocol; and missing/corrupt accounting artifacts are treated as zero/unknown by budget reads instead of failing closed. |

## Historical passing mechanics (superseded baseline)

| Check | Result | Evidence |
|---|---|---|
| Protocol/root and authorization | PASS (mechanics) | Exact canonical keys, bounded positive budgets, explicit participant/reviewer IDs and authorization roots, derived authorization/protocol roots, and recursive freezing. No default participant or reviewer is introduced. |
| Reviewer disclosure barrier | PASS (mechanics) | Projection admits only exact protocol/reviewer/source/provenance/submission roots and rejects extra prohibited classes including holdout, other source, memories, objectives, host/evaluator, credentials, and security internals. |
| Hostile source forwarding | PASS (mechanics) | Intake validates packet/provenance/source bytes and forwards the exact parsed packet/proposal/source bytes to `admitFactory`; intake never evaluates source or creates gameplay evidence. |
| Charge-before-packet validation | PASS for valid protocol | `createFactoryAttemptStart` and `recordFactoryAttemptStart` precede packet, provenance, source, conflict, review, and common-admission checks. Repository writes are canonical, exclusive, fsynced, and terminally linked. The final blocked-configuration path is documented in the current re-check above. |
| Ledger-derived limits and terminal retention | PASS (mechanics) | Submission/reviewer/acceptance/time usage is recomputed from retained accounting/terminal records; invalid, rejected, duplicate, weak, retried, and accepted outcomes receive terminal records; caller ordinals are rejected. |
| Numeric/root hardening | PASS (mechanics) | NaN, infinities, negative elapsed values, malformed retry roots, unknown fields, and malformed packet/provenance roots cannot bypass the focused validation path; malformed retry metadata is normalized and charged. Accounting corruption is an exception covered by the gaps below. |

## Historical concrete gaps (superseded)

1. **Review is not actually required for acceptance.** In `intake.ts`, `reviewDisposition` is optional and only explicit `reject`/`legal_but_weak` values terminate the path. `undefined` proceeds to `admitFactory`, contradicting `acceptancePolicy: "accept-only-reviewed-source"`. Require an explicit accepted/reviewed disposition (or an equivalent root-bound review record) before acceptance.

2. **Reviewer provenance is not bound to the charged reviewer.** `admitProvenance` validates `provenance.reviewerId` against the protocol’s reviewer list but receives no input reviewer ID and does not compare them. A submission can be charged/accounted to reviewer A while its provenance names reviewer B. Pass the submitted reviewer ID into provenance validation and require exact equality.

3. **Retry parent is not protocol-scoped.** The retry branch checks only whether `retryParentRoot` exists in the repository. It must also require the prior start record’s `taskRoot` to equal the current protocol root (and preserve the intended retry lineage), otherwise an attempt from another protocol can be reused as a valid retry marker.

4. **Malformed protocol configuration is not charged.** Protocol admission occurs before `readLedger`, start construction, and durable charge. A malformed/missing protocol therefore throws without a retained invalid attempt, contrary to an unconditional “charge before hostile validation” claim. Either define protocol admission as an external prerequisite and narrow the claim, or add a safe invalid-protocol charge path with a deterministic task/budget root.

5. **Source-kind validation is only declarative.** `IntakeProvenance.sourceKind` is required to equal `explicit-deterministic`, but `admitFactory` does not validate source grammar, executable-source shape, or a deterministic source artifact. Advice/prose/opaque binary with matching packet byte length/hash can proceed. Add a non-executing source validator or narrow the contract to byte/provenance identity only.

6. **Provenance build/runtime roots are not cross-bound.** `builderRoot`, `toolchainRoot`, and `runtimeRoot` are merely well-formed roots. They are not compared with `packet.build.buildRoot`, `packet.build.toolchainRoot`, or the packet native lane/runtime profile, allowing internally inconsistent provenance to be retained.

7. **Corrupt or missing accounting can silently reduce budget usage.** `readAccounting` catches read/parse failures and returns `null`; reviewer, acceptance, and elapsed totals then treat absent values as zero. A removed/corrupt accounting artifact must fail closed or make the ledger uncertain, not permit further submissions.

8. **Elapsed budget is not protocol-scoped.** `elapsedTotal` sums every prior record in the repository, including other protocol roots. This can make an unrelated protocol exhaust the current protocol’s time budget and means the charged accounting query is not derived solely from the active protocol. Filter by `taskRoot === protocol.root` (while still failing closed on bad artifacts).

## Scope boundary

The Plan 06 intake/accountability mechanics now pass this bounded review. Passing focused tests do not establish real participant authorization, genuine external attacks, candidate validity, gameplay, production/public reachability, or empirical strength. Persistence/atomic consumption beyond this repository seam remains downstream integration work.

_Independent bounded review; no source edits or commit performed._
