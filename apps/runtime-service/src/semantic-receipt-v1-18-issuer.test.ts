import { generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticTupleV118,
  verifyRuntimeSemanticReceiptV118,
  type RuntimeExecutionServiceRequestV118,
} from "@cowards/spec"
import { describe, expect, it, vi } from "vitest"
import {
  issueRuntimeSemanticReceiptV118,
  type RuntimeSemanticReceiptSignerV118,
} from "./semantic-receipt-v1-18-issuer.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const request = (): RuntimeExecutionServiceRequestV118 => ({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  kind: "executeMatch",
  requestId: "request:issuer:v1.18",
  matchId: "match:issuer:v1.18",
  semanticTuple: createRuntimeSemanticTupleV118({
    rules: "cowards-rules-v1.4",
    engine: "engine-kernel-v1.37-candidate-1",
    runtimeAbi: "strategy-runtime-abi-v1.18",
    chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
    arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
    setPolicy: "canonical-set-policy-v1.4",
  }),
  authorityGeneration: "23",
  evaluationInstant: "2026-07-16T12:00:00.000Z",
  certificateReferences: {
    bottom: {
      side: "bottom",
      certificateId: "certificate:bottom:v1.17",
      certificateRecordHash: hash("1"),
      registryGeneration: "23",
      lane: "typescript-linux-amd64",
      freshUntil: "2026-08-01T00:00:00.000Z",
      sourceIdentity: {
        side: "bottom",
        strategyRevisionId: "strategy:bottom",
        originalSourceSha256: hash("2"),
        normalizedSourceSha256: hash("3"),
        artifactSha256: hash("4"),
        identityManifestRoot: hash("5"),
        evidenceGraphRoot: hash("6"),
        laneIdentityHash: hash("7"),
      },
    },
    top: {
      side: "top",
      certificateId: "certificate:top:v1.17",
      certificateRecordHash: hash("8"),
      registryGeneration: "23",
      lane: "rust-linux-amd64",
      freshUntil: "2026-08-01T00:00:00.000Z",
      sourceIdentity: {
        side: "top",
        strategyRevisionId: "strategy:top",
        originalSourceSha256: hash("9"),
        normalizedSourceSha256: hash("a"),
        artifactSha256: hash("b"),
        identityManifestRoot: hash("c"),
        evidenceGraphRoot: hash("d"),
        laneIdentityHash: hash("e"),
      },
    },
  },
  accounting: {
    budgetProfileRoot: hash("f"),
    ledgerPrestateRoot: hash("0"),
  },
  match: { seed: "issuer-v1.18" },
})

const keyPair = (): {
  readonly privateKey: KeyObject
  readonly signer: RuntimeSemanticReceiptSignerV118
} => {
  const key = generateKeyPairSync("ed25519")
  return {
    privateKey: key.privateKey,
    signer: {
      keyId: "runtime-service:semantic-receipt:v1.18",
      publicKeyPem: key.publicKey.export({
        format: "pem",
        type: "spki",
      }) as string,
      sign: (bytes) => sign(null, bytes, key.privateKey),
    },
  }
}

const admission = () => ({
  request: request(),
  chronicleCanonicalHash: hash("1"),
  transitionTraceRoot: hash("2"),
  finalStateCanonicalHash: hash("3"),
  outcomeCanonicalHash: hash("4"),
  terminal: { status: "complete", reason: "last-soldier-standing" },
  accounting: {
    budgetProfileRoot: hash("f"),
    ledgerPrestateRoot: hash("0"),
    ledgerPoststateRoot: hash("5"),
  },
})

describe("runtime-service v1.18 semantic receipt issuer", () => {
  it("signs only spec-owned claim bytes and immediately self-verifies", () => {
    const { signer } = keyPair()
    const signClaim = vi.fn(signer.sign)
    const issued = issueRuntimeSemanticReceiptV118({
      admission: admission(),
      signer: { ...signer, sign: signClaim },
    })

    expect(signClaim).toHaveBeenCalledTimes(1)
    expect(
      verifyRuntimeSemanticReceiptV118({
        receiptBytes: issued.receiptBytes,
        trustedKey: {
          keyId: signer.keyId,
          publicKeyPem: signer.publicKeyPem,
        },
        expectedClaim: issued.receipt.claim,
      }),
    ).toMatchObject({ ok: true })
  })

  it("rejects malformed, changed-claim, wrong-key, and forged signatures", () => {
    const first = keyPair()
    const second = keyPair()
    for (const signer of [
      { ...first.signer, sign: () => new Uint8Array(63) },
      { ...first.signer, sign: () => new Uint8Array(64) },
      {
        ...first.signer,
        publicKeyPem: second.signer.publicKeyPem,
      },
    ]) {
      expect(() =>
        issueRuntimeSemanticReceiptV118({
          admission: admission(),
          signer,
        }),
      ).toThrow(/signature|self-verification/u)
    }
  })

  it("never passes private keys or claims back into the signing callback", () => {
    const { signer } = keyPair()
    const observed: unknown[] = []
    issueRuntimeSemanticReceiptV118({
      admission: admission(),
      signer: {
        ...signer,
        sign(bytes) {
          observed.push(bytes)
          return signer.sign(bytes)
        },
      },
    })
    expect(observed).toHaveLength(1)
    expect(observed[0]).toBeInstanceOf(Uint8Array)
    expect(JSON.stringify(observed)).not.toMatch(
      /privateKey|source|artifact|memory|objective|diagnostics|stderr|host/iu,
    )
  })
})
