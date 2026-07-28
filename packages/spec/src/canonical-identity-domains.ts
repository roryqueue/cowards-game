import { createHash } from "node:crypto"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { RUNTIME_ABI_V1_17 } from "./runtime-abi-v1-17.js"
import type { JsonValue } from "./types.js"

export const CANONICAL_IDENTITY_DOMAINS = Object.freeze({
  ...RUNTIME_ABI_V1_17.identity.domains,
})

export type CanonicalIdentityDomain = keyof typeof CANONICAL_IDENTITY_DOMAINS

export const CANONICAL_IDENTITY_DOMAIN_NAMES = Object.freeze(
  Object.keys(CANONICAL_IDENTITY_DOMAINS) as CanonicalIdentityDomain[],
)

export class CanonicalIdentityDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CanonicalIdentityDomainError"
  }
}

const textEncoder = new TextEncoder()

const requireDomainTag = (domain: CanonicalIdentityDomain): string => {
  if (!Object.hasOwn(CANONICAL_IDENTITY_DOMAINS, domain)) {
    throw new CanonicalIdentityDomainError(`Unknown canonical identity domain: ${domain}`)
  }
  return CANONICAL_IDENTITY_DOMAINS[domain]
}

const framedLength = (length: number): Uint8Array => {
  const output = new Uint8Array(8)
  new DataView(output.buffer).setBigUint64(0, BigInt(length), false)
  return output
}

export const frameCanonicalIdentity = (
  domain: CanonicalIdentityDomain,
  segments: readonly Uint8Array[],
): Uint8Array => {
  const ordered = [textEncoder.encode(requireDomainTag(domain)), ...segments]
  const total = ordered.reduce((length, segment) => length + 8 + segment.byteLength, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const segment of ordered) {
    output.set(framedLength(segment.byteLength), offset)
    offset += 8
    output.set(segment, offset)
    offset += segment.byteLength
  }
  return output
}

export const hashCanonicalIdentity = (
  domain: CanonicalIdentityDomain,
  segments: readonly Uint8Array[],
): string =>
  createHash("sha256")
    .update(frameCanonicalIdentity(domain, segments))
    .digest("hex")

export const hashCanonicalIdentityValue = (
  domain: CanonicalIdentityDomain,
  value: JsonValue,
): string => {
  const encoded = encodeCanonicalJson(value, { context: "canonical-manifest" })
  if (!encoded.ok) {
    throw new CanonicalIdentityDomainError(
      `Canonical identity value failed encoding: ${encoded.error.code}`,
    )
  }
  return hashCanonicalIdentity(domain, [encoded.bytes])
}
