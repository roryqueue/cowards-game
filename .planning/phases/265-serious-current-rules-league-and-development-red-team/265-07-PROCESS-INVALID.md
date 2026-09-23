# Plan 265-07: consumed one-shot process failure

This is a private, non-authorizing diagnostic record. It is not a Plan 07
completion summary, a process-valid Match, a payoff, a freeze, or permission to
retry. The canonical result is
`.planning/artifacts/v1.38-phase-265-run-result.json`.

## Retained result

- Approved allocation v2 root: `sha256:5ac794324ed031ced8ff3a2c09b6389daa65029ed126ee595c37cda433d2585b`.
- One-shot result head: `sha256:67d9b53e300a95893931b8457678bf500a6724b713334e823ee5fa0b36594534` (`run-failure`).
- Result: empirical evidence class, `process_invalid`, `empiricalRequirementsComplete: false`.
- Exactly one cell was charged and started. Its terminal is `system_failure` / `process_invalid`, with no projection. The head reports one executed cell and no completed jobs.
- The head-reachable graph has 452 successful runtime-invocation records, one `runtime-invocation-failure` with error name `TypeError`, and one cell-issuance failure. The failed request is a schema-valid `soldierBrain` request. No retained record identifies an invalid guest output.

The failure record stores only the error name; it discards the message and
stack. The precise supervisor error code therefore cannot be recovered from
this graph. A source-only, privacy-bounded diagnostic improvement is under
separate review for any future route; it cannot change this run.

## Likely cause, not an authenticated error code

The approved per-Match and per-provider lifetime is 120,000 ms. Filesystem
modification times put the cell-start artifact at 2026-09-23 07:25:28.564 UTC,
the first successful invocation for the failing provider at 07:25:31.003 UTC,
and its failure artifact at 07:27:29.267 UTC. The failure arrived about 120.7
seconds after the cell start and 118.3 seconds after that provider's first
recorded invocation. These local timestamps are corroborative diagnostics, not
content-addressed proof; they strongly suggest the supervisor lifetime expired.
`FACTORY_RUNTIME_LIFETIME_EXHAUSTED` and `LAB_RUNTIME_STOPPED` are plausible
paths, but the retained evidence cannot distinguish them from another TypeError.

Do not reclassify this as a player loss or count its payoff. The one-shot route
is consumed: no restart, refund, replacement result, or use of its partial
records to satisfy LEAG-01–09. A new empirical attempt would require a fresh
prospective, independently reviewed and explicitly approved route, including
any resource-policy change. No formation, sealed-holdout opening, public,
production, or counted operation follows from this result.

Read-only retained verification is pending at this writing. It can validate
integrity of the failed evidence, not turn it into a complete league.
