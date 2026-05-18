# Phase 6: Strategy Workshop UX - Research

## Research Complete

### Goal

Plan the first usable Strategy Workshop loop for Coward's Game: a local, code-first workbench where a player edits a doctrine in Monaco, starts from sample templates, validates source, submits immutable Strategy Revisions, browses revision history, and launches quick Workshop test MatchSets against bundled opponents.

### Inputs Read

- `.planning/phases/06-strategy-workshop-ux/06-CONTEXT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `AGENTS.md`
- `apps/web/app/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/package.json`
- `apps/web/next.config.mjs`
- `packages/runtime-js/src/validation.ts`
- `packages/runtime-js/src/revision.ts`
- `packages/runtime-js/src/transpile.ts`
- `packages/runtime-js/src/index.ts`
- `packages/spec/src/types.ts`
- `packages/spec/src/schemas.ts`
- `packages/persistence/src/db.ts`
- `packages/persistence/src/repositories.ts`
- `packages/persistence/src/seed.ts`
- `packages/persistence/src/match-service.ts`
- `packages/persistence/src/matchset-service.ts`
- `packages/persistence/src/presets.ts`
- `packages/persistence/src/jobs.ts`
- `packages/persistence/src/complete-match.ts`
- `packages/persistence/src/matchset-status.ts`
- `packages/persistence/migrations/0001_initial.sql`
- `packages/persistence/migrations/0002_match_side_completion_stats.sql`
- `apps/worker/src/runner.ts`

### External Sources Checked

- Next.js App Router `use client` directive docs, latest docs page showing 16.2.2.
- Next.js lazy-loading docs for dynamically loading browser-heavy Client Components.
- Next.js mutating-data docs for Server Functions/Server Actions, `refresh`, and `revalidatePath`.
- Next.js route handler docs for `app/**/route.ts` HTTP handlers.
- `@monaco-editor/react` npm README for React/Next.js usage, browser-only Monaco access, and React 19 note.

## Recommended Architecture

### Frontend Shape

Use `apps/web/app/page.tsx` as a Server Component shell that renders one Client Component workbench. The Client Component should own interactive editor state, selected template, validation panel expansion, selected revision, and test-launch form state.

Recommended files:

- `apps/web/app/page.tsx` - Server shell that loads initial Workshop data and renders the workbench.
- `apps/web/app/globals.css` - Global app styling, because the web app currently has no CSS surface.
- `apps/web/app/layout.tsx` - Import `globals.css` and keep metadata.
- `apps/web/app/workshop/workshop-client.tsx` - Main `use client` workbench.
- `apps/web/app/workshop/monaco-editor.tsx` - Browser-only Monaco wrapper.
- `apps/web/app/workshop/actions.ts` or `apps/web/app/api/workshop/*/route.ts` - Server-side validation, submission, history, and test launch entrypoints.
- `apps/web/app/workshop/types.ts` - UI DTOs for templates, validation reports, revisions, arenas, presets, opponents, and launched test summaries.

Use one first-viewport app surface, not a landing page. The page should open directly into the Workshop.

### Monaco Integration

Add `@monaco-editor/react` and `monaco-editor` to `apps/web`. The package README says the wrapper is intended to avoid custom bundler/plugin setup and includes Next.js notes. Because Monaco needs browser APIs for editor instances and Monaco access, isolate it behind a Client Component and dynamic import with `ssr: false`.

Recommended pattern:

- `workshop-client.tsx` is a Client Component because it uses state, events, effects, and browser UI.
- `monaco-editor.tsx` imports `next/dynamic` and lazy-loads `@monaco-editor/react` with `ssr: false`.
- Keep Monaco props serializable at the Server/Client boundary.
- Configure language as `typescript` or `javascript`. The runtime currently transpiles TypeScript-flavored source with `typescript.transpileModule`, but Phase 4 explicitly did not promise full editor-grade typechecking. For Phase 6, Monaco can provide syntax editing without claiming exhaustive type safety.
- Avoid custom Monaco language services or full `.d.ts` ergonomics in the first plan unless the UI-SPEC explicitly requires them.

### Server Boundary

Use server-side functions/route handlers for all operations that touch persistence or runtime package APIs:

- `validateDraft(source)` calls `validateStrategySource(source)` and returns the exact structured validation report.
- `submitRevision(source, metadata)` builds a revision with `buildStrategyRevision`, rejects invalid reports, ensures the local user/strategy seed exists, inserts the revision, and returns a revision DTO.
- `listRevisions()` reads revisions for `strategy:local-workshop` or the chosen single active strategy.
- `launchWorkshopTest(input)` ensures sample opponent revisions and arenas exist, creates a MatchSet from an existing preset, and returns status, IDs, and scoring if immediately available.
- `getWorkshopTest(matchSetId)` refreshes or reads MatchSet status/scoring.

Next.js Server Functions are suitable for form-style mutations, but the workbench also needs debounced validation and polling. Route handlers are a good fit for JSON-style client fetches and polling. Either is acceptable if the plan keeps server-only persistence imports out of Client Components.

### Workshop Data Model

The existing schema already has durable tables for users, strategies, strategy revisions, arenas, matches, match sets, jobs, and chronicles. No schema migration is strictly required for Phase 6 MVP if revision label/notes are stored within `strategy_revisions.metadata`.

Recommended local IDs:

- User: `user:local`
- Active strategy: `strategy:local-workshop`
- Local player IDs: `player:local` and sample opponent player IDs like `player:sample:cautious`
- MatchSet ID prefix: `match-set:workshop:`

Potential issue: `StrategyRevisionMetadataSchema` currently supports `createdBy`, `label`, and `tags`; it does not support `notes`. If the UI must persist notes, update the schema/types to add optional `notes: string` and cover it with spec/runtime tests. If notes can be omitted from the first implementation, avoid schema changes.

### Templates and Opponents

Reuse `packages/persistence/src/seed.ts` cautiously:

- The existing cautious and reckless source strings are valid Strategy sources and should seed first templates/opponents.
- The sources are currently module-private constants, so Phase 6 should either export curated template data from a new `packages/persistence/src/workshop-seed.ts` or move shared template source into a small package/module that both seed and web can import.
- Do not scrape source strings out of built artifacts or duplicate them across packages without tests checking they validate.

Recommended initial templates:

- Cautious: turns to stone.
- Reckless: moves in facing direction.
- Balanced or Sentinel: deterministic activation order with simple turn/move behavior.

Every bundled template must pass `validateStrategySource` in a unit test.

### Revision History

`createRepositories` currently provides `insertStrategyRevision` and `getStrategyRevision`, but not list-by-strategy queries or used-in-match summaries. Phase 6 should extend repository APIs with:

- `listStrategyRevisions(strategyId)` ordered by `created_at desc`.
- Optional `listStrategyRevisionUsage(strategyId)` or a query that counts matches by revision ID.

Return UI-safe DTOs that include:

- `id`
- `strategyId`
- `label`
- `createdBy`
- `createdAt`
- `sourceHash`
- `sourceBytes`
- `valid`
- `usedInMatches`

The source can be returned when a user selects a revision for editing/reuse in the local Workshop, but avoid returning opponent source or private replay data.

### Workshop Test Matches

Use `createMatchSetService(pool).createFromPreset(...)` for the primary test launch. This preserves Phase 5 decisions: named versioned presets, concrete matrix persistence, explicit side assignment, fixed seed/preset reproducibility, and Strategy Revision locking.

For a smooth Phase 6 loop:

- Launch `smoke-v1` by default.
- Let the user choose `standard-v1` or `stress-v1` if present, but present them as slower options.
- Let the user choose sample opponent and arena/preset. Avoid full matrix editing.
- Show MatchSet ID, status, constituent Match IDs, and scoring/result summary if available.
- The worker may need to be running separately for queued jobs to complete. The UI should handle `pending` and `running` honestly rather than faking completion.
- Full board replay, event timeline, and Chronicle inspection remain Phase 7.

### Security and Runtime Boundaries

AGENTS.md is explicit: do not execute user Strategy code in the web/API process. Phase 6 may validate source and build immutable revision artifacts in web/server code, because `validateStrategySource` performs static/transpile checks and `buildStrategyRevision` does not execute user strategy behavior. It must not call `createRuntimeFromRevision` or run Matches in the web process.

Test launch should enqueue durable Matches/MatchSets and rely on the worker path for execution. Any local-dev shortcut that runs the worker once must happen outside browser/API request code or be explicitly marked developer-only.

### CSS and Visual Architecture

The web app has no design system yet. Phase 6 should establish a restrained operational interface:

- Dense but clear workbench, not a hero page.
- Monaco/editor area with stable dimensions.
- Side panels for templates, validation, revision history, and test launch/results.
- Validation errors as scan-friendly rows with severity/code/message.
- Buttons and controls sized so labels do not wrap awkwardly on mobile.
- Mobile layout should stack workbench panels and keep the editor usable, even if the optimal experience is desktop.

Before execution, a UI-SPEC should define exact layout, responsive behavior, empty/error/loading states, palette, typography, and component states.

## Validation Architecture

Plan verification should require:

- Unit tests for bundled templates proving every template source passes `validateStrategySource`.
- Unit tests for Workshop DTO/service helpers: validation, invalid-submit rejection, revision metadata, revision list ordering, and used-in-match counts.
- Repository tests for any new list/query methods and local Workshop seed idempotency.
- Route handler or Server Function tests for validation, submission, history, and test launch behavior using mocked or test database dependencies.
- Component tests where feasible for template selection, debounced validation state, disabled submit on invalid draft, revision selection, and test launch form state.
- Playwright or browser verification for the real Workshop first screen, including Monaco rendering, responsive layout, validation feedback, and no visible text overlap.
- End-to-end smoke path for edit -> validate -> submit revision -> launch smoke MatchSet -> status appears.
- Full `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` before phase verification.

## Planning Risks

- Monaco plus Next.js App Router can create server/client boundary issues if the editor is imported from a Server Component. Keep editor loading client-only.
- `@monaco-editor/react` stable package currently notes React 19 users should use the `next` prerelease. Because this project uses React 19.2.6, the plan should either pin the appropriate package tag or verify the stable version works before execution.
- Existing persistence APIs do not yet list revisions or usage counts. The plan must include these APIs before building history UI.
- Notes are requested in context but not currently allowed by `StrategyRevisionMetadataSchema`; either add optional `notes` intentionally or keep Phase 6 to labels/tags.
- Jobs complete only when a worker runs. The UI must treat queued/running as real states, and the plan should include a dev-run path or clear status polling.
- No UI design contract exists yet. The GSD UI gate should block final planning until `$gsd-ui-phase 6` creates `06-UI-SPEC.md`, unless the user explicitly chooses to skip it.

## Recommended Plan Split

1. Workshop data/API foundation: dependencies, CSS shell, local Workshop seed helpers, validation/submission/history/test server contracts.
2. Monaco workbench MVP: single focused editor, templates, live debounced validation, manual validation action, invalid-submit guard.
3. Revision history and selection: persisted revisions, labels/metadata, ordering, source loading/reuse, used-in-match indicators.
4. Workshop test launch and status: sample opponents, preset launch, status/scoring summaries, polling/refresh.
5. UX hardening and verification: responsive layout, browser checks, accessibility basics, end-to-end smoke path, docs/state updates.
