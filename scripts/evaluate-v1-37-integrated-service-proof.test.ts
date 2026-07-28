import { describe, expect, it } from "vitest"
import {
  createV137IntegratedProofFixture,
  renderV137IntegratedProofJson,
  renderV137IntegratedProofMarkdown,
  validateV137IntegratedProof,
} from "./evaluate-v1-37-integrated-service-proof.js"

describe("v1.37 integrated service proof", () => {
  it("renders a stable public-safe proof from closed receipts", () => {
    const proof = createV137IntegratedProofFixture()
    expect(validateV137IntegratedProof(proof)).toEqual(proof)
    expect(proof.browser.liveBackendData).toBe(false)
    expect(proof.browser.topology).toBe("live-web-fixture-complement")
    expect(proof.lanes.every((lane) => lane.counted === false)).toBe(true)
    expect(renderV137IntegratedProofJson(proof)).not.toContain("generatedAt")
    expect(renderV137IntegratedProofJson(proof)).not.toContain("restrictedEvidenceRef")
    expect(renderV137IntegratedProofMarkdown(proof)).toContain("fixture-backed")
  })

  it("rejects stale, missing, duplicate, unsafe, or overclaimed aggregate rows", () => {
    const proof = createV137IntegratedProofFixture()
    expect(() => validateV137IntegratedProof({ ...proof, requirements: proof.requirements.slice(1) })).toThrow("V137_INTEGRATED_PROOF_REQUIREMENTS_INVALID")
    expect(() => validateV137IntegratedProof({ ...proof, lanes: [...proof.lanes, proof.lanes[0]!] })).toThrow("V137_INTEGRATED_PROOF_LANES_INVALID")
    expect(() => validateV137IntegratedProof({ ...proof, browser: { ...proof.browser, liveBackendData: true } })).toThrow("V137_INTEGRATED_PROOF_BROWSER_LIMITATION_INVALID")
    expect(() => validateV137IntegratedProof({ ...proof, browser: { ...proof.browser, topology: "live-web-backend" } })).toThrow("V137_INTEGRATED_PROOF_BROWSER_LIMITATION_INVALID")
    expect(() => validateV137IntegratedProof({ ...proof, inputRootSha256: "not-a-digest" })).toThrow("V137_INTEGRATED_PROOF_INPUT_ROOT_INVALID")
    expect(() => validateV137IntegratedProof({ ...proof, override: "pass" })).toThrow("V137_INTEGRATED_PROOF_SHAPE")
  })
})
