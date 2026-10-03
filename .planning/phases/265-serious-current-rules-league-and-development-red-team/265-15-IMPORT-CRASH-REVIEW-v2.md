---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-03T18:45:33Z
depth: deep
source_commit: ae930c8e57e74b6d22e7365e17c91fe83352527f
source_root: sha256:98819b383a5d6529081ef05174da7ca764da791720ee9a692c6259b0724611c5
source_manifest_entries: 861
reviewer_agent: /root/review_265_15_import_crash
files_reviewed: 7
files_reviewed_list:
  - packages/strategy-lab/src/factory/supervision-artifacts.ts
  - packages/strategy-lab/src/league/contracts.ts
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/assess-v1-38-factory-independence.ts
  - scripts/run-v1-38-lean-experiment.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/v1-38-factory-observations.ts
findings:
  critical: 3
  warning: 0
  info: 0
  total: 3
status: issues_found
---

# Plan 265-15 import/crash repair re-review

Scoped, source-only re-review of the seven changed production modules at fixed commit `ae930c8e`, against [v1 findings](265-15-IMPORT-CRASH-REVIEW-v1.md) and the [fix report](265-15-IMPORT-CRASH-REVIEW-FIX-v1.md). No changing test file was reviewed: the genuine historical-verifier fixture (v1 WR-01) is separately owned and remains outside this report. No private historical reader, preparation, provider, container, Match, model, or empirical route ran. The inert `leanSourceManifest()` returned the 861-entry root above. Source-only review cannot establish pilot feasibility or a historical disk high-water mark.

**Disposition of earlier findings:** The concrete bounded supervision reader now performs a chunkwise lexical prepass and asks for a conservative preparse reserve; token generation no longer uses recursive `flatMap`. The entry-bound parent PID, IPC disconnect handler, provider registry, and before/after invocation checks close v1 CR-02 and WR-02 at the observable JavaScript boundaries. A synchronous provider call cannot be preempted before its next event-loop boundary, but the concrete provider is synchronous and the guard terminates on disconnect while the Match is awaiting; no further invocation is admitted. The v2 allocation now requires a separate failed-write inventory and is currently closed because its JSON does not exist. These are real source improvements, not a pass for the three remaining defects below.

## Narrative Findings (AI reviewer)

### CR-01 — BLOCKER: factory attempt inventory remains unbounded before the 48-entry check

**File:** `scripts/run-v1-38-serious-league.ts:294`; `scripts/assess-v1-38-factory-independence.ts:45-62,108-110`

**Issue:** `readInitialCandidates` calls `readRetainedFactoryLedger(repository)` before the historical assessment. That reader sorts every repository filename, filters and parses every `factory-attempt-*.started.json` and terminal file, retains all parsed entries, and only then returns. The assessor's `ledger.entries.length > 48` denial occurs after this work. The new `beforeAllocation` reserve is passed to `indexFactory` and bounded supervision reads, but not to this ledger reader. A repository with more than 48 attempt files therefore causes an unbounded precharge read/object graph even though it must ultimately be rejected; the request's 200,000-artifact budget does not constrain attempt-file count. This leaves v1 CR-01 open for the full import prefix despite the per-cell parser improvement.

**Fix:** In the lean-only path, count and validate attempt filename pairs before parsing any attempt body; reject counts other than 48 and bound the overall filename inventory before sorting/materialization. Pass the existing capacity callback into the retained-ledger read or make a bounded lean reader, while leaving the legacy API/default behavior untouched. Add an over-48-attempt synthetic denial fixture that asserts the reader stops before parsing extra bodies.

### CR-02 — BLOCKER: predecessor inventory accepts unsupported zero historical bounds

**File:** `packages/strategy-lab/src/league/lean-experiment.ts:43-59,77-81`

**Issue:** The new inventory gate is presently closed because `265-15-FAILED-PREFIX-WRITE-INVENTORY-v1.json` is absent; that is the correct current disposition. But the validator would accept `core` and `runtime-cache` destinations with `upperBoundBytes: 0` whenever their current `allocatedBytes` is zero. It checks only numeric ordering, any syntactically valid `evidenceRoot`/`reviewer`, and a hash of the existing Markdown report; it does not require a source-backed basis for the historical upper bounds. The actual linked disk-inventory report expressly says the failed PID's core limit and TSX cache delta were not retained and no numeric historical bound is established. A JSON reflecting today's absent core/current cache with zero incremental bounds can therefore pass the source gate while understating the 15-GB predecessor debit. A file hash proves bytes, not the correctness of the upper-bound assertion.

**Fix:** Keep allocation closed unless each historical core/cache bound is tied to a verifiable contemporaneous limit or a conservative reviewed worst-case calculation. Do not admit zero from present-day absence or from a reviewer-name/hash field alone. Validate the specific numeric-basis fields against the exact failed-entry identity, or, if that basis cannot be supplied, retain the current closed state and report the historical-resource limitation. Do not fabricate old RSS or alter v1 failure bytes.

### CR-03 — BLOCKER: prospective writable-scope guard leaves Node cache/report outputs enabled

**File:** `scripts/run-v1-38-lean-experiment.ts:28-35,142-145,247-263`

**Issue:** `requireLeanProspectiveWritableScope` checks `TSX_DISABLE_CACHE=1` and a zero inherited core soft limit only. It permits `NODE_OPTIONS` with Node's `--report-on-fatalerror`/`--report-directory` flags and permits `NODE_COMPILE_CACHE`; either can write outside the measured lean store on a future failure while the guard returns successfully. The local Node 24 help confirms the diagnostic-report options. The disk-inventory report also notes these variables were unset only in the *observed checking shell*, not as a prospective launch guarantee. Since TSX/Node loaders run before this in-process guard, an unwanted compile-cache write can occur even before it rejects a bad launch. Such bytes are absent from `cumulativeLeanPhysicalBytes` and the same-process store checks.

**Fix:** Use a small pre-Node launcher contract that unsets or tightly allowlists `NODE_OPTIONS` and `NODE_COMPILE_CACHE`, sets `TSX_DISABLE_CACHE=1` and core soft limit zero, and routes any remaining temp/report destination into a measured/quota-bounded location before invoking `tsx`. Have the runner assert the sanitized inherited environment as a second check; deny report flags/compile cache and test those environment cases with inert fixtures. No Strategy/runtime limit change is needed.

## Admission boundary still pending

The existing `265-15-FAILED-PREFIX-DISK-INVENTORY-v1.md` is a useful read-only diagnosis, but it explicitly does **not** establish the historical TSX/core numeric upper bound. Its companion JSON is absent. The current `createLeanAllocationV2` call therefore fails closed, and no fresh pilot may be prepared on this source alone. That pending evidence is distinct from fixing the validator and launch-scope defects above; it must not be relabeled as a source test failure or a successful capacity receipt.

---

_Reviewed: 2026-10-03T18:45:33Z. Reviewer: `/root/review_265_15_import_crash`. Depth: deep. No phase/pilot pass._
