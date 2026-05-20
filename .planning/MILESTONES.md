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

**Status:** Shipped 2026-05-19
**Phases:** 5
**Plans:** 10
**Requirements:** 33/33 satisfied
**Audit:** .planning/milestones/v1.2-MILESTONE-AUDIT.md

### Delivered

- Added minimal username/password accounts, session-backed stable User identity, display names/handles, and sign-in/sign-out for competitive submissions.
- Added account-owned immutable Strategy Revision saves, owner-only source access, and server-side authorization for competitive entry.
- Defined public exhibition competition presets, entrant snapshots, MatchSet publication policy, deterministic scoring, tie-breakers, and public result DTO leak guards.
- Shipped unranked public exhibition MatchSets that allow 2-8 distinct owned revisions, including multiple revisions from the same user for alpha self-play.
- Published MatchSet result pages with standings, scoring evidence, per-Match replay links, provenance, degraded/failed vocabulary, and private-data exclusions.
- Added abuse/fairness guardrails for rate limits, active duplicate submissions, entry validity, runtime failure penalties, and runtime/web isolation boundaries.

### Archives

- .planning/milestones/v1.2-ROADMAP.md
- .planning/milestones/v1.2-REQUIREMENTS.md
- .planning/milestones/v1.2-MILESTONE-AUDIT.md
- .planning/milestones/v1.2-phases/

### Known Deferred Items

- Ranked ladders, durable ratings, and public tournaments remain future work.
- One Strategy per user competition limits remain deferred until ranked or more formal competition.
- Email verification, password reset, OAuth, passkeys, organizations, account recovery, and admin moderation remain future account work.
- Rich dispute workflow beyond provenance and replay evidence remains future moderation/product work.
- Production-grade container, microVM, or WASM/WASI sandboxing remains future runtime work.

## v1.3 Competition Trust Beta

**Status:** Shipped 2026-05-20
**Phases:** 6
**Plans:** 6
**Requirements:** 51/51 satisfied
**Audit:** .planning/milestones/v1.3-MILESTONE-AUDIT.md

### Delivered

- Shipped a 10-strategy Starter Library with readable tactical doctrines, Workshop apply/fork flows, source hashes, lineage metadata, validation, and memory-using examples.
- Added resettable trial ladder seasons with one active Strategy Revision per user, immutable entry snapshots, next-season replacement, explicit lifecycle states, and no durable rating contract.
- Built deterministic ladder scheduling, MatchSet generation, counted standings, retry/degraded/non-counted handling, public ladder pages, and a completed local demo tournament.
- Published privacy-safe player handle pages and Strategy cards with lineage, records, tags, runtime compatibility, competition history, result links, and replay links.
- Added focused governance with result flags, admin status marking, audit events, public counted-state explanations, and standings exclusion for invalid/non-competitive results.
- Selected and prototyped a containerized subprocess production-candidate Strategy runtime boundary behind `StrategyExecutionAdapter`, with worker-thread retained as local/dev fallback and hostile regression coverage.
- Tuned the demo starter set after live replay review so seeded matches show more movement, avoid immediate-reversal artifacts, and commonly last into board contraction.

### Archives

- .planning/milestones/v1.3-ROADMAP.md
- .planning/milestones/v1.3-REQUIREMENTS.md
- .planning/milestones/v1.3-MILESTONE-AUDIT.md
- .planning/milestones/v1.3-phases/

### Known Deferred Items

- Durable all-time ratings, ranked prize ladders, official public tournaments, and prize/tier operations remain future work.
- Email verification, password reset, OAuth, passkeys, organizations, and account recovery remain future account work.
- Production-grade container hardening, microVM isolation, or WASM/WASI runtime replacement remains future runtime work.
- Starter Strategy balance can be tuned further, especially weaker mobility/outlast doctrines such as Escape Artist and Ring Runner.
