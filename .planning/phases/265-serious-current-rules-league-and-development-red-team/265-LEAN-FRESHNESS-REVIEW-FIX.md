---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
fixed_at: 2026-09-22T12:24:14Z
review_path: .planning/phases/265-serious-current-rules-league-and-development-red-team/265-LEAN-FRESHNESS-REVIEW.md
iteration: 3
findings_in_scope: 1
fixed: 1
skipped: 0
status: all_fixed
verification_status: independent-re-review-required
source_head_before: dbda8c04b0cf1c23be588ffc0382bc3d625e71fb
fix_commit: d35e58d218f53c07218bb33608b14d4fd0fd5398
empirical_authority: false
---

# Phase 265: Lean Freshness Review Fix

## Summary

One blocker fixed atomically; none skipped. This is a source-only same-plan
correction, not a Plan 07 SUMMARY, phase completion, allocation, capacity
receipt, empirical preflight or run result. Main owns independent re-review and
the complete validation gate.

## Fixed Issues

### CR-01: Mandatory retained verification can expire the prospective receipt before reservation

**Status:** fixed: requires human verification (logic/order change; independent
re-review requested).

**Commit:** `d35e58d218f53c07218bb33608b14d4fd0fd5398` —
`fix(265): CR-01 observe capacity after static league verification`.

**Files modified:**

- `packages/strategy-lab/src/league/allocation.ts`
- `packages/strategy-lab/src/league/allocation.test.ts`
- `scripts/run-v1-38-serious-league.ts`
- `scripts/run-v1-38-serious-league.test.ts`
- `265-LEAN-AMENDMENT.md`
- `265-07-LEAN-SOURCE-HANDOFF.md`
- `265-07-PLAN.md` (existing Task 3 interface/order wording only)

**Applied fix:** Added the exact-key data-only `LeagueCapacityPlanInput` and
`admitLeagueCapacityPlanInput`. Shared validation retains all six categories,
source/witness roots, exact scaling, positive headroom, logical/record margins
and physical filesystem projection. The existing receipt schema/root and
300,000 ms maximum age are unchanged.

A private, in-process static preparation function now performs allocation/source
admission, the unchanged complete historical reader/import path, prospective
base validation, candidate closures, all authoring packet preflights,
output-directory binding and empty-journal checks. It returns candidates only
to the current call, never a persisted or caller-supplied verification authority.
No historical check was removed, memoized or moved into a provider path.

Prospective `run --capacity-input` finishes that static work, observes actual
host time/device/free bytes/available memory, creates/admit-checks the receipt
and reserves once. The run-start graph retains the exact receipt and observation.
The session immediately re-admits the receipt before reservation, without
repeating the historical reader. Live capacity dispatch/invocation guards,
allocation-only reservation key and no-retry behavior remain intact.

Standalone `preflight` runs the same static checks first, then captures a fresh
host observation and returns its receipt without reservation. The alternative
`run --capacity-receipt` remains strict before and after static checks; it
never refreshes old receipt authority. Both forms are mutually exclusive.
Legacy V1 admission, receipt-free V1 execution, retained reading, root formats,
approved bounds, provenance and final gates are unchanged.

## Exact Task 3 interface for main — not executed

After final independent source review, the complete gate and truthful technical
preparation, derive current source → implementation → amendment → allocation
identities. Prepare the canonical data-only capacity JSON with exactly:

`allocationRoot`, `amendmentRoot`, `implementationRoot`, `sourceRoot`,
`historicalAssessmentRoot`, `processHeadroomBytes`, `scale`, `costs`,
`assumptions`.

The six cost rows include complete measurement values, witness/source roots and
their recomputed `measurementRoot`. Do not supply `schemaVersion`, `root`,
timestamps, filesystem device, free bytes or available memory. This plan is
not a host receipt or dispatch authority. The host values are observed only
after the command's static checks.

```text
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts run --allocation <rooted-prospective-allocation.json> --allocation-root <root> --repository <fresh-league-directory> --factory-repository <historical-factory-directory> --response-factory-repository <fresh-response-factory-directory> --capacity-input <data-only-measurements.json>
```

All directories must already exist and match the allocation; the response
directory must contain every exact authoring/disclosure/provenance/review
packet. Source/static or fresh capacity failure must stop before reservation
and provider issuance. A consumed allocation is never retried, even after a
pre-cell crash or with new observations.

Optional standalone `preflight --allocation <rooted-prospective-allocation.json>
--allocation-root <root> --capacity-input <data-only-measurements.json>
--factory-repository <historical-factory-directory>` emits a fresh diagnostic
receipt only after those static checks. Task 3 does not require it to survive
another historical reopen. Do not combine `--capacity-input` and
`--capacity-receipt`; the latter can still expire during static validation and
is intentionally not refreshed.

## Source-only verification

Tier 1: reread the modified source, tests and Task 3 documentation; reviewed the
complete diff and confirmed surrounding code and existing bounds remain intact.

Tier 2 / focused behavior:

- Allocation + prospective CLI selector: **40 passed, 36 skipped**, two suites,
  135.81 s. Counts include tests registered by imported fixture modules, not
  40 unique new regressions.
- Final timing/host-value and legacy selector: **12 passed, 53 skipped**, one
  suite, 132.60 s. This includes the additional unavailable-host case and
  distinct freshly observed device/free-space/memory values.
- Strategy-lab project TypeScript build: passed.
- Strict NodeNext CLI/test TypeScript check: passed after final test changes.
- All three private league/lab/factory boundary scans: passed; **1,331 files,
  zero violations** each.
- Service boundary checker: passed with **0 strict / 0 ownership / 19 existing
  report-only** findings. The package-manager wrapper's automatic dependency
  check aborted before modules removal; the already-installed local `tsx`
  ran the checker directly. No package install completed or tracked dependency
  file changed.
- CLI `--help` and `git diff --check`: passed.

The timing seam advances static validation by **300,001 ms**. Tests prove:
fresh plan/preflight measurements occur afterward; stale supplied receipts
cannot reserve; old receipt objects are rejected as plans; CLI/API alternatives
are exclusive; static reader/closure/authoring failures produce zero host
observations, reservations or providers; insufficient/unavailable host capacity
produces zero reservations/providers; all original allocation/amendment/source/
history/cost roots bind the resulting receipt; live disk/memory drops retain a
failure before a new Match/provider; and a reservation-only crash remains
consumed after another full static validation and fresh observation.
The exact small V1 retained root and existing legacy pre-dispatch gates pass.

Commands:

```text
./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/league/allocation.test.ts scripts/run-v1-38-serious-league.test.ts -t 'approved prospective three-base admission|prospective CLI source-only gates|prospective complete Phase 265 execution allocation'
./node_modules/.bin/vitest run --maxWorkers=1 scripts/run-v1-38-serious-league.test.ts -t 'injected (fresh plan|stale after static|insufficient host|unavailable host|live disk drop|live memory drop|fresh preflight|fresh reservation crash)|preflights the journal-start|rejects partial or stale allocations|rejects unrepresentable declared population|preserving the exact small v1 root'
./node_modules/.bin/tsc -b packages/strategy-lab/tsconfig.json --pretty false
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts
./node_modules/.bin/tsx scripts/check-v1-38-serious-league-boundaries.ts
./node_modules/.bin/tsx scripts/check-v1-38-lab-boundaries.ts
./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts
./node_modules/.bin/tsx scripts/check-service-boundary-imports.ts
./node_modules/.bin/tsx scripts/run-v1-38-serious-league.ts --help
git diff --check
```

Initial development checks exposed a missing returned local job list, a fixture
clock mismatch and source-manifest changes during an in-progress test run.
Those were corrected; the clean runs above passed with stable production source.
These development failures are not represented as passing gates.

## Preservation and remaining work

No empirical allocation, amendment/receipt artifact, actual preflight, model
request, provider/container, Match, Strategy execution, formation, holdout,
public/counting or production work occurred. Every new observation/receipt and
reservation test uses explicitly injected temporary mechanics. No provider or
validation-result cache was added. The full retained historical verification
remains potentially expensive, but it now precedes fresh host measurement.

The full 29-suite gate was not run here. Main's prior gate 96057 was intentionally
stopped with exit 130; that is not a passing gate. Independent re-review and the
final full gate remain required, followed by the existing conditional Task 3.

Fix worktree: `/tmp/sv-265-reviewfix-cXvFoL`, temporary branch
`gsd-reviewfix/265-50187`, starting at `dbda8c04`. The controlled fast-forward
lifecycle delivers the exact fix commit to main; this report remains uncommitted
for the orchestrator. Only this fixer's worktree/branch/recovery sentinel are
cleaned. Existing older reviews, historical recovery records, cache, successor
locks and unrelated worktrees are preserved.

---
_Fixer: gsd-code-fixer; iteration 3; source-only._

