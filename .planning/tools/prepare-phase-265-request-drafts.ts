import { closeSync, constants, existsSync, fsyncSync, lstatSync, linkSync, openSync, readFileSync, readdirSync, realpathSync, unlinkSync, writeSync } from "node:fs"
import { basename, dirname, isAbsolute, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { createHash } from "node:crypto"
import { admitCanonicalJsonBytes, admitCanonicalJsonValue, CANONICAL_ARENA_CATALOG_V1_37 } from "@cowards/spec"
import * as ts from "typescript"
import { labRoot, LAB_ADMITTED_ROOTS, type LabRoot } from "../../packages/strategy-lab/src/contracts.js"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { createFactoryRepository, publishFactoryArtifact, readFactoryArtifact, type FactoryRepository } from "../../packages/strategy-lab/src/factory/repository.js"
import { factoryAssessmentImplementationManifest } from "../../scripts/v1-38-factory-implementation.js"

const fail = (code: string): never => { throw new TypeError(`PHASE265_REQUEST_DRAFT_${code}`) }
const ROOT = /^sha256:[0-9a-f]{64}$/u
const REVIEWED_SOURCE_COMMIT = "4eb48e4d0070551cde3e0f7cb86ba7b46c0ed53a"
const REVIEWED_IMPLEMENTATION_ROOT = "sha256:92b40fc585ac087928a477924fa1bc560d309bda29e5fe762151a5a0152bf564" as LabRoot
const REVIEWED_SOURCE_ROOT = "sha256:945321708ba5e15489fd3de0e2fb90d80425e7b8ba8e89d1ef61569ee99fb3e4" as LabRoot
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const RESPONSE_FACTORY_PATH = resolve(REPOSITORY_ROOT, ".strategy-lab/factory-265-current-rules-20260922")
const MODEL_CONFIG_TEMPLATE = 'model = "gpt-5.6-sol"\napproval_policy = "never"\nsandbox_mode = "read-only"\n'
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === [...keys].sort().join()
const isRoot = (value: unknown): value is LabRoot => typeof value === "string" && ROOT.test(value)
const text = (value: unknown, limit = 1024): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= limit
const rootBytes = (bytes: Uint8Array): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const canonical = (value: unknown): Uint8Array => {
  const admitted = admitCanonicalJsonValue(value, { profile: "canonical-manifest" })
  if (!admitted.ok || admitted.canonicalByteLength > 2_000_000) return fail("CANONICAL")
  return admitted.canonicalBytes
}

const knownAssessment = Object.freeze({
  artifactRoot: "sha256:25913b26fa81fa15177774fbdcf9c0d1ef244ad13910bc664bfde4ea8c2e43f8",
  assessmentRoot: "sha256:0446fef49598ef425c883774adb23159ade4b1e44f630463a72562777a9ecea1",
  thresholdArtifactRoot: "sha256:f6098c9e14ed868e162a9374557e518678996b619f3f8912fb8723113328fa72",
  producerImplementationRoot: "sha256:5baaeb677327a6102fd3dc719543686b14448122a91a4bca320cd0836cf5040b",
  assessmentImplementationRoot: "sha256:6a6094089e6714def26c427f60dfc0fae15e534cc685ad7a76dc883c4911b97c",
} as const)

export interface Phase265RequestDraftOptions {
  readonly baseManifest: unknown
  readonly repository: FactoryRepository
  readonly historicalFactoryRepository: FactoryRepository
  readonly responseFactoryDependencyRoot: LabRoot
  readonly codexExecutable: string
  readonly authFile: string
  readonly clientVersion: string
  readonly providerId: string
  readonly settingsRoot: LabRoot
  readonly path: string
  readonly priorExposure: string
  readonly outputPath: string
}

const validateBaseManifest = (value: unknown, repository: FactoryRepository) => {
  if (!exact(value, ["schemaVersion", "historicalAssessment", "bases"]) || value.schemaVersion !== "phase265-verified-bases-v1") return fail("BASE_MANIFEST")
  const assessment = value.historicalAssessment
  if (!exact(assessment, Object.keys(knownAssessment)) || Object.keys(knownAssessment).some((key) => assessment[key] !== knownAssessment[key as keyof typeof knownAssessment]) || !Array.isArray(value.bases) || value.bases.length !== 3) return fail("BASE_MANIFEST")
  const bases = value.bases as Record<string, unknown>[]
  for (const [index, base] of bases.entries()) {
    if (!exact(base, ["sourceSlot", "publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"]) || base.sourceSlot !== (["S01", "S03", "S05"] as const)[index] || ![base.publicationArtifactRoot, base.candidateAdmissionRoot, base.sourceRoot, base.supervisionArtifactRoot].every(isRoot)) return fail("BASES")
  }
  for (const key of ["publicationArtifactRoot", "candidateAdmissionRoot", "sourceRoot", "supervisionArtifactRoot"] as const) if (new Set(bases.map((base) => base[key])).size !== 3) return fail("DUPLICATE_BASES")
  // Confirm all declared references are present and content-addressed in the supplied private repository.
  // Admission roots may be derived import identities rather than persisted artifacts.
  // Full authentication belongs to the historical base reader; this is a draft tool.
  for (const base of bases) for (const key of ["publicationArtifactRoot", "sourceRoot", "supervisionArtifactRoot"] as const) readFactoryArtifact(repository, base[key] as LabRoot)
  return bases
}

/** Mirror the source inventory's directory exclusions before it opens bytes.
 * A credential-shaped file in a scanned tree must fail before any read. */
export const assertNoCredentialInventoryPaths = (inventoryRoot: string): void => {
  const ignored = new Set(["node_modules", ".git", ".planning", "dist", ".next", ".turbo", "coverage", "vendor", "test-results", ".cache"])
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name) && path !== resolve(inventoryRoot, ".strategy-lab")) walk(path)
      } else if (/^(?:auth|credentials?|secrets?)\.json$/iu.test(entry.name)) return fail("CREDENTIAL_IN_SOURCE_INVENTORY")
    }
  }
  walk(inventoryRoot)
}

const currentRoots = () => {
  assertNoCredentialInventoryPaths(REPOSITORY_ROOT)
  const source = factoryAssessmentImplementationManifest(REPOSITORY_ROOT)
  const sourceRoot = labRoot("league-reviewed-source-bytes-v1", source.entries)
  const lockBytes = readFileSync(resolve(REPOSITORY_ROOT, "pnpm-lock.yaml"))
  const packageBytes = readFileSync(resolve(REPOSITORY_ROOT, "package.json"))
  if (source.entries.find((entry) => entry.path === "pnpm-lock.yaml")?.root !== rootBytes(lockBytes) || source.entries.find((entry) => entry.path === "package.json")?.root !== rootBytes(packageBytes)) return fail("TOOLCHAIN_SOURCE_MISMATCH")
  const pkg = JSON.parse(packageBytes.toString("utf8")) as { packageManager?: unknown }
  if (typeof pkg.packageManager !== "string") return fail("PACKAGE_MANAGER")
  const typescriptVersion = ts.version
  const toolchainPreimage = {
    node: process.version, v8: process.versions.v8, openssl: process.versions.openssl,
    packageManager: pkg.packageManager, typescriptVersion, lockfileRoot: rootBytes(lockBytes), platform: process.platform, architecture: process.arch,
  }
  const toolchainRoot = labRoot("phase265-request-toolchain-v1", toolchainPreimage)
  return { buildRoot: sourceRoot, implementationRoot: source.root, sourceRoot, toolchainRoot, toolchainPreimage, entries: source.entries, typescriptVersion }
}

/** Publish a new reviewed source/build dependency without relabeling the
 * historical content-addressed disclosure. */
export const createPhase265SourceBuildDisclosure = (providerId: string, settingsRoot: LabRoot) => {
  const roots = currentRoots()
  if (roots.implementationRoot !== REVIEWED_IMPLEMENTATION_ROOT || roots.sourceRoot !== REVIEWED_SOURCE_ROOT || !/^[a-z][a-z0-9-]{0,63}$/u.test(providerId) || !isRoot(settingsRoot) || rootBytes(new TextEncoder().encode(MODEL_CONFIG_TEMPLATE)) !== settingsRoot) return fail("DISCLOSURE_BINDING")
  return {
    schemaVersion: "phase265-source-build-disclosure-v3", privacy: "private_offline", sourceCommit: REVIEWED_SOURCE_COMMIT,
    implementationRoot: roots.implementationRoot, sourceRoot: roots.sourceRoot, entries: roots.entries,
    toolchain: { preimage: roots.toolchainPreimage, root: roots.toolchainRoot },
    modelSettings: { settingsRoot, configTemplateUtf8: MODEL_CONFIG_TEMPLATE, requestedProvider: providerId, requestedModel: LEAGUE_APPROVED_PROSPECTIVE_POLICY.model, strictConfig: true, toolUseDisabled: true },
    scope: "Reviewed current source/build inputs and exact local authoring configuration.",
  }
}
export const publishPhase265SourceBuildDisclosure = (repository: FactoryRepository, providerId: string, settingsRoot: LabRoot): LabRoot => {
  const expected = existsSync(RESPONSE_FACTORY_PATH) ? realpathSync(RESPONSE_FACTORY_PATH) : RESPONSE_FACTORY_PATH
  if (realpathSync(repository.directory) !== expected) return fail("RESPONSE_FACTORY_PATH")
  return publishFactoryArtifact(repository, canonical(createPhase265SourceBuildDisclosure(providerId, settingsRoot)))
}

export const parsePhase265DisclosureArguments = (argv: readonly string[]) => {
  const permitted = new Set(["--response-factory", "--provider-id", "--settings-root"])
  if (argv.length !== 7 || argv[0] !== "--publish-disclosure") return fail("DISCLOSURE_ARGUMENTS")
  const values = new Map<string, string>()
  for (let index = 1; index < argv.length; index += 2) {
    const flag = argv[index]!, value = argv[index + 1]!
    if (!permitted.has(flag) || values.has(flag) || !value || value.startsWith("--")) return fail("DISCLOSURE_ARGUMENTS")
    values.set(flag, value)
  }
  if (values.size !== 3) return fail("DISCLOSURE_ARGUMENTS")
  const repositoryPath = values.get("--response-factory")!, providerId = values.get("--provider-id")!, settingsRoot = values.get("--settings-root")!
  if (!isRoot(settingsRoot) || !/^[a-z][a-z0-9-]{0,63}$/u.test(providerId)) return fail("DISCLOSURE_ARGUMENTS")
  return { repositoryPath, providerId, settingsRoot }
}

const validateSourceBuildDisclosure = (repository: FactoryRepository, dependencyRoot: LabRoot, roots: ReturnType<typeof currentRoots>, input: Phase265RequestDraftOptions) => {
  const bytes = readFactoryArtifact(repository, dependencyRoot)
  const parsed = admitCanonicalJsonBytes(bytes, { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("DISCLOSURE_CANONICAL")
  const disclosure = parsed.value as Record<string, unknown>
  if (!exact(disclosure, ["schemaVersion", "privacy", "sourceCommit", "implementationRoot", "sourceRoot", "entries", "toolchain", "modelSettings", "scope"]) || disclosure.schemaVersion !== "phase265-source-build-disclosure-v3" || disclosure.privacy !== "private_offline" || disclosure.sourceCommit !== REVIEWED_SOURCE_COMMIT || disclosure.implementationRoot !== REVIEWED_IMPLEMENTATION_ROOT || disclosure.sourceRoot !== REVIEWED_SOURCE_ROOT || roots.implementationRoot !== REVIEWED_IMPLEMENTATION_ROOT || roots.sourceRoot !== REVIEWED_SOURCE_ROOT) return fail("DISCLOSURE_BINDING")
  if (!Array.isArray(disclosure.entries) || labRoot("phase265-disclosure-entries-v1", disclosure.entries) !== labRoot("phase265-disclosure-entries-v1", roots.entries)) return fail("DISCLOSURE_ENTRIES")
  const toolchain = disclosure.toolchain
  if (!exact(toolchain, ["preimage", "root"]) || !exact(toolchain.preimage, Object.keys(roots.toolchainPreimage)) || labRoot("phase265-request-toolchain-v1", toolchain.preimage) !== roots.toolchainRoot || toolchain.root !== roots.toolchainRoot || labRoot("phase265-request-toolchain-v1", toolchain.preimage) !== labRoot("phase265-request-toolchain-v1", roots.toolchainPreimage)) return fail("DISCLOSURE_TOOLCHAIN")
  const settings = disclosure.modelSettings
  if (!exact(settings, ["settingsRoot", "configTemplateUtf8", "requestedProvider", "requestedModel", "strictConfig", "toolUseDisabled"]) || settings.settingsRoot !== input.settingsRoot || settings.configTemplateUtf8 !== MODEL_CONFIG_TEMPLATE || rootBytes(new TextEncoder().encode(String(settings.configTemplateUtf8))) !== settings.settingsRoot || settings.requestedProvider !== input.providerId || settings.requestedModel !== LEAGUE_APPROVED_PROSPECTIVE_POLICY.model || settings.strictConfig !== true || settings.toolUseDisabled !== true) return fail("DISCLOSURE_MODEL_SETTINGS")
}

const makeRequest = (split: "development" | "validation" | "probe", doctrineFamily: string, withProvider: boolean, roots: ReturnType<typeof currentRoots>, provider?: Record<string, unknown>) => ({
  split, doctrineFamily,
  ...(withProvider ? { provider } : {}),
  build: { buildRoot: roots.buildRoot, toolchainRoot: roots.toolchainRoot },
  lineage: { predecessorRoot: LAB_ADMITTED_ROOTS.currentStartRoot, correctionRoot: null, retryParentRoot: null },
})

const teacherSearch = (ordinal: number, arenaIndex: number, hypothesis: "cautious" | "aggressive") => {
  const arenas = CANONICAL_ARENA_CATALOG_V1_37.arenas.filter((row) => row.status === "active" && row.schedulable)
  if (!arenas.length) return fail("NO_ACTIVE_ARENAS")
  const selectedArena = arenas[arenaIndex % arenas.length]!
  const arena = { id: selectedArena.id, name: selectedArena.name, initialBounds: selectedArena.initialBounds, terrainStones: selectedArena.terrainStones }
  const studentPlayerId = ordinal % 2 === 0 ? "bottom" : "top"
  return {
    canonicalMatch: {
      matchId: `phase265-teacher-${ordinal}-${arena.id}`, seed: `phase265-teacher-seed-${ordinal}-${arena.id}`,
      arenaVariant: arena, bottomPlayerId: "bottom", topPlayerId: "top",
      bottomStrategyRevisionId: `phase265-student-${ordinal}-bottom`, topStrategyRevisionId: `phase265-student-${ordinal}-top`,
      initialInitiativePlayerId: studentPlayerId,
    },
    studentPlayerId, counterfactual: { opponentHypothesis: hypothesis }, maxDepth: 1, maxNodes: 50,
  }
}

const authoringPrompt = (doctrine: string, role: string, exactModelAbi: boolean) => [
  'Return exactly one JSON object with exactly one string property named "source" whose value is complete, self-contained TypeScript strategy source. No Markdown fences, prose, or extra JSON properties.',
  "The source must export a default object with selectActivations(input) and soldierBrain(input), implementing strategy-runtime-abi-v1.19.",
  'selectActivations returns { activationOrders: [{ soldierId: string, objective?: JSON value }], strategyMemory: JSON value }. soldierBrain returns { action: { type: "MOVE" | "TURN", direction: "UP" | "DOWN" | "LEFT" | "RIGHT" } | { type: "TURN_TO_STONE" }, soldierMemory: JSON value }.',
  exactModelAbi
    ? "selectActivations receives phaseNumber, roundNumber, activationCount, board { bounds, soldiers, terrainStones }, mySoldiers, enemySoldiers, strategyMemory, initialInitiativePlayerId, hasInitialInitiative, roundInitiativePlayerId, and hasRoundInitiative. Select at most activationCount distinct own ACTIVE Soldier ids; preserve bounded JSON memory."
    : "selectActivations receives phaseNumber, roundNumber, activationCount, board { bounds, soldiers, terrainStones }, mySoldiers, enemySoldiers, strategyMemory, and initiative flags. Select at most activationCount distinct own ACTIVE Soldier ids; preserve bounded JSON memory.",
  exactModelAbi
    ? "soldierBrain receives self { id, ownerPlayerId, status, position, facing, lastSuccessfulMoveDirection }, awarenessGrid { cells: 25 local cells each with dx, dy, absoluteX, absoluteY, contents, optional facing }, cycleIndex, maxCycles=12, optional objective, soldierMemory, and hasAdvancedThisActivation. Prefer board-legal interactions over inert loops; use only observed data."
    : "soldierBrain receives self { id, ownerPlayerId, status, position, facing, lastSuccessfulMoveDirection }, awarenessGrid with 25 local cells, cycleIndex, maxCycles=12, optional objective, soldierMemory, and hasAdvancedThisActivation. Prefer board-legal interactions over inert loops; use only observed data.",
  "Use only the supplied legal observation, objective, and memory; return schema-valid JSON-compatible values. Do not infer hidden state or use imports, eval, Function, host globals, filesystem, network, clocks, randomness, dynamic code, or live model calls.",
  `Develop a deterministic ${doctrine} doctrine for the ${role} task; favor legal, reproducible choices and the current canonical rules.`,
].join("\n")

const validPacketRequest = (request: unknown, split: string, withProvider: boolean): boolean => {
  if (!exact(request, withProvider ? ["split", "doctrineFamily", "provider", "build", "lineage"] : ["split", "doctrineFamily", "build", "lineage"]) || request.split !== split || typeof request.doctrineFamily !== "string" || !/^[a-z][a-z0-9-]{0,95}$/u.test(request.doctrineFamily)) return false
  if (!exact(request.build, ["buildRoot", "toolchainRoot"]) || !Object.values(request.build).every(isRoot) || !exact(request.lineage, ["predecessorRoot", "correctionRoot", "retryParentRoot"]) || !isRoot(request.lineage.predecessorRoot) || (request.lineage.correctionRoot !== null && !isRoot(request.lineage.correctionRoot)) || request.lineage.retryParentRoot !== null) return false
  if (withProvider) {
    const provider = request.provider
    if (!exact(provider, ["providerId", "modelId", "modelVersion", "settingsRoot", "promptRoot", "contextRoot"]) || !["providerId", "modelId", "modelVersion"].every((key) => text(provider[key], 256)) || !["settingsRoot", "promptRoot", "contextRoot"].every((key) => isRoot(provider[key]))) return false
  }
  return true
}

const validateDraft = (draft: unknown, index: number, dependencyRoot: LabRoot): void => {
  if (!exact(draft, ["id", "producerRequest", "disclosure", "provenance"]) || !exact(draft.producerRequest, ["producerIdentity", "origin", "evidenceClass", "producerInput"]) || !exact(draft.disclosure, ["sourceAndBuildDisclosed", "dependencyArtifactRoots"]) || draft.disclosure.sourceAndBuildDisclosed !== true || !exact(draft.provenance, ["priorExposure", "conflicts", "deterministicDataOnly"]) || !text(draft.provenance.priorExposure, 512) || draft.provenance.conflicts !== "none" || draft.provenance.deterministicDataOnly !== true) return fail("DRAFT_SHAPE")
  if (!Array.isArray(draft.disclosure.dependencyArtifactRoots) || draft.disclosure.dependencyArtifactRoots.length !== 1 || draft.disclosure.dependencyArtifactRoots[0] !== dependencyRoot) return fail("DRAFT_DISCLOSURE")
  const producer = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()[index]!, split = index < 9 ? "development" : index === 9 ? "validation" : "probe", input = draft.producerRequest.producerInput
  const identity = { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer]
  const origin = { tactical: "tactical-oracle", teacher: "teacher-oracle", model: "model-oracle" }[producer]
  if (draft.producerRequest.producerIdentity !== identity || draft.producerRequest.origin !== origin || draft.producerRequest.evidenceClass !== "real_producer") return fail("DRAFT_PRODUCER")
  if (producer === "tactical") {
    if (!validPacketRequest(input, split, true)) return fail("DRAFT_TACTICAL")
  } else if (producer === "teacher") {
    if (!exact(input, ["searches", "request"]) || !validPacketRequest(input.request, split, true) || !Array.isArray(input.searches) || input.searches.length !== 2) return fail("DRAFT_TEACHER")
    let nodeTotal = 0
    for (const search of input.searches) {
      if (!exact(search, ["canonicalMatch", "studentPlayerId", "counterfactual", "maxDepth", "maxNodes"]) || !exact(search.counterfactual, ["opponentHypothesis"]) || !["cautious", "aggressive"].includes(search.counterfactual.opponentHypothesis as string) || !Number.isSafeInteger(search.maxDepth) || Number(search.maxDepth) < 1 || !Number.isSafeInteger(search.maxNodes) || Number(search.maxNodes) < 1 || !exact(search.canonicalMatch, ["matchId", "seed", "arenaVariant", "bottomPlayerId", "topPlayerId", "bottomStrategyRevisionId", "topStrategyRevisionId", "initialInitiativePlayerId"])) return fail("DRAFT_TEACHER_SEARCH")
      const match = search.canonicalMatch
      if (![match.matchId, match.seed, match.bottomPlayerId, match.topPlayerId, match.bottomStrategyRevisionId, match.topStrategyRevisionId, match.initialInitiativePlayerId, search.studentPlayerId].every((value) => text(value, 256)) || match.bottomPlayerId === match.topPlayerId || ![match.bottomPlayerId, match.topPlayerId].includes(match.initialInitiativePlayerId as string) || ![match.bottomPlayerId, match.topPlayerId].includes(search.studentPlayerId as string) || !CANONICAL_ARENA_CATALOG_V1_37.arenas.some((arena) => arena.status === "active" && arena.schedulable && labRoot("phase265-teacher-arena-v1", { id: arena.id, name: arena.name, initialBounds: arena.initialBounds, terrainStones: arena.terrainStones }) === labRoot("phase265-teacher-arena-v1", match.arenaVariant))) return fail("DRAFT_TEACHER_MATCH")
      nodeTotal += Number(search.maxNodes)
    }
    if (nodeTotal > 100) return fail("DRAFT_TEACHER_BUDGET")
  } else {
    if (!exact(input, ["authoring", "request"]) || !validPacketRequest(input.request, split, false) || !exact(input.authoring, ["sourceMessage", "codexExecutable", "clientVersion", "stateDirectory", "disclosedDirectory", "existingAuthFile", "requestedModel", "requestedProvider", "path", "settingsRoot", "promptRoot", "contextRoot"])) return fail("DRAFT_MODEL")
    const authoring = input.authoring
    if (!["sourceMessage", "codexExecutable", "clientVersion", "stateDirectory", "disclosedDirectory", "existingAuthFile", "requestedProvider", "path"].every((key) => text(authoring[key], 4096)) || authoring.requestedModel !== LEAGUE_APPROVED_PROSPECTIVE_POLICY.model || !isRoot(authoring.settingsRoot) || !isRoot(authoring.promptRoot) || !isRoot(authoring.contextRoot) || rootBytes(new TextEncoder().encode(authoring.sourceMessage as string)) !== authoring.promptRoot || authoring.contextRoot !== labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [dependencyRoot] }) || !isAbsolute(authoring.codexExecutable as string) || !isAbsolute(authoring.existingAuthFile as string) || authoring.stateDirectory === authoring.disclosedDirectory) return fail("DRAFT_MODEL_BINDING")
  }
}

const validateOptions = (input: Phase265RequestDraftOptions) => {
  if (!input || typeof input !== "object" || !input.repository || !input.historicalFactoryRepository || !exact(Object.fromEntries(Object.entries(input).filter(([key]) => key !== "repository" && key !== "historicalFactoryRepository")), ["baseManifest", "responseFactoryDependencyRoot", "codexExecutable", "authFile", "clientVersion", "providerId", "settingsRoot", "path", "priorExposure", "outputPath"])) return fail("INPUT_FIELDS")
  if (input.repository.directory === input.historicalFactoryRepository.directory) return fail("REPOSITORY_SEPARATION")
  validateBaseManifest(input.baseManifest, input.historicalFactoryRepository)
  for (const [key, value] of Object.entries({ codexExecutable: input.codexExecutable, authFile: input.authFile, clientVersion: input.clientVersion, providerId: input.providerId, path: input.path, priorExposure: input.priorExposure, outputPath: input.outputPath })) if (!text(value, key === "priorExposure" ? 512 : 4096)) return fail("OPTION_TEXT")
  if (!isRoot(input.settingsRoot) || !isAbsolute(input.codexExecutable) || !isAbsolute(input.authFile) || !isAbsolute(input.outputPath)) return fail("OPTION_PATH_OR_ROOT")
  const executable = realpathSync(input.codexExecutable), authFile = realpathSync(input.authFile)
  if (!lstatSync(executable).isFile() || !lstatSync(authFile).isFile() || (lstatSync(executable).mode & 0o111) === 0) return fail("LOCAL_CODEX_PATHS")
  if (existsSync(input.outputPath)) return fail("OUTPUT_EXISTS")
  const roots = currentRoots()
  validateSourceBuildDisclosure(input.repository, input.responseFactoryDependencyRoot, roots, input)
  const sourceRoots = factoryAssessmentImplementationManifest().entries
  if (!sourceRoots.length) return fail("EMPTY_SOURCE_MANIFEST")
  return { roots, executable: resolve(input.codexExecutable), authFile: resolve(input.authFile) }
}

export const createPhase265RequestDrafts = (input: Phase265RequestDraftOptions): Readonly<{ schemaVersion: "phase265-request-drafts-v1"; privacy: "private_offline"; implementationRoot: LabRoot; sourceRoot: LabRoot; toolchainRoot: LabRoot; responseFactoryDependencyRoot: LabRoot; jobs: readonly unknown[] }> => {
  const validated = validateOptions(input), { roots, executable, authFile } = validated
  const schedule = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat()
  const jobs = schedule.map((producer, index) => {
    const id = `phase265-${String(index + 1).padStart(2, "0")}-${producer}`
    const split = index < 9 ? "development" as const : index === 9 ? "validation" as const : "probe" as const
    const role = index < 9 ? "development response" : index === 9 ? "teacher validation opponent" : "independent probe opponent"
    const doctrine = producer === "tactical" ? ["edge-pressure-screen", "reserve-first-evacuation", "stone-cut-recovery"][Math.floor(index / 3)]! : producer === "teacher" ? ["balanced-counterfactual-distillation", "initiative-aware-legal-response", "validation-control-distillation"][index === 1 ? 0 : index === 7 ? 1 : 2]! : ["safe-mission-coordination", "initiative-robust-coordination", "opening-diversity-coordination", "interaction-seeking-coordination", "independent-legality-probe"][index === 2 ? 0 : index === 4 ? 1 : index === 5 ? 2 : index === 8 ? 3 : 4]!
    const prompt = authoringPrompt(doctrine, role, producer === "model")
    const promptRoot = rootBytes(new TextEncoder().encode(prompt))
    const provider = {
      providerId: producer === "model" ? input.providerId : producer === "teacher" ? "offline-teacher" : "local-tactical-optimizer",
      modelId: producer === "model" ? LEAGUE_APPROVED_PROSPECTIVE_POLICY.model : producer === "teacher" ? "offline-search-teacher" : "deterministic-tactical-optimizer",
      modelVersion: producer === "model" ? input.clientVersion : producer === "teacher" ? "teacher-current" : "optimizer-current",
      settingsRoot: producer === "model" ? input.settingsRoot : labRoot("phase265-local-producer-settings-v1", { producer, version: producer === "teacher" ? "teacher-current" : "optimizer-current" }),
      promptRoot,
      contextRoot: producer === "model" ? labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [input.responseFactoryDependencyRoot] }) : labRoot("phase265-producer-context-v1", { dependencyArtifactRoots: [input.responseFactoryDependencyRoot] }),
    }
    let producerInput: unknown
    if (producer === "tactical") {
      producerInput = makeRequest(split, doctrine, true, roots, provider)
    } else if (producer === "teacher") {
      producerInput = {
        searches: [teacherSearch(index, index % 3, "cautious"), teacherSearch(index + 1, (index + 1) % 3, "aggressive")],
        request: makeRequest(split, doctrine, true, roots, provider),
      }
    } else {
      const stateDirectory = join(dirname(resolve(input.outputPath)), `${id}-state`), disclosedDirectory = join(dirname(resolve(input.outputPath)), `${id}-disclosed`)
      if (existsSync(stateDirectory) || existsSync(disclosedDirectory)) return fail("MODEL_DIRECTORY_EXISTS")
      producerInput = {
        authoring: {
          sourceMessage: prompt, codexExecutable: executable, clientVersion: input.clientVersion,
          stateDirectory, disclosedDirectory, existingAuthFile: authFile, requestedModel: LEAGUE_APPROVED_PROSPECTIVE_POLICY.model,
          requestedProvider: input.providerId, path: input.path, settingsRoot: input.settingsRoot, promptRoot,
          contextRoot: labRoot("league-disclosed-context-v1", { dependencyArtifactRoots: [input.responseFactoryDependencyRoot] }),
        },
        request: makeRequest(split, doctrine, false, roots),
      }
    }
    return {
      id, producerRequest: { producerIdentity: { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer], origin: { tactical: "tactical-oracle", teacher: "teacher-oracle", model: "model-oracle" }[producer], evidenceClass: "real_producer", producerInput },
      disclosure: { sourceAndBuildDisclosed: true, dependencyArtifactRoots: [input.responseFactoryDependencyRoot] },
      provenance: { priorExposure: input.priorExposure, conflicts: "none", deterministicDataOnly: true },
    }
  })
  if (jobs.length !== 11 || jobs.some((job, index) => (job as any).producerRequest.producerInput.request?.build?.buildRoot !== undefined && (job as any).producerRequest.producerInput.request.build.buildRoot !== roots.buildRoot)) return fail("INTERNAL_VALIDATION")
  const result = Object.freeze({ schemaVersion: "phase265-request-drafts-v1" as const, privacy: "private_offline" as const, implementationRoot: roots.implementationRoot, sourceRoot: roots.sourceRoot, toolchainRoot: roots.toolchainRoot, responseFactoryDependencyRoot: input.responseFactoryDependencyRoot, jobs: Object.freeze(jobs) })
  for (const [index, job] of jobs.entries()) validateDraft(job, index, input.responseFactoryDependencyRoot)
  canonical(result)
  return result
}

export const writePhase265RequestDraftsExclusive = (outputPath: string, value: unknown): void => {
  const target = resolve(outputPath), directory = dirname(target), temporary = join(directory, `.${basename(target)}.tmp-${process.pid}`), bytes = canonical(value)
  if (existsSync(target)) return fail("OUTPUT_EXISTS")
  let fd: number | undefined
  try {
    fd = openSync(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600)
    let offset = 0
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset, bytes.length - offset)
    fsyncSync(fd); closeSync(fd); fd = undefined
    // link is atomic and fails if another writer created target after validation.
    linkSync(temporary, target)
    unlinkSync(temporary)
    const directoryFd = openSync(directory, constants.O_RDONLY)
    try { fsyncSync(directoryFd) } finally { closeSync(directoryFd) }
  } catch (error) {
    if (fd !== undefined) closeSync(fd)
    try { unlinkSync(temporary) } catch { /* absent or already removed */ }
    throw error
  }
}

const main = () => {
  const arg = (name: string) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1] }
  if (process.argv.includes("--publish-disclosure")) {
    const { repositoryPath, providerId, settingsRoot } = parsePhase265DisclosureArguments(process.argv.slice(2))
    const root = publishPhase265SourceBuildDisclosure(createFactoryRepository(resolve(repositoryPath)), providerId, settingsRoot)
    process.stdout.write(`${JSON.stringify({ sourceCommit: REVIEWED_SOURCE_COMMIT, implementationRoot: REVIEWED_IMPLEMENTATION_ROOT, sourceRoot: REVIEWED_SOURCE_ROOT, disclosureArtifactRoot: root })}\n`)
    return
  }
  const basesPath = arg("--bases"), repositoryPath = arg("--response-factory"), historicalFactoryPath = arg("--historical-factory"), dependencyRoot = arg("--response-factory-dependency-root"), codexExecutable = arg("--codex-executable"), authFile = arg("--auth-file"), clientVersion = arg("--client-version"), providerId = arg("--provider-id"), settingsRoot = arg("--settings-root"), path = arg("--path"), priorExposure = arg("--prior-exposure"), outputPath = arg("--output")
  if (!basesPath || !repositoryPath || !historicalFactoryPath || !dependencyRoot || !codexExecutable || !authFile || !clientVersion || !providerId || !settingsRoot || !path || !priorExposure || !outputPath || !isRoot(dependencyRoot) || !isRoot(settingsRoot)) return fail("USAGE: --bases <canonical-verified-manifest> --historical-factory <existing-dir> --response-factory <existing-dir> --response-factory-dependency-root <sha256-root> --codex-executable <absolute-file> --auth-file <absolute-file> --client-version <actual-version> --provider-id <actual-provider> --settings-root <sha256-root> --path <PATH> --prior-exposure <operator-declaration> --output <new-json-file>")
  const parsed = admitCanonicalJsonBytes(readFileSync(resolve(basesPath)), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!parsed.ok) return fail("BASE_MANIFEST_NOT_CANONICAL")
  const repository = createFactoryRepository(resolve(repositoryPath)), historicalFactoryRepository = createFactoryRepository(resolve(historicalFactoryPath))
  const result = createPhase265RequestDrafts({ baseManifest: parsed.value, repository, historicalFactoryRepository, responseFactoryDependencyRoot: dependencyRoot as LabRoot, codexExecutable, authFile, clientVersion, providerId, settingsRoot: settingsRoot as LabRoot, path, priorExposure, outputPath })
  writePhase265RequestDraftsExclusive(outputPath, result)
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main() } catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1 }
}
