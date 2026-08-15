import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  A7,
  REVIEW_PROTOCOL,
  REVIEWER_RUN,
  SOURCE_BASE7,
  deriveReview,
  validateReviewArtifact,
} from "./check-v1-38-plan-262-55-source-completeness-review.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const proof = {
  command: "mutation-test-proof",
  exactA7: A7,
  exitStatus: 0,
  stdoutByteLength: 1,
  stdoutSha256: `sha256:${"1".repeat(64)}`,
  canonicalSnapshotBefore: `sha256:${"2".repeat(64)}`,
  canonicalSnapshotAfter: `sha256:${"2".repeat(64)}`,
  canonicalWorkspaceUnchanged: true,
  cleanupComplete: true,
}

describe("Plan 262-55 independent source-completeness checker", () => {
  it("derives exact custody and the honest procedural review posture", () => {
    const value = deriveReview(repoRoot, proof)
    expect(value).toMatchObject({ reviewProtocol: REVIEW_PROTOCOL,
      reviewerRun: REVIEWER_RUN, reviewerSeparated: true,
      independentPersonClaimed: false,
      cryptographicReviewerIdentityClaimed: false,
      findingCount: 0, sourceCompletenessPassed: true,
      custody: { sourceBase7: SOURCE_BASE7, a7: A7 },
      protectedHistory: { historicalChargedAttemptCount: 40,
        denials: { noRetry: true, independentCustodyClaimed: false,
          routeStarted: false, formationMaterializationAuthorized: false,
          publicAuthorized: false, productionAuthorized: false } } })
    expect(validateReviewArtifact(value)).toEqual(value)
  })

  it.each([
    ["omitted command", (value: any) => ({ ...value,
      commands: value.commands.slice(1) })],
    ["duplicated command", (value: any) => ({ ...value,
      commands: [...value.commands.slice(0, -1), value.commands[0]] })],
    ["false zero finding", (value: any) => ({ ...value,
      findings: [{ code: "MUTATED", detail: "finding hidden" }],
      findingCount: 0, sourceCompletenessPassed: true })],
    ["false independent identity", (value: any) => ({ ...value,
      independentPersonClaimed: true })],
    ["false cryptographic identity", (value: any) => ({ ...value,
      cryptographicReviewerIdentityClaimed: true })],
    ["wrong A7", (value: any) => ({ ...value,
      custody: { ...value.custody, a7: "0".repeat(40) } })],
  ])("rejects %s mutation", (_name, mutate) => {
    const value = deriveReview(repoRoot, proof)
    expect(() => validateReviewArtifact(mutate(value))).toThrow()
  })
})
