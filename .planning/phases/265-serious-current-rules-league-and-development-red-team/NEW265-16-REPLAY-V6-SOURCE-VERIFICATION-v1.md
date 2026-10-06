---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
supplement: replay-v6-source-first
verified: 2026-10-06T01:18:17Z
status: passed
verification_scope: approved_additive_v6_source_only_not_whole_phase
score: 4/4 source functional truths verified
scope_safety_truth: verified
behavior_unverified: 0
overrides_applied: 0
source_commit: 03ed458a9466b780d751dae0ed4e168b797bf529
inspected_head: 5fe8fb77532ce9b23cfeefebbfafa52e1750c3b8
source_manifest_root: sha256:67263fe477e884ffabb74c09f562d0091e2a86ec8ae29cf7c812ed64d31430aa
source_manifest_entries: 892
execution_authorized: source_only
empirical_credit: false
phase_complete: false
requirements_completed: []
requirementsComplete: false
---

# Plan 265-16: additive replay-v6 source verification

**Disposition: VERIFIED, source only.** The approved additive v6 source subgoal is implemented and wired at the fixed source commit above. This is not whole-Phase 265 goal achievement. LEAG-01–09 remain pending/uncredited. No native RSS feasibility or complete 36-Match fit is established.

## Contract and evidence boundary

Read the 20261006 approval, checked PLAN-v1/PLAN-CHECK-v2, SUMMARY, independent SOURCE-REVIEW-v2, SOURCE-REVIEW-FIX-v1, VALIDATION-v1, MAIN-GATES-v1 and current STATE frontier. SUMMARY claims were used as pointers, not implementation evidence. No previous report at this newly owned path existed; no overrides were applied. No project-local `.codex/skills` or `.agents/skills` rules were found.

The plan has four functional truths and a fifth source-safety/no-credit truth. All five are covered below; the headline 4/4 counts the four functional truths and does not omit the safety constraint. Phase-wide roadmap requirements are explicitly not claimed by this source supplement.

## Observable source truths

| # | Planned truth | Status | Code and behavioral evidence |
|---|---|---|---|
| 1 | A separately rooted exact v6 diagnostic route can be strictly admitted without widening or relabeling v1–v5 schemas, routes, defaults, policy or harness control bytes. | VERIFIED | `lean-experiment.ts:72–84, 681–684, 768–793` supplies separate routes, exact keys, fixed approval/supplement/policy roots and canonical expected-allocation reconstruction. `run-v1-38-lean-correction.ts:283–285` checks separately rooted authorization; command parser and shell dispatch select distinct v6 destinations. Independently rerun exact CLI/intent and finite-predecessor named tests passed. |
| 2 | The admitted v6 reader selects validation-only parsing only after full exact allocation admission; v5 retains its validator and older versions the old decoder. | VERIFIED | `lean-experiment.ts:1371–1381` explicitly admits exact diagnostic/baseline schemas before selecting `validateLeanReplay`; explicit v5 branch remains, with `decodeLeanReplay` fallback for prior versions. Independently rerun both actual strict v6 route tests passed, exercising the production evidence reader and every selected frame; fixtures check exact evidence and absence of retained full text. Retained validation covers forged roots/caps/slots/extra keys and malformed late frames. |
| 3 | v6 retains v5 startup/fixed budgets while capability, request, allocation, origin, publication, CLI, retained-check and manifest joins bind the same identity. | VERIFIED | Actual issuer authenticates ledger charge, immutable pair/source publications and allocation; unforgeable WeakMap authority enforces factory → planner → session, binding equality and single use (`lean-experiment-authority.ts:28–31, 58–64` and issuer). Unchanged factory/planner constructors call this authority rather than accepting startup scalars. Session chooses the v6 broker/origin discriminant using the grant; Match carrier binds allocation/charge/harness/source/input/executable/invocation. New/reused source publishers preserve source bytes and separately bind allocation/source/HEAD/route; retained source readback requires that proof (`lean-correction-retained.ts:277–280, 312–313`). Independently rerun both production publication/issuer/claim tests, origin/broker round-trip and exact CLI test: six passes. Current inert source-manifest computation pins all builders and required documents/fixtures, 892 entries. |
| 4 | v6 effective elapsed uses max(wall delta, ceil(monotonic delta)) and ledger-close semantics; predecessor custody is finite/read-only, never an old full reader. | VERIFIED | `lean-experiment.ts:1010–1024` retains conservative monotonic-ceil closure. `run-v1-38-lean-correction.ts:494–505` requires exactly one open interval beginning 1791247033529 and computes **36,151,532 + accountingAtMs − 1791247033529**, refusing unsafe clocks and exhaustion. `:529–548` reads finite allocation/time/terminal/empty-ledger custody, authenticates exact named roots and carries survivors/24 charges; there is no predecessor stopped predicate or old evidence-reader invocation. Baseline additionally requires acceptance of the new v6 diagnostic and carries its closed elapsed plus subsequent gap. Independently rerun setup/cap-edge/gap rejection, conservative reader-close and zero-charge predecessor tests: three passes. |

**Scope-safety truth: VERIFIED.** The synthetic fixture denies child-process and Worker APIs and restricts filesystem reads to source/package files and its temporary fixtures (`replay-validation-v6.test.ts:10–50`). No provider construction/invocation, Strategy execution, Match execution, empirical helper, allocation preparation, historical/empirical reader or historical gzip payload was used by this verifier. Tiny trusted synthetic gzip is test-only, not real replay evidence. Results preserve private-only, issued=false, phaseComplete=false/no holdout/no formation semantics; no LEAG requirement is credited.

## Artifact and wiring closure

| Artifact/seam | Exists and substantive | Wiring/data identity |
|---|---|---|
| `packages/strategy-lab/src/league/lean-experiment.ts` | VERIFIED: additive schemas/caps/reconstruction, selector, full-frame validator and clock | CLI/allocation, authority caps, retained evidence and ledger consumers call it; not an orphan. |
| `scripts/run-v1-38-lean-correction.ts` and `.sh` | VERIFIED: exact request/root/command/source closure and fixed single interval | Parent CLI dispatch feeds admitted route-specific allocation/run/retained consumers; shell v6 paths are disjoint. |
| Authority, factory/planner and session | VERIFIED: real capability state/order enforcement and startup framing | Factory → planner → session passes the same capability; no generic scalar fallback grants startup. |
| Baseline Match/source publisher and retained reader | VERIFIED: invocation/root checks, separate v6 publication proof and strict proof readback | Both new-source and reused-source consumers exercised; retained result joins allocation/source/request/HEAD/origin/ledger, not hardcoded empty data. |
| `scripts/run-v1-38-lean-replay-validation-v6.test.ts` | VERIFIED: runnable synthetic positive/negative production-boundary fixtures | Includes both routes, admission/refusal/late frames, capability order/reuse, publication/readback, predecessor and clock cases. |
| Unchanged pipeline/startup supervisor/v5 fixture | VERIFIED: substantive existing implementations, no delta from `3044e7ff` | Pipeline still calls injected freeze/publication callbacks; startup mechanism retained; v6 generated broker is v5 except versioned origin/request labels. All included in current manifest. |

Level-4 UI dynamic-data tracing is not applicable: this source supplement creates no UI. Evidence flow was instead traced through immutable source → publication → pair/charge/capability → invocation/origin → retained result/check. Synthetic readback confirms real fixture bytes, not placeholder props.

## Exact source closure

Independently computed with an inert import of `leanCorrectionSourceManifest("v6")`, without invoking the CLI entry point:

- Manifest: **sha256:67263fe477e884ffabb74c09f562d0091e2a86ec8ae29cf7c812ed64d31430aa**, **892 entries**.
- Approval bytes: `sha256:4372b0337c16545738937f4a92f5a21cf25973ae0b6b650e5c26d7e14e8f8932`.
- Plan bytes: `sha256:4b2f7426e91d842b64ea41af63381fdc60f9a3e843ce651745757ee58b97bc21`.
- Policy artifact bytes: `sha256:86f22914eeb31b8f261e08298a905b0e53d70d98cd918da8d839cd9ef65b17f3`; inherited startup policy remains `sha256:6fb977996ee40e7b3ce239c75b3d27dedb4c3e63b95c57a4c40a0e3d6b4ce1d2`.
- v6 fixture: `sha256:eb295cf9fb07ea8fa70754cafee0b5ae2b313cb14ce18f31335bbe81c84fef60`; unchanged v5 fixture: `sha256:f4e10b8186f6103c4d5a4542d7d25529102fa88757b78681879ccf28fd8a5382`.

The closure includes the correction entry/shell, baseline parent, authority, factory/planner, session, baseline Match/publisher/pipeline, startup supervisor, new fixture, unchanged v5 fixture, policy, approval and checked plan. The SUMMARY's earlier manifest root is superseded by this current fixed-source computation, not accepted as current evidence. Existing consumed v1–v5 bytes/authority are not rewritten or refunded.

## Behavioral spot-checks and retained gate evidence

No full-suite repeat. Two bounded named-test commands used the v6 fixture only; each finished below ten seconds:

| Check | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-replay-validation-v6.test.ts --maxWorkers=1 -t 'authenticates current v6 setup custody and charges every current-turn millisecond\|joins a v6 reader to the conservative effective close, not raw rounded wall time\|isolates all v6 paths and keeps the exact finite zero-charge predecessor without a stopped predicate'` | Exit 0; 3 passed, 75 deliberately filtered; 3.65 s. |
| Same single-file command, exact name filter for both `publishes and reads ... v6 snapshots through real consumers under synthetic capacity`, both `actual strict v6 ... validates every selected replay without full text`, origin/publication correlation and exact CLI/intent | Exit 0; 6 passed, 72 deliberately filtered; 7.01 s. |
| Inert v6 source-manifest builder | Exit 0; current root/count and required pins above. |
| `git diff --check` and modified-source debt-marker scan | Whitespace check clean; no TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER matches in the nine changed source/fixture files. |

Separately retained fixed-source validation and MAIN gate evidence records **148/148 passed, zero failures/skips**, package no-emit exit 0, shell syntax exit 0 and boundary scan **1408 files/zero violations**. Those retained results are not SUMMARY evidence and were not substituted for direct source inspection or the verifier's own named behavioral checks. No probe declaration or conventional probe is part of this bounded supplement; no empirical probe is authorized.

## Adversarial disconfirmation and limits

Checked three concrete counterexamples: caller-authored gap segments erasing work (now rejected even rehashed, including exact cap edge); forged allocation/foreign publication identity selecting v6 authority/reader (exact admission and proof joins plus rejection fixtures); empty prior ledger mistaken for a stopped/accepted prior experiment (finite custody accepts zero new charges without stopped or old reader). The first was a genuine review blocker, fixed in `03ed458a`, with direct passing named behavioral evidence.

The source-only publication tests deliberately mock capacity and some entry/reuse custody; they prove source-publication and capability joins, **not native capacity or whole retained empirical acceptance**. The standalone origin/descriptor test does not prove a provider startup occurred; unchanged constructor/session wiring was inspected and no provider was invoked. Native startup/cleanup/RSS feasibility remains a later admitted empirical question, not a missing implementation silently passed here.

All limits remain **43,200,000 ms / 15,000,000,000 bytes / 300 Matches**, carrying **24 spent Matches** and all surviving files, with guest 1,000/host 5,000/startup 2,500/cancellation ≤100/Match 600,000 ms, 12 GB retained/2 GB scratch/1 GB terminal, 512,000,000-byte external reserve, 320 MiB parent buffer, 256,000,000-byte replay ceiling and **4× declared-inflate guard**. Full buffered inflation and full audits remain. Test/report/admin and every later current-turn millisecond count; no budget reset, refund, old-reader reuse or recredit.

## Requirements and human/empirical frontier

LEAG-01–09 are all declared by this supplement and remain pending, not orphaned or completed by source verification. Whole-Phase 265 league/evaluation/freeze is not achieved by this report. No formation, private holdout opening, public, counted, production or downstream authority.

There are no unresolved source-functional truths requiring human resolution at this gate. Native RSS and complete 36-Match feasibility are expressly outside its source-only contract and remain unproved. Ordered gates now have clean independent fixed-source review → fixed-source validation → this independent source verification. MAIN must still obtain separately reviewed new data/helper bindings, a new immutable committed allocation, fresh same-process real 0700-store capacity and unique entry with source/HEAD fixed. Only ONE new private diagnostic is initially permitted; at most ONE fresh 36-Match baseline follows full acceptance of that diagnostic and fresh capacity. Failure/refusal ends the envelope. Actual-result evidence selects the ordinary unique check; absence of an eligible result selects terminal-only, never fabricated result/HEAD or historical-reader retry.

No source or shared planning state was edited, no commit made; this report is the verifier's only persistent workspace change.
