import { describe, expect, it } from "vitest"
import { RUNTIME_BUDGET_CAPABILITIES_V1_17 } from "./runtime-budget-capabilities-v1-17.js"
import { RUNTIME_BUDGET_PROFILE_V1_18_SHA256 } from "./runtime-budget-profile-v1-18.js"
import {
  RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_18,
  RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_18,
  RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18,
  RUNTIME_BUDGET_CAPABILITY_LANES_V1_18,
  evaluateRuntimeBudgetCapabilityV118,
  requireAllFourConformanceLanesV118,
  type RuntimeBudgetCapabilityEvidenceV118,
} from "./runtime-budget-capabilities-v1-18.js"

const hash = (character: string): `sha256:${string}` =>
  `sha256:${character.repeat(64)}`

const completeEvidence = (
  laneId: RuntimeBudgetCapabilityEvidenceV118["laneId"],
): RuntimeBudgetCapabilityEvidenceV118 => ({
  laneId,
  budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  platform: {
    operatingSystem: "linux",
    cgroupVersion: 2,
    cgroupDriver: "cgroupfs",
    delegatedControllers: ["cpu", "memory", "pids"],
  },
  meters: {
    wall: {
      source: "monotonic-elapsed-nanoseconds",
      unit: "ceil-milliseconds",
      complete: true,
    },
    compute: {
      source: "cgroup-v2-cpu.stat-usage_usec-times-1000",
      unit: "aggregate-cpu-nanoseconds",
      complete: true,
    },
    memory: {
      source: "cgroup-v2-memory.peak-and-memory.events",
      unit: "bytes-and-nondecreasing-events",
      complete: true,
    },
    pids: {
      source: "cgroup-v2-pids.current-and-pids.events",
      unit: "kernel-tasks-and-nondecreasing-events",
      complete: true,
    },
    bytes: {
      source: "raw-request-write-and-capture-boundaries",
      unit: "exact-bytes",
      complete: true,
    },
    cancellation: {
      source: "process-group-plus-cgroup.kill",
      unit: "empty-cgroup-receipt",
      complete: true,
    },
  },
  containment: {
    delegated: true,
    settingsApplied: true,
    noCgroupEscape: true,
    emptyAfterReap: true,
    cleanupVerified: true,
  },
  identityPins: {
    supervisorBinarySha256: hash("1"),
    supervisorToolchainSha256: hash("2"),
    linuxKernelSha256: hash("3"),
    dockerEngineSha256: hash("4"),
    dockerImageDigest: hash("5"),
    cgroupDelegationSha256: hash("6"),
    adapterBuildSha256: hash("7"),
    runtimeCompilerSha256: hash("8"),
    artifactSha256: hash("9"),
    budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
  },
  wasmtimeDefenseInDepth:
    laneId === "rust" || laneId === "zig"
      ? {
          fuelObserved: true,
          linearMemoryObserved: true,
          usedAsCommonQuantitativeMeter: false,
        }
      : null,
})

const clone = <T>(value: T): T => structuredClone(value)

describe("runtime budget capabilities v1.18", () => {
  it("defines one identical ordered common meter and identity contract", () => {
    expect(RUNTIME_BUDGET_CAPABILITY_LANES_V1_18).toEqual([
      "typescript",
      "python",
      "rust",
      "zig",
    ])
    expect(RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_18).toEqual([
      "wall",
      "compute",
      "memory",
      "pids",
      "bytes",
      "cancellation",
      "containment",
      "identity",
    ])
    expect(RUNTIME_BUDGET_CAPABILITY_IDENTITY_PINS_V1_18).toEqual([
      "supervisorBinarySha256",
      "supervisorToolchainSha256",
      "linuxKernelSha256",
      "dockerEngineSha256",
      "dockerImageDigest",
      "cgroupDelegationSha256",
      "adapterBuildSha256",
      "runtimeCompilerSha256",
      "artifactSha256",
      "budgetProfileSha256",
    ])
    expect(RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_18).toMatchObject({
      schemaVersion: "runtime-budget-capability-contract-v1.18",
      runtimeAbiVersion: "strategy-runtime-abi-v1.18",
      budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      soleCountedPlatform: "linux-cgroup-v2-cgroupfs",
      allFourLanesMandatoryForPhaseClosure: true,
    })
    expect(Object.isFrozen(RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_18)).toBe(true)
  })

  it.each(RUNTIME_BUDGET_CAPABILITY_LANES_V1_18)(
    "admits complete %s common-meter evidence only as a certificate candidate",
    (laneId) => {
      const snapshot = evaluateRuntimeBudgetCapabilityV118(
        completeEvidence(laneId),
      )
      expect(snapshot).toEqual({
        kind: "certificate_candidate",
        laneId,
        supervisorEligible: true,
        certificateEligible: true,
        countedEligible: false,
        safeCode: "CONFORMANCE_CERTIFICATE_REQUIRED",
        budgetProfileSha256: RUNTIME_BUDGET_PROFILE_V1_18_SHA256,
      })
      expect(Object.isFrozen(snapshot)).toBe(true)
      expect(requireAllFourConformanceLanesV118([snapshot])).toBe(false)
    },
  )

  it.each([
    ["missing controller", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.platform.delegatedControllers = ["cpu", "memory"]
    }, "CONTROLLERS_UNAVAILABLE"],
    ["delegation failure", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.containment.delegated = false
    }, "DELEGATION_UNAVAILABLE"],
    ["cgroup escape", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.containment.noCgroupEscape = false
    }, "CONTAINMENT_INCOMPLETE"],
    ["lingering process", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.containment.emptyAfterReap = false
    }, "CONTAINMENT_INCOMPLETE"],
    ["cleanup failure", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.containment.cleanupVerified = false
    }, "CONTAINMENT_INCOMPLETE"],
    ["identity drift", (value: RuntimeBudgetCapabilityEvidenceV118) => {
      value.identityPins.supervisorBinarySha256 =
        "latest" as `sha256:${string}`
    }, "IDENTITY_INCOMPLETE"],
  ] as const)("fails closed on %s", (_name, mutate, code) => {
    const value = clone(completeEvidence("typescript"))
    mutate(value)
    expect(evaluateRuntimeBudgetCapabilityV118(value)).toEqual({
      kind: "system_failure",
      laneId: "typescript",
      supervisorEligible: false,
      certificateEligible: false,
      countedEligible: false,
      gameplayDisposition: "no_mutation",
      code,
    })
  })

  it("rejects native macOS and every non-Linux counted attempt", () => {
    for (const operatingSystem of ["darwin", "windows", "freebsd"]) {
      const value = clone(completeEvidence("python"))
      value.platform.operatingSystem = operatingSystem
      expect(evaluateRuntimeBudgetCapabilityV118(value)).toMatchObject({
        kind: "system_failure",
        laneId: "python",
        code: "COUNTED_PLATFORM_UNAVAILABLE",
        gameplayDisposition: "no_mutation",
      })
    }
  })

  it("requires every exact meter source, unit, and completeness predicate", () => {
    const mutations: Array<(value: RuntimeBudgetCapabilityEvidenceV118) => void> =
      [
        (value) => {
          value.meters.wall.complete = false
        },
        (value) => {
          value.meters.compute.source = "per-process-rusage"
        },
        (value) => {
          value.meters.compute.unit = "instruction-fuel"
        },
        (value) => {
          value.meters.memory.source = "process-rss"
        },
        (value) => {
          value.meters.pids.complete = false
        },
        (value) => {
          value.meters.bytes.unit = "characters"
        },
        (value) => {
          value.meters.cancellation.source = "pid-only-kill"
        },
      ]
    for (const mutate of mutations) {
      const value = clone(completeEvidence("typescript"))
      mutate(value)
      expect(evaluateRuntimeBudgetCapabilityV118(value)).toMatchObject({
        kind: "system_failure",
        code: "COMMON_METER_INCOMPLETE",
        gameplayDisposition: "no_mutation",
      })
    }
  })

  it("keeps Wasmtime fuel and linear memory defense-in-depth only", () => {
    for (const laneId of ["rust", "zig"] as const) {
      const missing = clone(completeEvidence(laneId))
      missing.wasmtimeDefenseInDepth = null
      expect(evaluateRuntimeBudgetCapabilityV118(missing)).toMatchObject({
        kind: "system_failure",
        code: "DEFENSE_IN_DEPTH_INCOMPLETE",
      })

      const substituted = clone(completeEvidence(laneId))
      if (substituted.wasmtimeDefenseInDepth !== null) {
        substituted.wasmtimeDefenseInDepth.usedAsCommonQuantitativeMeter = true
      }
      expect(evaluateRuntimeBudgetCapabilityV118(substituted)).toMatchObject({
        kind: "system_failure",
        code: "WASMTIME_METER_SUBSTITUTION",
      })
    }
  })

  it("cannot satisfy all-four closure with declarations, clones, or partial lanes", () => {
    const snapshots = RUNTIME_BUDGET_CAPABILITY_LANES_V1_18.map((laneId) =>
      evaluateRuntimeBudgetCapabilityV118(completeEvidence(laneId)),
    )
    expect(requireAllFourConformanceLanesV118(snapshots)).toBe(false)
    expect(
      requireAllFourConformanceLanesV118(
        snapshots.map((snapshot) => clone(snapshot)),
      ),
    ).toBe(false)
    expect(requireAllFourConformanceLanesV118(snapshots.slice(0, 3))).toBe(false)
  })

  it("leaves the v1.17 diagnostic matrix immutable and uncertified", () => {
    expect(RUNTIME_BUDGET_CAPABILITIES_V1_17.policy).toMatchObject({
      certificationStatus: "uncertified",
      countedEligibleLaneIds: [],
      productionTrustedProducers: [],
    })
    expect(
      RUNTIME_BUDGET_CAPABILITIES_V1_17.lanes.every(
        (lane) =>
          lane.certificationStatus === "uncertified" &&
          lane.countedEligible === false,
      ),
    ).toBe(true)
  })
})
