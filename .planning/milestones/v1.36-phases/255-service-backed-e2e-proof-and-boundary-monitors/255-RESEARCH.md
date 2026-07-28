# Phase 255 Research: Service-Backed E2E Proof and Boundary Monitors

## Scope and Exit Rule

Phase 255 is a proof and defect-fix phase. It must connect the contracts delivered by Phases 250-254 through the real ownership topology without adding competition behavior, changing deterministic game rules, moving Strategy execution, or broadening public evidence.

The phase has three proof layers:

1. A live signed-in service path proves counted entry, scheduling, execution, result, standings, replay, and the full eligibility rejection matrix.
2. A live governance path plus serialized scans proves exclusion/restoration, public-safe explanations, privacy, and ownership boundaries.
3. Browser and Chronicle checks prove result/replay realism at desktop and mobile widths, then a final evaluator rolls the evidence into Phase verification and milestone audit artifacts.

The milestone may be marked passed only when strict service-backed proof passes. A developer without the local database/service topology may record a bounded `not-run-environment-unavailable` result so deterministic work can continue, but that result must remain an explicit milestone gap and must fail strict closeout.

## Existing Evidence to Reuse

### Phase 250-254 focused coverage

- Phase 250 already unit-tests current provider-proof/language/runtime/provenance/package eligibility categories, one active owner revision per Season, same-user rejection, replacement policy, and exhibition separation.
- Phase 251 already tests monotonic Season transitions, shared Season locking, atomic scheduling, idempotency, insufficient evidence, lifecycle projections, and Chronicle-gated replay links.
- Phase 252 already tests all ten counted states, evidence gating, deterministic standings recomputation, exclusion totals, stable links, mutation-free public reads, and TypeScript/Go parity.
- Phase 253 already tests report/dispute intake, canonical holds, append-only audit behavior, grouped governance actions, complete-evidence restoration, public governance projections, and private-field exclusion.
- Phase 254 is responsible for authoritative trust projections and deterministic responsive UI coverage. Phase 255 should consume those projections and must not duplicate its component/unit matrix.

Phase 255 therefore needs integration assertions at ownership boundaries, not another copy of the pure classifiers.

### Existing service-backed proof harnesses

- `apps/web/e2e/v1-28-operations-recovery-proof.spec.ts` shows the established live Playwright pattern: explicit run flag, signed-in API calls, PostgreSQL setup/cleanup, Go internal calls, public-page checks, privacy markers, and JSON/Markdown proof artifacts.
- `apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts` shows account creation, session-cookie handling, revision save through the selected service path, live runtime execution, result/replay polling, canvas checks, and proof timing/artifact output.
- `apps/web/e2e/workshop-to-replay.spec.ts` is the smaller service-backed edit-to-replay smoke.
- Existing proof specs skip only when their explicit `RUN_*` flag is absent. When the flag is present, missing required environment must fail loudly rather than silently skip.

The v1.36 proof should use the same pattern with `RUN_V1_36_SERVICE_PROOF=1`. It should not embed credentials, DSNs, tokens, raw responses, source, artifacts, or private runtime payloads in proof artifacts.

### Existing database semantics

Go integration tests use `COWARDS_GO_BACKEND_TEST_DATABASE_URL` and call `t.Skip` when it is absent. Playwright service proofs use the application topology and therefore require `DATABASE_URL`, `REDIS_URL`, `COWARDS_GO_BACKEND_URL`, `COWARDS_GO_BACKEND_INTERNAL_TOKEN`, and `COWARDS_RUNTIME_SERVICE_URL`, plus the provider/private-artifact secrets already required by account save and runtime execution.

Phase 255 should preserve both modes:

- Normal local test commands may skip Go DB tests when `COWARDS_GO_BACKEND_TEST_DATABASE_URL` is absent.
- `RUN_V1_36_SERVICE_PROOF=1` means strict live intent. The spec must validate every required environment variable up front and fail if any is absent.
- `COWARDS_V1_36_REQUIRE_SERVICE_PROOF=1` makes proof evaluators reject missing, skipped, unavailable, stale, or non-passed service evidence.
- Without strict mode, an unavailable result is valid only when a fresh artifact records a short public-safe environment limitation. It is never equivalent to passed proof and cannot produce a passed milestone audit.

## Positive Service Path

The live positive scenario should follow current ownership rather than invent a test-only shortcut:

1. Create signed-in proof accounts and current immutable Strategy Revisions through the existing account save route selected for the Go backend.
2. Use a dedicated database prefix and minimal setup only for test administration/lifecycle facts that have no public mutation route, such as granting the proof admin role and opening the created Season.
3. Create the Season through `POST /api/ladder/seasons`.
4. Enter distinct owners through `POST /api/ladder/seasons/:seasonId/entries` and assert accepted snapshots contain current eligibility evidence without private proof material.
5. Schedule through `POST /api/ladder/seasons/:seasonId/schedule` and assert one idempotent schedule run.
6. Let the normal Go orchestration/worker/runtime-service path execute the generated MatchSet; do not call engine or Strategy runtime functions from the proof.
7. Poll the selected Go public MatchSet and ladder reads until complete, then assert canonical `counted`, complete Chronicle coverage, standings contribution, stable result/replay links, and deterministic standings on repeated reads.
8. Open the public result, Season standings, and replay pages and record only public ids, statuses, link paths, timings, hashes, and scenario pass/fail facts.

The proof should use at least two distinct owners. If the scheduler minimum is larger, create the smallest valid entrant set rather than weakening the Season policy.

## Negative Eligibility Matrix

Every required negative should cross the authenticated entry route and assert the stable public eligibility category/status. Test setup may mutate isolated proof rows to construct evidence states that the account-save route correctly refuses to create, but the rejection itself must happen through the production entry boundary.

| Scenario | Integration setup | Required assertion |
|---|---|---|
| stale proof | Age or version the stored proof beyond the locked current threshold | Entry rejects with stale-proof category and no private timestamp/diagnostic |
| missing proof | Remove required provider proof from the isolated revision metadata | Entry rejects missing-proof |
| mismatched proof | Preserve proof but change source/artifact identity | Entry rejects mismatched-proof |
| unsupported provider/language | Store a non-registry provider or unsupported source format | Entry rejects unsupported provider/language |
| hidden TinyGo | Use the spike-only TinyGo identity | Entry rejects and no production UI/API response promotes TinyGo |
| invalid provenance | Mark validation/provenance invalid or incompatible | Entry rejects invalid evidence |
| unavailable runtime lane | Mark the selected lane unavailable | Entry rejects runtime unavailable |
| package-policy violation | Set package mode/declaration outside `none` | Entry rejects package policy |
| same-user counted entry | Enter one revision, then submit another revision owned by the same user | First succeeds; second rejects duplicate owner entry |
| mid-season replacement | Freeze/schedule after accepted entry, then attempt replacement | Replacement rejects and original immutable snapshot remains |

This matrix should assert that rejected attempts create no active entry and do not alter standings/schedule evidence. It should reuse the canonical public category strings rather than matching database constraint names.

## Governance Service Proof

The governance proof must cover the real mixed ownership documented by Phase 253: authenticated report/admin mutations remain direct Next/persistence routes under the explicit temporary baseline, while selected public result/ladder/player reads are Go-backed.

Use isolated complete-evidence MatchSets and prove:

- degraded and explicit non-counted evidence never contribute to standings;
- a general report returns a private receipt but does not automatically suppress standings;
- an entrant dispute creates the canonical hold, moves the public state to disputed/under review, and removes contribution on recompute;
- invalid and invalidated actions remain excluded with fixed public copy;
- counted restoration succeeds only after complete execution/scoring/Chronicle evidence and an audited governance action;
- restoration fails closed for incomplete evidence;
- repeated public reads are mutation-free and byte-stable;
- replay availability remains Chronicle-derived and independent from governance/counting state.

Proof artifacts must record coarse scenario outcomes only. Reporter ids, detail, report counts, dedupe/rate metadata, admin/operator ids, notes, before/after audit payloads, and recovery evidence stay in private storage and out of output.

## Privacy and Boundary Monitor Strategy

Reuse `PUBLIC_OUTPUT_FORBIDDEN_FIELDS`, `PUBLIC_OUTPUT_FORBIDDEN_MARKERS`, `assertPublicOutputLeakSafe`, the governance leak guard, and the existing `boundary:monitors` chain. Add one v1.36 evaluator that serializes the final competition-specific assertions rather than creating a second broad source scanner.

The evaluator should scan:

- captured public API/page payloads before they are reduced to proof metadata;
- public service fixtures and OpenAPI examples;
- Phase 249-255 generated proof JSON/Markdown and copy snapshots;
- competition, result, replay, player, Strategy, fair-play, and recovery page source/copy;
- test artifacts intended for commit, excluding Playwright traces and local credentials.

It must reject Strategy source, artifact bytes, StrategyMemory, SoldierMemory, objective payloads, owner-debug data, raw diagnostics, host/env/package paths, tokens, DSNs/DB details, private runtime fields, report/dispute internals, recovery payloads, and operator-only fields. Public policy sentences such as “Strategy source remains private” need allowlisted semantic handling so marker scans do not reject honest copy merely for naming a protected category.

Extend the existing boundary monitor hub to prove:

- no Strategy execution imports/calls appear in web/API/Go;
- runtime-service / Runtime Broker / provider ownership remains intact;
- no game/scoring/eligibility classifier is implemented in React;
- no Node `vm` security boundary is introduced;
- TinyGo remains hidden/spike-only;
- package mode remains `none` and no rich-package claim appears;
- no production sandbox certification or durable rating/moderation/recovery promise appears;
- public reads remain mutation-free and governance mutations stay in their documented owner.

## Replay and Result Realism

The replay stack already has complementary checks:

- `apps/web/app/matches/replay-ready.ts` rejects invalid bounds, out-of-bounds visible Soldiers/terrain, visible FALLEN Soldiers, missing positions for visible Soldiers, overlaps, and non-canonical starts for canonical arenas.
- `apps/web/app/matches/server.test.ts` pins those fail-closed behaviors.
- `packages/map-configs/src/index.test.ts` proves canonical arena bounds contain canonical starting positions.
- `apps/web/e2e/replay.visual.spec.ts` decodes canvas screenshots and rejects blank, clipped, or one-sided boards at desktop/mobile widths.
- `apps/web/e2e/replay.fixture.spec.ts` proves public replay privacy and interactions.

Phase 255 should connect these to live competition evidence:

1. Open the counted Match and replay produced by Plan 01 at desktop and mobile widths.
2. Fetch the public replay projection and independently assert every visible Soldier, STONE Soldier, and terrain position is inside the state bounds; FALLEN Soldiers have no position; occupied cells do not overlap.
3. Assert the first canonical state has canonical 12x12 bounds and all 16 canonical starting Soldiers.
4. Assert the result page and replay trust strip agree on counted/governance state and canonical links.
5. Assert the canvas is visible, nonblank, inked on both halves, and has no page-level horizontal overflow on both viewports.
6. Reuse deterministic replay scenarios for explicit STONE, FALLEN, terrain, contraction, and callout visibility if the live counted Match does not naturally contain every event. The final artifact must distinguish live-service evidence from deterministic fixture evidence.

No game rules or replay board model should change unless proof exposes a defect. A defect fix must receive focused regression coverage and remain within the relevant plan’s file ceiling.

## Recommended Plan Split

### 255-01: Counted competition service matrix

Add one live signed-in Playwright proof for the positive counted path and all ten required eligibility negatives, plus a small evaluator and public-safe proof artifacts. This plan owns strict/unavailable environment semantics.

### 255-02: Governance, privacy, and ownership proof

Add a second live proof for exclusion/dispute/invalidation/restoration through the current mutation/read owners. Extend competition-specific privacy and ownership monitors and emit a separate governance/boundary artifact.

### 255-03: Browser realism and final audit rollup

Connect the live counted result/replay to desktop/mobile geometry and canvas checks, retain deterministic explicit STONE/FALLEN/terrain scenarios, generate the final v1.36 evidence rollup, verify Phase 255, and write the milestone audit honestly. Strict service evidence is mandatory for a passed audit.

## Exact Command Model

Deterministic checks that always run:

```sh
pnpm exec vitest run scripts/evaluate-v1-36-service-proof.test.ts scripts/evaluate-v1-36-competition-boundaries.test.ts scripts/evaluate-v1-36-final-proof.test.ts scripts/check-boundary-monitors.test.ts
pnpm --filter @cowards/spec typecheck && pnpm --filter @cowards/persistence typecheck && pnpm --filter @cowards/service typecheck && pnpm --filter @cowards/web typecheck
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... -count=1
pnpm v1.36:competition-policy:check && pnpm boundary:monitors
```

Optional Go DB integration in ordinary local runs:

```sh
cd apps/go-backend && COWARDS_GO_BACKEND_TEST_DATABASE_URL="$COWARDS_GO_BACKEND_TEST_DATABASE_URL" PATH=/usr/local/go/bin:$PATH go test ./... -run 'Test.*Competition.*Integration|Test.*MatchSet.*Integration' -count=1
```

That command may skip only when `COWARDS_GO_BACKEND_TEST_DATABASE_URL` is unset. A configured but failing database is a test failure.

Strict live service proof after the local topology is running:

```sh
RUN_V1_36_SERVICE_PROOF=1 PLAYWRIGHT_TEST=1 COWARDS_GO_ACCOUNT_REVISIONS=1 COWARDS_GO_PUBLIC_READS=1 DATABASE_URL="$DATABASE_URL" REDIS_URL="$REDIS_URL" COWARDS_GO_BACKEND_URL="$COWARDS_GO_BACKEND_URL" COWARDS_GO_BACKEND_INTERNAL_TOKEN="$COWARDS_GO_BACKEND_INTERNAL_TOKEN" COWARDS_RUNTIME_SERVICE_URL="$COWARDS_RUNTIME_SERVICE_URL" pnpm exec playwright test --project=desktop --workers=1 v1-36-competition-service-proof.spec.ts v1-36-governance-service-proof.spec.ts
COWARDS_V1_36_REQUIRE_SERVICE_PROOF=1 pnpm v1.36:service-proof:check
```

When `RUN_V1_36_SERVICE_PROOF=1`, the proof must fail immediately if any required environment variable or service health check is missing. It must never convert that condition into a skip.

Browser realism after service proof:

```sh
RUN_V1_36_SERVICE_PROOF=1 PLAYWRIGHT_TEST=1 COWARDS_GO_PUBLIC_READS=1 pnpm exec playwright test --project=desktop --project=mobile --workers=1 v1-36-competition-realism-proof.spec.ts
PLAYWRIGHT_TEST=1 pnpm exec playwright test --project=desktop --project=mobile replay.visual.spec.ts replay.fixture.spec.ts
COWARDS_V1_36_REQUIRE_SERVICE_PROOF=1 pnpm v1.36:final-proof:check
```

If local services are unavailable, record the exact bounded limitation through the evaluator command defined in Plan 01, run every deterministic/browser-fixture check, and leave Phase 255 and the milestone audit non-passed until the strict commands succeed.

## Risks and Mitigations

- **Proof seeds bypass behavior:** Use direct SQL only for isolated setup facts that lack a public route; all acceptance/rejection and governance behavior must cross production HTTP/service boundaries.
- **Fixture evidence is mislabeled service proof:** Keep separate artifact sections and statuses for live-service, DB integration, and deterministic browser fixture evidence.
- **A skipped test looks green:** Explicit run flags plus strict evaluator mode must reject skipped/unavailable evidence at closeout.
- **Proof artifacts leak secrets:** Store ids only when public, hash large payloads, never store source/body/headers/DSNs/tokens, and scan artifacts before write.
- **Async execution flakes:** Poll bounded public states with generous timeouts, record timings, and fail with coarse diagnostics; do not dump private runtime responses.
- **Governance read/write owners are obscured:** Assert the current direct Next mutation and selected Go public-read paths separately, retaining the Phase 253 temporary ownership classification.
- **Replay screenshots pass while geometry is wrong:** Pair canvas pixel checks with direct public replay state invariants and canonical-start assertions.
- **Phase 254 projection gaps remain:** Treat missing authoritative public fields as defects to fix before final browser proof; do not reconstruct them in Playwright or React.

## Planning File Budget

- Plan 255-01: 6 files.
- Plan 255-02: 8 files.
- Plan 255-03: 12 files.

Each plan remains below the 15-file blocker threshold. Generated JSON/Markdown artifacts count as files. Defect fixes discovered during execution should be committed separately and must not silently expand a plan beyond the threshold; split a gap-closure plan if necessary.
