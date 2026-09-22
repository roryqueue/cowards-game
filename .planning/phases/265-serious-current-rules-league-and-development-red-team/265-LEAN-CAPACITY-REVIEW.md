---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
task: "2-lean-amendment"
reviewed: 2026-09-22T12:00:04Z
reviewed_head: 86650982b1e008a72b1a90ccb5f67ca6379f5aee
scope: source-only-capacity-accounting-diagnostic
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
empirical_authority: false
---

# Phase 265: Lean Capacity Accounting Review

## Narrative Findings (AI reviewer)

### CR-01: Filesystem block overhead is charged against the logical artifact pool

**Classification:** BLOCKER

**File:** `packages/strategy-lab/src/league/allocation.ts:202-213`

**Issue:** The receipt requires every category—including `filesystem`—to have a
strictly positive `projectedRecords` value, and then adds all six categories to
the logical byte and artifact-record totals used for the 130 GiB / 8.8 million
ordinary pool. A filesystem-block-slack measurement is physical storage
overhead: it consumes free filesystem bytes but creates no additional logical
artifact record. Its bytes must be included in the host-free-space projection,
but not re-charged to the approved logical artifact ceiling or artifact-record
pool.

This is not merely conservative accounting. A representative measurement with
114.632 GiB logical artifacts and about 7.156 million artifact files, plus
12.34 GiB filesystem block slack, has valid separate logical and physical
projections under the approved contract. Current code rejects it twice: first
because a legitimate filesystem row cannot state zero records, and again
because 114.632 + 12.34 GiB is compared to the 120 GiB ordinary logical pool.
It therefore falsely refuses a receipt that retains every approved bound and
the required host-free-space margin.

**Contract evidence:** The approved decision identifies 150 GiB as *logical
artifact bytes* and records the 9 million limit separately at
`265-LEAN-RUN-DECISION.md:69-70`. It requires all six categories, including
filesystem, while separately requiring 10 GiB/500,000 records within the
ordinary 130 GiB/8.8 million pool and 20 GiB projected free filesystem space
at `265-LEAN-RUN-DECISION.md:146-153`. The amendment likewise calls out
separate six-category accounting and a separate host-free-space projection at
`265-LEAN-AMENDMENT.md:72-89`, while its current accounting note distinguishes
114.632 GiB and 7.156 million files from remaining physical-filesystem checks
at `265-LEAN-AMENDMENT.md:111-114`.

**Fix:** Preserve the six required ordered categories and their rooted,
ceiling-scaled witnesses, but split the derived totals by meaning:

```ts
const logicalCosts = input.costs.filter((row) => row.category !== "filesystem")
const filesystem = input.costs.find((row) => row.category === "filesystem")!
const logicalBytes = logicalCosts.reduce((sum, row) => sum + row.projectedBytes, 0)
const artifactRecords = logicalCosts.reduce((sum, row) => sum + row.projectedRecords, 0)
const projectedFilesystemBytes = logicalBytes + filesystem.projectedBytes
```

Use `logicalBytes` and `artifactRecords` for the 130 GiB / 8.8 million
ordinary-pool margins. Use `projectedFilesystemBytes` plus the unchanged 20
GiB terminal reserve for the 20 GiB host-free-space margin. Permit the
`filesystem` row's measured/projected record values to be zero while retaining
strictly positive records for the five artifact-producing categories, its
nonempty witness roots, and its strictly positive physical byte measurement.
Keep `admitLeagueCapacityReceipt`'s free-space subtraction semantically
equivalent to `projectedFilesystemBytes + terminalReserveBytes`; it already
sums all category bytes. Do not relax the source/root/freshness checks or any
numeric bound.

Add a source-only regression with a nonzero filesystem-byte / zero
filesystem-record row: it should admit when its five logical categories fit
120 GiB and 8.3 million records and the full physical projection still leaves
20 GiB free. A logical-overage, record-overage, and physical-filesystem-margin
shortfall must still reject.

## Live Capacity Guard

`scripts/run-v1-38-serious-league.ts:556-559` checks live free space against
the unchanged terminal reserve plus the 20 GiB host-free-space margin, and
checks process headroom before each charged dispatch. That is consistent with
the split: the preflight projects full physical consumption, while the live
guard uses observed remaining free space and must preserve only the terminal
reserve and final free-space margin. It should retain this threshold; it must
not add filesystem block slack a second time.

No empirical preflight, allocation, provider/model action, Match, or source
edit occurred during this diagnostic.

_Reviewer: independent source-only capacity diagnostic_
