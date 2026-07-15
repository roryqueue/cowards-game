import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
  RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17,
  RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
  encodeRuntimeSemanticReceiptClaimsV117,
  type RuntimeSemanticReceiptClaimsV117,
} from "./runtime-execution-service-v1-17.js"

const hash = (pathName: string): string =>
  createHash("sha256").update(readFileSync(pathName)).digest("hex")

const claims = (): RuntimeSemanticReceiptClaimsV117 => ({
  schemaVersion: RUNTIME_SEMANTIC_RECEIPT_SCHEMA_VERSION_V1_17,
  profile: "canonical-full-service-v1",
  serviceContractVersion: RUNTIME_EXECUTION_SERVICE_VERSION_V1_17,
  requestSha256: `sha256:${"1".repeat(64)}`,
  requestId: "request:v1.17:fixture",
  matchId: "match:v1.17:fixture",
  compatibilityTupleId: `sha256:${"2".repeat(64)}`,
  authorityBundleHash: `sha256:${"3".repeat(64)}`,
  authoritySourceManifestHash: `sha256:${"4".repeat(64)}`,
  registryGeneration: "7",
  bottomIdentityManifestRoot: `sha256:${"5".repeat(64)}`,
  bottomEvidenceGraphRoot: `sha256:${"6".repeat(64)}`,
  topIdentityManifestRoot: `sha256:${"7".repeat(64)}`,
  topEvidenceGraphRoot: `sha256:${"8".repeat(64)}`,
  budgetProfileSha256: `sha256:${"9".repeat(64)}`,
  ledgerPrestateRoot: `sha256:${"a".repeat(64)}`,
  ledgerPoststateRoot: `sha256:${"b".repeat(64)}`,
  chronicleCanonicalHash: `sha256:${"c".repeat(64)}`,
  finalStateCanonicalHash: `sha256:${"d".repeat(64)}`,
  reconstructedTerminalStateHash: `sha256:${"e".repeat(64)}`,
  outcomeCanonicalHash: `sha256:${"f".repeat(64)}`,
  runtimeViolationEventCount: 0,
  algorithm: "hmac-sha256",
  keyId: "runtime-service-semantic-receipt:v1.17",
})

describe("runtime execution service v1.17 additive contract", () => {
  it("uses a new u64-framed receipt domain and canonical insertion-independent claims", () => {
    const value = claims()
    const reversed = Object.fromEntries(Object.entries(value).reverse()) as unknown as RuntimeSemanticReceiptClaimsV117
    expect(encodeRuntimeSemanticReceiptClaimsV117(reversed)).toEqual(
      encodeRuntimeSemanticReceiptClaimsV117(value),
    )
    expect(new TextDecoder().decode(encodeRuntimeSemanticReceiptClaimsV117(value))).not.toContain(
      RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17,
    )
    expect(encodeRuntimeSemanticReceiptClaimsV117(value).subarray(8, 8 + RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17.length)).toEqual(
      new TextEncoder().encode(RUNTIME_SEMANTIC_RECEIPT_DOMAIN_V1_17),
    )
  })

  it("keeps every immutable v1.16 source and artifact hash exact", () => {
    const root = path.resolve(import.meta.dirname, "../../..")
    const expected = new Map([
      ["packages/spec/artifacts/runtime-execution-service-request.v1.16.json", "5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5"],
      ["packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json", "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97"],
      ["packages/spec/src/runtime-execution-service.ts", "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc"],
      ["apps/runtime-service/src/semantic-receipt.ts", "f97482bc8bdd555c0c79a2393745808e179dd1590d4ad016974a75586f0422ec"],
      ["apps/go-backend/runtime_semantic_receipt.go", "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d"],
      ["apps/go-backend/runtime_service_client.go", "9c72e5b0ee3ddfb36a7aec51a5a1ead508b2fae29eace27a73b9fda7d55ce23c"],
      ["apps/go-backend/runtime_service_client_test.go", "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185"],
      ["packages/persistence/migrations/0017_runtime_semantic_receipts.sql", "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69"],
    ])
    for (const [relative, digest] of expected) expect(hash(path.join(root, relative))).toBe(digest)
  })
})
