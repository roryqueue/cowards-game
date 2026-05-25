---
phase: 116-topology-monitors-privacy-and-promotion-gate
plan: 1
type: execute
wave: 1
depends_on: [115]
files_modified:
  - scripts/check-boundary-monitors.ts
  - scripts/check-boundary-monitors.test.ts
  - scripts/check-local-topology.ts
  - packages/spec/src/public-output-privacy.ts
  - package.json
  - .planning/artifacts/v1.17-topology.json
  - .planning/artifacts/v1.17-privacy-evidence.md
  - .planning/artifacts/v1.17-promotion-decision.md
  - .planning/milestones/v1.17-*
autonomous: true
requirements: [GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, EXIT-01, EXIT-02, EXIT-03, EXIT-04, EXIT-05]
---

<objective>
Prove Python is runtime-only, experimental, non-counted, privacy-safe, and ready to archive as v1.17 without backend ownership creep.
</objective>

<tasks>

1. Extend boundary/topology monitors for v1.17 registry drift, ABI drift, Python execution boundary, backend ownership creep, privacy leaks, and premature counted eligibility.
2. Add Python-specific public privacy markers and tests.
3. Add final evidence artifacts for topology, privacy, proof result, and promotion decision.
4. Run full verification, page smoke, code review, UI review where applicable, validation, verify-work, and audit-fix loops.
5. Archive v1.17 planning files, remove active `.planning/REQUIREMENTS.md`, update project state docs, and tag `v1.17` only after all gates pass.

</tasks>

<verification>

- `pnpm verify:v1.17`
- `pnpm boundary:monitors`
- `pnpm topology:check`
- `pnpm test:fast`
- `pnpm e2e:smoke`
- `pnpm e2e:visual`

</verification>
