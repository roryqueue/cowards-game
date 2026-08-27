import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  deriveV138Phase262ReviewFixCorrectionV2,
  V138_PHASE_262_CORRECTION_V2_PATH,
  V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2,
  V138_PHASE_262_SUCCESSOR_V2_FILES,
  V138_PHASE_262_TRIGGER_REVIEW,
} from "./check-v1-38-phase-262-review-fix-correction-v2.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const triggerBytes = readFileSync(V138_PHASE_262_TRIGGER_REVIEW.path)
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v2-")); roots.push(root)
  for (const relative of [
    ".planning/artifacts/v1.38-phase-262-review-fix-correction-v1.json",
    ".planning/artifacts/v1.38-plan-262-88-admission-disposition-v2.json",
    V138_PHASE_262_TRIGGER_REVIEW.path,
    ...V138_PHASE_262_SUCCESSOR_V2_FILES.map(({ path: source }) => source),
  ]) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  return root
}

describe("CR-06 authenticated negative evidence and trigger review", () => {
  it("preserves exhausted 0/540 with every authority false", () => {
    const correction = deriveV138Phase262ReviewFixCorrectionV2(process.cwd())
    expect(correction).toMatchObject({ status: "integrity_non_pass", empiricalOutcome: { freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false } })
    expect(Object.values(correction.authority).every((value) => value === false)).toBe(true)
  })

  it.each(V138_PHASE_262_FORBIDDEN_DESTINATIONS_V2)("rejects forbidden destination $denial at $path", ({ path: forbidden }) => {
    const root = fixture(); const target = path.join(root, forbidden); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, "rogue\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV2(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })

  it("rejects mutation of the immutable commit-qualified triggering review", () => {
    const root = fixture()
    expect(() => deriveV138Phase262ReviewFixCorrectionV2(root, { triggeringReviewBytes: Buffer.from(`${triggerBytes.toString("utf8")}mutation\n`) })).toThrow("V138_CORRECTION_V2_TRIGGER_REVIEW_MISMATCH")
  })

  it("models the mutable aggregate separately without changing the immutable trigger", () => {
    const root = fixture(); writeFileSync(path.join(root, V138_PHASE_262_TRIGGER_REVIEW.path), "replacement aggregate\n")
    const correction = deriveV138Phase262ReviewFixCorrectionV2(root, { triggeringReviewBytes: triggerBytes })
    expect(correction.mutableAggregateReview).toMatchObject({ authoritativeTrigger: false, replaceableByIndependentRereview: true })
    expect(correction.triggeringReview.sha256).toBe(V138_PHASE_262_TRIGGER_REVIEW.sha256)
  })
})
