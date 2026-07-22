---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
plan: "21"
subsystem: browser-replay-proof
tags: [playwright, chronicle, semantic-receipt, privacy, responsive-replay]

requires:
  - phase: 257-20
    provides: One current transition authority, v1.16 semantic service receipt, deterministic current audit result, and closed privacy/boundary guards
provides:
  - One service-contract-backed test fixture whose result, metadata, evidence, and replay all project the committed canonical v1.16 Chronicle
  - Desktop, tablet, and mobile proof of a full 16-Soldier start, bounded nonblank board, complete 31-event timeline, unique terminal event, and Draw agreement
  - Recursive public API privacy checks and document-response checks for private source, artifact, memory, objective, diagnostic, host, and security evidence
  - Compatibility guards that resolve the retired replay test URL to canonical output without reintroducing a second Chronicle identity
affects: [257-22, 261, replay, public-matchsets, privacy-monitors]

tech-stack:
  added: []
  patterns:
    - Committed service receipt as the sole deterministic browser-fixture source
    - Input-only legacy route alias with canonical response identity
    - Cold-start browser interactions prove the resulting state under a bounded retry

key-files:
  created:
    - apps/web/e2e/v1-37-rules-integrity-proof.spec.ts
  modified:
    - packages/spec/src/match-execution-contract.ts
    - packages/spec/src/match-execution-contract.test.ts
    - apps/web/lib/match-execution-fixture-adapter.ts
    - apps/web/lib/match-execution-fixture-adapter.test.ts
    - apps/web/app/matches/server.test.ts
    - apps/web/app/api/test-support/run-worker-once/route.test.ts
    - scripts/evaluate-v1-29-replay-result-trust.ts

key-decisions:
  - "The committed v1.16 runtime-execution service response is the sole source for the public-safe replay fixture; the fixture is explicitly test-only and never claims live Go, runtime-service, Postgres, or Redis topology proof."
  - "The retired match:fixture:public-safe-replay URL is accepted only as an input alias; every returned DTO retains canonical match:runtime-service:golden identity and the same Chronicle hash, arena, outcome, events, and snapshots."
  - "API JSON receives the canonical recursive leak checker; HTML/document responses receive exact forbidden-marker and private-canary scans, while static JavaScript and CSS bundles are outside public-output scope."
  - "No UI behavior or styling changed; Phase 261 retains ownership of live service-backed execution and persistence proof."

patterns-established:
  - "Single-receipt UI proof: result, metadata, evidence, canvas, timeline, and terminal state must agree on one immutable service-contract receipt."
  - "Browser realism proof: assert semantic proof nodes, in-bounds geometry, both-half pixel ink, viewport containment, terminal uniqueness, responsive screenshots, and privacy together."

requirements-completed: [KERN-03, KERN-10, KERN-11]

coverage:
  - id: D1
    description: "One canonical service-contract fixture drives consistent public result, API, replay, and terminal evidence without exposing private runtime material."
    requirement: KERN-10
    verification:
      - kind: unit
        ref: "pnpm --filter @cowards/spec test (5 files, 73 tests)"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/web test (38 files, 209 tests)"
        status: pass
      - kind: e2e
        ref: "CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3126 pnpm exec playwright test --config=playwright.config.ts apps/web/e2e/v1-37-rules-integrity-proof.spec.ts --workers=1 (desktop/tablet/mobile, 3 passed)"
        status: pass
      - kind: other
        ref: "pnpm public-discovery:check && pnpm v1.37:integrity-boundaries:check && pnpm boundary:imports && pnpm match-execution:trust:check"
        status: pass
    human_judgment: false
  - id: D2
    description: "The canonical replay looks plausible and remains readable and unclipped at start and terminal states across desktop, tablet, and mobile."
    requirement: KERN-03
    verification:
      - kind: automated_ui
        ref: "apps/web/e2e/v1-37-rules-integrity-proof.spec.ts#result, APIs, and replay share one realistic public-safe terminal receipt"
        status: pass
      - kind: manual_procedural
        ref: "test-results/v1-37-rules-integrity-proo-67aaa-ublic-safe-terminal-receipt-{desktop,tablet,mobile}/{result,replay-start,replay-terminal}-*.png"
        status: pass
    human_judgment: true
    rationale: "Automated geometry and pixel checks prove bounds and nonblank rendering, but final visual plausibility and information hierarchy still require screenshot judgment."

duration: 23min
completed: 2026-07-13
status: complete
---

# Phase 257 Plan 21: Canonical Replay Realism and Privacy Summary

**A committed v1.16 semantic receipt now drives one realistic, responsive, privacy-safe result/replay fixture without being mislabeled as live service execution.**

## Performance

- **Duration:** 23 min
- **Started:** 2026-07-13T20:02:59-04:00
- **Completed:** 2026-07-13T20:25:42-04:00
- **Tasks:** 1 TDD task
- **Files modified:** 8 implementation/test/monitor files

## Accomplishments

- Replaced the hand-built 2-Soldier, 5×5, four-event replay bypass with public DTO projections of the committed v1.16 service response: 16 starting Soldiers, authoritative `arena-empty-12x12`, 31 canonical events, 12 snapshots, one final `MATCH_ENDED`, and a Draw.
- Proved the real result page, result API, metadata API, Replay link, replay page, full timeline, board proof nodes, terminal state, and screenshots across desktop, tablet, and mobile from one Match ID and Chronicle hash.
- Recursively scanned public JSON and HTML/document responses for canonical private fields and exact private receipt canaries without scanning implementation bundles or confusing truthful exclusion prose with a disclosure.
- Preserved old test navigation as an input-only alias while keeping every response on the golden Match identity; updated the existing replay-trust monitor so it cannot silently lose the canonical fixture.
- Confirmed the empty terminal board is intentional canonical state, not a privacy mask or rendering failure: all 16 Soldiers are `FALLEN`, the board is contracted, Outcome/Draw agree, and the side panels remain normally rendered.

## Task Commits

1. **Add failing canonical replay contract proof** — `39bcaa2` (test)
2. **Prove canonical replay realism and privacy** — `e5c123f` (feat)

## Verification

- `pnpm --filter @cowards/web test`: 38 files / 209 tests passed.
- `pnpm --filter @cowards/spec test`: 5 files / 73 tests passed.
- Web and spec TypeScript checks and ESLint passed.
- Fresh-server Playwright proof passed desktop, tablet, and mobile: 3/3 in 44.9 seconds, one worker, no server reuse.
- Public-discovery, v1.37 integrity-boundary, service-import boundary, and v1.29 replay/result trust checks passed; service imports remain zero strict offenses with 19 known report-only findings.
- Start/terminal/result screenshots were inspected at original resolution. The 12×12 full-start board, empty contracted terminal board, evidence columns, and mobile stacking are visually coherent and unclipped.
- `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` retained their exact starting file and diff hashes and were never staged.

## Decisions Made

- Service-contract-backed means the browser consumes schema-admitted committed service evidence. It does not mean a live runtime-service, Go backend, database, queue, or persistence topology ran during Playwright.
- The old replay path is compatibility input, not a second fixture identity. Returning old IDs or regenerating a parallel Chronicle would recreate the drift this phase removes.
- The canonical golden arena has no terrain. Terrain proof is therefore an asserted zero count, while Soldier, bounds, canvas ink, contraction, event, and terminal proofs remain substantive.
- The event list is semantically grouped rather than DOM-sorted by sequence. The proof checks the exact set `0..30` and the unique canonical terminal event instead of treating visual group order as execution order.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Correctness] Existing tests and replay trust monitor referenced the retired fixture identity**

- **Found during:** Full web and boundary verification.
- **Issue:** Direct historical test URLs and the v1.29 replay evaluator still expected `match:fixture:public-safe-replay`, its four events, and two Soldiers; removing the bypass would make those checks disappear or fail for the wrong reason.
- **Fix:** Added an input-only adapter alias, updated the server expectation to canonical identity/counts, and made the trust monitor select `match:runtime-service:golden` directly.
- **Files modified:** `apps/web/lib/match-execution-fixture-adapter.ts`, `apps/web/app/matches/server.test.ts`, `scripts/evaluate-v1-29-replay-result-trust.ts`
- **Verification:** Full web tests and `pnpm match-execution:trust:check` passed.
- **Committed in:** `e5c123f`

**2. [Rule 3 - Blocking] A retired-route test depended on repository-root cwd**

- **Found during:** Required full web unit gate.
- **Issue:** The test doubled `apps/web` when invoked through `pnpm --filter @cowards/web test`, producing an ENOENT before its assertions ran.
- **Fix:** Resolved the neighboring source through `import.meta.url` and `fileURLToPath`, independent of caller cwd.
- **Files modified:** `apps/web/app/api/test-support/run-worker-once/route.test.ts`
- **Verification:** Full web test suite passed from the package-filter command.
- **Committed in:** `e5c123f`

**3. [Rule 3 - Blocking] Cold Next.js hydration could drop the first timeline click**

- **Found during:** Final fresh-server Playwright rerun.
- **Issue:** The server-rendered button was visible before React attached its handler; all three cold projects correctly failed because the board stayed at sequence 0.
- **Fix:** Bounded the idempotent exact terminal selection to 10 seconds and required each attempt to produce the exact sequence-30/MATCH_ENDED board state within one second before any terminal assertion proceeds.
- **Files modified:** `apps/web/e2e/v1-37-rules-integrity-proof.spec.ts`
- **Verification:** A fresh no-reuse server passed all three projects; subsequent Draw, zero-Soldier, canvas, screenshot, and privacy checks also passed.
- **Committed in:** `e5c123f`

---

**Total deviations:** 3 auto-fixed (2 correctness/compatibility guards, 1 blocking test reliability fix)
**Impact on plan:** All changes strengthen the intended deterministic proof. No gameplay, production topology, public UI behavior, styling, counted authority, or historical Chronicle bytes changed.

## Issues Encountered

- A first document-response privacy scan rejected the page's truthful statement that stack traces are excluded. API JSON still uses the canonical recursive checker; document scanning now rejects exact private canaries without treating an exclusion statement as a leak.
- The terminal screenshot looked dark when downscaled in one viewer. Original-resolution inspection confirmed ordinary white/gray side panels and an intentionally empty contracted canvas, with no screenshot masks or hidden regions.
- The replay intelligence sidebar summarizes whole-Match Soldier outcomes while the selected-event Inspector is point-in-time. This existing behavior was not changed because Plan 21 explicitly forbids UI semantics/styling work; the selected board, current-position panel, event inspector, Outcome, and terminal evidence agree.

## User Setup Required

None. No live service, database, queue, runtime authority publication, or production receipt is required or implied.

## Next Phase Readiness

- Plan 22 can bind this browser proof into the deterministic Phase-257 evaluator and serialized default boundary chain.
- Phase 261 still owns real service-backed execution, Chronicle persistence/reconstruction, replay, fairness, persistence, and rollback proof.
- No Plan-21 blocker or gameplay compatibility question remains.

---
*Phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity*
*Completed: 2026-07-13*
