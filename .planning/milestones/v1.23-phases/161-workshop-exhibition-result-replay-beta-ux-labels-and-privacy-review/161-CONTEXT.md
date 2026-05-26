# Phase 161: Workshop/Exhibition/Result/Replay Beta UX Labels and Privacy Review - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Align user-facing labels, public evidence, result pages, and replay pages with the actual Rust/Zig promotion state proven so far. This phase reviews and adjusts UX/privacy surfaces; it should not create new runtime capabilities, rerun the full signed-in proof, or decide final promotion alone.

</domain>

<decisions>
## Implementation Decisions

### Label Semantics
- **D-01:** All Rust/Zig labels must derive from actual evidence state: alpha until a language passes the v1.23 gates; non-counted exhibition beta only after evidence supports that language.
- **D-02:** UI text should use compact persistent labels, but must not drop "non-counted" or imply ranked/ladder/counting/sandbox support.
- **D-03:** Workshop, account save, exhibition creation, MatchSet result, and replay surfaces must agree on the same language status.

### Eligibility Guardrails
- **D-04:** Exhibition creation may allow Rust/Zig only in non-counted exhibitions and must prevent counted, ranked, ladder, and gauntlet paths.
- **D-05:** If Zig remains alpha while Rust becomes beta, mixed Rust-vs-Zig exhibitions must display split labels rather than collapsing both to beta or alpha.

### Privacy and Replay Plausibility
- **D-06:** Public result/replay evidence may show language/runtime label, non-counted status, artifact hash/status, safe probe summary, MatchSet status, and replay links.
- **D-07:** Public surfaces must not expose Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw diagnostics, host paths, env values, tokens, DB DSNs, package paths, or private runtime internals by default.
- **D-08:** Replay visual validation must confirm plausible full Match starts, visible Soldiers and terrain inside declared board bounds, and no clipped/off-screen pieces.

### the agent's Discretion
- The planner may choose the exact label components/copy, but must keep it compact and consistent with prior Python beta trust cues.
- The planner may choose DOM checks, browser screenshots, or both for replay plausibility.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Prior Phase Context
- `.planning/phases/156-baseline-beta-criteria-and-regression-floor/156-CONTEXT.md` — Beta wording and split outcomes.
- `.planning/phases/157-zig-ergonomics-and-safe-helper-starter-layer/157-CONTEXT.md` — Zig helper limitation wording.
- `.planning/phases/160-signed-in-multi-compiler-proof/160-CONTEXT.md` — Proof evidence that determines labels.

### Product Evidence Baseline
- `.planning/artifacts/v1.19-exhibition-beta-proof.md` — Python beta UX trust precedent.
- `.planning/artifacts/v1.20-signed-in-reliability-proof.md` — Public-safe reliability proof precedent.
- `.planning/milestones/v1.22-VERIFY-WORK.md` — Workshop Zig alpha smoke and relevant pages.
- `AGENTS.md` — Replay board realism and privacy expectations.

### Code
- `apps/web/app/workshop/workshop-client.tsx` — Workshop language selector, validation, and save UI.
- `apps/web/app/workshop/server.ts` — Workshop/account server behavior.
- `packages/spec/src/public-output-privacy.ts` — Public privacy contract.
- `packages/spec/src/competition.ts` — Competition/exhibition semantics.
- `packages/replay` — Replay validation/rendering contracts.
- `apps/web/e2e/replay.visual.spec.ts-snapshots` — Existing replay visual evidence pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing Python exhibition beta labels provide the product precedent for compact non-counted status.
- Public-output privacy helpers already define categories that must stay hidden.
- Replay visual tests already encode the board realism expectation used in prior milestones.

### Established Patterns
- Public evidence should say what passed and what is excluded without naming private internal fields.
- UI labels should be proof-driven, not hard-coded optimism.
- Browser validation is required for replay/Match creation changes that affect visible board realism.

### Integration Points
- Phase 160 supplies concrete MatchSet/replay ids and statuses.
- Phase 162 should monitor label/privacy drift.
- Phase 163 consumes UI/privacy review results before promotion.

</code_context>

<specifics>
## Specific Ideas

If in doubt, prefer boring labels over celebratory ones: "Rust/WASM - non-counted exhibition beta" is better than a flashy "Rust beta" chip that can be misread.

</specifics>

<deferred>
## Deferred Ideas

- Marketing-style language pages for Rust/Zig.
- Public language marketplace or broad multi-language catalogue.

</deferred>

---

*Phase: 161-Workshop/Exhibition/Result/Replay Beta UX Labels and Privacy Review*
*Context gathered: 2026-05-25*
