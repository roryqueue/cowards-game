# Feature Research: v1.12 Go Backend Promotion Readiness and Cutover Plan

**Project:** Coward's Game
**Domain:** Production read routing, Go backend readiness, route ownership, and cutover decisioning
**Researched:** 2026-05-23
**Overall confidence:** HIGH for current route/readiness inventory; MEDIUM for the final promotion candidate because v1.12 must prove live data behavior before any cutover.

## Summary

v1.12 should deliver a decision-quality promotion package, not a backend rewrite. The user-visible promise is continuity: public MatchSet, replay metadata, Strategy card, player, ladder, Workshop, account, and analytics behavior must remain unchanged unless one narrow public read is explicitly promoted to Go after satisfying all criteria. If criteria are not satisfied, the correct v1.12 output is a documented no-go decision with stronger evidence and no production web routing change.

The current Go backend has five GET-only manifest entries: `GET /health`, `GET /public/matchsets/{matchSetId}/summary`, `GET /public/replays/{matchId}/metadata`, `GET /public/strategies/{strategyId}`, and owner-scoped `GET /analytics/runs/{runId}/summary`. It is read-only and fixture-backed. Production web reads still call the TypeScript service through `apps/web/lib/public-service-boundary.ts` and `apps/web/lib/public-service-adapter.ts`.

The safest possible promotion candidate is `GET /public/strategies/{strategyId}` because it is public, already spec/service-owned, already represented in the Go manifest, source-free, and narrower than MatchSet result or replay projection surfaces. It still must not be promoted while Go is fixture-only. v1.12 should require live-read proof, route-level selection, no automatic TypeScript fallback, privacy parity, rollback rehearsal, and explicit failure criteria before routing any production web traffic to Go.

## Table Stakes

Features v1.12 must deliver for the milestone to feel complete.

| Feature | Visible To | Why Expected | Complexity | Notes |
| --- | --- | --- | --- | --- |
| v1.12 route ownership matrix | Developers, operators | Everyone needs to know which service owns each read before cutover. | Low | Must name current owner, allowed target owner, auth scope, privacy class, data source, fallback policy, rollback owner, and promotion status for every current Go manifest route plus nearby public service reads. |
| Promotion decision record | Developers, operators | The milestone goal is to decide whether production web can route any read to Go. | Low | Output must be one of: `no-go`, `promote-none-yet`, or `promote-one-route`. The decision must include evidence links and unmet criteria. |
| Candidate route scorecard | Developers | Prevents selecting a route because it is convenient instead of safe. | Low | Score `getPublicStrategyPage`, `getPublicReplayMetadata`, `getPublicMatchSetSummary`, and `getAnalyticsRunSummary`. Health is ops evidence only, not a product read promotion. |
| Route-level Go read client boundary | Developers | A production cutover cannot use a broad global backend switch. | Medium | Add a typed, allowlisted read client only for approved GET routes. It must reject mutation, source, runtime, owner-debug, job, and unmanifested routes. |
| At-most-one route promotion gate | Developers, operators | v1.12 should reduce risk by promoting zero or one route, never several. | Low | A monitor should fail if more than one production web read is configured for Go. |
| No automatic fallback semantics | Operators, developers | Silent TypeScript fallback would make Go outages and divergence invisible. | Medium | If a route is configured to Go, Go unavailability returns a public-safe failure for that route. Rollback is an explicit config/code switch back to TypeScript, not automatic fallback. |
| Live Go data proof for selected route | Users, developers, operators | Fixture parity does not prove production routing. | High | Before promotion, the selected Go route must read the same live or production-equivalent source for that route, or v1.12 must decide no-go. Fixture-only Go cannot serve production web traffic. |
| TypeScript parity oracle | Developers | Go behavior needs a canonical reference. | Medium | Compare parsed DTOs from TypeScript service and Go for the selected route: success, missing record, malformed id, storage unavailable/upstream unavailable, ordering, and public error shape. |
| Privacy parity checks | Users, developers, operators | Public trust depends on not exposing private Strategy or runtime data. | Medium | Check Go, TS service, web route, topology, monitor, and logs for Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, stderr, sessions, tokens, host paths, and private runtime internals. |
| Public error and timeout behavior | Users, operators | Cutover failures must be understandable and safe. | Medium | Define route-specific timeout, HTTP status, and `ServiceErrorDto` behavior. Do not leak Go internals, database errors, paths, bearer tokens, or stack traces. |
| Rollback runbook and rehearsal | Operators | A promoted route must be reversible without code archaeology. | Medium | Document and test one explicit rollback path: change route owner back to TypeScript, rerun smoke/topology checks, confirm public behavior returns to TypeScript service. |
| Failure criteria artifact | Developers, operators | Go/no-go needs hard stop conditions. | Low | Include criteria that block promotion and criteria that trigger rollback after promotion. |
| Production web behavior parity | Users | A backend read cutover should not change UX. | Medium | Browser/API tests must prove page content, 404 behavior, canonical links, result links, and privacy copy are unchanged for the selected read. |
| Evidence bundle | Developers, operators | Future milestones need a trustworthy audit trail. | Low | Capture commands and outputs for `pnpm go:parity`, `pnpm boundary:monitors`, `pnpm topology:check -- --require-go --json`, selected-route parity, no-fallback failure, rollback, and final route owner state. |
| Boundary debt non-regression | Developers | v1.12 should not reopen web persistence or runtime boundaries. | Low | `pnpm boundary:imports` must keep `strict_offenses=0`; the current report-only baseline is 29 and must not increase. |
| Non-promotion of writes/runtime | Users, developers | Read routing must not pull in game execution or hostile code risk. | Low | Keep Strategy execution, Match orchestration, jobs, mutations, migrations, auth/session mutation, and Strategy source retrieval TypeScript-owned. |

## Route Ownership Recommendations

| Route | Current Status | v1.12 Recommendation | Promotion Criteria |
| --- | --- | --- | --- |
| `GET /health` | Go manifest route; public; fixture/static health. | Use only as readiness evidence. Do not count as the one promoted product read. | Health must stay available for topology and cutover checks. |
| `GET /public/strategies/{strategyId}` | Go manifest route; public; service-owned; current web Strategy page uses TypeScript service. | Preferred candidate if v1.12 attempts one production read promotion. | Requires live source proof, DTO parity, not-found parity, source-free privacy proof, no-fallback failure proof, browser parity, and rollback rehearsal. |
| `GET /public/replays/{matchId}/metadata` | Go manifest route; public; service-owned; smaller DTO but tied to Chronicle metadata. | Keep as second candidate or shadow-only. | Promote only after selected-route criteria plus Chronicle privacy and missing-Chronicle behavior are proven. |
| `GET /public/matchsets/{matchSetId}/summary` | Go manifest route; public; service-owned; composite result/evidence DTO. | Defer for production routing in v1.12 unless Strategy route is rejected and this route proves simpler in live data. | Needs result ordering, scoring, governance/status, entrant, replay availability, and owner affordance parity. Higher risk than Strategy page. |
| `GET /analytics/runs/{runId}/summary` | Go manifest route; owner-scoped parity evidence with configured bearer token. | Do not promote in v1.12. | Owner auth/session bridging, existence oracle handling, and private analytics access are too sensitive for first production Go routing. |
| `GET /public/players/{handle}` | TypeScript service-owned, not in Go manifest. | Out of scope for Go promotion. | Requires new Go route manifest expansion, which v1.12 should avoid unless it decides not to promote anything and only documents future candidates. |
| `GET /public/ladders/{seasonId}` | TypeScript service-owned, not in Go manifest. | Out of scope for Go promotion. | Ladder lifecycle and standings evidence are broader than a first cutover route. |

## Decision Outputs

v1.12 should produce these concrete outputs even if no route is promoted.

| Output | Purpose | Required Contents |
| --- | --- | --- |
| `v1.12-route-ownership-matrix` | Shows ownership and allowed routing state. | Route id, path, method, auth scope, privacy class, current web owner, Go status, data source, selected owner, fallback policy, rollback path, and reason. |
| `v1.12-go-promotion-decision` | Final go/no-go decision. | Candidate evaluated, criteria results, final decision, user-visible impact, operator impact, and deferred work. |
| `v1.12-cutover-runbook` | Lets operators execute or reverse the cutover. | Start/health prerequisites, env/config switch, smoke commands, no-fallback proof, rollback command/config, expected statuses, and privacy-safe diagnostics. |
| `v1.12-failure-criteria` | Defines hard stops before and after cutover. | Pre-promotion blockers and post-promotion rollback triggers. |
| `v1.12-evidence-bundle` | Keeps the audit trail useful for v1.13. | Command outputs, route owner state, parity samples, failed-Go no-fallback proof, rollback proof, and privacy scan results. |

## Failure Criteria

Any of these should block promotion:

| Failure | Why It Blocks | Required Action |
| --- | --- | --- |
| Selected Go route is still fixture-only | Fixture service cannot serve real production web reads. | Decide no-go or add live read-model implementation and rerun criteria. |
| More than one production web read is configured for Go | Violates v1.12 risk limit. | Revert to exactly zero or one selected route. |
| Go route silently falls back to TypeScript | Operators cannot detect Go outage or divergence. | Replace with explicit failure plus manual rollback. |
| DTO parity differs from TypeScript service | Users may see changed or incorrect evidence. | Block cutover until schemas, ordering, error shape, and mappings match. |
| Public or diagnostic output leaks private fields | Violates core privacy constraints. | Block cutover and fix leak before any promotion. |
| Missing-record or auth behavior changes | Creates user confusion or existence oracles. | Restore current public-safe behavior. |
| Rollback is not one explicit owner switch | Operators cannot safely recover. | Block promotion until rollback is rehearsed. |
| Boundary imports regress | Cutover caused web/service ownership drift. | Restore `strict_offenses=0` and keep report-only count from increasing. |
| Go route adds writes, jobs, migrations, Strategy execution, or source retrieval | Scope violation and security risk. | Remove from v1.12 scope. |
| Live topology evidence only passes with optional Go | Promotion requires required Go evidence. | Use required live Go checks and demonstrate stopped-Go failure. |

Post-promotion rollback should trigger if any promoted route shows Go unavailability, repeated public-safe upstream failures, privacy monitor failure, DTO/schema drift, route manifest drift, or operator inability to confirm active owner.

## Optional Differentiators

Useful if table stakes are finished, but not required for v1.12 success.

| Feature | Value Proposition | Complexity | Notes |
| --- | --- | --- | --- |
| Shadow comparison mode | Builds confidence before serving users from Go. | Medium | Web continues serving TypeScript while a diagnostic path compares Go and TS for the candidate route. Diagnostics must stay privacy-safe and avoid Strategy/source data. |
| Route owner status endpoint for operators | Makes active owner visible without reading config files. | Low | Public output should show only route id, owner, version, and health. No secrets, tokens, DB details, or private payloads. |
| Generated promotion report | Reduces manual audit work. | Medium | Converts route matrix, criteria, parity results, and rollback proof into a checked artifact. |
| Latency envelope for selected route | Helps operators understand cutover risk. | Low | Use local/CI smoke timing as rough evidence only; do not introduce a production observability stack. |
| Read-only Go route fixture shrinker | Keeps parity artifacts focused. | Low | Useful if public Strategy fixtures grow, but not needed for the first decision. |

## Anti-Features

Features to explicitly avoid because they make v1.12 less trustworthy.

| Anti-Feature | Why Avoid | What to Do Instead |
| --- | --- | --- |
| Global `all reads use Go` switch | One route being ready does not prove all reads are ready. | Use route-level allowlisting and at-most-one promotion. |
| Automatic TypeScript fallback on Go failure | Hides outages and makes promotion evidence meaningless. | Fail loudly with public-safe errors, then use explicit rollback to TypeScript. |
| Fixture-backed production read routing | Users would see stale or synthetic data. | Require live data proof or decide no-go. |
| Promoting owner analytics first | Auth/session bridging and existence-oracle risk are not first-route material. | Keep owner analytics as topology/parity evidence only. |
| Adding a new Go route just to find a safer candidate | v1.12 should decide using current evidence before expanding surface area. | Score existing manifest routes and defer new Go routes. |
| Moving Match orchestration or jobs with a read cutover | Blends unrelated ownership changes into a routing milestone. | Keep orchestration, jobs, and Match execution TypeScript-owned. |
| Strategy source retrieval through Go | Source is private and source-bearing. | Keep source retrieval TypeScript-owned and owner-authorized. |
| Broad Go persistence repository | Turns one read promotion into backend ownership transfer. | Allow only selected-route read-model access if required and proven. |
| Publicly exposing cutover internals | Can leak topology, tokens, host paths, stack traces, or private route data. | Expose only safe route owner/status and sanitized diagnostics. |
| Treating `health` as product read promotion | It proves process availability, not user-facing DTO correctness. | Use health as a prerequisite, not the promoted read. |

## Explicit Non-Goals

| Non-Goal | Reason |
| --- | --- |
| Full Go backend rewrite | v1.12 is a promotion decision and at-most-one-route cutover plan. |
| Go writes, auth/session mutation, ladder writes, governance writes, MatchSet creation, Match orchestration, job claiming, migrations, or persistence write ownership | These require transactional and ownership semantics not proven by read parity. |
| Strategy execution or runtime sandbox promotion | Runtime isolation remains separate from backend read routing. |
| Strategy source retrieval, source save, Workshop validation/test launch, analytics rerun, profile save, export, or source-bearing DTO migration | These are private or mutation/runtime surfaces, not safe first Go read routing. |
| Owner analytics production routing | Owner auth bridging and existence-oracle behavior are too sensitive for the first Go web route. |
| Public player or ladder Go route expansion | They are not current Go manifest routes and would expand scope before the cutover decision. |
| Full replay projection or owner-debug Chronicle migration | Replay projection and owner-debug data are privacy-sensitive and not needed for route promotion readiness. |
| Counted non-JS play or public language-picker promotion | Unrelated to Go read routing and still requires runtime criteria. |
| Kubernetes, service mesh, cloud deployment, or production observability stack | v1.12 should use local/CI-grade evidence and simple operator runbooks. |
| Rule, Chronicle, scoring, terminology, engine, or deterministic runtime changes | Backend cutover must preserve gameplay and replay semantics. |

## MVP Recommendation

Prioritize:

1. Route ownership matrix and candidate scorecard for current service/Go routes.
2. Promotion criteria, failure criteria, and decision record that accepts no-go as a valid outcome.
3. Route-level read client/cutover guard for exactly one candidate, preferably `GET /public/strategies/{strategyId}`, only if live data proof is added.
4. No-fallback, privacy, parity, topology, browser, and rollback evidence.
5. Final operator runbook and evidence bundle.

Defer:

- Owner analytics routing: too sensitive for first production Go read.
- MatchSet summary routing: valuable but too composite for the first cutover unless Strategy page is blocked and MatchSet proves all criteria.
- Replay metadata routing: small but tied to Chronicle privacy; keep as shadow-only or future candidate.
- New Go route expansion: v1.12 should decide and cut over, not grow the surface.

## Requirement Seeds

| Seed | Requirement |
| --- | --- |
| V112-FEAT-01 | Developer can inspect a v1.12 route ownership matrix covering all five current Go manifest routes plus nearby TypeScript public reads, with auth scope, privacy class, current owner, candidate owner, data source, fallback policy, and rollback owner. |
| V112-FEAT-02 | Developer can inspect a route promotion scorecard and final decision record that selects zero or one production web read for Go routing. |
| V112-FEAT-03 | Developer can verify that `GET /public/strategies/{strategyId}` is the preferred first-route candidate unless v1.12 evidence proves another current Go manifest route is safer. |
| V112-FEAT-04 | Developer can verify no production web route is promoted while the selected Go route remains fixture-only. |
| V112-FEAT-05 | Operator can configure the selected route owner explicitly as TypeScript or Go, and the system rejects Go ownership for unapproved routes. |
| V112-FEAT-06 | Developer can verify at most one production web read is configured for Go. |
| V112-FEAT-07 | Developer can prove required Go routing fails loudly without automatic TypeScript fallback when Go is unavailable or divergent. |
| V112-FEAT-08 | User sees unchanged public page/API behavior for the selected route after cutover, including success, not-found, canonical links, and public-safe errors. |
| V112-FEAT-09 | Developer can compare Go and TypeScript parsed DTOs for the selected route across success, missing, invalid, and unavailable cases. |
| V112-FEAT-10 | Developer can verify public/service/Go/web/topology/monitor outputs omit private Strategy, memory, objective, owner-debug, raw Awareness Grid, stack trace, stderr, session, token, host path, and runtime internals by default. |
| V112-FEAT-11 | Operator can execute and verify rollback from Go to TypeScript for the selected route using one explicit route owner change. |
| V112-FEAT-12 | Developer can inspect hard promotion blockers and post-promotion rollback triggers before milestone close. |
| V112-FEAT-13 | Developer can run the v1.12 evidence gate including `pnpm go:parity`, `pnpm boundary:monitors`, required live Go topology, selected-route parity, no-fallback failure proof, rollback proof, and browser/API parity. |
| V112-FEAT-14 | Developer can verify `strict_offenses=0` and the current 29 report-only boundary offenses do not increase. |
| V112-FEAT-15 | Developer can verify Go writes, auth/session mutation, ladder writes, Match orchestration, jobs, migrations, Strategy source retrieval, Strategy execution, runtime sandbox promotion, and counted non-JS play remain out of scope. |

## Sources Reviewed

- `AGENTS.md`
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/MILESTONES.md`
- `.planning/milestones/v1.11-ROADMAP.md`
- `.planning/milestones/v1.11-REQUIREMENTS.md`
- `.planning/milestones/v1.11-MILESTONE-AUDIT.md`
- `.planning/artifacts/v1.11-ownership-boundary-matrix.md`
- `.planning/artifacts/v1.11-baseline-boundary-evidence.md`
- `.planning/artifacts/v1.11-live-go-readiness-evidence.md`
- `apps/go-backend/README.md`
- `apps/go-backend/main.go`
- `apps/go-backend/testdata/service-fixtures/route-manifest.json`
- `packages/spec/src/service.ts`
- `packages/service/src/index.ts`
- `apps/web/lib/public-service-adapter.ts`
- `apps/web/lib/public-service-boundary.ts`
- `apps/web/app/api/matchsets/[matchSetId]/route.ts`
- `apps/web/app/matchsets/[matchSetId]/page.tsx`
- `apps/web/app/api/replays/[matchId]/metadata/route.ts`
- `apps/web/app/strategies/[strategyId]/page.tsx`
- `apps/web/app/players/[handle]/page.tsx`
- `apps/web/app/ladder/[seasonId]/page.tsx`
- `scripts/check-local-topology.ts`
- `scripts/check-boundary-monitors.ts`
- `scripts/check-service-boundary-imports.ts`
- `package.json`

## Confidence Assessment

| Area | Confidence | Notes |
| --- | --- | --- |
| Current Go route inventory | HIGH | Verified from Go README, Go implementation, route manifest, topology script, and boundary monitor. |
| Current production web owner | HIGH | Verified web public service adapter still constructs local TypeScript service, with no Go web routing env/config found. |
| Preferred first candidate | MEDIUM | Public Strategy page is the safest current route by privacy/auth/scope, but v1.12 must prove live data behavior before promotion. |
| No-fallback and rollback requirements | HIGH | v1.11 already proved required live Go checks fail without Go; v1.12 needs the same semantics for production route ownership. |
| Privacy requirements | HIGH | Repeated project constraints and existing guards define the forbidden output set clearly. |
| Live production-read feasibility | MEDIUM | Current Go is fixture-backed. Promotion is feasible only if v1.12 adds/proves a live read path or decides no-go. |
