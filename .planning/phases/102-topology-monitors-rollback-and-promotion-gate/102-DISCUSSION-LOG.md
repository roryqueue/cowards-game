# Phase 102: Topology, Monitors, Rollback, and Promotion Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-24
**Phase:** 102-Topology Monitors Rollback and Promotion Gate
**Areas discussed:** Promotion gate role, Required topology evidence, Failure drills, Rollback, Boundary monitors, Browser replay gate, Privacy/public safety

---

## Promotion Gate Role

| Option | Description | Selected |
|--------|-------------|----------|
| Broad implementation phase | Continue migrating new backend surfaces while verifying prior work. | |
| Promotion gate | Prove the v1.15 ownership story and record promotion/defer decisions. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This phase should not swallow v1.16 runtime retirement or sandbox replacement.

---

## Required Topology Evidence

| Option | Description | Selected |
|--------|-------------|----------|
| Fixture/topology smoke only | Reuse static fixtures and shallow service health checks. | |
| Full local product topology | Prove web -> Go -> TS runtime service -> Go persistence/scoring -> Go public evidence. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** The topology command should create a Go-owned exhibition and fetch Go-owned public evidence after execution.

---

## Failure Drills

| Option | Description | Selected |
|--------|-------------|----------|
| Happy path only | Gate promotion on the end-to-end success path alone. | |
| Stopped-service drills | Require stopped-Go and stopped-runtime-service drills with no TypeScript fallback. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Stopped runtime must be classified by Go as retryable or terminal system failure.

---

## Rollback

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic fallback | Let TypeScript worker take over when Go is unhealthy. | |
| Explicit rollback | Stop Go orchestration, switch ownership, then start TypeScript rollback worker. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** No mixed DB claim/completion owners.

---

## Boundary Monitors

| Option | Description | Selected |
|--------|-------------|----------|
| Advisory monitors | Keep unexpected TypeScript ownership and report-only drift informational. | |
| Promotion-blocking monitors | Fail on ownership creep, unsafe fallback, drift, offense increases, and public leaks. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Report-only offense increases block promotion unless explicitly rebaselined.

---

## Browser Replay Gate

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata-only replay checks | Trust replay metadata and Chronicle validation without browser board checks. | |
| Browser realism validation | Validate Go-created/completed replay evidence in browser for plausible full starts and in-bounds board state. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** This preserves the AGENTS.md replay creation expectation.

---

## Privacy And Public Safety

| Option | Description | Selected |
|--------|-------------|----------|
| Internal-rich gate artifacts | Include detailed debug output for operator diagnosis. | |
| Public-safe gate artifacts | Keep topology, monitor, and promotion artifacts redacted/source-safe by default. | ✓ |

**User's choice:** Confirmed recommended default.
**Notes:** Outputs must omit Strategy source, memories, objectives, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, paths, DB DSNs, and private internals.

---

## the agent's Discretion

- The agent may choose topology command names, artifact filenames, monitor helpers, and drill harness details if the gate proves v1.15 ownership honestly and source-safely.

## Deferred Ideas

- Production sandbox replacement, final TypeScript runtime retirement, counted non-JS play, full workshop/admin/governance migration, and production deployment stack are deferred.
