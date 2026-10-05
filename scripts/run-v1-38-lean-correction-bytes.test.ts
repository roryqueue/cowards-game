import { describe, expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { leanCanonicalBytes } from "../packages/strategy-lab/src/league/lean-experiment.js"
import { readLeanCorrectionJson } from "./run-v1-38-lean-correction.js"

describe("private correction reader canonical byte equality", () => {
  it("reads canonical files across the JSON-array limit without treating bytes as JSON nodes", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-json-bytes-")))
    try {
      for (const size of [65_535, 65_536, 65_537, 524_288]) {
        const value = { payload: "x".repeat(size - 14) }
        const bytes = leanCanonicalBytes(value)
        expect(bytes.byteLength).toBe(size)
        const path = join(directory, `canonical-${size}.json`)
        writeFileSync(path, bytes, { mode: 0o600, flag: "wx" })
        expect(readLeanCorrectionJson(path, 4_194_304)).toEqual(value)
        expect(() => readLeanCorrectionJson(path, size - 1)).toThrow()
      }
    } finally { rmSync(directory, { recursive: true }) }
  })

  it("still rejects whitespace, reordered or duplicate keys and malformed JSON", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "lean-json-reject-")))
    try {
      for (const [ordinal, text] of ['{"a":1}\n', '{"b":2,"a":1}', '{"a":1,"a":1}', '{'].entries()) {
        const path = join(directory, `invalid-${ordinal}.json`)
        writeFileSync(path, text, { mode: 0o600, flag: "wx" })
        expect(() => readLeanCorrectionJson(path)).toThrow()
      }
    } finally { rmSync(directory, { recursive: true }) }
  })
})
