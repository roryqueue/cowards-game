import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { deriveV138Phase262ReviewFixCorrectionV4, V138_PHASE_262_TRIGGER_REVIEW_V4 } from "./check-v1-38-phase-262-review-fix-correction-v4.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const baseline = deriveV138Phase262ReviewFixCorrectionV4(process.cwd())
const triggerBytes = execFileSync("git", ["show", `${V138_PHASE_262_TRIGGER_REVIEW_V4.commit}:${V138_PHASE_262_TRIGGER_REVIEW_V4.path}`])
const fixtureFiles = [...new Set([
  ...baseline.reauthenticated.v1Protected.map(({ path: relative }: { path: string }) => relative),
  ...baseline.reauthenticated.v1Remediation.map(({ path: relative }: { path: string }) => relative),
  ...baseline.remediation.sourceFiles.map(({ path: relative }: { path: string }) => relative),
  ...baseline.priorCorrections.map(({ path: relative }: { path: string }) => relative),
  V138_PHASE_262_TRIGGER_REVIEW_V4.path,
])]
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v4-")); roots.push(root)
  for (const relative of fixtureFiles) {
    const target = path.join(root, relative); mkdirSync(path.dirname(target), { recursive: true }); cpSync(relative, target)
  }
  return root
}
const mutateJson = (root: string, relative: string, mutate: (document: any) => void) => {
  const target = path.join(root, relative); const document = JSON.parse(readFileSync(target, "utf8")); mutate(document); writeFileSync(target, `${JSON.stringify(document)}\n`)
}

describe("CR-06 additive correction-v4 immutable manifest lineage", () => {
  it("deep-freezes every nested manifest while preserving exhausted 0/540 and all authority denials", () => {
    const correction = deriveV138Phase262ReviewFixCorrectionV4(process.cwd())
    expect(correction).toMatchObject({ status: "integrity_non_pass", empiricalOutcome: { freshAccepted: 0, requiredAccepted: 540, reproductionV16Present: false }, remediation: { independentZeroFindingReviewRequired: true, liveAuthority: false } })
    expect(Object.values(correction.authority).every((value) => value === false)).toBe(true)
    for (const manifest of Object.values(correction.reauthenticated).filter(Array.isArray) as any[][]) {
      expect(Object.isFrozen(manifest)).toBe(true)
      expect(manifest.every((entry) => Object.isFrozen(entry))).toBe(true)
    }
  })

  it.each([
    ["v1 protected nested digest", 0, "protectedFiles"],
    ["v1 remediation nested path", 0, "remediation.files"],
    ["v2 successor nested digest", 1, "remediation.sourceFiles"],
    ["v2 forbidden nested path", 1, "forbiddenDestinations"],
    ["v3 prior digest lineage", 2, "reauthenticated.correctionV2SuccessorLineage"],
    ["v3 forbidden nested path", 2, "forbiddenDestinations"],
  ])("rejects a mutated %s", (_label, correctionIndex, selector) => {
    const root = fixture(); const relative = baseline.priorCorrections[correctionIndex].path
    mutateJson(root, relative, (document) => {
      const selected = selector.split(".").reduce((value, key) => value[key], document)
      if ("sha256" in selected[0]) selected[0].sha256 = `sha256:${"0".repeat(64)}`
      else if ("priorSha256" in selected[0]) selected[0].priorSha256 = `sha256:${"0".repeat(64)}`
      else selected[0].path = `${selected[0].path}.mutated`
    })
    expect(() => deriveV138Phase262ReviewFixCorrectionV4(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it("rejects any current successor source mutation", () => {
    const root = fixture(); const relative = baseline.remediation.sourceFiles[0].path
    writeFileSync(path.join(root, relative), Buffer.concat([readFileSync(path.join(root, relative)), Buffer.from("mutation\n")]))
    expect(() => deriveV138Phase262ReviewFixCorrectionV4(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each(baseline.forbiddenDestinations)("rejects forbidden destination $denial", ({ path: forbidden }: { path: string }) => {
    const root = fixture(); const target = path.join(root, forbidden); mkdirSync(path.dirname(target), { recursive: true }); writeFileSync(target, "rogue\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV4(root, { triggeringReviewBytes: triggerBytes })).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })

  it("binds the immutable iteration-4 review blob independently of the mutable aggregate", () => {
    const root = fixture(); writeFileSync(path.join(root, V138_PHASE_262_TRIGGER_REVIEW_V4.path), "replacement aggregate\n")
    const correction = deriveV138Phase262ReviewFixCorrectionV4(root, { triggeringReviewBytes: triggerBytes })
    expect(correction.triggeringReview).toMatchObject({ commit: V138_PHASE_262_TRIGGER_REVIEW_V4.commit, blob: V138_PHASE_262_TRIGGER_REVIEW_V4.blob, immutableCommitQualifiedBlob: true })
    expect(correction.mutableAggregateReview).toMatchObject({ authoritativeTrigger: false, replaceableByIndependentRereview: true })
  })

  it("rejects mutated immutable iteration-4 review bytes", () => {
    const root = fixture()
    expect(() => deriveV138Phase262ReviewFixCorrectionV4(root, { triggeringReviewBytes: Buffer.concat([triggerBytes, Buffer.from("mutation\n")]) })).toThrow("V138_CORRECTION_V4_TRIGGER_REVIEW_MISMATCH")
  })
})
