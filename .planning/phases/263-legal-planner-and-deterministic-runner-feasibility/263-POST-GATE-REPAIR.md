---
phase: 263
plans: [263-02,263-06]
status: source_repaired_unmeasured
review_status: clean
empirical_pass: false
new_allocation_authorized: true
---

# Phase263 — Same-plan post-gate repair

Latest2026-09-13: the first approved fresh attempt measured the initial caching repair at selection33.819629ms and brain2.629893ms, an honest non-pass with zero Matches and complete cleanup. Further same-plan source work now shares per-Soldier mission construction/graph-cut rankings and precomputes scoring contributions while evaluating both full initiative vectors together. Commitsab102872/7acd0ba2 passed49integration tests, final12assignment stress tests and package types; independent five-file review is clean in263-RETRY-2-REVIEW.md. Attempt2 is reserved under263-RETRY-ENVELOPE.md; its source is still unmeasured. Original and retry1 evidence remain immutable. Historical repair-stage descriptions below apply only at their original timestamps.

The selection planner now reuses call-local mission facts instead of repeatedly validating and reconstructing them inside the beam. It caches by objective identity, preserves order-dependent penalties and both initiative hypotheses, and keeps the original256-expansion limit, beam size, tie breaks, decisions and returned memory/counters. No game rule, input boundary or search budget changed.

The original selector is retained only as a trusted test reference. All100 mapped inputs across budgets0,1,75,76,255,256 produce identical complete outputs (600comparisons), with separate identity-collision and call-isolation tests. This proves the tested behavior equivalence, not a speedup or arbitrary-input exhaustive equivalence.

Two reporting corrections are also included: benchmark cleanup is derived from the actual close result independently of timing pass/fail; complete retained timing summaries must match rederived p99 values even on a non-pass. Neither rewrites the original failed receipt.

## Integration and review

- Isolated source commits: `cf12aa41ad75a3a0eefed79022ab721d75037fc2`, `2ec35b7be2ebcd37b0f0b60940f79daf0464274f`.
- Integrated on main as `a6ae616d`, `b7f1281f`; independent review and test-helper EOF cleanup committed `48a5598a`.
- Independent focused Terra review:5files, zero active findings;10assignment tests and package types passed. See263-POST-GATE-REVIEW.md.
- Repaired emitted source:25107bytes, `sha256:026983d62848aefa2d29fbf7a92bf05adb8c75121fa27cb3093a1a18576e9c24`.
- Repaired execution binding: `sha256:106c772d5d3edf0a248415966d68063317538b6f57b53564b450a0e6cd59375c`.
- Strict standalone CLI/test TypeScript and package build pass on main. Final focused integration regression passed33/33tests across assignment, emission, information boundary and CLI suites in118.35seconds. No real runtime host or guest was invoked.

## Evidence boundary

Original measured code remains in Git at `d138fdb2fe1767bb1d5439b4c935e1ea91deba0c`. Original manifest, consumption marker, receipt and all36historical lock bytes were hash-checked unchanged after integration. The old263-REVIEW binds only that measured source. POST-GATE-REVIEW is a separate source-only review and grants no runtime allocation.

The historical --verify result was obtained against the historical implementation before repair integration. Reproducing that exact historical check requires the recorded source checkout and retained private evidence; running the changed implementation against the old manifest must reject source drift. Do not change the old manifest to make it match the repair.

No emitted source, timing sample, preflight, host or Match has been run for this repair. The required selection p99 improvement from64.135270ms to strictly below5ms remains unmeasured. Phase263 cannot pass or unlock264 on reference tests alone.

## Human-only boundary

Update2026-09-13: the operator answered **approved** to the proposed maximum-three-attempt envelope. The exact additive bounds and predeclared destinations are recorded in263-RETRY-ENVELOPE.md. The original failed run remains consumed; the approved fresh envelope has not started at this update. The proposal below is retained as approval context, not a separate authority route.

The prior empirical allocation is consumed with zero retries. A new bounded repair-and-test envelope needs operator approval. A recommendation to reduce repeated interruptions is at most three fresh attempts, each retaining the existing256case/2200timing-call limits, strict5ms thresholds, runtime/resources and60-minute per-run cap; Match execution remains conditional on all gates passing and stops within the existing24-Match/120-second-per-Match allocation. Stop the envelope on its first full pass or after its third terminal result. Failed attempts remain charged and immutable. This is a proposal, not authority, and requires no new numbered plan, seal or exact literal.
