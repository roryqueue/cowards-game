---
phase: 265
plan: 16
scope: source-only-file-accounting-and-actual-author-refusal-custody
status: pass
reviewed: 2026-10-07T05:10:26Z
findings: 0
empirical_admission: false
---

# Existing Plan16 V9 File-Basis Repair Plan Check

**Verdict:** PASS. The proposed source-only correction is viable against the diagnosed accounting mismatch and the independently verified v9-1 refusal. It preserves the approved envelope and does not require a new bound or approval.

## Basis

- The diagnosis reports all 287 old rows intact (8,605,696 bytes) and 387 current rows (10,698,752 bytes), with the prior conservative reserve of 4,288,512 bytes preserved in `allocatedDiskBytes` (14,987,264 bytes). The row sum is below the unchanged 14,864,384-byte floor, while the conservative allocated basis remains above it. Removing only the extra raw-row-sum-versus-floor predicate, while retaining every row and requiring `allocatedDiskBytes >= row sum` and `allocatedDiskBytes >= floor`, directly resolves the identified false refusal. This does not assert that current filesystem rows alone meet the floor, lower the floor, or change any cap.
- The terminal verification establishes an author-finalization/request-authentication refusal before preparation or allocation. It pins the actual request, authorization, setup, and terminal observation and confirms the v9-1 store, allocation, prepare/run markers, entry, and result were absent. The plan correctly treats this as spent, nonauthorizing author-failure custody, not as a preparation failure receipt, child terminal, ordinary reader result, or FINAL close. The exact-pinned metadata-only branch is appropriately limited to this v9-1 case; later real routes retain normal closure custody.
- The separate custody-anchor treatment is necessary: bind the later observation timestamp as authenticated history, but do not reinterpret it as an admission time, reader start/close, or FINAL boundary. Continuous elapsed accounting remains anchored to the approved task floor and includes all current work; the 30 historical charges, old files, and all earlier costs remain spent and immutable.
- The plan preserves the existing gates for exact inventory/debits, independent source review, focused validation, new v9-2 request/data review, committed allocation before unique entry, fresh empty `0700` store, same-process capacity before charge, and source/HEAD hold. It adds no empirical or downstream authority.

## Findings

No residual blocker found within this targeted plan check. This pass is not implementation review, empirical admission, or permission to run v9-2.

_Checked against NEW265-16-V9-1-FILE-ACCOUNTING-DIAGNOSIS-v1.md and NEW265-16-V9-1-AUTHOR-FINALIZATION-TERMINAL-VERIFICATION-v1.md._
