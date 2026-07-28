import type { RuntimeConformanceTrustedProducerV117 } from "./runtime-conformance-certificate-v1-17.js"

export const RUNTIME_CONFORMANCE_MANAGED_PRODUCER_ID_V1_17 =
  "cowards-runtime-conformance-producer-v1.37" as const
export const RUNTIME_CONFORMANCE_MANAGED_PRODUCER_KEY_ID_V1_17 =
  "cowards-runtime-conformance-key-v1.37" as const

const managedProducer = Object.freeze({
  producerId: RUNTIME_CONFORMANCE_MANAGED_PRODUCER_ID_V1_17,
  keyId: RUNTIME_CONFORMANCE_MANAGED_PRODUCER_KEY_ID_V1_17,
  trustDomain: "production" as const,
  managedIdentity: true as const,
  publicKeyPem:
    "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEACrtgWtY3yuYUpwQcFeHS0amVRBmGcGNXFsPXjvEt2qc=\n-----END PUBLIC KEY-----\n",
}) satisfies RuntimeConformanceTrustedProducerV117

/**
 * Public verification material only. The corresponding signing key is an
 * operator-protected input and is never committed, persisted, or rendered.
 */
export const RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17: readonly RuntimeConformanceTrustedProducerV117[] =
  Object.freeze([managedProducer])
