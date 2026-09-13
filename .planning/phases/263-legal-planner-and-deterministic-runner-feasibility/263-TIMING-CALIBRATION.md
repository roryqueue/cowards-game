---
phase: 263
plans: [263-01, 263-06, 263-07]
status: passed
approved: 2026-09-13
operator_response: yes
maximum_fresh_attempts: 1
attempts_started: 1
attempts_remaining: 0
---

# Approved pre-search timing calibration

The operator answered **yes** to the proposal: selection p99 strictly below **20 ms**, SoldierBrain p99 strictly below **5 ms**, every other limit unchanged, then **one fresh bounded attempt**, with Matches only after validation and timing pass. This is a prospective revision of D-14 and existing Plans01/06/07, not retroactive credit, a game-rule change, or a new numbered plan/custody chain.

## Rationale and preserved history

The last bounded run measured selection p99 14.171262 ms and SoldierBrain 1.732708 ms. Selection improved from 64.135270 ms through behavior-preserving source optimizations. All four historical Phase263 runs remain non-pass under their original strict 5 ms gate. The original allocation and exhausted three-attempt envelope are immutable and cannot be reused. This explicitly disclosed calibration happens before factory/league search, not after competitive or formation outcomes. A fresh measurement is required; the previous 14.171262 ms result is not newly admitted evidence.

## Exact execution plan

1. Revise the private protocol to version2 with explicit per-method thresholds. Prove strict boundary rejection at 20 ms selection and 5 ms brain with pure/injected tests. Preserve candidate source, corpus/order, observer, percentile/rank, runtime and every budget. Independently review the delta before preparation.
2. Use fresh manifest `263-feasibility-calibration-1-manifest.json` in this phase directory and private output `.strategy-lab/phase263-feasibility-calibration-1`, with separate review `263-CALIBRATION-REVIEW.md`. No clobber or old destination reuse. Reserve once before preparation; exactly one run, zero internal retries.
3. Run all 256 fixed validation cases (232 guest calls plus 24 expected pre-runtime rejects on full pass), then 100 warmups and 1000 measured calls per method: 2200 benchmark calls. Use unchanged nearest-rank p99, sample990, direct trusted method observer, exact corpus traversal, fresh inputs/memories and hardware class. Both timing predicates must pass before Matches.
4. Only full validation/timing pass permits the existing 24-Match allocation: one candidate against the fixed Advanced fixture, 12 label tasks per pass but eight scientific cells, baseline1worker/shard1/forward then reproduction2workers/shard3/reversed. Preserve checkpoint after six complete baseline tasks, zero-inflight restart, and completed-inventory resume with zero redispatch. No unused historical Match slots roll forward.
5. Keep 120000 ms/Match, 3600000 ms outer run including build/startup/cleanup, 2 CPU/256 MB container, selected 1000 ms/method runtime, maxPhases100, 597656 total invocation ceiling, beam4/256expansions, brain64 optional evaluations plus nine reserved Actions, all source/memory/objective/output bounds. Retain all private traces, review eight geometry-distinct baseline starts and every failure, and require byte-identical scientific reductions.
6. Read-only verification rederives the result before further source edits. Independently close validation/UAT/goal-verification records. Full pass enables ordinary Phase264 GSD work; non-pass exhausts this one-run authority and requires an operator decision before another run or further changed limit.

Canonical engine, rules, formations, legal-information boundaries, privacy, accounting and cleanup remain unchanged. No factory scale before Phase263 passes; no formation before Phase266 freeze; no holdout opening, public/counting/production or rules authority is granted. All historical receipts, manifests, authorization bytes and 36 locks are preserved. Historical verification uses its historical source/protocol, never rewritten manifests.

## Outcome

The sole run overHEAD6cc1f837 completed **passed** in1330670.970273ms (22.18minutes), within3600000ms. All256validation cases passed (232guest calls,16source and8input rejects); all2200benchmark calls completed. Selection p99=17.019799ms passes strict<20ms; SoldierBrain p99=1.583730ms passes unchanged strict<5ms. The conditional24Matches completed successfully with zero player violations/system failures/uncertain calls, zero unused allocations, eight scientific cells and complete cleanup. All24private traces were retained (187807888bytes); total private evidence201654009bytes. Host peak RSS981284KiB is host accounting, not container memory usage.

Main read-only --verify rederived **passed** with zero runtime execution before any post-run source changes. Reduction reports24successes and eight scientific payoff rows. No owned container remained. All original/retry receipt and consumption bytes and36locks match the pre-run fingerprint. Independent goal-backward verification passed11/11 truths and10/10 requirements, private UAT passed6/6, and validation is Nyquist-compliant. Final safe regression passed196/196 tests across19 files in323.09seconds plus the strategy-lab TypeScript build. Phase263 is complete; ordinary Phase264 work may proceed, with no broader scientific or production claim.

- Manifest logical root: `sha256:90c0930ceff0f32a95b7d41061c22ce2459f5a7bd590fe7370082055c3a6bc0e`.
- Receipt bytes: `sha256:053094603157479c1ff42deeb6754490ad048f650a8003d4d6aee8a1155cc03d`.
- Consumed bytes: `sha256:e0511059c1a1ae8cf7825426db521269acf2f50a5db01bd7d95da8eb5628cce8`.
- Benchmark-result bytes: `sha256:b49641e5bfe309bc44fd97c8fa794d5b234b7ab8f2b4f4688a183c10d40cdf58`.
- Reduction bytes: `sha256:86f798b1624eb04ef690d5570ca2f017ff4e599904a0bae1b44a0330103cb69e`.
- Scientific semantic root: `sha256:20484be30ab24fd00975bac6e4973cdbcde55996e39fff60a183b8da2734cf3f`.

### Historical pre-run reservation

Reserved once after34/34 focused tests, package TypeScript build and clean independent263-CALIBRATION-REVIEW.md. Reviewed source implementation1ad9f2e3; candidate remains31725bytes at sha256:1ac048cc2f2cbd9c8df497fc56af18be2861adf24a8f33450744f603ba9d62ed. Prospective protocol sha256:8b7d1ae2c991d9fa769c8ad8ea242bad4cb4f43e45eacf25115d2787b6438b02; execution sha256:927e9cead59805fefeae1a6d7386e5e145403a8fb9b73d274241601dc04d08e1. Corpus,256-case inventory and actual observer/harness roots match the preceding run. Read-only Docker check returned29.4.0 and the exact pinned image is present. No result is inferred. The sole destination is now reserved; there is no second attempt or fallback destination.
