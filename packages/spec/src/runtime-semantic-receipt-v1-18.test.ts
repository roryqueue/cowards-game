import { generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  createRuntimeSemanticAdmissionClaimV118,
  createRuntimeSemanticTupleV118,
  type RuntimeExecutionServiceRequestV118,
  type RuntimeSemanticAdmissionClaimV118,
  type RuntimeSemanticReceiptV118,
} from "./runtime-execution-service-v1-18.js"
import {
  RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
  encodeRuntimeSemanticAdmissionClaimV118,
  parseRuntimeSemanticReceiptV118,
  projectPublicRuntimeSemanticReceiptV118,
  serializeRuntimeSemanticReceiptV118,
  verifyRuntimeSemanticReceiptV118,
} from "./runtime-semantic-receipt-v1-18.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const request = (): RuntimeExecutionServiceRequestV118 => ({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  kind: "executeMatch",
  requestId: "request:semantic-receipt:v1.18",
  matchId: "match:semantic-receipt:v1.18",
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
        strategyRevisionId: "private-source-secret-bottom",
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
        strategyRevisionId: "private-source-secret-top",
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
  match: { seed: "semantic-receipt-v1.18" },
})

const claim = (): RuntimeSemanticAdmissionClaimV118 =>
  createRuntimeSemanticAdmissionClaimV118({
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

const keys = (): {
  privateKey: KeyObject
  publicKeyPem: string
  keyId: string
} => {
  const generated = generateKeyPairSync("ed25519")
  return {
    privateKey: generated.privateKey,
    publicKeyPem: generated.publicKey.export({
      format: "pem",
      type: "spki",
    }) as string,
    keyId: "fixture-only:semantic-receipt:v1.18",
  }
}

const signedReceipt = (
  admissionClaim = claim(),
  key = keys(),
): {
  receipt: RuntimeSemanticReceiptV118
  receiptBytes: Uint8Array
  publicKeyPem: string
  keyId: string
} => {
  const receipt: RuntimeSemanticReceiptV118 = {
    claim: admissionClaim,
    algorithm: "Ed25519",
    keyId: key.keyId,
    signatureBase64: sign(
      null,
      encodeRuntimeSemanticAdmissionClaimV118(admissionClaim),
      key.privateKey,
    ).toString("base64"),
  }
  return {
    receipt,
    receiptBytes: serializeRuntimeSemanticReceiptV118(receipt),
    publicKeyPem: key.publicKeyPem,
    keyId: key.keyId,
  }
}

describe("runtime semantic receipt v1.18 spec authority", () => {
  it("encodes insertion-independent exact framed claim bytes", () => {
    const value = claim()
    const reversed = Object.fromEntries(
      Object.entries(value).reverse(),
    ) as unknown as RuntimeSemanticAdmissionClaimV118
    expect(encodeRuntimeSemanticAdmissionClaimV118(reversed)).toEqual(
      encodeRuntimeSemanticAdmissionClaimV118(value),
    )
    expect(
      new TextDecoder().decode(encodeRuntimeSemanticAdmissionClaimV118(value)),
    ).toContain("cowards-game:runtime-semantic-receipt:v1.18")
  })

  it("strictly parses only exact canonical closed receipt bytes", () => {
    const signed = signedReceipt()
    const admitted = parseRuntimeSemanticReceiptV118(signed.receiptBytes)
    expect(admitted).toEqual({
      ok: true,
      receipt: signed.receipt,
    })
    expect(admitted.ok && Object.isFrozen(admitted.receipt)).toBe(true)
    expect(
      admitted.ok &&
        Object.isFrozen(admitted.receipt.claim.certificateReferences),
    ).toBe(true)

    const parsed = JSON.parse(new TextDecoder().decode(signed.receiptBytes))
    const extra = new TextEncoder().encode(
      JSON.stringify({ ...parsed, diagnostics: "private-host-data" }),
    )
    expect(parseRuntimeSemanticReceiptV118(extra)).toEqual({
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    })
    const noncanonical = new TextEncoder().encode(
      JSON.stringify(parsed, null, 2),
    )
    expect(parseRuntimeSemanticReceiptV118(noncanonical)).toEqual({
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    })
    const crossVersion = new TextEncoder().encode(
      JSON.stringify({
        ...parsed,
        claim: {
          ...parsed.claim,
          schemaVersion: "runtime-semantic-receipt-v1.17",
        },
      }),
    )
    expect(parseRuntimeSemanticReceiptV118(crossVersion)).toEqual({
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    })
  })

  it("verifies Ed25519, key identity, and every expected semantic binding", () => {
    const signed = signedReceipt()
    expect(
      verifyRuntimeSemanticReceiptV118({
        receiptBytes: signed.receiptBytes,
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: signed.publicKeyPem,
        },
        expectedClaim: signed.receipt.claim,
      }),
    ).toEqual({
      ok: true,
      receipt: signed.receipt,
      publicProjection: projectPublicRuntimeSemanticReceiptV118(signed.receipt),
    })

    const wrongKey = keys()
    const mutations = [
      {
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: wrongKey.publicKeyPem,
        },
        expectedClaim: signed.receipt.claim,
      },
      {
        trustedKey: {
          keyId: "fixture-only:wrong-key:v1.18",
          publicKeyPem: signed.publicKeyPem,
        },
        expectedClaim: signed.receipt.claim,
      },
      {
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: signed.publicKeyPem,
        },
        expectedClaim: {
          ...signed.receipt.claim,
          transitionTraceRoot: hash("9"),
        },
      },
      {
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: signed.publicKeyPem,
        },
        expectedClaim: {
          ...signed.receipt.claim,
          certificateReferences: {
            bottom: signed.receipt.claim.certificateReferences.top,
            top: signed.receipt.claim.certificateReferences.bottom,
          },
        },
      },
      {
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: signed.publicKeyPem,
        },
        expectedClaim: {
          ...signed.receipt.claim,
          accounting: {
            ...signed.receipt.claim.accounting,
            ledgerPoststateRoot: hash("a"),
          },
        },
      },
    ]
    for (const mutation of mutations) {
      expect(
        verifyRuntimeSemanticReceiptV118({
          receiptBytes: signed.receiptBytes,
          ...mutation,
        }),
      ).toEqual({
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      })
    }
  })

  it("returns one privacy-safe system-owned failure for malformed keys, signatures, poison strings, and ownership drift", () => {
    const signed = signedReceipt()
    const parsed = JSON.parse(new TextDecoder().decode(signed.receiptBytes))
    for (const mutation of [
      { ...parsed, signatureBase64: "A".repeat(86) + "==" },
      { ...parsed, algorithm: "hmac-sha256" },
      {
        ...parsed,
        claim: {
          ...parsed.claim,
          result: {
            resultClass: "system_failure",
            ownership: "player",
            retryable: false,
            mutationStatus: "committed",
          },
        },
      },
    ]) {
      expect(
        verifyRuntimeSemanticReceiptV118({
          receiptBytes: new TextEncoder().encode(JSON.stringify(mutation)),
          trustedKey: {
            keyId: signed.keyId,
            publicKeyPem: signed.publicKeyPem,
          },
          expectedClaim: signed.receipt.claim,
        }),
      ).toEqual({
        ok: false,
        failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
      })
    }
    expect(
      verifyRuntimeSemanticReceiptV118({
        receiptBytes: signed.receiptBytes,
        trustedKey: {
          keyId: signed.keyId,
          publicKeyPem: "private-key-or-host-poison",
        },
        expectedClaim: signed.receipt.claim,
      }),
    ).toEqual({
      ok: false,
      failure: RUNTIME_SEMANTIC_RECEIPT_INVALID_FAILURE_V1_18,
    })
  })

  it("projects no source, artifact, memory, objective, diagnostics, host, trace body, signature, or key material", () => {
    const signed = signedReceipt()
    const projection = projectPublicRuntimeSemanticReceiptV118(signed.receipt)
    const serialized = JSON.stringify(projection)
    for (const forbidden of [
      "private-source-secret",
      "originalSource",
      "normalizedSource",
      "artifactSha",
      "identityManifest",
      "evidenceGraph",
      "laneIdentity",
      "memory",
      "objective",
      "diagnostics",
      "host",
      "signature",
      "publicKey",
      "keyId",
    ]) {
      expect(serialized).not.toContain(forbidden)
    }
    expect(projection.certificateReferences).toEqual({
      bottom: {
        certificateId: "certificate:bottom:v1.17",
        certificateRecordHash: hash("1"),
        registryGeneration: "23",
        lane: "typescript-linux-amd64",
        freshUntil: "2026-08-01T00:00:00.000Z",
      },
      top: {
        certificateId: "certificate:top:v1.17",
        certificateRecordHash: hash("8"),
        registryGeneration: "23",
        lane: "rust-linux-amd64",
        freshUntil: "2026-08-01T00:00:00.000Z",
      },
    })
  })

  it("contains no app dependency or Chronicle rule/reconstruction authority", () => {
    const source = readFileSync(
      new URL("./runtime-semantic-receipt-v1-18.ts", import.meta.url),
      "utf8",
    )
    for (const forbidden of [
      "apps/runtime-service",
      "packages/replay",
      "packages/engine",
      "parseChronicleEvent",
      "applyReplay",
      "validateCurrentReplayReconstruction",
      "issueRuntimeSemanticReceipt",
      "createPrivateKey",
      "privateKey",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
