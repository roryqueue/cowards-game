# Plan265-07 — source-only small-invocation durability repair

Source commit: `e28f29a06664059cc9f495f1030581ea7835504a`.
Independent deep four-file review: `265-07-DEPENDENCY-BARRIER-REVIEW-v1.md`,
clean / zero findings. Root and reviewer independently passed19 focused tests;
root's strategy-lab build passed. The complete unchanged CI source gate is
ACTIVE as session53203, starting at HEAD1595efb3; no complete-gate pass is
claimed before its terminal result.

## Scope and failure boundary

Only single-chunk `runtime-invocation` records without execution-stream
artifacts share a dependency-directory barrier. Payload and chunk-node files
each retain their own full write/file-fsync/exclusive hardlink publication.
Their directory barrier must succeed BEFORE outer descriptor publication;
the descriptor retains its own file-fsync and directory barrier before head
advancement. Journals, starts, terminals, large/streamed records and all other
record kinds preserve their original per-artifact synchronization sequence.

Artifact bytes, hashes, links, physical byte/record accounting, publication
charge order, reserve checks and no-refund policy are unchanged. Interruption
can leave a different subset of uncommitted orphan dependencies. Those are
inspection-only, not a returned/credited graph record or retry authority.
Successful-record durability and failure-before-head guarantees are preserved
under the existing filesystem contract; no hardware crash certification is
claimed. The independent review traced the reused write/link/unlink failure
paths and found no frozen-policy weakening requiring a new operator decision.

Tests delegate real temporary-store filesystem operations, observe file/file/
directory/file/directory synchronization ordering, and inject all five fsync
failure positions. They cover exact bytes, real charge counts, absent/prior
head on refusal, descriptor barrier failure, mixed/all-existing reuse, malformed
and conflicting dependencies, and unchanged large/other-kind barriers. They
do not prove simulated power-loss persistence.

## Bounded retained-input profile

Root reused the fully inspected source-only private harness at
`/private/tmp/league-retained-profile.8yBSuZ/profile.mts`, hash
`57b73822d75a4dec6b6c2954c2aa96a3dfb1bf88c8a04f86d8e50d9e3f44448c`.
It authenticates the same five graph-proven retained rows, writes50 fresh
temporary-store records, and uses an explicitly injected no-op capacity
callback. All50 resulting descriptor roots exactly match the originals.
There is no Strategy, Match, provider, model, Docker or real capacity operation.

| 25-record round | Before append total / median | Repaired total / median |
| --- | --- | --- |
| 0 | 3135.131ms /124.196ms | 2750.977ms /109.980ms |
| 1 | 3141.618ms /124.090ms | 2778.145ms /110.242ms |

Each round retains75 file-fsync calls; directory-fsync calls decrease75→50.
Measured write-time reduction is approximately11.6–12.3%. Host/runtime/kernel/
construction/cumulative-store cost remains unmeasured. This is not a prediction
that the next complete Match or full league fits its frozen timebox.

The ordinary120-second lifetime,96-hour overall stop, resource/accounting,
gameplay/privacy bounds and zero-retry policy are unchanged. Consumed v3 and
all older allocations/results remain immutable. A fresh same-scope route is
covered by standing human approval, but still requires completed source gates,
its own source-bound preparation/allocation and fresh passing capacity. LEAG
requirements and baseline freeze remain pending; formation/holdout/public/
counted/production authority is absent.
