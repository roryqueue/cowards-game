# Phase 70: Boundary Debt Rebaseline and v1.11 Scope Lock - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-05-23
**Phase:** 70-Boundary Debt Rebaseline and v1.11 Scope Lock
**Areas discussed:** Classification Granularity, Evidence Freshness, Candidate/Defer Threshold, Rollback/Defer Shape

---

## Classification Granularity

| Option | Description | Selected |
| --- | --- | --- |
| Line-by-line matrix | One row per offense exactly as `pnpm boundary:imports` reports it. Most precise for accounting, but noisier. | |
| Surface-first matrix with offense details | Group by owning surface/file first, then list exact offense lines underneath. Human-readable while preserving proof. | yes |
| Surface-only matrix | One row per product/API surface. Cleanest to read, but too lossy for report-only count reduction. | |

**User's choice:** Surface-first matrix with offense details.
**Notes:** The user accepted the recommended option.

| Option | Description | Selected |
| --- | --- | --- |
| Primary class only | One dominant class per surface. Simple but hides mixed risk. | |
| Primary + sub-flags | One primary class plus flags like `write`, `source-bearing`, `owner-debug`, `runtime`, `cleanup-only`, and `selected-read`. | yes |
| Separate row per behavior | Split mixed files into behavior rows. Precise but harder to maintain. | |

**User's choice:** Primary + sub-flags.
**Notes:** The user accepted the recommended option.

| Option | Description | Selected |
| --- | --- | --- |
| Exact import fingerprint | Path + line + forbidden pattern + normalized import statement. Matches current monitor behavior. | yes |
| Path + forbidden pattern only | More stable if line numbers move, but less precise. | |
| Surface id + offense count | Human-friendly but too coarse for drift detection. | |

**User's choice:** Exact import fingerprint.
**Notes:** The user accepted the recommended option.

| Option | Description | Selected |
| --- | --- | --- |
| Binary selected/deferred | Simple but loses why a surface stayed deferred. | |
| Decision status + reason | Use `selected`, `deferred`, `cleanup-tied`, or `watch-only` with short reason and future boundary. | yes |
| Full mini-ADR per surface | Richest trail, but too heavy for 30 offenses. | |

**User's choice:** Decision status + reason.
**Notes:** The user accepted the recommended option.

---

## Evidence Freshness

| Option | Description | Selected |
| --- | --- | --- |
| Boundary-only live baseline | Rerun `pnpm boundary:imports` and cite archived v1.10 Go/topology/runtime evidence. | |
| Core boundary + monitors live | Rerun `pnpm boundary:imports`, `pnpm boundary:monitors`, and `pnpm topology:check`; cite v1.10 history. | yes |
| Full milestone-style baseline | Rerun a full verification set before implementation. Strong but duplicates Phase 75. | |

**User's choice:** Core boundary + monitors live.
**Notes:** The user accepted the recommended option.

| Option | Description | Selected |
| --- | --- | --- |
| Static only in Phase 70 | Record route manifest and static topology; save live Go for Phase 74. | |
| Optional live smoke if available | Try live Go if already running, but do not block Phase 70. | yes |
| Required live Go in Phase 70 | Require `--require-go` immediately. Strong but front-loads operational friction. | |

**User's choice:** Optional live smoke if available.
**Notes:** Required live Go remains Phase 74 scope.

| Option | Description | Selected |
| --- | --- | --- |
| Stop immediately | Any baseline count drift blocks Phase 70 until investigated. | |
| Classify then decide | If counts drift, classify first, then decide if benign, scope-changing, or blocking. | yes |
| Proceed if strict remains zero | Allow report-only drift as long as strict enforcement is clean. | |

**User's choice:** Classify then decide.
**Notes:** The user accepted the recommended option.

| Option | Description | Selected |
| --- | --- | --- |
| Single phase context only | Put command outputs and decisions in `70-CONTEXT.md`. | |
| Dedicated artifact + context summary | Write `.planning/artifacts/v1.11-baseline-boundary-evidence.md` and summarize it in context. | yes |
| Inline in each later phase | Repeat relevant evidence in later phases. Traceable but duplicative. | |

**User's choice:** Dedicated artifact + context summary.
**Notes:** The user also said they are agreeing with the recommended decisions here, so similar decisions can be auto-confirmed in spirit.

---

## Candidate/Defer Threshold

| Option | Description | Selected |
| --- | --- | --- |
| Existing route is a read | Enough if the route is GET-like and user-facing. Too loose for source-bearing/owner-debug reads. | |
| Read + source-free + write-separated | Candidate only if read-only, source-free, runtime-free, write-separated, and schema-validatable. | yes |
| Read + already has full service DTO | Safest, but blocks useful work where the phase adds the DTO. | |

**User's choice:** Read + source-free + write-separated.
**Notes:** Closely related threshold decisions were auto-confirmed: cleanup-only changes must tie to selected read boundaries; source-bearing reads stay deferred; replay owner-debug/private Chronicle stays deferred; Workshop source/save/validation/test-launch/rerun/export/runtime stays deferred; broad facades are fixed only by exact fingerprint removal.

---

## Rollback/Defer Shape

| Option | Description | Selected |
| --- | --- | --- |
| Route-level rollback | Each selected route has its own rollback/defer criteria. | yes |
| Service-method rollback | Roll back service methods as a unit. Cleaner internally but coarser. | |
| Milestone-level rollback only | Back out all v1.11 changes together. Simple but too blunt. | |

**User's choice:** Route-level rollback.
**Notes:** The related service/DTO decision was auto-confirmed: keep service methods and DTOs small enough that one route can roll back independently.

| Option | Description | Selected |
| --- | --- | --- |
| Simple deferred list | List what stayed out of scope. Fast but loses future trigger criteria. | |
| Deferred with trigger criteria | Record what must become true before each deferred class can be reconsidered. | yes |
| Full backlog items per surface | Most actionable, but too much for Phase 70. | |

**User's choice:** Deferred with trigger criteria.
**Notes:** The user accepted the recommended option.

## the agent's Discretion

- Planner may choose exact artifact section names and matrix table layout, provided the chosen form satisfies the locked decisions in `70-CONTEXT.md`.
- Planner may add fast supporting baseline commands, but should not turn Phase 70 into a full milestone verification pass.

## Deferred Ideas

None.
