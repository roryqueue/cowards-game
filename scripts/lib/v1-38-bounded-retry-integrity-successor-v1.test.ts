import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  V138_BOUNDED_RETRY_V2_IDENTITIES,
  V138_BOUNDED_RETRY_V2_POLICY,
  appendV138RetryV2JournalRecord,
  createV138InactiveRetryV2Envelope,
  deriveV138RetryV2State,
  type V138RetryV2JournalEvent,
  type V138RetryV2JournalRecord,
} from "./v1-38-bounded-retry-envelope-v2.js"
import {
  completeV138SuccessorEffect,
  recoverV138SuccessorEffectDecision,
  recoverV138AdmittedObservationWithoutRoute,
  V138_RETRY_INTEGRITY_SUCCESSOR_CLI,
  type V138SuccessorIntegrityRecord,
} from "./v1-38-bounded-retry-integrity-successor-v1.js"

const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const
const roots: string[] = []

afterEach(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true })
})

const envelope = () =>
  createV138InactiveRetryV2Envelope({
    sourceRoot: SHA_A,
    reviewRoot: SHA_B,
    sealRoot: SHA_A,
    protectedHistoryRoot: SHA_B,
    protectedHistoricalIdentities: ["retry-envelope:v1"],
  })

const append = (
  records: readonly V138RetryV2JournalRecord[],
  atMilliseconds: number,
  event: V138RetryV2JournalEvent,
) =>
  appendV138RetryV2JournalRecord(
    records,
    event,
    atMilliseconds,
    envelope().envelopeRoot,
  )

const admittedObservation = (): readonly V138RetryV2JournalRecord[] => {
  let records: readonly V138RetryV2JournalRecord[] = []
  records = append(records, 1, {
    kind: "reserve_preflight",
    identity: "preflight:v2:0",
    owner: "owner-a",
  })
  return append(records, 2, {
    kind: "observe_preflight",
    identity: "preflight:v2:0",
    owner: "owner-a",
    effectiveAvailableBasisPoints: 2_500,
  })
}

describe("CR-01 additive admitted-observation recovery", () => {
  it("durably reserves the same admitted preflight instead of stranding capacity", () => {
    const durable: V138RetryV2JournalRecord[] = []
    const recovered = recoverV138AdmittedObservationWithoutRoute({
      envelope: envelope(),
      records: admittedObservation(),
      owner: "owner-a",
      nowMilliseconds: 3,
      appendDurableRecord: (record) => durable.push(record),
    })

    expect(durable.map(({ kind }) => kind)).toEqual(["reserve_route"])
    expect(durable[0]).toMatchObject({
      identity: "route:v2:0",
      preflightIdentity: "preflight:v2:0",
    })
    expect(deriveV138RetryV2State(envelope(), recovered)).toMatchObject({
      disposition: "active",
      preflightObservationsConsumed: 1,
      routeStartsConsumed: 1,
      remainingRouteStarts: 2,
    })
  })

  it("terminalizes an admitted observation when recovery reaches the inclusive deadline", () => {
    const records = admittedObservation()
    const first = deriveV138RetryV2State(envelope(), records).firstObservationMilliseconds!
    const recovered = recoverV138AdmittedObservationWithoutRoute({
      envelope: envelope(),
      records,
      owner: "owner-a",
      nowMilliseconds:
        first + V138_BOUNDED_RETRY_V2_POLICY.envelopeLifetimeMilliseconds,
      appendDurableRecord: () => undefined,
    })
    expect(recovered.at(-1)).toMatchObject({ kind: "time_window_expired" })
    expect(deriveV138RetryV2State(envelope(), recovered).disposition).toBe(
      "exhausted",
    )
  })

  it("uses real SIGKILL probes after each semantically distinct durable event", () => {
    let records = admittedObservation()
    records = append(records, 3, {
      kind: "reserve_route",
      identity: "route:v2:0",
      owner: "owner-a",
      preflightIdentity: "preflight:v2:0",
    })
    records = append(records, 4, {
      kind: "reserve_calibration",
      routeIdentity: "route:v2:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.calibrations.slice(0, 8),
    })
    records = append(records, 5, {
      kind: "finish_calibration",
      routeIdentity: "route:v2:0",
      owner: "owner-a",
      status: "admitted",
      completeCleanup: true,
    })
    records = append(records, 6, {
      kind: "reserve_reproduction",
      routeIdentity: "route:v2:0",
      owner: "owner-a",
      identities: V138_BOUNDED_RETRY_V2_IDENTITIES.reproduction,
    })
    records = append(records, 7, {
      kind: "finish_reproduction",
      routeIdentity: "route:v2:0",
      owner: "owner-a",
      status: "passed_exact",
      acceptedCells: 540,
      completeCleanup: true,
      reproductionRoot: SHA_A,
    })

    for (const boundary of [
      "reserve_preflight",
      "observe_preflight",
      "reserve_route",
      "reserve_calibration",
      "finish_calibration",
      "reserve_reproduction",
      "finish_reproduction",
    ] as const) {
      const root = mkdtempSync(path.join(tmpdir(), "v138-successor-crash-"))
      roots.push(root)
      const journal = path.join(root, `${boundary}.jsonl`)
      const result = spawnSync(
        process.execPath,
        [
          "--import",
          "tsx",
          V138_RETRY_INTEGRITY_SUCCESSOR_CLI,
          "--crash-probe",
          journal,
          Buffer.from(JSON.stringify(records)).toString("base64"),
          boundary,
        ],
        { cwd: process.cwd(), encoding: "utf8" },
      )
      expect(result.signal).toBe("SIGKILL")
      const durable = readFileSync(journal, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line)) as V138RetryV2JournalRecord[]
      expect(durable.at(-1)?.kind).toBe(boundary)
      expect(() => deriveV138RetryV2State(envelope(), durable)).not.toThrow()
      if (boundary === "observe_preflight") {
        const recovered = recoverV138AdmittedObservationWithoutRoute({
          envelope: envelope(),
          records: durable,
          owner: "owner-a",
          nowMilliseconds: 8,
          appendDurableRecord: () => undefined,
        })
        expect(recovered.at(-1)?.kind).toBe("reserve_route")
      }
    }
  }, 60_000)
})

describe("CR-02 finish-before-deadline successor ordering", () => {
  const effect = async (
    kind: "preflight" | "calibration" | "reproduction",
    completion: number,
    result: {
      status: "observed" | "admitted" | "system_failure" | "passed_exact"
      acceptedCells?: number
      completeCleanup: boolean
    },
  ) => {
    let now = 1
    const durable: V138SuccessorIntegrityRecord[] = []
    const completed = await completeV138SuccessorEffect({
      records: [],
      effectKind: kind,
      effectIdentity: `${kind}:fixture`,
      owner: "owner-a",
      deadlineMilliseconds: 100,
      monotonicMilliseconds: () => now,
      runEffect: async () => {
        now = completion
        return result
      },
      appendDurableRecord: (record) => durable.push(record),
    })
    return { completed, durable }
  }

  it.each([
    ["preflight", 100],
    ["preflight", 101],
    ["calibration", 100],
    ["calibration", 101],
  ] as const)(
    "persists %s cleanup/result before applying deadline at %i",
    async (kind, completion) => {
      const { completed, durable } = await effect(kind, completion, {
        status: kind === "preflight" ? "observed" : "admitted",
        completeCleanup: true,
      })
      expect(durable.map(({ event }) => event.kind)).toEqual([
        "effect_started",
        "effect_finished",
        "deadline_expired",
      ])
      expect(durable[1]?.event).toMatchObject({
        kind: "effect_finished",
        completeCleanup: true,
        completedAtMilliseconds: completion,
      })
      expect(completed.disposition).toBe("deadline_expired")
    },
  )

  it.each([100, 101])(
    "gives a completed exact 540 reproduction explicit precedence at %i",
    async (completion) => {
      const { completed, durable } = await effect("reproduction", completion, {
        status: "passed_exact",
        acceptedCells: 540,
        completeCleanup: true,
      })
      expect(durable.map(({ event }) => event.kind)).toEqual([
        "effect_started",
        "effect_finished",
        "reproduction_exact_terminal",
      ])
      expect(completed.disposition).toBe("reproduction_exact")
      expect(completed.acceptedCells).toBe(540)
    },
  )

  it.each([
    ["calibration", "admitted", 0],
    ["reproduction", "passed_exact", 540],
  ] as const)(
    "recovers after a crash immediately after the durable %s finish",
    async (kind, status, acceptedCells) => {
      let now = 101
      const durable: V138SuccessorIntegrityRecord[] = []
      await expect(
        completeV138SuccessorEffect({
          records: [],
          effectKind: kind,
          effectIdentity: `${kind}:crash`,
          owner: "owner-a",
          deadlineMilliseconds: 100,
          monotonicMilliseconds: () => now,
          runEffect: async () => ({
            status,
            acceptedCells,
            completeCleanup: true,
          }),
          appendDurableRecord: (record) => {
            durable.push(record)
            if (record.event.kind === "effect_finished") {
              throw new Error("injected_crash_after_finish_fsync")
            }
          },
        }),
      ).rejects.toThrow("injected_crash_after_finish_fsync")
      expect(durable.at(-1)?.event.kind).toBe("effect_finished")

      const resumed: V138SuccessorIntegrityRecord[] = []
      const recovered = recoverV138SuccessorEffectDecision({
        records: durable,
        deadlineMilliseconds: 100,
        appendDurableRecord: (record) => resumed.push(record),
      })
      expect(resumed).toHaveLength(1)
      expect(recovered.disposition).toBe(
        kind === "reproduction" ? "reproduction_exact" : "deadline_expired",
      )
      expect(
        recoverV138SuccessorEffectDecision({
          records: recovered.records,
          deadlineMilliseconds: 100,
          appendDurableRecord: () => {
            throw new Error("must be idempotent")
          },
        }).records,
      ).toEqual(recovered.records)
      now += 1
    },
  )
})
