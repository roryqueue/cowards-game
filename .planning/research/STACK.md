# Stack Research: v1.6 Workshop Analytics and Evidence Explorer

**Project:** Coward's Game
**Date:** 2026-05-21
**Milestone context:** v1.6 Workshop Analytics and Evidence Explorer

## Recommendation

Do not introduce a parallel analytics stack. Extend the existing TypeScript monorepo, Next.js web app, PostgreSQL persistence layer, MatchSet service, worker execution pipeline, Chronicle store, replay projection, and Vitest/Playwright verification spine.

## Existing Stack to Reuse

- **Persistence:** `packages/persistence` already owns MatchSet creation, scoring, Chronicle storage, workshop snapshots, strategy cards, public profile DTOs, migrations, and privacy-sensitive query boundaries.
- **Workshop service boundary:** `apps/web/app/workshop/server.ts` delegates to persistence functions and never executes Strategy code directly.
- **Runtime isolation:** Strategy code remains behind `StrategyExecutionAdapter`, worker jobs, and runtime subprocess/container candidates. v1.6 analytics should only create MatchSets/jobs or read completed evidence.
- **Replay:** `apps/web/app/matches/replay-ready.ts` builds public/owner projections and timeline entries from Chronicles. Deep links should target projected public event sequence numbers, not private runtime data.
- **UI:** The web app currently uses React/Next with local CSS, Monaco, and Pixi. There is no table, chart, or visualization dependency yet.

## Possible Additions

### Tables and Filtering

TanStack Table is a credible option if v1.6 evidence tables become complex enough to need controlled sorting, filtering, faceting, row expansion, and column state. Its docs explicitly distinguish client-side and server-side sorting/filtering concerns, which matters if evidence grows beyond a local Workshop page.

For v1.6, a local typed table model may be better unless the UI needs rich column state immediately. The current app has no existing TanStack dependency, and the first milestone goal is deterministic study surfaces, not a general data-grid platform.

### Heatmaps

D3 color scales are useful reference material, but a D3 dependency is not mandatory. v1.6 can represent heatmap cells with deterministic numeric bands and CSS variables. If later visualization needs continuous scales or legends, D3 sequential scales and chromatic schemes are a mature source for quantitative color encoding.

### Deep Links

Replay deep links should use stable URL query parameters or fragments carrying public-safe sequence/event identifiers. `URLSearchParams` is a standard browser API and fits Next client/server handling without a routing dependency.

### Exports

Owner exports should support JSON directly from typed DTOs and CSV following RFC 4180-style escaping for comma, quote, and newline handling. Browser download can be implemented with `Blob` where client-side export is appropriate, but server-created files are unnecessary for local v1.6.

## What Not to Add

- No analytics warehouse, OLAP service, background inference process, or external metrics platform.
- No client-side execution or replaying of Strategy source.
- No public export pipeline that touches source, memory, objectives, raw Awareness Grid, stack traces, owner debug, or runtime internals.
- No chart library unless the local CSS/React heatmap proves insufficient.

## Sources

- Codebase: `packages/persistence/src/workshop.ts`, `apps/web/app/workshop/server.ts`, `apps/web/app/matches/replay-ready.ts`, `packages/persistence/src/matchset-service.ts`, `packages/persistence/src/scoring.ts`.
- TanStack Table sorting guide: https://tanstack.dev/table/latest/docs/guide/sorting
- TanStack Table filter APIs: https://tanstack.com/table/v8/docs/api/features/filters
- D3 sequential scales: https://d3js.org/d3-scale/sequential
- D3 sequential color schemes: https://d3js.org/d3-scale-chromatic/sequential
- MDN `URLSearchParams`: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
- RFC 4180 CSV: https://www.rfc-editor.org/rfc/rfc4180
- MDN `Blob`: https://developer.mozilla.org/en-US/docs/Web/API/Blob
- OWASP Privacy by Design guidance: https://owasp.org/www-project-devsecops-guideline/latest/02g-Privacy
