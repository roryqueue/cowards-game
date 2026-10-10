# Phase 265 Plan 16 Small Replacement — Plan Check v2

**Status:** ISSUES FOUND — 2 blockers  
**Scope checked:** Revised `265-16-SMALL-REPLACEMENT-PLAN-v1.md` against the approval, research, v1 findings, and current authority/factory/planner/session/request seams.  
**Boundary:** Read-only review; no tests, runtime, Strategy, provider, Match, allocation, or source changes.

## Resolved v1 findings

- **Authority mismatch:** Resolved at the plan-contract level. The revised path has a distinct opaque `LeanPrivateProbeRuntimeAuthority`, binding, and ordered claims; it preserves the existing seat-bearing `LeanRuntimeAuthority` path. The proposed `executionOwnerId` maps only into the session's legacy `matchId` transport slot, whose current use is safe-identity/equality validation and the returned opaque session property, not game Match/kernel context.
- **Verifier write contradiction:** Resolved. The verifier is read-only over the store; retained-verification output is an enumerated external note binding the already-computed result root.
- **Output inventory:** Resolved. Task 3 and physical inventory enumerate the six notes and exact per-allocation store entries.
- **Requirement metadata:** Resolved. `requirements: []`; LEAG-01–09 are separately identified as pending.
- **Acceptance criteria:** Resolved. All three tasks now contain measurable `<acceptance_criteria>`.

## Blockers

1. **[BLOCKER — authority issuance / durable charge] The plan does not define an authenticated source of truth for the new allocation and per-probe debit.**

   Current `readLeanLedger`/`LeanCharge` and `issueLeanBaselineRuntimeAuthority` are Match-ledger/charge paths; the existing issuer validates a charge against that ledger and the scheduled Match candidate/seat. The replacement correctly avoids reusing them, but introduces new allocation/charge schemas without specifying how `issueLeanPrivateProbeRuntimeAuthority` proves that the allocation was committed before entry and that the exact ordinal debit is durably present before each invocation. “Reopen/recompute exact keys and roots” is not enough unless the issuer reopens the named retained bytes and verifies their canonical encoding, parent/allocation join, prior-ledger root, ordinal monotonicity, and durable debit state. As written, a caller could potentially supply internally consistent self-asserted roots; that would not establish a charged probe or make the per-call capability authority-backed.

   **Fix:** In Task 1/3, specify the exact persisted allocation/debit record schemas and root derivation, and the trusted issuer input/path that reopens and validates those records from the fresh private store before issuance. Bind each one-use claim to that validated debit; reject missing, uncommitted, reordered, duplicate, or caller-fabricated records. Preserve the Match ledger/issuers unchanged.

2. **[BLOCKER — isolated-runtime enforcement] The private-probe factory path does not explicitly reject the existing `createRuntime` constructor override.**

   `FactorySupervisedRuntimeOptions` exposes optional `createRuntime`, and `createFactorySupervisedRuntime` uses it to construct the downstream runtime. The established Match-authority branch explicitly rejects this override; the new Task 2 rejection list names testing transport/stream/observer overrides but not `createRuntime`. If accepted with `privateProbeAuthority`, a caller can replace the runtime constructor and bypass the real isolated provider despite the plan's requirement to reach the existing isolated runtime.

   **Fix:** Require the private-probe branch to reject property presence of `createRuntime` (including undefined/accessor presence, consistently with existing authority checks) before claims or construction; test rejection and prove the accepted path uses the real factory/planner/session construction. Keep fixture injection limited to tests that do not issue a production capability.

## Other checks

- Four non-Match probes, zero Matches, one correction cycle, unchanged caps/privacy/rules, and no LEAG/baseline/freeze credit are preserved.
- Current session source supports the proposed neutral owner transport mapping, provided the new path never derives game state or kernel context from it.
- The v1 authority, verifier, inventory, requirement-metadata, and acceptance-criteria findings are otherwise resolved.
- Scope sanity: 10 source/test files plus six evidence notes are within the approved bounded work only if execution respects the source frontier and the hard terminal/reserve deadline; no plan expansion is authorized.
- Architectural responsibility map: SKIPPED (none supplied for this supplement). Nyquist/PATTERNS checks: not applicable to this planning-only supplement from the supplied artifacts.

## Structured issues

```yaml
issues:
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "task_completeness"
    severity: "blocker"
    description: "The new probe allocation/debit roots are not tied by the issuer to authenticated, committed retained records; no existing non-Match charge API supplies this authority."
    task: 1
    fix_hint: "Define exact persisted allocation/debit schemas and root derivation; issuer must reopen and validate those bytes and bind each one-use claim to the durable pre-invocation debit."
  - plan: "265-16-SMALL-REPLACEMENT-PLAN-v1"
    dimension: "architectural_tier_compliance"
    severity: "blocker"
    description: "The new private-probe factory mode does not explicitly reject `createRuntime`, an existing constructor override capable of substituting the real isolated runtime path."
    task: 2
    fix_hint: "Reject presence of `createRuntime` before private-probe claims/construction and add a focused rejection test; only non-capability tests may use fixture injection."
```

## Recommendation

Return for a narrow revision addressing only the two authority gaps above. The prior v1 blockers and warning are resolved, and the revised neutral identity design is source-compatible; however, do not authorize probe entry until durable debit authentication and production constructor enforcement are executable plan requirements.
