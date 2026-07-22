import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V137_PINNED_WASMTIME_SHA256,
  stageV137PinnedWasmtime,
} from "./v1-37-pinned-wasmtime.js"

const digest = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

describe("stageV137PinnedWasmtime", () => {
  it("uses the certified v45 Linux pin and stages an owner-only copy from cache", () => {
    expect(V137_PINNED_WASMTIME_SHA256).toBe(
      "sha256:d7b7317b34a717f4b809df14657975e2ce83221a697167219abdad6e44c7a12c",
    )
    const root = mkdtempSync(path.join(tmpdir(), "v137-wasmtime-"))
    try {
      const payload = "certified-test-binary"
      const staged = stageV137PinnedWasmtime({
        stageDirectory: path.join(root, "proof"),
        cacheRoot: path.join(root, "cache"),
        expectedSha256: digest(payload),
        run: (_executable, args) => {
          if (args[0] === "-xJf") {
            writeFileSync(path.join(root, "proof", "wasmtime"), payload, { mode: 0o500 })
          }
        },
      })
      expect(readFileSync(staged, "utf8")).toBe(payload)
      expect(existsSync(path.join(root, "cache", "wasmtime"))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it("replaces a substituted cache entry and removes an invalid staged copy", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v137-wasmtime-"))
    try {
      const cacheRoot = path.join(root, "cache")
      const proofRoot = path.join(root, "proof")
      const payload = "verified-test-binary"
      mkdirSync(cacheRoot, { recursive: true, mode: 0o700 })
      writeFileSync(path.join(cacheRoot, "wasmtime"), "substituted", {
        mode: 0o500,
      })
      const staged = stageV137PinnedWasmtime({
        stageDirectory: proofRoot,
        cacheRoot,
        expectedSha256: digest(payload),
        run: (_executable, args) => {
          if (args[0] === "-xJf") {
            writeFileSync(path.join(proofRoot, "wasmtime"), payload, { mode: 0o500 })
          }
        },
      })
      expect(readFileSync(staged, "utf8")).toBe(payload)
      rmSync(proofRoot, { recursive: true, force: true })
      expect(existsSync(staged)).toBe(false)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
