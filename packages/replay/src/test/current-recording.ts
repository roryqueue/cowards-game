import { MatchExecutionFailure, runMatch } from "@cowards/engine"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_ARENA_CATALOG_V1_37,
  CURRENT_SEMANTIC_AUTHORITY_KEY,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  resolveCandidateRuntimeV119SemanticTuple,
} from "@cowards/spec"
import {
  recordChronicleFromExecution,
  type CandidateReplayMatchAuthorityV119,
  type RecordChronicleFromExecutionInput,
  type RecordChronicleFromExecutionResult,
} from "../record.js"

type CurrentMatchInput = Parameters<typeof runMatch>[0]
type RecorderExecution = RecordChronicleFromExecutionInput["execution"]
type CurrentMatchResult =
  | Extract<RecorderExecution, { readonly kind: "completed" }>
  | (Extract<RecorderExecution, { readonly kind: "failure" }> & {
      readonly failure: { readonly code: string }
    })

const executeCurrentMatch = (input: CurrentMatchInput): CurrentMatchResult => {
  try {
    return runMatch(input).execution
  } catch (error) {
    if (!(error instanceof MatchExecutionFailure)) throw error
    return {
      kind: "failure",
      transitions: [],
      failure: error.failure,
      unchangedState: error.unchangedState,
    }
  }
}

const currentFixtureArena = () => {
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ status, schedulable, terrainStones }) =>
      status === "active" && schedulable && terrainStones.length === 0,
  )
  if (arena === undefined) {
    throw new Error("CURRENT_REPLAY_TEST_ARENA_UNAVAILABLE")
  }
  return arena
}

export const runCurrentMatchForReplayTestSupport = (
  input: CurrentMatchInput,
): CurrentMatchResult => {
  const arena = currentFixtureArena()
  return executeCurrentMatch({
    ...input,
    arenaVariant: {
      id: arena.id,
      name: arena.name,
      initialBounds: { ...arena.initialBounds },
      terrainStones: arena.terrainStones.map((position) => ({ ...position })),
    },
  })
}

export const runSelectedCurrentMatchForReplayTestSupport = (
  input: CurrentMatchInput,
): CurrentMatchResult =>
  String(CURRENT_SEMANTIC_AUTHORITY_KEY) !== "runtime-v1.19"
    ? executeCurrentMatch(input)
    : runCurrentMatchForReplayTestSupport(input)

const deriveCandidateMatchAuthority = (
  input: RecordChronicleFromExecutionInput,
): CandidateReplayMatchAuthorityV119 => {
  if (input.execution.kind !== "completed") {
    throw new Error("CURRENT_REPLAY_TEST_EXECUTION_NOT_COMPLETED")
  }
  const finalState = input.execution.recorderMaterial.finalState
  const bottom = finalState.players.find(({ side }) => side === "bottom")
  const top = finalState.players.find(({ side }) => side === "top")
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id, status, schedulable }) =>
      id === finalState.arenaVariant.id && status === "active" && schedulable,
  )
  if (bottom === undefined || top === undefined || arena === undefined) {
    throw new Error("CURRENT_REPLAY_TEST_AUTHORITY_UNAVAILABLE")
  }

  const bottomEntrantKey = "fixture-entrant:bottom"
  const topEntrantKey = "fixture-entrant:top"
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: { entrantKey: bottomEntrantKey, playerId: bottom.id },
    entrantB: { entrantKey: topEntrantKey, playerId: top.id },
    baseSeed: finalState.seed,
  })
  const condition = scenario.conditions.find(
    (candidate) =>
      candidate.bottomPlayerId === bottom.id &&
      candidate.topPlayerId === top.id &&
      candidate.initialInitiativePlayerId ===
        finalState.initialInitiativePlayerId,
  )
  if (condition === undefined) {
    throw new Error("CURRENT_REPLAY_TEST_CONDITION_UNAVAILABLE")
  }

  return {
    semanticAuthorityKey: "runtime-v1.19",
    matchId: finalState.matchId,
    seed: finalState.seed,
    arenaVariantId: arena.id,
    bottomStrategyRevisionId: bottom.strategyRevisionId,
    topStrategyRevisionId: top.strategyRevisionId,
    bottomPlayerId: bottom.id,
    topPlayerId: top.id,
    bottomEntrantKey: condition.bottomEntrantKey,
    topEntrantKey: condition.topEntrantKey,
    setPolicyVersion: SET_CONDITION_POLICY_VERSION_V1_37,
    scenarioId: scenario.scenarioId,
    conditionId: condition.conditionId,
    conditionOrdinal: condition.ordinal,
    conditionSuffix: condition.suffix,
    requestIdentity: condition.requestIdentity,
    arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    initialInitiativeEntrantKey: condition.initialInitiativeEntrantKey,
    initialInitiativePlayerId: condition.initialInitiativePlayerId,
  }
}

export const recordCurrentChronicleTestSupport = (
  input: RecordChronicleFromExecutionInput,
): RecordChronicleFromExecutionResult => {
  if (
    input.execution.kind !== "completed" ||
    input.candidateMatch !== undefined ||
    resolveCandidateRuntimeV119SemanticTuple({
      tupleId: input.metadata.semanticTupleId,
      tuple: input.metadata.semanticTuple,
    }) === undefined
  ) {
    return recordChronicleFromExecution(input)
  }
  return recordChronicleFromExecution({
    ...input,
    candidateMatch: deriveCandidateMatchAuthority(input),
  })
}

type SuccessfulRecording = Extract<
  RecordChronicleFromExecutionResult,
  { readonly ok: true }
>

export const selectedCurrentSemanticAuthorityTestSupport = (
  recording: SuccessfulRecording,
) =>
  recording.candidateReproducibility === undefined
    ? {}
    : {
        candidateReproducibility: recording.candidateReproducibility,
        persistedMatch: recording.candidateReproducibility.match,
      }

export const selectedCurrentReconstructionAuthorityTestSupport = (
  recording: SuccessfulRecording,
) =>
  recording.candidateReproducibility === undefined
    ? {}
    : {
        candidateReproducibility: recording.candidateReproducibility,
        candidateMatch: recording.candidateReproducibility.match,
      }
