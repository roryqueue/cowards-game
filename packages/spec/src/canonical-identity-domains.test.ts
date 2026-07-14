import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  CANONICAL_IDENTITY_DOMAINS,
  CanonicalIdentityDomainError,
  frameCanonicalIdentity,
  hashCanonicalIdentity,
  hashCanonicalIdentityValue,
} from "./canonical-identity-domains.js"
import { RUNTIME_ABI_V1_17 } from "./runtime-abi-v1-17.js"

const repoRoot = path.resolve(import.meta.dirname, "../../..")
const protectedV116Files = {
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json":
    "9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97",
  "packages/spec/src/runtime-execution-service.ts":
    "9a0a0411056d06ce4b426b7749256460369124fa752c6c2f81912b8b0bfb31fc",
  "apps/go-backend/runtime_semantic_receipt.go":
    "36052047a870068ab81ced8c78f3b7f4e8130034a57ee8d16bc3873a50507d1d",
  "apps/go-backend/runtime_service_client.go":
    "8fdd3cbc206d2d7e1f77a3603a4f9ea5e664c5ab6f649c87d3e308d99556043f",
  "apps/go-backend/runtime_service_client_test.go":
    "4a52986d2a43598c0e9556504459143ab56d94d97b22b2296cf84067927e8185",
  "packages/persistence/migrations/0017_runtime_semantic_receipts.sql":
    "ac19e1d825217dfb72142685eb65e62933cea49541ceb39338235b32d2430a69",
} as const

describe("canonical successor identity domains", () => {
  it("closes all 15 names over unique frozen v1.17 tags", () => {
    expect(CANONICAL_IDENTITY_DOMAINS).toEqual(RUNTIME_ABI_V1_17.identity.domains)
    expect(Object.keys(CANONICAL_IDENTITY_DOMAINS)).toHaveLength(15)
    expect(new Set(Object.values(CANONICAL_IDENTITY_DOMAINS)).size).toBe(15)
  })

  it("pins unsigned-64-bit framing and one deterministic hash vector", () => {
    const framed = frameCanonicalIdentity("originalSource", [
      Buffer.from("alpha"),
      Uint8Array.from([0, 1, 2]),
    ])
    expect(Buffer.from(framed).toString("hex")).toBe(
      "0000000000000030636f77617264732d67616d653a72756e74696d652d6964656e746974793a76313a6f726967696e616c2d736f757263650000000000000005616c7068610000000000000003000102",
    )
    expect(hashCanonicalIdentity("originalSource", [Buffer.from("alpha"), Uint8Array.from([0, 1, 2])])).toBe(
      "f0e1417802b1efe7bafd10f878ebaad816d656b13bf8e91f4cbd11c670142436",
    )
  })

  it("separates segment and domain boundaries and rejects unknown domains", () => {
    expect(hashCanonicalIdentity("artifact", [Buffer.from("ab"), Buffer.from("c")])).not.toBe(
      hashCanonicalIdentity("artifact", [Buffer.from("a"), Buffer.from("bc")]),
    )
    expect(hashCanonicalIdentity("artifact", [Buffer.from("same")])).not.toBe(
      hashCanonicalIdentity("artifactManifest", [Buffer.from("same")]),
    )
    expect(() =>
      frameCanonicalIdentity("unknown" as "artifact", [Buffer.from("x")]),
    ).toThrow(CanonicalIdentityDomainError)
  })

  it("hashes canonical values independently of insertion order", () => {
    expect(
      hashCanonicalIdentityValue("normalizationPolicy", { z: 1, a: 2 }),
    ).toBe(hashCanonicalIdentityValue("normalizationPolicy", { a: 2, z: 1 }))
  })

  it("leaves all six historical v1.16 verifier inputs byte-identical", () => {
    for (const [relativePath, expected] of Object.entries(protectedV116Files)) {
      const actual = createHash("sha256")
        .update(readFileSync(path.join(repoRoot, relativePath)))
        .digest("hex")
      expect(actual, relativePath).toBe(expected)
    }
  })
})
