import { describe, expect, it } from "vitest"

import {
  computeV138Plan26280ActivationRoot,
  computeV138Plan26280DispositionRoot,
  checkV138Plan26280Disposition,
  deriveV138Plan26280NoPublish,
  evaluateV138Plan26280Evidence,
  loadV138Plan26280Evidence,
  validateV138Plan26280Disposition,
} from "./check-v1-38-plan-262-80-bounded-retry-admission.js"

const repoRoot = process.cwd()
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

describe("Plan 262-80 independent bounded-retry admission", () => {
  it("derives the committed exhausted branch without mutating destinations", () => {
    const before = loadV138Plan26280Evidence(repoRoot).destinations
    const disposition = deriveV138Plan26280NoPublish(repoRoot)
    const after = loadV138Plan26280Evidence(repoRoot).destinations

    expect(disposition.status).toBe("non_pass")
    expect(disposition.effectiveIntegrityPassed).toBe(false)
    expect(disposition.auditCorrectionRoot).toMatch(/^sha256:[0-9a-f]{64}$/u)
    expect(disposition.terminalDisposition).toBe("exhausted")
    expect(disposition.counters).toEqual({
      preflightObservationsConsumed: 3,
      routeStartsConsumed: 3,
      calibrationIdentitiesCharged: 24,
      reproductionIdentitiesCharged: 0,
      freshAccepted: 0,
      requiredAccepted: 540,
    })
    expect(disposition.reasonCodes).toEqual([
      "ENVELOPE_EXHAUSTED",
      "FRESH_ACCEPTED_NOT_540",
      "REPRODUCTION_EVIDENCE_ABSENT",
    ])
    expect(Object.values(disposition.authority)).toEqual(
      expect.arrayContaining([false]),
    )
    expect(Object.values(disposition.authority).every((value) => !value)).toBe(
      true,
    )
    expect(disposition.dispositionRoot).toBe(
      computeV138Plan26280DispositionRoot(disposition),
    )
    expect(after).toEqual(before)
    expect(["absent", "regular"]).toContain(after.disposition)
    expect(after.activationRoot).toBe("absent")
  }, 15_000)

  it("authenticates the historical disposition through the additive correction", () => {
    const checked = checkV138Plan26280Disposition(
      repoRoot,
      ".planning/artifacts/v1.38-plan-262-80-admission-disposition-v1.json",
      ".planning/artifacts/v1.38-foundation-activation-root-route9.json",
    )
    expect(checked.disposition).toMatchObject({
      status: "non_pass",
      terminalDisposition: "exhausted",
      effectiveIntegrityPassed: false,
      counters: { freshAccepted: 0, requiredAccepted: 540 },
    })
    expect(checked.disposition.auditCorrectionRoot).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
  }, 15_000)

  it.each([
    [
      "count coincidence",
      (evidence: any) => {
        evidence.terminal.counters.acceptedCells = 540
        evidence.terminal.freshAccepted = 540
      },
      "TERMINAL_COUNTERS_INVALID",
    ],
    [
      "duplicate journal record",
      (evidence: any) => {
        evidence.journal.push(clone(evidence.journal.at(-1)))
      },
      "JOURNAL_CHAIN_INVALID",
    ],
    [
      "stale seal root",
      (evidence: any) => {
        evidence.seal.sealRoot = `sha256:${"0".repeat(64)}`
      },
      "SEAL_ROOT_INVALID",
    ],
    [
      "partial reproduction",
      (evidence: any) => {
        evidence.reproduction = {
          acceptedCells: 539,
          results: Array(539).fill({}),
        }
      },
      "REPRODUCTION_EVIDENCE_INVALID",
    ],
    [
      "over-bounds policy",
      (evidence: any) => {
        evidence.envelope.policy.maximumRouteStarts = 4
      },
      "FROZEN_POLICY_INVALID",
    ],
    [
      "missing durable expiry terminal",
      (evidence: any) => {
        evidence.terminal.terminalReason = "time_window_expired"
      },
      "EXPIRY_TERMINAL_INVALID",
    ],
    [
      "duplicated expiry terminal",
      (evidence: any) => {
        evidence.journal.push({
          ...clone(evidence.journal.at(-1)),
          kind: "time_window_expired",
          reason: "time_window_expired",
        })
      },
      "JOURNAL_CHAIN_INVALID",
    ],
    [
      "historical rewrite",
      (evidence: any) => {
        evidence.custody.plan74ArchiveSha256 = `sha256:${"f".repeat(64)}`
      },
      "PROTECTED_HISTORY_INVALID",
    ],
    [
      "unsafe projection",
      (evidence: any) => {
        evidence.unsafeProjectionKeys.push("strategySource")
      },
      "PRIVACY_PROJECTION_INVALID",
    ],
    [
      "authority escalation",
      (evidence: any) => {
        evidence.terminal.productionAuthorized = true
      },
      "AUTHORITY_ESCALATION",
    ],
  ])("rejects %s", (_name, mutate, reason) => {
    const evidence = clone(loadV138Plan26280Evidence(repoRoot))
    mutate(evidence)
    const result = evaluateV138Plan26280Evidence(evidence)
    expect(result.status).toBe("non_pass")
    expect(result.reasonCodes).toContain(reason)
    expect(Object.values(result.authority).every((value) => !value)).toBe(true)
  })

  it("requires every exact pass join before deriving an activation root", () => {
    const disposition = deriveV138Plan26280NoPublish(repoRoot)
    expect(() => computeV138Plan26280ActivationRoot(disposition)).toThrow(
      "V138_PLAN_262_80_ACTIVATION_NOT_AUTHORIZED",
    )
    expect(validateV138Plan26280Disposition(disposition, disposition)).toBe(
      true,
    )

    const forged = clone(disposition) as any
    forged.status = "pass"
    forged.counters.freshAccepted = 540
    forged.dispositionRoot = computeV138Plan26280DispositionRoot(forged)
    expect(() => computeV138Plan26280ActivationRoot(forged)).toThrow(
      "V138_PLAN_262_80_ACTIVATION_NOT_AUTHORIZED",
    )
  }, 15_000)
})
