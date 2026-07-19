import { createHash } from "node:crypto"
import {
  getInitialInitiativePlayerId,
  MATCH_KERNEL,
  type GameState,
  type StrategyRuntime,
} from "@cowards/engine"
import { adaptRuntimeForCurrentKernel } from "@cowards/engine/test/current-kernel-runtime"
import { recordChronicleFromExecution } from "@cowards/replay"
import {
  ARENA_CATALOG_VERSION_V1_37,
  CANONICAL_COMPATIBILITY_TUPLES,
  CANONICAL_ARENA_CATALOG_V1_37,
  SET_CONDITION_POLICY_VERSION_V1_37,
  createSetScenarioV137,
  type ExecutableLaneIdentity,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionResolvedEvidenceSnapshot,
} from "@cowards/spec"
import type { Pool } from "pg"
import { describe, expect, it } from "vitest"
import { completeMatch } from "./complete-match.js"
import {
  createMatchExecutionEvidencePair,
  createMatchSetIntegrityIdentity,
} from "./integrity-evidence.js"
import { TEST_CURRENT_IS_V119 } from "./test-current-semantic-authority.js"

const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
const sha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex")

const lane = (
  side: "bottom" | "top",
  namespace: string,
): ExecutableLaneIdentity => ({
  providerId: `${namespace}:provider:${side}`,
  languageId: side === "bottom" ? "typescript" : "python",
  runtimeId: `${namespace}:runtime:${side}`,
  runtimeVersion: "1",
  toolchainId: `${namespace}:toolchain:${side}`,
  toolchainVersion: "1",
  adapterId: `${namespace}:adapter:${side}`,
  adapterVersion: "1",
  policyId: `${namespace}:policy`,
  policyVersion: "1",
  corpusId: `${namespace}:corpus`,
  corpusVersion: "1",
  artifactId: `${namespace}:artifact:${side}`,
  artifactSha256: sha256(`${namespace}:artifact:${side}`),
  implementationId: `${namespace}:implementation:${side}`,
  buildId: `${namespace}:build:${side}`,
  semanticTupleId: tuple.tupleId,
  semanticTuple: { ...tuple.tuple },
})

const entrant = (
  side: "bottom" | "top",
  namespace: string,
): RuntimeEntrantExecutionEvidence => ({
  entrantKey: `${namespace}:entrant:${side}`,
  strategyRevisionId: `${namespace}:revision:${side}`,
  laneIdentity: lane(side, namespace),
  containmentCertificateRef: {
    kind: "containment",
    certificateId: `${namespace}:certificate:containment:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:containment:${side}`),
    registryGeneration: "1",
  },
  conformanceCertificateRef: {
    kind: "conformance",
    certificateId: `${namespace}:certificate:conformance:${side}`,
    certificateVersion: "runtime-certificate-v1",
    certificateRecordHash: sha256(`${namespace}:conformance:${side}`),
    registryGeneration: "1",
  },
  schedulingDecision: {
    status: "counted",
    reasonCode: "EVIDENCE_CURRENT",
    evaluatedAt: "2026-07-12T12:00:00.000Z",
    freshUntil: "2099-08-12T12:00:00.000Z",
    registryGeneration: "1",
  },
})

const integrityIdentity = (
  namespace: string,
): RuntimeExecutionResolvedEvidenceSnapshot => {
  const entrants = [entrant("bottom", namespace), entrant("top", namespace)]
  const identity = createMatchSetIntegrityIdentity({
    compatibility: { tupleId: tuple.tupleId, tuple: { ...tuple.tuple } },
    authorityBundleHash: sha256(`${namespace}:bundle`),
    registryGeneration: "1",
    expectedEntrants: entrants.map((entry) => ({
      entrantKey: entry.entrantKey,
      strategyRevisionId: entry.strategyRevisionId,
    })),
    entrants,
  })
  const pair = createMatchExecutionEvidencePair(identity, {
    bottomEntrantKey: `${namespace}:entrant:bottom`,
    topEntrantKey: `${namespace}:entrant:top`,
    bottomStrategyRevisionId: `${namespace}:revision:bottom`,
    topStrategyRevisionId: `${namespace}:revision:top`,
  })
  return {
    compatibility: identity.compatibility,
    authorityBundleHash: identity.authorityBundleHash,
    registryGeneration: identity.registryGeneration,
    entrants: { bottom: pair.bottom, top: pair.top },
  }
}

const runtime: StrategyRuntime = {
  selectActivations(input) {
    return {
      ok: true,
      value: {
        activationOrders: input.mySoldiers
          .filter(({ status }) => status === "ACTIVE")
          .map(({ id }) => ({ soldierId: id })),
        strategyMemory: {},
      },
    }
  },
  runSoldierBrain() {
    return {
      ok: true,
      value: { action: { type: "TURN_TO_STONE" }, soldierMemory: {} },
    }
  },
}

describe("current persistence semantic integrity", () => {
  it("rejects invalid current state before opening a database transaction", async () => {
    const namespace = "semantic:current"
    const matchId = `${namespace}:match`
    const seed = `${namespace}:seed`
    const bottomPlayerId = `${namespace}:player:bottom`
    const topPlayerId = `${namespace}:player:top`
    const bottomStrategyRevisionId = `${namespace}:revision:bottom`
    const topStrategyRevisionId = `${namespace}:revision:top`
    const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
      ({ id }) => id === "arena:smoke:v1",
    )!
    const scenario = createSetScenarioV137({
      arenaCatalogVersion: ARENA_CATALOG_VERSION_V1_37,
      arenaSemanticGeometryHash: arena.semanticGeometryHash,
      entrantA: {
        entrantKey: `${namespace}:entrant:bottom`,
        playerId: bottomPlayerId,
      },
      entrantB: {
        entrantKey: `${namespace}:entrant:top`,
        playerId: topPlayerId,
      },
      baseSeed: seed,
    })
    const derivedInitialInitiativePlayerId = getInitialInitiativePlayerId(
      seed,
      bottomPlayerId,
      topPlayerId,
    )
    const condition = scenario.conditions.find(
      (candidate) =>
        candidate.bottomPlayerId === bottomPlayerId &&
        candidate.topPlayerId === topPlayerId &&
        candidate.initialInitiativePlayerId ===
          derivedInitialInitiativePlayerId,
    )!
    const execution = MATCH_KERNEL.runMatch({
      matchId,
      seed,
      arenaVariant: {
        id: arena.id,
        name: arena.name,
        initialBounds: arena.initialBounds,
        terrainStones: arena.terrainStones,
      },
      bottomPlayerId,
      topPlayerId,
      bottomStrategyRevisionId,
      topStrategyRevisionId,
      runtime: adaptRuntimeForCurrentKernel(runtime),
    })
    const recorded = recordChronicleFromExecution({
      execution,
      metadata: {
        schemaVersion: "chronicle-v1.4",
        semanticTupleId: MATCH_KERNEL.tupleId,
        semanticTuple: MATCH_KERNEL.tuple,
      },
      ...(TEST_CURRENT_IS_V119
        ? {
            candidateMatch: {
              semanticAuthorityKey: "runtime-v1.19" as const,
              matchId,
              seed,
              arenaVariantId: arena.id,
              bottomStrategyRevisionId,
              topStrategyRevisionId,
              bottomPlayerId,
              topPlayerId,
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
              initialInitiativeEntrantKey:
                condition.initialInitiativeEntrantKey,
              initialInitiativePlayerId: condition.initialInitiativePlayerId,
            },
          }
        : {}),
    })
    if (!recorded.ok) throw new Error(recorded.failure.code)
    const positioned = recorded.finalState.soldiers.filter(
      ({ position }) => position !== null,
    )
    const invalidState: GameState = {
      ...recorded.finalState,
      soldiers: recorded.finalState.soldiers.map((soldier) =>
        soldier.id === positioned[1]!.id
          ? {
              ...soldier,
              position: globalThis.structuredClone(positioned[0]!.position),
            }
          : soldier,
      ),
    }
    const pool = {
      async connect() {
        throw new Error("database transaction must not open")
      },
    } as unknown as Pool

    await expect(
      completeMatch(pool, {
        jobId: `${namespace}:job`,
        leaseToken: `${namespace}:lease`,
        chronicle: recorded.chronicle,
        finalState: invalidState,
        integrityIdentity: integrityIdentity(namespace),
        execution,
        boundaryAnchors: recorded.boundaryAnchors,
      }),
    ).rejects.toMatchObject({
      code: "POSITION_OCCUPANCY_DUPLICATE",
      failureCategory: "system_failure",
      ownership: "system_integrity",
      playerPenalty: false,
    })
  })
})
