---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-validation-source-only
subsystem: private-replay-integrity
tags: [synthetic, gzip, canonical-json, tdd, v5]
requires:
  - phase: "265-15"
    provides: existing compact replay container and guarded decoder
provides:
  - additive frame-at-a-time canonical replay validation without returned frame arrays
  - fully admitted prospective v5-only evidence-reader selection
affects: [private-prospective-v5-source-review]
tech-stack:
  added: []
  patterns: [bounded buffered inflate with parse-and-discard frame validation]
key-files:
  created: [scripts/run-v1-38-lean-replay-validation-v5.test.ts]
  modified: [packages/strategy-lab/src/league/lean-experiment.ts]
key-decisions:
  - Preserve every full audit and the original decoder and fixed policy bytes.
  - Select validation-only behavior only after exact v5 discriminants and full allocation admission.
requirements-completed: []
requirements_completed: []
status: complete
completion_scope: source_implementation_tasks_only
independent_source_gates: pending
execution_authorized: false
empirical_credit: false
phase_complete: false
completed: 2026-10-05
duration: approximately 7 minutes from earliest recorded fixture invocation; context preparation not separately timed
source_base: e5545f7d
source_head: 9e043a40
source_file_root: sha256:6372438dbf0fe8257cc9b6fd84cab89eb0878e31a7040079ccdddee3d4dff222
fixture_file_root: sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382
---

# Phase 265 Plan 16: Replay Validation Source Summary

Strictly admitted prospective v5 evidence now validates every canonical replay frame without retaining full replay text, split lines or parsed frame arrays. Both serial source implementation tasks are committed; independent review → in-scope fixes → validation → source verification remain pending with MAIN. This is not overall Plan16, Phase265 or empirical completion.

## Accomplishments

- Added `validateLeanReplay(container, bytes, maximumBytes): void` beside the byte-unchanged decoder. It retains the existing full synchronous inflate Buffer, counts delimiters without an offset array, verifies terminal newline/frame count, then UTF-8 decodes/re-encodes and canonically parses each frame individually, discarding every result.
- Preserved metadata/root/compressed-byte validation order, original 4× declared-inflate transient guard, same gunzip `maxOutputLength`/catch, inflated byte/hash checks and existing finite failure codes. Empty zero-frame payload and replacement-round-trip UTF-8 semantics match the decoder.
- Selected the additive path in actual `verifyLeanEvidence` only for the two exact prospective v5 schema labels after `admitLeanAllocation` and admitted supervisor-mode confirmation. Default/legacy paths still call the original decoder; evidence records, statuses, events, charging/unused coverage and evidence-root construction are unchanged.
- Exercised actual reader/admission/parser/hash/gzip behavior using small trusted in-memory fixtures and isolated temporary0700 ledgers. No validator, allocation admission or evidence reader is stubbed. Process-memory/resource samples are artificial low arithmetic inputs, never available-memory evidence. Child-process/Worker creation is denied; filesystem interception refuses historical/private paths, allows the named source bytes and only registered synthetic directories/descriptors, and all mocks are restored.

## TDD Task Commits

1. Task1 RED: `924a7dd7` — failing validation contract fixtures committed before implementation. Final RED gate:44 failed/1 passed/1 wiring selector exclusion,1.78s. A pre-gate hoisted-import harness error was corrected before that gate.
2. Task1 GREEN: `4661dd8d` — additive validator and corrected trusted fixture construction.45 contract tests passed/1 wiring selector exclusion,1.69s. Two fixture-construction errors were fixed without changing decoder expectations: an invalid root had been inadvertently re-rooted, and an unsafe count had been rejected by the trusted fixture root builder rather than reaching metadata admission.
3. Task2 RED: `fd8e6047` — actual synthetic evidence wiring regressions committed before branch implementation.8 failed/17 passed/45 contract selector exclusions,2.05s. The failures proved original v5 full-text materialization and missing passed-v5 allocation authentication; a nonconstructible Worker-denial mock was fixed before the final RED gate.
4. Task2 GREEN: `9e043a40` — narrow exact-v5 admission/validation branch. Full dedicated file70/70 passed,0 failed,0 skipped,2.27s.

No TDD gate was bypassed. No additional source task, dependency or numbered plan was created. No tracked file was deleted. Existing historical untracked files, caches and locks were preserved.

## Verification Evidence

Only the dedicated fixture file was executed, via bounded60-second wrappers around:

```sh
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts -t contract --maxWorkers=1
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts -t wiring --maxWorkers=1
node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v5.test.ts --maxWorkers=1
```

The final full dedicated run passed70/70 with no skips. Contract fixtures cover exact/missing keys, discriminator/root/count failures, compressed/inflated hashes and sizes, small exact/output-limit cases, corrupt/truncated gzip, terminal-newline/frame-count errors, empty/blank frames, first/middle/last canonical failures, key/number/depth constraints, primitives/objects/arrays, escaped newline/multibyte text and malformed/truncated UTF-8 parity. Instrumentation observes the real pre-inflate guard/maxOutputLength and individual parser visits. Region-scoped AST checks prohibit validator text/line/frame collections without penalizing the preserved legacy decoder.

Wiring fixtures authenticate actual synthetic diagnostic-v5 and baseline-v5 allocations and visit all selected sampled/failure replays. Real buffer-to-text observation distinguishes v5 parse-and-discard from default/legacy versions0–4 full-payload decoding. Expected complete evidence objects/root are independently assembled from synthetic charge/terminal/unused events. Forged v5 caps/approval/supplement/policy/root/sample/extra fields and retained unsupported/mislabeled versions fail before inflate. Fully rehashed malformed final frames, absent sample/failure replay, charged-without-terminal and unexpected unselected replay fail through the actual reader. No real replay was read.

Additional non-executing checks:

- Strategy-lab typecheck passed: `node node_modules/typescript/bin/tsc -p packages/strategy-lab/tsconfig.json --noEmit --composite false --incremental false`. No package script or empirical hook ran.
- Dedicated fixture TypeScript `createProgram` no-emit admission passed with NodeNext/ES2022, strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, verbatimModuleSyntax and isolatedModules. This is not a broad script suite or whole-repository typecheck.
- `git diff --check e5545f7d HEAD` passed. Base-to-source-head diff contains exactly the two owned source/test files.
- Stub scan found no new production stubs; synthetic zero telemetry/null outcome/unused records are explicit test-only inputs, not gameplay results. No new endpoint, auth path, public import, engine/rules change or unregistered threat surface was introduced. Existing private file/inflate/parser surfaces are covered by the supplement threat register.

## Immutable Compatibility Pins

All three dedicated byte-pin assertions pass against pre-edit captured regions:

| Region | Raw SHA256 |
|---|---|
|Original decoder|`b2115d6b20d40a213e5d62398c905bfd306e88078f5bfa51b5a145fba0f08b2c`|
|LEAN_CAPS, v5 caps, approval/supplement roots, startup policy initializers|`5263de232b1da25075e3ccbe016414011b23a93d1d607b7aacdae38366fe8486`|
|Replay ceiling, external reserve and transient guard|`a7a80f3082cce78eed4a19b7a01276a82bb49a7170bd114004d2dd2070327792`|

The encoder, full-audit callers/cadence, sealed STARTUP plan/approval/supplement/policy bytes, source-manifest logic, historical allocations/journals/results/checks/readers and all caps remain unmodified. Static source inspection confirms the implementation file is already an explicit manifest entry; its changed bytes necessarily change future measured identity. The new dedicated test is excluded by the inherited test-file filter and absent from explicit v5 additions: its independently recorded byte hash above binds synthetic proof, **not** the runtime closure. No full manifest/helper was executed and no old source carrier/root is made valid for modified code.

## Resource and Authority Boundary

At the local wall observation2026-10-05T23:46:16.242Z (`now=1791243976242`), conservative arithmetic from the supplied latest closed custody gives:

`33812347 + max(0, 1791243976242 − 1791242322180) = 35466409ms`

This leaves7733591ms below the unchanged43200000ms cap **at that observation only**. All later report/commit/review/validation/admin time continues carrying from the same closure; this calculation is not a new authenticated receipt or capacity admission. No accounting journal was edited, interval reset/refunded/recredited, new time allocation or peak sample invented. Same15GB/300Match envelope,24 already-spent Matches and every surviving-file debit remain. All replay/scratch/retained/terminal/reserve/guest/host/Match/startup/cancellation limits remain fixed.

No real payload/historical or ordinary retained reader, empirical request/allocation/carrier/helper, Strategy, Match, Worker, Docker, provider, cold regeneration, formation, holdout or downstream execution occurred. No broader/native/script suite ran. Buffered inflate remains; there is no streaming-decompression, lower-RSS, allocating-cause, native-feasibility or complete36-Match baseline claim. The failed baseline remains failed/consumed, the accepted diagnostic remains immutable, LEAG requirements remain empty/uncredited, and Phase265/freeze/formation/holdout/public/counted/production remain uncredited. Any future Match requires new bounded human approval and separately reviewed/admitted source/data/capacity/custody.

## Deviations and Handoff

No scope or contract deviations. Fixture corrections above were ordinary pre-GREEN test development; oracle admission/failure expectations were not weakened. Per the checked supplement and MAIN instruction, normal numbered-plan STATE/ROADMAP/requirement advancement was deliberately not performed. This source-only summary does not replace historical reports or the original unfinished Plan16 summary.

MAIN must perform independent exact-diff review, any in-scope fixes, independent validation and source-goal verification into separately named supplemental reports. No independent gate is claimed by this executor, and there is no automatic empirical continuation.

## Self-Check: PASSED

Both created/modified source files exist. All four RED/GREEN commit hashes exist in current history in the required serial order, no unexpected deletion occurred, the two source byte hashes and three compatibility pins are verified, and the full dedicated suite/typechecks passed. The summary is written as the separately named required artifact; independent gates remain explicitly pending.
