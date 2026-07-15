import type { Buffer } from "node:buffer"
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
import { RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY } from "../packages/spec/src/index.ts"

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
  "packages/spec/artifacts/runtime-invocation-request.v1.17.candidate.json"
const candidateResponseRelative =
  "packages/spec/artifacts/runtime-invocation-response.v1.17.candidate.wire.json"
const serviceRequestRelative =
  "packages/spec/artifacts/runtime-execution-service-request.v1.17.candidate.json"
const serviceResponseRelative =
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
  for (const source of [
    v116RequestPath,
    v116ResponsePath,
    path.join(repoRoot, "packages/spec/src/runtime-execution-service.ts"),
    path.join(repoRoot, "apps/runtime-service/src/semantic-receipt.ts"),
    path.join(repoRoot, "apps/go-backend/runtime_semantic_receipt.go"),
    path.join(repoRoot, "apps/go-backend/runtime_service_client.go"),
    path.join(repoRoot, "apps/go-backend/runtime_service_client_test.go"),
    path.join(
      repoRoot,
      "packages/persistence/migrations/0017_runtime_semantic_receipts.sql",
    ),
  ]) {
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
      ["exec", "tsx", "-e", `void import(${JSON.stringify(scriptPath)})`],
      { cwd: repoRoot, encoding: "utf8", timeout: 120_000 },
    )
    expect(imported.status, imported.stderr).toBe(0)
    expect(watched.map((file) => statSync(file).mtimeMs)).toEqual(before)
  })

  it("protects immutable v1.16 bytes and exposes only an explicit v1.17 writer", () => {
    const source = read("scripts/generate-go-parity-fixtures.ts").toString(
      "utf8",
    )
    expect(source).toContain('args.includes("--root")')
    expect(source).toContain('args.includes("--versions-only")')
    expect(source).toContain('args.includes("--write-v1.17-invocation")')
    expect(source).toContain('args.includes("--write-v1.17-service")')
    expect(source).toContain('args.includes("--write-v1.16")')
    expect(source).toContain("Refusing to rewrite immutable v1.16")
    expect(source).not.toContain("writeFileSync(runtimeExecutionWireGoldenPath")

    expect(
      sha256(
        read(
          "packages/spec/artifacts/runtime-execution-service-request.v1.16.json",
        ),
      ),
    ).toBe("5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5")
    expect(
      sha256(
        read(
          "packages/spec/artifacts/runtime-execution-service-response.v1.16.wire.json",
        ),
      ),
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
      "--historical-v1.16-only",
      "--check",
    ])
    expect(completed.status, completed.stderr).toBe(0)
    expect(completed.stdout).toContain(
      "[GO_PARITY:v1.16] request=5d04fa4d82eb814bb034ce9b5f1d5c80945e3d4e02c9124ca39a6670e9c0eab5 response=9c870d57e0125eb80ab2ba941ecbbede8a9a775f61c0b278abec25c491374d97 immutable=true",
    )
    expect(
      readFileSync(path.join(root, path.relative(repoRoot, v116RequestPath))),
    ).toEqual(readFileSync(v116RequestPath))
    expect(
      readFileSync(path.join(root, path.relative(repoRoot, v116ResponsePath))),
    ).toEqual(readFileSync(v116ResponsePath))
  })

  it("writes only the exact deterministic v1.17 fixture and version-table set", () => {
    const root = makeVersionRoot()
    const beforeFiles = listFiles(root)
    const first = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(first.status, first.stderr).toBe(0)

    const added = listFiles(root).filter(
      (relative) => !beforeFiles.includes(relative),
    )
    expect(added).toEqual(
      [
        candidateRequestRelative,
        candidateResponseRelative,
        generatedRelative,
      ].sort(),
    )
    expect(readFileSync(path.join(root, candidateRequestRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateRequestRelative)),
    )
    expect(readFileSync(path.join(root, candidateResponseRelative))).toEqual(
      readFileSync(path.join(repoRoot, candidateResponseRelative)),
    )

    const firstHashes = Object.fromEntries(
      added.map((relative) => [
        relative,
        sha256(readFileSync(path.join(root, relative))),
      ]),
    )
    const second = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(second.status, second.stderr).toBe(0)
    expect(
      Object.fromEntries(
        added.map((relative) => [
          relative,
          sha256(readFileSync(path.join(root, relative))),
        ]),
      ),
    ).toEqual(firstHashes)
  }, 30_000)

  it("binds candidate receipt bytes to the canonical success frame", () => {
    const response = JSON.parse(
      read(candidateResponseRelative).toString("utf8"),
    ) as {
      outcome: { value: unknown }
      payloadBinding: { canonicalByteLength: number }
      accounting: {
        receipt: {
          counters: Record<
            "payloadBytes" | "stdoutBytes" | "stderrBytes",
            { delta: number }
          >
        }
      }
    }
    const payloadBytes = Buffer.from(JSON.stringify(response.outcome.value))
    const observedFrameBytes = Buffer.concat([
      Buffer.from("S", "utf8"),
      payloadBytes,
    ])

    expect(response.payloadBinding.canonicalByteLength).toBe(
      payloadBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.payloadBytes.delta).toBe(
      payloadBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.stdoutBytes.delta).toBe(
      observedFrameBytes.byteLength,
    )
    expect(response.accounting.receipt.counters.stderrBytes.delta).toBe(0)
  })

  it("keeps per-invocation and full-service candidate namespaces disjoint", () => {
    const root = makeVersionRoot()
    const invocation = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--check",
    ])
    expect(invocation.status, invocation.stderr).toBe(0)
    expect(existsSync(path.join(root, candidateRequestRelative))).toBe(true)
    expect(existsSync(path.join(root, candidateResponseRelative))).toBe(true)
    expect(existsSync(path.join(root, serviceRequestRelative))).toBe(false)
    expect(existsSync(path.join(root, serviceResponseRelative))).toBe(false)

    const service = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-service",
      "--check",
    ])
    expect(service.status, service.stderr).toBe(0)
    expect(existsSync(path.join(root, serviceRequestRelative))).toBe(true)
    expect(existsSync(path.join(root, serviceResponseRelative))).toBe(true)
    expect(readFileSync(path.join(root, serviceRequestRelative))).not.toEqual(
      readFileSync(path.join(root, candidateRequestRelative)),
    )
    expect(readFileSync(path.join(root, serviceResponseRelative))).not.toEqual(
      readFileSync(path.join(root, candidateResponseRelative)),
    )
  }, 30_000)

  it("fails check mode when either complete v1.17 fixture family is absent", () => {
    const empty = makeVersionRoot()
    const first = runGenerator(["--root", empty, "--versions-only", "--check"])
    expect(first.status).toBe(1)
    expect(`${first.stdout}\n${first.stderr}`).toMatch(/v1\.17|stale/iu)

    const root = makeVersionRoot()
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--write-v1.17-service",
      "--check",
    ])
    expect(written.status, written.stderr).toBe(0)
    rmSync(path.join(root, candidateRequestRelative))
    rmSync(path.join(root, candidateResponseRelative))
    const missingInvocation = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--check",
    ])
    expect(missingInvocation.status).toBe(1)
  }, 30_000)

  it("fails a stale generated table instead of silently regenerating it", () => {
    const root = makeVersionRoot()
    const written = runGenerator([
      "--root",
      root,
      "--versions-only",
      "--write-v1.17-invocation",
      "--write-v1.17-service",
      "--check",
    ])
    expect(written.status, written.stderr).toBe(0)
    const generated = path.join(root, generatedRelative)
    expect(existsSync(generated)).toBe(true)
    writeFileSync(generated, `${readFileSync(generated, "utf8")}stale\n`)

    const checked = runGenerator(["--root", root, "--versions-only", "--check"])
    expect(checked.status).toBe(1)
    expect(`${checked.stdout}\n${checked.stderr}`).toContain(
      "runtime_execution_contract_gen.go is stale",
    )
  }, 30_000)

  it("generates one marked closed version table with deny-by-default dispatch", () => {
    const generated = read(
      "apps/go-backend/runtime_execution_contract_gen.go",
    ).toString("utf8")
    expect(
      generated.match(
        /Code generated by scripts\/generate-go-parity-fixtures\.ts/g,
      ),
    ).toHaveLength(1)
    expect(generated).toContain('"runtime-execution-service-v1.16"')
    expect(generated).toContain('"runtime-invocation-v1.17"')
    expect(generated).toContain('"runtime-execution-service-v1.17"')
    expect(generated).toContain("Historical: true")
    expect(generated).toContain("CanonicalJSON: true")
    expect(generated).toContain("runtimeInvocationContractForVersion")
    expect(generated).not.toMatch(
      /defaultRuntime|fallbackRuntime|return\s+runtimeInvocationContracts\[/,
    )

    const writers = [
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ].filter((relativePath) =>
      read(relativePath)
        .toString("utf8")
        .includes("runtime_execution_contract_gen.go"),
    )
    expect(writers).toEqual([
      "scripts/generate-go-parity-fixtures.ts",
      "scripts/generate-go-parity-fixtures.test.ts",
    ])
  })

  it("rejects unknown and cross-version aliases in the generated dispatch source", () => {
    const generated = read(generatedRelative).toString("utf8")
    expect(generated).toContain("switch version")
    expect(generated).toContain(
      "return runtimeInvocationContractDescriptor{}, false",
    )
    for (const forbidden of [
      '"strategy-runtime-abi-v1.14"',
      '"strategy-runtime-abi-v1.17"',
      '"stdin-stdout-json"',
    ]) {
      expect(generated).not.toContain(forbidden)
    }
  })

  it("generates the exact complete TypeScript retryability matrix for Go consumers", () => {
    const generated = read(generatedRelative).toString("utf8")
    const entries = Object.fromEntries(
      [
        ...generated.matchAll(
          /\tcase "([A-Z0-9_]+)":\n\t\treturn (true|false), true/g,
        ),
      ].map((match) => [match[1], match[2] === "true"]),
    )
    expect(entries).toEqual(
      RUNTIME_INVOCATION_V1_17_SYSTEM_FAILURE_RETRYABILITY,
    )

    const runtimeSource = read(
      "apps/go-backend/runtime_invocation_v1_17.go",
    ).toString("utf8")
    expect(runtimeSource).not.toContain(
      "var runtimeInvocationV117SystemFailureCodes = map[string]bool",
    )
    expect(runtimeSource).toContain(
      "runtimeInvocationV117SystemFailureRetryable(code)",
    )
  })

  it("emits no package-global mutable authority maps", () => {
    const generated = read(generatedRelative).toString("utf8")
    expect(generated).not.toContain(
      "var runtimeInvocationContracts = map[string]runtimeInvocationContractDescriptor",
    )
    expect(generated).not.toContain(
      "var runtimeInvocationV117SystemFailureRetryability = map[string]bool",
    )
    expect(generated).not.toContain(
      "var runtimeServiceContractFailureCodes = map[string]struct{}",
    )
    expect(generated).toContain("switch version")
    expect(generated).toContain("switch code")
    expect(generated).toContain("runtimeInvocationContractsSnapshot")
    expect(generated).toContain(
      "runtimeInvocationV117SystemFailureRetryabilitySnapshot",
    )
    expect(generated).toContain("runtimeServiceContractFailureCodeKnown")
    expect(generated).toContain("runtimeServiceContractFailureCodesSnapshot")
    expect(
      read("apps/go-backend/runtime_service_client.go").toString("utf8"),
    ).toContain("runtimeServiceContractFailureCodeKnown(code)")
  })
})
