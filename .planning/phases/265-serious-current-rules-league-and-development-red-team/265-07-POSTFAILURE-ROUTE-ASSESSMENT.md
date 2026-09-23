---
phase: 265
plan: "07"
status: non-authorizing-route-assessment
date: 2026-09-23
empirical_authority: false
---

# Post-failure route assessment

The allocation-v2 one-shot is consumed. Its sole started cell has a persisted
`system_failure` / `process_invalid` terminal and no payoff. This document is
not a retry, replacement allocation, changed resource policy, completed
league, or authority to run another Match.

The retained graph identifies a `TypeError` after 452 successful supervised
invocations. Local file times put the failure about 120.7 seconds after cell
start, close to the approved 120-second Match/provider lifetime. The graph
does not retain an exact error code, so lifetime exhaustion is a strong
diagnostic hypothesis, not a verified cause. The new source-only supervisor
diagnostic can retain allowlisted codes for a future route; it cannot recover
this run's missing code.

The approved schedule requires 4,632 Matches on its fully qualified path and
reserves at most 11,328. The current matrix issues cells sequentially. Even
ignoring authoring, review, storage, and probes, 96 hours requires an average
below 74.6 seconds per Match for 4,632 cells. At 120 seconds each those cells
alone would take 154.4 hours. This single failed cell does not establish the
distribution of future Match times. Earlier Phase 263 completed 24 Matches in
22.18 minutes including validation/benchmark work, but used a different
candidate/opponent and cannot validate Phase 265 throughput.

## Recommended prospective path

1. Finish read-only verification of the retained failed evidence and keep its
   non-pass classification. Review any source-only performance fix without
   executing new Strategies or changing frozen gameplay/runtime semantics.
2. If the operator chooses to continue empirical work, first approve a new,
   separately rooted, tightly timeboxed diagnostic pilot using only existing
   current-rules candidates and the unchanged canonical engine. Its starts
   must be charged, its failures retained, and its output must not count toward
   LEAG-01–09, a finalist, or the freeze. Specify exact cells, per-Match and
   overall limits, host capacity, and no-retry disposition *before* dispatch.
3. Use actual completed/failing pilot durations and per-cell artifact costs to
   design and independently review a new full league allocation. Preserve
   side, initiative, arena, probe, red-team, information-boundary, privacy, and
   holdout requirements unless the operator explicitly amends them. State the
   projected wall time and record/disk bounds; do not simply raise the
   120-second limit inside the old 96-hour envelope.

Keeping the original full scope with a much larger time/resource envelope, or
closing the empirical path as inconclusive and deferring the formation study,
are material alternatives for the operator. No choice has been recorded here.
The previous allocation and its 452 partial invocations cannot be refunded,
retried, scored, or reused as a completed Match. Phase 266's real freeze and
every Phase 267 formation operation remain blocked until an independently
verified, process-valid current-rules league exists. The original unopened
operator-local holdout seal is a separate Phase 266 prerequisite; the checked-in
protocol artifact is not that seal.
