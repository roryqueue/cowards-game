import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { checkLabBoundaries, collectLabBoundaryGraph, type LabBoundaryViolation } from "./check-v1-38-lab-boundaries.js"

const oracle = (path: string) => /^packages\/strategy-oracle-(?:tactical|teacher|model)\//u.test(path)
const factory = (path: string) => path.startsWith("packages/strategy-lab/src/factory/")
const privatePath = (path: string) => oracle(path) || factory(path)
const root = (path: string) => path.split("/").slice(0, 2).join("/")
const source = /\.[cm]?[jt]sx?$/u
const test = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u
const publicEntry = (path: string) => /^(?:apps|packages)\//u.test(path) && !path.startsWith("packages/strategy-lab/") && !oracle(path) && !test.test(path) || /(?:^|\/)(?:public|generated|deploy|deployment|artifacts)\//u.test(path)
const narrowFactory = new Set(["packages/strategy-lab/src/contracts.ts", "packages/strategy-lab/src/factory/packet.ts", "packages/strategy-lab/src/factory/contracts.ts", "packages/strategy-lab/src/factory/identity.ts"])
const allowedCore = /^(?:packages\/(?:spec|engine|replay|runtime-js|runtime-supervisor)\/)/u
const allowedNode = new Set(["node:crypto", "node:fs", "node:fs/promises", "node:path", "node:url", "node:os", "node:worker_threads", "node:buffer"])
const reviewedAstTool = (path: string) => /^packages\/strategy-oracle-(?:tactical|teacher|model)\/src\/emit\.ts$/u.test(path) || /^packages\/strategy-lab\/src\/factory\/(?:fingerprint|intake)\.ts$/u.test(path)
// Reviewed non-strategic source inventory from the existing canonical core at
// 002d28c4. A new barrel export cannot silently add a new shared policy file.
// Changes to this inventory require the same source review as this monitor.
const auditedCore = new Set([
  "packages/engine/src/activation.ts",
  "packages/engine/src/backstab.ts",
  "packages/engine/src/contraction.ts",
  "packages/engine/src/index.ts",
  "packages/engine/src/kernel/create-initial-state.ts",
  "packages/engine/src/kernel/driver.ts",
  "packages/engine/src/kernel/recorder-evidence-authority.ts",
  "packages/engine/src/kernel/step.ts",
  "packages/engine/src/kernel/types.ts",
  "packages/engine/src/kernel/validate.ts",
  "packages/engine/src/match.ts",
  "packages/engine/src/movement.ts",
  "packages/engine/src/outcome.ts",
  "packages/engine/src/recorder-evidence.ts",
  "packages/engine/src/runtime-inputs.ts",
  "packages/engine/src/selectors.ts",
  "packages/engine/src/state.ts",
  "packages/engine/src/types.ts",
  "packages/engine/src/versioned-match.ts",
  "packages/replay/src/build.ts",
  "packages/replay/src/current-transition-postconditions.ts",
  "packages/replay/src/debug-explanations.ts",
  "packages/replay/src/grammar.ts",
  "packages/replay/src/hash.ts",
  "packages/replay/src/historical-v1-4-grammar.ts",
  "packages/replay/src/historical-v1-4-transition.ts",
  "packages/replay/src/index.ts",
  "packages/replay/src/normalize.ts",
  "packages/replay/src/project.ts",
  "packages/replay/src/reconstruct.ts",
  "packages/replay/src/record.ts",
  "packages/replay/src/replay-transition.ts",
  "packages/replay/src/snapshot-boundaries.ts",
  "packages/replay/src/validate.ts",
  "packages/runtime-js/src/hash.ts",
  "packages/runtime-js/src/index.ts",
  "packages/runtime-js/src/revision-v1-17.ts",
  "packages/runtime-js/src/revision-v1-18.ts",
  "packages/runtime-js/src/revision-v1-19.ts",
  "packages/runtime-js/src/revision.ts",
  "packages/runtime-js/src/source-artifact.ts",
  "packages/runtime-js/src/supervised-subprocess-adapter.ts",
  "packages/runtime-js/src/transpile.ts",
  "packages/runtime-js/src/validation.ts",
  "packages/runtime-supervisor/src/index.ts",
  "packages/runtime-supervisor/src/linux-certification-container.ts",
  "packages/runtime-supervisor/src/native-supervisor.ts",
  "packages/runtime-supervisor/src/supervisor-contract.ts",
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
  "packages/spec/src/analytics.ts",
  "packages/spec/src/arena-catalog-v1-37.ts",
  "packages/spec/src/canonical-identity-domains.ts",
  "packages/spec/src/canonical-instant.ts",
  "packages/spec/src/canonical-json-encode.ts",
  "packages/spec/src/canonical-json-parse.ts",
  "packages/spec/src/canonical-json-scan.ts",
  "packages/spec/src/canonical-json.ts",
  "packages/spec/src/competition-counted-state.ts",
  "packages/spec/src/competition-entry-eligibility.ts",
  "packages/spec/src/competition-governance.ts",
  "packages/spec/src/competition-policy-v1-36.ts",
  "packages/spec/src/competition-season-policy.ts",
  "packages/spec/src/competition.ts",
  "packages/spec/src/constants.ts",
  "packages/spec/src/current-semantic-authority-generated.ts",
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/fixtures/index.ts",
  "packages/spec/src/fixtures/invalid.ts",
  "packages/spec/src/fixtures/valid.ts",
  "packages/spec/src/index.ts",
  "packages/spec/src/integrity-authority.ts",
  "packages/spec/src/match-execution-contract.ts",
  "packages/spec/src/public-discovery.ts",
  "packages/spec/src/public-output-privacy.ts",
  "packages/spec/src/runtime-abi-v1-17.ts",
  "packages/spec/src/runtime-budget-capabilities-v1-17.ts",
  "packages/spec/src/runtime-budget-capabilities-v1-18.ts",
  "packages/spec/src/runtime-budget-profile-v1-17.ts",
  "packages/spec/src/runtime-budget-profile-v1-18.ts",
  "packages/spec/src/runtime-conformance-certificate-v1-17.ts",
  "packages/spec/src/runtime-conformance-certificate-v1-19.ts",
  "packages/spec/src/runtime-conformance-trusted-producers-v1-17.ts",
  "packages/spec/src/runtime-containment-trusted-producers-v1-37.ts",
  "packages/spec/src/runtime-evidence-attestation-v1-17.ts",
  "packages/spec/src/runtime-evidence-attestation.ts",
  "packages/spec/src/runtime-evidence-authority-bundle.ts",
  "packages/spec/src/runtime-evidence-v1-17.ts",
  "packages/spec/src/runtime-evidence.ts",
  "packages/spec/src/runtime-execution-service-v1-16-compat.ts",
  "packages/spec/src/runtime-execution-service-v1-17.ts",
  "packages/spec/src/runtime-execution-service-v1-18.ts",
  "packages/spec/src/runtime-execution-service.ts",
  "packages/spec/src/runtime-identity-manifest.ts",
  "packages/spec/src/runtime-invocation-v1-17.ts",
  "packages/spec/src/runtime-invocation-v1-18.ts",
  "packages/spec/src/runtime-payload-v1-17.ts",
  "packages/spec/src/runtime-preflight-v1-17.ts",
  "packages/spec/src/runtime-semantic-receipt-v1-18.ts",
  "packages/spec/src/runtime.ts",
  "packages/spec/src/schemas.ts",
  "packages/spec/src/semantic-integrity.ts",
  "packages/spec/src/service-fixtures.ts",
  "packages/spec/src/service.ts",
  "packages/spec/src/set-condition-policy-v1-37.ts",
  "packages/spec/src/strategy-observation-abi-v1-19.ts",
  "packages/spec/src/strategy-revision-v1-17.ts",
  "packages/spec/src/types.ts",
  "packages/spec/src/versions.ts",
  "packages/spec/src/workshop-checker.ts",
])
const allowedOracleManifestDependency = new Set(["@cowards/spec", "@cowards/engine", "@cowards/replay", "@cowards/runtime-js", "@cowards/strategy-lab"])
const coreManifestDependencies: Readonly<Record<string, readonly string[]>> = {
  "packages/spec/package.json": ["zod"],
  "packages/engine/package.json": ["@cowards/spec"],
  "packages/replay/package.json": ["@cowards/engine", "@cowards/spec"],
  "packages/runtime-js/package.json": ["@cowards/engine", "@cowards/spec", "@cowards/runtime-supervisor", "typescript"],
  "packages/runtime-supervisor/package.json": ["@cowards/spec"],
  "packages/strategy-lab/package.json": ["@cowards/spec", "@cowards/engine", "@cowards/replay", "@cowards/runtime-js"],
}
const allowedUnresolved = (path: string, specifier: string | undefined): boolean =>
  (specifier === "typescript" && reviewedAstTool(path)) || (specifier !== undefined && allowedNode.has(specifier)) ||
  // These existing supervised adapters own process containment. This does not
  // allow an oracle/factory module or any new helper to spawn source itself.
  (specifier === "node:child_process" && ["packages/runtime-supervisor/src/native-supervisor.ts", "packages/runtime-supervisor/src/linux-certification-container.ts"].includes(path))

const hasHostileExecution = (value: string, path: string): boolean => {
  const ast = ts.createSourceFile(path, value, ts.ScriptTarget.Latest, true); let hostile = false
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && (node.expression.text === "eval" || node.expression.text === "Function")) hostile = true
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") hostile = true
    if (ts.isPropertyAccessExpression(node) && node.name.text === "runInNewContext") hostile = true
    ts.forEachChild(node, visit)
  }
  visit(ast); return hostile
}

export interface FactoryBoundaryViolation extends LabBoundaryViolation {}
/** Applies factory/oracle policy to the shared, lexical AST-resolved module graph. */
export const checkFactoryBoundaries = (options: { files?: Readonly<Record<string, string>> } = {}) => {
  const shared = collectLabBoundaryGraph(options), files = shared.files
  const violations: FactoryBoundaryViolation[] = [...checkLabBoundaries({ files }).violations]
  const add = (code: string, file: string) => { if (!violations.some(entry => entry.code === code && entry.file === file)) violations.push({ code, file }) }
  // Package declarations form a second graph: follow their dependency manifests,
  // not every unused public barrel. In particular a strategy-lab declaration
  // never permits importing its broad factory entrypoint. Source edges below
  // must still use the exact narrow packet contract.
  const inspectManifest = (origin: string, path: string, seen = new Set<string>()): void => {
    if (seen.has(path) || files[path] === undefined) return
    seen.add(path)
    try {
      const manifest = JSON.parse(files[path]!) as Record<string, unknown>
      if (!manifest || Array.isArray(manifest) || typeof manifest !== "object") throw new TypeError("manifest")
      const allowed = oracle(path) ? [...allowedOracleManifestDependency] : coreManifestDependencies[path]
      if (!allowed) { add("ORACLE_MANIFEST_DEPENDENCY_DENIED", origin); return }
      const dependencies = new Set<string>()
      for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
        const value = manifest[field]
        if (value === undefined) continue
        if (!value || typeof value !== "object" || Array.isArray(value) || !Object.values(value).every(version => typeof version === "string")) throw new TypeError("manifest")
        for (const dependency of Object.keys(value)) dependencies.add(dependency)
      }
      for (const dependency of dependencies) {
        if (!allowed.includes(dependency)) { add("ORACLE_MANIFEST_DEPENDENCY_DENIED", origin); continue }
        if (dependency.startsWith("@cowards/")) inspectManifest(origin, `packages/${dependency.slice("@cowards/".length)}/package.json`, seen)
      }
    } catch { add("ORACLE_MANIFEST_INVALID", origin) }
  }
  for (const [path, dependencies] of shared.manifestDependencies) {
    if (!oracle(path)) continue
    for (const dependency of dependencies) if (!allowedOracleManifestDependency.has(dependency)) add("ORACLE_MANIFEST_DEPENDENCY_DENIED", path)
  }
  for (const [path, missing] of shared.unresolved) {
    if (!privatePath(path)) continue
    for (const specifier of missing) {
      if (allowedUnresolved(path, specifier)) continue
      add("UNRESOLVED_PRIVATE_LOADER", path)
    }
  }
  for (const [path, value] of Object.entries(files)) if (privatePath(path) && source.test(path) && !test.test(path) && hasHostileExecution(value, path)) add("PRIVATE_HOSTILE_EXECUTION", path)
  const declaredCoreDependency = (path: string, specifier: string | undefined): boolean => {
    if (!auditedCore.has(path) || specifier === undefined) return false
    const owner = [...shared.manifestDependencies.keys()]
      .filter(manifest => path.startsWith(`${manifest.slice(0, -"package.json".length)}`))
      .sort((left, right) => right.length - left.length)[0]
    return owner !== undefined && (coreManifestDependencies[owner] ?? []).includes(specifier) && (shared.manifestDependencies.get(owner) ?? []).includes(specifier)
  }
  for (const origin of shared.graph.keys()) {
    if (oracle(origin)) inspectManifest(origin, `${root(origin)}/package.json`)
    const seen = new Set<string>()
    const visit = (path: string): void => {
      if (seen.has(path)) return
      seen.add(path)
      if (privatePath(origin) && path !== origin && (shared.unresolved.get(path) ?? []).some(specifier => !allowedUnresolved(path, specifier) && !declaredCoreDependency(path, specifier))) add("PRIVATE_TRANSITIVE_UNRESOLVED", origin)
      if (privatePath(origin) && path !== origin && source.test(path) && hasHostileExecution(files[path] ?? "", path)) add("PRIVATE_TRANSITIVE_HOSTILE_EXECUTION", origin)
      if (oracle(origin) && path !== origin) {
        const ownLeaf = oracle(path) && root(path) === root(origin)
        if (!ownLeaf && (!allowedCore.test(path) || !auditedCore.has(path)) && !narrowFactory.has(path)) add("ORACLE_EXTERNAL_ROUTE", origin)
        if (allowedCore.test(path)) inspectManifest(origin, `${root(path)}/package.json`)
      }
      if (factory(origin) && oracle(path)) add("FACTORY_REACHES_ORACLE", origin)
      if (publicEntry(origin) && privatePath(path)) add("PUBLIC_REACHES_PRIVATE_FACTORY", origin)
      for (const next of shared.graph.get(path) ?? []) visit(next)
    }
    visit(origin)
  }
  violations.sort((left, right) => left.file === right.file ? left.code.localeCompare(right.code) : left.file.localeCompare(right.file))
  return { ok: violations.length === 0, violations, scannedFiles: Object.keys(files).length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkFactoryBoundaries()
  console.log(JSON.stringify(result))
  if (!result.ok) process.exitCode = 1
}
