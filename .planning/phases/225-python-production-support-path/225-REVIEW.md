# Phase 225 Review: Python Production Support Path

## Findings

### Fixed: Go Python Save Validation Bypassed Provider Validator

The first review found that Go saved Python revisions with a local substring scanner while tagging them as counted/provider. That could allow invalid Python to become counted if the scanner missed an AST-level forbidden capability.

**Resolution:** Python account revision saves now call runtime-service `/validate-strategy`, the Go client accepts Python validation responses, runtime-service validates Python through `@cowards/runtime-python`, and the local Go scanner was removed.

### Fixed: Python Adapter Overclaimed Production Sandbox Certification

The first review found that the Python adapter was marked `production-counted` while the runtime host remains a constrained Python subprocess and not a broad OS/container sandbox.

**Resolution:** The adapter now stays `evidence-only` while counted eligibility is scoped to the constrained provider path. Registry and artifact wording explicitly avoid broad sandbox certification claims.

### Fixed: Historical Python Exhibition Relabeling

The first review found that result pages counted Python by language id only, which could relabel historical non-counted Python exhibition results as counted.

**Resolution:** MatchSet result summaries now respect stored `non_counted` governance and contract non-counted language evidence before classifying entrant labels.

## Status

### Fixed: Historical Python Beta Revisions Could Enter Counted Play

The second review found that older Python beta revisions had the same runtime metadata shape as promoted Python and could pass counted gates without proving provider validation.

**Resolution:** Python counted entry now requires `metadata.providerValidation` with `strategy-language-provider-python`, the v1.32 provider contract, and a matching source hash. Go and TypeScript persistence gates both enforce this provenance before counted entry.

### Fixed: Python Helper Functions Failed At Runtime

The second review found that Python helper functions were stored only in the `exec` locals namespace, so a validated sample using a helper could throw at runtime.

**Resolution:** The Python runtime host now executes with one constrained namespace, and persistence tests execute every bundled Python starter sample through the Python provider runtime.

## Status

### Fixed: Workshop Python Saves Bypassed Runtime-Service Validation

The final review found that web Workshop submissions could still locally build Python revisions and mint `providerValidation` without calling runtime-service.

**Resolution:** `POST /api/workshop/revisions` now routes Python through runtime-service `/validate-strategy`, the Workshop server rejects Python submissions unless runtime-service validation is explicitly present, and the route/test coverage proves Python provider provenance cannot be locally minted through the submitted save path.

## Status

### Fixed: Local Workshop Builder Could Mint Provider Provenance

The final review found that `buildWorkshopRevision()` could still fall through to local Python revision construction, which meant provider provenance was not strictly runtime-service evidence.

**Resolution:** `buildWorkshopRevision()` now rejects Python unless `runtimeServiceValidated === true` with complete provider metadata. `buildPythonStrategyRevision()` no longer creates `providerValidation`; runtime-service `/validate-strategy` is the provenance authority.

## Status

### Fixed: Provider Provenance Needed Tamper-Resistant Proof

The final narrow review pass hardened the provenance field so stale or locally forged metadata cannot satisfy counted gates by shape alone.

**Resolution:** runtime-service now signs Python provider validation with an HMAC proof over provider id, contract version, source hash, and source bytes. Go and TypeScript counted-entry gates verify that proof with constant-time comparison, local Python builders strip any inbound `providerValidation`, and verification fails closed when `COWARDS_PROVIDER_VALIDATION_SECRET` is not configured.

## Status

### Fixed: Workshop Trusted Caller-Supplied Source Hashes

The final narrow review found that Workshop persistence could trust a caller-provided validation hash even if the submitted source text had changed after provider validation.

**Resolution:** Workshop Python persistence now recomputes source hash and byte count from the submitted source and rejects mismatches before saving.

### Fixed: Historical Python Revisions Listed As Counted Selectable

The final narrow review found that account/listing semantics could still show historical Python beta revisions as counted eligible by runtime metadata alone.

**Resolution:** account revision listing semantics now downgrade Python revisions without matching, verifiable provider provenance; Go account summaries use revision-aware runtime semantics with the same provenance gate.

## Status

Final narrow re-review found no remaining P1/P2 issues.
