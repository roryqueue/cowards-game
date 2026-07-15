import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import {
  CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID,
  StrategyRevisionV117Schema,
  hashSuccessorRuntimeLaneProfileV117,
  resolveCandidateRuntimeV117SemanticTuple,
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
  type ExecutableLaneIdentity,
  type StrategyRevision,
  type StrategyRevisionV117,
} from "@cowards/spec"
import { RuntimeServiceConfigError } from "./runtime-config.js"
import {
  parseSuccessorRuntimeIdentityTemplateV117,
  type SuccessorRuntimeIdentityTemplateV117,
} from "./successor-runtime-identity.js"

export const DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION =
  "runtime-deployment-lane-registry-v1.37"

const SHA256_PATTERN = /^[0-9a-f]{64}$/u

const PROFILE_STRING_FIELDS = [
  "providerId",
  "languageId",
  "languageVersion",
  "runtimeId",
  "runtimeVersion",
  "toolchainId",
  "toolchainVersion",
  "adapterId",
  "adapterVersion",
  "policyId",
  "policyVersion",
  "corpusId",
  "corpusVersion",
  "artifactIdPrefix",
  "implementationId",
  "buildId",
  "semanticTupleId",
] as const

export interface DeploymentLaneProfile {
  providerId: string
  languageId: string
  languageVersion: string
  runtimeId: string
  runtimeVersion: string
  toolchainId: string
  toolchainVersion: string
  adapterId: string
  adapterVersion: string
  policyId: string
  policyVersion: string
  corpusId: string
  corpusVersion: string
  artifactKind: "source" | "compiled"
  artifactIdPrefix: string
  implementationId: string
  buildId: string
  semanticTupleId: string
  semanticTuple: CanonicalCompatibilityTuple
  successorRuntimeIdentityTemplate?: SuccessorRuntimeIdentityTemplateV117
}

export interface DeploymentLaneRegistry {
  schemaVersion: typeof DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION
  registryId: string
  lanes: readonly Readonly<DeploymentLaneProfile>[]
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const exactKeys = (
  value: Record<string, unknown>,
  keys: readonly string[],
  label: string,
): void => {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    throw new RuntimeServiceConfigError(`${label} has invalid fields.`)
  }
}

const parseProfile = (value: unknown, index: number): DeploymentLaneProfile => {
  if (!isRecord(value)) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} is invalid.`,
    )
  }
  exactKeys(
    value,
    [
      ...PROFILE_STRING_FIELDS,
      "artifactKind",
      "semanticTuple",
      ...(Object.hasOwn(value, "successorRuntimeIdentityTemplate")
        ? (["successorRuntimeIdentityTemplate"] as const)
        : []),
    ],
    `Deployment lane registry profile ${index}`,
  )
  for (const field of PROFILE_STRING_FIELDS) {
    if (typeof value[field] !== "string" || value[field].trim().length === 0) {
      throw new RuntimeServiceConfigError(
        `Deployment lane registry profile ${index} ${field} is invalid.`,
      )
    }
  }
  if (value.artifactKind !== "source" && value.artifactKind !== "compiled") {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} artifactKind is invalid.`,
    )
  }
  const selector = {
    tupleId: value.semanticTupleId as string,
    tuple: value.semanticTuple,
  }
  const current = resolveCanonicalCompatibilityTuple(selector)
  const candidate = resolveCandidateRuntimeV117SemanticTuple(selector)
  const resolved = current ?? candidate
  if (!resolved) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} semantic tuple is invalid.`,
    )
  }
  let successorRuntimeIdentityTemplate:
    | DeploymentLaneProfile["successorRuntimeIdentityTemplate"]
    | undefined
  if (Object.hasOwn(value, "successorRuntimeIdentityTemplate")) {
    try {
      successorRuntimeIdentityTemplate =
        parseSuccessorRuntimeIdentityTemplateV117(
          value.successorRuntimeIdentityTemplate as SuccessorRuntimeIdentityTemplateV117,
        )
    } catch {
      throw new RuntimeServiceConfigError(
        `Deployment lane registry profile ${index} successor identity is invalid.`,
      )
    }
  }
  const isSuccessor =
    resolved.tupleId === CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID
  if (
    (isSuccessor && successorRuntimeIdentityTemplate === undefined) ||
    (!isSuccessor && successorRuntimeIdentityTemplate !== undefined)
  ) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} successor identity does not match its semantic tuple.`,
    )
  }
  const semanticTupleBinding = successorRuntimeIdentityTemplate?.bindings.find(
    ({ domain }) => domain === "semanticTuple",
  )
  const containmentPolicyBinding =
    successorRuntimeIdentityTemplate?.bindings.find(
      ({ domain }) => domain === "containmentPolicy",
    )
  const conformanceCorpusBinding =
    successorRuntimeIdentityTemplate?.bindings.find(
      ({ domain }) => domain === "conformanceCorpus",
    )
  if (
    isSuccessor &&
    (semanticTupleBinding?.publicId !== resolved.tupleId ||
      semanticTupleBinding.sha256 !== resolved.sha256)
  ) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} successor identity does not bind its semantic tuple.`,
    )
  }
  const successorPins =
    successorRuntimeIdentityTemplate === undefined
      ? undefined
      : new Map(successorRuntimeIdentityTemplate.exactPins)
  if (
    isSuccessor &&
    successorPins?.get("reportedVersion") !== value.runtimeVersion
  ) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} successor identity does not bind its runtime version.`,
    )
  }
  if (
    isSuccessor &&
    (containmentPolicyBinding?.publicId !== value.policyId ||
      conformanceCorpusBinding?.publicId !== value.corpusId)
  ) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} successor identity does not bind its policy and corpus.`,
    )
  }
  if (
    isSuccessor &&
    successorRuntimeIdentityTemplate?.laneProfileSha256 !==
      hashSuccessorRuntimeLaneProfileV117({
        providerId: value.providerId as string,
        languageId: value.languageId as string,
        languageVersion: value.languageVersion as string,
        runtimeId: value.runtimeId as string,
        runtimeVersion: value.runtimeVersion as string,
        toolchainId: value.toolchainId as string,
        toolchainVersion: value.toolchainVersion as string,
        adapterId: value.adapterId as string,
        adapterVersion: value.adapterVersion as string,
        policyId: value.policyId as string,
        policyVersion: value.policyVersion as string,
        corpusId: value.corpusId as string,
        corpusVersion: value.corpusVersion as string,
        artifactKind: value.artifactKind,
        artifactIdPrefix: value.artifactIdPrefix as string,
        implementationId: value.implementationId as string,
        buildId: value.buildId as string,
        semanticTupleId: resolved.tupleId,
        semanticTuple: { ...resolved.tuple },
      })
  ) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} successor identity does not bind its exact deployment profile.`,
    )
  }
  return Object.freeze({
    ...Object.fromEntries(
      PROFILE_STRING_FIELDS.map((field) => [field, value[field]]),
    ),
    artifactKind: value.artifactKind,
    semanticTuple: Object.freeze({ ...resolved.tuple }),
    ...(successorRuntimeIdentityTemplate === undefined
      ? {}
      : { successorRuntimeIdentityTemplate }),
  }) as unknown as DeploymentLaneProfile
}

export const parseDeploymentLaneRegistry = (
  value: unknown,
): Readonly<DeploymentLaneRegistry> => {
  if (!isRecord(value)) {
    throw new RuntimeServiceConfigError("Deployment lane registry is invalid.")
  }
  exactKeys(
    value,
    ["schemaVersion", "registryId", "lanes"],
    "Deployment lane registry",
  )
  if (
    value.schemaVersion !== DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION ||
    typeof value.registryId !== "string" ||
    value.registryId.trim().length === 0 ||
    !Array.isArray(value.lanes) ||
    value.lanes.length === 0
  ) {
    throw new RuntimeServiceConfigError("Deployment lane registry is invalid.")
  }
  const lanes = value.lanes.map(parseProfile)
  const keys = new Set<string>()
  for (const lane of lanes) {
    const key = [
      lane.languageId,
      lane.languageVersion,
      lane.adapterId,
      lane.adapterVersion,
    ].join("\0")
    if (keys.has(key)) {
      throw new RuntimeServiceConfigError(
        "Deployment lane registry contains an ambiguous runtime profile.",
      )
    }
    keys.add(key)
  }
  return Object.freeze({
    schemaVersion: DEPLOYMENT_LANE_REGISTRY_SCHEMA_VERSION,
    registryId: value.registryId,
    lanes: Object.freeze(lanes),
  })
}

export const loadDeploymentLaneRegistry = (
  path: string,
): Readonly<DeploymentLaneRegistry> => {
  if (path.trim().length === 0) {
    throw new RuntimeServiceConfigError(
      "Runtime service requires COWARDS_RUNTIME_DEPLOYMENT_LANE_REGISTRY.",
    )
  }
  try {
    return parseDeploymentLaneRegistry(
      JSON.parse(readFileSync(path, "utf8")) as unknown,
    )
  } catch (error) {
    if (error instanceof RuntimeServiceConfigError) throw error
    throw new RuntimeServiceConfigError(
      "Runtime service deployment lane registry could not be loaded.",
    )
  }
}

const artifactBytesAndHash = (
  revision: StrategyRevision | StrategyRevisionV117,
  profile: DeploymentLaneProfile,
): { hash: string } | undefined => {
  const sourceArtifact = revision.metadata.sourceArtifact
  const compiledArtifact = revision.metadata.compiledArtifact
  const artifact =
    profile.artifactKind === "source" ? sourceArtifact : compiledArtifact
  if (
    !artifact?.bytesBase64 ||
    !SHA256_PATTERN.test(artifact.hash) ||
    artifact.sourceHash !== revision.sourceHash ||
    artifact.abiVersion !== profile.semanticTuple.runtimeAbi
  ) {
    return undefined
  }
  const bytes = Buffer.from(artifact.bytesBase64, "base64")
  if (
    bytes.byteLength !== artifact.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== artifact.hash
  ) {
    return undefined
  }
  if (profile.artifactKind === "source") {
    const successor =
      profile.semanticTupleId === CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID
    if (
      !sourceArtifact ||
      (successor
        ? sourceArtifact.toolchain.language !== profile.languageId ||
          sourceArtifact.toolchain.runtime !== profile.toolchainId ||
          sourceArtifact.toolchain.runtimeVersion !== profile.toolchainVersion
        : sourceArtifact.toolchain.language !== profile.toolchainId ||
          sourceArtifact.toolchain.runtime !== profile.runtimeId ||
          sourceArtifact.toolchain.runtimeVersion !==
            profile.toolchainVersion ||
          profile.runtimeVersion !== sourceArtifact.toolchain.runtimeVersion)
    ) {
      return undefined
    }
  } else if (
    !compiledArtifact ||
    compiledArtifact.toolchain.compiler !== profile.toolchainId ||
    compiledArtifact.toolchain.compilerVersion !== profile.toolchainVersion
  ) {
    return undefined
  }
  return { hash: artifact.hash }
}

export const createDeploymentLaneIdentityResolver =
  (
    registry: Readonly<DeploymentLaneRegistry>,
  ): ((
    revision: StrategyRevision | StrategyRevisionV117,
  ) => ExecutableLaneIdentity | undefined) =>
  (revision) => {
    const profile = registry.lanes.find(
      (candidate) =>
        candidate.languageId === revision.runtime.language.id &&
        candidate.languageVersion === revision.runtime.language.version &&
        candidate.adapterId === revision.runtime.adapter.id &&
        candidate.adapterVersion === revision.runtime.adapter.version,
    )
    if (
      !profile ||
      (profile.semanticTupleId === CANDIDATE_RUNTIME_V117_SEMANTIC_TUPLE_ID &&
        !StrategyRevisionV117Schema.safeParse(revision).success) ||
      revision.metadata.providerValidation?.providerId !== profile.providerId ||
      revision.metadata.providerValidation.contractVersion.length === 0 ||
      revision.metadata.providerValidation.sourceHash !== revision.sourceHash ||
      revision.metadata.providerValidation.sourceBytes !==
        revision.sourceBytes ||
      revision.metadata.providerValidation.proof.length === 0 ||
      revision.runtime.abiVersion !== profile.semanticTuple.runtimeAbi ||
      revision.engineCompatibility.spec !== profile.semanticTuple.rules ||
      revision.engineCompatibility.engine !== profile.semanticTuple.engine
    ) {
      return undefined
    }
    const artifact = artifactBytesAndHash(revision, profile)
    if (!artifact) return undefined
    const revisionArtifact =
      profile.artifactKind === "source"
        ? revision.metadata.sourceArtifact
        : revision.metadata.compiledArtifact
    if (
      revisionArtifact === undefined ||
      revision.metadata.providerValidation.artifactHash !==
        revisionArtifact?.hash ||
      revision.metadata.providerValidation.artifactBytes !==
        revisionArtifact.bytes
    ) {
      return undefined
    }
    return Object.freeze({
      providerId: profile.providerId,
      languageId: profile.languageId,
      runtimeId: profile.runtimeId,
      runtimeVersion: profile.runtimeVersion,
      toolchainId: profile.toolchainId,
      toolchainVersion: profile.toolchainVersion,
      adapterId: profile.adapterId,
      adapterVersion: profile.adapterVersion,
      policyId: profile.policyId,
      policyVersion: profile.policyVersion,
      corpusId: profile.corpusId,
      corpusVersion: profile.corpusVersion,
      artifactId: `${profile.artifactIdPrefix}${revision.id}`,
      artifactSha256: artifact.hash,
      implementationId: profile.implementationId,
      buildId: profile.buildId,
      semanticTupleId: profile.semanticTupleId,
      semanticTuple: Object.freeze({ ...profile.semanticTuple }),
    })
  }

export const createSuccessorRuntimeIdentityTemplateResolver = (
  registry: Readonly<DeploymentLaneRegistry>,
): ((
  revision: StrategyRevision | StrategyRevisionV117,
) => DeploymentLaneProfile["successorRuntimeIdentityTemplate"] | undefined) => {
  const resolveLane = createDeploymentLaneIdentityResolver(registry)
  return (revision) => {
    if (resolveLane(revision) === undefined) return undefined
    return registry.lanes.find(
      (candidate) =>
        candidate.languageId === revision.runtime.language.id &&
        candidate.languageVersion === revision.runtime.language.version &&
        candidate.adapterId === revision.runtime.adapter.id &&
        candidate.adapterVersion === revision.runtime.adapter.version,
    )?.successorRuntimeIdentityTemplate
  }
}
