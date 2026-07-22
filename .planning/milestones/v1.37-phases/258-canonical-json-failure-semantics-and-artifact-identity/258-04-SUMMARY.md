---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "04"
subsystem: canonical-json-encoder-and-identity
tags: [canonical-json, iterative-encoder, utf8-order, domain-framing, identity-manifest]
requires:
  - phase: 258-03
    provides: Iterative bounded scanner/parser and exact byte-bound materialization receipt
  - phase: 258-02
    provides: 70-vector literal-byte corpus and TypeScript/Go expected-RED verifier
provides:
  - Iterative bounded canonical JSON encoder with exact binary64, scalar, and UTF-8 key-order semantics
  - Full green TypeScript corpus consumer while the exact Go missing-codec sentinel remains
  - Closed successor identity-domain registry with u64be length framing and SHA-256
  - Canonical closed runtime identity manifest serializer and hash
affects: [258-05, 258-06, 258-07, 258-08, 258-09, 258-10, 258-11, 258-13]
tech-stack:
  added: []
  patterns:
    - Explicit depth-first frame machine for canonical serialization
    - Unsigned UTF-8 byte comparison for object-key order
    - Fixed domain tag plus per-segment unsigned-64-bit big-endian length framing
key-files:
  created:
    - packages/spec/src/canonical-json-encode.ts
    - packages/spec/src/canonical-identity-domains.ts
    - packages/spec/src/runtime-identity-manifest.ts
  modified:
    - packages/spec/src/canonical-json-corpus.test.ts
    - scripts/check-canonical-json-v1-1-red.ts
    - .planning/artifacts/v1.37-canonical-json-red.json
key-decisions:
  - "Canonical binary64 output uses the ECMAScript-specified shortest round-trip primitive with explicit exponent normalization; JSON.stringify and locale-sensitive comparison are forbidden."
  - "Successor identities use a separate closed registry and u64be length framing; historical v1.16 hash helpers and proof bytes remain untouched."
  - "The two object-entry boundary canonical derivatives are UTF-8-key sorted; their raw bytes, vector IDs, corpus root, and enumeration identity remain unchanged."
patterns-established:
  - "Host values are serialized with explicit stacks, active-container cycle detection, descriptors, counters, and typed ceiling failures."
  - "Runtime identity manifests require exactly one validated binding for every registered domain and normalize binding order before serialization."
requirements-completed: [RABI-01, RABI-02, RABI-06]
coverage:
  - id: D1
    description: "All 40 successful corpus vectors encode to exact canonical bytes and hashes without recursion, ambient JSON serialization, or locale ordering."
    requirement: RABI-01
    verification:
      - kind: unit
        ref: "packages/spec/src/canonical-json-encode.test.ts and canonical-json-corpus.test.ts"
        status: pass
      - kind: other
        ref: "pnpm exec tsx scripts/check-canonical-json-v1-1-red.ts --stage go-missing --write --check"
        status: pass
    human_judgment: false
  - id: D2
    description: "Encoder failures remain typed and bounded for non-finite numbers, invalid scalars, cycles, depth, nodes, strings, arrays, objects, and output bytes."
    requirement: RABI-02
    verification:
      - kind: unit
        ref: "packages/spec/src/canonical-json-encode.test.ts (7/7)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Fifteen unique successor domains, collision-resistant framing, canonical manifests, tamper sensitivity, and six pinned v1.16 hashes are executable."
    requirement: RABI-06
    verification:
      - kind: unit
        ref: "canonical-identity-domains.test.ts and runtime-identity-manifest.test.ts (10/10)"
        status: pass
    human_judgment: false
duration: 24min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 04: Canonical Encoder and Successor Identity Domains Summary

**TypeScript now emits byte-exact bounded canonical JSON and hashes successor artifacts through one closed language-neutral framing registry, while Go remains honestly expected RED.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-07-14T00:15:13-04:00
- **Completed:** 2026-07-14T00:39:07-04:00
- **Tasks:** 2 TDD tasks
- **Files created:** 8

## Accomplishments

- Implemented a non-recursive canonical encoder with explicit container frames, active-cycle tracking, the frozen node/depth/string/collection/output ceilings, negative-zero normalization, shortest round-trip finite binary64 spellings, scalar-preserving escapes, and unsigned UTF-8 key sorting.
- Made all 70 TypeScript corpus outcomes exact: 40 canonical successes, 27 raw parse errors, and three host-value non-finite failures. The committed verifier receipt is now `go-missing`, with the TypeScript consumer green and only `[EXPECTED_RED:MISSING_CANONICAL_JSON_GO_CODEC]` remaining.
- Added a frozen 15-domain successor registry, u64be length-delimited SHA-256 framing, canonical-value hashing, and exact collision/order/unknown-domain vectors.
- Added a closed canonical runtime identity manifest requiring one unique binding per domain, validated public IDs and hashes, deterministic domain order, and tamper-sensitive manifest identity.
- Reproved six immutable v1.16 hashes without changing any historical helper or artifact: wire golden `9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97`, runtime service `9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc`, semantic receipt `36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d`, service client `8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f`, client test `4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185`, and migration 0017 `ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69`.

## Task Commits

1. **Task 1 RED: Add failing canonical encoder gates** — `9610bdb` (test)
2. **Plan amendment: Authorize correction of derived canonical boundaries** — `051dbfb` (docs)
3. **Task 1 GREEN: Complete TypeScript canonical JSON codec** — `266bc50` (feat)
4. **Task 2 RED: Add failing identity framing gates** — `2a729cd` (test)
5. **Task 2 GREEN: Unify successor identity framing** — `0d59707` (feat)
6. **Review fix: Harden corpus timing and focused lint gates** — `d014df5` (fix)

## Verification

- Combined scanner/parser/encoder/corpus/identity/ABI tests passed 37/37 across seven files; generator and expected-RED checker tests passed 23/23.
- Generator `--write --check` retained 70 vectors and root `f658a8bcb6bd4457b2eb52b6628f7fc6ff4ca36661f685ab28d7b60c8b2722c0`; real `go-missing --write --check` passed with the same root and exact enumeration identity.
- Existing spec regression suite remained 73/73; `@cowards/spec` typecheck and focused Plan-04 lint passed.
- No `JSON.stringify`, `localeCompare`, recursive serializer, or historical v1.16 helper mutation entered the implementation.
- The implementation diff is confined to the amended Plan-04 allowlist. Protected config/spec bytes and binary diffs remained exactly unchanged.

## Derived Corpus Correction

Plan 02 accidentally recorded insertion-order canonical bytes for the successful object-entry N-1 and N boundary vectors. Plan 04 corrected only those derived canonical expectations to unsigned UTF-8 key order.

- Corpus manifest SHA-256: `d9f5c49aba6241e4b8d4667f33d08bc935b0242fea43e0efffb226e479cba3c3` → `5ea41d7f02be463cfe7fe9c171b2ab2ad46d2511d4656b8e7dbf625bc0af31ad`
- Object entries N-1 canonical SHA-256: `7c27e07f10a7b3433d03375d4cfd52e9983dcfd9518a2bba05508b792617da56` → `3dd30eaa5bd06b51340b9fefd4cec98db918061cbf5e1707e08da8b04ff15a07`
- Object entries N canonical SHA-256: `feec980f2df017c1bde74accce101eac42ee4a6eb8306884e5338f631cf80e73` → `dc1705b7d0c5510d047641e7afd3004589dc4c92f8efe9d61705d73e821dbc21`
- Both raw hashes, every raw byte, vector ID, vector ordering, and corpus root remained unchanged. Enumeration identity remained `0a70be7877b11ffa3d1147c3efaa7ad38fc114fca1c3ee2028900baf786e8ef7`.

## Decisions Made

- Use `Number.prototype.toString` only as the language-specified binary64 shortest-round-trip primitive, followed by explicit lowercase/no-plus/no-leading-zero exponent normalization. It is not an ambient JSON formatter.
- Sort decoded object keys by unsigned UTF-8 bytes and encode descriptor values, making output independent of insertion order and avoiding getters during traversal.
- Keep successor identity helpers separate from all v1.16 verification helpers; domain tags and each segment are framed independently with unsigned 64-bit big-endian lengths.
- Normalize manifests to frozen domain-registry order before canonical serialization while preserving separately validated public IDs.

## Deviations from Plan

### Authorized Correction

1. **[Rule 1 - Correctness] Two successful object-entry boundary derivatives were insertion-ordered.**
   - **Found during:** Task 1 corpus verification
   - **Issue:** The N-1 and N raw objects intentionally insert `k0`, `k1`, `k2`, …, but canonical keys must sort `k0`, `k1`, `k10`, `k100`, … by UTF-8 bytes.
   - **Fix:** Amended the Plan-04 allowlist, regenerated only the two derived canonical files and their manifest expectations, and added a generator regression.
   - **Preserved:** Every raw byte/hash, ID, vector order, corpus root, and enumeration identity.
   - **Committed in:** `051dbfb`, `266bc50`

### Auto-fixed Issues

1. **[Rule 3 - Gate stability] The full 40-vector encoder test used Vitest's default five-second timeout.**
   - **Found during:** Concurrent full regression review
   - **Issue:** The exact boundary corpus passed alone but reached 5.5 seconds under concurrent load.
   - **Fix:** Declared the same 20-second budget already used by the full corpus consumer and cleaned focused lint debt in the touched generator files.
   - **Verification:** Concurrent combined phase tests passed 37/37; focused lint and typecheck passed.
   - **Committed in:** `d014df5`

**Total deviations:** 1 authorized correctness correction and 1 auto-fixed gate-stability issue. **Impact:** Exact canonical semantics and stable verification without raw corpus or historical identity drift.

## Issues Encountered

None outstanding.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-06 can define the exclusive three-way invocation ABI and adapter-owned authenticated envelope over the now-frozen canonical codec and successor identity domains. TypeScript is green; Go parity remains explicitly owned by Plan 258-11.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
