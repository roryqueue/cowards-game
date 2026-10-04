# Pairwise Reopen and Carry v1 — Plan Check

**Result: PASS (narrow existing Task B recheck).**

The supplement matches the closed v5 terminal-only report: root entry `60934` has a uniquely verified failed terminal, no charges, and cumulative elapsed time `1,555,387 ms`; the conservative terminal disk floor is `409,600` bytes and historical peak disk/RSS remain unknown. The report raw root is `sha256:d9ea2b079aa7c557e586f8d50867e88068227426c302a1f126c2f5fd09e9c24f`. It does not treat the failure as pilot evidence or infer an underlying historical cause.

## Goal-backward checks

- **Preserves full validation and results:** The plan retains all original 48-cell receipt, usage, runtime, charge, schema, order, root, pair, candidate, projection, and 64 MiB emission checks. It preserves numeric comparison, exact ordinary assessment/threshold roots, legacy/default reader behavior, and prohibits hash substitution or skipped validation.
- **Bounded reopen workflow:** It retains small descriptors/receipt roots/necessary S08 aggregates rather than raw supervision or full projected graphs. Each of six control and three base comparisons reopens only its two slots' four cells (eight streams), reauthenticates descriptor/chunk/receipt roots against first-pass identities, and recreates projections in original order under fresh unchanged emission and live allocation/RSS checks. The stated 72 additional reads are charged to the shared entry clock, with no extra Match/search work.
- **Projection-memory accounting:** Each comparison uses a 256 MiB pool after retained metadata; merged-map/key/reference overhead and numeric-comparison scratch are reserved and checked. Reuse is allowed only for actual identity-shared frozen objects with alias references charged; equal-but-unshared objects are cloned/charged. No prompt-GC assumption is made; capacity guards fail closed.
- **Tests cover the repair contract:** Synthetic 48-cell bounded/ordinary parity, missing/corrupt/mismatched evidence denial, exact first-pass coverage and guarded reopen counts, identity-only sharing/near-miss accounting, pool/metadata/merged-reference overflow, and unchanged caps are explicitly planned. Real historical import/provider/Match calls are prohibited during repair.
- **Carry and stop boundary:** The proposed v6 store/allocation and v7 request are disjoint; they bind the full closed-v5 predecessor chain and preserve v1-v5 readers and consumed bytes. Carry-forward is `1,555,387 ms`, zero charges, and `max(all surviving predecessor allocations, 409,600-byte terminal floor)`, with historical peak unknown. Existing source constants retain the same 15 GB / 12-2-1 GB, 28,800,000 ms, 300 Match, per-cell, projection, scratch, guest/host/Match and privacy/rules limits. The supplement allows only one bounded correction route and requires an honest `feasibility_not_established` closure if the next pilot does not establish feasibility.

## Blockers

None found in this bounded supplement.

Scope was limited to the new supplement, its fit with existing Task B, the v5 terminal report, and current version/cap accounting constants. No import, test, provider, or Match was run; no source was edited.
