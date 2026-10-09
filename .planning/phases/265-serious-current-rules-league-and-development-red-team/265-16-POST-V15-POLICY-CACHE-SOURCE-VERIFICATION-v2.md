---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "16"
verified: 2026-10-09
status: verified_source_only
scope: checked-policy-cache-and-boundary-source-only
source_commit: 158012abb0e0f2b774fea7b7c75911856ea8bef6
source_root: sha256:f4c6324252682707ab59f93eb63170bdeeb962dd13dd7d008514a183d18591ed
source_entries: 974
selected_review_root: sha256:5820f7b6659b5da6d8e3c91f38bbd45cd288459d15ad0826580ec9da434c4978
empirical_credit: none
whole_phase_status: pending
---

# Phase 265 Plan16 — post-v15 policy-cache source verification v2

## Scope and outcome

This is a source-only supplement for the policy-cache and bridge-boundary amendment in existing Plan16. It does not verify the Phase 265 goal, the whole Plan16, LEAG outcomes, baseline completion, current-rules freeze, formation, holdout, public/counting/production status, or empirical readiness. Result: **the bounded source claims and the required connected inert behavior test are verified for this source-only scope.** No accepted/FINAL authority or empirical admission is issued.

The source identity observed at verification was HEAD `4b423df0d16081fba7ea14341def905cda26b60e`. The functional source remains commit `158012abb0e0f2b774fea7b7c75911856ea8bef6`, whose production manifest derives to 974 entries and `sha256:f4c6324252682707ab59f93eb63170bdeeb962dd13dd7d008514a183d18591ed`. No tracked source changes were present. The selected v6 review is an actual saved, single-link, mode-0600 12,171-byte file with SHA-256 `5820f7b6659b5da6d8e3c91f38bbd45cd288459d15ad0826580ec9da434c4978`.

## Observable truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Successful full admission issues policy-cache authority only to the exact reconstructed, immutable host-returned allocation; caller objects and root strings do not receive it. | VERIFIED (source) | `lean-experiment.ts:1139-1200`: separate bounded descriptor/array/node/depth eligibility, registration on `expected` only after full reconstruction/root equality, private WeakMap, misses retain admission path. Existing `immutableRetryData` and `admittedRetryCaps` remain distinct. |
| 2 | Ordinal 4 selects its separate strict same-bounds policy, while old policies/exports remain unchanged and ordinal 5 stays dormant. | VERIFIED (source) | `lean-experiment.ts:2000-2003`; focused package test assertions at `lean-resource-window-v15.test.ts:59-72`. A direct TypeScript-AST declaration extraction comparison against `b21db1433611b494091a269d13c8f58dc91ba2bf` passed for 14 statements: three policy bodies, six policy/caps exports, original 4/6/10 input/exclusion/amendment arrays, `immutableRetryData`, and `admittedRetryCaps`. |
| 3 | The actual cache-selection path does not replace fresh allocation-file admissions, fresh checkpoint observations, live resource/ledger guards, or no-refund accounting. | VERIFIED | The single named test passed (1 passed/46 skipped); its assertion body at `run-v1-38-lean-resource-window-v15.test.ts:35-48` exercises repeated hits, three fresh allocation admissions, and retained live guards. The 13-path source inspection confirms the wrapper and checkpoint/manifest guard paths remain connected. |
| 4 | Strict v15-4 bridge attribution is host-owned, private, opt-in, finite, joined to the actual returned execution identity, and does not alter default execution shape. | VERIFIED (source) | `runtime-bridge.ts:31-63,134-143` uses private WeakMap branding and optional wrapper-supplied host clock; `baseline-match.ts:112,171,200` opts in only for admitted v15-4 and projects private metadata; bridge contains no Node/Date/performance import. Related inert tests exist in `runtime-bridge.test.ts` and `baseline-match.test.ts`. |
| 5 | The ten refused v15-3 records remain cost-only metadata, and the real mode-4 consumer uses the selected v6 review and exact current source identity without old custody authority. | VERIFIED (consumer/source) | Actual default `authenticateLeanCorrectionReview` invocation below accepted the saved v6 bytes against the production-derived 974-entry manifest and v15-4 policy. It returned roots matching the receipt and original policy/approval/plan roots. Source paths show v15-4 chooses v6 and mode-4 source-review validation; no old authenticator/ordinary reader/publisher was invoked in this verification. The 38-charge, unknown-peak, non-authorizing lineage is preserved by the bounded custody path; it is not accepted FINAL. |
| 6 | Source-only readiness does not activate empirical work or promote later outcomes. | VERIFIED (scope) | This report grants no empirical authority. The existing validation keeps runtime/retained recovery and phase outcomes unestablished; ordinal 5 is dormant and holdout unopened. |

## Artifacts and links

| Artifact | Level 1 / Level 2 | Wiring / data path | Result |
|---|---|---|---|
| `packages/strategy-lab/src/league/lean-experiment.ts` | Present; substantive cache, policy, caps, finite input/exclusion/debit constants. | `admitLeanAllocation` registers only its reconstructed return; policy/caps selectors consult that identity; mode 4 maps to its dedicated policy. | VERIFIED source; behavior test evidence outstanding. |
| `packages/strategy-lab/src/runtime-bridge.ts` | Present; substantive phase/cause/timing handling. | Actual `runLeanBaselineMatch` supplies host callback only with admitted v15-4 binding and reads exact execution sidecar. | VERIFIED source. |
| `scripts/lib/v1-38-lean-resource-window-v15.ts` and `scripts/run-v1-38-lean-correction.ts` | Present; substantive exact pins, document selector, source manifest and consumer. | Production manifest → saved v6 bytes → private reader → source/Git/role checks. | VERIFIED by default consumer invocation. |
| `scripts/lib/v1-38-lean-correction-retained.ts` | Present; substantive private retained metadata validators. | Wrapper's v15-4 nullable private cell is checked by retained audit; persisted JSON is not fresh host branding. | Wired in source; no retained empirical success inferred. |
| 13-path selected semantic closure | Exact ordered list recorded by the saved v6 receipt and source ownership contract; source commit/root above. | Includes the actual bridge/wrapper/test dependencies, not only the inherited nine-file core. | Reviewed source identity verified; no unrelated closure expansion. |

Source-review consumer command (bounded read-only process; exit 0, 3.8s):

```sh
NODE_OPTIONS=--max-old-space-size=768 perl -e 'alarm 60; exec @ARGV' npx tsx -e 'import { authenticateLeanCorrectionReview, leanCorrectionSourceManifest, readLeanCorrectionPrivateBytes } from "./scripts/run-v1-38-lean-correction.ts"; import { leanBytesRoot, LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY } from "./packages/strategy-lab/src/league/lean-experiment.ts"; import { leanResourceWindowDocumentsV15 } from "./scripts/lib/v1-38-lean-resource-window-v15.ts"; const path = leanResourceWindowDocumentsV15("diagnostic", "v15-4").review; const bytes = readLeanCorrectionPrivateBytes(path, 262144); const manifest = leanCorrectionSourceManifest("v15-4", LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY); authenticateLeanCorrectionReview(path, leanBytesRoot(bytes), manifest.root, null, undefined, "v15-4", LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY); process.stdout.write(JSON.stringify({path, bytes: bytes.length, reviewRoot: leanBytesRoot(bytes), sourceRoot: manifest.root, sourceEntries: manifest.entries.length, policyRoot: LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY.root, approvalRoot: LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY.approvalRoot, planRoot: LEAN_RESOURCE_WINDOW_V15_POLICY_CACHE_POLICY.planRoot, acceptedByDefaultConsumer: true}) + "\\n")'
```

Observed values: saved v6 `12171` bytes and root above; manifest `974` entries and root above; original policy root `sha256:cc82460b7ce59632b02348209d3fc2a760de527f36d39ac52f7f211e77133b37`; approval root `sha256:21fae32b03b5027d6ec6913b420c758ea30368c61ae43676f47725c6acad1738`; plan root `sha256:bc54e7c5b530fe355395f566d12bad2eb0e4f3ad6f315d50ab435f90b1f09e2a`. No observation, source, read, or Git identity seams were injected. This validates only the saved source-review consumer, not request/authorization/setup/admission/entry.

## Connected inert behavior test and command outcomes

The required named test passed once. Two preceding command attempts did not start or discover a test: the `timeout` wrapper was unavailable (exit 127), and the Vitest CLI rejected the concatenated option spelling before discovery (exit 1). Following clarification that neither attempt had executed the named case, the correctly formed command below was run exactly once.

```text
Attempt 1: NODE_OPTIONS=--max-old-space-size=768 timeout 60s npx vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts -t '^policy cache actual checkpoint retains three fresh admissions and every live guard after hits$' --testTimeout5000
Result: exit 127; zsh: command not found: timeout. Test process not started.

Attempt 2 (only Vitest invocation): NODE_OPTIONS=--max-old-space-size=768 perl -e 'alarm 60; exec @ARGV' npx vitest run scripts/run-v1-38-lean-resource-window-v15.test.ts -t '^policy cache actual checkpoint retains three fresh admissions and every live guard after hits$' --testTimeout5000
Result: exit 1; Vitest rejected the option before test discovery. Duration 0.9s. Test count: 0.

Attempt 3 (single discovered named case): NODE_OPTIONS=--max-old-space-size=768 perl -e 'alarm 60; exec @ARGV' node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-resource-window-v15.test.ts -t '^policy cache actual checkpoint retains three fresh admissions and every live guard after hits$' --testTimeout 5000
Result: exit 0; 1 passed, 46 skipped (47 total); duration 8.60s (test time 4.03s). The one selected test covers three fresh admissions plus live guards after cache hits.
```

Other source checks: the v6 receipt raw SHA-256/mode/link/size check matched; current HEAD and tracked-clean source state were rechecked after the default consumer. A separate read-only custody-constant comparison (not the old custody authenticator) read the ten pinned files and directly checked raw length/SHA-256, full-wrapper canonical pin, schema/key set, and any embedded root. Result: exit 0; raw 10/10, canonical 10/10, embedded roots 7, absent roots 3. The direct AST comparison above exited 0 with all 14 declarations byte-identical. No broad suite, type check, scanner, historical probe, pure comparison probe, provider, Strategy, kernel, Match, request, publisher, or old custody authenticator/reader was run.

Post-report default consumer/manifest recheck (read-only; exit 0): source root remained `sha256:f4c6324252682707ab59f93eb63170bdeeb962dd13dd7d008514a183d18591ed` with 974 entries; saved review root remained `sha256:5820f7b6659b5da6d8e3c91f38bbd45cd288459d15ad0826580ec9da434c4978`; production consumer accepted it. The v2 verification document is a named generated exclusion from the functional source manifest while remaining a physical report debit.

## Prohibitions and proof limits

- No Match, provider, Strategy, real kernel, request, setup, authorization, allocation writer, store, capacity check, entry, empirical verifier, accepted FINAL, or holdout execution occurred.
- The ten v15-3 custody records remain refused-history cost data only: cumulative charge `38`, historical peaks unknown, no reader authority, no no-refund relaxation. Their raw and canonical pins were checked directly; the old 4/6/10 arrays and three old policy bodies/six exports matched their `b21db143` declarations byte-for-byte.
- The historical strict11/grouped94808 results and earlier failed timeout runs remain NOTPASS. No cache-causality or cure claim follows from the source change or previous pure-probe timings.
- Existing validation-v1 failures remain immutable. This supplement does not change whole-phase Nyquist, LEAG completion, current-rules freeze, serious-league result, baseline result, formation, holdout, public/counting/production status, or human approval.

## Gaps summary and escalation

The scoped source-only truths are verified, including the single connected guard/cache behavior test and actual default saved-v6 consumer. Earlier malformed command attempts remain recorded as NOTPASS tooling outcomes and are not counted as test evidence; the later valid command ran the selected case once and passed. This is not a phase-wide pass and does not open any empirical gate.

_Source-only verifier supplement. No commit or phase-wide verdict._
