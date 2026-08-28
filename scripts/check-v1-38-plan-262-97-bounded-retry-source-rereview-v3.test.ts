import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  V138_PLAN_262_97_MUTATIONS,
  V138_PLAN_262_97_REPORT_PATH,
  V138_PLAN_262_97_REVIEW_PATH,
  V138_PLAN_262_97_SOURCE_PATHS,
  deriveV138Plan26297NoPublish,
  evaluateV138Plan26297Observations,
  inspectV138Plan26297BlockedHistory,
  inspectV138Plan26297CorrectedSource,
  runV138Plan26297DetachedExercise,
  snapshotV138Plan26297Destinations,
  validateV138Plan26297Review,
} from "./check-v1-38-plan-262-97-bounded-retry-source-rereview-v3.js"

const root = path.resolve(import.meta.dirname, "..")
const clone = <T>(value: T): T => structuredClone(value)

describe("Plan 262-97 fresh corrected-source re-review", () => {
  it("derives the exact Plan-96 committed source without trusting summary verdict prose", () => {
    const custody = inspectV138Plan26297CorrectedSource(root)
    expect(custody).toMatchObject({
      commit: "1c1f42b7fcd72d19ded89cca3ddd522090475b29",
      tree: "37d10e3dfee8501e59e686802ffe684167585c94",
      parent: "aae9f5dab231f83a0238cf5448f5e1e1d8ad4f28",
      summaryTrustedAsVerdict: false,
      noLaterRewrite: true,
    })
    expect(custody.blobs).toHaveLength(V138_PLAN_262_97_SOURCE_PATHS.length)
    expect(custody.blobs.every((entry) => entry.mode === "100644")).toBe(true)
    expect(custody.summaryCarrier).toMatchObject({
      path: expect.stringContaining("262-96-SUMMARY.md"),
      commit: "82ed28eee2377fd31680a20fdf0a6c6ebba9c1a8",
    })
  })

  it("authenticates Plan-90/91 as exact blocked history only", () => {
    const history = inspectV138Plan26297BlockedHistory(root)
    expect(history).toMatchObject({
      sourceCommit: "32f53bb743db799810dff820b8b7eb309b6a6629",
      sourceTree: "63328eb2f3454508e664c89017d2bd6cb0213695",
      sourceParent: "382d99326fec7a165c6416f4db800665aab02a1e",
      status: "blocked",
      findingCount: 11,
      findingRoot: "sha256:99ceec74a141e228b2e027c6f0b5d85ddfed8d917ad74e7a493e6d8257f8701a",
      reviewRoot: "sha256:08938c5eb520b041e2b74ac07b7906d14e52197e3788ec97ff6f29350bbdf80d",
      historicalResultReinterpreted: false,
      plan26292Eligible: false,
    })
    expect(history.findings).toHaveLength(11)
    expect(history.files).toHaveLength(4)
  })

  it("executes all five independent observations in an owner-only detached root", () => {
    const execution = runV138Plan26297DetachedExercise(root)
    expect(execution.observedTestCount).toBeGreaterThanOrEqual(87)
    expect(execution.observations.map((item) => item.id).sort()).toEqual([
      "crash_cleanup",
      "executed_checkout_bytes",
      "git_isolation",
      "installed_runtime_closure",
      "native_publication",
    ])
    expect(execution.observations.every((item) => item.executed && item.passed)).toBe(true)
    expect(execution).toMatchObject({
      detachedRootOwnerOnly: true,
      checkoutBytesMatchedBefore: true,
      checkoutBytesMatchedAfter: true,
      installedClosureMatchedBefore: true,
      installedClosureMatchedAfter: true,
      cleanupComplete: true,
      liveInvoked: false,
    })
  }, 180_000)

  it("maps every direct, adversarial, observation, history, privacy, policy, and authority mutation to findings", () => {
    const clean = deriveV138Plan26297NoPublish(root)
    expect(clean.findings).toEqual([])
    for (const [code, section, token, replacement] of V138_PLAN_262_97_MUTATIONS) {
      const source = Object.fromEntries(
        V138_PLAN_262_97_SOURCE_PATHS.map((repoPath) => [
          repoPath,
          readFileSync(path.join(root, repoPath), "utf8"),
        ]),
      )
      expect(source[section]!.split(token).length - 1, code).toBe(1)
      source[section] = source[section]!.replace(token, replacement)
      const observations = evaluateV138Plan26297Observations({
        ...clean.execution,
        observations: clean.execution.observations.map((item) => ({ ...item })),
      })
      const mutated = deriveV138Plan26297NoPublish(root, { source, observations })
      expect(mutated.findings.map((item) => item.code), code).toContain(code)
    }
  }, 180_000)

  it("turns every failed or incomplete observation into a deterministic critical finding", () => {
    const clean = deriveV138Plan26297NoPublish(root)
    for (const observation of clean.execution.observations) {
      for (const field of ["executed", "passed"] as const) {
        const execution = clone(clean.execution)
        const target = execution.observations.find((item) => item.id === observation.id)!
        target[field] = false
        const findings = evaluateV138Plan26297Observations(execution)
        expect(findings).toContainEqual(
          expect.objectContaining({
            code: `OBSERVATION_${observation.id.toUpperCase()}_${field === "executed" ? "INCOMPLETE" : "FAILED"}`,
            severity: "critical",
          }),
        )
      }
    }
  })

  it("derives status and Plan-92 eligibility only from literal zero findings", () => {
    const clean = deriveV138Plan26297NoPublish(root)
    expect(clean).toMatchObject({
      status: "zero_findings",
      findingCount: 0,
      sourceReviewPassed: true,
      authority: {
        plan26292Eligible: true,
        authorizesExecution: false,
        liveInvoked: false,
        freshCharged: 0,
        freshAccepted: 0,
      },
    })
    const observations = clone(clean.execution.observations)
    observations[0]!.passed = false
    const blocked = deriveV138Plan26297NoPublish(root, { observations })
    expect(blocked).toMatchObject({
      status: "blocked",
      findingCount: 1,
      sourceReviewPassed: false,
      authority: { plan26292Eligible: false },
    })
    expect(validateV138Plan26297Review(blocked, blocked)).toBe(true)
    for (const [key, value] of Object.entries(clean.authority)) {
      if (key === "plan26292Eligible") continue
      expect(value, key).toBe(typeof value === "number" ? 0 : false)
    }
  }, 180_000)

  it("rejects blocked-history, authority, root, and pair tampering", () => {
    const clean = deriveV138Plan26297NoPublish(root)
    const cases = [
      (value: any) => { value.blockedHistory.findingCount = 10 },
      (value: any) => { value.blockedHistory.historicalResultReinterpreted = true },
      (value: any) => { value.authority.liveInvoked = true },
      (value: any) => { value.authority.plan26292Eligible = false },
      (value: any) => { value.findingRoot = "sha256:" + "0".repeat(64) },
      (value: any) => { value.reviewRoot = "sha256:" + "0".repeat(64) },
    ]
    for (const mutate of cases) {
      const changed = clone(clean)
      mutate(changed)
      expect(() => validateV138Plan26297Review(changed, clean)).toThrow()
    }
  }, 180_000)

  it("derive-no-publish is deterministic and changes no review or downstream destination", () => {
    const before = snapshotV138Plan26297Destinations(root)
    const first = deriveV138Plan26297NoPublish(root)
    const second = deriveV138Plan26297NoPublish(root)
    expect(second.reviewRoot).toBe(first.reviewRoot)
    expect(second.findingRoot).toBe(first.findingRoot)
    expect(snapshotV138Plan26297Destinations(root)).toEqual(before)
    expect(before.find((item) => item.path === V138_PLAN_262_97_REVIEW_PATH)?.type).toBe("absent")
    expect(before.find((item) => item.path === V138_PLAN_262_97_REPORT_PATH)?.type).toBe("absent")
    expect(execFileSync("/usr/bin/git", ["diff", "--check"], { cwd: root, encoding: "utf8" })).toBe("")
  }, 180_000)
})
