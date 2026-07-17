import { readFileSync } from "node:fs"
import path from "node:path"
import { generateKeyPairSync, sign } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  encodeRuntimeConformanceCertificatePayloadV119,
  RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256,
  verifyRuntimeConformanceCertificateV119,
  type RuntimeConformanceCertificateV119,
  type RuntimeConformanceTrustedProducerV119,
} from "./runtime-conformance-certificate-v1-19.js"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const reviewedPath = (languageId: string): string =>
  path.join(
    repoRoot,
    `.planning/artifacts/v1.37-observation-v1.19-language-conformance-${languageId}.json`,
  )

const reviewed = (languageId = "typescript") =>
  JSON.parse(readFileSync(reviewedPath(languageId), "utf8")) as {
    candidatePayload: RuntimeConformanceCertificateV119["candidatePayload"]
    candidatePayloadSha256: string
    expectedRunBinding: {
      caseInventorySha256: string
      requiredCaseCount: number
      resultRootSha256: string
      evidenceRootSha256: string
    }
  }

const signed = (
  mutate?: (
    payload: RuntimeConformanceCertificateV119["candidatePayload"],
  ) => void,
  languageId = "typescript",
) => {
  const keys = generateKeyPairSync("ed25519")
  const candidate = reviewed(languageId)
  mutate?.(candidate.candidatePayload)
  const trustedProducer: RuntimeConformanceTrustedProducerV119 = {
    producerId: candidate.candidatePayload.producerId,
    keyId: candidate.candidatePayload.producerKeyId,
    trustDomain: "fixture",
    managedIdentity: true,
    publicKeyPem: keys.publicKey
      .export({ type: "spki", format: "pem" })
      .toString(),
  }
  const certificate: RuntimeConformanceCertificateV119 = {
    schemaVersion: "runtime-conformance-certificate-envelope-v1.19",
    trustDomain: "fixture",
    managedIdentity: true,
    candidatePayload: candidate.candidatePayload,
    candidatePayloadSha256:
      RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256[
        languageId as keyof typeof RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256
      ],
    signatureBase64: sign(
      null,
      encodeRuntimeConformanceCertificatePayloadV119(
        candidate.candidatePayload,
      ),
      keys.privateKey,
    ).toString("base64"),
  }
  return { candidate, certificate, trustedProducer }
}

const verify = (fixture: ReturnType<typeof signed>) =>
  verifyRuntimeConformanceCertificateV119({
    mode: "fixture",
    certificate: fixture.certificate,
    expectedIdentity: fixture.candidate.candidatePayload.identity,
    expectedRunBinding: fixture.candidate.expectedRunBinding,
    verificationInstant: fixture.candidate.candidatePayload.issuedAt,
    trustedProducers: [fixture.trustedProducer],
  })

describe("runtime conformance certificate v1.19", () => {
  it("verifies an exact reviewed inactive candidate and freezes its snapshot", () => {
    const fixture = signed()
    const snapshot = verify(fixture)
    expect(snapshot).toMatchObject({
      certificateId: fixture.candidate.candidatePayload.certificateId,
      certificateVersion: "runtime-conformance-certificate-v1.19",
      languageId: "typescript",
      status: "inactive",
      runCount: 3,
      candidatePayloadSha256:
        RUNTIME_CONFORMANCE_V119_REVIEWED_PAYLOAD_SHA256.typescript,
    })
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(Object.isFrozen(snapshot.identity)).toBe(true)
    expect(Object.isFrozen(snapshot.runIds)).toBe(true)
  })

  it.each([
    [
      "current corpus substitution",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.candidateBindings.corpus.current = true as false
      },
      "CANDIDATE_AUTHORITY_MISMATCH",
    ],
    [
      "old ABI",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.identity.runtimeAbiVersion = "strategy-runtime-abi-v1.17"
        for (const run of payload.runs)
          run.identity.runtimeAbiVersion = "strategy-runtime-abi-v1.17"
      },
      "CANDIDATE_AUTHORITY_MISMATCH",
    ],
    [
      "Phase-259 corpus",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.candidateBindings.corpus.version = "v2" as never
      },
      "CANDIDATE_AUTHORITY_MISMATCH",
    ],
    [
      "trace pin substitution",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.candidateBindings.trace.pinFileSha256 =
          `sha256:${"0".repeat(64)}` as never
      },
      "CANDIDATE_AUTHORITY_MISMATCH",
    ],
    [
      "Workshop pin substitution",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.candidateBindings.workshop.pinFileSha256 =
          `sha256:${"0".repeat(64)}` as never
      },
      "CANDIDATE_AUTHORITY_MISMATCH",
    ],
    [
      "wrong lane",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.identity.languageId = "python"
      },
      "RUN_IDENTITY_MISMATCH",
    ],
    [
      "skipped case",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.runs[0]!.skippedCaseCount = 1
      },
      "RUN_INCOMPLETE",
    ],
    [
      "fallback",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.runs[0]!.fallbackUsed = true
      },
      "RUN_INCOMPLETE",
    ],
    [
      "synthetic evidence",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.runs[0]!.syntheticEvidence = true
      },
      "RUN_INCOMPLETE",
    ],
    [
      "mixed toolchain identity",
      (payload: RuntimeConformanceCertificateV119["candidatePayload"]) => {
        payload.runs[1]!.identity.toolchainSha256 = `sha256:${"0".repeat(64)}`
      },
      "RUN_IDENTITY_MISMATCH",
    ],
  ] as const)("rejects %s", (_name, mutate, code) => {
    const fixture = signed(mutate)
    expect(() => verify(fixture)).toThrow(expect.objectContaining({ code }))
  })

  it("rejects a wholly self-consistent but unreviewed identity and payload", () => {
    const fixture = signed((payload) => {
      payload.identity.adapterBuildSha256 = `sha256:${"0".repeat(64)}`
      for (const run of payload.runs) {
        run.identity.adapterBuildSha256 = payload.identity.adapterBuildSha256
      }
    })
    expect(() => verify(fixture)).toThrow(
      expect.objectContaining({ code: "REVIEWED_PAYLOAD_MISMATCH" }),
    )
  })

  it("rejects stale evidence and an invalid managed signature", () => {
    const fixture = signed()
    expect(() =>
      verifyRuntimeConformanceCertificateV119({
        mode: "fixture",
        certificate: fixture.certificate,
        expectedIdentity: fixture.candidate.candidatePayload.identity,
        expectedRunBinding: fixture.candidate.expectedRunBinding,
        verificationInstant: "2026-09-01T00:00:00.000Z",
        trustedProducers: [fixture.trustedProducer],
      }),
    ).toThrow(expect.objectContaining({ code: "FRESHNESS" }))

    fixture.certificate.signatureBase64 = `${fixture.certificate.signatureBase64.slice(0, -1)}A`
    expect(() => verify(fixture)).toThrow(
      expect.objectContaining({ code: "SIGNATURE" }),
    )
  })
})
