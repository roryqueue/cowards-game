import { describe, expect, it } from "vitest"
import { labRoot } from "../contracts.js"
import {
  admitFrozenIntakeProtocol,
  blockedIntakeConfiguration,
  deriveFrozenIntakeProtocolRoot,
  deriveIntakeAuthorizationRoot,
  deriveIntakeSubmissionRoot,
  projectIntakeForReviewer,
  type FrozenIntakeProtocol,
} from "./intake-protocol.js"

const r = (letter: string) => `sha256:${letter.repeat(64)}` as `sha256:${string}`
const protocol = (): FrozenIntakeProtocol => {
  const draft = {
    schemaVersion: "frozen-intake-protocol-v1" as const,
    privacy: "private_offline" as const,
    root: r("0"), authorization: r("0"), participantId: "participant-alpha", reviewerIds: ["reviewer-one", "reviewer-two"],
    participantAuthorizationRoot: r("a"), reviewerAuthorizationRoot: r("b"), disclosure: "source-and-provenance" as const,
    submissionLimit: 6, timeLimitMinutes: 30, reviewerLimit: 6, reviewerReuseLimit: 3, conflictsDeclared: true as const,
    conflictPolicy: "reject-on-conflict" as const, confidentiality: "private_offline" as const, provenanceRequired: true as const,
    provenancePolicy: "complete-explicit-deterministic" as const, validationRequired: true as const, validationPolicy: "common-hostile-admission" as const,
    acceptanceBudget: 2, acceptancePolicy: "accept-only-reviewed-source" as const, dispositionPolicy: "retain-all-terminal-outcomes" as const,
  }
  const authorized = { ...draft, authorization: deriveIntakeAuthorizationRoot(draft) }
  return admitFrozenIntakeProtocol({ ...authorized, root: deriveFrozenIntakeProtocolRoot(authorized) })
}

describe("frozen intake protocol", () => {
  it("requires actual authorization identifiers and derives a root without an undefined field", () => {
    const admitted = protocol()
    expect(admitted.root).toBe(deriveFrozenIntakeProtocolRoot(admitted))
    expect(admitted.authorization).toBe(deriveIntakeAuthorizationRoot(admitted))
    expect(Object.isFrozen(admitted)).toBe(true)
    expect(Object.isFrozen(admitted.reviewerIds)).toBe(true)
    expect(() => admitFrozenIntakeProtocol({ ...admitted, participantId: undefined })).toThrow("INTAKE_PROTOCOL")
    expect(() => admitFrozenIntakeProtocol({ ...admitted, reviewerIds: [] })).toThrow("INTAKE_PROTOCOL")
    expect(() => admitFrozenIntakeProtocol({ ...admitted, timeLimitMinutes: Number.NaN })).toThrow("INTAKE_PROTOCOL")
    expect(() => admitFrozenIntakeProtocol({ ...admitted, submissionLimit: -1 })).toThrow("INTAKE_PROTOCOL")
    expect(() => admitFrozenIntakeProtocol({ ...admitted, extra: true })).toThrow("INTAKE_PROTOCOL")
  })

  it("returns an immutable blocked record for incomplete configuration", () => {
    const blocked = blockedIntakeConfiguration("incomplete_protocol")
    expect(blocked.reason).toBe("incomplete_protocol")
    expect(Object.isFrozen(blocked)).toBe(true)
    expect(() => admitFrozenIntakeProtocol({})).toThrow("INTAKE_PROTOCOL")
  })

  it("projects only verified source/provenance roots to an authorized reviewer", () => {
    const admitted = protocol(), sourceRoot = r("c"), provenanceRoot = r("d")
    const value = {
      schemaVersion: "intake-reviewer-projection-v1" as const, privacy: "private_offline" as const,
      protocolRoot: admitted.root, participantId: admitted.participantId, reviewerId: "reviewer-one",
      disclosure: admitted.disclosure, sourceRoot, provenanceRoot,
      submissionRoot: deriveIntakeSubmissionRoot({ protocolRoot: admitted.root, participantId: admitted.participantId, reviewerId: "reviewer-one", sourceRoot, provenanceRoot }),
    }
    const projection = projectIntakeForReviewer(admitted, value)
    expect(projection).toEqual(value)
    expect(Object.isFrozen(projection)).toBe(true)
    for (const prohibited of ["holdout", "otherSource", "strategyMemory", "soldierMemory", "objective", "host", "evaluator", "credentials", "securityInternals"]) {
      expect(() => projectIntakeForReviewer(admitted, { ...value, [prohibited]: r("e") })).toThrow("INTAKE_REVIEWER_PROJECTION")
    }
    expect(() => projectIntakeForReviewer(admitted, { ...value, reviewerId: "unknown-reviewer", submissionRoot: labRoot("fake-submission", {}) })).toThrow("INTAKE_REVIEWER_PROJECTION")
  })
})
