# Phase 139: Promotion Decision, Audit, Archive, and Tag - Research

**Status:** Complete
**Date:** 2026-05-25

## Sources Read

- `.planning/phases/139-promotion-decision-audit-archive-and-tag/139-CONTEXT.md`
- `.planning/artifacts/v1.19-promotion-decision.md`
- `.planning/milestones/v1.19-MILESTONE-AUDIT.md`
- `.planning/milestones/v1.19-ROADMAP.md`
- `.planning/milestones/v1.19-REQUIREMENTS.md`
- `.planning/milestones/v1.19-phases/`
- `.planning/artifacts/v1.20-signed-in-reliability-proof.json`
- `.planning/artifacts/v1.20-runtime-sandbox-candidate-readiness.container.json`
- `.planning/artifacts/v1.20-hostile-probe-no-fallback-evidence.container.json`

## Findings

- v1.19 is the closure model: promotion decision under `.planning/artifacts/`, audit under `.planning/milestones/`, roadmap/requirements/phases archive, active requirements removed, state docs updated, then commit and tag.
- v1.20 has complete evidence for every active phase, including strict container candidate evidence and the final signed-in proof.
- `runsc` remains unavailable and must stay an expected strict-lane failure.
- Final promotion wording should be conservative: Python remains non-counted exhibition beta, Docker/container evidence is readiness evidence only, and production sandbox certification remains deferred.

## Implementation Direction

- Write v1.20 promotion decision and milestone audit.
- Mark EXIT requirements complete.
- Archive active roadmap, requirements, and phases under `.planning/milestones/`.
- Remove active `.planning/REQUIREMENTS.md`.
- Update project, state, milestones, and retrospective docs.
- Commit and tag `v1.20`.
