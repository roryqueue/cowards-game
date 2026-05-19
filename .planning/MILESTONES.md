# Milestones

## v1.0 MVP

**Status:** Shipped 2026-05-17
**Phases:** 7
**Plans:** 33
**Requirements:** 80/80 satisfied
**Audit:** .planning/milestones/v1.0-MILESTONE-AUDIT.md

### Delivered

- Established a strict TypeScript monorepo with canonical spec contracts, package boundaries, local topology, and selected E2E verification in pnpm verify.
- Implemented the deterministic Coward's Game rules engine, covering rounds, activation selection, movement, pushing, Backstab, stoning, contraction, end conditions, and purity tests.
- Built Chronicle and replay infrastructure for deterministic reconstruction, integrity validation, public privacy projection, and owner-only debug data.
- Delivered a replaceable JS/TS strategy runtime boundary with immutable Strategy Revisions, validation, worker-only execution, timeout/failure handling, and no production node:vm execution.
- Added PostgreSQL-backed Match/MatchSet orchestration, job claiming, retries, Chronicle persistence, deterministic scoring, and worker execution.
- Shipped the Strategy Workshop and replay viewer, including Monaco authoring, revision history, Workshop test launch, Pixi replay board, timeline/inspector, owner Awareness Grid, and service-backed edit-to-replay Playwright coverage.

### Archives

- .planning/milestones/v1.0-ROADMAP.md
- .planning/milestones/v1.0-REQUIREMENTS.md
- .planning/milestones/v1.0-MILESTONE-AUDIT.md
- .planning/milestones/v1.0-phases/

### Known Deferred Items

None from the open-artifact audit.

## v1.1 Trustworthy Simulation Beta

**Status:** Shipped 2026-05-18
**Phases:** 6
**Plans:** 29
**Requirements:** 34/34 satisfied
**Audit:** .planning/milestones/v1.1-MILESTONE-AUDIT.md

### Delivered

- Replaced fragile replay demos with engine-generated legal scenario fixtures and focused replay visual regression coverage.
- Added strict Chronicle grammar, compatibility, snapshot boundary, impossible-state, and public privacy validation gates.
- Hardened the Strategy runtime boundary with adapter metadata, subprocess JSON IPC, hostile Strategy coverage, output caps, and system-vs-strategy failure taxonomy.
- Improved doctrine debugging with actionable Workshop messages, sample Strategies, replay links, runtime violation explanations, and owner-only Soldier inactivity explanations.
- Made Docker/no-Docker local startup and service-backed CI verification repeatable with layered diagnostics.
- Closed the persisted owner replay debug authorization gap and proved public privacy on the same failing Strategy replay.

### Archives

- .planning/milestones/v1.1-ROADMAP.md
- .planning/milestones/v1.1-REQUIREMENTS.md
- .planning/milestones/v1.1-MILESTONE-AUDIT.md
- .planning/milestones/v1.1-INTEGRATION-CHECK.md
- .planning/milestones/v1.1-phases/

### Known Deferred Items

- Production authentication/session ownership remains deferred.
- Ranked ladders and public competitive surfaces remain deferred.
- Production-grade container, microVM, or WASM/WASI sandboxing remains future runtime work.

## v1.2 Competitive Alpha

**Status:** Planning started 2026-05-19
**Phases:** 5 planned, Phases 14-18
**Plans:** 0/TBD
**Requirements:** 0/33 planned
**Success criterion:** A developer/player can submit immutable Strategy Revisions into a small unranked or seeded competitive MatchSet, inspect fair scoring and replay evidence, and trust that public results do not leak private Strategy data.

### Planned Scope

- Add minimal username/password sign in, sign out, stable User identity, display name/handle, and session-backed authorization for competitive submissions.
- Replace `player:workshop-local` for persisted competitive ownership while keeping private Strategy source and owner debug access server-authorized.
- Define MatchSet competition presets, entrants, immutable Strategy Revision snapshots, scoring policy, tie-breakers, stale revision behavior, and result publication rules.
- Ship unranked or seeded exhibition MatchSets before ranked ladders, including alpha self-play where one user can enter multiple distinct owned Strategy Revisions into the same competition.
- Publish public MatchSet result pages with scoring breakdowns, per-Match replay evidence, degraded/failed handling, and dispute-friendly provenance.
- Add abuse and fairness guardrails for rate limits, exact duplicate snapshots, runtime failure penalties, sandbox/system failure policy, visibility, and valid competitive result criteria.

### Deferred Items

- One Strategy per user competition limits are deferred until ranked or more formal competition.
- Ranked ladders, durable ratings, and public tournaments remain future work.
- Email verification, password reset, OAuth, passkeys, organizations, account recovery, and admin moderation remain future account work.
- Production-grade container, microVM, or WASM/WASI sandboxing remains future runtime work.
