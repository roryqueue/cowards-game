import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
  type RuntimeExecutionServiceRequestV117,
  type RuntimeExecutionServiceSuccessResponseV117,
} from "@cowards/spec"
import {
  issueRuntimeSemanticReceiptV117,
  verifyRuntimeSemanticReceiptV117,
} from "./semantic-receipt-v1-17.js"

const root = path.resolve(import.meta.dirname, "../../..")
const request = JSON.parse(
  readFileSync(
    path.join(
      root,
      "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json",
    ),
    "utf8",
  ),
) as RuntimeExecutionServiceRequestV117
const response = JSON.parse(
  readFileSync(
    path.join(
      root,
      "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json",
    ),
    "utf8",
  ),
) as RuntimeExecutionServiceSuccessResponseV117
const secret = "fixture-only:runtime-service-v1.17:secret"

describe("runtime semantic receipt v1.17", () => {
  it("verifies the full-service golden and every authority/accounting/result binding", () => {
    expect(
      verifyRuntimeSemanticReceiptV117({ request, response, secret }),
    ).toMatchObject({
      schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
      requestId: request.requestId,
      bottomEvidenceGraphRoot: request.entrants.bottom.evidenceGraphRoot,
      topEvidenceGraphRoot: request.entrants.top.evidenceGraphRoot,
      ledgerPrestateRoot: request.accounting.ledgerPrestateRoot,
      ledgerPoststateRoot: response.result.ledgerPoststateRoot,
    })
  })

  it("mints insertion-independent claims from canonical result values", () => {
    const issued = issueRuntimeSemanticReceiptV117({
      request,
      chronicle: response.result.chronicle,
      finalState: response.result.finalState,
      outcome: response.result.outcome,
      ledgerPoststateRoot: response.result.ledgerPoststateRoot,
      reconstructedTerminalStateHash:
        response.result.semanticReceipt.reconstructedTerminalStateHash,
      runtimeViolationEventCount: response.result.runtimeViolationEventCount,
      secret,
    })
    expect(issued).toEqual(response.result.semanticReceipt)
  })

  it.each([
    [
      "request graph",
      (candidate: RuntimeExecutionServiceRequestV117) => {
        candidate.entrants.bottom.evidenceGraphRoot = `sha256:${"f".repeat(64)}`
      },
    ],
    [
      "request budget",
      (candidate: RuntimeExecutionServiceRequestV117) => {
        candidate.accounting.budgetProfileSha256 = `sha256:${"f".repeat(64)}`
      },
    ],
  ] as const)("rejects a signed-looking %s substitution", (_name, mutate) => {
    const tampered = globalThis.structuredClone(request)
    mutate(tampered)
    expect(() =>
      verifyRuntimeSemanticReceiptV117({ request: tampered, response, secret }),
    ).toThrow(/unavailable/iu)
  })

  it("rejects v1.16 relabeling, unknown versions, and invocation/service confusion", () => {
    const tampered = globalThis.structuredClone(response)
    tampered.result.semanticReceipt.schemaVersion =
      "runtime-semantic-receipt-v1" as typeof RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17
    expect(() =>
      verifyRuntimeSemanticReceiptV117({ request, response: tampered, secret }),
    ).toThrow(/unavailable/iu)

    const invocation = JSON.parse(
      readFileSync(
        path.join(
          root,
          "packages/spec/artifacts/runtime-invocation-response.v1.17.candidate.wire.json",
        ),
        "utf8",
      ),
    )
    expect(() =>
      verifyRuntimeSemanticReceiptV117({
        request,
        response: invocation,
        secret,
      }),
    ).toThrow(/unavailable/iu)
  })

  it("fails safely on partial input and rejects unbound private response fields", () => {
    expect(() =>
      verifyRuntimeSemanticReceiptV117({
        request: {
          contractVersion: "runtime-execution-service-v1.17",
          kind: "executeMatch",
          requestId: request.requestId,
          matchId: request.matchId,
        } as RuntimeExecutionServiceRequestV117,
        response,
        secret,
      }),
    ).toThrow("Runtime semantic receipt v1.17 is unavailable.")
    const extra = globalThis.structuredClone(
      response,
    ) as RuntimeExecutionServiceSuccessResponseV117 & {
      result: RuntimeExecutionServiceSuccessResponseV117["result"] & {
        diagnostics: { hostPath: string }
      }
    }
    extra.result.diagnostics = { hostPath: "/private/host/path" }
    expect(() =>
      verifyRuntimeSemanticReceiptV117({ request, response: extra, secret }),
    ).toThrow("Runtime semantic receipt v1.17 is unavailable.")
  })

  it("rejects an unsafe registry generation at issue and verification boundaries", () => {
    const unsafeRequest = globalThis.structuredClone(request)
    unsafeRequest.authority.registryGeneration = "9999999999999999"
    expect(() => {
      const semanticReceipt = issueRuntimeSemanticReceiptV117({
        request: unsafeRequest,
        chronicle: response.result.chronicle,
        finalState: response.result.finalState,
        outcome: response.result.outcome,
        ledgerPoststateRoot: response.result.ledgerPoststateRoot,
        reconstructedTerminalStateHash:
          response.result.semanticReceipt.reconstructedTerminalStateHash,
        runtimeViolationEventCount: response.result.runtimeViolationEventCount,
        secret,
      })
      verifyRuntimeSemanticReceiptV117({
        request: unsafeRequest,
        response: {
          ...response,
          result: { ...response.result, semanticReceipt },
        },
        secret,
      })
    }).toThrow("Runtime semantic receipt v1.17 is unavailable.")
  })
})
