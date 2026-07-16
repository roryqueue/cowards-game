import type { CanonicalIdentityDomain } from "./canonical-identity-domains.js"
import type { RuntimeSupervisorIdentityV118 } from "./runtime-invocation-v1-18.js"

export const RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17 =
  "runtime-evidence-graph-v1.17" as const
export const RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17 =
  "runtime-identity-evidence-dag-v1" as const

const CANONICAL_SAFE_REGISTRY_GENERATION_V1_17 = /^(?:0|[1-9][0-9]{0,15})$/u

export const isCanonicalSafeRegistryGenerationV117 = (
  value: unknown,
): value is string =>
  typeof value === "string" &&
  CANONICAL_SAFE_REGISTRY_GENERATION_V1_17.test(value) &&
  Number.isSafeInteger(Number(value))

export const RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17 = Object.freeze([
  "originalSource",
  "normalizedSource",
  "normalizationPolicy",
  "artifact",
  "artifactManifest",
  "runtimeExecutable",
  "compilerExecutable",
  "sysrootStdlib",
  "adapterBuild",
  "semanticTuple",
  "containmentPolicy",
  "conformanceCorpus",
  "budgetProfile",
  "canonicalJsonProfile",
  "evidenceBundle",
] as const satisfies readonly CanonicalIdentityDomain[])

export type RuntimeEvidenceGraphNodeKindV117 =
  (typeof RUNTIME_EVIDENCE_GRAPH_NODE_KINDS_V1_17)[number]

const edge = <
  F extends RuntimeEvidenceGraphNodeKindV117,
  T extends RuntimeEvidenceGraphNodeKindV117,
  K extends string,
>(
  from: F,
  to: T,
  kind: K,
) => Object.freeze({ from, to, kind })

export const RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17 = Object.freeze([
  edge("normalizedSource", "originalSource", "normalized-from"),
  edge("normalizedSource", "normalizationPolicy", "normalized-under"),
  edge("artifact", "normalizedSource", "artifact-from"),
  edge("artifact", "compilerExecutable", "compiled-by"),
  edge("artifact", "sysrootStdlib", "linked-with"),
  edge("artifactManifest", "originalSource", "manifest-binds-original"),
  edge("artifactManifest", "normalizedSource", "manifest-binds-normalized"),
  edge(
    "artifactManifest",
    "normalizationPolicy",
    "manifest-binds-normalization-policy",
  ),
  edge("artifactManifest", "artifact", "manifest-binds-artifact"),
  edge("artifactManifest", "compilerExecutable", "manifest-binds-compiler"),
  edge("artifactManifest", "sysrootStdlib", "manifest-binds-sysroot"),
  edge("artifactManifest", "semanticTuple", "manifest-binds-semantic-tuple"),
  edge(
    "artifactManifest",
    "canonicalJsonProfile",
    "manifest-binds-canonical-json",
  ),
  edge("adapterBuild", "runtimeExecutable", "adapter-invokes-runtime"),
  edge("adapterBuild", "semanticTuple", "adapter-implements-abi"),
  edge("adapterBuild", "containmentPolicy", "adapter-enforces-containment"),
  edge("adapterBuild", "budgetProfile", "adapter-enforces-budget"),
  edge("adapterBuild", "canonicalJsonProfile", "adapter-emits-canonical-json"),
  edge("evidenceBundle", "artifactManifest", "evidence-binds-manifest"),
  edge("evidenceBundle", "runtimeExecutable", "evidence-binds-runtime"),
  edge("evidenceBundle", "adapterBuild", "evidence-binds-adapter"),
  edge("evidenceBundle", "semanticTuple", "evidence-binds-tuple"),
  edge("evidenceBundle", "containmentPolicy", "evidence-binds-containment"),
  edge("evidenceBundle", "conformanceCorpus", "evidence-binds-corpus"),
  edge("evidenceBundle", "budgetProfile", "evidence-binds-budget"),
  edge(
    "evidenceBundle",
    "canonicalJsonProfile",
    "evidence-binds-canonical-json",
  ),
] as const)

export type RuntimeEvidenceGraphEdgeKindV117 =
  (typeof RUNTIME_EVIDENCE_EDGE_SCHEMA_V1_17)[number]["kind"]

export const RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17 = Object.freeze([
  "runtimeExecutableDigest",
  "reportedVersion",
  "targetAbi",
  "compilerFlags",
  "adapterBuildDigest",
  "standardLibraryOrSysrootDigest",
  "containmentPolicyId",
  "budgetProfileSha256",
  "canonicalJsonProfileId",
  "behaviorSettingsHash",
] as const)

export type RuntimeEvidenceExactPinNameV117 =
  (typeof RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17)[number]
export type RuntimeEvidenceExactPinsV117 = Readonly<
  Record<RuntimeEvidenceExactPinNameV117, string>
>

export interface RuntimeEvidenceGraphNodeV117 {
  nodeId: string
  kind: RuntimeEvidenceGraphNodeKindV117
  publicId: string
  sha256: string
}

export interface RuntimeEvidenceGraphEdgeV117 {
  fromNodeId: string
  toNodeId: string
  kind: RuntimeEvidenceGraphEdgeKindV117
}

export interface RuntimeEvidenceGraphV117 {
  schemaVersion: typeof RUNTIME_EVIDENCE_GRAPH_SCHEMA_VERSION_V1_17
  profile: typeof RUNTIME_EVIDENCE_GRAPH_PROFILE_V1_17
  rootNodeId: string
  identityManifestRoot: string
  nodes: readonly RuntimeEvidenceGraphNodeV117[]
  edges: readonly RuntimeEvidenceGraphEdgeV117[]
  exactPins: RuntimeEvidenceExactPinsV117
  graphSha256: string
}

export interface RuntimeConformanceEvidenceRunReceiptV117 {
  runId: string
  receiptSha256: `sha256:${string}`
}

/**
 * Canonical bytes committed by the existing evidenceBundle graph node.
 * The certificate separately signs the graph/manifest roots, avoiding a
 * certificate <-> graph self-hash cycle while still binding the full source.
 */
export interface RuntimeConformanceEvidenceSourceV117 {
  schemaVersion: "runtime-conformance-evidence-source-v1.17"
  runtimeAbiVersion: "strategy-runtime-abi-v1.18"
  runtimeAbiEnvelopeSha256: `sha256:${string}`
  additiveBudgetProfileSha256: `sha256:${string}`
  supervisorOperatingSystemSha256: `sha256:${string}`
  supervisorSettingsSha256: `sha256:${string}`
  aggregateReceiptSchemaSha256: `sha256:${string}`
  supervisorIdentity: RuntimeSupervisorIdentityV118
  caseInventorySha256: `sha256:${string}`
  resultRootSha256: `sha256:${string}`
  evidenceRootSha256: `sha256:${string}`
  runReceipts: RuntimeConformanceEvidenceRunReceiptV117[]
}

export interface RuntimeConformanceEvidenceBindingV117 {
  schemaVersion: "runtime-conformance-evidence-binding-v1.17"
  certificateId: string
  certificateSha256: `sha256:${string}`
  certificateVersion: "runtime-conformance-certificate-v1.17"
  attestationSha256: string
  trustDomain: "production" | "fixture"
  registryGeneration: string
  issuedAt: string
  freshUntil: string
  languageId: "typescript" | "python" | "rust" | "zig"
  laneId: string
  corpusRootSha256: `sha256:${string}`
  caseInventorySha256: `sha256:${string}`
  fixtureSourceSha256: `sha256:${string}`
  artifactSha256: `sha256:${string}`
  adapterBuildSha256: `sha256:${string}`
  runtimeExecutableSha256: `sha256:${string}`
  toolchainSha256: `sha256:${string}`
  sysrootStdlibSha256: `sha256:${string}`
  runtimeAbiVersion: "strategy-runtime-abi-v1.18"
  runtimeAbiEnvelopeSha256: `sha256:${string}`
  canonicalJsonProfileId: string
  budgetPolicySha256: `sha256:${string}`
  additiveBudgetProfileSha256: `sha256:${string}`
  containmentPolicySha256: `sha256:${string}`
  semanticTupleSha256: `sha256:${string}`
  identityManifestRoot: `sha256:${string}`
  evidenceGraphRoot: `sha256:${string}`
  behaviorSettingsSha256: `sha256:${string}`
  supervisorOperatingSystemSha256: `sha256:${string}`
  supervisorSettingsSha256: `sha256:${string}`
  aggregateReceiptSchemaSha256: `sha256:${string}`
  supervisorIdentity: Readonly<RuntimeSupervisorIdentityV118>
  resultRootSha256: `sha256:${string}`
  evidenceRootSha256: `sha256:${string}`
  runIds: readonly string[]
  runReceiptSha256s: readonly `sha256:${string}`[]
}
