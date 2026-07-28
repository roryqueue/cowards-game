import { describe, expect, it } from "vitest"
import {
  createV137MilestoneAuditFixture,
  renderV137MilestoneAuditJson,
  renderV137MilestoneAuditMarkdown,
  validateV137MilestoneAudit,
} from "./generate-v1-37-milestone-audit.js"

describe("v1.37 machine-derived release-ready milestone audit", () => {
  it("accepts only the complete 56-traced, 55-passed, one-ready-pending audit", () => {
    const audit = createV137MilestoneAuditFixture()

    expect(validateV137MilestoneAudit(audit)).toEqual(audit)
    expect(audit.status).toBe("release-ready")
    expect(audit.traceability).toEqual({ total: 56, passed: 55, gaps: 0, overrides: 0 })
    expect(audit.releaseOperation).toEqual({ requirement: "PROOF-08", status: "ready_pending", completion: false, expectedOperation: "archive-then-annotated-tag-then-independent-post-check" })
    expect(audit.semantic).toEqual({ transitionAuthorityCount: 1, semanticDeltaCount: 0, historicalCompatibility: "exact-rulings-only", gameplayChange: false })
    expect(audit.requirements).toHaveLength(56)
    expect(audit.requirements.filter((row) => row.status === "passed")).toHaveLength(55)
    expect(renderV137MilestoneAuditMarkdown(audit)).toContain("release-ready")
    expect(renderV137MilestoneAuditMarkdown(audit)).toContain("No gameplay change")
    expect(renderV137MilestoneAuditJson(audit)).not.toMatch(/archiveCommit|tagObject|tagId|\bv1\.37\^\{\}|postgresql:\/\/|PRIVATE_|rawEvidence/i)
  })

  it("rejects premature closure, manual prose, unsafe data, identity prediction, and audit drift", () => {
    const audit = createV137MilestoneAuditFixture()

    expect(() => validateV137MilestoneAudit({ ...audit, status: "passed" })).toThrow("V137_AUDIT_IDENTITY_INVALID")
    expect(() => validateV137MilestoneAudit({ ...audit, traceability: { ...audit.traceability, passed: 56 } })).toThrow("V137_AUDIT_TRACEABILITY_INVALID")
    expect(() => validateV137MilestoneAudit({ ...audit, releaseOperation: { ...audit.releaseOperation, status: "passed", completion: true } })).toThrow("V137_AUDIT_RELEASE_OPERATION_INVALID")
    expect(() => validateV137MilestoneAudit({ ...audit, semantic: { ...audit.semantic, transitionAuthorityCount: 2 } })).toThrow("V137_AUDIT_SEMANTIC_INVALID")
    expect(() => validateV137MilestoneAudit({ ...audit, archiveCommit: "deadbeef" })).toThrow("V137_AUDIT_SHAPE")
    expect(() => validateV137MilestoneAudit({ ...audit, privateDiagnostics: "postgresql://private" })).toThrow("V137_AUDIT_SHAPE")
    expect(() => validateV137MilestoneAudit({ ...audit, renderedMarkdown: "manual edit" })).toThrow("V137_AUDIT_SHAPE")
    expect(() => renderV137MilestoneAuditJson({ ...audit, requirements: [{ ...audit.requirements[0]!, evidence: "postgresql://private" }, ...audit.requirements.slice(1)] })).toThrow(/private marker/i)
  })
})
