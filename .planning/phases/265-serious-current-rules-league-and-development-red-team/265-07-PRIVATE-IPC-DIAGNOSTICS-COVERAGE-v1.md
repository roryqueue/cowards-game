---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: private-ipc-diagnostics-v1
type: bounded-source-coverage-audit
status: source-coverage-recorded-full-source-gate-pending
empirical_authority: none
implementation_source: 5d898accd715baf723fabe2b69fb13c930ebd358
---

# Plan265-07 private IPC diagnostic coverage audit

## Scope and disposition

This records automated behavioral coverage for the two-task, eight-file private IPC diagnostic supplement only. It is not a whole-Phase265 empirical acceptance, league/requirement completion, transport-repair finding, certification, or lifecycle `nyquist_compliant: true` claim. No tests or commands were run for this audit; the outcomes below are transcribed from the retained execution record and corrected-source gate evidence.

The four focused Vitest suites were run at corrected source `5d898acc` by the root executor (session29098/5dfc6f): exit 0, 38 passed, 183 skipped, 8.40s. This proves the selected injected source cases passed, not live broker/provider/Strategy/Match or league behavior. The initial observed RED runs are preserved in the supplement summary: Task 1 session10274/fa3a9f, exit 1, 21 failed and 2 passed; Task 2 session9877/1dd54f, exit 1, 6 failed and 4 passed. Later-added primitive/null, cleanup-before-issuance, and some native accounting assertions were not each observed failing in those initial RED runs; they are covered by final green suites but must not be described as individually RED-proven.

The separate corrected-source full gate is still active at session58270/PID15219. At the last recorded update, CI ordinal3 (build) and ordinal4 (strict 14-script types) passed; ordinal1 was running and remaining commands were pending. Thus this audit does not claim full source-gate success. The immutable source-gate v1 failure at `215bd3a6` (session11368/PID14739, exit 2; build passed, strict types failed; other ordinals unrun) remains a failure and is not replaced by the focused-suite pass or relabeled as accepted.

## Requirement-to-test map

| Plan task / must-have truth | Behavioral coverage and test locations | Recorded outcome |
| --- | --- | --- |
| Task 1 — finite host-observed failure origins; historical v10 initiating cause remains unknown | `v1-38-lean-container-match-session.test.ts`: `private IPC diagnostics injected session` cases `records only host pair` (single-frame, cap, outer JSON/object/correlation and inner JSON/object/keys/schema), `records actual native timeout/state branch without a Worker or child`, and `refuses ETIMEDOUT/name/code impersonation and does not decorate successful outputs`. `v1-38-planner-supervised-runtime.test.ts`: `binds … without changing failure accounting or classification`, including malformed frames, forged typed errors and unknown values. | Focused Task 1 final suite: 28 passed, 108 skipped; included in corrected-source total 38/183. These tests exercise injected/mocked branches only. They establish finite observed origins, not the cause of the historical v10 event. |
| Task 1 — exact issued evidence/diagnostic identity and invocation binding; unchanged classification, charging, completion, outputBytes, dispatch stop, cleanup and clocks | `v1-38-planner-supervised-runtime.test.ts`: `preserves actual native timeout/state origin in one charged incomplete invocation`, `does not issue diagnostics from pre-issuance accounting when cleanup throws`, `binds … without changing failure accounting or classification`, and `keeps normally returned … evidence unchanged with no diagnostic`. Assertions cover charged once, incomplete, `outputBytes: 0`, original typed/fallback result, one dispatch, next-call refusal, cleanup, timeout=1000ms, exact provider/evidence/diagnostic objects, clone/cross-provider refusal, and no fields on evidence/results. | Focused Task 1 final suite: 28 passed, 108 skipped. The cleanup-throw and selected primitive/null cases were added after the initial RED and are not individually asserted as initial-RED failures. |
| Task 2 — exact factory provider/evidence/diagnostic chain; clones, cross-provider objects and structural capabilities refused | `v1-38-factory-supervised-runtime.test.ts`: `joins exact selected evidence and refuses clones, another provider and structural capabilities`; `does not decorate a successful constructor-issued result`; `ignores optional-looking metadata on historical injected providers`. | Focused Task 2 final suite: 10 passed, 75 skipped; included in corrected-source total. Historical provider compatibility and returned evidence shape are asserted. |
| Task 2 — optional private retention binds original and projected roots; redaction; legacy bytes; strict reads remain data-only `issued:false`; retention is awaited and failure stops later dispatch | `v1-38-league-response-runtime.test.ts`: `joins diagnostic to original, not projected evidence` for identity and `horizontal_symmetry`; `awaits optional retention and stops next dispatch after failure` for both; `redacts thrown private canaries and ignores structurally forged provider metadata`; `preserves exact legacy canonical bytes when diagnostics are absent` for both. Read verification rejects altered/missing/surplus bindings and reports `issued:false`; failed evidence remains charged/incomplete/outputBytes0 without public diagnostic fields. | Focused Task 2 final suite: 10 passed, 75 skipped. Cases use injected providers, local fixtures, and deferred retention, not durable empirical artifacts or live Matches. |

## Threat coverage

| Threat | Covered behavior | Evidence / remaining limit |
| --- | --- | --- |
| T-265-DIAG-01 — spoofed origin / identity | Host construction-site observations, unknown for unissued errors, exact object issuance, exact provider/evidence and original invocation binding; cloned, forged, cross-provider and structural lookalikes denied. | Session, planner, factory, and retention focused suites above. Does not infer or recover v10's initiating cause. |
| T-265-DIAG-02 — diagnostic information disclosure | Finite stage/reason pairs and binding-only metadata; exception canaries in name/code/details/stack/stdout/stderr/source/input/memory/objective are not copied; surplus private fields rejected; public/returned results remain undecorated. | Retention `redacts thrown private canaries…` plus session/planner shape assertions. Limited to exercised canaries and fields, not a general privacy certification. |
| T-265-DIAG-03 — tampered retained data / failure accounting | Exact retained binding and projection relation; absent metadata follows legacy canonical bytes; present rows validate strictly; serialized reads remain `issued:false`; failed evidence cannot become successful or completed. | Retention binding mutation cases and planner/factory failure-accounting assertions. No full league artifact/root verification. |
| T-265-DIAG-04 — dispatch/retention/cleanup disruption | Single charged dispatch, stopped follow-on invocation, cleanup and cleanup-throw propagation, deferred awaited retention before wrapper issuance, pending close refusal, failed-retention stop. | Planner native/failure cases and retention deferred success/failure cases. Does not exercise live worker/broker process ownership or production recovery. |

## Automated commands and provenance

The executor recorded these exact commands for the focused suites:

```sh
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts --maxWorkers=1 --testTimeout=10000 -t 'private IPC diagnostics injected'
pnpm exec vitest run scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-league-response-runtime.test.ts --maxWorkers=1 --testTimeout=10000 -t 'private IPC diagnostics injected'
```

At corrected source the root record groups the four exact-prefix suites as session29098/5dfc6f, exit 0, 38 passed, 183 skipped, 8.40s. The plan's earlier per-command final records were Task 1 session76788/da4dee, exit 0, 28 passed, 108 skipped, 5.58s, and Task 2 session13656/d32a09, exit 0, 10 passed, 75 skipped, 12.43s; later corrected-source focused evidence supersedes those for the `5d898acc` source identity. No test was rerun by this audit.

## Boundary and next status

Source-level coverage for these four planned truth statements and four stated diagnostic threats is recorded as present. Overall phase and empirical acceptance remain incomplete; the supplement does not complete LEAG-02 or LEAG-09. Mocked source tests cannot replace a complete league or demonstrate durable empirical acceptance. The full corrected-source gate must reach and record its own terminal result before any source-gate conclusion changes. The v10 failure remains immutable, authentic `process_invalid`, and with unknown initiating cause. No additional tests were created here, and no source/test, gate marker, shared validation/state document, resource, holdout, formation, or empirical artifact was modified.
