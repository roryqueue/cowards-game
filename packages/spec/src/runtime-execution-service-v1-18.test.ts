import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  RuntimeExecutionServiceRequestV118Schema,
  RuntimeExecutionServiceResponseV118Schema,
  createRuntimeSemanticAdmissionClaimV118,
  createRuntimeSemanticTupleV118,
  hashRuntimeExecutionServiceRequestV118,
  type RuntimeExecutionServiceRequestV118,
} from "./runtime-execution-service-v1-18.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const certificateReference = (side: "bottom" | "top") => ({
  side,
  certificateId: `certificate:fixture:${side}:v1.17`,
  certificateRecordHash: hash(side === "bottom" ? "1" : "2"),
  registryGeneration: "19",
  lane: side === "bottom" ? "typescript-linux-amd64" : "rust-linux-amd64",
  freshUntil: "2026-08-01T00:00:00.000Z",
  sourceIdentity: {
    strategyRevisionId: `strategy-revision:fixture:${side}`,
    originalSourceSha256: hash(side === "bottom" ? "3" : "4"),
    normalizedSourceSha256: hash(side === "bottom" ? "5" : "6"),
    artifactSha256: hash(side === "bottom" ? "7" : "8"),
    identityManifestRoot: hash(side === "bottom" ? "9" : "a"),
    evidenceGraphRoot: hash(side === "bottom" ? "b" : "c"),
    laneIdentityHash: hash(side === "bottom" ? "d" : "e"),
  },
})

const request = (): RuntimeExecutionServiceRequestV118 => ({
  contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
  kind: "executeMatch",
  requestId: "request:fixture:v1.18",
  matchId: "match:fixture:v1.18",
  semanticTuple: createRuntimeSemanticTupleV118({
      rules: "cowards-rules-v1.4",
      engine: "engine-kernel-v1.37-candidate-1",
      runtimeAbi: "strategy-runtime-abi-v1.18",
      chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
      arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicy: "canonical-set-policy-v1.4",
  }),
  authorityGeneration: "19",
  evaluationInstant: "2026-07-16T00:00:00.000Z",
  certificateReferences: {
    bottom: certificateReference("bottom"),
    top: certificateReference("top"),
  },
  accounting: {
    budgetProfileRoot: hash("0"),
    ledgerPrestateRoot: hash("1"),
  },
  match: {
    seed: "fixture:v1.18",
    arenaVariantId: "arena:standard",
  },
})

const claim = () =>
  createRuntimeSemanticAdmissionClaimV118({
    request: request(),
    chronicleCanonicalHash: hash("2"),
    transitionTraceRoot: hash("3"),
    finalStateCanonicalHash: hash("4"),
    outcomeCanonicalHash: hash("5"),
    terminal: {
      status: "complete",
      reason: "last-soldier-standing",
    },
    accounting: {
      budgetProfileRoot: hash("0"),
      ledgerPrestateRoot: hash("1"),
      ledgerPoststateRoot: hash("6"),
    },
  })

describe("runtime execution service v1.18 additive contract", () => {
  it("strictly admits a trace-complete two-certificate request and response", () => {
    const value = request()
    expect(RuntimeExecutionServiceRequestV118Schema.parse(value)).toEqual(value)
    const admissionClaim = claim()
    const response = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
      ok: true,
      kind: "executionResult",
      requestId: value.requestId,
      matchId: value.matchId,
      result: {
        privacy: "public_receipt",
        chronicleCanonicalHash: admissionClaim.chronicleCanonicalHash,
        transitionTraceRoot: admissionClaim.transitionTraceRoot,
        finalStateCanonicalHash: admissionClaim.finalStateCanonicalHash,
        outcomeCanonicalHash: admissionClaim.outcomeCanonicalHash,
        terminal: admissionClaim.terminal,
        accounting: admissionClaim.accounting,
        resultClass: "success",
        ownership: "gameplay",
        retryable: false,
        mutationStatus: "committed",
        semanticReceipt: {
          claim: admissionClaim,
          algorithm: "Ed25519",
          keyId: "fixture-only:semantic-receipt:v1.18",
          signatureBase64: "A".repeat(86) + "==",
        },
      },
    }
    expect(RuntimeExecutionServiceResponseV118Schema.parse(response)).toEqual(
      response,
    )
  })

  it("rejects omissions, additions, singular certificate fields, and cross-version relabeling", () => {
    const value = request()
    const mutations: unknown[] = [
      { ...value, unexpected: "host-diagnostic" },
      { ...value, contractVersion: "runtime-execution-service-v1.17" },
      {
        ...value,
        certificateReferences: {
          bottom: value.certificateReferences.bottom,
        },
      },
      {
        ...value,
        certificate: value.certificateReferences.bottom,
      },
      {
        ...value,
        certificateId: value.certificateReferences.bottom.certificateId,
      },
    ]
    for (const mutation of mutations) {
      expect(
        RuntimeExecutionServiceRequestV118Schema.safeParse(mutation).success,
      ).toBe(false)
    }
  })

  it("rejects side swaps, duplicate references, generation drift, stale evidence, and every source mutation", () => {
    const value = request()
    const bottom = value.certificateReferences.bottom
    const top = value.certificateReferences.top
    const invalidReferences = [
      { bottom: top, top: bottom },
      { bottom, top: { ...bottom, side: "top" as const } },
      {
        bottom: { ...bottom, registryGeneration: "18" },
        top,
      },
      {
        bottom: { ...bottom, freshUntil: value.evaluationInstant },
        top,
      },
      { bottom: { ...bottom, lane: "runtime-latest" }, top },
    ]
    for (const certificateReferences of invalidReferences) {
      expect(
        RuntimeExecutionServiceRequestV118Schema.safeParse({
          ...value,
          certificateReferences,
        }).success,
      ).toBe(false)
    }

    for (const field of [
      "strategyRevisionId",
      "originalSourceSha256",
      "normalizedSourceSha256",
      "artifactSha256",
      "identityManifestRoot",
      "evidenceGraphRoot",
      "laneIdentityHash",
    ] as const) {
      expect(
        RuntimeExecutionServiceRequestV118Schema.safeParse({
          ...value,
          certificateReferences: {
            bottom: {
              ...bottom,
              sourceIdentity: {
                ...bottom.sourceIdentity,
                [field]:
                  field === "strategyRevisionId"
                    ? ""
                    : `sha256:${"A".repeat(64)}`,
              },
            },
            top,
          },
        }).success,
      ).toBe(false)
    }
  })

  it("binds the claim to request, trace, terminal, accounting, and no-mutation failure ownership", () => {
    const value = request()
    const admissionClaim = claim()
    expect(admissionClaim.requestSha256).toBe(
      hashRuntimeExecutionServiceRequestV118(value),
    )
    expect(admissionClaim.certificateReferences).toEqual(
      value.certificateReferences,
    )
    expect(admissionClaim.result).toEqual({
      resultClass: "success",
      ownership: "gameplay",
      retryable: false,
      mutationStatus: "committed",
    })

    const failure = {
      contractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_18,
      ok: false,
      kind: "systemFailure",
      requestId: value.requestId,
      matchId: value.matchId,
      systemFailure: {
        classification: "system_failure",
        ownership: "system_integrity",
        code: "SEMANTIC_RECEIPT_INVALID",
        publicMessage: "Runtime result could not be authenticated.",
        retryable: false,
        playerPenalty: false,
        mutationStatus: "none",
      },
    }
    expect(RuntimeExecutionServiceResponseV118Schema.parse(failure)).toEqual(
      failure,
    )
    expect(
      RuntimeExecutionServiceResponseV118Schema.safeParse({
        ...failure,
        systemFailure: {
          ...failure.systemFailure,
          mutationStatus: "committed",
        },
      }).success,
    ).toBe(false)
  })

  it("keeps immutable v1.16 and v1.17 sources, artifacts, and receipt domains exact", () => {
    const root = path.resolve(import.meta.dirname, "../../..")
    const expected = new Map([
      [
        "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5",
      ],
      [
        "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
        "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
      ],
      [
        "packages/spec/src/runtime-execution-service-v1-17.ts",
        "33608fca1ce710c33fff92a58e13d27fc2967dcc3a418f15284ec7f411b88806",
      ],
      [
        "apps/runtime-service/src/semantic-receipt-v1-17.ts",
        "7f5cfd09a5f22eb3d8b232f068f719fb23d7b15d82541367c225ba14af374126",
      ],
      [
        "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
        "f37eb9af3ba0dd290f2264c0fb047caf0f83f2ff757482dfd2767bf1221dbf03",
      ],
      [
        "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
        "e2683f4fe8f89f2362960115313826f3e922043346a14c649e0d9a0694e835ed",
      ],
      [
        "packages/spec/artifacts/runtime-execution-service-request.v1.17.json",
        "f37eb9af3ba0dd290f2264c0fb047caf0f83f2ff757482dfd2767bf1221dbf03",
      ],
      [
        "packages/spec/artifacts/runtime-execution-service-response.v1.17.wire.json",
        "e2683f4fe8f89f2362960115313826f3e922043346a14c649e0d9a0694e835ed",
      ],
    ])
    for (const [relative, digest] of expected) {
      expect(
        createHash("sha256")
          .update(readFileSync(path.join(root, relative)))
          .digest("hex"),
      ).toBe(digest)
    }
    expect(
      readFileSync(
        path.join(
          root,
          "packages/spec/src/runtime-execution-service-v1-17.ts",
        ),
        "utf8",
      ),
    ).toContain("cowards-game:runtime-semantic-receipt:v1.17")
  })
})
