# Phase 262 Route 8 Main-Orchestrator Execution Protocol

This is the authoritative planning-time dispatch protocol for the six active successor plans `262-69` through `262-74`. It is part of the topology authenticated by Plan 262-69. Any older carrier that describes five active successors, normal bulk phase execution, automatic verification, or a summarized blocked sentinel is superseded and must be rejected.

## Dispatch Ownership

The top-level root orchestrator owns every dispatch under the user's standing autonomous authorization. No new literal or checkpoint is required. The root orchestrator must use typed `gsd-executor` / `execute-plan` semantics for Plans 69–73 and must preserve each plan's ordinary summary lifecycle.

Unfiltered `$gsd-execute-phase 262` is prohibited for this sentinel topology. It can discover Plan 74 together with the ordinary plans and apply unconditional summary/progress behavior before the verification latch has passed.

## Exact Sequence

1. Dispatch `262-69-PLAN.md` through one `gsd-executor` using `execute-plan` semantics; wait for the committed `262-69-SUMMARY.md` and require its checks to pass.
2. Dispatch `262-70-PLAN.md` the same way; wait for the committed `262-70-SUMMARY.md`.
3. Dispatch `262-71-PLAN.md` the same way; wait for the committed `262-71-SUMMARY.md`.
4. Dispatch `262-72-PLAN.md` the same way; require and summarize exactly one durable branch: terminal XOR pre-start obstruction.
5. Dispatch `262-73-PLAN.md` the same way; wait for the committed `262-73-SUMMARY.md`. Plan 73 accepts the checked terminal XOR obstruction. Obstruction always yields a blocked disposition, no activation root, and Phase 263 denied.
6. Stop before Plan 74. Confirm Plans 69–73 have summaries and `262-74-SUMMARY.md` is no-follow absent.
7. At the top level run `$gsd-validate-phase 262`. Do not delegate this command to an executor and do not substitute a stale validation report.
8. Normalize the generic validation output with the deterministic Plan-69 producer before any binder reads it:
   `pnpm exec tsx scripts/check-v1-38-plan-262-69-route-8-source.ts --normalize-post-validation --phase-dir .planning/phases/262-foundation-admission-measurement-custody-and-containment-con --requirements .planning/REQUIREMENTS.md --roadmap .planning/ROADMAP.md --state .planning/STATE.md --validation .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md --disposition .planning/artifacts/v1.38-plan-262-73-foundation-activation-disposition-v1.json --activation-root auto`
9. Run the matching `--check-normalized-post-validation` command with the same explicit paths. It must prove the carrier has exactly one authoritative sentinel marker, no stale successor marker, exact 56-plan/55-summary identities, exact terminal XOR obstruction provenance, automatic optional-root selection, corrected ADMIT-03/reduced-assurance SEAL-01, and all downstream denials. Generic validator output is not binder-eligible before this producer/checker pair passes.
10. Run the executable post-validation binder implemented by Plan 69:
   `pnpm exec tsx scripts/check-v1-38-plan-262-69-route-8-source.ts --bind-post-validation --phase-dir .planning/phases/262-foundation-admission-measurement-custody-and-containment-con --requirements .planning/REQUIREMENTS.md --roadmap .planning/ROADMAP.md --state .planning/STATE.md --validation .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md --disposition .planning/artifacts/v1.38-plan-262-73-foundation-activation-disposition-v1.json --activation-root auto --output .planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json`
11. Check the binder with the matching `--check-post-validation-binder` command and the same explicit paths. The binder must authenticate the normalized authoritative 56-plan topology, exactly 55 summaries, the terminal XOR obstruction branch, branch-selected optional activation root, corrected ADMIT-03 status, reduced-assurance SEAL-01 status, and every downstream denial.
12. Dispatch Plan 74 separately by invoking the single sentinel driver implemented by Plan 69, not ordinary execute-plan:
    `pnpm exec tsx scripts/check-v1-38-plan-262-69-route-8-source.ts --run-plan-262-74-sentinel --binder .planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json --phase-dir .planning/phases/262-foundation-admission-measurement-custody-and-containment-con --requirements .planning/REQUIREMENTS.md --roadmap .planning/ROADMAP.md --state .planning/STATE.md --validation .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VALIDATION.md --verification .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md`
13. Check the result with exactly:
    `pnpm exec tsx scripts/check-v1-38-plan-262-69-route-8-source.ts --check-plan-262-74-result --binder .planning/artifacts/v1.38-plan-262-74-post-validation-binder-v1.json --verification .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-VERIFICATION.md --summary .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-74-SUMMARY.md --blocked .planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-74-BLOCKED.md`

Terminal PASS additionally requires the committed producer-issued `.planning/artifacts/v1.38-plan-262-72-execution-provenance-v1.json`. Its clean artifact blobs and introducing commits must form the strict Plan-72 authorization → multi-commit execution → manifest → Plan-72 summary lineage. Obstruction remains 0/0 and requires the execution manifest and every terminal destination absent.

## Sentinel Driver Contract

The driver owns its deterministic owner-only temporary directory from creation through `finally` cleanup. It accepts no temporary-directory, verifier-input, or optional-root shell variable. `--activation-root auto` is resolved only from the authenticated disposition: exact pass selects `.planning/artifacts/v1.38-foundation-activation-root-route8.json`; terminal-blocked or obstruction selects literal absence and requires the root path no-follow absent.

The driver rechecks the binder, renders and checks the verifier input, runs the provenance-aware verifier, and authenticates the exact rendered verifier report before any canonical install. `status: passed` is the only branch that may create `262-74-SUMMARY.md`, update plan progress, and call `phase.complete`. `status: gaps_found`, obstruction, malformed input, stale validation, or any mismatch creates no Plan-74 summary and performs none of those lifecycle mutations. Phase 263 remains denied on obstruction and every gaps branch.
