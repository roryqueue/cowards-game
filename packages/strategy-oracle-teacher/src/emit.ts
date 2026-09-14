import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import * as ts from "typescript"
import {
  deriveFactoryOraclePacketRoot,
  FactoryOraclePacketSchema,
  type FactoryOraclePacket,
} from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, type LabRoot } from "../../strategy-lab/src/contracts.js"
import { compileLegalStudentPolicy, type DistilledLegalStudent } from "./distill.js"

const SOURCE_BYTES = new TextEncoder()
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const fail = (code: string): never => { throw new TypeError(`TEACHER_${code}`) }
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot
const REQUIRED_ENTRYPOINTS = ["controllerSelectActivations", "controllerSoldierBrain"] as const
const rawControllerSource = () => readFileSync(new URL("../src/controller.ts", import.meta.url), "utf8").replace(/\r\n?/gu, "\n")
const controllerSource = (source: string) => source.split("\n").filter((line) => !line.startsWith("export type")).join("\n").replace(/^export\s+/gmu, "")
const validRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)

export interface TeacherControllerManifest {
  readonly schemaVersion: "teacher-controller-manifest-v1"
  readonly sourceRoot: LabRoot
  readonly entrypoints: readonly ["controllerSelectActivations", "controllerSoldierBrain"]
}

/** Data-only source manifest. Used to prove emitted source follows owned controller bytes. */
export const deriveTeacherControllerManifest = (source: string): TeacherControllerManifest => {
  if (typeof source !== "string" || source.length === 0 || source.length > 65536) fail("CONTROLLER_SOURCE")
  const ast = ts.createSourceFile("controller.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const checked = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true })
  if (checked.diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) fail("CONTROLLER_SOURCE")
  const exported = new Set<string>()
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement) || !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue
    for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) exported.add(declaration.name.text)
  }
  if (!REQUIRED_ENTRYPOINTS.every((name) => exported.has(name))) fail("CONTROLLER_ENTRYPOINT")
  return Object.freeze({ schemaVersion: "teacher-controller-manifest-v1", sourceRoot: sourceRoot(source.replace(/\r\n?/gu, "\n")), entrypoints: Object.freeze([...REQUIRED_ENTRYPOINTS]) as TeacherControllerManifest["entrypoints"] })
}

export const getTeacherControllerManifest = (): TeacherControllerManifest => deriveTeacherControllerManifest(rawControllerSource())

export interface TeacherFactoryRequest {
  readonly split: "development" | "validation" | "probe"
  readonly doctrineFamily: string
  readonly provider: {
    readonly providerId: string
    /** Local offline-teacher provenance, not a claim of live model participation. */
    readonly modelId: string
    readonly modelVersion: string
    readonly settingsRoot: LabRoot
    readonly promptRoot: LabRoot
    readonly contextRoot: LabRoot
  }
  readonly build: { readonly buildRoot: LabRoot; readonly toolchainRoot: LabRoot }
  readonly lineage: { readonly predecessorRoot: LabRoot; readonly correctionRoot: LabRoot | null; readonly retryParentRoot: LabRoot | null }
}

const sourceModules = (source: string): string => {
  const ast = ts.createSourceFile("teacher-source.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const denied = new Set(["eval", "Function", "globalThis", "process", "require", "Date", "fetch", "WebAssembly", "constructor", "__proto__", "prototype", "random"])
  const options: ts.CompilerOptions = { allowJs: true, checkJs: true, noLib: true, noResolve: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name) => name === "teacher-source.ts" ? ast : undefined
  host.fileExists = (name) => name === "teacher-source.ts"
  host.readFile = (name) => name === "teacher-source.ts" ? source : undefined
  const program = ts.createProgram(["teacher-source.ts"], options, host)
  const checker = program.getTypeChecker()
  const globals = new Set(["Math", "Number", "String", "JSON", "Array", "Object", "Set", "TypeError", "undefined", "null"])
  const declaredCallables = new Set<string>()
  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue
    for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name) && declaration.initializer && (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) declaredCallables.add(declaration.name.text)
  }
  const defaults = ast.statements.filter((statement): statement is ts.ExportAssignment => ts.isExportAssignment(statement) && !statement.isExportEquals)
  if (defaults.length !== 1) fail("SOURCE_EXPORT_SHAPE")
  const defaultExpression = defaults[0]!.expression
  const defaultObject = ts.isObjectLiteralExpression(defaultExpression) ? defaultExpression : fail("SOURCE_EXPORT_SHAPE")
  const defaultProperties = defaultObject.properties
  if (defaultProperties.length !== 2) fail("SOURCE_EXPORT_SHAPE")
  const defaultNames = defaultProperties.map((property) => {
    if (ts.isShorthandPropertyAssignment(property)) return property.name.text
    if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name) && ts.isIdentifier(property.initializer) && property.name.text === property.initializer.text) return property.name.text
    return fail("SOURCE_EXPORT_SHAPE")
  }).sort()
  if (defaultNames.join(",") !== "selectActivations,soldierBrain" || defaultNames.some((name) => !declaredCallables.has(name))) fail("SOURCE_EXPORT_SHAPE")

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ThisKeyword) fail("SOURCE_CAPABILITY")
    if (ts.isElementAccessExpression(node)) {
      const argument = node.argumentExpression
      if (!argument || !ts.isNumericLiteral(argument)) fail("SOURCE_COMPUTED_ACCESS")
    }
    if (ts.isIdentifier(node)) {
      if (denied.has(node.text)) fail("SOURCE_CAPABILITY")
      const parent = node.parent
      const propertyName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) && parent.name === node)
      if (!propertyName && !globals.has(node.text) && checker.getSymbolAtLocation(node) === undefined) fail("SOURCE_FREE_IDENTIFIER")
    }
    ts.forEachChild(node, visit)
  }
  if (program.getSyntacticDiagnostics().length > 0) fail("SOURCE_SYNTAX")
  visit(ast)
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true }, reportDiagnostics: true })
  if (output.diagnostics?.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) fail("SOURCE_TYPESCRIPT")
  return output.outputText.replace(/\r\n?/gu, "\n")
}

/** Static validation only. The emitted text is hostile data and is never imported or executed by this package. */
export const assertTeacherSourceClosure = (source: string): void => {
  if (typeof source !== "string" || source.length === 0 || source.length > 65536) fail("SOURCE_SIZE")
  const compiled = sourceModules(source)
  if (!compiled.includes("export default") || /\b(?:import|eval|Function|require|process|fetch|Date|Math\.random)\b/u.test(compiled)) fail("SOURCE_CLOSURE")
}

/** Emits a closed student that consults only the caller's legal observation, objective, and memory. */
export const emitTeacherSource = (student: DistilledLegalStudent): string => {
  const policy = compileLegalStudentPolicy(student)
  const ownedSource = rawControllerSource()
  const controllerManifest = getTeacherControllerManifest()
const source = `
${controllerSource(ownedSource)}
const policyRepresentation = ${JSON.stringify(policy.representation)};
const student = ${JSON.stringify(policy.student)};
const controllerManifest = ${JSON.stringify(controllerManifest)};
const selectActivations = (input) => controllerSelectActivations(student.featurePolicy, input);
const soldierBrain = (input) => controllerSoldierBrain(student.featurePolicy, input);
export default { selectActivations, soldierBrain };
`
  assertTeacherSourceClosure(source)
  return sourceModules(source)
}

const requestIsValid = (request: TeacherFactoryRequest): void => {
  if (!NAME.test(request.doctrineFamily) || !["development", "validation", "probe"].includes(request.split)) fail("REQUEST")
  const provider = request.provider
  if (!NAME.test(provider.providerId) || typeof provider.modelId !== "string" || provider.modelId.length === 0 || provider.modelId.length > 128 || typeof provider.modelVersion !== "string" || provider.modelVersion.length === 0 || provider.modelVersion.length > 128 || ![provider.settingsRoot, provider.promptRoot, provider.contextRoot].every(validRoot)) fail("PROVENANCE")
  if (![request.build.buildRoot, request.build.toolchainRoot, request.lineage.predecessorRoot].every(validRoot) || ![request.lineage.correctionRoot, request.lineage.retryParentRoot].every((value) => value === null || validRoot(value))) fail("REQUEST")
}

/** Produces a strict root-bound packet as data for later factory admission; it never executes the source. */
export const emitTeacherFactoryPacket = (student: DistilledLegalStudent, request: TeacherFactoryRequest): FactoryOraclePacket => {
  requestIsValid(request)
  const source = emitTeacherSource(student)
  const identity = sourceRoot(source)
  const packet = {
    schemaVersion: "factory-oracle-packet-v1" as const,
    privacy: "private_offline" as const,
    root: identity,
    oracleFamily: "teacher-oracle",
    doctrineFamily: request.doctrineFamily,
    source: { root: identity, sha256: identity, byteLength: SOURCE_BYTES.encode(source).byteLength, encoding: "utf8" as const },
    provider: request.provider,
    inheritedAuthority: { admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot, sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, runtimeAbi: LAB_VERSIONS.runtimeAbi, labSchema: LAB_VERSIONS.schema },
    build: { ...request.build, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot },
    versions: { factory: "factory-v1" as const, algorithm: "counterfactual-teacher-distillation-v1", schema: "factory-schema-v1" as const },
    nativeLane: { language: "typescript" as const, providerId: request.provider.providerId, runtimeAbi: LAB_VERSIONS.runtimeAbi, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, translation: "none" as const },
    lineage: request.lineage,
    split: request.split,
  }
  return FactoryOraclePacketSchema.parse({ ...packet, root: deriveFactoryOraclePacketRoot(packet) })
}
