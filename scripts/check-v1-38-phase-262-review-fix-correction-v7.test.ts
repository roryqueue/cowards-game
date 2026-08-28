import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  checkV138Phase262ReviewFixCorrectionV7,
  deriveV138Phase262ReviewFixCorrectionV7,
  V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS,
  V138_PHASE_262_CORRECTION_V7_EVIDENCE,
  V138_PHASE_262_CORRECTION_V7_FORBIDDEN,
  V138_PHASE_262_CORRECTION_V7_PATH,
  V138_PHASE_262_CORRECTION_V7_TRIGGER,
} from "./check-v1-38-phase-262-review-fix-correction-v7.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const trigger = execFileSync("git", ["show", `${V138_PHASE_262_CORRECTION_V7_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V7_TRIGGER.path}`])
const options = { triggeringReviewBytes: trigger, historicalGitRoot: process.cwd() }
const baseline = deriveV138Phase262ReviewFixCorrectionV7(process.cwd(), options)
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v7-")); roots.push(root)
  for (const relative of [...V138_PHASE_262_CORRECTION_V7_EVIDENCE.map(({ path }) => path), V138_PHASE_262_CORRECTION_V7_PATH]) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  for (const { path: relative } of V138_PHASE_262_CORRECTION_V7_FORBIDDEN) mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
  return root
}

describe("CR-03 additive correction-v7 preserves every frozen denial", () => {
  it("checks the canonical additive non-authorizing correction", () => {
    expect(checkV138Phase262ReviewFixCorrectionV7(process.cwd())).toBe(true)
    expect(baseline.authorityRelationship).toBe("additive_no_predecessor_supersession")
    expect(Object.keys(baseline.authority).sort()).toEqual([...V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS].sort())
    expect(Object.values(baseline.authority).every((value) => value === false)).toBe(true)
    expect(baseline.forbiddenDestinations).toEqual(V138_PHASE_262_CORRECTION_V7_FORBIDDEN)
    expect(baseline.scopedEvidenceSession).toMatchObject({ allReadsAndAbsencesOneBatch: true, rootIdentityMatchedAncestor: true })
  })

  it.each(V138_PHASE_262_CORRECTION_V7_AUTHORITY_KEYS)("rejects authority bit %s", (key) => {
    const root = fixture(), target = path.join(root, V138_PHASE_262_CORRECTION_V7_PATH)
    const value = JSON.parse(readFileSync(target, "utf8")); value.authority[key] = true
    writeFileSync(target, `${JSON.stringify(value)}\n`)
    expect(() => checkV138Phase262ReviewFixCorrectionV7(root, options)).toThrow("V138_CORRECTION_V7_MISMATCH")
  })

  it.each(V138_PHASE_262_CORRECTION_V7_FORBIDDEN)("rejects forbidden destination $denial", ({ path: relative }) => {
    const root = fixture(); writeFileSync(path.join(root, relative), "{}\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV7(root, options)).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })
})
