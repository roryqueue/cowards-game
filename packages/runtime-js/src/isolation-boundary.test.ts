import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const testDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(testDir, "../../..")

const sourceExtensions = new Set([".ts", ".tsx"])
const excludedDirectories = new Set([
  ".git",
  ".next",
  ".planning",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
])

type Offense = {
  path: string
  line: number
  pattern: string
}

const toRepoPath = (absolutePath: string): string =>
  path.relative(repoRoot, absolutePath).split(path.sep).join("/")

const isSourceFile = (absolutePath: string): boolean =>
  sourceExtensions.has(path.extname(absolutePath))

const isExcludedDirectory = (directoryName: string): boolean =>
  excludedDirectories.has(directoryName) ||
  directoryName === "__snapshots__" ||
  directoryName.endsWith("-snapshots")

const walkSourceFiles = (rootRelativePath: string): readonly string[] => {
  const root = path.join(repoRoot, rootRelativePath)
  if (!existsSync(root)) {
    return []
  }

  const files: string[] = []
  const visit = (absolutePath: string) => {
    const stats = statSync(absolutePath)
    if (stats.isDirectory()) {
      if (isExcludedDirectory(path.basename(absolutePath))) {
        return
      }
      for (const entry of readdirSync(absolutePath)) {
        visit(path.join(absolutePath, entry))
      }
      return
    }

    if (stats.isFile() && isSourceFile(absolutePath)) {
      files.push(absolutePath)
    }
  }

  visit(root)
  return files.sort((left, right) =>
    toRepoPath(left).localeCompare(toRepoPath(right)),
  )
}

const sourceFiles = (roots: readonly string[]): readonly string[] =>
  roots.flatMap((root) => [...walkSourceFiles(root)])

const findOffenses = (
  files: readonly string[],
  pattern: string,
  matches: (line: string) => boolean,
): readonly Offense[] =>
  files.flatMap((file) =>
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .flatMap((line, index) =>
        matches(line)
          ? [{ path: toRepoPath(file), line: index + 1, pattern }]
          : [],
      ),
  )

const formatOffenses = (offenses: readonly Offense[]): string =>
  offenses
    .map(
      (offense) => `${offense.path}:${offense.line} matches ${offense.pattern}`,
    )
    .join("\n")

const expectNoOffenses = (offenses: readonly Offense[]) => {
  expect(offenses, formatOffenses(offenses)).toEqual([])
}

const isInsideAllowedExecutableRuntimeRoot = (file: string): boolean => {
  const repoPath = toRepoPath(file)
  return (
    repoPath.startsWith("apps/worker/") ||
    repoPath.startsWith("packages/runtime-js/")
  )
}

describe("runtime isolation source boundaries", () => {
  it("keeps executable runtime subpath imports out of web and API source", () => {
    const offenses = findOffenses(
      walkSourceFiles("apps/web"),
      "@cowards/runtime-js/worker",
      (line) => line.includes("@cowards/runtime-js/worker"),
    )

    expectNoOffenses(offenses)
  })

  it("keeps createRuntimeFromRevision calls out of web and API source", () => {
    const offenses = findOffenses(
      walkSourceFiles("apps/web"),
      "createRuntimeFromRevision",
      (line) => line.includes("createRuntimeFromRevision"),
    )

    expectNoOffenses(offenses)
  })

  it("limits executable runtime subpath imports to worker app and runtime package source", () => {
    const scannedFiles = sourceFiles(["apps", "packages"]).filter(
      (file) => !isInsideAllowedExecutableRuntimeRoot(file),
    )
    const offenses = findOffenses(
      scannedFiles,
      "@cowards/runtime-js/worker",
      (line) => line.includes("@cowards/runtime-js/worker"),
    )

    expectNoOffenses(offenses)
  })

  it("keeps runtime harnesses away from same-process security-boundary modules", () => {
    const harnessFiles = walkSourceFiles("packages/runtime-js/src").filter(
      (file) => toRepoPath(file).endsWith("-harness.ts"),
    )
    const nodeSecurityBoundaryModule = `node:${"vm"}`
    const sameProcessSandboxMemberPattern = new RegExp(
      String.raw`(^|[^A-Za-z0-9_])${"vm"}\.`,
    )
    const importOffenses = findOffenses(
      harnessFiles,
      "same-process security-boundary module import",
      (line) => line.includes(nodeSecurityBoundaryModule),
    )
    const memberOffenses = findOffenses(
      harnessFiles,
      "same-process security-boundary member access",
      (line) => sameProcessSandboxMemberPattern.test(line),
    )

    expectNoOffenses([...importOffenses, ...memberOffenses])
  })
})
