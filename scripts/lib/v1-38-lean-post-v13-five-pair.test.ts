import { expect, it } from "vitest"
import { labRoot } from "../../packages/strategy-lab/src/contracts.js"
import * as experiment from "../../packages/strategy-lab/src/league/lean-experiment.js"
import { createLeanFivePairStateV14, reserveLeanFivePairV14, closeLeanFivePairRouteV14, leanFivePairDocumentsV14 } from "./v1-38-lean-post-v13-five-pair.js"

const pin = (n: number) => labRoot("five-pair-host-contract", n)
const initial = () => createLeanFivePairStateV14({ historicalCarryRoot: "sha256:b80d8ad678f6d2ee81c999905d46256c482a8665e9c9f6aa10b9f125ef726169", historicalHoldRoot: pin(1), historicalCustodyRoot: pin(2), cumulativeCharged: 35, cumulativeElapsedMs: 148694388, allocatedDiskBytes: 22777856, observedMs: 1791496635485 })
const reserve = (state: ReturnType<typeof initial>, ordinal = 1) => reserveLeanFivePairV14(state, { ordinal, reservationRoot: pin(ordinal + 10), distinction: { kind: "reviewed_actionable_repair", evidenceRoot: pin(ordinal + 20), reviewRoot: pin(ordinal + 30) }, observedMs: 1791496635485 })
const close = (state: ReturnType<typeof initial>, route: "diagnostic" | "baseline", outcome: "refused_before_entry" | "entered_without_result" | "failed_result" | "accepted_complete" = "refused_before_entry") => closeLeanFivePairRouteV14(state, { ordinal: state.spentPairs, route, outcome, allocationRoot: outcome === "refused_before_entry" ? null : pin(45), entryHead: outcome === "refused_before_entry" ? null : "a".repeat(40), resultRoot: outcome.endsWith("result") || outcome === "accepted_complete" ? pin(46) : null, acceptedCheckRoot: outcome === "accepted_complete" ? pin(47) : null, finalRoot: outcome === "accepted_complete" ? pin(48) : null, verificationRoot: pin(49), holdRoot: pin(50), closureRoot: pin(51 + state.spentPairs), cumulativeCharged: 35, cumulativeElapsedMs: 148694388, allocatedDiskBytes: 22777856, observedMs: 1791496635485 })

it("pins five distinct routes and unchanged continuous budget without relabelling v13", () => {
  expect(experiment.LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION).toMatchObject({ charged: 35, priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 165600000, maximumDiagnostics: 5, maximumBaselines: 5, excludedIdleMs: 0 })
  const paths: string[] = []
  for (let ordinal = 1; ordinal <= 5; ordinal++) {
    const mode = `v14-${ordinal}` as experiment.LeanPostV13FivePairMode
    expect(experiment.isLeanPostV13FivePairMode(mode)).toBe(true)
    for (const route of ["diagnostic", "baseline"] as const) {
      const p = experiment.leanCorrectionRoutePaths(route, mode)
      paths.push(p.store, p.request, p.temp, p.allocation)
      expect(leanFivePairDocumentsV14(route, mode).review).toContain("POST-V13-FIVE-PAIR-SOURCE-REVIEW-v1.md")
    }
  }
  expect(new Set(paths).size).toBe(40)
  for (const mode of ["v14-0", "v14-6", "v14-01", "v13-2"]) expect(experiment.isLeanPostV13FivePairMode(mode)).toBe(false)
  expect(experiment.LEAN_PREPARATION_CONTINUATION_V13_EXTENSION.charged).toBe(34)
  const b = experiment.LEAN_POST_V13_FIVE_PAIR_V14_EXTENSION
  for (const change of [{ charged: 34 }, { elapsedMs: 165600001 }, { startedAtMs: b.startedAtMs + 1 }, { excludedIdleMs: 1 }]) expect(() => experiment.admitLeanRetryTimeboxExtension({ ...b, ...change })).toThrow()
})

it("spends exclusive reservations once and closes failed diagnostics locally through five pairs", () => {
  let state = initial()
  for (let ordinal = 1; ordinal <= 5; ordinal++) {
    expect(() => reserve(state, ordinal + 1)).toThrow()
    state = reserve(state, ordinal)
    expect(() => reserve(state, ordinal)).toThrow()
    expect(() => close(state, "baseline")).toThrow()
    state = close(state, "diagnostic")
    expect(state.ended).toBe(ordinal === 5)
    expect(state.cumulativeCharged).toBe(35)
  }
  expect(() => reserve(state, 6)).toThrow()
})

it("requires own accepted diagnostic FINAL and stops at first independently accepted complete baseline", () => {
  let state = reserve(initial())
  state = close(state, "diagnostic", "accepted_complete")
  expect(state.ended).toBe(false)
  expect(state.nextRoute).toBe("baseline")
  expect(() => reserve(state, 2)).toThrow()
  state = close(state, "baseline", "accepted_complete")
  expect(state.ended).toBe(true)
  expect(state.endReason).toBe("accepted_complete_baseline")
  expect(() => reserve(state, 2)).toThrow()
})

it("rejects copied roots, forged nullable custody, refunds and reserve exhaustion", () => {
  const state = reserve(initial())
  expect(() => closeLeanFivePairRouteV14(state, { ...({} as never), ordinal: 1 })).toThrow()
  expect(() => reserveLeanFivePairV14(initial(), { ordinal: 1, reservationRoot: pin(10), distinction: { kind: "identity_rename" as never, evidenceRoot: pin(20), reviewRoot: pin(30) }, observedMs: 1791496635485 })).toThrow()
  expect(() => reserveLeanFivePairV14({ ...initial(), cumulativeCharged: 34 }, { ordinal: 1, reservationRoot: pin(10), distinction: { kind: "reviewed_actionable_repair", evidenceRoot: pin(20), reviewRoot: pin(30) }, observedMs: 1791496635485 })).toThrow()
  expect(() => reserveLeanFivePairV14(initial(), { ordinal: 1, reservationRoot: pin(10), distinction: { kind: "reviewed_actionable_repair", evidenceRoot: pin(20), reviewRoot: pin(30) }, observedMs: 1791511141097 - 1860000 })).toThrow()
})
