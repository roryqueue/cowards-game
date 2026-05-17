# Phase 6: Strategy Workshop UX - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the first usable local Strategy Workshop loop: a single focused web workbench where a local player edits one active strategy in Monaco, starts from bundled doctrine templates, sees live validation, submits valid immutable Strategy Revisions, browses revision history, and launches quick local Workshop test matches against bundled sample opponents.

This phase is about local authoring and iteration. It is not multiplayer matchmaking, ranked competition, full replay viewing, or a general strategy-management product.

</domain>

<decisions>
## Implementation Decisions

### Workshop Shape
- **D-01:** Build a single focused workbench for the Phase 6 MVP rather than a tabbed or wizard-driven app. Monaco should be the main authoring surface, with templates, validation, revision history, and test controls available around the editor.
- **D-02:** Keep the Workshop code-first. Doctrine templates are starter sources/scaffolds, not a guided no-code strategy builder.
- **D-03:** The Workshop should target the existing runtime source contract: `export default { selectActivations, soldierBrain }`. Strategies remain self-contained with no imports or helper injection unless earlier runtime contracts are explicitly expanded in a later phase.

### Templates
- **D-04:** Users can start from bundled sample doctrine templates. The first set should align with existing seed strategies where practical, especially cautious/defensive and reckless/aggressive examples.
- **D-05:** Template application should support local iteration: users can load a template into the draft editor and then modify it before validation/submission.

### Validation UX
- **D-06:** Use live debounced validation plus a manual Validate action. Validation should run shortly after edits pause, while still letting the user explicitly recheck.
- **D-07:** Validation feedback should prioritize actionable errors first: missing default export, missing strategy methods, forbidden capabilities, async methods, source size, and transpile failures.
- **D-08:** Advanced validation details such as source hash, byte count, runtime version, spec version, engine compatibility, and forbidden-pattern details should be visible in a compact secondary section rather than dominating the error panel.
- **D-09:** Invalid drafts cannot be submitted as Strategy Revisions.

### Revision Submission and History
- **D-10:** Submitting a valid draft creates a new immutable Strategy Revision with optional label/notes.
- **D-11:** Revision history should show enough information for selection and trust: label, created time, validity, source hash, byte count, and whether the revision has been used in a match when that data is available.
- **D-12:** The Phase 6 history surface should make selecting a revision for tests straightforward. Diff-heavy comparison UI is deferred.

### Workshop Test Matches
- **D-13:** The primary test flow is a quick test against bundled sample opponents. The user chooses current/selected revision, sample opponent, arena, and preset.
- **D-14:** The test UI should show queued/running/complete status and a scoring/result summary when available.
- **D-15:** Full replay viewing is out of scope for Phase 6 and belongs to Phase 7. Phase 6 can link to or reserve space for future replay details, but should not implement the board replay UI.
- **D-16:** Full arbitrary matrix building is deferred. The initial flow should use existing named presets such as smoke/standard/stress where available.

### Local Identity and Persistence
- **D-17:** Phase 6 assumes a single local player and a single active strategy to keep the first Workshop focused.
- **D-18:** Even with simple local identity, revision creation should use the real persisted Strategy Revision path so future phases can build on durable history.
- **D-19:** Strategy/user management beyond the local player and active strategy is deferred.

### the agent's Discretion
- The agent may choose exact layout details, component boundaries, API route names, and small copy labels as long as the resulting UI preserves the focused edit-validate-submit-test loop.
- The agent may choose the initial bundled template count and wording, provided they demonstrate meaningfully different doctrine styles and validate successfully.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Planning
- `.planning/ROADMAP.md` — Defines Phase 6 goal, mode, requirements, success criteria, and boundary notes.
- `.planning/REQUIREMENTS.md` — Defines UX-01 through UX-06 for Strategy Authoring UX.
- `.planning/PROJECT.md` — Defines project direction, stack, and priority for Workshop-style local iteration before ranked infrastructure.

### Prior Phase Context
- `.planning/phases/04-strategy-runtime-sandbox/04-CONTEXT.md` — Defines runtime authoring contract, validation expectations, self-contained strategies, and deferred Monaco/template UX.
- `.planning/phases/05-match-orchestration-and-persistence/05-CONTEXT.md` — Defines persisted Strategy Revision, Match, MatchSet, seed, preset, status, scoring, and locking decisions this Workshop should reuse.
- `.planning/phases/03-chronicle-and-replay-core/03-CONTEXT.md` — Defines replay package direction and clarifies that full replay UI belongs to Phase 7.

### Source Contracts
- `apps/web/app/page.tsx` — Current web entrypoint is only a scaffold and is expected to become the Workshop surface.
- `apps/web/app/layout.tsx` — Current web app layout shell.
- `apps/web/package.json` — Current web dependencies; Monaco is not yet installed.
- `packages/runtime-js/src/validation.ts` — Existing validation report shape and validation behavior for Strategy source.
- `packages/runtime-js/src/revision.ts` — Existing immutable Strategy Revision builder.
- `packages/persistence/src/repositories.ts` — Existing user/strategy/revision/arena repository functions.
- `packages/persistence/src/match-service.ts` — Existing single Match creation service.
- `packages/persistence/src/matchset-service.ts` — Existing MatchSet creation service and preset integration.
- `packages/persistence/src/presets.ts` — Existing smoke/standard/stress MatchSet presets.
- `packages/persistence/src/seed.ts` — Existing local seed users, sample strategies, arenas, and template-like Strategy source examples.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `validateStrategySource(source)` returns a structured report with `valid`, `errors`, `warnings`, `sourceBytes`, `forbiddenPatterns`, `sourceHash`, runtime version, and engine compatibility.
- `buildStrategyRevision({ source, strategyId, metadata })` creates deterministic immutable Strategy Revision artifacts and reuses validation.
- `createDevelopmentSeedData()` already contains cautious and reckless valid Strategy sources that can seed first Workshop templates or opponents.
- `createMatchService(pool).createMatch(...)` and `createMatchSetService(pool).createFromPreset(...)` provide existing durable match orchestration paths.

### Established Patterns
- Strategy Revision IDs are content-derived and immutable; Workshop submission should not invent mutable revision semantics.
- Match and MatchSet creation lock Strategy Revisions when used, so the Workshop history can eventually reflect used-in-match status.
- Phase 5 selected named versioned presets and explicit caller-provided side assignment/seed; the Workshop test UI should expose simple choices rather than hide reproducibility completely.
- The web app is currently minimal, so Phase 6 will establish the first real frontend patterns.

### Integration Points
- Add Monaco support to `apps/web` for the editor surface.
- Add web-accessible validation and revision submission flows that call or wrap `@cowards/runtime-js` and persistence APIs.
- Add Workshop test launch flow using the existing persistence services and bundled sample opponents/arenas.
- Preserve future compatibility with Phase 7 by storing real Match/MatchSet identifiers and statuses rather than producing throwaway fake results.

</code_context>

<specifics>
## Specific Ideas

- The first screen should be the actual Workshop, not a marketing or landing page.
- Use one local player and one active strategy for this phase.
- Use live debounced validation with manual recheck.
- Revision submission should accept optional label/notes.
- Test matches should be quick to launch against bundled sample opponents and should report status/result summary without attempting full replay UI.

</specifics>

<deferred>
## Deferred Ideas

- Full replay viewer and timeline/board inspection are deferred to Phase 7.
- Strict exhaustive Strategy grammar remains deferred until after the core runtime, persistence, Workshop, and replay loops exist.
- Full arbitrary local matrix builder is deferred.
- Multiple named strategies, profile setup, and broader database-backed strategy management are deferred.
- Diff-heavy revision comparison is deferred.
- Multiplayer matchmaking, ranked competitive use, and community sharing are out of scope for this phase.

</deferred>

---

*Phase: 6-Strategy Workshop UX*
*Context gathered: 2026-05-17*
