# Phase 11: Doctrine Debugging UX - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase improves Workshop and replay debugging so players can understand validation failures, runtime violations, replay availability, and why Soldiers did nothing. It must keep rule explanations data-driven from replay/engine/runtime facts and preserve public replay privacy.

</domain>

<decisions>
## Implementation Decisions

### Explanation Style
- **D-01:** "Why did this Soldier do nothing?" explanations should expose structured cause codes for tests and concise labels/copy for users.
- **D-02:** Required cause coverage includes: not selected, invalid action, blocked movement, timeout, thrown exception, STONE, FALLEN, and Match ended.

### Debug Overlay Visibility
- **D-03:** Owner debug overlays are owner-only and opt-in.
- **D-04:** Owner debug overlays must never appear in public projection. Public replay should stay clean while owner/debug mode can show richer explanations.

### Sample Strategies
- **D-05:** Sample Strategies should teach both mechanics and failure modes.
- **D-06:** Include samples for basic advance/turn, push setup, Backstab setup, stoning/blocking, runtime violation examples, and a minimal do-nothing or invalid-output example.
- **D-07:** Samples should also be useful as test inputs where practical.

### Workshop Replay Links
- **D-08:** Workshop should show direct replay links only when a completed Match has replay data.
- **D-09:** Pending, running, and failed states should explain why replay is unavailable rather than showing dead links.

### Validation Messaging
- **D-10:** Validation and runtime messages should be actionable but not verbose.
- **D-11:** Messages should name the violated Strategy API constraint and one remediation step.
- **D-12:** Avoid long docs dumps in the UI; link or reference docs/samples where useful.

### the agent's Discretion
- The planner may choose exact copy, DTO names, component placement, and sample source text as long as explanations remain data-driven and privacy-safe.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Milestone Context
- `.planning/PROJECT.md` — Current v1.1 goal and UX/privacy constraints.
- `.planning/REQUIREMENTS.md` — Phase 11 requirements DEBUG-01 through DEBUG-06.
- `.planning/ROADMAP.md` — Phase 11 goal, success criteria, and phase boundary.
- `.planning/research/SUMMARY.md` — v1.1 research summary.
- `.planning/research/FEATURES.md` — Doctrine debugging feature expectations.
- `.planning/research/ARCHITECTURE.md` — Replay debug DTO direction.
- `.planning/research/PITFALLS.md` — React rule-inference and privacy pitfalls.
- `.planning/phases/08-replay-fixture-fidelity-and-visual-regression/08-CONTEXT.md` — Demo corpus and fixture diagnostics that sample/debug UX can reuse.
- `.planning/phases/09-strict-chronicle-grammar-and-compatibility/09-CONTEXT.md` — Privacy and validation failure policies.
- `.planning/phases/10-runtime-isolation-hardening/10-CONTEXT.md` — Runtime failure taxonomy that should feed debugging explanations.

### Source Specifications
- `CowardsGameSpec_Full_Consolidated_v1.md` — Strategy API, Soldier state, Action, STONE/FALLEN, and replay terminology.
- `CowardsGame_Technical_Architecture_Spec_V1.md` — Workshop/replay/runtime architecture boundaries.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/web/app/workshop/workshop-client.tsx`: Current Workshop UI for templates, validation, revisions, tests, status, and replay links.
- `apps/web/app/workshop/workshop-client-state.ts`: Helper layer for validation headings, submit/test status copy, replay link availability, and display decisions.
- `apps/web/app/matches/[matchId]/replay/replay-client.tsx`: Replay UI and owner Awareness Grid inspection surface.
- `apps/web/app/matches/[matchId]/replay/replay-state.ts`: Replay state helpers and likely home for UI-level selection/explanation helpers if they consume DTOs.
- `packages/replay/src/project.ts`: Public/owner projection boundary for owner-only debug payloads.
- `packages/runtime-js/src/validation.ts`: Validation issue creation and Strategy API messaging source.

### Established Patterns
- Workshop currently uses small helper functions for status/copy decisions; extend that pattern before embedding branching logic deeply in JSX.
- Owner debug mode already exists as an opt-in query/env-gated replay path.
- Replay components should render DTOs and projected state, not infer game rules.

### Integration Points
- Runtime failure taxonomy from Phase 10 should feed replay/debug explanation cause codes.
- Chronicle grammar and projection behavior from Phase 9 should define which debug details are available to public versus owner viewers.
- Sample Strategies likely connect Workshop templates, runtime validation tests, and canonical demo fixture generation.
</code_context>

<specifics>
## Specific Ideas

- Use structured cause codes internally, with short user-facing copy.
- Keep owner debug useful but invisible to public replay.
- Treat sample Strategies as both teaching tools and regression inputs.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---

*Phase: 11-Doctrine Debugging UX*
*Context gathered: 2026-05-18*
