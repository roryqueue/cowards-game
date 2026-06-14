# Project Research Summary

**Project:** Coward's Game
**Milestone:** v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup
**Domain:** Deterministic programmable strategy game runtime/account/security-policy cleanup
**Researched:** 2026-06-14
**Confidence:** HIGH

## Executive Summary

Coward's Game is a deterministic two-player programmable strategy game where account-owned immutable Strategy Revisions eventually become competition assets. Experts would build this by keeping the pure engine isolated from product/UI concerns, keeping hostile Strategy validation/build/execution behind a dedicated runtime-service/provider boundary, and making every public replay/result/account surface a redacted projection rather than a leak of runtime internals. v1.35 is therefore not a new runtime or product-feature expansion milestone; it is a contract and trust-boundary cleanup milestone.

The recommended approach is to keep the existing stack and close drift between surfaces. `@cowards/spec` should own provider-proof, readiness-label, package-policy, and privacy vocabulary. Go should remain the normal backend owner for account persistence, ownership checks, entry gates, Match orchestration, and public evidence, but it must call runtime-service for provider validation when a revision is represented as execution-ready or entry-eligible. The urgent concrete gap is TypeScript account save in Go: Workshop checker/submit and persistence competition already use provider-grade TypeScript proof, while Go account save still has local TypeScript validation and its runtime-service client rejects TypeScript validation.

The largest risks are misleading trust claims and private-data leakage. Provider proof is not sandbox certification; TypeScript/Python artifact provenance is provenance evidence, Rust/Zig remain immutable WASM/WASI Preview 1 artifact-backed, and TinyGo stays spike-only and hidden. Public/default output must not expose raw diagnostics, Strategy source, artifacts, provider proofs, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads. Mitigate these risks with an inventory-first phase, spec-owned labels, fail-closed provider-proof gates, server-authorized owner-debug, no-package enforcement, privacy scans, boundary monitors, and one service-backed product-flow proof.

## Key Findings

### Recommended Stack

No new platform, runtime broker, package manager, auth provider, sandbox brand, or observability service is recommended for v1.35. The cleanup should tighten existing contracts, Go/runtime-service integration, public-safe diagnostics, and monitor/proof scripts around the current monorepo. The milestone should add a focused v1.35 evaluator, likely `scripts/evaluate-v1-35-runtime-account-policy.ts`, and wire it into `pnpm boundary:monitors`.

**Core technologies:**
- `@cowards/spec`: runtime/provider/package/privacy/checker contracts - extend here so Go, web, runtime-service, tests, and monitors share one vocabulary.
- `apps/runtime-service`: Strategy Execution Service / Runtime Broker HTTP+JSON boundary - keep provider validation/build/proof and Strategy execution here.
- Go backend: account-owned Strategy Revision persistence, session/owner checks, selected entry gates, orchestration, and public-safe evidence - extend its runtime-service client and eligibility checks.
- TypeScript workspace packages: web, spec, runtime clients, scripts, tests - use Zod and existing contract tests for DTO and privacy validation.
- PostgreSQL and `@cowards/persistence`: canonical persistence and existing strict provider-proof reference paths - reuse as semantic reference for Go parity.
- HMAC SHA-256 provider proof: existing provider proof binding source/artifact identity - reuse with `COWARDS_PROVIDER_VALIDATION_SECRET`.
- Playwright, Vitest, Go tests, and boundary monitors: existing verification stack - add focused v1.35 proof rather than a new test framework.

Critical version/compatibility baselines remain `pnpm@11.1.2`, TypeScript `^6.0.3`, Go `1.25.0`, Next `^16.2.6`, React `^19.2.6`, `strategy-language-provider-contract-v1.33`, and `strategy-runtime-abi-v1.14`. Rust/Zig stay on WASI Preview 1 stdin/stdout JSON; no Component Model/WIT or direct-export migration is in scope.

### Expected Features

**Must have (table stakes):**
- v1.35 surface inventory and decision register - classify account save, revision reads, owner-debug, aliases, entry, provider-proof, sandbox-claim, package-policy, and TinyGo surfaces before behavior changes.
- Go TypeScript account-save provider-proof parity - valid/execution-ready TypeScript account revisions must be runtime-service provider validated or explicitly non-execution drafts.
- Account revision intent/readiness states - separate draft storage, invalid revisions, unavailable/system states, and provider-validated execution-ready revisions.
- Unified counted-entry gates - Go and persistence entry paths must require provider proof for TypeScript, Python, Rust, and Zig and reject stale/missing/mismatched artifacts.
- Local Workshop trust shortcut quarantine - `player:workshop-local` must remain ephemeral/test-local and never authorize persisted account/private behavior.
- Server-authorized owner-debug/private replay - query params can request owner view, but server-side account/session or internal test authorization must grant it.
- Compatibility alias decision - remove, hide, migrate, or deprecate old Workshop source/submit aliases with tests.
- Sandbox-readiness/certification contract - distinguish readiness evidence, provenance, artifact backing, candidate lanes, unavailable lanes, and actual certification.
- Package/dependency policy enforcement - keep production `package.mode = "none"` and no host imports/packages across all production languages.
- Diagnostics, privacy scans, boundary monitors, and service-backed proof - prove the corrected account/provider-proof and policy gates.

**Should have (competitive):**
- Provider-proof-backed account ownership - saved Strategy Revisions become trustworthy execution assets instead of source blobs.
- Public-safe private-debug model - owners can debug without leaking private Strategy data to spectators or opponents.
- Fail-loud sandbox claim taxonomy - public/developer copy cannot silently escalate readiness evidence into certification.
- Cross-language no-package policy with future expansion criteria - current refusal is consistent, and future package work has explicit gates.
- Account/provider-proof drift monitors - durable guardrails before v1.36 competition maturity.

**Defer (v2+ or future milestone):**
- Production sandbox certification for any lane.
- Rich npm/PyPI/Cargo/Zig package ecosystems.
- TinyGo production Workshop/entry/replay support.
- Direct exports or Component Model/WIT ABI migration.
- Durable ratings/governance and broader competition policy beyond v1.36.
- Public publishing of additional private replay/debug data.

### Architecture Approach

v1.35 should integrate as a contract cleanup on top of the existing Go-owned backend plus runtime-service/provider boundary. Web displays labels and normalized diagnostics only. Go persists account-owned revisions, authorizes owners, gates entries, orchestrates jobs, and builds public-safe evidence. Runtime-service owns hostile Strategy validation/build/proof and execution. The pure engine and Chronicle remain deterministic, serializable, side-effect free, and independent of React, Go persistence, filesystem, time, network, and random sources.

**Major components:**
1. Web UI and API routes - transport, schema validation, Workshop/account/replay UX, public-safe projections, no Strategy execution.
2. Go backend - account/session ownership, revision persistence, entry gates, Match lifecycle, scoring, public evidence, runtime-service client.
3. Runtime-service / Runtime Broker / providers - provider validation/build/proof, TypeScript/Python source artifacts, Rust/Zig WASM/WASI artifacts, runtime execution adapters, redacted diagnostics.
4. PostgreSQL and persistence packages - immutable Strategy Revisions, provider metadata, jobs, Matches, Chronicles, results, governance events.
5. Pure engine and Chronicle - deterministic game rules and replay reconstruction only.
6. Spec/contracts/monitors - canonical provider registry, readiness/package/privacy labels, boundary drift checks, service-backed proof scripts.

### Critical Pitfalls

1. **TypeScript account save looks provider-proofed but still uses local trust** - make Go `validateStrategy` accept TypeScript and require provider proof for execution-ready saves and entry, or label saves as non-execution drafts.
2. **Local Workshop identity becomes persisted account ownership** - quarantine `player:workshop-local` to local/test Workshop flows and derive persisted private access from server-authenticated ownership.
3. **Owner-debug privacy is protected by UI state instead of server authorization** - public/default replay DTOs must remain redacted unless a server-side owner/participant check returns an owner-private projection.
4. **Sandbox readiness labels become production certification claims** - add spec-owned labels and negative claim monitors; current lanes are evidence/candidates, not certified sandboxes.
5. **Package policy is treated as message rather than boundary** - enforce exact `package.mode = "none"` and no host imports/packages in validation, storage, entry, execution request construction, and diagnostics.
6. **Runtime-service failure becomes Strategy invalid or falls back locally** - unavailable/system states must be non-eligibility states, never local hostile-code fallback in web/API/Go.
7. **Public evidence leaks private runtime or artifact data** - normalize to public categories, hashes, byte counts, provider ids, contract versions, and redaction metadata; scan API JSON, UI, logs, fixtures, and proof artifacts.

## Implications for Roadmap

Based on research, suggested phase structure continuing after Phase 242:

### Phase 243: Boundary Surface Inventory and Contract Lock

**Rationale:** v1.35 touches many trust surfaces; roadmap work should start by locating every path and deciding fix, quarantine, deprecate/remove, document-only, or future.  
**Delivers:** Surface inventory and decision register for account save, account-owned revision reads, owner-debug/private replay, Workshop aliases, Go read/write surfaces, entry gates, provider proof, sandbox claims, package policy, TinyGo, and privacy monitors.  
**Addresses:** `INV-01`, `INV-02`, contract baseline for all later groups.  
**Avoids:** Compatibility alias bypass, unscoped privacy leaks, accidental candidate-lane promotion.

### Phase 244: Account-Owned Revision and Provider-Proof Gate Cleanup

**Rationale:** TypeScript Go account save is the central drift point and must be fixed before entry parity or product labels can be trusted.  
**Delivers:** Go runtime-service client accepts TypeScript validation; execution-ready account saves store provider metadata/proof and source/artifact identity; unavailable runtime-service fails closed or saves only explicit non-execution drafts; public-safe account-save failures.  
**Addresses:** `ACCT-01` through `ACCT-04`, draft/readiness states, TypeScript parity.  
**Uses:** `apps/runtime-service`, Go runtime-service client, `@cowards/spec`, HMAC proof, existing persistence proof semantics.  
**Avoids:** TypeScript local trust, unavailable fallback, misleading `ready` labels.

### Phase 245: Account Ownership, Owner-Debug, and Compatibility Alias Cleanup

**Rationale:** Once account revisions carry trustworthy proof states, private source/replay access and legacy aliases must not bypass owner or proof boundaries.  
**Delivers:** `player:workshop-local` quarantine; server-authorized owner-debug/private replay; account-owned source reads require authenticated ownership; old Workshop alias policy implemented with removal/gating/deprecation tests.  
**Addresses:** `AUTH-01`, `AUTH-02`, `PRIV-01`, `PRIV-02`, `API-01` through `API-03`.  
**Avoids:** Local Workshop identity as ownership, query-param authorization, compatibility aliases bypassing current contracts.

### Phase 246: Sandbox-Readiness Claims Contract and Fail-Loud Labels

**Rationale:** Claim calibration must be contract-backed before UI/docs/API evidence expands in the proof phase.  
**Delivers:** Spec-owned readiness/certification states; labels for provider proof, provenance-only, immutable WASM/WASI artifact, readiness-evidence-only, spike-only-hidden, and non-execution-draft; Learn/evidence copy and monitors rejecting overclaims.  
**Addresses:** `SBOX-01`, `SBOX-02`, `LABEL-01`, `LABEL-02`.  
**Implements:** Architecture claim gate and readiness matrix contract.  
**Avoids:** Production sandbox certification overclaim, TypeScript/Python WASM isolation claims, Rust/Zig broad certification claims, TinyGo/candidate leakage.

### Phase 247: Package and Dependency Policy Enforcement

**Rationale:** Package behavior must be a runtime compatibility boundary, not just explanatory copy, before final account/entry proof.  
**Delivers:** Per-language no-package/no-host-import policy; enforcement across provider validation, account save, Workshop, entry, runtime registry, compatibility keys, diagnostics, and public evidence; future package-lane requirements captured without enabling packages.  
**Addresses:** `PKG-01` through `PKG-04`.  
**Uses:** `packages/spec/src/runtime.ts`, runtime providers, Go eligibility gates, Workshop checker diagnostics, privacy redaction utilities.  
**Avoids:** accidental package support, package-path/host-path leakage, unknown package-mode eligibility.

### Phase 248: Service-Backed Proof, Privacy Scans, and Boundary Monitors

**Rationale:** The milestone is only done when product-flow proof covers account save and entry-relevant gates, not just Workshop checker readiness.  
**Delivers:** v1.35 evaluator and artifact; service-backed proof for TypeScript/Python/Rust/Zig account save/provider metadata and eligibility gates; negative drills for stale/missing/mismatched proof, runtime-service unavailable, package rejection, unauthorized owner-debug, TinyGo absence, and no Strategy execution in web/API/Go; privacy scans over API JSON, pages, fixtures, logs, and generated proof artifacts.  
**Addresses:** `PROOF-01` through `PROOF-04`.  
**Avoids:** checker-only proof gap, public evidence leaks, fallback drift, boundary regression.

### Phase Ordering Rationale

- Inventory must come first because v1.35 spans account save, owner-debug, aliases, provider proof, package policy, sandbox labels, and public evidence; changing behavior before the surface matrix risks preserving accidental bypasses.
- Provider-proof parity must precede entry and label work because execution-ready account revision status cannot be honest until Go TypeScript account save consumes runtime-service proof.
- Ownership/private replay cleanup belongs before final proof so public/default and owner-private projections can be scanned under the corrected authorization model.
- Sandbox claims and package policy should be contract-backed before final UI/docs/proof, because otherwise the proof may encode unsupported claims.
- Final proof should be last and product-flow oriented: account save -> provider metadata -> entry gate -> result/replay/public evidence where feasible, plus negative drills.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 243:** Needs repo surface inventory and route/code ownership mapping before implementation.
- **Phase 244:** Needs detailed Go/runtime-service/provider proof integration research and careful TypeScript source-artifact identity tests.
- **Phase 245:** Needs authorization-path inventory for account source reads, owner-debug, persisted Match participants, and compatibility aliases.
- **Phase 248:** Needs proof design research so service-backed checks are realistic without broad flakes or private-data artifacts.

Phases with standard patterns (skip research-phase unless implementation reveals drift):
- **Phase 246:** Mostly contract/copy/monitor work against known v1.24/v1.33/v1.34 evidence.
- **Phase 247:** Policy enforcement follows known runtime registry, validator, diagnostics, and privacy-scan patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Findings are repo-local and grounded in existing workspace packages, Go client/backend, runtime-service, monitors, and proof scripts. Future package-policy roadmap details are MEDIUM because product/security choices remain future-scoped. |
| Features | HIGH | Must-have features are directly tied to v1.35 milestone intent, v1.34 baseline artifacts, and explicit hard boundaries. Exact cost is MEDIUM until Phase 243 inventory is complete. |
| Architecture | HIGH | Current ownership boundaries are stable and repeatedly documented: Go orchestrates/persists, runtime-service handles hostile Strategy validation/execution, web displays public-safe projections, engine stays pure. |
| Pitfalls | HIGH | Pitfalls are concrete, repo-specific, and mapped to known files/surfaces such as Go TypeScript account save, `player:workshop-local`, owner-debug replay, package metadata, and boundary monitors. |

**Overall confidence:** HIGH

### Gaps to Address

- Exact affected route list: Phase 243 must produce the authoritative surface matrix before edits.
- Draft-save product decision: Phase 244 must choose fail-closed execution-ready save versus explicit non-execution draft storage when runtime-service proof is unavailable.
- Stored revision migration posture: If existing account revisions lack provider proof, planning must decide whether to downgrade labels, require revalidation, or block entry until proof refresh.
- Alias compatibility policy: Phase 245 must decide remove, hidden shim, migration, or deprecation for each legacy Workshop route.
- Service-backed proof scope: Phase 248 must choose a reliable local proof shape that covers account/provider gates without leaking private artifacts or depending on unavailable external infrastructure.
- Future package/sandbox roadmap: v1.35 should record future criteria but must not accidentally enable packages, TinyGo, ABI migration, or certification claims.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` - v1.35 goal, hard boundaries, current runtime/account/security-policy scope.
- `.planning/STATE.md` - active v1.35 planning state, v1.34 baseline, phase numbering after Phase 242.
- `.planning/research/STACK.md` - stack recommendation, integration points, no-new-platform guidance, proof evaluator proposal.
- `.planning/research/FEATURES.md` - table stakes, differentiators, anti-features, dependencies, requirement candidate groups.
- `.planning/research/ARCHITECTURE.md` - current boundaries, data flows, contract proposals, proof-gate architecture, build order.
- `.planning/research/PITFALLS.md` - critical pitfalls, recovery strategies, phase mapping, suggested v1.35 phase shape.
- `CowardsGameSpec_Full_Consolidated_v1.md` - canonical deterministic runtime, Strategy Revision, replay/privacy, and package constraints.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - pure engine, runtime isolation, persistence, replay, validation, and package boundary guidance.

### Secondary (MEDIUM confidence)

- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - concrete checker/account/entry/provider-proof inventory feeding v1.35.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - public checker envelope and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-proof.md` - service-backed four-language checker proof baseline.
- `.planning/artifacts/v1.32-four-language-parity-matrix.md` - counted four-language provider model and privacy baseline.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - readiness evidence baseline and no-certification posture.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo spike-only/defer evidence.

### Tertiary (LOW confidence)

- Future package ecosystem and production sandbox certification criteria - intentionally deferred until separate package/sandbox milestones define supply-chain, reproducibility, native-code, deployment, and isolation evidence.

---
*Research completed: 2026-06-14*
*Ready for roadmap: yes*
