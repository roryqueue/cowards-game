import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_IDENTITIES,
  V138_BOUNDED_RETRY_POLICY,
  appendV138RetryJournalRecord,
  createV138InactiveRetryEnvelope,
  deriveV138RetryState,
  type V138RetryJournalRecord,
} from "./lib/v1-38-bounded-retry-envelope.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const envelope = () => createV138InactiveRetryEnvelope({
  sourceRoot: SHA_A,
  reviewRoot: SHA_B,
  sealRoot: SHA_A,
  protectedHistoryRoot: SHA_B,
  protectedHistoricalIdentities: [
    "preflight:v5:0",
    "calibration:v9:attempt:0",
    "reproduction:v12:cell:0",
    "route:v8",
  ],
})

const append = (
  records: readonly V138RetryJournalRecord[],
  atMilliseconds: number,
  event: Parameters<typeof appendV138RetryJournalRecord>[1],
) => appendV138RetryJournalRecord(records, event, atMilliseconds)

describe("retry-envelope:v1 finite state and cumulative journal", () => {
  it("freezes the exact identities and policy bounds", () => {
    expect(V138_BOUNDED_RETRY_IDENTITIES.routes).toEqual([
      "route:v1:0", "route:v1:1", "route:v1:2",
    ])
    expect(V138_BOUNDED_RETRY_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_IDENTITIES.preflights.at(-1)).toBe("preflight:v1:11")
    expect(V138_BOUNDED_RETRY_IDENTITIES.calibrations).toHaveLength(24)
    expect(V138_BOUNDED_RETRY_IDENTITIES.calibrations.filter((id) => id.startsWith("calibration:v1:2:"))).toHaveLength(8)
    expect(V138_BOUNDED_RETRY_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_IDENTITIES.reproduction.at(-1)).toBe("reproduction:v1:539")
    expect(V138_BOUNDED_RETRY_POLICY).toMatchObject({
      maximumRouteStarts: 3,
      maximumPreflightObservations: 12,
      envelopeLifetimeMilliseconds: 4 * 60 * 60 * 1_000,
      refusalSpacingMilliseconds: 5 * 60 * 1_000,
      calibrationFailureBackoffMilliseconds: 15 * 60 * 1_000,
      calibrationAttemptsPerRoute: 8,
      calibrationShardCount: 4,
      samplingMilliseconds: 200,
      minimumEffectiveAvailableBasisPoints: 2_500,
      reproductionCellCount: 540,
      maximumReproductionRuns: 1,
    })
  })

  it("derives counters only from a previous-root-linked journal and charges reservations across crashes", () => {
    let records: readonly V138RetryJournalRecord[] = []
    records = append(records, 1_000, { kind: "reserve_preflight", identity: "preflight:v1:0", owner: "owner-a" })
    records = append(records, 1_001, { kind: "observe_preflight", identity: "preflight:v1:0", owner: "owner-a", effectiveAvailableBasisPoints: 2_499 })
    records = append(records, 301_001, { kind: "reserve_preflight", identity: "preflight:v1:1", owner: "owner-a" })
    records = append(records, 301_002, { kind: "observe_preflight", identity: "preflight:v1:1", owner: "owner-a", effectiveAvailableBasisPoints: 2_500 })
    records = append(records, 301_003, { kind: "reserve_route", identity: "route:v1:0", owner: "owner-a", preflightIdentity: "preflight:v1:1" })
    records = append(records, 301_004, { kind: "reserve_calibration", routeIdentity: "route:v1:0", owner: "owner-a", identities: V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(0, 8) })

    const state = deriveV138RetryState(envelope(), records)
    expect(state).toMatchObject({
      preflightObservationsConsumed: 2,
      routeStartsConsumed: 1,
      calibrationIdentitiesCharged: 8,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
      disposition: "active",
    })
    expect(state.nextPreflightIdentity).toBe("preflight:v1:2")
    expect(state.nextRouteIdentity).toBe("route:v1:1")
    expect(state.protectedHistoricalIdentityCount).toBe(4)
  })

  it("fails closed for duplicate or concurrent ownership, stale roots, mutation, over-bound time and early waits", () => {
    let records: readonly V138RetryJournalRecord[] = []
    records = append(records, 10, { kind: "reserve_preflight", identity: "preflight:v1:0", owner: "owner-a" })
    expect(() => append(records, 11, { kind: "reserve_preflight", identity: "preflight:v1:0", owner: "owner-b" })).toThrow("V138_RETRY_IDENTITY_ALREADY_CHARGED")
    records = append(records, 12, { kind: "observe_preflight", identity: "preflight:v1:0", owner: "owner-a", effectiveAvailableBasisPoints: 2_499 })
    expect(() => append(records, 12 + 5 * 60_000 - 1, { kind: "reserve_preflight", identity: "preflight:v1:1", owner: "owner-a" })).toThrow("V138_RETRY_REFUSAL_SPACING_REQUIRED")

    const mutated = records.map((record, index) => index === 0 ? { ...record, owner: "mutated" } : record)
    expect(() => deriveV138RetryState(envelope(), mutated)).toThrow("V138_RETRY_JOURNAL_CHAIN_INVALID")
    expect(() => append(records, 12 + 4 * 60 * 60_000 + 1, { kind: "reserve_preflight", identity: "preflight:v1:1", owner: "owner-a" })).toThrow("V138_RETRY_ENVELOPE_EXPIRED")
  })

  it("closes on first exact success and makes every non-540 reproduction terminal", () => {
    const makeReproduction = (acceptedCells: number) => {
      let records: readonly V138RetryJournalRecord[] = []
      records = append(records, 0, { kind: "reserve_preflight", identity: "preflight:v1:0", owner: "owner-a" })
      records = append(records, 1, { kind: "observe_preflight", identity: "preflight:v1:0", owner: "owner-a", effectiveAvailableBasisPoints: 2_500 })
      records = append(records, 2, { kind: "reserve_route", identity: "route:v1:0", owner: "owner-a", preflightIdentity: "preflight:v1:0" })
      records = append(records, 3, { kind: "reserve_calibration", routeIdentity: "route:v1:0", owner: "owner-a", identities: V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(0, 8) })
      records = append(records, 4, { kind: "finish_calibration", routeIdentity: "route:v1:0", owner: "owner-a", status: "admitted", completeCleanup: true })
      records = append(records, 5, { kind: "reserve_reproduction", routeIdentity: "route:v1:0", owner: "owner-a", identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction })
      records = append(records, 6, { kind: "finish_reproduction", routeIdentity: "route:v1:0", owner: "owner-a", acceptedCells, completeCleanup: true, status: acceptedCells === 540 ? "passed_exact" : "system_failure" })
      return records
    }

    expect(deriveV138RetryState(envelope(), makeReproduction(540)).disposition).toBe("succeeded")
    expect(deriveV138RetryState(envelope(), makeReproduction(539))).toMatchObject({
      disposition: "terminal_failure",
      acceptedCells: 0,
      reproductionIdentitiesCharged: 540,
    })
    expect(() => append(makeReproduction(540), 7, { kind: "reserve_preflight", identity: "preflight:v1:1", owner: "owner-a" })).toThrow("V138_RETRY_ENVELOPE_TERMINAL")
  })

  it("requires fifteen-minute backoff after process-valid calibration failure and exhausts at three starts", () => {
    let records: readonly V138RetryJournalRecord[] = []
    for (let route = 0; route < 3; route += 1) {
      const base = route * 15 * 60_000
      records = append(records, base, { kind: "reserve_preflight", identity: `preflight:v1:${route}` as never, owner: "owner-a" })
      records = append(records, base + 1, { kind: "observe_preflight", identity: `preflight:v1:${route}` as never, owner: "owner-a", effectiveAvailableBasisPoints: 2_500 })
      records = append(records, base + 2, { kind: "reserve_route", identity: `route:v1:${route}` as never, owner: "owner-a", preflightIdentity: `preflight:v1:${route}` as never })
      const calibration = V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(route * 8, route * 8 + 8)
      records = append(records, base + 3, { kind: "reserve_calibration", routeIdentity: `route:v1:${route}` as never, owner: "owner-a", identities: calibration })
      records = append(records, base + 4, { kind: "finish_calibration", routeIdentity: `route:v1:${route}` as never, owner: "owner-a", status: "system_failure", completeCleanup: true })
      if (route === 0) {
        expect(() => append(records, base + 4 + 15 * 60_000 - 1, { kind: "reserve_preflight", identity: "preflight:v1:1", owner: "owner-a" })).toThrow("V138_RETRY_CALIBRATION_BACKOFF_REQUIRED")
      }
    }
    expect(deriveV138RetryState(envelope(), records).disposition).toBe("exhausted")
  })

  it("never treats protected D-24R history as successor capacity", () => {
    const state = deriveV138RetryState(envelope(), [])
    expect(state.remainingRouteStarts).toBe(3)
    expect(state.remainingPreflightObservations).toBe(12)
    expect(state.protectedHistoricalIdentityCount).toBe(4)
    expect(() => append([], 0, { kind: "reserve_preflight", identity: "preflight:v5:0" as never, owner: "owner-a" })).toThrow("V138_RETRY_IDENTITY_INVALID")
  })

  it("uses only temporary paths in synthetic fixtures", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-"))
    temporaryRoots.push(root)
    expect(root.startsWith(tmpdir())).toBe(true)
  })
})
