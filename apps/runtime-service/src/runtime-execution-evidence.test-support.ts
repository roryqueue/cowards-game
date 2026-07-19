import { vi } from "vitest"
import {
  CANONICAL_COMPATIBILITY_TUPLES,
  CANONICAL_ARENA_CATALOG_V1_37,
  CURRENT_SEMANTIC_RUNTIME_ABI_VERSION,
  createSetScenarioV137,
  RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
  RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS,
  hashExecutableLaneIdentity,
  parseRuntimeEvidenceAuthorityPayload,
  type ExecutableLaneEvidenceStatus,
  type ExecutableLaneIdentity,
  type RuntimeEntrantAuthorityReference,
  type RuntimeExecutionEvidenceSnapshot,
  type RuntimeExecutionServiceRequest,
  type StrategyRevision,
} from "@cowards/spec"
import { hashRuntimeAuthoritySchedulingDecisionReference } from "./execute-match.js"
import type {
  RuntimeEvidenceAuthorityLoader,
  VerifiedMountedRuntimeEvidenceAuthority,
} from "./runtime-evidence-authority.js"

const FIXTURE_REGISTRY_GENERATION = "0"
const FIXTURE_AUTHORITY_BUNDLE_HASH = `sha256:${"e".repeat(64)}`
const FIXTURE_PUBLICATION = {
  publicationId: "fixture-only:publication",
  installReceiptId: "fixture-only:install-receipt",
  payloadSha256: FIXTURE_AUTHORITY_BUNDLE_HASH,
  envelopeSha256: `sha256:${"f".repeat(64)}`,
  sourceManifestHash: `sha256:${"9".repeat(64)}`,
} as const

export const bindFixtureCandidateMatchAuthorityV119 = (
  request: RuntimeExecutionServiceRequest,
): RuntimeExecutionServiceRequest => {
  if (
    String(CURRENT_SEMANTIC_RUNTIME_ABI_VERSION) !==
    "strategy-runtime-abi-v1.19"
  ) {
    return request
  }
  const arena = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
    ({ id }) => id === "arena:smoke:v1",
  )
  if (arena === undefined || arena.status !== "active") {
    throw new Error("fixture candidate arena is unavailable")
  }
  const scenario = createSetScenarioV137({
    arenaCatalogVersion: CANONICAL_ARENA_CATALOG_V1_37.catalogVersion,
    arenaSemanticGeometryHash: arena.semanticGeometryHash,
    entrantA: {
      entrantKey: request.evidenceSnapshot.entrants.bottom.entrantKey,
      playerId: request.match.bottomPlayerId,
    },
    entrantB: {
      entrantKey: request.evidenceSnapshot.entrants.top.entrantKey,
      playerId: request.match.topPlayerId,
    },
    baseSeed: request.match.seed,
  })
  const condition = scenario.conditions[0]!
  return {
    ...request,
    match: {
      ...request.match,
      arenaVariant: {
        id: arena.id,
        name: arena.name,
        initialBounds: { ...arena.initialBounds },
        terrainStones: arena.terrainStones.map((position) => ({ ...position })),
      },
      initialInitiativePlayerId: condition.initialInitiativePlayerId,
      candidateMatch: {
        semanticAuthorityKey: "runtime-v1.19",
        matchId: request.match.matchId,
        seed: request.match.seed,
        arenaVariantId: arena.id,
        bottomStrategyRevisionId: request.match.bottomStrategyRevisionId,
        topStrategyRevisionId: request.match.topStrategyRevisionId,
        bottomPlayerId: request.match.bottomPlayerId,
        topPlayerId: request.match.topPlayerId,
        bottomEntrantKey: condition.bottomEntrantKey,
        topEntrantKey: condition.topEntrantKey,
        setPolicyVersion: scenario.setPolicyVersion,
        scenarioId: scenario.scenarioId,
        conditionId: condition.conditionId,
        conditionOrdinal: condition.ordinal,
        conditionSuffix: condition.suffix,
        requestIdentity: condition.requestIdentity,
        arenaCatalogVersion: scenario.arenaCatalogVersion,
        arenaSemanticGeometryHash: scenario.arenaSemanticGeometryHash,
        initialInitiativeEntrantKey:
          condition.initialInitiativeEntrantKey,
        initialInitiativePlayerId: condition.initialInitiativePlayerId,
      },
    },
  } as RuntimeExecutionServiceRequest
}

export const createFixtureDeploymentLaneIdentity = (
  revision: StrategyRevision,
): ExecutableLaneIdentity => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
  const sourceArtifact = revision.metadata.sourceArtifact
  const compiledArtifact = revision.metadata.compiledArtifact
  const artifact = sourceArtifact ?? compiledArtifact
  return {
    providerId:
      revision.metadata.providerValidation?.providerId ??
      `fixture-provider:${revision.runtime.language.id}`,
    languageId: revision.runtime.language.id,
    runtimeId:
      sourceArtifact?.toolchain.runtime ??
      `fixture-runtime:${revision.runtime.language.id}`,
    runtimeVersion:
      sourceArtifact?.toolchain.runtimeVersion ??
      revision.validation.runtimeVersion,
    toolchainId:
      sourceArtifact?.toolchain.language ??
      compiledArtifact?.toolchain.compiler ??
      `fixture-toolchain:${revision.runtime.language.id}`,
    toolchainVersion:
      sourceArtifact?.toolchain.runtimeVersion ??
      compiledArtifact?.toolchain.compilerVersion ??
      revision.runtime.language.version,
    adapterId: revision.runtime.adapter.id,
    adapterVersion: revision.runtime.adapter.version,
    policyId: "fixture-package-none-policy",
    policyVersion: "v1.37",
    corpusId: "fixture-four-language-corpus",
    corpusVersion: "v1.37",
    artifactId: `fixture-artifact:${revision.id}`,
    artifactSha256: (artifact?.hash ?? revision.sourceHash).replace(
      /^sha256:/u,
      "",
    ),
    implementationId: "fixture-runtime-service",
    buildId: "fixture-runtime-service-build-v1.37",
    semanticTupleId: tuple.tupleId,
    semanticTuple: { ...tuple.tuple },
  }
}

const fixtureEntrantEvidence = (input: {
  fixtureId: string
  side: "bottom" | "top"
  revision: StrategyRevision
  effectiveStatus: Exclude<ExecutableLaneEvidenceStatus, "disabled">
  compatibilityTupleId: string
}): RuntimeEntrantAuthorityReference => {
  const identitySuffix = `${input.fixtureId}:${input.side}:${input.revision.runtime.language.id}`
  const laneIdentity = createFixtureDeploymentLaneIdentity(input.revision)
  const entrant: RuntimeEntrantAuthorityReference = {
    entrantKey: `fixture-only:entrant:${input.fixtureId}:${input.side}`,
    strategyRevisionId: input.revision.id,
    laneIdentityHash: `sha256:${hashExecutableLaneIdentity(laneIdentity)}`,
    effectiveStatus: input.effectiveStatus,
    schedulingDecisionId: `fixture-only:scheduling-decision:${identitySuffix}`,
    schedulingDecisionHash: `sha256:${"0".repeat(64)}`,
    schedulingDecision: {
      status: input.effectiveStatus,
      reasonCode:
        input.effectiveStatus === "counted"
          ? "EVIDENCE_CURRENT"
          : "CONFORMANCE_MISSING",
      evaluatedAt: "2026-07-12T00:00:00.000Z",
      freshUntil: "2026-07-14T00:00:00.000Z",
      registryGeneration: FIXTURE_REGISTRY_GENERATION,
    },
    containmentCertificateId: `fixture-only:untrusted-containment:${identitySuffix}`,
    containmentCertificateHash: `sha256:${"c".repeat(64)}`,
    ...(input.effectiveStatus === "counted"
      ? {
          conformanceCertificateId: `fixture-only:untrusted-conformance:${identitySuffix}`,
          conformanceCertificateHash: `sha256:${"d".repeat(64)}`,
        }
      : {}),
  }
  return {
    ...entrant,
    schedulingDecisionHash: hashRuntimeAuthoritySchedulingDecisionReference({
      compatibilityTupleId: input.compatibilityTupleId,
      authorityBundleHash: FIXTURE_AUTHORITY_BUNDLE_HASH,
      registryGeneration: FIXTURE_REGISTRY_GENERATION,
      publication: FIXTURE_PUBLICATION,
      entrant,
    }),
  }
}

const fixtureAuthorityForSnapshot = (
  snapshot: RuntimeExecutionEvidenceSnapshot,
  strategies: RuntimeExecutionServiceRequest["strategies"],
): Readonly<VerifiedMountedRuntimeEvidenceAuthority> => {
  const attestations = Object.entries(snapshot.entrants).map(
    ([side, entrant]) => ({
      attestationId: `fixture-only:attestation:${side}:${entrant.entrantKey}`,
      attestationHash: `sha256:${side === "bottom" ? "1" : "2"}`.padEnd(
        71,
        side === "bottom" ? "1" : "2",
      ),
      verified: true as const,
      imports: [] as const,
    }),
  )
  const certificates = Object.entries(snapshot.entrants).flatMap(
    ([side, entrant], index) => {
      const attestationId = attestations[index]!.attestationId
      const laneIdentity = createFixtureDeploymentLaneIdentity(
        strategies[side as "bottom" | "top"],
      )
      return [
        {
          kind: "containment" as const,
          certificateId: entrant.containmentCertificateId!,
          certificateVersion: "fixture-only-containment-v1",
          certificateRecordHash: entrant.containmentCertificateHash!,
          laneIdentityHash: entrant.laneIdentityHash,
          laneIdentity,
          issuedAt: "2026-07-12T00:00:00.000Z",
          freshUntil: "2026-07-14T00:00:00.000Z",
          attestationIds: [attestationId],
        },
        ...(entrant.effectiveStatus === "counted"
          ? [
              {
                kind: "conformance" as const,
                certificateId: entrant.conformanceCertificateId!,
                certificateVersion: "fixture-only-conformance-v1",
                certificateRecordHash: entrant.conformanceCertificateHash!,
                laneIdentityHash: entrant.laneIdentityHash,
                laneIdentity,
                issuedAt: "2026-07-12T00:00:00.000Z",
                freshUntil: "2026-07-14T00:00:00.000Z",
                attestationIds: [attestationId],
              },
            ]
          : []),
      ]
    },
  )
  const payload = parseRuntimeEvidenceAuthorityPayload({
    schemaVersion: RUNTIME_EVIDENCE_AUTHORITY_PAYLOAD_SCHEMA_VERSION,
    bundleVersion: "v1.37-runtime-service-fixture-v1",
    registryGeneration: snapshot.registryGeneration,
    issuedAt: "2026-07-12T00:00:00.000Z",
    validFrom: "2026-07-12T00:00:00.000Z",
    validUntil: "2026-07-14T00:00:00.000Z",
    semanticTupleManifestHash: snapshot.compatibility.tupleId,
    attestations,
    certificates,
    revocations: [],
    supersessions: [],
    operatorLaneDisables: [],
  })
  return Object.freeze({
    authorityBundleHash: snapshot.authorityBundleHash,
    registryGeneration: snapshot.registryGeneration,
    semanticTupleManifestHash: snapshot.compatibility.tupleId,
    trustDomain: RUNTIME_EVIDENCE_AUTHORITY_TRUST_DOMAINS.fixture,
    keyId: "fixture-only-runtime-evidence-authority-key",
    payload,
  })
}

export const createFixtureRuntimeEvidenceAuthorityLoader = (
  snapshot: RuntimeExecutionEvidenceSnapshot,
  strategies: RuntimeExecutionServiceRequest["strategies"],
): RuntimeEvidenceAuthorityLoader => {
  const authority = fixtureAuthorityForSnapshot(snapshot, strategies)
  let current: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
  return {
    load: vi.fn(() => {
      current = authority
      return authority
    }),
    current: () => current,
  }
}

export interface FixtureRuntimeExecutionAuthorityContext {
  evidenceSnapshot: RuntimeExecutionEvidenceSnapshot
  authority: Readonly<VerifiedMountedRuntimeEvidenceAuthority>
  authorityLoader: RuntimeEvidenceAuthorityLoader
}

export const createFixtureRuntimeExecutionAuthorityContext = (input: {
  fixtureId: string
  bottom: StrategyRevision
  top: StrategyRevision
  effectiveStatus?: "exhibition_only" | "counted"
}): FixtureRuntimeExecutionAuthorityContext => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
  const effectiveStatus = input.effectiveStatus ?? "exhibition_only"
  const evidenceSnapshot: RuntimeExecutionEvidenceSnapshot = {
    compatibility: {
      tupleId: tuple.tupleId,
      tuple: { ...tuple.tuple },
    },
    authorityBundleHash: FIXTURE_AUTHORITY_BUNDLE_HASH,
    registryGeneration: FIXTURE_REGISTRY_GENERATION,
    publication: FIXTURE_PUBLICATION,
    entrants: {
      bottom: fixtureEntrantEvidence({
        fixtureId: input.fixtureId,
        side: "bottom",
        revision: input.bottom,
        effectiveStatus,
        compatibilityTupleId: tuple.tupleId,
      }),
      top: fixtureEntrantEvidence({
        fixtureId: input.fixtureId,
        side: "top",
        revision: input.top,
        effectiveStatus,
        compatibilityTupleId: tuple.tupleId,
      }),
    },
  }
  const strategies = { bottom: input.bottom, top: input.top }
  const authority = fixtureAuthorityForSnapshot(evidenceSnapshot, strategies)
  let current: Readonly<VerifiedMountedRuntimeEvidenceAuthority> | undefined
  const authorityLoader: RuntimeEvidenceAuthorityLoader = {
    load: vi.fn(() => {
      current = authority
      return authority
    }),
    current: () => current,
  }
  return { evidenceSnapshot, authority, authorityLoader }
}

/**
 * Shape-only request evidence for runtime-service execution fixtures.
 *
 * Every identity is fixture-only and explicitly exhibition-only. The paired
 * fixture loader validates only the fixture trust domain, which production
 * configuration rejects before execution.
 */
export const createFixtureRuntimeExecutionEvidenceSnapshot = (input: {
  fixtureId: string
  bottom: StrategyRevision
  top: StrategyRevision
}): RuntimeExecutionEvidenceSnapshot =>
  createFixtureRuntimeExecutionAuthorityContext(input).evidenceSnapshot
