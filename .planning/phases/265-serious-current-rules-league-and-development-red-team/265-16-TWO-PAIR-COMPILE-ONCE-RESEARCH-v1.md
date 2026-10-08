# Plan 16 — prospective compile-once source research (v1)

**Scope:** Additive source-only planning note for the still-unused pair 2. This is not an approval, source change, allocation, test run, empirical admission, or change to the existing numbered plan. Findings below are grounded in the checked-in code and retained phase records; no external package or runtime research is needed.

## Decision and bounded recommendation

Recommend one minimal pure seam: within one `buildStrategyRevision` call, perform the real TypeScript transpilation once, pass that exact result into an internal validation routine and an internal TypeScript artifact factory, and preserve every existing validation and artifact check. Keep exported `validateStrategySource(source, options)` behavior and signature unchanged; it continues to perform its own transpilation when called independently. Keep exported `buildTypeScriptSourceArtifact(input)` standalone behavior unchanged. Do not inject caller-supplied transpilation into either public API.

This is an implementation-ready candidate, not a demonstrated cure. The current resource receipt is `resource_threshold`; no retained simultaneous sample identifies the initiating allocation or native cause. The debug record explicitly says memory/RSS causality and benefit remain unknown. [VERIFIED: `.planning/debug/v11-baseline-precharge-memory.md`; `packages/runtime-js/src/revision.ts`; `packages/runtime-js/src/validation.ts`; `packages/runtime-js/src/source-artifact.ts`]

## Evidence and current flow

- `buildStrategyRevision` calls `validateStrategySource` and then, for TypeScript without a metadata-supplied artifact, calls `buildTypeScriptSourceArtifact`. [VERIFIED: `packages/runtime-js/src/revision.ts`]
- `validateStrategySource` calls `transpileStrategySource` to produce `TRANSPILE_FAILED` validation output. The artifact builder independently calls the same function and embeds its JavaScript bytes, hash, and toolchain metadata. The transpile helper is a pure wrapper around `ts.transpileModule` with fixed CommonJS/ES2022/isolatedModules options. [VERIFIED: `packages/runtime-js/src/validation.ts`; `packages/runtime-js/src/source-artifact.ts`; `packages/runtime-js/src/transpile.ts`]
- Therefore the default TypeScript revision path has two transpilation calls for one source. Metadata-supplied artifacts bypass artifact construction today; non-TypeScript revisions also do not build this TypeScript artifact. Preserve both branches. [VERIFIED: `packages/runtime-js/src/revision.ts`]
- Validation includes source-byte limits, forbidden-capability checks, required Strategy API checks, runtime metadata policy, and compatibility checks; reusing compilation must not skip or reorder these in a way that changes the public report. [VERIFIED: `packages/runtime-js/src/validation.ts`]
- This optimization is distinct from the already-implemented one-full-accepted-closure-per-consumer deduplication. Do not relax full audits, cache across consumers, or introduce a context/token bypass. [VERIFIED: `.planning/debug/v11-baseline-precharge-memory.md`; `265-16-TWO-PAIR-SOURCE-VERIFICATION-v1.md`]

## Minimal design contract

1. Factor validation into an unexported/internal routine accepting the actual `transpileStrategySource(source)` result; public `validateStrategySource` delegates after making its own real call and remains output-identical.
2. Add an internal-only TypeScript artifact factory that consumes that same result plus the existing source, validation report, and runtime inputs. Public `buildTypeScriptSourceArtifact` keeps its existing signature and independently transpiles as before.
3. In `buildStrategyRevision`, only the default TypeScript artifact path shares one local transpilation result. If metadata supplies an artifact, preserve current behavior and do not add a second hidden artifact or alter the override. Preserve non-TypeScript and transpilation-failure behavior exactly.
4. No public rules, runtime flags, dependency changes, caching, cross-call state, security-check removal, source normalization change, or history/authority change.

## Test and review plan input

- Compare deterministic revision fields and generated artifact bytes/hash against the current expected output; assert one transpiler invocation for the default TypeScript revision path (instrument the narrow seam without adding a public injection parameter).
- Assert standalone `validateStrategySource` and standalone `buildTypeScriptSourceArtifact` retain their existing results and one independent transpile apiece.
- Cover invalid syntax, forbidden capabilities, runtime metadata incompatibility, metadata-supplied artifact, non-TypeScript runtime, and failure behavior; reports and artifact null/absence semantics must remain unchanged.
- Independently review exact diff and verify no public API expansion/security bypass. Source verification must bind the new complete source manifest and fresh review; the old v11-1 source review cannot authorize a changed manifest.

These are proposed checks, not runs or passes. Existing `packages/runtime-js/src/revision.test.ts`, `validation.test.ts`, and `transpile.test.ts` are relevant entry points; no separate source-artifact test file was found. [VERIFIED: codebase file scan]

## Authority and execution boundary

- Pair 1 is closed with an accepted diagnostic check and actual FINAL; baseline ended `resource_threshold`, zero new charges, cumulative 33. Pair 2 remains unused. Preserve all authentic custody, costs, and files; do not rerun the consumed route or use old source authority for new source. [VERIFIED: `265-16-TWO-PAIR-BASELINE-V11-1-DATA-REVIEW-v1.md`; `.planning/debug/v11-baseline-precharge-memory.md`]
- Any prospective change must remain within the continuous deadline `2026-10-08T01:43:30.738Z`, unchanged 108,000,000 ms cumulative ceiling, 1,860,000 ms reserve, SAME 2 GB / 768 MiB flags, and all existing bounds. No reset, refund, resource adjustment, 36-cell fit assertion, or empirical cure claim. [VERIFIED: `265-16-TWO-PAIR-PLAN-SUPPLEMENT-v1.md`; approval and time-approval records]
- Preserve the existing Plan 16 scope and v10/v11-1 history. If adopted, this is only a source-optimization addendum; obtain fresh source review/verification before any pair-2 data/helper/allocation gate. No execution, Match, helper, allocation, private-payload inspection, or history scan is authorized by this note.

## Open question

Will one fewer `ts.transpileModule` call materially affect parent/child RSS or prevent the observed resource threshold? Unknown; static call count cannot answer it. Only a later separately admitted run under unchanged bounds could supply empirical evidence, and even then the terminal receipt must not be overinterpreted.
