# Feature Research

**Domain:** Coward's Game v1.35 runtime/account ownership, provider-proof, sandbox-readiness, and package-policy cleanup
**Researched:** 2026-06-14
**Confidence:** HIGH for repo-local feature candidates and hard boundaries; MEDIUM for exact implementation cost until the full v1.35 surface inventory is generated.

## Feature Landscape

### Table Stakes (Users Expect These)

Features players, operators, and future roadmap phases should be able to assume after v1.35. Missing these leaves the product with misleading ownership, runtime, or privacy posture.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| v1.35 surface inventory and decision register | The milestone exists to clean up account save, owner-debug, provider-proof, sandbox, and package edges; requirements need exact surfaces before edits begin. | MEDIUM | Candidate `INV-01`: inventory account save, account-owned revision source reads, owner-debug/private replay, Workshop compatibility aliases, competition entry, Go-owned reads/writes, provider-proof, sandbox-claim, package/dependency, and TinyGo surfaces. Classify each as fix-now, quarantine, deprecate, or future. |
| Go TypeScript account-save provider-proof parity | TypeScript is counted eligible through provider proof, but current Go account save still uses local substring validation and the Go runtime-service client rejects TypeScript validation. | HIGH | Candidate `ACCT-01`: Go `createStrategyRevision` must call runtime-service provider validation for TypeScript when saving execution-eligible account revisions, store source-artifact/provider-proof metadata, and fail closed or explicitly save only as non-execution draft when proof is unavailable. |
| Account revision intent states | Account save may reasonably support drafts, but a draft must not look eligible for Match, MatchSet, ladder, or public proof use. | MEDIUM | Candidate `ACCT-02`: distinguish `draft_storage`, `provider_validated_revision`, and `invalid_revision` states. Draft storage may preserve private source for the owner but must carry no counted/readiness claim. |
| Unified Go and TypeScript counted-entry gates | Players expect a saved revision that enters counted competition to satisfy the same eligibility rules regardless of whether the route is Go-owned or persistence-owned. | HIGH | Candidate `ENTRY-01`: require current provider-grade proof for TypeScript, Python, Rust, and Zig in every counted Go/persistence entry path. Candidate `ENTRY-02`: non-counted exhibition gates must still reject unsupported providers, stale artifacts, hidden TinyGo, and incompatible package/runtime metadata. |
| Local Workshop trust shortcut quarantine | `player:workshop-local` is useful for anonymous local Workshop testing, but it must not authorize persisted account-owned/private behavior. | MEDIUM | Candidate `AUTH-01`: restrict `player:workshop-local` and no-auth local shortcuts to ephemeral Workshop/test-only flows. Persisted account revisions, private source, owner-debug replay, and account-owned analytics must use server-side account/session authorization. |
| Server-authorized owner-debug/private replay | The specs allow owner inspection of private replay/debug data, but public/default outputs must omit Strategy source, StrategyMemory, SoldierMemory, and objective payloads. | HIGH | Candidate `PRIV-01`: owner-debug replay options must be authorized server-side from the current account/session or internal test token, not by query parameters or local player ids alone. Candidate `PRIV-02`: public replay/result/default DTOs must prove ownerDebug, ownerPrivate, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids, source, artifact bytes, host paths, env values, tokens, DB details, package paths, and private runtime internals are absent. |
| Workshop compatibility alias decision | Old Workshop source/submit aliases create unclear ownership and auth semantics once account-owned revisions and provider proof matter. | LOW | Candidate `API-01`: inventory `/api/workshop/source`, `/api/workshop/revisions/[revisionId]/source`, `/api/workshop/submit`, and related aliases. Remove, hide, migrate, or mark deprecated with tests and public-safe errors. |
| Sandbox-readiness/certification contract | Current evidence supports provider containment and artifact/provenance claims, not broad production sandbox certification. | MEDIUM | Candidate `SBOX-01`: define labels and evidence states for current runtime containment, hostile-code evidence, candidate lanes, unavailable lanes, and production sandbox certification. Candidate `SBOX-02`: fail loudly if UI/docs/API evidence imply certification without the named evidence checklist passing. |
| Honest runtime/product labels | Supported counted languages still have different isolation postures: TypeScript/Python source-artifact provenance, Rust/Zig WASM/WASI artifacts, TinyGo hidden spike-only. | MEDIUM | Candidate `LABEL-01`: public/developer labels must say TypeScript/Python are provenance-only, Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed, and TinyGo is spike-only/hidden. No lane should silently claim stronger isolation than it proves. |
| Package/dependency ecosystem policy | The specs forbid package installation and current runtime metadata expects package mode `none`; users will ask for packages eventually. | MEDIUM | Candidate `PKG-01`: codify per-language v1.35 policy: TypeScript no imports/packages; Python no imports/packages; Rust/Zig self-contained/no external crates or Zig packages; TinyGo no production packages because TinyGo remains hidden. Candidate `PKG-02`: document future package-lane requirements for supply chain, lockfiles, native code, deterministic builds, privacy, and runtime-boundary proof. |
| Diagnostics, privacy scans, boundary monitors, and service-backed proof | This milestone changes trust boundaries; tests must prevent quiet regressions. | HIGH | Candidate `PROOF-01`: add unit/integration/API tests, privacy scans, boundary monitors, and at least one service-backed proof covering corrected account/provider-proof behavior plus sandbox/package-policy gates. |

### Differentiators (Competitive Advantage)

These features are not generic gameplay features; they make Coward's Game unusually credible as a programmable competition platform.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Provider-proof-backed account ownership | Account-owned Strategy Revisions become trustworthy execution assets, not just saved source blobs. | HIGH | Differentiates saved revision UX by binding owner, source hash/bytes, artifact hash/bytes where applicable, provider id, contract version, runtime ABI, and eligibility state. |
| Public-safe private-debug model | Players can debug their own Strategies without leaking private Strategy information to spectators or opponents. | HIGH | Depends on server authorization and projection scans. This should become an explicit trust story for replay/result pages. |
| Fail-loud sandbox claim taxonomy | The product can support multiple runtime lanes while avoiding ambiguous "sandboxed" marketing claims. | MEDIUM | Keeps roadmap honest: readiness evidence, provider containment, WASM artifact backing, and production certification are separate states. |
| Cross-language no-package policy with future expansion criteria | Instead of ad hoc package refusals, each language gets a consistent policy and future approval checklist. | MEDIUM | Supports future package milestones without allowing hidden package-path, host-path, native-code, or token leaks now. |
| Account/provider-proof drift monitors | The system can detect when Go, TypeScript persistence, Workshop, and competition gates diverge again. | MEDIUM | Converts v1.35 cleanup into a durable guardrail for v1.36 competition maturity. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| "Production sandbox certified" badge for current lanes | It sounds reassuring and simpler for users. | v1.24 and v1.35 context explicitly say current evidence is not broad production sandbox certification. Overclaiming creates security and trust risk. | Use precise labels: provider-contained, provenance-only, WASM/WASI artifact-backed, candidate-readiness-only, or certified only after the named checklist passes. |
| Broad npm/PyPI/Cargo/Zig package support | Strategy authors want familiar ecosystems. | Packages add supply-chain, native-code, nondeterminism, build reproducibility, filesystem, network, path, token, and privacy risks. | Keep package mode `none` in v1.35; define future package-lane requirements. |
| No-auth local identity for persisted owner/private behavior | It makes local Workshop links easy. | `player:workshop-local` can become an authorization bypass when used for persisted owner-debug, account-owned source, or private replay data. | Quarantine to ephemeral Workshop/test-only use; require server account/session or internal test token for persisted private access. |
| Compatibility aliases as permanent APIs | Old clients and tests may depend on simple paths. | Aliases hide auth/provider semantics and encourage bypassing newer account-safe routes. | Remove or deprecate with explicit tests, migration paths, and safe error responses. |
| TypeScript account save as "valid" from local Go heuristics | It avoids a runtime-service dependency. | It drifts from provider-proof counted eligibility and can mislabel execution readiness. | Runtime-service provider validation for execution-eligible revisions; otherwise save as non-execution draft only. |
| Strategy execution in web/API/Go | It would simplify orchestration and validation calls. | Violates project non-negotiables and architecture specs; Go/API cannot be the hostile-code boundary. | Keep hostile validation/build/execution behind runtime-service / Runtime Broker / provider boundaries. |
| TinyGo production visibility | It extends the multi-language story. | TinyGo remains spike-only after v1.33 and must not appear in production Workshop, submit/save, entry, result, replay, or public evidence surfaces. | Keep hidden; require a future productionization milestone. |
| ABI migration or direct exports/WIT promotion | It may improve WASM ergonomics. | v1.35 is cleanup; Rust/Zig must remain WASM/WASI Preview 1 stdin/stdout JSON unless a future ABI milestone proves migration. | Keep active ABI stable and record future migration criteria only. |
| Public raw diagnostics/private runtime evidence | Developers may ask for easier debugging. | Public/default output must not leak source, memory, objectives, raw diagnostics, host paths, env values, tokens, DB details, package paths, artifact bytes, or private runtime internals. | Normalize public diagnostics; expose deeper data only through server-authorized owner/internal paths with scans. |

## Feature Dependencies

```text
Surface Inventory
    ├──requires──> Source docs/spec baseline
    ├──enables──> Go TypeScript Provider-Proof Parity
    ├──enables──> Local Trust Shortcut Quarantine
    ├──enables──> Compatibility Alias Decision
    ├──enables──> Sandbox Certification Contract
    └──enables──> Package Policy Contract

Go TypeScript Provider-Proof Parity
    └──requires──> runtime-service TypeScript validation support in Go client
        └──enables──> Unified Counted Entry Gates
            └──enables──> Service-Backed Account/Entry Proof

Account Revision Intent States
    ├──requires──> Go account-save provider-proof decision
    └──enables──> Honest UI/API labels for draft vs execution-eligible revision

Local Trust Shortcut Quarantine
    └──requires──> Server-side account/session owner authorization
        └──enables──> Owner-Debug/Private Replay Proof

Sandbox Certification Contract
    ├──requires──> v1.24 readiness matrix baseline
    └──enables──> Fail-Loud Runtime Labels and Boundary Monitors

Package Policy Contract
    └──requires──> current runtime registry/package mode inventory
        └──enables──> Package Diagnostics and Privacy Scans

Compatibility Alias Decision
    └──conflicts──> Treating legacy Workshop source/submit aliases as first-class account-owned APIs
```

### Dependency Notes

- **Inventory before fixes:** v1.35 has many affected surfaces. A surface matrix should be Phase 1 because roadmap requirements need exact paths, current owner, trust level, privacy class, and action.
- **TypeScript proof before entry parity:** Go counted entry cannot be trusted until TypeScript account-save metadata can carry the same provider proof expected by persistence ladder/competition gates.
- **Draft labeling before relaxed save behavior:** If account save is allowed without provider proof, the product must first have a draft/non-execution state that cannot enter counted play or imply runtime readiness.
- **Authorization before owner-debug UX:** Query parameters can request owner debug, but only server-side account/session or internal test authorization should grant private replay data.
- **Sandbox contract before labels:** UI/docs/API labels need a shared taxonomy or they will continue mixing readiness, containment, artifact backing, and certification.
- **Package policy before package diagnostics:** Diagnostics and privacy scans need the policy names and forbidden evidence fields before they can be reliable.
- **Alias decision before compatibility tests:** Deprecated aliases need explicit expected behavior; otherwise tests will preserve accidental bypasses.

## MVP Definition

### Launch With (v1.35)

Minimum viable v1.35: close misleading trust gaps and produce evidence. This is the must-have cleanup set.

- [ ] `INV-01` Surface inventory and decision register covering account save, account-owned source reads, owner-debug/private replay, Workshop aliases, competition entry, Go-owned reads/writes, provider proof, sandbox claims, package policy, and TinyGo.
- [ ] `ACCT-01` TypeScript Go account-save provider-proof parity or explicit non-execution draft storage with no eligibility/readiness claim.
- [ ] `ACCT-02` Account Revision intent/status labels separating draft, invalid, and provider-validated execution-eligible revisions.
- [ ] `ENTRY-01` Unified counted eligibility gates across Go and persistence for TypeScript, Python, Rust, and Zig.
- [ ] `AUTH-01` Quarantine `player:workshop-local` and no-auth shortcuts away from persisted account-owned/private behavior.
- [ ] `PRIV-01` Server-authorized owner-debug/private replay access.
- [ ] `PRIV-02` Public/default privacy scans proving private replay/debug/source/memory/objective/runtime/package evidence is absent.
- [ ] `API-01` Compatibility alias decision for old Workshop source/submit routes with tests.
- [ ] `SBOX-01` Sandbox-readiness/certification contract and evidence checklist.
- [ ] `LABEL-01` Fail-loud runtime/product labels that avoid unsupported sandbox claims.
- [ ] `PKG-01` Enforced no-rich-package/no-host-import policy for TypeScript, Python, Rust, Zig, and hidden TinyGo.
- [ ] `PROOF-01` Focused tests, boundary monitors, and at least one service-backed account/provider-proof plus sandbox/package-policy proof.

### Add After Validation (v1.36)

These belong in Competition Maturity after v1.35 closes the trust boundary.

- [ ] Mature season/entry posture using v1.35 provider-proof gates as the input.
- [ ] Counted/non-counted/degraded/disputed/invalidated competition explanations and standings recomputation.
- [ ] Abuse/dispute/account-recovery policy surfaces for public beta competition.
- [ ] Public trust UX for eligibility, counted status, season reset policy, and replay/result evidence.
- [ ] End-to-end entry -> counted MatchSet -> execution -> result -> standings -> replay proof.

### Future Consideration (v2+)

Defer until explicitly scoped and evidenced.

- [ ] Production sandbox certification for any lane beyond current provider-containment evidence.
- [ ] Rich package/dependency ecosystems for TypeScript, Python, Rust, Zig, or TinyGo.
- [ ] TinyGo production Workshop/entry/replay support.
- [ ] Direct exports or Component Model/WIT ABI migration.
- [ ] Durable permanent ratings or formal tournament governance beyond v1.36 policy.
- [ ] Public publishing of additional private replay details by players.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Surface inventory and decision register | HIGH | MEDIUM | P1 |
| Go TypeScript account-save provider-proof parity | HIGH | HIGH | P1 |
| Account revision intent/status labels | HIGH | MEDIUM | P1 |
| Unified counted-entry gates | HIGH | HIGH | P1 |
| Local Workshop trust shortcut quarantine | HIGH | MEDIUM | P1 |
| Server-authorized owner-debug/private replay | HIGH | HIGH | P1 |
| Public/default privacy scans | HIGH | MEDIUM | P1 |
| Compatibility alias decision | MEDIUM | LOW | P1 |
| Sandbox-readiness/certification contract | HIGH | MEDIUM | P1 |
| Fail-loud runtime/product labels | HIGH | MEDIUM | P1 |
| Package/dependency no-rich-package policy | HIGH | MEDIUM | P1 |
| Service-backed account/provider-proof and policy proof | HIGH | HIGH | P1 |
| Competition maturity policy | HIGH | HIGH | P2 |
| Durable ratings/governance | MEDIUM | HIGH | P3 |
| Rich package ecosystems | MEDIUM | HIGH | P3 |
| TinyGo production support | LOW | HIGH | P3 |
| ABI migration to direct exports/WIT | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.35 cleanup
- P2: Should have in a later near-term milestone after v1.35 gates exist
- P3: Future consideration requiring separate proof

## Competitor Feature Analysis

This research is scoped to repo-local product/runtime trust surfaces, not external competitors. The useful comparison for roadmap purposes is between Coward's Game internal baselines:

| Feature | Earlier/Internal Baseline | v1.35 Approach |
|---------|---------------------------|----------------|
| Workshop validation | v1.34 provider-grade checker parity for four production languages. | Reuse that evidence for account save/entry gates and close Go TypeScript drift. |
| Source-language artifact proof | v1.33 TypeScript/Python provenance-only artifact evidence. | Keep provenance-only wording and require provider proof where eligibility depends on it. |
| WASM/WASI languages | v1.32 counted Rust/Zig through immutable Preview 1 artifacts; v1.24 no production sandbox certification. | Preserve Rust/Zig artifact-backed labels without ABI migration or certification claims. |
| TinyGo | v1.33 spike/defer recommendation. | Keep hidden from production surfaces and package policy. |
| Owner-debug replay | Older local Workshop/test paths include `player:workshop-local` and query-based owner-debug request shape. | Require server-authorized owner/private access for persisted data and prove public absence. |
| Package policy | Current registry/package metadata expects package mode `none`; future package support deferred. | Make no-package policy explicit per language and block hidden package-path/host-path/private evidence leaks. |

## Implementation-Ready Requirement Candidate Groups

### Group A: Inventory and Decisions

- `INV-01`: Generate a v1.35 surface inventory covering account save, account-owned revisions/source reads, owner-debug/private replay, Workshop compatibility aliases, competition entry, Go-owned read/write surfaces, provider-proof, sandbox-claim, package/dependency, and TinyGo surfaces.
- `INV-02`: Classify every surface as fix-now, quarantine, deprecate/remove, document-only, or future; record owner, trust boundary, public/private data class, and required tests.

### Group B: Account Save and Provider Proof

- `ACCT-01`: Make Go runtime-service validation accept TypeScript provider validation.
- `ACCT-02`: Make Go TypeScript account save store provider runtime, validation, engine compatibility, source-artifact metadata, and provider-proof metadata equivalent to Workshop submit/save.
- `ACCT-03`: If runtime-service is unavailable, save only as explicitly non-execution draft or fail with a calm unavailable state; never mark provider-ready/countable from local heuristics.
- `ACCT-04`: Normalize Go runtime-service validation errors into public-safe categories without raw failure code/message leakage by default.

### Group C: Entry Eligibility and Go/Persistence Parity

- `ENTRY-01`: Counted Go exhibition, persistence competition, and ladder gates must require provider proof for TypeScript, Python, Rust, and Zig.
- `ENTRY-02`: Non-counted exhibitions must still enforce valid owner, valid revision, registered runtime metadata, package mode `none`, no hidden TinyGo, no stale/missing/mismatched artifacts, and no silent fallback.
- `ENTRY-03`: Add parity tests proving Go and persistence agree on eligible, draft, invalid, stale-proof, unsupported-provider, package-declared, and TinyGo cases.

### Group D: Ownership, Local Trust, and Private Replay

- `AUTH-01`: Restrict `player:workshop-local` to ephemeral local Workshop/test-only flows and block it from account-owned revision, private source, owner-debug replay, and persisted private analytics authorization.
- `AUTH-02`: Account-owned source reads must require the current server-authorized account/session and return private/no-store responses.
- `PRIV-01`: Owner-debug/private replay must require server-side owner authorization or internal test authorization; query parameters may request debug but cannot grant it.
- `PRIV-02`: Public replay/result/default outputs must omit ownerDebug, ownerPrivate, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids, raw diagnostics, host paths, env values, tokens, DB details, package paths, artifact bytes, and private runtime internals.

### Group E: Workshop Compatibility Aliases

- `API-01`: Decide fate of legacy Workshop aliases such as submit/source endpoints.
- `API-02`: If removed, return explicit migration-safe errors. If retained, mark deprecated/test-only/local-only and prove they cannot access account/private/provider-eligible behavior incorrectly.
- `API-03`: Tests must cover both canonical and alias routes so old paths do not bypass provider-proof, auth, or privacy rules.

### Group F: Sandbox-Readiness and Labels

- `SBOX-01`: Publish a versioned sandbox-readiness/certification contract distinguishing runtime containment, hostile-code evidence, artifact/provenance evidence, candidate-readiness, unavailable lanes, and production certification.
- `SBOX-02`: Define evidence required before any lane can claim production sandbox certification; leave current lanes uncertified unless that checklist is completed.
- `LABEL-01`: Update public/developer labels so TypeScript/Python say provenance-only, Rust/Zig say immutable WASM/WASI Preview 1 artifact-backed, and TinyGo says hidden/spike-only only in internal docs.
- `LABEL-02`: Add fail-loud monitors for forbidden phrases or claim drift such as TypeScript/Python WASM isolation, broad production sandbox certification, TinyGo production support, or active direct/WIT ABI.

### Group G: Package and Dependency Policy

- `PKG-01`: Define current package policy per language: no TypeScript imports/packages, no Python imports/packages, no Rust external crates/package install, no Zig package/std host imports beyond approved no-std/helper lane, no TinyGo production package support.
- `PKG-02`: Enforce package mode `none` in account save, Workshop, entry, runtime registry, compatibility keys, and public evidence.
- `PKG-03`: Add diagnostics for package/dependency rejection that are public-safe and do not expose package paths, host paths, env values, tokens, DB details, artifact bytes, raw compiler/runtime output, or private runtime internals.
- `PKG-04`: Document future package support requirements: reproducible dependency resolution, lockfiles, native-code policy, sandboxed build/install, deterministic outputs, vulnerability policy, cache invalidation, privacy redaction, and rollback.

### Group H: Verification and Proof

- `PROOF-01`: Unit/integration tests for account-save/provider-proof states across TypeScript, Python, Rust, and Zig.
- `PROOF-02`: Service-backed proof that a TypeScript account revision saved through Go carries provider proof and can enter counted eligibility only with matching source/artifact identity.
- `PROOF-03`: Privacy scans over account source routes, owner-debug replay, public replay/result, Workshop aliases, checker/provider proof, package diagnostics, logs/fixtures where relevant, and proof artifacts.
- `PROOF-04`: Boundary monitors proving no Strategy execution moved into web/API/Go, TinyGo remains hidden, TypeScript/Python remain provenance-only, Rust/Zig remain Preview 1 artifact-backed, package mode stays `none`, and no unsupported sandbox claim appears.

## Sources

- `.planning/PROJECT.md`
- `.planning/STATE.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/MILESTONES.md`
- `.planning/artifacts/v1.35-v1.36-milestone-prompts.md`
- `.planning/artifacts/v1.34-workshop-checker-contract.md`
- `.planning/artifacts/v1.34-workshop-checker-inventory.md`
- `.planning/artifacts/v1.34-workshop-checker-proof.md`
- `.planning/artifacts/v1.32-four-language-parity-matrix.md`
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md`
- `CowardsGameSpec_Full_Consolidated_v1.md`
- `CowardsGame_Technical_Architecture_Spec_V1.md`
- Code surface scan of `apps/web`, `apps/go-backend`, `apps/runtime-service`, `packages/spec`, `packages/runtime-js`, `packages/runtime-python`, `packages/runtime-wasm-wasi`, and `packages/persistence`.

---
*Feature research for: Coward's Game v1.35*
*Researched: 2026-06-14*
