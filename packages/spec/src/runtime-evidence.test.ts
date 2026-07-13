import { describe, expect, it } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  hashCanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import {
  createNonProductionExecutableLaneEvidenceAuthority,
  evaluateExecutableLaneEligibility,
  type EvaluateExecutableLaneEligibilityInput,
  type ExecutableLaneCertificate,
  type ExecutableLaneIdentity,
} from "./runtime-evidence.js"
import {
  defaultRuntimeMetadata,
  describeStrategyRuntimeProductSemantics,
  evaluateStrategyRuntimeCountedEligibility,
  RUNTIME_BROKER_REGISTRY,
} from "./runtime.js"

const evaluationInstant = "2026-07-12T12:00:00.000Z"
const registryGeneration = "runtime-registry-generation-v1.37-test"
const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!

const identity = {
  providerId: "strategy-language-provider-js-ts",
  languageId: "typescript",
  runtimeId: "node",
  runtimeVersion: "26.0.0",
  toolchainId: "typescript",
  toolchainVersion: "6.0.3",
  adapterId: "runtime-js-worker-thread",
  adapterVersion: "0.1.0",
  policyId: "runtime-policy",
  policyVersion: "v1.37",
  corpusId: "four-language-conformance",
  corpusVersion: "v1.37",
  artifactId: "sha256:typescript-runtime-artifact",
  artifactSha256: "a".repeat(64),
  implementationId: "runtime-service",
  buildId: "sha256:runtime-service-build",
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
} satisfies ExecutableLaneIdentity

const certificate = (
  kind: ExecutableLaneCertificate["kind"],
  overrides: Partial<ExecutableLaneCertificate> = {},
): ExecutableLaneCertificate => ({
  kind,
  certificateId: `${kind}-certificate`,
  certificateVersion: `${kind}-certificate-v1`,
  certificateRecordHash: `${kind}-record-hash`,
  identity,
  registryGeneration,
  status: "passed",
  issuedAt: "2026-07-12T00:00:00.000Z",
  freshUntil: "2026-07-13T00:00:00.000Z",
  gateResults: Object.freeze([
    Object.freeze({ gateId: `${kind}-gate`, passed: true }),
  ]),
  restrictedProofIds: Object.freeze([`${kind}-proof-id`]),
  restrictedProofLinks: Object.freeze([`proof://${kind}/record`]),
  ...overrides,
})

const evaluate = (input?: {
  containment?: ExecutableLaneCertificate | null
  conformance?: ExecutableLaneCertificate | null
  expectedIdentity?: ExecutableLaneIdentity
  evaluationAt?: string
  operatorDisabled?: boolean
  activeRegistryGeneration?: string
}) => {
  const certificates = [
    ...(input?.containment === null
      ? []
      : [input?.containment ?? certificate("containment")]),
    ...(input?.conformance === null
      ? []
      : [input?.conformance ?? certificate("conformance")]),
  ]
  const verified = createNonProductionExecutableLaneEvidenceAuthority({
    registryGeneration,
    certificates,
  })
  return evaluateExecutableLaneEligibility({
    expectedIdentity: input?.expectedIdentity ?? identity,
    evaluationInstant: input?.evaluationAt ?? evaluationInstant,
    activeRegistryGeneration:
      input?.activeRegistryGeneration ?? registryGeneration,
    operatorDisabled: input?.operatorDisabled ?? false,
    authority: verified.authority,
    containmentCertificateRef: verified.references.find(
      (reference) => reference.kind === "containment",
    ),
    conformanceCertificateRef: verified.references.find(
      (reference) => reference.kind === "conformance",
    ),
  })
}

const exactEvidenceInput = (): EvaluateExecutableLaneEligibilityInput => {
  const verified = createNonProductionExecutableLaneEvidenceAuthority({
    registryGeneration,
    certificates: [certificate("containment"), certificate("conformance")],
  })
  return {
    expectedIdentity: identity,
    evaluationInstant,
    activeRegistryGeneration: registryGeneration,
    operatorDisabled: false,
    authority: verified.authority,
    containmentCertificateRef: verified.references.find(
      (reference) => reference.kind === "containment",
    ),
    conformanceCertificateRef: verified.references.find(
      (reference) => reference.kind === "conformance",
    ),
  }
}

describe("v1.37 executable lane evidence", () => {
  it("D-01/D-02 disables every lane without current containment evidence", () => {
    for (const languageId of [
      "javascript",
      "typescript",
      "python",
      "rust",
      "zig",
    ] as const) {
      const result = evaluate({
        containment: null,
        conformance: null,
        expectedIdentity: { ...identity, languageId },
      })
      expect(result).toMatchObject({
        status: "disabled",
        reasonCode: "CONTAINMENT_MISSING",
      })
    }
  })

  it("D-02 derives disabled, exhibition-only, and counted from two independent certificates", () => {
    expect(evaluate({ containment: null, conformance: null })).toMatchObject({
      status: "disabled",
      reasonCode: "CONTAINMENT_MISSING",
    })
    expect(evaluate({ conformance: null })).toMatchObject({
      status: "exhibition_only",
      reasonCode: "CONFORMANCE_MISSING",
    })
    expect(evaluate()).toMatchObject({
      status: "counted",
      reasonCode: "EVIDENCE_CURRENT",
    })
  })

  it.each([
    ["stale", { freshUntil: "2026-07-12T11:59:59.999Z" }, "CONTAINMENT_STALE"],
    ["revoked", { status: "revoked" as const }, "CONTAINMENT_REVOKED"],
    ["failed", { status: "failed" as const }, "CONTAINMENT_FAILED"],
  ])("fails closed for %s containment", (_label, overrides, reasonCode) => {
    expect(
      evaluate({ containment: certificate("containment", overrides) }),
    ).toMatchObject({ status: "disabled", reasonCode })
  })

  it.each([
    ["stale", { freshUntil: "2026-07-12T11:59:59.999Z" }, "CONFORMANCE_STALE"],
    ["revoked", { status: "revoked" as const }, "CONFORMANCE_REVOKED"],
    ["failed", { status: "failed" as const }, "CONFORMANCE_FAILED"],
  ])("keeps %s conformance exhibition-only", (_label, overrides, reasonCode) => {
    expect(
      evaluate({ conformance: certificate("conformance", overrides) }),
    ).toMatchObject({ status: "exhibition_only", reasonCode })
  })

  it("D-03 makes the operator kill switch reduce-only", () => {
    expect(evaluate({ operatorDisabled: true })).toMatchObject({
      status: "disabled",
      reasonCode: "OPERATOR_DISABLED",
    })
    expect(
      evaluate({
        operatorDisabled: false,
        containment: null,
        conformance: null,
      }),
    ).toMatchObject({
      status: "disabled",
      reasonCode: "CONTAINMENT_MISSING",
    })
  })

  it("SAFE-01 compares every executable identity field exactly", () => {
    const mutations: Partial<Record<keyof ExecutableLaneIdentity, unknown>>[] = [
      { providerId: "other-provider" },
      { languageId: "python" },
      { runtimeId: "other-runtime" },
      { runtimeVersion: "other-runtime-version" },
      { toolchainId: "other-toolchain" },
      { toolchainVersion: "other-toolchain-version" },
      { adapterId: "runtime-js-subprocess" },
      { adapterVersion: "other-adapter-version" },
      { policyId: "other-policy" },
      { policyVersion: "other-policy-version" },
      { corpusId: "other-corpus" },
      { corpusVersion: "other-corpus-version" },
      { artifactId: "sha256:other-artifact" },
      { artifactSha256: "b".repeat(64) },
      { implementationId: "other-implementation" },
      { buildId: "sha256:other-build" },
      { semanticTupleId: `sha256:${"0".repeat(64)}` },
      { semanticTuple: { ...identity.semanticTuple, engine: "other-engine" } },
    ]

    for (const mutation of mutations) {
      const mutatedIdentity = {
        ...identity,
        ...mutation,
      } as ExecutableLaneIdentity
      expect(
        evaluate({
          containment: certificate("containment", {
            identity: mutatedIdentity,
          }),
        }),
      ).toMatchObject({ status: "disabled", reasonCode: "IDENTITY_MISMATCH" })
    }

    const omittedIdentity = { ...identity } as Record<string, unknown>
    delete omittedIdentity.toolchainVersion
    expect(
      evaluate({
        containment: certificate("containment", {
          identity: omittedIdentity as unknown as ExecutableLaneIdentity,
        }),
      }),
    ).toMatchObject({ status: "disabled", reasonCode: "IDENTITY_MISMATCH" })
  })

  it("D-07 rejects unknown, uncertified, and registry-drifted semantic identities", () => {
    expect(
      evaluate({
        expectedIdentity: {
          ...identity,
          semanticTupleId: "latest",
        },
      }),
    ).toMatchObject({ status: "disabled", reasonCode: "TUPLE_UNKNOWN" })

    const uncertifiedTuple = {
      ...identity.semanticTuple,
      engine: "uncertified-engine",
    }
    expect(
      evaluate({
        expectedIdentity: {
          ...identity,
          semanticTupleId: `sha256:${hashCanonicalCompatibilityTuple(uncertifiedTuple)}`,
          semanticTuple: uncertifiedTuple,
        },
      }),
    ).toMatchObject({ status: "disabled", reasonCode: "TUPLE_UNCERTIFIED" })

    expect(
      evaluate({ activeRegistryGeneration: "different-generation" }),
    ).toMatchObject({
      status: "disabled",
      reasonCode: "REGISTRY_GENERATION_DRIFT",
    })
  })

  it("rejects arbitrary certificate-shaped authority objects", () => {
    const result = evaluateExecutableLaneEligibility({
      expectedIdentity: identity,
      evaluationInstant,
      activeRegistryGeneration: registryGeneration,
      operatorDisabled: false,
      authority: {
        registryGeneration,
        resolve: () => ({
          status: "resolved",
          certificate: certificate("containment"),
        }),
      } as never,
    })
    expect(result).toMatchObject({
      status: "disabled",
      reasonCode: "EVIDENCE_UNVERIFIABLE",
    })
  })

  it("uses only the caller-supplied evaluation instant for freshness", () => {
    const expiring = certificate("containment", {
      freshUntil: "2026-07-12T12:00:00.000Z",
    })
    expect(
      evaluate({
        containment: expiring,
        evaluationAt: "2026-07-12T12:00:00.000Z",
      }),
    ).toMatchObject({ status: "counted" })
    expect(
      evaluate({
        containment: expiring,
        evaluationAt: "2026-07-12T12:00:00.001Z",
      }),
    ).toMatchObject({
      status: "disabled",
      reasonCode: "CONTAINMENT_STALE",
    })
  })

  it("routes runtime compatibility facades through canonical evidence", () => {
    const runtime = defaultRuntimeMetadata("typescript")
    expect(evaluateStrategyRuntimeCountedEligibility(runtime)).toMatchObject({
      ok: false,
      code: "NON_COUNTED_RUNTIME",
    })
    expect(
      describeStrategyRuntimeProductSemantics(runtime),
    ).toMatchObject({
      countedPlayEligible: false,
      countedPlayLabel: "Not counted",
    })

    expect(
      evaluateStrategyRuntimeCountedEligibility(runtime, exactEvidenceInput()),
    ).toEqual({ ok: true, code: null, publicMessage: null })
    expect(
      describeStrategyRuntimeProductSemantics(runtime, exactEvidenceInput()),
    ).toMatchObject({
      countedPlayEligible: true,
      countedPlayLabel: "Counted eligible",
    })
  })

  it("keeps descriptive registries from manufacturing counted eligibility", () => {
    expect(RUNTIME_BROKER_REGISTRY.length).toBeGreaterThan(0)
    expect(
      RUNTIME_BROKER_REGISTRY.every(
        (entry) => entry.countedResultsAllowed === false,
      ),
    ).toBe(true)

    const wrongLaneEvidence = exactEvidenceInput()
    expect(
      evaluateStrategyRuntimeCountedEligibility(
        defaultRuntimeMetadata("javascript"),
        wrongLaneEvidence,
      ),
    ).toMatchObject({ ok: false, code: "NON_COUNTED_RUNTIME" })
  })
})
