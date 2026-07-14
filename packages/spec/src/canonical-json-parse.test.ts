import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  parseCanonicalJson,
  materializeCanonicalJson,
} from "./canonical-json-parse.js"
import {
  scanCanonicalJson,
  type CanonicalJsonLimits,
  type CanonicalJsonScanOptions,
} from "./canonical-json-scan.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..")
const corpus = JSON.parse(
  readFileSync(
    path.join(repoRoot, "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json"),
    "utf8",
  ),
) as {
  vectors: readonly {
    id: string
    operation: CanonicalJsonScanOptions["operation"] | "host-encode"
    context: CanonicalJsonScanOptions["context"]
    category: string
    rawPath: string
    limits: CanonicalJsonLimits
    boundary?: unknown
    expectation:
      | { kind: "success" }
      | {
          kind: "error"
          code: string
          path: readonly (string | number)[]
          byteOffset: number
          owner: "player_violation" | "system_failure"
        }
  }[]
}

const rawParseVectors = corpus.vectors.filter(
  (
    vector,
  ): vector is typeof vector & {
    operation: CanonicalJsonScanOptions["operation"]
  } => vector.operation !== "host-encode",
)

describe("canonical JSON v1.1 bounded materializer", () => {
  it("materializes every non-boundary scanner-approved corpus value", () => {
    const vectors = rawParseVectors.filter(
      (vector) => vector.expectation.kind === "success" && vector.boundary === undefined,
    )
    expect(vectors).toHaveLength(28)
    for (const vector of vectors) {
      const result = parseCanonicalJson(
        readFileSync(path.join(repoRoot, vector.rawPath)),
        {
          context: vector.context,
          operation: vector.operation,
          limits: vector.limits,
        },
      )
      expect(result.ok, vector.id).toBe(true)
    }
  })

  it("passes every scanner-owned corpus error through without materialization", () => {
    const vectors = rawParseVectors.filter(
      (vector) => vector.expectation.kind === "error",
    )
    expect(vectors).toHaveLength(27)
    for (const vector of vectors) {
      const result = parseCanonicalJson(
        readFileSync(path.join(repoRoot, vector.rawPath)),
        {
          context: vector.context,
          operation: vector.operation,
          limits: vector.limits,
        },
      )
      const { kind: _kind, ...expectedError } = vector.expectation
      expect(result, vector.id).toEqual({ ok: false, error: expectedError })
    }
  })

  it("preserves values while normalizing negative zero", () => {
    const result = parseCanonicalJson(
      Buffer.from('{"n":-0,"nfc":"é","nfd":"é","scalar":"\\ud83d\\ude00"}'),
      {
        context: "decoded-strategy-payload",
        operation: "parse-and-canonicalize",
      },
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual({ n: 0, nfc: "é", nfd: "é", scalar: "😀" })
      expect(Object.is((result.value as { n: number }).n, -0)).toBe(false)
      expect((result.value as { nfc: string }).nfc).not.toBe(
        (result.value as { nfd: string }).nfd,
      )
    }
  })

  it("binds materialization to the exact scan receipt bytes", () => {
    const options = {
      context: "decoded-strategy-payload",
      operation: "parse-and-canonicalize",
    } as const
    const scanned = scanCanonicalJson(Buffer.from('{"a":1}'), options)
    expect(scanned.ok).toBe(true)
    if (!scanned.ok) return
    expect(materializeCanonicalJson(Buffer.from('{"a":2}'), scanned.receipt)).toEqual({
      ok: false,
      error: {
        code: "CANONICAL_JSON_SCAN_RECEIPT_MISMATCH",
        path: [],
        byteOffset: 0,
        owner: "system_failure",
      },
    })
    expect(materializeCanonicalJson(Buffer.from('{"a":1}'), scanned.receipt)).toMatchObject({
      ok: true,
      value: { a: 1 },
    })
  })

  it("materializes depth 64 iteratively and rejects depth 3,000 without throwing", () => {
    const depth64 = Buffer.from(`${"[".repeat(64)}null${"]".repeat(64)}`)
    const accepted = parseCanonicalJson(depth64, {
      context: "canonical-manifest",
      operation: "parse-and-canonicalize",
    })
    expect(accepted.ok).toBe(true)

    const depth3000 = readFileSync(
      path.join(
        repoRoot,
        "packages/spec/src/fixtures/canonical-json-v1-1-raw/hostile-depth-3000.raw",
      ),
    )
    expect(() =>
      parseCanonicalJson(depth3000, {
        context: "canonical-manifest",
        operation: "parse-and-canonicalize",
      }),
    ).not.toThrow()
    expect(
      parseCanonicalJson(depth3000, {
        context: "canonical-manifest",
        operation: "parse-and-canonicalize",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "MAX_DEPTH_EXCEEDED", byteOffset: 64, owner: "system_failure" },
    })
  })

  it("constructs objects safely without host parsing or prototype mutation", () => {
    const result = parseCanonicalJson(Buffer.from('{"__proto__":{"polluted":true}}'), {
      context: "decoded-strategy-payload",
      operation: "parse-and-canonicalize",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(Object.hasOwn(result.value as object, "__proto__")).toBe(true)
      expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
    }
    const source = readFileSync(
      fileURLToPath(new URL("./canonical-json-parse.ts", import.meta.url)),
      "utf8",
    )
    expect(source).not.toContain("JSON.parse")
    expect(source).not.toContain("JsonValueSchema")
  })
})
