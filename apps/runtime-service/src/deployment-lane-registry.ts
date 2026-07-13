import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import {
  resolveCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
  type ExecutableLaneIdentity,
  type StrategyRevision,
} from "@cowards/spec"
import { RuntimeServiceConfigError } from "./runtime-config.js"

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
    [...PROFILE_STRING_FIELDS, "artifactKind", "semanticTuple"],
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
  const resolved = resolveCanonicalCompatibilityTuple({
    tupleId: value.semanticTupleId as string,
    tuple: value.semanticTuple,
  })
  if (!resolved) {
    throw new RuntimeServiceConfigError(
      `Deployment lane registry profile ${index} semantic tuple is invalid.`,
    )
  }
  return Object.freeze({
    ...Object.fromEntries(
      PROFILE_STRING_FIELDS.map((field) => [field, value[field]]),
    ),
    artifactKind: value.artifactKind,
    semanticTuple: Object.freeze({ ...resolved.tuple }),
  }) as unknown as DeploymentLaneProfile
}

export const parseDeploymentLaneRegistry = (
  value: unknown,
): Readonly<DeploymentLaneRegistry> => {
  if (!isRecord(value)) {
    throw new RuntimeServiceConfigError("Deployment lane registry is invalid.")
  }
  exactKeys(value, ["schemaVersion", "registryId", "lanes"], "Deployment lane registry")
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
  revision: StrategyRevision,
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
    if (
      !sourceArtifact ||
      sourceArtifact.toolchain.language !== profile.toolchainId ||
      sourceArtifact.toolchain.runtime !== profile.runtimeId ||
      sourceArtifact.toolchain.runtimeVersion !== profile.toolchainVersion ||
      profile.runtimeVersion !== sourceArtifact.toolchain.runtimeVersion
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

export const createDeploymentLaneIdentityResolver = (
  registry: Readonly<DeploymentLaneRegistry>,
): ((revision: StrategyRevision) => ExecutableLaneIdentity | undefined) =>
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
      revision.metadata.providerValidation?.providerId !== profile.providerId ||
      revision.runtime.abiVersion !== profile.semanticTuple.runtimeAbi ||
      revision.engineCompatibility.spec !== profile.semanticTuple.rules ||
      revision.engineCompatibility.engine !== profile.semanticTuple.engine
    ) {
      return undefined
    }
    const artifact = artifactBytesAndHash(revision, profile)
    if (!artifact) return undefined
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
