import { createHash } from "node:crypto"
import { Worker, isMainThread, parentPort, threadId, workerData } from "node:worker_threads"
import type { LabAssignment } from "./tasks.js"

interface WireTask { id: string; taskId: string; ordinal: number }
interface WorkerConfiguration { kind: "synthetic" | "supervised"; tasks: WireTask[]; loseOrdinal: number | null }
const wireRoot = (value: string) => `sha256:${createHash("sha256").update(value).digest("hex")}`
// Fixed repository-owned entry. No eval, dynamic source, package import, or
// serialized callbacks. Hostile source stays in the injected supervisor in
// the coordinator; this trusted thread only requests and transports effects.
if (!isMainThread) {
  const config = workerData as WorkerConfiguration
  if (!config || !["synthetic", "supervised"].includes(config.kind) || !Array.isArray(config.tasks) || config.tasks.length > 24) throw new TypeError("LAB_WORKER_CONFIG")
  let index = -1
  parentPort!.on("message", (message: { kind: string; payload?: unknown }) => {
    if (message.kind === "next") {
      index += 1
      const task = config.tasks[index]
      if (!task) { parentPort!.postMessage({ kind: "done", threadId }); parentPort!.close(); return }
      parentPort!.postMessage({ kind: "start", id: task.id, threadId })
    } else if (message.kind === "go") {
      const task = config.tasks[index]!
      if (task.ordinal === config.loseOrdinal) process.exit(2)
      if (config.kind === "supervised") { parentPort!.postMessage({ kind: "invoke", id: task.id, threadId }); return }
      const root = wireRoot(`lab-synthetic-only:${task.taskId}`)
      parentPort!.postMessage({ kind: "result", id: task.id, threadId, payload: {
        semantic: { schemaVersion: "lab-semantic-record-v1", taskRoot: task.taskId, classification: "success", outcome: "DRAW", finalStateRoot: root, transitionRoot: wireRoot(`transitions:${root}`), runtimeAccountingRoot: wireRoot(`accounting:${root}`) }, invocationCount: 1,
      } })
    } else if (message.kind === "external" && config.kind === "supervised") {
      const task = config.tasks[index]!
      if (Buffer.byteLength(JSON.stringify(message.payload)) > 262144) throw new TypeError("LAB_WORKER_RESULT_CAP")
      parentPort!.postMessage({ kind: "result", id: task.id, threadId, payload: message.payload })
    } else throw new TypeError("LAB_WORKER_MESSAGE")
  })
  parentPort!.postMessage({ kind: "ready", threadId })
}

export interface LabWorkerHooks {
  onStart(assignment: LabAssignment): void
  onResult(assignment: LabAssignment, result: unknown): Promise<void> | void
  invoke?(assignment: LabAssignment): Promise<unknown>
}
export const runLabWorkerPool = async (assignments: readonly LabAssignment[], workers: 1 | 2, kind: "synthetic" | "supervised", hooks: LabWorkerHooks, loseOrdinal?: number) => {
  const pool: Worker[] = [], threadIds: number[] = []
  let failed = false
  const runs = Array.from({ length: workers }, (_, slot) => {
    const owned = assignments.filter((a) => a.worker === slot)
    if (owned.length === 0) return Promise.resolve()
    return new Promise<void>((accept, reject) => {
      const worker = new Worker(new URL(import.meta.url), { execArgv: [], workerData: { kind, tasks: owned.map((a) => ({ id: a.attempt.id, taskId: a.task.id, ordinal: a.attempt.ordinal })), loseOrdinal: loseOrdinal ?? null } satisfies WorkerConfiguration })
      pool.push(worker)
      let cursor = 0, done = false, state: "ready" | "start" | "result" = "ready"
      const timeout = setTimeout(() => reject(new Error("LAB_WORKER_DEADLINE")), 120000)
      worker.on("error", reject)
      worker.on("exit", (code) => { clearTimeout(timeout); if (code === 0 && done) accept(); else reject(new Error("LAB_WORKER_LOST")) })
      worker.on("message", (message: { kind: string; id?: string; threadId: number; payload?: unknown }) => {
        void (async () => {
          if (failed) return
          if (!Number.isSafeInteger(message.threadId) || message.threadId <= 0) throw new TypeError("LAB_WORKER_ID")
          if (message.kind === "ready" && state === "ready") { threadIds.push(message.threadId); state = "start"; worker.postMessage({ kind: "next" }); return }
          if (message.kind === "done" && cursor === owned.length && state === "start") { done = true; return }
          const assignment = owned[cursor]
          if (!assignment || message.id !== assignment.attempt.id) throw new TypeError("LAB_WORKER_TASK_BINDING")
          if (message.kind === "start" && state === "start") { hooks.onStart(assignment); state = "result"; worker.postMessage({ kind: "go" }); return }
          if (message.kind === "invoke" && state === "result" && kind === "supervised" && hooks.invoke) { worker.postMessage({ kind: "external", payload: await hooks.invoke(assignment) }); return }
          if (message.kind === "result" && state === "result") { await hooks.onResult(assignment, message.payload); cursor += 1; state = "start"; worker.postMessage({ kind: "next" }); return }
          throw new TypeError("LAB_WORKER_PROTOCOL")
        })().catch(reject)
      })
    })
  })
  try { await Promise.all(runs) }
  catch { failed = true; await Promise.all(pool.map((w) => w.terminate())); await Promise.allSettled(runs) }
  return { failed, threadIds }
}
