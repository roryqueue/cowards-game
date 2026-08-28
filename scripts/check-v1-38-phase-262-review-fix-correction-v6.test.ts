import { execFileSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { checkV138Phase262ReviewFixCorrectionV6, deriveV138Phase262ReviewFixCorrectionV6, V138_PHASE_262_CORRECTION_V6_EVIDENCE, V138_PHASE_262_CORRECTION_V6_PATH, V138_PHASE_262_CORRECTION_V6_TRIGGER } from "./check-v1-38-phase-262-review-fix-correction-v6.js"

const roots: string[] = []
afterEach(() => { while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true }) })
const trigger = execFileSync("git", ["show", `${V138_PHASE_262_CORRECTION_V6_TRIGGER.commit}:${V138_PHASE_262_CORRECTION_V6_TRIGGER.path}`])
const options = { triggeringReviewBytes: trigger, historicalGitRoot: process.cwd() }
const baseline = deriveV138Phase262ReviewFixCorrectionV6(process.cwd(), options)
const entries = [baseline.priorCorrection, ...V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89, ...V138_PHASE_262_CORRECTION_V6_EVIDENCE.remediation, { path: V138_PHASE_262_CORRECTION_V6_PATH }]
const fixture = () => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-correction-v6-")); roots.push(root)
  for (const entry of entries) { const target = path.join(root, entry.path); mkdirSync(path.dirname(target), { recursive: true }); cpSync(entry.path, target) }
  for (const forbidden of baseline.forbiddenDestinations) mkdirSync(path.dirname(path.join(root, forbidden)), { recursive: true })
  return root
}
const mutateJson = (root: string, relative: string, update: (value: any) => void) => {
  const target = path.join(root, relative), value = JSON.parse(readFileSync(target, "utf8")); update(value); writeFileSync(target, `${JSON.stringify(value)}\n`)
}
const lifecyclePath = V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89[2]!.path

describe("CR-05 correction-v6 binds Plan-262-89 lifecycle evidence", () => {
  it("checks the additive non-authorizing correction", () => {
    expect(checkV138Phase262ReviewFixCorrectionV6(process.cwd())).toBe(true)
    expect(baseline).toMatchObject({ status: "integrity_non_pass", plan89: { phase262Status: "incomplete", verificationStatus: "gaps_found" }, empiricalOutcome: { freshAccepted: 0, requiredAccepted: 540 } })
    expect(Object.values(baseline.authority).every((value) => value === false)).toBe(true)
  })

  it.each(Object.keys(baseline.authority))("rejects lifecycle authority mutation %s", (key) => {
    const root = fixture(); mutateJson(root, lifecyclePath, (value) => { value.authority[key] = true })
    expect(() => deriveV138Phase262ReviewFixCorrectionV6(root, options)).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each([
    ["phase status", (value: any) => { value.lifecycle.phase262Status = "complete" }],
    ["verification status", (value: any) => { value.lifecycle.plan89VerificationStatus = "passed" }],
    ["lifecycle mutation", (value: any) => { value.lifecycle.lifecycleMutationPerformed = true }],
    ["fresh accepted", (value: any) => { value.retryOutcome.freshAccepted = 540 }],
    ["required accepted", (value: any) => { value.retryOutcome.requiredAccepted = 0 }],
    ["reproduction", (value: any) => { value.retryOutcome.reproductionV16Present = true }],
    ["status root", (value: any) => { value.statusRoot = `sha256:${"0".repeat(64)}` }],
  ])("rejects one-field lifecycle mutation: %s", (_label, update) => {
    const root = fixture(); mutateJson(root, lifecyclePath, update)
    expect(() => deriveV138Phase262ReviewFixCorrectionV6(root, options)).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each(V138_PHASE_262_CORRECTION_V6_EVIDENCE.plan89)("rejects Plan-89 evidence mutation $path", ({ path: relative }) => {
    const root = fixture(), target = path.join(root, relative)
    writeFileSync(target, Buffer.concat([readFileSync(target), Buffer.from("mutation\n")]))
    expect(() => deriveV138Phase262ReviewFixCorrectionV6(root, options)).toThrow("V138_SECURE_MANIFEST_MISMATCH")
  })

  it.each(baseline.forbiddenDestinations)("rejects forbidden destination %s", (relative) => {
    const root = fixture(), target = path.join(root, relative); writeFileSync(target, "{}\n")
    expect(() => deriveV138Phase262ReviewFixCorrectionV6(root, options)).toThrow("V138_SECURE_EXPECTED_ABSENT")
  })
})
