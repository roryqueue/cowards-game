---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "07"
supplement: private-ipc-diagnostics-v1
type: scoped-source-goal-backward-verification
verified: 2026-10-02T19:36:23.692Z
status: gaps_found
score: 4/4 scoped implementation truths verified; source acceptance blocked
behavior_unverified: 0
overrides_applied: 0
empirical_authority: none
implementation_source: 5d898accd715baf723fabe2b69fb13c930ebd358
implementation_root: sha256:d42a6cf1a303ddffb44bc6e2d024f02c82ab67439502e3606bac608cff030561
reviewed_source_root: sha256:e5428d3c43149e2e5e89751c9916b2c98bb93eca3a028a22711659268e1c8991
source_gate:
  session: 58270
  pid: 15219
  status: failed
  exit_code: 1
  terminal_raw: 2754d1db63a41a1da7dbeae496be98194f2578185e5556e7387319284c3611fb
gaps:
  - truth: "The corrected supplement passes the complete unchanged source regression gate."
    status: failed
    severity: BLOCKER
    reason: "Gate58270 exited1: the older factory lifetime regression test references buildFeasibilityCorpus after its import was removed. CI1 failed and five remaining CI commands did not run; no complete marker exists."
    artifacts:
      - path: scripts/lib/v1-38-factory-supervised-runtime.test.ts
        issue: "Line157: ReferenceError buildFeasibilityCorpus is not defined in the existing exact-expiry/awaited-retention test."
    missing:
      - "A working local fixture/reference in the affected older regression test, followed by actual validation of a separately reviewed correction and fresh unique source gate under the existing approval. No repeat human authorization is required."
---

# Plan265-07 Private IPC Diagnostics: Scoped Verification v1

**Status: gaps_found — source acceptance blocked.** Four supplement implementation truths have supporting source and focused injected behavioral evidence, but the actual full regression gate failed. A clean source inspection and focused tests do not override that failure.

## Goal and scope

The checked two-task supplement preserves safe, finite host-observed origins for future private invocation evidence, exact live identity binding, optional private retention, and unchanged failure integrity. This report checks its four truths, four threats, eight named files and three key links; it is not a whole-Phase265 verification or a new authority/certification layer.

The roadmap's Phase265 goal remains: researchers can inspect a **complete, independently attacked current-rules empirical game** and obtain a bounded portfolio and robust-pure outcome without hiding counters or sparse evidence. Its five success criteria still require a complete matrix, solver/response loop, inspectable analyses, diverse portfolio/pure outcome and full development attack budget. This source supplement neither satisfies nor subtracts any of them. LEAG-01..09 remain incomplete; no freeze or Phase266 admission follows.

Initial scoped verification; no previous report at this supplement path or accepted overrides were supplied. AGENTS.md, the checked plan, current roadmap/requirements context, coverage and immutable failed-gate/correction records informed the scope. SUMMARY and review conclusions were not treated as implementation proof: the diagnostic source paths and actual test assertions were inspected directly.

## Observable truths

All source references below are under `scripts/lib/` at `5d898acc`. VERIFIED means the bounded implementation assertion has inspected wiring and the root-observed focused test evidence below; it does **not** mean the complete source gate passed.

| # | Checked-plan truth | Status | Source and behavioral evidence |
| --- | --- | --- | --- |
| 1 | Private future failures distinguish finite host-observed origins without claiming the omitted v10 cause. | VERIFIED, scoped | `v1-38-lean-container-match-session.ts:53–72` closes the pair vocabulary; `:199–201`, `:228–232`, `:279–286` record existing host branches, not exception text. Session tests `:43–93` cover native mocked timeout/state, outer/inner invalid frames, forged ETIMEDOUT and success. Unissued values use unknown; no historical cause is recovered. |
| 2 | Diagnostics authenticate only by exact in-process evidence/diagnostic identity and binding; serialized copies never become issued. | VERIFIED, scoped | Planner `:19–21`, `:144–160` requires constructor provider identity and issued evidence; factory `:98–120` joins exact wrapped/underlying evidence and verifies the selected diagnostic. Planner tests `:89–114` and factory tests `:73–85` deny copied diagnostics/evidence, crossed providers and structural capabilities. Retained reads never populate those maps. |
| 3 | Existing classification, charging, completion, zero-output thrown failures, dispatch stop, cleanup and clocks are unchanged. | VERIFIED implementation delta; regression acceptance BLOCKED | Planner `:134–147` retains pre-dispatch charge, incomplete/outputBytes0 initialization, typed-code allowlist/fallback, generic violation and close; `:156–160` excludes cleanup-failed pre-issuance evidence. Focused planner tests `:70–114` exercise one dispatch, next-call refusal, cleanup, cleanup throw and 1000ms method requests. The production delta does not change either approved prospective600000ms clock or other bounds. However the older factory exact-expiry regression test cannot run: see the BLOCKER below. This is not a passing lifetime regression claim. |
| 4 | Optional private retention preserves legacy bytes when absent and retained verification always returns issued:false. | VERIFIED, scoped | Retention `:63–69` omits the property when absent and awaits before issuance; `:82–93` validates exact finite metadata against original evidence and existing projection join, then returns issued:false. Retention tests `:43–99` exercise identity/horizontal-symmetry joins, altered/missing/surplus keys, deferred success/failure, redaction and canonical legacy bytes. |

**Scoped implementation score: 4/4. Overall acceptance: gaps_found.** The score is not a gate-pass or Phase265-completion score. There are no overrides, and the observed failed regression is not deferred or waived.

## Artifacts and key links

| Artifact | Existence / substance / wiring | Evidence |
| --- | --- | --- |
| `v1-38-lean-container-match-session.ts` | Present, substantive, wired | Construction-site WeakMaps, closed pair validation and exact thrown-object lookup are consumed by planner catch. No generic issuer. |
| `v1-38-planner-supervised-runtime.ts` | Present, substantive, wired | Frozen invocation binding is available only for issued evidence; factory imports and calls both lookup and verification. |
| `v1-38-factory-supervised-runtime.ts` | Present, substantive, wired | Wrapped evidence maps to actual selected evidence; only verified selected diagnostics are copied into private identity maps. Retention calls the registered factory lookup. |
| `v1-38-league-response-runtime.ts` | Present, substantive, wired | Optional row metadata precedes awaited retain; reader checks original binding and unchanged projection linkage. |
| `v1-38-lean-container-match-session.test.ts` | Present, substantive; focused cases executed by root | Actual default-stream branches use mocked Worker/Atomics; injected transport owns cleanup. Real broker/guest tests are outside the prefix. |
| `v1-38-planner-supervised-runtime.test.ts` | Present, substantive; focused cases executed by root | Native/forged/unknown failures, identity denial, accounting, cleanup and success cases assert results rather than symbol presence. |
| `v1-38-factory-supervised-runtime.test.ts` | Present; focused cases pass; older regression BROKEN | Focused exact-identity/legacy/success cases pass. Line157's remaining undefined corpus reference blocks the complete gate. |
| `v1-38-league-response-runtime.test.ts` | Present, substantive; focused cases executed by root | Real constructor-issued private plumbing through injected transports, projections, deferred retention, strict data reads and legacy canonical bytes. |

| From → to | Status | Exact connection |
| --- | --- | --- |
| Session → planner | WIRED | `session.failureOrigin(error)` in planner catch; unissued thrown values fall back to executor/unknown without inspecting message/name/code/details. |
| Planner → factory | WIRED | `getPlannerPrivateDiagnostic(selected, evidence)` plus exact live verification; wrapped-to-underlying issuance map governs subsequent lookup. |
| Factory → retention | WIRED | Lookup and verification use verified original evidence; optional privateDiagnostic joins originalEvidence, while unchanged row/projection joins admittedEvidence. Awaited retention precedes wrapper issuance. |

Data-flow trace: actual host validation/stream branch → frozen finite pair → exact planner invocation binding → exact factory wrapper binding → optional private row → strict data-only reader. No diagnostic field enters request, RuntimeResult, LabRuntimeEvidence, timing or returned/public result. These are failure-plumbing artifacts, not dynamic-data UI components; there is no UI/DB-render trace to substitute for the observed failure origin.

## Behavioral evidence and actual gate failure

This verifier ran **no** tests, types, imports, helpers, probes, boundary scans, providers, retained verifiers or gates. The assignment forbade duplicating executable proof. Behavioral outcomes are the root's directly observed executions, explicitly confirmed to this verifier, combined with independent inspection of what the named tests assert—not SUMMARY pass claims.

The actual corrected-source root session29098 command was:

```sh
pnpm exec vitest run scripts/lib/v1-38-lean-container-match-session.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-league-response-runtime.test.ts --maxWorkers=1 --testTimeout=10000 -t 'private IPC diagnostics injected'
```

It exited0: **38 passed / 183 skipped, 8.40s**. Each of the four files has executed diagnostic cases. These exercise mocked/injected source behavior, not a real Worker/broker/guest/provider/Strategy/Match. The initial Task1/Task2 RED outcomes are recorded in coverage; later primitive/null, cleanup-before-issuance and selected native-accounting assertions were not individually initial-RED-proven. Final GREEN does not retroactively invent RED evidence.

| Actual root check | Result | Disposition |
| --- | --- | --- |
| Corrected focused session29098 | Exit0;38pass/183skip;8.40s | PASS for selected injected cases only |
| Separate exact unchanged CI4 correction session37887 | Exit0 | PASS for strict fourteen-script correction check, not a replacement gate |
| Old source gate11368/PID14739 at215bd3a6 | Exit2; CI3 passed, CI4 failed; other ordinals unrun | Immutable FAILED v1 |
| Fresh source gate58270/PID15219 at5d898acc | Exit1; PID absent; CI3/4 passed; CI1 failed; no complete marker | BLOCKER, FAILED v2 |

Root's actual v2 terminal ended **2026-10-02T19:36:23.692Z**, elapsed1968493ms. CI1 ran29files:28passed/1failed;510tests:509passed/1failed;1959.64s. The failure is:

```text
scripts/lib/v1-38-factory-supervised-runtime.test.ts:157
ReferenceError: buildFeasibilityCorpus is not defined
threads both claims and counts setup plus awaited retention toward exact expiry
```

CI2/5/6/7/8 did **not** run. Terminal raw: `2754d1db63a41a1da7dbeae496be98194f2578185e5556e7387319284c3611fb`. Neither the38focused passes nor the509passing regression tests convert that failed gate into success. No guessed repair, extra gate or rerun was performed here.

### Transparent failure/correction history

V1's actual strict compiler failure exposed a predicate narrowing away diagnostic binding fields and new fixture imports widening compilation into unrelated existing feasibility/mission code. The bounded5d correction changes the finite-pair helper annotation to boolean with identical runtime logic and replaces the two new corpus imports with schema-valid local snapshots. Engine/planner-mission code was not changed. The local factory Soldier `(2,11)` is inside its12×12 board; retention Soldiers `(1,1)/(2,1)` and their horizontal reflections remain inside bounds. These are mock inputs, not formation materialization or full Match starts.

The subsequent actual v2 gate demonstrates that this correction missed an **older remaining** corpus reference in the factory lifetime test. That is an observable test regression, not an inferred production clock change or gameplay failure, and it still blocks source acceptance. V1 and v2 remain separate immutable failed results.

## Threat and requirement coverage

| Threat | Scoped implementation evidence | Limit |
| --- | --- | --- |
| T-265-DIAG-01 spoofing | Constructor-local WeakMaps, exact host error objects, exact provider/evidence/diagnostic lookup; forged/cloned/cross-provider cases deny | No serialized live authority; no historical cause inference |
| T-265-DIAG-02 disclosure | Closed pair plus existing safe binding metadata; canary exception fields never copied; surplus keys rejected | Not a general privacy certification; existing private request retention remains private and unchanged |
| T-265-DIAG-03 tampering | Original-evidence/projection joins, canonical absent-metadata bytes, strict retained reads issued:false and unchanged failed result/accounting | No payoff or completed-success upgrade; no whole empirical artifact proof |
| T-265-DIAG-04 disruption | Focused one-dispatch/stop, cleanup throw, deferred retention and pending-close cases; unchanged clocks/caps in production delta | Full regression acceptance failed; live scheduling/process ownership not established |

LEAG-02 and LEAG-09 are **supported but not completed**: failed cells/attacks remain charged failure evidence rather than inferred payoffs. The complete matrix and attack budget are outside this supplement and remain required. LEAG-01/03–08 are existing Phase265 scope, not orphaned requirements, new supplement work or deferred acceptance. No later phase specifically absorbs this broken existing regression; the blocker remains here.

## Anti-patterns, uncertainty and conclusion

No unreferenced TBD/FIXME/XXX markers or placeholder diagnostic paths were found in the eight named files. Source delta inspection found no public/shared schema, broker/guest-byte, engine/rule, memory/source/output bound, CPU/memory resource, admission-clock, failure-arithmetic or cleanup-policy modification. Both approved prospective600000ms clocks and the1000ms method deadline remain unchanged. No consumed empirical artifacts or historical dispositions were rewritten.

Disconfirmation limits were checked explicitly: sparse/incomplete league evidence is still only partial Phase265 delivery; mocked native branch tests are not real transport-repair proof; legacy byte tests compare canonical rows to the prior row construction, corroborated by the exact omission-only source delta rather than historical artifact rewriting. Live worker scheduling/transport recovery is not exercised by the focused prefix. These scope limits do not create a new human checkpoint or empirical route, and do not excuse the concrete failed regression gate.

**Human verification items:** none added by this bounded source report. **Blocking gap:** one broken existing regression fixture/reference and consequently incomplete full source gate. Root owns any subsequent bounded correction and independently authorized validation; this report does not authorize or execute either.

Actual v10 remains consumed, authentic process_invalid/issued:false with unknown initiating cause. Holdout remains unopened; formation stays gated. No source acceptance, LEAG/freeze success, new allocation/capacity/Match, public/counting/production authority or next-phase readiness is claimed. Only this report was created; no source, tests, shared status or other documents were changed, and nothing was committed.

_Verifier: independent scoped gsd-verifier; source inspection plus root-observed executable evidence._
