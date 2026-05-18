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
