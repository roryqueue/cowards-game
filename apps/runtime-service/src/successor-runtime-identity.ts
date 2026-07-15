import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  CANONICAL_IDENTITY_DOMAIN_NAMES,
  RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256,
  RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
  hashCanonicalIdentity,
  hashCanonicalIdentityValue,
  parseRuntimeEvidenceAuthorityBindingV117,
  parseRuntimeIdentityManifest,
  type CanonicalIdentityDomain,
  type ExecutableLaneIdentity,
  type JsonValue,
  type RuntimeIdentityBinding,
  type RuntimeIdentityManifest,
  type SuccessorRuntimeIdentityTemplateV117,
  type StrategyRevision,
  type StrategyRevisionV117,
} from "@cowards/spec"

export {
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
  SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
  type SuccessorRuntimeIdentityTemplateV117,
}

const hash = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const templateValidationManifest = (
  bindings: readonly RuntimeIdentityBinding[],
): RuntimeIdentityManifest => ({
  schemaVersion: "runtime-identity-manifest-v1",
  profile: "runtime-identity-v1",
  bindings: CANONICAL_IDENTITY_DOMAIN_NAMES.map(
    (domain) =>
      bindings.find((binding) => binding.domain === domain) ?? {
        domain,
        publicId: `template-validation.${domain}`,
        sha256: "0".repeat(64),
      },
  ),
})

export const parseSuccessorRuntimeIdentityTemplateV117 = (
  input: SuccessorRuntimeIdentityTemplateV117,
): Readonly<SuccessorRuntimeIdentityTemplateV117> => {
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 4 ||
    input.schemaVersion !== SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117 ||
    input.profile !== SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117 ||
    !Array.isArray(input.bindings) ||
    input.bindings.length !==
      SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117.length ||
    !Array.isArray(input.exactPins)
  ) {
    throw new TypeError("Successor runtime identity template is invalid.")
  }
  const domains = new Set(input.bindings.map((binding) => binding.domain))
  if (
    SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117.some(
      (domain) => !domains.has(domain),
    )
  ) {
    throw new TypeError("Successor runtime identity template is invalid.")
  }
  const normalized = parseRuntimeIdentityManifest(
    templateValidationManifest(input.bindings),
  )
  const bindingByDomain = new Map(
    normalized.bindings.map((binding) => [binding.domain, binding]),
  )
  const exactPins = parseRuntimeEvidenceAuthorityBindingV117({
    graphSchemaVersion: "runtime-evidence-graph-v1.17",
    graphProfile: "runtime-identity-evidence-dag-v1",
    identityManifestRoot: `sha256:${"0".repeat(64)}`,
    evidenceGraphRoot: `sha256:${"0".repeat(64)}`,
    exactPins: input.exactPins,
  }).exactPins
  const template = Object.freeze({
    schemaVersion: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_SCHEMA_V117,
    profile: SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_PROFILE_V117,
    bindings: Object.freeze(
      SUCCESSOR_RUNTIME_IDENTITY_TEMPLATE_DOMAINS_V117.map((domain) =>
        Object.freeze({ ...bindingByDomain.get(domain)! }),
      ),
    ),
    exactPins,
  })
  const pins = new Map(template.exactPins)
  const binding = (domain: CanonicalIdentityDomain) =>
    template.bindings.find((candidate) => candidate.domain === domain)!
  if (
    pins.size !== RUNTIME_EVIDENCE_REQUIRED_EXACT_PINS_V1_17.length ||
    pins.get("runtimeExecutableDigest") !==
      `sha256:${binding("runtimeExecutable").sha256}` ||
    pins.get("adapterBuildDigest") !==
      `sha256:${binding("adapterBuild").sha256}` ||
    pins.get("standardLibraryOrSysrootDigest") !==
      `sha256:${binding("sysrootStdlib").sha256}` ||
    pins.get("containmentPolicyId") !== binding("containmentPolicy").publicId ||
    pins.get("budgetProfileSha256") !==
      `sha256:${binding("budgetProfile").sha256}` ||
    pins.get("budgetProfileSha256") !==
      RUNTIME_ABI_V1_17_BUDGET_PROFILE_SHA256 ||
    pins.get("canonicalJsonProfileId") !==
      binding("canonicalJsonProfile").publicId ||
    pins.get("canonicalJsonProfileId") !== "canonical-json-v1.1"
  ) {
    throw new TypeError("Successor runtime identity template is invalid.")
  }
  return template
}

const derivedBinding = (
  domain: CanonicalIdentityDomain,
  revisionKey: string,
  value: JsonValue,
): RuntimeIdentityBinding => ({
  domain,
  publicId: `strategy-revision.${revisionKey}.${domain}`,
  sha256: hashCanonicalIdentityValue(domain, value),
})

export const composeSuccessorRuntimeIdentityV117 = (input: {
  revision: StrategyRevision | StrategyRevisionV117
  deployed: ExecutableLaneIdentity
  template: SuccessorRuntimeIdentityTemplateV117
}):
  | {
      identityManifest: Readonly<RuntimeIdentityManifest>
      sourceIdentity: {
        originalSourceSha256: `sha256:${string}`
        normalizedSourceSha256: `sha256:${string}`
        artifactSha256: `sha256:${string}`
      }
    }
  | undefined => {
  const template = parseSuccessorRuntimeIdentityTemplateV117(input.template)
  const artifact = [
    input.revision.metadata.sourceArtifact,
    input.revision.metadata.compiledArtifact,
  ].find(
    (candidate) =>
      candidate?.hash === input.deployed.artifactSha256 &&
      candidate.bytesBase64 !== undefined,
  )
  if (artifact?.bytesBase64 === undefined) return undefined
  const originalBytes = Buffer.from(input.revision.source, "utf8")
  const normalizedBytes = Buffer.from(
    input.revision.source.replaceAll("\r\n", "\n").replaceAll("\r", "\n"),
    "utf8",
  )
  const artifactBytes = Buffer.from(artifact.bytesBase64, "base64")
  if (createHash("sha256").update(artifactBytes).digest("hex") !== artifact.hash)
    return undefined
  const revisionKey = createHash("sha256")
    .update(input.revision.id, "utf8")
    .digest("hex")
  const direct: RuntimeIdentityBinding[] = [
    {
      domain: "originalSource",
      publicId: `strategy-revision.${revisionKey}.originalSource`,
      sha256: hashCanonicalIdentity("originalSource", [originalBytes]),
    },
    {
      domain: "normalizedSource",
      publicId: `strategy-revision.${revisionKey}.normalizedSource`,
      sha256: hashCanonicalIdentity("normalizedSource", [normalizedBytes]),
    },
    {
      domain: "normalizationPolicy",
      publicId: "source-normalization.crlf-cr-to-lf.v1",
      sha256: hashCanonicalIdentity("normalizationPolicy", [
        Buffer.from("replace-crlf-and-cr-with-lf:v1", "utf8"),
      ]),
    },
    {
      domain: "artifact",
      publicId: `strategy-revision.${revisionKey}.artifact`,
      sha256: hashCanonicalIdentity("artifact", [artifactBytes]),
    },
  ]
  const byDomain = new Map(
    [...direct, ...template.bindings].map((binding) => [
      binding.domain,
      binding,
    ]),
  )
  const artifactManifest = derivedBinding(
    "artifactManifest",
    revisionKey,
    {
      bindings: [
        "originalSource",
        "normalizedSource",
        "normalizationPolicy",
        "artifact",
        "compilerExecutable",
        "sysrootStdlib",
        "semanticTuple",
        "canonicalJsonProfile",
      ].map((domain) => byDomain.get(domain as CanonicalIdentityDomain)!),
    } as unknown as JsonValue,
  )
  byDomain.set("artifactManifest", artifactManifest)
  const evidenceBundle = derivedBinding(
    "evidenceBundle",
    revisionKey,
    {
      bindings: CANONICAL_IDENTITY_DOMAIN_NAMES.filter(
        (domain) => domain !== "evidenceBundle",
      ).map((domain) => byDomain.get(domain)!),
      exactPins: template.exactPins,
    } as unknown as JsonValue,
  )
  byDomain.set("evidenceBundle", evidenceBundle)
  const identityManifest = parseRuntimeIdentityManifest({
    schemaVersion: "runtime-identity-manifest-v1",
    profile: "runtime-identity-v1",
    bindings: CANONICAL_IDENTITY_DOMAIN_NAMES.map(
      (domain) => byDomain.get(domain)!,
    ),
  })
  return {
    identityManifest,
    sourceIdentity: {
      originalSourceSha256: hash(originalBytes),
      normalizedSourceSha256: hash(normalizedBytes),
      artifactSha256: hash(artifactBytes),
    },
  }
}
