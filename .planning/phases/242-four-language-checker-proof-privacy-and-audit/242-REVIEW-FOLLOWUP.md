---
phase: 242-four-language-checker-proof-privacy-and-audit
reviewed: 2026-06-14T18:04:39Z
depth: follow-up
files_reviewed: 11
files_reviewed_list:
  - apps/web/app/api/workshop/validate/route.ts
  - apps/web/app/api/workshop/validate/route.test.ts
  - apps/web/app/api/workshop/revisions/route.ts
  - apps/web/app/api/workshop/revisions/route.test.ts
  - packages/spec/src/workshop-checker.ts
  - packages/spec/src/workshop-checker.test.ts
  - apps/web/app/workshop/workshop-client-state.ts
  - apps/web/app/workshop/workshop-client.tsx
  - apps/web/app/workshop/workshop-client.test.tsx
  - apps/web/app/globals.css
  - scripts/evaluate-v1-34-workshop-checker.test.ts
findings:
  critical: 1
  blocker: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 242: Follow-Up Code Review Report

**Reviewed:** 2026-06-14T18:04:39Z
**Depth:** follow-up
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Follow-up scope was limited to the previous v1.34 findings in `242-REVIEW.md` plus the prior UI top submit/stale/warning issues. CR-01, CR-03, WR-01, WR-02, and the UI submit/stale/warning issues are resolved. CR-02 is only partially fixed: matching provider/source/artifact fields are checked, but missing proof material and stale artifact source identity can still be published as valid provenance.

Focused verification run:

- `pnpm --dir apps/web exec vitest run app/api/workshop/validate/route.test.ts app/api/workshop/revisions/route.test.ts app/workshop/workshop-client.test.tsx` - passed, 3 files / 22 tests.
- `pnpm --filter @cowards/spec test -- workshop-checker.test.ts` - passed, 5 files / 61 tests.
- `pnpm exec vitest run scripts/evaluate-v1-34-workshop-checker.test.ts` - passed, 1 file / 1 test.

Note: an initial broad `pnpm --filter @cowards/web test -- ...` invocation expanded to unrelated web tests and hit an existing timeout in `app/workshop/server.test.ts`, which is outside this follow-up file list. The direct scoped web command above passed.

## Resolution Matrix

| Prior item | Status | Evidence |
| --- | --- | --- |
| CR-01 stale runtime-service validation accepted as current | RESOLVED | `apps/web/app/api/workshop/validate/route.ts:151` now rejects validation reports whose `sourceHash` or `sourceBytes` differ from the submitted source, and `apps/web/app/api/workshop/validate/route.test.ts:126` covers the stale identity case. |
| CR-02 public checker provenance marked valid by object presence | PARTIAL / BLOCKER REMAINS | `packages/spec/src/workshop-checker.ts:403` now compares provider id, contract version, source hash/bytes, and artifact hash/bytes, but it does not require a proof value or compare artifact source identity. |
| CR-03 submit path fails as 500 when runtime-service is down | RESOLVED | `apps/web/app/api/workshop/revisions/route.ts:31` catches fetch failures, `apps/web/app/api/workshop/revisions/route.ts:41` catches malformed JSON, and `apps/web/app/api/workshop/revisions/route.test.ts:23` / `:37` cover both paths. |
| WR-01 public diagnostic redaction misses private field spellings | RESOLVED | `packages/spec/src/workshop-checker.ts:384` redacts camel, Pascal, snake, and spaced variants for strategy memory, soldier memory, and objective payload; `packages/spec/src/workshop-checker.test.ts:130` verifies common private spellings are absent. |
| WR-02 Rust/Zig unavailable test is stricter than proof contract | RESOLVED | `scripts/evaluate-v1-34-workshop-checker.test.ts:23` allows Rust/Zig `ready` or `toolchain_unavailable` while still requiring TypeScript/Python `ready`. |
| UI top submit/stale/warning issues | RESOLVED | `apps/web/app/workshop/workshop-client-state.ts:188` requires valid validation plus matching ready checker and non-checking/non-submitting state; `apps/web/app/workshop/workshop-client.tsx:909` renders the required stale warning copy; `apps/web/app/globals.css:295` adds warning styling for stale/unavailable blocks. |

## Critical Issues

### CR-FU-01: Provider Proof Can Still Be Marked Valid Without Proof Or Current Artifact Identity

**Severity:** BLOCKER
**File:** `packages/spec/src/workshop-checker.ts:403`
**Issue:** CR-02 is not fully resolved. `providerValidationMatches` returns true when provider id, contract version, source hash/bytes, and artifact hash/bytes match, but it never verifies that `providerValidation.proof` exists. Because `createWorkshopCheckerResponse` uses `proofMatches` to set both `provenance.state` and `providerProofState` to `valid` at `packages/spec/src/workshop-checker.ts:513` and `:548`, a metadata object with no signing proof can still publish `providerProofState: "valid"`. The same path also ignores the artifact metadata's own source identity (`sourceArtifact.sourceHash/sourceBytes` or `compiledArtifact.sourceHash`), so an artifact object that claims it was built from a stale source can still be reported as present with valid provenance when the detached `providerValidation` fields match. This preserves the core public audit defect from CR-02 for missing proof and stale artifact metadata cases.

**Fix:** Include proof presence and artifact source identity in the provenance match before returning `valid`; otherwise return `mismatched` or `missing`. Add tests for missing `providerValidation.proof` and artifact metadata whose source identity differs from `input.validation`.

```ts
const artifactSourceMatches =
  sourceFormat === "rust" || sourceFormat === "zig"
    ? stringValue(artifactRecord?.sourceHash) === input.validation.sourceHash
    : stringValue(artifactRecord?.sourceHash) === input.validation.sourceHash &&
      numberValue(artifactRecord?.sourceBytes) === input.validation.sourceBytes

const providerValidationMatches =
  providerValidation !== null &&
  stringValue(providerValidation.proof) !== null &&
  artifactSourceMatches &&
  stringValue(providerValidation.providerId) === providerId &&
  stringValue(providerValidation.contractVersion) === providerContractVersion &&
  stringValue(providerValidation.sourceHash) === input.validation.sourceHash &&
  numberValue(providerValidation.sourceBytes) === input.validation.sourceBytes &&
  stringValue(providerValidation.artifactHash) === artifact.hash &&
  numberValue(providerValidation.artifactBytes) === artifact.bytes
```

---

_Reviewed: 2026-06-14T18:04:39Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: follow-up_
