---
phase: 264
scope: plan-05-task-03
status: gaps_found
reviewed_source: fa938c10
reviewed_base: 002d28c4
open_findings: 5
---

# Plan05 Boundary Task Integration Review

Main independently inspected the isolated implementation at `fa938c10`; it has not been cherry-picked into main. The worker's49 existing/new boundary tests and real scan pass, but those checks miss concrete forbidden routes. Main ran four small injected file-graph probes through the actual exported checker. All four incorrectly returned `ok:true, violations:[]`. The strings were parsed as source data only; no generated source, vm, guest, Match or provider was executed.

## Findings

1. **High — weaker duplicate graph misses reassigned loaders.** The new `sourceSpecifiers` records only variable initializers, while the existing checker already tracks assignments and conditional possibilities by lexical symbol. An oracle with `let dep = "@cowards/spec"; dep = "@cowards/strategy-oracle-teacher"; import(dep)` passes. Export/reuse the existing file inventory, resolver and graph semantics; do not maintain the weaker hand-built `candidates` resolver. Add reassignment, conditional, lexical-scope and tsconfig-alias cross-oracle regressions.

2. **High — arbitrary shared strategic helpers escape the allowlist.** An oracle importing `../../strategy-shared/src/scoring.js` passes when that helper exists. The oracle closure only denies other named oracles, planner paths and broad factory modules; it does not require every external helper to be on the non-strategic allowlist. Require exact audited non-strategic paths/dependencies and deny unknown/shared strategic helpers, including through an allowed package's re-export or a neutral barrel.

3. **High — arbitrary Node modules and hostile execution remain allowed.** `import vm from "node:vm"; vm.runInNewContext(source)` in an oracle passes because `nonStrategicPackage` permits every `node:` prefix. It also accepts package-name prefixes such as `@cowards/spec-...` instead of exact allowed packages. Use exact module/path allowlists; reject vm/child-process and direct hostile execution constructs, including `new Function`, without evaluating the fixture strings. Unknown packages are not proved safe by a prefix.

4. **High — public/generated source is not a production entry root.** A `public/generated/consumer.ts` import of a private oracle passes because neither checker treats that source file as a production origin. Reuse the full original inventory (including configs, Go, shell and deployment files); explicitly traverse public/default/generated/deployment source roots even outside apps/packages. Add direct and transitive public/generated and manifest-entry tests.

5. **High — manifest/entrypoint closure is incomplete.** Source inspection shows package `main`, `module`, nested/conditional/subpath exports and workspace resolution are not traversed as graph edges. The new scanner only resolves a few hard-coded package names and checks whether export strings contain selected strategic words. Derive real manifest dependency/entrypoint edges through the shared resolver; test a neutral package/export name that points transitively to another strategic core. Export naming heuristics cannot prove separation.

## Repair bounds

Repair inside Task3's current isolated ownership. Keep the narrow packet entry and emitter import-only changes. Preserve all37 legacy tests, Docker stage/ignore protections, and `validateLabReceipt` unchanged. Expose only the reusable non-strategic graph seam from the existing checker; the factory wrapper should apply additional policy to that graph. Do not change gameplay, emit controller bytes, private evidence, resource bounds, historical selectors or public code. Rerun exact boundary tests and the real monitor, then request independent recheck before integration.
