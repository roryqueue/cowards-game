---
phase: 264-immutable-factory-independent-oracles-and-quarantined-intake
scope: plan-05-task-03-boundary-final-recheck
checked: 2026-09-14
reviewed_source: ea6bc70e plus uncommitted isolated worker diff
status: passed
targeted_tests: 30/30 passed
real_scan: passed
open_gaps: 0
---

# Plan 05 Boundary Task 3 Final Check

This is a bounded static graph-monitor recheck. It establishes the declared source/dependency policy only; it is not sandbox certification and makes no claim about generated-source execution, guest behavior, provider identity, Matches, or empirical evidence.

## Evidence checked

- Isolated worktree `/private/tmp/cowards-264-boundary-RYkfOL`
- `scripts/check-v1-38-factory-boundaries.ts`
- `scripts/check-v1-38-factory-boundaries.test.ts`
- Existing shared collector in `scripts/check-v1-38-lab-boundaries.ts`
- Prior `264-BOUNDARY-TASK3-RECHECK.md` and `264-BOUNDARY-TASK3-REVIEW.md`

Focused commands, run in the isolated worktree:

`./node_modules/.bin/vitest run --maxWorkers=1 scripts/check-v1-38-factory-boundaries.test.ts` — **30 tests passed**.

`./node_modules/.bin/tsx scripts/check-v1-38-factory-boundaries.ts` — **exit 0**, `{"ok":true,"violations":[],"scannedFiles":1255}`.

## Final disposition

| Check | Result | Evidence |
|---|---|---|
| Exact audited core closure | PASS (mechanics) | The broad package-prefix trust rule was replaced by a literal reviewed inventory of canonical `spec`, `engine`, `replay`, `runtime-js`, and `runtime-supervisor` files. Reachable files outside that inventory are denied even when they sit under an otherwise allowed package. |
| Recursive manifest closure | PASS (mechanics) | Core package manifests use explicit dependency allowlists; oracle manifests use the narrow allowed package set; recursive manifest inspection rejects undeclared/shared strategic dependencies. The focused regression catches a shared strategic package hidden behind `@cowards/spec`. |
| Transitive unresolved/hostile routes | PASS (mechanics) | The checker applies unresolved-loader and hostile-execution checks across every transitive file from private oracle/factory origins, while retaining only the two explicitly approved runtime-supervisor `node:child_process` locations. Focused tests cover dynamic loaders, `new Function`, direct `child_process`, and factory-to-hostile-core paths. |
| Oracle/factory/public separation | PASS (mechanics) | Shared AST graph plus the factory policy reject oracle-to-oracle, factory-to-oracle, broad factory-barrel, public/generated, package-manifest, neutral-barrel, and production reachability routes. |
| Existing policy integration | PASS (mechanics) | The factory wrapper consumes `collectLabBoundaryGraph` and preserves the legacy `checkLabBoundaries` result, including production/Docker/receipt protections. The real scan is clean at 1,255 scanned files. |
| Static-only operation | PASS | The checker parses source ASTs and manifests as data; no source, provider, guest, Match, or network execution occurred. |

## Historical findings resolved

The prior five findings are closed at this monitor boundary: audited-core coverage is literal rather than prefix-based; package-manifest closure is recursively checked; transitive unresolved and hostile constructs fail closed; the fingerprint AST tooling has an exact reviewed allowance; and the wrapper uses the shared graph collector while retaining the legacy checks.

## Scope limitation

This report does not certify that the runtime sandbox contains arbitrary code, that generated source is safe, or that all future repository changes remain compliant. The monitor must be rerun when the audited inventory, manifests, or private entrypoints change.

_Independent bounded final check; no source edits or commit performed._
