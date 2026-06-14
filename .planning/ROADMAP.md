# Roadmap: Coward's Game v1.35

## Overview

v1.35 closes the runtime/account/security-policy edges left after v1.34 by making account-owned Strategy Revision readiness, entry eligibility, sandbox-readiness claims, and package/dependency policy derive from provider proof, server authorization, and spec-owned contracts. The milestone keeps Strategy execution behind runtime-service / Runtime Broker / provider boundaries, keeps TypeScript/Python provenance separate from WASM isolation, preserves Rust/Zig immutable WASM/WASI Preview 1 artifact backing, keeps TinyGo hidden, and protects public/default outputs from private Strategy/runtime data.

## Phases

- [ ] **Phase 243: Boundary Surface Inventory and Contract Lock** - Inventory v1.35-affected trust surfaces and lock fix/quarantine/deprecation/future decisions before behavior changes.
- [ ] **Phase 244: Account Revision Provider-Proof and Entry Gates** - Make account save and entry readiness require current provider-grade proof or explicit non-execution states.
- [ ] **Phase 245: Ownership, Owner-Debug, and Workshop Alias Cleanup** - Restrict local trust shortcuts, authorize private owner views server-side, and settle legacy Workshop aliases.
- [ ] **Phase 246: Sandbox-Readiness Claims and Runtime Labels** - Publish conservative readiness/certification labels and fail-loud monitors for unsupported isolation claims.
- [ ] **Phase 247: Package and Dependency Policy Enforcement** - Define and enforce the current no-package/no-host-import policy across production Strategy lanes.
- [ ] **Phase 248: Service-Backed Proof, Privacy, and Boundary Monitors** - Prove the corrected account/provider/privacy/package/sandbox boundaries with tests, scans, monitors, and final evidence.

## Phase Details

### Phase 243: Boundary Surface Inventory and Contract Lock
**Goal**: Developer has an authoritative v1.35 surface inventory and decision register for the trust-boundary cleanup.
**Depends on**: Phase 242
**Requirements**: INV-01, INV-02, INV-03
**Success Criteria** (what must be TRUE):
  1. Developer can review one inventory covering account save, account-owned revision/source read, owner-debug/private replay, Workshop compatibility alias, competition entry, Go-owned read/write, provider-proof, sandbox-claim, package/dependency, TinyGo, and privacy monitor surfaces.
  2. Developer can see each inventoried surface classified as fix-now, quarantine, deprecate/remove, document-only, or future, with current owner, trust boundary, public/private data class, required tests, and follow-up evidence.
  3. Developer can rely on a locked v1.35 decision register before later phases change behavior, labels, routes, or proof gates.
**Plans**: 3 plans
Plans:
- [ ] 243-01-PLAN.md — Create deterministic v1.35 inventory evaluator and tests.
- [ ] 243-02-PLAN.md — Populate the authoritative inventory artifacts and locked decision register.
- [ ] 243-03-PLAN.md — Wire static inventory checks into package scripts and boundary monitors.

### Phase 244: Account Revision Provider-Proof and Entry Gates
**Goal**: Users can save and enter account-owned Strategy Revisions only under honest provider-proof-backed readiness states.
**Depends on**: Phase 243
**Requirements**: ACCT-01, ACCT-02, ACCT-03, ACCT-04, ACCT-05, ENTRY-01, ENTRY-02, ENTRY-03, ENTRY-04
**Success Criteria** (what must be TRUE):
  1. User can save an execution-ready TypeScript account-owned Strategy Revision through Go only when runtime-service/provider validation supplies current proof matching source/artifact identity and engine/runtime compatibility.
  2. User can distinguish provider-validated execution-ready revisions from invalid revisions, unavailable/system states, and any explicitly allowed non-execution draft storage with no readiness or eligibility claim.
  3. User cannot enter counted Go exhibitions, persistence competitions, or ladder paths unless TypeScript, Python, Rust, and Zig revisions have current provider-grade proof where execution readiness is required.
  4. User cannot use unsupported providers, hidden TinyGo, stale/missing/mismatched artifacts, incompatible runtime metadata, non-`none` package mode, invalid owner/revision state, or silent fallback to pass non-counted exhibition gates.
  5. Go and persistence eligibility outcomes agree across eligible, draft, invalid, stale-proof, missing-proof, mismatched-proof, unsupported-provider, package-declared, unavailable-runtime, and TinyGo cases, with public-safe errors by default.
**Plans**: TBD

### Phase 245: Ownership, Owner-Debug, and Workshop Alias Cleanup
**Goal**: Users can access account-owned source and owner-private replay evidence only through server-authorized ownership, while legacy Workshop aliases cannot bypass current contracts.
**Depends on**: Phase 244
**Requirements**: AUTH-01, AUTH-02, PRIV-01, PRIV-02, API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. User cannot use `player:workshop-local` or no-auth local shortcuts to authorize persisted account-owned revisions, private source reads, owner-debug replay, private analytics, or competition entry.
  2. Owner can read or write account-owned Strategy source only through the current server-authorized account/session or internal test authorization, with private/no-store responses where source or owner-private evidence is involved.
  3. Owner can request owner-debug/private replay, but the owner view appears only after server-side owner/participant authorization or internal test authorization; query parameters alone return the public projection.
  4. Public/default replay, result, account, Strategy, entry, checker, and evidence outputs omit owner-debug payloads, owner-private data, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grids, raw diagnostics, host paths, env values, tokens, DB details, package paths, artifact bytes, provider signing material, and private runtime internals.
  5. Developer can see each legacy Workshop source, submit, save, and compatibility alias removed, hidden/local-only, migrated, or deprecated, and retained aliases cannot bypass provider-proof, account authorization, package policy, TinyGo hiding, or privacy rules.
**Plans**: TBD
**UI hint**: yes

### Phase 246: Sandbox-Readiness Claims and Runtime Labels
**Goal**: Users and developers see precise runtime-readiness claims that distinguish evidence from production sandbox certification.
**Depends on**: Phase 245
**Requirements**: SBOX-01, SBOX-02, LABEL-01, LABEL-02
**Success Criteria** (what must be TRUE):
  1. Developer can publish a versioned sandbox-readiness/certification contract distinguishing runtime containment, hostile-code evidence, source/artifact provenance, immutable artifact backing, candidate-readiness evidence, unavailable lanes, spike-only lanes, and production sandbox certification.
  2. Public and developer UI labels state that TypeScript/Python are provenance-only, Rust/Zig are immutable WASM/WASI Preview 1 artifact-backed, TinyGo is spike-only/hidden, and no current lane claims stronger isolation than it proves.
  3. User sees no production sandbox certification claim unless the explicit evidence checklist is complete; current lanes remain uncertified unless v1.35 genuinely produces that evidence.
  4. Boundary monitors fail loudly on forbidden claim drift such as TypeScript/Python WASM isolation, broad production sandbox certification, TinyGo production support, package ecosystem support, or active direct-export/Component Model/WIT ABI claims.
**Plans**: TBD
**UI hint**: yes

### Phase 247: Package and Dependency Policy Enforcement
**Goal**: Users and developers have one enforced no-package/no-host-import production policy for all current Strategy lanes.
**Depends on**: Phase 246
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04
**Success Criteria** (what must be TRUE):
  1. Developer can review the current package/dependency policy per language: no TypeScript packages/host imports, no Python packages/host imports, no Rust external crates or package installation for production Strategy support, no Zig packages or host imports beyond approved no-std/helper lanes, and no TinyGo production packages.
  2. User cannot use account save, Workshop validation/submit, competition entry, runtime registry, compatibility keys, or public evidence to treat package mode other than `none` as production-supported.
  3. User receives package/dependency diagnostics that are public-safe and omit package paths, host paths, env values, tokens, DB details, artifact bytes, raw compiler/runtime output, raw diagnostics, source, and private runtime internals.
  4. Developer can review future package support requirements without any package support being enabled, including reproducible dependency resolution, lockfiles, supply-chain policy, native-code policy, sandboxed build/install, deterministic outputs, cache invalidation, privacy redaction, rollback, and runtime-boundary proof.
**Plans**: TBD

### Phase 248: Service-Backed Proof, Privacy, and Boundary Monitors
**Goal**: Users and developers can trust v1.35 because account/provider gates, privacy behavior, package policy, and sandbox claims are proven end to end.
**Depends on**: Phase 247
**Requirements**: PROOF-01, PROOF-02, PROOF-03, PROOF-04, PROOF-05
**Success Criteria** (what must be TRUE):
  1. Test evidence covers account-save/provider-proof states across TypeScript, Python, Rust, and Zig, including valid, invalid, draft/non-execution, unavailable-runtime, stale/missing/mismatched proof, malformed provider response, package-declared, unsupported-provider, and TinyGo-hidden cases.
  2. Service-backed proof shows a TypeScript account revision saved through Go carries provider proof and becomes entry-eligible only with matching source/artifact identity and current provider metadata.
  3. Privacy scans cover account source routes, owner-debug replay, public replay/result pages and APIs, Workshop aliases, checker/provider proof responses, package diagnostics, logs/fixtures where relevant, and generated proof artifacts for all forbidden private markers.
  4. Boundary monitors prove no Strategy execution moved into web/API/Go, TinyGo remains hidden, TypeScript/Python remain provenance-only, Rust/Zig remain immutable WASM/WASI Preview 1 artifact-backed, package mode stays `none`, and unsupported sandbox/package claims fail loudly.
  5. Final validation records inventory findings, provider-proof decisions, account/entry readiness behavior, alias decisions, sandbox-readiness contract, package policy, test commands, service-backed proof, privacy scans, boundary monitors, local service/toolchain limitations, and audit outcome.
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 243 -> 244 -> 245 -> 246 -> 247 -> 248

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 243. Boundary Surface Inventory and Contract Lock | 0/TBD | Not started | - |
| 244. Account Revision Provider-Proof and Entry Gates | 0/TBD | Not started | - |
| 245. Ownership, Owner-Debug, and Workshop Alias Cleanup | 0/TBD | Not started | - |
| 246. Sandbox-Readiness Claims and Runtime Labels | 0/TBD | Not started | - |
| 247. Package and Dependency Policy Enforcement | 0/TBD | Not started | - |
| 248. Service-Backed Proof, Privacy, and Boundary Monitors | 0/TBD | Not started | - |

## Coverage

- v1 requirements: 32 total
- Complete: 0
- Planned: 32
- Mapped to phases: 32
- Unmapped: 0

| Requirement | Phase |
| --- | --- |
| INV-01 | Phase 243 |
| INV-02 | Phase 243 |
| INV-03 | Phase 243 |
| ACCT-01 | Phase 244 |
| ACCT-02 | Phase 244 |
| ACCT-03 | Phase 244 |
| ACCT-04 | Phase 244 |
| ACCT-05 | Phase 244 |
| ENTRY-01 | Phase 244 |
| ENTRY-02 | Phase 244 |
| ENTRY-03 | Phase 244 |
| ENTRY-04 | Phase 244 |
| AUTH-01 | Phase 245 |
| AUTH-02 | Phase 245 |
| PRIV-01 | Phase 245 |
| PRIV-02 | Phase 245 |
| API-01 | Phase 245 |
| API-02 | Phase 245 |
| API-03 | Phase 245 |
| SBOX-01 | Phase 246 |
| SBOX-02 | Phase 246 |
| LABEL-01 | Phase 246 |
| LABEL-02 | Phase 246 |
| PKG-01 | Phase 247 |
| PKG-02 | Phase 247 |
| PKG-03 | Phase 247 |
| PKG-04 | Phase 247 |
| PROOF-01 | Phase 248 |
| PROOF-02 | Phase 248 |
| PROOF-03 | Phase 248 |
| PROOF-04 | Phase 248 |
| PROOF-05 | Phase 248 |

---
*Roadmap created: 2026-06-14 for v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup*
