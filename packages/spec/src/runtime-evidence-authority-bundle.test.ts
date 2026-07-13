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
  encodeRuntimeEvidenceAuthorityPayload,
  evaluateRuntimeEvidenceAuthorityAntiRollback,
  hashRuntimeEvidenceAuthorityPayload,
  inspectRuntimeEvidenceAuthorityBundle,
  parseRuntimeEvidenceAuthorityHighWaterRecord,
  type RuntimeEvidenceAuthorityPayload,
} from "./runtime-evidence-authority-bundle.js"

const semanticTupleManifestHash = `sha256:${"1".repeat(64)}`
const laneIdentityHash = `sha256:${"2".repeat(64)}`
const attestationHash = `sha256:${"3".repeat(64)}`
const certificateRecordHash = `sha256:${"4".repeat(64)}`

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
  const envelope = buildRuntimeEvidenceAuthorityEnvelope({
    trustDomain,
    keyId: "fixture-ed25519-key",
    payloadBytes,
    signature: sign(null, payloadBytes, keys.privateKey),
  })
  return {
    keys,
    payloadBytes,
    serialized: `${JSON.stringify(envelope)}\n`,
  }
}

describe("runtime evidence authority bundle", () => {
  it("binds one bounded signed envelope to the exact payload bytes and hash", () => {
    const fixture = signedBundle()
    const inspected = inspectRuntimeEvidenceAuthorityBundle(
      fixture.serialized,
      {
        expectedTrustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
        evaluationInstant: "2026-07-12T12:00:00.000Z",
        trustedKeyIds: ["fixture-ed25519-key"],
        verifySignature: ({ payloadBytes, signature }) =>
          verify(null, payloadBytes, fixture.keys.publicKey, signature),
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
        payloadBytes,
        signature,
      }: {
        payloadBytes: Uint8Array
        signature: Uint8Array
      }) => verify(null, payloadBytes, fixture.keys.publicKey, signature),
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
        verifySignature: ({ payloadBytes, signature }) =>
          verify(null, payloadBytes, bundle.keys.publicKey, signature),
      }),
    ).toThrow(/conformance.*phase 259/i)
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
