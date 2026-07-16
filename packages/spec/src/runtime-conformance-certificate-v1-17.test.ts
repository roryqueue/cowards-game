import { generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17,
  encodeRuntimeConformanceCertificatePayloadV117,
  evaluateRuntimeConformanceFreshnessV117,
  requireAllFourConformanceLanesV117,
  verifyRuntimeConformanceCertificateV117,
  type RuntimeConformanceCertificatePayloadV117,
  type RuntimeConformanceCertificateV117,
  type RuntimeConformanceIdentityBindingsV117,
  type RuntimeConformanceLanguageIdV117,
  type RuntimeConformanceTrustedProducerV117,
} from "./runtime-conformance-certificate-v1-17.js"

const hash = (character: string): string =>
  `sha256:${character.repeat(64)}`

const baseIdentity = (
  languageId: RuntimeConformanceLanguageIdV117 = "typescript",
): RuntimeConformanceIdentityBindingsV117 => ({
  languageId,
  laneId: `lane:${languageId}:linux-cgroup-v2`,
  corpusRootSha256: hash("1"),
  caseInventorySha256: hash("2"),
  fixtureSourceSha256: hash(
    { typescript: "3", python: "4", rust: "5", zig: "6" }[languageId],
  ),
  artifactSha256: hash(
    { typescript: "7", python: "8", rust: "9", zig: "a" }[languageId],
  ),
  adapterBuildSha256: hash(
    { typescript: "b", python: "c", rust: "d", zig: "e" }[languageId],
  ),
  runtimeExecutableSha256: hash(
    { typescript: "f", python: "0", rust: "3", zig: "4" }[languageId],
  ),
  toolchainSha256: hash(
    { typescript: "5", python: "6", rust: "7", zig: "8" }[languageId],
  ),
  sysrootStdlibSha256: hash(
    { typescript: "9", python: "a", rust: "b", zig: "c" }[languageId],
  ),
  runtimeAbiVersion: "strategy-runtime-abi-v1.18",
  canonicalJsonProfileId: "canonical-json-v1.1",
  budgetPolicySha256: hash("d"),
  containmentPolicySha256: hash("e"),
  semanticTupleSha256: hash("f"),
  identityManifestRoot: hash("1"),
  evidenceGraphRoot: hash("2"),
  behaviorSettingsSha256: hash("3"),
})

const buildUnsigned = (
  languageId: RuntimeConformanceLanguageIdV117 = "typescript",
): RuntimeConformanceCertificatePayloadV117 => {
  const identity = baseIdentity(languageId)
  return {
    schemaVersion: "runtime-conformance-certificate-v1.17",
    certificateId: `certificate:${languageId}:generation-7`,
    certificateVersion: "runtime-conformance-certificate-v1.17",
    producerId: "fixture-managed-conformance-builder",
    producerKeyId: "fixture-managed-conformance-key",
    trustDomain: "fixture",
    managedIdentity: true,
    registryGeneration: "7",
    issuedAt: "2026-07-16T00:00:00.000Z",
    requestedValidUntil: "2026-09-01T00:00:00.000Z",
    freshUntil: "2026-08-10T00:00:00.000Z",
    identity,
    runs: [0, 1, 2].map((index) => ({
      runId: `run:${languageId}:${index + 1}`,
      workspaceId: `workspace:${languageId}:${index + 1}`,
      processId: `process:${languageId}:${index + 1}`,
      status: "passed" as const,
      complete: true,
      freshWorkspace: true,
      freshProcess: true,
      skippedCaseCount: 0,
      unsupportedCaseCount: 0,
      fallbackUsed: false,
      syntheticEvidence: false,
      caseCount: 64,
      startedAt: `2026-07-15T0${index}:00:00.000Z`,
      completedAt: `2026-07-15T0${index}:10:00.000Z`,
      validUntil: "2026-08-10T00:00:00.000Z",
      identity: globalThis.structuredClone(identity),
      resultRootSha256: hash("4"),
      evidenceRootSha256: hash("5"),
    })),
  }
}

const signFixture = (
  mutate?: (payload: RuntimeConformanceCertificatePayloadV117) => void,
  languageId: RuntimeConformanceLanguageIdV117 = "typescript",
) => {
  const keys = generateKeyPairSync("ed25519")
  const payload = buildUnsigned(languageId)
  mutate?.(payload)
  const certificate: RuntimeConformanceCertificateV117 = {
    ...payload,
    signatureBase64: sign(
      null,
      encodeRuntimeConformanceCertificatePayloadV117(payload),
      keys.privateKey,
    ).toString("base64"),
  }
  const producer: RuntimeConformanceTrustedProducerV117 = {
    producerId: payload.producerId,
    keyId: payload.producerKeyId,
    trustDomain: "fixture",
    managedIdentity: true,
    publicKeyPem: keys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  return { certificate, producer }
}

const verifyFixture = (
  fixture: ReturnType<typeof signFixture>,
  currentIdentity = fixture.certificate.identity,
  verificationInstant = "2026-07-20T00:00:00.000Z",
) =>
  verifyRuntimeConformanceCertificateV117({
    mode: "fixture",
    certificate: fixture.certificate,
    currentIdentity,
    verificationInstant,
    trustedProducers: [fixture.producer],
  })

const resignMutation = (
  mutate: (payload: RuntimeConformanceCertificatePayloadV117) => void,
) => signFixture(mutate)

describe("runtime conformance certificate v1.17", () => {
  it("verifies one immutable branded lane snapshot from exactly three fresh runs", () => {
    const fixture = signFixture()
    const verified = verifyFixture(fixture)
    expect(verified).toMatchObject({
      certificateId: fixture.certificate.certificateId,
      registryGeneration: "7",
      freshUntil: "2026-08-10T00:00:00.000Z",
      runIds: ["run:typescript:1", "run:typescript:2", "run:typescript:3"],
      resultRootSha256: hash("4"),
      evidenceRootSha256: hash("5"),
    })
    expect(Object.isFrozen(verified)).toBe(true)
    expect(Object.isFrozen(verified.identity)).toBe(true)
    expect(Object.isFrozen(verified.runIds)).toBe(true)
    expect(
      evaluateRuntimeConformanceFreshnessV117({
        certificate: verified,
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-08-10T00:00:00.000Z",
      }),
    ).toEqual({
      status: "current",
      reasonCode: "CURRENT",
      freshUntil: "2026-08-10T00:00:00.000Z",
    })
    expect(() =>
      evaluateRuntimeConformanceFreshnessV117({
        certificate: globalThis.structuredClone(verified),
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrow("UNVERIFIED_SNAPSHOT")
  })

  it.each([
    [
      "two runs",
      (value: RuntimeConformanceCertificatePayloadV117) => value.runs.pop(),
      "RUN_COUNT",
    ],
    [
      "duplicate run",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[1]!.runId = value.runs[0]!.runId
      },
      "RUN_INDEPENDENCE",
    ],
    [
      "duplicate workspace",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[1]!.workspaceId = value.runs[0]!.workspaceId
      },
      "RUN_INDEPENDENCE",
    ],
    [
      "duplicate process",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[1]!.processId = value.runs[0]!.processId
      },
      "RUN_INDEPENDENCE",
    ],
    [
      "incomplete",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.complete = false
      },
      "RUN_INCOMPLETE",
    ],
    [
      "skipped",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.skippedCaseCount = 1
      },
      "RUN_INCOMPLETE",
    ],
    [
      "unsupported",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.unsupportedCaseCount = 1
      },
      "RUN_INCOMPLETE",
    ],
    [
      "fallback",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.fallbackUsed = true
      },
      "RUN_INCOMPLETE",
    ],
    [
      "synthetic",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.syntheticEvidence = true
      },
      "RUN_INCOMPLETE",
    ],
    [
      "unavailable toolchain",
      (value: RuntimeConformanceCertificatePayloadV117) => {
        value.runs[0]!.status = "system_failure"
      },
      "RUN_SYSTEM_FAILURE",
    ],
  ] as const)("rejects %s without minting a lane", (_name, mutate, code) => {
    const fixture = resignMutation(mutate)
    try {
      verifyFixture(fixture)
      throw new Error("invalid certificate accepted")
    } catch (error) {
      expect((error as { code?: string }).code).toBe(code)
    }
  })

  it("rejects every identity, result, and evidence disagreement across runs", () => {
    for (const field of Object.keys(baseIdentity()) as Array<
      keyof RuntimeConformanceIdentityBindingsV117
    >) {
      const fixture = resignMutation((value) => {
        const current = value.runs[1]!.identity[field]
        value.runs[1]!.identity[field] =
          (typeof current === "string"
            ? `${current}:mutation`
            : current) as never
      })
      expect(() => verifyFixture(fixture)).toThrow("RUN_IDENTITY_MISMATCH")
    }

    for (const field of [
      "resultRootSha256",
      "evidenceRootSha256",
    ] as const) {
      const fixture = resignMutation((value) => {
        value.runs[2]![field] = hash("6")
      })
      expect(() => verifyFixture(fixture)).toThrow("RUN_ROOT_MISMATCH")
    }
  })

  it("stales immediately on current binding drift and after the minimum 30-day-capped validity", () => {
    const fixture = signFixture()
    const verified = verifyFixture(fixture)
    const changed = globalThis.structuredClone(fixture.certificate.identity)
    changed.adapterBuildSha256 = hash("6")
    expect(
      evaluateRuntimeConformanceFreshnessV117({
        certificate: verified,
        currentIdentity: changed,
        verificationInstant: "2026-07-20T00:00:00.000Z",
      }),
    ).toEqual({
      status: "stale",
      reasonCode: "IDENTITY_CHANGED",
      freshUntil: "2026-08-10T00:00:00.000Z",
    })
    expect(
      evaluateRuntimeConformanceFreshnessV117({
        certificate: verified,
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-08-10T00:00:00.001Z",
      }),
    ).toEqual({
      status: "stale",
      reasonCode: "EXPIRED",
      freshUntil: "2026-08-10T00:00:00.000Z",
    })

    const wrongFreshness = resignMutation((value) => {
      value.freshUntil = "2026-08-16T00:00:00.000Z"
      value.runs.forEach((run) => {
        run.validUntil = "2026-09-01T00:00:00.000Z"
      })
    })
    expect(() => verifyFixture(wrongFreshness)).toThrow("FRESHNESS")
  })

  it("rejects invalid signatures, open shapes, and caller trust in production", () => {
    const fixture = signFixture()
    const badSignature = {
      ...fixture.certificate,
      signatureBase64: `${fixture.certificate.signatureBase64}\n`,
    }
    expect(() =>
      verifyRuntimeConformanceCertificateV117({
        mode: "fixture",
        certificate: badSignature,
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-07-20T00:00:00.000Z",
        trustedProducers: [fixture.producer],
      }),
    ).toThrow("SIGNATURE")

    const open = {
      ...fixture.certificate,
      readiness: "passed",
    } as RuntimeConformanceCertificateV117
    expect(() =>
      verifyRuntimeConformanceCertificateV117({
        mode: "fixture",
        certificate: open,
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-07-20T00:00:00.000Z",
        trustedProducers: [fixture.producer],
      }),
    ).toThrow("STRICT_SHAPE")

    expect(RUNTIME_CONFORMANCE_TRUSTED_PRODUCERS_V1_17).toEqual([])
    expect(() =>
      verifyRuntimeConformanceCertificateV117({
        mode: "production",
        certificate: fixture.certificate,
        currentIdentity: fixture.certificate.identity,
        verificationInstant: "2026-07-20T00:00:00.000Z",
        trustedProducers: [fixture.producer],
      }),
    ).toThrow("UNTRUSTED_PRODUCER")
  })

  it("promotes lanes independently but closes the phase only with all four current lanes", () => {
    const languages = ["typescript", "python", "rust", "zig"] as const
    const fixtures = languages.map((languageId) => signFixture(undefined, languageId))
    const verified = fixtures.map((fixture) => verifyFixture(fixture))
    expect(verified.map(({ identity }) => identity.languageId)).toEqual(languages)

    expect(() =>
      requireAllFourConformanceLanesV117({
        certificates: verified.slice(0, 3),
        currentIdentities: fixtures.slice(0, 3).map(({ certificate }) => certificate.identity),
        verificationInstant: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrow("ALL_FOUR_REQUIRED")

    const closure = requireAllFourConformanceLanesV117({
      certificates: verified,
      currentIdentities: fixtures.map(({ certificate }) => certificate.identity),
      verificationInstant: "2026-07-20T00:00:00.000Z",
    })
    expect(closure.languageIds).toEqual(languages)
    expect(closure.corpusRootSha256).toBe(hash("1"))
    expect(Object.isFrozen(closure)).toBe(true)

    const mismatched = [...verified]
    const python = signFixture((value) => {
      value.identity.corpusRootSha256 = hash("6")
      value.runs.forEach((run) => {
        run.identity.corpusRootSha256 = hash("6")
      })
    }, "python")
    mismatched[1] = verifyFixture(python, python.certificate.identity)
    expect(() =>
      requireAllFourConformanceLanesV117({
        certificates: mismatched,
        currentIdentities: [
          fixtures[0]!.certificate.identity,
          python.certificate.identity,
          fixtures[2]!.certificate.identity,
          fixtures[3]!.certificate.identity,
        ],
        verificationInstant: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrow("COMMON_CRITERIA_MISMATCH")
  })
})
