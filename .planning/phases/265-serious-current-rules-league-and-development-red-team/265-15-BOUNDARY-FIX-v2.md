---
phase: 265-serious-current-rules-league-and-development-red-team
plan: "15"
type: source-only-boundary-fix-correction
status: source-checks-passed
---

# Plan 265-15 boundary integration correction

This correction removes the broad factory-scanner exemption introduced in boundary-fix commit `3295d4f1`. Full transitive unresolved-import enforcement is restored for every private origin, including the lean CLI and authority helper. The scanner now recognizes only exact reviewed leaves in the existing runtime/coordinator closure; arbitrary transitive helpers remain subject to denial. The earlier v1 note is preserved as a historical report of the first source-only run; this v2 record supersedes its boundary-policy description after verification below.

The `node:zlib` exception remains specific to `packages/strategy-lab/src/league/lean-experiment.ts`. CLI process/timing imports and existing supervised host adapters are path-specific, not generic allowances. Negative tests cover a newly imported arbitrary helper, `node:zlib` behind the authority helper, and process access behind the codec.

## Final source-only verification

- Focused suites: **88 tests passed across 3 files**.
- Actual lab boundary scan: **passed**, 1,360 scanned files, zero violations.
- Actual factory boundary scan: **passed**, 1,360 scanned files, zero violations with full transitive enforcement restored.
- Actual serious-league boundary scan: **passed**, 1,360 scanned files, zero violations.
- Inert `leanSourceManifest()` inspection: root `sha256:a37b17b1f58ae48e5cce5193716fe57199c8810f5a63797210bbe5f6bb6e6057`, **861 entries**. Only root and count were printed.

No empirical preparation, provider, container, Match, or capacity operation was invoked or authorized by this correction. Independent re-review remains required before any preparation.
