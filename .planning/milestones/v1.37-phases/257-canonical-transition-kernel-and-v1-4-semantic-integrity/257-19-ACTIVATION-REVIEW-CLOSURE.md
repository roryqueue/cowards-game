---
phase: 257-canonical-transition-kernel-and-v1-4-semantic-integrity
review_target: 3642493
red_test_commit: 06eaaa8
corrective_source_commit: bd38bf2
rereview_corrective_source_commit: 34491b2
status: closed
closed: 2026-07-13
---

# Phase 257 activation review closure

The five activation-review findings are closed by corrective source commit
`bd38bf2`. The correction preserves the exact current tuple, the immutable
v1.4 compatibility observations, and the user's protected working-copy bytes.
The three subsequent receipt re-review warnings are closed by corrective source
commit `34491b2` without changing gameplay, the current tuple, or historical
routing.

## Receipt re-review warning disposition

| Warning | Disposition | Permanent proof |
|---|---|---|
| W-01: receipt hashes bound normalized values rather than the actual v1.16 JSON wire values | Closed. The TypeScript issuer hashes the exact native `JSON.stringify` UTF-8 bytes of the schema-normalized full Chronicle, full final state, and outcome under three explicit JSON-wire domains. Go retains the received Chronicle and final state as `json.RawMessage`, extracts the exact received outcome value, verifies all three hashes and the HMAC before typed nested decode, and carries cloned raw/hash evidence through the pre-transaction and post-lock completion checks. | A TypeScript-generated response golden is consumed without Go re-signing. It covers literal `<>&`, U+2028/U+2029, non-ASCII text, mixed-case insertion order, maximum/minimum safe integers, JSON-normalized negative zero, exponent form, and a decimal. Go admits the exact golden and rejects a Go-rewritten semantically equivalent response. |
| W-02: current runtime-service success admitted Chronicle `integrity` and `storageMetadata` | Closed. The current success Chronicle schema strictly omits both fields, the TypeScript issuer refuses either field, and Go rejects either key after raw receipt verification and again during completion recheck. Historical Chronicle schemas and persistence hashing remain unchanged. | Spec injection tests; Go re-signed injection tests; DSN-backed completion snapshot tests proving zero mutation for both keys. |
| W-03: Go accepted uppercase signature hex and persisted a whole-struct-derived receipt hash | Closed. Go requires the full lowercase `^hmac-sha256:[0-9a-f]{64}$` form before decoding. Persisted receipt JSON and its domain-separated hash now use one explicit fixed-field projection, including the signature, so case-only mutation fails admission and idempotent retries retain one stable record identity. | Go decode rejection test; DSN-backed uppercase rejection with exact zero-mutation snapshot followed by a successful original-lowercase retry; persisted receipt/idempotence/immutability coverage. |

## Finding disposition

| Finding | Disposition | Permanent proof |
|---|---|---|
| F-01: Go admitted shape-only runtime success | Closed. Runtime service contract v1.16 issues a dedicated HMAC-SHA256 semantic receipt only after canonical recording, validation, and reconstruction. Go strictly decodes and verifies every receipt claim, hash, signature, tuple, authority identity, request identity, final state, and outcome before completion and again inside the locked transaction. Receipt JSON and hash are persisted together and are immutable. | Runtime semantic-integrity tests; 13-code Go contract parity; DSN-backed Go completion rollback, storage, idempotence, all-or-none, and immutability tests; full Go suite. |
| F-02: authority publication admitted unrelated lane controls | Closed. Publication selects controls only for the exact lane hashes of selected current certificates. | Publisher PostgreSQL suite 17/17 and atomic proof selection/source manifest below. |
| F-03: quarantined TypeScript completion did not bind execution, anchors, Chronicle, reconstruction, and final state | Closed. Current completion requires the canonical execution and boundary anchors, validates the current Chronicle, reconstructs it, directly compares the terminal replay state to the recorded final replay projection, and compares execution/recorder/final outcome before mutation. The route remains explicitly non-normal. | Persistence completion tests 7/7, full PostgreSQL persistence 213/213, runtime semantic/execute tests 22/22, and the zero-finding integrity checker. |
| F-04: Go failure allowlist covered only six contract codes | Closed. The Go allowlist is generated from the TypeScript v1.16 system-failure contract and checks all 13 codes. | Go parity generator check and full Go suite. |
| F-05: package root exposed legacy activation lifecycle routes | Closed. The historical selection/cycle implementations and private helpers live only in `packages/engine/src/fixtures/v1-4-legacy-activation.ts`; current `activation.ts` contains only kernel-used pure helpers. Package-root exports omit both lifecycle routes, and the structural guard rejects executable implementations outside fixture-only paths. | Engine 117/117, locked compatibility corpus, activation/boundary 64/64, integrity checker tests 45/45, repository checker zero findings. |

## PostgreSQL atomic activation evidence

- Selected certificate: `certificate:atomic:exact-current`.
- Excluded certificates: `certificate:atomic:historical`,
  `certificate:atomic:partial`, and `certificate:atomic:mixed`.
- Selected control: `lane-control:atomic:exact-current`.
- Excluded controls: `lane-control:atomic:historical`,
  `lane-control:atomic:partial`, and `lane-control:atomic:mixed`.
- Exact publication sources: `attestation:atomic:exact-current`,
  `certificate:atomic:exact-current`, and
  `lane-control:atomic:exact-current`.
- Mounted operator disable: lane
  `sha256:4df7640a65e4632066525f712d064f41c79550df98e3c63b1f4b91fe0bfcb35b`,
  instant `2026-07-13T11:00:00.000Z`, reason `atomic-proof-scope`.
- Registry generations advanced `1 -> 2`; installed and restart generation were
  `2`; rollback failed with `ROLLBACK`; production install receipt count was
  `0`.

## Corrective verification

- Typecheck: spec, runtime service, engine, persistence, and replay passed.
- Test suites: spec 72/72; current semantic/candidate authority 16/16; runtime
  service 59/59 with TypeScript, Python, Rust, and Zig; engine 117/117; replay
  162/162; PostgreSQL persistence 213/213; focused post-format review group
  119/119; full DSN-backed Go passed.
- Historical proof passed with 8 artifacts and 11 sources. All 20 immutable
  v1.4 fixture hashes and all 13 dimension roots remained exact.
- Current event coverage was regenerated and checked; retained candidate event
  evidence remained byte-exact; integrity-authority artifacts were current.
- TypeScript inventory and labels were regenerated and checked at 247 surfaces;
  worker-retirement findings were zero; the v1.37 integrity checker reported
  zero findings across 305 files.
- OpenAPI generation/check and Redocly validation passed; service-boundary
  imports had `strict_offenses=0`; public-discovery checks passed.
- All 14 packages built and linted successfully. The generated Next.js
  `next-env.d.ts` change was restored before commit.

## Receipt re-review verification

- RED was observed independently before implementation: the spec admitted both
  forbidden Chronicle fields; Go admitted uppercase signature hex and both
  re-signed forbidden fields; the wire golden did not yet exist; and all three
  DSN-backed completion cases reached mutation instead of rejection.
- Focused GREEN passed for the v1.16 TypeScript-issued wire golden, exact
  wire-rewrite rejection, lowercase signature enforcement, both forbidden
  Chronicle fields, transactional zero mutation, and lowercase retry.
- Full suites passed: spec 72/72; engine 117/117; replay 162/162; runtime service
  59/59; PostgreSQL persistence 213/213 with an explicit 15-second test timeout;
  and the full DSN-backed Go suite.
- Typecheck passed all 25 tasks; lint passed all 14 packages; build passed all
  14 packages. OpenAPI generation/check and Redocly validation passed. Go
  parity, the 26-artifact Strategy manifest, current event coverage, integrity
  authority, atomic publication/install/restart/rollback proof, immutable
  historical proof, public discovery, and executable-reference inventory all
  passed.
- The TypeScript backend inventory was regenerated and checked at 247 surfaces.
  Service-boundary imports retained the known report-only baseline
  (`strict_offenses=0`, `report_only_offenses=20`).
- The aggregate boundary monitor passed every gate through v1.37 worker
  retirement, then stopped at the Plan-20-owned current-result input because
  `.planning/artifacts/v1.37-phase-257-core-rules-result.json` does not exist
  yet. Direct result construction succeeds. ROADMAP/STATE intentionally remain
  at 19/22 until Plan 20 creates that artifact; this re-review does not advance
  them or claim the Plan 20 checker is complete.

## v1.16 receipt and migration limits

- v1.16 uses a dedicated shared HMAC secret and fixed key ID. Secret rotation,
  asymmetric attestation, and external key-management authority are not claimed.
- Receipt columns remain nullable for pre-v1.16 rows and the explicitly
  quarantined TypeScript completion path. The all-or-none/hash constraint is
  enforced for new writes without rewriting historical rows; the immutable
  trigger prevents changing a receipt after it exists.
- Normal Go completion always requires, transactionally reverifies, and stores
  the receipt. The TypeScript path instead requires its local canonical
  execution/anchor/reconstruction proof and remains non-normal.
- This correction does not promote production language conformance, durable
  rating authority, or the quarantined TypeScript completion route.

## Protected working-copy proof

The corrective source commit and this closure commit exclude both protected
files. Their post-verification SHA256 values equal the pre-review values:

- `.planning/config.json`:
  `a9502647c42da6e83564e56e35833a66d2daad6704f2ac2a2d98cf12cc953f7b`
- `CowardsGameSpec_Full_Consolidated_v1.md`:
  `01b0a95c79e2ba5e8a089abe7106856e7f081bb10193d5ab8e86171f6ee0fa46`

No activation-review finding or receipt re-review warning remains open.
