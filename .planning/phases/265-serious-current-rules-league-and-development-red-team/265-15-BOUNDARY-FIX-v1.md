---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "15"
type: source-only-boundary-fix
status: source-checks-passed
---

# Plan 265-15 boundary integration fix

The three existing boundary monitors now accept the exact private gzip evidence codec at `packages/strategy-lab/src/league/lean-experiment.ts`, while continuing to deny `node:zlib` in engine, oracle, and other modules. The lean entry CLI and authority helper are classified as restricted/private so public or deployment reachability is rejected. Process access remains path-specific: the lean CLI's Git/timing operations, the already-reviewed supervised container session adapter, and the existing serious-league host probe are not generic permissions for Strategy code or arbitrary helpers.

## Source-only verification

- Focused suites: **88 tests passed across 3 files** (`check-v1-38-lab-boundaries`, `check-v1-38-factory-boundaries`, and `check-v1-38-serious-league-boundaries`).
- Actual lab boundary scan: **passed**, 1,360 scanned files, zero violations.
- Actual factory boundary scan: **passed**, 1,360 scanned files, zero violations.
- Actual serious-league boundary scan: **passed**, 1,360 scanned files, zero violations.
- Inert `leanSourceManifest()` inspection: root `sha256:17c9eb451bd393de41ba18d078fab90c822a5d385706d9ffa1ff90ae07d25125`, **861 entries**. Only root and count were printed.

No prepare, run, or retained-verification mode was invoked. No provider, Docker/container, Match, capacity allocation, or empirical credit was created. The previously stopped preparation process was PID **64186** (SIGTERM, exit 143); root confirmed no store/allocation, entry, or charge resulted. The historical private request remains unchanged. This report is not an independent source review and does not authorize empirical execution; independent re-review is still required.
