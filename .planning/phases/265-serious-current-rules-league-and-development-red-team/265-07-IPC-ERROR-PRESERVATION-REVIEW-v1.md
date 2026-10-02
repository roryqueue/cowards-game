---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 07
reviewed: 2026-10-02T10:31:59Z
depth: standard
reviewer: gsd-code-reviewer
source_commit: a98b5c2be9410b63e944143e1b0b693fc5c303bf
diff_base: d03ece590460cdcc59336744575840057408f322
diff_raw_sha256: 2de7e5933ce5f4b86978a27d46f57f64d27d9264434e7b1c7555a73e14f99d13
files_reviewed: 4
files_reviewed_list:
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/run-v1-38-serious-league.ts
  - scripts/run-v1-38-serious-league.test.ts
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
status: clean
empirical_authority: none
---

# Plan265-07 IPC preservation — independent source review v1

## Narrative Findings (AI reviewer)

No actionable BLOCKER or WARNING found in the submitted four-file repair.
This is a bounded standard source review with focused cross-module tracing,
not a full-phase certification or independently executed verification.

The checked scope is the complete four-file diff from dispatch base
`d03ece59` to frozen source `a98b5c2b`: 176 insertions and 8 deletions.
The planner implementation and tests were read in full. Previously completed
runner/baseline inspections were carried forward, with every changed hunk,
the new regression matrix, and the current live/retained call boundaries
inspected directly. Unchanged dependency code was checked read-only, not
executed. There was no structural pre-pass supplied for this review.

## Exact source identities

Independently measured raw SHA-256 values matched all four submitted pins at
the initial inspection and again immediately before report creation:

| File | Raw SHA-256 |
| --- | --- |
| `scripts/lib/v1-38-planner-supervised-runtime.ts` | `021e8c5749bd0a2583208b7c8fcb9a76fb0c986557752a09845644ea88e5d5e6` |
| `scripts/lib/v1-38-planner-supervised-runtime.test.ts` | `2f913230d76202a6814f1e044fc778eee35fa1bf7ceb4d97c24d444c948f81ce` |
| `scripts/run-v1-38-serious-league.ts` | `f25d846e5ebc786e49d368a62bd60d52740a608f792061a020d8cff5856d573a` |
| `scripts/run-v1-38-serious-league.test.ts` | `4713cdbb32203c89f6ef15ec72e6d0cd1cb83d4350af3d8801866d12c0291217` |

The diff hash above is SHA-256 of `git diff --no-ext-diff --binary
d03ece59 a98b5c2b --` followed by these four paths. HEAD remained the exact
source commit above. The four files are not ignored. Existing unrelated
untracked work was left untouched.

Context read: AGENTS/current STATE; checked supplement PLAN-v1 at raw
`994d3a68eaf63e16b2fcbc4fe0593ab160d5960622da323a71063ef1439e7a90`;
PLAN-CHECK-v1/v2; debug `phase265-ipc-v7`; EMPIRICAL-RESULT-v7; and the new
IPC-ERROR-PRESERVATION-EXECUTION-v1 record. The latter still declares the
whole owned suite pending. Historical findings and authority remain unchanged.

## Boundary analysis

- Planner lines119–140 retain charge-before-dispatch, exact-object issuance,
  and generic failure text. The catch at128–131 preserves a code only for
  `instanceof SubprocessSystemFailure` plus membership in the existing closed
  allowlist. Structural code/name claims, unknown typed codes, arbitrary
  errors, messages and details do not supply the classification. No diagnostic
  payload is copied; `retryable` stays false. Existing stop/poison/close paths
  still refuse another invocation before another charge or transport request.
- The class is imported from the same module used by lean-session framing.
  Lean runMethod's exit/signal/stdio/correlation checks and strict inner-frame
  parser precede the adapter result; the selected v1.19 ABI bridge calls that
  adapter without catching its typed exception, and executor propagation
  reaches the planner catch. The added imports expose declarations/functions,
  not an invocation or new runtime capability.
- Live runtime-bridge56–61 appends accounting before rejecting incomplete
  evidence; catch77 returns initial state, empty transitions and
  `LAB_SUPERVISOR_FAILURE`. The retained branch at runner848–860 now mirrors
  only the narrow final incomplete FAILURE row. It requires strict booleans,
  zero output bytes, exact serialized result/violation/systemFailure keys,
  fixed generic text, an allowlisted string code and non-retryability.
- The branch occurs at the actual canonical pending effect after existing
  correlation/input/provider-ordinal/output-bounds/unique-root checks. It
  counts the row, records consumption and advances its ordinal once, then
  breaks without `runtime_resume`. Earlier completed effects still resume
  normally. Completed replay requires `completed === true`; the new safe-result
  allowlist does not apply globally to existing completed failures.
- Initial-state/empty-transition/classification checks, final accounting
  coverage and failure-cause equality remain in runner831–876. Caller checks
  still recompute terminal disposition, enforce journal/cleanup/charge links,
  verify raw original/admitted accounting and projection joins, and deny
  fabricated completed payoff. A structured failed result remains unissued
  and process-invalid, not successful evidence.
- New runner tests use fresh synthetic repositories and actual canonical
  pumping for first-effect and two-completed-effect failure prefixes. Their
  graph rewrite rebuilds dependent hashes and both raw accounting views;
  coherent negatives explicitly pass the raw-projection verifier before
  testing the intended new failure guard. The incomplete COMPLETED fixture
  supplies the preceding canonical pure transitions to reach that guard.
  Correlation, ordinal, duplicate root, trailing row, state/transition/cause
  and raw-join assertions remain bounded. Type-only fixture annotations do
  not alter runtime test behavior.

The live bridge, subprocess declaration, ABI bridge, executor, lean-session
and probe-wrapper files are unchanged relative to the dispatch base. Their
inspection is call-chain context, not additional edited-file scope.

## Verification limits and handoff

No test, import, typecheck, build, profile, producer, provider/model, Docker,
Strategy, real Match, capacity operation, gate or retained verifier was run by
this reviewer. Only this new report was created; no source edit or commit.

The author's execution record reports genuine pre-fix REDs, focused GREEN,
31 planner tests, two expanded retained cases, filtered synthetic-adjacent
checks and project-matching strict affected-file types. These are author
proof, not reviewer reruns. The combined owned whole-file suite62868 was
ACTIVE/pending in the available record; no completed whole-suite pass is
claimed here. Root's exact full source gate remains pending and required.

Clean means no actionable defect found in this fixed-source repair scope.
It does not identify v7's unknown inner IPC cause, repair or reinterpret its
consumed evidence, authorize a fresh route, or grant speedup/league/LEAG,
freeze/rules/budget/privacy, formation/holdout or public/counting credit.
Closed retained verifier66301 was not rerun and must remain consumed.
