import {
  CANONICAL_IDENTITY_DOMAIN_NAMES,
  hashCanonicalIdentity,
  type CanonicalIdentityDomain,
} from "./canonical-identity-domains.js"
import { encodeCanonicalJson } from "./canonical-json-encode.js"

export interface RuntimeIdentityBinding {
  domain: CanonicalIdentityDomain
  publicId: string
  sha256: string
}

export interface RuntimeIdentityManifest {
  schemaVersion: "runtime-identity-manifest-v1"
  profile: "runtime-identity-v1"
  bindings: readonly RuntimeIdentityBinding[]
}

export class RuntimeIdentityManifestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "RuntimeIdentityManifestError"
  }
}

const SHA256 = /^[0-9a-f]{64}$/u
const PUBLIC_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u
const domainSet = new Set<string>(CANONICAL_IDENTITY_DOMAIN_NAMES)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const requireExactKeys = (
  value: unknown,
  expected: readonly string[],
  label: string,
): Record<string, unknown> => {
  if (!isRecord(value)) throw new RuntimeIdentityManifestError(`${label} must be an object`)
  const keys = Object.keys(value)
  const expectedSet = new Set(expected)
  if (keys.length !== expected.length || keys.some((key) => !expectedSet.has(key))) {
    throw new RuntimeIdentityManifestError(`${label} must contain exactly ${expected.join(", ")}`)
  }
  return value
}

const normalizedManifest = (input: RuntimeIdentityManifest): RuntimeIdentityManifest => {
  const manifest = requireExactKeys(
    input,
    ["schemaVersion", "profile", "bindings"],
    "Runtime identity manifest",
  )
  if (manifest.schemaVersion !== "runtime-identity-manifest-v1") {
    throw new RuntimeIdentityManifestError("Runtime identity manifest schema is invalid")
  }
  if (manifest.profile !== "runtime-identity-v1") {
    throw new RuntimeIdentityManifestError("Runtime identity manifest profile is invalid")
  }
  if (!Array.isArray(manifest.bindings)) {
    throw new RuntimeIdentityManifestError("Runtime identity manifest bindings must be an array")
  }

  const byDomain = new Map<CanonicalIdentityDomain, RuntimeIdentityBinding>()
  const publicIds = new Set<string>()
  for (const candidate of manifest.bindings) {
    const binding = requireExactKeys(
      candidate,
      ["domain", "publicId", "sha256"],
      "Runtime identity binding",
    )
    if (typeof binding.domain !== "string" || !domainSet.has(binding.domain)) {
      throw new RuntimeIdentityManifestError("Runtime identity binding domain is unknown")
    }
    const domain = binding.domain as CanonicalIdentityDomain
    if (byDomain.has(domain)) {
      throw new RuntimeIdentityManifestError(`Runtime identity binding ${domain} is duplicated`)
    }
    if (typeof binding.publicId !== "string" || !PUBLIC_ID.test(binding.publicId)) {
      throw new RuntimeIdentityManifestError(`Runtime identity binding ${domain} public ID is invalid`)
    }
    if (publicIds.has(binding.publicId)) {
      throw new RuntimeIdentityManifestError(
        `Runtime identity public ID ${binding.publicId} is duplicated`,
      )
    }
    if (typeof binding.sha256 !== "string" || !SHA256.test(binding.sha256)) {
      throw new RuntimeIdentityManifestError(`Runtime identity binding ${domain} hash is invalid`)
    }
    publicIds.add(binding.publicId)
    byDomain.set(domain, {
      domain,
      publicId: binding.publicId,
      sha256: binding.sha256,
    })
  }
  if (byDomain.size !== CANONICAL_IDENTITY_DOMAIN_NAMES.length) {
    const missing = CANONICAL_IDENTITY_DOMAIN_NAMES.filter((domain) => !byDomain.has(domain))
    throw new RuntimeIdentityManifestError(
      `Runtime identity manifest is missing bindings: ${missing.join(", ")}`,
    )
  }
  return {
    schemaVersion: "runtime-identity-manifest-v1",
    profile: "runtime-identity-v1",
    bindings: CANONICAL_IDENTITY_DOMAIN_NAMES.map((domain) => byDomain.get(domain)!),
  }
}

export const parseRuntimeIdentityManifest = (
  input: RuntimeIdentityManifest,
): Readonly<RuntimeIdentityManifest> => {
  const normalized = normalizedManifest(input)
  return Object.freeze({
    schemaVersion: normalized.schemaVersion,
    profile: normalized.profile,
    bindings: Object.freeze(
      normalized.bindings.map((binding) => Object.freeze({ ...binding })),
    ),
  })
}

export const serializeRuntimeIdentityManifest = (
  manifest: RuntimeIdentityManifest,
): Uint8Array => {
  const normalized = parseRuntimeIdentityManifest(manifest)
  const encoded = encodeCanonicalJson({
    schemaVersion: normalized.schemaVersion,
    profile: normalized.profile,
    bindings: normalized.bindings.map((binding) => ({
      domain: binding.domain,
      publicId: binding.publicId,
      sha256: binding.sha256,
    })),
  }, {
    context: "canonical-manifest",
  })
  if (!encoded.ok) {
    throw new RuntimeIdentityManifestError(
      `Runtime identity manifest failed canonical encoding: ${encoded.error.code}`,
    )
  }
  return encoded.bytes
}

export const hashRuntimeIdentityManifest = (
  manifest: RuntimeIdentityManifest,
): string =>
  hashCanonicalIdentity("evidenceBundle", [serializeRuntimeIdentityManifest(manifest)])
