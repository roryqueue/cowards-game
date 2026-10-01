---
phase: 265
plan: 13
status: fixed_pending_independent_review
repair_pass: 2
review_epoch: 1e23231f5a7f7517205171dd8f389c751a406afd
review_report: 265-13-RETRY-V4-SOURCE-REVIEW.1e23231f.md
findings_addressed: 1
operational_authority: false
---

# Phase 265 Plan 13 source-review repair pass 2

The residual caller-controlled-supervisor blocker has a narrow source repair and focused regression coverage. This fix note is author-produced, not an independent review or accepted gate. Root must freeze and independently review the repaired source. The pass-1 report and rejected review epochs remain unchanged.

## Finding — Exported issuer accepted a caller-controlled supervisor

**Fixed in source.** `issueDiagnosticRetryV4ProviderFromFactoryCandidate` no longer accepts or exposes a runtime-host interface. Its exact input schema rejects host, constructor, provider, invoke, and other additional fields before construction. The bridge has a normal static import of the real same-directory factory supervisor, with no caller-controlled path or callback. It validates the ledger, assessment, closure, admission, revision, and executable before minting the existing private grant. The grant remains active only for the synchronous real factory-to-planner construction and expires in `finally`.

The production call supplies only the exact admitted source and v4 allocation/runtime/container identity to the real factory constructor. The v4 factory path rejects a `createRuntime` override; its default selects the real planner constructor. The v4 planner path rejects observer-harness, transport, stream-factory, and benchmark constructor injections. These checks are v4-only, leaving historical/default behavior unchanged. No provider receipt, alternative authority issuer, public grant mint, or production test seam was added.

The worker now awaits issuance and has no caller-provided runtime-host adapter. Durable charging and truthful stage entry from pass 1 remain intact, including retained candidate-read/bottom/top/pre-kernel/kernel failure coverage.

## Host-layer layout correction within pass 2

Root's initial pass-2 QA passed 88/88 tests and both type checks, but its lab-boundary scanner found three offenses: `CORE_DEPENDENCY_DENIED` and `CORE_TRANSITIVE_DEPENDENCY_DENIED` on the bridge, plus transitive denial on the shared module. The initial package-to-scripts dependency was therefore not accepted.

Both new v4 operational modules and their tests were relocated into the existing host scripts layer:

- `scripts/lib/v1-38-diagnostic-retry-v4.ts` and `.test.ts` retain the ledger, lifetime types/validation, lossless evidence producer/reader, and genuine kernel fixtures.
- `scripts/lib/v1-38-diagnostic-retry-v4-bridge.ts` and `.test.ts` retain the assessed issuer and canonical adapter, directly importing the real host-layer factory supervisor.

The four old new-v4 package files were removed, without compatibility barrels or package-to-host import edges. CLI, supervisors, test mocks, source-closure assertions, and the three required command constants use the host-layer paths. Existing engine/revision/contracts/runner code is imported through normal source-relative host conventions. Neither the scanner nor its allowed-import policy was changed; final scan reports zero violations. This is a source-layout correction, not a game-rule, resource-bound, or authority change.

## Source-only regression coverage

- A malicious caller host whose implementation would claim both layers and return a matching-identity fake provider is rejected before its callback or the fixed constructor is called. The canonical runner is not called and the durable ledger contains no evidence blobs.
- Caller-supplied constructor, invoke, and provider fields are rejected at the issuer boundary.
- Direct v4 factory/planner constructor overrides are rejected before runtime construction.
- Existing bound-identity, ordered single-use claims, captured-grant expiration, cross-seat, repeated-seat, forged/copied permit, and adapter negatives still pass.
- The genuine-source factory-wrapper/invoke fixture now injects its selected planner implementation only through a Vitest module mock, not a production option. The real factory wrapper and actual planner lifetime-admission helper remain exercised without host commands or Strategy execution.
- Genuine canonical effect/resume and lossless producer/reader mutation tests remain unchanged and pass.

All factory/planner/provider replacements are confined to `.test.ts` module mocks. They are explicitly boundary-unit injections and supply no assessment or empirical credit.

## Verification results

- `pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-diagnostic-retry-v4-bridge.test.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts` — exit 0, **88/88 tests**, 5/5 files, 29.33 seconds.
- `pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json` — exit 0.
- `pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --skipLibCheck --types node scripts/run-v1-38-diagnostic-retry-v4.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-diagnostic-retry-v4.ts scripts/lib/v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-diagnostic-retry-v4-bridge.ts scripts/lib/v1-38-diagnostic-retry-v4-bridge.test.ts scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts` — exit 0.
- `pnpm exec tsx scripts/check-v1-38-lab-boundaries.ts` — exit 0, `ok: true`, zero violations across 1,353 files.
- `git diff --check` — exit 0.

Source changes stay within the explicitly expanded allowlist: relocation of the four new v4 files and updates to the existing six harness/supervisor files, plus this new fix note. The shared evidence module/test changed only their location/import paths. The pass-1 report, v3 diagnostic module/CLI, connected runner, canonical kernel, runtime bridge, game rules, resource bounds, scanner, and scanner policy were not edited. Tests used temporary fixtures and module mocks only. No live operation, preflight/host observation, Docker command, operational allocation, historical private-store access/mutation, closure/review issuance, or commit occurred. All five prospective live attempts remain untouched.

## Handoff

All ten current source/test files, the four removed old-v4 package paths, and this pass-2 fix note are released to root for exact QA, source freeze, and independent re-review. The old rejected epochs cannot attest these bytes. Source admission remains closed pending the new root-owned closure and accepted independent review.
