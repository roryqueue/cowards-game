import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { enumerateLabTasks } from "./tasks.js"
import { labRoot } from "./contracts.js"
import { publishLabShard, readLabShard, resumeLabInventory, publishLabTrace, recordLabAttemptStart, type LabStoredRecord } from "./shards.js"
const r = `sha256:${"a".repeat(64)}` as const
export const graphFixture = () => enumerateLabTasks({ admittedRoot: r, algorithm: "hierarchical-planner-v1", candidateRoot: r, opponentRoot: r, inputRoot: r, budgetRoot: r })
const dirs: string[] = []
const directory = () => { const d = mkdtempSync(join(tmpdir(), "lab-shard-test-")); dirs.push(d); return d }
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })
export const recordFixture = (ordinal = 0): LabStoredRecord => {
  const attempt = graphFixture().attempts[ordinal]!
  const semantic = { schemaVersion: "lab-semantic-record-v1" as const, taskRoot: attempt.taskId, classification: "success" as const, outcome: "DRAW" as const, finalStateRoot: r, transitionRoot: r, runtimeAccountingRoot: r }
  return { attempt: { schemaVersion: "lab-attempt-v1", attemptRoot: attempt.id, taskRoot: attempt.taskId, ordinal, invocationCount: 1, classification: "success", semanticRoot: labRoot("semantic-record", semantic) }, semantic,
    operational: { schemaVersion: "lab-operational-record-v1", attemptRoot: attempt.id, machineRoot: r, worker: 0, shard: 0, elapsedMs: 1, cleanup: "complete" }, trace: null }
}
describe("atomic private shards and no-refund resume", () => {
  it("publishes bounded trace-bound records and rejects duplicate publication without overwriting", () => {
    const d = directory(), graph = graphFixture()
    const trace = publishLabTrace(d, Buffer.from("synthetic-private-trace"))
    const record = { ...recordFixture(), trace }
    recordLabAttemptStart(d, graph, graph.attempts[0]!.id)
    const ref = publishLabShard(d, graph, [record])
    expect(readLabShard(d, graph, ref.id).records).toEqual([record])
    const before = readFileSync(join(d, ref.id))
    expect(() => publishLabShard(d, graph, [record])).toThrow()
    expect(readFileSync(join(d, ref.id))).toEqual(before)
    const resumed = resumeLabInventory(d, graph)
    expect(resumed.completedAttemptIds).toEqual([graph.attempts[0]!.id])
    expect(resumed.pendingAttemptIds).toHaveLength(23)
    writeFileSync(join(d, trace.id), "tampered")
    expect(() => readLabShard(d, graph, ref.id)).toThrow()
  })
  it.each(["before-write", "during-write", "before-publish", "after-publish", "before-ledger"] as const)("preserves charges at %s", (fault) => {
    const d = directory(), graph = graphFixture()
    recordLabAttemptStart(d, graph, graph.attempts[0]!.id)
    expect(() => publishLabShard(d, graph, [recordFixture()], { fault })).toThrow()
    const inventory = resumeLabInventory(d, graph)
    const published = fault === "after-publish" || fault === "before-ledger"
    expect(inventory.completedAttemptIds.length).toBe(published ? 1 : 0)
    expect(inventory.uncertainAttemptIds.length).toBe(published ? 0 : 1)
    expect(inventory.pendingAttemptIds).toHaveLength(23)
    expect(() => recordLabAttemptStart(d, graph, graph.attempts[0]!.id)).toThrow()
  })
  it("rejects truncated/tampered/stale/duplicate coverage and uncharged records", () => {
    const d = directory(), graph = graphFixture()
    expect(() => publishLabShard(d, graph, [recordFixture()])).toThrow()
    recordLabAttemptStart(d, graph, graph.attempts[0]!.id)
    expect(() => publishLabShard(d, graph, [recordFixture(),recordFixture()])).toThrow()
    const ref = publishLabShard(d, graph, [recordFixture()])
    const other = enumerateLabTasks({ ...graph.context, algorithm: "other" })
    expect(() => readLabShard(d, other, ref.id)).toThrow()
    writeFileSync(join(d, ref.id), "{truncated")
    expect(() => readLabShard(d, graph, ref.id)).toThrow()
  })
  it("rejects unsafe IDs, symlinks and directories outside generated private output", () => {
    const d = directory(), graph = graphFixture()
    expect(() => readLabShard(d, graph, "../secret")).toThrow()
    const target = directory()
    symlinkSync(target, join(d,"linked"))
    expect(() => publishLabTrace(join(d,"linked"), Buffer.from("trace"))).toThrow()
    symlinkSync("/dev/null", join(d, `shard-${"a".repeat(64)}.json`))
    expect(() => readLabShard(d, graph, `shard-${"a".repeat(64)}.json`)).toThrow()
  })
})
