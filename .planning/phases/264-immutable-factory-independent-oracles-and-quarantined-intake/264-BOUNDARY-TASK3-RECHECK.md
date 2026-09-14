---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-task-03-boundary-recheck
checked: 2026-09-14
reviewed_source: d61375e3
status: gaps_found
targeted_probes: four new main-orchestrator injected probes (three missed denials and one false denial)
open_gaps: 5
---

# Plan 05 Boundary Task 3 Recheck

This is a read-only static-source review of the isolated repair at `/private/tmp/cowards-264-boundary-RYkfOL`. The four original failing probes were not repeated. No generated source, Match, guest, provider, network, install, or historical test was run.

## Recheck disposition

The factory wrapper uses `collectLabBoundaryGraph`, which tracks lexical symbol assignments and conditional loader values. However, main inspection found that `checkLabBoundaries` still builds its own separate graph with duplicated parser/resolver logic; the wrapper passes files, not the collected graph, to the old checker. The new seam does not yet provide one implementation for both policies.

Five closure/integration gaps remain:

1. **Allowed manifest dependencies are deliberately omitted from the graph.** `collectLabBoundaryGraph` skips `@cowards/spec`, `@cowards/engine`, `@cowards/replay`, `@cowards/runtime-js`, and `@cowards/strategy-lab` while adding package-manifest dependency edges. An oracle can therefore declare one of these allowed packages as its only manifest dependency while the allowed package’s `exports`/entrypoint or dependency closure leads to a strategic helper; the oracle→allowed-package manifest edge is absent, so the transitive policy never visits that route. The same skip appears in the legacy checker’s package dependency policy. Manifest dependencies must be represented as graph edges even when the target is allowlisted; allowlisting should affect policy classification, not graph reachability.

2. **Unresolved edges and hostile execution are checked only at private roots.** The factory wrapper applies `UNRESOLVED_PRIVATE_LOADER` and `PRIVATE_HOSTILE_EXECUTION` only when `privatePath(path)` is true. If an oracle reaches an allowed-core file, an unresolved dynamic loader or `eval`/`Function`/`runInNewContext` there is not inspected by the factory policy. The legacy checker also treats the allowed-core prefix as trusted for transitive closure. Every transitive file reachable from an oracle/factory origin needs fail-closed unresolved-loader and hostile-capability checks, or an explicit audited-core proof rather than silent omission.

3. **`allowedCore` is a broad package-prefix allowlist, not an exact reviewed path set.** Any file under `packages/spec`, `engine`, `replay`, `runtime-js`, or `runtime-supervisor` is accepted as a direct oracle dependency, including future or strategically shared helpers and re-exports placed inside those trees. Graph traversal catches some external re-exports, but it cannot prove that every file within the prefix is non-strategic, and the omitted manifest edges above make that weaker. Replace the prefix rule with exact audited subpaths/exports (including the narrow factory packet contract) and deny unreviewed files or neutral barrels.

4. **The legacy AST-tool seam rejects the new fingerprint implementation.** Main injected `packages/strategy-lab/src/factory/fingerprint.ts` importing `typescript`; the combined checker reports `CORE_DEPENDENCY_DENIED`. The isolated real scan predates that new main file, so it cannot establish integration readiness. Add only the exact reviewed source-parser entrypoint and verify against main after integration.

5. **The old and new policies still use duplicated graph implementations.** Refactor the lexical parser/resolver into one collector consumed by both checks, retaining the old deployment and receipt protections. This addresses the original shared-seam requirement and prevents a future loader fix from applying to only one policy.

## Main-orchestrator reproductions

Main ran four additional two-file/one-file graphs through the actual exported checker. Source strings were parsed as data only; no hostile code was executed.

| Probe | Observed at d61375e3 | Required |
|---|---|---|
| Tactical imports engine; engine index contains `import(selectModule())` | `ok:true` | Deny unresolved transitive loader |
| Tactical imports engine; engine index contains `new Function(source)` | `ok:true` | Deny transitive hostile execution |
| Tactical imports arbitrary `engine/src/strategy-selector.ts` scorer | `ok:true` | Deny unreviewed shared strategic helper |
| Factory fingerprint imports `typescript` for static parsing | `CORE_DEPENDENCY_DENIED` | Permit exact reviewed parser entrypoint |

## Passing mechanics

| Check | Result | Evidence |
|---|---|---|
| Shared graph reuse | PARTIAL | Factory uses the collector; legacy checker still duplicates the parser/resolver and must be connected to the same collector. |
| Assignment/conditional loader resolution | PASS (bounded) | Shared collector tracks lexical symbols, assignments, uncertainty, conditional branches, concatenated literals, and tsconfig paths; unresolved values are retained for private roots. |
| Existing four probe repairs | Preserved from main review | Direct oracle sharing, planner/factory reach, computed/unresolved loader, hostile execution, manifest/entrypoint, and production/public cases are represented as denied fixtures in the isolated tests; this recheck did not rerun them per scope. |
| Static-only operation | PASS | The checker parses source and manifests; no source is imported or executed. |

## Scope

This recheck covers Task 3’s static boundary monitor only. It does not certify sandbox behavior, runtime execution, candidate validity, independence, or empirical evidence. These are ordinary source-policy integration repairs, not a new authorization or certification route.

_Independent bounded recheck; no source edits or commit performed._
