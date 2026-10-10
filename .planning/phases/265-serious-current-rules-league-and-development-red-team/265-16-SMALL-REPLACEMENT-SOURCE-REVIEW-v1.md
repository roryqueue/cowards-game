---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T13:27:35Z
original_reviewed: 2026-10-10T13:06:00Z
depth: standard
source_head: 6a4b747c
original_source_head: 00111ffa
diff_base: bcb89241
files_reviewed: 10
files_reviewed_list:
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/run-v1-38-lean-private-probe.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
original_findings:
  critical: 6
  warning: 1
  info: 0
  total: 7
status: issues_found
runtime_entry_authorized: false
current_review_head: 6a4b747c
current_reviewed: 2026-10-10T13:27:35Z
current_source_gate: PASS_WITH_WARNINGS
current_open_findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
---

# Phase 265 Plan 16 smaller replacement: source review

## Narrative Findings (AI reviewer)

Reviewed the exact ten-file diff and narrowly traced source admission, the selected V1.19 bridge, and session construction. This was source-only: no tests, prepare, entry, provider/container operation, Match, retained reader, or historical scan was run. No source was modified or committed. No structural pre-pass was supplied. The GSD review guidance was used; no local project skill directories were present. The review artifact was created with the available patch tool because no filesystem Write tool was exposed.

The default call chain is factory -> planner -> selected V1.19 bridge -> session.adapter.execute -> isolated container. Inputs derive from canonical initial positions and pass current public ABI schemas; this is not a played Match. That trace does not establish successful runtime feasibility. The following defects block entry until bounded corrections and scoped validation close them. Existing strict diagnostics and the inherited cleanup-throws failure are not waived or represented as passing by this review.

## Critical Issues

### CR-01: Historical cost and continuous resource window are unauthenticated — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-probe.ts:88-90,116-119,133,217,264-278`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.ts:83,90-95`

**Issue:** Any syntactically valid caller cost root is accepted and copied into allocation; no approved snapshot is opened. Entry measures only a new local elapsed clock with a 600000ms limit. There is no 285590903ms carried total, 292790903ms cap, absolute stop/reserve, historical 40-charge/survivor join, retained-byte sum, or aggregate process/container RAM measurement. Free disk >=2GB is not the approved retained/scratch/total disk ceiling. Preparation writes before its capacity check. The verifier simply regenerates the schedule from the same asserted cost root. Thus arbitrary roots, expired entry, or exhausted retained budgets still pass admission.

**Fix:** In these existing files, reopen only the exact approved 144640-byte aggregate snapshot and verify its raw digest `sha256:efe0acbd35beb37c47877cd843e695b4ed0d94b781e66c07464238f152bc45b4` and body root `sha256:6e271d344297f332e858882c9071f0fc47629e72fda3c0371540e3d607306381`. Bind the current approval's carry/cap/deadline rather than resetting to the old snapshot time. Check before writes, admission, and every debit; charge bounded new-store writes plus the authenticated historical allocated-byte total, and use the existing aggregate RAM ceiling check. Retain bounded measurements so the read-only verifier recomputes the same joins. Do not rescan historical payloads or add a helper/carrier.

### CR-02: Probe branch drops the 5000ms host receipt budget — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:426-432,491,507`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.ts:141`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-probe.ts:174-177`

**Issue:** The private claim never sets `hostResponseReceiptMilliseconds`. Selected V1.19 dispatch uses adapter.execute/legacy with timeout1000; stream.exchange therefore also gets1000, including receipt/lifecycle overhead. This can kill the host wait before a valid near-budget guest response and cleanup are received. Setting the existing scalar alone would crash its Match-authority `.runtime.executableRoot` expression. Also `startupMs` records factory construction, not guest readiness, so it cannot attest a guest-startup phase.

**Fix:** Derive a probe-only 5000ms host receipt from the authenticated probe binding, with executable equality against `binding.executableRoot`; keep the actual guest1000 ceiling. Do not fabricate a Match authority. Label constructor measurement accurately and keep guest-startup evidence unknown unless the current boundary actually supplies it. A timeout/transport result must remain honestly classified rather than inferred as a guest timeout.

### CR-03: Earlier debit corruption is accepted; failed issuance leaves admission reusable — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.ts:122-139,157-167`

**Issue:** Prior ledger rows are checked only for ordinal/allocationRoot, and after append for allocationDigest. A previous caseId/requestRoot/inputRoot can be altered or arbitrary fields added while preserving those three fields; the next capability still issues. Canonical prior bytes and exact frozen row values are not compared. Failures from malformed rows, writes, fsync, or reopened joins do not set `state.used`, allowing restoration/retry of the same admission after an uncertain operation.

**Fix:** Reconstruct every prior exact-key debit from its frozen case and allocation digest, compare canonical full ledger bytes including delimiters, and compare the authenticated prior prefix/digest. Wrap issuance so any uncertainty permanently invalidates this admission before rethrowing. No authority may issue from a partial or changed debit. Add inert filesystem tests for changed prior request/input/case/extra keys and failed issuance followed by retry.

### CR-04: Resource/I/O failures can abandon a charged run without terminal/result records — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-probe.ts:164-169,197-209,315`

**Issue:** Debit, capacity checks, and receipt writes are outside the guarded provider lifecycle. After a completed charged invocation, `capacityCheck` at199 or203 can throw; receipt/terminal writes can also fail. The function then exits through a generic CLI error without terminal.json/result.json, leaving the durable charge without bounded terminal attribution. Before the next ordinal, an issuer failure can likewise strand the store. This is exactly the failure/cutoff path that must not lose experiment accounting.

**Fix:** Give the admitted run one outer terminalization path that captures sanitized finite failure codes, preserves all attempted debits, never dispatches later ordinals after failure, and attempts bounded terminal/result persistence without requiring the capacity check that already failed to pass again. If persistence itself is impossible, emit an honest non-success and retain the incomplete store; never claim accepted verification. Keep provider cleanup in finally.

### CR-05: Read-only verifier accepts unverified success, incomplete cleanup, and private payloads — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-probe.ts:219-222,236-250,295-300`

**Issue:** Success only requires `evidenceVerified` to be boolean, not true. `cleanupComplete:false` is accepted whenever result and terminal agree. The request's four `caseRoots` elements, tupleRoot, and runtimeLimitsRoot are never compared with allocation. Record caseId/method/sourceRoot/executableRoot/outputBytes are not validated against their expected types/values. A rehashed request can retain arbitrary nested source/memory/objective fields under caseRoots, or a record can retain an object under outputBytes, while returning verified:true. Numeric measurements accept negatives. Result validation also permits later success after a success receipt with incomplete cleanup.

**Fix:** Validate exact nested schemas and compare every request/case field with the recomputed frozen schedule. Require success evidenceVerified===true and cleanupComplete===true; reject incomplete cleanup from accepted retained verification. Require finite nonnegative safe measurements and bounded numeric outputBytes. Stop ordering after either non-success or cleanup failure. Compare the request to its complete reconstructed canonical bytes, and apply the same payload-free schema at write time. This needs no extra verifier module.

### CR-06: Probe authority still permits an alternate executable and arbitrary cleanup timeout — BLOCKER

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-factory-supervised-runtime.ts:70,109-111`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-planner-supervised-runtime.ts:91,133`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-container-match-session.ts:431,453`

**Issue:** Probe override-denial lists exclude `dockerPath` and `cleanupTimeoutMilliseconds`, both inherited constructor options and propagated to the session. A capability holder can replace the real Docker executable with an arbitrary host executable or set an unbounded cleanup timeout. Rejecting transport/streamFactory/createRuntime does not prevent this alternate execution/control path or bounded cleanup bypass.

**Fix:** Reject property presence for these two options in probe mode, before claim/construction, and use existing real defaults. Add inert undefined/accessor/inherited-property tests. Leave legacy callers unchanged.

## Warnings

### WR-01: Added tests substitute the entire admission/debit path and cannot catch these blockers — WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.test.ts:4-14`; `/Users/roryquinlan/runtime/cowards-game/scripts/run-v1-38-lean-private-probe.test.ts:11-20,64-100`; `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-factory-supervised-runtime.test.ts:85-91`

**Issue:** Authority tests check export existence and one forged object only. Runner tests mock the admission opener/debit issuer and count calls; the success test has no actual ledger, request file, allocation commit, or real WeakMap claim. Factory forwarding stubs the claim and intentionally stops at a mocked planner. These are useful seam tests but do not establish authenticated debit-to-constructor compatibility or retained verifier reliability.

**Fix:** Add a small inert retained-store/temporary-Git fixture exercising actual opener/debit/ordered claims, exact ledger rejection, and read-only verifier tampering/cleanup/privacy checks. Mock only the final isolated transport boundary where needed; do not perform container/Match entry in unit tests. Focused test success remains scoped evidence, not a global build/diagnostic waiver.

## Bounded disposition

Source gate is NOTPASS at reviewed HEAD. Close the above in the same ten files and existing named notes, then perform focused validation and independent source re-review within the fixed frontier. No extra plan, artifact family, historical scan, third allocation, Match, or deadline extension is justified. If the bounded correction cannot close the source gate safely, stop with gaps_found/feasibility_not_established before allocation.

## Current source re-review: a2cc9ee4

**Current disposition:** PASS_WITH_WARNINGS for the bounded source gate; zero open BLOCKERs. The original 00111ffa NOTPASS and six findings above remain historical audit, not the current disposition. This re-review inspected the exact ten-file fixes from 00111ffa to a2cc9ee4 and narrow existing dependencies; it did not run tests, prepare, entry, provider/container operations, Matches, or retained verification. No operational gate or deadline is waived. ROOT must still complete focused validation/source verification before allocation and keep the fixed source frontier/reserve.

| Original finding | Current resolution |
|---|---|
| CR-01 | CLOSED: authority.ts63-98 opens only the exact bounded snapshot, authenticates raw digest/body root/40 charges/allocated survivors, and enforces current285590903 carry,292790903 cap and31-minute absolute reserve. Resource checks occur before preparation writes, capacity admission and each debit (runner.ts142-143; authority.ts130,169). Bounded new-store allocated bytes plus remaining-write reserve are joined to historical29970432 bytes. The existing aggregate-memory policy receives host current/high-water RSS plus the enforced256MiB container bound, external reserve and guard. This is an honest conservative bound, not sampled guest RSS/peak, and does not claim unknown historical peak disk. Verifier recomputes the resource equations and retained preterminal bytes (runner.ts267-276). |
| CR-02 | CLOSED: session.ts434 supplies probe host receipt5000, and executable equality uses the private binding rather than assuming a Match authority (session.ts493). Existing planner selected V1.19/legacy dispatch still supplies guest1000. Runner.ts206 records factoryConstructionMs and guestStartup:"unknown"; it no longer mislabels constructor time as guest startup. No guest-startup measurement or separate ready-phase success is claimed. |
| CR-03 | CLOSED: authority.ts166 invalidates admission before uncertain work; state reopens only following successful durable issuance. Exact canonical expectedPrior bytes are compared at183-184, then appended/fsynced/reopened as before. Earlier changed fields/keys/delimiters cannot issue. New inert Git/filesystem fixture exercises real ordered WeakMap claims, tampered prefix rejection and nonrevival. |
| CR-04 | CLOSED: runner.ts173-230 has an outer resource/I/O stop path, conservatively records uncertain attempted ordinal, keeps provider cleanup in finally, and independently attempts terminal/result persistence. Failed capacity or persistence returns non-success; an incomplete store cannot pass retained verification. No later invocation occurs after this path. |
| CR-05 | CLOSED: runner.ts128 validates exact case fields, bounded natural measurements and verified/clean success; request bytes match the full reconstructed canonical public request at241. Verifier rejects cleanup failure, nonnull terminal failureCode and invalid resource joins. Result reconstruction checks exact frozen schedule and stops after cleanup failure (runner.ts322-328). Extra nested private payloads no longer fit the retained schema. The store verifier remains read-only. |
| CR-06 | CLOSED: factory.ts70, planner.ts90 and session.ts431 reject dockerPath/cleanupTimeoutMilliseconds property presence before claims/construction. Default Docker/transport/stream construction and bounded cleanup are retained; added inert tests cover inherited/accessor/undefined cases. |

### WR-01 current disposition — WARNING remains, narrowed

The actual authority fixture now covers committed allocation, durable debit, ordered claims and prefix tampering. Full retained-store verifier tampering and actual default-provider constructor integration still lack a complete inert fixture. Existing runner success counts remain mocked. This remains a coverage warning, not an observed source blocker; do not label these tests real-container empirical proof. Add the smallest missing fixtures within the approved scope when feasible, or preserve the disclosed gap.

### WR-02: New authority test expires with the real wall clock — WARNING

**File:** `/Users/roryquinlan/runtime/cowards-game/scripts/lib/v1-38-lean-experiment-authority.test.ts:43,45,57,59`

**Issue:** The new actual authority fixture calls production capacity/resource observation with real Date.now. After the approved13:27:52UTC reserve cutoff, this unit test permanently fails even with correct unchanged source, including subsequent CI. That is a test-reliability defect, not a reason to relax the production deadline or claim global tests pass.

**Fix:** Freeze Date.now to one admitted fixture instant inside this test and restore it in finally/afterEach. Keep the actual production deadline and capacity implementation unchanged. No container/runtime entry is needed to validate this adjustment.

**Handback:** Source gate passes with these two disclosed warnings at a2cc9ee4. Actual run readiness remains contingent on the separately recorded focused validation/source verification, current capacity/reserve, immutable committed allocation, four-probe/zero-Match scope, and ROOT's terminal/independent-verifier outcomes. Neither retained verification nor runner feasibility is claimed by this source review.

## Test-only closure: 6a7d2e8c

Reviewed only the exact a2cc9ee4..6a7d2e8c delta: authority.test.ts32 adds a Date.now spy returning the approved resume instant1791633532000; the fixture finally at63 restores the spy before removing its temporary directory. The production source is unchanged. WR-02 is CLOSED: the fixture no longer expires with the real wall clock, and restoration covers success or thrown fixture work. No tests or runtime operations were performed by this reviewer.

**Current handback:** Source PASS_WITH_WARNINGS at6a7d2e8c, zero open BLOCKERs and only WR-01 remaining. This supersedes the two-warning a2cc9ee4 handback without erasing its audit. ROOT's separate validation, source verification, current capacity/deadline checks and empirical outcomes remain mandatory and unclaimed.

## Loader-seam correction: 6a4b747c

ROOT's actual monitor was NOTPASS for the newly imported node:child_process loader in authority; removing perf_hooks alone was insufficient. That failed monitor is preserved here and is not relabeled a passing run. This reviewer inspected only the6a7d2e8c..6a4b747c two-file source delta before the13:27:52 frontier, without running tests or monitoring.

Session.ts13-23 now owns bounded Git metadata reads through its existing reviewed host-process import. The wrapper accepts exactly rev-parse HEAD; rev-list --parents -n1 plus a40–64 lowercase hexadecimal commit; or git show of such a commit and one of the two exact canonical allocation paths. Other argument shapes reject. execFileSync uses fixed git, separate arguments, ignored stdin/stderr,1500ms timeout and4096-byte metadata/65537-byte allocation output bounds. It neither runs Strategy source nor supplies an alternate provider/executor. Authority's parent/HEAD/committed-byte checks are unchanged and consume returned Buffer bytes explicitly. The removed perf_hooks import is replaced by the supported host global performance monotonic clock; no engine/guest clock or rule changed. The pre-existing authority/session import cycle gains no top-level cross-module call.

**Current source disposition:** PASS_WITH_WARNINGS at6a4b747c, zero open BLOCKERs and WR-01 still disclosed. This source-only result does not establish monitor/validation success, allocation admission, empirical feasibility or permission to edit after the frontier. ROOT must preserve the actual failed monitor and use its separate in-flight check outcomes; no allocation/entry has been claimed.
