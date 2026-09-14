---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: supervision-artifact-storage-reopen
checked: 2026-09-14
status: passed
targeted_test: 4/4 passed
open_gaps: 0
---

# Supervision Artifact Storage Check

This is a bounded data-only persistence review of the new private supervision-artifact helper. It does not execute candidate source, a guest, a provider, or a Match, and reopening intentionally grants no renewed issued-receipt authority.

## Evidence checked

- `packages/strategy-lab/src/factory/supervision-artifacts.ts`
- `packages/strategy-lab/src/factory/supervision-artifacts.test.ts`
- `packages/strategy-lab/src/factory/repository.ts`
- Receipt/commitment helpers in `factory/admission.ts`

Targeted command:
`./node_modules/.bin/vitest run --maxWorkers=1 packages/strategy-lab/src/factory/supervision-artifacts.test.ts` — **1 file and 4 tests passed** (including the >8 MiB fixture, 8.27 seconds of test time).

## Checks

| Check | Result | Evidence |
|---|---|---|
| Bounded chunk persistence | PASS | Canonical JSONL records are streamed into raw-byte artifacts capped at 262,144 bytes; individual records may span chunks. Descriptor byte length and chunk count are checked on reopen, and repository publication rejects larger individual artifacts. |
| Chain order and byte binding | PASS | Each chunk descriptor carries ordinal, previous-root, bytes-root, and exact byte length. Reopen walks the tail backward, places bytes at their original offsets, requires ordinal/length continuity, requires a null predecessor at the head, and verifies repository digest identity. |
| Record ordering/content and loss detection | PASS | Record kinds have a fixed receipt→execution/result→transition→accounting→trace order; per-kind ordinals are checked. Receipt/execution counts, total record count, newline framing, execution mode, result/unchanged state, and all transition/accounting/trace records are validated before returning. The 1,500-transition plus oversized-record fixture round-trips exactly. |
| Receipt/execution/trace roots | PASS | Reopen reconstructs execution commitments and trace ordered-record commitments, then recomputes the receipt root from stored authorization metadata, candidate identity, execution, and traces. Descriptor root, receipt root, execution root, and traces root must all agree. |
| Privacy and publication boundary | PASS | Artifacts are private/offline and repository files are mode-600 content-addressed artifacts. The public returned descriptor excludes raw records; the focused test confirms injected strategy memory is not exposed in it. Raw private records remain only in the private repository by design. |
| Limits and failure retention | PASS | `maxBytes`/`maxRecords` are safe nonnegative integers and are enforced before reconstruction and while parsing. Failure executions retain unchanged state and failure metadata; forged descriptor roots/commitments, truncated/corrupt chunks, and over-budget reads fail closed. |
| Authority semantics | PASS | Publishing requires an exact live issued supervision receipt. Reopening returns `issued: false`; a reopened value is not accepted by the issued-receipt WeakSet check. Reopening therefore preserves evidence without minting execution authority. |

## Disposition

No ordering, content-loss, byte-domain, privacy, budget, or authority defect was found in this bounded helper. The implementation preserves a full private receipt as independently rooted chunks without raising the canonical-manifest aggregate cap. It does not independently prove producer authenticity after reopening; that is intentional and correctly represented by `issued: false`, not a renewed WeakSet authority.

_Independent bounded storage review; no source edits or commit performed._
