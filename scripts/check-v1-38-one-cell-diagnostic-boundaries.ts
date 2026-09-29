import { globSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { checkLabBoundaries, collectLabBoundaryGraph } from "./check-v1-38-lab-boundaries.js"

const PRIVATE = new Set(["packages/strategy-lab/src/league/diagnostic-one-cell.ts", "packages/strategy-lab/src/league/connected-runner.ts", "scripts/run-v1-38-one-cell-diagnostic.ts", "scripts/check-v1-38-one-cell-diagnostic-boundaries.ts"])
const marker = /(?:diagnostic-one-cell|league-265-one-cell-diagnostic-v3)/u
const publicPath = /^(?:apps\/|packages\/(?!strategy-lab\/)|.*\/(?:public|deploy|deployment|generated)\/)/u
const forbidden = /(?:^|\.)(?:issueDiagnosticPilotProviderFromFactoryCandidate|runDiagnosticPilotCell|openDiagnosticPilotLedger|runSeriousLeague|eval|Function)$/u
export const checkOneCellDiagnosticBoundaries = (options: { readonly files?: Readonly<Record<string, string>>; readonly goFiles?: Readonly<Record<string, string>> } = {}) => {
  const shared = collectLabBoundaryGraph({ files: options.files })
  const violations: { path: string; rule: string }[] = []
  const add = (path: string, rule: string) => { if (!violations.some((value) => value.path === path && value.rule === rule)) violations.push({ path, rule }) }
  for (const entry of checkLabBoundaries({ files: shared.files }).violations) add(entry.file, `lab:${entry.code}`)
  for (const origin of PRIVATE) {
    const source = shared.files[origin]
    if (source === undefined) { add(origin, "missing-private-source"); continue }
    const ast = ts.createSourceFile(origin, source, ts.ScriptTarget.Latest, true)
    const visit = (node: ts.Node): void => {
      if (origin.endsWith("diagnostic-one-cell.ts") && ts.isInterfaceDeclaration(node) && node.name.text === "DiagnosticOneCellTerminal") {
        for (const member of node.members) if (ts.isPropertySignature(member) && member.name && /^(?:raw|stack|error|exception|source|memory)/iu.test(member.name.getText(ast))) add(origin, "raw-private-field")
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && /(?:phase-266|formation|holdout|public|counted)/iu.test(node.moduleSpecifier.text)) add(origin, "forbidden-import")
      if (ts.isCallExpression(node) && forbidden.test(node.expression.getText(ast))) add(origin, "forbidden-call")
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") add(origin, "hostile-source-constructor")
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  for (const [origin] of shared.graph) {
    if (!publicPath.test(origin)) continue
    const seen = new Set<string>(), pending = [origin]
    while (pending.length) {
      const current = pending.pop()!
      if (seen.has(current)) continue
      seen.add(current)
      if (PRIVATE.has(current)) add(origin, "public-reaches-private-one-cell")
      pending.push(...(shared.graph.get(current) ?? []))
    }
  }
  for (const [path, source] of Object.entries(shared.files)) if (publicPath.test(path) && !path.endsWith(".test.ts") && marker.test(source)) add(path, "private-diagnostic-public-leak")
  const goFiles = options.goFiles ?? (options.files ? {} : Object.fromEntries(globSync("apps/**/*.go").map((path) => [path, readFileSync(path, "utf8")])))
  for (const [path, source] of Object.entries(goFiles)) if (marker.test(source)) add(path, "private-diagnostic-go-leak")
  violations.sort((a, b) => a.path.localeCompare(b.path) || a.rule.localeCompare(b.rule))
  return { ok: violations.length === 0, scannedFiles: Object.keys(shared.files).length, violations }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const result = checkOneCellDiagnosticBoundaries(); process.stdout.write(`${JSON.stringify(result)}\n`); if (!result.ok) process.exitCode = 1 }
