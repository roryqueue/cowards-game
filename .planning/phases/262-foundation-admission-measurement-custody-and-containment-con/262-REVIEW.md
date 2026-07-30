---
phase: 262-foundation-admission-measurement-custody-and-containment-con
reviewed: 2026-07-30T13:20:37Z
depth: deep
files_reviewed: 4
files_reviewed_list:
  - scripts/check-v1-37-audit-reproduction.ts
  - scripts/evaluate-v1-38-foundation-contract.test.ts
  - scripts/lib/v1-38-foundation-admission.ts
  - scripts/lib/v1-38-current-matrix-reproduction.ts
findings:
  critical: 5
  warning: 1
  info: 0
  total: 6
status: issues_found
---

# Phase 262: Code Review Report

**Reviewed:** 2026-07-30T13:20:37Z
**Depth:** deep
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The reviewed implementation does not yet enforce Phase 262's fail-closed evidence boundary. A caller can synthesize a passing foundation admission from mutually consistent but unverified fields, the matrix consumes an unverified admission root, legitimate stopped calibration evidence cannot pass the successor checker, the retained audit subprocess inherits code-injection environment variables, and receipt publication has a check-then-rename overwrite race. The tests exercise single-field mutations and the already-observed preflight-refusal branch, but omit the paired-forgery and admitted-preflight/calibration-failure cases that expose the first three contract defects.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Foundation admission accepts self-consistent forged authority

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-foundation-admission.ts:483-570`

**Issue:** `evaluateV138FoundationAdmission` treats pairs of caller-provided values as if one side were independently resolved authority. It accepts `joinSha256 === resolvedJoinSha256`, `tagObject === resolvedTagObject`, equal readiness hashes, and `sha256 === expectedSha256`; it never resolves those values itself. The resolver compounds the source-binding problem by assigning `expectedSha256: digest` from the same current bytes at lines 931-940. A caller can change both halves of each pair, recompute the public roots, and receive `status: "passed_exact"` from the exported evaluator without proving the Git tag, retained audit, readiness artifact, source bytes, or correction commits. This violates the exact immutable predecessor join and makes the resulting `admissionRoot` non-authoritative.

**Fix:**
```ts
export const evaluateV138FoundationAdmission = (
  value: unknown,
  trusted: Readonly<V138FoundationAdmissionInput>,
): V138FoundationAdmissionResult => {
  if (canonicalSha256(value) !== canonicalSha256(trusted)) {
    return stopped("SOURCE_BINDING_DRIFT", value)
  }
  // Evaluate only the independently resolved trusted graph.
  const input = trusted
  // ...
}
```

Resolve `trusted` from Git objects and the retained audit inside the same authority-owning operation (or make the pure evaluator non-exported). Replace dynamically copied `expectedSha256` values with immutable expected identities or producing-Git-object checks. Add a regression that mutates both members of every “actual/resolved” pair and recomputes all dependent roots; it must stop.

### CR-02: Matrix execution trusts any syntactically valid admission root

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:1828-1839`

**Issue:** `admissionRoot` parses `.planning/artifacts/v1.38-foundation-admission.json` and checks only `status === "passed_exact"` plus the hash string format. It does not validate the receipt schema, recompute its root, compare its bytes to the authoritative generated receipt, or call the foundation admission checker. Replacing the artifact with `{"status":"passed_exact","admissionRoot":"sha256:..."}` is sufficient to enumerate all 540 attempts and bind every later calibration/reproduction receipt to an invented foundation. `deriveV138HistoricalMatrixExpectation` has the same partial-object trust pattern at lines 253-264.

**Fix:**
```ts
const admission = checkV138FoundationAdmissionReceipt(repoRoot)
return admission.admissionRoot
```

Use the fully verified receipt for both matrix enumeration and historical expectation derivation, and require byte-exact canonical persisted content. Add a mutation test covering a minimal forged receipt, a recomputed-root forged receipt, and a receipt copied from a different checkout.

### CR-03: A legitimate post-preflight calibration failure is unverifiable

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:6323-6339`

**Issue:** `buildV138ParallelCalibrationV4Receipt` correctly represents two stopped branches: preflight refusal has `calibration: null`, while an admitted preflight followed by runner/resource failure has a non-null calibration, terminal outcomes, and `terminal_calibration_outcome` charges. `checkV138SuccessorV4V5Branch`, however, accepts a stopped receipt only when the former shape is present. Every legitimate calibration failure after an admitted preflight is rejected as `MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN`. That makes immutable charged failure evidence impossible to verify and encourages dropping the very terminal outcomes ADMIT-03 requires to remain charged.

**Fix:**
```ts
if (calibration.status === "stopped_process_failure") {
  if (reproductionInput !== undefined || !calibration.executionAuthorization.expired) {
    throw new TypeError("MATRIX_STOPPED_CALIBRATION_V5_FORBIDDEN")
  }
  if (preflight.disposition === "preflight_refused") {
    assertPreflightRefusalShape(calibration)
  } else {
    assertTerminalCalibrationFailureShape(calibration)
  }
  return deepFreeze({ calibration, reproduction: null })
}
```

The terminal-failure assertion must require the exact eight declared charged identities, exact terminal/accounting roots, zero accepted cells, no v5 artifact, and expired authorization without requiring empty terminals.

### CR-04: Exact audit reproduction permits inherited Node code injection

**Classification:** BLOCKER

**File:** `scripts/check-v1-37-audit-reproduction.ts:288-292`

**Issue:** The retained audit subprocess receives `env: process.env`. Variables such as `NODE_OPTIONS` can preload arbitrary modules before the hash-pinned reproducer runs; loader- and tsx-related environment can also change execution. Hashing the source file does not prove that only that source established the observations when the process bootstrap is ambient and mutable. This breaks the exact-reproduction and no-new-authority boundary and is especially unsafe in CI or developer shells containing inherited Node options.

**Fix:**
```ts
const childEnv = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "",
  LANG: "C",
}
const command = spawnSync(process.execPath, ["--import", "tsx", paths.reproduction], {
  cwd: repoRoot,
  encoding: "utf8",
  env: childEnv,
})
```

Use the smallest documented allowlist, explicitly excluding `NODE_OPTIONS`, `NODE_PATH`, loader hooks, and tsx configuration variables. Prefer resolving and pinning the loader entry point rather than relying on ambient package resolution. Add a regression with a hostile preload variable and prove it is not executed.

### CR-05: Fresh-only receipt publication can overwrite immutable evidence in a race

**Classification:** BLOCKER

**File:** `scripts/lib/v1-38-current-matrix-reproduction.ts:4076-4086,6552-6561`

**Issue:** Writers call `exactSuccessorTarget`, which checks `existsSync`, then later publish with `renameSync`. On POSIX, rename replaces an existing destination. A competing process can create or seal the canonical artifact after the freshness check and before rename, and this writer will silently overwrite it. That is a data-loss and evidence-custody defect for charged, single-use receipts. The temporary filename is also only PID-scoped and is not cleaned up when publication fails.

**Fix:**
```ts
const bytes = `${canonical(receipt)}\n`
writeFileSync(targetPath, bytes, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx",
})
```

If temporary-file durability is required, create a unique temporary file with exclusive creation, fsync it, and publish with a no-replace primitive (for example an exclusive hard link) that fails when the target exists; then fsync the directory and remove the temporary file in `finally`. Do not use a replacing rename for sealed artifacts.

## Warnings

### WR-01: Contract tests omit the adversarial combinations required by the authority model

**Classification:** WARNING

**File:** `scripts/evaluate-v1-38-foundation-contract.test.ts:211-296,1397-1689`

**Issue:** Admission mutation tests change only one member of each duplicated actual/resolved pair, so they prove mismatch detection but not authority. The v4/v5 tests cover admitted calibration and preflight refusal but do not pass a stopped calibration produced after an admitted preflight through `checkV138SuccessorV4V5Branch`. Consequently the suite remains green while CR-01 and CR-03 are reachable. This materially weakens test reliability at the phase's binding fail-closed boundary.

**Fix:** Add paired-forgery tests that mutate both sides and recompute dependent hashes, plus a runner-failure/resource-failure calibration test that asserts the stopped receipt is verifiable, all eight identities remain charged, authorization is expired, accepted cells remain zero, and reproduction:v5 is absent.

---

_Reviewed: 2026-07-30T13:20:37Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
