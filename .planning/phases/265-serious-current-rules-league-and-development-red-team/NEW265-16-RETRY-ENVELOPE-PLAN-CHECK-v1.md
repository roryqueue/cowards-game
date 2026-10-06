# Plan Check — NEW265-16 Retry Envelope v1

**Status:** ISSUES FOUND  
**Scope:** Bounded source/plan review against `NEW265-16-RETRY-ENVELOPE-RESEARCH-v1.md` and approval SHA-256 `f60084e7d4b34f0f83e6432df1cd0468c9668c83f30be9c7cedd890667373ab1`. No tests, runtime, Match, provider, private payload, or native process were run.

## Findings

### Blockers

1. **[BLOCKER — requirement_coverage / artifact_completeness] Actual v8 authority and baseline consumers are not assigned to an implementation task.** Task 2's `<files>` omit the real source paths `scripts/lib/v1-38-lean-experiment-authority.ts`, `scripts/lib/v1-38-lean-baseline-source.ts`, and `scripts/run-v1-38-lean-baseline.ts`. These are not incidental: current source places runtime authority issuance and baseline pair admission in the authority module; allocation/schema allowlists and source publication in baseline-source; and baseline execution/retained-reader dispatch in `run-v1-38-lean-baseline.ts`. Task 2 says to bind ordinal into the actual publisher/capability chain and the sole baseline, but no task explicitly owns these files. Task 3's generic manifest coverage does not implement missing wiring. **Fix:** add these exact files and their relevant tests to Task 2, with acceptance checks proving ordinal and diagnostic accepted-check/reader-close joins flow through the actual issuer, publisher, and baseline constructor/reader.

2. **[BLOCKER — key_links_planned / verification_derivation] The failed-result reader lifecycle is contradictory and cannot establish the required successor/baseline gates.** The third `must_haves.truth` says an actual result/head permits at most one ordinary reader and that refusal/failure leaves the accepted check absent. Task 2 then requires a unique “appropriate verification closure” before a successor, while another sentence says a failed/refused accepted-check closes the actual reader journal. Research says failed diagnostics need a unique terminal check, while ordinary acceptance reading must reject them. These are distinct outcomes, but the plan does not define executable transitions and receipts for (a) a failed result going through one ordinary reader and closing unsuccessfully, (b) a missing result going through terminal-only closure, and (c) whether that closure is sufficient for a successor without fabricating an accepted check. In current source, `validateLeanHostStageTerminalOnlyV7` explicitly requires `result.json` to be absent; it cannot serve as closure for a result-present refusal. **Fix:** specify separate result-present ordinary-reader refusal/close and result-absent terminal-only branches, define which exact receipt closes each, and make successor eligibility require that actual closure while baseline eligibility continues to require an accepted check. Add connected tests for each branch and their exclusion from one another.

3. **[BLOCKER — dependency_correctness / scope_sanity] Task 3 conflates the source-only handoff with MAIN orchestration and leaves commit authority ambiguous.** The plan requires independently reviewed source gates before MAIN empirical work and says the exact source/HEAD must remain fixed across them, but Task 3 assigns independent review, bounded repair, validation, and source verification as a single task without naming a separate worker/freeze-handoff boundary. Repair necessarily changes the source, so the stated identical-source/HEAD gate condition is not actionable unless the manifest/freeze is regenerated after repair and then all later gates run against that frozen revision. Separately, the approval prohibits commits within the source-only continuation, while the plan's empirical gate requires each new immutable allocation to be committed before MAIN entry. The distinction between permitted source-gate commits and prohibited empirical/allocation commits is unstated. **Fix:** split Task 3 into explicit source implementation freeze → independent review/repair (with re-freeze and manifest regeneration) → validation → source verification, naming the actor and immutable source identity for each; state plainly that source commits are not authorized by this plan and that any later empirically authorized allocation commit belongs only to the separately gated MAIN continuation (or obtain/record the needed source-commit authority before requiring it).

## Coverage / feasibility notes

- The seven specified user-approved boundaries are represented in `must_haves`; v7 startup preservation, the three-ordinal ceiling, one conditional baseline, cumulative elapsed carry, 29 prior charges, and unchanged resource ceilings are explicit.
- The absent `scripts/run-v1-38-lean-host-stage-v8.test.ts` is an intended Task 1 output, not a missing existing prerequisite; Task 1 names it in `<files>` and says to create it.
- Existing source confirms that the plan's implementation surface extends beyond the listed Task 2 files: authority issuance and baseline admission/source allowlists are in the three paths named in blocker 1. The current terminal-only helper also confirms the lifecycle gap in blocker 2.
- No edits to source, tests, or user approval were made.

## Structured issues

```yaml
issues:
  - plan: NEW265-16-RETRY-ENVELOPE-PLAN-v1
    dimension: artifact_completeness
    severity: blocker
    description: "Task 2 omits the actual authority issuer and baseline source/executor files needed to propagate ordinal and enforce baseline eligibility."
    files:
      - scripts/lib/v1-38-lean-experiment-authority.ts
      - scripts/lib/v1-38-lean-baseline-source.ts
      - scripts/run-v1-38-lean-baseline.ts
    fix_hint: "Assign these production paths and connected tests to Task 2; verify the actual issuer, publisher, and baseline reader joins."
  - plan: NEW265-16-RETRY-ENVELOPE-PLAN-v1
    dimension: key_links_planned
    severity: blocker
    description: "Result-present reader refusal, result-absent terminal-only closure, successor eligibility, and accepted-baseline eligibility have no unambiguous distinct transitions/receipts."
    fix_hint: "Specify and test separate actual-reader refusal/close and terminal-only branches; permit successor only on authentic closure and baseline only on accepted check plus same-attempt reader-close carry."
  - plan: NEW265-16-RETRY-ENVELOPE-PLAN-v1
    dimension: task_completeness
    severity: blocker
    description: "Task 3 does not operationalize independent actor/freeze sequencing, repair re-freezing, or the prohibition on commits in the source-only continuation versus the later allocation-commit gate."
    fix_hint: "Make source freeze, independent review/repair, re-manifest, validation, and verification separate ordered gates; clarify source-commit authority and keep empirical allocation commits exclusively in MAIN's later gate."
```

**Recommendation:** Return to the planner for revision before execution. These blockers affect actual authority wiring and lifecycle correctness, not merely documentation polish.
