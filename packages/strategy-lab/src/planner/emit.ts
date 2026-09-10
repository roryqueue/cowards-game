import { readFileSync } from "node:fs"
import { createHash } from "node:crypto"
import * as ts from "typescript"
import { defaultRuntimeMetadata } from "@cowards/spec"
import { buildStrategyRevision } from "../../../runtime-js/src/revision.js"
import { validateStrategySource } from "../../../runtime-js/src/validation.js"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot } from "../contracts.js"
import { PLANNER_FEASIBILITY_PROTOCOL, type buildFeasibilityCorpus } from "../feasibility-protocol.js"
import { MISSION_KINDS, createMission, fallbackMission, type MissionKind } from "./missions.js"

const BUILD_ALGORITHM = "planner-static-typescript-concat-v1"
const SOURCE_MODULES = ["missions.ts","assign.ts","brain.ts"] as const
const rawSourceRoot = (source: string) => `sha256:${createHash("sha256").update(source,"utf8").digest("hex")}` as const

/** Static AST and lexical-reference check, not a guest-code evaluator or sandbox. */
export const assertPlannerSourceClosure = (source: string) => {
  const path = "planner-source.js"
  const options: ts.CompilerOptions = { allowJs: true,checkJs: true,noLib: true,noResolve: true,target: ts.ScriptTarget.ES2022,module: ts.ModuleKind.ESNext }
  const ast = ts.createSourceFile(path,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS)
  const host = ts.createCompilerHost(options)
  host.getSourceFile = name => name === path ? ast : undefined
  host.fileExists = name => name === path
  host.readFile = name => name === path ? source : undefined
  const program = ts.createProgram([path],options,host), checker = program.getTypeChecker()
  if (program.getSyntacticDiagnostics().length) throw new TypeError("PLANNER_SOURCE_SYNTAX")
  const globals = new Set(["Math","Number","String","JSON","Array","Object","Set","TypeError","undefined"])
  const denied = new Set(["eval","Function","globalThis","process","require","Date","Promise","fetch","WebAssembly","constructor","__proto__","prototype"])
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.ThisKeyword) throw new TypeError("PLANNER_SOURCE_CAPABILITY")
    if (ts.isIdentifier(node)) {
      if (denied.has(node.text) || node.text === "random") throw new TypeError("PLANNER_SOURCE_CAPABILITY")
      const parent = node.parent
      const propertyName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) && parent.name === node)
      if (!propertyName && !globals.has(node.text) && checker.getSymbolAtLocation(node) === undefined) throw new TypeError(`PLANNER_SOURCE_CLOSURE:${node.text}`)
    }
    if (ts.isElementAccessExpression(node) && (!ts.isNumericLiteral(node.argumentExpression) && ts.isStringLiteral(node.argumentExpression) && denied.has(node.argumentExpression.text))) throw new TypeError("PLANNER_SOURCE_CAPABILITY")
    ts.forEachChild(node,visit)
  }
  visit(ast)
  const gate = validateStrategySource(source)
  if (!gate.valid) throw new TypeError("PLANNER_SOURCE_GATE")
}

export const emitPlannerSource = (): string => {
  const sections = SOURCE_MODULES.map(name => {
    const source = readFileSync(new URL(name,import.meta.url),"utf8")
    const ast = ts.createSourceFile(name,source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS)
    return ast.statements.map(statement => {
      if (ts.isImportDeclaration(statement)) {
        const module = ts.isStringLiteral(statement.moduleSpecifier) ? statement.moduleSpecifier.text : ""
        if (module !== "./missions.js" && !(module === "@cowards/spec" && statement.importClause?.isTypeOnly)) throw new TypeError("PLANNER_BUILD_UNEXPECTED_IMPORT")
        return ""
      }
      if (ts.isExportDeclaration(statement)) throw new TypeError("PLANNER_BUILD_REEXPORT")
      return statement.getText(ast).replace(/^export\s+/u,"")
    }).join("\n")
  })
  const assembled = sections.join("\n") + "\nexport default { selectActivations(input) { return selectPlannerActivations(input); }, soldierBrain(input) { return runPlannerSoldierBrain(input); } };\n"
  const output = ts.transpileModule(assembled,{ compilerOptions: { target: ts.ScriptTarget.ES2022,module: ts.ModuleKind.ESNext,removeComments: true },reportDiagnostics: true })
  if (output.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) throw new TypeError("PLANNER_BUILD_TYPESCRIPT")
  const source = output.outputText.replace(/\r\n?/gu,"\n")
  assertPlannerSourceClosure(source)
  return source
}

export const buildPlannerCandidate = () => {
  const source = emitPlannerSource(), defaults = defaultRuntimeMetadata("typescript")
  const runtime = { ...defaults,adapter: { ...defaults.adapter,id: "runtime-js-container-subprocess" as const } }
  const revision = buildStrategyRevision({ source,runtime })
  if (!revision.validation.valid || revision.sourceBytes > 65536) throw new TypeError("PLANNER_CANDIDATE_SOURCE")
  const moduleRoots = SOURCE_MODULES.map(name => ({ name,root: rawSourceRoot(readFileSync(new URL(name,import.meta.url),"utf8")) }))
  return freezeLabValue({ schemaVersion: "planner-candidate-v1",privacy: "private_offline",buildAlgorithm: BUILD_ALGORITHM,source,sourceRoot: rawSourceRoot(source),sourceBytes: revision.sourceBytes,preferredSourceBytes: 49152,preferredSizeMet: revision.sourceBytes < 49152,hardSourceBytes: 65536,revision,moduleRoots,abi: "strategy-runtime-abi-v1.19",tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,budgetRoot: PLANNER_FEASIBILITY_PROTOCOL.budgetRoot,budget: PLANNER_FEASIBILITY_PROTOCOL.budget,empiricalPassed: false })
}

/** Explicit premeasurement mapping. This changes corpus roots and must be frozen
 * by Plan06; never substitute it into an already measured manifest. Family labels
 * describe canonical observations, not claims of tactical success or reachability. */
export const mapPlannerMissionCorpus = (corpus: ReturnType<typeof buildFeasibilityCorpus>) => {
  const selectActivations = corpus.selectActivations.map(c => structuredClone(c))
  const mappings: { ordinal: number; requested: string; realized: string; fallback: boolean }[] = []
  const soldierBrain = corpus.soldierBrain.map(c => {
    const planner = selectActivations.find(p => p.ordinal === c.ordinal)
    if (!planner || !MISSION_KINDS.includes(c.mission as MissionKind)) throw new TypeError("PLANNER_CORPUS_PAIR")
    const intended = createMission(c.mission as MissionKind,planner.input,c.input.self.id)
    const objective = intended ?? fallbackMission(planner.input,c.input.self.id)
    mappings.push({ ordinal: c.ordinal,requested: c.mission,realized: objective.kind,fallback: intended === null })
    const input = { ...structuredClone(c.input),objective }
    const inputRoot = labRoot("timing-input",input)
    return { ...c,input,inputRoot,caseRoot: labRoot("timing-case",{ method: "soldierBrain",ordinal: c.ordinal,mission: c.mission,family: c.family,inputRoot }) }
  })
  const root = labRoot("timing-corpus",{ selectActivations: selectActivations.map(c => c.caseRoot),soldierBrain: soldierBrain.map(c => c.caseRoot) })
  return freezeLabValue({ selectActivations,soldierBrain,root,mappingVersion: "fixture-to-mission-v1",sourceCorpusRoot: corpus.root,mappings })
}
