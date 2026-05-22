# Phase 43: Owner Export and Privacy - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>

## Phase Boundary

Phase 43 adds owner-only JSON and CSV export for saved gauntlet profile run summaries while preserving public privacy boundaries. It defines export scope, server-side authorization, CSV safety, and export UI framing. It does not add raw private runtime exports, stored export files, public sharing, Match-level CSVs, or new analytics/replay execution behavior.

</domain>

<decisions>

## Implementation Decisions

### Export Scope

- **D-01:** JSON export includes the complete owner-safe summary for a saved profile run.
- **D-02:** JSON layers include profile metadata, owner id, run metadata, run status, timestamps, compatibility key/hash, profile schema version, candidate/opponent safe snapshots, aggregate summary, matchup records, evidence bands, MatchSet references, Match references, replay references, and deterministic provenance.
- **D-03:** JSON export must not include Strategy source, StrategyMemory, SoldierMemory, objective payloads, raw Awareness Grid, stack traces, owner debug, raw private Chronicle/runtime artifacts, or private runtime internals.
- **D-04:** CSV export is matchup records only for v1.6.
- **D-05:** CSV stable columns include enough IDs/links to trace MatchSets/replays without becoming a raw Match dump.
- **D-06:** JSON carries richer structure; Match-level CSV is deferred to future analytics/export expansion.
- **D-07:** Exports are run-based: export a saved profile run summary, not an editable profile draft.

### Authorization Model

- **D-08:** Export endpoints are ordinary authenticated owner endpoints in v1.6.
- **D-09:** Server-side authorization checks profile/run ownership before returning JSON or CSV. UI hiding is not an authorization boundary.
- **D-10:** Account-owned exports require authenticated owner identity.
- **D-11:** `user:local` export is allowed only in local/dev demo contexts.
- **D-12:** Public/anonymous users cannot use `user:local` as a loophole in production-like contexts.
- **D-13:** Export tests should cover account owner allowed, wrong user denied, public user denied, and local/dev allowed.
- **D-14:** Exports are generated on demand from current persisted summary data.
- **D-15:** v1.6 does not store generated export files and does not use signed/time-limited export URLs.
- **D-16:** Export responses should set sensible download content type and sanitized filename.

### CSV Safety

- **D-17:** CSV uses stable columns and RFC 4180-compatible escaping for commas, quotes, CRLF/newlines, and row boundaries.
- **D-18:** CSV neutralizes formula-leading user-controlled text values.
- **D-19:** Neutralize labels, names, notes, annotations, and any other user-controlled text columns when they start with `=`, `+`, `-`, `@`, tab, or carriage return.
- **D-20:** IDs, hashes, statuses, and enums are not transformed unless they can be user-controlled.
- **D-21:** JSON export preserves original safe text values; CSV may transform spreadsheet-dangerous display text.
- **D-22:** Tests should cover `=`, `+`, `-`, `@`, tab, carriage return, quotes, commas, and newlines.

### Export UI Framing

- **D-23:** Export controls show a compact inline privacy note near the export buttons.
- **D-24:** Privacy note should say exports include deterministic summaries only and exclude source, memory, objectives, owner debug, raw Awareness Grid, stack traces, and runtime internals.
- **D-25:** Do not show a confirmation modal for every export in v1.6.
- **D-26:** Detailed export/privacy explanation belongs in docs/help text, not a blocking flow.
- **D-27:** Export button labels distinguish JSON summary and CSV matchup records.
- **D-28:** If export is unavailable due to authorization or missing run summary, show a neutral reason and next action.
- **D-29:** Export UI must not claim durable ratings, official tournament results, or permanent balance truth.
- **D-30:** Export controls appear on the owner’s saved profile run summary and as contextual affordances from Evidence Explorer when viewing an owned run.
- **D-31:** Do not put export buttons on every heatmap/explorer surface; avoid noisy repeated controls.

### the agent's Discretion

- The user approved auto-locking choices clearly implied by owner-safe summary exports, privacy boundaries, server-side authorization, CSV safety, and non-durable evidence framing.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Context

- `.planning/PROJECT.md` — Owner/privacy boundaries and v1.6 goals.
- `.planning/REQUIREMENTS.md` — Phase 43 requirements EXPOR-01 through EXPOR-08.
- `.planning/ROADMAP.md` — Phase 43 boundary and success criteria.
- `.planning/research/SUMMARY.md` — v1.6 export/privacy direction.
- `.planning/phases/38-analytics-evidence-model/38-CONTEXT.md` — Analytics DTO/export contract and privacy decisions.
- `.planning/phases/39-saved-gauntlet-profiles/39-CONTEXT.md` — Saved profile owner identity, run model, status, and archive decisions.
- `.planning/phases/41-evidence-explorer-ux/41-CONTEXT.md` — Evidence Explorer contextual export affordance decisions.
- `.planning/phases/42-replay-deep-links/42-CONTEXT.md` — Public replay-reference and owner-debug separation decisions.

### Existing Auth, Workshop, and Persistence Code

- `packages/persistence/src/auth.ts` — Existing auth/session persistence model.
- `packages/persistence/src/account-revisions.ts` — Account-owned revision authorization and source privacy patterns.
- `packages/persistence/src/workshop.ts` — Local Workshop owner constants and Workshop service patterns.
- `apps/web/app/workshop/server.ts` — Workshop server boundary and database-pool pattern.
- `apps/web/app/api/account/revisions/[revisionId]/source/route.ts` — Owner-only source authorization pattern to mirror conceptually for exports.
- `apps/web/app/matches/server.ts` — Server-side owner replay authorization pattern.
- `packages/persistence/src/matchset-status.ts` — MatchSet summary and replay availability source data.
- `packages/persistence/src/scoring.ts` — Scoring/failure summary source data.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Existing account/source routes demonstrate server-side owner authorization for private data.
- Replay owner-debug code already treats query params as requests, not authorization.
- Workshop persistence has `WORKSHOP_USER_ID = "user:local"` for local development/demo flows.
- MatchSet/scoring summaries provide exportable deterministic evidence without raw private runtime artifacts.

### Established Patterns

- Owner-sensitive data is guarded by server-side checks, not UI visibility.
- Public DTO/privacy tests should reject forbidden keys and raw private fields.
- Exports should be generated from typed DTOs, not raw database dumps.
- Local/demo affordances must not become production anonymous access.

### Integration Points

- Add owner export service functions that consume Phase 38 analytics DTOs and Phase 39 profile run summaries.
- Add JSON and CSV export routes/actions with server-side owner/local-dev authorization.
- Add CSV formatter/helper with RFC 4180 escaping and spreadsheet formula neutralization.
- Add UI controls near profile run summary and Evidence Explorer owned-run context.
- Add privacy, authorization, and CSV safety tests.

</code_context>

<specifics>

## Specific Ideas

- JSON is the rich owner-safe format; CSV is matchup-record focused for offline heatmap analysis.
- Export UI should be clear but not modal-heavy.
- Local Workshop export exists for local demo acceptance, not as public anonymous export behavior.

</specifics>

<deferred>

## Deferred Ideas

- Match-level CSV exports are deferred to a future analytics/export expansion.
- Signed/time-limited export links and stored/generated export files are deferred until exports become large or asynchronous.

</deferred>

---

*Phase: 43-Owner Export and Privacy*
*Context gathered: 2026-05-22*
