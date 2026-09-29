import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { globSync, readFileSync } from "node:fs"
import ts from "typescript"
import { checkLabBoundaries, collectLabBoundaryGraph } from "./check-v1-38-lab-boundaries.js"

const PRIVATE = new Set([
  "packages/strategy-lab/src/league/diagnostic-pilot.ts",
  "scripts/run-v1-38-diagnostic-pilot.ts",
  "scripts/check-v1-38-diagnostic-pilot-boundaries.ts",
])
const PUBLIC = /^(?:apps|packages)\//u
const deployment = /(?:^|\/)(?:public|generated|deploy|deployment|artifacts)\//u
const forbidden = new Set(["runSeriousLeague", "readLeagueInitialCandidates", "readRetainedFactoryLedger", "verifyHistoricalFactoryAssessmentForLeague", "importAssessedFactoryCandidate", "issueLeagueProviderFromFactoryCandidate", "runLeagueCell", "Math.random", "eval", "Function"])
const prospectiveMarker = /diagnostic-pilot-(?:stage-checkpoint-v1|terminal-v2|result-v2|failed-terminal-diagnosis-v1)/u
const allowedDiagnosticFields: Readonly<Record<string, readonly string[]>> = Object.freeze({
  DiagnosticPilotStageCheckpoint: ["schemaVersion", "startRoot", "ordinal", "stage", "root"],
  DiagnosticPilotTerminalV2: ["schemaVersion", "lastEnteredStage", "failureStage", "cause"],
  DiagnosticPilotFailureDiagnosis: ["schemaVersion", "startRoot", "lastEnteredStage", "failureStage", "cause", "root"],
})
export interface DiagnosticPilotBoundaryResult { readonly ok: boolean; readonly scannedFiles: number; readonly violations: readonly { path: string; rule: string }[] }
/** This is an AST/import graph policy, not a sandbox for hostile Strategy. */
export const checkDiagnosticPilotBoundaries = (options: { readonly files?: Readonly<Record<string, string>>; readonly goFiles?: Readonly<Record<string, string>> } = {}): DiagnosticPilotBoundaryResult => {
  const shared = collectLabBoundaryGraph({ files: options.files })
  const violations: { path: string; rule: string }[] = []
  const add = (path: string, rule: string) => { if (!violations.some((entry) => entry.path === path && entry.rule === rule)) violations.push({ path, rule }) }
  for (const entry of checkLabBoundaries({ files: shared.files }).violations) add(entry.file, `lab:${entry.code}`)
  for (const origin of PRIVATE) {
    const text = shared.files[origin]
    if (text === undefined) { add(origin, "missing-private-source"); continue }
    const ast = ts.createSourceFile(origin, text, ts.ScriptTarget.Latest, true)
    const visit = (node: ts.Node): void => {
      if (origin === "packages/strategy-lab/src/league/diagnostic-pilot.ts" && ts.isInterfaceDeclaration(node) && allowedDiagnosticFields[node.name.text]) {
        const permitted = new Set(allowedDiagnosticFields[node.name.text])
        for (const member of node.members) if (ts.isPropertySignature(member) && member.name && !permitted.has(member.name.getText(ast))) add(origin, "private-diagnostic-field")
      }
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && /(?:serious-league|assess-v1-38-factory-independence|phase-266|formation|holdout|public|counted)/iu.test(node.moduleSpecifier.text)) add(origin, "forbidden-import")
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(ast)
        if (forbidden.has(callee) || /(?:^|\.)(?:runSeriousLeague|indexFactory|eval|Function)$/u.test(callee)) add(origin, "forbidden-call")
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "Function") add(origin, "hostile-source-constructor")
      ts.forEachChild(node, visit)
    }
    visit(ast)
    const seen = new Set<string>(), pending = [origin]
    while (pending.length) {
      const current = pending.pop()!
      if (seen.has(current)) continue
      seen.add(current)
      if (current !== origin && /(?:^|\/)(?:formation|holdout|public|counted)(?:\/|\.)/iu.test(current)) add(origin, "private-to-forbidden-root")
      if (current === "scripts/run-v1-38-serious-league.ts") add(origin, "old-full-league-reachable")
      pending.push(...(shared.graph.get(current) ?? []))
    }
  }
  for (const [origin] of shared.graph) {
    if ((!PUBLIC.test(origin) || origin.startsWith("packages/strategy-lab/")) && !deployment.test(origin)) continue
    const seen = new Set<string>(), pending = [origin]
    while (pending.length) {
      const current = pending.pop()!
      if (seen.has(current)) continue
      seen.add(current)
      if (PRIVATE.has(current)) add(origin, "public-reaches-private-pilot")
      pending.push(...(shared.graph.get(current) ?? []))
    }
  }
  for (const [path, source] of Object.entries(shared.files)) {
    if ((path.startsWith("apps/") || path.startsWith("packages/") && !path.startsWith("packages/strategy-lab/")) && !path.endsWith(".test.ts") && prospectiveMarker.test(source)) add(path, "prospective-diagnostic-public-leak")
  }
  const goFiles = options.goFiles ?? (options.files ? {} : Object.fromEntries(globSync("apps/**/*.go").map((path) => [path, readFileSync(path, "utf8")])))
  for (const [path, source] of Object.entries(goFiles)) if (prospectiveMarker.test(source)) add(path, "prospective-diagnostic-go-leak")
  violations.sort((left, right) => left.path.localeCompare(right.path) || left.rule.localeCompare(right.rule))
  return { ok: violations.length === 0, scannedFiles: Object.keys(shared.files).length, violations }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkDiagnosticPilotBoundaries()
  process.stdout.write(`${JSON.stringify(result)}\n`)
  if (!result.ok) process.exitCode = 1
}
