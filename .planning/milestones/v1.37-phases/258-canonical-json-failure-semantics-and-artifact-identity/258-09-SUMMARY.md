---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "09"
subsystem: python-runtime-and-source-identity
tags: [python, runtime-abi, canonical-json, source-identity, postgres, exact-bytes]
requires:
  - phase: 258-06
    provides: Authenticated exclusive v1.17 invocation envelope
  - phase: 258-07
    provides: Engine-only penalties and no-mutation system-failure ownership
provides:
  - Exact original and normalized source identities across web, Go, repository, and PostgreSQL
  - Package-free Python candidate with authenticated raw ABI and supervised signed wall budget
  - Immutable legacy-safe source storage plus applied-migration upgrade hardening
  - Live browser-to-Go-to-PostgreSQL proof for mixed line endings and no final newline
affects: [258-11, 258-12, 258-13, 258-14, 259]
tech-stack:
  added: []
  patterns:
    - Recompute every source identity derivative at the repository boundary from exact source bytes
    - Supervise Python guest work in a forked child with host-owned monotonic deadline and kill/reap
    - Preserve released migration bytes and add a new migration for later hardening
key-files:
  modified:
    - packages/runtime-python/src/python-subprocess-adapter.ts
    - packages/runtime-python/src/python_runtime_host.py
    - packages/runtime-python/src/validation.ts
    - packages/spec/src/runtime.ts
    - packages/spec/src/schemas.ts
    - packages/persistence/src/repositories.ts
    - packages/persistence/src/account-revisions.ts
    - apps/web/lib/account-revision-write-boundary.ts
    - apps/web/app/competitive/server.ts
    - apps/go-backend/live_backend.go
  created:
    - packages/persistence/migrations/0018_strategy_revision_source_identity.sql
    - packages/persistence/migrations/0019_strategy_revision_source_identity_hardening.sql
    - packages/spec/src/source-artifact-identity.test.ts
    - apps/go-backend/source_identity_test.go
    - apps/web/e2e/v1-37-runtime-source-identity-proof.spec.ts
key-decisions:
  - "Original source bytes are canonical immutable evidence; normalized bytes are a separately identified derivative and never replace the original domain."
  - "The repository recomputes the complete v2 identity record from source and rejects caller-supplied semantic drift before SQL."
  - "The Python signed wall begins immediately before child execution and covers module initialization through complete response-envelope EOF; interpreter startup has a separate system-owned watchdog."
  - "Python compute and memory meters remain explicitly unavailable, so unavailable or ambiguous accounting is system-owned and cannot certify counted execution."
  - "Current v1.4 gameplay, current runtime dispatch, and immutable historical evidence remain unchanged; v1.17 is additive and inactive."
requirements-completed: [RABI-01, RABI-02, RABI-03, RABI-05, RABI-06, RABI-08]
coverage:
  - id: D1
    description: "Web UI/API, competitive server action, Go, repository, and PostgreSQL preserve exact LF, CRLF, CR, mixed-ending, BOM, whitespace, and no-final-newline source identity."
    requirement: RABI-06
    verification:
      - kind: integration
        ref: "apps/web/e2e/v1-37-runtime-source-identity-proof.spec.ts and apps/go-backend/source_identity_test.go"
        status: pass
    human_judgment: false
  - id: D2
    description: "Python emits one authenticated success, player violation, or system failure with bounded canonical payloads and an uncatchable host-owned deadline."
    requirement: RABI-05
    verification:
      - kind: unit
        ref: "packages/runtime-python/src/python-subprocess-adapter.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Released migration bytes and legacy source remain immutable while v2 rows enforce one exact complete identity group without a fabricated backfill."
    requirement: RABI-08
    verification:
      - kind: integration
        ref: "packages/persistence/src/migrations.test.ts and packages/persistence/src/account-revisions.test.ts"
        status: pass
    human_judgment: false
duration: 2h 18min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 09: Python Runtime and Exact Source Identity Summary

**Python now follows the common authenticated raw ABI, while every live save path preserves immutable original source bytes and a separately identified normalized derivative without changing active v1.4 behavior.**

## Performance

- **Duration:** 2h 18 min
- **Completed:** 2026-07-14
- **Tasks:** 2 TDD tasks plus independent adversarial review and rereview loops
- **Files modified:** 23 implementation, migration, test, and proof files

## Accomplishments

- Established one domain-framed source identity contract for exact original bytes, normalized bytes, normalization policy/version, line-ending counts/type, final-newline fact, and artifact binding.
- Preserved exact submitted source through the API boundary and competitive server action, the selected Go backend, repository admission, and PostgreSQL. Emptiness validation operates on a derived predicate and never trims stored bytes.
- Made the repository the semantic admission authority: every v2 derivative is recomputed from exact source and any mismatched caller record fails before SQL.
- Added a package-free Python v1.17 candidate that authenticates exact request, artifact, source, runtime, and toolchain identity; admits only bounded canonical raw payloads; and returns one exclusive authenticated outcome.
- Put Python module initialization, method resolution and invocation, canonical serialization, base64 encoding, envelope construction, transfer, and EOF under one uncatchable host-supervised monotonic wall deadline.
- Kept Python startup under a separate system-owned infrastructure watchdog and explicitly reported compute/memory meters as unavailable. Documentation or label names therefore cannot promote the lane to counted use.
- Preserved migration 0018 at its first-release bytes and added migration 0019 for safe hardening of installations that had already applied 0018. No historical source identity is reconstructed or backfilled.
- Proved the actual Next.js-to-Go-to-PostgreSQL route with mixed `CRLF+LF+CR` source and the browser save path with LF/no-final-newline source, while keeping all public/default output source- and diagnostic-safe.

## Task and Review Commits

1. **Task 1 RED: Expose source identity boundary gaps** — `2a3db31`
2. **Task 1 GREEN: Preserve exact source identity** — `921c1e7`
3. **Task 2 RED: Expose Python candidate ownership gaps** — `1e2bb2b`
4. **Task 2 GREEN: Authenticate Python candidate execution** — `2edd583`
5. **Integration RED: Expose live source identity drift** — `8558208`
6. **Integration fix: Align Go source identity boundary** — `788b92c`
7. **Integration proof: Prove live source identity path** — `4ee4454`
8. **Review RED: Expose source boundary review gaps** — `f526280`
9. **Review fix: Close source boundary findings** — `2e87bed`
10. **Review RED: Expose host budget and migration upgrade gaps** — `3d5052c`
11. **Review fix: Enforce Python guest boundaries and upgrade hardening** — `1a75a60`
12. **Review RED: Expose catchable Python wall deadline** — `577bbfe`
13. **Review fix: Supervise Python guest deadlines** — `fe4417c`
14. **Review RED: Expose unsupervised Python initialization** — `4c2e8a2`
15. **Review fix: Supervise Python module initialization** — `3117d38`
16. **Final-review RED: Expose identity and retryability drift** — `f8e92f9`
17. **Final-review fix: Close identity admission drift** — `90de75f`
18. **Review record: Independent zero-finding closure** — `95e26b6`

## Verification

- Plan-focused Vitest passed **71/71** across the web write boundary, API route, competitive server, persistence migration/repository, Python adapter, and spec source-identity suites.
- Complete `@cowards/runtime-python` suite passed **38/38**.
- Persistence migration and account-revision suites passed **22/22**, including the applied-0018-to-0019 upgrade path.
- Runtime-Python, persistence, spec, and web typechecks passed; focused ESLint and both Python `py_compile` checks passed.
- Named Go tests passed for canonical-engine compatibility, public-readiness privacy, and live PostgreSQL source identity. The database test executed rather than skipping.
- Desktop Playwright source-identity proof passed **1/1** against the real Next.js, runtime-validation, Go backend, and PostgreSQL topology.
- An independent numeric parity probe checked **299,838** randomized finite binary64 values with zero Python-versus-TypeScript canonical spelling mismatches.
- Migration 0018 matches its first-release hash; migration 0019 performs the additive hardening without a backfill.
- `git diff --check` passed, helper ports 3000/3107/8087 were clear, temporary proof users were removed, and `apps/web/next-env.d.ts` was restored after Playwright.
- Protected dirty `.planning/config.json` and `CowardsGameSpec_Full_Consolidated_v1.md` remained unstaged and untouched.

## Decisions Made

- Treat original bytes as immutable evidence and normalization as an explicit derivative. CRLF or mixed-ending source may execute from a normalized artifact only when the manifest binds both identities and the policy exactly.
- Recompute the complete persistence record in the repository. A route, service, or caller can provide source, but cannot declare its own authoritative hashes, counts, policy facts, or normalized bytes.
- Define the Python signed wall at the guest execution boundary rather than interpreter startup. The child ready/go protocol excludes infrastructure startup while still observing every player-influenced step through complete envelope transfer.
- Require complete EOF before the wall deadline. Receiving a partial or even syntactically valid prefix does not end the signed budget or authorize the result.
- Keep unavailable compute and memory measurement truthful and system-owned. The Python candidate is not counted merely because wall and output enforcement exist.
- Preserve all current v1.4 Match semantics and historical evidence. Plan 09 adds inactive successor contracts and evidence only; activation remains Plan 258-14 authority.

## Deviations from Plan

### Auto-fixed Issues

1. **[Critical — migration safety] The released 0018 migration needed stronger constraints after it could already have been applied.**
   - Editing 0018 in place would make fresh databases and upgraded databases disagree.
   - The first-release 0018 bytes were restored and 0019 now applies all hardening as a forward-only upgrade.

2. **[Critical — wall ownership] Python signal timeout was catchable and did not initially cover every player-influenced step.**
   - Guest code could catch the timeout, while top-level module execution or response work could exceed the signed wall outside observation.
   - Fork supervision, ready/go synchronization, host kill/reap, and complete-envelope EOF now cover initialization through transfer.

3. **[Critical — identity authority] Caller-supplied semantic source identity could drift from the exact stored source.**
   - A structurally valid identity record was insufficient proof that its derivatives represented the source bytes.
   - Repository admission now recomputes the canonical record and rejects any mismatch before mutation.

4. **[High — byte fidelity] Lossy UTF-8 decoding could bind replacement text rather than the signed artifact bytes.**
   - Python now requires fatal UTF-8 decode, exact re-encode equality, and canonical base64 round-trip equality.

5. **[High — output ownership] Guest serialization and host-pipe behavior could bypass the signed output classification.**
   - The bounded canonical writer stops at N+1, reports player-owned oversize only with positive attribution, and transfers a bounded authenticated envelope.

6. **[High — public boundary] Go readiness output and engine identity could expose internals or retain an obsolete candidate tuple.**
   - Go now uses the canonical engine identity and returns only stable sanitized public categories.

7. **[Medium — UI representation] Monaco cannot faithfully represent all mixed line-ending combinations after editing.**
   - The browser proof covers the actual UI save path with LF/no-final-newline bytes, and the mixed-ending vector travels through the real authenticated Next.js API, Go, and PostgreSQL route. This limitation is documented rather than hidden by a synthetic UI claim.

**Total deviations:** 7 correctness, security, compatibility, and evidence-strengthening fixes. **Impact:** Stronger exact-byte provenance and failure ownership with no gameplay activation or historical rewrite.

## Code Review

The review log is recorded in `258-09-REVIEW.md`. A fresh independent rereview after the final fix found **zero actionable findings**.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-11 can rely on an exact persisted source/artifact identity and Python’s exclusive failure classification when proving Go signed retry, rollback, and zero mutation. Plans 258-12 and 258-13 still own cross-language budget certification and the complete evidence DAG. Activation remains exclusively Plan 258-14.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
