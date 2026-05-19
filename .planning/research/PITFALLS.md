# Pitfalls Research: v1.3 Competition Trust Beta

**Project:** Coward's Game  
**Date:** 2026-05-19  
**Milestone context:** v1.3 Competition Trust Beta

## Common Mistakes and Prevention

### Accidentally Creating Permanent Ratings

**Risk:** Trial ladder standings start behaving like a durable reputation contract.  
**Prevention:** Name and model standings as season-scoped, resettable, and experimental. Avoid all-time rating fields, Elo/Glicko naming, and historical rating movement promises.

### Mixing Exhibition and Ladder Eligibility

**Risk:** Strict ladder limits break useful same-user exhibition self-play, or exhibition looseness leaks into ladder fairness.  
**Prevention:** Keep separate presets and explicit eligibility rules. Exhibition allows 2-8 owned revisions and self-play; trial ladder allows one active Strategy Revision per user per season.

### Mutable Strategy Entries

**Risk:** A user changes a Strategy after scheduling or after standings are affected.  
**Prevention:** Ladder entries must use immutable Strategy Revision snapshots and visible replacement/stale behavior. Prefer next-season-only replacement in v1.3.

### Standings Distorted by System Failures

**Risk:** Worker, orchestration, sandbox, or Chronicle failures become player losses.  
**Prevention:** Preserve v1.2 failure taxonomy. Only counted MatchSets with valid evidence affect standings. Degraded/invalid/non-competitive outcomes remain visible but excluded.

### Irreversible Invalidation

**Risk:** Admin invalidation mutates scores without traceability.  
**Prevention:** Invalidation must create audit events and standings must be recomputable from counted/non-counted MatchSets.

### Public Profile Privacy Leaks

**Risk:** Strategy cards or player pages expose source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid data, or private runtime internals.  
**Prevention:** Add public DTO leak assertions for profile/card/season/result surfaces, mirroring existing MatchSet result leak checks.

### Starter Strategies as Toy Examples

**Risk:** New players learn only syntax and get crushed immediately.  
**Prevention:** Each starter needs a doctrine, tactical priorities, validation tests, and exhibition smoke coverage against other starters or existing sample opponents.

### Starter Strategies Too Opaque

**Risk:** Strong starters become unreadable magic and discourage learning.  
**Prevention:** Keep source small, comment doctrine and priority structure, tag tactical focus, and provide expected behavior notes.

### Scheduler Non-Determinism

**Risk:** Pairings depend on database row order, worker timing, or wall-clock ordering.  
**Prevention:** Use explicit season ids, entry ids, snapshot hashes, deterministic ordering, and persisted scheduler decisions.

### Admin Surface Becomes Account Platform

**Risk:** v1.3 expands into roles, organizations, account recovery, OAuth, and enterprise moderation.  
**Prevention:** Keep admin review minimal: inspect result, flag state, mark invalid/non-competitive, audit decision. Account lifecycle remains deferred.

### Treating Worker Threads as Production Sandbox

**Risk:** Higher-stakes competition relies on a shared-process boundary for hostile code.  
**Prevention:** Keep worker-thread as local/dev fallback. Node worker resource limits are useful controls but not a hostile-code security boundary.

### Over-Trusting Node WASI

**Risk:** Node `node:wasi` is mistaken for secure untrusted-code sandboxing.  
**Prevention:** Do not select Node WASI for hostile Strategy execution. Node docs explicitly warn not to rely on it for untrusted code.

### Container Limits Without Kernel Verification

**Risk:** Container resource controls are configured but not actually effective on the host.  
**Prevention:** Runtime spike must include preflight/diagnostics for memory, CPU, pids, network disabled, readonly filesystem, timeout, and kill behavior.

## Phase Placement

- Starter Strategy pitfalls should be handled in the first v1.3 phase.
- Eligibility, stale behavior, and standings failure policy should be handled before any public ladder page ships.
- Public privacy assertions should be added before profile/Strategy pages are exposed.
- Dispute and invalidation audit should land before trial ladder results are called trustworthy.
- Runtime production boundary spike should land before v1.3 completion, with worker-thread fallback explicitly labeled non-production.

## Sources

- User v1.3 milestone brief.
- Local: `.planning/PROJECT.md`
- Local: `.planning/milestones/v1.2-MILESTONE-AUDIT.md`
- Local: `packages/spec/src/competition.ts`
- Local: `packages/persistence/src/scoring.ts`
- Local: `packages/runtime-js/src/adapter.ts`
- Node worker threads docs: https://nodejs.org/api/worker_threads.html
- Node WASI docs: https://nodejs.org/api/wasi.html
- Docker resource constraints docs: https://docs.docker.com/engine/containers/resource_constraints/
