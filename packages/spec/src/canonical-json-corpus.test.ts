import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { parseCanonicalJson } from "./canonical-json-parse.js"
import type {
  CanonicalJsonContext,
  CanonicalJsonLimits,
  CanonicalJsonScanOptions,
} from "./canonical-json-scan.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)
const indexPath = path.join(
  repoRoot,
  "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json",
)

interface CorpusVector {
  id: string
  context: CanonicalJsonContext
  operation: CanonicalJsonScanOptions["operation"] | "host-encode"
  rawPath: string
  rawByteLength: number
  rawSha256: string
  limits: CanonicalJsonLimits
  expectation:
    | {
        kind: "success"
        canonicalPath: string
        canonicalByteLength: number
        canonicalSha256: string
      }
    | {
        kind: "error"
        code: string
        path: readonly (string | number)[]
        byteOffset: number
        owner: "player_violation" | "system_failure"
      }
}

interface CorpusIndex {
  schemaVersion: string
  vectorRootDomain: string
  vectorRootSha256: string
  vectorCount: number
  vectors: readonly CorpusVector[]
}

const frame = (value: Uint8Array): Buffer => {
  const length = Buffer.alloc(8)
  length.writeBigUInt64BE(BigInt(value.byteLength))
  return Buffer.concat([length, Buffer.from(value)])
}

const digest = (value: Uint8Array): string =>
  createHash("sha256").update(value).digest("hex")

describe("canonical JSON v1.1 shared raw-byte corpus", () => {
  it("executes and enumerates every vector through the complete TypeScript codec", () => {
    const corpus = JSON.parse(readFileSync(indexPath, "utf8")) as CorpusIndex
    expect(corpus.schemaVersion).toBe("canonical-json-v1.1-corpus-v1")
    expect(corpus.vectors).toHaveLength(corpus.vectorCount)
    expect(corpus.vectorCount).toBeGreaterThan(0)

    const root = createHash("sha256")
    root.update(frame(Buffer.from(corpus.vectorRootDomain)))
    const enumeration = createHash("sha256")
    enumeration.update(frame(Buffer.from("cowards-game:canonical-json-v1.1-enumeration:v1")))
    const ids = new Set<string>()
    let previousID = ""

    for (const vector of corpus.vectors) {
      expect(vector.id > previousID, `${vector.id} is not strictly ordered`).toBe(true)
      previousID = vector.id
      expect(ids.has(vector.id), `${vector.id} is duplicated`).toBe(false)
      ids.add(vector.id)

      const raw = readFileSync(path.join(repoRoot, vector.rawPath))
      expect(raw.byteLength, `${vector.id} raw length`).toBe(vector.rawByteLength)
      expect(digest(raw), `${vector.id} raw hash`).toBe(vector.rawSha256)
      root.update(frame(Buffer.from(vector.id)))
      root.update(frame(raw))
      enumeration.update(frame(Buffer.from(vector.id)))
      enumeration.update(frame(Buffer.from(vector.rawSha256)))

      if (vector.expectation.kind === "success") {
        const canonical = readFileSync(
          path.join(repoRoot, vector.expectation.canonicalPath),
        )
        expect(canonical.byteLength, `${vector.id} canonical length`).toBe(
          vector.expectation.canonicalByteLength,
        )
        expect(digest(canonical), `${vector.id} canonical hash`).toBe(
          vector.expectation.canonicalSha256,
        )
        expect(vector.operation, `${vector.id} successful operation`).not.toBe("host-encode")
        if (vector.operation === "host-encode") continue
        const parsed = parseCanonicalJson(raw, {
          context: vector.context,
          operation: vector.operation,
          limits: vector.limits,
        })
        expect(parsed.ok, `${vector.id} parse`).toBe(true)
        if (!parsed.ok) continue
        const encoded = encodeCanonicalJson(parsed.value, {
          context: vector.context,
          limits: vector.limits,
        })
        expect(encoded.ok, `${vector.id} encode`).toBe(true)
        if (!encoded.ok) continue
        expect(encoded.bytes.byteLength, `${vector.id} encoded length`).toBe(
          vector.expectation.canonicalByteLength,
        )
        expect(digest(encoded.bytes), `${vector.id} encoded hash`).toBe(
          vector.expectation.canonicalSha256,
        )
      } else {
        expect(vector.expectation.code, `${vector.id} error code`).toMatch(/^[A-Z][A-Z0-9_]+$/)
        expect(Array.isArray(vector.expectation.path), `${vector.id} error path`).toBe(true)
        expect(vector.expectation.byteOffset, `${vector.id} byte offset`).toBeGreaterThanOrEqual(0)
        expect(["player_violation", "system_failure"]).toContain(
          vector.expectation.owner,
        )
        const { kind: _kind, ...expectedError } = vector.expectation
        if (vector.operation === "host-encode") {
          const value = vector.id === "number-host-nan"
            ? Number.NaN
            : vector.id === "number-host-positive-infinity"
              ? Number.POSITIVE_INFINITY
              : Number.NEGATIVE_INFINITY
          expect(
            encodeCanonicalJson(value, {
              context: vector.context,
              limits: vector.limits,
            }),
            vector.id,
          ).toEqual({ ok: false, error: expectedError })
        } else {
          expect(
            parseCanonicalJson(raw, {
              context: vector.context,
              operation: vector.operation,
              limits: vector.limits,
            }),
            vector.id,
          ).toEqual({ ok: false, error: expectedError })
        }
      }
    }

    expect(ids.size).toBe(corpus.vectorCount)
    expect(root.digest("hex")).toBe(corpus.vectorRootSha256)
    const enumerationSha256 = enumeration.digest("hex")
    console.log(
      `[CANONICAL_JSON_CORPUS:TS] count=${corpus.vectorCount} root=${corpus.vectorRootSha256} enumeration=${enumerationSha256}`,
    )
  }, 20_000)
})
