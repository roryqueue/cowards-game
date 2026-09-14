import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue } from "@cowards/spec"
import * as ts from "typescript"
import { exactLabKeys, freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { deriveFactoryOrderedRecordDescriptor, isIssuedFactorySupervisionReceipt, type FactorySupervisionReceipt } from "./admission.js"
import {
  FactoryOraclePacketSchema,
  FactoryProposalSchema,
  FactoryValidationEvidenceSchema,
  type FactoryDisposition,
  type FactoryFingerprintRoots,
} from "./contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "./repository.js"

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
  readonly producerIdentity: "emitTacticalFactoryPacket" | "emitTeacherFactoryPacket" | "emitModelFactoryPacket" | "admitQuarantinedIntakePacket"
  readonly origin: "tactical-oracle" | "teacher-oracle" | "model-oracle" | "human-external-intake"
  readonly evidenceClass: "real_producer" | "mechanics_only"
  readonly authorshipRoots: readonly LabRoot[]
  readonly lineageNodes: readonly Readonly<{ root: LabRoot; parents: readonly LabRoot[] }>[]
  readonly dependencyNodes: readonly Readonly<{ root: LabRoot; dependencies: readonly LabRoot[] }>[]
  readonly matchupResponses: readonly Readonly<{
    conditionRoot: LabRoot; opponentRoot: LabRoot; side: "bottom" | "top"; initialInitiative: boolean
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
}
const dispositions: readonly FactoryDisposition[] = ["accepted", "rejected", "invalid", "duplicate", "legal_but_weak", "retried", "unresolved", "player_violation", "system_failure"]
const validateNodes = (value: unknown, edge: "parents" | "dependencies") => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1024) return fail("NODES")
  const list = value as unknown[]
  const nodes = list.map((entry: unknown) => {
    if (!exact(entry, ["root", edge]) || !isRoot(entry.root) || !Array.isArray(entry[edge]) || entry[edge].length > 64 || !entry[edge].every(isRoot)) fail("NODES")
    return entry as unknown as { readonly root: LabRoot; readonly parents: readonly LabRoot[]; readonly dependencies: readonly LabRoot[] }
  })
  if (new Set(nodes.map((entry) => entry.root)).size !== nodes.length) fail("NODE_DUPLICATE")
  return nodes
}
const validateEvidence = (value: unknown): Readonly<FactoryFingerprintEvidence> => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  const keys = ["schemaVersion", "privacy", "root", "proposalRoot", "validationRoot", "supervisionReceiptRoot", "producerIdentity", "origin", "evidenceClass", "authorshipRoots", "lineageNodes", "dependencyNodes", "matchupResponses", "counterfactualPairs", "failureModes"] as const
  if (!admitted.ok) return fail("EVIDENCE")
  if (admitted.canonicalByteLength > 262144) return fail("EVIDENCE")
  if (!exact(admitted.value, keys)) return fail("EVIDENCE")
  const record: Record<string, unknown> = admitted.value
  if (record.schemaVersion !== "factory-fingerprint-evidence-v1" || record.privacy !== "private_offline" || ![record.root, record.proposalRoot, record.validationRoot, record.supervisionReceiptRoot].every(isRoot) ||
      !(typeof record.producerIdentity === "string" && Object.hasOwn(producerOrigins, record.producerIdentity)) || record.origin !== producerOrigins[record.producerIdentity as FactoryFingerprintEvidence["producerIdentity"]] ||
      !["real_producer", "mechanics_only"].includes(String(record.evidenceClass)) || !Array.isArray(record.authorshipRoots) || record.authorshipRoots.length < 1 || record.authorshipRoots.length > 64 || !record.authorshipRoots.every(isRoot) ||
      !Array.isArray(record.matchupResponses) || record.matchupResponses.length < 1 || record.matchupResponses.length > 4096 || !Array.isArray(record.counterfactualPairs) || record.counterfactualPairs.length < 1 || record.counterfactualPairs.length > 4096 ||
      !Array.isArray(record.failureModes) || record.failureModes.length < 1 || record.failureModes.length > 64 || !record.failureModes.every((entry: unknown) => dispositions.includes(entry as FactoryDisposition))) fail("EVIDENCE")
  validateNodes(record.lineageNodes, "parents")
  validateNodes(record.dependencyNodes, "dependencies")
  for (const response of record.matchupResponses as unknown[]) {
    if (!exact(response, ["conditionRoot", "opponentRoot", "side", "initialInitiative", "outcome", "responseRoot"]) || ![response.conditionRoot, response.opponentRoot, response.responseRoot].every(isRoot) || !["bottom", "top"].includes(String(response.side)) || typeof response.initialInitiative !== "boolean" || !["bottom", "top", "draw", "failure"].includes(String(response.outcome))) fail("MATCHUP")
  }
  for (const pair of record.counterfactualPairs as unknown[]) {
    if (!exact(pair, ["leftRoot", "rightRoot", "relation"]) || ![pair.leftRoot, pair.rightRoot].every(isRoot) || !["distinct", "correlated", "borderline"].includes(String(pair.relation))) fail("COUNTERFACTUAL")
  }
  const typed = record as unknown as FactoryFingerprintEvidence
  if (typed.root !== labRoot("factory-fingerprint-evidence-v1", withoutRoot(typed))) fail("EVIDENCE_ROOT")
  return freezeLabValue(typed)
}

export const createFactoryFingerprintEvidence = (value: Omit<FactoryFingerprintEvidence, "schemaVersion" | "privacy" | "root">): Readonly<FactoryFingerprintEvidence> => {
  const draft = { schemaVersion: "factory-fingerprint-evidence-v1" as const, privacy: "private_offline" as const, ...value }
  return validateEvidence({ ...draft, root: labRoot("factory-fingerprint-evidence-v1", draft) })
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
        ((ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node && !ts.isShorthandPropertyAssignment(parent))
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
  readonly evidenceArtifactRoot: LabRoot
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
  if (evidence.proposalRoot !== proposal.root || evidence.validationRoot !== validation.root || evidence.supervisionReceiptRoot !== receipt.root) return fail("EVIDENCE_BINDING")

  const lineageNodes = evidence.lineageNodes.map((node) => ({ root: node.root, links: node.parents }))
  const dependencyNodes = evidence.dependencyNodes.map((node) => ({ root: node.root, links: node.dependencies }))
  const fingerprints: FactoryFingerprintRoots = freezeLabValue({
    sourceStructureRoot: deriveFactorySourceStructureRoot(source),
    lineageRoot: deriveFactoryOrderedRecordDescriptor("factory-lineage-fingerprint", evidence.lineageNodes).root,
    dependencyRoot: deriveFactoryOrderedRecordDescriptor("factory-dependency-fingerprint", evidence.dependencyNodes).root,
    legalInputDecisionRoot: deriveFactoryOrderedRecordDescriptor("factory-legal-input-decision-fingerprint", receipt.traces.map((trace) => ({ invocationRoot: trace.invocationRoot, inputRoot: trace.inputRoot, method: trace.method, ordinal: trace.ordinal, request: safeProjection(trace.requestProjection), decision: safeProjection(trace.decisionProjection), classification: trace.classification }))).root,
    chronicleBehaviorRoot: receipt.execution.kind === "completed"
      ? deriveFactoryOrderedRecordDescriptor("factory-chronicle-behavior-fingerprint", receipt.execution.transitions.map((transition) => safeProjection({ transitionKind: transition.transitionKind, coordinates: transition.coordinates, classification: transition.classification, events: transition.events, beforeState: transition.beforeState, afterState: transition.afterState, terminalStatus: transition.terminalStatus }))).root
      : labRoot("factory-chronicle-behavior-fingerprint-failure-v1", receipt.execution.failure),
    matchupResponseRoot: deriveFactoryOrderedRecordDescriptor("factory-matchup-response-fingerprint", evidence.matchupResponses).root,
  })
  const reasons = new Set<string>(["calibration_thresholds_not_frozen"])
  if (!receipt.traces.length) reasons.add("missing_legal_trace")
  if (graphIssue(lineageNodes)) reasons.add("lineage_graph_unresolved")
  if (graphIssue(dependencyNodes)) reasons.add("dependency_graph_unresolved")
  if (evidence.counterfactualPairs.some((pair) => pair.relation === "borderline")) reasons.add("counterfactual_materiality_borderline")
  if (evidence.evidenceClass !== "real_producer") reasons.add("mechanics_only_evidence")
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
