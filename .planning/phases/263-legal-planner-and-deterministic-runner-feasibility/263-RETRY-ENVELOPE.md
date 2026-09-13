---
phase: 263
plans: [263-02,263-06,263-07]
status: approved_not_started
approved: 2026-09-13
operator_response: approved
maximum_fresh_attempts: 3
attempts_started: 0
stop_on_first_full_pass: true
original_run_consumed: true
---

# Phase263 — Approved bounded repair-and-test envelope

The operator approved the immediately preceding proposal: **up to three fresh bounded attempts, all limits unchanged, with Matches only after validation and timing pass.** This additive revision applies to existing Plans02/06/07. It supersedes their ban on any further empirical allocation only to this limited extent; it does not reopen the original run or authorize unlimited retries. No exact literal, source seal, external custody service or new numbered plan is required.

## Fixed bounds for each attempt

- One exact source candidate and independent source review frozen before execution.
-256 fixed validation case slots (232 expected guest calls plus24 expected pre-runtime rejections on complete pass).
-2200 benchmark calls:100 warmups and1000 measured per method, unchanged corpus/order/observer and nearest-rank p99; both direct-method p99 values must be strictly below5ms.
- Only complete validation/timing pass allows up to24 fresh Match attempts under the existing12-label/two-pass,8-scientific-cell protocol, worker/shard/order/checkpoint/resume variants and trace review.
- Existing canonical kernel/rules/formation absence, selected runtime, per-method1000ms,2CPU/256MB container, source/memory/objective/output limits,256expansions/beam4, deterministic accounting and privacy remain unchanged.
-120000ms per Match,3600000ms per run including build/startup/validation/benchmark/Matches/cleanup. Each run has zero internal retries. The envelope contains at most three such runs (at most180minutes of measured run time); source-only ordinary repair remains outside the measured timebox.
- Stop on the first full pass, otherwise after the third terminal outcome. Any failure remains charged and immutable. No fourth attempt or relaxed gate is authorized.

## Predeclared destinations and accounting

| Envelope ordinal | Manifest under this phase directory | Private output under repository | State |
|---|---|---|---|
| 1 | `263-feasibility-retry-1-manifest.json` | `.strategy-lab/phase263-feasibility-retry-1` | unused |
| 2 | `263-feasibility-retry-2-manifest.json` | `.strategy-lab/phase263-feasibility-retry-2` | unused |
| 3 | `263-feasibility-retry-3-manifest.json` | `.strategy-lab/phase263-feasibility-retry-3` | unused |

The orchestrator reserves the next ordinal before its final preparation; it will not reuse a terminal/partially prepared destination. Every successful preparation gets exactly one --run invocation. Existing no-clobber manifest, consumed-marker and per-call/Match charge publication remain authoritative within each attempt. Cross-attempt accounting identifies units by envelope ordinal plus manifest/attempt root, not by a reused label alone. Every unused unit remains unused; no old Match capacity is rolled forward.

The original `263-feasibility-manifest.json`, `.strategy-lab/phase263-feasibility`, original `263-REVIEW.md`, all Phase262 evidence and36historical locks remain unchanged. New attempts use separately named reviewed source bindings. A narrow optional explicit review-path argument is allowed so the CLI can bind the new independent review without altering historical review bytes. This is review selection, not a runtime/admission bypass.

## Ordinary repair and continuation

Between failed attempts, the agent may diagnose retained evidence, implement behavior-preserving source/reporting repairs, run safe pure/injected tests and obtain focused independent review. It may not take extra uncharged source timing samples or use a weaker execution lane. Candidate, execution and review roots are frozen separately for each fresh attempt; no after-the-fact manifest rewriting.

After a full pass, independently verify the retained result, close Phase263's validation/UAT gaps and continue to Phase264 through the existing autonomous GSD flow. The serious current-rules league must still freeze before any formation experiment; no broader gameplay, holdout, public or counted-play authority is added here.

## Attempt ledger

No attempt started at approval recording. Append actual reserved/terminal identities, counts and outcomes as they occur; do not infer a pass from source review or pure tests.
