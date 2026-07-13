---
phase: 256-counted-safety-and-canonical-authority
reviewed: 2026-07-13T10:08:30Z
depth: standard
files_reviewed: 96
files_reviewed_list:
  - apps/go-backend/completion.go
  - apps/go-backend/integrity_creation.go
  - apps/go-backend/integrity_creation_test.go
  - apps/go-backend/integrity_evidence.go
  - apps/go-backend/integrity_evidence_test.go
  - apps/go-backend/job_lifecycle.go
  - apps/go-backend/live_backend.go
  - apps/go-backend/main.go
  - apps/go-backend/main_test.go
  - apps/go-backend/orchestrator.go
  - apps/go-backend/phase244_account_provider_db_test.go
  - apps/go-backend/provider_readiness.go
  - apps/go-backend/provider_readiness_test.go
  - apps/go-backend/runtime_evidence_authority.go
  - apps/go-backend/runtime_evidence_authority_test.go
  - apps/go-backend/runtime_service_client.go
  - apps/runtime-service/src/counted-safety.test.ts
  - apps/runtime-service/src/execute-match.test.ts
  - apps/runtime-service/src/execute-match.ts
  - apps/runtime-service/src/four-language-parity.test.ts
  - apps/runtime-service/src/index.ts
  - apps/runtime-service/src/runtime-evidence-authority.test.ts
  - apps/runtime-service/src/runtime-evidence-authority.ts
  - apps/runtime-service/src/runtime-execution-evidence.test-support.ts
  - apps/runtime-service/src/server.ts
  - apps/web/app/api/test-support/run-worker-once/route.ts
  - apps/worker/src/index.ts
  - apps/worker/src/runner.test.ts
  - apps/worker/src/runner.ts
  - packages/persistence/migrations/0012_integrity_authority.sql
  - packages/persistence/migrations/0013_runtime_evidence_authority_publication.sql
  - packages/persistence/migrations/0014_matchset_authority_install_receipts.sql
  - packages/persistence/migrations/0015_chronicle_receipt_bound_integrity.sql
  - packages/persistence/src/chronicle-store.test.ts
  - packages/persistence/src/chronicle-store.ts
  - packages/persistence/src/competition.ts
  - packages/persistence/src/complete-match.test.ts
  - packages/persistence/src/complete-match.ts
  - packages/persistence/src/dev-smoke.ts
  - packages/persistence/src/governance.test.ts
  - packages/persistence/src/governance.ts
  - packages/persistence/src/index.ts
  - packages/persistence/src/integrity-evidence.test.ts
  - packages/persistence/src/integrity-evidence.ts
  - packages/persistence/src/jobs.test.ts
  - packages/persistence/src/jobs.ts
  - packages/persistence/src/ladder.test.ts
  - packages/persistence/src/ladder.ts
  - packages/persistence/src/match-service.test.ts
  - packages/persistence/src/match-service.ts
  - packages/persistence/src/matchset-service.test.ts
  - packages/persistence/src/matchset-service.ts
  - packages/persistence/src/migrations.test.ts
  - packages/persistence/src/runtime-evidence-authority-publisher.test.ts
  - packages/persistence/src/runtime-evidence-authority-publisher.ts
  - packages/persistence/src/runtime-evidence-import.test.ts
  - packages/persistence/src/runtime-evidence-import.ts
  - packages/persistence/src/standings-recompute.test.ts
  - packages/persistence/src/standings-recompute.ts
  - packages/persistence/src/workshop.ts
  - packages/replay/src/validate.test.ts
  - packages/replay/src/validate.ts
  - packages/spec/artifacts/runtime-execution-service-request.v1.15.json
  - packages/spec/artifacts/v1.37-integrity-authority-hash-vectors.json
  - packages/spec/artifacts/v1.37-integrity-authority.json
  - packages/spec/artifacts/v1.37-runtime-evidence-authority-vectors.json
  - packages/spec/src/competition-entry-eligibility.test.ts
  - packages/spec/src/competition-entry-eligibility.ts
  - packages/spec/src/index.ts
  - packages/spec/src/integrity-authority.test.ts
  - packages/spec/src/integrity-authority.ts
  - packages/spec/src/match-execution-contract.test.ts
  - packages/spec/src/match-execution-contract.ts
  - packages/spec/src/public-output-privacy.ts
  - packages/spec/src/runtime-evidence-attestation.test.ts
  - packages/spec/src/runtime-evidence-attestation.ts
  - packages/spec/src/runtime-evidence-authority-bundle.test.ts
  - packages/spec/src/runtime-evidence-authority-bundle.ts
  - packages/spec/src/runtime-evidence.test.ts
  - packages/spec/src/runtime-evidence.ts
  - packages/spec/src/runtime-execution-service.ts
  - packages/spec/src/runtime.ts
  - packages/spec/src/schemas.ts
  - packages/spec/src/spec.test.ts
  - packages/spec/src/versions.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-v1-36-historical-proof.ts
  - scripts/check-v1-37-integrity-boundaries.test.ts
  - scripts/check-v1-37-integrity-boundaries.ts
  - scripts/check-v1-37-worker-retirement.test.ts
  - scripts/check-v1-37-worker-retirement.ts
  - scripts/generate-v1-37-integrity-authority.ts
  - scripts/generate-v1-37-runtime-evidence-authority-vectors.ts
  - scripts/publish-v1-37-runtime-evidence-authority.test.ts
  - scripts/publish-v1-37-runtime-evidence-authority.ts
  - scripts/run-v1-5-advanced-demo.ts
findings:
  critical: 6
  warning: 6
  info: 0
  total: 12
status: issues_found
---

# Phase 256 Code Review

## Narrative Findings

The phase adds a substantial authority, publication, installation, and execution-proof chain, but the reviewed implementation does not yet establish the fail-closed property it claims. In particular, the signed authority can promote stale certificates, the runtime service does not bind the certified executable lane to the Strategy Revision it actually runs, and the Go creation path independently matches only a subset of that lane identity. The anti-rollback and revision-locking implementations also have race/failure paths that can discard their safety state. These are execution-authority defects, not documentation gaps, so counted execution should remain disabled until the critical findings are fixed and covered by negative end-to-end tests.

### CRITICAL-01 — Published authority can make expired or not-yet-valid certificates executable

- **Location:** `packages/persistence/src/runtime-evidence-authority-publisher.ts:903-913`, `packages/persistence/src/runtime-evidence-authority-publisher.ts:1145-1160`, `packages/spec/src/runtime-evidence-authority-bundle.ts:50-57`, `apps/runtime-service/src/execute-match.ts:194-208`
- **Issue:** The publisher selects every certificate whose status is `passed`, but it neither selects nor evaluates `issued_at` or `fresh_until`. The signed certificate representation then omits those validity bounds, and the runtime service treats a matching certificate as current until the enclosing bundle expires. An expired certificate, a future certificate, or a certificate expiring during the publication window can therefore be signed into a current bundle and authorize execution.
- **Fix:** Bind each certificate's canonical issuance/freshness bounds into the signed payload and evaluate them at load and invocation, or require every selected certificate interval to cover the complete publication interval and cap publication validity accordingly. Add rejection tests for expired, not-yet-valid, and mid-publication-expiry certificates, including a service-backed execution test.

### CRITICAL-02 — Authority signatures do not authenticate the trust domain or key identity

- **Location:** `packages/persistence/src/runtime-evidence-authority-publisher.ts:1246-1259`, `packages/spec/src/runtime-evidence-authority-bundle.ts:657-680`, `packages/spec/src/runtime-evidence-authority-bundle.ts:746-791`
- **Issue:** Signing covers only the payload bytes; `schemaVersion`, `trustDomain`, `keyId`, `algorithm`, and the payload hash remain unsigned envelope labels. A signature remains valid after relabeling an envelope from one trust domain/key ID to another when the same public key is reachable under both labels. A read-only proof generated one Ed25519 signature, changed the fixture labels to production labels without resigning, and the inspector accepted the relabeled envelope. This defeats cryptographic domain separation and turns a key-reuse or key-configuration mistake into production authority.
- **Fix:** Sign and verify one canonical framed message containing the envelope schema version, trust domain, key ID, algorithm, payload hash, and exact payload bytes (or move all authority identity fields into the signed payload). Add negative vectors that relabel the domain, key ID, algorithm, and schema independently.

### CRITICAL-03 — The runtime service does not bind certified lane identity to the Strategy Revision it executes

- **Location:** `packages/spec/src/runtime-execution-service.ts:216-227`, `apps/runtime-service/src/execute-match.ts:194-208`, `apps/runtime-service/src/execute-match.ts:236-247`, `apps/runtime-service/src/execute-match.ts:518-610`
- **Issue:** The request supplies an opaque `laneIdentityHash`. Authority checking proves only that a mounted certificate contains the same hash, while the scheduling-decision hash is unkeyed and can be recomputed by the caller. Runtime construction later consumes `request.strategies[side]` independently and never derives the full lane identity from that revision's source/artifact, implementation, runtime, provider, toolchain, policy, corpus, build, and compatibility metadata. A read-only execution proof paired valid Strategy Revisions with unrelated certified lane hashes, recomputed the scheduling hashes, and received `ok: true` even though the executed artifact differed from the certified lane.
- **Fix:** Put the canonical lane expansion under signed authority, recompute its canonical hash from the exact immutable Strategy Revision and deployed runtime/toolchain metadata inside the runtime service, and require exact equality before constructing either runtime. Add source, artifact, runtime, toolchain, provider, policy, corpus, build, and revision swap tests.

### CRITICAL-04 — The production Go loader discards its anti-rollback uncertainty latch

- **Location:** `apps/go-backend/runtime_evidence_authority.go:176-209`, `apps/go-backend/runtime_evidence_authority.go:452-457`, `apps/go-backend/runtime_evidence_authority.go:506-512`
- **Issue:** A post-rename durability failure correctly sets `anchorUncertain` on the loader instance, but `loadProductionRuntimeEvidenceAuthorityFromEnvironment` constructs and discards a new loader on every call. The next load therefore forgets the uncertainty state and can accept a visible high-water file whose directory entry was never proven durable.
- **Fix:** Keep one process-long production loader (including its uncertainty latch), or persist a separate durable uncertain state that must be explicitly repaired before authority can load again. Test a post-rename parent-directory sync failure followed by a second production load through the environment wrapper; both it and later loads must fail closed.

### CRITICAL-05 — Go creation accepts certificates matching only a subset of executable lane identity

- **Location:** `apps/go-backend/integrity_creation.go:187-229`, `apps/go-backend/integrity_creation.go:238-255`
- **Issue:** `creationLaneMatchesEntrant` checks the semantic tuple, language, adapter, ABI, provider, and artifact hash, but omits runtime ID/version, toolchain ID/version, policy, corpus, artifact ID, implementation, and build. `resolveCreationEvidence` accepts the certificate selected by this partial comparison. A certificate for a distinct executable lane can therefore be attached during creation when the checked subset collides.
- **Fix:** Derive the complete canonical executable lane identity from the locked Strategy Revision and deployed runtime/toolchain registry, hash it with the shared language-neutral algorithm, and require exact equality with the signed certificate lane hash. Add one negative creation test per currently omitted identity component.

### CRITICAL-06 — Strategy Revision locking occurs after an unlocked snapshot and execution reloads mutable rows

- **Location:** `apps/go-backend/live_backend.go:2650-2671`, `apps/go-backend/live_backend.go:2787-2789`, `apps/go-backend/live_backend.go:2848-2857`, `apps/go-backend/orchestrator.go:208-224`, `apps/go-backend/orchestrator.go:260-340`
- **Issue:** Match Set creation loads revisions and resolves evidence before beginning its transaction, then marks revisions locked only after inserting Match/evidence rows. `loadOwnedEntrants` does not lock the selected revisions. A concurrent mutation can therefore occur between evidence derivation and `locked_at`. Later, runtime request construction reloads the live Strategy Revision rows independently and does not rebind their complete executable identities to the claimed evidence snapshot. The persisted evidence can describe one revision state while execution consumes another.
- **Fix:** Begin the transaction before loading entrants, select the exact revision rows `FOR UPDATE`, validate and derive full lane identity from those locked rows, and set `locked_at` in that same transaction before releasing the locks. At execution, use immutable claimed revision bytes/metadata or recompute and compare their complete lane hashes. Add a concurrent-update creation test and a post-claim revision/artifact swap test.

### WARNING-01 — TypeScript persistence cannot represent or claim containment-only exhibition entries

- **Location:** `packages/persistence/src/integrity-evidence.ts:308-343`, `packages/persistence/src/matchset-service.ts:124-154`, `packages/persistence/src/jobs.ts:155-168`
- **Issue:** The TypeScript integrity model requires `conformanceCertificateRef` for every entrant, its exhibition fixture fabricates a conformance reference while reporting `CONFORMANCE_MISSING`, and the TypeScript claim SQL inner-joins both conformance rows. This contradicts migration 0014's nullable conformance contract and the Go claim rule that exhibition entries must have no conformance certificate. A legitimate containment-only exhibition row cannot be created or claimed through the TypeScript path.
- **Fix:** Make conformance optional in the TypeScript model, hashes, writers, and query result parsing; require it only for counted entrants and omit/forbid it for exhibition entrants. Change the claim query to left joins with status-specific freshness/source predicates and add a real containment-only exhibition creation-to-claim test.

### WARNING-02 — TypeScript accepts calendar instants that Go correctly rejects

- **Location:** `packages/spec/src/runtime-evidence-authority-bundle.ts:201-212`, `packages/persistence/src/runtime-evidence-authority-publisher.ts:120-125`, `apps/go-backend/runtime_evidence_authority.go:782-786`
- **Issue:** The TypeScript authority parser checks an ISO-shaped regex and finite `Date.parse`, which normalizes impossible dates such as February 30 instead of rejecting them. Go uses strict `time.Parse` and rejects the same bytes. The publisher shares the weak TypeScript behavior, so it can emit authority that the Go backend refuses, violating the language-neutral canonical authority contract.
- **Fix:** Require exact round-trip equality (`new Date(parsed).toISOString() === input`) through one shared strict TypeScript parser, matching the existing attestation parser, and add cross-language vectors for impossible days, leap days, and boundary years.

### WARNING-03 — In-flight rechecks can accept an older authority after a newer publication is installed

- **Location:** `apps/go-backend/job_lifecycle.go:173-185`, `apps/go-backend/job_lifecycle.go:254-295`, `apps/go-backend/integrity_creation.go:318-342`
- **Issue:** Initial claim rejects a publication when a newer installed generation exists, but `recheckClaimedMatchIntegritySQL` omits that predicate. `lockInstalledAuthorityReceipt` likewise accepts any requested generation below the publication head rather than the latest installed generation. A job claimed under generation G1 can pass recheck/completion after G2 is installed, despite the current-generation rule applied at initial claim.
- **Fix:** Define one canonical installed-generation head and require it at creation, claim, in-flight recheck, runtime request construction, and completion. Re-run the current-generation predicate under the same transaction/lock used by each transition. Add an install-G2-between-claim-and-execute race test.

### WARNING-04 — Go readiness reports ignore persisted certificate status and freshness

- **Location:** `apps/go-backend/live_backend.go:2187-2205`, `apps/go-backend/live_backend.go:2257-2265`, `apps/go-backend/job_lifecycle.go:136-152`
- **Issue:** The readiness query loads each certificate's persisted status, issuance time, and freshness bound, but the decision path ignores those fields and classifies only from the signed representation, which has no certificate freshness. It can report an entrant as exhibition-ready or counted-ready after the claim path has correctly rejected its expired database certificate.
- **Fix:** Route public/operator readiness, creation, claim, and completion through one freshness-aware evidence evaluator using the same evaluation instant and exact authority generation. Add a clock-controlled test asserting that readiness flips closed at the same instant as claim eligibility.

### WARNING-05 — Go authority loader returns shallow mutable aliases of verified authority

- **Location:** `apps/go-backend/runtime_evidence_authority.go:524-536`
- **Issue:** `Load` and `Current` copy only the outer struct. Nested payload slices and their backing arrays remain shared with `lastGood`, so a caller can mutate a returned certificate, revocation, supersession, or lane-disable collection and silently alter later `Current` results without signature verification.
- **Fix:** Deep-clone every nested payload collection and nested reference slice when storing and returning verified authority, or expose an immutable query API instead of the structure. Add a mutation test proving that modifying a `Load` result cannot affect `Current` or a later `Load` result.

### WARNING-06 — HTTP body decoding depends on transport chunk boundaries

- **Location:** `apps/runtime-service/src/server.ts:58-69`
- **Issue:** `readBody` appends each `Buffer` chunk directly to a string. Node decodes each chunk independently, so a multi-byte UTF-8 code point split across TCP chunks is replaced with invalid characters. The same valid JSON Strategy request can therefore parse or fail depending only on network chunking, and the byte-limit check measures re-encoded replacement text rather than the received bytes.
- **Fix:** Accumulate bounded byte chunks and decode exactly once with a fatal UTF-8 decoder, or use `StringDecoder` while counting raw bytes incrementally. Add tests that split every byte boundary of a non-ASCII Strategy source and assert identical parsing and byte-limit behavior.

## Review Outcome

Status is **findings**. The critical issues affect the exact authority-to-execution binding, anti-rollback durability, and immutable revision guarantees required for a counted lane. Phase 256 should not be accepted as fail-closed until those paths are repaired and the resulting negative, race, and cross-language tests pass.
