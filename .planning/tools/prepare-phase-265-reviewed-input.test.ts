import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { admitCanonicalJsonValue } from "@cowards/spec"
import { LEAGUE_APPROVED_PROSPECTIVE_POLICY } from "../../packages/strategy-lab/src/league/allocation.js"
import { assertPhase265LocalReviewLog, preparePhase265ReviewedInput } from "./prepare-phase-265-reviewed-input.js"

const fixture = () => {
  const jobs = LEAGUE_APPROVED_PROSPECTIVE_POLICY.schedule.flat().map((producer, index) => ({
    id: `phase265-${String(index + 1).padStart(2, "0")}-${producer}`,
    producerRequest: { producerIdentity: { tactical: "emitTacticalFactoryPacket", teacher: "emitTeacherFactoryPacket", model: "emitModelFactoryPacket" }[producer], origin: "source-only-fixture", evidenceClass: "real_producer", producerInput: {} },
    disclosure: { sourceAndBuildDisclosed: true, dependencyArtifactRoots: ["sha256:" + "a".repeat(64)] },
    provenance: { priorExposure: "source-only-fixture", conflicts: "none", deterministicDataOnly: true },
  }))
  const admitted = admitCanonicalJsonValue({ schemaVersion: "phase265-request-drafts-v1", privacy: "private_offline", implementationRoot: "sha256:" + "b".repeat(64), sourceRoot: "sha256:" + "c".repeat(64), toolchainRoot: "sha256:" + "d".repeat(64), responseFactoryDependencyRoot: "sha256:" + "a".repeat(64), jobs }, { profile: "canonical-manifest" })
  if (!admitted.ok) throw new Error("fixture canonicalization failed")
  return admitted.canonicalBytes
}

describe("source-only Phase 265 reviewed-input bridge", () => {
  it("binds the CLI review path to the committed single-operator v6 log bytes", () => {
    const path = resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PACKET-REVIEW-v6.md")
    const bytes = readFileSync(path)
    expect(() => assertPhase265LocalReviewLog(path, bytes)).not.toThrow()
    expect(() => assertPhase265LocalReviewLog(path, new TextEncoder().encode("fabricated review"))).toThrow("LOCAL_REVIEW_LOG")
    expect(() => assertPhase265LocalReviewLog(resolve(".planning/other.md"), bytes)).toThrow("LOCAL_REVIEW_LOG")
  })

  it("rejects fabricated drafts even when paired with the exact committed reviewer log", () => {
    const path = resolve(".planning/phases/265-serious-current-rules-league-and-development-red-team/265-07-PACKET-REVIEW-v6.md")
    expect(() => preparePhase265ReviewedInput(fixture(), path, "/private/response")).toThrow("REVIEW_OR_HASH")
    expect(() => preparePhase265ReviewedInput(fixture(), resolve(".planning/other.md"), "/private/response")).toThrow()
  })
})
