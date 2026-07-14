import { describe, expect, it } from "vitest"
import {
  RUNTIME_BUDGET_CAPABILITIES_V1_17,
  RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
  RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17,
  RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17,
  RUNTIME_BUDGET_CAPABILITY_LANES_V1_17,
  RUNTIME_BUDGET_CAPABILITY_PINS_V1_17,
  RuntimeBudgetCapabilitiesV117Error,
  assertRuntimeBudgetCapabilitiesV117,
  buildRuntimeBudgetCapabilitiesV117,
  renderRuntimeBudgetCapabilitiesV117,
  validateRuntimeBudgetCapabilitiesV117,
} from "./runtime-budget-capabilities-v1-17.js"

type MutableCapability = {
  dimension: string
  unit: string
  scope: string
  measurement: string
  enforcement: string
  status: string
  evidenceSafeDigest: string
  [key: string]: unknown
}

type MutablePin = {
  pin: string
  status: string
  bindingSafeId: string | null
  evidenceSafeDigest: string
  [key: string]: unknown
}

type MutableLane = {
  laneId: string
  languageId: string
  laneRole: string
  entrant: boolean
  certificationStatus: string
  countedEligible: boolean
  certificationReasons: string[]
  capabilities: MutableCapability[]
  identityPins: MutablePin[]
  localProbe: {
    disposition: string
    evidenceSafeDigest: string
    [key: string]: unknown
  }
  productionTrustedProducers: unknown[]
  [key: string]: unknown
}

type MutableArtifact = {
  schemaVersion: string
  runtimeAbiVersion: string
  contractDigest: string
  evidenceInputsDigest: string
  dimensions: Array<{ id: string; equivalentUnit: string }>
  identityPins: Array<{ id: string; exactRequirement: string }>
  policy: {
    certificationStatus: string
    countedEligibleLaneIds: string[]
    productionTrustedProducers: unknown[]
    [key: string]: unknown
  }
  lanes: MutableLane[]
  [key: string]: unknown
}

const clone = <T>(value: T): T => structuredClone(value)

const mutableArtifact = (): MutableArtifact =>
  clone(RUNTIME_BUDGET_CAPABILITIES_V1_17) as unknown as MutableArtifact

const expectRejected = (
  mutate: (artifact: MutableArtifact) => void,
): void => {
  const artifact = mutableArtifact()
  mutate(artifact)
  const findings = validateRuntimeBudgetCapabilitiesV117(artifact)
  expect(findings.length).toBeGreaterThan(0)
  expect(() => assertRuntimeBudgetCapabilitiesV117(artifact)).toThrow(
    RuntimeBudgetCapabilitiesV117Error,
  )
}

describe("runtime budget capabilities v1.17", () => {
  it("freezes the exact ordered ten dimensions, ten pins, and five lanes", () => {
    expect(RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17).toEqual([
      "wall",
      "compute",
      "memory",
      "payload",
      "stdout",
      "stderr",
      "process",
      "capabilities",
      "cancellation",
      "accountingEvidence",
    ])
    expect(RUNTIME_BUDGET_CAPABILITY_PINS_V1_17).toEqual([
      "runtimeExecutableDigest",
      "reportedVersion",
      "targetAbi",
      "compilerFlags",
      "adapterBuildDigest",
      "standardLibraryOrSysrootDigest",
      "containmentPolicyId",
      "budgetProfileSha256",
      "canonicalJsonProfileId",
      "behaviorSettingsHash",
    ])
    expect(RUNTIME_BUDGET_CAPABILITY_LANES_V1_17).toEqual([
      "javascript",
      "typescript",
      "python",
      "rust",
      "zig",
    ])

    const artifact = buildRuntimeBudgetCapabilitiesV117()
    expect(artifact).toEqual(RUNTIME_BUDGET_CAPABILITIES_V1_17)
    expect(Object.isFrozen(artifact)).toBe(true)
    expect(Object.isFrozen((artifact as MutableArtifact).lanes)).toBe(true)
    expect(validateRuntimeBudgetCapabilitiesV117(artifact)).toEqual([])
    expect(() => assertRuntimeBudgetCapabilitiesV117(artifact)).not.toThrow()
  })

  it("keeps JavaScript substrate-only and all four Strategy languages uncertified", () => {
    const artifact = mutableArtifact()
    expect(
      artifact.lanes.map(({ laneId, laneRole, entrant }) => ({
        laneId,
        laneRole,
        entrant,
      })),
    ).toEqual([
      { laneId: "javascript", laneRole: "substrate-only", entrant: false },
      { laneId: "typescript", laneRole: "entrant-language", entrant: true },
      { laneId: "python", laneRole: "entrant-language", entrant: true },
      { laneId: "rust", laneRole: "entrant-language", entrant: true },
      { laneId: "zig", laneRole: "entrant-language", entrant: true },
    ])
    for (const lane of artifact.lanes) {
      expect(lane.certificationStatus).toBe("uncertified")
      expect(lane.countedEligible).toBe(false)
      expect(lane.certificationReasons.length).toBeGreaterThan(0)
      expect(lane.productionTrustedProducers).toEqual([])
      expect(lane.localProbe.disposition).toBe("diagnostic-only")
      expect(lane.capabilities.map(({ dimension }) => dimension)).toEqual(
        RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17,
      )
      expect(lane.identityPins.map(({ pin }) => pin)).toEqual(
        RUNTIME_BUDGET_CAPABILITY_PINS_V1_17,
      )
      for (const capability of lane.capabilities) {
        expect(capability.unit).not.toBe("")
        expect(capability.scope).not.toBe("")
        expect(capability.measurement).not.toBe("")
        expect(capability.enforcement).not.toBe("")
        expect(["equivalent-enforced", "diagnostic-only", "unsupported"]).toContain(
          capability.status,
        )
        expect(capability.evidenceSafeDigest).toMatch(/^sha256:[0-9a-f]{64}$/u)
      }
    }
    expect(artifact.policy).toMatchObject({
      certificationStatus: "uncertified",
      countedEligibleLaneIds: [],
      productionTrustedProducers: [],
    })
  })

  it("rejects missing, duplicate, extra, and reordered dimensions", () => {
    expectRejected((artifact) => artifact.dimensions.pop())
    expectRejected((artifact) =>
      artifact.dimensions.splice(1, 0, clone(artifact.dimensions[0]!)),
    )
    expectRejected((artifact) =>
      artifact.dimensions.push({ id: "cpu", equivalentUnit: "cpu-seconds" }),
    )
    expectRejected((artifact) => artifact.dimensions.reverse())

    expectRejected((artifact) => artifact.lanes[1]!.capabilities.pop())
    expectRejected((artifact) =>
      artifact.lanes[1]!.capabilities.splice(
        1,
        0,
        clone(artifact.lanes[1]!.capabilities[0]!),
      ),
    )
    expectRejected((artifact) => artifact.lanes[1]!.capabilities.reverse())
  })

  it("rejects missing, duplicate, extra, and reordered lanes", () => {
    expectRejected((artifact) => artifact.lanes.pop())
    expectRejected((artifact) =>
      artifact.lanes.splice(1, 0, clone(artifact.lanes[0]!)),
    )
    expectRejected((artifact) =>
      artifact.lanes.push({ ...clone(artifact.lanes[0]!), laneId: "go" }),
    )
    expectRejected((artifact) => artifact.lanes.reverse())
  })

  it("rejects missing, duplicate, extra, and reordered pins", () => {
    expectRejected((artifact) => artifact.identityPins.pop())
    expectRejected((artifact) =>
      artifact.identityPins.splice(1, 0, clone(artifact.identityPins[0]!)),
    )
    expectRejected((artifact) =>
      artifact.identityPins.push({
        id: "imageTag",
        exactRequirement: "immutable-image-digest",
      }),
    )
    expectRejected((artifact) => artifact.identityPins.reverse())

    expectRejected((artifact) => artifact.lanes[2]!.identityPins.pop())
    expectRejected((artifact) =>
      artifact.lanes[2]!.identityPins.splice(
        1,
        0,
        clone(artifact.lanes[2]!.identityPins[0]!),
      ),
    )
    expectRejected((artifact) => artifact.lanes[2]!.identityPins.reverse())
  })

  it("rejects meter aliases and incomparable units masquerading as equivalence", () => {
    expectRejected((artifact) => {
      artifact.lanes[1]!.capabilities[1]!.dimension = "cpu"
    })
    expectRejected((artifact) => {
      const compute = artifact.lanes[3]!.capabilities[1]!
      compute.unit = "cpu-seconds"
      compute.status = "equivalent-enforced"
    })
    expectRejected((artifact) => {
      artifact.dimensions[2]!.equivalentUnit = "heap-megabytes"
    })
  })

  it("rejects empty mechanisms, evidence, and unregistered fields", () => {
    expectRejected((artifact) => {
      artifact.lanes[1]!.capabilities[0]!.measurement = ""
    })
    expectRejected((artifact) => {
      artifact.lanes[1]!.capabilities[0]!.enforcement = ""
    })
    expectRejected((artifact) => {
      artifact.lanes[1]!.capabilities[0]!.evidenceSafeDigest = ""
    })
    expectRejected((artifact) => {
      artifact.unregistered = true
    })
    expectRejected((artifact) => {
      artifact.lanes[0]!.capabilities[0]!.diagnostics = "private"
    })
  })

  it("rejects floating, latest, PATH, and local bindings relabeled exact", () => {
    for (const bindingSafeId of [
      "floating:node",
      "latest",
      "PATH:python3",
      "local-diagnostic:wasmtime",
    ]) {
      expectRejected((artifact) => {
        const pin = artifact.lanes[1]!.identityPins[0]!
        pin.status = "exact-deployment"
        pin.bindingSafeId = bindingSafeId
      })
    }
  })

  it("rejects certification, counted promotion, trusted producers, and probe promotion", () => {
    expectRejected((artifact) => {
      artifact.lanes[1]!.certificationStatus = "certifiable"
    })
    expectRejected((artifact) => {
      artifact.lanes[1]!.countedEligible = true
      artifact.policy.countedEligibleLaneIds = ["typescript"]
    })
    expectRejected((artifact) => {
      artifact.lanes[1]!.productionTrustedProducers.push("ci:forged")
    })
    expectRejected((artifact) => {
      artifact.policy.productionTrustedProducers.push("ci:forged")
    })
    expectRejected((artifact) => {
      artifact.lanes[3]!.localProbe.disposition = "production-proof"
    })
    expectRejected((artifact) => {
      artifact.lanes[0]!.laneRole = "entrant-language"
      artifact.lanes[0]!.entrant = true
    })
  })

  it("rejects privacy-sensitive evidence and nondeterministic metadata", () => {
    for (const leaked of [
      "/Users/alice/runtime",
      "C:\\Users\\alice\\runtime.exe",
      "token=private",
      "StrategyMemory payload",
      "SoldierMemory payload",
      "objectivePayload contents",
      "raw diagnostics",
      "strategy source bytes",
    ]) {
      expectRejected((artifact) => {
        artifact.lanes[2]!.capabilities[0]!.measurement = leaked
      })
    }
    expectRejected((artifact) => {
      artifact.generatedAt = new Date(0).toISOString()
    })
  })

  it("fails closed when frozen contract or evidence inputs drift", () => {
    const contract = clone(RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17) as {
      dimensions: unknown[]
    }
    contract.dimensions.reverse()
    expect(() =>
      buildRuntimeBudgetCapabilitiesV117({ contract }),
    ).toThrow(RuntimeBudgetCapabilitiesV117Error)

    const evidenceInputs = clone(
      RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17,
    ) as Array<{ laneId: string }>
    evidenceInputs[0]!.laneId = "typescript"
    expect(() =>
      buildRuntimeBudgetCapabilitiesV117({ evidenceInputs }),
    ).toThrow(RuntimeBudgetCapabilitiesV117Error)
  })

  it("renders deterministic strict JSON with no host-derived metadata", () => {
    const first = renderRuntimeBudgetCapabilitiesV117()
    const second = renderRuntimeBudgetCapabilitiesV117(
      buildRuntimeBudgetCapabilitiesV117(),
    )
    expect(second).toBe(first)
    expect(first.endsWith("\n")).toBe(true)
    expect(first).not.toMatch(/generatedAt|timestamp|hostname|process\.env/iu)
    expect(JSON.parse(first)).toEqual(RUNTIME_BUDGET_CAPABILITIES_V1_17)
  })
})
