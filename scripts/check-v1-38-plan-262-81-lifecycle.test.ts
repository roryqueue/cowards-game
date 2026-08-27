import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import {
  evaluateV138Plan26281Verification,
  inspectV138Plan26281Topology,
} from "./check-v1-38-plan-262-81-lifecycle.js"

const repoRoot = process.cwd()
const archiveBytes = readFileSync(
  path.join(
    repoRoot,
    ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/archived/262-74-HISTORICAL.md",
  ),
)
const roots: string[] = []

const createTopology = (summaryCount: 63 | 64): string => {
  const root = mkdtempSync(path.join(tmpdir(), "v138-plan-262-81-"))
  roots.push(root)
  mkdirSync(path.join(root, "archived"), { recursive: true })
  writeFileSync(path.join(root, "archived/262-74-HISTORICAL.md"), archiveBytes)

  const planIds = [
    1, 2, ...Array.from({ length: 55 }, (_, index) => index + 8), 64, 65,
    66, 67, 68, 69, 70,
  ].slice(0, 64)
  const requiredSuccessors = [75, 76, 77, 78, 79, 80, 81, 82, 83]
  for (const id of requiredSuccessors) {
    planIds[planIds.length - requiredSuccessors.length + requiredSuccessors.indexOf(id)] = id
  }
  const uniqueIds = [...new Set(planIds)]
  while (uniqueIds.length < 64) {
    const candidate = uniqueIds.at(-1)! + 1
    if (candidate !== 74 && !requiredSuccessors.includes(candidate)) uniqueIds.push(candidate)
  }
  uniqueIds.sort((left, right) => left - right)

  for (const id of uniqueIds) {
    writeFileSync(path.join(root, `262-${String(id).padStart(2, "0")}-PLAN.md`), "plan\n")
  }
  const summarizedIds = uniqueIds.filter((id) => summaryCount === 64 || id !== 81)
  for (const id of summarizedIds) {
    writeFileSync(path.join(root, `262-${String(id).padStart(2, "0")}-SUMMARY.md`), "summary\n")
  }
  return root
}

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

describe("Plan 262-81 lifecycle topology", () => {
  it("accepts exact 63/64 before summary and exact 64/64 afterward", () => {
    const pre = inspectV138Plan26281Topology(createTopology(63), "pre_summary")
    const post = inspectV138Plan26281Topology(createTopology(64), "post_summary")

    expect(pre).toMatchObject({ activePlanCount: 64, summaryCount: 63, missingSummaryIds: [81] })
    expect(post).toMatchObject({ activePlanCount: 64, summaryCount: 64, missingSummaryIds: [] })
  })

  it("rejects Plan 74 as active or summarized even when counts coincide", () => {
    const root = createTopology(64)
    writeFileSync(path.join(root, "262-74-SUMMARY.md"), "forbidden\n")
    rmSync(path.join(root, "262-01-SUMMARY.md"))

    expect(() => inspectV138Plan26281Topology(root, "post_summary")).toThrow(
      "V138_PLAN_262_81_PLAN_74_SUMMARY_FORBIDDEN",
    )
  })
})

describe("Plan 262-81 branch verification", () => {
  const exactPassDisposition = {
    schemaVersion: "v1.38-plan-262-80-admission-disposition-v1",
    status: "pass",
    terminalDisposition: "complete",
    counters: { freshAccepted: 540, requiredAccepted: 540 },
    integrityPassed: true,
    privacySafe: true,
    assuranceClass: "single_operator_local_seal_v1",
    authority: {
      foundationActivationAuthorized: true,
      phase263Authorized: false,
      candidateSearchAuthorized: false,
      formationMaterializationAuthorized: false,
      holdoutOpeningAuthorized: false,
      publicAuthorized: false,
      productAuthorized: false,
      productionAuthorized: false,
      countedPlayAuthorized: false,
      gameplayChangeAuthorized: false,
    },
  }

  it("passes only the exact disposition, activation, requirement, privacy, and prohibition conjunction", () => {
    expect(
      evaluateV138Plan26281Verification({
        disposition: exactPassDisposition,
        activationRoot: { schemaVersion: "v1.38-foundation-activation-root-route9-v1" },
        requirementsComplete: true,
      }).status,
    ).toBe("passed")
  })

  it("keeps count coincidence non-compensating for missing pass evidence", () => {
    const result = evaluateV138Plan26281Verification({
      disposition: { ...exactPassDisposition, status: "non_pass" },
      activationRoot: null,
      requirementsComplete: true,
    })
    expect(result.status).toBe("gaps_found")
    expect(result.gaps).toContain("ADMIT-03")
  })
})
