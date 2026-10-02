# Plan265-07 — source-only lifetime accounting diagnosis

Read-only source trace by `/root/265_v5_packet_review`, 2026-10-02. No provider,
Strategy, Match, model, allocation or capacity observation was performed.

The frozen factory lifetime is absolute elapsed time from provider construction,
not only guest execution time. `run-v1-38-serious-league.ts` supplies the
allocation's per-Match lifetime; `v1-38-factory-supervised-runtime.ts` starts its
timer before selected-runtime construction and checks before/after invocation.
The per-method guest wall limit is a separate measurement. The planner also
has a separate absolute lifetime.

`wrapLeagueProbeProvider` retains each completed invocation before returning
control to the Match. Its runner callback appends a runtime-invocation graph
record synchronously: canonical encoding, hashing and durable artifact writes.
That work is outside the guest's individual method meter but inside the still
running provider's absolute lifetime. A subsequent invocation can therefore
fail LIFETIME_EXHAUSTED after successful earlier guest calls. Projection,
verification, orchestration and other between-call work also consume elapsed
time. Reserved reviewMilliseconds are not an observed host timing measurement.

This trace identifies accounting semantics; it does not measure the share of
the consumed v5 failure attributable to each cost. No budget change follows.
The existing content-addressed reuse and single-chunk grouped dependency
directory barrier preserve durable-before-next-call ordering. Deferring writes
or changing the absolute lifetime would require a separate semantic/resource
decision and is not part of the current source repair. The encoder repair
preserves bytes and aims to reduce host work; its synthetic component benchmark
does not establish that a full Match will fit the unchanged 120-second bound.

Source references:

- `scripts/run-v1-38-serious-league.ts`: graph publication and provider retention.
- `scripts/lib/v1-38-factory-supervised-runtime.ts`: absolute factory lifetime.
- `scripts/lib/v1-38-planner-supervised-runtime.ts`: planner lifetime.
- `scripts/lib/v1-38-league-response-runtime.ts`: retain-before-return wrapper.
- `packages/strategy-lab/src/league/repository.ts`: durable artifact writes.
- `packages/runtime-js/src/candidate-subprocess-observation.ts`: guest timing.

Consumed routes remain terminal and immutable; no LEAG completion or freeze is
claimed. A distinct same-bounds route requires all current technical gates.
