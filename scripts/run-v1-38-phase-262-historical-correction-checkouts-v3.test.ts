import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { resolveV138HistoricalToolchainV3 } from "./run-v1-38-phase-262-historical-correction-checkouts-v3.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("CR-05 historical correction toolchain provenance", () => {
  it("resolves exact authenticated Git, Node, pnpm, and corepack identities", () => {
    const tools = resolveV138HistoricalToolchainV3()
    expect(tools.git).toBe("/usr/bin/git")
    expect(tools.gitCdHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(tools.nodeCdHash).toMatch(/^[0-9a-f]{64}$/u)
    expect(tools.pnpmVersion).toBe("11.1.2")
  })

  it("rejects a PATH-prepended pnpm wrapper before any checkout", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-pnpm-wrapper-"))
    roots.push(root)
    const wrapper = path.join(root, "pnpm")
    writeFileSync(wrapper, "#!/bin/sh\necho 11.1.2\n")
    chmodSync(wrapper, 0o700)
    expect(() =>
      resolveV138HistoricalToolchainV3(
        `${root}${path.delimiter}${process.env.PATH ?? ""}`,
      ),
    ).toThrow()
  })
})
