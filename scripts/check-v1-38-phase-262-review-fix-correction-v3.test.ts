import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  deriveV138Phase262ReviewFixCorrectionV3,
  V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST,
  V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST,
  V138_PHASE_262_SUCCESSOR_V3_FILES,
  V138_PHASE_262_TRIGGER_REVIEW_V3,
} from "./check-v1-38-phase-262-review-fix-correction-v3.js"
import { V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2 } from "./check-v1-38-phase-262-review-fix-correction-v2.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const triggerBytes = execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V3.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V3.path}`])
const priorCorrections = [
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json",
  ".planning/artifacts/v1.38-phase-262-review-fix-correction-v2.json",
]
const allFixtureFiles = [...new Set([
  ...V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST.map(({ path: relative }) => relative),
  ...V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST.map(({ path: relative }) => relative),
  ...V138_PHASE_262_SUCCESSOR_V3_FILES.map(({ path: relative }) => relative),
  ...priorCorrections,
  V138_PHASE_262_TRIGGER_REVIEW_V3.path,
])]
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v3-")); roots.push(root)
  for (const relative of allFixtureFiles) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  return root
}
const mutate = (root: string, relative: string) => writeFileSync(path.join(root, relative), Buffer.concat([readFileSync(path.join(root, relative)), Buffer.from("mutation\n")]))

describe("CR-05 additive correction-v3 independent authentication", () => {
  it("preserves exhausted 0/540 and every authority denial", () => {
    const correction = deriveV138Phase262ReviewFixCorrectionV3(process.cwd())
    expect(correction).toMatchObject({ status: "integrity_non_pass", empiricalOutcome: { freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false }, remediation: { independentZeroFindingReviewRequired: true, liveAuthority: false } })
    expect(Object.values(correction.authority).every((value) => value === false)).toBe(true)
  })

  it.each([
    ["correction-v1 protected", V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST[0]!.path],
    ["correction-v1 remediation", V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST[0]!.path],
    ["correction-v2 successor lineage", V138_PHASE_262_SUCCESSOR_V3_FILES[0]!.path],
    ["prior correction-v1", priorCorrections[0]!],
    ["prior correction-v2", priorCorrections[1]!],
  ])("rejects absent %s entry", (_className, relative) => {
    const root = fixture(); rmSync(path.join(root, relative))
    expect(() => deriveV138Phase262ReviewFixCorrectionV3(root, { triggeringReviewBytes: triggerBytes })).toThrow()
  })

  it.each([
    ["correction-v1 protected", V138_PHASE_262_CORRECTION_V1_PROTECTED_MANIFEST[0]!.path],
    ["correction-v1 remediation", V138_PHASE_262_CORRECTION_V1_REMEDIATION_MANIFEST[0]!.path],
    ["correction-v2 successor lineage", V138_PHASE_262_SUCCESSOR_V3_FILES[0]!.path],
    ["prior correction-v1", priorCorrections[0]!],
    ["prior correction-v2", priorCorrections[1]!],
  ])("rejects mutated %s entry", (_className, relative) => {
    const root = fixture(); mutate(root, relative)
    expect(() => deriveV138Phase262ReviewFixCorrectionV3(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each(V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2)("rejects forbidden destination $denial", ({ path: forbidden }) => {
    const root = fixture(); const target = path.join(root, forbidden); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, "rogue\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV3(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })

  it("binds the immutable committed review while keeping the mutable aggregate separate", () => {
    const root = fixture(); writeFileSync(path.join(root, V138_PHASE_262_TRIGGER_REVIEW_V3.path), "replacement aggregate\n")
    const correction = deriveV138Phase262ReviewFixCorrectionV3(root, { triggeringReviewBytes: triggerBytes })
    expect(correction.triggeringReview).toMatchObject({ commit: V138_PHASE_262_TRIGGER_REVIEW_V3.commit, blob: V138_PHASE_262_TRIGGER_REVIEW_V3.blob, immutableCommitQualifiedBlob: true })
    expect(correction.mutableAggregateReview).toMatchObject({ authoritativeTrigger: false, replaceableByIndependentRereview: true })
  })

  it("rejects mutated immutable committed review bytes", () => {
    const root = fixture()
    expect(() => deriveV138Phase262ReviewFixCorrectionV3(root, { triggeringReviewBytes: Buffer.concat([triggerBytes, Buffer.from("mutation\n")]) })).toThrow("V138_CORRECTION_V3_TRIGGER_REVIEW_MISMATCH")
  })
})
