---
phase: 265
plan: "07"
status: data-only-representative-capacity-witnesses-not-a-receipt
empirical_authority: false
---

# Phase 265 lean capacity witnesses

## Scope and status

This is a reproducible, data-only planning witness for the approved prospective
3 → 12 representative path. It is not a `LeagueCapacityPlanInput`, capacity
receipt, host observation, preflight, allocation, reservation, admission, or
completed run. It created no Strategy, Match, provider/model request, holdout,
formation, or empirical evidence.

The first five rows are projected logical artifact bytes and records. The sixth
row is projected extra physical filesystem allocation only: it has zero artifact
records and must not be added to the logical 120 GiB / 8,300,000-record test.
The receipt implementation, not this document, must root and ceiling-scale its
own measurements and perform a fresh host observation before any dispatch.

## Retained witnesses

- Largest retained Phase 263 trace:
  `.strategy-lab/phase263-feasibility-calibration-1/lab-matches/trace-7d31687cbc7b681ed7dee3bc8e167aaeac44d6f8448525f2995661926835da02.bin`
  (`sha256:7d31687cbc7b681ed7dee3bc8e167aaeac44d6f8448525f2995661926835da02`,
  11,981,860 raw bytes).
- Data-only stream-format diagnostic:
  `/private/var/folders/y0/jbhcmp0j0d3gvpc40xtm0r3w0000gn/T/league-265-storage-kxn1ay`,
  root `sha256:38139037bde20dc49d060bd15a771dacb01302a3d0e33262d03b8c83a9dc8647`:
  12,183,083 logical bytes in 190 artifacts.
- Retained Phase 264 factory store:
  `.strategy-lab/factory-264-fresh-20260914-approved-two`, inventory ledger
  root `sha256:bf42aef97fabcb571d46a1612692e2d49a3147ae8f8943f1dabf425574b9f575`.
  The read-only aggregate was 164,632,160 logical bytes in 1,875 files.

The trace's original retained feasibility configuration had `maxPhases:100`.
That fact authenticates the old trace shape only; this witness does not assert
that future Phase 265 Matches have the same maximum or storage shape.

## Six-category representative estimate

| Ordered category | Projected bytes | Projected records | Witness derivation |
| --- | ---: | ---: | --- |
| `invocation` | 18,296,918,784 | 5,794,632 | 4,632 Matches × 3,950,112 bytes / 1,251 wrapper-and-own-descriptor artifacts per Match. |
| `execution` | 56,432,040,456 | 880,080 | 4,632 Matches × 12,183,083 bytes / 190 stream artifacts from the saved-trace format witness. |
| `factory_supervision` | 48,356,436,960 | 378,144 | 1,872 response Matches × two retained copies × 12,915,715 bytes / 101 artifacts per copy. |
| `descriptor` | 4,476,245,864 | 178,712 | 4,428,011,368 bytes / 178,512 root graph, link-group, cleanup, matrix, report and job artifacts, plus the producer envelope below. |
| `journal` | 3,812,082 | 5,542 | 2,760 ordinary cell start/terminal pairs plus 11 factory attempt start/terminal pairs. Response starts are graph records, not ordinary cell journals. |
| `filesystem` | 39,835,549,542 | 0 | Additional allocated-block slack only; it is excluded from logical artifact accounting. |

Logical total (the first five rows) is **127,565,454,146 bytes**
(**118.804587 GiB**) and **7,237,110 records**. Against the approved ordinary
estimate ceilings of 120 GiB and 8,300,000 records, the remaining allowance is
**1,283,564,734 bytes** and **1,062,890 records**. The 8,300,000 ceiling is
9,000,000 total records less the 200,000 terminal reserve and 500,000 ordinary
headroom; it is not 8.5 million.

Adding only the filesystem row gives a physical-storage estimate of
**167,401,003,688 bytes** (**155.904334 GiB**). This is not a current-free-space
finding: actual fresh host space, device identity, and process headroom remain
mandatory future preflight observations.

## Remaining producer and root metadata envelope

The descriptor row includes **48,234,496 bytes / 200 files** not contained in
the Match wrapper, execution-stream, factory-supervision, root-graph, or journal
rows. Its fixed file count is:

- 44 request/disclosure/provenance/review roots (four × 11 jobs);
- 56 source/packet/proposal/validation artifacts for 14 distinct candidate sets
  (three bases plus 11 produced candidates);
- 11 authoring results, 11 ingestions, 22 lineage/dependency nodes, 11
  fingerprint artifacts, 11 publications, and one allocation artifact;
- 15 records for five model raw streams and 18 records for six teacher search
  streams, each represented by one payload/chunk-descriptor/stream-descriptor
  group.

The byte expression is:

```text
11 × (131,072 + 2 × 262,144) + 14 × 65,536 + 153 × 262,144
= 48,234,496 bytes
```

This applies the source's 131,072-byte raw chunk cap, 65,536-byte Strategy
source cap, and 262,144-byte canonical-record cap. The one-chunk raw-stream
term is representative rather than a hard future maximum: the retained model
raw witness was 117,467 bytes, below one chunk. A longer raw stream or changed
retained adaptation payload must be measured and reconciled by the future
capacity plan/receipt; it cannot inherit this allowance silently.

The physical filesystem row is the corrected nonlogical block-extra expression:

```text
37,084,895,118 wrapper slack
+ 375,253 × 4,632 execution extra
+ 68,851 × 3,744 factory extra
+ 184,054 × 4,096 existing metadata/journal slack
+ 200 × 4,096 producer envelope slack
= 39,835,549,542 bytes
```

It deliberately does not double-count the logical wrapper, stream, factory, or
descriptor payload bytes.

## Reproduction arithmetic

The following command is pure arithmetic and writes nothing:

```sh
node - <<'NODE'
const GiB = 2 ** 30
const rows = {
  invocation: [18296918784, 5794632], execution: [56432040456, 880080],
  factory_supervision: [48356436960, 378144], descriptor: [4476245864, 178712],
  journal: [3812082, 5542], filesystem: [39835549542, 0],
}
const logical = Object.entries(rows).filter(([name]) => name !== 'filesystem').reduce((n, [, [bytes]]) => n + bytes, 0)
const records = Object.entries(rows).filter(([name]) => name !== 'filesystem').reduce((n, [, [, count]]) => n + count, 0)
console.log({ logical, logicalGiB: logical / GiB, records, physical: logical + rows.filesystem[0], physicalGiB: (logical + rows.filesystem[0]) / GiB, byteHeadroom: 120 * GiB - logical, recordHeadroom: 8300000 - records })
NODE
```

## Required reconciliation before use

These figures remain conditional on the current source and retained-format
adaptation. Any source change requires newly derived concrete source and
implementation roots, new rooted measurements, and a new receipt. In
particular, the ongoing source-realism repair may change retained adaptation
payloads; if it does, this estimate must be reconciled rather than treated as a
passing preflight. A complete source gate, independent review, actual producer
identities/provenance, and a fresh host-bound capacity preflight are still
pending. No completed-run or admission claim follows from this witness.
