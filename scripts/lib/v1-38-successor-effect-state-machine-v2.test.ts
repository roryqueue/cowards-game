import { describe, expect, it } from "vitest"
import {
  appendV138EffectRecordV2,
  authenticateV138EffectRecordsV2,
  completeV138EffectV2,
  recoverV138EffectDecisionV2,
  type V138EffectRecordV2,
} from "./v1-38-successor-effect-state-machine-v2.js"

const started = () =>
  appendV138EffectRecordV2([], {
    kind: "effect_started",
    effectKind: "calibration",
    effectIdentity: "calibration:v2:0",
    owner: "owner-a",
    startedAtMilliseconds: 1,
  })

describe("CR-02 strict effect-specific semantic replay", () => {
  it("accepts exact reproduction only for passed_exact 540 with cleanup", async () => {
    let now = 1
    const durable: V138EffectRecordV2[] = []
    const result = await completeV138EffectV2({
      effectKind: "reproduction",
      effectIdentity: "reproduction:v16",
      owner: "owner-a",
      deadlineMilliseconds: 2,
      monotonicMilliseconds: () => now++,
      runEffect: async () => ({ status: "passed_exact", acceptedCells: 540, completeCleanup: true }),
      appendDurableRecord: (record) => durable.push(record),
    })
    expect(result.disposition).toBe("reproduction_exact")
    expect(durable.map(({ event }) => event.kind)).toEqual(["effect_started", "effect_finished", "effect_decided"])
    expect(authenticateV138EffectRecordsV2(durable, 2)).toBe(true)
  })

  it("rejects a hash-valid forged reproduction decision after calibration", () => {
    const start = started()
    const finish = appendV138EffectRecordV2([start], {
      kind: "effect_finished",
      effectKind: "calibration",
      effectIdentity: "calibration:v2:0",
      owner: "owner-a",
      status: "admitted",
      acceptedCells: 0,
      completeCleanup: true,
      completedAtMilliseconds: 2,
    })
    const forged = appendV138EffectRecordV2([start, finish], {
      kind: "effect_decided",
      effectIdentity: "calibration:v2:0",
      owner: "owner-a",
      decidedAtMilliseconds: 2,
      disposition: "reproduction_exact",
    })
    expect(() => authenticateV138EffectRecordsV2([start, finish, forged], 100)).toThrow("V138_EFFECT_V2_DECISION_INVALID")
  })

  it.each([
    ["owner", "owner-b"],
    ["identity", "calibration:v2:1"],
    ["kind", "preflight"],
  ] as const)("rejects %s discontinuity", (_label, mutation) => {
    const start = started()
    const event = {
      kind: "effect_finished" as const,
      effectKind: mutation === "preflight" ? "preflight" as const : "calibration" as const,
      effectIdentity: mutation.startsWith("calibration:v2:1") ? mutation : "calibration:v2:0",
      owner: mutation === "owner-b" ? mutation : "owner-a",
      status: mutation === "preflight" ? "observed" as const : "admitted" as const,
      acceptedCells: 0 as const,
      completeCleanup: true as const,
      completedAtMilliseconds: 2,
    }
    const finish = appendV138EffectRecordV2([start], event)
    expect(() => authenticateV138EffectRecordsV2([start, finish], 100)).toThrow("V138_EFFECT_V2_CONTINUITY_INVALID")
  })

  it("rejects illegal reproduction statuses and every post-terminal record", () => {
    const start = appendV138EffectRecordV2([], {
      kind: "effect_started", effectKind: "reproduction", effectIdentity: "reproduction:v16", owner: "owner-a", startedAtMilliseconds: 1,
    })
    const illegal = appendV138EffectRecordV2([start], {
      kind: "effect_finished", effectKind: "reproduction", effectIdentity: "reproduction:v16", owner: "owner-a",
      status: "admitted", acceptedCells: 540, completeCleanup: true, completedAtMilliseconds: 2,
    } as never)
    expect(() => authenticateV138EffectRecordsV2([start, illegal], 100)).toThrow("V138_EFFECT_V2_FINISH_INVALID")

    const failure = appendV138EffectRecordV2([start], {
      kind: "effect_finished", effectKind: "reproduction", effectIdentity: "reproduction:v16", owner: "owner-a",
      status: "system_failure", acceptedCells: 0, completeCleanup: false, completedAtMilliseconds: 2,
    })
    const recovered = recoverV138EffectDecisionV2({ records: [start, failure], deadlineMilliseconds: 100, appendDurableRecord: () => undefined })
    const extra = appendV138EffectRecordV2(recovered.records, recovered.records[2]!.event)
    expect(() => authenticateV138EffectRecordsV2([...recovered.records, extra], 100)).toThrow("V138_EFFECT_V2_RECORD_COUNT_INVALID")
  })
})
