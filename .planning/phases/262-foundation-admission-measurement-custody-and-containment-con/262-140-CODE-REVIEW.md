---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "140"
reviewed: 2026-08-31T05:59:46Z
reviewed_head: 0ccfbae4
subject_commits:
  - 6e5eb3296525be02a695e77ae0cadd90334df22f
  - c5f543b36d091efac24e57dc01df01025e2e7701
  - ebf8d82454ec5af310744f536b18ed79eb1ffece
summary_commit: b8eea75beda47064ee586f3460aed5f9328be1da
tracking_commit: 0ccfbae478a42a424643c1faa9ffbf4a20867db0
depth: deep
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-140-live-v13-custody-v9.ts
  - scripts/check-v1-38-plan-262-140-live-v13-custody-v9.test.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Phase 262 Plan 140: Code Review Report

**Reviewed:** 2026-08-31T05:59:46Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The archived Plan 133 source/test pins, current 141-entry repository closure root, ordered helper-v6/owner-lock C tuples, six canonical mode/ordinal/reduced-value records, and eleven named final destinations match the Plan 140 summary. The source-only selector also reproduced closure root `sha256:e5f374491ec0a93855b0bc2b195356a908af6774865ae408601cbed4aa7afdd4` with 141 entries while keeping Plan 141 and Plan 110 false. However, the claimed executor closure does not authenticate the semantic implementation bytes actually used by `tsx` and TypeScript, the exported authentication gate launders a trusted transcript across unrelated supplied roots without authenticating that root, and the no-follow absence gate follows intermediate symlinks. These are three independent trust-boundary failures, so Plan 141 publication must remain ineligible.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The executor root omits runtime implementation bytes that can change all six executions

**File:** `scripts/check-v1-38-plan-262-140-live-v13-custody-v9.ts:233-246,276-278,292-317,352-356`

**Issue:** `installedRuntime` hashes the Node executable, the generated `.bin/tsx` shell launcher, and the `package.json` files for `tsx` and TypeScript. It does not hash the code those identities execute. In this installation the launcher executes `node_modules/tsx/dist/cli.mjs`, which imports additional `tsx` chunks and `esbuild`; the archived Plan 133 source also imports `typescript`, which resolves to `node_modules/typescript/lib/typescript.js`. Neither `typescript.js`, `tsx/dist/cli.mjs`, its transitive chunks, `esbuild`'s JavaScript/native implementation, nor their resolved dependency closure is in `installedRuntime.files` or the 141 repository-entry closure. `runExactExecutor` then symlinks the mutable canonical `node_modules` tree and executes through it. Although Plan 133 reports a path-dependent installed-closure root, `validateGenuine` discards that root when constructing the stable record, so changing these implementation bytes can change or fabricate the six executions while leaving Plan 140's executor-closure root and every stable v9 root unchanged. This defeats the exact executor closure and genuine-to-stable binding required to repair ea9baf0e CR-01.

**Fix:** Resolve the exact runtime graph before execution and content-address every semantic implementation file, at minimum the resolved TypeScript entry/closure, `tsx` CLI plus every local chunk, `esbuild` JavaScript package and selected native executable, the generated launcher, and Node. Place the sorted path-independent identities in `installedRuntimeRoot`, copy those exact bytes into the private execution root rather than symlinking mutable canonical dependencies, no-follow verify them immediately before and after each child, and bind that root into every stable record. Add attacks that alter `typescript/lib/typescript.js`, a transitive `tsx` chunk, and the selected `esbuild` binary while leaving package manifests and the launcher unchanged.

### CR-02: A transcript built under one repository is accepted as authenticated under an unrelated supplied root

**File:** `scripts/check-v1-38-plan-262-140-live-v13-custody-v9.ts:361-390,439-448`

**Issue:** `trusted` records only JavaScript object identity. `buildV138Plan140ProspectiveV9ForReview` authenticates and executes one root, but stores no private root-specific authentication context. `authenticateV138Plan140ProspectiveV9BatchForReview(values, rootInput)` never creates a history snapshot, authenticates the executor/closure/runtime for `rootInput`, or proves the value came from that root; it only checks the eleven effect destinations, validates self-consistent public roots, and consults the process-global `WeakSet`. A targeted proof built the genuine transcript in the repository, created an unrelated empty temporary directory, and passed that directory as `rootInput`; the function returned `[{"accepted":true}]`. A good-root transcript can therefore be laundered through a missing, rewritten, or otherwise ineligible root, contradicting fresh supplied-root authentication and the anti-laundering gate.

**Fix:** Do not make acceptance depend on a process-global `WeakSet`. For every supplied root, create a fresh immutable history/runtime snapshot, rederive the exact closure and runtime roots, execute or verify a root-bound private nonce/transcript inside that snapshot, and compare the resulting private authentication handle with the candidate. If cross-root deterministic public output is required, keep the public roots path-independent but keep a private unexported authentication record keyed by the canonical root identity and snapshot head; reject a value authenticated for any other root. Add a test that builds at root A and authenticates at empty, rewritten, and dependency-drifted roots B.

### CR-03: The no-follow effect gate follows symlinked ancestors and accepts redirected destinations

**File:** `scripts/check-v1-38-plan-262-140-live-v13-custody-v9.ts:110-129`

**Issue:** The eleven final path names are complete, and `lstatSync` correctly detects a symlink at the final component. But `lstatSync(absolute)` follows every intermediate component. A targeted proof created a root whose `.planning` component was a symlink to an empty external directory; `checkV138Plan140EffectPathsAbsentForReview(root)` returned `true`. The same bypass works at `.planning/artifacts` or another ancestor. Thus the advertised lstat/no-follow gate can be redirected outside the authenticated repository and treats all eleven canonical destinations as absent instead of failing closed. The existing test covers only a dangling symlink at the final destination and misses ancestor substitution.

**Fix:** Open the canonical repository root as a directory descriptor and walk every path component with no-follow directory semantics (for example `openat`/native helper custody), rejecting symlinks and non-directories at every ancestor; only exact `ENOENT` at the final component should mean absent. Bind the root directory identity across the walk and repeat immediately before returning. Add one attack for symlink substitution at `.planning`, `.planning/artifacts`, and the private-directory ancestor, including concurrent swaps and inaccessible/non-directory components.

## Verification Performed

- Read Plan 140, its summary/tracking closure, the complete Plan 140 source/test, Plan 138 review ea9baf0e, and the exact archived Plan 133 executor source/test.
- Recomputed the Plan 140 source/test SHA-256 values and verified the recorded blobs and commits.
- Ran the source-only selector and independently confirmed the current 141-entry closure root, zero effects, and false Plan 141/Plan 110 authority.
- Traced the exact installed runtime resolution: TypeScript resolves to `node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/lib/typescript.js`; the `.bin/tsx` launcher invokes the unrooted `tsx/dist/cli.mjs` graph.
- Demonstrated the intermediate-ancestor symlink bypass: an empty external directory reached through a `.planning` symlink was accepted.
- Demonstrated cross-root laundering: a trusted genuine transcript built under the repository was accepted by the batch authenticator with an unrelated empty directory as its supplied root.
- Ran `git diff --check`. The full approximately 507-second happy-path suite was not repeated because the two targeted runtime proofs and the static omitted-runtime trace establish the blockers directly.
- Confirmed no source or effect artifact was modified.

---

_Reviewed: 2026-08-31T05:59:46Z_
_Reviewer: gsd-code-reviewer_
_Depth: deep_
