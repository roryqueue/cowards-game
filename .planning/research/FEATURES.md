# Feature Research: v1.15 Go Backend Ownership Completion

**Project:** Coward's Game
**Milestone:** v1.15 Go Backend Ownership Completion
**Researched:** 2026-05-24

## Table Stakes

| Capability | Outcome |
| --- | --- |
| Go-owned Match job lifecycle | Developers can see Go claim, lease, retry, fail, and complete Match jobs with no TypeScript DB writer on the normal path. |
| Go-owned Match completion | Go updates `matches`, `match_jobs`, `match_job_attempts`, and completion fields atomically after execution handoff. |
| Go-owned Chronicle persistence | Go validates Chronicle metadata/hash and persists completed Match Chronicles safely. |
| Go-owned MatchSet scoring/status | Go derives standings, complete/degraded/running state, scoring JSON, and `completed_at`. |
| Runtime ABI handoff | Go coordinates execution while JS/TS Strategy runtime remains behind `strategy-runtime-abi-v1.14`. |
| Public evidence delivery | Public MatchSet summaries, replay metadata, and selected replay evidence reflect Go-completed Matches without TypeScript fallback. |
| No-fallback evidence | Selected Go orchestration paths fail closed on stopped Go, stopped runtime service, malformed output, schema drift, privacy drift, or divergence. |
| Boundary monitors | Monitors reject Strategy execution in Go/web/API, unsafe fallback, private replay leaks, route ownership drift, runtime ABI drift, and report-only offense increases. |

## Useful Differentiators

- End-to-end Go-owned exhibition completion proof: create exhibition through Go, execute through TypeScript runtime ABI, persist Chronicle through Go, score through Go, and view public evidence through Go.
- Privacy-safe orchestration diagnostics: job attempts, failure class, retry/degraded state, adapter id, and ABI version without source, memory, stderr, stack traces, tokens, host paths, or DB DSNs.
- Idempotent recovery evidence: duplicate completion of an already complete Match returns existing Chronicle metadata without double-writing or corrupting scoring.
- Go/TypeScript parity fixtures for lifecycle transitions: TypeScript remains the behavioral oracle while Go becomes product owner.

## Normal Product Workflows To Move To Go

- Exhibition MatchSet creation remains Go-owned and gains downstream lifecycle evidence.
- Queued Match -> claimed/running.
- Running Match -> execution request through TypeScript runtime service.
- Runtime violation -> completed Match with player failure evidence and scoring penalty where applicable.
- System failure -> retry or `failed_system` classification owned by Go.
- Complete Match -> Chronicle row and Match completion fields.
- Terminal MatchSet -> scoring/status completion.
- Public MatchSet/replay evidence reads after completion.
- Live topology proof covering web frontend -> Go backend -> TypeScript runtime boundary -> Go persistence -> public replay/evidence.

## Stay Parity-Only, Test-Only, Or Out Of Scope

| Surface | Classification | Reason |
| --- | --- | --- |
| Go/web/API Strategy execution | Out of scope | Violates hostile-code boundary. |
| Production sandbox replacement | Out of scope | Belongs to v1.16 or later runtime milestone. |
| Final TypeScript runtime retirement | Out of scope | v1.15 coordinates through the v1.14 ABI. |
| Node `vm` security boundary | Blocked | Non-negotiable. |
| Full Go engine rewrite | Out of scope | TypeScript remains parity oracle. |
| Full replay projection and owner-debug replay migration | Deferred | Public/private projection migration needs its own proof unless narrow public evidence is selected. |
| Workshop validation/test/rerun/profile/export runtime flows | Deferred/test-only | Too runtime-heavy for backend ownership completion. |
| Ladder admin creation/scheduling/governance routes | Later candidate | Useful but outside core Match lifecycle cutover. |
| Go migrations/schema ownership | Out of scope | Separate operational rollback risk. |

## Candidate Requirement Categories

- Baseline and scope lock.
- Go orchestration contracts.
- Runtime ABI execution handoff.
- Go Match completion and Chronicle persistence.
- Go MatchSet scoring completion.
- Public evidence and web cutover.
- Failure, retry, recovery, topology, parity, and regression gates.
