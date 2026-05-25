# Phase 117: Isolation Baseline and Threat Model - Discussion Log

**Gathered:** 2026-05-25
**Source:** Materialized from approved v1.18 Plan Mode discussion.

## Decisions Captured

### Threat Model
- Selected an exhibition-beta hostile Strategy threat model.
- Rejected local-dev-only framing and production sandbox certification as the phase target.

### Promotion Criteria
- Python can promote only to non-counted exhibition beta if signed-in proof and isolation monitors pass.
- Production sandbox promotion remains out of scope unless evidence genuinely supports stronger wording.
- JS/TS regression safety is part of the baseline.

## Deferred Ideas

- Production sandbox certification.
- Python ranked/counted eligibility.
- Arbitrary package installs.
- WASM/WASI promotion.
