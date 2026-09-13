---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
fixed_at: 2026-09-13T23:17:30Z
review_path: .planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-FOUNDATION-REVIEW.md
iteration: 2
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 264: Foundation Code Review Fix Report

**Fixed at:** 2026-09-13T23:17:30Z
**Source review:** `.planning/phases/264-immutable-factory-independent-oracles-and-quarantined-intake/264-FOUNDATION-REVIEW.md`
**Iteration:** 2

**Summary:**

- Findings in scope: 2
- Fixed: 2
- Skipped: 0

## Iteration 2 Fixed Issues

### CR-01: Final candidate and accepted supervision evidence can bypass the issued supervision receipt

**Files modified:** `packages/strategy-lab/src/factory/contracts.ts`, `packages/strategy-lab/src/factory/admission.ts`, `packages/strategy-lab/src/factory/admission.test.ts`
**Commit:** `68dc5c09`
**Applied fix:** A receipt is issued only after the candidate participant's bound provider actually returns verifiable accounting recorded in the Match execution. Receipt issuance uses private object membership in addition to its structural root. `mapFactorySupervision` rejects fabricated receipts, and finalization now requires an issued receipt with an `accepted` candidate disposition. The final candidate carries and is checked against that receipt root before publication.

### CR-02: Candidate supervision is not tied to a Match participant, and disposition includes opponent violations

**Files modified:** `packages/strategy-lab/src/factory/admission.ts`, `packages/strategy-lab/src/factory/admission.test.ts`
**Commits:** `68dc5c09`, `80037028`, `9dbe4a81`
**Applied fix:** Supervision rejects a detached player key, records the candidate player ID plus the exact bound provider identity in the issued receipt, and requires actual candidate accounting. `candidateDisposition` attributes a player violation only to the candidate. The separate overall `disposition` retains an opponent-only violation as unscored Match failure, so it cannot finalize or become successful factory evidence; any Match or runtime system failure maps to `system_failure`.

## Iteration 1 Fixed Issues

### CR-01: Admission accepts a proposal/candidate that contradicts its authoritative packet

**Files modified:** `packages/strategy-lab/src/factory/contracts.ts`, `packages/strategy-lab/src/factory/admission.ts`, `packages/strategy-lab/src/factory/contracts.test.ts`, `packages/strategy-lab/src/factory/admission.test.ts`, `packages/strategy-lab/src/factory/index.ts`
**Commit:** `4ee723ea`
**Applied fix:** Proposal projection is checked field-for-field against its parsed packet. Candidate lineage must exactly equal proposal lineage. Regression coverage rejects source, build/toolchain/tuple, algorithm, doctrine/oracle, split, native lane, and each lineage-edge conflict.

### CR-02: The supervision seam does not bind the provider to the admitted candidate or source

**Files modified:** `packages/strategy-lab/src/factory/admission.ts`, `packages/strategy-lab/src/factory/admission.test.ts`, `packages/strategy-lab/src/factory/index.ts`
**Commits:** `4ee723ea`, `5b4db278`, `5f5a93d5`
**Applied fix:** Admission is now staged: exact source admission, valid-lane authorization, selected-provider supervision, then trace-dependent candidate finalization. Only the in-memory authority returned by the preceding admission stage can advance, preventing a caller from self-attesting a root-shaped replacement. The supervision wrapper checks source, packet, proposal, validation, lane, and runtime-profile roots before execution and after every provider invocation; mismatches fail before the callback or as a binding failure. The final fingerprinted candidate is intentionally not fabricated before its required traces exist.

### CR-03: “Durable” attempt charges are not durable across a crash

**Files modified:** `packages/strategy-lab/src/factory/repository.ts`, `packages/strategy-lab/src/factory/repository.test.ts`
**Commit:** `90614650`
**Applied fix:** Immutable publication now fsyncs the containing directory after link and temporary removal, and repeats the directory sync for identical existing content. A directory-sync failure propagates from `recordFactoryAttemptStart`, so validation or supervision cannot start.

### CR-04: Hostile packet schemas accept unpinned runtime and inherited-authority identities

**Files modified:** `packages/strategy-lab/src/factory/contracts.ts`, `packages/strategy-lab/src/factory/contracts.test.ts`, `packages/strategy-lab/src/factory/index.ts`
**Commit:** `4ee723ea`
**Applied fix:** Packets now carry and verify exact inherited predecessor, source-closure, tuple, runtime-profile, ABI, and lab-schema pins. Factory/schema authority remains frozen while independently developed oracle algorithm metadata remains allowed.

### WR-01: Root-only artifact reads construct paths from an unvalidated runtime value

**Files modified:** `packages/strategy-lab/src/factory/repository.ts`, `packages/strategy-lab/src/factory/repository.test.ts`
**Commit:** `90614650`
**Applied fix:** All repository filenames derive only from a strict runtime root validator before any path join. Traversal-shaped roots and symlink artifact substitutions are rejected.

### WR-02: A crash can leave a predictable temporary name that prevents conservative recovery

**Files modified:** `packages/strategy-lab/src/factory/repository.ts`, `packages/strategy-lab/src/factory/repository.test.ts`
**Commit:** `90614650`
**Applied fix:** Each publication uses a UUID-suffixed temporary name. Resume removes only bounded, regular, single-link repository-owned temporary names and directory-syncs the cleanup; malformed or unsafe temporary entries remain explicit uncertain failures. A stale terminal temporary file no longer blocks exactly one terminal publication.

## Verification

- Iteration 2: `vitest run --maxWorkers=1 packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/identity.test.ts packages/strategy-lab/src/factory/ledger.test.ts packages/strategy-lab/src/factory/repository.test.ts packages/strategy-lab/src/factory/admission.test.ts` — passed: 5 files, 18 tests.
- Iteration 1: `vitest run --maxWorkers=1 packages/strategy-lab/src/factory/contracts.test.ts packages/strategy-lab/src/factory/admission.test.ts packages/strategy-lab/src/factory/repository.test.ts` — passed: 3 files, 12 tests.
- `tsc -b packages/strategy-lab` — no diagnostics referenced modified factory files after filtering. A complete isolated-worktree build could not be treated as a clean package verification because that worktree begins without the main checkout's workspace links/generated dependency state; its unfiltered diagnostics originate in pre-existing dependency resolution (`zod` and workspace package links), not the modified files. The main checkout should run the authoritative package build after cherry-picking.
- Tier 1 reread and `git diff --check` passed for every modified section.

## API Changes

- `admitFactory` now admits exact packet/proposal/source data before validation or traces.
- `authorizeFactorySupervision` creates a root-bound, valid-lane authorization.
- `superviseFactory` requires that authorization and returns an issued, candidate-participant-bound receipt consumed by `mapFactorySupervision`.
- `finalizeFactoryCandidate` accepts that issued receipt (not a pre-execution authorization), requires its candidate-success disposition, and binds publication to its root.

## Residual Findings

None in the reviewed foundation scope. Authoritative full-package typecheck and re-review remain for the main checkout after these commits are applied.

---

_Fixed: 2026-09-13T23:17:30Z_
_Fixer: the agent (gsd-code-fixer)_
_Iteration: 2_

## Main-checkout integration

Iteration1 applied unchanged as `f7e28680`, `32ac8941`, `7189b470`, and `6aa9d349`; iteration2 as `87bf320a`, `c05588dd`, and `459017f8`. Main independently passed18focused tests (3.90seconds) and the unfiltered package build. Independent final re-review is clean, separately passing18tests (3.81seconds) and the full package build. The isolated-worktree filtered typecheck was not used as a pass claim.
