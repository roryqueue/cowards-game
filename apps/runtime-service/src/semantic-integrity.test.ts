import { describe, expect, it, vi } from "vitest"
import {
  COMPATIBILITY_VERSIONS,
  DEFAULT_RUNTIME_LIMITS,
  INITIAL_BOUNDS,
  runtimeCompatibilityKey,
  type SoldierBrainInput,
  type StrategyInput,
  type StrategyRevision,
} from "@cowards/spec"
import { CANDIDATE_MATCH_KERNEL, type StrategyRuntime } from "@cowards/engine"
import { INACTIVE_V1_37_REPLAY_TUPLE } from "@cowards/replay"
import {
  buildStrategyRevision,
  createStrategyRevisionId,
} from "@cowards/runtime-js"
import {
  executeCandidateExhibitionForTest,
  type CandidateExhibitionExecutionRequest,
} from "./execute-match.js"
import {
  createFixtureDeploymentLaneIdentity,
  createFixtureRuntimeExecutionAuthorityContext,
} from "./runtime-execution-evidence.test-support.js"
import { createRuntimeServiceConfig } from "./runtime-config.js"

const passiveSource = `
export default {
  selectActivations() {
    return { activationOrders: [], strategyMemory: {} }
  },
  soldierBrain() {
    return { action: { type: "TURN_TO_STONE" }, soldierMemory: {} }
  },
}
`

const candidateRevision = (
  strategyId: string,
  _side: "bottom" | "top",
): StrategyRevision => {
  const revision = buildStrategyRevision({ source: passiveSource, strategyId })
  const candidate: StrategyRevision = {
    ...revision,
    engineCompatibility: {
      spec: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
      engine: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
    },
    validation: {
      ...revision.validation,
      engineCompatibility: {
        spec: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
        engine: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
      },
    },
  }
  const artifact = candidate.metadata.sourceArtifact
  const runtimeCompatibility = runtimeCompatibilityKey({
    runtime: candidate.runtime,
    sourceHash: candidate.sourceHash,
    ...(artifact === undefined ? {} : { artifactHash: artifact.hash }),
    specVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
    engineVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
  })
  return {
    ...candidate,
    id: createStrategyRevisionId({
      sourceHash: candidate.sourceHash,
      runtimeVersion: candidate.runtime.adapter.version,
      specVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.rules,
      engineVersion: INACTIVE_V1_37_REPLAY_TUPLE.tuple.engine,
      strategyRevisionVersion: COMPATIBILITY_VERSIONS.strategyRevision,
      strategyId,
      runtimeCompatibility,
    }),
  }
}

const bottom = candidateRevision("strategy:semantic-bottom", "bottom")
const top = candidateRevision("strategy:semantic-top", "top")
const authority = createFixtureRuntimeExecutionAuthorityContext({
  fixtureId: "semantic-integrity-candidate",
  bottom,
  top,
})
const entrant = (side: "bottom" | "top") => {
  const value = authority.evidenceSnapshot.entrants[side]
  return {
    entrantKey: value.entrantKey,
    strategyRevisionId: value.strategyRevisionId,
    laneIdentityHash: value.laneIdentityHash,
    containmentCertificateId: value.containmentCertificateId!,
    containmentCertificateHash: value.containmentCertificateHash!,
  }
}
const request: CandidateExhibitionExecutionRequest = {
  profile: "candidate_exhibition",
  counted: false,
  requestId: "request:semantic-candidate",
  compatibility: INACTIVE_V1_37_REPLAY_TUPLE,
  match: {
    matchId: "match:semantic-candidate",
    seed: "seed:semantic-candidate",
    arenaVariant: {
      id: "arena:semantic-candidate",
      name: "Runtime semantic candidate",
      initialBounds: INITIAL_BOUNDS,
      terrainStones: [],
    },
    bottomPlayerId: "player:bottom",
    topPlayerId: "player:top",
    bottomStrategyRevisionId: bottom.id,
    topStrategyRevisionId: top.id,
    maxPhases: 1,
  },
  strategies: { bottom, top },
  limits: DEFAULT_RUNTIME_LIMITS,
  runtimeAuthority: {
    authorityBundleHash: authority.evidenceSnapshot.authorityBundleHash,
    registryGeneration: authority.evidenceSnapshot.registryGeneration,
    entrants: { bottom: entrant("bottom"), top: entrant("top") },
  },
}

const passiveRuntime: StrategyRuntime = {
  selectActivations(_input: StrategyInput) {
    return { ok: true, value: { activationOrders: [], strategyMemory: {} } }
  },
  runSoldierBrain(_input: SoldierBrainInput) {
    return {
      ok: true,
      value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
    }
  },
}

describe("runtime-service semantic integrity", () => {
  it("rejects an invalid candidate final state before recording any Chronicle", () => {
    const runCandidateMatch = vi.fn((input) => {
      const execution = CANDIDATE_MATCH_KERNEL.runMatch(input)
      if (execution.kind !== "completed") return execution
      const ownerPlayerId = execution.result.state.players[0]!.id
      const duplicateOccupants = ["a", "b"].map((suffix) => ({
        id: `soldier:semantic-duplicate:${suffix}`,
        ownerPlayerId,
        status: "ACTIVE" as const,
        position: { x: 5, y: 5 },
        facing: "UP" as const,
        lastSuccessfulMoveDirection: null,
        soldierMemory: {},
      }))
      return {
        ...execution,
        result: {
          ...execution.result,
          state: {
            ...execution.result.state,
            soldiers: [
              ...execution.result.state.soldiers,
              ...duplicateOccupants,
            ],
          },
        },
      }
    })
    const recordCandidateExecution = vi.fn(() => {
      throw new Error("recorder must not run after invalid final state")
    })
    const response = executeCandidateExhibitionForTest(
      request,
      createRuntimeServiceConfig({
        strategyExecutionAdapter: "worker-thread",
        resolveDeploymentLaneIdentity: createFixtureDeploymentLaneIdentity,
      }),
      {
        authorityLoader: authority.authorityLoader,
        createRuntimeForRevision: () => ({ ok: true, runtime: passiveRuntime }),
        runCandidateMatch,
        recordCandidateExecution,
      },
    )

    expect(response).toMatchObject({
      ok: false,
      failure: {
        ownership: "system_integrity",
        code: "CANDIDATE_FINAL_STATE_INVALID",
        retryable: false,
        playerPenalty: false,
      },
    })
    expect(authority.authorityLoader.load).toHaveBeenCalledTimes(2)
    expect(runCandidateMatch).toHaveBeenCalledTimes(1)
    expect(recordCandidateExecution).not.toHaveBeenCalled()
    expect(response).not.toHaveProperty("result")
    expect(JSON.stringify(response)).not.toContain(passiveSource.trim())
  })
})
