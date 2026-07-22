---
phase: 261-integrated-service-proof-drift-guards-and-release
plan: "05"
subsystem: browser-boundary-proof
tags: [playwright, privacy, replay, restricted-evidence, proof-limitation]

requires:
  - phase: 261-03
    provides: Current real four-language service receipt and restricted proof-data handoff
  - phase: 261-01
    provides: Restricted evidence store and safe opaque references
provides:
  - Desktop/mobile live-web network, document, replay, and board-realism receipt
  - Explicit separation between real backend execution evidence and fixture-backed browser evidence
  - Read-only repeated browser receipt verification
affects: [261-06, 261-07, release-boundaries, milestone-audit]

key-files:
  created:
    - apps/web/e2e/v1-37-integrated-service-proof.spec.ts
  modified:
    - scripts/run-v1-37-browser-proof.ts
    - scripts/run-v1-37-browser-proof.test.ts
    - playwright.config.ts
    - package.json

key-decisions:
  - "The browser receipt is service-receipt-bound but explicitly records liveBackendData=false; current v1.19 execution remains owned by the separate real runtime-service receipt."
  - "Production Go remains on its historical v1.17 execution contract and fails closed instead of impersonating v1.19."
  - "The browser collector owns a fresh Next.js server and two Playwright projects; immutable service-contract fixtures are complementary rendering evidence, not a substitute for backend execution evidence."
  - "Safe output exposes only stable claims and an opaque restricted ref; response bodies, documents, identifiers, and diagnostics stay restricted."

requirements-completed: [PROOF-05]

coverage:
  - id: D1
    description: Desktop/mobile live-web network and document privacy scans
    requirement: PROOF-05
    verification:
      - kind: e2e
        ref: apps/web/e2e/v1-37-integrated-service-proof.spec.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Canonical 16-Soldier start, nonblank contained board, and terminal MATCH_ENDED rendering
    requirement: PROOF-05
    verification:
      - kind: e2e
        ref: apps/web/e2e/v1-37-rules-integrity-proof.spec.ts and dedicated receipt spec
        status: pass
    human_judgment: false
  - id: D3
    description: Current real-service handoff binding without live-backend browser overclaim
    requirement: PROOF-05
    verification:
      - kind: integration
        ref: browser-proof write/check/check plus integrated-service-proof check
        status: pass
    human_judgment: false

duration: resumed-multi-session
completed: 2026-07-22
status: complete
---

# Phase 261 Plan 05: Browser and Public-Boundary Proof Summary

**Desktop/mobile live-web proof now binds truthful fixture-backed rendering evidence to the current real four-language service receipt without claiming that production Go executes v1.19.**

## Accomplishments

- Ran four serial Playwright cases on an owned Next.js server: the dedicated desktop/mobile receipt spec and the retained desktop/mobile rules-integrity fixture proof.
- Scanned tracked response bodies before reduction plus rendered body/document output, then joined MatchSet, replay metadata, Chronicle hash, arena identity, terminal lifecycle, and replay links.
- Verified a plausible 16-Soldier canonical start, a nonblank contained canvas, timeline continuity, and terminal `MATCH_ENDED` rendering on desktop and mobile.
- Stored raw observations in restricted evidence and emitted only `browserProofReceiptRef`; two consecutive read-only checks returned the same ref.
- Rechecked the bound real service receipt: four languages, twelve fresh runs, twenty-three scenarios, and zero counted lanes because containment remains proof-local/non-production.

## Task Commits

1. **Restricted browser receipt contract** — `a6bd1c67`
2. **Truthful live-web fixture complement and public-boundary proof** — `0ce34a4a`
3. **Hidden runtime/toolchain dependency repair used by the bound lower receipt** — `84629d8d`

## Deviations from Plan

### Corrected an impossible topology claim

- **Finding:** The original Plan-05 wording assumed one live public dataset could be created and executed through current v1.19 runtime-service plus selected production Go.
- **Evidence:** The owned Go process failed closed at authority admission. Inspection confirmed this was intentional: runtime-service owns current v1.19 execution evidence, while production Go still selects the historical v1.17 execution contract.
- **Correction:** Kept current live execution in the real four-language service receipt and made browser evidence an explicitly fixture-backed live-web complement (`liveBackendData: false`, `serviceReceiptBound: true`).
- **Why no approval was required:** No Match state, Action legality, event order, outcome, Strategy observation, public contract, or production owner changed. The correction removes an evidence overclaim and preserves the approved fail-closed boundary.

### Hardened lower proof dependencies

- Replaced hidden `/private/tmp` signer and Wasmtime assumptions with fresh proof-local signer material and a hash-pinned Linux Wasmtime staging helper.
- Preserved empty production/global containment trust; proof-local containment remains attested but non-counted.
- Propagated only stable safe diagnostic codes and refreshed the exact lower receipts.

## Verification

- Focused browser receipt tests: pass.
- Workspace typecheck: 27/27 tasks pass.
- Browser writer: pass, desktop and mobile.
- Browser checker: pass twice without writes.
- Integrated service checker: `passed-functional-containment-attested-non-counted`, 4 lanes / 12 runs / 23 scenarios / 0 counted.
- Proof-owned database residue: zero Seasons.
- Protected baseline: `sha256:c0e1c2a6319f01377df74a2d6e5c493d26382f2882c059116c5ba467e5e81707`.

## Next Phase Readiness

Plan 06 can aggregate three distinct truthful inputs: real service execution, real rollback/history evidence, and fixture-backed live-web rendering/privacy evidence. Its evaluator must preserve that distinction and reject any claim that the browser used live backend data.

## Self-Check: PASSED

All implementation files and commits exist, the safe receipt is current, no collector-owned process or proof Season remains, protected user files are untouched, and the evidence limitation is explicit.

