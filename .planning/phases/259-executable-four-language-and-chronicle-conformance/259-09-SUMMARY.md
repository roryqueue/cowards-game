---
phase: 259-executable-four-language-and-chronicle-conformance
plan: "09"
subsystem: runtime-conformance-authority
tags: [runtime-evidence, conformance-certificate, authority, ed25519, fail-closed]

requires:
  - phase: 259-07
    provides: branded three-run per-lane conformance certificate
  - phase: 259-24
    provides: additive v1.18 budget, supervisor identity, and common-meter contract
  - phase: 258-13
    provides: exact runtime evidence DAG and artifact identity closure
provides:
  - branded join between one verified conformance certificate and the existing signed evidence DAG
  - exact additive v1.18 supervisor, Docker, cgroup, ABI, budget, and three-run receipt source binding
  - conformance-only source references hashed into the existing signed v1.17 authority certificate record
affects: [259-22, runtime-evidence-authority-publisher, counted-eligibility, runtime-service-admission]

tech-stack:
  added: []
  patterns:
    - graph-committed source plus certificate-signed graph root avoids cyclic self-hashes
    - verifier-branded evidence bindings are the only source of executable authority references
    - conditional additive authority records preserve immutable containment record bytes

key-files:
  created: []
  modified:
    - packages/spec/src/runtime-evidence-v1-17.ts
    - packages/spec/src/runtime-evidence-attestation-v1-17.ts
    - packages/spec/src/runtime-evidence-attestation-v1-17.test.ts
    - packages/spec/src/runtime-evidence-authority-bundle.ts
    - packages/spec/src/runtime-evidence-authority-bundle.test.ts

key-decisions:
  - "The existing evidenceBundle graph node commits the additive supervisor and run-receipt source; the certificate signs that graph root, avoiding a certificate-to-graph self-reference."
  - "Production evidence and conformance trusted-producer registries remain empty; fixture trust cannot satisfy production verification."
  - "Only runtime-conformance-certificate-v1.17 records require the new exact conformance source, preserving prior containment and legacy record compatibility."

patterns-established:
  - "Authority source derivation accepts only a WeakSet-branded current conformance binding; a cloned or caller-shaped object cannot promote."
  - "Certificate record identity includes exact certificate, attestation, binding, corpus, inventory, ABI, budget, supervisor, result, evidence, and three-run receipt roots."

requirements-completed: [CONF-04, CONF-05]

coverage:
  - id: D1
    description: "A verified certificate is inseparable from the exact Phase-258 evidence DAG and additive v1.18 supervisor/run source."
    requirement: CONF-04
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-attestation-v1-17.test.ts#joins one verified certificate to the exact evidence DAG and additive supervisor source"
        status: pass
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-attestation-v1-17.test.ts#rejects runtime ABI, budget, supervisor, Docker, cgroup, and receipt substitutions"
        status: pass
    human_judgment: false
  - id: D2
    description: "The existing signed authority payload carries only exact current conformance references and keeps production promotion unavailable."
    requirement: CONF-05
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-evidence-authority-bundle.test.ts#signs the exact conformance source without trusting caller-shaped request status"
        status: pass
      - kind: integration
        ref: "pnpm --filter @cowards/spec test"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-07-16
status: complete
---

# Phase 259 Plan 09: Exact Conformance Evidence Authority Summary

**Three-run conformance proof now joins the exact evidence DAG and additive Linux supervisor source, then enters the existing signed authority only as a verifier-derived reference while production trust stays empty.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-07-16T14:11:29Z
- **Completed:** 2026-07-16T14:24:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added a canonical conformance evidence source committed through the existing `evidenceBundle` graph node, containing the v1.18 ABI envelope, additive budget root, exact supervisor/Docker/Linux/cgroup identities, and three distinct run-receipt roots.
- Added a branded verifier that joins only current verified evidence and certificate snapshots, checks every graph node/pin and certificate identity field, enforces shared generation/trust/freshness, and rejects cloned snapshots.
- Added a compact authority source derived only from that branded binding, with exact certificate, attestation, binding, corpus, inventory, DAG, supervisor, result, evidence, and receipt roots.
- Extended the existing v1.17 certificate record hash and signed payload parser for the exact Phase-259 conformance certificate version without adding a registry or changing legacy containment records.
- Kept both production trusted-producer registries exactly empty; documentation, gate names, fixture trust, and request-shaped status remain non-promoting.

## Task Commits

1. **Task 1 RED: Exact certificate-to-DAG and supervisor binding** — `516ed6d` (test)
2. **Task 1 GREEN: Branded conformance evidence binding** — `7409642` (feat)
3. **Task 2 RED: Exact signed conformance authority reference** — `0df02aa` (test)
4. **Task 2 GREEN: Verifier-derived authority source and record hash** — `3110e81` (feat)

## Files Created/Modified

- `packages/spec/src/runtime-evidence-v1-17.ts` — Canonical additive conformance source and complete verified binding contracts.
- `packages/spec/src/runtime-evidence-attestation-v1-17.ts` — Exact certificate/DAG join, freshness checks, branding, and authority-source eligibility.
- `packages/spec/src/runtime-evidence-attestation-v1-17.test.ts` — Full identity substitution, empty-production-trust, and anti-clone proof.
- `packages/spec/src/runtime-evidence-authority-bundle.ts` — Branded conformance source derivation, strict parser, certificate-record hashing, and signed payload integration.
- `packages/spec/src/runtime-evidence-authority-bundle.test.ts` — Every-root mutation, missing-source, stale generation, graph drift, freshness, and signed-envelope proof.

## Decisions Made

- Avoided a cryptographic cycle by signing the graph root in the certificate while the graph's evidence-bundle node commits the supervisor/run source. The later binding joins the two branded snapshots.
- Preserved the exact 15-node/26-edge v1.17 graph rather than adding a parallel certificate registry or shallow `passedLanguages` field.
- Made the new authority source mandatory only for the exact Phase-259 conformance certificate version. Existing containment and older reference records remain byte-compatible and non-executable as Phase-259 proof.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added verifier branding to authority-source derivation**

- **Found during:** Task 2 source-reference design
- **Issue:** A structurally valid clone of the complete binding could otherwise be supplied by a caller when constructing an authority source.
- **Fix:** Added a private verified-binding registry and getter; authority-source creation rejects every unverified clone or caller-shaped object.
- **Files modified:** `packages/spec/src/runtime-evidence-attestation-v1-17.ts`, `packages/spec/src/runtime-evidence-attestation-v1-17.test.ts`
- **Verification:** Clone rejection and positive branded-source tests pass.
- **Committed in:** `3110e81`

---

**Total deviations:** 1 auto-fixed (1 missing critical trust-boundary control).
**Impact on plan:** Stronger non-promotion guarantees with no gameplay, runtime failure ownership, public-output, historical, or prior-certificate behavior change.

## Issues Encountered

- Task 2's RED proof was run from a clean detached worktree at commit `0df02aa`; the two expected failures demonstrated that the new parser and signed-source support did not exist before GREEN. The temporary worktree was removed after the proof.

## Verification

- Focused evidence, certificate, and authority suites: 3 files / 67 tests passed.
- Full `@cowards/spec` package suite: 15 files / 279 tests passed.
- Root supplemental spec suites: 3 files / 33 tests passed.
- `@cowards/spec` typecheck, lint, focused formatting, and `git diff --check` passed.
- Production evidence and conformance trusted-producer registries remain exactly empty.
- No lockfile, protected file, runtime implementation, gameplay, or milestone-level planning file changed.

## User Setup Required

None.

## Next Phase Readiness

- Plan 259-22 can transactionally import reviewed production evidence using the existing publisher and high-water path without inventing a new authority format.
- Runtime-service can later require exact certificate ID/hash plus the signed source roots; request-echoed bodies still cannot promote.
- Phase closure remains false until all four independently current production-trusted lane certificates exist.

## Self-Check: PASSED

- All five declared modified files exist.
- Both RED commits precede their GREEN commits.
- Full spec, focused identity mutation, typecheck, lint, and format gates pass.
- No production trust was activated.

---
*Phase: 259-executable-four-language-and-chronicle-conformance*
*Completed: 2026-07-16*
