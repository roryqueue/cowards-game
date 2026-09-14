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
const auditedCoreRoots = new Set(["packages/spec/src/index.ts", "packages/engine/src/index.ts", "packages/replay/src/index.ts", "packages/runtime-js/src/index.ts", "packages/runtime-supervisor/src/index.ts"])
const allowedOracleManifestDependency = new Set(["@cowards/spec", "@cowards/engine", "@cowards/replay", "@cowards/runtime-js", "@cowards/strategy-lab"])
const allowedUnresolved = (path: string, specifier: string | undefined): boolean =>
  (specifier === "typescript" && reviewedAstTool(path)) || (specifier !== undefined && allowedNode.has(specifier))

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
  const auditedCore = new Set<string>()
  const collectCore = (path: string): void => { if (auditedCore.has(path)) return; auditedCore.add(path); for (const next of shared.graph.get(path) ?? []) collectCore(next) }
  for (const path of auditedCoreRoots) if (files[path] !== undefined) collectCore(path)
  const declaredCoreDependency = (path: string, specifier: string | undefined): boolean => {
    if (!auditedCore.has(path) || specifier === undefined) return false
    const owner = [...shared.manifestDependencies.keys()]
      .filter(manifest => path.startsWith(`${manifest.slice(0, -"package.json".length)}`))
      .sort((left, right) => right.length - left.length)[0]
    return owner !== undefined && (shared.manifestDependencies.get(owner) ?? []).includes(specifier)
  }
  for (const origin of shared.graph.keys()) {
    const seen = new Set<string>()
    const visit = (path: string): void => {
      if (seen.has(path)) return
      seen.add(path)
      if (oracle(origin) && path !== origin && (shared.unresolved.get(path) ?? []).some(specifier => !allowedUnresolved(path, specifier) && !declaredCoreDependency(path, specifier))) add("ORACLE_TRANSITIVE_UNRESOLVED", origin)
      if (oracle(origin) && path !== origin && source.test(path) && hasHostileExecution(files[path] ?? "", path)) add("ORACLE_TRANSITIVE_HOSTILE_EXECUTION", origin)
      if (oracle(origin) && path !== origin) {
        const ownLeaf = oracle(path) && root(path) === root(origin)
        if (!ownLeaf && (!allowedCore.test(path) || !auditedCore.has(path)) && !narrowFactory.has(path)) add("ORACLE_EXTERNAL_ROUTE", origin)
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
