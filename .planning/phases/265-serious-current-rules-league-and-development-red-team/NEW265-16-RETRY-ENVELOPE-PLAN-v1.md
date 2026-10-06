---
phase: 265-serious-current-rules-league-and-development-red-team
plan: 16
supplement: retry-envelope-source-only
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/strategy-lab/src/league/lean-experiment.ts
  - scripts/run-v1-38-lean-correction.ts
  - scripts/run-v1-38-lean-correction.sh
  - scripts/lib/v1-38-lean-correction-retained.ts
  - scripts/lib/v1-38-lean-baseline-retained.ts
  - scripts/run-v1-38-lean-correction.test.ts
  - scripts/run-v1-38-lean-correction-bytes.test.ts
  - scripts/lib/v1-38-lean-baseline-retained.test.ts
  - scripts/lib/v1-38-lean-correction-retained.test.ts
  - scripts/run-v1-38-lean-host-stage-v7.test.ts
  - scripts/run-v1-38-lean-host-stage-v8.test.ts
  - scripts/run-v1-38-lean-retry-envelope-source-manifest.ts
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-RESEARCH-v1.md
  - .planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-POST-HANDSHAKE-APPROVAL-20261006.md
autonomous: true
requirements: [LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-07]
must_haves:
  truths:
    - "Every newly admitted diagnostic has exactly one immutable ordinal in {1,2,3}, cryptographically bound through request, setup authorization, allocation, route/store/temp/check identities, source manifest, admission, ledger, terminal, and retained check; old v1-v7 identities and behavior remain unchanged."
    - "Admission and unique entry spend that ordinal before provider charge, including zero-Match/entry failures; there is no refund, resume, skip, alias, fork, overlap, source/HEAD drift, or caller-asserted progress."
    - "Three mutually exclusive closures apply: result/head present permits one ordinary reader; acceptance carries its actual check and final reader-close; refusal/failure closes its actual journal then emits one v8-only non-authorizing receipt bound to exact result, terminal, source/HEAD, ledger, reader start/final close, and accepted-check absence. No eligible result/head uses a separate terminal-only validator proving actual absence."
    - "A successor requires the prior attempt's actual terminal and exactly one appropriate closure receipt plus a resolved defect or materially useful finite diagnosis and new independent authorization/review; an unchanged known-failing launch cannot consume another ordinal."
    - "At most one baseline allocation exists; it can start only after an actual fully accepted fresh diagnostic check and the actual final reader-close carry from that same attempt. Earlier check text or report observation is not authority."
    - "The actual failed v7 prefix remains immutable: 29 spent Matches; one failed CLEANUP result with cleanupComplete=false and explicit stop/non-success; closed time 47,361,631 ms and final reader-close 1,791,295,466,715 ms; raw close-journal SHA-256 63aceedab50124d68978631e567e78fecee558accc7f27067cb8f56f2ae05223 and allocation bytes SHA-256 937a2bb49f6de7680a81601be727718055c11f8ed3bc471f1a2749d6c1273861 are exact predecessor inputs, not reusable authorization/readers."
    - "All current elapsed accounting equals 49,150,573 + now - 1,791,299,252,280 ms; preserve all processing and surviving files. Shared ceilings stay 57,600,000 ms, 15,000,000,000 retained/future-write bytes, and 300 Matches, including administrative, live, reader, survivor, and gate costs; no reset or complete-36 fit promise."
    - "Runtime startup stays v7 and all guest/host/startup/Match/cleanup/resource/privacy rules stay unchanged; no new empirical credit, UI, candidate regeneration/tuning, formation, holdout, public, counted, production, or rules-shipping authority is created."
  artifacts:
    - "One additive v8 allocation/envelope policy and exact route allowlists in lean-experiment.ts; startup handshake/version selection remains v7."
    - "Actual CLI, shell temp dispatch, retained verifier/reader, publisher/issuer, and all predecessor/history/source-root consumers reject wrong, absent, stale, aliased, or caller-supplied ordinal/acceptance."
    - "Connected source-only adversarial fixtures exercise actual issuer/publisher/baseline constructor and reader, generated v7 startup frame/broker, real parent/session boundaries and all three closure classes; no detached helper-only test."
    - "Exact source manifest and sequential independent source review/fix, validation, and source verification gate records are available before any MAIN empirical work."
  key_links:
    - "v8 envelope identity -> request/setup/data review -> publisher/issuer -> factory/planner/session -> generated broker using unchanged v7 startup wire"
    - "ordinal -> physically distinct allowlisted request/allocation/store/temp/check and exact-root validation in every CLI, shell, reader, retained verifier, and history consumer"
    - "admission/entry -> irrevocably spent ledger ordinal -> terminal -> exactly one result-present accepted/refused-reader closure OR result-absent terminal-only closure -> successor custody"
    - "actual accepted diagnostic check + actual final reader-close -> sole baseline allocation and capacity gate"
    - "immutable v7 finite failure roots + prior task time carry -> new append-only predecessor/cumulative budget accounting"
---

<objective>
Implement and source-verify one additive bounded v8 retry envelope for up to three distinct fresh private diagnostics and one strictly conditional fresh 36-cell baseline, without changing the v7 startup protocol or any existing runtime/resource/privacy/gameplay bound.

Purpose: make each approved opportunity finite, non-replayable, independently authorized, and causally evidenced while preserving the failed v7 history exactly.
Output: connected v8 issuer-to-consumer source/tests and an independently reviewed, validated, source-verified gate package. This plan grants source-only work; MAIN alone may later pass the explicit empirical gates below.
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-RESEARCH-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-POST-HANDSHAKE-APPROVAL-20261006.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-POST-HANDSHAKE-CONTINUATION-DECISION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-HOST-STAGE-V7-DIAGNOSTIC-VERIFICATION-v1.md
@.planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-STARTUP-SOURCE-VERIFICATION-v1.md

Approval identity checked: raw SHA-256 `f60084e7d4b34f0f83e6432df1cd0468c9668c83f30be9c7cedd890667373ab1`.

Before edits, inventory the current call graph and exact key schemas from actual sources, including `leanSupervisorVersion`, `leanCapsForAllocation`, `admitLeanAllocation`, `leanWritablePaths`, ledger creation/read, `readLeanTimeAccounting`, entry/terminal readers, evidence verification, all `supervisorDocuments` branches, CLI parsing/failure handling, fresh-history and predecessor validators, publisher/issuer, source manifests, parent/session/startup broker, retained check/reader, and every route fixture. Research names seams but does not prove every consumer; verify each by `rg` and source inspection. If a named consumer/path does not exist, record that and trace the real equivalent rather than inventing a path. If complete ordinal propagation or source publication cannot be proven within this source-only scope, stop and report the precise blocker rather than weakening the contract.

Do not alter or relabel v1-v7 constants, policies, route identities, allocations, requests, results, checks, journals, source roots, or startup wire. v8 means envelope/allocation identity only. No UI, new dependencies, empirical command, live reader, helper, preparation, allocation, capacity run, Match, Strategy, Worker, Docker, or provider operation is authorized. Source/test and planning-doc atomic commits and normal push are authorized; empirical/allocation commits are not.
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Specify retry invariants in connected RED fixtures</name>
  <files>scripts/run-v1-38-lean-host-stage-v8.test.ts, scripts/run-v1-38-lean-correction.test.ts, scripts/run-v1-38-lean-correction-bytes.test.ts, scripts/lib/v1-38-lean-correction-retained.test.ts</files>
  <behavior>
    - Distinct ordinal 1/2/3 produces distinct authenticated route roots and physical paths; missing/out-of-range/skipped/duplicate/alias/parallel ordinals refuse at actual issuer/admission and all consumers.
    - Entry spends an ordinal before dispatch even when no Match is charged; refusal/failure cannot refund, resume, replace, or re-enter it.
    - Actual result/head permits one ordinary reader regardless of outcome; acceptance has actual check/final-close, while refusal has actual journal close then one immutable v8 non-authorizing receipt bound to result/terminal/source/HEAD/ledger/ordinal/reader-start/final-close and accepted-check absence.
    - No eligible actual result/head reaches a separate v8 terminal-only validator proving actual absence; it cannot close a result-present refusal and accepts no fabricated reader input.
    - A successor cannot admit absent previous terminal + unique verification closure + useful diagnosis/repair + fresh review/authorization, and cannot repeat an unchanged known failure.
    - Baseline authority requires one fresh diagnostic's actual accepted check and final reader-close carry; the actual selected baseline retained reader rejects wrong ordinal, absent accepted check, and nonfinal close, and accepts only the selected baseline's actual ordinal/check/FINAL-close join.
    - Actual fixture imports exact pinned failed v7 result and already-once-closed reader roots plus numeric time/charge/survivor debit, without invoking the old reader or modifying v1-v7 artifacts/startup selection.
    - Generated v7 startup frame and broker remain the selected pair under v8 allocation; serialized/caller-created authority and injected transport remain rejected.
  </behavior>
  <action>Write adversarial failing tests against actual admission, authority issuer, baseline publisher/source allowlist/constructor/reader, CLI/shell routing, generated broker/session, retained reader/checkpoint, and exact root consumers. Exercise three mutually exclusive paths: result/head present with one accepting reader; result/head present with one refusing reader, actual journal close and ordinal-bound non-authorizing v8 refusal receipt; result/head absent with a separate terminal-only validator that proves absence. Bind refusal bytes to result, terminal, source/HEAD, ledger, reader start/final close and accepted-check absence. Use inert fixtures, not native processes, Strategy, providers, or consumed evidence; test actual production owners, not detached predicates.</action>
  <verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v8.test.ts scripts/run-v1-38-lean-correction.test.ts scripts/run-v1-38-lean-correction-bytes.test.ts scripts/lib/v1-38-lean-correction-retained.test.ts --maxWorkers=1</automated></verify>
  <done>Connected tests fail for missing v8 semantics, reach production consumers, reject cross-use among the three closure classes, and retain v1-v7/safety controls.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement additive v8 ordinal propagation and immutable closure rules</name>
  <files>packages/strategy-lab/src/league/lean-experiment.ts, scripts/run-v1-38-lean-correction.ts, scripts/run-v1-38-lean-correction.sh, scripts/lib/v1-38-lean-correction-retained.ts, scripts/lib/v1-38-lean-experiment-authority.ts, scripts/lib/v1-38-lean-baseline-source.ts, scripts/run-v1-38-lean-baseline.ts, scripts/lib/v1-38-lean-baseline-retained.ts, scripts/run-v1-38-lean-correction.test.ts, scripts/run-v1-38-lean-correction-bytes.test.ts, scripts/lib/v1-38-lean-correction-retained.test.ts, scripts/lib/v1-38-lean-baseline-authority.test.ts, scripts/lib/v1-38-lean-baseline-source.test.ts, scripts/lib/v1-38-lean-baseline-retained.test.ts, scripts/run-v1-38-lean-baseline.test.ts, scripts/run-v1-38-lean-host-stage-v7.test.ts, scripts/run-v1-38-lean-host-stage-v8.test.ts</files>
  <action>Implement one additive schema/policy v8 envelope with `attemptOrdinal: 1 | 2 | 3`, binding ordinal into request/setup/data-review/allocation/source roots and disjoint request, allocation, store, temp, diagnostic-check and retained-check paths. Task owns the actual source paths `scripts/lib/v1-38-lean-experiment-authority.ts`, `scripts/lib/v1-38-lean-baseline-source.ts`, and `scripts/run-v1-38-lean-baseline.ts` and their named connected tests: prove ordinal plus actual accepted-check/final-reader-close joins at issuer, publisher, baseline constructor and reader. Use exact allowlists, fresh empty 0700 stores, and ordinal-aware validation at every inventoried consumer. Keep generated startup wire/broker at v7. Carry exact pinned failed v7 result and already-once-closed reader roots without invoking old reader; preserve 29 spent, CLEANUP, cleanup false, stop/non-success, 47361631 ms closed time, 1791295466715 ms final reader close, all survivors, and elapsed formula 49150573 + now - 1791299252280. Enforce unchanged 57600000 ms, 15000000000 retained/future-write bytes, 300 Matches and existing reserves. Spend ordinal before dispatch even at zero charges. A successor requires actual terminal and exactly one valid closure plus useful causal diagnosis/repair, fresh independent authorization/review and fixed source/HEAD. Closure class A: with actual result/head, one ordinary reader; if accepted, only its actual accepted check and actual final reader-close can authorize baseline. Closure class B: if that one reader refuses/fails, close its actual journal then write one immutable v8-only non-authorizing receipt from its actual lifecycle/finite bytes, binding exact result, terminal, source/HEAD, ledger, ordinal, reader-start, final-close, and accepted-check absence. Never route result-present refusal through terminal-only validation (which requires actual result absence), and never run another ordinary reader. Closure class C: if no eligible result/head exists, a separate v8 terminal-only validator proves actual absence; this receipt can close a successor but never authorize baseline. An independent finite audit can verify a refusal receipt but cannot impersonate a reader. Exactly one baseline can be admitted only from a fresh actual accepted check and same-attempt final close. Preserve existing runtime, cleanup, resource, cold-opportunity, and privacy limits.</action>
  <acceptance_criteria>Implement and test the actual `scripts/lib/v1-38-lean-baseline-retained.ts` owner with `scripts/lib/v1-38-lean-baseline-retained.test.ts`. The selected baseline's retained-reader regression must accept only its actual ordinal joined to actual accepted-check and actual FINAL reader-close; it must fail for wrong ordinal, absent accepted-check, and nonfinal close.</acceptance_criteria>
  <verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v8.test.ts scripts/run-v1-38-lean-host-stage-v7.test.ts scripts/run-v1-38-lean-correction.test.ts scripts/run-v1-38-lean-correction-bytes.test.ts scripts/lib/v1-38-lean-correction-retained.test.ts scripts/lib/v1-38-lean-baseline-retained.test.ts --maxWorkers=1</automated></verify>
  <done>Connected fixtures prove ordinal through actual issuer, publisher, parent/session, baseline constructor/executor and `lean-baseline-retained.ts`; selected baseline accepts only its actual ordinal/check/FINAL-close join, while wrong ordinal, absent accepted check and nonfinal close refuse. All three closure classes are distinct, immutable and root-authenticated; v1-v7/startup v7 and all limits remain unchanged.</done>
</task>

<task type="auto">
  <name>Task 3: Close complete source inventory and commit the frozen worker handoff</name>
  <files>scripts/run-v1-38-lean-retry-envelope-source-manifest.ts, scripts/run-v1-38-lean-host-stage-v8.test.ts, .planning/phases/265-serious-current-rules-league-and-development-red-team/NEW265-16-RETRY-ENVELOPE-PLAN-v1.md</files>
  <action>Worker completes the inherited source manifest and exhaustive call-site inventory covering every caller, allowlist, publisher/issuer, parent/session/startup, baseline source/constructor/reader, closure writer/verifier, and retained consumer; prove source publication and exact v8-root wiring. Regenerate the complete manifest after implementation/fixes over approval, research, this plan, all changed files and actual entrypoints, with exact connected-test results. Atomically commit source/tests and planning docs and perform the normal user-authorized push; hand off exact commit/HEAD, manifest, tests and unresolved empirical gates. MAIN alone then runs independent review/fix → regenerate manifest and commit any repair → validation → source verification serially; all post-repair gates bind the final fixed identity. Source HEAD changes only through those commits, then stays fixed for any separately authorized empirical route. Missing paths, manifest omissions, failed gates, drift, incompatible predecessor facts, or new rule/resource/product decisions block empirical work. Source commits are authorized; empirical/allocation writes are not.</action>
  <verify><automated>node node_modules/vitest/vitest.mjs run scripts/run-v1-38-lean-host-stage-v8.test.ts scripts/lib/v1-38-lean-baseline-authority.test.ts scripts/lib/v1-38-lean-baseline-source.test.ts scripts/run-v1-38-lean-baseline.test.ts --maxWorkers=1</automated></verify>
  <done>Complete inventory/manifest and source tests are committed and handed off with an exact identity; worker has run no independent source gate or empirical process.</done>
</task>

</tasks>

<main_empirical_gates>
MAIN alone runs independent review/fix → manifest regeneration and commit of fixes → validation → source verification; empirical work waits for all gates on final fixed HEAD. Only MAIN may then enter after actual MAIN authorship, independent data/helper review, a new immutable request/allocation commit, fresh empty 0700 store, same-process capacity before charge, no concurrency, and fixed source/HEAD through terminal and its unique closure. Source commits are authorized; allocation/empirical commits are separately gated MAIN actions. Every attempt includes administrative/gate/live/reader/survivor costs under `49,150,573 + now - 1,791,299,252,280`, 29 immutable prior charges and unchanged 57,600,000 ms / 15 GB retained-and-future-write / 300 Match ceilings.

Three exclusive closure classes: (A) actual result/head present, one ordinary reader accepted; its actual accepted check and final reader-close alone permit the sole baseline. (B) actual result/head present, one ordinary reader refuses/fails; close its actual journal and issue one immutable ordinal-bound v8 non-authorizing receipt over actual result, terminal, source/HEAD, ledger, reader-start/final-close, and accepted-check absence. An independent finite audit can verify that receipt, never run a second ordinary reader. Do not use the old terminal-only validator here because it requires result absence. (C) no eligible actual result/head; a separate v8 terminal-only validator proves actual absence and cannot consume a result-present receipt. This closure permits successor custody, never baseline. No fabricated reader/check/closure. At most one baseline, only after accepted check/final-close and fresh capacity. Stop after three spent diagnostics without acceptance, baseline refusal/failure, inadequate remaining cap, or new rule/resource/product choice; no full-36 fit promise.
</main_empirical_gates>

<verification>
Source-only focused connected tests pass with `--maxWorkers=1`; strict package typecheck and existing narrow boundary/privacy scans pass; exact source manifest matches the fixed source/HEAD; independent review/fix, validation, and source verification pass in that order. No empiricism is inferred from fixtures.
</verification>

<success_criteria>
All required truth/artifact/key-link assertions above are satisfied by actual producer-to-consumer tests and source inspection. Every caller, allowlist, source publication, issuer, host-stage, parent, shell, retained reader, acceptance check, baseline constructor, and verifier is accounted for; no missed path is assumed absent. Versions 1-7 and startup v7 are unchanged. Empirical work remains independently gated, capped, private, and without completion/fitness promises.
</success_criteria>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|---|---|
| CLI/shell to request and allocation authority | User-controlled command mode, paths, and JSON must not select or alias an ordinal/route. |
| MAIN publisher to capability issuer/factory/planner/session | Only freshly authorized, committed, fixed-source allocations may obtain host-issued execution authority. |
| Host process to generated startup broker and hostile Strategy | Preserve existing v7 startup, timeout, capability and redaction boundary; no strategy code enters web/API or host control. |
| Ledger/terminal/result to retained verifier and baseline gate | Files and claims are untrusted until exact-byte/root, source/HEAD, ordinal, and actual lifecycle joins pass. |
| Prior attempts to successor attempt | Failed or incomplete custody cannot be replayed, refunded, skipped, or treated as accepted progress. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|---|---|---|---|---|---|
| T-265-16-RETRY-01 | Spoofing/Elevation | Ordinal and accepted-check authority | high | mitigate | Host-only issuer, exact schemas/roots, actual-reader closure receipts, adversarial producer-consumer fixtures. |
| T-265-16-RETRY-02 | Tampering/Repudiation | Request, allocation, ledgers, predecessor history | high | mitigate | Immutable content roots, append-only exact identities, source/HEAD fixed through unique terminal and verification. |
| T-265-16-RETRY-03 | Denial of Service | Retry/parallel dispatch/resource ceiling | high | mitigate | Spend before dispatch, reject duplicate/parallel/alias attempts, precharge same-process capacity and preserve aggregate caps. |
| T-265-16-RETRY-04 | Information Disclosure | Diagnostic/result/readers | high | mitigate | Existing schema-allowlisted redaction; no Strategy/source/memory/objective payloads or raw hostile error disclosure. |
| T-265-16-SC | Tampering | npm/package install supply chain | low | accept | No packages or dependencies are added; existing installed test tooling only. |
</threat_model>

<output>
Source-only plan artifact. After MAIN's gated empirical work, record its separately authorized actual outcome without rewriting predecessor artifacts; do not create requirement/freeze/formation/holdout/public/counted/production credit from plan or source-gate completion.
</output>
