import { Buffer } from "node:buffer"
import { generateKeyPairSync, sign, verify } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CANONICAL_COMPATIBILITY_TUPLES } from "./integrity-authority.js"
import { RuntimeExecutionEvidenceSnapshotSchema } from "./schemas.js"
import {
  RUNTIME_EVIDENCE_AUTHORITY_ATOMIC_REFRESH_CONTRACT,
  RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  assertRuntimeEvidenceAuthorityAnchorInstalled,
  buildRuntimeEvidenceAuthorityEnvelope,
  encodeRuntimeEvidenceAuthoritySignatureMessage,
  encodeRuntimeEvidenceAuthorityPayload,
  evaluateRuntimeEvidenceAuthorityAntiRollback,
  hashRuntimeEvidenceAuthorityPayload,
  inspectRuntimeEvidenceAuthorityBundle,
  parseRuntimeEvidenceAuthorityHighWaterRecord,
  hashRuntimeEvidenceCertificateRecordV117,
  parseRuntimeEvidenceAuthorityBindingV117,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
  encodeRuntimeEvidenceAuthorityPayloadV117,
  inspectRuntimeEvidenceAuthorityBundleV117,
  type RuntimeEvidenceAuthorityBindingV117,
  type RuntimeEvidenceAuthorityPayload,
  type RuntimeEvidenceAuthorityPayloadV117,
} from "./runtime-evidence-authority-bundle.js"
import { hashExecutableLaneIdentity } from "./runtime-evidence-attestation.js"

const semanticTupleManifestHash = CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId
const laneIdentity = {
  providerId: "fixture-provider",
  languageId: "typescript",
  runtimeId: "node",
  runtimeVersion: "26.0.0",
  toolchainId: "typescript",
  toolchainVersion: "6.0.3",
  adapterId: "worker-thread",
  adapterVersion: "1",
  policyId: "fixture-policy",
  policyVersion: "1",
  corpusId: "fixture-corpus",
  corpusVersion: "1",
  artifactId: "fixture-artifact",
  artifactSha256: "2".repeat(64),
  implementationId: "fixture-runtime-service",
  buildId: "fixture-build",
  semanticTupleId: CANONICAL_COMPATIBILITY_TUPLES[0]!.tupleId,
  semanticTuple: CANONICAL_COMPATIBILITY_TUPLES[0]!.tuple,
}
const laneIdentityHash = `sha256:${hashExecutableLaneIdentity(laneIdentity)}`
const attestationHash = `sha256:${"3".repeat(64)}`
const certificateRecordHash = `sha256:${"4".repeat(64)}`

const fixtureBindingV117 = (): RuntimeEvidenceAuthorityBindingV117 => ({
  graphSchemaVersion: "runtime-evidence-graph-v1.17",
  graphProfile: "runtime-identity-evidence-dag-v1",
  identityManifestRoot: `sha256:${"1".repeat(64)}`,
  evidenceGraphRoot: `sha256:${"2".repeat(64)}`,
  exactPins: [
    ["runtimeExecutableDigest", `sha256:${"3".repeat(64)}`],
    ["reportedVersion", "node-v26.0.0"],
    ["targetAbi", "linux-amd64-gnu"],
    ["compilerFlags", `sha256:${"4".repeat(64)}`],
    ["adapterBuildDigest", `sha256:${"5".repeat(64)}`],
    ["standardLibraryOrSysrootDigest", `sha256:${"6".repeat(64)}`],
    ["containmentPolicyId", "policy.containment.v1"],
    ["budgetProfileSha256", `sha256:${"7".repeat(64)}`],
    ["canonicalJsonProfileId", "canonical-json-v1.1"],
    ["behaviorSettingsHash", `sha256:${"8".repeat(64)}`],
  ],
})

const fixturePayload = (
  overrides: Partial<RuntimeEvidenceAuthorityPayload> = {},
): RuntimeEvidenceAuthorityPayload => ({
  schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  bundleVersion: "v1.37-fixture-bundle-v1",
  registryGeneration: "7",
  issuedAt: "2026-07-12T00:00:00.000Z",
  validFrom: "2026-07-12T00:00:00.000Z",
  validUntil: "2026-07-13T00:00:00.000Z",
  semanticTupleManifestHash,
  attestations: [],
  certificates: [],
  revocations: [],
  supersessions: [],
  operatorLaneDisables: [],
  ...overrides,
})

const signedBundle = (
  payload = fixturePayload(),
  trustDomain: string = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
) => {
  const keys = generateKeyPairSync("ed25519")
  const payloadBytes = encodeRuntimeEvidenceAuthorityPayload(payload)
  const signatureMessage = encodeRuntimeEvidenceAuthoritySignatureMessage({
    trustDomain,
    keyId: "fixture-ed25519-key",
    payloadBytes,
  })
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId: "fixture-ed25519-key",
    payloadBytes,
    signature: sign(null, signatureMessage, keys.privateKey),
  })
  return {
    keys,
    payloadBytes,
    serialized: `${JSON.stringify(envelope)}\n`,
  }
}

describe("runtime evidence authority bundle", () => {
  it("recomputes the complete public-safe v1.17 binding instead of trusting a shallow reference", () => {
    const binding = fixtureBindingV117()
    expect(parseRuntimeEvidenceAuthorityBindingV117(binding)).toEqual(binding)
    const first = hashRuntimeEvidenceCertificateRecordV117({
      certificateKind: "containment",
      certificateId: "certificate:v1.17:fixture",
      certificateVersion: "runtime-certificate-v1.17",
      attestationId: "attestation:v1.17:fixture",
      binding,
    })
    expect(first).toMatch(/^sha256:[0-9a-f]{64}$/u)
    const tampered = {
      ...binding,
      exactPins: binding.exactPins.map(
        ([name, value]) => [name, value] as [typeof name, string],
      ),
    }
    tampered.exactPins[0]![1] = `sha256:${"f".repeat(64)}`
    expect(
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "containment",
        certificateId: "certificate:v1.17:fixture",
        certificateVersion: "runtime-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding: tampered,
      }),
    ).not.toBe(first)
    expect(
      hashRuntimeEvidenceCertificateRecordV117({
        certificateKind: "conformance",
        certificateId: "certificate:v1.17:fixture",
        certificateVersion: "runtime-certificate-v1.17",
        attestationId: "attestation:v1.17:fixture",
        binding,
      }),
    ).not.toBe(first)
  })

  it.each([
    ["runtimeExecutableDigest", "not-a-hash"],
    ["reportedVersion", "latest"],
    ["targetAbi", "*"],
    ["compilerFlags", "x"],
    ["containmentPolicyId", "default"],
    ["canonicalJsonProfileId", "current"],
  ] as const)(
    "rejects floating or malformed %s authority pins",
    (name, value) => {
      const binding = fixtureBindingV117()
      const exactPins = binding.exactPins.map(
        ([pinName, pinValue]) =>
          [pinName, pinName === name ? value : pinValue] as const,
      )
      expect(() =>
        parseRuntimeEvidenceAuthorityBindingV117({ ...binding, exactPins }),
      ).toThrow(/binding/iu)
    },
  )

  it("signs and revalidates the exact v1.17 binding through the mounted envelope", () => {
    const binding = fixtureBindingV117()
    const attestationId = "attestation:v1.17:fixture"
    const certificateId = "certificate:v1.17:fixture"
    const certificateVersion = "runtime-certificate-v1.17"
    const payload = {
      schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION_V1_17,
      bundleVersion: "bundle:v1.17:fixture",
      registryGeneration: "7",
      issuedAt: "2026-07-14T00:00:00.000Z",
      validFrom: "2026-07-14T00:00:00.000Z",
      validUntil: "2026-07-15T00:00:00.000Z",
      semanticTupleManifestHash,
      sourceManifestHash: `sha256:${"9".repeat(64)}`,
      attestations: [
        {
          attestationId,
          attestationHash: `sha256:${"a".repeat(64)}`,
          producerId: "fixture-managed",
          producerKeyId: "fixture-key",
          trustDomain: "fixture" as const,
          managedIdentity: true as const,
          imports: [],
          binding,
        },
      ],
      certificates: [
        {
          certificateId,
          certificateVersion,
          certificateRecordHash: hashRuntimeEvidenceCertificateRecordV117({
            certificateKind: "containment",
            certificateId,
            certificateVersion,
            attestationId,
            binding,
          }),
          certificateKind: "containment" as const,
          attestationId,
          binding,
        },
      ],
    }
    const keys = generateKeyPairSync("ed25519")
    const payloadBytes = encodeRuntimeEvidenceAuthorityPayloadV117(payload)
    const trustDomain = RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture
    const keyId = "fixture-v1.17-key"
    const envelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain,
      keyId,
      payloadBytes,
      signature: sign(
        null,
        encodeRuntimeEvidenceAuthoritySignatureMessage({
          trustDomain,
          keyId,
          payloadBytes,
        }),
        keys.privateKey,
      ),
    })
    const inspected = inspectRuntimeEvidenceAuthorityBundleV117(
      JSON.stringify(envelope),
      {
        expectedTrustDomain: trustDomain,
        evaluationInstant: "2026-07-14T12:00:00.000Z",
        trustedKeyIds: [keyId],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, keys.publicKey, signature),
      },
    )
    expect(inspected.payload.certificates[0]?.binding).toEqual(binding)
    const confusedPayload: RuntimeEvidenceAuthorityPayloadV117 =
      globalThis.structuredClone(payload)
    confusedPayload.attestations[0]!.trustDomain = "production"
    const confusedBytes =
      encodeRuntimeEvidenceAuthorityPayloadV117(confusedPayload)
    const confusedEnvelope = buildRuntimeEvidenceAuthorityEnvelope({
      trustDomain,
      keyId,
      payloadBytes: confusedBytes,
      signature: sign(
        null,
        encodeRuntimeEvidenceAuthoritySignatureMessage({
          trustDomain,
          keyId,
          payloadBytes: confusedBytes,
        }),
        keys.privateKey,
      ),
    })
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundleV117(
        JSON.stringify(confusedEnvelope),
        {
          expectedTrustDomain: trustDomain,
          evaluationInstant: "2026-07-14T12:00:00.000Z",
          trustedKeyIds: [keyId],
          verifySignature: ({ signedMessageBytes, signature }) =>
            verify(null, signedMessageBytes, keys.publicKey, signature),
        },
      ),
    ).toThrow(/trust domain/iu)
    const tampered = globalThis.structuredClone(payload)
    tampered.certificates[0]!.binding = {
      ...tampered.certificates[0]!.binding,
      exactPins: tampered.certificates[0]!.binding.exactPins.map(
        ([name, value], index) =>
          [name, index === 9 ? `sha256:${"f".repeat(64)}` : value] as const,
      ),
    }
    expect(() => encodeRuntimeEvidenceAuthorityPayloadV117(tampered)).toThrow(
      /authority graph|certificate/iu,
    )
  })
  it("rejects impossible canonical instants and accepts real leap days", () => {
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayload(
        fixturePayload({ issuedAt: "2026-02-30T00:00:00.000Z" }),
      ),
    ).toThrow(/valid instant/i)
    expect(() =>
      encodeRuntimeEvidenceAuthorityPayload(
        fixturePayload({
          issuedAt: "2024-02-29T00:00:00.000Z",
          validFrom: "2024-02-29T00:00:00.000Z",
          validUntil: "2024-03-01T00:00:00.000Z",
        }),
      ),
    ).not.toThrow()
  })

  it("binds one bounded signed envelope to the exact payload bytes and hash", () => {
    const fixture = signedBundle()
    const inspected = inspectRuntimeEvidenceAuthorityBundle(
      fixture.serialized,
      {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, fixture.keys.publicKey, signature),
      },
    )

    expect(inspected.envelope.schemaVersion).toBe(
      RUNTIME_EVIDENCE_AUTHORITY_ENVELOPE_SCHEMA_VERSION,
    )
    expect(inspected.payload.registryGeneration).toBe("7")
    expect(inspected.payloadSha256).toBe(
      hashRuntimeEvidenceAuthorityPayload(fixture.payloadBytes),
    )
    expect(inspected.payloadBytes).toEqual(fixture.payloadBytes)
  })

  it("fails closed on trust, key, signature, freshness, and payload-hash drift", () => {
    const fixture = signedBundle()
    const base = {
      expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
      evaluationInstant: "2026-07-12T12:00:00.000Z",
      trustedKeyIds: ["fixture-ed25519-key"] as const,
      verifySignature: ({
        signedMessageBytes,
        signature,
      }: {
        signedMessageBytes: Uint8Array
        signature: Uint8Array
      }) => verify(null, signedMessageBytes, fixture.keys.publicKey, signature),
    }

    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
      }),
    ).toThrow(/trust domain/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        trustedKeyIds: [],
      }),
    ).toThrow(/unknown key/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        verifySignature: () => false,
      }),
    ).toThrow(/signature/i)
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(fixture.serialized, {
        ...base,
        evaluationInstant: "2026-07-14T00:00:00.000Z",
      }),
    ).toThrow(/validity/i)

    const parsed = JSON.parse(fixture.serialized) as Record<string, unknown>
    parsed.payloadSha256 = `sha256:${"f".repeat(64)}`
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(parsed), base),
    ).toThrow(/payload hash/i)
  })

  it("cryptographically binds envelope trust and key labels", () => {
    const fixture = signedBundle()
    const verifyWithSameKey = ({
      signedMessageBytes,
      signature,
    }: {
      signedMessageBytes: Uint8Array
      signature: Uint8Array
    }) => verify(null, signedMessageBytes, fixture.keys.publicKey, signature)

    const relabeledDomain = JSON.parse(fixture.serialized) as Record<
      string,
      unknown
    >
    relabeledDomain.trustDomain =
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(relabeledDomain), {
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: verifyWithSameKey,
      }),
    ).toThrow(/signature/i)

    const relabeledKey = JSON.parse(fixture.serialized) as Record<
      string,
      unknown
    >
    relabeledKey.keyId = "same-public-key-alias"
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(JSON.stringify(relabeledKey), {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["same-public-key-alias"],
        verifySignature: verifyWithSameKey,
      }),
    ).toThrow(/signature/i)
  })

  it("rejects dangling, duplicate, unverified, revoked, and production-conformance graphs", () => {
    const attestation = {
      attestationId: "attestation-1",
      attestationHash,
      verified: true,
      imports: [] as string[],
    }
    const certificate = {
      kind: "containment" as const,
      certificateId: "certificate-1",
      certificateVersion: "containment-v1",
      certificateRecordHash,
      laneIdentityHash,
      laneIdentity,
      issuedAt: "2026-07-12T00:00:00.000Z",
      freshUntil: "2026-07-13T00:00:00.000Z",
      attestationIds: [attestation.attestationId],
    }

    for (const payload of [
      fixturePayload({
        attestations: [{ ...attestation, imports: ["missing"] }],
      }),
      fixturePayload({ attestations: [attestation, { ...attestation }] }),
      fixturePayload({
        attestations: [{ ...attestation, verified: false }],
        certificates: [certificate],
      }),
      fixturePayload({
        attestations: [attestation],
        certificates: [certificate],
        revocations: [
          {
            certificateId: "missing",
            certificateRecordHash,
            revokedAt: "2026-07-12T06:00:00.000Z",
            reasonCode: "TEST_REVOCATION",
          },
        ],
      }),
    ]) {
      expect(() => signedBundle(payload)).toThrow(
        /dangling|duplicate|verified/i,
      )
    }

    const productionConformance = fixturePayload({
      attestations: [attestation],
      certificates: [{ ...certificate, kind: "conformance" }],
    })
    const bundle = signedBundle(
      productionConformance,
      RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
    )
    expect(() =>
      inspectRuntimeEvidenceAuthorityBundle(bundle.serialized, {
        expectedTrustDomain:
          RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.production,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: ({ signedMessageBytes, signature }) =>
          verify(null, signedMessageBytes, bundle.keys.publicKey, signature),
      }),
    ).toThrow(/conformance.*phase 259/i)
  })

  it("requires every signed certificate to cover the bundle interval", () => {
    const attestation = {
      attestationId: "attestation-validity",
      attestationHash,
      verified: true,
      imports: [] as string[],
    }
    const certificate = {
      kind: "containment" as const,
      certificateId: "certificate-validity",
      certificateVersion: "containment-v1",
      certificateRecordHash,
      laneIdentityHash,
      laneIdentity,
      issuedAt: "2026-07-12T00:00:00.000Z",
      freshUntil: "2026-07-13T00:00:00.000Z",
      attestationIds: [attestation.attestationId],
    }
    for (const invalid of [
      { ...certificate, issuedAt: "2026-07-12T00:00:00.001Z" },
      { ...certificate, freshUntil: "2026-07-12T23:59:59.999Z" },
    ]) {
      expect(() =>
        encodeRuntimeEvidenceAuthorityPayload(
          fixturePayload({
            attestations: [attestation],
            certificates: [invalid],
          }),
        ),
      ).toThrow(/cover the authority validity interval/i)
    }
  })

  it("requires exact bootstrap pins and durable monotonic high-water anchors", () => {
    const hash7 = `sha256:${"7".repeat(64)}`
    const hash8 = `sha256:${"8".repeat(64)}`
    const pin = {
      schemaVersion: "v1.37-runtime-evidence-authority-bootstrap-v1" as const,
      minimumRegistryGeneration: "7",
      minimumPayloadSha256: hash7,
    }

    const bootstrap = evaluateRuntimeEvidenceAuthorityAntiRollback({
      candidate: { registryGeneration: "7", payloadSha256: hash7 },
      bootstrapMode: true,
      deploymentPin: pin,
    })
    expect(bootstrap).toMatchObject({
      executable: false,
      durableInstallRequired: true,
    })
    expect(() =>
      assertRuntimeEvidenceAuthorityAnchorInstalled(bootstrap),
    ).toThrow(/durably installed/i)

    const anchor = parseRuntimeEvidenceAuthorityHighWaterRecord(
      JSON.stringify({
        schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_HIGH_WATER_SCHEMA_VERSION,
        registryGeneration: "7",
        payloadSha256: hash7,
      }),
    )
    expect(
      evaluateRuntimeEvidenceAuthorityAntiRollback({
        candidate: { registryGeneration: "7", payloadSha256: hash7 },
        bootstrapMode: false,
        deploymentPin: pin,
        durableHighWater: anchor,
      }),
    ).toMatchObject({ executable: true, durableInstallRequired: false })

    for (const candidate of [
      { registryGeneration: "6", payloadSha256: hash7 },
      { registryGeneration: "7", payloadSha256: hash8 },
    ]) {
      expect(() =>
        evaluateRuntimeEvidenceAuthorityAntiRollback({
          candidate,
          bootstrapMode: false,
          deploymentPin: pin,
          durableHighWater: anchor,
        }),
      ).toThrow(/rollback|fork|pin/i)
    }

    const next = evaluateRuntimeEvidenceAuthorityAntiRollback({
      candidate: { registryGeneration: "8", payloadSha256: hash8 },
      bootstrapMode: false,
      deploymentPin: pin,
      durableHighWater: anchor,
    })
    expect(next).toMatchObject({
      executable: false,
      durableInstallRequired: true,
      nextHighWater: {
        registryGeneration: "8",
        payloadSha256: hash8,
      },
    })
    expect(() =>
      parseRuntimeEvidenceAuthorityHighWaterRecord("{broken"),
    ).toThrow(/high-water/i)
  })

  it("specifies complete-file atomic replacement and one-descriptor reads", () => {
    expect(RUNTIME_EVIDENCE_AUTHORITY_ATOMIC_REFRESH_CONTRACT).toEqual({
      schemaVersion: "v1.37-runtime-evidence-authority-refresh-v1",
      writerSteps: [
        "write-complete-envelope-to-same-filesystem-temporary-file",
        "fsync-temporary-file",
        "close-temporary-file",
        "atomic-rename-over-authority-file",
        "fsync-parent-directory",
      ],
      readerSteps: [
        "open-authority-file-once-per-check",
        "read-to-eof-from-one-file-descriptor",
        "close-file-descriptor",
      ],
    })
  })

  it("allows execution requests to carry authority references but no trusted bodies", () => {
    const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
    const entrant = (side: "bottom" | "top") => ({
      entrantKey: `entrant:${side}`,
      strategyRevisionId: `revision:${side}`,
      laneIdentityHash: `sha256:${side === "bottom" ? "5" : "6"}`.padEnd(
        71,
        side === "bottom" ? "5" : "6",
      ),
      effectiveStatus: "exhibition_only" as const,
      schedulingDecisionId: `scheduling-decision:${side}`,
      schedulingDecisionHash: `sha256:${"a".repeat(64)}`,
      schedulingDecision: {
        status: "exhibition_only" as const,
        reasonCode: "CONFORMANCE_MISSING" as const,
        evaluatedAt: "2026-07-13T00:00:00.000Z",
        freshUntil: "2026-08-13T00:00:00.000Z",
        registryGeneration: "7",
      },
      containmentCertificateId: `containment:${side}`,
      containmentCertificateHash: `sha256:${"7".repeat(64)}`,
    })
    const snapshot = {
      compatibility: {
        tupleId: tuple.tupleId,
        tuple: { ...tuple.tuple },
      },
      authorityBundleHash: `sha256:${"9".repeat(64)}`,
      registryGeneration: "7",
      publication: {
        publicationId: "publication:authority-bundle-test",
        installReceiptId: "install-receipt:authority-bundle-test",
        payloadSha256: `sha256:${"9".repeat(64)}`,
        envelopeSha256: `sha256:${"b".repeat(64)}`,
        sourceManifestHash: `sha256:${"c".repeat(64)}`,
      },
      entrants: {
        bottom: entrant("bottom"),
        top: entrant("top"),
      },
    }

    expect(RuntimeExecutionEvidenceSnapshotSchema.parse(snapshot)).toEqual(
      snapshot,
    )
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            ...snapshot.entrants.bottom,
            effectiveStatus: "counted",
          },
        },
      }).success,
    ).toBe(false)
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            ...snapshot.entrants.bottom,
            effectiveStatus: "counted",
            schedulingDecision: {
              ...snapshot.entrants.bottom.schedulingDecision,
              status: "counted",
              reasonCode: "EVIDENCE_CURRENT",
            },
            conformanceCertificateId: "conformance:bottom",
            conformanceCertificateHash: `sha256:${"8".repeat(64)}`,
          },
        },
      }).success,
    ).toBe(true)
    expect(
      RuntimeExecutionEvidenceSnapshotSchema.safeParse({
        ...snapshot,
        entrants: {
          ...snapshot.entrants,
          bottom: {
            entrantKey: snapshot.entrants.bottom.entrantKey,
            strategyRevisionId: snapshot.entrants.bottom.strategyRevisionId,
            laneIdentityHash: snapshot.entrants.bottom.laneIdentityHash,
            effectiveStatus: "disabled",
            schedulingDecisionId: snapshot.entrants.bottom.schedulingDecisionId,
            schedulingDecisionHash:
              snapshot.entrants.bottom.schedulingDecisionHash,
            schedulingDecision: {
              ...snapshot.entrants.bottom.schedulingDecision,
              status: "disabled",
              reasonCode: "OPERATOR_DISABLED",
            },
          },
        },
      }).success,
    ).toBe(true)
    for (const forbidden of [
      { laneIdentity: { providerId: "request-echo" } },
      { containmentCertificateRef: { certificateId: "request-echo" } },
      { certificateBodies: [] },
      { graphNodes: [] },
      { signature: "request-echo" },
      { gateResults: [] },
      { purpose: "exhibition" },
    ]) {
      expect(
        RuntimeExecutionEvidenceSnapshotSchema.safeParse({
          ...snapshot,
          entrants: {
            ...snapshot.entrants,
            bottom: { ...snapshot.entrants.bottom, ...forbidden },
          },
        }).success,
      ).toBe(false)
    }
  })

  it("publishes byte-stable cross-language negative and anti-rollback vectors", () => {
    const vectors = JSON.parse(
      readFileSync(
        new URL(
          "../artifacts/v1.37-runtime-evidence-authority-vectors.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ) as {
      invalidEnvelopeVectors: {
        name: string
        envelope: { signatureBase64: string }
      }[]
      antiRollbackVectors: { name: string }[]
      authorityDecisionVectors: { name: string; expected: string }[]
      notice: string
      valid: {
        emptyProduction: {
          expected: {
            fixtureKeyAsProductionTrust: string
            grantsProductionConformance: boolean
          }
        }
      }
    }
    expect(vectors.invalidEnvelopeVectors.map((vector) => vector.name)).toEqual(
      ["bad-signature", "bad-payload-hash", "unknown-key", "stale", "future"],
    )
    expect(
      Buffer.from(
        vectors.invalidEnvelopeVectors[0]!.envelope.signatureBase64,
        "base64",
      ),
    ).toHaveLength(64)
    expect(vectors.antiRollbackVectors.map((vector) => vector.name)).toEqual([
      "exact-bootstrap",
      "restart-rollback",
      "same-generation-fork",
      "corrupt-anchor",
      "newer-generation",
    ])
    expect(
      vectors.authorityDecisionVectors.map(({ name, expected }) => ({
        name,
        expected,
      })),
    ).toEqual([
      { name: "disabled-runtime-request", expected: "reject-execution" },
      {
        name: "containment-only-exhibition",
        expected: "accept-reference",
      },
      {
        name: "counted-missing-conformance",
        expected: "reject-reference",
      },
      { name: "counted-complete", expected: "accept-reference" },
    ])
    expect(vectors.notice).toMatch(/fixture-only/i)
    expect(vectors.valid.emptyProduction.expected).toMatchObject({
      fixtureKeyAsProductionTrust: "reject-unknown-key",
      grantsProductionConformance: false,
    })
  })
})
