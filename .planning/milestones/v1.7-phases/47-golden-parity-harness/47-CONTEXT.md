# Phase 47: Golden Parity Harness - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 47 creates the golden fixture harness that proves boundary work has not changed deterministic game, replay, service DTO, analytics, export, runtime failure, privacy, or ordering behavior. It should produce committed, language-neutral artifacts that TypeScript tests can validate now and future Go/non-JS runtime tests can consume later.

</domain>

<decisions>
## Implementation Decisions

### Fixture Ownership And Layout
- **D-01:** Add a new `packages/golden` package for golden manifests, canonical JSON/CSV fixtures, validators, and cross-language fixture consumption.
- **D-02:** `packages/golden` depends on `@cowards/spec` for schemas and may use `@cowards/test-utils`, replay, engine, persistence, or scripts as generators where needed.
- **D-03:** Do not put all golden artifacts directly inside `packages/spec`; `@cowards/spec` remains the schema/contract authority, while `packages/golden` owns artifacts and fixture harness code.
- **D-04:** Use human-readable fixture folders by domain, such as `engine`, `replay`, `service`, `runtime`, `analytics`, and `exports`, each with a manifest and JSON/CSV artifacts.
- **D-05:** Avoid a TypeScript-only programmatic registry as the primary fixture shape because future Go/Python tests need stable files.

### Comparison Semantics
- **D-06:** Golden parity compares parsed canonical JSON equality by default.
- **D-07:** Tests should parse fixtures, validate schemas, normalize deterministic ordering where the contract says ordering is stable, and compare values.
- **D-08:** Use stable hashes only where content hashes are explicit product contract behavior.
- **D-09:** Use raw byte equality only for explicit serialization/export contracts such as CSV output or other byte-level artifacts.
- **D-10:** Core schemas are strict. Additive fields are allowed only inside explicitly designed extension metadata bags.

### Initial Fixture Slice
- **D-11:** Phase 47 mandatory fixture categories are core boundary fixtures plus v1.6 analytics/export evidence.
- **D-12:** Mandatory categories include engine outcomes, public Chronicle projection, MatchSet summary, replay metadata/page data, runtime ABI success/failure, privacy redaction, analytics summaries, replay deep links, owner export JSON/CSV, evidence bands, and deterministic ordering.
- **D-13:** If implementation pressure forces trimming, prioritize privacy and deterministic replay first, then the service/Go spike path, then analytics/export breadth.

### Regeneration Policy
- **D-14:** Golden fixtures are committed artifacts with an explicit deterministic regeneration script.
- **D-15:** Updating fixtures requires running the named update script and reviewing diffs.
- **D-16:** Normal tests must fail on fixture mismatch. Tests must not auto-update fixtures.
- **D-17:** Fixture validation is not advisory; mismatches mean either a regression or an intentional contract change that needs reviewed fixture updates.

### Carried Forward From Earlier Phases
- **D-18:** `@cowards/spec` remains canonical for schemas/contracts.
- **D-19:** Phase 45’s first service proof path is MatchSet summary plus replay metadata/page data; Phase 47 should include those fixtures.
- **D-20:** Phase 46’s runtime ABI success/failure envelopes should be represented in golden fixtures.
- **D-21:** Public/private privacy boundaries and structured failure distinctions must be fixture categories, not just prose.

### the agent's Discretion
- The planner may choose exact fixture file names and manifest schema, provided domain folders remain human-readable and cross-language friendly.
- The planner may choose whether regeneration is one script or package scripts per domain, provided there is a single obvious command for intentional fixture updates.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone Planning
- `.planning/PROJECT.md` — v1.7 boundary-stabilization goal and privacy/runtime constraints.
- `.planning/REQUIREMENTS.md` — Phase 47 requirements `PAR-01` through `PAR-06`.
- `.planning/ROADMAP.md` — Phase 47 goal, success criteria, canonical refs, and sequencing before adapter registry/spikes.
- `.planning/research/SUMMARY.md` — Contract-first, parity-first research synthesis.
- `.planning/research/PITFALLS.md` — JSON canonicalization, privacy regression, and contract drift pitfalls.
- `.planning/phases/45-service-boundary-contract/45-CONTEXT.md` — Service boundary fixture targets and privacy/error decisions.
- `.planning/phases/46-strategy-runtime-abi/46-CONTEXT.md` — Runtime ABI envelope and failure taxonomy decisions.

### Existing Fixture And Replay Code
- `packages/test-utils/src/replay-scenarios.ts` — Existing canonical replay scenarios for push, fall, contraction, legal Backstab, runtime failure, endgame, and compound tour.
- `packages/test-utils/src/engine-scenarios.ts` — Existing engine scenario helpers if needed during planning.
- `packages/replay/src/project.ts` — Public versus owner Chronicle projection and privacy redaction behavior.
- `packages/replay/src/hash.ts` — Stable stringify and Chronicle content hash behavior.
- `packages/replay/src/normalize.ts` — Chronicle normalization behavior for hash/fixture decisions.
- `packages/replay/src/validate.ts` — Chronicle validation behavior.

### Analytics, Export, Service, And Runtime Contracts
- `packages/spec/src/analytics.ts` — Analytics summaries, evidence bands, compatibility keys, replay references, and forbidden public keys.
- `packages/spec/src/schemas.ts` — Core schemas and zod validation patterns for strict fixture validation.
- `packages/spec/src/competition.ts` — Public MatchSet, standing, match evidence, ladder, profile, and Strategy card DTOs.
- `scripts/run-v1-6-analytics-demo.ts` — Existing deterministic v1.6 analytics artifact generation pattern.
- `.planning/milestones/v1.6-phases/44-demo-docs-verification/artifacts/v1.6-analytics-demo.json` — Existing v1.6 analytics demo artifact that can inform or seed golden analytics/export fixtures.
- `packages/runtime-js/src/subprocess-ipc.ts` — Runtime success/failure fixture categories and existing system failure taxonomy.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing canonical replay scenarios already generate legal Chronicles and expected event types.
- `projectPublicChronicle` already provides public privacy projection for replay fixtures.
- `stableStringify` and Chronicle content hash utilities show where hash equality is contract behavior.
- Analytics demo generation already writes deterministic JSON and summary artifacts under planning archives.

### Established Patterns
- Deterministic ordering is already important in analytics summaries, MatchSet standings, replay timelines, and exports.
- Public privacy tests already reject Strategy source, StrategyMemory, SoldierMemory, objective payloads, owner debug, raw Awareness Grid, stack traces, and runtime internals.
- Existing fixtures are strongest when generated from real engine/replay behavior instead of hand-authored approximations.

### Integration Points
- New `packages/golden` package should join `pnpm-workspace.yaml`.
- Fixture generation scripts should use existing scenario builders and service/runtime contract validators.
- TypeScript tests should validate committed fixtures against `@cowards/spec` schemas and compare regenerated values against committed artifacts.
- Future Go/Python tests should be able to read JSON/CSV files without importing TypeScript modules.

</code_context>

<specifics>
## Specific Ideas

- Treat `privacy + deterministic replay` as the trunk of the fixture suite. Analytics/export breadth is important but can trim behind that if necessary.
- Keep fixture diffs reviewable by splitting domains and avoiding one giant embedded manifest.
- Make the update command obvious and intentional, such as a package script in `packages/golden`.

</specifics>

<deferred>
## Deferred Ideas

- Full product-surface fixtures for profiles, ladders, Workshop submissions, auth/session, governance, and all public pages are deferred beyond the first golden harness unless planning finds a low-cost inclusion path.
- Compatibility ranges are still deferred; fixture evidence may later justify them.
- Go/Python runtime consumption of fixtures happens in later phases, but Phase 47 must make the files usable by those consumers.

</deferred>

---

*Phase: 47-Golden Parity Harness*
*Context gathered: 2026-05-22*
