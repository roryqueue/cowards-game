import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import * as ts from "typescript"
import { LAB_ADMITTED_ROOTS, exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { deriveFactoryExecutionCommitment, deriveFactoryOrderedRecordDescriptor, isIssuedFactorySupervisionReceipt, type FactorySupervisionReceipt } from "./admission.js"
import {
  FactoryCandidateSchema,
  FactoryOraclePacketSchema,
  FactoryProposalSchema,
  FactoryValidationEvidenceSchema,
  factoryProposalFromPacket,
  type FactoryDisposition,
  type FactoryFingerprintRoots,
} from "./contracts.js"
import { admitFactoryCalibrationManifest } from "./calibration.js"
import { publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "./repository.js"

const ROOT = /^sha256:[0-9a-f]{64}$/u
const NAME = /^[a-z][a-zA-Z0-9._:-]{0,127}$/u
const fail = (code: string): never => { throw new TypeError(`FACTORY_FINGERPRINT_${code}`) }
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => exactLabKeys(value, keys)
const byteRoot = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}` as LabRoot
const withoutRoot = <T extends { readonly root?: unknown }>(value: T) => {
  const { root: _root, ...rest } = value
  return rest
}

export interface FactoryFingerprintEvidence {
  readonly schemaVersion: "factory-fingerprint-evidence-v1"
  readonly privacy: "private_offline"
  readonly root: LabRoot
  readonly proposalRoot: LabRoot
  readonly validationRoot: LabRoot
  readonly supervisionReceiptRoot: LabRoot
  readonly producerIdentity: "emitTacticalFactoryPacket" | "emitTeacherFactoryPacket" | "emitModelFactoryPacket" | "admitQuarantinedIntakePacket" | "materializeFactoryCalibrationControl"
  readonly origin: "tactical-oracle" | "teacher-oracle" | "model-oracle" | "human-external-intake" | "calibration-control"
  readonly evidenceClass: "real_producer" | "mechanics_only"
  readonly producerArtifactRoot: LabRoot | null
  readonly authorshipRoots: readonly LabRoot[]
  readonly lineageNodes: readonly Readonly<{ root: LabRoot; artifactRoot: LabRoot; parents: readonly LabRoot[] }>[]
  readonly dependencyNodes: readonly Readonly<{ root: LabRoot; artifactRoot: LabRoot; dependencies: readonly LabRoot[] }>[]
  readonly matchupResponses: readonly Readonly<{
    supervisionReceiptRoot: LabRoot; conditionRoot: LabRoot; opponentRoot: LabRoot; side: "bottom" | "top"; initialInitiative: boolean
    outcome: "bottom" | "top" | "draw" | "failure"; responseRoot: LabRoot
  }>[]
  readonly counterfactualPairs: readonly Readonly<{ leftRoot: LabRoot; rightRoot: LabRoot; relation: "distinct" | "correlated" | "borderline" }>[]
  readonly failureModes: readonly FactoryDisposition[]
}

const producerOrigins: Readonly<Record<FactoryFingerprintEvidence["producerIdentity"], FactoryFingerprintEvidence["origin"]>> = {
  emitTacticalFactoryPacket: "tactical-oracle",
  emitTeacherFactoryPacket: "teacher-oracle",
  emitModelFactoryPacket: "model-oracle",
  admitQuarantinedIntakePacket: "human-external-intake",
  materializeFactoryCalibrationControl: "calibration-control",
}
const issuedEvidence = new WeakSet<object>()
const authorizedProducerEvidence = new WeakMap<object, LabRoot>()
const dispositions: readonly FactoryDisposition[] = ["accepted", "rejected", "invalid", "duplicate", "legal_but_weak", "retried", "unresolved", "player_violation", "system_failure"]
const validateNodes = (value: unknown, edge: "parents" | "dependencies") => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1024) return fail("NODES")
  const list = value as unknown[]
  const nodes = list.map((entry: unknown) => {
    if (!exact(entry, ["root", "artifactRoot", edge]) || !isRoot(entry.root) || !isRoot(entry.artifactRoot) || !Array.isArray(entry[edge]) || entry[edge].length > 64 || !entry[edge].every(isRoot)) fail("NODES")
    return entry as unknown as { readonly root: LabRoot; readonly artifactRoot: LabRoot; readonly parents: readonly LabRoot[]; readonly dependencies: readonly LabRoot[] }
  })
  if (new Set(nodes.map((entry) => entry.root)).size !== nodes.length) fail("NODE_DUPLICATE")
  return nodes
}
const validateEvidence = (value: unknown): Readonly<FactoryFingerprintEvidence> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  const keys = ["schemaVersion", "privacy", "root", "proposalRoot", "validationRoot", "supervisionReceiptRoot", "producerIdentity", "origin", "evidenceClass", "producerArtifactRoot", "authorshipRoots", "lineageNodes", "dependencyNodes", "matchupResponses", "counterfactualPairs", "failureModes"] as const
  if (!admitted.ok) return fail("EVIDENCE")
  if (admitted.canonicalByteLength > 262144) return fail("EVIDENCE")
  if (!exact(admitted.value, keys)) return fail("EVIDENCE")
  const record: Record<string, unknown> = admitted.value
  if (record.schemaVersion !== "factory-fingerprint-evidence-v1" || record.privacy !== "private_offline" || ![record.root, record.proposalRoot, record.validationRoot, record.supervisionReceiptRoot].every(isRoot) ||
      !(typeof record.producerIdentity === "string" && Object.hasOwn(producerOrigins, record.producerIdentity)) || record.origin !== producerOrigins[record.producerIdentity as FactoryFingerprintEvidence["producerIdentity"]] ||
      !["real_producer", "mechanics_only"].includes(String(record.evidenceClass)) || !(record.producerArtifactRoot === null || isRoot(record.producerArtifactRoot)) || !Array.isArray(record.authorshipRoots) || record.authorshipRoots.length < 1 || record.authorshipRoots.length > 64 || !record.authorshipRoots.every(isRoot) ||
      !Array.isArray(record.matchupResponses) || record.matchupResponses.length < 1 || record.matchupResponses.length > 4096 || !Array.isArray(record.counterfactualPairs) || record.counterfactualPairs.length < 1 || record.counterfactualPairs.length > 4096 ||
      !Array.isArray(record.failureModes) || record.failureModes.length < 1 || record.failureModes.length > 64 || !record.failureModes.every((entry: unknown) => dispositions.includes(entry as FactoryDisposition))) fail("EVIDENCE")
  validateNodes(record.lineageNodes, "parents")
  validateNodes(record.dependencyNodes, "dependencies")
  for (const response of record.matchupResponses as unknown[]) {
    if (!exact(response, ["supervisionReceiptRoot", "conditionRoot", "opponentRoot", "side", "initialInitiative", "outcome", "responseRoot"]) || ![response.supervisionReceiptRoot, response.conditionRoot, response.opponentRoot, response.responseRoot].every(isRoot) || !["bottom", "top"].includes(String(response.side)) || typeof response.initialInitiative !== "boolean" || !["bottom", "top", "draw", "failure"].includes(String(response.outcome))) fail("MATCHUP")
  }
  for (const pair of record.counterfactualPairs as unknown[]) {
    if (!exact(pair, ["leftRoot", "rightRoot", "relation"]) || ![pair.leftRoot, pair.rightRoot].every(isRoot) || !["distinct", "correlated", "borderline"].includes(String(pair.relation))) fail("COUNTERFACTUAL")
  }
  const typed = record as unknown as FactoryFingerprintEvidence
  // Calibration descendants must never masquerade as independent producers.
  if (typed.origin === "calibration-control" && typed.evidenceClass !== "mechanics_only") return fail("CONTROL_NOT_PRODUCER")
  if (typed.root !== labRoot("factory-fingerprint-evidence-v1", withoutRoot(typed))) fail("EVIDENCE_ROOT")
  return freezeLabValue(typed)
}

export const createFactoryFingerprintEvidence = (value: Omit<FactoryFingerprintEvidence, "schemaVersion" | "privacy" | "root">): Readonly<FactoryFingerprintEvidence> => {
  if (value.evidenceClass !== "mechanics_only" || value.producerArtifactRoot !== null) return fail("CALLER_REAL_PRODUCER")
  const draft = { schemaVersion: "factory-fingerprint-evidence-v1" as const, privacy: "private_offline" as const, ...value }
  const evidence = validateEvidence({ ...draft, root: labRoot("factory-fingerprint-evidence-v1", draft) })
  issuedEvidence.add(evidence)
  return evidence
}

const verifyAuthorizedProducer = (repository: FactoryRepository, manifestArtifactRoot: LabRoot, value: Pick<FactoryFingerprintEvidence, "producerIdentity" | "origin" | "producerArtifactRoot" | "proposalRoot">): void => {
  if (!value.producerArtifactRoot) return fail("PRODUCER_ARTIFACT")
  const manifestParsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, manifestArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!manifestParsed.ok) return fail("PRODUCER_MANIFEST")
  const manifest = admitFactoryCalibrationManifest(manifestParsed.value)
  const listed = manifest.ingestions.find((entry) => entry.artifactRoot === value.producerArtifactRoot)
  if (!listed || listed.producerIdentity !== value.producerIdentity || listed.origin !== value.origin) return fail("PRODUCER_MANIFEST_BINDING")
  const authorizationParsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, manifest.authorizationArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!authorizationParsed.ok || !authorizationParsed.value || typeof authorizationParsed.value !== "object" || Array.isArray(authorizationParsed.value)) return fail("PRODUCER_AUTHORIZATION")
  const authorization = authorizationParsed.value as Record<string, unknown>, { root: authorizationRoot, ...authorizationValue } = authorization
  if (authorization.schemaVersion !== "factory-calibration-authorization-v1" || authorization.status !== "authorized" || authorizationRoot !== manifest.authorizationRoot || authorizationRoot !== labRoot("factory-calibration-authorization-v1", authorizationValue) || !Array.isArray(authorization.ingestionArtifactRoots) || !authorization.ingestionArtifactRoots.includes(value.producerArtifactRoot) || !Array.isArray(authorization.workloadArtifactRoots)) return fail("PRODUCER_AUTHORIZATION")
  const producerParsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, value.producerArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!producerParsed.ok || !exact(producerParsed.value, ["schemaVersion", "privacy", "root", "producerIdentity", "origin", "evidenceClass", "packetRoot", "sourceRoot", "runtimeProfileRoot", "nativeLane", "packet", "sourceUtf8", "producerInput", "modelCompanion"])) return fail("PRODUCER_RECORD")
  const producer = producerParsed.value as Record<string, unknown>, { root: producerRoot, ...producerValue } = producer
  const packet = FactoryOraclePacketSchema.parse(producer.packet)
  if (producer.schemaVersion !== "factory-ingestion-v1" || producer.privacy !== "private_offline" || producerRoot !== labRoot("factory-ingestion-v1", producerValue) || producer.producerIdentity !== value.producerIdentity || producer.origin !== value.origin || producer.evidenceClass !== "real_producer" || producer.packetRoot !== packet.root || producer.sourceRoot !== packet.source.root || factoryProposalFromPacket(packet).root !== value.proposalRoot || typeof producer.sourceUtf8 !== "string" || byteRoot(new TextEncoder().encode(producer.sourceUtf8)) !== packet.source.root) return fail("PRODUCER_RECORD_BINDING")
}

/** Real-producer provenance requires the retained prepared authorization, not a label. */
export const createAuthorizedFactoryFingerprintEvidence = (input: { readonly repository: FactoryRepository; readonly calibrationManifestArtifactRoot: LabRoot; readonly value: Omit<FactoryFingerprintEvidence, "schemaVersion" | "privacy" | "root"> }): Readonly<FactoryFingerprintEvidence> => {
  if (input.value.evidenceClass !== "real_producer" || input.value.producerArtifactRoot === null) return fail("PRODUCER_AUTHORIZATION")
  verifyAuthorizedProducer(input.repository, input.calibrationManifestArtifactRoot, input.value)
  const draft = { schemaVersion: "factory-fingerprint-evidence-v1" as const, privacy: "private_offline" as const, ...input.value }
  const evidence = validateEvidence({ ...draft, root: labRoot("factory-fingerprint-evidence-v1", draft) })
  issuedEvidence.add(evidence); authorizedProducerEvidence.set(evidence, input.calibrationManifestArtifactRoot)
  return evidence
}

const validateGraphArtifacts = (repository: FactoryRepository, nodes: readonly Readonly<{ root: LabRoot; artifactRoot: LabRoot; links: readonly LabRoot[] }>[], kind: "lineage" | "dependency") => {
  for (const node of nodes) {
    const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, node.artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "kind", "nodeRoot", "links"]) || parsed.value.schemaVersion !== "factory-graph-node-v1" || parsed.value.kind !== kind || parsed.value.nodeRoot !== node.root || !Array.isArray(parsed.value.links) || !parsed.value.links.every(isRoot) || labRoot("factory-graph-links-v1", parsed.value.links) !== labRoot("factory-graph-links-v1", node.links)) return fail("GRAPH_ARTIFACT")
  }
}
export const createFactoryGraphNodeArtifact = (repository: FactoryRepository, value: { readonly kind: "lineage" | "dependency"; readonly nodeRoot: LabRoot; readonly links: readonly LabRoot[] }): LabRoot => {
  if (!isRoot(value.nodeRoot) || !Array.isArray(value.links) || value.links.length > 64 || !value.links.every(isRoot)) return fail("GRAPH_ARTIFACT")
  const encoded = admitCanonicalJsonValue({ schemaVersion: "factory-graph-node-v1", ...value }, { profile: "canonical-manifest" })
  if (!encoded.ok || encoded.canonicalByteLength > 262144) return fail("GRAPH_ARTIFACT")
  return publishFactoryArtifact(repository, encoded.canonicalBytes)
}

/** Structural identity ignores trivia and local binding names, but preserves control flow, operators, literals and semantic property/API identifiers. */
export const deriveFactorySourceStructureRoot = (sourceBytes: Uint8Array): LabRoot => {
  if (!(sourceBytes instanceof Uint8Array) || sourceBytes.byteLength < 1 || sourceBytes.byteLength > 65536) return fail("SOURCE")
  let source: string
  try { source = new TextDecoder("utf-8", { fatal: true }).decode(sourceBytes) } catch { return fail("SOURCE_ENCODING") }
  const path = "factory-candidate.ts"
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const options: ts.CompilerOptions = { noLib: true, noResolve: true, allowJs: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  const host = ts.createCompilerHost(options)
  host.getSourceFile = (name) => name === path ? ast : undefined
  host.fileExists = (name) => name === path
  host.readFile = (name) => name === path ? source : undefined
  const program = ts.createProgram([path], options, host)
  if (program.getSyntacticDiagnostics(ast).length) return fail("SOURCE_SYNTAX")
  const checker = program.getTypeChecker()
  const bindings = new Map<ts.Symbol, string>()
  const token = (node: ts.Node): unknown => {
    if (ts.isIdentifier(node)) {
      const symbol = checker.getSymbolAtLocation(node)
      const parent = node.parent
      const semantic = (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isShorthandPropertyAssignment(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && parent.name === node && parent.propertyName === undefined && ts.isObjectBindingPattern(parent.parent)) ||
        ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node)
      if (semantic || !symbol) return [node.kind, node.text]
      if (!bindings.has(symbol)) bindings.set(symbol, `binding:${bindings.size}`)
      return [node.kind, bindings.get(symbol)]
    }
    if (ts.isStringLiteralLike(node)) return [node.kind, node.text]
    if (ts.isNumericLiteral(node)) return [node.kind, Number(node.text)]
    if (ts.isBinaryExpression(node)) return [node.kind, node.operatorToken.kind, token(node.left), token(node.right)]
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) return [node.kind, node.operator, token(node.operand)]
    const children: unknown[] = []
    ts.forEachChild(node, (child) => { children.push(token(child)) })
    return [node.kind, children]
  }
  return labRoot("factory-source-structure-v1", token(ast))
}

const graphIssue = (nodes: readonly Readonly<{ root: LabRoot; links: readonly LabRoot[] }>[]): string | null => {
  const byRoot = new Map(nodes.map((node) => [node.root, node.links] as const))
  const visiting = new Set<LabRoot>(), visited = new Set<LabRoot>()
  const visit = (id: LabRoot): boolean => {
    if (visiting.has(id)) return false
    if (visited.has(id)) return true
    const links = byRoot.get(id)
    if (!links) return false
    visiting.add(id)
    for (const link of links) if (!byRoot.has(link) || !visit(link)) return false
    visiting.delete(id); visited.add(id); return true
  }
  return nodes.every((node) => visit(node.root)) ? null : "incomplete_or_cyclic_graph"
}
const forbiddenKeys = /^(?:strategyMemory|soldierMemory|objective|objectivePayload|privatePayload|source|diagnostics|host|evaluator)$/iu
const safeProjection = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(safeProjection)
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !forbiddenKeys.test(key)).map(([key, entry]) => [key, safeProjection(entry)]))
  }
  return value
}

interface VerifiedGraphProjection { readonly nodes: readonly Readonly<{ root: LabRoot; links: readonly LabRoot[] }>[]; readonly manifestRoot: LabRoot }
const lineageLinks = (lineage: { predecessorRoot: LabRoot; correctionRoot: LabRoot | null; retryParentRoot: LabRoot | null }) => [lineage.predecessorRoot, lineage.correctionRoot, lineage.retryParentRoot].filter(isRoot)
const verifyLineageManifest = (repository: FactoryRepository, artifactRoot: LabRoot, proposalArtifactRoot: LabRoot, proposal: ReturnType<typeof FactoryProposalSchema.parse>): VerifiedGraphProjection => {
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "root", "proposalArtifactRoot", "nodeArtifactRoots"])) return fail("LINEAGE_MANIFEST")
  const manifest = parsed.value as Record<string, unknown>
  if (manifest.schemaVersion !== "factory-lineage-manifest-v1" || !isRoot(manifest.root) || manifest.proposalArtifactRoot !== proposalArtifactRoot || !Array.isArray(manifest.nodeArtifactRoots) || manifest.nodeArtifactRoots.length < 1 || manifest.nodeArtifactRoots.length > 1024 || !manifest.nodeArtifactRoots.every(isRoot)) return fail("LINEAGE_MANIFEST")
  const { root, ...value } = manifest
  if (root !== labRoot("factory-lineage-manifest-v1", value)) return fail("LINEAGE_MANIFEST_ROOT")
  const nodes = (manifest.nodeArtifactRoots as LabRoot[]).map((nodeArtifactRoot) => {
    const record = admitCanonicalJsonBytes(readFactoryArtifact(repository, nodeArtifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!record.ok || !record.value || typeof record.value !== "object" || Array.isArray(record.value)) return fail("LINEAGE_NODE")
    const candidate = record.value as Record<string, unknown>
    if (candidate.schemaVersion === "factory-proposal-v1") {
      const node = FactoryProposalSchema.parse(candidate)
      return { root: node.root, links: lineageLinks(node.lineage) }
    }
    if (candidate.schemaVersion === "factory-candidate-publication-v1" && candidate.candidate && typeof candidate.candidate === "object") {
      const node = FactoryCandidateSchema.parse(candidate.candidate)
      const { root: descriptorRoot, ...descriptorValue } = candidate
      if (candidate.privacy !== "private_offline" || candidate.supervisionReceiptRoot !== node.supervisionReceiptRoot || candidate.independenceStatus !== "unresolved" || descriptorRoot !== labRoot("factory-candidate-publication-v1", descriptorValue)) return fail("LINEAGE_CANDIDATE_DESCRIPTOR")
      return { root: node.root, links: lineageLinks(node.lineage) }
    }
    if (exact(candidate, ["schemaVersion", "root", "parents"]) && candidate.schemaVersion === "factory-lineage-anchor-v1" && candidate.root === LAB_ADMITTED_ROOTS.currentStartRoot && Array.isArray(candidate.parents) && candidate.parents.length === 0) return { root: candidate.root, links: [] }
    return fail("LINEAGE_NODE")
  })
  if (!nodes.some((node) => node.root === proposal.root) || graphIssue(nodes)) return fail("LINEAGE_GRAPH")
  return freezeLabValue({ nodes, manifestRoot: root as LabRoot })
}
const verifyDependencyManifest = (repository: FactoryRepository, artifactRoot: LabRoot, proposalArtifactRoot: LabRoot, sourceArtifactRoot: LabRoot, proposal: ReturnType<typeof FactoryProposalSchema.parse>): VerifiedGraphProjection => {
  const parsed = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok || !exact(parsed.value, ["schemaVersion", "root", "proposalArtifactRoot", "sourceArtifactRoot", "nodes"])) return fail("DEPENDENCY_MANIFEST")
  const manifest = parsed.value as Record<string, unknown>
  if (manifest.schemaVersion !== "factory-locked-dependency-manifest-v1" || !isRoot(manifest.root) || manifest.proposalArtifactRoot !== proposalArtifactRoot || manifest.sourceArtifactRoot !== sourceArtifactRoot || !Array.isArray(manifest.nodes) || manifest.nodes.length < 3 || manifest.nodes.length > 1024) return fail("DEPENDENCY_MANIFEST")
  const { root, ...value } = manifest
  if (root !== labRoot("factory-locked-dependency-manifest-v1", value)) return fail("DEPENDENCY_MANIFEST_ROOT")
  const declared = (manifest.nodes as unknown[]).map((entry) => {
    if (!exact(entry, ["specifier", "contentRoot", "artifactRoot", "dependencies"]) || typeof entry.specifier !== "string" || entry.specifier.length < 1 || entry.specifier.length > 256 || !isRoot(entry.contentRoot) || !isRoot(entry.artifactRoot) || !Array.isArray(entry.dependencies) || entry.dependencies.length > 64 || !entry.dependencies.every(isRoot)) return fail("DEPENDENCY_NODE")
    const bytes = readFactoryArtifact(repository, entry.artifactRoot)
    if (byteRoot(bytes) !== entry.contentRoot) return fail("DEPENDENCY_CONTENT")
    return { specifier: entry.specifier, root: entry.contentRoot, artifactRoot: entry.artifactRoot, declaredLinks: entry.dependencies as LabRoot[], bytes }
  })
  if (new Set(declared.map((node) => node.specifier)).size !== declared.length || new Set(declared.map((node) => node.root)).size !== declared.length) return fail("DEPENDENCY_DUPLICATE")
  const bySpecifier = new Map(declared.map((node) => [node.specifier, node.root] as const))
  const importedSpecifiers = (bytes: Uint8Array): readonly string[] => {
    let source: string
    try { source = new TextDecoder("utf-8", { fatal: true }).decode(bytes) } catch { return fail("DEPENDENCY_SOURCE_ENCODING") }
    const ast = ts.createSourceFile("factory-dependency-source.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
    if (((ast as unknown as { readonly parseDiagnostics?: readonly unknown[] }).parseDiagnostics?.length ?? 0) > 0) return fail("DEPENDENCY_SOURCE_SYNTAX")
    const found: string[] = []
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) {
        if (!ts.isStringLiteralLike(node.moduleSpecifier)) return fail("DEPENDENCY_DYNAMIC")
        found.push(node.moduleSpecifier.text)
      } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
        if (node.arguments.length !== 1 || !ts.isStringLiteralLike(node.arguments[0]!)) return fail("DEPENDENCY_DYNAMIC")
        found.push(node.arguments[0].text)
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
    return [...new Set(found)].sort()
  }
  const nodes = declared.map((node) => {
    let dependencySpecifiers: readonly string[]
    if (node.artifactRoot === sourceArtifactRoot) dependencySpecifiers = importedSpecifiers(node.bytes)
    else {
      const parsedNode = admitCanonicalJsonBytes(node.bytes, { profile: "canonical-manifest", operation: "require-canonical" })
      if (!parsedNode.ok || !exact(parsedNode.value, ["schemaVersion", "packageId", "dependencies"]) || parsedNode.value.schemaVersion !== "factory-locked-package-manifest-v1" || parsedNode.value.packageId !== node.specifier || !Array.isArray(parsedNode.value.dependencies) || parsedNode.value.dependencies.length > 64 || !parsedNode.value.dependencies.every((item) => typeof item === "string" && item.length > 0 && item.length <= 256)) return fail("DEPENDENCY_LOCK")
      dependencySpecifiers = [...new Set(parsedNode.value.dependencies as string[])].sort()
    }
    const links = dependencySpecifiers.map((specifier) => bySpecifier.get(specifier) ?? fail("DEPENDENCY_UNRESOLVED"))
    if (labRoot("factory-dependency-edge-set-v1", links) !== labRoot("factory-dependency-edge-set-v1", node.declaredLinks)) return fail("DEPENDENCY_EDGE_MISMATCH")
    return { root: node.root, links }
  })
  const roots = new Set(nodes.map((node) => node.root))
  const sourceNode = nodes.find((node) => node.root === proposal.source.root)
  if (!sourceNode || !roots.has(proposal.build.buildRoot) || !roots.has(proposal.build.toolchainRoot) || graphIssue(nodes)) return fail("DEPENDENCY_GRAPH")
  const reachable = new Set<LabRoot>(), visit = (id: LabRoot) => { if (reachable.has(id)) return; reachable.add(id); for (const link of nodes.find((node) => node.root === id)?.links ?? []) visit(link) }
  visit(sourceNode.root)
  if (!reachable.has(proposal.build.buildRoot) || !reachable.has(proposal.build.toolchainRoot) || reachable.size !== nodes.length) return fail("DEPENDENCY_DISCONNECTED")
  return freezeLabValue({ nodes, manifestRoot: root as LabRoot })
}

export interface FactoryIndependenceReceipt {
  readonly schemaVersion: "factory-independence-receipt-v1"
  readonly privacy: "private_offline"
  readonly root: LabRoot
  readonly packetRoot: LabRoot
  readonly proposalRoot: LabRoot
  readonly validationRoot: LabRoot
  readonly supervisionReceiptRoot: LabRoot
  readonly evidenceRoot: LabRoot
  readonly evidenceArtifactRoot: LabRoot
  readonly fingerprints: FactoryFingerprintRoots
  readonly supportingRoots: Readonly<{ authorshipRoot: LabRoot; counterfactualCorrelationRoot: LabRoot; cloneEvidenceRoot: LabRoot; failureModeRoot: LabRoot }>
  readonly status: "unresolved"
  readonly quarantined: true
  readonly reasons: readonly string[]
}
const issuedReceipts = new WeakSet<object>()
const deriveReceiptRoot = (value: Omit<FactoryIndependenceReceipt, "root">): LabRoot => labRoot("factory-independence-receipt-v1", value)
export const requireIssuedFactoryIndependenceReceipt = (receipt: FactoryIndependenceReceipt): Readonly<FactoryIndependenceReceipt> => {
  if (!issuedReceipts.has(receipt) || receipt.root !== deriveReceiptRoot(withoutRoot(receipt) as Omit<FactoryIndependenceReceipt, "root">)) return fail("UNISSUED_RECEIPT")
  return receipt
}

export const deriveFactoryFingerprints = (input: {
  readonly repository: FactoryRepository
  readonly supervisionReceipt: FactorySupervisionReceipt
  readonly pairedSupervisionReceipts?: readonly FactorySupervisionReceipt[]
  readonly evidence: FactoryFingerprintEvidence
  readonly evidenceArtifactRoot: LabRoot
  readonly lineageManifestArtifactRoot?: LabRoot
  readonly dependencyManifestArtifactRoot?: LabRoot
  readonly claimedFingerprints?: FactoryFingerprintRoots
}): Readonly<FactoryIndependenceReceipt> => {
  if (!isIssuedFactorySupervisionReceipt(input.supervisionReceipt)) return fail("SUPERVISION_RECEIPT")
  const receipt = input.supervisionReceipt, admission = receipt.admission
  const source = readFactoryArtifact(input.repository, admission.artifacts.source)
  if (byteRoot(source) !== admission.sourceRoot) return fail("SOURCE_BINDING")
  const parseArtifact = (id: LabRoot) => {
    const parsed = admitCanonicalJsonBytes(readFactoryArtifact(input.repository, id), { profile: "canonical-manifest", operation: "require-canonical" })
    if (!parsed.ok) return fail("ARTIFACT")
    return parsed.value
  }
  const packet = FactoryOraclePacketSchema.parse(parseArtifact(admission.artifacts.packet))
  const proposal = FactoryProposalSchema.parse(parseArtifact(admission.artifacts.proposal))
  const validation = FactoryValidationEvidenceSchema.parse(parseArtifact(admission.artifacts.validation))
  if (packet.root !== admission.packetRoot || proposal.root !== admission.proposalRoot || validation.root !== admission.validationRoot || proposal.packetRoot !== packet.root || validation.proposalRoot !== proposal.root) return fail("STAGE_BINDING")
  const evidenceBytes = readFactoryArtifact(input.repository, input.evidenceArtifactRoot)
  const parsedEvidence = admitCanonicalJsonBytes(evidenceBytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsedEvidence.ok) return fail("EVIDENCE_BYTES")
  const evidence = validateEvidence(parsedEvidence.value)
  if (!issuedEvidence.has(input.evidence) || input.evidence.root !== evidence.root || labRoot("factory-evidence-instance-v1", input.evidence) !== labRoot("factory-evidence-instance-v1", evidence)) return fail("UNISSUED_EVIDENCE")
  if (evidence.proposalRoot !== proposal.root || evidence.validationRoot !== validation.root || evidence.supervisionReceiptRoot !== receipt.root) return fail("EVIDENCE_BINDING")
  if (evidence.evidenceClass === "real_producer") {
    const manifestArtifactRoot = authorizedProducerEvidence.get(input.evidence)
    if (!manifestArtifactRoot) return fail("REAL_PRODUCER_EVIDENCE_UNVERIFIED")
    verifyAuthorizedProducer(input.repository, manifestArtifactRoot, evidence)
  }
  validateGraphArtifacts(input.repository, evidence.lineageNodes.map((node) => ({ root: node.root, artifactRoot: node.artifactRoot, links: node.parents })), "lineage")
  validateGraphArtifacts(input.repository, evidence.dependencyNodes.map((node) => ({ root: node.root, artifactRoot: node.artifactRoot, links: node.dependencies })), "dependency")
  const pairedCommitments = (input.pairedSupervisionReceipts ?? [receipt]).map((entry) => {
    if (!isIssuedFactorySupervisionReceipt(entry)) return fail("PAIRED_RECEIPT")
    return { supervisionReceiptRoot: entry.root, matchup: entry.matchup, execution: deriveFactoryExecutionCommitment(entry.execution) }
  })
  if (new Set(pairedCommitments.map((entry) => entry.supervisionReceiptRoot)).size !== pairedCommitments.length) return fail("PAIRED_RECEIPT_DUPLICATE")

  const verifiedLineage = input.lineageManifestArtifactRoot === undefined ? undefined : verifyLineageManifest(input.repository, input.lineageManifestArtifactRoot, admission.artifacts.proposal, proposal)
  const verifiedDependency = input.dependencyManifestArtifactRoot === undefined ? undefined : verifyDependencyManifest(input.repository, input.dependencyManifestArtifactRoot, admission.artifacts.proposal, admission.artifacts.source, proposal)
  const lineageNodes = verifiedLineage?.nodes ?? evidence.lineageNodes.map((node) => ({ root: node.root, links: node.parents }))
  const dependencyNodes = verifiedDependency?.nodes ?? evidence.dependencyNodes.map((node) => ({ root: node.root, links: node.dependencies }))
  const fingerprints: FactoryFingerprintRoots = freezeLabValue({
    sourceStructureRoot: deriveFactorySourceStructureRoot(source),
    lineageRoot: verifiedLineage ? labRoot("factory-lineage-fingerprint-v1", { packetLineage: proposal.lineage, nodes: verifiedLineage.nodes, manifestRoot: verifiedLineage.manifestRoot }) : labRoot("factory-lineage-fingerprint-v1", { packetLineage: proposal.lineage, predecessorArtifacts: "unverified" }),
    dependencyRoot: verifiedDependency ? labRoot("factory-dependency-fingerprint-v1", { sourceRoot: admission.sourceRoot, build: proposal.build, nodes: verifiedDependency.nodes, manifestRoot: verifiedDependency.manifestRoot }) : labRoot("factory-dependency-fingerprint-v1", { sourceRoot: admission.sourceRoot, build: proposal.build, recursiveLockedManifest: "unverified" }),
    legalInputDecisionRoot: deriveFactoryOrderedRecordDescriptor("factory-legal-input-decision-fingerprint", receipt.traces.map((trace) => ({ invocationRoot: trace.invocationRoot, inputRoot: trace.inputRoot, method: trace.method, ordinal: trace.ordinal, request: safeProjection(trace.requestProjection), decision: safeProjection(trace.decisionProjection), classification: trace.classification }))).root,
    chronicleBehaviorRoot: receipt.execution.kind === "completed"
      ? deriveFactoryOrderedRecordDescriptor("factory-chronicle-behavior-fingerprint", receipt.execution.transitions.map((transition) => safeProjection({ transitionKind: transition.transitionKind, coordinates: transition.coordinates, classification: transition.classification, events: transition.events, beforeState: transition.beforeState, afterState: transition.afterState, terminalStatus: transition.terminalStatus }))).root
      : labRoot("factory-chronicle-behavior-fingerprint-failure-v1", receipt.execution.failure),
    matchupResponseRoot: deriveFactoryOrderedRecordDescriptor("factory-matchup-response-fingerprint", pairedCommitments).root,
  })
  const reasons = new Set<string>(["calibration_thresholds_not_frozen"])
  if (!verifiedLineage) reasons.add("lineage_parent_artifacts_unverified")
  if (!verifiedDependency) reasons.add("recursive_dependency_manifest_unverified")
  if (pairedCommitments.some((entry) => entry.matchup.status === "unavailable")) reasons.add("matchup_metadata_unavailable")
  if (pairedCommitments.length < 2) reasons.add("paired_counterfactual_unavailable")
  if (!receipt.traces.length) reasons.add("missing_legal_trace")
  if (graphIssue(lineageNodes)) reasons.add("lineage_graph_unresolved")
  if (graphIssue(dependencyNodes)) reasons.add("dependency_graph_unresolved")
  if (evidence.counterfactualPairs.some((pair) => pair.relation === "borderline")) reasons.add("counterfactual_materiality_borderline")
  if (evidence.evidenceClass === "mechanics_only") reasons.add("mechanics_only_evidence")
  if (!evidence.failureModes.includes("accepted")) reasons.add("accepted_failure_mode_absent")
  if (input.claimedFingerprints && Object.entries(fingerprints).some(([key, value]) => input.claimedFingerprints?.[key as keyof FactoryFingerprintRoots] !== value)) reasons.add("claimed_fingerprint_mismatch")
  const supportingRoots = freezeLabValue({
    authorshipRoot: labRoot("factory-authorship-evidence-v1", { producerIdentity: evidence.producerIdentity, origin: evidence.origin, authorshipRoots: evidence.authorshipRoots }),
    counterfactualCorrelationRoot: deriveFactoryOrderedRecordDescriptor("factory-counterfactual-correlation", evidence.counterfactualPairs).root,
    cloneEvidenceRoot: labRoot("factory-clone-evidence-v1", { fingerprints, evidenceClass: evidence.evidenceClass }),
    failureModeRoot: labRoot("factory-failure-mode-evidence-v1", evidence.failureModes),
  })
  const value: Omit<FactoryIndependenceReceipt, "root"> = {
    schemaVersion: "factory-independence-receipt-v1", privacy: "private_offline", packetRoot: packet.root, proposalRoot: proposal.root,
    validationRoot: validation.root, supervisionReceiptRoot: receipt.root, evidenceRoot: evidence.root, evidenceArtifactRoot: input.evidenceArtifactRoot,
    fingerprints, supportingRoots, status: "unresolved", quarantined: true, reasons: [...reasons].sort(),
  }
  const result = freezeLabValue({ ...value, root: deriveReceiptRoot(value) })
  issuedReceipts.add(result)
  return result
}
