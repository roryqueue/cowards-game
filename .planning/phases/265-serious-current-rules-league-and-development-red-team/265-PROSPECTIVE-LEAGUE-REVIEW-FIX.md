---
phase: 265
plan: 07
review_report: 265-PROSPECTIVE-LEAGUE-SOURCE-REVIEW.md
status: scoped_independent_review_accepted_full_gate_pending
findings_addressed: 1
source_only: true
operational_authority: false
---

# Same-Plan07 prospective-league source-review fix

The incremental review's legacy pilot/v3 lifetime-extension blocker is repaired at the shared supervisor boundaries. This is author-produced fix evidence, not independent acceptance, a completed full-phase gate, or new live permission. No new numbered plan was created.

Later root follow-up: sourceaccb76c5 is independently accepted in
265-PROSPECTIVE-LEAGUE-REREVIEW.md with zero scoped actionable findings. Root's
separate frozen-source focused run passes98/98in30.00seconds. The author evidence
and additional strict-test limitation below are preserved; the complete phase
gate is still pending and no empirical authority is granted.

## Repair

Both pure lifetime-admission helpers and both genuine factory/planner constructors reject presence of `pilotLifetimeGrant`, `pilotLifetimeMs`, `oneCellLifetimeGrant`, or `oneCellLifetimeMs` as their first operation. The finite failure codes are `FACTORY_RUNTIME_RETIRED_DIAGNOSTIC_LIFETIME` and `LAB_RUNTIME_RETIRED_DIAGNOSTIC_LIFETIME`.

The guard checks property presence, not token truthiness: undefined, null, inherited, accessor, fabricated, genuinely issued, and reused tokens cannot restore live authority. It does not read token getters, source/admission/revision, observer/lifetime getters, or invoke an injected factory constructor, planner transport, stream factory, or runtime/session operation. Consequently factory callback injection and direct planner entry both fail before construction, regardless of the old grant's start/precharge state.

Runtime value imports and branches for the retired `requireDiagnosticPilotLifetimeGrant` and `requireDiagnosticOneCellLifetimeGrant` helpers were removed. Historical types remain available for data/source compatibility. The old grant issuers, schemas, readers, files, results, commits, and closures were not changed. This retires their new-operation supervisor extension rather than repairing or reopening a consumed route.

Ordinary league defaults remain 120000 ms. Current v4 preserves its genuine private, candidate/runtime-bound, ordered single-use 240000 ms construction path. Existing benchmark lifetime/observer behavior, Match and per-invocation deadlines, sandbox limits, and cleanup semantics remain unchanged. No v4 closure was refreshed: its completed terminal remains historical and bound to its recorded source epoch.

## Focused regressions

- Genuinely issued old v3 precharge grants are denied on repeated calls, including factory callback bypass attempts; callbacks are not called.
- All four retired option names are denied by both pure and genuine boundaries, including undefined/null/raw values, inherited options, and accessor properties. Instrumented source/revision/lifetime/token getters and constructor/transport/observer paths are not entered.
- Ordinary default lifetime and construction assertions remain positive, with no retired lifetime forwarding.
- Explicit benchmark lifetime admission and existing after-120-second/expiry tests remain positive.
- A new source-only v4 fixture uses the real private issuer, real revision/admission and factory wrapper, and an exclusively module-mocked planner implementation. It claims both real lifetime layers, denies repeated-seat construction, and closes cleanly. No guest, Docker, real assessment, or empirical provider operation occurs.
- Existing v4 bridge/codec/worker regressions, including genuine inert canonical effect/resume and producer/reader mutation checks, still pass.

## Actual verification

The final focused command:

```sh
pnpm exec vitest run --maxWorkers=1 scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts scripts/lib/v1-38-diagnostic-retry-v4.test.ts scripts/lib/v1-38-diagnostic-retry-v4-bridge.test.ts scripts/run-v1-38-diagnostic-retry-v4.test.ts
```

Exit 0: **98/98 tests, 5/5 suites, 30.14 seconds**. The earlier focused run also passed 98/98 in 29.37 seconds; its subsequently corrected missing-`matchId` test-fixture annotation did not change runtime behavior.

Package types:

```sh
pnpm exec tsc --noEmit -p packages/strategy-lab/tsconfig.json
```

Exit 0, zero diagnostics.

Strict affected production supervisors:

```sh
pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.ts
```

Exit 0, zero diagnostics.

The exact existing Phase265 affected-script type gate from `265-VALIDATION.md`:

```sh
./node_modules/.bin/tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/run-v1-38-serious-league.ts scripts/run-v1-38-serious-league.test.ts scripts/lib/v1-38-league-authoring.ts scripts/lib/v1-38-league-authoring.test.ts scripts/lib/v1-38-league-response-runtime.ts scripts/lib/v1-38-league-response-runtime.test.ts scripts/assess-v1-38-factory-independence.ts scripts/assess-v1-38-factory-independence.test.ts scripts/v1-38-factory-execution-evidence.ts scripts/v1-38-factory-execution-evidence.test.ts scripts/v1-38-factory-assessment-correction.ts scripts/v1-38-factory-assessment-correction.test.ts scripts/check-v1-38-serious-league-boundaries.ts scripts/check-v1-38-serious-league-boundaries.test.ts
```

Exit 0: **zero diagnostics, zero diagnostic files**.

Boundary checks:

- `pnpm exec tsx scripts/check-v1-38-serious-league-boundaries.ts` — exit 0, zero violations across 1353 files.
- `pnpm exec tsx scripts/check-v1-38-lab-boundaries.ts` — exit 0, zero violations across 1353 files.
- `pnpm exec tsx scripts/check-v1-38-factory-boundaries.ts` — exit 0, zero violations across 1353 files.
- `pnpm exec tsx scripts/check-service-boundary-imports.ts` — exit 0, zero strict/ownership offenses, 19 pre-existing report-only offenses.
- `git diff --check` — exit 0.

### Additional strict-test check limitation

An extra check outside the existing phase type gate was attempted:

```sh
pnpm exec tsc --ignoreConfig --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --strict --types node --skipLibCheck scripts/lib/v1-38-factory-supervised-runtime.ts scripts/lib/v1-38-factory-supervised-runtime.test.ts scripts/lib/v1-38-planner-supervised-runtime.ts scripts/lib/v1-38-planner-supervised-runtime.test.ts
```

It exited 2. Diagnostic families were TS2345/TS2322/TS2820: old explicit supervisor test fixtures omit required `matchId`/planner methods or intentionally supply invalid ABI/widened adapter values; transitive `packages/strategy-lab/src/feasibility-protocol.ts` and `packages/strategy-lab/src/planner/missions.ts` also have strict source-type issues under this expanded check. One newly added negative fixture's missing `matchId` was corrected. The extra check is not claimed to pass; no out-of-scope package source or gate settings were changed. The authoritative existing strict-script gate and strict production-supervisor check separately passed as recorded above.

## Scope and handoff

Only the four owned supervisor source/test files and this new fix report were edited. Other concurrent planning changes belong to root and were preserved. No historical private-store reads/mutations, live preflight, Docker/model/Strategy/Match dispatch, operational allocation, closure/review issuance, commit, or new permission occurred.

The previously launched 29-suite gate was cleanly interrupted at root's request before this repair, with exit 130, no completed suite counts, and no downstream build/type/boundary execution. It is not a pass or failure result. It was not rerun during this repair.

All four files and this report are released to root for freeze, independent incremental re-review, and the later exact combined gate. Source-only focused results do not satisfy the pending empirical league requirements or promote Nyquist compliance.
