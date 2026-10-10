# Plan 265-16 Supplement — Single Failed-Case Startup Correction

**Status:** `source_only_authorized_runtime_closed`; this plan covers the newly approved source-only fix/check window. Runtime admission remains closed: no probes, Matches, preparation, allocation, entry, provider, Strategy, empirical reader, or runtime validation.

**Authority:** fresh human source-only approval, anchored 2026-10-10T19:56:41Z (1791662201000 ms); hard stop 2026-10-10T20:56:41Z (1791665801000 ms).

**Diagnosis:** `.planning/debug/private-probe-v1-failure.md`.

**Source-only carry:** 314259903 ms, hard cap 317859903 ms, including all fix/check work. No runtime window/validator changes or empirical authority is included. Never reset time or resource/file costs.

## Objective and scope

Implement and source-check the confirmed route mismatch: private-probe dispatch selects the legacy broker with one 1000 ms lifecycle timeout and does not separately enforce the allocated 2500 ms startup limit. This is a source-contract defect, **not** proof it caused the consumed `system_failure` or `cleanupComplete=false`; preserve both actual causes as unknown. This approval is strictly source-only; no runtime correction attempt is admitted.

Keep the consumed v1 allocation, entry, result, refusal, old store, and failed probe bytes immutable. Do not resume that store, reuse its capability, retry through legacy dispatch, attempt ordinals 1–3, or do empirical work. No new allocation/entry is in this source-only plan. Preserve all guest/startup/host, RAM/disk, privacy, and historical cost limits unchanged. This cannot establish runtime feasibility, explain the old physical cause, satisfy LEAG, or claim a baseline/freeze.

## Ownership and bounded change set

These are the only permitted existing source/test paths (10); no engine, runtime package, container image/provider, authority consumer outside these paths, or broad/focused test suite mutation:

- `scripts/lib/v1-38-lean-experiment-authority.ts` and `.test.ts`
- `scripts/lib/v1-38-factory-supervised-runtime.ts` and `.test.ts`
- `scripts/lib/v1-38-planner-supervised-runtime.ts` and `.test.ts`
- `scripts/lib/v1-38-lean-container-match-session.ts` and `.test.ts`
- `scripts/run-v1-38-lean-private-probe.ts` and `.test.ts`

The source executor owns only these ten source/test paths and a scoped source SUMMARY. ROOT and distinct checking agents own the same correction family's plan-check/review/validation/source-verification notes. Do not create/modify actual allocations, private stores, empirical results, helpers, package files, or another plan number. Small GSD source handoff notes are permitted; no new assurance framework.

## Tasks and gates

### Task 1 — Add a probe-only startup grant and select the existing V8 path

**Files:** authority + authority tests; factory + factory tests; planner + planner tests; session + session tests (eight paths above).

**Action:** In `v1-38-lean-experiment-authority.ts`, keep probe authority disjoint from `LeanRuntimeAuthority`; add opaque `LeanPrivateProbeStartupGrantV1` and make the existing `claimLeanPrivateProbeRuntimeAuthority(authority, binding, layer)` return `{ binding, startupGrant? }`. Its WeakMap-backed grant state binds the existing probe join (allocation root/digest, debit digest/offset, execution owner, ordinal/case, probe request/input/source/executable roots, method, image/tuple/runtime-limit roots) plus fixed V8 policy/harness roots. Factory claims `factory` and passes that same opaque grant via its private planner option; planner claims `planner` and propagates it; session claims `session`, rechecks the descriptor against the charged probe binding, and selects V8 only from that claimed opaque grant. Each claim is ordered, one-use, exact-binding, and non-serializable; do not accept a caller timeout scalar or call `claimLeanStartupAuthorityV8`/construct `LeanRuntimeAuthority` for a probe.

The source trace resolves wire compatibility. `superviseLeanStartupV8` only reads its host budget and host callbacks; it does not inspect binding fields, and its origin is a spread of that binding plus finite V8 outcome fields. `buildLeanStartupWorkerHarnessV8` consumes `requestId`, source/method, signal buffer, GO deadline, and policy root; it has no seat/charge semantics. The current V8 broker/validator, however, exact-checks the Match-shaped binding (`allocationRoot`, `chargeRoot`, `seat`, policy/harness roots, request ordinal/root, method/input/source/executable roots). Add one private-probe discriminator/branch inside the existing V8 broker builder and session validator—not a second broker/executor—with exact probe keys: `schemaVersion`, `allocationRoot`, `allocationDigest`, `debitDigest`, `debitOffset`, `executionOwnerId`, `caseOrdinal: 0`, `requestOrdinal`, `probeRequestRoot`, wire `requestRoot`, `method`, `inputRoot`, `sourceRoot`, `executableRoot`, `policyRoot`, `harnessRoot`. Session constructs this object from the authenticated charged binding plus numeric `requestId` and payload-derived wire root (`sha256("v1.38-lean-startup-v8:" + requestId + ":" + payload)`); broker recomputes wire root and executable hash, checks method, protocol version, exact keys and fixed policy/harness roots; returned V8 origin is checked against that exact object and discarded. The opaque grant remains joined to the original `probeRequestRoot`, allocation/debit roots/offset, and source/input identity. This adapts only protocol identity fields; it grants no Match authority and executes no Match/kernel state. Existing V8 control enforces startup 2500 ms, guest 1000 ms, host 5000 ms. Existing legacy/default and Match broker selection and origin validation remain unchanged. Persisted result keeps `guestStartup: "unknown"` and aggregate cleanup; add no receipt fields, telemetry, or framework.

**Behavior tests:** valid probe grant traverses exact factory → planner → session claims; startup option is derived from it; V8 probe branch accepts only exact non-Match fields, recomputes wire request/source joins, validates transient origin against the same binding, and exercises fixed 2500/1000/5000 ceilings through inert supervisor/broker fixtures. Legacy/default and Match branches remain unchanged. Missing, mixed, out-of-order, replayed/fabricated grant, changed debit/offset/request/source/method, extra field, or caller scalar rejects before dispatch. Test fixtures must not launch Docker, providers, Strategy code, or Matches.

**Verify (source-only authorization):** `./node_modules/.bin/vitest run scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.test.ts`.

### Task 2 — Make v2 exactly one fresh corrected case, preserving current uncertainty semantics

**Files:** runner + runner tests, plus the four files in Task 1 only if its tests expose a necessary boundary seam.

**Action:** Preserve v1 parser/schedule/store/result semantics and immutable evidence. Implement prospective v2 production branches in the existing runner and authority: parse/schema validation, one-case schedule selection, canonical v2 destination, preparation serialization, allocation admission/issuance, charged entry, and read-only retained verifier joins. The v2 contract contains exactly one descriptor matching consumed v1 ordinal 0, a fresh-root/sourceHead contract, and authenticated carry joins to immutable v1 allocation/result roots, its already-charged ordinal-0 attempt, and measured retained-v1 allocated bytes. Missing measurement rejects; never assume zero. The actual v2 production path—not detached fixture-only logic—must reach the same opaque issuer and factory → planner → session V8 chain from Task 1, with a durable one-use debit. Expired runtime windows remain expired: do not alter any numeric runtime-admission constant, infer a new runtime allowance from this source hour, or invoke this prospective path now. Test those production branch functions with inert fixtures/mocks only: no actual CLI prepare/entry/verify, persisted allocation, private store, ledger, empirical reader or provider. **Do not add lifecycle or cleanup subcheck receipt fields/framework.** Retain current finite result schema and trusted aggregates: `guestStartup: "unknown"` remains unknown, `cleanupComplete` remains the existing aggregate result of stream-close success, clean removal, exact owned-container absence, and no startup-cleanup uncertainty. Do not infer which predicate failed, upgrade false from a later absence check, or attribute the old consumed failure. No raw errors, stderr/stdout, source, request/input/output, memory, or objective payload.

**Behavior tests:** inert fixtures exercise the called production v2 parser/schedule/admission/issuer/entry-verifier join functions and prove a valid one-case production binding reaches the Task1 claimed path. Unchanged v1 remains four cases and old result validation remains intact; v2 has one matching case, fresh root/sourceHead, and exact v1 cost joins. Reject zero/multiple/reordered/changed descriptors, reused root, missing byte measurement, wrong roots, cost omission, ledger corruption/replay, and injected constructors. No fixture creates an actual allocation/store/ledger or invokes an empirical reader/provider. Existing aggregate `cleanupComplete`/`guestStartup: "unknown"` semantics remain intact.

**Verify (source-only):** `./node_modules/.bin/vitest run scripts/run-v1-38-lean-private-probe.test.ts`, then Task 1's direct Vitest command and `./node_modules/.bin/tsc --ignoreConfig --noEmit --types node --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --pretty false scripts/lib/v1-38-lean-experiment-authority.ts scripts/lib/v1-38-lean-experiment-authority.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-lean-container-match-session.ts scripts/lib/v1-38-lean-container-match-session.test.ts scripts/run-v1-38-lean-private-probe.ts scripts/run-v1-38-lean-private-probe.test.ts`. Capture baseline and final diagnostics; any new diagnostic blocks source-only closeout. Use only installed `node_modules/.bin` binaries, run separately, and preserve each status. No runtime admission check is part of these commands.

## Execution order / authorization boundary

1. Implement the ten owned source/test paths only under the 2026-10-10T19:56:41Z source-only approval. No provider, runtime, Docker/container, Strategy, Match, allocation preparation/commit, entry, or empirical reader.
2. Run the direct installed focused tests, explicit-file strict TypeScript check, independent scoped source review, and source verification. Preserve inherited diagnostics honestly; any new diagnostic or failed contract test blocks source-only closeout.
3. Freeze source at fixed HEAD for ROOT validation. This closes only the source fix/check task. Runtime admission remains closed and requires a separate fresh approval and gates; nothing here admits v2 allocation or an ordinal-0 probe.

## Goal-backward acceptance

- The old consumed v1 case/result and all cost/survivor evidence are byte-immutable; connected production branches define but do not invoke or persist v2 with exactly one corrected descriptor and exact v1 cost joins.
- Source contracts/tests show that a future exact ordinal-0 authority could use only the existing isolated V8 supervisor with independent guest/startup/host ceilings; no old Match capability or Match state grants probe authority. No invocation occurs.
- Existing receipt semantics remain: `guestStartup` stays `unknown`; `cleanupComplete` is aggregate and does not identify a subcheck. No empirical reader or runtime verifier is invoked in this source-only task.
- No corrected probe attempt, zero Matches, no ordinals 1–3, no old-store writes, no reset/refund, and no LEAG/baseline/freeze/phase-completion credit.
- Source-only closeout does not establish runtime feasibility; future admission requires new explicit authority and gates.

## Threat model

### Review-driven source clarifications (2026-10-10)

The binding description's literal `caseOrdinal: 0` applies to prospective v2 only. For unchanged v1 compatibility, the session/broker carry the authenticated ordinal0–3 and validate the matching owner suffix; this grants no authority to attempt consumed v1 cases. The exact V1.19 request includes fixed `outputByteLimit: 262144`. V2 retained result/join verification requires exactly one ordinal0 attempt, outcome, and debit; an empty allocation cannot be verified as a completed probe.

“No allocation/store/ledger” excludes canonical or empirical route creation, not owned synthetic unit fixtures. The inert connected tests create and clean temporary synthetic Git allocations/stores/debits using a fixed test clock; they do not dispatch a provider, worker, Strategy, or Match or touch canonical evidence. This clarification does not reopen actual expired runtime admission. The generated broker predicate is source/syntax checked, not executed: retain that coverage warning and do not infer physical feasibility. Broader cleanup-test and strict-script diagnostics remain unresolved; this supplement's source closure cannot make the entire phase or its empirical gates pass.

| Boundary / threat | Severity | Disposition and mitigation |
|---|---:|---|
| v2 allocation/debit → probe authority forgery or replay | high | Mitigate: exact committed bytes, fresh root, durable one-use debit, request/source/image/limits binding, ordered claims. |
| probe authority → legacy dispatch or Match capability escalation | high | Mitigate: probe-only V8 grant; reject absent/mixed grant; prove zero Match state and preserve default/Match branches. |
| runtime lifecycle → misleading diagnosis or payload disclosure | high | Mitigate: preserve existing finite aggregate receipt; startup attribution remains unknown and aggregate cleanup false stays unattributed; raw content excluded. |
| cleanup/resource exhaustion or elapsed frontier | high | Mitigate: runtime admission stays closed; tests are inert and create no store, entry, or process. |
| package supply chain | low | Accept: no dependency/package changes. |

**Final gate:** Fresh human approval authorizes source-only implementation/checks through 2026-10-10T20:56:41Z, subject to the carried 317859903 ms cap. Runtime/empirical admission remains closed. No allocation, store, entry, provider, Strategy, runtime, Match, or reader work; no new packages, helper/report family, or plan number.
