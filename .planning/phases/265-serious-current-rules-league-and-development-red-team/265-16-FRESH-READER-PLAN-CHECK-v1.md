---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: fresh_reader_v4
checked: 2026-10-05T18:40:34Z
scope: source-only-plan-check
status: passed_with_clarification
findings:
  blocker: 0
  warning: 1
  total: 1
---

# Plan 16 Fresh Reader Plan Check

## Verdict

The approved scope is implementable with the existing v2/v3 route, allocation, predecessor-carry, and retained-check seams. The plan correctly keeps v4 identities separate from consumed v3 artifacts, preserves the existing 15 GB / 28,800,000 ms / 300-Match limits and 12 spent charges, and requires an accepted unique v4 diagnostic before the conditional baseline. The witnessed clock carry is explicit in the approval: 20,471,046 ms before current-turn setup, then actual preparation start minus the current-turn start and all later elapsed gaps/costs.

One non-blocking file-scope clarification should be made before execution. No other plan issue was found in this bounded check.

## Findings

### PC-01 — Clarify the nonexistent runtime-authority file target

**Classification:** WARNING  
**Plan location:** `265-16-FRESH-READER-RESEARCH-PLAN-v1.md:22`  
**Evidence:** The listed `packages/strategy-lab/src/runtime-authority.ts` path does not exist in the current source tree. The relevant existing authority module is `scripts/lib/v1-38-lean-experiment-authority.ts`, which the plan already lists; runtime-related modules found under the strategy-lab source include `runtime-bridge.ts`.

**Fix:** Either state that `packages/strategy-lab/src/runtime-authority.ts` is a new file and define its intended contract/consumer, or replace/remove that path in the file scope. Avoid creating a second authority module unless a concrete v4 consumer requires it.

## Implementability and authority/carry check

- Current v2/v3 routing is explicit in `LEAN_SUPERVISOR_CORRECTION_ROUTES` / `LEAN_FRESH_SUPERVISOR_ROUTES`, `LeanSupervisorMode`, parser and child dispatch, and retained verification. The plan names the relevant correction, baseline, retained-reader, authority, and league modules and correctly calls for explicit v4 handling while preserving older routes.
- Current v3 predecessor logic authenticates prior carry and separately gates baseline admission on the accepted diagnostic check. The plan explicitly requires v4 reauthentication and a unique accepted v4 diagnostic for baseline admission, rather than compact success or reason-only acceptance.
- The plan keeps source tests separate from real diagnostic/baseline execution and prohibits old-reader reruns, recredit, Match/provider execution during source tests, and downstream public/counted/production credit.

This was a source-only plan check. No private saved files, readers, providers, or Matches were accessed or run. This check does not establish empirical acceptance or phase completion.
