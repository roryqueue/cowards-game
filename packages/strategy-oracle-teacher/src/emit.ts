import { createHash } from "node:crypto"
import * as ts from "typescript"
import {
  deriveFactoryOraclePacketRoot,
  FactoryOraclePacketSchema,
  type FactoryOraclePacket,
} from "../../strategy-lab/src/factory/index.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, type LabRoot } from "../../strategy-lab/src/contracts.js"
import { compileLegalStudentPolicy, type DistilledLegalStudent, type StudentAction } from "./distill.js"

const SOURCE_BYTES = new TextEncoder()
const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const fail = (code: string): never => { throw new TypeError(`TEACHER_${code}`) }
const sourceRoot = (source: string): LabRoot => `sha256:${createHash("sha256").update(source, "utf8").digest("hex")}` as LabRoot
const validRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)

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

const validAction = (action: unknown): action is StudentAction =>
  !!action && typeof action === "object" &&
  ((action as StudentAction).type === "TURN_TO_STONE" || ((action as StudentAction).type === "TURN" && (action as { direction?: unknown }).direction === "UP"))

const validStudent = (student: DistilledLegalStudent): void => {
  if (student.schemaVersion !== "teacher-distilled-student-v1" || !Array.isArray(student.rules) || student.rules.length > 256 || !student.rules.every((rule) => typeof rule.observationKey === "string" && rule.observationKey.length > 0 && rule.observationKey.length <= 16384 && validAction(rule.action))) fail("STUDENT")
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
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ThisKeyword) fail("SOURCE_CAPABILITY")
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
  validStudent(student)
  const policy = compileLegalStudentPolicy(student)
  const source = `
const policyRepresentation = ${JSON.stringify(policy.representation)};
const teacherRules = ${JSON.stringify(policy.rules)};
const canonicalize = (value) => Array.isArray(value) ? value.map(canonicalize) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonicalize(child)])) : value;
const legalKey = (observation, objective, memory) => JSON.stringify(canonicalize({ observation, objective, memory }));
const studentAction = (observation, objective, memory) => policyRepresentation === "canonical-legal-observation-objective-memory-v1" ? teacherRules.find((rule) => rule.observationKey === legalKey(observation, objective, memory))?.action || { type: "TURN_TO_STONE" } : { type: "TURN_TO_STONE" };
const selectActivations = (input) => ({ activationOrders: (input.mySoldiers || []).filter((soldier) => soldier.status === "ACTIVE" && soldier.position).sort((left, right) => left.id.localeCompare(right.id)).slice(0, input.activationCount || 0).map((soldier) => ({ soldierId: soldier.id, objective: null })), strategyMemory: { teacher: { schemaVersion: "teacher-student-memory-v1", decision: studentAction(input.board || {}, null, input.strategyMemory || {}).type } } });
const soldierBrain = (input) => ({ action: studentAction(input.awarenessGrid || {}, input.objective || null, input.soldierMemory || {}), soldierMemory: input.soldierMemory || {} });
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
