import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_PHASE_262_REVIEW_FIX_CORRECTION_PATH,
  V138_PHASE_262_PROTECTED_FILES,
  V138_PHASE_262_REMEDIATION_FILES,
  checkV138Phase262ReviewFixCorrection,
  deriveV138Phase262ReviewFixCorrection,
} from "./check-v1-38-phase-262-review-fix-correction-v1.js"

const roots: string[] = []
afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const copyFixture = (): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-review-fix-fixture-"))
  roots.push(root)
  for (const relative of [
    ...V138_PHASE_262_PROTECTED_FILES.map(([file]) => file),
    ...V138_PHASE_262_REMEDIATION_FILES.map(([file]) => file),
    V138_PHASE_262_REVIEW_FIX_CORRECTION_PATH,
  ]) {
    const target = path.join(root, relative)
    mkdirSync(path.dirname(target), { recursive: true })
    cpSync(path.join(process.cwd(), relative), target)
  }
  return root
}

describe("Phase 262 additive review-fix correction", () => {
  it("supersedes the historical zero-finding review only for future authority", () => {
    const correction = deriveV138Phase262ReviewFixCorrection(process.cwd())
    expect(correction).toMatchObject({
      schemaVersion: "v1.38-phase-262-review-fix-correction-v1",
      status: "integrity_non_pass",
      oldSourceReview: {
        status: "zero_findings",
        futureAuthorityStatus: "superseded",
        historicalBytesMutated: false,
      },
      currentReview: { criticalFindings: 5, remediationStatus: "implemented" },
      empiricalOutcome: {
        terminalDisposition: "exhausted",
        freshAccepted: 0,
        requiredAccepted: 540,
        reproductionV16Present: false,
      },
    })
    expect(Object.values(correction.authority)).toEqual(
      expect.arrayContaining([false]),
    )
    expect(Object.values(correction.authority).every((value) => value === false)).toBe(
      true,
    )
  })

  it("authenticates the canonical correction and every protected historical byte", () => {
    expect(checkV138Phase262ReviewFixCorrection(process.cwd())).toBe(true)
  })

  it("fails closed when a hash-bound v2 source byte changes", () => {
    const root = copyFixture()
    const target = path.join(root, "scripts/run-v1-38-bounded-retry-envelope-v2.ts")
    writeFileSync(target, `${readFileSync(target, "utf8")}\n`)
    expect(() => deriveV138Phase262ReviewFixCorrection(root)).toThrow(
      "V138_REVIEW_FIX_PROTECTED_BYTES_MISMATCH",
    )
  }, 60_000)

  it("rejects a mutated correction artifact", () => {
    const root = copyFixture()
    const target = path.join(root, V138_PHASE_262_REVIEW_FIX_CORRECTION_PATH)
    const value = JSON.parse(readFileSync(target, "utf8"))
    value.authority.phase263PlanningAuthorized = true
    writeFileSync(target, `${JSON.stringify(value)}\n`)
    expect(() => checkV138Phase262ReviewFixCorrection(root)).toThrow(
      "V138_REVIEW_FIX_CORRECTION_MISMATCH",
    )
  }, 60_000)
})
