# Phase 117: Isolation Baseline and Threat Model - Research

**Researched:** 2026-05-25  
**Domain:** Runtime isolation baseline, hostile Strategy threat modeling, promotion gates, broker/runtime-only boundaries  
**Confidence:** HIGH for repo-local baseline and planner actions; MEDIUM for future isolation-strength claims until Phase 118+ probes are implemented.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Threat Model
- **D-01:** Use an exhibition-beta hostile Strategy threat model, not local-dev-only and not production certification.
- **D-02:** Treat current Python subprocess support as baseline evidence, not a sufficient sandbox.
- **D-03:** Threat model must include filesystem, network, package/import, shell/process, environment, memory/output, timeout, crash, stderr/stack/path, and private-output leak risks.

### Promotion Criteria
- **D-04:** Python may promote to non-counted exhibition beta only if signed-in proof and isolation monitors pass.
- **D-05:** Production sandbox promotion remains out of scope unless evidence genuinely exceeds the milestone target.
- **D-06:** JS/TS regression safety is part of the baseline, not a later gate.

### the agent's Discretion
The agent may choose artifact names, but must produce monitor-readable JSON plus human-readable markdown.

### Deferred Ideas (OUT OF SCOPE)
- Production sandbox certification.
- Python counted/ranked eligibility.
- Arbitrary package installs.
- WASM/WASI promotion.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BASE-01 | Developer can inspect a v1.18 baseline that preserves v1.17 topology: web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementations. | Preserve v1.17 registry/topology as the Phase 117 baseline artifact. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json] |
| BASE-02 | Developer can inspect an explicit hostile Strategy threat model for non-counted exhibition beta readiness. | Use the threat matrix in this research as the required scope for the Phase 117 markdown and JSON artifacts. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md] |
| BASE-03 | Developer can inspect promotion criteria separating runtime-isolation readiness evidence from production sandbox certification. | Reuse existing runtime-isolation readiness criteria and add v1.18 exhibition-beta versus production-certification gates. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| BASE-04 | Developer can verify JS/TS Strategy support remains intact through the broker/runtime ABI. | Include JS/TS runtime-service, spec, Go client, and boundary monitor commands in Phase 117 acceptance. [VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| BASE-05 | Developer can verify Python remains runtime-only, non-counted, non-ranked, and not a backend/persistence/route/job/scoring/evidence owner. | Use registry, Go eligibility helpers, runtime-service authority tests, and monitors as baseline checks. [VERIFIED: scripts/check-boundary-monitors.ts] |
</phase_requirements>

## Summary

Phase 117 should create two artifacts only: `.planning/artifacts/v1.18-isolation-baseline.json` and `.planning/artifacts/v1.18-isolation-baseline.md`. The JSON should be monitor-readable; the markdown should be the human threat model and promotion decision input for later phases. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

The v1.18 baseline is v1.17: normal topology stays `web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)`, JS/TS remains counted through registered JS/TS runtime entries, and Python remains the `runtime-python-subprocess-experimental` entry with `enabledForNormalPlay: false` and `countedResultsAllowed: false`. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json]

**Primary recommendation:** Plan a documentation/artifact-only phase that snapshots the current repo baseline, defines the exhibition-beta hostile Strategy threat model, and establishes explicit promotion gates without changing runtime code. [VERIFIED: .planning/ROADMAP.md]

## Project Constraints (from AGENTS.md)

- Keep the engine pure, deterministic, serializable, and side-effect free. [VERIFIED: AGENTS.md]
- Do not put game rules in React components. [VERIFIED: AGENTS.md]
- Do not execute user Strategy code in the web/API process. [VERIFIED: AGENTS.md]
- Do not use `Math.random`, `Date.now`, system time, filesystem, network, or database access inside engine logic. [VERIFIED: AGENTS.md]
- Do not use Node `vm` as a security boundary for untrusted code. [VERIFIED: AGENTS.md]
- Treat Strategy code as hostile and validate every runtime boundary with schemas. [VERIFIED: AGENTS.md]
- Preserve canonical terminology: Soldier, Match, Phase, Round, Activation, Cycle, Action, Advance, STONE, FALLEN, Chronicle. [VERIFIED: AGENTS.md]
- Strategy Revisions are immutable once submitted for Match or MatchSet play. [VERIFIED: AGENTS.md]
- Public replay output must not expose Strategy source, StrategyMemory, SoldierMemory, or objective payloads by default. [VERIFIED: AGENTS.md]
- Runtime changes require invalid-output, timeout, forbidden-capability, memory/source-limit, schema-validation, and system-versus-strategy failure tests. [VERIFIED: AGENTS.md]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Baseline artifact creation | Planning artifacts | Monitors | Phase 117 is artifact-only and downstream monitors should be able to parse the JSON. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md] |
| Runtime broker selection | Strategy Execution Service / Runtime Broker | Spec package | Runtime-service calls `findRuntimeBrokerRegistryEntry` and selects JS/TS or Python runtime implementations from metadata. [VERIFIED: apps/runtime-service/src/execute-match.ts] |
| Match orchestration and public evidence | Go backend | Runtime service returns internal result only | Go owns runtime-service invocation, Match completion, scoring, and public evidence; runtime-service returns `privacy: "internal_runtime_result"`. [VERIFIED: apps/go-backend/runtime_service_client.go] [VERIFIED: apps/runtime-service/src/execute-match.ts] |
| Python Strategy execution | Runtime implementation | Runtime service | Python execution is currently in `packages/runtime-python` and is called by runtime-service when registry metadata targets `runtime-python`. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] |
| Threat model and promotion criteria | Planning artifacts | Spec/runtime monitor code | Existing runtime isolation criteria live in repo code and should be copied into v1.18 artifacts rather than redefined ad hoc. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| JS/TS regression safety | Runtime service/spec tests | Go client tests and monitors | JS/TS counted entries remain in the registry and must be tested alongside Python hardening. [VERIFIED: packages/spec/src/runtime.ts] |

## Current Baseline

| Area | Baseline | Confidence |
|------|----------|------------|
| Broker registry | `runtime-broker-registry-v1.17` has seven JS/TS/Python entries and exact-match fallback policy `fail-closed-no-js-ts-or-go-fallback`. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json] | HIGH |
| Runtime ABI | Strategy runtime ABI is `strategy-runtime-abi-v1.14`; runtime execution service contract is `runtime-execution-service-v1.15`. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: packages/spec/src/runtime-execution-service.ts] | HIGH |
| JS/TS support | JavaScript and TypeScript worker-thread entries are enabled for normal play and counted results; subprocess JS/TS entries are registered with counted allowed, while container-subprocess entries are non-counted candidates. [VERIFIED: packages/spec/src/runtime.ts] | HIGH |
| Python support | Python 3.9 uses `runtime-python-subprocess-experimental`, package policy `none`, readiness `experimental`, normal play disabled, counted results disabled. [VERIFIED: packages/spec/src/runtime.ts] | HIGH |
| Python execution mechanics | The adapter spawns `python3` with `env: {}`, JSON stdin/stdout IPC, timeout handling, stdout/stderr byte tracking, and schema parsing. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] | HIGH |
| Python sandbox strength | Current Python subprocess support is baseline evidence only and not sufficient sandbox certification. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md] | HIGH |
| Current validation gap | Python validation still uses regex/shape checks for syntax and forbidden patterns; Phase 119 owns real AST/compile validation. [VERIFIED: packages/runtime-python/src/validation.ts] [VERIFIED: .planning/ROADMAP.md] | HIGH |
| Current monitor status | `pnpm exec tsx scripts/check-boundary-monitors.ts` passed locally and reported 7 v1.17 registry entries plus 9 isolation criteria checked. [VERIFIED: local command 2026-05-25] | HIGH |

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Node.js | local `v24.15.0` | Runs TS tooling, runtime-service tests, and monitor scripts. [VERIFIED: local command 2026-05-25] | Existing repo runtime and scripts are Node/TS based. [VERIFIED: package.json] |
| pnpm | local `11.1.2` | Workspace package manager. [VERIFIED: local command 2026-05-25] | Repo declares `packageManager: pnpm@11.1.2`. [VERIFIED: package.json] |
| Vitest | repo `4.1.6`, npm current `4.1.7`, modified 2026-05-20 | Unit/contract tests for packages and apps. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing tests use Vitest; do not upgrade during Phase 117. [VERIFIED: vitest.config.ts] |
| TypeScript | repo `6.0.3`, npm current `6.0.3`, modified 2026-04-16 | Typechecking and TS implementation surface. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing packages use `tsc -b`. [VERIFIED: tsconfig.json] |
| Playwright | repo `1.60.0`, npm current `1.60.0`, modified 2026-05-24 | Browser/page smoke later in v1.18. [VERIFIED: package.json] [VERIFIED: npm registry] | Existing e2e scripts and replay smoke use Playwright. [VERIFIED: playwright.config.ts] |
| Go | local `go1.26.3 darwin/amd64` | Go backend orchestration and runtime-service client tests. [VERIFIED: local command 2026-05-25] | Go owns selected normal backend workflows. [VERIFIED: .planning/PROJECT.md] |
| Python | local `Python 3.9.6` | Current experimental Strategy runtime host. [VERIFIED: local command 2026-05-25] | Registry declares Python language version `3.9`. [VERIFIED: packages/spec/src/runtime.ts] |

### Supporting

| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Docker | local `29.4.0` | Container/gVisor-style readiness evidence in later phases. [VERIFIED: local command 2026-05-25] | Phase 118+ optional/required isolation evidence, not Phase 117 implementation. [VERIFIED: package.json] |
| `runsc` | not found locally | gVisor runtime candidate. [VERIFIED: local command 2026-05-25] | Future evidence only; absence blocks gVisor live proof unless installed or skipped explicitly. [CITED: https://gvisor.dev/docs/] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Current Python host subprocess | Docker/gVisor/microVM | Stronger isolation evidence requires deployment, image provenance, resource, and failure-taxonomy proof; Phase 117 should document criteria only. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| Regex Python validation | Python AST/compile validation | Phase 119 owns this implementation; Phase 117 should list it as a threat-model gap. [VERIFIED: .planning/ROADMAP.md] |
| Separate broker service | Existing runtime-service broker role | v1.17 registry states the Runtime Broker is implemented inside the existing isolated Strategy Execution Service. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.md] |

**Installation:**
```bash
# No package installation is required for Phase 117.
```

**Version verification:** `npm view vitest version time.modified`, `npm view @playwright/test version time.modified`, `npm view typescript version time.modified`, and `npm view turbo version time.modified` were run on 2026-05-25. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
Signed-in or local developer action
  -> Web frontend route/API adapter
  -> Go backend selected route or orchestration path
  -> Runtime service request envelope
  -> Runtime Broker exact registry match?
       -> no: schema-valid systemFailure, no fallback
       -> yes: JS/TS runtime implementation or Python runtime implementation
  -> Runtime ABI response / Chronicle internal result
  -> Go-owned completion, scoring, persistence handoff, public evidence projection
  -> Public output privacy filters and monitors
```

The diagram matches the current v1.17 topology and authority split. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.md]

### Recommended Project Structure

```text
.planning/artifacts/
├── v1.18-isolation-baseline.json  # monitor-readable baseline, threat categories, promotion gates
└── v1.18-isolation-baseline.md    # human-readable threat model and promotion criteria

.planning/phases/117-isolation-baseline-and-threat-model/
└── 117-RESEARCH.md                # this planner input
```

The artifact names are recommended under the phase's discretion allowance. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

### Pattern 1: Snapshot Existing Registry, Do Not Reinterpret It

**What:** Copy the current v1.17 registry facts into a v1.18 baseline artifact and add a `baselineInheritedFrom: "v1.17"` field. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json]

**When to use:** Use this for BASE-01, BASE-04, and BASE-05 so the planner does not accidentally create a new runtime policy in Phase 117. [VERIFIED: .planning/REQUIREMENTS.md]

**Example:**
```json
{
  "schemaVersion": "v1.18-isolation-baseline",
  "baselineInheritedFrom": "v1.17",
  "normalTopology": "web frontend -> Go backend -> Strategy Execution Service / Runtime Broker -> isolated runtime implementation(s)",
  "productionSandboxCertified": false,
  "pythonPromotionTarget": "non-counted-exhibition-beta-only"
}
```

### Pattern 2: Promotion Gates Must Be Negative Until Proven

**What:** Store explicit booleans for `pythonCountedEligible: false`, `pythonRankedEligible: false`, `productionSandboxCertified: false`, and `silentFallbackAllowed: false`. [VERIFIED: .planning/REQUIREMENTS.md]

**When to use:** Use this in both JSON and markdown so monitors can fail on accidental promotion language. [VERIFIED: scripts/check-boundary-monitors.ts]

### Anti-Patterns to Avoid

- **Treating subprocess as sandbox certification:** Current Python subprocess execution has empty env and time/byte caps, but Phase 117 decisions say it is not sufficient sandbox evidence. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]
- **Moving Strategy execution into Go/web/API:** AGENTS forbids web/API Strategy execution, and Go client code validates envelopes instead of importing Strategy runtimes. [VERIFIED: AGENTS.md] [VERIFIED: apps/go-backend/runtime_service_client.go]
- **Letting Python eligibility leak into counted paths:** Go rejects Python for counted play and allows it only in non-counted exhibition paths. [VERIFIED: apps/go-backend/live_backend.go]
- **Breaking JS/TS while hardening Python:** JS/TS regression safety is a locked Phase 117 decision. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

## Threat Model Scope

| Threat Category | Baseline Finding | Phase 117 Artifact Requirement |
|-----------------|------------------|-------------------------------|
| Filesystem | Python host declares `filesystem: "none"` in metadata but executes via host `python3`; this is policy evidence, not OS-level denial proof. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] | Mark filesystem as in-scope and unresolved for production certification. |
| Network | Python metadata declares `network: "disabled"`, but subprocess launch has no OS network namespace. [VERIFIED: packages/spec/src/runtime.ts] [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] | Require Phase 118 probes for DNS, outbound, localhost, metadata IP, and proxy exposure. |
| Package/import | Python validation denies import-like patterns and package policy is `none`. [VERIFIED: packages/runtime-python/src/validation.ts] | Mark arbitrary packages and PyPI installs out of scope. |
| Shell/process | Python launch does not use a shell, but hostile code executes through Python `exec` inside the host process child. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] [VERIFIED: packages/runtime-python/src/python_runtime_host.py] | Require shell/process escape probes and no shell launch evidence. |
| Environment | Python subprocess launch passes `env: {}`. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] | Require proof that no secrets, tokens, DB DSNs, or host paths appear in diagnostics. |
| Memory/output | Runtime limits include stdout, stderr, source, StrategyMemory, SoldierMemory, and objective bytes. [VERIFIED: packages/spec/src/runtime.ts] | Require caps to be copied into the JSON artifact and referenced by Phase 118 probes. |
| Timeout | Python sync and async paths map timeouts to runtime violation-style behavior. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] | Require timeout classification to remain deterministic and public-safe. |
| Crash/malformed IPC | Runtime-service and Python adapter classify malformed IPC, subprocess exit/signal, and schema invalidity. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts] [VERIFIED: apps/runtime-service/src/execute-match.ts] | Require threat model to distinguish Strategy failure from system failure. |
| stderr/stack/path leaks | Go and runtime-service sanitize runtime diagnostics and deny source/path/token/stack/stderr leaks in tests. [VERIFIED: apps/go-backend/runtime_service_client.go] [VERIFIED: apps/runtime-service/src/execute-match.test.ts] | Require public output denylist in both artifacts. |
| Private-output leaks | Public replay output must omit Strategy source, memories, objectives, owner debug, raw Awareness Grid, stderr, stack, tokens, DB DSNs, host paths, and private runtime internals. [VERIFIED: .planning/STATE.md] | Require Phase 117 artifact to name these as public-output blockers. |

## Promotion Criteria

| Promotion Target | Required Evidence | Blocks |
|------------------|-------------------|--------|
| Python non-counted exhibition beta | Signed-in proof, JS/TS regression green, Python remains runtime-only, isolation monitors pass, public outputs remain private-safe. [VERIFIED: .planning/REQUIREMENTS.md] | Any Python backend/persistence/route/job/scoring/evidence ownership, any counted/ranked eligibility, any silent fallback. [VERIFIED: .planning/REQUIREMENTS.md] |
| Production sandbox certification | Required container/gVisor-style live probes, resource limits, filesystem denial, network denial, image provenance, deployment preflight, failure taxonomy, redacted diagnostics, and local ergonomics. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] | Skipped container probes, mutable/unreviewed image provenance, ambiguous OOM/crash classification, public diagnostic leaks, or fallback to worker/subprocess/in-process execution. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| Python counted/ranked eligibility | Future milestone only, requiring production sandbox, package policy, determinism, rollback, replay, privacy, and governance criteria. [VERIFIED: .planning/REQUIREMENTS.md] | All v1.18 phases keep this out of scope. [VERIFIED: .planning/REQUIREMENTS.md] |

Python `-I` and `-P` are useful hardening knobs because Python documents isolated mode and safe-path behavior, but they do not replace OS/container sandbox proof. [CITED: https://docs.python.org/3/using/cmdline.html] [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

Docker has documented controls for memory, network, read-only filesystems, capabilities, and security options, and gVisor provides `runsc` as an OCI runtime with a per-sandbox application kernel model; these are candidate evidence tools, not Phase 117 code changes. [CITED: https://docs.docker.com/reference/cli/docker/container/run/] [CITED: https://gvisor.dev/docs/] [CITED: https://gvisor.dev/docs/architecture_guide/intro/]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime metadata matching | Ad hoc string checks in new artifact code | Existing `RUNTIME_BROKER_REGISTRY` and `validateRuntimeBrokerRegistryMatch` | Existing code already enforces exact ABI/language/adapter/package matching. [VERIFIED: packages/spec/src/runtime.ts] |
| Public privacy denylist | New one-off leak scanner | Existing spec assertions and boundary monitors | Existing monitors already cover source/memory/objective/stderr/stack/path/token/private-runtime markers. [VERIFIED: scripts/check-boundary-monitors.ts] |
| Sandbox promotion model | New prose-only checklist | Existing `RUNTIME_ISOLATION_READINESS` criteria | Existing criteria are structured and monitor-checked. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| JS/TS regression proof | Manual inspection | Existing spec/runtime-service/runtime-python/Go tests plus boundary monitors | These commands passed locally during research. [VERIFIED: local command 2026-05-25] |

**Key insight:** Phase 117 is about freezing the evidence baseline and threat model; custom runtime logic in this phase would increase risk without satisfying any Phase 117 requirement. [VERIFIED: .planning/ROADMAP.md]

## Common Pitfalls

### Pitfall 1: Overclaiming Python Isolation
**What goes wrong:** Empty env, no shell, and byte/time caps are described as production sandbox proof. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.ts]  
**Why it happens:** Process controls look like isolation controls but do not prove filesystem/network/kernel separation. [CITED: https://docs.docker.com/reference/cli/docker/container/run/]  
**How to avoid:** Phrase current Python as baseline evidence only and reserve production sandbox wording for future proof. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]  
**Warning signs:** Artifact says "certified", "production sandbox", "ranked", or "counted" for Python. [VERIFIED: .planning/REQUIREMENTS.md]

### Pitfall 2: Regressing JS/TS While Documenting Python
**What goes wrong:** Baseline checks focus only on Python. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]  
**Why it happens:** The milestone theme is Python-heavy, but JS/TS remains the counted path. [VERIFIED: .planning/PROJECT.md]  
**How to avoid:** Require JS/TS runtime-service and spec tests in Phase 117 acceptance. [VERIFIED: apps/runtime-service/src/execute-match.test.ts]  
**Warning signs:** No command verifies JS/TS `buildStrategyRevision` or runtime-service default JS/TS execution. [VERIFIED: apps/runtime-service/src/execute-match.test.ts]

### Pitfall 3: Runtime-Only Boundary Drift
**What goes wrong:** Python becomes a route, persistence, job lifecycle, Match completion, scoring, or public evidence owner. [VERIFIED: .planning/REQUIREMENTS.md]  
**Why it happens:** Exhibition beta work touches account revisions, MatchSet creation, execution, and replay in later phases. [VERIFIED: .planning/ROADMAP.md]  
**How to avoid:** Keep Phase 117 artifacts explicit that Go owns orchestration/scoring/public evidence and runtime-service owns only schema validation, runtime selection, Strategy execution, and internal result return. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json]  
**Warning signs:** New artifact lists Python or runtime-service as persistence, job, scoring, or public replay owner. [VERIFIED: scripts/check-boundary-monitors.ts]

## Code Examples

### Baseline JSON Shape
```json
{
  "schemaVersion": "v1.18-isolation-baseline",
  "baselineInheritedFrom": "v1.17",
  "requirements": ["BASE-01", "BASE-02", "BASE-03", "BASE-04", "BASE-05"],
  "runtimeOnlyBoundary": {
    "pythonBackendOwner": false,
    "pythonCountedEligible": false,
    "pythonRankedEligible": false,
    "silentFallbackAllowed": false
  },
  "threatModelScope": [
    "filesystem",
    "network",
    "package_import",
    "shell_process",
    "environment",
    "memory_output",
    "timeout",
    "crash",
    "stderr_stack_path",
    "private_output_leak"
  ]
}
```
Source pattern: v1.17 registry artifact and Phase 117 context. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json] [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

### Baseline Verification Commands
```bash
pnpm --filter @cowards/spec test -- --run
pnpm --filter @cowards/runtime-python test -- --run
pnpm --filter @cowards/runtime-service test -- --run
cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...
pnpm exec tsx scripts/check-boundary-monitors.ts
```
These commands passed locally during research except the Go command was cached. [VERIFIED: local command 2026-05-25]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded JS/TS runtime construction | Runtime Broker exact metadata selection for JS/TS and Python | v1.17 | Phase 117 should preserve registry matching and no-fallback behavior. [VERIFIED: .planning/milestones/v1.17-phases/110-broker-registry-baseline-and-contract-hardening/110-SUMMARY.md] |
| Python as experimental proof only | Python moving toward non-counted exhibition beta if proof and monitors pass | v1.18 planning | Phase 117 must separate exhibition beta readiness from sandbox certification. [VERIFIED: .planning/REQUIREMENTS.md] |
| Runtime isolation readiness as general matrix | v1.18 threat model with concrete hostile Strategy categories | Phase 117 | Later phases consume the threat model for hardening and probes. [VERIFIED: .planning/ROADMAP.md] |

**Deprecated/outdated:**
- Treating Node `vm` as a hostile-code boundary is forbidden. [VERIFIED: AGENTS.md]
- Treating Python subprocess support as production sandbox proof is out of scope. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]
- Treating Python as counted/ranked or package-install capable is out of scope. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

All claims in this research were verified or cited; no user confirmation is needed before planning.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|

## Open Questions

1. **Should Phase 117 also add a monitor check for the new v1.18 baseline artifact?**
   - What we know: The phase requires monitor-readable JSON. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]
   - What's unclear: The phase request says no code implementation, so the monitor may be planned but not added in Phase 117. [VERIFIED: user request]
   - Recommendation: Plan artifact creation now and defer monitor integration to Phase 122 unless the Phase 117 plan explicitly allows a documentation-only structural check. [VERIFIED: .planning/ROADMAP.md]

2. **Should Python launch flags `-I` / `-P` be required in Phase 118?**
   - What we know: Python docs define isolated mode and safe-path behavior. [CITED: https://docs.python.org/3/using/cmdline.html]
   - What's unclear: Local Python is 3.9.6, and `-P` was added in Python 3.11. [CITED: https://docs.python.org/3/using/cmdline.html]
   - Recommendation: Phase 117 should record this as a hardening candidate, while Phase 118 verifies exact local flag support before implementation. [VERIFIED: local command 2026-05-25]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | TS tests, monitors, runtime-service | yes | `v24.15.0` | none needed. [VERIFIED: local command 2026-05-25] |
| pnpm | Workspace commands | yes | `11.1.2` | none needed. [VERIFIED: local command 2026-05-25] |
| Python | Python runtime baseline | yes | `3.9.6` | Phase 118 must handle missing/unsupported Python as fail-closed. [VERIFIED: local command 2026-05-25] |
| Go | Go backend tests | yes | `go1.26.3 darwin/amd64` | none needed. [VERIFIED: local command 2026-05-25] |
| Docker | Container readiness evidence | yes | `29.4.0` | Evidence can remain readiness-only if not required in Phase 117. [VERIFIED: local command 2026-05-25] |
| gVisor `runsc` | gVisor-style evidence | no | - | Use Docker/container evidence or document missing `runsc`. [VERIFIED: local command 2026-05-25] |

**Missing dependencies with no fallback:**
- None for Phase 117 artifact creation. [VERIFIED: user request]

**Missing dependencies with fallback:**
- `runsc` is missing; gVisor proof can remain deferred or use Docker readiness evidence until installed. [VERIFIED: local command 2026-05-25] [CITED: https://gvisor.dev/docs/]

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.6` in repo; Go `go test`; custom TS monitor scripts. [VERIFIED: package.json] |
| Config file | `vitest.config.ts`, package `tsconfig.json` files, `apps/go-backend/go.mod`. [VERIFIED: rg --files] |
| Quick run command | `pnpm --filter @cowards/spec test -- --run && pnpm --filter @cowards/runtime-service test -- --run` [VERIFIED: local command 2026-05-25] |
| Full suite command | `pnpm exec tsx scripts/check-boundary-monitors.ts` plus targeted package tests. [VERIFIED: local command 2026-05-25] |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| BASE-01 | v1.17 topology/registry baseline remains inspectable | monitor/artifact | `pnpm exec tsx scripts/check-boundary-monitors.ts` | yes. [VERIFIED: scripts/check-boundary-monitors.ts] |
| BASE-02 | Threat model categories are documented | artifact review | `test -f .planning/artifacts/v1.18-isolation-baseline.md` | no, Wave 0 artifact. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model] |
| BASE-03 | Promotion gates separate exhibition beta from production certification | artifact review | `test -f .planning/artifacts/v1.18-isolation-baseline.json` | no, Wave 0 artifact. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model] |
| BASE-04 | JS/TS runtime support remains intact | unit/contract | `pnpm --filter @cowards/spec test -- --run && pnpm --filter @cowards/runtime-service test -- --run` | yes. [VERIFIED: packages/spec/src/spec.test.ts] [VERIFIED: apps/runtime-service/src/execute-match.test.ts] |
| BASE-05 | Python remains runtime-only and non-counted | unit/monitor | `pnpm --filter @cowards/runtime-python test -- --run && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./...` | yes. [VERIFIED: packages/runtime-python/src/python-subprocess-adapter.test.ts] [VERIFIED: apps/go-backend/runtime_service_client_test.go] |

### Sampling Rate

- **Per task commit:** `pnpm --filter @cowards/spec test -- --run && pnpm --filter @cowards/runtime-service test -- --run`. [VERIFIED: local command 2026-05-25]
- **Per wave merge:** `pnpm --filter @cowards/runtime-python test -- --run && cd apps/go-backend && PATH=/usr/local/go/bin:$PATH go test ./... && pnpm exec tsx scripts/check-boundary-monitors.ts`. [VERIFIED: local command 2026-05-25]
- **Phase gate:** Confirm both v1.18 baseline artifacts exist, contain BASE-01 through BASE-05 coverage, and keep production sandbox/counting promotion false. [VERIFIED: .planning/REQUIREMENTS.md]

### Wave 0 Gaps

- [ ] `.planning/artifacts/v1.18-isolation-baseline.json` covers BASE-01 through BASE-05. [VERIFIED: .planning/REQUIREMENTS.md]
- [ ] `.planning/artifacts/v1.18-isolation-baseline.md` covers threat model categories and promotion criteria. [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes, later signed-in proof | Go/session-owned account routes; Phase 117 documents only. [VERIFIED: .planning/REQUIREMENTS.md] |
| V3 Session Management | yes, later signed-in proof | Existing Go auth/session routes remain selected normal routes. [VERIFIED: scripts/check-boundary-monitors.ts] |
| V4 Access Control | yes | Runtime-only boundary and owner/source privacy rules. [VERIFIED: AGENTS.md] |
| V5 Input Validation | yes | Zod/spec schemas and Go envelope validation; no hand-rolled Strategy trust. [VERIFIED: packages/spec/src/runtime-execution-service.ts] [VERIFIED: apps/go-backend/runtime_service_client.go] |
| V6 Cryptography | yes, artifact identity | SHA-256 source hashes and compatibility hashes are used for source identity, not custom crypto protocols. [VERIFIED: packages/runtime-python/src/validation.ts] |

### Known Threat Patterns for Runtime Isolation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Strategy code reads filesystem or host paths | Information Disclosure | Runtime capability denial, container/gVisor proof, public diagnostics redaction. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| Strategy code opens network or metadata services | Information Disclosure / Tampering | Network denial probes and no inherited tokens. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| Strategy code emits huge stdout/stderr or memory payloads | Denial of Service | Runtime byte caps and schema validation. [VERIFIED: packages/spec/src/runtime.ts] |
| Strategy code crashes adapter or emits malformed IPC | Denial of Service | Separate system failure taxonomy from Strategy runtime violations. [VERIFIED: packages/runtime-js/src/sandbox-evaluation.ts] |
| Diagnostics leak source, memory, stack, tokens, DB DSNs, or paths | Information Disclosure | Redaction plus public-output denylist monitors. [VERIFIED: scripts/check-boundary-monitors.ts] |
| Runtime unavailable falls back silently | Spoofing / Tampering | Fail-closed no JS/TS, Go, or TypeScript backend fallback. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` - non-negotiable project/runtime/privacy constraints. [VERIFIED: AGENTS.md]
- `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`, `.planning/research/SUMMARY.md` - active v1.18 scope and baseline. [VERIFIED: repo files]
- `.planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md` - locked Phase 117 decisions. [VERIFIED: repo file]
- `.planning/milestones/v1.17-MILESTONE-AUDIT.md`, `.planning/milestones/v1.17-REQUIREMENTS.md`, `.planning/milestones/v1.17-phases/*/*-SUMMARY.md` - v1.17 shipped baseline and residuals. [VERIFIED: repo files]
- `.planning/artifacts/v1.17-runtime-broker-registry.json` and `.md` - runtime broker baseline. [VERIFIED: repo files]
- `packages/spec/src/runtime.ts`, `packages/runtime-python/src/*`, `apps/runtime-service/src/*`, `apps/go-backend/runtime_service_client.go`, `scripts/check-boundary-monitors.ts`, `scripts/check-local-topology.ts` - current code baseline. [VERIFIED: repo files]
- Local verification commands on 2026-05-25: spec, runtime-python, runtime-service, Go backend, typecheck subset, and boundary monitors passed. [VERIFIED: local command 2026-05-25]

### Secondary (MEDIUM confidence)
- Python command-line docs for `-I`, `-P`, and `PYTHONSAFEPATH`: https://docs.python.org/3/using/cmdline.html. [CITED: docs.python.org]
- Node child process docs for spawn/stdio/env/sync behavior: https://nodejs.org/api/child_process.html. [CITED: nodejs.org]
- Docker run docs for memory, network, read-only, capabilities, and security options: https://docs.docker.com/reference/cli/docker/container/run/. [CITED: docs.docker.com]
- gVisor docs and security intro for `runsc` and sandbox model: https://gvisor.dev/docs/ and https://gvisor.dev/docs/architecture_guide/intro/. [CITED: gvisor.dev]
- npm registry version checks for Vitest, Playwright, TypeScript, and Turbo. [VERIFIED: npm registry]

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - versions were read from repo and local commands; npm registry checked current package versions. [VERIFIED: package.json] [VERIFIED: npm registry]
- Architecture: HIGH - current topology, registry, and authority boundaries are documented in v1.17 artifacts and enforced by monitors. [VERIFIED: .planning/artifacts/v1.17-runtime-broker-registry.json] [VERIFIED: scripts/check-boundary-monitors.ts]
- Pitfalls: HIGH - v1.17 audit and Phase 117 context explicitly name the main failure modes. [VERIFIED: .planning/milestones/v1.17-MILESTONE-AUDIT.md] [VERIFIED: .planning/phases/117-isolation-baseline-and-threat-model/117-CONTEXT.md]

**Research date:** 2026-05-25  
**Valid until:** 2026-06-01 for fast-moving runtime/tooling claims; repo-local baseline valid until Phase 117 implementation changes it. [VERIFIED: current date]
