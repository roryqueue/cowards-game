---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T20:35:00Z
depth: deep
source_head: 83afd52d53b28fc6cfdf54dc70def1d1ffa1d2fa
diff_base: 98de5f65
diff_head: 83afd52d53b28fc6cfdf54dc70def1d1ffa1d2fa
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
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
source_disposition: PASS_WITH_WARNINGS
---

# Phase 265 Startup Correction: Source-Only Review v3

**Reviewed:** 2026-10-10T20:35:00Z  
**Full diff:** `98de5f65..83afd52d53b28fc6cfdf54dc70def1d1ffa1d2fa`  
**Final delta:** `19a1d9260adacebc6868b7969e1e9adf6bcec5b1..83afd52d53b28fc6cfdf54dc70def1d1ffa1d2fa`  
**Disposition:** PASS_WITH_WARNINGS — prior blockers closed; no remaining source blocker found.

## Scope and method

Reviewed the ten changed source/test paths listed above and traced the authority grant through factory → planner → session → broker/V8 supervisor, plus v2 schedule, admission, debit, result joins, and retained verification. The accompanying source summary was context only. No canonical allocation/store/ledger or empirical reader was touched; no prepare/entry/verify CLI, provider, Docker/container, Strategy, Match, or runtime path was invoked.

Commands closed by this reviewer:

- `git diff --check 98de5f65..83afd52d53b28fc6cfdf54dc70def1d1ffa1d2fa` — passed.
- `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts -t 'genuine v1 ordinal-1|v2 ordinal-0 debit|actual encoded V1.19 output cap|builds syntactically valid correction broker source'` — passed, 4 tests; 131 skipped.
- `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-probe.test.ts -t 'joins the one corrected v2 descriptor'` — passed, 1 test; 7 skipped.
- `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-probe.test.ts` — passed, 8 tests.

## Resolution of prior findings

- **CR-01 (review v1/v2), broker request shape — CLOSED.** Generated V8 probe validation now exact-checks the V1.19 encoded request with `outputByteLimit === 262144`, matching the planner's configured executor. The inert fixture constructs that request through `encodeSubprocessIpcRequest` and checks the broker predicate.
- **CR-02 (review v1), case ordinal — CLOSED.** Session derives `caseOrdinal` from the authority-issued binding; the broker and host origin validator require an ordinal in 0–3 and the matching ordinal-suffixed owner. V1 ordinal-1 now has a real temporary Git/store admission, debit, and ordered-claim fixture. V2 allocation validation remains one case at ordinal 0.
- **CR-01 (review v2), empty v2 result — CLOSED.** `verifyLeanPrivateProbeResultV2` now requires exactly `[0]` and one outcome, and the retained join requires exactly one debit row. The added regression recomputes a valid root over empty attempt/outcome arrays and confirms both verifiers reject it. The valid one-attempt failure record remains accepted as a verified failure, not success credit.

The v2 authority test exercises the real prior-v1 carry authenticator, temporary Git allocation commit and mode-restricted store, admission, debit write/fsync/reopen, ordered factory/planner/session claims, and retained request/result/debit join. The capability remains WeakMap-backed and one-use. Probe startup origin is checked against the exact binding, then discarded rather than sent to the ordinary Match observer. The existing V8 supervisor continues enforcing distinct 2500 ms startup, 1000 ms guest, and 5000 ms host bounds. No new source-hour runtime admission or changed ceiling appears in the final delta.

## Warnings

### WR-01: Generated broker predicate is source-checked but not executed — WARNING (preserved)

**File:** `scripts/lib/v1-38-lean-container-match-session.test.ts:137-155`

**Issue:** The output-limit test constructs the real V1.19 encoded request and checks the generated V8 broker contains the exact field/value and ordinal/owner predicates; it does not execute the generated broker validation branch or V8 supervisor. This is an acknowledged bounded source-test limitation. The separate authority fixture exercises the actual issuance/claim/join path, but neither test establishes broker execution or physical runtime feasibility.

**Fix:** Preserve this limitation in any handoff. Only add an extracted pure validation fixture if it fits the bounded source-only scope; do not launch a worker, provider, Strategy, or Match, or infer runtime feasibility from source tests.

## Verification caveats

The author reports the full four-suite run remains 266/267 because of the existing planner `cleanup-throws` assertion (NOT PASS, not waived); scoped strict TypeScript still has 10 diagnostics. No clean typecheck or diagnostic-identity comparison is claimed. No all-green, empirical, or runtime-feasibility claim is made. Runtime admission remains closed.

_Reviewer: gsd-code-reviewer (independent final source-only re-review)_
