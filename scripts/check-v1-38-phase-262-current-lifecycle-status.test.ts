import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  checkV138Phase262CurrentStatus,
  computeV138Phase262CurrentStatusRoot,
  deriveV138Phase262CurrentStatus,
} from "./check-v1-38-phase-262-current-lifecycle-status.js"

describe("Phase 262 current lifecycle status", () => {
  it("derives the exact 64/64 exhausted integrity-non-pass carrier", () => {
    expect(deriveV138Phase262CurrentStatus(process.cwd())).toMatchObject({
      lifecycle: {
        activePlans: 64,
        summaries: 64,
        completedPlans: [80, 81],
        plan81VerificationStatus: "gaps_found",
        lifecycleMutationPerformed: false,
        phase262Status: "incomplete",
      },
      retryOutcome: {
        terminalDisposition: "exhausted",
        routeStartsConsumed: 3,
        calibrationIdentitiesCharged: 24,
        freshAccepted: 0,
        requiredAccepted: 540,
        reproductionV15Present: false,
      },
      effectiveIntegrity: { status: "integrity_non_pass", passed: false },
      absent: { reproductionV15: true, route9Activation: true },
      authority: { phase263Through270Authorized: false },
    })
  })

  it("authenticates the current artifact and all four planning-document joins", () => {
    const artifact = checkV138Phase262CurrentStatus(process.cwd())
    expect(artifact.statusRoot).toBe(
      computeV138Phase262CurrentStatusRoot(artifact),
    )
  })

  it("preserves historical Plan-79 and correction bytes", () => {
    const artifact = checkV138Phase262CurrentStatus(process.cwd())
    const summary = readFileSync(
      path.join(
        process.cwd(),
        artifact.documentationCorrection.plan79SummaryPath,
      ),
      "utf8",
    )
    expect(summary).toContain(artifact.retryOutcome.canonicalJournalRoot)
    expect(artifact.documentationCorrection).toMatchObject({
      plan79SummaryPreserved: true,
      malformedCopiedCarrierRoot:
        "sha256:1cd8fd41f97a7c4938cb53719e31b49cc937fbfdcd26a51688e6894d09d8ad",
      canonicalJournalRoot:
        "sha256:1cd8fd41f97a7c4938cb53719e31b49cc937fbfdcdcd26a51688e6894d09d8ad",
    })
  })
})
