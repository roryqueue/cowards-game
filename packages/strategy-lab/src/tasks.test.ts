import { describe, expect, it } from "vitest"
import { deriveLabTaskId, deriveLabStream } from "./identity.js"
import { enumerateLabTasks, assignLabTasks } from "./tasks.js"
const root = `sha256:${"a".repeat(64)}` as const
export const taskContext = { admittedRoot: root, algorithm: "hierarchical-planner-v1", candidateRoot: root, opponentRoot: root, inputRoot: root, budgetRoot: root }
describe("fixed task and stream identity", () => {
  it("preallocates12tasks/24attempts without alias scientific inflation", () => {
    const graph = enumerateLabTasks(taskContext)
    expect(graph.tasks).toHaveLength(12)
    expect(graph.attempts).toHaveLength(24)
    expect(graph.tasks.filter((t) => t.purpose === "scientific")).toHaveLength(8)
    for (const t of graph.tasks.filter((t) => t.purpose === "alias-compatibility")) expect(graph.tasks.some((s) => s.id === t.representativeId && s.purpose === "scientific")).toBe(true)
    expect(new Set(graph.attempts.map((a) => a.id)).size).toBe(24)
    expect(graph.attempts.slice(0,12).map((a) => a.taskId)).toEqual(graph.attempts.slice(12).map((a) => a.taskId))
  })
  it("binds every scientific field, refuses injected operational fields and preserves assignment identities", () => {
    const graph = enumerateLabTasks(taskContext)
    for (const field of ["admittedRoot", "candidateRoot", "opponentRoot", "inputRoot", "budgetRoot"] as const) expect(enumerateLabTasks({ ...taskContext, [field]: `sha256:${"b".repeat(64)}` }).root).not.toBe(graph.root)
    expect(enumerateLabTasks({ ...taskContext, algorithm: "algorithm-v2" }).root).not.toBe(graph.root)
    expect(() => enumerateLabTasks({ ...taskContext, worker: 2 })).toThrow()
    const first = graph.tasks[0]!
    for (const field of ["ordinal", "purpose", "split"] as const) expect(() => deriveLabTaskId({ ...first.identity, [field]: "invalid" })).toThrow()
    expect(deriveLabTaskId({ ...first.identity, ordinal: 1 })).not.toBe(first.id)
    for (const workers of [1,2] as const) for (const shardSize of [1,3] as const) for (const order of ["forward", "reverse", "permutation"] as const) {
      expect(assignLabTasks(graph, { workers, shardSize, order }).map((a) => a.attempt.id).sort()).toEqual(graph.attempts.map((a) => a.id).sort())
    }
    expect(() => assignLabTasks(graph, { workers: 3, shardSize: 1, order: "forward" })).toThrow()
  })
  it("freezes independent SHA256 counter vectors and validates counters/domains", () => {
    const id = enumerateLabTasks(taskContext).tasks[0]!.id
    const a = deriveLabStream(id, "assignment", 0)
    expect(id).toBe("sha256:83dec422de29217d559667e698fc871aa0ea2768c10c5b6527826cbe7456c34f")
    expect(a).toBe("9c6e520c230643a8fb4cf92e64e631535a1146f404775212c2fa36595bbc4ea8")
    expect(a).toMatch(/^[a-f0-9]{64}$/)
    expect(a).toBe(deriveLabStream(id, "assignment", 0))
    expect(a).not.toBe(deriveLabStream(id, "fallback", 0))
    expect(a).not.toBe(deriveLabStream(id, "assignment", 1))
    expect(() => deriveLabStream(id, "assignment", -1)).toThrow()
    expect(() => deriveLabStream(id, "assignment", Number.MAX_SAFE_INTEGER + 1)).toThrow()
    expect(() => deriveLabStream("not-a-root", "assignment", 0)).toThrow()
  })
})
