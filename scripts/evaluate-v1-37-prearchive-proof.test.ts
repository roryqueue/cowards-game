import { describe, expect, it } from "vitest"
import {
  createV137PrearchiveProofFixture,
  renderV137PrearchiveProofJson,
  renderV137PrearchiveProofMarkdown,
  validateV137PrearchiveProof,
} from "./evaluate-v1-37-prearchive-proof.js"

describe("v1.37 non-circular prearchive proof", () => {
  it("accepts exactly 48 inherited passes, seven executable passes, and one pending outer release", () => {
    const proof = createV137PrearchiveProofFixture()
    expect(validateV137PrearchiveProof(proof)).toEqual(proof)
    expect(proof.traceability).toEqual({ total: 56, inheritedPassed: 48, phaseExecutablePassed: 7, passed: 55, releaseOperationReadyPending: 1 })
    expect(proof.requirements.at(-1)).toEqual({ id: "PROOF-08", status: "ready_pending", evidence: "outer-archive-annotated-tag-post-check" })
    expect(renderV137PrearchiveProofJson(proof)).not.toMatch(/archiveCommit|tagObject|selfHash|override/i)
    expect(renderV137PrearchiveProofMarkdown(proof)).toContain("55 passed")
  })

  it("rejects premature completion, circular identity, stale lower proof, override, privacy, drift, and unapproved semantic change", () => {
    const proof = createV137PrearchiveProofFixture()
    expect(() => validateV137PrearchiveProof({ ...proof, traceability: { ...proof.traceability, passed: 56 } })).toThrow("V137_PREARCHIVE_TRACEABILITY_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, requirements: [...proof.requirements.slice(0, -1), { id: "PROOF-08", status: "passed", evidence: "tag" }] })).toThrow("V137_PREARCHIVE_REQUIREMENTS_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, archiveCommit: "deadbeef" })).toThrow("V137_PREARCHIVE_SHAPE")
    expect(() => validateV137PrearchiveProof({ ...proof, lowerProofs: proof.lowerProofs.slice(1) })).toThrow("V137_PREARCHIVE_LOWER_PROOFS_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, semantic: { transitionAuthorityCount: 2, unapprovedGameplayChange: false, exactCompatibilityRulingsOnly: true } })).toThrow("V137_PREARCHIVE_SEMANTIC_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, releaseBoundaries: { findings: 1, privacySafe: true } })).toThrow("V137_PREARCHIVE_BOUNDARIES_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, releaseBoundaries: { findings: 0, privacySafe: false } })).toThrow("V137_PREARCHIVE_BOUNDARIES_INVALID")
    expect(() => validateV137PrearchiveProof({ ...proof, limitations: ["raw diagnostics"] })).toThrow("V137_PREARCHIVE_LIMITATIONS_INVALID")
  })
})
