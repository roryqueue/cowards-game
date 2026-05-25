# Phase 115: Python Starter Strategy and Replay Proof - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 115 delivers the visible end-to-end Python proof: users can load a small experimental Python Starter Strategy, validate and submit it, run it in a non-counted MatchSet against an approved JS/TS or fixture opponent, and inspect replay evidence with safe runtime labels and plausible in-bounds Match state.

This phase does not make Python a first-class multi-language product suite, counted/ranked language, or production sandbox.

</domain>

<decisions>
## Implementation Decisions

### Starter Strategy
- **D-01:** The Python Starter Strategy should be a tactical showcase, not a toy no-op.
- **D-02:** Keep the starter bounded and easy to reason about: demonstrate activation selection and SoldierBrain decisions without competitive tuning or complex strategy lore.
- **D-03:** Label the starter and created revision as experimental and non-counted.

### Proof Match
- **D-04:** Run the Python starter against an existing JS/TS starter or approved fixture opponent.
- **D-05:** The proof MatchSet must be non-counted and must use the runtime-service/broker path.
- **D-06:** Mixed JS/TS-vs-Python proof is acceptable.

### Replay Evidence
- **D-07:** Replay should emphasize safe runtime labels enough that the user can tell Python participated.
- **D-08:** Replay/public output must not expose Strategy source, StrategyMemory, SoldierMemory, objectives, owner debug, raw private grids, stderr, stack, host paths, package paths, tokens, DB DSNs, or private runtime internals.
- **D-09:** Browser/page smoke must verify a plausible full Match start with visible Soldiers and terrain inside declared board bounds.

### the agent's Discretion
The agent may choose the exact starter tactics and opponent, provided the proof is realistic, deterministic, and not tuned as a competitive advantage.

</decisions>

<specifics>
## Specific Ideas

The user narrowed the starter to "bounded tactics": useful enough to demonstrate real behavior, not a competitive-tuning exercise. The recommended proof is Python starter versus an existing JS/TS starter.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Active v1.17 Context
- `.planning/REQUIREMENTS.md` - PROOF requirements.
- `.planning/ROADMAP.md` - Phase 115 scope and success criteria.
- `.planning/phases/112-python-submission-validation-and-diagnostics/112-CONTEXT.md` - Validation policy.
- `.planning/phases/113-python-runtime-execution-behind-broker-abi/113-CONTEXT.md` - Execution path.
- `.planning/phases/114-go-orchestration-and-non-counted-eligibility/114-CONTEXT.md` - Non-counted exhibition policy.

### Replay And UI Baseline
- `AGENTS.md` - Replay privacy and board realism checks.
- `CowardsGameSpec_Full_Consolidated_v1.md` - Canonical Match/replay terminology.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/workshop/**`: Workshop authoring and revision submission surfaces.
- `apps/web/app/exhibitions/new/exhibition-client.tsx`: Exhibition creation UX.
- `apps/web/app/replays/**` or replay route surfaces: Replay evidence rendering.
- Existing starter Strategy library files under the web/persistence/spec packages.
- Existing page-smoke scripts and topology checks that validate replay board realism.

### Established Patterns
- First screen should be the usable Workshop/exhibition/replay experience, not a landing page.
- Public replay labels can expose safe metadata but not owner-private Strategy data.
- Page smoke should validate visible pieces are not clipped/off-screen.

### Integration Points
- Phase 116 will harden monitors around this proof.
- Milestone verification should link the Workshop, exhibition creation, and replay proof pages.

</code_context>

<deferred>
## Deferred Ideas

- Multi-language tutorial/product documentation.
- Competitive Python starter tuning.
- Python ranked/ladder entry.
- Arbitrary package-powered examples.

</deferred>

---

*Phase: 115-python-starter-strategy-and-replay-proof*
*Context gathered: 2026-05-25*
