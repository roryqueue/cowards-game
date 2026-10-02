---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
type: execute
supplement: private-ipc-diagnostics-v1
status: checked-ready-for-source-only-execution
wave: 1
depends_on: []
autonomous: true
requirements: [LEAG-02, LEAG-09]
empirical_authority: none
files_modified:
  - scripts/lib/v1-38-lean-container-match-session.ts
  - scripts/lib/v1-38-lean-container-match-session.test.ts
  - scripts/lib/v1-38-planner-supervised-runtime.ts
  - scripts/lib/v1-38-planner-supervised-runtime.test.ts
  - scripts/lib/v1-38-factory-supervised-runtime.ts
  - scripts/lib/v1-38-factory-supervised-runtime.test.ts
  - scripts/lib/v1-38-league-response-runtime.ts
  - scripts/lib/v1-38-league-response-runtime.test.ts
must_haves:
  truths:
    - "Private future failures distinguish finite host-observed origins without claiming the omitted v10 cause."
    - "Diagnostics authenticate only by exact in-process evidence/diagnostic identity and binding; serialized copies never become issued."
    - "Existing classification, charging, completion, zero-output thrown failures, dispatch stop, cleanup and clocks are unchanged."
    - "Optional private retention preserves legacy bytes when absent and retained verification always returns issued:false."
  artifacts:
    - path: scripts/lib/v1-38-lean-container-match-session.ts
      provides: Host-origin finite observations at existing failure sites
    - path: scripts/lib/v1-38-planner-supervised-runtime.ts
      provides: Invocation-bound private diagnostic lookup
    - path: scripts/lib/v1-38-factory-supervised-runtime.ts
      provides: Exact underlying-to-wrapped evidence diagnostic binding
    - path: scripts/lib/v1-38-league-response-runtime.ts
      provides: Awaited optional private diagnostic retention with legacy read compatibility
  key_links:
    - from: scripts/lib/v1-38-lean-container-match-session.ts
      to: scripts/lib/v1-38-planner-supervised-runtime.ts
      via: Exact host-issued thrown-object lookup, not exception text
    - from: scripts/lib/v1-38-planner-supervised-runtime.ts
      to: scripts/lib/v1-38-factory-supervised-runtime.ts
      via: Exact issued underlying evidence to wrapped evidence mapping
    - from: scripts/lib/v1-38-factory-supervised-runtime.ts
      to: scripts/lib/v1-38-league-response-runtime.ts
      via: Private invocation-bound optional metadata before awaited retention
---

# Plan265-07 supplement: private IPC failure origins

<objective>
Preserve only safe host-observed failure origins for future private invocation evidence, per D-02, D-04 and D-05. This is a supplement to existing Plan265-07, not a new numbered plan or Phase, transport repair, allocation, retry or empirical authority. It supports LEAG-02/LEAG-09 failure integrity without completing either requirement.

Confirmed research: 265-07-V10-IPC-DIAGNOSIS-v1.md establishes diagnostic loss, not the initiating exception. Source baseline bb98878e; planning-only HEAD at assignment 8652d9b2. Root confirms v10 entry and its unique retained verifier28015 CLOSED exit0, authentic process_invalid, issued:false; source hold RELEASED. The diagnosis's historical hold wording is superseded by this closeout. Consumed evidence remains immutable.
</objective>

<execution_context>
@/Users/roryquinlan/.codex/gsd-core/workflows/execute-plan.md
</execution_context>

<context>
@AGENTS.md
@.planning/PROJECT.md
@.planning/REQUIREMENTS.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/research/SUMMARY.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-CONTEXT.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-V10-IPC-DIAGNOSIS-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PLAN.md
</context>

## Ownership, discovery and fixed scope

One source owner owns only the eight listed existing source/test files. Other agents own closeout/state/docs; preserve their edits. Task2 depends on Task1's private lookup and evidence binding; execute sequentially. Existing injected transport, WeakMap/WeakSet issuance and awaited retention patterns provide Level0 discovery; no external dependency or package install is needed. Research is the actual diagnosis, not a new investigation.

Keep RuntimeResult, LabRuntimeEvidence and shared package schemas unchanged. Use a small optional private lookup in the existing script modules with closure-local issuance maps, not a new signature, custody or authority framework. No new helper file, route, gate, empirical preparation or resource decision. No real Docker, broker, provider, Strategy, Match, probe, retained-verifier or gate invocation. Read source as needed; test execution below uses only injected fixtures. No holdout opening or formation materialization (D-06).

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Preserve finite host-issued failure origins alongside unchanged planner evidence</name>
  <files>scripts/lib/v1-38-lean-container-match-session.ts, scripts/lib/v1-38-lean-container-match-session.test.ts, scripts/lib/v1-38-planner-supervised-runtime.ts, scripts/lib/v1-38-planner-supervised-runtime.test.ts</files>
  <behavior>
    - Inject the default host stream's actual timed-out wait sentinel and non-success state through mocked Worker/Atomics, without creating a Worker or child; distinguish timeout and stream failure from forged ETIMEDOUT/name/code errors.
    - Inject malformed outer JSON, single-frame/frame-cap rejection, bad correlation, invalid inner JSON/strict object/schema, unknown thrown values and forged typed errors through existing transport seams.
    - Diagnostics are finite, redacted and invocation-bound; cloned/forged/cross-invocation or cross-provider objects fail live issuance lookup. Failure classification and returned evidence stay exactly as before.
    - One charged incomplete outputBytes0 row remains one dispatch, then stopped; owned cleanup and no-fallback behavior remain intact.
  </behavior>
  <action>
Add injected-only tests under the exact title prefix "private IPC diagnostics injected"; observe the missing-origin assertions RED before implementation. Mock native Worker/Atomics for the default transact branch inside the test file, using existing session transport injection for control calls; do not export an arbitrary diagnostic issuer or add a production injection seam. At the current timeout/error construction sites, record a frozen finite stage/reason pair in a private exact-object map. Use these fixed stage/reason pairs: stream_exchange/wait_timeout, stream_exchange/non_success_state, outer_frame/single_frame_invalid, outer_frame/frame_cap_exceeded, outer_frame/json_invalid, outer_frame/object_invalid, outer_frame/correlation_invalid, inner_response/json_invalid, inner_response/object_invalid, inner_response/keys_invalid, inner_response/schema_invalid, and executor/unknown. Stage stream_exchange may use reason unknown for unissued exceptions crossing that boundary. Split existing combined checks only to choose a safe finite reason, preserving check order and the same exceptions/classes/codes and cleanup behavior. Tag the existing strict inner parsing rejection at its host validation boundary; never infer an origin from exception message/name/code/details. Inner schema rejection here means rejection of the strict IPC response contract; normally returned guest-invalid outputs remain normally returned outputs, not thrown incomplete failures. Retain no numeric/exit/stream detail unless already directly trusted; this supplement needs only the pair. Any unprovable origin uses unknown, without inferring broker exit or a v10 timeout.

In the existing planner catch, privately bind the safe diagnostic to the exact invocation evidence e and its existing identity, invocationRoot, requestId, method, inputRoot and ordinal using closure-local identity maps. The accessor accepts only the issued e; live diagnostic verification requires that same e and exact diagnostic object, not equal hashes or matching fields. Copy only the host finite pair and existing safe binding metadata, then freeze it. Do not add a diagnostic field to e, its result, RuntimeResult, timing or accounting. Preserve the existing typed-code allowlist/fallback code computation, generic violation, retryable:false, pre-dispatch charge and all completion/outputBytes arithmetic per D-02/D-04/D-05. Unknown and forged Errors still classify exactly as before. Preserve the 1000ms executor method deadline, both prospective 600000ms provider lifetime checks and every other frozen bound; no retries, fallback, worker/broker behavior changes or suppression of cleanup failure. Test positive successful output unchanged and no diagnostic for unrelated/success evidence.
  </action>
  <verify>
    <automated>pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts --maxWorkers=1 --testTimeout=10000 -t 'private IPC diagnostics injected'</automated>
  </verify>
  <done>Injected timeout, stream, outer and inner origins are distinct and finite; unknown/forged errors never acquire a trusted detailed origin. Exact existing results, first charge/completion/outputBytes, one dispatch, next-call refusal and cleanup pass; no native process or guest runs.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Carry issued private diagnostics through factory wrapping and awaited retention</name>
  <files>scripts/lib/v1-38-factory-supervised-runtime.ts, scripts/lib/v1-38-factory-supervised-runtime.test.ts, scripts/lib/v1-38-league-response-runtime.ts, scripts/lib/v1-38-league-response-runtime.test.ts</files>
  <behavior>
    - Factory lookup resolves only the exact wrapped evidence to its exact selected evidence and diagnostic; forged/cloned/cross-provider/cross-invocation diagnostics are refused.
    - Probe retention receives an optional safe diagnostic for the verified original invocation, separately bound to originalEvidence and admittedEvidence under both unchanged and transformed projections.
    - Without diagnostics, historical retained object keys and canonical bytes are identical; successful output and returned evidence never gain fields.
    - Awaited retention completes before wrapper issuance; failed retention stops next dispatch. Legacy and new retained verification remain data-only issued:false, never success-upgrade incomplete failure evidence.
  </behavior>
  <action>
Add tests using the same exact injected-only title prefix; observe missing private propagation RED. Reuse the existing factory issued wrapped-to-underlying WeakMap and selected provider lookup; add only optional private access in script-local types. Bind diagnostics to actual constructor-created provider/evidence identities and refuse structural capabilities or arbitrary metadata placed on errors/evidence. Do not make shared FactorySupervisionProvider or LabRuntimeEvidence diagnostics mandatory, or break historical injected providers lacking the optional capability. Expose no generic issuer; a copied finite object is not live authority. Keep factory admission, both lifetime checks, identity validation, invoke/verify/close and selected cleanup unchanged.

In wrapLeagueProbeProvider, retrieve only an issued safe diagnostic associated with the verified original evidence. Retain it as optional privateDiagnostic metadata on the existing private retention row, not on request, originalEvidence, admittedEvidence or any returned/public result. For projected probes, preserve the original diagnostic binding and explicitly join it to the existing row's originalEvidence; admittedEvidence linkage comes from the unchanged row/projection join, never relabel the original input/invocation root as projected. Omit the metadata property entirely when absent, preserving legacy canonical bytes. Await the same retain call before issued.set and preserve active settlement, retentionFailed, no-second-dispatch and close barriers per D-01/D-02/D-05.

Extend verifyRetainedLeagueProbeInvocations only for the optional metadata: strictly validate the finite pair, exact safe binding keys/values against originalEvidence and unchanged projection linkage; reject missing/surplus or private payload fields and mismatched roots/request/method/ordinal. Legacy rows take the unchanged path. The serialized diagnostic is merely data: valid read verification remains issued:false; clones have no live issuance; no outcome, completed flag, outputBytes, charge, failure classification or payoff can change. Seed private canaries in thrown message/name/code/details/stack/stdout/stderr/source/input/memory/objective and surplus diagnostic fields; assert none enters the new diagnostic object or public/returned results. Existing private row payloads remain private and unchanged; this is a redaction test for the new metadata, not removal of existing request retention. Use injected deferred retention for success/failure and next-call tests, with both untransformed and horizontal_symmetry projection fixtures. No filesystem-backed empirical artifact or consumed bytes are rewritten.
  </action>
  <verify>
    <automated>pnpm exec vitest run scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-league-response-runtime.test.ts --maxWorkers=1 --testTimeout=10000 -t 'private IPC diagnostics injected'</automated>
  </verify>
  <done>Authentic private diagnostics survive exact factory wrapping and awaited private retention; all forged/binding/redaction cases deny. No-diagnostic rows are byte-identical, legacy/new reads return issued:false, failure evidence remains incomplete with no success/payoff upgrade, retention failure prevents another dispatch.</done>
</task>

</tasks>

<threat_model>
## Trust boundaries and STRIDE

Guest/stream bytes and arbitrary thrown objects cross into host parsing; private process-local observations cross into serialized private retention. Exact-object issuance must not survive serialization.

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
| --- | --- | --- | --- | --- | --- |
| T-265-DIAG-01 | Spoofing | Error and diagnostic origin | high | mitigate | Host construction-site identity maps; unknown for unissued failures; refuse clones and cross-invocation/provider binding. |
| T-265-DIAG-02 | Information disclosure | Private diagnostic metadata | high | mitigate | Closed stage/reason and existing binding keys only; no exception text/payloads; canary and surplus-field tests. |
| T-265-DIAG-03 | Tampering | Retained diagnostics and failed accounting | high | mitigate | Optional strict data joins; unchanged accounting/results; issued:false reads and no success upgrade. |
| T-265-DIAG-04 | Denial of service | Dispatch and retention/cleanup | medium | mitigate | Existing clocks, caps, no-retry, poison/stop, awaited-retention and cleanup unchanged; injected next-dispatch tests. |
</threat_model>

<verification>
Run only the four prefix-filtered suites above; require nonzero executed diagnostic tests in every listed file, observed RED then GREEN and all tests under 60 seconds per command. Do not run the unfiltered lean-session suite: it contains real broker/guest cases. No live source gate, provider run, capacity/allocation check or consumed retained verifier belongs to this supplement. Review the eight-file diff for unchanged public/package types, broker bytes, resource/deadline values, result construction, accounting arithmetic and cleanup semantics. The planning agent does not execute tests or change source. Root owns independent check/review and any separately authorized subsequent verification; this supplement creates no novel authority gate.
</verification>

## Scoped source coverage audit

| Source | Item | Coverage |
| --- | --- | --- |
| GOAL | Phase265 inspectable complete empirical game | Tasks1–2 preserve inspectable failure origin only; existing league plans retain the full goal. No LEAG completion claimed. |
| REQ | LEAG-02 / LEAG-09 failed cells block solving and failed attacks remain evidence | Tasks1–2 retain classification and charged failure integrity. LEAG-01/03–08 remain existing plan scope, not added or deferred here. |
| RESEARCH | Actual v10 diagnosis: confirmed origin loss; initiating cause unknown; bounded private preservation | Task1 records host-origin finite pairs; Task2 retains them privately; no diagnosis or transport-cause claim. |
| CONTEXT | D-01/02/04/05 immutable evidence, fail-closed boundaries, hostile source, complete failure charging | Tasks1–2; legacy bytes and consumed routes untouched. |
| CONTEXT | D-03/06 canonical kernel, frozen rules and no formation | Scope fence and unchanged source boundary; no engine/rule work. D-07–21 remain existing league plans, not replaced by this supplement. |
| CONTEXT | Deferred formation, retraining, certification and other-rule experiments | Excluded; no implementation or access. |

<success_criteria>
Two source-only tasks pass injected RED/GREEN and binding/redaction/legacy/awaited-retention tests. Diagnostic origin comes only from observed host branches. Results and public contracts remain byte/shape unchanged; no resources, clocks or dispositions change. v10 remains authentic process_invalid with unknown initiating cause; source-only tests do not recover that cause, certify live repair, grant future execution or unblock Phase266.
</success_criteria>

<output>
Return the bounded source diff and actual injected test outcomes to root for independent review. Do not create another numbered plan/Phase, overwrite consumed evidence or commit from this delegated task.
</output>
