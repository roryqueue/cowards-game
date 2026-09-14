import * as ts from "typescript"
import { validateStrategySource } from "../../runtime-js/src/validation.js"
import {
  deriveFactoryOraclePacketRoot,
  FactoryOraclePacketSchema,
  type FactoryOraclePacket,
} from "../../strategy-lab/src/factory/packet.js"
import { LAB_ADMITTED_ROOTS, LAB_VERSIONS, freezeLabValue, labRoot, type LabRoot } from "../../strategy-lab/src/contracts.js"
import { requireFrozenModelBundle, type FrozenModelBundle } from "./bundle.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-z0-9-]{0,95}$/u
const sourceBytes = new TextEncoder()
const fail = (code: string): never => { throw new TypeError(`MODEL_${code}`) }
const root = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const same = (left: unknown, right: unknown) => labRoot("frozen-model-comparison-v1", left) === labRoot("frozen-model-comparison-v1", right)
const issuedProvenance = new WeakSet<object>()
const provenanceByPacket = new WeakMap<object, Readonly<ModelFactoryPacketProvenance>>()

export interface ModelFactoryRequest {
  readonly split: "development" | "validation" | "probe"; readonly doctrineFamily: string
  readonly build: { readonly buildRoot: LabRoot; readonly toolchainRoot: LabRoot }
  readonly lineage: { readonly predecessorRoot: LabRoot; readonly correctionRoot: LabRoot | null; readonly retryParentRoot: LabRoot | null }
}

/** Private immutable companion retained with the exact emitted packet, never a caller assertion. */
export interface ModelFactoryPacketProvenance {
  readonly schemaVersion: "frozen-model-packet-provenance-v1"; readonly privacy: "private_offline"; readonly root: LabRoot
  readonly bundleRoot: LabRoot; readonly packetRoot: LabRoot; readonly sourceRoot: LabRoot; readonly bundle: Readonly<FrozenModelBundle>
}

export const deriveModelFactoryPacketProvenanceRoot = (value: Omit<ModelFactoryPacketProvenance, "root">): LabRoot =>
  labRoot("frozen-model-packet-provenance-v1", value)

const issueModelFactoryPacketProvenance = (packet: FactoryOraclePacket, bundle: Readonly<FrozenModelBundle>): Readonly<ModelFactoryPacketProvenance> => {
  const value = {
    schemaVersion: "frozen-model-packet-provenance-v1" as const,
    privacy: "private_offline" as const,
    bundleRoot: bundle.root,
    packetRoot: packet.root,
    sourceRoot: bundle.source.root,
    bundle,
  }
  const provenance = freezeLabValue({ ...value, root: deriveModelFactoryPacketProvenanceRoot(value) })
  issuedProvenance.add(provenance)
  provenanceByPacket.set(packet, provenance)
  return provenance
}

/** Requires the exact emitted packet and its issued companion, then rederives all linkage roots. */
export const requireIssuedModelFactoryPacketProvenance = (
  packet: FactoryOraclePacket,
  provenance: ModelFactoryPacketProvenance,
): Readonly<ModelFactoryPacketProvenance> => {
  if (provenanceByPacket.get(packet) !== provenance || !issuedProvenance.has(provenance)) fail("UNISSUED_PROVENANCE")
  const bundle = requireFrozenModelBundle(provenance.bundle)
  if (provenance.root !== deriveModelFactoryPacketProvenanceRoot({ schemaVersion: provenance.schemaVersion, privacy: provenance.privacy, bundleRoot: provenance.bundleRoot, packetRoot: provenance.packetRoot, sourceRoot: provenance.sourceRoot, bundle: provenance.bundle }) ||
      provenance.bundleRoot !== bundle.root || provenance.packetRoot !== packet.root || provenance.sourceRoot !== bundle.source.root ||
      packet.source.root !== provenance.sourceRoot || !same(packet.provider, bundle.provider) || !same(packet.lineage, bundle.lineage)) fail("PROVENANCE_BINDING")
  return provenance
}

export const getIssuedModelFactoryPacketProvenance = (packet: FactoryOraclePacket): Readonly<ModelFactoryPacketProvenance> => {
  const provenance = provenanceByPacket.get(packet)
  if (!provenance) return fail("UNISSUED_PACKET")
  return requireIssuedModelFactoryPacketProvenance(packet, provenance)
}

/** Supplements lexical runtime validation with syntax/default-export/free-identifier closure checks. */
export const assertModelSourceClosure = (source: string): void => {
  if (sourceBytes.encode(source).byteLength < 1 || sourceBytes.encode(source).byteLength > 65536) fail("SOURCE_BYTES")
  const path = "frozen-model-source.ts"
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name) => name === path ? ast : undefined
  host.fileExists = (name) => name === path
  host.readFile = (name) => name === path ? source : undefined
  const program = ts.createProgram([path], options, host), checker = program.getTypeChecker()
  const globals = new Set(["Math", "Number", "String", "JSON", "Array", "Object", "Set", "TypeError", "undefined", "null"])
  const denied = new Set(["eval", "Function", "globalThis", "process", "require", "Date", "fetch", "WebAssembly", "constructor", "__proto__", "prototype", "random"])
  let defaultObject: ts.ObjectLiteralExpression | undefined
  const staticString = (node: ts.Expression): string | undefined => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    if (ts.isParenthesizedExpression(node)) return staticString(node.expression)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const left = staticString(node.left), right = staticString(node.right)
      return left === undefined || right === undefined ? undefined : `${left}${right}`
    }
    return undefined
  }
  const hasRequiredMethod = (object: ts.ObjectLiteralExpression, name: string): boolean =>
    object.properties.some((property) => ts.isMethodDeclaration(property) && ts.isIdentifier(property.name) && property.name.text === name && property.body !== undefined)
  const visit = (node: ts.Node): void => {
    if (ts.isExportAssignment(node) && !node.isExportEquals && ts.isObjectLiteralExpression(node.expression)) defaultObject = node.expression
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) || ts.isAwaitExpression(node) || node.kind === ts.SyntaxKind.ImportKeyword || node.kind === ts.SyntaxKind.AsyncKeyword || node.kind === ts.SyntaxKind.ThisKeyword) fail("SOURCE_CAPABILITY")
    if (ts.isIdentifier(node)) {
      if (denied.has(node.text)) fail("SOURCE_CAPABILITY")
      const parent = node.parent
      const propertyName = (ts.isPropertyAccessExpression(parent) && parent.name === node) || ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent)) && parent.name === node)
      if (!propertyName && !globals.has(node.text) && checker.getSymbolAtLocation(node) === undefined) fail("SOURCE_FREE_IDENTIFIER")
    }
    if (ts.isElementAccessExpression(node)) {
      const key = staticString(node.argumentExpression)
      if (key === undefined || denied.has(key)) fail("SOURCE_CAPABILITY")
    }
    ts.forEachChild(node, visit)
  }
  if (program.getSyntacticDiagnostics().length > 0) fail("SOURCE_SYNTAX")
  visit(ast)
  if (defaultObject) {
    if (!hasRequiredMethod(defaultObject, "selectActivations") || !hasRequiredMethod(defaultObject, "soldierBrain")) fail("SOURCE_METHODS")
  } else {
    return fail("SOURCE_DEFAULT_EXPORT")
  }
  const validation = validateStrategySource(source)
  if (!validation.valid || validation.sourceBytes < 1 || validation.sourceBytes > 65536) fail("SOURCE_RUNTIME")
}

const validateRequest = (request: ModelFactoryRequest): void => {
  if (!NAME.test(request.doctrineFamily) || !["development", "validation", "probe"].includes(request.split) || ![request.build.buildRoot, request.build.toolchainRoot, request.lineage.predecessorRoot].every(root) || ![request.lineage.correctionRoot, request.lineage.retryParentRoot].every((value) => value === null || root(value))) fail("REQUEST")
}

/** Converts an admitted exact source record into factory packet data without source execution or model invocation. */
export const emitModelFactoryPacket = (bundle: FrozenModelBundle, request: ModelFactoryRequest): FactoryOraclePacket => {
  const admitted = requireFrozenModelBundle(bundle)
  validateRequest(request)
  if (!same(request.lineage, admitted.lineage)) fail("LINEAGE")
  assertModelSourceClosure(admitted.response.source)
  const packet = {
    schemaVersion: "factory-oracle-packet-v1" as const,
    privacy: "private_offline" as const,
    root: admitted.source.root,
    oracleFamily: "model-oracle",
    doctrineFamily: request.doctrineFamily,
    source: admitted.source,
    provider: admitted.provider,
    inheritedAuthority: { admittedRoot: LAB_ADMITTED_ROOTS.currentStartRoot, sourceClosureRoot: LAB_ADMITTED_ROOTS.sourceClosureRoot, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot, runtimeAbi: LAB_VERSIONS.runtimeAbi, labSchema: LAB_VERSIONS.schema },
    build: { ...request.build, compatibilityTupleRoot: LAB_ADMITTED_ROOTS.tupleRoot },
    versions: { factory: "factory-v1" as const, algorithm: "frozen-model-bundle-v1", schema: "factory-schema-v1" as const },
    nativeLane: { ...admitted.nativeLane, runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot },
    lineage: request.lineage,
    split: request.split,
  }
  if (admitted.nativeLane.runtimeProfileRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot || sourceBytes.encode(admitted.response.source).byteLength !== admitted.source.byteLength) fail("PINNED_LANE")
  const emitted = FactoryOraclePacketSchema.parse({ ...packet, root: deriveFactoryOraclePacketRoot(packet) })
  issueModelFactoryPacketProvenance(emitted, admitted)
  return emitted
}
