# Phase 74: Live Go Readiness Evidence Gate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 74-Live Go Readiness Evidence Gate
**Areas discussed:** Canonical Live Evidence Command, Go Process Startup Model, Owner Analytics Live Check Depth, Evidence Artifact and Failure Semantics

---

## Canonical Live Evidence Command

| Option | Description | Selected |
| --- | --- | --- |
| Use existing required topology command | `pnpm topology:check -- --require-go --json` is aligned with the roadmap and already has required-Go semantics. | yes |
| Add a new wrapper script | Friendlier command but duplicates or obscures topology. | |
| Keep live Go evidence as documentation only | Simple but too weak for required evidence. | |

**User's choice:** Existing required topology command.

## Go Process Startup Model

| Option | Description | Selected |
| --- | --- | --- |
| Start Go separately using existing README/env contract | Clear and low-risk; avoids process-manager complexity. | yes |
| Add automatic start/stop script | More ergonomic but adds port/process cleanup failure modes. | |
| Let monitors try live Go opportunistically | Convenient but blurs optional vs required evidence. | |

**User's choice:** Start Go separately.

## Owner Analytics Live Check Depth

| Option | Description | Selected |
| --- | --- | --- |
| Require unauthenticated owner analytics rejection only | Proves owner route is not public without token handling. | yes |
| Add authenticated positive-read smoke | Stronger route evidence but requires token plumbing and risks implied promotion. | |
| Skip owner analytics from live topology | Simpler but misses a named GOEVID-03 check. | |

**User's choice:** Unauthenticated rejection only.

## Evidence Artifact and Failure Semantics

| Option | Description | Selected |
| --- | --- | --- |
| Durable sanitized artifact, fail if required Go is unavailable/divergent | Concrete Phase 75 evidence and preserves no-fallback semantics. | yes |
| Short phase-summary-only evidence | Less overhead but weaker audit trail. | |
| Temporary waiver if Go is not installed | Helpful on limited machines but weakens required evidence. | |

**User's choice:** Durable sanitized artifact with hard failure semantics.

## the agent's Discretion

- Planner may choose exact durable artifact path, preferably under `.planning/artifacts/`.
- Planner may add scoped topology tests if implementation changes topology behavior.
- Planner may decide whether to capture `go:parity` and `boundary:monitors` output in the same evidence artifact.

## Deferred Ideas

None.
