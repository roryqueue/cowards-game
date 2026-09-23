import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { preparePhase265ReviewedInput } from "./prepare-phase-265-reviewed-input.js"

const fixture = () => {
  const jobs = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat().map((producer, index) => ({
    id: `phase265-${String(index + 1).padStart(2, "0")}-${producer}`,
    producerRequest: { producerIdentity: { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer], origin: "source-only-fixture", evidenceClass: "real_producer", producerInput: {} },
    disclosure: { sourceAndBuildDisclosed: true, dependencyArtifactRoots: ["sha256:" + "a".repeat(64)] },
    provenance: { priorExposure: "source-only-fixture", conflicts: "none", deterministicDataOnly: true },
  }))
  const admitted = admitCanonicalJsonValue({ schemaVersion: "phase265-request-drafts-v1", privacy: "private_offline", implementationRoot: "sha256:" + "b".repeat(64), sourceRoot: "sha256:" + "c".repeat(64), toolchainRoot: "sha256:" + "d".repeat(64), responseFactoryDependencyRoot: "sha256:" + "a".repeat(64), jobs }, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new Error("fixture canonicalization failed")
  const bytes = admitted.canonicalBytes, digest = createHash("sha256").update(bytes).digest("hex")
  const review = { draftSha256: digest, reviewerAgentId: "/root/265_draft_reviewer", jobs: jobs.map((job) => ({ id: job.id, disposition: "accepted", reviewMilliseconds: 2000, startUtc: "2026-09-23 03:27:40 UTC", endUtc: "2026-09-23 03:27:41 UTC", reason: "Source-only fixture review" })) }
  return { bytes, review, markdown: `\`\`\`json\n${JSON.stringify(review)}\n\`\`\`` }
}

describe("source-only Phase 265 reviewed-input bridge", () => {
  it("requires an exact review of every draft job and preserves distinct roles", () => {
    const data = fixture(), result = preparePhase265ReviewedInput(data.bytes, data.markdown, "/private/response")
    expect(result.packetInput.jobs).toHaveLength(11)
    expect(result.participantRoles).toHaveLength(11)
    expect(result.participantRoles.every((row) => row.authorAgentId !== row.reviewerAgentId)).toBe(true)
    expect(result.packetInput.jobs.every((row) => row.review.reviewMilliseconds === 2000)).toBe(true)
    expect(() => preparePhase265ReviewedInput(data.bytes, data.markdown.replace(data.review.draftSha256, "0".repeat(64)), "/private/response")).toThrow("REVIEW_OR_HASH")
    const rejected = { ...data.review, jobs: data.review.jobs.map((row, index) => index === 4 ? { ...row, disposition: "rejected" } : row) }
    expect(() => preparePhase265ReviewedInput(data.bytes, `\`\`\`json\n${JSON.stringify(rejected)}\n\`\`\``, "/private/response")).toThrow("REVIEW_JOB")
  })
})
