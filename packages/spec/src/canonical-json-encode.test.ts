import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import { parseCanonicalJson } from "./canonical-json-parse.js"
import {
  CANONICAL_JSON_V1_LIMITS,
  type CanonicalJsonContext,
  type CanonicalJsonLimits,
  type CanonicalJsonScanOptions,
} from "./canonical-json-scan.js"
import type { JsonValue } from "./types.js"

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
)
const corpus = JSON.parse(
  readFileSync(
    path.join(
      repoRoot,
      "packages/spec/src/fixtures/canonical-json-v1-1-vectors.json",
    ),
    "utf8",
  ),
) as {
  vectors: readonly {
    id: string
    operation: CanonicalJsonScanOptions["operation"] | "host-encode"
    context: CanonicalJsonScanOptions["context"]
    rawPath: string
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
  }[]
}

describe("canonical JSON v1 iterative encoder", () => {
  it("emits exact canonical bytes for every successful corpus vector", () => {
    const vectors = corpus.vectors.filter(
      (
        vector,
      ): vector is typeof vector & {
        expectation: Extract<typeof vector.expectation, { kind: "success" }>
      } => vector.expectation.kind === "success",
    )
    expect(vectors).toHaveLength(40)
    for (const vector of vectors) {
      if (vector.operation === "host-encode")
        throw new Error(`unexpected host success ${vector.id}`)
      const raw = readFileSync(path.join(repoRoot, vector.rawPath))
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
      const expected = readFileSync(
        path.join(repoRoot, vector.expectation.canonicalPath),
      )
      const actual = Buffer.from(encoded.bytes)
      expect(actual.byteLength, `${vector.id} byte length`).toBe(
        expected.byteLength,
      )
      expect(actual.equals(expected), `${vector.id} canonical bytes`).toBe(true)
      expect(
        createHash("sha256").update(actual).digest("hex"),
        `${vector.id} canonical hash`,
      ).toBe(vector.expectation.canonicalSha256)
    }
  }, 20_000)

  it("orders validated Unicode scalar keys exactly like unsigned UTF-8 bytes", () => {
    const keys = [
      "\u{10ffff}",
      "\u{10000}",
      "\uffff",
      "\ue000",
      "\ud7ff",
      "\u0800",
      "\u07ff",
      "\u0080",
      "\u007f",
      "a\u{10000}",
      "a\u0080",
      "a\u007f",
      "a",
      "",
      "A\u{1f642}z",
      "zA",
      "\u0000",
      "\n",
      '"',
      "\\",
    ]
    const value: Record<string, JsonValue> = Object.create(null)
    for (const key of keys) value[key] = true
    const byteOrder = (left: string, right: string) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
    const golden = `{${[...keys]
      .sort(byteOrder)
      .map((key) => `${JSON.stringify(key)}:true`)
      .join(",")}}`
    const encoded = encodeCanonicalJson(value, { context: "host-api-value" })
    expect(encoded.ok).toBe(true)
    if (encoded.ok)
      expect(Buffer.from(encoded.bytes).toString("utf8")).toBe(golden)
  })

  it("validates malformed keys and preserves entry errors before sorting", () => {
    const malformed: Record<string, JsonValue> = Object.create(null)
    malformed["\ud800"] = true
    const result = encodeCanonicalJson(malformed, { context: "host-api-value" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.code).toBe("INVALID_UNICODE_SCALAR")
    let getterCalls = 0
    const accessor = Object.defineProperty({}, "\ud800", {
      enumerable: true,
      get() {
        getterCalls++
        return true
      },
    })
    const rejected = encodeCanonicalJson(accessor, {
      context: "host-api-value",
    })
    expect(rejected.ok).toBe(false)
    if (!rejected.ok) expect(rejected.error.code).toBe("INVALID_GRAMMAR")
    expect(getterCalls).toBe(0)
  })

  it("copies private fixed tokens into fresh outputs that cannot poison subsequent encodings", () => {
    const cases: readonly [JsonValue, string][] = [
      [null, "null"],
      [true, "true"],
      [false, "false"],
      [[], "[]"],
      [{}, "{}"],
      [
        { z: false, a: [null, true, false, {}, []] },
        '{"a":[null,true,false,{},[]],"z":false}',
      ],
    ]
    for (const [value, golden] of cases) {
      const first = encodeCanonicalJson(value, { context: "host-api-value" }),
        second = encodeCanonicalJson(value, { context: "host-api-value" })
      expect(first.ok).toBe(true)
      expect(second.ok).toBe(true)
      if (!first.ok || !second.ok) continue
      expect(Buffer.from(first.bytes)).toEqual(Buffer.from(golden))
      expect(first.bytes).not.toBe(second.bytes)
      expect(first.bytes.buffer).not.toBe(second.bytes.buffer)
      first.bytes.fill(0)
      expect(Buffer.from(second.bytes)).toEqual(Buffer.from(golden))
      const third = encodeCanonicalJson(value, { context: "host-api-value" })
      expect(third.ok).toBe(true)
      if (third.ok) {
        expect(third.bytes.buffer).not.toBe(first.bytes.buffer)
        expect(third.bytes.buffer).not.toBe(second.bytes.buffer)
        expect(Buffer.from(third.bytes)).toEqual(Buffer.from(golden))
      }
    }
  })

  it("preserves exact raw-byte-boundary errors for fixed tokens and every ownership context", () => {
    const contexts: readonly CanonicalJsonContext[] = [
      "host-api-value",
      "decoded-strategy-payload",
      "canonical-manifest",
      "authenticated-outer-envelope",
    ]
    const cases: readonly [JsonValue, string][] = [
      [null, "null"],
      [true, "true"],
      [false, "false"],
      [[], "[]"],
      [{}, "{}"],
      [[null, true, false], "[null,true,false]"],
      [{ a: null, b: [true, false] }, '{"a":null,"b":[true,false]}'],
    ]
    for (const context of contexts)
      for (const [value, golden] of cases) {
        const byteLength = Buffer.byteLength(golden),
          limits = { ...CANONICAL_JSON_V1_LIMITS, rawUtf8Bytes: byteLength },
          exact = encodeCanonicalJson(value, { context, limits })
        expect(exact.ok).toBe(true)
        if (exact.ok)
          expect(Buffer.from(exact.bytes)).toEqual(Buffer.from(golden))
        expect(
          encodeCanonicalJson(value, {
            context,
            limits: { ...limits, rawUtf8Bytes: byteLength - 1 },
          }),
        ).toEqual({
          ok: false,
          error: {
            code: "MAX_RAW_UTF8_BYTES_EXCEEDED",
            path: [],
            byteOffset: byteLength - 1,
            owner:
              context === "host-api-value" ||
              context === "decoded-strategy-payload"
                ? "player_violation"
                : "system_failure",
          },
        })
      }
  })

  it("uses shortest normalized finite binary64 spellings", () => {
    const cases: readonly [number, string][] = [
      [-0, "0"],
      [Number.MIN_VALUE, "5e-324"],
      [2.2250738585072014e-308, "2.2250738585072014e-308"],
      [Number.MAX_VALUE, "1.7976931348623157e308"],
      [1e21, "1e21"],
      [1e7, "10000000"],
      [1.23, "1.23"],
    ]
    for (const [value, expected] of cases) {
      const result = encodeCanonicalJson(value, { context: "host-api-value" })
      expect(result.ok, String(value)).toBe(true)
      if (result.ok)
        expect(Buffer.from(result.bytes).toString("utf8")).toBe(expected)
    }
  })

  it("rejects host non-finite values with the corpus error", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expect(encodeCanonicalJson(value, { context: "host-api-value" })).toEqual(
        {
          ok: false,
          error: {
            code: "NON_CANONICAL_NUMBER",
            path: [],
            byteOffset: 0,
            owner: "player_violation",
          },
        },
      )
    }
  })

  it("sorts decoded keys by unsigned UTF-8 bytes independent of insertion order", () => {
    const left: Record<string, JsonValue> = {}
    for (const key of ["z", "é", "é", "😀", "Z", "a", "A"]) left[key] = key
    const right: Record<string, JsonValue> = {}
    for (const key of ["A", "a", "Z", "😀", "é", "é", "z"]) right[key] = key
    const first = encodeCanonicalJson(left, { context: "host-api-value" })
    const second = encodeCanonicalJson(right, { context: "host-api-value" })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    if (first.ok && second.ok) {
      expect(Buffer.from(first.bytes)).toEqual(Buffer.from(second.bytes))
      expect(Buffer.from(first.bytes).toString("utf8")).toBe(
        '{"A":"A","Z":"Z","a":"a","é":"é","z":"z","é":"é","😀":"😀"}',
      )
    }
  })

  it("uses one scalar-preserving escape form and rejects lone surrogates", () => {
    const encoded = encodeCanonicalJson('"\\\b\f\n\r\t\u0000  é é 😀', {
      context: "host-api-value",
    })
    expect(encoded.ok).toBe(true)
    if (encoded.ok) {
      expect(Buffer.from(encoded.bytes).toString("utf8")).toBe(
        '"\\"\\\\\\b\\f\\n\\r\\t\\u0000  é é 😀"',
      )
    }
    expect(
      encodeCanonicalJson("\ud800", { context: "host-api-value" }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_UNICODE_SCALAR",
        path: [],
        byteOffset: 0,
        owner: "player_violation",
      },
    })
  })

  it("enforces ceilings iteratively and rejects cycles", () => {
    const limits: CanonicalJsonLimits = {
      rawUtf8Bytes: 64,
      depth: 2,
      nodes: 4,
      decodedStringUtf8Bytes: 4,
      arrayEntries: 2,
      objectEntries: 2,
    }
    expect(
      encodeCanonicalJson([[[null]]], {
        context: "canonical-manifest",
        limits,
      }),
    ).toMatchObject({ ok: false, error: { code: "MAX_DEPTH_EXCEEDED" } })
    expect(
      encodeCanonicalJson([null, null, null], {
        context: "canonical-manifest",
        limits,
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "MAX_ARRAY_ENTRIES_EXCEEDED" },
    })
    expect(
      encodeCanonicalJson("12345", { context: "canonical-manifest", limits }),
    ).toMatchObject({
      ok: false,
      error: { code: "MAX_DECODED_STRING_UTF8_BYTES_EXCEEDED" },
    })
    const cyclic: { self?: unknown } = {}
    cyclic.self = cyclic
    expect(
      encodeCanonicalJson(cyclic as JsonValue, {
        context: "canonical-manifest",
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_GRAMMAR" } })
  })

  it("contains no recursive, locale, or ambient stringify authority", () => {
    const source = readFileSync(
      fileURLToPath(new URL("./canonical-json-encode.ts", import.meta.url)),
      "utf8",
    )
    expect(source).not.toContain("JSON.stringify")
    expect(source).not.toContain("localeCompare")
  })
})
