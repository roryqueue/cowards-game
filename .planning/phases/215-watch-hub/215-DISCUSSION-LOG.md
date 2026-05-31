# Phase 215: Watch Hub - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md.

**Date:** 2026-05-31
**Phase:** 215-watch-hub
**Areas discussed:** feed priority, public-state handling, boundary

## Feed Priority

| Option | Description | Selected |
| --- | --- | --- |
| Replay-ready first | Prioritize replay-ready evidence, then complete/degraded, then queued/running. | yes |
| Chronological only | Pure newest-first regardless of evidence quality. | no |

**User's choice:** Confirmed replay-ready first.

## Public-State Handling

| Option | Description | Selected |
| --- | --- | --- |
| Include issue states as evidence | Failed/stale/missing/no-result are visible but not glamorized. | yes |
| Hide issue states | Only show happy path evidence. | no |

**User's choice:** Confirmed include issue states.

## Boundary

| Option | Description | Selected |
| --- | --- | --- |
| Discovery DTO only | Consume `getPublicWatchIndex` output. | yes |
| Execution/internal reads | Reach into execution or runtime internals. | no |

**User's choice:** Confirmed discovery DTO only.

## the agent's Discretion

- Exact grouping, sort, and compact presentation.

## Deferred Ideas

- Filters, search, watchlists, infinite scroll.
