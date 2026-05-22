# Phase 44: Demo, Docs, Verification - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 44 creates v1.6 local demo analytics data, browser-verifies the end-to-end study flow, updates documentation, and audits privacy/runtime/determinism before milestone completion. It proves the built v1.6 system; it does not add new product capabilities beyond demo data, docs, verification artifacts, and milestone audit evidence.

</domain>

<decisions>

## Implementation Decisions

### Demo Scenario Shape

- **D-01:** Demo uses multiple Strategies vs Starter + Advanced profiles.
- **D-02:** Use 2-3 representative owned/local Strategies.
- **D-03:** Include all Starter opponents plus selected Advanced archetypes enough to reveal weak and strong archetype patterns.
- **D-04:** Demo copy frames results as local benchmark evidence, not durable rankings, official tournament outcomes, or permanent balance truth.
- **D-05:** Data volume should be large enough to show meaningful strong/thin/degraded states where feasible, but not so large it becomes an operations/tournament milestone.
- **D-06:** Include controlled synthetic/demo examples for degraded, system-failed, and replay-unavailable states.
- **D-07:** Synthetic/demo states must be clearly labeled as demo/fixture evidence where surfaced.
- **D-08:** Synthetic/demo states exist to verify UI/privacy/status handling, not to influence real Strategy performance claims.
- **D-09:** Synthetic/demo states must not execute hostile Strategy code in web/API.
- **D-10:** Real completed runs carry the main study story.

### Browser Verification Scope

- **D-11:** Browser verification uses acceptance path plus representative edge states, not exhaustive combinatorial coverage.
- **D-12:** Mandatory end-to-end demo path: Strategy -> heatmap -> weak archetype -> Evidence Explorer -> replay moment -> export.
- **D-13:** Browser checks cover heatmap desktop/mobile non-overlap.
- **D-14:** Browser checks cover explorer filtering/sorting/drilldown representative path.
- **D-15:** Browser checks cover replay deep-link focus and fallback.
- **D-16:** Browser checks cover export controls in authorized owner/local context.
- **D-17:** Browser checks cover degraded, system-failed, and replay-unavailable representative states.
- **D-18:** Public privacy must be inspected on public-facing pages.
- **D-19:** Owner paths must be checked only under authorized/local-owner context.

### Audit Emphasis

- **D-20:** Final milestone audit uses four sections: requirement coverage, privacy boundary, runtime isolation, and deterministic evidence/UX verification.
- **D-21:** Requirement checklist lives inside the requirement coverage section.
- **D-22:** Privacy boundary gets its own section even if all requirements pass.
- **D-23:** Runtime isolation gets its own section proving analytics/profile/export routes do not execute Strategy code in web/API.
- **D-24:** Deterministic evidence/UX verification section covers summary ordering, profile hashes/compatibility keys, evidence bands, replay moment selection, browser checks, and demo artifacts.
- **D-25:** Audit should link to demo artifacts, browser verification notes, and relevant automated tests.

### Docs and Regeneration

- **D-26:** v1.6 demo/regeneration docs live primarily as milestone phase artifacts with concise README/docs links or notes where relevant.
- **D-27:** Keep detailed demo report/regeneration docs under Phase 44 or `.planning/milestones` artifacts to avoid bloating the main README.
- **D-28:** Documentation must cover saved gauntlet profiles, compatibility-equivalent comparison, evidence bands, heatmap interpretation, replay deep links, export privacy, and local demo regeneration.
- **D-29:** Documentation must repeat non-durable framing.
- **D-30:** Regeneration instructions must not require exposing private Strategy data, memory, objectives, raw Awareness Grid, owner debug, stack traces, or runtime internals.

### the agent's Discretion

- The user approved auto-locking standard privacy, runtime isolation, deterministic evidence, browser verification, and non-durable demo framing expectations.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — v1.6 milestone goal, core value, privacy/runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 44 requirements VER-01 through VER-07.
- `.planning/ROADMAP.md` — Phase 44 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 research direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Analytics contracts, determinism, evidence bands, compatibility, replay references.
- `.planning/phases/39-saved-gauntlet-profiles/39-CONTEXT.md` — Saved profile/run model and comparison semantics.
- `.planning/phases/40-matchup-heatmaps/40-CONTEXT.md` — Heatmap UX and browser verification expectations.
- `.planning/phases/41-evidence-explorer-ux/41-CONTEXT.md` — Explorer navigation, filters, drilldowns, empty/failure states.
- `.planning/phases/42-replay-deep-links/42-CONTEXT.md` — Replay moment targeting, URL/fallback/owner-debug behavior.
- `.planning/phases/43-owner-export-and-privacy/43-CONTEXT.md` — Export scope, authorization, CSV safety, UI privacy framing.

### Existing Demo, Browser, and Verification Code

- `scripts/run-v1-5-advanced-demo.ts` — Prior milestone demo generation pattern to adapt or reference.
- `scripts/run-v1-4-demo-tournament.ts` — Earlier local demo generation pattern.
- `apps/web/e2e/workshop-to-replay.spec.ts` — Service-backed Workshop-to-replay E2E pattern.
- `apps/web/e2e/replay.fixture.spec.ts` — Replay fixture browser verification pattern.
- `apps/web/e2e/replay.visual.spec.ts` — Replay visual verification pattern.
- `playwright.config.ts` — Browser test configuration.
- `package.json` — Existing verification scripts and command slices.
- `README.md` — Top-level docs location for concise links/notes.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- v1.5 demo script generated local Advanced evidence, reports, and links; Phase 44 can reuse the report/demo style.
- Existing Playwright specs already cover Workshop-to-replay and replay visual paths.
- Package scripts provide test/verify/e2e command entry points.

### Established Patterns

- Demo evidence is local/non-durable and must be framed as benchmark/demo evidence.
- Browser verification should be targeted and representative, not combinatorial.
- Privacy/runtime audits should be explicit milestone artifacts, not incidental test output.
- Documentation should live near milestone artifacts with concise README signposts.

### Integration Points

- Add v1.6 demo generation/report artifacts under Phase 44 or milestone artifacts.
- Add browser verification notes/screenshots/results for the acceptance path and representative edge states.
- Add/update docs for saved profiles, compatibility comparison, evidence bands, heatmaps, replay deep links, export privacy, and regeneration.
- Produce final milestone audit with four sections and links to tests/demo/browser artifacts.

</code_context>

<specifics>

## Specific Ideas

- The final demo should feel like a Strategy study loop, not a tournament page.
- Controlled degraded/system/replay-unavailable states are acceptable when clearly labeled as demo/fixture evidence.
- The audit should be useful to future maintainers: what passed, what privacy/runtime boundaries were checked, and how to regenerate the local demo.

</specifics>

<deferred>

## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 44-Demo, Docs, Verification*
*Context gathered: 2026-05-22*
