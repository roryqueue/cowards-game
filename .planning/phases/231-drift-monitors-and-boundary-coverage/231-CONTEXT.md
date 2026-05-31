# Phase 231: Drift Monitors and Boundary Coverage - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 231 converts old non-promotion monitors into positive four-language parity and boundary monitors. It blocks future direct product special-casing and proves web/API/Go still do not execute Strategy code.

</domain>

<decisions>
## Implementation Decisions

### Monitor Conversion
- **D-01:** Existing non-promotion monitors must be converted deliberately into positive parity, eligibility, privacy, no-fallback, ABI, and provider-boundary checks.
- **D-02:** Do not simply delete old monitors to make promotion pass.
- **D-03:** Monitors should fail when active product code directly special-cases `typescript`, `python`, `rust`, or `zig` outside approved registry/provider/adapter boundaries.

### Boundary Coverage
- **D-04:** Import monitors must prove web/API/Go do not execute Strategy code and do not import runtime implementation internals except through approved service clients or schemas.
- **D-05:** Contract monitors must prove any DTO/service/ABI/Match execution contract change is intentional, versioned or migrated, and public-safe.

### The Agent's Discretion
- Define a pragmatic allowlist for approved language-specific files. Keep it narrow and documented.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/REQUIREMENTS.md` - `MON-01..MON-05`.
- `.planning/ROADMAP.md` - Phase 231 success criteria.
- `.planning/phases/222-language-surface-inventory/222-CONTEXT.md`
- `.planning/phases/228-cross-language-golden-strategy-corpus-and-parity-matrix/228-CONTEXT.md`
- `.planning/phases/230-result-replay-public-evidence-and-docs-language-pass/230-CONTEXT.md`

### Code
- `scripts/check-boundary-monitors.ts` - Main boundary monitor suite.
- `scripts/check-boundary-monitors.test.ts` - Monitor tests.
- `scripts/check-service-boundary-imports.ts` - Service boundary import monitor.
- `scripts/check-service-boundary-imports.test.ts` - Import monitor tests.
- `scripts/check-public-discovery-boundary.ts` - Public discovery monitor.
- `packages/spec/src/runtime.ts` - Registry/provider semantics to validate.
- `apps/web/lib/runtime-labels.ts` - Existing label-helper target for drift monitor.

### Evidence
- `.planning/artifacts/v1.24-runtime-abuse-lab-evidence.md`
- `.planning/artifacts/v1.25-match-execution-boundary-inventory.md`
- `.planning/artifacts/v1.31-public-site-spine-proof.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/check-boundary-monitors.ts` already has a large set of assertions and artifact readers.
- Existing import monitors already know some forbidden runtime package boundaries.

### Established Patterns
- Monitors are executable proof, not documentation only.
- Negative old claims should become positive current claims with equivalent strength.

### Integration Points
- Package scripts, CI commands, public privacy checks, provider registry tests, and proof artifacts.

</code_context>

<specifics>
## Specific Ideas

The direct-special-case monitor is the heart of long-term drift prevention. It should allow provider/adapter implementations to specialize by language while blocking product surfaces from doing so directly.

</specifics>

<deferred>
## Deferred Ideas

External security review or production sandbox certification is deferred unless already supported by the phase evidence.

</deferred>

---

*Phase: 231-Drift Monitors and Boundary Coverage*
*Context gathered: 2026-05-31*
