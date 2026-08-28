import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Phase262ReviewFixCorrectionV5, deriveV138Phase262ReviewFixCorrectionV5, diagnoseV138Phase262MutableAggregateReview, V138_PHASE_262_CORRECTION_V5_EVIDENCE, V138_PHASE_262_CORRECTION_V5_PATH, V138_PHASE_262_TRIGGER_REVIEW_V5 } from "./check-v1-38-phase-262-review-fix-correction-v5.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const triggerBytes = execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V5.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V5.path}`])
const baseline = deriveV138Phase262ReviewFixCorrectionV5(process.cwd())
const allFixed = [
  ...baseline.priorCorrections,
  ...Object.values(V138_PHASE_262_CORRECTION_V5_EVIDENCE).flat(),
  ...baseline.reauthenticated.v1Protected,
  ...baseline.reauthenticated.v1Remediation,
  { path: V138_PHASE_262_CORRECTION_V5_PATH },
]
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v5-")); roots.push(root)
  for (const { path: relative } of allFixed) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  for (const { path: forbidden } of baseline.forbiddenDestinations) mkdirSync(path.dirname(path.join(root, forbidden)), { recursive: true })
  return root
}
const mutate = (root: string, relative: string, transform: (bytes: Buffer) => Buffer = (bytes) => Buffer.concat([bytes, Buffer.from("mutation\n")])) => {
  const target = path.join(root, relative); writeFileSync(target, transform(readFileSync(target)))
}
const options = { triggeringReviewBytes: triggerBytes, historicalGitRoot: process.cwd() }

describe("CR-03 correction-v5 authenticates every evidence class", () => {
  it("checks the committed additive non-authorizing correction", () => {
    expect(checkV138Phase262ReviewFixCorrectionV5(process.cwd())).toBe(true)
    expect(baseline).toMatchObject({ status: "integrity_non_pass", empiricalOutcome: { freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false }, terminalRereview: null })
    expect(Object.values(baseline.authority).every((value) => value === false)).toBe(true)
  })

  it.each([
    ["terminal", V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[1]!.path],
    ["journal", V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[2]!.path],
    ["source review", V138_PHASE_262_CORRECTION_V5_EVIDENCE.review[0]!.path],
    ["review report", V138_PHASE_262_CORRECTION_V5_EVIDENCE.review[1]!.path],
    ["source lineage", V138_PHASE_262_CORRECTION_V5_EVIDENCE.source[0]!.path],
    ["current remediation", V138_PHASE_262_CORRECTION_V5_EVIDENCE.remediation[0]!.path],
    ["v1 protected", baseline.reauthenticated.v1Protected[0].path],
    ["v1 remediation", baseline.reauthenticated.v1Remediation[0].path],
    ["prior correction", baseline.priorCorrections[1].path],
  ])("rejects mutation of %s evidence", (_label, relative) => {
    const root = fixture(); mutate(root, relative)
    expect(() => deriveV138Phase262ReviewFixCorrectionV5(root, options)).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each(Object.keys(baseline.authority))("rejects disposition authority mutation %s", (authority) => {
    const root = fixture(), relative = V138_PHASE_262_CORRECTION_V5_EVIDENCE.admission[0]!.path
    mutate(root, relative, (bytes) => { const value = JSON.parse(bytes.toString("utf8")); value.authority[authority] = true; return Buffer.from(`${JSON.stringify(value)}\n`) })
    expect(() => deriveV138Phase262ReviewFixCorrectionV5(root, options)).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it("rejects changed immutable trigger bytes", () => {
    expect(() => deriveV138Phase262ReviewFixCorrectionV5(process.cwd(), { triggeringReviewBytes: Buffer.concat([triggerBytes, Buffer.from("mutation\n")]) })).toThrow("V138_CORRECTION_V5_TRIGGER_REVIEW_MISMATCH")
  })
})

describe("CR-04 mutable aggregate is diagnostic-only", () => {
  it("keeps the committed correction valid when the aggregate review is replaced", () => {
    const root = fixture(), aggregate = path.join(root, V138_PHASE_262_TRIGGER_REVIEW_V5.path)
    mkdirSync(path.dirname(aggregate), { recursive: true }); cpSync(V138_PHASE_262_TRIGGER_REVIEW_V5.path, aggregate)
    const before = diagnoseV138Phase262MutableAggregateReview(root)
    writeFileSync(aggregate, "# Independent terminal rereview\n\nstatus: clean\n")
    const after = diagnoseV138Phase262MutableAggregateReview(root)
    expect(after).toMatchObject({ authoritative: false, path: V138_PHASE_262_TRIGGER_REVIEW_V5.path })
    expect(after.observedSha256).not.toBe(before.observedSha256)
    expect(checkV138Phase262ReviewFixCorrectionV5(root, options)).toBe(true)
    const committed = JSON.parse(readFileSync(path.join(root, V138_PHASE_262_CORRECTION_V5_PATH), "utf8"))
    expect(committed).not.toHaveProperty("mutableAggregateReview")
    expect(committed.correctionRoot).toBe(baseline.correctionRoot)
  })
})
