# Research: Pitfalls

**Project:** Coward's Game  
**Date:** 2026-05-16  
**Milestone context:** Greenfield

## Critical Pitfalls

### 1. Treating sandboxing as solved by a library

**Risk:** Host compromise or data leakage from malicious Strategy code.  
**Warning signs:** User code runs in API routes, Node `vm` is used as a security boundary, host objects cross into sandbox, outputs are trusted without validation.  
**Prevention:** Run strategy code only in worker isolation; never use Node `vm` for untrusted code; avoid `vm2`; validate all outputs; apply process/container isolation; design runtime as replaceable.  
**Phase mapping:** Runtime sandbox and worker phases.

### 2. Building UI before the engine is trustworthy

**Risk:** Beautiful replay of incorrect rules, expensive rework, unclear bugs.  
**Warning signs:** React components contain movement/contraction logic; UI tests define rules; engine lacks invariant tests.  
**Prevention:** Build `packages/spec` and `packages/engine` first; make UI consume projected replay state only.  
**Phase mapping:** Foundation and engine phases.

### 3. Chronicle as an afterthought

**Risk:** Matches cannot be debugged, replay cannot explain intent, determinism bugs are hard to diagnose.  
**Warning signs:** Only final board states are stored; Awareness Grids are not recorded; runtime violations are log-only; no replay integrity check.  
**Prevention:** Define Chronicle event schema early; record enough to reconstruct and inspect every Round, Activation, Cycle, Action, Advance, Push, Backstab, Stoning, Fall, Contraction, and violation.  
**Phase mapping:** Replay/Chronicle phase immediately after or alongside engine.

### 4. Ambiguous Strategy API

**Risk:** Players cannot reason about what their code can see or control; strategies become brittle.  
**Warning signs:** Full-board data leaks into SoldierBrain; memory mutation is implicit; objective payload schemas are unclear.  
**Prevention:** Lock StrategyInput and SoldierBrainInput contracts in `packages/spec`; provide starter doctrines and validation errors; keep StrategyMemory/SoldierMemory/objective limits explicit.  
**Phase mapping:** Spec, runtime, editor phases.

### 5. Nondeterminism creeping in through convenience

**Risk:** Same match inputs produce different outcomes across machines or reruns.  
**Warning signs:** `Math.random`, `Date.now`, unordered object iteration assumptions, concurrency races, DB-generated values in simulation, system clock in runtime.  
**Prevention:** Seeded RNG only; pure engine; serialized deterministic inputs; deterministic ordering; replay determinism tests in CI.  
**Phase mapping:** Engine and testing phases.

### 6. Over-scoping competitive infrastructure

**Risk:** Ladders, tournaments, moderation, and ranking consume time before the game loop is proven.  
**Warning signs:** Ranked ladder tables before MatchSet correctness; cosmetics before readability; spectator tools before replay basics.  
**Prevention:** Scope v1 around Workshop Mode, deterministic MatchSets, and replay analysis.  
**Phase mapping:** Roadmap/product sequencing.

### 7. Replay leaks private strategy data

**Risk:** Competitive integrity failure and user trust loss.  
**Warning signs:** Public Chronicle includes source, StrategyMemory, SoldierMemory, or objective payloads by default.  
**Prevention:** Separate public replay events from private owner-only debug data; enforce projection-level privacy tests.  
**Phase mapping:** Chronicle, API, replay viewer phases.

### 8. Rule terminology drift

**Risk:** Bugs caused by confusing Round, Activation, Cycle, Action, MOVE, Advance, STONE, FALLEN, and Turn semantics.  
**Warning signs:** Code uses "turn" for multiple concepts; tests say "dead"; event names differ from spec language.  
**Prevention:** Put ubiquitous language in `packages/spec`; enforce naming in types and event names; mirror canonical terms in UI.  
**Phase mapping:** Spec and engine phases.

### 9. Match failure policy conflates strategy failures and system failures

**Risk:** Players lose ranked outcomes because infrastructure failed, or malicious code hides as system failure.  
**Warning signs:** All worker errors are "loss"; all timeouts retry forever; violations are not Chronicle events.  
**Prevention:** Encode failure categories: invalid action/no-op, timeout/no-op turn, repeated timeout/forfeit, worker crash/retry, exhausted retries/match failed.  
**Phase mapping:** Runtime and worker phases.

### 10. Package boundaries decay

**Risk:** The monorepo becomes coupled and hard to verify.  
**Warning signs:** `apps/web` imports engine internals; runtime imports DB models; shared package contains everything.  
**Prevention:** Use package-level lint/build boundaries, dependency rules, and focused public exports.  
**Phase mapping:** Scaffold/foundation phase.

## Sources

- Coward's Game canonical spec: `/Users/roryquinlan/Downloads/CowardsGameSpec_Full_Consolidated_v1.md`
- Coward's Game technical architecture spec: `/Users/roryquinlan/Downloads/CowardsGame_Technical_Architecture_Spec_V1.md`
- Node `vm` docs: https://nodejs.org/api/vm.html
- isolated-vm npm docs: https://www.npmjs.com/package/isolated-vm
- vm2 npm/security references: https://www.npmjs.com/package/vm2
