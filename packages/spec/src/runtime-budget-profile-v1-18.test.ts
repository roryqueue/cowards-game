import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_BUDGET_PROFILE_V1_18,
  RUNTIME_BUDGET_PROFILE_V1_18_DOMAIN,
  RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  classifyRuntimeLimitComparisonV118,
  cloneRuntimeBudgetProfileV118,
  computeFuelFromCpuUsageUsecV118,
  getRuntimeInvocationLimitsV118,
  wallMillisecondsFromMonotonicNanosecondsV118,
} from "./runtime-budget-profile-v1-18.js"

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex")

describe("runtime budget profile v1.18", () => {
  it("freezes one exact Linux cgroup-v2 quantitative contract", () => {
    expect(RUNTIME_BUDGET_PROFILE_V1_18).toMatchObject({
      schemaVersion: "runtime-budget-profile-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      additiveFromRuntimeAbiVersion: "strategy-runtime-abi-v1.17",
      countedPlatform: {
        operatingSystem: "linux",
        cgroupVersion: 2,
        cgroupDriver: "cgroupfs",
        delegatedControllers: ["cpu", "memory", "pids"],
        nativeMacosDisposition: "proof-only-non-counted",
        otherPlatformDisposition: "fail-closed-system-failure",
      },
      meters: {
        wallMilliseconds: {
          source: "monotonic-elapsed-nanoseconds",
          rounding: "ceil-to-whole-millisecond",
          boundary:
            "immediately-before-supervised-spawn-through-fully-reaped-process-group",
        },
        computeFuel: {
          source: "cgroup-v2-cpu.stat-usage_usec",
          unit: "aggregate-cpu-nanoseconds",
          multiplier: 1000,
          quantum: 1000,
          aggregation: "all-cgroup-threads-and-descendants",
          prohibitedSubstitutes: [
            "instruction-fuel",
            "per-process-rusage",
            "wasmtime-fuel",
          ],
        },
        memoryPeakBytes: {
          source: "cgroup-v2-memory.peak",
          unit: "bytes",
        },
      },
    })
    expect(RUNTIME_BUDGET_PROFILE_V1_18_DOMAIN).toBe(
      "cowards-game:runtime-budget-profile:v1.18",
    )
    expect(RUNTIME_BUDGET_PROFILE_V1_18_SHA256).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
    expect(Object.isFrozen(RUNTIME_BUDGET_PROFILE_V1_18)).toBe(true)
    expect(Object.isFrozen(RUNTIME_BUDGET_PROFILE_V1_18.meters)).toBe(true)
    expect(Object.isFrozen(RUNTIME_BUDGET_PROFILE_V1_18.invocations)).toBe(true)
  })

  it("uses exact aggregate CPU deltas in 1000-nanosecond quanta", () => {
    expect(computeFuelFromCpuUsageUsecV118(12, 12)).toBe(0)
    expect(computeFuelFromCpuUsageUsecV118(12, 17)).toBe(5000)
    expect(() => computeFuelFromCpuUsageUsecV118(17, 12)).toThrow(
      /final usage must not precede baseline/u,
    )
    expect(() =>
      computeFuelFromCpuUsageUsecV118(0, Number.MAX_SAFE_INTEGER),
    ).toThrow(/safe integer/u)
    expect(() => computeFuelFromCpuUsageUsecV118(-1, 0)).toThrow(
      /nonnegative safe integer/u,
    )
  })

  it("rounds monotonic wall time upward from spawn through full reap", () => {
    expect(wallMillisecondsFromMonotonicNanosecondsV118(10, 10)).toBe(0)
    expect(wallMillisecondsFromMonotonicNanosecondsV118(10, 11)).toBe(1)
    expect(
      wallMillisecondsFromMonotonicNanosecondsV118(10, 1_000_010),
    ).toBe(1)
    expect(
      wallMillisecondsFromMonotonicNanosecondsV118(10, 1_000_011),
    ).toBe(2)
    expect(() =>
      wallMillisecondsFromMonotonicNanosecondsV118(11, 10),
    ).toThrow(/reap time must not precede spawn/u)
  })

  it("accepts exact ceilings and rejects N+1 without truncation semantics", () => {
    const limits = getRuntimeInvocationLimitsV118("soldierBrain")
    for (const [dimension, maximum] of [
      ["wallMilliseconds", limits.wallMilliseconds],
      ["computeFuel", limits.computeFuel],
      ["memoryPeakBytes", limits.memoryMaxBytes],
      ["pids", limits.pidsMax],
      ["payloadBytes", limits.payloadBytes],
      ["stdoutBytes", limits.stdoutBytes],
      ["stderrBytes", limits.stderrBytes],
    ] as const) {
      expect(
        classifyRuntimeLimitComparisonV118(dimension, maximum, maximum),
      ).toEqual({ withinLimit: true, dimension, observed: maximum, maximum })
      expect(
        classifyRuntimeLimitComparisonV118(dimension, maximum + 1, maximum),
      ).toEqual({
        withinLimit: false,
        dimension,
        observed: maximum + 1,
        maximum,
      })
    }
    expect(() =>
      classifyRuntimeLimitComparisonV118("computeFuel", 1, 0),
    ).toThrow(/positive maximum/u)
  })

  it("returns defensive clones without mutable canonical constants", () => {
    const clone = cloneRuntimeBudgetProfileV118()
    expect(clone).toEqual(RUNTIME_BUDGET_PROFILE_V1_18)
    expect(clone).not.toBe(RUNTIME_BUDGET_PROFILE_V1_18)
    expect(clone.meters).not.toBe(RUNTIME_BUDGET_PROFILE_V1_18.meters)
    ;(clone as { schemaVersion: string }).schemaVersion = "mutated"
    expect(RUNTIME_BUDGET_PROFILE_V1_18.schemaVersion).toBe(
      "runtime-budget-profile-v1.18",
    )
  })

  it("leaves the immutable v1.17 source contracts byte-identical", () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../..")
    const protectedSources = new Map([
      [
        "packages/spec/src/runtime-abi-v1-17.ts",
        "d09db74dc613b6fa67daf7d17e778782684ab2ebe2c954ec63bb0e979aeafbe7",
      ],
      [
        "packages/spec/src/runtime-invocation-v1-17.ts",
        "305b974a2c8aa0eabb7fd31f9d40e4a2788ab8ebd2720324c21d274248b94f2e",
      ],
      [
        "packages/spec/src/runtime-budget-profile-v1-17.ts",
        "eb66c9e9b0937cadeee54c4ea117840693380bdfe361507128295f82f6995fec",
      ],
      [
        "packages/spec/src/runtime-budget-capabilities-v1-17.ts",
        "9bd362f4356970e826013162d4e1341d478e9edeb393cebe597ecc7fb7059f44",
      ],
    ])
    for (const [relativePath, expected] of protectedSources) {
      expect(sha256(readFileSync(path.join(repoRoot, relativePath)))).toBe(
        expected,
      )
    }
  })
})
