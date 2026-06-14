# Phase 242: Four-Language Checker Proof, Privacy, and Audit - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 242 proves and audits the completed v1.34 Workshop checker work. It should add focused tests plus at least one service-backed end-to-end proof covering TypeScript, Python, Rust, and Zig Validate source paths through the real Workshop app/API route and runtime-service/provider semantics where required. It should also run strict privacy scans, boundary monitors, and final evidence/audit documentation before milestone archive/tag readiness.

</domain>

<decisions>
## Implementation Decisions

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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning and Prior Decisions
- `.planning/PROJECT.md` - Current milestone state and shipped baseline.
- `.planning/REQUIREMENTS.md` - `CHECKTEST-01..CHECKTEST-05`, privacy, proof, and audit requirements.
- `.planning/ROADMAP.md` - Phase 242 goal, canonical refs, and success criteria.
- `.planning/STATE.md` - Current resume state and boundary notes.
- `.planning/phases/238-workshop-checker-path-inventory-and-public-contract/238-CONTEXT.md` - Checker contract decisions.
- `.planning/phases/239-provider-grade-validate-source-parity/239-CONTEXT.md` - Provider parity implementation decisions.
- `.planning/phases/240-language-diagnostic-ux-and-availability-states/240-CONTEXT.md` - Diagnostic and UI decisions.
- `.planning/phases/241-checker-ergonomics-caching-and-boundary-monitors/241-CONTEXT.md` - Caching and boundary decisions.
- `.planning/artifacts/v1.34-workshop-checker-contract.md` - Public checker response contract and privacy exclusions.
- `.planning/artifacts/v1.34-workshop-checker-parity-matrix.md` - Gaps and proof targets.
- `.planning/artifacts/v1.32-four-language-signed-in-proof.md` - Prior all-language service-backed proof baseline.
- `.planning/artifacts/v1.33-tinygo-wasi-spike-evidence.md` - TinyGo hidden/spike-only proof baseline.

### Code and Test Paths
- `apps/web/app/api/workshop/validate/route.ts` - Route to exercise in service-backed checker proof.
- `apps/web/app/workshop/workshop-client.tsx` - UI surface for optional/browser checker proof and privacy scans.
- `apps/web/app/api/workshop/revisions/route.ts` - Submit/save consistency tests.
- `apps/runtime-service/src/server.ts` - Runtime-service provider validation endpoint.
- `packages/runtime-js/src/validation.ts` - TypeScript validation baseline.
- `packages/runtime-python/src/validation.ts` - Python provider validation.
- `packages/runtime-wasm-wasi/src/validation.ts` - Rust/Zig toolchain, compile, import, and artifact validation.
- `packages/spec/src/runtime.ts` - Provider registry, TinyGo absence, ABI posture, and boundary labels.
- `apps/go-backend/live_backend.go` - Entry/account/provider proof behavior relevant to parity tests and deferred gap documentation.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Prior v1.32 service-backed all-language proof can inform the four-language checker proof shape.
- Existing runtime-service `/validate-strategy` endpoint can be driven directly by the app route for E2E validation.
- Existing boundary/privacy monitor patterns from earlier milestones should be reused where possible.

### Established Patterns
- Milestone evidence artifacts record commands, local service availability, proof outcomes, and known limitations.
- Public/default privacy scans have repeatedly checked for raw diagnostics, source, runtime internals, memory, objective payloads, paths, tokens, and artifact bytes.
- Runtime-service/toolchain unavailability should be treated as a system/toolchain condition rather than a Strategy invalidity.

### Integration Points
- Service-backed proof should call the real `/api/workshop/validate` route rather than bypassing app/API normalization.
- Negative probes should verify unavailable/toolchain states and privacy redaction.
- Final audit should incorporate Phase 239-241 summaries, test output, proof artifacts, and known deferred gaps such as the TypeScript Go account-save mismatch if still unresolved.

</code_context>

<specifics>
## Specific Ideas

- Focused proof should prioritize the four Workshop checker paths over a full replay journey.
- Privacy scans should cover generated proof artifacts, not just live HTTP responses.
- Local environment limitations are acceptable only when recorded honestly and paired with unavailable-state proof.

</specifics>

<deferred>
## Deferred Ideas

- Full edit-submit-entry-replay proof is not required unless Phase 242 identifies a checker-specific parity gap that needs it.
- Broad Go TypeScript account-save/provider-proof cleanup may remain deferred if documented and not blocking v1.34 checker claims.
- Any missing local Rust/Zig toolchain support should be recorded as an environment limitation, not silently skipped.

</deferred>

---

*Phase: 242-Four-Language Checker Proof, Privacy, and Audit*
*Context gathered: 2026-06-14*
