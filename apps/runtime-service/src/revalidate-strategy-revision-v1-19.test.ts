import { createHash } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import { CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID } from "@cowards/spec"
import { createCandidateObservationTransportRequestV119 } from "@cowards/runtime-js"
import {
  REQUIRED_REVISION_REVALIDATION_PROBES_V1_19,
  revalidateStrategyRevisionV119,
  type RealProviderRevalidationExecutionV119,
  type RevisionRevalidationCandidatePinsV119,
  type RevisionRevalidationProbeV119,
} from "./revalidate-strategy-revision-v1-19.js"

const sha256 = (value: Uint8Array | string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const sourceBytes = new TextEncoder().encode("export const strategy = {}")
const artifactBytes = new TextEncoder().encode("compiled exact artifact")

const pins = {
  candidateStatus: "inactive-candidate",
  current: false,
  pinSource: "explicit-candidate-pins",
  resolvedFromCurrentRegistry: false,
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  semanticRuntimeVersion: "runtime-v1.19",
  semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
  corpusVersion: "v3",
  corpusRootSha256: sha256("corpus-root"),
  corpusPinSha256: sha256("corpus-pin"),
  traceVersion: "v4",
  traceRootSha256: sha256("trace-root"),
  tracePinSha256: sha256("trace-pin"),
  workshopVersion: "v1.19",
  workshopRootSha256: sha256("workshop-root"),
  workshopPinSha256: sha256("workshop-pin"),
  certificateVersion: "runtime-conformance-certificate-v1.19",
  certificateId: "certificate:typescript:v1.19:candidate",
  certificateSha256: sha256("certificate"),
  certificateStatus: "reviewed-inactive-candidate",
  runtimeIdentityRoot: sha256("runtime"),
  toolchainIdentityRoot: sha256("toolchain"),
  adapterIdentityRoot: sha256("adapter"),
  containmentEvidenceRoot: sha256("containment"),
} as unknown as RevisionRevalidationCandidatePinsV119

const selectInput = (
  hasInitialInitiative: boolean,
  hasRoundInitiative: boolean,
) => ({
  phaseNumber: 1,
  roundNumber: 2,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [],
    terrainStones: [],
  },
  mySoldiers: [],
  enemySoldiers: [],
  strategyMemory: null,
  initialInitiativePlayerId: hasInitialInitiative
    ? "player:bottom"
    : "player:top",
  hasInitialInitiative,
  roundInitiativePlayerId: hasRoundInitiative
    ? "player:bottom"
    : "player:top",
  hasRoundInitiative,
})

const soldier = {
  id: "soldier:bottom:1",
  ownerPlayerId: "player:bottom",
  status: "ACTIVE",
  position: { x: 4, y: 9 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
} as const

const brainInput = (hasAdvancedThisActivation: boolean) => ({
  self: soldier,
  awarenessGrid: {
    cells: [-2, -1, 0, 1, 2].flatMap((dy) =>
      [-2, -1, 0, 1, 2].map((dx) => ({
        dx,
        dy,
        absoluteX: 4 + dx,
        absoluteY: 9 + dy,
        contents: "EMPTY" as const,
      })),
    ),
  },
  cycleIndex: hasAdvancedThisActivation ? 1 : 0,
  maxCycles: 12,
  soldierMemory: null,
  hasAdvancedThisActivation,
})

const probes = (): readonly RevisionRevalidationProbeV119[] => [
  ...([
    ["select-initial-false-round-false", false, false],
    ["select-initial-false-round-true", false, true],
    ["select-initial-true-round-false", true, false],
    ["select-initial-true-round-true", true, true],
  ] as const).map(([probeId, initial, round]) => ({
    probeId,
    request: createCandidateObservationTransportRequestV119({
      method: "selectActivations",
      kernelRequestId: `effect:revalidation:${probeId}`,
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      entrantPlayerIds: ["player:bottom", "player:top"],
      observingPlayerId: "player:bottom",
      input: selectInput(initial, round),
    }),
  })),
  ...([false, true] as const).map((advanced) => {
    const probeId: RevisionRevalidationProbeV119["probeId"] = advanced
      ? "brain-advanced-true"
      : "brain-advanced-false"
    return {
      probeId,
      request: createCandidateObservationTransportRequestV119({
        method: "soldierBrain",
        kernelRequestId: `effect:revalidation:${probeId}`,
        semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
        entrantPlayerIds: ["player:bottom", "player:top"],
        observingPlayerId: "player:bottom",
        input: brainInput(advanced),
      }),
    }
  }),
]

const revision = {
  strategyRevisionId: "revision:exact:v1.19",
  lockedAt: "2026-07-17T00:00:00.000Z",
  sourceBytes,
  sourceHash: createHash("sha256").update(sourceBytes).digest("hex"),
  artifactBytes,
  artifactSha256: sha256(artifactBytes),
  languageId: "typescript" as const,
  providerId: "strategy-language-provider-js-ts",
  laneId: "lane:typescript:v1.19",
}

const realSuccess = (
  input: Parameters<RealProviderRevalidationExecutionV119>[0],
) => ({
  kind: "success" as const,
  value: {
    output: { accepted: input.probeId },
    evidence: {
      schemaVersion: "runtime-provider-revalidation-evidence-v1.19" as const,
      executionKind: "real_service_execution" as const,
      syntheticEvidence: false as const,
      strategyRevisionId: input.revision.strategyRevisionId,
      sourceHash: input.revision.sourceHash,
      artifactSha256: input.revision.artifactSha256,
      languageId: input.revision.languageId,
      providerId: input.revision.providerId,
      laneId: input.revision.laneId,
      runtimeAbiVersion: input.pins.runtimeAbiVersion,
      semanticRuntimeVersion: input.pins.semanticRuntimeVersion,
      semanticTupleId: input.pins.semanticTupleId,
      candidatePinsRoot: input.candidatePinsRoot,
      probeId: input.probeId,
      method: input.observation.method,
      inputSha256: input.inputSha256,
      guestStarted: true as const,
      guestCompleted: true as const,
      resultRoot: sha256(`result:${input.probeId}`),
      evidenceRoot: sha256(`evidence:${input.probeId}`),
    },
    privateDiagnostics: {
      source: new TextDecoder().decode(sourceBytes),
      hostPath: "/private/runtime/worker",
    },
  },
})

const request = (
  executeProvider: RealProviderRevalidationExecutionV119 = realSuccess,
) => ({ revision, pins, probes: probes(), executeProvider })

describe("revision-specific runtime-v1.19 revalidation", () => {
  it("runs the complete exact observation matrix in the revision's real provider lane", () => {
    const executeProvider = vi.fn(realSuccess)
    const result = revalidateStrategyRevisionV119(request(executeProvider))

    expect(
      result.kind,
      `${JSON.stringify(result)} calls=${executeProvider.mock.calls.length}`,
    ).toBe("success")
    if (result.kind !== "success") throw new Error("expected success")
    expect(executeProvider).toHaveBeenCalledTimes(
      REQUIRED_REVISION_REVALIDATION_PROBES_V1_19.length,
    )
    expect(
      executeProvider.mock.calls.map(([call]) => call.probeId),
    ).toEqual(REQUIRED_REVISION_REVALIDATION_PROBES_V1_19)
    expect(result.receipt).toMatchObject({
      schemaVersion: "runtime-semantic-receipt-v1.19",
      outcome: "success",
      admissible: true,
      executionKind: "real_service_execution",
      syntheticEvidence: false,
      strategyRevisionId: revision.strategyRevisionId,
      sourceHash: revision.sourceHash,
      sourceBytes: sourceBytes.byteLength,
      artifactSha256: revision.artifactSha256,
      artifactBytes: artifactBytes.byteLength,
      languageId: "typescript",
      providerId: "strategy-language-provider-js-ts",
      laneId: "lane:typescript:v1.19",
      runtimeAbiVersion: "strategy-runtime-abi-v1.19",
      semanticRuntimeVersion: "runtime-v1.19",
      semanticTupleId: CANDIDATE_RUNTIME_V119_SEMANTIC_TUPLE_ID,
      certificateVersion: "runtime-conformance-certificate-v1.19",
      certificateId: "certificate:typescript:v1.19:candidate",
      certificateSha256: pins.certificateSha256,
      probeCount: 6,
      probeIds: REQUIRED_REVISION_REVALIDATION_PROBES_V1_19,
    })
    for (const root of [
      result.receipt.candidatePinsRoot,
      result.receipt.executionRequestRoot,
      result.receipt.executionResultRoot,
      result.receipt.executionEvidenceRoot,
      result.receipt.executionReceiptRoot,
    ]) {
      expect(root).toMatch(/^sha256:[0-9a-f]{64}$/u)
    }
    const publicBytes = JSON.stringify(result)
    expect(publicBytes).not.toContain(new TextDecoder().decode(sourceBytes))
    expect(publicBytes).not.toContain("/private/runtime/worker")
    expect(publicBytes).not.toContain("privateDiagnostics")
    expect(Object.isFrozen(result.receipt)).toBe(true)
  })

  it("preserves player violation and system failure without creating admissible evidence", () => {
    const playerViolation = revalidateStrategyRevisionV119(
      request(() => ({
        kind: "player_violation",
        violation: {
          code: "INVALID_OUTPUT",
          publicMessage: "Strategy output was invalid.",
        },
      })),
    )
    expect(playerViolation).toEqual({
      kind: "player_violation",
      strategyRevisionId: revision.strategyRevisionId,
      violation: {
        code: "INVALID_OUTPUT",
        publicMessage:
          "Strategy revision did not pass candidate revalidation.",
      },
    })
    expect(playerViolation).not.toHaveProperty("receipt")

    const systemFailure = revalidateStrategyRevisionV119(
      request(() => ({
        kind: "system_failure",
        failure: {
          code: "ADAPTER_CRASH",
          publicMessage: "Runtime system failure.",
          retryable: true,
        },
      })),
    )
    expect(systemFailure).toEqual({
      kind: "system_failure",
      strategyRevisionId: revision.strategyRevisionId,
      failure: {
        code: "PROVIDER_SYSTEM_FAILURE",
        publicMessage: "Runtime system failure.",
        retryable: true,
      },
    })
    expect(systemFailure).not.toHaveProperty("receipt")
  })

  it("is deterministic for an exact rerun and never serializes provider poison", () => {
    const executeProvider = vi.fn(realSuccess)
    const first = revalidateStrategyRevisionV119(request(executeProvider))
    const second = revalidateStrategyRevisionV119(request(executeProvider))
    expect(second).toEqual(first)
    expect(executeProvider).toHaveBeenCalledTimes(12)
    expect(JSON.stringify(first)).not.toMatch(
      /sourceText|artifactBytesBase64|strategyMemory|soldierMemory|objective|privateDiagnostics|hostPath|private\/runtime/iu,
    )
  })

  it.each([
    ["changed source", { revision: { ...revision, sourceHash: "0".repeat(64) } }],
    [
      "changed artifact",
      { revision: { ...revision, artifactSha256: sha256("other artifact") } },
    ],
    [
      "old tuple",
      { pins: { ...pins, semanticTupleId: `sha256:${"0".repeat(64)}` } },
    ],
    [
      "old ABI",
      { pins: { ...pins, runtimeAbiVersion: "strategy-runtime-abi-v1.18" } },
    ],
    [
      "old certificate",
      { pins: { ...pins, certificateVersion: "runtime-conformance-certificate-v1.18" } },
    ],
    [
      "current registry substitution",
      { pins: { ...pins, resolvedFromCurrentRegistry: true } },
    ],
    ["partial probe", { probes: probes().slice(0, -1) }],
    ["duplicate probe", { probes: [...probes().slice(0, -1), probes()[0]!] }],
  ])("rejects %s before provider execution", (_name, override) => {
    const executeProvider = vi.fn(realSuccess)
    const result = revalidateStrategyRevisionV119({
      ...request(executeProvider),
      ...override,
    } as never)
    expect(result).toMatchObject({
      kind: "system_failure",
      failure: { code: "REVALIDATION_REJECTED", retryable: false },
    })
    expect(result).not.toHaveProperty("receipt")
    expect(executeProvider).not.toHaveBeenCalled()
  })

  it.each([
    ["sibling receipt", { strategyRevisionId: "revision:sibling" }],
    ["changed source claim", { sourceHash: "1".repeat(64) }],
    ["changed artifact claim", { artifactSha256: sha256("sibling artifact") }],
    ["wrong provider", { providerId: "strategy-language-provider-python" }],
    ["wrong lane", { laneId: "lane:python:v1.19" }],
    ["old tuple claim", { semanticTupleId: `sha256:${"2".repeat(64)}` }],
    ["substituted pins", { candidatePinsRoot: sha256("current registry") }],
    ["compile-only claim", { executionKind: "compile_only" }],
    ["synthetic claim", { syntheticEvidence: true }],
    ["guest never started", { guestStarted: false }],
    ["guest incomplete", { guestCompleted: false }],
  ])("rejects provider %s as inadmissible", (_name, evidenceOverride) => {
    const executeProvider = vi.fn(
      (input: Parameters<RealProviderRevalidationExecutionV119>[0]) => {
        const base = realSuccess(input)
        return {
          ...base,
          value: {
            ...base.value,
            evidence: { ...base.value.evidence, ...evidenceOverride },
          },
        } as never
      },
    )
    const result = revalidateStrategyRevisionV119(request(executeProvider))
    expect(result).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "REVALIDATION_EVIDENCE_MISMATCH",
        retryable: false,
      },
    })
    expect(result).not.toHaveProperty("receipt")
    expect(executeProvider).toHaveBeenCalledTimes(1)
  })

  it.each([
    ["null", null],
    ["empty object", {}],
    ["success without evidence", { kind: "success", value: null }],
    [
      "malformed player violation",
      { kind: "player_violation", violation: null },
    ],
    [
      "malformed system failure",
      {
        kind: "system_failure",
        failure: { retryable: "yes", diagnostics: { source: "private" } },
      },
    ],
  ])("fails closed on %s provider output", (_name, providerOutput) => {
    expect(() =>
      revalidateStrategyRevisionV119(
        request(() => providerOutput as never),
      ),
    ).not.toThrow()
    const result = revalidateStrategyRevisionV119(
      request(() => providerOutput as never),
    )
    expect(result).toMatchObject({
      kind: "system_failure",
      failure: {
        code: "REVALIDATION_EVIDENCE_MISMATCH",
        publicMessage: "Runtime system failure.",
        retryable: false,
      },
    })
    expect(JSON.stringify(result)).not.toContain("private")
    expect(result).not.toHaveProperty("receipt")
  })
})
