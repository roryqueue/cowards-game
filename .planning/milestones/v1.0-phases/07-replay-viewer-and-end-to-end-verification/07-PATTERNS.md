---
phase: 7
slug: replay-viewer-and-end-to-end-verification
status: complete
created: 2026-05-17
---

# Phase 7 Pattern Map

## Purpose

Map Phase 7 replay-viewer work to existing code patterns so execution reuses the repo's established boundaries instead of inventing a parallel replay stack.

## Pattern Anchors

| Phase 7 Target | Closest Existing Analog | Pattern To Preserve |
|----------------|-------------------------|---------------------|
| `apps/web/app/matches/server.ts` | `apps/web/app/workshop/server.ts` | Server facade with dependency injection for tests, per-request database pool, DTO-focused functions, storage-unavailable handling where appropriate. |
| `apps/web/app/matches/types.ts` | `apps/web/app/workshop/types.ts` | Serializable UI DTOs kept out of React state helpers and route handlers. |
| `apps/web/app/matches/[matchId]/replay/page.tsx` | `apps/web/app/page.tsx` | Server page loads initial data and passes a complete serializable payload into a Client Component. |
| Replay route handlers if needed | `apps/web/app/api/workshop/tests/[matchSetId]/route.ts` | Thin JSON route handlers that validate params, call server facade methods, and return stable error payloads. |
| `replay-client.tsx` | `apps/web/app/workshop/workshop-client.tsx` | Client-owned interaction state, native controls, fetch calls only through stable API/server contracts, no game rule logic in React. |
| `replay-state.ts` | `apps/web/app/workshop/workshop-client-state.ts` and `packages/replay/src/reconstruct.ts` | Pure helper functions for timeline labels, scrubber state, selected Soldier/event summaries, and privacy-mode selection. |
| Browser-only replay board | `apps/web/app/workshop/monaco-editor.tsx` | Isolate browser-only dependency loading from Next SSR; keep canvas implementation in a Client Component wrapper. |
| Board render descriptors | `packages/replay/src/reconstruct.ts` | Derive every visible board descriptor from replay projection/state, not from runtime execution or mutable animation state. |
| Public/owner replay data | `packages/replay/src/project.ts` | Default to `projectPublicChronicle`; owner/debug mode must explicitly request a scoped owner projection. |
| Chronicle retrieval | `packages/persistence/src/chronicle-store.ts` | Treat `createPostgresChronicleStore(pool).getByMatchId(matchId)` as source of truth; missing Chronicle returns replay unavailable. |
| MatchSet replay links | `packages/persistence/src/matchset-status.ts` and `packages/persistence/src/workshop.ts` | Extend existing MatchSet summaries instead of adding a separate match-history service. |
| Inline execution smoke path | `apps/worker/src/runner.ts` | Reuse the worker's claim/execute/complete path through a test-gated helper; do not require a long-running daemon for Playwright. |
| E2E setup | root `package.json`, `pnpm verify` script pattern | Add `pnpm e2e` as a separate browser/service command; keep it out of normal `pnpm verify`. |

## Boundary Rules For Executors

- React and Pixi components consume replay DTOs and render descriptors; they must not implement canonical game rules.
- Web/API code must not import `@cowards/runtime-js/worker`, `createRuntimeFromRevision`, or execute Strategy source.
- Public replay data must come from replay projection APIs, not ad hoc string filtering in the UI.
- Test-support endpoints or helpers must be unavailable in production and must carry obvious `test-support` naming.
- Canvas rendering uses stable CSS dimensions before measuring or initializing Pixi so browser tests can assert nonblank output.

