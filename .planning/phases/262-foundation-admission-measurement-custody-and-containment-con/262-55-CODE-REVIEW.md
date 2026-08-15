---
phase: 262-foundation-admission-measurement-custody-and-containment-con
plan: "55"
reviewed: 2026-08-15T03:00:44Z
depth: deep
reviewed_commits:
  - bc0150b1156ed97599fe7c5125768cd821e60b04
  - ea385f22db3f200f76f1585c7e0280ad631404f4
files_reviewed: 2
files_reviewed_list:
  - scripts/check-v1-38-plan-262-55-source-completeness-review.ts
  - scripts/check-v1-38-plan-262-55-source-completeness-review.test.ts
findings:
  critical: 8
  warning: 1
  info: 0
  total: 9
status: issues_found
---

# Phase 262 Plan 55: Code Review Report

**Reviewed:** 2026-08-15T03:00:44Z
**Depth:** deep
**Files Reviewed:** 2
**Status:** issues_found

## Summary

The checker is not an independent, closed verifier of the Plan-262-55 verdict. Its central identities and manifests are hardcoded, its command evidence is synthesized from one aggregate test exit, and `--check-review` accepts the artifact's own unvalidated proof object as the evidence used to recompute that artifact. A direct adversarial invocation produced `findingCount: 0` and `sourceCompletenessPassed: true` from a proof that named an all-zero A7, command `never-ran`, a negative output length, invalid digest strings, unequal before/after roots, and a hardcoded `canonicalWorkspaceUnchanged: true`.

The canonical tests and canonical `--check-review` command pass, but they do not establish the advertised trust properties. In particular, the mutation tests accept the same fabricated proof shape and mostly demonstrate that an unrecomputed hash changes, not that semantic mutations are detected.

## Critical Issues

### CR-01: Forged aggregate proof is accepted as real CLI execution

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:177-197,223-234,257-258,325-327`

**Issue:** `deriveReview` accepts a caller-supplied proof without validating its command, A7, byte length, digest format, or snapshot equality. It trusts the boolean `canonicalWorkspaceUnchanged` and `cleanupComplete`, then copies the same aggregate exit/digest/root values into every command record while setting `observedEffectClass` equal to the expected value. `--check-review` feeds the artifact's own `exactA7DisposableCliProof` back into this derivation instead of executing or independently authenticating it. Therefore a self-authored artifact can claim real execution without any execution evidence. This was reproduced with `command: "never-ran"`, all-zero `exactA7`, `stdoutByteLength: -9`, `stdoutSha256: "forged"`, unequal roots, and still obtained a validated zero-finding PASS.

**Fix:** Define and exactly validate a proof schema, require `exactA7 === custody.a7`, validate digest/root formats and byte bounds, derive unchanged state from exact root equality, and consume structured per-command records emitted by an independently run fixture. `--check-review` must rerun the proof or authenticate a committed, immutable execution transcript; it must never use the candidate artifact as its own evidence source.

### CR-02: The closed command and symbol inventory is hardcoded and only checked lexically

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:33-52,127-131,218-239`

**Issue:** The purported independently derived command and disposition manifest is a literal table. Reachability is reduced to `production.includes(command) && production.includes(handler)`, and test evidence is a string occurrence count. The derived symbol list is merely recorded and is never compared with a required inventory. The checker never parses or compares `V138_RECEIPT_DIRECT_COMMANDS`, `V138_ROUTE_7_SOURCE_MANIFEST`, or actual `runReceiptCli` command-to-handler branches. A concrete discrepancy already exists: production's `V138_ROUTE_7_SOURCE_MANIFEST` names `writeV138ExecutionContextV11Receipt` for `--write-execution-context-v11-receipt`, while the checker records `writeV138Plan26257RouteStartV1`; no finding is emitted. Missing exports, dead parser branches, decoy string literals, altered prerequisites, destinations, side effects, or disposition mappings can therefore pass.

**Fix:** Parse/import the exact A7 module in an isolated fixture, derive and compare the direct-command set, route manifest, exports, and actual dispatch branches, and capture the handler reached for each argv. Treat every missing, extra, duplicate, conflicting, or unreachable entry as a finding.

### CR-03: Git custody is asserted from constants instead of derived from history

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:15-18,87-124,202-216`

**Issue:** `SOURCE_BASE7`, `A7`, and the author trailer are hardcoded expected results. Although the checker computes `selectorIntroducingCommit`, it never validates or uses it to establish the first post-262-53 RED commit, its sole parent, or the maximal contiguous four-path author-run. The recorded selector commit is `85833c08...`, while the asserted range begins after `be2a7164...`; that unexplained mismatch is accepted. Likewise, `summaryDescendants` is only the last commit touching the summary and the sole check is that the array is nonempty. It is not proven to descend from A7, be planning-only, or be outside the source run. SourceBase7's sole-parent shape and A7 maximality are also not checked.

**Fix:** Start from a validated Plan-262-53 boundary, locate the exact RED-introducing commit, derive its sole parent as sourceBase7, walk the maximal contiguous single-parent/same-trailer/four-path run to derive A7, and then compare the summary claims. Verify ancestry and changed paths for every later summary/review commit rather than accepting any commit that touched the path.

### CR-04: Protected-history evidence is copied, not independently verified

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:148-174,240-247`

**Issue:** A6/B6 and all local-seal, policy, gameplay/runtime/privacy, formation, predecessor, and protected-history roots are copied verbatim from the Plan-262-47 failure JSON. The checker verifies only the exact key names. The forty charges check accepts any forty distinct values, regardless of type or required attempt IDs. Prior authorizations are whatever currently tracked filenames happen to match a regex; their expected path set, committed bytes, lineage, package/lock/config blobs, and roots are never independently derived or compared. Thus a coherently rewritten historical artifact can silently redefine every protected root and still yield PASS.

**Fix:** Validate the Plan-262-47 artifact against its schema and committed identity, derive every protected root from the authoritative committed inputs, compare the exact forty expected charge IDs, enforce the exact prior-authorization inventory and bytes, and bind the required package, lockfile, config, policy, gameplay, runtime, privacy, and formation blobs.

### CR-05: Canonical-state preservation covers only ten leaf paths and hardcodes cleanup success

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:134-146,177-197,248-257`

**Issue:** The value named `canonicalWorkspaceUnchanged` snapshots only ten route-7/auth/seal leaf paths. It does not snapshot the canonical workspace, protected historical artifacts, source/test/package/config bytes, or other live destinations required by the plan. `cleanupComplete` is set to `true` unconditionally after Vitest exits; no disposable fixture identity or cleanup result is observed. A test can mutate any unsnapshotted canonical byte, leave temporary state behind, or recreate the same leaf contents after a transient canonical write and the checker will report unchanged/clean.

**Fix:** Build a closed before/after inventory covering every protected and canonical path plus repository status/tree identities, record the actual fixture directory, verify its removal with `lstat`, and capture write events so transient canonical writes cannot be hidden by restoration.

### CR-06: Review publication is mutable and is not bound to immutable Git custody

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:299-303,321-346`

**Issue:** The checker verifies current worktree bytes only. It does not derive the commit that introduced the artifact/report, prove a direct post-A7 review-only commit, bind blob OIDs, or reject later modifications. The public `--refresh-review` mode overwrites both supposedly frozen files without exclusive creation or a pre-publication gate. History demonstrates the problem: `bc0150b1` added the checker, test, artifact, and report in one four-path commit, then `ea385f22` modified the already committed artifact and report. This contradicts the claimed immutable one-root publication and permits later rewriting while retaining a passing recomputation.

**Fix:** Remove the overwrite mode. Publish with exclusive creation only after proof completion, commit the evidence under a specified commit-shape contract, and make verification derive and require the unique introducing commit/blob OIDs with no later modifications. Keep corrective evidence in a new version/path rather than rewriting the frozen review.

### CR-07: Reviewer separation is a string inequality, so `reviewer_separated: true` overclaims identity evidence

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:13-18,259-270,299-303`

**Issue:** `reviewerSeparated` is computed only as inequality between two hardcoded labels. The report then unconditionally renders `reviewer_separated: true` and claims a fresh reviewer context and independently authored checker. No Git, process, agent-run, or procedural custody evidence supports those statements; the initial commit combines checker source, tests, artifact, and report. Setting the independent-person and cryptographic flags false avoids those stronger claims but does not make the procedural-separation claim true.

**Fix:** Either record no reviewer-separation claim (`reviewerSeparated: false`/unknown) or bind it to objective workflow evidence that the source author and reviewer contexts are distinct. Render the value from verified evidence, never as a literal `true`.

### CR-08: Path and symlink handling permits noncanonical verification and out-of-repository overwrite

**Classification:** BLOCKER

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.ts:104-110,148-166,321-343`

**Issue:** `--check-review` accepts arbitrary relative or absolute paths after only checking that the flags exist, so identical external copies can be presented as if the canonical artifact/report were checked. Reads of source, failure, authorization, artifact, and review paths follow symlinks without repository confinement or no-follow validation. More seriously, `--refresh-review` writes through existing symlinks and can overwrite a target outside the repository. These gaps also allow current-byte custody and protected-history hashes to attest external targets instead of canonical repository files.

**Fix:** Require the exact canonical relative paths, reject extra arguments, canonicalize and confine every path under the physical repository root, reject symlinks in every ancestor and leaf, open with no-follow semantics where available, and remove the overwrite-capable refresh command.

## Warnings

### WR-01: Mutation tests are vacuous and use fabricated success evidence

**Classification:** WARNING

**File:** `scripts/check-v1-38-plan-262-55-source-completeness-review.test.ts:13-24,42-59`

**Issue:** The positive test uses a fabricated proof rather than executing the CLI. Each listed mutation changes a rooted field but leaves `reviewRoot` stale, so `validateReviewArtifact` can reject it solely because the hash no longer matches; the tests do not show that command semantics, identity claims, custody internals, or findings are independently validated. There are no mutations for proof fields, handler/destination/effect/prerequisite fields, symbols/dispositions, protected roots, exact charge identities, descendants, snapshots, symlinks, path escape, or post-commit rewrite.

**Fix:** Recompute the review root after every adversarial mutation and assert the specific semantic rejection. Add fixture-based mutations for every trust boundary, including forged proof objects, decoy source strings, missing/extra exports and commands, unrelated summary commits, rewritten protected roots, arbitrary forty-item charge lists, symlink ancestors/leaves, external CLI paths, incomplete snapshots, and later review-file commits.

## Verification Performed

- `pnpm exec vitest run scripts/check-v1-38-plan-262-55-source-completeness-review.test.ts --pool=forks --maxWorkers=1 --no-file-parallelism --testTimeout=120000 --bail=1` — passed, 7/7.
- Canonical `--check-review` invocation — passed with the recorded zero-finding root.
- Adversarial `deriveReview` plus `validateReviewArtifact` using a never-run, malformed, internally inconsistent proof — incorrectly passed with zero findings.
- Git history inspection confirmed the artifact/report were committed in `bc0150b1` and modified in `ea385f22`.

---

_Reviewed: 2026-08-15T03:00:44Z_
_Reviewer: the agent (independent Plan-262-55 checker review)_
_Depth: deep_
