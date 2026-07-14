---
phase: 258-canonical-json-failure-semantics-and-artifact-identity
plan: "06"
subsystem: successor-runtime-invocation-abi
tags: [runtime-abi, authenticated-envelope, failure-ownership, canonical-json, candidate-wire]
requires:
  - phase: 258-01
    provides: Frozen ownership, version, budget, and identity limits
  - phase: 258-03
    provides: Iterative bounded raw scanner/parser and exact byte-bound receipts
  - phase: 258-04
    provides: Canonical encoder and closed successor identity-domain framing
provides:
  - Exclusive v1.17 candidate success, player-violation, and system-failure result contract
  - Adapter-owned authenticated request and response envelopes with exact canonical fixtures
  - Executable ownership matrix, binding-tamper negatives, and immutable v1.16 dispatch proof
affects: [258-05, 258-07, 258-08, 258-09, 258-10, 258-11, 258-12, 258-13, 258-14]
tech-stack:
  added: []
  patterns:
    - Strict discriminated unions with matching runtime schemas
    - Domain-framed HMAC over canonical adapter-owned outer envelopes
    - Candidate-only successor exports with immutable current dispatch
key-files:
  created:
    - packages/spec/src/runtime-invocation-v1-17.ts
    - packages/spec/src/runtime-invocation-v1-17.test.ts
    - packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json
    - packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json
  modified:
    - packages/spec/src/runtime.ts
key-decisions:
  - "Every successor result has exactly one kind: success owns value, player_violation owns a registered canonical violation, and system_failure owns a redacted failure."
  - "The runtime adapter authenticates the outer request and response envelopes; guest output remains untrusted payload material and never authenticates itself."
  - "Malformed, truncated, unauthenticated, wrongly bound, undecodable, ambiguous, adapter, runtime, host, and transport failures are system-owned; only decoded attributable Strategy faults are player-owned."
  - "The v1.17 contract remains an inactive candidate until Plan 258-14; current v1.16 service dispatch and historical bytes remain unchanged."
patterns-established:
  - "Derived request bindings are revalidated before response signing, so syntactically valid but unauthenticated or internally inconsistent requests cannot receive adapter authority."
  - "Public traces contain only validated safe identifiers, registered codes, and cryptographic hashes; source, stdout, memory, diagnostics, paths, and stacks are excluded."
requirements-completed: [RABI-03, RABI-04, RABI-05, RABI-08]
coverage:
  - id: D1
    description: "The complete 18-case observation matrix produces exactly one structurally exclusive successor result kind, with mixed and absent discriminants rejected by both TypeScript and Zod."
    requirement: RABI-03
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-invocation-v1-17.test.ts"
        status: pass
      - kind: other
        ref: "pnpm --filter @cowards/spec typecheck"
        status: pass
    human_judgment: false
  - id: D2
    description: "Outer-frame, adapter, runtime, host, transport, attribution, and binding failures are system-owned, while only decoded attributable Strategy invalidity, exception, and exhaustion are player-owned."
    requirement: RABI-04
    verification:
      - kind: unit
        ref: "packages/spec/src/runtime-invocation-v1-17.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Canonical authenticated request and response fixtures bind the complete request, method, tuple, ABI, revision, artifact, budget, input, retry, request-digest, and payload identities with deterministic adapter-owned signatures."
    requirement: RABI-05
    verification:
      - kind: unit
        ref: "runtime-invocation-v1-17.test.ts and service-contract.test.ts (14/14)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The successor ABI is explicitly inactive and non-current, while pinned v1.16 request, response, service, Go client, semantic receipt, and migration hashes remain exact."
    requirement: RABI-08
    verification:
      - kind: unit
        ref: "runtime-invocation-v1-17.test.ts, service-contract.test.ts, and runtime-abi-v1-17.test.ts"
        status: pass
      - kind: other
        ref: "git diff scope and pinned SHA-256 review"
        status: pass
    human_judgment: false
duration: 32min
completed: 2026-07-14
status: complete
---

# Phase 258 Plan 06: Successor Invocation ABI Summary

**The v1.17 candidate now has one exclusive three-way result contract and one adapter-authenticated canonical outer envelope, while current v1.16 dispatch remains byte-identical and authoritative.**

## Performance

- **Duration:** 32 min
- **Started:** 2026-07-14T00:48:14-04:00
- **Completed:** 2026-07-14T01:19:56-04:00
- **Tasks:** 2 TDD tasks
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- Added a strict compile-time and runtime-schema v1.17 result union: success carries only value/trace, player violation only canonical violation/trace, and system failure only redacted failure/trace.
- Executed an 18-case ownership matrix covering success plus every frozen failure observation. Missing, truncated, unauthenticated, wrongly bound, undecodable, adapter, runtime, host, transport, and ambiguous-attribution cases remain system-owned; only proven decoded Strategy invalidity, exception, and exhaustion are player-owned.
- Added canonical authenticated request and response helpers whose adapter-owned HMAC binds request/invocation/kernel IDs, method, semantic tuple and hash, ABI, revision/source/artifact identity, budget vector/profile hash, input identity, retry identity, signed-request identity, and response-payload identity.
- Committed exact newline-free candidate fixtures: request SHA-256 `94da776c5ef88992d126bd85ae325518303ba56fdf8d2b5568e0e0ce28db1fd7` and response SHA-256 `d4aa58745e3d4305cc09854478dc38e31313b1e803b89f65a990bd8c52a74ebf`.
- Kept `runtime-invocation-v1.17` / `strategy-runtime-abi-v1.17` explicitly `inactive-candidate`, with activation owned by Plan 258-14 and no current service-default or gameplay change.
- Reproved immutable v1.16 request, response, TypeScript service, Go semantic receipt/client/client test, and migration hashes without modifying `runtime-execution-service.ts` or any historical artifact.

## Task Commits

1. **Task 1 RED: Add failing three-way invocation gates** — `cbc8f08` (test)
2. **Task 1 GREEN: Define exclusive successor invocation results** — `e274579` (feat)
3. **Task 2 RED: Add failing authenticated wire gates** — `0cee40d` (test)
4. **Task 2 GREEN: Authenticate candidate invocation envelopes** — `3739983` (feat)
5. **Review fix: Harden candidate envelope ownership** — `0009514` (fix)
6. **Review RED: Expose incomplete candidate envelope bindings** — `4fb21cb` (test)
7. **Review fix: Bind the complete candidate envelope** — `fe08f04` (fix)
8. **Final review RED: Expose trace and malformed-request gaps** — `1fccade` (test)
9. **Final review fix: Fail closed on final envelope bindings** — `6286e75` (fix)

## Verification

- Focused successor/dependency suite passed 43/43 across six files: invocation, service contract, runtime ABI, canonical encoder/parser, and identity domains.
- Plan Task-2 invocation/service subset passed 18/18; the full `@cowards/spec` suite remained 73/73.
- The complete `packages/spec/src` suite passed 232/232 across 23 files after the final review fixes.
- `pnpm --filter @cowards/spec typecheck` and focused ESLint over the successor module, test, and export surface passed.
- Candidate request signature-input SHA-256 is `7a2b2ce2c3b8fed0af22911fea9430a51487db83796d068478a0db851ac2b19d`; response signature-input SHA-256 is `0a0c97b4f762608139b0e413fef120eee35ca4ee0c221398b00f94e92f342bcc`.
- Pinned v1.16 hashes remained exact: request `5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5`, response wire `9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97`, service `9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc`, semantic receipt `36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d`, Go client `8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f`, Go client test `4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185`, and migration 0017 `ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69`.
- The implementation diff is confined to the Plan-06 successor module, test, candidate artifacts, and aggregate export. No current service dispatch or gameplay file changed; protected config/spec bytes and binary diffs remained exactly unchanged.

## Decisions Made

- Register player-violation codes and exact canonical public messages as a closed pair rather than accepting arbitrary safe-looking text.
- Validate every public trace identifier against a conservative safe-ID grammar and every digest as lowercase SHA-256; reject extra keys at every envelope and result layer.
- Recompute derived bindings and authenticate a request before the adapter may sign a response. Verification failures return a redacted system failure and never throw across the boundary.
- Preserve historical v1.16 execution service source and fixtures as immutable proof inputs; expose v1.17 candidate definitions only through the spec aggregate without changing the active runtime path.

## Deviations from Plan

### Auto-fixed Issues

1. **[Rule 1 - Ownership safety] Safe-looking player messages and trace identifiers were initially too permissive.**
   - **Found during:** Post-GREEN review
   - **Issue:** Length-only player messages and broad identifiers could admit unregistered public text or unsafe identifier forms.
   - **Fix:** Added an exact code/message registry, a conservative safe-ID grammar, strict nested schemas, and negative tests.
   - **Committed in:** `0009514`

2. **[Rule 1 - Authentication authority] The response builder initially accepted a syntactically valid but unauthenticated request object.**
   - **Found during:** Post-GREEN review
   - **Issue:** An adapter helper could otherwise confer response authority on a request whose signature or derived bindings were invalid.
   - **Fix:** Required request authentication and complete derived-binding validation before response construction and signing.
   - **Committed in:** `0009514`

3. **[Rule 1 - Failure ownership] Truncation classification initially depended on a final-byte heuristic.**
   - **Found during:** Task 2 GREEN verification
   - **Issue:** Nested-close truncation could be classified as generic undecodable input rather than the frozen truncated outer-frame observation.
   - **Fix:** Used the bounded parser's EOF offset to classify incomplete canonical frames deterministically and retained system ownership.
   - **Committed in:** `3739983`

4. **[Rule 1 - Complete response binding] The response constructor could sign a schema-valid trace that did not belong to its authenticated request.**
   - **Found during:** Independent final re-review
   - **Issue:** The constructor could emit a signed response that the verifier immediately rejected as `OUTER_FRAME_WRONG_BINDING`.
   - **Fix:** Centralized the eight-field trace/request comparison, refused mismatched traces before signing, and reused the same comparison during verification.
   - **Committed in:** RED `1fccade`, GREEN `6286e75`

5. **[Rule 1 - Fail-closed verification] Malformed expected-request values could throw before response verification classified them.**
   - **Found during:** Independent final re-review
   - **Issue:** A malformed public identifier caused `verifyRuntimeInvocationResponseV117` to throw `ZodError`, violating the no-throw boundary contract.
   - **Fix:** Added runtime schema and derived-binding admission for the expected request, authenticated it before accepting a response, and wrapped unexpected verifier faults as redacted `OUTER_FRAME_WRONG_BINDING` system failures.
   - **Committed in:** RED `1fccade`, GREEN `6286e75`

**Total deviations:** 5 auto-fixed correctness and ownership issues. **Impact:** Stricter public safety, complete adapter authority, and deterministic system-owned failure classification; no scope or current-runtime expansion.

## Issues Encountered

The current `runtime-execution-service.ts` source is itself a pinned v1.16 proof artifact. Plan 06 therefore left it byte-identical and placed all successor behavior in the candidate module and executable tests, preserving the plan's no-default-flip requirement.

## User Setup Required

None.

## Next Phase Readiness

Plan 258-05 can now integrate bounded raw-byte admission into this frozen Plan-06 candidate service boundary and permanent deep-input audit. Activation remains deferred to Plan 258-14.

## Self-Check: PASSED

---
*Phase: 258-canonical-json-failure-semantics-and-artifact-identity*
*Completed: 2026-07-14*
