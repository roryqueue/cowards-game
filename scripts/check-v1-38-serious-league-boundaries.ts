import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { checkLabBoundaries, collectLabBoundaryGraph } from "./check-v1-38-lab-boundaries.js"

export interface SeriousLeagueBoundaryViolation { readonly path: string; readonly line: number; readonly rule: string }
export interface SeriousLeagueBoundaryResult { readonly ok: boolean; readonly violations: readonly SeriousLeagueBoundaryViolation[]; readonly scannedFiles: number }
export interface SeriousLeagueBoundaryOptions { readonly files?: Readonly<Record<string, string>> }

const source = /\.[cm]?[jt]sx?$/u
const test = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/u
const restricted = (file: string) => file === "packages/strategy-lab/src/index.ts" || file.startsWith("packages/strategy-lab/src/league/") || ["scripts/run-v1-38-serious-league.ts", "scripts/lib/v1-38-league-authoring.ts", "scripts/lib/v1-38-league-response-runtime.ts", "scripts/assess-v1-38-factory-independence.ts", "scripts/v1-38-factory-execution-evidence.ts", "scripts/v1-38-factory-assessment-correction.ts"].includes(file)
const publicOrDeployment = (file: string) => (/^(?:apps|packages)\//u.test(file) && !file.startsWith("packages/strategy-lab/") && !test.test(file)) || /(?:^|\/)(?:public|generated|deploy|deployment|artifacts)\//u.test(file) || /(?:^|\/)(?:Dockerfile[^/]*|[^/]*docker[^/]*|compose[^/]*)(?:\/|$)/iu.test(file)
const allowedUnresolved = new Set(["node:buffer", "node:crypto", "node:fs", "node:fs/promises", "node:os", "node:path", "node:url", "node:worker_threads"])

const hostileExecution = (text: string, file: string): boolean => {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true); let found = false
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["eval", "Function"].includes(node.expression.text)) found = true
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") found = true
    if (ts.isPropertyAccessExpression(node) && node.name.text === "runInNewContext") found = true
    ts.forEachChild(node, visit)
  }
  visit(ast); return found
}

/** Phase-265 policy over the shared AST/module-resolution graph, not a runtime sandbox. */
export const checkSeriousLeagueBoundaries = (options: SeriousLeagueBoundaryOptions = {}): SeriousLeagueBoundaryResult => {
  const shared = collectLabBoundaryGraph({ files: options.files }), violations: SeriousLeagueBoundaryViolation[] = []
  const add = (rule: string, path: string) => { if (!violations.some((entry) => entry.rule === rule && entry.path === path)) violations.push({ path, line: 1, rule }) }
  for (const violation of checkLabBoundaries({ files: shared.files }).violations) {
    add(`lab:${violation.code}`, violation.file)
  }
  const visit = (origin: string, predicate: (path: string) => void) => {
    const visited = new Set<string>()
    const walk = (path: string) => { if (visited.has(path)) return; visited.add(path); predicate(path); for (const next of shared.graph.get(path) ?? []) walk(next) }
    walk(origin)
  }
  for (const origin of shared.graph.keys()) {
    if (restricted(origin)) visit(origin, (path) => {
      if (path !== origin && restricted(path) && test.test(path)) add("restricted-test-reachable", origin)
      if (source.test(path) && hostileExecution(shared.files[path] ?? "", path)) add("hostile-source-execution", origin)
      if (!restricted(path)) return
      for (const specifier of shared.unresolved.get(path) ?? []) {
        // The current-league CLI alone may invoke the bounded Darwin host
        // memory probe. This does not grant process-spawn reachability to the
        // league package, authoring helpers, web, API, or worker paths.
        if (path === "scripts/run-v1-38-serious-league.ts" && specifier === "node:child_process") continue
        if (specifier === undefined || !allowedUnresolved.has(specifier)) add("unresolved-private-loader", origin)
      }
    })
    if (publicOrDeployment(origin)) visit(origin, (path) => { if (restricted(path)) add("public-or-deployment-reaches-private-league", origin) })
  }
  violations.sort((left, right) => left.path === right.path ? left.rule.localeCompare(right.rule) : left.path.localeCompare(right.path))
  return { ok: violations.length === 0, violations, scannedFiles: Object.keys(shared.files).length }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkSeriousLeagueBoundaries()
  process.stdout.write(`${JSON.stringify(result)}\n`)
  if (!result.ok) process.exitCode = 1
}
