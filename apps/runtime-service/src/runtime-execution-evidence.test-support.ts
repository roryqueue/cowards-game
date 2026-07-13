import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type RuntimeEntrantExecutionEvidence,
  type RuntimeExecutionEvidenceSnapshot,
  type StrategyRevision,
} from "@cowards/spec"

const FIXTURE_REGISTRY_GENERATION =
  "fixture-only:untrusted-registry-generation:0"
const FIXTURE_AUTHORITY_BUNDLE_HASH =
  "fixture-only:untrusted-authority-bundle:no-production-signature"
const FIXTURE_EVALUATED_AT = "2026-07-13T00:00:00.000Z"
const FIXTURE_FRESH_UNTIL = "2026-07-14T00:00:00.000Z"

const fixtureEntrantEvidence = (input: {
  fixtureId: string
  side: "bottom" | "top"
  revision: StrategyRevision
}): RuntimeEntrantExecutionEvidence => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
  const identitySuffix = `${input.fixtureId}:${input.side}:${input.revision.runtime.language.id}`
  return {
    entrantKey: `fixture-only:entrant:${input.fixtureId}:${input.side}`,
    strategyRevisionId: input.revision.id,
    laneIdentity: {
      providerId: `fixture-only:provider:${input.revision.runtime.language.id}`,
      languageId: input.revision.runtime.language.id,
      runtimeId: `fixture-only:runtime:${input.revision.runtime.adapter.id}`,
      runtimeVersion: input.revision.runtime.language.version,
      toolchainId: `fixture-only:toolchain:${input.revision.runtime.language.id}`,
      toolchainVersion: input.revision.runtime.language.version,
      adapterId: input.revision.runtime.adapter.id,
      adapterVersion: input.revision.runtime.adapter.version,
      policyId: "fixture-only:package-none",
      policyVersion: "0",
      corpusId: `fixture-only:corpus:${input.fixtureId}`,
      corpusVersion: "0",
      artifactId: `fixture-only:artifact:${identitySuffix}`,
      artifactSha256: input.revision.sourceHash,
      implementationId: "fixture-only:runtime-service-test-harness",
      buildId: `fixture-only:build:${identitySuffix}`,
      semanticTupleId: tuple.tupleId,
      semanticTuple: { ...tuple.tuple },
    },
    containmentCertificateRef: {
      kind: "containment",
      certificateId: `fixture-only:untrusted-containment:${identitySuffix}`,
      certificateVersion: "0",
      certificateRecordHash: `fixture-only:untrusted-containment-hash:${identitySuffix}`,
      registryGeneration: FIXTURE_REGISTRY_GENERATION,
    },
    conformanceCertificateRef: {
      kind: "conformance",
      certificateId: `fixture-only:untrusted-conformance:${identitySuffix}`,
      certificateVersion: "0",
      certificateRecordHash: `fixture-only:untrusted-conformance-hash:${identitySuffix}`,
      registryGeneration: FIXTURE_REGISTRY_GENERATION,
    },
    schedulingDecision: {
      status: "disabled",
      reasonCode: "OPERATOR_DISABLED",
      evaluatedAt: FIXTURE_EVALUATED_AT,
      freshUntil: FIXTURE_FRESH_UNTIL,
      registryGeneration: FIXTURE_REGISTRY_GENERATION,
    },
  }
}

/**
 * Shape-only request evidence for runtime-service execution fixtures.
 *
 * Every identity is fixture-only, untrusted, and explicitly disabled. This
 * helper proves transport/schema completeness only; it cannot establish
 * production containment, conformance, or counted eligibility.
 */
export const createFixtureRuntimeExecutionEvidenceSnapshot = (input: {
  fixtureId: string
  bottom: StrategyRevision
  top: StrategyRevision
}): RuntimeExecutionEvidenceSnapshot => {
  const tuple = CANONICAL_COMPATIBILITY_TUPLES[0]!
  return {
    compatibility: {
      tupleId: tuple.tupleId,
      tuple: { ...tuple.tuple },
    },
    authorityBundleHash: FIXTURE_AUTHORITY_BUNDLE_HASH,
    registryGeneration: FIXTURE_REGISTRY_GENERATION,
    entrants: {
      bottom: fixtureEntrantEvidence({
        fixtureId: input.fixtureId,
        side: "bottom",
        revision: input.bottom,
      }),
      top: fixtureEntrantEvidence({
        fixtureId: input.fixtureId,
        side: "top",
        revision: input.top,
      }),
    },
  }
}
