---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "13"
subsystem: four-language-conformance-runner
tags: [typescript, python, rust, zig, conformance, oracle]
status: complete
completed: 2026-07-16
requirements-completed: [CONF-01, CONF-02, CONF-03]
---

# Phase 259 Plan 13: Four-Language Full-Trace Runner Summary

One mandatory ordered corpus now drives TypeScript, Python, Rust, and Zig lane results against the same immutable reviewed trace authority. The retained pairwise parity suite is explicitly non-promoting regression evidence.

## Delivered

- Added the complete per-language corpus runner and four-lane matrix aggregator.
- Required exact real-adapter selectors and process-local result authority minted only by the supervised TypeScript, Python, and Rust/Zig adapters.
- Required every lane to return every mandatory case in canonical order with the expected success, player-violation, or system-failure class.
- Compared complete canonical traces to the committed reviewed oracle and returned only restricted lane/case/coordinate/hash divergence data.
- Bound safe signed-evidence roots, invocation-request roots, and exact language identity roots into each passed case and the whole-run root.
- Rejected replayed signed invocation evidence, declaration-only execution, unavailable runtimes, incomplete lanes, duplicate lanes, trace divergence, and cross-oracle aggregation.
- Kept system failures non-promoting with no run root and no gameplay mutation.
- Labeled the older four-language pairwise integration suite `non_promoting_regression_only`.

## Review Corrections

- Removed the expected oracle trace from the executor callback; executors receive only the corpus case and language fixture.
- Replaced declaration-shaped adapter results with unforgeable process-local WeakSet authority from the actual supervised adapters; structured clones are rejected.
- Loaded the active oracle only from regular no-follow files and an exact active directory.
- Recomputed the candidate manifest root, semantic-diff root, trace-file hashes, and trace roots at load time.
- Required exact manifest, review, disposition, protected-category, inventory, tuple, corpus, and no-semantic-delta consistency.
- Hid mutable trace storage behind a frozen lookup closure and froze the public case inventory.

## Verification

- Joined runner and adapter suites: 5 files, 55 tests passed.
- Runtime-service, runtime-js, runtime-python, and runtime-wasm-wasi typechecks passed.
- All four affected package lint suites passed.
- Focused Prettier, `git diff --check`, and the protected working-tree baseline check passed.
- Runner tests exercise orchestration through mocked verifier boundaries; the three adapter-package suites separately prove that only actual adapter-returned objects carry result authority.

## Commit

- `85a0941` — require branded four-language trace execution

## Next Readiness

Plan 259-16 can compose the real lane executors in fresh child processes, run each full corpus three times, and persist independently reviewable candidate results without granting production trust.
