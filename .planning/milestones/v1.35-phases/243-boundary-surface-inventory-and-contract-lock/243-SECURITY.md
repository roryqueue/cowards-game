## SECURED

**Phase:** 243 - Boundary Surface Inventory and Contract Lock
**Threats Closed:** 12/12
**Threats Open:** 0
**ASVS Level:** not declared in phase config
**Audit Date:** 2026-06-14

### Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
| --- | --- | --- | --- | --- |
| T-243-01 | Tampering | mitigate | CLOSED | `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1244` rejects missing required groups; `:1268` rejects duplicate row IDs; `:1276` rejects invalid dispositions; `:1287`-`:1308` rejects missing D-05 string/array fields. Covered by `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts:226`, `:237`, `:250`, and `:379`. |
| T-243-02 | Information Disclosure | mitigate | CLOSED | `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1299`-`:1308` requires `requiredTestsOrProof` and `privacyRisks`; `:1358`-`:1369` rejects public/default leakage claims. Negative coverage is in `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts:348`-`:376`. |
| T-243-03 | Repudiation | mitigate | CLOSED | `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1623`-`:1655` checks missing/stale JSON/markdown and row sync drift; CLI check behavior is at `:1668`-`:1679`. Tests at `scripts/evaluate-v1-35-boundary-surface-inventory.test.ts:404`-`:453`. `pnpm v1.35:boundary-inventory:check` passed. |
| T-243-04 | Elevation of Privilege | mitigate | CLOSED | Evaluator imports only local filesystem/path/url helpers at `scripts/evaluate-v1-35-boundary-surface-inventory.ts:2`-`:4`; static guard command found no `fetch`, `execSync`, `Date.now`, `Math.random`, `node:vm`, `child_process`, `WebSocket`, or DB pool usage. |
| T-243-05 | Tampering | mitigate | CLOSED | JSON/markdown are generated from evaluator rows by `writeV135BoundarySurfaceInventoryArtifacts` at `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1606`-`:1620`; `checkV135BoundarySurfaceInventoryArtifacts` at `:1623`-`:1655` rejects stale/manual drift. `.planning/artifacts/v1.35-boundary-surface-inventory.json:358` and `:788` show synchronized `surfaces`/`rows`; `pnpm v1.35:boundary-inventory:check` passed. |
| T-243-06 | Information Disclosure | mitigate | CLOSED | The artifact records source references and privacy risk categories, not payloads; claim/privacy calibration is in `.planning/artifacts/v1.35-boundary-surface-inventory.md:71`-`:81`. Public/default leakage validators are in `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1358`-`:1369`. |
| T-243-07 | Repudiation | mitigate | CLOSED | Row contract includes affected requirements, disposition, required proof, and downstream phase at `scripts/evaluate-v1-35-boundary-surface-inventory.ts:72`-`:85`; validation enforces requirements and downstream traceability at `:1321`-`:1349`. Decision register is rendered in `.planning/artifacts/v1.35-boundary-surface-inventory.md:28`-`:42`; handoff rows at `:62`-`:69`. |
| T-243-08 | Elevation of Privilege | mitigate | CLOSED | Inventory treats bypass-prone surfaces as downstream work: account save row `.planning/artifacts/v1.35-boundary-surface-inventory.md:48`, owner-debug row `:50`, Workshop alias row `:51`, competition-entry row `:52`, provider-proof row `:54`, package/TinyGo/privacy rows `:56`-`:59`. |
| T-243-09 | Tampering | mitigate | CLOSED | `package.json:30`-`:31` defines the v1.35 write/check scripts; `package.json:50` includes `pnpm v1.35:boundary-inventory:check` before `scripts/check-boundary-monitors.ts` while preserving the existing monitor chain. Package wiring test is at `scripts/check-boundary-monitors.test.ts:198`-`:221`; node package wiring check passed. |
| T-243-10 | Repudiation | mitigate | CLOSED | `scripts/check-boundary-monitors.ts:22` imports the evaluator check; `:929`-`:937` exposes the named helper; `:5474`-`:5476` registers `v1.35 boundary surface inventory` under `contract_drift`. Test evidence is at `scripts/check-boundary-monitors.test.ts:1103`-`:1110`. |
| T-243-11 | Information Disclosure | mitigate | CLOSED | Monitor output is evaluator failure text only: `scripts/check-boundary-monitors.ts:929`-`:935` joins failures, and evaluator failures use repo-relative artifact paths at `scripts/evaluate-v1-35-boundary-surface-inventory.ts:1634`-`:1650`. Tests cover missing/stale output and leakage-marker failures at `scripts/check-boundary-monitors.test.ts:236`-`:342`. |
| T-243-12 | Denial of Service | accept | CLOSED | Accepted risk documented below. Implementation evidence remains static/local-file-only: `scripts/check-boundary-monitors.test.ts:223`-`:234` verifies no live dependencies for the v1.35 monitor check; `scripts/check-boundary-monitors.ts:929`-`:937` delegates to file comparison only. |

### Accepted Risks Log

| Threat ID | Risk | Acceptance Rationale | Owner | Review Trigger |
| --- | --- | --- | --- | --- |
| T-243-12 | Static inventory checking adds monitor runtime cost. | Accepted because the check compares local generated files only, introduces no live service dependency, and is low-cost relative to the existing boundary monitor chain. | Phase 243 / boundary monitor owner | Revisit if the check begins reading broad implementation trees, invoking services, or materially slowing `pnpm boundary:monitors`. |

### Summary Threat Flags

No unregistered flags. `243-01-SUMMARY.md`, `243-02-SUMMARY.md`, and `243-03-SUMMARY.md` each report `## Threat Flags` as none.

### Verification Commands

| Command | Result |
| --- | --- |
| `pnpm v1.35:boundary-inventory:check` | Passed; artifacts current. |
| `pnpm exec vitest run scripts/evaluate-v1-35-boundary-surface-inventory.test.ts scripts/check-boundary-monitors.test.ts` | Passed; 2 files, 27 tests. |
| Package script wiring `node -e` check | Passed. |
| Evaluator forbidden live API/static guard `node -e` check | Passed. |

SECURITY.md: `.planning/phases/243-boundary-surface-inventory-and-contract-lock/243-SECURITY.md`
