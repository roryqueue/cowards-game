import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  captureRuntimeAbiTestReceiptProvenance,
  createRuntimeAbiTestReceipt,
  parseRuntimeAbiTestReceipt,
  parseRuntimeAbiTestManifest,
  projectRuntimeAbiTestExecutionResult,
  projectRuntimeAbiTestResult,
  runtimeAbiCommandDefinitionsSha256,
  validateGoTestSourceOwnership,
  validateRuntimeAbiTestResult,
  verifyRuntimeAbiTestReceiptByRerun,
  verifyRuntimeAbiTestReceiptProvenance,
  type RuntimeAbiTestEntry,
  type RuntimeAbiTestManifest,
  type RuntimeAbiTestReceiptProvenance,
  type RuntimeAbiTestReceiptResult,
} from "./run-v1-37-runtime-abi-test-manifest.js"

type TestManifest = {
  schemaVersion?: string
  tests?: Array<{
    id?: string
    stage?: string
    command?: readonly string[]
    namedResult?: string
    database?: { dsnEnvironmentVariable?: string; skipAllowed?: boolean }
  }>
}

const manifest = (): TestManifest =>
  JSON.parse(
    readFileSync(
      "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
      "utf8",
    ),
  ) as TestManifest

const syntheticProvenance = (
  parsed: RuntimeAbiTestManifest,
): RuntimeAbiTestReceiptProvenance => ({
  mode: "local-authoritative-rerun-v1",
  git: {
    executionCommit: "a".repeat(40),
    executionTree: "b".repeat(40),
    worktreeStateSha256:
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    worktreeClean: true,
  },
  commandDefinitionsSha256: runtimeAbiCommandDefinitionsSha256(parsed.tests),
  outputDigestProfile: "runtime-abi-named-evidence-v1",
})

const passingOutput = (test: RuntimeAbiTestEntry): string => {
  switch (test.kind) {
    case "vitest":
      return `${test.ownedFiles.map((path) => ` ✓ ${path}`).join("\n")}\n${test.expectedOutput.join("\n")}\n Test Files  ${test.ownedFiles.length} passed (${test.ownedFiles.length})\n Tests  1 passed (1)`
    case "go":
      return `=== RUN   ${test.namedResult}\n--- PASS: ${test.namedResult} (0.00s)\nPASS\nok example.test 0.001s`
    case "playwright":
      return `${test.ownedFiles[0]}\n${test.expectedOutput.join("\n")}\n1 passed`
    case "command":
      throw new Error("unsupported")
  }
}

const syntheticResults = (
  parsed: RuntimeAbiTestManifest,
): readonly RuntimeAbiTestReceiptResult[] =>
  parsed.tests.map((test) =>
    projectRuntimeAbiTestExecutionResult(
      test,
      { status: 0, stdout: passingOutput(test), stderr: "" },
      test.database !== undefined,
    ),
  )

describe("Phase 258 exact runtime ABI test manifest", () => {
  it("exposes exact package entry points for closure and staged execution", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>
    }
    expect(packageJson.scripts).toMatchObject({
      "v1.37:runtime-abi-manifest:check":
        "pnpm exec tsx scripts/check-v1-37-runtime-abi-manifest-closure.ts --check",
      "v1.37:runtime-abi-tests":
        "pnpm exec tsx scripts/run-v1-37-runtime-abi-test-manifest.ts",
    })
  })

  it("owns exact named Go default, route, mixed, and historical cases", () => {
    const document = manifest()
    expect(document.schemaVersion).toBe("runtime-abi-v1.17-test-manifest-v1")
    const names = new Set(document.tests?.map(({ namedResult }) => namedResult))
    for (const name of [
      "TestPhase258ProviderValidationV117Admission",
      "TestPhase258CurrentDefaultRuntimeServiceContract",
      "TestPhase258CurrentDefaultRoutes",
      "TestPhase258MixedRuntimeContractFailsClosed",
      "TestPhase258HistoricalV116Dispatch",
      "TestPhase258ActivatedDefaultRoutes",
    ]) {
      expect(names.has(name), name).toBe(true)
    }
  })

  it("requires a real activation-only assertion that fails before the flip", () => {
    const parsed = parseRuntimeAbiTestManifest(manifest())
    const activation = parsed.tests.filter(
      ({ stage }) => stage === "activation",
    )
    expect(activation.map(({ namedResult }) => namedResult)).toEqual([
      "phase258-full-engine-compatibility",
      "phase258-full-replay-compatibility",
      "phase258-cross-package-current-callers",
      "phase258-activation-critical-contracts",
      "TestPhase258ActivatedDefaultRoutes",
    ])
  })

  it("requires exact commands and forbids skip for every named DB test", () => {
    const tests = manifest().tests ?? []
    expect(tests.length).toBeGreaterThan(0)
    for (const test of tests) {
      expect(test.id).toMatch(/^[a-z0-9][a-z0-9._:-]+$/u)
      expect(test.stage).toMatch(/^(preactivation|activation|postactivation)$/u)
      expect(test.command?.length).toBeGreaterThan(2)
      expect(test.command?.join(" ")).not.toMatch(/^pnpm (?:run )?test$/u)
      if (test.command?.[0] === "go" && test.command[1] === "test") {
        expect(test.command).toEqual(expect.arrayContaining(["-run"]))
      }
      expect(test.namedResult).toBeTruthy()
      if (test.database !== undefined) {
        expect(test.database.dsnEnvironmentVariable).toBeTruthy()
        expect(test.database.skipAllowed).toBe(false)
      }
    }
  })

  it("rejects fake filters and marker-only shell commands", () => {
    const raw = manifest() as unknown as {
      tests: Array<Record<string, unknown>>
    }
    const fakeFilter = globalThis.structuredClone(raw)
    fakeFilter.tests[0]!.command = ["pnpm", "test", "--", "--filter=fake"]
    expect(() => parseRuntimeAbiTestManifest(fakeFilter)).toThrow(
      /exact command/u,
    )

    const markerOnly = globalThis.structuredClone(raw)
    markerOnly.tests[0]!.command = [
      "node",
      "-e",
      "console.log('canonical-identity-domains.test.ts')",
    ]
    expect(() => parseRuntimeAbiTestManifest(markerOnly)).toThrow(
      /exact command/u,
    )
  })

  it("requires structured PASS and rejects all-skipped Vitest output", () => {
    const parsed = parseRuntimeAbiTestManifest(manifest())
    const test = parsed.tests.find(({ id }) => id === "phase258.scripts")
    if (test === undefined) throw new Error("scripts manifest entry missing")
    const namedFiles = test.ownedFiles.map((path) => ` ✓ ${path}`).join("\n")
    const fileCount = test.command.filter((argument) =>
      argument.endsWith(".test.ts"),
    ).length
    expect(() =>
      validateRuntimeAbiTestResult(
        test,
        `${namedFiles}\n Test Files  ${fileCount} skipped (${fileCount})\n Tests  ${fileCount} skipped (${fileCount})`,
      ),
    ).toThrow(/skipped/u)
    expect(() =>
      validateRuntimeAbiTestResult(
        test,
        `canonical-identity-domains.test.ts\n Test Files  ${fileCount} passed (${fileCount})\n Tests  ${fileCount} passed (${fileCount})`,
      ),
    ).toThrow(/named file/u)
    expect(() =>
      validateRuntimeAbiTestResult(
        test,
        `${namedFiles}\n Test Files  ${fileCount} passed (${fileCount})\n Tests  19 passed (19)`,
      ),
    ).not.toThrow()
    expect(() =>
      validateRuntimeAbiTestResult(
        test,
        `${namedFiles}\n ✓ rejects all-skipped Vitest output\n Test Files  ${fileCount} passed (${fileCount})\n Tests  19 passed (19)`,
      ),
    ).not.toThrow()

    expect(
      projectRuntimeAbiTestResult(
        test,
        `${namedFiles}\n Test Files  ${fileCount} passed (${fileCount})\n Tests  19 passed (19)`,
        false,
      ),
    ).toMatchObject({
      id: "phase258.scripts",
      status: "PASS",
      passedCount: 19,
      skippedCount: 0,
      databaseRequired: false,
      databaseObserved: false,
    })
  })

  it("proves exact named Go test ownership from syntax, not verbose markers", () => {
    const parsed = parseRuntimeAbiTestManifest(manifest())
    const test = parsed.tests.find(
      ({ id }) => id === "phase258.go.current-contract",
    )
    if (test === undefined) throw new Error("Go manifest entry missing")
    const root = mkdtempSync(join(tmpdir(), "phase258-go-ownership-"))
    const goDirectory = join(root, "apps/go-backend")
    const ownedFile = join(goDirectory, "runtime_service_client_v1_17_test.go")
    const decoyFile = join(goDirectory, "decoy_test.go")
    mkdirSync(goDirectory, { recursive: true })
    try {
      writeFileSync(
        ownedFile,
        `package main\n\nimport "testing"\n\nfunc ${test.namedResult}(t *testing.T) {}\n`,
      )
      writeFileSync(decoyFile, "package main\n")
      expect(() => validateGoTestSourceOwnership(test, root)).not.toThrow()
      expect(() =>
        validateRuntimeAbiTestResult(
          test,
          `=== RUN   ${test.namedResult}\n--- PASS: ${test.namedResult} (0.00s)\nPASS\nok example.test 0.001s`,
        ),
      ).not.toThrow()

      writeFileSync(
        ownedFile,
        `package main\n\nconst marker = "func ${test.namedResult}"\n`,
      )
      writeFileSync(
        decoyFile,
        `package main\n\nimport "testing"\n\nfunc ${test.namedResult}(t *testing.T) {}\n`,
      )
      expect(() => validateGoTestSourceOwnership(test, root)).toThrow(
        /owned Go source/u,
      )
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it("projects a deterministic privacy-safe receipt bound to the exact manifest", () => {
    const raw = readFileSync(
      "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
    )
    const parsed = parseRuntimeAbiTestManifest(JSON.parse(raw.toString("utf8")))
    const selected = parsed.tests
    const results = syntheticResults(parsed)
    const receipt = createRuntimeAbiTestReceipt({
      stage: "postactivation",
      manifestBytes: raw,
      manifest: parsed,
      provenance: syntheticProvenance(parsed),
      results,
    })

    expect(receipt).toMatchObject({
      schemaVersion: "runtime-abi-v1.17-test-receipt-v2",
      activationPlan: "258-14",
      stage: "postactivation",
      selectedCommandCount: selected.length,
      provenance: {
        mode: "local-authoritative-rerun-v1",
        outputDigestProfile: "runtime-abi-named-evidence-v1",
      },
    })
    expect(receipt.testManifestSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    for (const result of receipt.results) {
      expect(result).toMatchObject({ exitStatus: 0, status: "PASS" })
      for (const digest of [
        result.commandSha256,
        result.stdoutSha256,
        result.stderrSha256,
        result.outputSha256,
        result.namedEvidenceSha256,
      ]) {
        expect(digest).toMatch(/^sha256:[0-9a-f]{64}$/u)
      }
    }
    expect(JSON.stringify(receipt)).not.toMatch(
      /DATABASE_URL|postgres(?:ql)?|"duration|"stderr":|"stdout":|"command":|"environment"/iu,
    )
    expect(() =>
      parseRuntimeAbiTestReceipt(receipt, {
        manifestBytes: raw,
        manifest: parsed,
        requiredStage: "postactivation",
      }),
    ).not.toThrow()
  })

  it("rejects partial, fake, skipped, and stale test receipts", () => {
    const raw = readFileSync(
      "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
    )
    const parsed = parseRuntimeAbiTestManifest(JSON.parse(raw.toString("utf8")))
    const results = syntheticResults(parsed)
    const valid = createRuntimeAbiTestReceipt({
      stage: "postactivation",
      manifestBytes: raw,
      manifest: parsed,
      provenance: syntheticProvenance(parsed),
      results,
    })
    const options = {
      manifestBytes: raw,
      manifest: parsed,
      requiredStage: "postactivation" as const,
    }
    const attacks = [
      { ...valid, results: valid.results.slice(1) },
      {
        ...valid,
        results: valid.results.map((result, index) =>
          index === 0 ? { ...result, namedResult: "fake-pass" } : result,
        ),
      },
      {
        ...valid,
        results: valid.results.map((result, index) =>
          index === 0 ? { ...result, skippedCount: 1 } : result,
        ),
      },
      { ...valid, testManifestSha256: `sha256:${"0".repeat(64)}` },
      {
        ...valid,
        provenance: {
          ...valid.provenance,
          commandDefinitionsSha256: `sha256:${"0".repeat(64)}`,
        },
      },
    ]
    for (const attacked of attacks) {
      expect(() => parseRuntimeAbiTestReceipt(attacked, options)).toThrow()
    }
  })

  it("binds the authoritative receipt to an exact clean commit, tree, and command set", () => {
    const parsed = parseRuntimeAbiTestManifest(manifest())
    const responses = new Map<string, string>([
      ["rev-parse HEAD", "a".repeat(40)],
      ["rev-parse HEAD^{tree}", "b".repeat(40)],
      ["status --porcelain=v1 --untracked-files=all", ""],
    ])
    const provenance = captureRuntimeAbiTestReceiptProvenance({
      manifest: parsed,
      stage: "postactivation",
      runGit: (args) => ({
        status: 0,
        stdout: `${responses.get(args.join(" ")) ?? ""}\n`.replace(/^\n$/u, ""),
        stderr: "",
      }),
    })
    expect(provenance).toEqual(syntheticProvenance(parsed))
    expect(() =>
      captureRuntimeAbiTestReceiptProvenance({
        manifest: parsed,
        stage: "postactivation",
        runGit: (args) => ({
          status: 0,
          stdout:
            args[0] === "status"
              ? " M scripts/fabricated.ts\n"
              : `${(args.at(-1) === "HEAD^{tree}" ? "b" : "a").repeat(40)}\n`,
          stderr: "",
        }),
      }),
    ).toThrow(/clean execution worktree/iu)
  })

  it("rejects fabricated or stale provenance and reruns exact command evidence", () => {
    const raw = readFileSync(
      "packages/spec/artifacts/runtime-abi-v1.17-test-manifest.json",
    )
    const parsed = parseRuntimeAbiTestManifest(JSON.parse(raw.toString("utf8")))
    const results = syntheticResults(parsed)
    const receipt = createRuntimeAbiTestReceipt({
      stage: "postactivation",
      manifestBytes: raw,
      manifest: parsed,
      provenance: syntheticProvenance(parsed),
      results,
    })
    const runGit = (
      args: readonly string[],
      options?: { readonly allowFailure?: boolean },
    ) => {
      const joined = args.join(" ")
      if (joined === `rev-parse ${"a".repeat(40)}^{tree}`) {
        return { status: 0, stdout: `${"b".repeat(40)}\n`, stderr: "" }
      }
      if (joined === "rev-parse HEAD") {
        return { status: 0, stdout: `${"c".repeat(40)}\n`, stderr: "" }
      }
      if (joined.startsWith("merge-base --is-ancestor")) {
        return { status: 0, stdout: "", stderr: "" }
      }
      if (joined.startsWith("diff --name-only")) {
        return {
          status: 0,
          stdout:
            "packages/spec/artifacts/runtime-abi-v1.17-test-receipt.json\n",
          stderr: "",
        }
      }
      if (joined === "status --porcelain=v1 --untracked-files=all") {
        return { status: 0, stdout: "", stderr: "" }
      }
      return {
        status: options?.allowFailure ? 1 : 0,
        stdout: "",
        stderr: "",
      }
    }
    expect(() =>
      verifyRuntimeAbiTestReceiptProvenance(receipt, {
        manifest: parsed,
        runGit,
      }),
    ).not.toThrow()
    expect(() =>
      verifyRuntimeAbiTestReceiptByRerun(receipt, {
        manifest: parsed,
        execute: (test) => results.find(({ id }) => id === test.id)!,
      }),
    ).not.toThrow()

    expect(() =>
      verifyRuntimeAbiTestReceiptProvenance(receipt, {
        manifest: parsed,
        runGit: (args, options) =>
          args[0] === "diff"
            ? {
                status: 0,
                stdout: "scripts/fabricated-source.ts\n",
                stderr: "",
              }
            : runGit(args, options),
      }),
    ).toThrow(/stale after source changes/iu)
    expect(() =>
      verifyRuntimeAbiTestReceiptProvenance(receipt, {
        manifest: parsed,
        runGit: (args, options) =>
          args[0] === "status"
            ? {
                status: 0,
                stdout: " M scripts/fabricated-source.ts\n",
                stderr: "",
              }
            : runGit(args, options),
      }),
    ).toThrow(/worktree is dirty/iu)
    expect(() =>
      verifyRuntimeAbiTestReceiptByRerun(receipt, {
        manifest: parsed,
        execute: (test) => {
          const result = results.find(({ id }) => id === test.id)!
          return test.id === parsed.tests[0]!.id
            ? { ...result, stdoutSha256: `sha256:${"0".repeat(64)}` }
            : result
        },
      }),
    ).toThrow(/rerun evidence mismatch/iu)
  })
})
