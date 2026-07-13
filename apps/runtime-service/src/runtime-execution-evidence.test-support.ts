import {
  CANONICAL_COMPATIBILITY_TUPLES,
  type RuntimeEntrantAuthorityReference,
  type RuntimeExecutionEvidenceSnapshot,
  type StrategyRevision,
} from "@cowards/spec"

const FIXTURE_REGISTRY_GENERATION = "0"
const FIXTURE_AUTHORITY_BUNDLE_HASH = `sha256:${"e".repeat(64)}`

const fixtureEntrantEvidence = (input: {
  fixtureId: string
  side: "bottom" | "top"
  revision: StrategyRevision
}): RuntimeEntrantAuthorityReference => {
  const identitySuffix = `${input.fixtureId}:${input.side}:${input.revision.runtime.language.id}`
  return {
    entrantKey: `fixture-only:entrant:${input.fixtureId}:${input.side}`,
    strategyRevisionId: input.revision.id,
    laneIdentityHash: `sha256:${input.side === "bottom" ? "a" : "b"}`.padEnd(
      71,
      input.side === "bottom" ? "a" : "b",
    ),
    effectiveStatus: "exhibition_only",
    schedulingDecisionId: `fixture-only:scheduling-decision:${identitySuffix}`,
    schedulingDecisionHash: `sha256:${"f".repeat(64)}`,
    containmentCertificateId: `fixture-only:untrusted-containment:${identitySuffix}`,
    containmentCertificateHash: `sha256:${"c".repeat(64)}`,
  }
}

/**
 * Shape-only request evidence for runtime-service execution fixtures.
 *
 * Every identity is fixture-only, untrusted, and explicitly exhibition-only.
 * The containment reference proves the transport shape only; this helper
 * cannot establish production containment, conformance, or counted eligibility.
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
