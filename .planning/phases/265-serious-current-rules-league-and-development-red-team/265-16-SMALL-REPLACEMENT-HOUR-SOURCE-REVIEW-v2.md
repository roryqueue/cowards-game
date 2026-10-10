---
phase: 265-serious-current-rules-league-and-development-red-team
reviewed: 2026-10-10T21:38:40Z
depth: deep
source_head: 6fb25879156fb4a6d74776130d99e2f6994f72f3
diff_base: 77907b3b3164e534e9e51e777c2cb867b4e91c16
diff_head: 6fb25879156fb4a6d74776130d99e2f6994f72f3
files_reviewed: 4
files_reviewed_list:
  - scripts/lib/v1-38-lean-experiment-authority.ts
  - scripts/lib/v1-38-lean-experiment-authority.test.ts
  - scripts/run-v1-38-lean-private-probe.ts
  - scripts/run-v1-38-lean-private-probe.test.ts
findings:
  critical: 0
  warning: 1
  info: 0
  total: 1
status: issues_found
source_disposition: PASS_WITH_WARNINGS
---

# Phase 265 Small Replacement Hour: Independent Source Review v2

**Reviewed:** 2026-10-10T21:38:40Z  
**Full diff:** `77907b3b3164e534e9e51e777c2cb867b4e91c16..6fb25879156fb4a6d74776130d99e2f6994f72f3`  
**Disposition:** PASS_WITH_WARNINGS — I found no source blocker in the bounded v2 hour amendment; runner-level v2 producer/retained-reader integration is not exercised by the focused tests.

## Scope and method

Reviewed the exact four changed source/test paths listed above, including the new approval and source-summary artifacts as context. Traced fixed-window selection, capacity receipt binding, admission, debit issuance, terminal resource construction, and retained verification. Checked that v1's time constants and capacity/resource branch remain separately selected, and that the v2 allocation schema requires the approved root. No canonical allocation/store, old retained reader, prepare/entry/verify CLI, provider, Docker/container, worker, Strategy, Match, or runtime route was invoked.

Commands closed by this reviewer:

- `git diff --check 77907b3b..6fb25879 -- scripts/lib/v1-38-lean-experiment-authority.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/run-v1-38-lean-private-probe.ts scripts/run-v1-38-lean-private-probe.test.ts` — passed.
- `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/run-v1-38-lean-private-probe.test.ts` — passed, 17/17 tests.
- Read-only diff/source inspection of all four paths; no source or STATE edits.

## Positive source findings

- **Fixed v2 window/root:** authority defines the approved anchor `1791667800000`, carry `319858903`, cap `323458903`, deadline `1791671400000`, reserve `1860000`, and source carry `1183744`; the root is included in v2 allocation construction and exact schema validation. The v1 observer and v1 time constants remain on a separate branch.
- **No scalar or legacy-window bypass:** v2 resource/capacity APIs take a validated v2 allocation. Capacity receipts bind allocation root, window root, store path, prior retained carry, and short freshness; admission compares those values to the reopened committed allocation and rechecks current v2 resources. A v1 capacity receipt cannot open the v2 allocation. Debit issuance rechecks the same v2 roots/resources before writing its one-use debit.
- **Single bounded attempt and joins:** v2 schedule remains one case at ordinal 0, match count 0. Prior v1 carry is authenticated and included. The real authority test uses temporary Git/store fixtures, issues one v2 debit, checks ordered claims, and joins allocation/request/result/debit. No additional attempt or Match path was introduced.
- **Producer/reader arithmetic:** runner selects v2 observations through prepare, entry capacity, pre-debit/per-case capacity, terminal observation, and terminal retained verification. The terminal receipt includes source and prior carries, exact window root, cumulative wall-time accounting, historical charge, current store allocation, and reserve. The retained reader validates the v2 receipt before the terminal root and compares actual retained blocks; it rejects after the hard deadline. The original v1 time/resource validation remains selected only for v1.
- **Unchanged gameplay bounds:** the diff does not change guest 1000 ms, startup 2500 ms, host 5000 ms, Match 600000 ms, memory/disk ceilings, runtime grant semantics, or default v1 selection.

## Warning

### WR-01: V2 runner producer-to-retained-reader path is not exercised as an integration fixture — WARNING

**File:** `scripts/run-v1-38-lean-private-probe.test.ts:11-21`

**Issue:** The runner test's authority mock replaces both v2 resource and capacity observers with empty objects. The added test validates the v2 schedule/result schema joins, while the authority test exercises real temporary Git/store admission/debit and the standalone resource verifier. Neither test runs the v2 runner branch through terminal production and then through `verifyPrivateProbeStore` against a retained temporary store. Static inspection shows the current producer and reader joins are explicit, so this is a coverage limitation rather than a demonstrated logic defect; it leaves a regression gap at the changed production branch boundary.

**Fix:** Add a bounded inert temporary-store test that drives the v2 terminal resource receipt through the production terminal/retained-verifier helpers without invoking a provider, worker, Strategy, or Match. If that cannot fit this source-only gate, preserve this warning and do not infer the path from the separate authority and schema tests.

## Verification caveats

The source handoff reports the exact four-file strict-TypeScript baseline/final diagnostic identities match (8 diagnostics, not a clean typecheck). I did not rerun that typecheck. The previously recorded broader cleanup-throws failure and generated-broker-predicate execution-coverage warning remain unresolved and unwaived; they are not changed or converted into passing evidence by this review. No actual v2 prepare, entry, terminal, or retained verification occurred, and no empirical or runtime-feasibility claim follows.

_Reviewer: gsd-code-reviewer (independent bounded source-only review)_
