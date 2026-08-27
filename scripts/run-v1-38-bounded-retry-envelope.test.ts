import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { createHash } from "node:crypto"
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
import {
  V138_BOUNDED_RETRY_PATHS,
  V138_BOUNDED_RETRY_LIVE_FLAGS,
  executeV138BoundedRetryCli,
  publishV138RetryTerminalResult,
  runV138BoundedRetryController,
  type V138BoundedRetryControllerEffects,
} from "./run-v1-38-bounded-retry-envelope.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const temporaryRoots: string[] = []

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true })
  }
})

const envelope = () =>
  createV138InactiveRetryEnvelope({
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
) =>
  appendV138RetryJournalRecord(
    records,
    event,
    atMilliseconds,
    envelope().envelopeRoot,
  )

describe("retry-envelope:v1 finite state and cumulative journal", () => {
  it("freezes the exact identities and policy bounds", () => {
    expect(V138_BOUNDED_RETRY_IDENTITIES.routes).toEqual([
      "route:v1:0",
      "route:v1:1",
      "route:v1:2",
    ])
    expect(V138_BOUNDED_RETRY_IDENTITIES.preflights).toHaveLength(12)
    expect(V138_BOUNDED_RETRY_IDENTITIES.preflights.at(-1)).toBe(
      "preflight:v1:11",
    )
    expect(V138_BOUNDED_RETRY_IDENTITIES.calibrations).toHaveLength(24)
    expect(
      V138_BOUNDED_RETRY_IDENTITIES.calibrations.filter((id) =>
        id.startsWith("calibration:v1:2:"),
      ),
    ).toHaveLength(8)
    expect(V138_BOUNDED_RETRY_IDENTITIES.reproduction).toHaveLength(540)
    expect(V138_BOUNDED_RETRY_IDENTITIES.reproduction.at(-1)).toBe(
      "reproduction:v1:539",
    )
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
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
    })
    records = append(records, 1_001, {
      kind: "observe_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    records = append(records, 301_001, {
      kind: "reserve_preflight",
      identity: "preflight:v1:1",
      owner: "owner-a",
    })
    records = append(records, 301_002, {
      kind: "observe_preflight",
      identity: "preflight:v1:1",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_500,
    })
    records = append(records, 301_003, {
      kind: "reserve_route",
      identity: "route:v1:0",
      owner: "owner-a",
      preflightIdentity: "preflight:v1:1",
    })
    records = append(records, 301_004, {
      kind: "reserve_calibration",
      routeIdentity: "route:v1:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(0, 8),
    })

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
    records = append(records, 10, {
      kind: "reserve_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
    })
    expect(() =>
      append(records, 11, {
        kind: "reserve_preflight",
        identity: "preflight:v1:0",
        owner: "owner-b",
      }),
    ).toThrow("V138_RETRY_IDENTITY_ALREADY_CHARGED")
    records = append(records, 12, {
      kind: "observe_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    expect(() =>
      append(records, 12 + 5 * 60_000 - 1, {
        kind: "reserve_preflight",
        identity: "preflight:v1:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_REFUSAL_SPACING_REQUIRED")

    const mutated = records.map((record, index) =>
      index === 0 ? { ...record, owner: "mutated" } : record,
    )
    expect(() => deriveV138RetryState(envelope(), mutated)).toThrow(
      "V138_RETRY_JOURNAL_CHAIN_INVALID",
    )
    const changedEnvelope = createV138InactiveRetryEnvelope({
      sourceRoot: SHA_B,
      reviewRoot: SHA_B,
      sealRoot: SHA_A,
      protectedHistoryRoot: SHA_B,
      protectedHistoricalIdentities: ["historical:changed"],
    })
    expect(() => deriveV138RetryState(changedEnvelope, records)).toThrow(
      "V138_RETRY_JOURNAL_CHAIN_INVALID",
    )
    expect(() =>
      append(records, 12 + 4 * 60 * 60_000 + 1, {
        kind: "reserve_preflight",
        identity: "preflight:v1:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_EXPIRED")
  })

  it("records inclusive time-window expiry once as an immutable exhausted journal fact", () => {
    let records: readonly V138RetryJournalRecord[] = []
    records = append(records, 1_000, {
      kind: "reserve_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
    })
    records = append(records, 2_000, {
      kind: "observe_preflight",
      identity: "preflight:v1:0",
      owner: "owner-a",
      effectiveAvailableBasisPoints: 2_499,
    })
    const deadline =
      2_000 + V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds

    expect(() =>
      append(records, deadline - 1, {
        kind: "time_window_expired",
        owner: "owner-a",
        reason: "time_window_expired",
      }),
    ).toThrow("V138_RETRY_TIME_WINDOW_ACTIVE")
    expect(() =>
      append(records, deadline, {
        kind: "reserve_preflight",
        identity: "preflight:v1:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_EXPIRED")

    const exactBoundary = append(records, deadline, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    expect(exactBoundary.at(-1)).toMatchObject({
      kind: "time_window_expired",
      reason: "time_window_expired",
      previousRoot: records.at(-1)?.recordRoot,
    })
    expect(deriveV138RetryState(envelope(), exactBoundary)).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
      remainingPreflightObservations: 0,
      remainingRouteStarts: 0,
      nextPreflightIdentity: null,
      nextRouteIdentity: null,
    })
    expect(() =>
      append(exactBoundary, deadline + 1, {
        kind: "time_window_expired",
        owner: "owner-a",
        reason: "time_window_expired",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")
    expect(() =>
      append(exactBoundary, deadline + 1, {
        kind: "reserve_preflight",
        identity: "preflight:v1:1",
        owner: "owner-b",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")

    const postBoundary = append(records, deadline + 1, {
      kind: "time_window_expired",
      owner: "owner-a",
      reason: "time_window_expired",
    })
    expect(deriveV138RetryState(envelope(), postBoundary).stateRoot).toMatch(
      /^sha256:[0-9a-f]{64}$/u,
    )
  })

  it("closes on first exact success and makes every non-540 reproduction terminal", () => {
    const makeReproduction = (acceptedCells: number) => {
      let records: readonly V138RetryJournalRecord[] = []
      records = append(records, 0, {
        kind: "reserve_preflight",
        identity: "preflight:v1:0",
        owner: "owner-a",
      })
      records = append(records, 1, {
        kind: "observe_preflight",
        identity: "preflight:v1:0",
        owner: "owner-a",
        effectiveAvailableBasisPoints: 2_500,
      })
      records = append(records, 2, {
        kind: "reserve_route",
        identity: "route:v1:0",
        owner: "owner-a",
        preflightIdentity: "preflight:v1:0",
      })
      records = append(records, 3, {
        kind: "reserve_calibration",
        routeIdentity: "route:v1:0",
        owner: "owner-a",
        identities: V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(0, 8),
      })
      records = append(records, 4, {
        kind: "finish_calibration",
        routeIdentity: "route:v1:0",
        owner: "owner-a",
        status: "admitted",
        completeCleanup: true,
      })
      records = append(records, 5, {
        kind: "reserve_reproduction",
        routeIdentity: "route:v1:0",
        owner: "owner-a",
        identities: V138_BOUNDED_RETRY_IDENTITIES.reproduction,
      })
      records = append(records, 6, {
        kind: "finish_reproduction",
        routeIdentity: "route:v1:0",
        owner: "owner-a",
        acceptedCells,
        completeCleanup: true,
        status: acceptedCells === 540 ? "passed_exact" : "system_failure",
      })
      return records
    }

    expect(
      deriveV138RetryState(envelope(), makeReproduction(540)).disposition,
    ).toBe("succeeded")
    expect(
      deriveV138RetryState(envelope(), makeReproduction(539)),
    ).toMatchObject({
      disposition: "terminal_failure",
      acceptedCells: 0,
      reproductionIdentitiesCharged: 540,
    })
    expect(() =>
      append(makeReproduction(540), 7, {
        kind: "reserve_preflight",
        identity: "preflight:v1:1",
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_ENVELOPE_TERMINAL")
  })

  it("requires fifteen-minute backoff after process-valid calibration failure and exhausts at three starts", () => {
    let records: readonly V138RetryJournalRecord[] = []
    for (let route = 0; route < 3; route += 1) {
      const base = route * (15 * 60_000 + 10)
      records = append(records, base, {
        kind: "reserve_preflight",
        identity: `preflight:v1:${route}` as never,
        owner: "owner-a",
      })
      records = append(records, base + 1, {
        kind: "observe_preflight",
        identity: `preflight:v1:${route}` as never,
        owner: "owner-a",
        effectiveAvailableBasisPoints: 2_500,
      })
      records = append(records, base + 2, {
        kind: "reserve_route",
        identity: `route:v1:${route}` as never,
        owner: "owner-a",
        preflightIdentity: `preflight:v1:${route}` as never,
      })
      const calibration = V138_BOUNDED_RETRY_IDENTITIES.calibrations.slice(
        route * 8,
        route * 8 + 8,
      )
      records = append(records, base + 3, {
        kind: "reserve_calibration",
        routeIdentity: `route:v1:${route}` as never,
        owner: "owner-a",
        identities: calibration,
      })
      records = append(records, base + 4, {
        kind: "finish_calibration",
        routeIdentity: `route:v1:${route}` as never,
        owner: "owner-a",
        status: "system_failure",
        completeCleanup: true,
      })
      if (route === 0) {
        expect(() =>
          append(records, base + 4 + 15 * 60_000 - 1, {
            kind: "reserve_preflight",
            identity: "preflight:v1:1",
            owner: "owner-a",
          }),
        ).toThrow("V138_RETRY_CALIBRATION_BACKOFF_REQUIRED")
      }
    }
    expect(deriveV138RetryState(envelope(), records).disposition).toBe(
      "exhausted",
    )
  })

  it("never treats protected D-24R history as successor capacity", () => {
    const state = deriveV138RetryState(envelope(), [])
    expect(state.remainingRouteStarts).toBe(3)
    expect(state.remainingPreflightObservations).toBe(12)
    expect(state.protectedHistoricalIdentityCount).toBe(4)
    expect(() =>
      append([], 0, {
        kind: "reserve_preflight",
        identity: "preflight:v5:0" as never,
        owner: "owner-a",
      }),
    ).toThrow("V138_RETRY_IDENTITY_INVALID")
  })

  it("uses only temporary paths in synthetic fixtures", () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-"))
    temporaryRoots.push(root)
    expect(root.startsWith(tmpdir())).toBe(true)
  })
})

describe("bounded retry controller and CLI containment", () => {
  const makeEffects = (
    observations: number[],
    calibrations: Array<"admitted" | "system_failure">,
    reproductionResult = {
      status: "passed_exact" as const,
      acceptedCells: 540,
      completeCleanup: true,
    },
  ): V138BoundedRetryControllerEffects => {
    let now = 0
    return {
      monotonicMilliseconds: () => now,
      waitUntil: async (target) => {
        now = target
      },
      observePreflight: async () => ({
        available: true,
        effectiveAvailableBasisPoints: observations.shift() ?? 2_500,
      }),
      runCalibration: async () => ({
        status: calibrations.shift() ?? "system_failure",
        completeCleanup: true,
      }),
      runReproduction: async () => reproductionResult,
      appendDurableRecord: () => undefined,
    }
  }

  const activeAt = (firstObservationMilliseconds: number) => {
    let records: readonly V138RetryJournalRecord[] = []
    records = append(records, firstObservationMilliseconds - 1, {
      kind: "reserve_preflight",
      identity: "preflight:v1:0",
      owner: "synthetic-owner",
    })
    records = append(records, firstObservationMilliseconds, {
      kind: "observe_preflight",
      identity: "preflight:v1:0",
      owner: "synthetic-owner",
      effectiveAvailableBasisPoints: 2_499,
    })
    return records
  }

  it("durably terminalizes inclusive expiry before return or any later work", async () => {
    const firstObservation = 1_000
    const deadline =
      firstObservation + V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    const durableKinds: string[] = []
    let observations = 0
    let work = 0
    const result = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: activeAt(firstObservation),
      effects: {
        ...makeEffects([], []),
        monotonicMilliseconds: () => deadline,
        observePreflight: async () => {
          observations += 1
          return { available: true, effectiveAvailableBasisPoints: 2_500 }
        },
        runCalibration: async () => {
          work += 1
          return { status: "admitted", completeCleanup: true }
        },
        runReproduction: async () => {
          work += 1
          return {
            status: "passed_exact",
            acceptedCells: 540,
            completeCleanup: true,
          }
        },
        appendDurableRecord: (record) => {
          durableKinds.push(record.kind)
        },
      },
    })
    expect(durableKinds).toEqual(["time_window_expired"])
    expect(observations).toBe(0)
    expect(work).toBe(0)
    expect(result.records.at(-1)).toMatchObject({
      kind: "time_window_expired",
      reason: "time_window_expired",
      atMilliseconds: deadline,
    })
    expect(result.state).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
      remainingPreflightObservations: 0,
      remainingRouteStarts: 0,
      downstreamAuthority: false,
    })
  })

  it("recovers expiry append crashes without duplicate terminal or identity reuse", async () => {
    const firstObservation = 1_000
    const deadline =
      firstObservation + V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    const prior = activeAt(firstObservation)
    const beforeDurable = makeEffects([], [])
    await expect(
      runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: prior,
        effects: {
          ...beforeDurable,
          monotonicMilliseconds: () => deadline,
          appendDurableRecord: () => {
            throw new Error("CRASH_BEFORE_DURABLE")
          },
        },
      }),
    ).rejects.toThrow("CRASH_BEFORE_DURABLE")
    expect(deriveV138RetryState(envelope(), prior).disposition).toBe("active")

    let durable = prior
    await expect(
      runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: prior,
        effects: {
          ...makeEffects([], []),
          monotonicMilliseconds: () => deadline,
          appendDurableRecord: (record) => {
            durable = [...durable, record]
            throw new Error("CRASH_AFTER_DURABLE")
          },
        },
      }),
    ).rejects.toThrow("CRASH_AFTER_DURABLE")
    expect(deriveV138RetryState(envelope(), durable)).toMatchObject({
      disposition: "exhausted",
      terminalReason: "time_window_expired",
    })

    let restartAppends = 0
    const restarted = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: durable,
      effects: {
        ...makeEffects([], []),
        monotonicMilliseconds: () => deadline + 1,
        appendDurableRecord: () => {
          restartAppends += 1
        },
      },
    })
    expect(restartAppends).toBe(0)
    expect(
      restarted.records.filter(({ kind }) => kind === "time_window_expired"),
    ).toHaveLength(1)
    expect(restarted.state.nextPreflightIdentity).toBeNull()
    expect(restarted.state.nextRouteIdentity).toBeNull()
  })

  it("terminalizes when a required wait reaches the deadline and rejects a stale concurrent append", async () => {
    const firstObservation = 1_000
    const deadline =
      firstObservation + V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    let records = activeAt(firstObservation)
    records = append(records, deadline - 2, {
      kind: "reserve_preflight",
      identity: "preflight:v1:1",
      owner: "synthetic-owner",
    })
    records = append(records, deadline - 1, {
      kind: "observe_preflight",
      identity: "preflight:v1:1",
      owner: "synthetic-owner",
      effectiveAvailableBasisPoints: 0,
    })
    let now = deadline - 1
    let observations = 0
    const durable: V138RetryJournalRecord[] = [...records]
    const result = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records,
      effects: {
        ...makeEffects([], []),
        monotonicMilliseconds: () => now,
        waitUntil: async (target) => {
          now = target
        },
        observePreflight: async () => {
          observations += 1
          return { available: true, effectiveAvailableBasisPoints: 2_500 }
        },
        appendDurableRecord: (record) => {
          if (record.previousRoot !== durable.at(-1)?.recordRoot) {
            throw new Error("STALE_ROOT")
          }
          durable.push(record)
        },
      },
    })
    expect(observations).toBe(0)
    expect(result.state.terminalReason).toBe("time_window_expired")
    await expect(
      runV138BoundedRetryController({
        envelope: envelope(),
        owner: "other-owner",
        records,
        effects: {
          ...makeEffects([], []),
          monotonicMilliseconds: () => now,
          appendDurableRecord: (record) => {
            if (record.previousRoot !== durable.at(-1)?.recordRoot) {
              throw new Error("STALE_ROOT")
            }
          },
        },
      }),
    ).rejects.toThrow("STALE_ROOT")
    expect(
      durable.filter(({ kind }) => kind === "time_window_expired"),
    ).toHaveLength(1)
  })

  it("exclusive-writes one bounded immutable terminal result from exhausted journal state", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-expiry-terminal-"))
    temporaryRoots.push(root)
    const target = path.join(root, "terminal.json")
    const firstObservation = 1_000
    const deadline =
      firstObservation + V138_BOUNDED_RETRY_POLICY.envelopeLifetimeMilliseconds
    const result = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: activeAt(firstObservation),
      effects: {
        ...makeEffects([], []),
        monotonicMilliseconds: () => deadline,
        appendDurableRecord: () => undefined,
      },
    })
    publishV138RetryTerminalResult(target, result)
    const terminal = JSON.parse(readFileSync(target, "utf8"))
    expect(terminal).toMatchObject({
      schemaVersion: "v1.38-current-matrix-retry-terminal-v1",
      terminalReason: "time_window_expired",
      journalRoot: result.state.journalRoot,
      stateRoot: result.state.stateRoot,
      disposition: "exhausted",
      freshAccepted: 0,
      downstreamAuthority: "denied",
      productionAuthorized: false,
    })
    expect(terminal.counters).toEqual({
      preflightObservationsConsumed: 1,
      routeStartsConsumed: 0,
      calibrationIdentitiesCharged: 0,
      reproductionIdentitiesCharged: 0,
      acceptedCells: 0,
    })
    expect(() => publishV138RetryTerminalResult(target, result)).toThrow(
      "V138_RETRY_DESTINATION_PRESENT",
    )
  })

  it("publishes cleanup truth from authenticated calibration and reproduction terminals", async () => {
    const cases = [
      {
        effects: {
          ...makeEffects([2_500], []),
          runCalibration: async () => ({
            status: "system_failure" as const,
            completeCleanup: false,
          }),
        },
      },
      {
        effects: makeEffects([2_500], ["admitted"], {
          status: "system_failure" as const,
          acceptedCells: 0,
          completeCleanup: false,
        }),
      },
    ]

    for (const [index, testCase] of cases.entries()) {
      const root = mkdtempSync(path.join(tmpdir(), "v138-cleanup-terminal-"))
      temporaryRoots.push(root)
      const result = await runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: [],
        effects: testCase.effects,
      })
      const target = path.join(root, `terminal-${index}.json`)
      publishV138RetryTerminalResult(target, result)

      expect(result.state).toMatchObject({
        disposition: "terminal_failure",
        completeCleanup: false,
      })
      expect(JSON.parse(readFileSync(target, "utf8"))).toMatchObject({
        disposition: "terminal_failure",
        completeCleanup: false,
      })
    }
  })

  it("reserves before fake work, spaces refusal/failure retries, and closes on one exact reproduction", async () => {
    const launches: string[] = []
    const effects = makeEffects(
      [2_499, 2_500, 2_500],
      ["system_failure", "admitted"],
    )
    const wrapped: V138BoundedRetryControllerEffects = {
      ...effects,
      runCalibration: async (input) => {
        launches.push(`calibration:${input.routeIdentity}`)
        return effects.runCalibration(input)
      },
      runReproduction: async (input) => {
        launches.push(`reproduction:${input.identities.length}`)
        return effects.runReproduction(input)
      },
    }
    const result = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: wrapped,
    })
    expect(result.state).toMatchObject({
      disposition: "succeeded",
      preflightObservationsConsumed: 3,
      routeStartsConsumed: 2,
      calibrationIdentitiesCharged: 16,
      reproductionIdentitiesCharged: 540,
      acceptedCells: 540,
    })
    expect(launches).toEqual([
      "calibration:route:v1:0",
      "calibration:route:v1:1",
      "reproduction:540",
    ])
    const firstLaunchIndex = result.records.findIndex(
      ({ kind }) => kind === "finish_calibration",
    )
    expect(
      result.records
        .slice(0, firstLaunchIndex)
        .some(({ kind }) => kind === "reserve_calibration"),
    ).toBe(true)
  })

  it("charges crash-after-reservation and restart reconciliation without reuse", async () => {
    let durable: readonly V138RetryJournalRecord[] = []
    const crashing = makeEffects([2_500], ["admitted"])
    const firstEffects: V138BoundedRetryControllerEffects = {
      ...crashing,
      appendDurableRecord: (record) => {
        durable = [...durable, record]
        if (record.kind === "reserve_calibration") throw new Error("CRASH")
      },
    }
    await expect(
      runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: durable,
        effects: firstEffects,
      }),
    ).rejects.toThrow("CRASH")
    expect(
      durable.filter(({ kind }) => kind === "reserve_calibration"),
    ).toHaveLength(1)

    const restarted = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: durable,
      effects: makeEffects([], []),
    })
    expect(restarted.state).toMatchObject({
      disposition: "terminal_failure",
      calibrationIdentitiesCharged: 8,
      routeStartsConsumed: 1,
    })
    expect(
      restarted.records.filter(({ kind }) => kind === "reserve_calibration"),
    ).toHaveLength(1)
  })

  it.each([
    ["reserve_preflight", "exhausted", 1, 0],
    ["reserve_route", "terminal_failure", 1, 1],
    ["reserve_reproduction", "terminal_failure", 1, 1],
    ["finish_calibration", "succeeded", 1, 1],
    ["finish_reproduction", "succeeded", 1, 1],
  ] as const)(
    "reconciles a durable %s crash without identity reuse",
    async (crashKind, disposition, preflightZeroCount, routeCount) => {
      let durable: readonly V138RetryJournalRecord[] = []
      const first = makeEffects([2_500], ["admitted"])
      const crashing: V138BoundedRetryControllerEffects = {
        ...first,
        appendDurableRecord: (record) => {
          durable = [...durable, record]
          if (record.kind === crashKind) throw new Error(`CRASH:${crashKind}`)
        },
      }
      await expect(
        runV138BoundedRetryController({
          envelope: envelope(),
          owner: "synthetic-owner",
          records: [],
          effects: crashing,
        }),
      ).rejects.toThrow(`CRASH:${crashKind}`)
      const restartEffects = makeEffects(
        Array.from({ length: 12 }, () => 0),
        ["admitted"],
      )
      const restarted = await runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: durable,
        effects: restartEffects,
      })
      expect(restarted.state.disposition).toBe(disposition)
      expect(
        restarted.records.filter(
          ({ kind }) =>
            kind === "reserve_preflight" && kind === "reserve_preflight",
        ).length,
      ).toBeGreaterThanOrEqual(preflightZeroCount)
      expect(restarted.state.routeStartsConsumed).toBeGreaterThanOrEqual(
        routeCount,
      )
      expect(
        new Set(
          restarted.records
            .filter(({ kind }) => kind === "reserve_preflight")
            .map((record) =>
              record.kind === "reserve_preflight" ? record.identity : "",
            ),
        ).size,
      ).toBe(
        restarted.records.filter(({ kind }) => kind === "reserve_preflight")
          .length,
      )
    },
  )

  it("makes non-540, reproduction failure, and cleanup uncertainty terminal", async () => {
    for (const result of [
      {
        status: "system_failure" as const,
        acceptedCells: 539,
        completeCleanup: true,
      },
      {
        status: "system_failure" as const,
        acceptedCells: 0,
        completeCleanup: false,
      },
    ]) {
      const outcome = await runV138BoundedRetryController({
        envelope: envelope(),
        owner: "synthetic-owner",
        records: [],
        effects: makeEffects([2_500], ["admitted"], result),
      })
      expect(outcome.state.disposition).toBe("terminal_failure")
      expect(outcome.state.acceptedCells).toBe(0)
    }
  })

  it("strictly parses four production modes and never defaults into live work", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-cli-"))
    temporaryRoots.push(root)
    mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
    let liveInvocations = 0
    const derived = {
      seal: {
        schemaVersion: "v1.38-successor-source-seal-v11",
        sealRoot: SHA_A,
        productionAuthorized: false,
      },
      envelope: envelope(),
    }
    const injected = {
      repoRoot: root,
      deriveArtifacts: () => derived,
      runLive: async () => {
        liveInvocations += 1
        throw new Error("LIVE")
      },
    }
    await executeV138BoundedRetryCli(
      ["--derive-seal-envelope-no-publish"],
      injected,
    )
    expect(existsSync(path.join(root, V138_BOUNDED_RETRY_PATHS.seal))).toBe(
      false,
    )
    expect(existsSync(path.join(root, V138_BOUNDED_RETRY_PATHS.envelope))).toBe(
      false,
    )

    const pairFlags = [
      "--seal",
      V138_BOUNDED_RETRY_PATHS.seal,
      "--envelope",
      V138_BOUNDED_RETRY_PATHS.envelope,
    ]
    await executeV138BoundedRetryCli(
      ["--publish-sealed-inactive-envelope", ...pairFlags],
      injected,
    )
    expect(
      JSON.parse(
        readFileSync(
          path.join(root, V138_BOUNDED_RETRY_PATHS.envelope),
          "utf8",
        ),
      ).status,
    ).toBe("sealed_inactive")
    await executeV138BoundedRetryCli(
      ["--check-sealed-inactive-envelope", ...pairFlags],
      injected,
    )
    expect(liveInvocations).toBe(0)
    await expect(executeV138BoundedRetryCli([], injected)).rejects.toThrow(
      "V138_RETRY_ARGUMENTS_INVALID",
    )
    await expect(
      executeV138BoundedRetryCli(
        ["--derive-seal-envelope-no-publish", "--unknown"],
        injected,
      ),
    ).rejects.toThrow("V138_RETRY_ARGUMENTS_INVALID")
    expect(V138_BOUNDED_RETRY_PATHS).toMatchObject({
      sourceSummary: `${".planning/phases/262-foundation-admission-measurement-custody-and-containment-con"}/262-82-SUMMARY.md`,
      sourceReview:
        ".planning/artifacts/v1.38-plan-262-83-bounded-retry-source-rereview-v1.json",
      sourceReviewReport:
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-83-REVIEW.md",
      protectedSourceReview:
        ".planning/artifacts/v1.38-plan-262-77-bounded-retry-source-review-v1.json",
      protectedSourceReviewReport:
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-77-REVIEW.md",
      protectedSourceReviewSummary:
        ".planning/phases/262-foundation-admission-measurement-custody-and-containment-con/262-77-SUMMARY.md",
    })
  })

  it("retains the exact Plan-77 blocked pair and summary only as protected history", () => {
    const expected = new Map([
      [
        V138_BOUNDED_RETRY_PATHS.protectedSourceReview,
        "76d0c0eef92fca733078d56f786ab2bb2c462ba87c243951793d504078ed54f8",
      ],
      [
        V138_BOUNDED_RETRY_PATHS.protectedSourceReviewReport,
        "82de726955d2162dac32b227744efd66f851e7b736f9acaa421d3d514de234b2",
      ],
      [
        V138_BOUNDED_RETRY_PATHS.protectedSourceReviewSummary,
        "e84302fa5c820a4c3e904ebb24b8da3dd37211be643920b19b8ca84d537f36a7",
      ],
    ])
    for (const [repoPath, expectedHash] of expected) {
      expect(
        createHash("sha256").update(readFileSync(repoPath)).digest("hex"),
        repoPath,
      ).toBe(expectedHash)
    }
    const review = JSON.parse(
      readFileSync(V138_BOUNDED_RETRY_PATHS.protectedSourceReview, "utf8"),
    )
    expect(review).toMatchObject({
      status: "blocked",
      sourceReviewPassed: false,
      findingCount: 1,
      reviewRoot:
        "sha256:1d58e184fd6283e3d62c7de0c4dc51cad4f8e5447bb70b2fa48d13588aade8f3",
      findings: [{ code: "TIME_WINDOW_EXPIRY_NOT_TERMINALIZED" }],
    })
  })

  it("reaches the live production entry only through exact flags and injected fake effects", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-live-fake-"))
    temporaryRoots.push(root)
    let liveInvocations = 0
    let syntheticState = ""
    const flags = Object.entries(V138_BOUNDED_RETRY_LIVE_FLAGS).flatMap(
      ([key, value]) => [key, value],
    )
    await executeV138BoundedRetryCli(
      ["--run-bounded-live-envelope", ...flags],
      {
        repoRoot: root,
        runLive: async () => {
          liveInvocations += 1
          const result = await runV138BoundedRetryController({
            envelope: envelope(),
            owner: "synthetic-owner",
            records: [],
            effects: makeEffects([2_500], ["admitted"]),
          })
          syntheticState = result.state.disposition
        },
      },
    )
    expect(liveInvocations).toBe(1)
    expect(syntheticState).toBe("succeeded")
    expect(existsSync(path.join(root, V138_BOUNDED_RETRY_PATHS.journal))).toBe(
      false,
    )
    await expect(
      executeV138BoundedRetryCli(
        [
          "--run-bounded-live-envelope",
          ...flags,
          "--journal",
          V138_BOUNDED_RETRY_PATHS.journal,
        ],
        {
          repoRoot: root,
          runLive: async () => {
            liveInvocations += 1
          },
        },
      ),
    ).rejects.toThrow("V138_RETRY_ARGUMENTS_INVALID")
    expect(liveInvocations).toBe(1)
  })

  it("keeps journal and terminal projections free of private runtime fields", async () => {
    const result = await runV138BoundedRetryController({
      envelope: envelope(),
      owner: "synthetic-owner",
      records: [],
      effects: makeEffects([2_500], ["admitted"]),
    })
    const projection = JSON.stringify({
      records: result.records,
      state: result.state,
    })
    for (const forbidden of [
      "StrategyMemory",
      "SoldierMemory",
      "objectivePayload",
      "strategySource",
      "rawDiagnostic",
      "/Users/",
    ]) {
      expect(projection).not.toContain(forbidden)
    }
  })

  it("fails closed for unsafe or partially occupied publication destinations", async () => {
    const root = mkdtempSync(path.join(tmpdir(), "v138-retry-paths-"))
    temporaryRoots.push(root)
    mkdirSync(path.join(root, ".planning/artifacts"), { recursive: true })
    const seal = path.join(root, V138_BOUNDED_RETRY_PATHS.seal)
    symlinkSync("missing", seal)
    const pairFlags = [
      "--seal",
      V138_BOUNDED_RETRY_PATHS.seal,
      "--envelope",
      V138_BOUNDED_RETRY_PATHS.envelope,
    ]
    await expect(
      executeV138BoundedRetryCli(
        ["--publish-sealed-inactive-envelope", ...pairFlags],
        {
          repoRoot: root,
          deriveArtifacts: () => ({
            seal: {
              schemaVersion: "v1.38-successor-source-seal-v11",
              sealRoot: SHA_A,
              productionAuthorized: false,
            },
            envelope: envelope(),
          }),
          runLive: async () => {
            throw new Error("LIVE")
          },
        },
      ),
    ).rejects.toThrow("V138_RETRY_DESTINATION_UNSAFE")
  })

  it("source-only mode proves the real live handler and canonical destinations remain untouched", async () => {
    const before = Object.fromEntries(
      [
        V138_BOUNDED_RETRY_PATHS.journal,
        V138_BOUNDED_RETRY_PATHS.terminal,
        V138_BOUNDED_RETRY_PATHS.privateDir,
        V138_BOUNDED_RETRY_PATHS.reproduction,
      ].map((value) => [value, existsSync(value)]),
    )
    let liveInvocations = 0
    await executeV138BoundedRetryCli(["--check-source-only"], {
      repoRoot: process.cwd(),
      deriveArtifacts: () => {
        throw new Error()
      },
      runLive: async () => {
        liveInvocations += 1
        throw new Error("LIVE")
      },
    })
    const after = Object.fromEntries(
      Object.keys(before).map((value) => [value, existsSync(value)]),
    )
    expect(liveInvocations).toBe(0)
    expect(after).toEqual(before)
    expect(Object.values(after).every((present) => !present)).toBe(true)
  })
})
