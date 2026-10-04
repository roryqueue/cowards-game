---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
stage: source
status: checkpoint
source_commit: 1bbd9985
empirical_execution: not_started
---

# Plan265-16 SOURCE checkpoint

This is an implementation handoff, not a plan summary or completion claim. The v7 pilot and its unique retained verifier are closed, and the prior source hold is released. This work did not import candidates, prepare/publish an allocation, run capacity admission, invoke a native provider, launch a Match, open holdout, or materialize formation state.

## Committed source

Commit `1bbd9985` adds:

- `packages/strategy-lab/src/league/lean-training.ts` with a deterministic cold-manifest contract, separate 64/64/64/128 channel limits and exact 320 accounting, source/structure/decision roots, per-candidate four-Match grouping, weak/clone disposition preservation, bounded one-node planner callbacks, and exact ABI input validation.
- `scripts/lib/v1-38-lean-baseline.ts` with the fixed reduced 120-slot schedule (three arms, 36 pre-holdout plus 4 reserved holdout cells each), compact terminal schema, exact schedule bijection, holdout denial, and a non-freezing handoff.
- Focused contract tests for deterministic manifests, work-vector rejection, weak-attempt preservation, legal-input validation, reduced schedule counts, compact failures, and holdout denial.

The train module intentionally has a trusted-adapter boundary instead of reverse-importing the tactical/teacher packages: both already depend on strategy-lab, and direct imports caused TypeScript project-reference/rootDir failures. Package typecheck passes with the adapter boundary.

## Verification

- `pnpm exec vitest run packages/strategy-lab/src/league/lean-training.test.ts scripts/lib/v1-38-lean-baseline.test.ts` — 2 files, 8 tests passed.
- `pnpm --filter @cowards/strategy-lab typecheck` — passed.
- `git diff --check` — passed before commit.

## Required continuation before any empirical gate

This source checkpoint is deliberately incomplete. It does not satisfy Plan265-16 Task1/Task2 done criteria. The next source owner must implement and test the trusted adapter in `scripts/lib/v1-38-lean-baseline.ts` (or a sibling `scripts/lib` module) which:

1. Calls the existing tactical adaptation/scoring/emitter for exactly 64 legal-input evaluations and returns the actual source, decision record and input roots.
2. Consumes authentic canonical-kernel teacher receipts; verifies exactly 64 visited nodes and exactly 64 projected legal distillation examples; emits the teacher source only from those legal records and binds receipt roots. No hidden canonical state may enter deployed Actions.
3. Uses the existing legal-planner mechanism for exactly 128 counted ordered assignment nodes; selects and emits a genuine branch-local response, binds mixture and strongest-pure targets, and preserves rejected/clone/weak outcomes without replacement.
4. Partitions each initial candidate's four supervised training Matches independently (8 total) and response's 8 supervised Matches; freezes initial sources before matrix, response before fresh pairings, and validates actual closure/fingerprints/admission.
5. Wires only the trusted main entry to the compact schedule/ledger, preserving immutable shared accounting and fresh same-process capacity before every charge/provider. Root owns this empirical entry and must not dispatch until its separate source review/gates and allocation are complete.
6. Adds tests binding every allocated slot to actual compact record/accounting roots, failures, replay selection, cleanup, and no formation/holdout leakage. Current evidence handoff remains `freezeEligible: false` and is not an independent retained-verification result.

Do not treat the callback seams or fixture-only builder inputs in the unit tests as empirical evidence. Keep the 15GB / 28,800,000ms / 300-Match shared caps, frozen reduced tier, unchanged runtime/rules/privacy limits, unopened private holdout, and no public/counted/production authority. LEAG-06/08 remain deferred/non-green; LEAG-09 remains superseded by one fixed automated round.
