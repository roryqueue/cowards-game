# Plan265-07 IPC error-preservation supplement — independent plan check v1

## ISSUES FOUND

Date: 2026-10-02. Scope: the bounded source-only repair supplement, not a
re-verification of all Phase265 plans or a claim of empirical completion.

Checked plan: `265-07-IPC-ERROR-PRESERVATION-PLAN-v1.md`.
Exact raw SHA-256:
`24739f7ae948a2b1df80eb5f8f109c7e0876e491b5e7cd1f8d5e5b0b13ec0221`.

Result: **1 BLOCKER, 0 WARNING**. Revise the unexecuted plan and independently
recheck it before root dispatches source work. No source, plan, debug file,
application, imports, tests, retained verifier, allocation, capacity probe,
Strategy, model, runtime container or real Match was changed or executed by
this check. This report is the only created artifact; no commit was made.

## Goal-backward contract

The bounded goal is to preserve existing typed internal failure classification
through the real synthetic lean-session → selected ABI → executor → planner
chain, and to mirror one narrowly valid live failed accounting prefix in
data-only retained replay. It must not make failed cells solver-admissible or
give them payoff, issuance, retry, refund or completion credit. This supports
LEAG-02 and the failure-accounting/retention portions of LEAG-09; it does not
deliver LEAG-01–09 or the full Phase265 goal by itself.

The existing base `265-07-PLAN.md` carries LEAG-01–09 in its requirements
frontmatter. The supplement is explicitly attached to that plan, not a new
wave, new empirical task or substitute full-phase plan.

## BLOCKER 1 — incomplete-row admission assumes absent result validation

Dimension: key links / task completeness / cross-plan data contracts.

Plan lines85–91 permit a final incomplete accounting row whose result is
`systemFailure` and state that “Existing known-code/schema checks still apply.”
They do not explicitly require `systemFailure.retryable === false`, an
allowlisted code, or the exact safe failure-result shape at this new branch.
The retained negative test list at lines128–135 also omits these cases.

Those checks do not currently exist on the proposed path:

- `scripts/run-v1-38-serious-league.ts:847` checks correlation, completion,
  charge, provider ordinal, output-byte bounds and unique invocation root.
  It does not validate the failure-result shape or code/retryable fields.
- The current result path at line850 feeds completed responses to the canonical
  kernel. The proposed incomplete branch intentionally stops before
  `runtime_resume`; it cannot rely on that call for result validation.
- `scripts/lib/v1-38-league-response-runtime.ts:73–81` verifies raw coverage,
  identity and exact projection joins. `createProbeProjection.admit` at
  lines35–38 preserves a failed result unchanged; it validates success values
  when transformed, not system-failure code/retryability.
- `packages/engine/src/types.ts` gives runtime system-failure code a `string`
  type. A TypeScript assertion is not retained-data validation.
- The actual closed subprocess allowlist is available in
  `packages/runtime-js/src/subprocess-ipc.ts:8–17`.

A forged retained row can therefore have otherwise coherent accounting,
raw joins and request provenance while supplying `retryable: true`, a missing
retryable field, an unknown code or a malformed failure payload. The proposed
new early stop would turn it into an accepted structured process-invalid
failure without demonstrating the required narrow non-retryable internal
failure contract. Remaining process-invalid is necessary but does not make
that widened exception correct.

### Smallest required plan correction

Change only the unexecuted supplement's strict-failure action and retained
guardrail tests:

1. Require explicit validation **only for the new incomplete FAILURE branch**:
   exact safe result keys `ok`, `violation`, `systemFailure`; `ok === false`;
   exact violation keys `type`, `message` with `type === "INVALID_OUTPUT"` and
   `message === "Runtime system failure"`; exact system-failure keys `code`,
   `retryable`; code membership in the existing
   `SUBPROCESS_SYSTEM_FAILURE_CODES`; and `retryable === false`. Reuse the
   existing allowlist through a source-safe import in the owned league source;
   no new diagnostic/public schema or fifth source file is needed.
2. State strict boolean admission: `charged === true`, `completed === false`,
   `outputBytes === 0`, final accounting row, current canonical pending effect,
   existing request/input/provider-ordinal/root/provenance/raw joins intact.
   Consume/count the row once, advance its provider ordinal once, stop with
   `LAB_SUPERVISOR_FAILURE`, and never resume its failure output.
3. Add targeted negative cases for unknown/missing/non-string code;
   true/missing/non-boolean retryable; malformed/null failure; nonfalse `ok`;
   wrong/missing/surplus violation or failure fields; and forbidden success
   payloads. Maintain coherent raw/accounting/root joins so each relevant
   denial reaches the intended new guard rather than failing fixture admission.
4. Keep existing completed-response and successful replay predicates,
   completed prefix resumes, existing completed failure fixtures and live
   `runtime-bridge.ts` unchanged. Do not apply the new allowlist restriction
   globally to historical completed system failures.

The planner's typed catch requirement is otherwise correctly scoped:
`instanceof SubprocessSystemFailure` plus existing closed allowlist, never
structural `code`, error name, message or arbitrary string. Retained serialized
results instead need data validation; they cannot use `instanceof` as evidence.

## Remaining bounded checks

| Required truth | Planned coverage | Status |
| --- | --- | --- |
| Only typed allowlisted internal codes survive the planner catch | Typed IPC classification; RED A; IPC guardrails | Covered |
| Generic privacy-safe text, no retry, charge/completion/outputBytes/issuance unchanged | Narrow-fix constraints; steps4/6/7 | Covered |
| Second call refused without a second charge/request | IPC guardrails step4 | Covered |
| First-effect and completed-prefix failures use the real canonical kernel | RED B; strict mirror; steps3/5 | Covered, subject to blocker |
| One final incomplete non-retryable safe internal failure only | Strict mirror and step5 | BLOCKER: explicit result guard/tests missing |
| Raw joins, provenance, request/input/method/ordinal/unique-root/trailing guards remain | Strict mirror; retained negatives; independent review | Covered |
| Failed replay stays issuedfalse/process_invalid, empty transitions, initial state, no payoff | Strict mirror; acceptance | Covered |
| No relaxation of successful completion or live runtime admission | Explicit no-runtime-bridge edit and completed/prefix constraints | Covered |
| Both REDs observed before source edits, then GREEN | Steps1–3 and acceptance | Covered; not yet executed |
| Four source-file scope plus synthetic suites/types | Frontmatter ownership; steps6/7; stop clause | Covered |
| Independent post-execution review and exact full root gate | Steps7–8 and acceptance | Covered; not yet executed |
| Closed retained66301 never rerun; no consumed-route reinterpretation | Entry gate; RED B; stops | Covered |

Dependency/order check: source hold is released only after retained66301 closed
exit1; independent plan check then specific root execution dispatch precede both
REDs; both REDs precede production changes; GREEN/types precede independent
review; reviewed final source precedes root's full unchanged source gate. No
circular or competing-executor dependency is introduced.

Scope check: four owned source/test files and two local repair behaviors. The
eight numbered entries are sequential TDD/validation/review/gate stages of this
supplement, not eight independent implementation tasks or new numbered plans.
No scope split is required for the narrow correction.

Context/AGENTS compliance: deterministic engine and canonical terminology
remain unchanged, no hostile source executes in the coordinator, runtime schemas
and failure distinctions remain required, privacy is explicit, all completed
success/failure and current failed-prefix evidence stays charged. Deferred
formation/holdout/product work is excluded. No project-local `.codex/skills/`
or `.agents/skills/` skill entries were found.

Architectural tier compliance: the responsibility map places artifact/replay
validation in the private offline lab and Match transitions in the pure engine.
The proposed repair respects this division; live admission/kernel source are
not owned or changed.

Nyquist/verification check: `265-VALIDATION.md` exists; the supplement requires
two observed RED/GREEN regressions, both whole owned test files, adjacent
synthetic suites and strict four-file/import-closure types. It retains the exact
eight-command CI Phase265 source gate, separate tactical suite, build, strict
script types, three boundary scans and service checker, without counting any
historical source gate as a pass for this edit. This is bounded supplement
coverage, not a declaration that full-phase Nyquist or empirical validation
passes. No test command was run by this checker.

Pattern/research check: the existing host fixture and failingHost/canonical
retention path are named reuse points, not new runtime seams. Original phase
research allocation questions are outside this source-only repair and do not
authorize a fresh route; this check does not reopen them or certify the whole
research artifact as resolved.

## Structured issues

```yaml
issues:
  - plan: "265-07-IPC-ERROR-PRESERVATION-PLAN-v1"
    dimension: "cross_plan_data_contracts"
    severity: "BLOCKER"
    description: "New incomplete retained FAILURE branch assumes existing code/schema checks that are absent and does not explicitly require an exact safe allowlisted non-retryable result."
    task: "Strict live/retained failed-prefix mirror; TDD step5"
    fix_hint: "Require exact safe failure-result shape, existing SUBPROCESS_SYSTEM_FAILURE_CODES membership and retryable === false only in the new incomplete branch; add coherent-join negative guard-reach tests for malformed/missing/unknown/true fields. Preserve all existing completed/live predicates and the four-file source scope."
```

## Recommendation and limits

Return to root/planner for this single smallest plan correction and bounded
recheck. Do not dispatch source execution yet. The revision gate is bounded;
non-decreasing findings or exhausted correction allowance must escalate rather
than spawn further repair scope.

V7 remains terminal/consumed process-invalid, three charged cells, two successes
and one failure. Retained66301 remains CLOSED exit1 and must NEVER be rerun,
including under repaired source. Actual live inner transport cause and any
future successful league remain unproven. No LEAG/freeze/formation/holdout,
public/counted/production or empirical credit follows from this report.
