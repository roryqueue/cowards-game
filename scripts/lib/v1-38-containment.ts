import { createHash } from "node:crypto"

import {
  admitCanonicalJsonValue,
  assertPublicOutputLeakSafe,
  type JsonValue,
} from "@cowards/spec"
import ts from "typescript"

type UnknownRecord = Record<string, unknown>
type Hash = `sha256:${string}`

const SHA256 = /^sha256:[0-9a-f]{64}$/u
const INPUT_KEYS = [
  "schemaVersion", "phase266FreezePresent", "phase267MaterializationGateOpen",
  "allowlistedProtocolPaths", "sources", "artifacts",
] as const
const FORBIDDEN_NAMESPACE = /(?:^|\/)(?:formations?|profiles?|candidates?|prompts?|caches?|traces?|replays?|results?)(?:\/|$)/iu
const PRODUCT_PATH = /^(?:apps\/(?:web|go-backend|runtime-service)|packages\/(?:persistence|replay))(?:\/|$)/u
const PRODUCT_MODULE = /(?:@cowards\/(?:persistence|replay)|apps\/(?:web|go-backend|runtime-service)|packages\/(?:persistence|replay))/u

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (value: UnknownRecord, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index])
}

const isHash = (value: unknown): value is Hash =>
  typeof value === "string" && SHA256.test(value)

const sha256 = (value: string | Uint8Array): Hash =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const canonicalBytes = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new TypeError("V138_CONTAINMENT_CANONICAL_INVALID")
  return admitted.canonicalBytes
}

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as UnknownRecord)) deepFreeze(child)
    Object.freeze(value)
  }
  return value
}

export type V138ContainmentFindingCode =
  | "INPUT_INVENTORY_INVALID"
  | "FORBIDDEN_ENGINE_STATE"
  | "EXECUTABLE_MATERIALIZATION"
  | "ALTERNATE_RULES_OR_SCHEDULER"
  | "DYNAMIC_CODE"
  | "STRATEGY_EXECUTION"
  | "FORBIDDEN_NAMESPACE"
  | "PRODUCT_OR_PUBLIC_REACHABILITY"
  | "MUTABLE_ALIAS"
  | "FORBIDDEN_SCHEMA_KEY"
  | "PRIVATE_RECEIPT_FIELD"
  | "PROTOCOL_DENIAL_DRIFT"

export interface V138ContainmentFinding {
  readonly code: V138ContainmentFindingCode
  readonly path: string
  readonly line: number
  readonly detail: string
}

interface ContainmentInput {
  readonly phase266FreezePresent: false
  readonly phase267MaterializationGateOpen: false
  readonly allowlistedProtocolPaths: readonly string[]
  readonly sources: Readonly<Record<string, string>>
  readonly artifacts: Readonly<Record<string, unknown>>
}

const parseInput = (input: unknown): ContainmentInput => {
  if (!isRecord(input) || !exactKeys(input, INPUT_KEYS) ||
    input.schemaVersion !== "v1.38-pre-formation-containment-input-v1" ||
    input.phase266FreezePresent !== false || input.phase267MaterializationGateOpen !== false ||
    !Array.isArray(input.allowlistedProtocolPaths) || !isRecord(input.sources) || !isRecord(input.artifacts) ||
    input.allowlistedProtocolPaths.some((entry) => typeof entry !== "string" || entry.length === 0) ||
    new Set(input.allowlistedProtocolPaths).size !== input.allowlistedProtocolPaths.length ||
    Object.entries(input.sources).some(([repoPath, source]) => repoPath.length === 0 || typeof source !== "string")) {
    throw new TypeError("V138_CONTAINMENT_INPUT_INVALID")
  }
  return input as unknown as ContainmentInput
}

const lineOf = (sourceFile: ts.SourceFile, node: ts.Node): number =>
  sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1

const expressionName = (expression: ts.Expression): string | undefined => {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  if (ts.isElementAccessExpression(expression) && expression.argumentExpression !== undefined &&
    (ts.isStringLiteral(expression.argumentExpression) || ts.isNoSubstitutionTemplateLiteral(expression.argumentExpression))) {
    return expression.argumentExpression.text
  }
  return undefined
}

const normalizedKey = (value: string): string =>
  value.replaceAll(/[^a-z0-9]/giu, "").toLowerCase()

const PRIVATE_KEYS = new Set([
  "strategymemory", "soldiermemory", "objectivepayload", "rawdiagnostics", "hostpath",
  "privatekey", "secret", "credential", "holdoutpreimage", "evaluatorstate",
])
const FORBIDDEN_ARTIFACT_KEYS = new Set([
  "gamestate", "initialstate", "formationstate", "profilemanifest", "candidatestrategy",
  "candidateartifact", "promptbundle", "cacheentry", "trace", "replay", "result",
  "evidencecell", "runnableprofile", "executableprofile",
])

export const analyzeV138PreFormationContainment = (rawInput: unknown) => {
  const input = parseInput(rawInput)
  const findings: V138ContainmentFinding[] = []
  const add = (code: V138ContainmentFindingCode, repoPath: string, line: number, detail: string): void => {
    if (!findings.some((finding) => finding.code === code && finding.path === repoPath && finding.line === line && finding.detail === detail)) {
      findings.push({ code, path: repoPath, line, detail })
    }
  }

  const allPaths = [...Object.keys(input.sources), ...Object.keys(input.artifacts)].sort()
  for (const repoPath of allPaths) {
    if (FORBIDDEN_NAMESPACE.test(repoPath)) add("FORBIDDEN_NAMESPACE", repoPath, 1, "Pre-freeze namespace is forbidden.")
  }
  for (const allowlisted of input.allowlistedProtocolPaths) {
    if (!allPaths.includes(allowlisted)) add("INPUT_INVENTORY_INVALID", allowlisted, 1, "Allowlisted path is absent from the declared inventory.")
  }

  for (const [repoPath, source] of Object.entries(input.sources).sort(([left], [right]) => left.localeCompare(right))) {
    const sourceFile = ts.createSourceFile(repoPath, source, ts.ScriptTarget.Latest, true)
    const engineStateAliases = new Set<string>()
    const dynamicAliases = new Set(["Function", "eval"])
    const strategyAliases = new Set(["executeStrategy", "invokeStrategy", "runStrategy"])
    const aliasDeclarations: Array<{ name: string; initializer: ts.Expression }> = []

    const addAt = (code: V138ContainmentFindingCode, node: ts.Node, detail: string): void =>
      add(code, repoPath, lineOf(sourceFile, node), detail)

    const visit = (node: ts.Node): void => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleName = node.moduleSpecifier.text
        if (moduleName === "node:vm" || moduleName === "vm") addAt("DYNAMIC_CODE", node, "Node vm is forbidden.")
        if (PRODUCT_MODULE.test(moduleName) || (PRODUCT_PATH.test(repoPath) && /v1-38-(?:classifiers|containment)/u.test(moduleName))) {
          addAt("PRODUCT_OR_PUBLIC_REACHABILITY", node, "Protocol or lab policy cannot reach product, public, persistence, replay, or runtime modules.")
        }
        if (/(?:@cowards\/engine|packages\/engine|\/engine(?:\/|$))/u.test(moduleName)) {
          const clause = node.importClause
          if (clause?.name !== undefined) engineStateAliases.add(clause.name.text)
          if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) {
            for (const specifier of clause.namedBindings.elements) {
              const imported = specifier.propertyName?.text ?? specifier.name.text
              if (/(?:GameState|InitialState|MATCH_KERNEL|create.*State|build.*State|runMatch|stepMatch)/iu.test(imported)) {
                engineStateAliases.add(specifier.name.text)
                addAt("FORBIDDEN_ENGINE_STATE", specifier, `Forbidden engine state or transition import: ${imported}.`)
              }
            }
          }
        }
      }
      if (ts.isIdentifier(node) && /^(?:GameState|InitialGameState)$/u.test(node.text)) {
        addAt("FORBIDDEN_ENGINE_STATE", node, `Forbidden state symbol: ${node.text}.`)
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer !== undefined) {
        aliasDeclarations.push({ name: node.name.text, initializer: node.initializer })
        if (/(?:materializ|initialState|gameState|formationState|profileManifest|runnableProfile|executableProfile)/iu.test(node.name.text)) {
          addAt("EXECUTABLE_MATERIALIZATION", node, `Executable materialization binding: ${node.name.text}.`)
        }
        if (/^latest(?:Profile|Formation|Candidate|Result|Replay)?$/iu.test(node.name.text)) {
          addAt("MUTABLE_ALIAS", node, `Mutable alias is forbidden: ${node.name.text}.`)
        }
      }
      const declaredName = ts.isFunctionDeclaration(node)
        ? node.name?.text
        : ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)
          ? node.name.text
          : undefined
      if (declaredName !== undefined) {
        const name = declaredName
        if (/(?:resolveRound|resolveAction|transitionLoop|alternateScheduler|profileScheduler)/iu.test(name)) {
          addAt("ALTERNATE_RULES_OR_SCHEDULER", node, `Alternate rule or scheduler symbol: ${name}.`)
        }
        if (/(?:materializ|createInitial|buildInitial|constructGameState|createProfile|buildProfile)/iu.test(name)) {
          addAt("EXECUTABLE_MATERIALIZATION", node, `Executable materialization function: ${name}.`)
        }
      }
      if (ts.isNewExpression(node) && expressionName(node.expression) === "Function") addAt("DYNAMIC_CODE", node, "Dynamic Function construction is forbidden.")
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)

    for (let changed = true; changed;) {
      changed = false
      for (const declaration of aliasDeclarations) {
        const referenced = expressionName(declaration.initializer)
        if (referenced === undefined) continue
        for (const aliases of [engineStateAliases, dynamicAliases, strategyAliases]) {
          if (aliases.has(referenced) && !aliases.has(declaration.name)) {
            aliases.add(declaration.name)
            changed = true
          }
        }
      }
    }
    const inspectCalls = (node: ts.Node): void => {
      if (ts.isCallExpression(node)) {
        const name = expressionName(node.expression)
        if (name !== undefined && engineStateAliases.has(name)) addAt("FORBIDDEN_ENGINE_STATE", node, `Forbidden aliased engine state call: ${name}.`)
        if (name !== undefined && dynamicAliases.has(name)) addAt("DYNAMIC_CODE", node, `Dynamic code call is forbidden: ${name}.`)
        if (name !== undefined && strategyAliases.has(name)) addAt("STRATEGY_EXECUTION", node, `Strategy execution is forbidden: ${name}.`)
      }
      ts.forEachChild(node, inspectCalls)
    }
    inspectCalls(sourceFile)
  }

  const scanArtifact = (repoPath: string, value: unknown, keyPath: readonly string[]): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => scanArtifact(repoPath, entry, [...keyPath, String(index)]))
      return
    }
    if (!isRecord(value)) return
    for (const [key, nested] of Object.entries(value)) {
      const normalized = normalizedKey(key)
      if (PRIVATE_KEYS.has(normalized)) add("PRIVATE_RECEIPT_FIELD", repoPath, 1, `Private receipt key at ${[...keyPath, key].join(".")}.`)
      if (FORBIDDEN_ARTIFACT_KEYS.has(normalized)) add("FORBIDDEN_SCHEMA_KEY", repoPath, 1, `Executable artifact key at ${[...keyPath, key].join(".")}.`)
      scanArtifact(repoPath, nested, [...keyPath, key])
    }
  }
  for (const [repoPath, artifact] of Object.entries(input.artifacts).sort(([left], [right]) => left.localeCompare(right))) {
    scanArtifact(repoPath, artifact, [])
    if (repoPath.endsWith("v1.38-pre-formation-protocol-policy.json")) {
      const record = isRecord(artifact) ? artifact : {}
      const authority = isRecord(record.authority) ? record.authority : {}
      if (record.protocolOnly !== true || record.materialization !== "forbidden_before_phase_267" ||
        authority.candidateSearchAuthorized !== false || authority.formationMaterializationAuthorized !== false ||
        authority.productionAuthorized !== false || authority.publicExposureAuthorized !== false) {
        add("PROTOCOL_DENIAL_DRIFT", repoPath, 1, "Protocol-only marker or mandatory authority denial drifted.")
      }
    }
  }

  findings.sort((left, right) => left.path.localeCompare(right.path) || left.line - right.line || left.code.localeCompare(right.code))
  const inventory = allPaths.map((repoPath) => ({
    path: repoPath,
    sha256: sha256(input.sources[repoPath] ?? canonicalBytes(input.artifacts[repoPath]!)),
  }))
  return deepFreeze({
    schemaVersion: "v1.38-pre-formation-containment-analysis-v1" as const,
    status: findings.length === 0 ? "passed_absence" as const : "findings" as const,
    findings,
    sourceCount: Object.keys(input.sources).length,
    artifactCount: Object.keys(input.artifacts).length,
    scannedInventoryRoot: sha256(canonicalBytes(inventory)),
    allowlistRoot: sha256(canonicalBytes([...input.allowlistedProtocolPaths].sort())),
    phase266FreezePresent: false as const,
    phase267MaterializationGateOpen: false as const,
  })
}

const REQUIRED_SEEDS = Object.freeze([
  ["direct_engine_state", "FORBIDDEN_ENGINE_STATE"],
  ["aliased_engine_constructor", "FORBIDDEN_ENGINE_STATE"],
  ["allowed_filename_state", "EXECUTABLE_MATERIALIZATION"],
  ["alternate_scheduler", "ALTERNATE_RULES_OR_SCHEDULER"],
  ["dynamic_code", "DYNAMIC_CODE"],
  ["node_vm", "DYNAMIC_CODE"],
  ["strategy_execution", "STRATEGY_EXECUTION"],
  ["forbidden_namespace", "FORBIDDEN_NAMESPACE"],
  ["product_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
  ["persistence_import", "PRODUCT_OR_PUBLIC_REACHABILITY"],
  ["mutable_alias", "MUTABLE_ALIAS"],
  ["schema_key", "FORBIDDEN_SCHEMA_KEY"],
  ["private_field", "PRIVATE_RECEIPT_FIELD"],
] as const)

export const buildV138PreFormationContainmentPolicy = (input: {
  readonly protocolPolicyRoot: Hash
  readonly monitorImplementationRoot: Hash
  readonly scannedInventoryRoot: Hash
  readonly allowlistRoot: Hash
  readonly realTreeAnalysis: ReturnType<typeof analyzeV138PreFormationContainment>
  readonly seededBypassResults: readonly Readonly<{ seedId: string; detectedCode: string }>[]
}) => {
  const fail = (): never => { throw new TypeError("V138_CONTAINMENT_POLICY_INPUT_INVALID") }
  if (!isHash(input.protocolPolicyRoot) || !isHash(input.monitorImplementationRoot) ||
    !isHash(input.scannedInventoryRoot) || !isHash(input.allowlistRoot) ||
    input.realTreeAnalysis.status !== "passed_absence" || input.realTreeAnalysis.findings.length !== 0 ||
    input.realTreeAnalysis.scannedInventoryRoot !== input.scannedInventoryRoot ||
    input.realTreeAnalysis.allowlistRoot !== input.allowlistRoot ||
    input.seededBypassResults.length !== REQUIRED_SEEDS.length) fail()
  for (const [seedId, detectedCode] of REQUIRED_SEEDS) {
    const matches = input.seededBypassResults.filter((entry) => entry.seedId === seedId && entry.detectedCode === detectedCode)
    if (matches.length !== 1) fail()
  }
  const policy = deepFreeze({
    schemaVersion: "v1.38-pre-formation-containment-policy-v1" as const,
    status: "passed_absence" as const,
    scope: "bound_declared_tree_only" as const,
    protocolPolicyRoot: input.protocolPolicyRoot,
    monitorImplementationRoot: input.monitorImplementationRoot,
    scannedInventoryRoot: input.scannedInventoryRoot,
    allowlistRoot: input.allowlistRoot,
    findingCount: 0 as const,
    seededBypassResults: [...input.seededBypassResults]
      .sort((left, right) => left.seedId.localeCompare(right.seedId))
      .map((entry) => ({ seedId: entry.seedId, detected: true as const })),
    phaseGates: {
      currentLeagueFreezeRequired: "valid_phase_266_root",
      firstMaterializationPhase: 267,
      currentFreezePresent: false,
      materializationGateOpen: false,
    },
    denials: {
      formation: "denied_until_valid_phase_266_freeze_then_phase_267",
      candidate: "denied", production: "denied", public: "denied", persistence: "denied",
      scheduling: "denied", replayAndResult: "denied",
    },
    authority: {
      satisfiesAdmit03: false, satisfiesSeal01: false, candidateSearchAuthorized: false,
      phase263Authorized: false, formationMaterializationAuthorized: false,
      holdoutOpenAuthorized: false, liveWorkAuthorized: false, productionAuthorized: false,
      publicExposureAuthorized: false,
    },
  })
  assertPublicOutputLeakSafe(policy, "v1.38 pre-formation containment policy")
  return policy
}

export const renderV138PreFormationContainmentPolicy = (
  policy: ReturnType<typeof buildV138PreFormationContainmentPolicy>,
): string => `${Buffer.from(canonicalBytes(policy as unknown as JsonValue)).toString("utf8")}\n`
