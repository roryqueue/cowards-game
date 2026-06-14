# Phase 242: Four-Language Checker Proof, Privacy, and Audit - Research

**Researched:** 2026-06-14 [VERIFIED: system date]
**Domain:** Workshop checker proof harness, privacy scans, boundary monitors, and milestone audit for TypeScript, Python, Rust, and Zig [VERIFIED: .planning/REQUIREMENTS.md]
**Confidence:** MEDIUM [VERIFIED: codebase inspection]

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Service-Backed E2E Proof Shape
- **D-01:** Phase 242 should include one focused service-backed four-language Workshop checker proof through `/api/workshop/validate`.
- **D-02:** The proof should exercise TypeScript, Python, Rust, and Zig with runtime-service available where required.
- **D-03:** The proof should include targeted negative probes for unavailable runtime-service, unavailable toolchain where applicable, invalid source/provider categories, and privacy-safe output.
- **D-04:** A full edit-submit-entry-replay journey is not required for this phase unless needed to close a specific checker parity gap; older milestones already cover broader journeys.

### Privacy Scan Strictness
- **D-05:** Privacy denylist scans must cover checker responses, UI-visible text snapshots, fixtures/logs where relevant, and generated proof artifacts.
- **D-06:** Scans must block Strategy source, raw diagnostics, artifact bytes, host paths, env values, package paths, tokens, DB details, private runtime internals, StrategyMemory, SoldierMemory, and objective payloads in public/default output.
- **D-07:** Leaks are blockers unless they are explicitly private/test-only, gated, and documented as such.

### Audit Closure Standard
- **D-08:** Phase 242 must create final proof/audit artifacts that record commands, service/toolchain availability, proof outcomes, privacy scans, boundary monitor results, deferred gaps, and archive/tag readiness.
- **D-09:** Passing tests alone is not enough; evidence must be coherent enough for a future return to the project.
- **D-10:** The final audit should decide whether the v1.34 milestone is ready to archive/tag or what remains blocked.

### Local Toolchain Limitations
- **D-11:** Local runtime-service/toolchain gaps should be recorded honestly rather than hidden.
- **D-12:** If Rust/Zig toolchains are unavailable locally, tests/proofs should demonstrate the correct unavailable states and record the limitation rather than treating source as invalid.
- **D-13:** Where services/toolchains are available, at least one service-backed path should be proven end to end.

### the agent's Discretion
- Planner may choose the exact balance of unit, integration, E2E, browser, and monitor commands, provided the evidence covers all Phase 242 success criteria.
- Planner may reuse prior four-language proof harnesses where compatible with the new checker contract.

### Deferred Ideas (OUT OF SCOPE)
- Full edit-submit-entry-replay proof is not required unless Phase 242 identifies a checker-specific parity gap that needs it.
- Broad Go TypeScript account-save/provider-proof cleanup may remain deferred if documented and not blocking v1.34 checker claims.
- Any missing local Rust/Zig toolchain support should be recorded as an environment limitation, not silently skipped.
</user_constraints>

## Summary

Phase 242 should be planned as a proof-and-audit closure phase, not as another checker implementation phase. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] The core artifact should be a focused service-backed `/api/workshop/validate` proof that exercises TypeScript, Python, Rust, and Zig through the real app route and records normalized checker responses, availability/toolchain conditions, privacy scan results, boundary monitor results, commands, and archive readiness. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

Current checked-in code is still pre-Phase-239 for the checker route: `apps/web/app/api/workshop/validate/route.ts` returns `{ validation }`, routes Python to local Workshop validation, and maps missing runtime-service for TypeScript/Rust/Zig to a generic invalid `TRANSPILE_FAILED` report. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] Therefore Phase 242 planning must depend on Phases 239-241 being implemented first, or it must include an explicit blocker stating that the required `workshop-checker-v1.34` envelope cannot yet be proven. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

**Primary recommendation:** Build a small v1.34 checker proof harness plus focused unit/integration tests around the post-241 `workshop-checker-v1.34` envelope, reuse existing four-language golden sources and runtime-service helpers, and run only targeted commands before final milestone audit. [VERIFIED: packages/golden/src/v1-32-language-corpus.ts] [VERIFIED: apps/runtime-service/src/server.test.ts]

## Project Constraints (from AGENTS.md)

- Engine logic must remain pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Game rules must not move into React components. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in the web/API process. [VERIFIED: AGENTS.md]
- User Strategy code must not execute in Go. [VERIFIED: AGENTS.md]
- Node `vm` must not be used as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Strategy code is hostile and every runtime boundary must be schema validated. [VERIFIED: AGENTS.md]
- Canonical terminology must preserve Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, and Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime tests must distinguish strategy failure from system failure. [VERIFIED: AGENTS.md]
- Replay or Match creation changes require board realism checks, but Phase 242's locked scope does not require full replay proof unless a checker parity gap forces it. [VERIFIED: AGENTS.md] [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHECKTEST-01 | Focused unit/integration tests cover Validate source and submit/save/entry parity for all four languages and failure classes. [VERIFIED: .planning/REQUIREMENTS.md] | Add route-level checker contract tests, submit/save parity tests, runtime-service validation tests, and entry metadata smoke tests with targeted commands. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] [VERIFIED: apps/web/app/api/workshop/revisions/route.ts] |
| CHECKTEST-02 | Privacy tests scan checker responses, UI text, logs/fixtures, and generated proof artifacts for private markers. [VERIFIED: .planning/REQUIREMENTS.md] | Reuse `assertPublicOutputLeakSafe` and add checker-specific denylist coverage for raw diagnostics, artifact bytes, provider signing proofs, paths, tokens, and runtime internals. [VERIFIED: packages/spec/src/public-output-privacy.ts] |
| CHECKTEST-03 | At least one service-backed E2E proof validates all four Workshop checker paths through runtime-service/provider semantics where required. [VERIFIED: .planning/REQUIREMENTS.md] | Create a guarded Playwright proof or targeted Node/tsx proof that starts or points at runtime-service, calls `/api/workshop/validate`, and writes JSON/Markdown artifacts. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |
| CHECKTEST-04 | Boundary monitors prove no Strategy execution moved into web/API/Go, TinyGo remains hidden, TypeScript/Python remain provenance-only, and Rust/Zig remain WASM/WASI Preview 1 artifact-backed. [VERIFIED: .planning/REQUIREMENTS.md] | Extend or reuse `scripts/check-boundary-monitors.ts`, `scripts/check-service-boundary-imports.ts`, `apps/web/lib/runtime-labels.test.ts`, and spec runtime tests. [VERIFIED: scripts/check-boundary-monitors.ts] [VERIFIED: scripts/check-service-boundary-imports.ts] |
| CHECKTEST-05 | Final validation records inventory, parity decisions, UX evidence, cache/debounce behavior, commands, service proof, privacy scans, local limitations, and audit outcome. [VERIFIED: .planning/REQUIREMENTS.md] | Write final proof/audit artifacts under `.planning/artifacts` after implementation; research recommends artifact names below. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Public checker envelope proof | Web/API | Runtime-service | `/api/workshop/validate` is the planned owner of `workshop-checker-v1.34`; runtime-service remains provider-focused. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Provider-grade language validation | Runtime-service | Runtime packages | Runtime-service `/validate-strategy` dispatches to TypeScript, Python, Rust, and Zig provider validators. [VERIFIED: apps/runtime-service/src/server.ts] |
| Diagnostic display privacy | Web/UI | Web/API | React should render normalized public checker data, while category/redaction mapping belongs outside components. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] |
| Rust/Zig compile pacing proof | Web/API or client state | Runtime-service | Phase 241 requires ephemeral debounce/coalescing/cache while submit/save remains authoritative. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md] |
| TinyGo hidden monitor | Spec/Web boundary monitors | Web/UI | TinyGo is spike-only and must stay absent from production Workshop, submit/save, entry, result, replay, and public evidence surfaces. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] |
| Final audit evidence | Planning artifacts | Test/proof scripts | Prior proof specs write JSON and Markdown evidence under `.planning/artifacts`. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |

## Standard Stack

### Core

| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| pnpm | 11.1.2 | Monorepo package manager. [VERIFIED: package.json] | Root scripts and package manager pin use pnpm. [VERIFIED: package.json] |
| Vitest | repo range `^4.1.6`, current npm `4.1.8`, modified 2026-06-12 | Focused unit and integration tests. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing web, runtime-service, spec, runtime, and script tests are Vitest tests. [VERIFIED: rg --files] |
| Playwright | repo range `^1.60.0`, current npm `1.60.0`, modified 2026-06-14 | Browser and service-backed E2E proof. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing proof specs use Playwright with `RUN_*` guards and artifact writing. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |
| TypeScript | repo range `^6.0.3`, current npm `6.0.3`, modified 2026-04-16 | Shared app/runtime/test implementation language. [VERIFIED: package.json] [VERIFIED: npm registry] | The project is a TypeScript monorepo with package `typecheck` scripts. [VERIFIED: rg --files] |
| tsx | repo range `^4.22.0`, current npm `4.22.4`, modified 2026-05-31 | Script execution for monitors and proof generators. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing proof and monitor scripts run through `pnpm exec tsx`. [VERIFIED: package.json] |
| runtime-service HTTP `/validate-strategy` | internal | Provider-grade validation/build/proof boundary. [VERIFIED: apps/runtime-service/src/server.ts] | The route validates TypeScript, Python, Rust, and Zig and returns provider metadata on success. [VERIFIED: apps/runtime-service/src/server.ts] |
| `@cowards/golden` four-language corpus | internal | Reusable TypeScript/Python/Rust/Zig source fixtures and private markers. [VERIFIED: packages/golden/src/v1-32-language-corpus.ts] | Existing runtime-service parity tests and proof work use the corpus for cross-language behavior. [VERIFIED: apps/runtime-service/src/four-language-parity.test.ts] |

### Supporting

| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| Go | local `go1.26.3` | Go backend parity and boundary checks. [VERIFIED: local command probe] | Use targeted `go test` only for runtime-service client/account-save parity if Phase 242 touches Go behavior. [VERIFIED: apps/go-backend/runtime_service_client_test.go] |
| Rust toolchain | local `rustc 1.95.0`, `cargo 1.95.0` | Rust WASI validation/toolchain proof. [VERIFIED: local command probe] | Use for service-backed Rust checker success proof when available. [VERIFIED: apps/runtime-service/src/server.test.ts] |
| Zig | local `0.16.0` | Zig WASI validation/toolchain proof. [VERIFIED: local command probe] | Use for service-backed Zig checker success proof when available. [VERIFIED: apps/runtime-service/src/server.test.ts] |
| Wasmtime | local `45.0.0` | WASM/WASI execution and historical proof context. [VERIFIED: local command probe] | Keep for runtime-service/WASI evidence; Phase 242 checker proof may not need direct Wasmtime invocation if it uses `/validate-strategy`. [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts] |
| Docker | local `29.4.0` | Optional services and prior sandbox candidate proof. [VERIFIED: local command probe] | Use only if local service startup or topology proof requires it. [VERIFIED: package.json] |
| TinyGo | local `0.41.1` | Spike-only historical toolchain. [VERIFIED: local command probe] | Do not use for production checker proof except negative hidden-surface scans. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Focused `/api/workshop/validate` service-backed proof | Full edit-submit-entry-replay proof | Full journey duplicates v1.32/v1.33 broader proof and is explicitly deferred unless a checker-specific gap requires it. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] |
| Checker-specific denylist scan plus `assertPublicOutputLeakSafe` | Manual audit only | Manual audit is explicitly rejected by the Phase 242 privacy decision. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-DISCUSSION-LOG.md] |
| Guarded Playwright proof with `RUN_V1_34_CHECKER_PROOF=1` | Always-on service E2E in normal test suite | Existing proof specs use opt-in guards for service-heavy checks. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |

**Installation:** No new package is required for the proof harness if existing Vitest, Playwright, tsx, and internal packages are reused. [VERIFIED: package.json]

```bash
pnpm install
```

## Architecture Patterns

### System Architecture Diagram

```text
Workshop UI or proof client
  -> POST /api/workshop/validate
  -> schema validation and public-safe checker normalization
  -> runtime-service /validate-strategy when provider-grade semantics are required
  -> language provider validator/build path
      -> TypeScript source artifact provenance
      -> Python source bundle provenance
      -> Rust WASM/WASI Preview 1 artifact validation
      -> Zig WASM/WASI Preview 1 artifact validation
  -> normalized workshop-checker-v1.34 response
  -> privacy scanner + boundary monitors + proof artifact writer
  -> audit decision: ready to archive/tag or blocked
```

This data flow matches the Phase 239 ownership decision that `/api/workshop/validate` owns the Workshop envelope while runtime-service owns provider validation/build semantics. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]

### Recommended Project Structure

```text
apps/web/app/api/workshop/validate/
├── route.ts                         # public checker route owner [VERIFIED: codebase]
└── route.test.ts                    # add focused contract/parity/privacy tests [RECOMMENDED: research]

apps/web/app/workshop/
├── workshop-client-state.ts         # state/gating helpers [VERIFIED: codebase]
└── workshop-client.test.tsx         # add UI-state/privacy helper tests [RECOMMENDED: research]

apps/web/e2e/
└── v1-34-workshop-checker-proof.spec.ts  # guarded service-backed proof [RECOMMENDED: research]

scripts/
├── check-boundary-monitors.ts       # extend/reuse boundary proof [VERIFIED: codebase]
└── check-v1-34-workshop-checker-privacy.ts # optional reusable denylist artifact scanner [RECOMMENDED: research]

.planning/artifacts/
├── v1.34-four-language-checker-proof.json # generated by proof [RECOMMENDED: research]
├── v1.34-four-language-checker-proof.md   # generated by proof [RECOMMENDED: research]
└── v1.34-checker-privacy-audit.md         # final audit output [RECOMMENDED: research]
```

### Pattern 1: Route-Level Contract Tests

**What:** Import `POST` from `apps/web/app/api/workshop/validate/route.ts`, stub `fetch` or point `COWARDS_RUNTIME_SERVICE_URL` at an ephemeral `createRuntimeExecutionHttpServer`, and assert the normalized `workshop-checker-v1.34` response shape. [VERIFIED: apps/web/app/api/service/health/route.test.ts] [VERIFIED: apps/runtime-service/src/server.test.ts]

**When to use:** Use for fast coverage of status/category/privacy mapping and runtime-service unavailable behavior. [VERIFIED: apps/web/app/api/service/health/route.test.ts]

**Example:**

```ts
// Source: apps/web/app/api/service/health/route.test.ts and apps/runtime-service/src/server.test.ts
const response = await POST(
  new Request("http://test.local/api/workshop/validate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourceFormat: "python", source }),
  }),
)
const body = await response.json()
expect(body.contractVersion).toBe("workshop-checker-v1.34")
expect(body.privacy.publicSafe).toBe(true)
```

### Pattern 2: Guarded Service-Backed Proof

**What:** Add `apps/web/e2e/v1-34-workshop-checker-proof.spec.ts` with `test.skip(process.env.RUN_V1_34_CHECKER_PROOF !== "1", "...")`, call `/api/workshop/validate` for each golden source, scan response and visible Workshop text, then write JSON and Markdown proof artifacts. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts]

**When to use:** Use for the required service-backed proof after Phases 239-241 produce the checker contract. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

**Example:**

```ts
// Source: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts
test.skip(
  process.env.RUN_V1_34_CHECKER_PROOF !== "1",
  "v1.34 checker proof requires live web and runtime-service.",
)
```

### Pattern 3: Proof Artifact Privacy Scan

**What:** Serialize every checker response, UI snapshot, and generated proof artifact through a denylist scanner before writing final audit success. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

**When to use:** Use for CHECKTEST-02 and CHECKTEST-05 closure. [VERIFIED: .planning/REQUIREMENTS.md]

**Example:**

```ts
// Source: packages/spec/src/public-output-privacy.ts, extended for checker-specific markers
assertPublicOutputLeakSafe(body, "Workshop checker response")
expect(JSON.stringify(body)).not.toContain("bytesBase64")
expect(JSON.stringify(body)).not.toContain("hmac-sha256:")
```

### Anti-Patterns to Avoid

- **Treating unavailable runtime-service as invalid source:** Missing or unreachable runtime-service must map to unavailable/system states, not invalid Strategy diagnostics. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md]
- **Depending on full suite proof for all environments:** Existing runtime-service four-language parity asserts all four languages are available, so Phase 242 should record local toolchain availability and prove unavailable states when needed. [VERIFIED: apps/runtime-service/src/four-language-parity.test.ts]
- **Scanning only HTTP responses:** Phase 242 explicitly requires scans of responses, UI-visible text, fixtures/logs where relevant, and proof artifacts. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]
- **Adding TinyGo as a production checker language:** TinyGo is spike-only and hidden from production surfaces. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Four-language source fixtures | New ad hoc Strategy sources | `packages/golden/src/v1-32-language-corpus.ts` | Existing corpus covers TypeScript, Python, Rust, Zig, provider ids, behavior, and private markers. [VERIFIED: packages/golden/src/v1-32-language-corpus.ts] |
| Runtime-service server harness | Raw HTTP mock for all cases | `createRuntimeExecutionHttpServer` plus targeted fetch stubs for unavailable/malformed cases | Existing server tests already use ephemeral runtime-service instances. [VERIFIED: apps/runtime-service/src/server.test.ts] |
| Generic public privacy scanner | Manual string review | `assertPublicOutputLeakSafe` plus checker-specific forbidden markers | Existing helper blocks public forbidden fields and markers; Phase 242 adds checker-specific exclusions. [VERIFIED: packages/spec/src/public-output-privacy.ts] |
| Boundary import analysis | Regex-only import search | `scripts/check-service-boundary-imports.ts` | Existing monitor parses TypeScript import/export statements and strict route graphs. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| Full signed-in MatchSet journey | New broad E2E journey | Narrow `/api/workshop/validate` proof | Phase 242 decisions explicitly prefer focused checker proof unless a checker gap forces broader journey. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] |

**Key insight:** The hard part is proving normalized checker behavior and privacy at the route/UI/artifact boundary; runtime execution parity and full MatchSet replay are already covered by prior milestone proof and should not be duplicated unless a v1.34 checker claim depends on them. [VERIFIED: .planning/artifacts/v1.32-four-language-signed-in-proof.md]

## Common Pitfalls

### Pitfall 1: Planning Phase 242 Before Phases 239-241 Land

**What goes wrong:** Tests are written against `workshop-checker-v1.34`, but the current route still returns only `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
**Why it happens:** Phase 242 context was gathered before Phase 239-241 implementation artifacts were present. [VERIFIED: .planning/STATE.md]
**How to avoid:** Make Phase 242 plan start with a readiness gate that checks for the checker envelope, diagnostic categories, and cache/stale state implementation. [RECOMMENDED: research]
**Warning signs:** No `contractVersion: "workshop-checker-v1.34"` appears in code search results. [VERIFIED: rg codebase]

### Pitfall 2: Rust/Zig Toolchain Success Treated as Guaranteed

**What goes wrong:** Proof fails in environments without Rust/Zig/Wasmtime even though Phase 242 allows honest unavailable-state proof. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]
**Why it happens:** Existing four-language runtime-service test expects all four languages to be available. [VERIFIED: apps/runtime-service/src/four-language-parity.test.ts]
**How to avoid:** Record toolchain availability in proof JSON and branch assertions between `ready` and `toolchain_unavailable`. [RECOMMENDED: research]
**Warning signs:** Rust/Zig compile failures are reported as generic source invalidity or raw compiler output. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md]

### Pitfall 3: Leaking Internal Provider Proof or Artifact Bytes

**What goes wrong:** Runtime-service success metadata includes internal artifacts/proofs and the checker proof accidentally serializes them into public artifacts. [VERIFIED: apps/runtime-service/src/server.ts]
**Why it happens:** Runtime-service success includes `metadata.providerValidation.proof` and artifact metadata, while public checker output must normalize/redact. [VERIFIED: apps/runtime-service/src/server.ts] [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
**How to avoid:** Scan responses and generated artifacts for `bytesBase64`, `hmac-sha256:`, raw source snippets, host paths, and private markers before writing success. [RECOMMENDED: research]
**Warning signs:** Proof JSON contains `metadata.sourceArtifact.bytesBase64`, `metadata.compiledArtifact.bytesBase64`, or provider signing proof. [VERIFIED: packages/spec/src/public-output-privacy.ts]

### Pitfall 4: Treating Checker Cache as Authoritative

**What goes wrong:** Cached Validate source results become a substitute for submit/save provider validation. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
**Why it happens:** Phase 241 allows ephemeral cache/coalescing for ergonomics, but submit/save remains authoritative. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
**How to avoid:** Test submit/save still revalidates and does not trust checker cache identity as provenance. [RECOMMENDED: research]
**Warning signs:** Submit route accepts cached checker responses without runtime-service validation. [VERIFIED: apps/web/app/api/workshop/revisions/route.ts]

## Code Examples

### Ephemeral Runtime-Service Harness

```ts
// Source: apps/runtime-service/src/server.test.ts
const server = createRuntimeExecutionHttpServer({
  runtimeConfig,
  bodyLimitBytes: 64 * 1024,
})
server.listen(0, "127.0.0.1")
```

### Existing Four-Language Corpus

```ts
// Source: packages/golden/src/v1-32-language-corpus.ts
fourLanguageGoldenSources.map((source) => source.languageId)
// ["typescript", "python", "rust", "zig"]
```

### Existing Proof Artifact Pattern

```ts
// Source: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts
writeFileSync(proofJsonPath, `${JSON.stringify(proof, null, 2)}\n`)
writeFileSync(proofMarkdownPath, `${lines.join("\n")}\n`)
```

## State of the Art

| Old Approach | Current/Required Approach | When Changed | Impact |
|--------------|---------------------------|--------------|--------|
| Workshop Validate source returns only `{ validation }`. [VERIFIED: apps/web/app/api/workshop/validate/route.ts] | `workshop-checker-v1.34` envelope with status, category, provider, availability, provenance, cache, and privacy fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | v1.34 Phase 239 target. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] | Phase 242 tests must assert the new envelope after implementation. [RECOMMENDED: research] |
| Python Validate source uses local Workshop validation. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md] | Python Validate source must use runtime-service provider semantics equivalent to submit/save. [VERIFIED: .planning/REQUIREMENTS.md] | v1.34 Phase 239 target. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] | Phase 242 proof should assert provider id `strategy-language-provider-python`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| Rust/Zig compile/toolchain failures collapse into coarse diagnostics. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md] | Rust/Zig must distinguish compile, forbidden WASI/import, artifact/provenance, runtime-service, toolchain unavailable, timeout/limit, and schema failures. [VERIFIED: .planning/REQUIREMENTS.md] | v1.34 Phase 240 target. [VERIFIED: .planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md] | Phase 242 negative probes must check category, status, and privacy. [RECOMMENDED: research] |
| Prior proof covered full signed-in four-language MatchSet flow. [VERIFIED: .planning/artifacts/v1.32-four-language-signed-in-proof.md] | Phase 242 proof should be a focused checker route proof. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] | v1.34 Phase 242 decision. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] | Avoid unnecessary long E2E runs. [RECOMMENDED: research] |

**Deprecated/outdated:** Treating TypeScript/Python source artifact provenance as WASM isolation or broad sandbox certification is explicitly out of scope. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | No new package dependencies are required for Phase 242 proof harness. [ASSUMED] | Standard Stack | Planner may need to add a small helper dependency if post-241 implementation introduces a new schema package. |
| A2 | Future implementation may add shared checker utilities and tests not present today. [ASSUMED] | Open Questions | Planner may need to retarget test file names or reuse new helper modules. |
| A3 | Phase 239 may or may not touch submit/save normalization enough to require a live entry check. [ASSUMED] | Open Questions | Planner could under-test or over-test entry parity if the post-239 implementation scope differs. |
| A4 | Research remains valid until 2026-06-21 because active v1.34 checker implementation may change route/test structure quickly. [ASSUMED] | Metadata | Planner should refresh research if Phases 239-241 significantly reshape checker ownership or test utilities. |

## Open Questions

1. **Are Phases 239-241 implemented before Phase 242 execution?** [VERIFIED: .planning/STATE.md]
   - What we know: Only context files exist for Phases 239-241 in the current worktree. [VERIFIED: find .planning/phases]
   - What's unclear: The future implementation shape may add shared checker utilities and tests not present today. [ASSUMED]
   - Recommendation: Add a Wave 0 readiness check in the plan before writing final proof assertions. [RECOMMENDED: research]

2. **Should entry parity be tested through persistence unit tests or live signed-in APIs?** [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]
   - What we know: Entry consumes saved Revision metadata and full edit-submit-entry-replay proof is deferred unless needed. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-inventory.md]
   - What's unclear: Phase 239 may or may not touch submit/save normalization enough to require a live entry check. [ASSUMED]
   - Recommendation: Prefer targeted metadata eligibility tests unless a checker parity gap requires live entry proof. [RECOMMENDED: research]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | pnpm scripts, Vitest, Playwright, tsx | yes | v24.15.0 | None needed. [VERIFIED: local command probe] |
| pnpm | Monorepo scripts | yes | 11.1.2 | None needed. [VERIFIED: local command probe] |
| Go | Go backend targeted tests | yes | go1.26.3 darwin/amd64 | Skip Go tests only if Phase 242 does not touch Go parity. [VERIFIED: local command probe] |
| Python | Python provider validation | yes | 3.9.6 | Runtime-service unavailable/toolchain state proof if Python host cannot run. [VERIFIED: local command probe] |
| Rust/Cargo | Rust checker success proof | yes | rustc 1.95.0 / cargo 1.95.0 | Prove `toolchain_unavailable` if absent in other environments. [VERIFIED: local command probe] |
| Zig | Zig checker success proof | yes | 0.16.0 | Prove `toolchain_unavailable` if absent in other environments. [VERIFIED: local command probe] |
| Wasmtime | WASM/WASI runtime context | yes | 45.0.0 | Not required for every checker route assertion if runtime-service validation abstracts it. [VERIFIED: local command probe] |
| TinyGo | Spike-only hidden monitor context | yes | 0.41.1 | Not used for production checker proof. [VERIFIED: local command probe] |
| Docker | Optional services/topology | yes | 29.4.0 | Use existing local services if already running. [VERIFIED: local command probe] |

**Missing dependencies with no fallback:** None found during lightweight toolchain probing. [VERIFIED: local command probe]

**Missing dependencies with fallback:** None found locally, but Phase 242 should still record unavailable-state behavior for Rust/Zig because other environments may lack those toolchains. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest repo range `^4.1.6`, npm current `4.1.8`; Playwright repo range/current `1.60.0`. [VERIFIED: package.json] [VERIFIED: npm registry] |
| Config file | `vitest.config.ts`, `apps/web/vitest.config.ts`, `playwright.config.ts`. [VERIFIED: codebase] |
| Quick run command | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts app/workshop/workshop-client.test.tsx --runInBand` [RECOMMENDED: research] |
| Full focused command | `RUN_V1_34_CHECKER_PROOF=1 PLAYWRIGHT_TEST=1 COWARDS_RUNTIME_SERVICE_URL=http://127.0.0.1:3107 pnpm e2e --project=desktop --workers=1 v1-34-workshop-checker-proof.spec.ts` [RECOMMENDED: research] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CHECKTEST-01 | Validate source plus submit/save/entry parity for all four languages and failure classes. [VERIFIED: .planning/REQUIREMENTS.md] | unit/integration | `pnpm --filter @cowards/web test -- app/api/workshop/validate/route.test.ts app/api/workshop/revisions/route.test.ts --runInBand` [RECOMMENDED: research] | No, Wave 0. [VERIFIED: rg --files] |
| CHECKTEST-02 | Privacy scans for checker responses, UI text, fixtures/logs, and proof artifacts. [VERIFIED: .planning/REQUIREMENTS.md] | unit/script | `pnpm exec tsx scripts/check-v1-34-workshop-checker-privacy.ts --check` [RECOMMENDED: research] | No, Wave 0. [VERIFIED: rg --files] |
| CHECKTEST-03 | Service-backed four-language checker proof through `/api/workshop/validate`. [VERIFIED: .planning/REQUIREMENTS.md] | e2e/proof | `RUN_V1_34_CHECKER_PROOF=1 PLAYWRIGHT_TEST=1 pnpm e2e --project=desktop --workers=1 v1-34-workshop-checker-proof.spec.ts` [RECOMMENDED: research] | No, Wave 0. [VERIFIED: rg --files] |
| CHECKTEST-04 | Boundary monitors for no web/API/Go execution, TinyGo hidden, TS/Python provenance-only, Rust/Zig Preview 1. [VERIFIED: .planning/REQUIREMENTS.md] | script/unit | `pnpm exec tsx scripts/check-boundary-monitors.ts` and `pnpm boundary:imports` [VERIFIED: package.json] | Yes. [VERIFIED: scripts/check-boundary-monitors.ts] |
| CHECKTEST-05 | Final evidence and audit records commands, results, limitations, deferred gaps, and archive readiness. [VERIFIED: .planning/REQUIREMENTS.md] | artifact/manual gate | Generated `v1.34-four-language-checker-proof.*` plus `v1.34-checker-privacy-audit.md`. [RECOMMENDED: research] | No, Wave 0. [VERIFIED: find .planning/artifacts] |

### Sampling Rate

- **Per task commit:** Run the narrow test for the touched surface, such as web route tests or checker privacy script. [RECOMMENDED: research]
- **Per wave merge:** Run the focused web tests, runtime-service validation tests, and boundary import monitor. [RECOMMENDED: research]
- **Phase gate:** Run the guarded v1.34 checker proof plus privacy scan plus boundary monitors before `$gsd-verify-work`. [RECOMMENDED: research]

### Wave 0 Gaps

- [ ] `apps/web/app/api/workshop/validate/route.test.ts` covers contract envelope, four languages, unavailable runtime-service, malformed provider response, privacy redaction, and cache identity fields. [RECOMMENDED: research]
- [ ] `apps/web/app/api/workshop/revisions/route.test.ts` covers submit/save public category parity where Phase 239 touches normalization. [RECOMMENDED: research]
- [ ] `apps/web/e2e/v1-34-workshop-checker-proof.spec.ts` writes JSON/Markdown proof artifacts and scans UI-visible text. [RECOMMENDED: research]
- [ ] `scripts/check-v1-34-workshop-checker-privacy.ts` or equivalent helper scans responses and generated artifacts. [RECOMMENDED: research]
- [ ] `scripts/check-boundary-monitors.ts` should be extended only if Phase 241 has not already added v1.34 checker-specific monitors. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]

## Service-Backed Proof Approach

1. Start from existing live proof style: guard the spec with `RUN_V1_34_CHECKER_PROOF=1`, use Playwright `page.request`, and write `.planning/artifacts/*.json` and `.md`. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts]
2. Use `fourLanguageGoldenSources` for valid TypeScript, Python, Rust, and Zig source inputs, but strip or account for private markers during expected privacy scans. [VERIFIED: packages/golden/src/v1-32-language-corpus.ts]
3. Call `/api/workshop/validate` for each valid source and assert `contractVersion`, `status`, `sourceFormat`, `language.providerId`, `owners`, `artifact`, `provenance`, `runtimeService`, `toolchain`, `diagnostics`, `cacheIdentity`, and `privacy.publicSafe`. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]
4. Add targeted negative requests: unsupported provider/sourceFormat, invalid TypeScript shape, Python forbidden import/package/capability, Rust forbidden WASI/import or compile failure, Zig helper/no-std misuse or compile failure, runtime-service unavailable, malformed provider response, and toolchain unavailable where practical. [VERIFIED: .planning/REQUIREMENTS.md]
5. Record local service/toolchain availability inside proof JSON before assertions so unavailable outcomes are explainable. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]
6. Scan response bodies, UI body text, generated proof JSON/Markdown, and any fixtures/logs created by the proof before declaring success. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md]

## Privacy Scan Strategy

Use two layers. [RECOMMENDED: research]

Layer 1 should reuse `assertPublicOutputLeakSafe` because it already blocks source-like fields, `bytesBase64`, memory, objective payloads, owner debug, raw runtime details, stack traces, stderr, credentials, host/package/database markers, and runtime internals. [VERIFIED: packages/spec/src/public-output-privacy.ts]

Layer 2 should add checker-specific forbidden strings and field names: `hmac-sha256:`, `providerValidation.proof`, `compiledArtifact.bytesBase64`, `sourceArtifact.bytesBase64`, raw Rust/Zig compiler stderr, `python_validation_host.py`, `/Users/`, `/home/`, `site-packages`, `COWARDS_RUNTIME_SERVICE_URL`, `COWARDS_PROVIDER_VALIDATION_SECRET`, `DATABASE_URL`, and the complete valid Strategy source strings used by the proof. [VERIFIED: apps/runtime-service/src/server.ts] [VERIFIED: packages/runtime-python/src/validation.ts] [VERIFIED: packages/runtime-wasm-wasi/src/validation.ts]

Do not fail on public-safe field names that the contract explicitly allows, such as `source.hash`, `source.bytes`, `artifact.hash`, `artifact.bytes`, provider id, contract version, ABI version, and normalized diagnostic category. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

## Local Toolchain Caveats

- The current machine has Rust, Cargo, Zig, Wasmtime, Python, Go, Docker, TinyGo, Node, and pnpm installed. [VERIFIED: local command probe]
- TinyGo availability is irrelevant to production checker support and should be used only to prove hidden/spike-only boundaries. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md]
- Existing Rust/Zig provider validation may take longer than typical unit tests because it compiles WASM artifacts. [VERIFIED: apps/runtime-service/src/server.test.ts]
- Phase 242 should not execute large suites by default; it should use targeted Vitest files, targeted Go tests only if Go parity changed, the guarded proof spec, and boundary scripts. [VERIFIED: user request]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no direct auth change | Phase 242 proof can use unauthenticated `/api/workshop/validate`; signed-in account paths are only needed if a parity gap requires them. [VERIFIED: .planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md] |
| V3 Session Management | no direct session change | Existing signed-in proof style handles cookies if needed. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts] |
| V4 Access Control | yes for public/private output split | Public/default checker output must redact private runtime/source/artifact fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |
| V5 Input Validation | yes | Treat runtime-service responses as untrusted and schema/normalize before UI or public proof output. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| V6 Cryptography | yes for provider proof handling | Provider HMAC proof must remain internal and must not appear in public checker output. [VERIFIED: apps/runtime-service/src/server.ts] [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

### Known Threat Patterns for Workshop Checker Proof

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Runtime-service response injects raw diagnostics or private fields. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-parity-matrix.md] | Information Disclosure | Schema validate, normalize, redact, and denylist scan checker output. [VERIFIED: .planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md] |
| Web/API accidentally imports runtime packages and executes Strategy source. [VERIFIED: AGENTS.md] | Elevation of Privilege | Boundary import monitor and no Strategy execution in web/API/Go monitor. [VERIFIED: scripts/check-service-boundary-imports.ts] |
| TinyGo leaks into production language picker or public copy. [VERIFIED: .planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md] | Tampering / Information Disclosure | Runtime-label and boundary monitor tests asserting TinyGo absence. [VERIFIED: apps/web/lib/runtime-labels.test.ts] |
| Stale checker cache reused across language/source/provider identities. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] | Tampering | Assert `cacheIdentity` includes language, provider, source, artifact, contract, ABI, policy, and toolchain key. [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md] |

## Blockers and Sequencing Risks

- **Blocker:** The current checked-in `/api/workshop/validate` route does not yet emit `workshop-checker-v1.34`, so Phase 242 cannot truthfully prove the final contract until Phase 239 lands. [VERIFIED: apps/web/app/api/workshop/validate/route.ts]
- **Blocker:** Phase 240 diagnostic category/UI mapping is not present in current code search results, so CHECKTEST-02/03 category assertions depend on future implementation. [VERIFIED: rg codebase]
- **Blocker:** Phase 241 cache/coalescing/boundary-monitor artifacts are not present yet, so CHECKTEST-04/05 must either wait or include a clear deferred gap. [VERIFIED: .planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md]
- **Risk:** `assertPublicOutputLeakSafe` forbids generic field names such as `source`, but the checker contract intentionally allows a `source` object with hash/bytes; the checker privacy scanner must distinguish allowed contract fields from forbidden source text. [VERIFIED: packages/spec/src/public-output-privacy.ts] [VERIFIED: .planning/artifacts/v1.34-workshop-checker-contract.md]

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - project constraints, testing expectations, and non-negotiables. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - v1.34 scope and status. [VERIFIED: planning docs]
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - checker contract/inventory decisions. [VERIFIED: phase context]
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - provider parity and envelope ownership decisions. [VERIFIED: phase context]
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - diagnostic UX and redaction ownership decisions. [VERIFIED: phase context]
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md` - cache/coalescing and boundary monitor decisions. [VERIFIED: phase context]
- `.planning/phases/242-four-language-checker-proof-privacy-and-audit/242-CONTEXT.md` - Phase 242 locked proof/privacy/audit decisions. [VERIFIED: phase context]
- `.planning/artifacts/v1.34-workshop-checker-contract.md`, `.planning/artifacts/v1.34-workshop-checker-inventory.md`, `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - contract and gap baseline. [VERIFIED: planning artifacts]
- `apps/web/app/api/workshop/validate/route.ts`, `apps/web/app/api/workshop/revisions/route.ts`, `apps/runtime-service/src/server.ts` - current code state. [VERIFIED: codebase]
- `apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts`, `apps/runtime-service/src/server.test.ts`, `apps/runtime-service/src/four-language-parity.test.ts` - existing proof/test harnesses. [VERIFIED: codebase]
- `packages/spec/src/public-output-privacy.ts`, `scripts/check-boundary-monitors.ts`, `scripts/check-service-boundary-imports.ts` - privacy and boundary helpers. [VERIFIED: codebase]
- `CowardsGameSpec_Full_Consolidated_v1.md`, `CowardsGame_Technical_Architecture_Spec_V1.md` - canonical runtime, privacy, and architecture constraints. [VERIFIED: project specs]

### Secondary (MEDIUM confidence)

- npm registry package version lookups for Vitest, Playwright, TypeScript, and tsx. [VERIFIED: npm registry]
- Local command probes for Node, pnpm, Go, Python, Rust, Zig, Wasmtime, TinyGo, and Docker. [VERIFIED: local command probe]

### Tertiary (LOW confidence)

- No tertiary web-search-only sources were used. [VERIFIED: research log]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package scripts, npm registry, and local probes agree. [VERIFIED: package.json] [VERIFIED: npm registry] [VERIFIED: local command probe]
- Architecture: HIGH - Phase 238-242 context and current route/runtime-service code agree on ownership boundaries. [VERIFIED: phase context] [VERIFIED: codebase]
- Pitfalls: MEDIUM - current blockers are verified, but exact post-241 implementation details are not present yet. [VERIFIED: codebase inspection]
- Proof approach: MEDIUM - existing proof patterns are verified, but final assertions depend on Phase 239-241 implementation. [VERIFIED: apps/web/e2e/v1-32-four-language-signed-in-proof.spec.ts]

**Research date:** 2026-06-14 [VERIFIED: system date]
**Valid until:** 2026-06-21, because v1.34 checker implementation is active and the route/test structure may change quickly. [ASSUMED]
