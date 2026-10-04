# Projection Repair and Carry v1 — Plan Check

**Result: PASS (narrow Task B supplement check).**

The supplement is consistent with the uniquely closed v4 route and the existing Task B standing approval. The cited terminal report records root entry `28831`, exactly `39,966 ms`, zero charges, a failed terminal, the finite `FACTORY_ASSESSMENT_IMPORT_PROJECTION_LIMIT` receipt, and terminal-only verification. It expressly does not infer the underlying v3 cause or a certified memory peak; source/HEAD hold is released.

## Goal-backward checks

- **Repair preserves evidence semantics:** The plan retains the complete authenticated 48-cell assessment, ordinary status/assessment/threshold roots, historical schemas/readers, and token values/order and comparison behavior. It forbids hash-surrogate tokens and skipped historical validation.
- **Memory guard is addressed without weakening caps:** Exact shared immutable string payloads (and optional exact frozen vectors) are interned before retaining the projected graph. Pool growth is reserved/charged first; accounting includes unique payloads and every reference, container, property, pool key, and entry overhead. Equal content is discounted only when the output actually shares the canonical representation. The 64 MiB per-cell token-emission limit, 256 MiB cumulative retained-projection ceiling, 2 GB scratch cap, and live parent/RSS guards remain in force.
- **Verification is meaningful and bounded:** Inert synthetic fixtures cover exact ordinary-mode content/root parity, exact-value sharing and near misses, accounting overhead, both unique-data and reference-heavy overflow, complete synthetic 48-cell bounded/ordinary verification equality, and continued rejection of corrupted or missing evidence. The supplement prohibits real historical imports, providers, or Matches during source repair.
- **Carry-forward and routing:** The proposed v5 store/temp, v6 request, and v5 allocation are distinct from the closed v4 route. The new allocation must bind the full v4 chain and the independent report root `sha256:858d141008736e58d436e28aed54a9ff024e78d6d23127431f738bf06aeb1e93`, preserving old readers and consumed bytes. Cumulative time is correctly carried as `1,402,442 ms` (`1,362,476 + 39,966`), with zero charges; disk carry uses the max of surviving predecessor allocations and the conservative `311,296`-byte terminal floor while historical peak remains unknown. The v4 report independently states that the terminal snapshot exceeds its current cumulative floor and is the conservative carry value.
- **Execution gate/authority:** Independent review, focused tests, types, applicable boundaries, and narrow source verification precede any fresh request/preparation. The new immutable allocation precedes one main entry, and actual same-process capacity must pass before charge/provider. The same 15 GB / 12-2-1 GB, 28,800,000 ms, 300 Match, guest/host/Match, runtime, gameplay, and privacy bounds remain; no retry, reset/refund, authority increase, or phase credit is added. Honest `feasibility_not_established` remains the stop outcome if bounded repair cannot establish feasibility.

## Blockers

None found in the bounded supplement.

Scope was limited to the new supplement, Task B fit, the supplied v4 terminal report, and relevant accounting constants. No import, test, provider, or Match was run; no source was edited.
