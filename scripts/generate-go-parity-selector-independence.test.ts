import { spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const generatorPath = path.join(
  repoRoot,
  "scripts/generate-go-parity-fixtures.ts",
)

describe("Go parity selector independence", () => {
  it("addresses the immutable v1.17 kernel and Chronicle tuple explicitly", () => {
    const source = readFileSync(generatorPath, "utf8")
    expect(source).toContain("MATCH_KERNEL.runMatchV117({")
    expect(source).not.toContain("MATCH_KERNEL.runMatch({")
    expect(source).toContain(
      "semanticTupleId: VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tupleId",
    )
    expect(source).toContain(
      "semanticTuple: VERSIONED_RUNTIME_V117_SEMANTIC_TUPLE_RECORD.tuple",
    )
  })

  it("checks repository Go parity bytes without invoking a package manager", () => {
    const result = spawnSync(
      path.join(repoRoot, "node_modules/.bin/tsx"),
      [generatorPath, "--check"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        timeout: 120_000,
      },
    )
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0)
  }, 120_000)
})
