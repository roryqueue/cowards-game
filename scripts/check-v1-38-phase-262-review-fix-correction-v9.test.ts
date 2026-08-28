import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  checkV138Phase262ReviewFixCorrectionV9,
  deriveV138Phase262ReviewFixCorrectionV9,
  V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS,
  V138_PHASE_262_CORRECTION_V9_EVIDENCE,
  V138_PHASE_262_CORRECTION_V9_FORBIDDEN,
  V138_PHASE_262_CORRECTION_V9_PATH,
  V138_PHASE_262_CORRECTION_V9_TRIGGER,
} from "./check-v1-38-phase-262-review-fix-correction-v9.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const trigger = execFileSync("/usr/bin/git", ["show", `${V138_PHASE_262_CORRECTION_V9_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V9_TRIGGER.path}`], { env: { PATH: "/usr/bin:/bin", LANG: "C", LC_ALL: "C" } })
const options = { triggeringReviewBytes: trigger, historicalGitRoot: process.cwd() }
const baseline = deriveV138Phase262ReviewFixCorrectionV9(process.cwd(), options)
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v9-")); roots.push(root)
  for (const relative of [...V138_PHASE_262_CORRECTION_V9_EVIDENCE.map(({ path }) => path), V138_PHASE_262_CORRECTION_V9_PATH]) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  for (const { path: relative } of V138_PHASE_262_CORRECTION_V9_FORBIDDEN) mkdirSync(path.dirname(path.join(root, relative)), { recursive: true })
  return root
}

describe("additive correction-v9 preserves every frozen denial", () => {
  it("checks the canonical additive non-authorizing correction", () => {
    expect(checkV138Phase262ReviewFixCorrectionV9(process.cwd())).toBe(true)
    expect(baseline.authorityRelationship).toBe("additive_no_predecessor_supersession")
    expect(Object.keys(baseline.authority).sort()).toEqual([...V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS].sort())
    expect(Object.values(baseline.authority).every((value) => value === false)).toBe(true)
    expect(baseline.forbiddenDestinations).toEqual(V138_PHASE_262_CORRECTION_V9_FORBIDDEN)
    expect(baseline.scopedEvidenceSession).toMatchObject({ allReadsAndAbsencesOneBatch: true, rootIdentityMatchedAncestor: true })
    expect(baseline.scopedEvidenceSession.protocol).toBe(
      "retained-required-leaves-parent-generation-absence-revalidation-v2",
    )
    expect(baseline.scopedEvidenceSession.identityBinding).toBe(
      "required_leaf_exact_generation_and_parent_generation_bound",
    )
    expect(baseline.remediation).toMatchObject({
      findingsClosed: ["CR-01", "CR-02", "CR-03", "CR-04", "CR-05", "WR-01", "WR-02"],
      nativeExecutionAssurance:
        "single_operator_local_seal_v1_no_hostile_same_uid",
      pathnameLaunchReplacementResistanceClaimed: false,
      requiredLeafPostFstatAndExactBoundedRead: true,
      installedRuntimeClosureAuthenticated: true,
      gitConfigHooksAndReplacementsDisabled: true,
      retainedRootInodeFlock: true,
      coherentManifestBatch: true,
      noLiveExecutionPerformed: true,
    })
    expect(baseline.empiricalOutcome).toEqual({
      terminalDisposition: "exhausted",
      freshAccepted: 0,
      requiredAccepted: 540,
      reproductionV16Present: false,
      outcomeReinterpreted: false,
    })
  })

  it.each(V138_PHASE_262_CORRECTION_V9_AUTHORITY_KEYS)("rejects authority bit %s", (key) => {
    const root = fixture(), target = path.join(root, V138_PHASE_262_CORRECTION_V9_PATH)
    const value = JSON.parse(readFileSync(target, "utf8")); value.authority[key] = true
    writeFileSync(target, `${JSON.stringify(value)}\n`)
    expect(() => checkV138Phase262ReviewFixCorrectionV9(root, options)).toThrow("V138_CORRECTION_V9_MISMATCH")
  })

  it.each(V138_PHASE_262_CORRECTION_V9_FORBIDDEN)("rejects forbidden destination $denial", ({ path: relative }) => {
    const root = fixture(); writeFileSync(path.join(root, relative), "{}\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV9(root, options)).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })

  it.each(V138_PHASE_262_CORRECTION_V9_EVIDENCE)(
    "rejects reauthenticated evidence mutation $path",
    ({ path: relative }) => {
      const root = fixture()
      writeFileSync(path.join(root, relative), "mutated\n")
      expect(() =>
        deriveV138Phase262ReviewFixCorrectionV9(root, options),
      ).toThrow("V138_CORRECTION_V9_MANIFEST_MISMATCH")
    },
  )
})
