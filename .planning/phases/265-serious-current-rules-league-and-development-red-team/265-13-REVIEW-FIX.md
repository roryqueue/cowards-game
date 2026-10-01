---
phase: 265
plan: 13
status: fixed_pending_independent_review
repair_pass: 1
review_epoch: 32877fd4715a870a562ad7fd7e2f90111cf41e0c
review_report: 265-13-RETRY-V4-SOURCE-REVIEW.32877fd4.md
findings_addressed: 3
operational_authority: false
---

# Phase 265 Plan 13 source-review repair pass 1

All three reported blockers have source repairs and focused source-only regression coverage. This author-produced fix note is not an independent review, accepted source gate, empirical result, or authorization to allocate or dispatch. Root must freeze the repaired bytes and obtain the next independent review.

## Finding 1 — Public complete evidence producer

**Fixed in source.** `retainDiagnosticRetryV4Execution` is module-private. The complete manifest can be produced only by `runAndRetainCanonicalDiagnosticRetryV4`, after consuming the private durable run permit and calling the one-use private bridge permit path. No public execution mint or complete-retainer export remains. Partial failure evidence remains separate and cannot create a complete successful manifest.

Tests assert the public producer/mint exports are absent and that fabricated, copied, reused, and old-namespace permits cannot enter the actual adapter/bridge. Genuine canonical effect/resume fixtures now reach the real wrapper and lossless codec through a Vitest test-module-only replacement of the private bridge call's exported operation. This injection exists only in `.test.ts`; production gained no callable fixture seam. Producer and retained-reader gameplay-chain mutations, individual machine hashes, schema/events/terminal/accounting, and missing/orphan evidence negatives remain covered.

## Finding 2 — Reusable, insufficiently bound lifetime grant

**Fixed in source.** The public lifetime mint was removed. A private WeakMap issuer now creates the grant inside assessed-candidate provider issuance only after candidate assessment, closure, factory admission/authorization, revision validation, and executable derivation. The frozen runtime binding includes candidate/admission, factory authorization/packet/proposal/validation, source/revision/executable, kernel tuple/runtime profile/image, together with allocation/cell/start/seat/container ownership.

The grant is active only during its one synchronous provider-host construction. The actual factory and planner boundaries validate the binding and claim their respective construction stages once, in order; a second factory or planner construction claim is rejected. A `finally` invalidates the grant whether host construction returns or throws. Later provider invocation does not remint or reuse construction authority. Mixed old/new grant paths still fail closed.

Focused tests reject wrong source, executable, runtime, candidate, admission, revision, tuple, image, cross-seat binding, repeated issuance, duplicate layer claims, and captured grants after successful or failed construction. An inert fixture additionally constructs and invokes the actual factory wrapper with a genuinely built source revision and the nested actual planner lifetime admission helper. Its selected runtime is injected and does not contact Docker or execute Strategy source. Adapter fixtures remain explicitly labeled boundary injections, not assessment or empirical proof.

## Finding 3 — Future stage markers written before entry

**Fixed in source.** Durable run-attempt charging no longer requires stages 0–2. The worker writes start and the exclusive charge before candidate read or provider work, then records bottom issuance, top issuance, and pre-kernel binding immediately before the respective operations. Kernel and evidence callbacks record their actual boundaries; terminal publication records stage 5. Failure classification uses the last actually entered stage, or `unknown` when candidate read fails before issuance.

Five injected worker failure fixtures execute the actual worker and reopen its durable charge/stage/terminal records: candidate read, bottom issuance, top issuance, pre-kernel binding, and kernel entry. They verify that no future stage appears and that retained `failureStage` matches the entered operation. Candidate/provider/child operations are replaced only in the test module; cleanup receives inert missing-container responses and never runs a host command.

## Verification results

- `pnpm exec vitest run --maxWorkers=1 packages/strategy-lab/src/league/diagnostic-retry-v4.test.ts packages/strategy-lab/src/league/diagnostic-retry-v4-bridge.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts` — exit 0, **84/84 tests**, 5/5 files, 29.26 seconds.
- `pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json` — exit 0.
- `pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node scripts/run-v1-38-diagnostic-retry-v4.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts` — exit 0.
- `git diff --check` — exit 0.

The ten-file source/test allowlist is the entire tracked source diff for this repair. The v3 diagnostic module/CLI, connected runner, canonical kernel, runtime bridge, game rules, and resource bounds were not edited. Temporary fixture stores only were created by focused tests. No host observation, live preflight, Docker/provider/Strategy/Match dispatch, operational allocation, historical private-store mutation, closure/review issuance, or commit occurred.

## Handoff

All ten source/test files and this fix note are released to root for exact QA, source freeze, and independent re-review. The old rejected review remains historical and cannot attest these repaired bytes. The current source admission gate remains closed until the new root-owned closure and accepted independent review exist.
