---
phase: 242-four-language-checker-proof-privacy-and-audit
reviewed: 2026-06-14T17:53:23Z
depth: standard
files_reviewed: 16
files_reviewed_list:
  - packages/spec/src/workshop-checker.ts
  - packages/spec/src/workshop-checker.test.ts
  - packages/spec/src/index.ts
  - packages/spec/package.json
  - packages/runtime-wasm-wasi/src/validation.ts
  - apps/web/app/api/workshop/validate/route.ts
  - apps/web/app/api/workshop/validate/route.test.ts
  - apps/web/app/api/workshop/revisions/route.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/app/workshop/workshop-client.tsx
  - apps/web/app/workshop/workshop-client.test.tsx
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/evaluate-v1-34-workshop-checker.ts
  - scripts/evaluate-v1-34-workshop-checker.test.ts
  - package.json
findings:
  critical: 3
  blocker: 3
  warning: 2
  info: 0
  total: 5
status: issues_found
---

# Phase 242: Code Review Report

**Reviewed:** 2026-06-14T17:53:23Z
**Depth:** standard
**Files Reviewed:** 16
**Status:** issues_found

## Summary

Reviewed the requested v1.34 Workshop Provider Checker Parity files only, with focus on public privacy redaction, runtime-service boundary ownership, cache correctness, stale validation behavior, and Rust/Zig unavailable-toolchain handling. The implementation has several boundary defects that can publish incorrect checker state or fail unavailable-service flows.

## Critical Issues

### CR-01: Stale Runtime-Service Validation Can Be Accepted As Current

**Severity:** BLOCKER
**File:** `apps/web/app/api/workshop/validate/route.ts:137`
**Issue:** `normalizeRuntimeServiceResponse` only checks `kind`, `sourceFormat`, and the rough validation-report shape before returning `checker` and `validation`. It never verifies that `result.validation.sourceHash` and `result.validation.sourceBytes` match the submitted `source` from lines 138-140. A stale or buggy runtime-service response for a different source can therefore be cached under the current source key and shown as `ready`, enabling the UI to treat the current draft as validated even though the checker envelope describes another source.
**Fix:** Fail closed unless the runtime-service validation identity matches the request before creating the checker response.

```ts
if (
  result.validation.sourceHash !== hashSource(source) ||
  result.validation.sourceBytes !== sourceBytes(source)
) {
  return unavailableResponse(sourceFormat, source, "system_unavailable")
}
```

Also add a route test where runtime-service returns a valid report with a mismatched hash/byte count and assert `system_unavailable`.

### CR-02: Public Checker Provenance Is Marked Valid By Object Presence Alone

**Severity:** BLOCKER
**File:** `packages/spec/src/workshop-checker.ts:455`
**Issue:** `createWorkshopCheckerResponse` treats any object-shaped `metadata.providerValidation` as valid provenance at lines 479-484 and 513-518. It does not compare provider id, contract version, source hash/bytes, artifact hash/bytes, or proof state against the validation report and artifact metadata. This can publish `provenance.state: "valid"` and `providerProofState: "valid"` for stale or mismatched provider proof metadata, which defeats the public audit contract.
**Fix:** Derive provenance states from explicit field matching. At minimum, require provider id/contract, `sourceHash`, `sourceBytes`, `artifactHash`, and `artifactBytes` to match before returning `valid`; otherwise use `mismatched` or `missing`.

```ts
const providerValidationMatches =
  providerValidation?.providerId === providerId &&
  providerValidation.contractVersion === providerContractVersion &&
  providerValidation.sourceHash === input.validation.sourceHash &&
  providerValidation.sourceBytes === input.validation.sourceBytes &&
  providerValidation.artifactHash === artifact.hash &&
  providerValidation.artifactBytes === artifact.bytes
```

Add tests for mismatched provider proof metadata and stale artifact metadata.

### CR-03: Runtime-Service Submit Path Does Not Fail Calmly When Service Is Down

**Severity:** BLOCKER
**File:** `apps/web/app/api/workshop/revisions/route.ts:22`
**Issue:** `runtimeServiceValidateStrategy` handles a missing `COWARDS_RUNTIME_SERVICE_URL`, but it does not catch `fetch` failures or malformed/non-JSON runtime-service responses at lines 22-27. Because `POST` calls it before the `workshopServer.submitSource` try/catch at lines 71-77, a configured but stopped runtime-service produces an unhandled exception/500 instead of the same calm 503 boundary behavior used by the validation route.
**Fix:** Wrap the fetch and JSON parse path, returning `{ error: "<label> submission could not reach runtime-service provider validation. The Strategy has not been judged invalid." }` for network failures and a public system-unavailable message for malformed responses. Add route tests for rejected `fetch` and invalid JSON.

## Warnings

### WR-01: Public Diagnostic Redaction Misses Common Private Field Spellings

**Severity:** WARNING
**File:** `packages/spec/src/workshop-checker.ts:384`
**Issue:** `sanitizePublicCheckerText` redacts `StrategyMemory`, `SoldierMemory`, and `objectivePayload`, but misses lower-camel and snake-case forms such as `strategyMemory`, `soldierMemory`, `strategy_memory`, `soldier_memory`, and `objective_payload`. Runtime and sample payloads use lower-camel field names, so a provider diagnostic containing those terms would be copied into public checker diagnostics at lines 405-410.
**Fix:** Replace the exact-case substitutions with a case-insensitive denylist that covers canonical, lower-camel, snake-case, and spaced variants. Extend the redaction test to assert none of those field spellings survive serialization.

### WR-02: Rust/Zig Toolchain-Unavailable Handling Is Inconsistent Between Proof Script And Test

**Severity:** WARNING
**File:** `scripts/evaluate-v1-34-workshop-checker.test.ts:14`
**Issue:** The proof script intentionally accepts both `ready` and `toolchain_unavailable` for language checks at `scripts/evaluate-v1-34-workshop-checker.ts:203`, but the test requires every result to be `ready`. On machines or CI workers without Rust or Zig WASI toolchains, the implementation’s intended calm unavailable path becomes a failing test.
**Fix:** Align the test with the proof contract. Assert TypeScript/Python are `ready`; allow Rust/Zig to be either `ready` or `toolchain_unavailable`, and when unavailable assert the diagnostic category/actionability reports toolchain installation guidance.

---

_Reviewed: 2026-06-14T17:53:23Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
