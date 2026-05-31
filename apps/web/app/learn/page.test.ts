import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8")

describe("Learn language trust copy", () => {
  it("documents supported languages, provider boundaries, ABI, privacy, and non-claims", () => {
    for (const expected of [
      "TypeScript, Python, Rust, and Zig",
      "provider-compatible runtime evidence",
      "runtime-service, Runtime Broker, and language provider",
      "immutable WASM/WASI Preview 1 stdin/stdout",
      "Runtime failures fail closed",
      "does not claim broad sandbox certification",
      "StrategyMemory",
      "SoldierMemory",
      "objective payloads",
      "private runtime internals",
    ]) {
      expect(source).toContain(expected)
    }
    for (const forbidden of [
      "Traceback",
      "stderr:",
      "DATABASE_URL",
      "Bearer ",
      "site-packages",
      "/Users/",
    ]) {
      expect(source).not.toContain(forbidden)
    }
  })
})
