---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "10"
subsystem: typescript-runtime-conformance
tags: [typescript, cgroup-v2, native-supervisor, ed25519, failure-safety]

requires:
  - phase: 259-24
    provides: Additive v1.18 quantitative budget, request, receipt, and capability contract
  - phase: 259-25
    provides: Public supervisor request and nonce/output-bound raw receipt verifier
  - phase: 259-26
    provides: Pinned native Linux cgroup-v2 supervisor and private controller authority
  - phase: 259-31
    provides: Public supervisor dependency and TypeScript project wiring
provides:
  - Sole additive v1.18 TypeScript counted selector using a host-injected native-supervisor launch
  - Exact Node/compiler, adapter, artifact, supervisor, platform, cgroup, and quantitative evidence binding
  - Canonical privacy-safe host-signing input emitted only after raw receipt and guest payload verification
affects: [259-13, four-language-conformance-runner, language-certification]

tech-stack:
  added: []
  patterns:
    - host-injected launch and signing callbacks without public native authority mints
    - raw supervisor receipt verification before semantic payload admission or evidence signing
    - additive counted selector with immutable v1.17 diagnostic paths

key-files:
  created:
    - packages/runtime-js/src/revision-v1-18.ts
    - packages/runtime-js/src/revision-v1-18.test.ts
    - packages/runtime-js/src/supervised-subprocess-adapter.ts
    - packages/runtime-js/src/supervised-subprocess-adapter.test.ts
  modified:
    - packages/runtime-js/src/index.ts

key-decisions:
  - "The counted TypeScript package receives a host-owned supervisor launch seam and verifies the resulting raw receipt itself; it does not export or mint native controller authority."
  - "Only verifier-branded success or positively attributed resource exhaustion reaches the host signer; malformed payload, crash, cancellation ambiguity, identity drift, or receipt failure returns no-mutation system failure with no signed evidence."
  - "Fresh host-observed Node, V8, executable, adapter-module, harness, and artifact identity must match the frozen adapter selection and invocation, and the returned Ed25519 signature must verify against the pinned public key and key ID."
  - "The v1.18 selector is additive and supervised-only; v1.17 subprocess, container, worker, revision, and protocol bytes remain unchanged."

patterns-established:
  - "Adapter order: exact language identity -> branded supervisor request -> host launch -> raw receipt/output verification -> payload schema admission -> capability candidate -> canonical host signature."
  - "Signed language evidence contains hashes, quantitative result, identity pins, and candidate status only; raw receipt, source, memory, objective, diagnostics, paths, launch arguments, and guest claims remain private."

requirements-completed: [CONF-01, CONF-03, CONF-04]

coverage:
  - id: D1
    description: "The TypeScript v1.18 counted selector has no direct, worker, or container-only fallback and executes only through the injected shared supervisor seam."
    requirement: CONF-01
    verification:
      - kind: unit
        ref: "packages/runtime-js/src/supervised-subprocess-adapter.test.ts#exports only the supervised counted selector and no native authority mint"
        status: pass
      - kind: unit
        ref: "packages/runtime-js/src/revision-v1-18.test.ts#defines one additive supervised counted selector"
        status: pass
    human_judgment: false
  - id: D2
    description: "Nonce, request, output, supervisor, platform, cgroup, Node/compiler, adapter, artifact, exact/N+1 resource, descendant, and cancellation evidence fail closed or produce the correct verified result."
    requirement: CONF-03
    verification:
      - kind: unit
        ref: "pnpm exec vitest run packages/runtime-js/src/revision-v1-18.test.ts packages/runtime-js/src/supervised-subprocess-adapter.test.ts packages/runtime-supervisor/src/native-supervisor.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Host signing occurs only after complete verified evidence and the signed bytes exclude private Strategy and host material while prior v1.17 bytes remain immutable."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "packages/runtime-js/src/supervised-subprocess-adapter.test.ts#uses one public native-supervisor request and signs only verified evidence"
        status: pass
      - kind: unit
        ref: "packages/runtime-js/src/revision-v1-18.test.ts#keeps every prior v1.17 execution byte immutable"
        status: pass
    human_judgment: false

duration: 47min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 10: Supervised TypeScript Counted Adapter Summary

**TypeScript now has one additive v1.18 native-supervised execution seam that verifies quantitative evidence and valid payload bytes before producing privacy-safe host-signed certificate input.**

## Performance

- **Duration:** 47 min
- **Started:** 2026-07-16T16:37:00Z
- **Completed:** 2026-07-16T17:11:03Z
- **Tasks:** 1
- **Files modified:** 5

## Accomplishments

- Added a frozen supervised-only TypeScript lane descriptor and exact Node executable/version/V8 compiler identity.
- Added a counted adapter that constructs the branded supervisor request, invokes only the host-owned launch seam, verifies the nonce/request/output-bound raw receipt, and derives the common capability candidate.
- Added canonical host-signed evidence containing only safe hashes, quantitative results, identity pins, and non-promoting candidate status.
- Proved exact and N+1 CPU/wall/memory/pids handling, descendant accounting, replay and substitution rejection, cancellation/crash/malformed receipt failure safety, guest payload admission, privacy, public boundaries, and immutable v1.17 execution bytes.

## Task Commits

1. **Task 1 RED: Require supervised TypeScript counted execution** — `9109700`
2. **Task 1 GREEN: Add the supervised TypeScript counted adapter** — `efe5fc7`
3. **Review fix: Reject malformed supervised payloads before signing** — `cba0794`
4. **Review fix: Bind fresh launch-time TypeScript identity** — `638c511`
5. **Review fix: Cryptographically verify host evidence signatures** — `4d923e5`

## Files Created/Modified

- `packages/runtime-js/src/revision-v1-18.ts` — Frozen counted-lane descriptor and Node/compiler identity hash.
- `packages/runtime-js/src/revision-v1-18.test.ts` — Additive selector, identity mutation, and immutable-v1.17 guards.
- `packages/runtime-js/src/supervised-subprocess-adapter.ts` — Host-injected native-supervisor execution, verification, payload admission, capability, and signing.
- `packages/runtime-js/src/supervised-subprocess-adapter.test.ts` — Meter, identity, replay, cancellation, privacy, signing, and failure matrix.
- `packages/runtime-js/src/index.ts` — Public additive supervised APIs only.

## Decisions Made

- Kept the native hardened-controller mint and native runner out of `@cowards/runtime-js`; the adapter can only call an injected host launch and independently verify its returned receipt.
- Used the existing v1.17 success payload schemas because v1.18 is a quantitative additive ABI, not a gameplay/output-schema rewrite.
- Returned a non-promoting capability candidate. The adapter cannot make itself counted; later complete corpus evidence and managed certificate authority retain that responsibility.
- Captured immutable expected execution/identity values at adapter construction, then required the host launch to return fresh matching observations and verified the signature with the pinned Ed25519 public key before returning evidence.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added guest payload admission before evidence signing**

- **Found during:** Post-implementation self-review
- **Issue:** A valid process/receipt with malformed or schema-invalid guest bytes could otherwise receive signed quantitative evidence.
- **Fix:** Added canonical strategy-payload admission and exact method-result schema validation before signing any successful invocation. Malformed payload now returns `GUEST_PAYLOAD_INVALID`, no mutation, and no signature.
- **Files modified:** `packages/runtime-js/src/supervised-subprocess-adapter.ts`, `packages/runtime-js/src/supervised-subprocess-adapter.test.ts`
- **Verification:** Focused malformed/schema-invalid payload test plus the full 29-test TypeScript/supervisor suite passed.
- **Committed in:** `cba0794`

**2. [Rule 2 - Missing Critical] Replaced declaration-only language identity with fresh host observations**

- **Found during:** Cross-lane self-review
- **Issue:** Matching request and constructor fields alone did not prove that the launch-time Node executable, versions, harness, adapter, and Strategy artifact remained the selected bytes.
- **Fix:** The host launch now returns the fresh language identity observation; the adapter compares it with an immutable constructor snapshot and the invocation. The fixed execution descriptor is cloned at construction and must be the exact Node `--input-type=module --eval` harness whose bytes are identity-bound.
- **Files modified:** `packages/runtime-js/src/revision-v1-18.ts`, `packages/runtime-js/src/revision-v1-18.test.ts`, `packages/runtime-js/src/supervised-subprocess-adapter.ts`, `packages/runtime-js/src/supervised-subprocess-adapter.test.ts`, `packages/runtime-js/src/index.ts`
- **Verification:** Launch-time harness substitution, prelaunch identity drift, exact execution, and public-boundary tests passed.
- **Committed in:** `638c511`

**3. [Rule 2 - Missing Critical] Verified the signer output instead of trusting signature shape**

- **Found during:** Final trust-boundary review
- **Issue:** A canonical Base64 string labeled Ed25519 did not prove the host signer possessed the trusted private key.
- **Fix:** The adapter now parses a pinned Ed25519 public key, requires the exact expected key ID, and verifies the signature over the exact canonical evidence bytes. Valid signatures over different bytes and malformed signatures fail without evidence.
- **Files modified:** `packages/runtime-js/src/supervised-subprocess-adapter.ts`, `packages/runtime-js/src/supervised-subprocess-adapter.test.ts`
- **Verification:** Real generated Ed25519 positive signature plus malformed and wrong-message signature regressions passed.
- **Committed in:** `4d923e5`

---

**Total deviations:** 3 auto-fixed missing critical trust-boundary validations.
**Impact on plan:** Strengthened payload, identity, and signer authority without changing gameplay, dependencies, public output, or prior ABI behavior.

## Issues Encountered

- The isolated worktree had no dependency links. `pnpm install --frozen-lockfile --offline` materialized the committed graph with zero downloads and no lockfile change.
- Package typecheck initially required building referenced composite projects in the clean worktree. After the normal project build, the exact package typecheck passed.

## User Setup Required

None - no external service configuration required.

## Verification

- Final joined adapter/supervisor suite: 6 files / 64 tests passed, including all Plan-10 focused tests.
- `pnpm --filter @cowards/runtime-js typecheck` passed.
- `pnpm --filter @cowards/runtime-js lint` passed.
- Focused Prettier and `git diff --check` passed.
- No runtime-js package manifest, lockfile, v1.17 implementation, protected file, global planning ledger, or production activation file changed.

## Next Phase Readiness

- Plan 259-13 can inject the real host launcher and signer, execute every TypeScript corpus case, parse the private returned payload bytes, and retain only the signed quantitative roots.
- Counted promotion remains blocked until the complete three-run certificate and managed authority pipeline pass.

## Self-Check: PASSED

- All five declared Plan-10 files exist and the RED commit precedes GREEN.
- Focused tests, typecheck, lint, formatting, privacy, public-boundary, and immutable-prior guards pass.
- No public native controller authority mint or unsupervised fallback was introduced.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Plan: 10*
*Completed: 2026-07-16*
