import { describe, expect, it } from "vitest"
import { encodeCanonicalJson } from "./canonical-json-encode.js"
import {
  RUNTIME_ABI_V1_17,
  hashRuntimeAbiV117Identity,
} from "./runtime-abi-v1-17.js"
import {
  RUNTIME_BUDGET_CAPABILITIES_V1_17,
  RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
  RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17,
  RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17,
  RUNTIME_BUDGET_CAPABILITY_LANES_V1_17,
  RUNTIME_BUDGET_CAPABILITY_PINS_V1_17,
  RuntimeBudgetCapabilitiesV117Error,
  type RuntimeBudgetCapabilityFindingV117,
  assertRuntimeBudgetCapabilitiesV117,
  buildRuntimeBudgetCapabilitiesV117,
  renderRuntimeBudgetCapabilitiesV117,
  validateRuntimeBudgetCapabilitiesV117,
} from "./runtime-budget-capabilities-v1-17.js"
import { RUNTIME_EVIDENCE_TRUSTED_PRODUCERS } from "./runtime-evidence-attestation.js"
import type { JsonValue } from "./types.js"

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

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const mutableArtifact = (): MutableArtifact =>
  clone(RUNTIME_BUDGET_CAPABILITIES_V1_17) as unknown as MutableArtifact

const expectRejected = (mutate: (artifact: MutableArtifact) => void): void => {
  const artifact = mutableArtifact()
  mutate(artifact)
  const findings = validateRuntimeBudgetCapabilitiesV117(artifact)
  expect(findings.length).toBeGreaterThan(0)
  expect(() => assertRuntimeBudgetCapabilitiesV117(artifact)).toThrow(
    RuntimeBudgetCapabilitiesV117Error,
  )
}

const expectRejectedWithCode = (
  code: RuntimeBudgetCapabilityFindingV117["code"],
  mutate: (artifact: MutableArtifact) => void,
): void => {
  const artifact = mutableArtifact()
  mutate(artifact)
  const findings = validateRuntimeBudgetCapabilitiesV117(artifact)
  expect(findings.map((finding) => finding.code)).toContain(code)
  expect(() => assertRuntimeBudgetCapabilitiesV117(artifact)).toThrow(
    RuntimeBudgetCapabilitiesV117Error,
  )
}

const expectedBudgetProfileSha256 = (): `sha256:${string}` => {
  const encoded = encodeCanonicalJson(
    RUNTIME_ABI_V1_17.budgets as unknown as JsonValue,
    { context: "canonical-manifest" },
  )
  expect(encoded.ok).toBe(true)
  if (!encoded.ok) throw new Error(encoded.error.code)
  return hashRuntimeAbiV117Identity("budgetProfile", [encoded.bytes])
}

describe("runtime budget capabilities v1.17", () => {
  it("derives ABI dimensions, pins, lanes, posture, budgets, and trust authority", () => {
    const artifact = mutableArtifact()
    const contract = RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17 as unknown as {
      runtimeAbiVersion: string
      budgetProfileSha256: string
      dimensions: Array<{ id: string }>
      identityPins: Array<{ id: string }>
      lanes: Array<{
        laneId: string
        countedCertification: string
        reason: string
      }>
      policy: { productionTrustedProducers: unknown[] }
    }

    expect(contract.runtimeAbiVersion).toBe(
      RUNTIME_ABI_V1_17.versions.runtimeAbi,
    )
    expect(contract.budgetProfileSha256).toBe(expectedBudgetProfileSha256())
    expect(contract.dimensions.map(({ id }) => id)).toEqual(
      RUNTIME_ABI_V1_17.budgets.requiredEquivalentMeters,
    )
    expect(contract.identityPins.map(({ id }) => id)).toEqual(
      RUNTIME_ABI_V1_17.identity.requiredExecutablePins,
    )
    expect(
      contract.lanes.map(
        ({ laneId, countedCertification, reason }) => ({
          laneId,
          countedCertification,
          reason,
        }),
      ),
    ).toEqual(
      Object.entries(RUNTIME_ABI_V1_17.lanePosture).map(
        ([laneId, posture]) => ({
          laneId,
          countedCertification: posture.countedCertification,
          reason: posture.reason,
        }),
      ),
    )
    expect(contract.policy.productionTrustedProducers).toEqual(
      RUNTIME_EVIDENCE_TRUSTED_PRODUCERS,
    )
    expect(artifact.policy.productionTrustedProducers).toEqual(
      RUNTIME_EVIDENCE_TRUSTED_PRODUCERS,
    )
    for (const lane of artifact.lanes) {
      const budgetPin = lane.identityPins.find(
        ({ pin }) => pin === "budgetProfileSha256",
      )
      expect(budgetPin?.bindingSafeId).toBe(expectedBudgetProfileSha256())
      expect(lane.productionTrustedProducers).toEqual(
        RUNTIME_EVIDENCE_TRUSTED_PRODUCERS,
      )
    }
  })

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
    expect(
      Object.isFrozen((artifact as unknown as MutableArtifact).lanes),
    ).toBe(true)
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
        expect([
          "equivalent-enforced",
          "diagnostic-only",
          "unsupported",
        ]).toContain(capability.status)
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

  it("recursively closes dimension and pin definitions with specific findings", () => {
    expectRejectedWithCode("ORDERED_DIMENSIONS_INVALID", (artifact) => {
      artifact.dimensions[0]!.equivalentUnit = "elapsed-seconds"
    })
    expectRejectedWithCode("ORDERED_PINS_INVALID", (artifact) => {
      artifact.identityPins[0]!.exactRequirement = "floating-runtime-tag"
    })
    expectRejectedWithCode("STRICT_FIELDS_INVALID", (artifact) => {
      ;(artifact.dimensions[0] as Record<string, unknown>).extra = true
    })
  })

  it("validates every policy literal and exact lane role/entrant pairing", () => {
    for (const [field, invalid] of [
      ["allDimensionsRequiredInOrder", false],
      ["allPinsRequiredInOrder", false],
      ["allPinsMustBeExactDeployment", false],
      ["productionTrustedProducerRequired", false],
      ["localDiagnosticsCanCertify", true],
      ["floatingPinsCanCertify", true],
      ["missingPinsCanCertify", true],
      ["phase259ConformanceRequired", false],
    ] as const) {
      expectRejectedWithCode("POLICY_INVALID", (artifact) => {
        artifact.policy[field] = invalid
      })
    }
    expectRejectedWithCode("LANE_SEMANTICS_INVALID", (artifact) => {
      artifact.lanes[0]!.laneRole = "entrant-language"
    })
    expectRejectedWithCode("LANE_SEMANTICS_INVALID", (artifact) => {
      artifact.lanes[1]!.entrant = false
    })
    expectRejectedWithCode("LANE_SEMANTICS_INVALID", (artifact) => {
      artifact.lanes[1]!.languageId = "javascript"
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

  it("requires every pin value and prefix to match its canonical binding kind", () => {
    expectRejectedWithCode("PIN_ROWS_INVALID", (artifact) => {
      const budget = artifact.lanes[1]!.identityPins[7]!
      budget.bindingSafeId = `sha256:${"0".repeat(64)}`
    })
    expectRejectedWithCode("PIN_ROWS_INVALID", (artifact) => {
      const canonicalJson = artifact.lanes[1]!.identityPins[8]!
      canonicalJson.bindingSafeId = "canonical-json-latest"
    })
    expectRejectedWithCode("PIN_ROWS_INVALID", (artifact) => {
      const floating = artifact.lanes[1]!.identityPins[0]!
      floating.bindingSafeId = `sha256:${"1".repeat(64)}`
    })
    expectRejectedWithCode("PIN_ROWS_INVALID", (artifact) => {
      const local = artifact.lanes[3]!.identityPins[0]!
      local.bindingSafeId = "floating:wasmtime"
    })
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

  it("classifies absolute/home/temp paths and private or security fields as privacy leaks", () => {
    for (const leaked of [
      "/home/alice/private/runtime",
      "/tmp/runtime-receipt.json",
      "/var/tmp/cowards/runtime",
      "~/private/runtime",
      "D:\\workspace\\runtime.exe",
      "C:\\Temp\\runtime.log",
      "\\\\host\\share\\runtime",
    ]) {
      expectRejectedWithCode("PRIVACY_LEAK", (artifact) => {
        artifact.lanes[2]!.capabilities[0]!.measurement = leaked
      })
    }
    for (const key of [
      "privateRuntimeDiagnostics",
      "securityInternals",
      "rawSourceBytes",
      "hostEnvironment",
    ]) {
      expectRejectedWithCode("PRIVACY_LEAK", (artifact) => {
        artifact.lanes[1]![key] = "redacted"
      })
    }
  })

  it("rejects toJSON and non-enumerable input drift before derivation", () => {
    const contract = clone(
      RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
    ) as unknown as Record<string, unknown>
    contract.toJSON = () => RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17
    expect(() => buildRuntimeBudgetCapabilitiesV117({ contract })).toThrow(
      RuntimeBudgetCapabilitiesV117Error,
    )

    const evidenceInputs = clone(
      RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17,
    ) as unknown as object
    Object.defineProperty(evidenceInputs, "hiddenPrivateValue", {
      configurable: true,
      enumerable: false,
      value: "/home/alice/private/runtime",
    })
    expect(() =>
      buildRuntimeBudgetCapabilitiesV117({ evidenceInputs }),
    ).toThrow(RuntimeBudgetCapabilitiesV117Error)
  })

  it("fails closed when frozen contract or evidence inputs drift", () => {
    const contract = clone(
      RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17,
    ) as unknown as { dimensions: unknown[] }
    contract.dimensions.reverse()
    expect(() => buildRuntimeBudgetCapabilitiesV117({ contract })).toThrow(
      RuntimeBudgetCapabilitiesV117Error,
    )

    const evidenceInputs = clone(
      RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17,
    ) as unknown as Array<{ laneId: string }>
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
