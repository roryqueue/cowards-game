import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

const forbiddenPatterns = [
  "Math.random",
  "Date.now",
  "new Date(",
  "fetch(",
  'from "fs"',
  "from 'fs'",
  'from "node:fs"',
  "from 'node:fs'",
  "process.env",
  "postgres",
  "redis",
]

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (path.endsWith(".test.ts") || path.includes("/test/")) {
      return []
    }
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : path.endsWith(".ts")
        ? [path]
        : []
  })

describe("engine purity", () => {
  it("keeps production source free of side-effect APIs", () => {
    const offenders = sourceFiles(
      new URL(".", import.meta.url).pathname,
    ).flatMap((file) => {
      const source = readFileSync(file, "utf8")
      return forbiddenPatterns
        .filter((pattern) => source.includes(pattern))
        .map((pattern) => `${file}: ${pattern}`)
    })
    expect(offenders).toEqual([])
  })
})
