import { afterEach, describe, expect, it } from "vitest"
import { mkdtempSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { enumerateLabTasks, type LabLayout } from "./tasks.js"
import { runLabTasks } from "./runner.js"
import { reduceLabRecords } from "./reduce.js"
const r = `sha256:${"a".repeat(64)}` as const
const graph = enumerateLabTasks({ admittedRoot: r, algorithm: "hierarchical-planner-v1", candidateRoot: r, opponentRoot: r, inputRoot: r, budgetRoot: r })
const dirs: string[] = []
const directory = () => { const d = realpathSync(mkdtempSync(join(tmpdir(), "lab-runner-test-"))); dirs.push(d); return d }
afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }) })
describe("actual trusted-thread runner and typed canonical reduction", () => {
  it("matches all36worker/layout/order/lifecycle variants without repeating published work", async () => {
    let expected: string | undefined
    const operationalRoots = new Set<string>()
    for (const workers of [1,2] as const) for (const shardSize of [1,3] as const) for (const order of ["forward","reverse","permutation"] as const) for (const lifecycle of ["continuous","restart-after-publish","resume-complete"] as const) {
      const dir = directory(), layout: LabLayout = { workers, shardSize, order }
      const options = { directory: dir, graph, layout, machineRoot: r, job: { kind: "synthetic" as const } }
      if (lifecycle === "restart-after-publish") {
        const partial = await runLabTasks({ ...options, syntheticDispatchLimit: 6 })
        expect(partial.records).toHaveLength(6)
      }
      const result = await runLabTasks(options)
      expect(result.threadIds.length).toBe(workers)
      expect(result.threadIds.every((id) => id > 0)).toBe(true)
      expect(result.reduction?.status).toBe("complete")
      expect(result.reduction?.counts).toEqual({ allocated: 24, success: 24, playerViolation: 0, systemFailure: 0, unused: 0, scientificCells: 8 })
      const bytes = Buffer.from(result.reduction!.semanticBytes).toString("hex")
      expected ??= bytes
      expect(bytes).toBe(expected)
      operationalRoots.add(result.reduction!.operationalRoot)
      if (lifecycle === "resume-complete") {
        const resumed = await runLabTasks(options)
        expect(resumed.dispatched).toBe(0)
        expect(resumed.threadIds).toEqual([])
        expect(Buffer.from(resumed.reduction!.semanticBytes).toString("hex")).toBe(expected)
      }
    }
    expect(operationalRoots.size).toBeGreaterThan(1)
  }, 120000)
  it("preserves started lost-worker charges, stops without retry and excludes failures from scoring", async () => {
    const result = await runLabTasks({ directory: directory(), graph, layout: { workers: 1, shardSize: 1, order: "forward" }, machineRoot: r, job: { kind: "synthetic", loseOrdinal: 0 } })
    expect(result.reduction!.status).toBe("non_pass")
    expect(result.reduction!.counts.systemFailure).toBe(1)
    expect(result.reduction!.counts.unused).toBe(23)
    expect(result.reduction!.payoffs).toEqual([])
    expect(result.records.find((v) => v.attempt.ordinal === 0)?.attempt.classification).toBe("system_failure")
  }, 30000)
  it("rejects duplicate, gap, semantic tamper and wrong classified binding", async () => {
    const result = await runLabTasks({ directory: directory(), graph, layout: { workers: 1, shardSize: 3, order: "forward" }, machineRoot: r, job: { kind: "synthetic" } })
    expect(() => reduceLabRecords(graph, result.records.slice(1))).toThrow()
    expect(() => reduceLabRecords(graph, [...result.records, result.records[0]!])).toThrow()
    const tampered = structuredClone(result.records)
    tampered[0]!.semantic!.outcome = "bottom"
    expect(() => reduceLabRecords(graph, tampered)).toThrow()
  }, 30000)
})
