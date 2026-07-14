import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

const repoRoot = path.resolve(import.meta.dirname, "..")
const read = (relativePath: string): Buffer =>
  readFileSync(
    path.isAbsolute(relativePath)
      ? relativePath
      : path.join(repoRoot, relativePath),
  )
const sha256 = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex")

const scriptPath = path.join(repoRoot, "scripts/generate-go-parity-fixtures.ts")
const generatedPath = path.join(
  repoRoot,
  "apps/go-backend/runtime_execution_contract_gen.go",
)
const v116RequestPath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
)
const v116ResponsePath = path.join(
  repoRoot,
  "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
)
const candidateRequestRelative =
  "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json"
const candidateResponseRelative =
  "packages/spec/artifacts/runtime-execution-service-response.v1.17.candidate.wire.json"
const generatedRelative = "apps/go-backend/runtime_execution_contract_gen.go"
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const makeVersionRoot = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "go-parity-v117-"))
  temporaryRoots.push(root)
  for (const source of [v116RequestPath, v116ResponsePath]) {
    const relative = path.relative(repoRoot, source)
    const target = path.join(root, relative)
    mkdirSync(path.dirname(target), { recursive: true })
    cpSync(source, target)
  }
  return root
}

const runGenerator = (args: readonly string[]) =>
  spawnSync("pnpm", ["exec", "tsx", scriptPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120_000,
  })

const listFiles = (root: string): string[] => {
  const results: string[] = []
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name)
      if (entry.isDirectory()) visit(absolute)
      else results.push(path.relative(root, absolute))
    }
  }
  visit(root)
  return results.sort()
}

describe("versioned TypeScript-to-Go parity generator", () => {
  it("is pure on import and keeps all writes behind an explicit guarded main", () => {
    const source = read(scriptPath).toString("utf8")
    expect(source).toContain("pathToFileURL")
    expect(source).toMatch(/import\.meta\.url\s*===\s*pathToFileURL/)

    const watched = [generatedPath, v116RequestPath, v116ResponsePath]
    const before = watched.map((file) => statSync(file).mtimeMs)
    const imported = spawnSync(
      "pnpm",
      ["exec", "tsx", "-e", `await import(${JSON.stringify(scriptPath)})`],
      { cwd: repoRoot, encoding: "utf8", timeout: 120_000 },
    )
    expect(imported.status, imported.stderr).toBe(0)
    expect(watched.map((file) => statSync(file).mtimeMs)).toEqual(before)
  })

  it("protects immutable v1.16 bytes and exposes only an explicit v1.17 writer", () => {
    const source = read("scripts/generate-go-parity-fixtures.ts").toString("utf8")
    expect(source).toContain('args.includes("--root")')
    expect(source).toContain('args.includes("--versions-only")')
    expect(source).toContain('args.includes("--write-v1.17")')
    expect(source).toContain('args.includes("--write-v1.16")')
    expect(source).toContain("Refusing to rewrite immutable v1.16")
    expect(source).not.toContain("writeFileSync(runtimeExecutionWireGoldenPath")

    expect(
      sha256(read("packages/spec/artifacts/runtime-execution-service-request.v1.16.json")),
    ).toBe("5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5")
    expect(
      sha256(read("packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json")),
    ).toBe("9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97")
  })

  it("refuses a v1.16 write before changing any byte", () => {
    const root = makeVersionRoot()
    const before = listFiles(root).map((relative) => [
      relative,
      sha256(readFileSync(path.join(root, relative))),
    ])
    const completed = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.16",
    ])
    expect(completed.status).toBe(1)
    expect(`${completed.stdout}\n${completed.stderr}`).toContain(
      "Refusing to rewrite immutable v1.16",
    )
    expect(
      listFiles(root).map((relative) => [
        relative,
        sha256(readFileSync(path.join(root, relative))),
      ]),
    ).toEqual(before)
  })

  it("recomputes and reports exact immutable v1.16 request and response bytes", () => {
    const root = makeVersionRoot()
    const completed = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--check",
    ])
    expect(completed.status, completed.stderr).toBe(0)
    expect(completed.stdout).toContain(
      "[GO_PARITY:v1.16] request=5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5 response=9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97 immutable=true",
    )
    expect(readFileSync(path.join(root, path.relative(repoRoot, v116RequestPath)))).toEqual(
      readFileSync(v116RequestPath),
    )
    expect(readFileSync(path.join(root, path.relative(repoRoot, v116ResponsePath)))).toEqual(
      readFileSync(v116ResponsePath),
    )
  })

  it("writes only the exact deterministic v1.17 fixture and version-table set", () => {
    const root = makeVersionRoot()
    const beforeFiles = listFiles(root)
    const first = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17",
      "--check",
    ])
    expect(first.status, first.stderr).toBe(0)

    const added = listFiles(root).filter((relative) => !beforeFiles.includes(relative))
    expect(added).toEqual(
      [candidateRequestRelative, candidateResponseRelative, generatedRelative].sort(),
    )
    expect(readFileSync(path.join(root, candidateRequestRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateRequestRelative)),
    )
    expect(readFileSync(path.join(root, candidateResponseRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateResponseRelative)),
    )

    const firstHashes = Object.fromEntries(
      added.map((relative) => [relative, sha256(readFileSync(path.join(root, relative)))]),
    )
    const second = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17",
      "--check",
    ])
    expect(second.status, second.stderr).toBe(0)
    expect(
      Object.fromEntries(
        added.map((relative) => [relative, sha256(readFileSync(path.join(root, relative)))]),
      ),
    ).toEqual(firstHashes)
  })

  it("fails a stale generated table instead of silently regenerating it", () => {
    const root = makeVersionRoot()
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17",
      "--check",
    ])
    expect(written.status, written.stderr).toBe(0)
    const generated = path.join(root, generatedRelative)
    expect(existsSync(generated)).toBe(true)
    writeFileSync(generated, `${readFileSync(generated, "utf8")}stale\n`)

    const checked = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--check",
    ])
    expect(checked.status).toBe(1)
    expect(`${checked.stdout}\n${checked.stderr}`).toContain(
      "runtime_execution_contract_gen.go is stale",
    )
  })

  it("generates one marked closed version table with deny-by-default dispatch", () => {
    const generated = read("apps/go-backend/runtime_execution_contract_gen.go").toString("utf8")
    expect(generated.match(/Code generated by scripts\/generate-go-parity-fixtures\.ts/g)).toHaveLength(1)
    expect(generated).toContain('"runtime-execution-service-v1.16"')
    expect(generated).toContain('"runtime-invocation-v1.17"')
    expect(generated).toContain("Historical: true")
    expect(generated).toContain("CanonicalJSON: true")
    expect(generated).toContain("runtimeInvocationContractForVersion")
    expect(generated).not.toMatch(/defaultRuntime|fallbackRuntime|return\s+runtimeInvocationContracts\[/)

    const writers = [
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ].filter((relativePath) =>
      read(relativePath).toString("utf8").includes("runtime_execution_contract_gen.go"),
    )
    expect(writers).toEqual([
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ])
  })

  it("rejects unknown and cross-version aliases in the generated dispatch source", () => {
    const generated = read(generatedRelative).toString("utf8")
    expect(generated).toContain("descriptor, ok := runtimeInvocationContracts[version]")
    expect(generated).toContain("return descriptor, ok")
    for (const forbidden of [
      '"strategy-runtime-abi-v1.14"',
      '"strategy-runtime-abi-v1.17"',
      '"runtime-execution-service-v1.17"',
      '"stdin-stdout-json"',
    ]) {
      expect(generated).not.toContain(forbidden)
    }
  })
})
