# Phase 216: Public Page Proof - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 216 produces fixture-backed or signed-in public page proof across the v1.29 target result and replay states. It records public URLs, classifications, contract version, evidence rows, replay availability, board realism, privacy scans, and visual references. It must not require non-JS counted execution or expose internal recovery/operator details.

</domain>

<decisions>
## Implementation Decisions

### Proof Mode
- **D-01:** Prefer fixture-backed proof for public UX states because v1.29 is presentation/proof over existing DTOs.
- **D-02:** Signed-in live proof is optional and should use JS/TS counted execution only if fixture proof is insufficient for a specific public page state.
- **D-03:** Python, Rust, and Zig remain non-counted exhibition beta and are not required for v1.29 public UX proof.

### State Coverage
- **D-04:** Public result proof must cover completed, queued, running, degraded, failed, stale-artifact, unavailable-runtime, malformed-runtime-result, missing-Chronicle, and no-result states.
- **D-05:** Replay proof must cover ready replay plus replay-unavailable/missing-Chronicle/invalid-Chronicle/stale-evidence/no-result where current app representation allows.

### Proof Artifact
- **D-06:** Proof should write public-safe JSON and Markdown artifacts with contract version, URLs, state classifications, evidence rows, replay availability, board realism result, privacy scan result, visual references, and explicit non-claims.
- **D-07:** Proof artifacts must state no contract expansion, no DTO field addition, no runtime promotion, no production sandbox certification, no ABI migration, no counted non-JS play, no operator UI, and no Strategy execution in web/API/Go.

### the agent's Discretion
The agent may decide whether to make this a new Playwright spec, a TSX proof script, or a hybrid, as long as it is repeatable and monitor-friendly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/REQUIREMENTS.md` - `PROOF-*` requirements.
- `.planning/workstreams/v1-29-replay-and-result-trust-polish/ROADMAP.md` - Phase 216 success criteria.

### Existing Proof
- `apps/web/e2e/v1-25-match-execution-fixtures.spec.ts` - Fixture-backed public page proof pattern.
- `apps/web/e2e/v1-28-operations-recovery-proof.spec.ts` - Signed-in proof and artifact-writing pattern.
- `apps/web/e2e/replay.visual.spec.ts` - Visual proof and canvas-pixel checks.
- `scripts/evaluate-v1-28-match-execution-operations.ts` - Proof artifact generator pattern.
- `.planning/artifacts/v1.28-signed-in-operations-recovery-proof.md` - Signed-in proof summary example.

### Public Pages and Fixtures
- `apps/web/app/matchsets/[matchSetId]/page.tsx` - Result page under proof.
- `apps/web/app/matches/[matchId]/replay/page.tsx` - Replay page entrypoint.
- `apps/web/lib/match-execution-fixture-adapter.ts` - Fixture adapter.
- `packages/spec/src/match-execution-contract.ts` - Fixture catalog and app contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing E2E proof can open fixture MatchSet URLs and scan body text.
- v1.28 proof already writes JSON/Markdown artifacts from Playwright.
- Replay visual test utilities can detect nonblank/canvas rendering and screenshots.

### Established Patterns
- Live signed-in proof is guarded by environment flags.
- Fixture proof is allowed only in test/dev mode and must not become production fallback.
- Proof artifacts include non-claims and privacy scans.

### Integration Points
- New artifact paths should be consumed by Phase 215 monitor checks.
- New script/package command may be added if proof should run independently.

</code_context>

<specifics>
## Specific Ideas

Create a v1.29 proof artifact that lists every target state and marks coverage as result page, replay page, privacy scan, visual proof, and board realism proof.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

*Phase: 216-Public Page Proof*
*Context gathered: 2026-05-31*
