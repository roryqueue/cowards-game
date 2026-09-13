---
phase: 263
plans: [263-02,263-06,263-07]
status: attempt_2_reserved
approved: 2026-09-13
operator_response: approved
maximum_fresh_attempts: 3
attempts_started: 2
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
| 1 | `263-feasibility-retry-1-manifest.json` | `.strategy-lab/phase263-feasibility-retry-1` | consumed: validation passed, selection timing non-pass, zero Matches |
| 2 | `263-feasibility-retry-2-manifest.json` | `.strategy-lab/phase263-feasibility-retry-2` | reserved for sole prepare/run |
| 3 | `263-feasibility-retry-3-manifest.json` | `.strategy-lab/phase263-feasibility-retry-3` | unused |

The orchestrator reserves the next ordinal before its final preparation; it will not reuse a terminal/partially prepared destination. Every successful preparation gets exactly one --run invocation. Existing no-clobber manifest, consumed-marker and per-call/Match charge publication remain authoritative within each attempt. Cross-attempt accounting identifies units by envelope ordinal plus manifest/attempt root, not by a reused label alone. Every unused unit remains unused; no old Match capacity is rolled forward.

The original `263-feasibility-manifest.json`, `.strategy-lab/phase263-feasibility`, original `263-REVIEW.md`, all Phase262 evidence and36historical locks remain unchanged. New attempts use separately named reviewed source bindings. A narrow optional explicit review-path argument is allowed so the CLI can bind the new independent review without altering historical review bytes. This is review selection, not a runtime/admission bypass.

## Ordinary repair and continuation

Between failed attempts, the agent may diagnose retained evidence, implement behavior-preserving source/reporting repairs, run safe pure/injected tests and obtain focused independent review. It may not take extra uncharged source timing samples or use a weaker execution lane. Candidate, execution and review roots are frozen separately for each fresh attempt; no after-the-fact manifest rewriting.

After a full pass, independently verify the retained result, close Phase263's validation/UAT gaps and continue to Phase264 through the existing autonomous GSD flow. The serious current-rules league must still freeze before any formation experiment; no broader gameplay, holdout, public or counted-play authority is added here.

## Attempt ledger

Attempt1 reserved after the optional review binding passed9focused tests and TypeScript, independent delta review was clean, and Docker29.4.0 plus the exact pinned image were available. Source commit6ab67731; review263-RETRY-1-REVIEW.md; emitted source026983d62848aefa2d29fbf7a92bf05adb8c75121fa27cb3093a1a18576e9c24; executiond9672f7fffe8831af2ccff83aa29ad62c337a4ef9cd8c71c6ff8424929290db3. Two envelope slots remain unused. Record actual manifest/counts/result after terminalization; no pass is inferred here.

### Attempt1 terminal — 2026-09-13

Prepared and invoked exactly once over committed HEAD5ef8f332. All256validation cases passed (232guest calls,16source rejections,8input rejections). All2200benchmark calls completed without uncertainty. Direct-method p99: selection33.819629ms, SoldierBrain2.629893ms. Selection fails the unchanged strict<5ms gate; therefore zero Matches ran and24slots remain unused. Cleanup completed; no owned container remained. Elapsed579400.404474ms (9.66minutes), host peak RSS798836KiB. Read-only --verify independently rederived non_pass before further source work.

The call-local caching repair reduced observed selection p99 from64.135270ms to33.819629ms but did not establish feasibility. This is a comparison between separate bounded runs, not controlled component profiling. Ordinary exact-output scoring optimization continues within Plan02. Attempts2and3 remain approved and unused; no repeated operator checkpoint is needed before them.

Retained private evidence is never committed. Bindings:

- Manifest logical root: `sha256:534e52dc99b7e833233fde071ca9f6b884ef0be78a9e6d509feaf8d9ca33a544`.
- Receipt bytes: `sha256:06010f915fe96c8a7ca714a84014f2dac1eaeb36f989fdc4ac289b61e8fd629a`.
- Consumption bytes: `sha256:b5b37e4b3025236755a76915885f46ed9b885bb58546890330cc5215a6f392c7`.
- Validation result bytes: `sha256:1fd593fc5be37f3a9cb6c48f93be83085ee13947a5299c0e60df8b5ecd85f9fd`.
- Benchmark result bytes: `sha256:661bd789506e889fa7d900e6a519114379c8087551471e4b72d4ecd6a9d870fb`.
- Benchmark cleanup bytes: `sha256:b6ec473e56d103e26a99e6e8edcf60c21a035f16b262cf143a915a2d31f316df`.
- All36historical lock names/bytes retain aggregate `390aa9bdded6289a80d4df07a170c00edaff5bd30d7153375c825664ad614059`.

Historical verification must use this attempt's source and retained files; later source repairs must not rewrite its manifest to bypass drift checks.

### Attempt2 reservation — 2026-09-13

Reserve attempt2 after mission construction and paired assignment scoring optimizations atab102872/7acd0ba2,49combined safe integration tests, corrected final12assignment tests/package build and clean independent five-file review in263-RETRY-2-REVIEW.md. Both full initiative vectors, all256expansions, beam4 and complete output/counters remain unchanged in differential tests. Source is32265bytes, `sha256:bfaf8b6a6c2a4eaef9b4b0c8c64b3ea33111c38279b15529923244cd9b7ffa2b`; execution `sha256:ec7691e692f6e699bb514cf4249c8773be283a1badb1aad5b8a1155e9c776dd8`. Protocol/corpus/inventory/harness roots remain unchanged. Docker29.4.0 and the exact pinned image were available read-only. Final source is unmeasured at reservation; no pass is inferred. Attempt3 remains unused.
