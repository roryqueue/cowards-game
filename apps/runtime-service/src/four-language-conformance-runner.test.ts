import { createHash } from "node:crypto"
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import {
  V1_37_CONFORMANCE_CORPUS,
  V1_37_CONFORMANCE_LANGUAGES,
  hashCanonicalConformanceTrace,
  type CanonicalConformanceTrace,
  type V137ConformanceLanguageId,
} from "@cowards/golden"
import { describe, expect, it, vi } from "vitest"
import {
  RETAINED_FOUR_LANGUAGE_PARITY_CERTIFICATION_STATUS,
  V137_REAL_ADAPTER_SELECTORS,
  isValidV137ObservationTraceV4BundleRecord,
  loadCommittedV137ConformanceTraceOracle,
  requireCompleteFourLanguageMatrixV137,
  runCompleteLanguageConformanceLaneV137,
  type V137RealLanguageExecutor,
} from "./four-language-conformance-runner.js"

const workspaceRoot = path.resolve(import.meta.dirname, "../../..")

vi.mock("@cowards/runtime-js", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isVerifiedCountedTypeScriptSupervisedResultV118: (value: unknown) =>
    (value as { verifiedLane?: unknown })?.verifiedLane === "typescript",
}))
vi.mock("@cowards/runtime-python", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isVerifiedCountedPythonSupervisedResultV118: (value: unknown) =>
    (value as { verifiedLane?: unknown })?.verifiedLane === "python",
}))
vi.mock("@cowards/runtime-wasm-wasi", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  isVerifiedCountedWasmWasiSupervisedResultV118: (value: unknown) =>
    ["rust", "zig"].includes(
      String((value as { verifiedLane?: unknown })?.verifiedLane),
    ),
}))

const sha256 = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const committedOracle = loadCommittedV137ConformanceTraceOracle()
const committedTrace = (caseId: string): CanonicalConformanceTrace => {
  const trace = committedOracle.traceForCase(caseId)
  if (trace === undefined) throw new Error(`Missing committed trace ${caseId}`)
  return trace
}

const adapterResult = (
  languageId: V137ConformanceLanguageId,
  resultClass: "success" | "player_violation" | "system_failure",
  caseId: string,
) => {
  if (resultClass === "system_failure") {
    return {
      verifiedLane: languageId,
      kind: "system_failure",
      gameplayDisposition: "no_mutation",
      code: "EXPECTED_SYSTEM_FAILURE",
    }
  }
  return {
    verifiedLane: languageId,
    kind: resultClass,
    gameplayDisposition:
      resultClass === "success" ? "accept_success" : "apply_player_violation",
    signedEvidence: {
      evidenceSha256: sha256(`${languageId}:${resultClass}:signed`),
      evidence: {
        rawReceiptSha256: sha256(`${languageId}:${resultClass}:supervisor`),
        invocationRequestSha256: sha256(`${languageId}:${caseId}:invocation`),
        identityPins: { laneId: languageId },
      },
    },
  }
}

const executor = (
  languageId: V137ConformanceLanguageId,
  mutate?: (trace: CanonicalConformanceTrace, caseId: string) => void,
): V137RealLanguageExecutor => ({
  languageId,
  executeCase: vi.fn(({ testCase, fixture }) => {
    expect(fixture.languageId).toBe(languageId)
    expect(fixture.sourceSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    const trace = globalThis.structuredClone(committedTrace(testCase.id))
    mutate?.(trace, testCase.id)
    return {
      executionMode: "supervised_real_adapter" as const,
      adapterSelectorId: V137_REAL_ADAPTER_SELECTORS[languageId],
      trace,
      adapterResult: adapterResult(
        languageId,
        testCase.expectation.resultClass,
        testCase.id,
      ) as never,
    }
  }),
})

describe("v1.37 four-language conformance runner", () => {
  it("loads an immutable exact oracle without exposing mutable trace storage", () => {
    const oracle = loadCommittedV137ConformanceTraceOracle()
    const firstCase = V1_37_CONFORMANCE_CORPUS.cases[0]!
    const trace = oracle.traceForCase(firstCase.id)

    expect(oracle.caseIds).toEqual(
      V1_37_CONFORMANCE_CORPUS.cases.map(({ id }) => id),
    )
    expect(Object.isFrozen(oracle)).toBe(true)
    expect(Object.isFrozen(oracle.caseIds)).toBe(true)
    expect(oracle).not.toHaveProperty("traces")
    expect(trace).toMatchObject({ caseId: firstCase.id })
    expect(Object.isFrozen(trace)).toBe(true)
    expect(oracle.traceForCase("case:missing")).toBeUndefined()
  })

  it("rejects symlinked committed-oracle registry bytes", () => {
    const repoRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v137-oracle-no-follow-"),
    )
    const registryRelative =
      "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json"
    const registryPath = path.join(repoRoot, registryRelative)
    const realRegistryPath = path.resolve(workspaceRoot, registryRelative)
    mkdirSync(path.dirname(registryPath), { recursive: true })
    symlinkSync(realRegistryPath, registryPath)
    try {
      expect(() =>
        loadCommittedV137ConformanceTraceOracle({ repoRoot }),
      ).toThrow(/not regular/u)
    } finally {
      rmSync(repoRoot, { recursive: true, force: true })
    }
  })

  it("rechecks exact evidence bytes before reusing an immutable oracle", () => {
    const repoRoot = mkdtempSync(
      path.join(tmpdir(), "cowards-v137-oracle-cache-integrity-"),
    )
    const registryRelative =
      "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json"
    const sourceRegistryPath = path.resolve(workspaceRoot, registryRelative)
    const registry = JSON.parse(readFileSync(sourceRegistryPath, "utf8")) as {
      activePath: string
    }
    const targetRegistryPath = path.join(repoRoot, registryRelative)
    mkdirSync(path.dirname(targetRegistryPath), { recursive: true })
    cpSync(sourceRegistryPath, targetRegistryPath)
    cpSync(
      path.resolve(workspaceRoot, registry.activePath),
      path.join(repoRoot, registry.activePath),
      { recursive: true },
    )
    try {
      expect(
        loadCommittedV137ConformanceTraceOracle({ repoRoot }).activeVersion,
      ).toBeTruthy()
      const manifestPath = path.join(
        repoRoot,
        registry.activePath,
        "manifest.json",
      )
      writeFileSync(manifestPath, `${readFileSync(manifestPath, "utf8")}\n`)
      expect(() =>
        loadCommittedV137ConformanceTraceOracle({ repoRoot }),
      ).toThrow(/authority is invalid/u)
    } finally {
      rmSync(repoRoot, { recursive: true, force: true })
    }
  }, 15_000)

  it("rejects every inconsistent v4 canonical-input and evidence projection class", () => {
    const candidateDirectory = path.resolve(
      workspaceRoot,
      "packages/golden/src/fixtures/v1-37-conformance-traces/v1.37-observation-trace-v4",
    )
    const bundle = JSON.parse(
      readFileSync(path.join(candidateDirectory, "traces.bundle.json"), "utf8"),
    ) as { records: Record<string, unknown>[] }
    const manifest = JSON.parse(
      readFileSync(path.join(candidateDirectory, "manifest.json"), "utf8"),
    ) as { cases: Record<string, unknown>[] }
    const testCase = V1_37_CONFORMANCE_CORPUS.cases.find(
      ({ id }) => id === "normative-first-active-turn-to-stone",
    )!
    const ordinal = bundle.records.findIndex(
      ({ caseId }) => caseId === testCase.id,
    )
    const record = bundle.records[ordinal]!
    const manifestCase = manifest.cases[ordinal]!
    const valid = (candidate: Record<string, unknown>): boolean =>
      isValidV137ObservationTraceV4BundleRecord({
        record: candidate,
        manifestCase,
        ordinal,
        testCase,
      })
    expect(valid(record)).toBe(true)

    const mutations = [
      (candidate: Record<string, unknown>) => {
        const canonicalInput = candidate.canonicalInput as Record<
          string,
          unknown
        >
        const recordedCase = canonicalInput.testCase as Record<string, unknown>
        recordedCase.id = "mutated-case-id"
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        const states = evidence.states as Record<string, unknown>
        states.finalStateHash = sha256("mutated-state")
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        evidence.events = []
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        evidence.memories = []
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        evidence.objectives = []
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        const terminal = evidence.terminal as Record<string, unknown>
        terminal.outcomeHash = sha256("mutated-terminal")
      },
      (candidate: Record<string, unknown>) => {
        const evidence = candidate.evidence as Record<string, unknown>
        evidence.failure = {}
      },
    ]
    for (const mutate of mutations) {
      const candidate = globalThis.structuredClone(record)
      mutate(candidate)
      expect(valid(candidate)).toBe(false)
    }
  })

  it("executes the identical shared matrix through TypeScript and Python real-adapter seams", async () => {
    for (const languageId of ["typescript", "python"] as const) {
      const laneExecutor = executor(languageId)
      const result = await runCompleteLanguageConformanceLaneV137({
        executor: laneExecutor,
      })
      expect(result).toMatchObject({
        status: "passed",
        languageId,
        adapterSelectorId: V137_REAL_ADAPTER_SELECTORS[languageId],
        divergence: null,
      })
      expect(result.cases).toHaveLength(V1_37_CONFORMANCE_CORPUS.cases.length)
      expect(laneExecutor.executeCase).toHaveBeenCalledTimes(
        V1_37_CONFORMANCE_CORPUS.cases.length,
      )
      expect(JSON.stringify(result)).not.toMatch(
        /"source"|"sourceBytes"|"artifactBytes"|"strategyMemory"|"soldierMemory"|"objective"|"diagnostics"|"stderr"|\/Users\//iu,
      )
    }
  }, 20_000)

  it("keeps Rust and Zig as distinct WASI lanes with separate identity roots", async () => {
    const rust = await runCompleteLanguageConformanceLaneV137({
      executor: executor("rust"),
    })
    const zig = await runCompleteLanguageConformanceLaneV137({
      executor: executor("zig"),
    })
    expect(rust.status).toBe("passed")
    expect(zig.status).toBe("passed")
    expect(rust.adapterSelectorId).toBe("rust-wasmtime-native-supervised-v1.18")
    expect(zig.adapterSelectorId).toBe("zig-wasmtime-native-supervised-v1.18")
    expect(rust.cases[0]?.identitySha256).not.toBe(zig.cases[0]?.identitySha256)
  }, 20_000)

  it("rejects declaration-only, skipped, unsupported, and unsigned lane results", async () => {
    const declared = executor("typescript")
    declared.executeCase = vi.fn(({ testCase }) => ({
      executionMode: "declared" as "supervised_real_adapter",
      adapterSelectorId: V137_REAL_ADAPTER_SELECTORS.typescript,
      trace: committedTrace(testCase.id),
      adapterResult: adapterResult(
        "typescript",
        testCase.expectation.resultClass,
        testCase.id,
      ) as never,
    }))
    await expect(
      runCompleteLanguageConformanceLaneV137({ executor: declared }),
    ).resolves.toMatchObject({
      status: "failed",
      divergence: { code: "REAL_ADAPTER_REQUIRED" },
    })

    const unverified = executor("python")
    unverified.executeCase = vi.fn(({ testCase }) => ({
      executionMode: "supervised_real_adapter" as const,
      adapterSelectorId: V137_REAL_ADAPTER_SELECTORS.python,
      trace: committedTrace(testCase.id),
      adapterResult: {
        ...adapterResult(
          "python",
          testCase.expectation.resultClass,
          testCase.id,
        ),
        verifiedLane: "forged",
      } as never,
    }))
    await expect(
      runCompleteLanguageConformanceLaneV137({ executor: unverified }),
    ).resolves.toMatchObject({
      status: "failed",
      divergence: { code: "REAL_ADAPTER_REQUIRED" },
    })

    const replayedEvidence = executor("typescript")
    replayedEvidence.executeCase = vi.fn(({ testCase }) => ({
      executionMode: "supervised_real_adapter" as const,
      adapterSelectorId: V137_REAL_ADAPTER_SELECTORS.typescript,
      trace: committedTrace(testCase.id),
      adapterResult: adapterResult(
        "typescript",
        testCase.expectation.resultClass,
        "replayed-invocation",
      ) as never,
    }))
    await expect(
      runCompleteLanguageConformanceLaneV137({
        executor: replayedEvidence,
      }),
    ).resolves.toMatchObject({
      status: "failed",
      divergence: { code: "ADAPTER_RESULT_MISMATCH" },
    })

    const unavailable = executor("rust")
    unavailable.executeCase = vi.fn(() => {
      throw new Error("compiler unavailable")
    })
    await expect(
      runCompleteLanguageConformanceLaneV137({ executor: unavailable }),
    ).resolves.toMatchObject({
      status: "failed",
      runRootSha256: null,
      divergence: { code: "LANE_EXECUTION_FAILED" },
    })
  })

  it("quarantines the first full-trace mismatch with restricted hashes only", async () => {
    const result = await runCompleteLanguageConformanceLaneV137({
      executor: executor("zig", (trace, caseId) => {
        if (caseId !== V1_37_CONFORMANCE_CORPUS.cases[0]!.id) return
        const mutable = trace as {
          finalStateHash: string
          traceRoot: string
        }
        mutable.finalStateHash = sha256("mutated-final-state")
        mutable.traceRoot = hashCanonicalConformanceTrace(trace)
      }),
    })
    expect(result).toMatchObject({
      status: "failed",
      languageId: "zig",
      cases: [],
      runRootSha256: null,
      divergence: {
        code: "TRACE_DIVERGENCE",
        caseId: V1_37_CONFORMANCE_CORPUS.cases[0]!.id,
      },
    })
    expect(JSON.stringify(result.divergence)).not.toMatch(
      /source|artifact|memory|objective|diagnostics|stderr|hostPath|\/Users\//iu,
    )
  })

  it("requires all four complete lanes against one committed oracle", async () => {
    const lanes = await Promise.all(
      V1_37_CONFORMANCE_LANGUAGES.map((languageId) =>
        runCompleteLanguageConformanceLaneV137({
          executor: executor(languageId),
        }),
      ),
    )
    const matrix = requireCompleteFourLanguageMatrixV137(lanes)
    expect(matrix).toMatchObject({
      schemaVersion: "v1.37-complete-four-language-matrix-v1",
      corpusRootSha256: V1_37_CONFORMANCE_CORPUS.corpusRootSha256,
    })
    expect(Object.keys(matrix.laneRunRoots)).toEqual(
      V1_37_CONFORMANCE_LANGUAGES,
    )
    expect(matrix.matrixRootSha256).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(() => requireCompleteFourLanguageMatrixV137(lanes.slice(1))).toThrow(
      /Complete four-language matrix/u,
    )
    expect(RETAINED_FOUR_LANGUAGE_PARITY_CERTIFICATION_STATUS).toBe(
      "non_promoting_regression_only",
    )
  }, 60_000)
})
