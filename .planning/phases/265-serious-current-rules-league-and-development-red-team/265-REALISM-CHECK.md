---
phase: 265
status: source-repair-focused-passed-independent-review-pending
source: 9c910d828776d9f1497493f72f6be775d09acc67
date: 2026-09-21
empirical_authority: false
---

# Full-Match storage realism check

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
