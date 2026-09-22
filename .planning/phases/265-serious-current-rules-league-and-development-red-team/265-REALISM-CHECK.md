---
phase: 265
status: actual-retained-json-round-trip-and-source-gate-passed
source: 3d25b37e6ad2eb3edbfb298615d85128c98360e1
date: 2026-09-21
empirical_authority: false
---

# Full-Match storage realism check

## Actual saved-execution result at final reviewed source

Main's data-only diagnostic at3d25b37e passed after source repair and independent
re-review. The actual11,981,860-byte old execution was published to a fresh
private temporary diagnostic repository and reopened. All JSON values compare
exactly, and the original file SHA-256 is unchanged. No Match, provider, replay,
model, authoring, allocation or canonical evidence publication ran.

- Witness SHA-256: `7d31687cbc7b681ed7dee3bc8e167aaeac44d6f8448525f2995661926835da02`.
- Diagnostic root: `sha256:38139037bde20dc49d060bd15a771dacb01302a3d0e33262d03b8c83a9dc8647`.
- Input JSON:11,981,860bytes; stored:12,183,083bytes; overhead:201,223bytes (~1.68%).
- Physical artifacts:190, within diagnostic-only64MiB/1,024-file limits.
- Diagnostic directory: `/private/var/folders/y0/jbhcmp0j0d3gvpc40xtm0r3w0000gn/T/league-265-storage-kxn1ay`.
- `jsonDataEqual:true`, `canonicalNullPrototype:true`,
  `historicalBytesUnchanged:true`, `issued:false`, `empiricalAuthority:false`.

The first additional `isDeepStrictEqual` check returned false because the
canonical parser intentionally builds prototype-free objects while JSON.parse
creates ordinary objects (`packages/spec/src/canonical-json-parse.ts:102`).
That diagnostic exited1 and is not called a pass. A separate read-only reopen
compared JSON data independently after removing that host-prototype distinction;
it exited0, with every key/value intact and unchanged historical bytes. No code,
evidence, assertion about JSON data, or canonical limit was changed to get a pass.

This is storage compatibility evidence, not new competitive evidence or an
empirical-budget forecast. Measured real-trace overhead1.68% differs from the
earlier synthetic0.247%; do not extrapolate one synthetic ratio as a guarantee.
Final source gate96544 completed: 29/29 suites,273/273 tests,1773.05seconds.
The separate explicit fail-fast build/type/boundary chain84943 also passed at
unchanged3d25b37e. These source proofs do not establish a future run's capacity.

## Earlier discovery and repair history

## Additional invocation-size diagnostic — read-only recorded-action replay

Main used the same pure-kernel replay pattern as the retained verifier, with
the saved Phase263 attempt19 metadata, frozen feasibility cell, revision IDs,
recorded runtime results and original `maxPhases:100`. No Strategy, provider,
container, model, author or new empirical action ran; no file was written.
Each request ID, method, input root, charge/completion flag, invocation ordinal
and unique invocation root was checked before consuming a saved result. Every
canonical transition and the final state/events matched the saved execution.

Captured at3d25b37e, exit0:

-417recorded invocations;1,286transitions; all request roots/transitions/final
  state/events match; original SHA-256 unchanged.
- Exact untransformed wrapper payloads total3,651,614canonical bytes.
- Individual wrappers:7,810..19,222bytes; mean8,756.868bytes.
- The current chunking formula yields1,251graph artifacts before deduplication
  (three per wrapper). This excludes cleanup, journals, result, report and
  factory-supervision artifacts; payload bytes exclude chunk/graph descriptor
  bytes and filesystem allocation overhead.

An initial diagnostic correctly stopped before replay when it compared raw
internal initial state with a canonical transition projection. The latter sorts
terrain and excludes private memories (`kernel/validate.ts`), so those are not
the same representation. The corrected diagnostic uses the engine's existing
`projectCanonicalStateForRecording` for that check, then compares every recorded
transition exactly. No engine, data, equality requirement, or historical policy
was changed. The original interrupted diagnostic is not claimed as a pass.

This measurement describes one authenticated old witness, not the future
Phase265 candidate population or its resource ceiling. In particular the old
100-Phase bound is historical and must never be adopted for the new full league.

## Original discovery

Latest: source65b5cf63662f46151b8ddcb014d5799594e4c0de implements a versioned bounded
execution stream preserving small v1 roots and charged publication failures.
Focused tests pass; independent review and actual old-trace round-trip remain.
The synthetic9,204,904-byte diagnostic used146artifacts/9,227,650stored bytes
(0.247%overhead). This is format evidence, not live throughput or budget approval.
Baseline gate97524 at9c finished269/269tests; it predates this new implementation.

While the corrected source suite was running, main inspected existing Phase 263
trace file sizes and tested data-only canonical admission of one saved execution.
No Match, Strategy, runtime, author/model call, new allocation or file write ran.

The 24 saved trace files in `.strategy-lab/phase263-feasibility-calibration-1/lab-matches`
range from **5,740,335 to 11,981,860 bytes**; eight exceed 8 MiB. The largest is a
complete JSON execution with fields `kind`, `privacy`, `result`, `transitions`
and `accounting`; its transitions alone occupy10,839,210 JSON bytes.

Applying the same `admitCanonicalJsonValue(value, {profile: "canonical-manifest"})`
used by the current league graph returned:

```json
{"ok":false,"error":{"code":"MAX_NODES_EXCEEDED","path":["transitions",469,"afterState","soldiers",12,"id"],"byteOffset":5102451,"owner":"system_failure"}}
```

`LeagueRecordGraph.publish` encodes an entire logical value before splitting its
bytes into131,072-byte chunks. Its cell/result and response paths currently embed
the entire execution in that value. Chunking after failed admission cannot admit
a representative full Match. This is an actual retained-data compatibility
counterexample, not a new empirical Phase265 run or a measured OOM.

Independent `/root/265_memory_scale_check` source review confirmed the complete
caller/reader gap and identified a bounded composition repair. Keep all existing canonical limits, immutable
historical evidence, small-record roots, accounting, deterministic replay and
runtime/gameplay boundaries. Do not fix this by raising the canonical global
byte/node cap, dropping transitions, truncating Matches, or pretending the
small injected fixtures demonstrate full-Match storage feasibility.

The full source test gate at9c910d82 is still useful regression evidence, but
cannot close this independently identified realism gap. Repair stays within
existing Plan265-07 source verification; it needs no new phase/numbered plan,
allocation, external custody or human-only product decision unless source review
establishes that preserving the approved limits is actually impossible.

## Independent source findings

The unchanged canonical limits are8MiB and262,144nodes. The league's composed-byte
helper also caps one logical byte value at8MiB. Existing factory supervision
already shows the suitable pattern: independently canonical header, event,
transition and accounting records, framed and chunked after individual admission.
Retain v1 small-record roots; version the private oversized execution envelope,
authenticate the ordered stream and commitment, and reconstruct one execution
on demand under total allocation byte/record budgets. Never enlarge a limit or
drop evidence to make this pass.

The source review additionally traced a related failure-order gap: a successful
journal terminal can be retained before the large cell-result append fails.
Retained verification then lacks its required result. Repair this same source
path without rewriting a persisted terminal or claiming an unpublished score.
Adjacent whole-events/gameplay roots and replay comparisons must also be checked
for aggregate admission assumptions. These are ordinary private implementation
repairs, not a new authority, phase, numbered plan or rules decision.

For realistic capacity checks, the same24old traces contain637..1286transitions
(mean856.1667),192..417accounting records(mean270.75), and1062..2183result events
(mean1445.9167). These are historical sample sizes, not a claimed Phase265
throughput forecast, empirical proof or permission to execute more work.
