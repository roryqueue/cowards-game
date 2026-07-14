import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { afterEach, describe, expect, it } from "vitest"
import type * as SubjectModule from "./generate-canonical-json-v1-1-corpus.ts"

const repoRoot = path.resolve(import.meta.dirname, "..")
const subjectPath = path.join(
  repoRoot,
  "scripts/generate-canonical-json-v1-1-corpus.ts",
)
const tempRoots: string[] = []

type Subject = typeof SubjectModule

const subject = async (): Promise<Subject> => {
  expect(
    existsSync(subjectPath),
    "canonical JSON v1.1 corpus generator must exist after the RED gate",
  ).toBe(true)
  return import(pathToFileURL(subjectPath).href) as Promise<Subject>
}

const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe("canonical JSON v1.1 corpus generator", () => {
  it("enumerates every mandatory raw-byte category and ownership context", async () => {
    const generator = await subject()
    const corpus = generator.generateCanonicalJsonV11Corpus()
    const categories = new Set(corpus.vectors.map((vector) => vector.category))
    const contexts = new Set(corpus.vectors.map((vector) => vector.context))

    expect(corpus.vectors.length).toBeGreaterThanOrEqual(55)
    expect(categories).toEqual(
      new Set([
        "valid-utf8",
        "invalid-utf8",
        "unicode-scalar",
        "duplicate-key",
        "key-order",
        "unicode-normalization",
        "number",
        "numeric-grammar",
        "limit-raw-bytes",
        "limit-depth",
        "limit-nodes",
        "limit-string-bytes",
        "limit-array-entries",
        "limit-object-entries",
        "hostile-allocation",
      ]),
    )
    expect(contexts).toContain("authenticated-outer-envelope")
    expect(contexts).toContain("decoded-strategy-payload")
    expect(contexts).toContain("canonical-manifest")
  })

  it("contains N-1, N, and N+1 for every exact parser ceiling", async () => {
    const generator = await subject()
    const corpus = generator.generateCanonicalJsonV11Corpus()

    for (const limit of [
      "rawUtf8Bytes",
      "depth",
      "nodes",
      "decodedStringUtf8Bytes",
      "arrayEntries",
      "objectEntries",
    ]) {
      const vectors = corpus.vectors.filter(
        (vector) => vector.boundary?.limit === limit,
      )
      expect(
        vectors.map((vector) => vector.boundary?.offset),
        limit,
      ).toEqual([-1, 0, 1])
      expect(vectors[0]?.expectation.kind, limit).toBe("success")
      expect(vectors[1]?.expectation.kind, limit).toBe("success")
      expect(vectors[2]?.expectation.kind, limit).toBe("error")
    }
  })

  it("keeps object-entry boundary input insertion order separate from canonical key order", async () => {
    const generator = await subject()
    const root = mkdtempSync(path.join(tmpdir(), "cowards-cjson-object-order-"))
    tempRoots.push(root)
    const corpus = generator.writeCanonicalJsonV11Corpus(root)
    for (const id of [
      "boundary-objectEntries-00-n-minus-1",
      "boundary-objectEntries-01-n",
    ]) {
      const vector = corpus.vectors.find((candidate) => candidate.id === id)!
      expect(vector.expectation.kind).toBe("success")
      if (vector.expectation.kind !== "success") continue
      expect(vector.expectation.canonicalPath).not.toBe(vector.rawPath)
      const raw = readFileSync(path.join(root, vector.rawPath), "utf8")
      const canonical = readFileSync(
        path.join(root, vector.expectation.canonicalPath),
        "utf8",
      )
      expect(raw.startsWith('{"k0":null,"k1":null,"k2":null')).toBe(true)
      expect(canonical.startsWith('{"k0":null,"k1":null,"k10":null')).toBe(true)
      expect(vector.expectation.canonicalSha256).not.toBe(vector.rawSha256)
    }
  })

  it("writes byte-deterministic index and literal raw fixtures whose hashes match", async () => {
    const generator = await subject()
    const root = mkdtempSync(path.join(tmpdir(), "cowards-cjson-corpus-"))
    tempRoots.push(root)
    generator.writeCanonicalJsonV11Corpus(root)
    const first = generator.checkCanonicalJsonV11Corpus(root)
    expect(first).toEqual([])
    const indexPath = path.join(root, generator.CANONICAL_JSON_V1_1_INDEX_PATH)
    const firstIndex = readFileSync(indexPath)
    const corpus = JSON.parse(firstIndex.toString("utf8"))

    for (const vector of corpus.vectors) {
      const raw = readFileSync(path.join(root, vector.rawPath))
      expect(raw.byteLength, vector.id).toBe(vector.rawByteLength)
      expect(sha256(raw), vector.id).toBe(vector.rawSha256)
    }
    generator.writeCanonicalJsonV11Corpus(root)
    expect(readFileSync(indexPath)).toEqual(firstIndex)
  })

  it("stores malformed UTF-8 as literal bytes and duplicates before host parsing", async () => {
    const generator = await subject()
    const root = mkdtempSync(path.join(tmpdir(), "cowards-cjson-binary-"))
    tempRoots.push(root)
    const corpus = generator.writeCanonicalJsonV11Corpus(root)
    const overlong = corpus.vectors.find(
      (vector) => vector.id === "utf8-overlong-slash",
    )!
    const duplicate = corpus.vectors.find(
      (vector) => vector.id === "duplicate-root-escaped-equivalent",
    )!

    expect([...readFileSync(path.join(root, overlong.rawPath))]).toEqual([
      0x22, 0xc0, 0xaf, 0x22,
    ])
    const duplicateText = readFileSync(
      path.join(root, duplicate.rawPath),
      "utf8",
    )
    expect(duplicateText).toBe('{"a":1,"\\u0061":2}')
    expect(JSON.parse(duplicateText)).toEqual({ a: 2 })
    expect(duplicate.expectation).toMatchObject({
      kind: "error",
      code: "DUPLICATE_KEY",
      owner: "player_violation",
    })
  })

  it("fixes exact error path/offset/owner and canonical output hashes", async () => {
    const generator = await subject()
    const corpus = generator.generateCanonicalJsonV11Corpus()
    const ids = new Set<string>()

    for (const vector of corpus.vectors) {
      expect(ids.has(vector.id), vector.id).toBe(false)
      ids.add(vector.id)
      expect(vector.rawSha256).toMatch(/^[0-9a-f]{64}$/u)
      expect(vector.rawByteLength).toBeGreaterThan(0)
      expect(vector.limits).toEqual(expect.objectContaining({
        rawUtf8Bytes: expect.any(Number),
        depth: expect.any(Number),
        nodes: expect.any(Number),
        decodedStringUtf8Bytes: expect.any(Number),
        arrayEntries: expect.any(Number),
        objectEntries: expect.any(Number),
      }))
      if (vector.expectation.kind === "error") {
        expect(vector.expectation.path).toBeInstanceOf(Array)
        expect(vector.expectation.byteOffset).toBeGreaterThanOrEqual(0)
        expect(["player_violation", "system_failure"]).toContain(
          vector.expectation.owner,
        )
      } else {
        expect(vector.expectation.canonicalSha256).toMatch(/^[0-9a-f]{64}$/u)
        expect(vector.expectation.canonicalByteLength).toBeGreaterThan(0)
      }
    }
    expect(corpus.vectorRootSha256).toMatch(/^[0-9a-f]{64}$/u)
  })

  it("forbids skip, todo, pending, and pass-with-no-tests escape hatches", async () => {
    const generator = await subject()
    const serialized = generator.renderCanonicalJsonV11Index(
      generator.generateCanonicalJsonV11Corpus(),
    )

    expect(serialized).not.toMatch(/\b(skip|todo|pending|passWithNoTests)\b/u)
  })
})
