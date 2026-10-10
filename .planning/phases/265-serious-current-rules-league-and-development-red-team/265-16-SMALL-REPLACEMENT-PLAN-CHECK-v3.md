# Phase 265 Plan 16 Small Replacement — Plan Check v3

**Status:** VERIFICATION PASSED — original verification-command warning resolved by bounded command-only amendment  
**Plan checked:** `265-16-SMALL-REPLACEMENT-PLAN-v1.md`  
**Boundary:** Read-only plan/source inspection. No tests, runtime, Strategy, provider, Match, allocation, or source edits.

## Goal-backward result

The approved small replacement remains a four-probe, zero-Match private runtime-feasibility diagnostic; it does not satisfy LEAG-01–09, establish a current-rules baseline/freeze, or complete Phase 265. The plan preserves that boundary, the one-correction limit, carried historical charges/files/time, privacy, and all resource/time ceilings. Its three tasks have files, actions, automated verification, acceptance criteria, and done conditions; the output inventory, six notes, and conditional v2 allocation are enumerated. `requirements: []` correctly avoids implying league coverage.

## v2 blockers rechecked

1. **Committed allocation and durable debit authority — resolved.** Task 1 specifies one authority module/API that opens the private store with no-follow descriptor checks, authenticates canonical allocation bytes against the bounded `git show <allocationCommit>:<path>` result and fixed pre-allocation source commit, requires a WeakMap-issued same-process capacity receipt, then appends/fsyncs/reopens the exact next debit and binds the issued capability to its authenticated digest and offset. It rejects caller-provided roots/records and invalidates on partial or uncertain I/O. Task 3 specifies the non-circular commit order: allocation contains the pre-allocation `sourceHead`; the allocation artifact is committed as its child; `allocationCommit` is recorded in the private entry. v2 is limited to the one reviewed correction with a new root/store. This is sufficiently concrete as a plan contract without requiring the implementation to add another authority carrier.

2. **Factory override bypass — resolved.** Task 2 expressly requires `Reflect.has(options, "createRuntime")` rejection for any own, inherited, undefined, or accessor property, before claim/construction; it also requires mixed-mode and injected transport/session paths to reject, with explicit negative tests and a positive real-isolated-provider path. Current factory source has an optional `createRuntime` constructor override and existing authority branches already reject it; the planned probe branch closes the omission. The current session's `matchId` use is limited to binding equality, safe-identity validation, and the opaque returned session property, so the planned `executionOwnerId` transport mapping does not inherently fabricate Match/kernel state.

## Amendment audit and resolved advisory

The initial v3 review recorded this warning: Task 3's original `pnpm exec tsc --noEmit` used root `tsconfig.json`, which has `files: []` and only app/package project references and does not include `scripts/`; it therefore did not typecheck the new runner or modified `scripts/lib` modules. The focused Vitest command remains consistent with the existing target tests, which import Vitest.

ROOT then made only the exact-command correction in the still-unconsumed PLAN-v1: Task 3 now runs the focused Vitest suite, `pnpm exec tsc -b`, and a strict `tsc --ignoreConfig` explicit-file command listing all ten planned TypeScript source/test files with NodeNext resolution, strict flags, and `--skipLibCheck`. It separately requires baseline diagnostics on the eight existing files and final diagnostics on all ten, treats inherited diagnostics as NOTPASS/unwaived, and blocks on any new diagnostic. This closes the warning at the plan-contract level; no tests/typechecks were run by this checker.

## Other checks

- Requirement metadata leaves all nine LEAG requirements pending; there is no uncovered requirement falsely claimed as delivered by this diagnostic.
- Three tasks and ten source/test files remain bounded. Task 3 explicitly enumerates the exact allocation artifact(s), six notes, and private-store paths; no unrelated helper/proof-carrier family is introduced.
- Dependencies are a supplement to existing Plan 265-16 with no internal cycle stated.
- The authority path adds a dedicated no-Match capability but keeps the existing Match authority issuer/default path unchanged; the planned no-Match identity and source/session seams are explicit enough to implement and test through the real isolated provider.
- The bounded amendment changes only verification commands/disposition, not source scope, authority design, outputs, or approvals.
- Architectural Responsibility Map: SKIPPED (none supplied for this supplement). Nyquist/Pattern checks: not applicable to this replacement-plan check from supplied artifacts.

## Structured issues

```yaml
issues: []
```

**Recommendation:** The two v2 blockers are closed and the sole v3 warning is resolved by the command-only amendment. Plan verification passes; execution must honor the diagnostic baseline/final comparison and must not waive inherited diagnostics or proceed on any new one.
