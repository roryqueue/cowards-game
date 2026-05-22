import { runMatch } from "@cowards/engine"
import {
  buildChronicleFromMatch,
  createChronicleContentHash,
  createReplay,
  projectPublicChronicle,
} from "@cowards/replay"
import {
  assertPublicMatchSetResultLeakSafe,
  assertPublicServiceDtoLeakSafe,
  defaultRuntimeMetadata,
  EXHIBITION_SCORING_POLICY_V1,
  SERVICE_API_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  type PublicMatchSetResultDto,
  type PublicMatchSetSummaryServiceDto,
  type StrategyRuntimeSystemFailureEnvelope,
  type StrategyRuntimeViolationEnvelope,
} from "@cowards/spec"
import { describe, expect, it } from "vitest"
import {
  createGoldenMatchInput,
  privateMarkers,
  GOLDEN_PARITY_VERSION,
} from "./v1-7-fixtures.js"

const createGoldenPublicMatchSet = (): PublicMatchSetResultDto => ({
  matchSetId: "match-set:golden:v1-7",
  preset: {
    id: "smoke-exhibition-v1",
    version: "v1",
    label: "Smoke exhibition",
  },
  status: "complete",
  visibility: "public",
  scoringPolicy: EXHIBITION_SCORING_POLICY_V1,
  entrants: [
    {
      entrantId: "entrant:0",
      entrantIndex: 0,
      strategyRevisionId: "strategy-revision:golden-bottom",
      ownerUserId: "user:bottom",
      ownerHandle: "bottom",
      displayLabel: "@bottom / golden / bottomhash",
      sourceHash: "bottomhash",
      sourceBytes: 100,
      runtime: defaultRuntimeMetadata(),
      engineCompatibility: { spec: "cowards-rules-v1.4", engine: "engine-v1" },
      lockedAt: "2026-05-22T00:00:00.000Z",
    },
    {
      entrantId: "entrant:1",
      entrantIndex: 1,
      strategyRevisionId: "strategy-revision:golden-top",
      ownerUserId: "user:top",
      ownerHandle: "top",
      displayLabel: "@top / golden / tophash",
      sourceHash: "tophash",
      sourceBytes: 100,
      runtime: defaultRuntimeMetadata(),
      engineCompatibility: { spec: "cowards-rules-v1.4", engine: "engine-v1" },
      lockedAt: "2026-05-22T00:00:00.000Z",
    },
  ],
  standings: [],
  matches: [
    {
      matchId: "golden:v1-7:match",
      entrants: { bottom: "entrant:0", top: "entrant:1" },
      status: "complete",
      replayAvailable: true,
      chronicleHash: "golden-hash",
      arenaVariantId: "golden:v1-7:arena",
    },
  ],
  provenance: {
    matchSetId: "match-set:golden:v1-7",
    presetId: "smoke-exhibition-v1",
    scoringPolicyVersion: EXHIBITION_SCORING_POLICY_V1.version,
    entrantSnapshotIds: ["entrant:0", "entrant:1"],
    chronicleHashes: ["golden-hash"],
  },
  publication: {
    publicResults: true,
    publicReplayEvidence: true,
    privateFieldsExcluded: [
      "Strategy source",
      "StrategyMemory",
      "SoldierMemory",
      "objective payloads",
    ],
  },
})

describe("v1.7 golden parity harness", () => {
  it("keeps engine outcome, Chronicle projection, replay, and ordering deterministic", () => {
    const first = buildChronicleFromMatch(createGoldenMatchInput())
    const second = buildChronicleFromMatch(createGoldenMatchInput())

    expect(first.finalState.outcome).toEqual(second.finalState.outcome)
    expect(first.chronicle.events.map((event) => event.type)).toEqual(
      second.chronicle.events.map((event) => event.type),
    )
    expect(first.chronicle.events.map((event) => event.sequence)).toEqual(
      [...first.chronicle.events]
        .sort((left, right) => left.sequence - right.sequence)
        .map((event) => event.sequence),
    )

    const chronicle = {
      ...first.chronicle,
      integrity: createChronicleContentHash(first.chronicle),
    }
    const replay = createReplay(chronicle)
    expect(replay.ok).toBe(true)
    if (!replay.ok) {
      return
    }
    const lastSequence = chronicle.events.at(-1)?.sequence ?? 0
    const replayState = replay.replay.stateAt(lastSequence)
    expect(replayState.ok ? replayState.state.outcome : undefined).toEqual(
      first.finalState.outcome,
    )
  })

  it("redacts public replay and service DTOs while preserving public evidence", () => {
    const { chronicle } = buildChronicleFromMatch(createGoldenMatchInput())
    const chronicleWithIntegrity = {
      ...chronicle,
      integrity: createChronicleContentHash(chronicle),
    }
    const publicProjection = projectPublicChronicle(chronicleWithIntegrity)
    const publicSerialized = JSON.stringify(publicProjection)

    expect(publicProjection.events.map((event) => event.type)).toContain(
      "ACTION_EMITTED",
    )
    expect(publicSerialized).not.toContain(privateMarkers.strategyMemory)
    expect(publicSerialized).not.toContain(privateMarkers.soldierMemory)
    expect(publicSerialized).not.toContain(privateMarkers.objective)

    const result = createGoldenPublicMatchSet()
    assertPublicMatchSetResultLeakSafe(result)
    const serviceDto: PublicMatchSetSummaryServiceDto = {
      apiVersion: SERVICE_API_VERSION,
      kind: "publicMatchSetSummary",
      matchSetId: result.matchSetId,
      result,
    }
    assertPublicServiceDtoLeakSafe(serviceDto)
  })

  it("documents runtime violation versus system failure envelopes", () => {
    const violation: StrategyRuntimeViolationEnvelope = {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "runtimeViolation",
      violation: {
        code: "INVALID_OUTPUT",
        message: "Strategy returned an invalid result.",
        publicMessage: "Strategy returned an invalid result.",
      },
    }
    const systemFailure: StrategyRuntimeSystemFailureEnvelope = {
      ok: false,
      abiVersion: STRATEGY_RUNTIME_ABI_VERSION,
      failureKind: "systemFailure",
      systemFailure: {
        code: "SPAWN_FAILED",
        message: "Runtime subprocess failed to start.",
        publicMessage: "Runtime system failure.",
      },
    }

    expect(violation.failureKind).toBe("runtimeViolation")
    expect(systemFailure.failureKind).toBe("systemFailure")
    expect(GOLDEN_PARITY_VERSION).toBe("golden-parity-v1.7")
    expect(runMatch(createGoldenMatchInput()).events.at(-1)?.type).toBe(
      "MATCH_ENDED",
    )
  })
})
