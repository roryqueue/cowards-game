---
phase: 108-no-typescript-backend-topology-and-monitor-gate
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/check-local-topology.ts
  - scripts/check-local-topology.test.ts
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - .planning/artifacts/v1.16-no-typescript-backend-topology.json
  - .planning/artifacts/v1.16-no-typescript-backend-topology.md
  - .planning/phases/108-no-typescript-backend-topology-and-monitor-gate/108-VALIDATION.md
autonomous: true
requirements: [GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, GATE-09]
user_setup: []
must_haves:
  truths:
    - "Developer can run one v1.16 strict topology flag that requires web, Go, runtime-service, selected Go pages, representative page smoke, web-through-Go reads, v1.15 lifecycle evidence, and v1.16 no-TypeScript-backend checks."
    - "Developer can verify boundary monitors consume v1.16 topology, route, runtime, worker, and final TypeScript surface label artifacts."
    - "Developer can verify stopped-Go and stopped-runtime-service drills are fail-closed/classified with no TypeScript backend fallback."
    - "Developer can verify public-output privacy denylist and replay realism remain part of the topology gate."
  artifacts:
    - path: ".planning/artifacts/v1.16-no-typescript-backend-topology.json"
      provides: "Machine-readable v1.16 strict topology and failure-drill closure contract"
      contains: "v1.16-no-typescript-backend-topology"
    - path: ".planning/artifacts/v1.16-no-typescript-backend-topology.md"
      provides: "Human-readable strict topology evidence and operator commands"
      contains: "No-TypeScript-Backend Topology"
    - path: "scripts/check-local-topology.ts"
      provides: "Strict v1.16 no-TypeScript-backend topology mode"
      contains: "requireV116NoTypeScriptBackend"
    - path: "scripts/check-boundary-monitors.ts"
      provides: "Boundary monitor lane for v1.16 topology artifact and strict live topology"
      contains: "validateV116NoTypeScriptBackendTopologyArtifact"
---

<objective>
Implement Phase 108 strict no-TypeScript-backend topology and monitor gates.
</objective>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Add the v1.16 strict topology flag</name>
  <files>scripts/check-local-topology.ts, scripts/check-local-topology.test.ts</files>
  <behavior>
    - `parseTopologyOptions(["--require-v1-16-no-typescript-backend"])` sets required web, page smoke, Go, web-through-Go public Strategy read, runtime-service, selected Go pages, v1.15 lifecycle, and v1.16 no-TypeScript-backend checks.
    - `evaluateLocalTopology` adds a required v1.16 no-TypeScript-backend check when the flag is active.
    - Strict mode validates v1.16 artifacts and confirms the normal topology allows only frontend plus isolated JS/TS runtime service as TypeScript production-ish roles.
  </behavior>
  <verify>pnpm exec vitest run scripts/check-local-topology.test.ts</verify>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Add v1.16 topology/failure-drill artifacts</name>
  <files>.planning/artifacts/v1.16-no-typescript-backend-topology.json, .planning/artifacts/v1.16-no-typescript-backend-topology.md</files>
  <behavior>
    - Artifact records the strict topology command, monitor command, page smoke expectations, replay realism, fail-closed stopped-Go behavior, classified stopped-runtime-service behavior, no TypeScript fallback, allowed/disallowed TypeScript roles, and privacy denylist.
    - Artifact references the selected Go route manifest, runtime-service boundary, worker quarantine, final TypeScript surface labels, and v1.15 baseline evidence.
  </behavior>
  <verify>pnpm exec tsx scripts/check-boundary-monitors.ts</verify>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Wire the artifact and strict mode into boundary monitors</name>
  <files>scripts/check-boundary-monitors.ts, scripts/check-boundary-monitors.test.ts</files>
  <behavior>
    - Boundary monitors validate the v1.16 topology artifact on every run.
    - When `COWARDS_REQUIRE_LIVE_TOPOLOGY=1`, boundary monitors call topology with `requireV116NoTypeScriptBackend=true` so representative page smoke and selected Go page smoke are live-required.
    - Tests reject artifact drift, allowed TypeScript role broadening, missing failure drills, missing privacy denylist, and live topology monitor fallback to the older v1.15-only mode.
  </behavior>
  <verify>pnpm exec vitest run scripts/check-boundary-monitors.test.ts && pnpm boundary:monitors</verify>
</task>

</tasks>

<final_verify>
pnpm exec vitest run scripts/check-local-topology.test.ts scripts/check-boundary-monitors.test.ts
pnpm topology:check -- --require-v1-16-no-typescript-backend --json
pnpm boundary:monitors
</final_verify>
