# Roadmap: Coward's Game

## Milestones

- ✅ **v1.0 MVP** — Phases 1-7, shipped 2026-05-17. See `.planning/milestones/v1.0-ROADMAP.md`.
- ✅ **v1.1 Trustworthy Simulation Beta** — Phases 8-13, shipped 2026-05-18. See `.planning/milestones/v1.1-ROADMAP.md`.
- ✅ **v1.2 Competitive Alpha** — Phases 14-18, shipped 2026-05-19. See `.planning/milestones/v1.2-ROADMAP.md`.
- ✅ **v1.3 Competition Trust Beta** — Phases 19-24, shipped 2026-05-20. See `.planning/milestones/v1.3-ROADMAP.md`.
- ✅ **v1.4 Cycle-Interleaved Rules Correction** — Phases 25-29, shipped 2026-05-20. See `.planning/milestones/v1.4-ROADMAP.md`.
- ✅ **v1.5 Strategy Workshop Power Tools and Advanced Strategy Library** — Phases 30-37, shipped 2026-05-21. See `.planning/milestones/v1.5-ROADMAP.md`.
- ✅ **v1.6 Workshop Analytics and Evidence Explorer** — Phases 38-44, shipped 2026-05-22. See `.planning/milestones/v1.6-ROADMAP.md`.
- ✅ **v1.7 Runtime and Backend Boundary Stabilization** — Phases 45-50, shipped 2026-05-22. See `.planning/milestones/v1.7-ROADMAP.md`.

## Recent Shipped Scope

<details>
<summary>✅ v1.7 Runtime and Backend Boundary Stabilization (Phases 45-50) — SHIPPED 2026-05-22</summary>

- [x] Phase 45: Service Boundary Contract — `service-api-v1.7`, typed `@cowards/service`, public DTO leak checks, and web MatchSet result reads behind the service layer.
- [x] Phase 46: Strategy Runtime ABI — `strategy-runtime-abi-v1.7` JSON envelopes for Strategy execution, metadata, limits, runtime violations, and system failures.
- [x] Phase 47: Golden Parity Harness — deterministic fixtures covering engine, Chronicle, replay, public DTOs, privacy, runtime failures, and ordering.
- [x] Phase 48: Runtime Adapter Registry — first-class Strategy language/adapter metadata, compatibility keys, legacy normalization, and counted-play eligibility checks.
- [x] Phase 49: One Non-JS Runtime Spike — experimental Python subprocess adapter through the same ABI, disabled for counted play.
- [x] Phase 50: Go Backend Spike — minimal read-only Go service with health, public MatchSet summary, and replay metadata DTO envelopes.

</details>

<details>
<summary>✅ v1.6 Workshop Analytics and Evidence Explorer (Phases 38-44) — SHIPPED 2026-05-22</summary>

- [x] Phase 38: Analytics Evidence Model — stable analytics summaries, compatibility metadata, evidence bands, and privacy-safe DTO/schema guards.
- [x] Phase 39: Saved Gauntlet Profiles — saved, rerunnable, compatibility-equivalent gauntlet profiles without Strategy execution in web/API.
- [x] Phase 40: Matchup Heatmaps — Workshop heatmaps for matchup W-L-D, points, failures, side bias, evidence counts, and replay availability.
- [x] Phase 41: Evidence Explorer UX — sortable/filterable evidence drilldowns from Strategy to opponent to MatchSet to replay.
- [x] Phase 42: Replay Deep Links — deterministic public-safe links to meaningful replay moments.
- [x] Phase 43: Owner Export and Privacy — owner-only JSON/CSV gauntlet exports with privacy guards.
- [x] Phase 44: Demo, Docs, Verification — local v1.6 analytics demo, browser verification, docs, and no-open-finding milestone audit.

</details>

## Next Up

Start a fresh requirements pass for v1.8 with `$gsd-new-milestone`.

---
*Roadmap last updated: 2026-05-22 after v1.7 milestone completion*
