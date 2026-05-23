import { beforeAll, describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  assertRequiredSandboxCandidatesPassed,
  assertRuntimeIsolationReadinessGuardrails,
  assertSandboxEvaluationPublicSafe,
  evaluateSandboxCandidate,
  evaluateRuntimeSandboxes,
  SANDBOX_CANDIDATES,
  SANDBOX_PROBES,
  type SandboxEvaluationReport,
  type SandboxCandidateDefinition,
} from "./sandbox-evaluation.js"
import type {
  StrategyExecutionAdapter,
  StrategyExecutionRequest,
} from "./adapter.js"

const fakeMetadata = {
  id: "fake-optional",
  label: "Fake optional",
  default: false,
  productionReadiness: "prototype",
  isolationBoundary: "Test-only optional boundary.",
  notes: [],
  runtimeControls: {
    timeout: true,
    timeoutMs: 500,
    outputByteLimit: true,
    environment: "empty",
    execArgv: "empty",
    resourceLimits: [],
    filesystem: "none",
    network: "disabled",
    shell: "disabled",
  },
} satisfies StrategyExecutionAdapter["metadata"]

const fakeOptionalAdapter = (): StrategyExecutionAdapter => ({
  metadata: fakeMetadata,
  execute(request: StrategyExecutionRequest) {
    const source = request.source
    if (source.includes('action: { type: "FLY" }')) {
      return {
        ok: true,
        value: { action: { type: "FLY" }, soldierMemory: {} },
      }
    }
    if (source.includes('throw new Error("sandbox probe")')) {
      return {
        ok: false,
        violation: {
          type: "THROWN_EXCEPTION",
          message: "Strategy exception",
        },
      }
    }
    if (source.includes("console.")) {
      return {
        ok: false,
        violation: {
          type: "FORBIDDEN_CAPABILITY",
          message: "Forbidden capability",
        },
      }
    }
    if (source.includes("while (true)")) {
      return {
        ok: false,
        violation: { type: "TIMEOUT", message: "Strategy timed out" },
      }
    }
    if (
      source.includes(".repeat(4096)") ||
      source.includes(".repeat(32769)") ||
      source.includes(".repeat(2049)") ||
      source.includes(".repeat(2048)")
    ) {
      return {
        ok: false,
        violation: {
          type: "OVERSIZED_OUTPUT",
          message: "Strategy output exceeded limit",
        },
      }
    }
    return {
      ok: false,
      violation: {
        type: "FORBIDDEN_CAPABILITY",
        message: "Forbidden capability",
      },
    }
  },
})

describe("runtime sandbox evaluation harness", () => {
  let report: SandboxEvaluationReport

  beforeAll(() => {
    report = evaluateRuntimeSandboxes({ defaultProbeTimeoutMs: 5_000 })
  }, 120_000)

  it("evaluates executable candidates without promoting any sandbox", () => {
    expect(report.countedMatchDefaultsUnchanged).toBe(true)
    expect(report.noCandidatePromoted).toBe(true)
    expect(report.publicSafe).toBe(true)
    expect(report.candidates.map((candidate) => candidate.id)).toContain(
      "worker-thread-baseline",
    )
    expect(report.candidates.map((candidate) => candidate.id)).toContain(
      "host-subprocess",
    )
    expect(report.candidates.map((candidate) => candidate.id)).toContain(
      "container-subprocess",
    )

    const executable = report.candidates.filter(
      (candidate) => candidate.mode === "executable",
    )
    expect(executable).toHaveLength(2)
    for (const candidate of executable) {
      expect(candidate.status).toBe("passed")
      expect(candidate.summary.failed).toBe(0)
      expect(candidate.summary.passed).toBe(SANDBOX_PROBES.length)
      expect(candidate.tradeoffs.noPromotionDecision).toMatch(/not promoted/i)
    }
  })

  it("keeps executable adapter ids mapped separately from spec adapter ids", () => {
    const worker = report.candidates.find(
      (candidate) => candidate.id === "worker-thread-baseline",
    )
    const subprocess = report.candidates.find(
      (candidate) => candidate.id === "host-subprocess",
    )

    expect(worker?.executableAdapterId).toBe("worker-thread")
    expect(worker?.specAdapterId).toBe("runtime-js-worker-thread")
    expect(subprocess?.executableAdapterId).toBe("subprocess")
    expect(subprocess?.specAdapterId).toBe("runtime-js-subprocess")
  })

  it("records tradeoff-only candidates without executable probes", () => {
    const tradeoffOnly = report.candidates.filter(
      (candidate) => candidate.mode === "tradeoff-only",
    )

    expect(tradeoffOnly.map((candidate) => candidate.id)).toEqual([
      "deno-permissions",
      "wasm-wasi",
      "gvisor-runsc",
      "microvm-firecracker",
    ])
    for (const candidate of tradeoffOnly) {
      expect(candidate.status).toBe("skipped")
      expect(candidate.summary.skipped).toBe(SANDBOX_PROBES.length)
      expect(
        candidate.tradeoffs.unresolvedProductionRisks.length,
      ).toBeGreaterThan(0)
    }
  })

  it("records optional executable candidates as locally skipped by default", () => {
    const container = report.candidates.find(
      (candidate) => candidate.id === "container-subprocess",
    )

    expect(container?.mode).toBe("optional-executable")
    expect(container?.status).toBe("skipped")
    expect(container?.skipReason).toMatch(/unavailable locally/i)
  })

  it("executes optional executable candidates when availability is true", () => {
    const candidate: SandboxCandidateDefinition = {
      id: "fake-optional",
      label: "Fake optional executable",
      mode: "optional-executable",
      executableAdapterId: "fake-optional",
      supportedLocally: true,
      noPromotionDecision:
        "Evaluation-only in v1.8; not promoted to production hostile-code isolation or new counted-play eligibility.",
      containmentGaps: ["Test-only candidate."],
      deterministicExecutionRisk: "Test-only risk.",
      resourceLimitNotes: "Test-only limits.",
      developerErgonomics: "Test-only ergonomics.",
      adapterMetadataImplications: "Test-only metadata.",
      unresolvedProductionRisks: ["Test-only risk."],
      createAdapter: fakeOptionalAdapter,
      availability: () => true,
    }

    const result = evaluateSandboxCandidate(candidate)

    expect(result.status).toBe("passed")
    expect(result.summary.skipped).toBe(0)
    expect(result.summary.failed).toBe(0)
    expect(result.summary.passed).toBe(SANDBOX_PROBES.length)
  })

  it("covers the required hostile probe classes by stable id", () => {
    expect(SANDBOX_PROBES.map((probe) => probe.id)).toEqual(
      expect.arrayContaining([
        "time-date-now",
        "random-math",
        "filesystem-require",
        "network-fetch",
        "process-env",
        "shell-child-process",
        "dynamic-code",
        "malformed-ipc-request",
        "malformed-ipc-response",
        "stdout-cap",
        "stderr-cap",
        "memory-pressure",
        "strategy-memory-limit",
        "soldier-memory-limit",
        "objective-size-limit",
        "source-byte-limit",
        "timeout-loop",
        "subprocess-crash",
      ]),
    )
  })

  it("normalizes successful adapter outputs before classifying probe results", () => {
    const worker = report.candidates.find(
      (candidate) => candidate.id === "worker-thread-baseline",
    )
    const invalidOutput = worker?.probes.find(
      (probe) => probe.probeId === "invalid-output",
    )

    expect(invalidOutput).toMatchObject({
      resultKind: "runtimeViolation",
      code: "INVALID_OUTPUT",
      passed: true,
    })
  })

  it("projects public-safe evidence only", () => {
    expect(() => assertSandboxEvaluationPublicSafe(report)).not.toThrow()
    expect(JSON.stringify(report)).not.toContain("export default")
    expect(JSON.stringify(report)).not.toContain("privateDiagnostics")
  })

  it("defines runtime isolation promotion-readiness without promoting candidates", () => {
    const readiness = report.runtimeIsolationReadiness

    expect(() =>
      assertRuntimeIsolationReadinessGuardrails(report),
    ).not.toThrow()
    expect(readiness).toMatchObject({
      status: "evidence_only_not_promoted",
      selectedCandidate: "container-subprocess",
      promotionAllowed: false,
      noSilentFallback: true,
      requiredLiveCandidate: "container-subprocess",
    })
    expect(readiness.criteria.map((criterion) => criterion.id)).toEqual(
      expect.arrayContaining([
        "required-container-probes",
        "resource-limits",
        "filesystem-denial",
        "network-denial",
        "image-provenance",
        "deployment-preflight",
        "failure-taxonomy",
        "redacted-diagnostics",
        "local-ergonomics",
      ]),
    )
    expect(
      readiness.failureTaxonomy.map((entry) => entry.classification),
    ).toEqual(
      expect.arrayContaining([
        "strategy_runtime_violation",
        "system_failure",
        "preflight_failure",
        "policy_required",
      ]),
    )
  })

  it("fails loud when required container evidence is skipped", () => {
    expect(() =>
      assertRequiredSandboxCandidatesPassed(report, ["container-subprocess"]),
    ).toThrow(/Required sandbox candidate container-subprocess did not pass/)
  })

  it("does not change the worker runtime default", () => {
    const text = readFileSync(
      resolve(process.cwd(), "../..", "apps/worker/src/runtime-config.ts"),
      "utf8",
    )

    expect(text).toContain(
      'const DEFAULT_STRATEGY_EXECUTION_ADAPTER_ID = "worker-thread"',
    )
  })

  it("is not imported by counted worker, web, or persistence paths", () => {
    const checkedFiles = [
      "apps/worker/src/runtime-config.ts",
      "apps/worker/src/runner.ts",
      "packages/persistence/src/competition.ts",
      "packages/persistence/src/ladder.ts",
      "apps/web/lib/public-service-adapter.ts",
    ]

    for (const file of checkedFiles) {
      const text = readFileSync(resolve(process.cwd(), "../..", file), "utf8")
      expect(text).not.toContain("sandbox-evaluation")
      expect(text).not.toContain("evaluateRuntimeSandboxes")
    }
  })

  it("keeps candidate declarations in no-promotion posture", () => {
    for (const candidate of SANDBOX_CANDIDATES) {
      expect(candidate.noPromotionDecision).toMatch(/evaluation-only/i)
      expect(candidate.noPromotionDecision).toMatch(/not promoted/i)
    }
  })
})
