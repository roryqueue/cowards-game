---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T20:32:03Z
depth: deep
source_head: 19a1d9260adacebc6868b7969e1e9adf6bcec5b1
diff_base: 98de5f65
diff_head: 19a1d9260adacebc6868b7969e1e9adf6bcec5b1
files_reviewed: 10
files_reviewed_list:
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
  - scripts/run-v1-38-lean-private-probe.test.ts
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
source_disposition: NOTPASS
---

# Phase 265 Startup Correction: Source-Only Review v2

**Reviewed:** 2026-10-10T20:32:03Z  
**Diffs:** full correction `98de5f65..19a1d9260adacebc6868b7969e1e9adf6bcec5b1`; follow-up `8f31b4d494d9edbbccb29f3f9c078412cefb1c30..19a1d9260adacebc6868b7969e1e9adf6bcec5b1`.  
**Disposition:** NOTPASS — one retained-verifier blocker; one narrowed integration-coverage warning.

## Scope and method

Reviewed the ten changed source/test files listed above. The accompanying source summary was used as context, not counted as a source file. Traced probe grants and bindings across authority → factory → planner → session → generated broker/V8 supervisor and the v2 preparation, committed-allocation admission, debit, retained-join verification, plus v1 ordinal compatibility. No canonical allocation/store/ledger or empirical reader was touched; no prepare/entry/verify CLI, provider, Docker/container, Strategy, Match, or runtime path was invoked.

Reviewer commands closed:

- `git diff --check 98de5f65..19a1d926` — passed.
- `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts -t 'genuine v1 ordinal-1|v2 ordinal-0 debit|actual encoded V1.19 output cap|builds syntactically valid correction broker source'` — passed, 4 tests; 131 skipped.

The earlier CR-01 and CR-02 are closed by the source delta: probe broker validation now requires the exact encoded request including `outputByteLimit === 262144`; it carries `caseOrdinal` from the authority binding and checks the corresponding ordinal-suffixed execution owner, accepting ordinals 0–3. The prospective v2 schedule and issuer still constrain v2 to its sole ordinal 0. The new authority fixtures use temporary Git repositories/stores, the real v1 carry authenticator, admission/debit issuer, ordered claims, and v2 retained request/result/debit join. The V8 supervisor keeps the fixed 2500 ms startup, 1000 ms guest, and 5000 ms host bounds. Startup origin is checked then discarded, not forwarded to the normal Match observer. No new runtime-hour admission constant was introduced.

## Critical Issues

### CR-01: V2 retained verifier accepts an unattempted allocation as verified — BLOCKER

**File:** `scripts/run-v1-38-lean-private-probe.ts:375,380-387,407-410`; whole-store join at `scripts/run-v1-38-lean-private-probe.ts:272-278`

**Issue:** `verifyLeanPrivateProbeResultV2` limits attempted ordinals/outcomes to at most one but does not require exactly one. An empty `attemptedOrdinals` and empty `outcomes` pass the result checks and can have a valid recomputed result root. `verifyLeanPrivateProbeV2RetainedJoins` then accepts an empty debit-row array because its count check only compares it to the empty attempts. The whole-store verifier uses the same equality for ledger rows, expects no per-probe record for that result, and can return `verified: true` for a structurally consistent allocation with no charged invocation. This misstates verification of the plan’s one-case corrected entry; an unattempted v2 allocation is not a retained probe result.

**Fix:** Require `attemptedOrdinals` to equal exactly `[0]`, `outcomes.length === 1`, and exactly one ordinal-0 debit row throughout the v2 result/join/store verifier. Add a negative test where both arrays and debit rows are empty while the allocation/result roots are otherwise recomputed correctly.

## Warnings

### WR-01: Broker compatibility fixture asserts generated-source text instead of executing its branch — WARNING (narrowed)

**File:** `scripts/lib/v1-38-lean-container-match-session.test.ts:137-155`

**Issue:** The follow-up fixes the prior disconnected-fixture gap materially: it exercises actual V1.19 encoding, temporary-Git v1 ordinal-1 and v2 ordinal-0 admissions/debits, real ordered authority claims, and real v2 retained joins. However, the broker test only checks that generated V8 source contains the expected limit/ordinal predicates and parses syntactically; it does not run that predicate against the encoded request or execute the inert V8 supervisor/broker control path. Thus a typo or branch composition error in the generated protocol can still evade this fixture. This remains a source-test coverage limitation, not evidence that a provider/runtime was exercised.

**Fix:** If safely feasible within source-only scope, evaluate the generated trusted broker’s extracted pure validation seam with the actual encoded request and ordinal fixtures (without spawning workers, providers, or Strategy code). Otherwise preserve this limitation in any handoff; do not infer runtime feasibility from the source tests.

## Verification context

Per the author’s source summary (not independently rerun here), the four focused correction tests passed; the unfiltered suites ended 266/267 with the planner cleanup-throws assertion still failing (NOT PASS); strict TypeScript leaves 10 diagnostics, with no exact diagnostic-identity comparison to the earlier baseline. No all-green, identity-level typecheck, empirical, or runtime-feasibility claim is made. The approval remains source-only and runtime admission remains closed.

_Reviewer: gsd-code-reviewer (independent source-only re-review)_
