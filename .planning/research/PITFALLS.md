# Pitfalls Research

**Domain:** Coward's Game v1.35 runtime/account ownership/provider-proof/sandbox/package-policy cleanup
**Researched:** 2026-06-14
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: TypeScript Account Save Looks Provider-Proofed But Still Uses Local Trust

**What goes wrong:**
Go account save continues to accept TypeScript Strategy Revisions using local source-size/string-marker validation while Workshop submit, Workshop checker, ladder eligibility, and persistence competition gates use provider-grade proof. The saved account revision can then display runtime semantics or eligibility labels that imply the same proof as Python/Rust/Zig even though the Go path never called runtime-service for TypeScript.

**Why it happens:**
TypeScript was the original baseline, so older Go code treats it as the simple path. v1.34 made Workshop validation provider-backed, but the inventory still found `apps/go-backend/runtime_service_client.go` rejecting TypeScript validation client-side and `apps/go-backend/live_backend.go` using `validateSourceMetadata` for TypeScript account save.

**How to avoid:**
Make the roadmap split draft storage from executable/countable revisions. If a TypeScript account save can enter counted play or claim readiness, it must require current runtime-service provider proof with source hash/bytes, source artifact metadata, provider id, validation policy, runtime ABI, package policy, and privacy-safe metadata. If a save path is intentionally draft-only, label and gate it as non-execution storage and block entry until provider proof is created.

**Warning signs:**
`validateSourceMetadata` remains in account save eligibility; `validateStrategy` still rejects `typescript`; account revision summaries show `ready`, `counted eligible`, `provider validated`, or source-artifact labels without a provider-proof state; TypeScript tests cover Workshop checker but not Go account save -> entry.

**Phase to address:**
Phase 244, Account-Owned Revision and Provider-Proof Gate Cleanup.

---

### Pitfall 2: Local Workshop Identity Becomes Persisted Account Ownership

**What goes wrong:**
`player:workshop-local` or no-auth local shortcuts leak into persisted owner-debug, account-owned revision, Match participant, or private replay behavior. The system then treats a local/testing identity as if it were server-authenticated ownership.

**Why it happens:**
Local Workshop replay UX already uses `player:workshop-local` to open owner-debug links. That is acceptable for local/test fixtures, but v1.35 touches account ownership and private replay surfaces where identity must come from server-side authorization, not a query string, fixture default, or client helper.

**How to avoid:**
Quarantine local identities behind explicit test/dev gates and keep them out of persisted account rows, production Match participants, owner-debug authorization, and public/private replay decisions. Owner-debug and account-owned revision behavior should derive the requester from the authenticated session or a server-authorized resolver, then compare against persisted ownership/participant data.

**Warning signs:**
Production code imports `LOCAL_WORKSHOP_PLAYER_ID`; tests assert private owner behavior with only query params; new database rows can contain `player:workshop-local`; owner replay works when `ownerPlayerId` is supplied by the URL but no server identity is present.

**Phase to address:**
Phase 245, Account Ownership, Owner-Debug, and Compatibility Alias Cleanup.

---

### Pitfall 3: Owner-Debug Privacy Is Protected By UI State Instead Of Server Authorization

**What goes wrong:**
Private replay evidence, SoldierMemory-derived explanations, owner-only diagnostics, or objective-adjacent data appear in default/public replay outputs because the implementation trusts a UI toggle, environment flag, fixture route, or query parameter.

**Why it happens:**
The canonical spec allows owner inspection but makes Strategy source, StrategyMemory, SoldierMemory, and objective payloads private by default. Existing replay code has good server-side concepts (`requestedOwnerPlayerId`, authorized owners, persisted participant checks), but v1.35 can accidentally weaken them while cleaning up local owner shortcuts.

**How to avoid:**
Keep owner-debug as a server-authorized projection mode. Require both an authenticated requester identity and persisted Match ownership/participant evidence before returning owner fields. Public/default replay DTOs must omit `ownerPlayerId`, `ownerDebug`, Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, raw diagnostics, and private runtime details.

**Warning signs:**
`ownerDebug=1` appears sufficient in tests; public replay snapshots contain `ownerPlayerId` or owner-debug keys; private fields are hidden only by React conditional rendering; fixture/test-support routes are reachable outside `PLAYWRIGHT_TEST`, `NODE_ENV=test`, or an explicit fixture env gate.

**Phase to address:**
Phase 245, Account Ownership, Owner-Debug, and Compatibility Alias Cleanup.

---

### Pitfall 4: Sandbox Readiness Labels Become Production Certification Claims

**What goes wrong:**
UI, docs, diagnostics, or provider evidence label current lanes as "sandboxed", "secure", "production-ready", or "certified" when the evidence only proves current containment/readiness. This especially affects TypeScript/Python provenance-only lanes and Rust/Zig WASM/WASI artifact-backed lanes.

**Why it happens:**
v1.24 and v1.20 already produced readiness matrices, and v1.32/v1.34 made four languages counted/provider-gated. Those achievements can be conflated with production sandbox certification even though the project explicitly has no broad certification claim.

**How to avoid:**
Create a v1.35 claims contract with separate labels for provider validation, artifact provenance, runtime containment evidence, candidate/unavailable lanes, and production sandbox certification. Default public labels should be conservative. Certification language should fail tests unless a future phase explicitly adds the required evidence.

**Warning signs:**
Copy says "sandbox certified" or "safe runtime"; source-language artifacts show `sandboxClaim` stronger than `provenance-only`; Rust/Zig labels imply WASM equals certified isolation; documentation removes "does not prove" rows from readiness matrices.

**Phase to address:**
Phase 246, Sandbox-Readiness Claims Contract and Fail-Loud Labels.

---

### Pitfall 5: Package Policy Is Treated As A Message, Not A Contract Boundary

**What goes wrong:**
TypeScript, Python, Rust, Zig, or TinyGo package/dependency behavior drifts through validators, runtime metadata, entry gates, or diagnostics. A source can appear to pass because an import was not caught, while runtime compatibility still says `package.mode = none`, or a diagnostic leaks host package paths while explaining a rejection.

**Why it happens:**
Package ecosystems are intentionally unsolved. The runtime metadata currently registers exact language/adapter/package combinations with package mode `none`, and the specs forbid package installation, native modules, filesystem, network, process APIs, and host imports. v1.35 adds policy language, which can tempt developers to document future package support without enforcing current no-package behavior.

**How to avoid:**
Keep `packagePolicy: none` as an enforced compatibility field across provider validation, stored runtime metadata, account save, entry, execution request construction, and diagnostics. Future package lanes need their own supply-chain, reproducibility, native-code, deterministic-build, lockfile, privacy, and runtime-boundary evidence before being selectable.

**Warning signs:**
Runtime metadata accepts unknown package modes; validators reject packages but entry gates ignore package metadata; diagnostics mention `site-packages`, `node_modules`, Cargo/Zig cache paths, host paths, or package manager output; a dependency doc appears without tests proving unsupported packages fail closed.

**Phase to address:**
Phase 247, Package and Dependency Policy Enforcement.

---

### Pitfall 6: Runtime-Service Failure Becomes Strategy Invalid Or Falls Back Locally

**What goes wrong:**
Unavailable runtime-service, unavailable Rust/Zig toolchains, malformed provider envelopes, or transport errors are reported as invalid Strategy source. Worse, the app/Go path silently falls back to local validation or execution, creating a weaker trust boundary than submit/save/entry expects.

**Why it happens:**
Older paths used local TypeScript validation, Rust/Zig heuristics, or generic `TRANSPILE_FAILED` reports. v1.34 normalized Workshop checker states, but v1.35 will touch account save, Go-owned entry, provider proof, and sandbox labels where unavailable/system states need the same care.

**How to avoid:**
Use explicit states: `runtime_service_unavailable`, `toolchain_unavailable`, `system_unavailable`, `invalid`, `stale`, and `ready`. Unavailable/system states must be calm, public-safe, and non-eligibility states. No hostile Strategy validation/build/execution may move into web/API/Go as a fallback.

**Warning signs:**
Tests expect `TRANSPILE_FAILED` for a stopped runtime-service; unavailable service still stores a valid revision; account save succeeds with default runtime metadata after provider transport failure; fallback branches call local validators for source formats that require provider-grade semantics.

**Phase to address:**
Phase 244 and Phase 248, because account/provider gates must fail closed and final proof must stop fallback drift.

---

### Pitfall 7: Compatibility Aliases Bypass Current Contracts

**What goes wrong:**
Old Workshop/API compatibility aliases continue to accept request shapes or source formats that skip v1.34 checker metadata, provider proof, current privacy normalization, or account ownership checks.

**Why it happens:**
Aliases are often kept for old tests, local UX, or migration comfort. v1.35 explicitly asks whether to remove, hide, migrate, or document them. Leaving them ambiguous lets future phases accidentally depend on stale behavior.

**How to avoid:**
Inventory every alias and choose one policy per route: remove it, gate it as test-only, migrate it to the current contract, or document deprecation with tests proving it cannot create executable/countable revisions without current proof.

**Warning signs:**
Two routes save Strategy Revisions with different validation metadata; alias tests only check 200/404 status; old routes return `StrategyRevisionValidationReport` instead of `workshop-checker-v1.34`; compatibility route bypasses account ownership or runtime-service unavailable handling.

**Phase to address:**
Phase 245, Account Ownership, Owner-Debug, and Compatibility Alias Cleanup.

---

### Pitfall 8: Public Evidence Leaks Private Runtime Or Artifact Data

**What goes wrong:**
Public/default outputs expose raw compiler diagnostics, runtime-service messages, provider proof payloads, artifact bytes/base64, source snippets, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, or objective payloads.

**Why it happens:**
Runtime-service success metadata legitimately contains private/internal proof fields for validation and execution. Go and app routes also carry failure details and diagnostics. Cleanup work can accidentally pass those through while trying to make proof labels and package-policy diagnostics more transparent.

**How to avoid:**
Normalize all external-facing evidence into categories, public reasons, hashes/byte counts, provider ids, contract versions, and explicit redaction metadata. Keep bytes, signing/proof internals, raw diagnostics, and owner/private fields out of default/public responses and generated proof artifacts.

**Warning signs:**
JSON snapshots contain `bytesBase64`, `stderr`, `stack`, `/Users/`, `/home/`, `/tmp/`, `DATABASE_URL`, `token`, `ownerDebug`, `StrategyMemory`, `SoldierMemory`, or `objectivePayload`; tests scan UI but not API responses/log artifacts; provider proof fields are displayed to "show trust".

**Phase to address:**
Phase 248, Service-Backed Proof, Privacy Scans, and Boundary Monitors.

---

### Pitfall 9: TinyGo Or Candidate ABI Evidence Leaks Into Production Surfaces

**What goes wrong:**
TinyGo, direct exports, Component Model/WIT, gVisor/runsc, container lanes, or other candidates appear in Workshop language selectors, entry eligibility, result/replay labels, or public evidence as available production features.

**Why it happens:**
The project has multiple useful spike/readiness artifacts. v1.35 asks for a broader sandbox-readiness/certification contract, which can accidentally promote candidate names into product registries or labels.

**How to avoid:**
Keep candidate lanes in research/readiness artifacts unless an explicit productionization milestone promotes them. Production source-format lists remain TypeScript, Python, Rust, and Zig. TinyGo stays spike-only and hidden from Workshop, submit/save, entry, result, replay, and public evidence surfaces.

**Warning signs:**
`tinygo`, `direct-exports`, `component-model-wit`, `runsc`, or container candidate labels appear in production UI snapshots, provider registries, source-format enums, counted eligibility tests, or public Match evidence.

**Phase to address:**
Phase 246 and Phase 248.

---

### Pitfall 10: Service-Backed Proof Covers The Checker But Not The Product Boundary

**What goes wrong:**
The milestone appears done because Workshop "Validate source" returns `ready` for four languages, but account save, Go-owned revision storage, entry, owner-debug replay, package-policy gates, and public evidence are not exercised end to end.

**Why it happens:**
v1.34's service-backed proof was intentionally scoped to Workshop checker parity. v1.35 is broader and must prove corrected account/provider-proof behavior plus sandbox/package-policy gates.

**How to avoid:**
Require at least one service-backed proof that covers the corrected account path and eligibility-relevant proof, plus negative drills for missing/stale/mismatched proof, runtime-service unavailable, package/dependency rejection, owner-debug unauthorized access, privacy scans, and boundary monitors.

**Warning signs:**
Final proof table only lists checker responses; tests do not create saved account revisions through Go; no entry attempt verifies provider proof; privacy scans omit generated artifacts/logs; public replay was checked only with fixtures.

**Phase to address:**
Phase 248, Service-Backed Proof, Privacy Scans, and Boundary Monitors.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep TypeScript local Go validation for account save | Fast implementation; avoids runtime-service dependency | Split-brain eligibility and misleading proof labels | Only for explicitly draft-only storage that cannot enter Match/MatchSet play |
| Treat `player:workshop-local` as a real player id | Preserves local Workshop owner-debug UX | Local trust can become persisted private access | Test/dev fixtures only, never production persisted ownership |
| Leave old aliases undocumented | Avoids migration churn | Hidden routes bypass current contracts | Never for executable/countable revision creation |
| Use raw runtime/toolchain messages in diagnostics | Faster debugging | Source/path/token/package/private-runtime leaks | Internal logs only after redaction and access control |
| Broaden package support by allowlisting imports ad hoc | Better samples and ergonomics | Non-reproducible builds, host dependency leaks, nondeterminism | Never in v1.35; future narrow lane only with explicit evidence |
| Use "sandboxed" as shorthand for provider-backed | Simple product copy | Overclaims security readiness | Only if paired with exact claim text and "not certification" language |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Go account save -> runtime-service | Add TypeScript to one call site but not source identity/proof/runtime metadata validation | Treat TypeScript like other counted languages: provider response, source hash/bytes, artifact metadata, proof state, package policy, ABI, and fail-closed storage |
| Account revisions -> entry gates | Trust `validation.valid` without checking provider proof and package/runtime compatibility | Entry must consume saved immutable metadata and require current provider proof where eligibility needs it |
| Replay owner-debug -> public replay | Let query params or UI toggles select owner mode | Server-authorized resolver plus persisted Match participant/owner check selects owner projection |
| Workshop checker -> submit/save | Reuse checker `ready` as the only gate | Submit/save/entry must have their own provider-grade gate or verified current checker identity |
| Runtime-service diagnostics -> API output | Forward raw provider failure messages | Map to public-safe categories and redact forbidden markers before output |
| Sandbox readiness matrix -> UI/docs labels | Collapse evidence/candidate/certification into one label | Use distinct labels for containment evidence, candidate unavailable, provenance-only, WASM/WASI artifact-backed, and certification |
| Package metadata -> runtime compatibility | Ignore `package.mode` in eligibility | Require exact registered language/adapter/ABI/package tuple, currently package mode `none` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Revalidating Rust/Zig account saves without cache identity | Slow save/entry flows, duplicate toolchain work, flapping unavailable states | Cache/coalesce only by language, provider id, source hash/bytes, artifact hash/bytes, toolchain key, ABI, and validation policy | Ordinary editing plus repeated save attempts |
| Over-broad runtime-service response caps | Large internal artifact responses fail as system errors or tempt exposing bytes to clients | Keep internal byte caps but strip artifact bytes before public/default output | Rust/Zig artifacts or verbose compiler failures |
| Privacy scans only checking rendered UI | API/proof/log artifacts leak private markers while pages look clean | Scan API JSON, fixtures, generated artifacts, logs used as proof, and public pages | Final proof/audit time |
| Account save waits synchronously on slow toolchains without honest unavailable state | User sees generic failure or retries repeatedly | Return explicit unavailable/system states and keep draft-only storage separate from eligibility | Runtime-service/toolchain outage |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Running Strategy validation/build/execution in web/API/Go to fill runtime-service gaps | Hostile code crosses the trusted process boundary | Runtime-service / Runtime Broker / provider remains the hostile-code boundary; fail closed on unavailable |
| Treating Node `vm`, local subprocess, or source scanning as a security boundary | Sandbox bypass or false readiness claim | Do not promote stronger claims without explicit isolation evidence and externalized runtime boundary |
| Trusting client-provided owner ids for replay/private evidence | Private Strategy data exposed to another player | Derive requester from server auth and verify persisted Match ownership/participant data |
| Persisting raw provider proof or artifact bytes into public-readable metadata | Strategy source/artifact leakage | Store internal proof separately or redact public summaries; expose hashes/byte counts only where safe |
| Allowing package installs/imports in Strategy code | Filesystem/network/native module access, nondeterminism, supply-chain risk | Keep no-package/no-host-import policy enforced across validators and runtime metadata |
| Accepting unknown runtime/package/provider metadata | Unsupported lane can enter counted play | Exact registered tuple checks and no-fallback tests |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Invalid Strategy" for stopped runtime-service | Player thinks their source is broken | Use calm unavailable copy: the Strategy has not been judged invalid |
| "Ready" for draft-only account storage | Player expects competition eligibility | Label as saved draft/non-executable until provider proof exists |
| "Secure sandbox" copy for provenance-only TypeScript/Python | Misleading trust promise | Say provider-validated provenance evidence; not WASM isolation or certification |
| Package rejection exposes raw compiler/package paths | Confusing and privacy-unsafe diagnostics | Public-safe category plus short remediation and no host/package paths |
| Owner-debug toggle appears on public replay without authorization context | Player may infer private data is public | Hide owner mode unless server returned owner projection |

## "Looks Done But Isn't" Checklist

- [ ] **TypeScript account save:** Often missing runtime-service provider proof -- verify Go account save can create provider-backed TypeScript metadata and cannot claim eligibility on local-only validation.
- [ ] **Draft storage:** Often missing non-execution labels -- verify draft-only saves cannot enter counted/exhibition paths that require provider proof.
- [ ] **Owner-debug replay:** Often missing server authorization -- verify query-only and mismatched requester/owner requests return public projection.
- [ ] **Public privacy:** Often missing artifact/log scans -- verify API responses, generated proof files, logs, fixtures, and pages exclude private markers.
- [ ] **Sandbox labels:** Often missing negative claim tests -- verify no production surface claims certification or WASM isolation beyond evidence.
- [ ] **Package policy:** Often missing runtime metadata enforcement -- verify unknown package modes and host imports fail closed at validation, storage, entry, and execution request construction.
- [ ] **Compatibility aliases:** Often missing route-level policy -- verify each alias is removed, test-only, migrated, or deprecation-tested.
- [ ] **TinyGo/candidates:** Often missing registry scans -- verify spike-only/candidate lanes are absent from production selectors, entries, results, replay, and public evidence.
- [ ] **Unavailable states:** Often missing non-invalid state coverage -- verify stopped runtime-service/toolchain unavailable does not store a valid executable revision and does not fall back locally.
- [ ] **Service-backed proof:** Often missing product-flow coverage -- verify proof covers account save/provider proof and entry-relevant gates, not only Workshop checker.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| TypeScript local validation persisted as eligible | HIGH | Add migration/audit query for affected revisions, downgrade eligibility labels, require revalidation through runtime-service, and block entry until proof is refreshed |
| Local Workshop identity persisted | HIGH | Identify rows containing `player:workshop-local`, quarantine or relabel as fixture/dev data, remove private access, and add persistence tests/monitors |
| Owner-debug leak | HIGH | Disable owner-debug route/env gates, rotate affected proof artifacts if needed, add deny-by-default server authorization, and rerun public/privacy scans |
| Sandbox overclaim shipped | MEDIUM | Patch copy/docs/evidence labels, add negative label monitors, and publish corrected claim language in roadmap/audit artifacts |
| Package policy drift | MEDIUM | Fail unknown package modes, normalize diagnostics, add compatibility tuple tests, and revalidate stored revisions before entry |
| Compatibility alias bypass | MEDIUM | Remove or gate the route, add contract tests proving old shape cannot create executable revisions, and update callers |
| Public evidence artifact leak | MEDIUM | Regenerate proof artifacts with redaction, add scanner coverage, and review logs/fixtures committed during the phase |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| TypeScript account save local trust | Phase 244 | Service-backed Go account save test plus entry gate negative cases for missing/stale/mismatched TypeScript provider proof |
| Local Workshop identity as owner | Phase 245 | Search/monitor proving `player:workshop-local` appears only in test/dev/local Workshop contexts and never persisted production ownership |
| Owner-debug privacy leak | Phase 245 and Phase 248 | Server authorization tests, public/default replay scans, unauthorized query-param proof returning public mode |
| Sandbox certification overclaim | Phase 246 | Label/copy monitors rejecting certification/WASM isolation claims without explicit evidence |
| Package policy drift | Phase 247 | Exact runtime metadata tuple tests, package import/install rejection tests, package-path privacy scans |
| Runtime-service unavailable fallback | Phase 244 and Phase 248 | Stopped runtime-service/toolchain unavailable drills proving no local hostile-code fallback and no executable valid revision |
| Compatibility alias bypass | Phase 245 | Route inventory with policy decision per alias and tests for removed/gated/migrated behavior |
| Public proof/data leakage | Phase 248 | Privacy scanner over API JSON, fixtures, generated artifacts, logs, and UI pages |
| TinyGo/candidate leakage | Phase 246 and Phase 248 | Registry/source-format/public evidence scan proving candidate lanes remain hidden |
| Checker-only proof gap | Phase 248 | End-to-end proof covering account save -> proof metadata -> entry gate plus negative drills |

## Suggested v1.35 Phase Shape

1. **Phase 243: Boundary Surface Inventory** - inventory account save, account-owned revisions, owner-debug, aliases, Go reads/writes, provider proof, sandbox claims, and package policy surfaces before changing behavior.
2. **Phase 244: Account Revision Provider-Proof Gates** - fix or relabel TypeScript Go account save and eligibility-relevant account/entry paths.
3. **Phase 245: Ownership, Owner-Debug, and Alias Cleanup** - quarantine local trust shortcuts, harden private replay authorization, and decide compatibility alias policy.
4. **Phase 246: Sandbox Claims Contract** - define public/developer labels and fail-loud proof gates for readiness versus certification.
5. **Phase 247: Package Policy Enforcement** - keep no-package/no-host-import boundaries explicit and enforced across all production languages and TinyGo candidate docs.
6. **Phase 248: Proof, Privacy, and Boundary Audit** - service-backed product-flow proof, negative drills, privacy scans, and monitors.

## Sources

- `.planning/PROJECT.md` - v1.35 milestone goal, active boundaries, and hard non-claims.
- `.planning/STATE.md` - current v1.35 planning state and active boundary notes.
- `.planning/REQUIREMENTS.md` - v1.34 baseline requirements and future package/sandbox warnings carried into v1.35.
- `.planning/ROADMAP.md` - completed v1.34 phase structure and proof scope.
- `.planning/MILESTONES.md` - shipped v1.20-v1.34 decisions and active constraints.
- `.planning/artifacts/v1.35-v1.36-milestone-prompts.md` - requested v1.35 scope and downstream milestone intent.
- `.planning/artifacts/v1.34-workshop-checker-inventory.md` - concrete account save, checker, entry, provider-proof, and privacy gaps.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - public checker envelope, status semantics, cache identity, privacy exclusions, and non-claims.
- `.planning/artifacts/v1.34-workshop-checker-proof.md` - service-backed checker proof scope and negative unavailable probe.
- `.planning/artifacts/v1.24-production-sandbox-readiness-matrix.md` - readiness evidence only; no production sandbox certification.
- `.planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.md` - candidate lane unavailable/no-fallback/readiness evidence.
- `CowardsGameSpec_Full_Consolidated_v1.md` - canonical Strategy Revision immutability, private memory/objective rules, deterministic/runtime/package constraints, and Chronicle visibility.
- `CowardsGame_Technical_Architecture_Spec_V1.md` - architecture boundaries, runtime sandbox restrictions, replay visibility, validation, and package boundary guidance.
- Code inspection of `apps/go-backend/runtime_service_client.go`, `apps/go-backend/live_backend.go`, `apps/web/app/matches/replay-ready.ts`, `apps/web/app/matches/[matchId]/replay/owner-debug.ts`, `apps/web/app/workshop/workshop-client-state.ts`, and `scripts/check-boundary-monitors.ts`.

---
*Pitfalls research for: Coward's Game v1.35 Runtime, Account Ownership, Sandbox, and Package Policy Cleanup*
*Researched: 2026-06-14*
