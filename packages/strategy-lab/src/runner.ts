import { exactLabKeys, labRoot, LabSemanticRecordSchema, type LabRoot } from "./contracts.js"
import { assignLabTasks, validateLabTaskGraph, type LabAssignment, type LabLayout, type LabTaskGraph } from "./tasks.js"
import { publishLabShard, recordLabAttemptStart, resumeLabInventory, validateLabStoredRecord, type LabStoredRecord } from "./shards.js"
import { reduceLabRecords } from "./reduce.js"
import { runLabWorkerPool } from "./worker.js"

export interface RunLabTaskOptions {
  directory: string; graph: LabTaskGraph; layout: LabLayout; machineRoot: LabRoot;
  job: { kind: "synthetic"; loseOrdinal?: number } | { kind: "supervised"; execute: (assignment: LabAssignment) => Promise<LabStoredRecord> };
  syntheticDispatchLimit?: number;
}
export const runLabTasks = async (options: RunLabTaskOptions) => {
  const graph = validateLabTaskGraph(options.graph)
  const assigned = assignLabTasks(graph, options.layout)
  const initial = resumeLabInventory(options.directory, graph)
  if (options.syntheticDispatchLimit !== undefined && (options.job.kind !== "synthetic" || !Number.isSafeInteger(options.syntheticDispatchLimit) || options.syntheticDispatchLimit < 0 || options.syntheticDispatchLimit > 24 || options.syntheticDispatchLimit % options.layout.shardSize !== 0)) throw new TypeError("LAB_SYNTHETIC_DISPATCH_BOUND")
  let dispatch = assigned.filter((a) => initial.pendingAttemptIds.includes(a.attempt.id))
  if (initial.uncertainAttemptIds.length) dispatch = [] // no retries or refunded capacity
  if (options.syntheticDispatchLimit !== undefined) dispatch = dispatch.slice(0, options.syntheticDispatchLimit)
  const pendingShards = new Map<number, LabStoredRecord[]>()
  const expectedShardCounts = new Map<number, number>()
  for (const a of dispatch) expectedShardCounts.set(a.shard, (expectedShardCounts.get(a.shard) ?? 0) + 1)
  const assemble = (assignment: LabAssignment, value: unknown): LabStoredRecord => {
    if (options.job.kind === "supervised") {
      const record = validateLabStoredRecord(graph, value)
      if (record.trace === null) throw new TypeError("LAB_SUPERVISED_TRACE_REQUIRED")
      return record
    }
    if (!exactLabKeys(value, ["semantic", "invocationCount"]) || value.invocationCount !== 1) throw new TypeError("LAB_SYNTHETIC_RESULT")
    const semantic = LabSemanticRecordSchema.parse(value.semantic)
    return validateLabStoredRecord(graph, { attempt: { schemaVersion: "lab-attempt-v1", attemptRoot: assignment.attempt.id, taskRoot: assignment.task.id, ordinal: assignment.attempt.ordinal, invocationCount: 1, classification: "success", semanticRoot: labRoot("semantic-record", semantic) }, semantic,
      operational: { schemaVersion: "lab-operational-record-v1", attemptRoot: assignment.attempt.id, machineRoot: options.machineRoot, worker: assignment.worker, shard: assignment.shard, elapsedMs: 0, cleanup: "complete" }, trace: null })
  }
  const pool = await runLabWorkerPool(dispatch, options.layout.workers, options.job.kind, {
    onStart: (a) => recordLabAttemptStart(options.directory, graph, a.attempt.id),
    ...(options.job.kind === "supervised" ? { invoke: async (a: LabAssignment) => {
      if (options.job.kind !== "supervised") throw new TypeError("LAB_JOB_KIND")
      return assemble(a, await options.job.execute(a))
    } } : {}),
    onResult: (a, result) => {
      const record = assemble(a, result)
      if (record.attempt.attemptRoot !== a.attempt.id || record.operational.machineRoot !== options.machineRoot || record.operational.worker !== a.worker || record.operational.shard !== a.shard) throw new TypeError("LAB_JOB_BINDING")
      const batch = pendingShards.get(a.shard) ?? []
      batch.push(record); pendingShards.set(a.shard, batch)
      if (batch.length === expectedShardCounts.get(a.shard)) { publishLabShard(options.directory, graph, batch.sort((a,b) => a.attempt.ordinal - b.attempt.ordinal)); pendingShards.delete(a.shard) }
    },
  }, options.job.kind === "synthetic" ? options.job.loseOrdinal : undefined)
  let inventory = resumeLabInventory(options.directory, graph)
  if (pool.failed || inventory.uncertainAttemptIds.length) {
    // Complete publication survives interruption. All other launched work is
    // uncertain/system-failed, even if a transient worker reply was received.
    for (const a of assigned.filter((a) => !inventory.completedAttemptIds.includes(a.attempt.id))) {
      const started = inventory.uncertainAttemptIds.includes(a.attempt.id)
      // Unknown interrupted work is conservatively charged at the method-call
      // ceiling, never recorded as zero observed/used work or refunded capacity.
      const record = validateLabStoredRecord(graph, { attempt: { schemaVersion: "lab-attempt-v1", attemptRoot: a.attempt.id, taskRoot: a.task.id, ordinal: a.attempt.ordinal, invocationCount: started ? 24800 : 0, classification: started ? "system_failure" : "unused", reason: started ? "supervisor_failure" : "stopped" }, semantic: null,
        operational: { schemaVersion: "lab-operational-record-v1", attemptRoot: a.attempt.id, machineRoot: options.machineRoot, worker: a.worker, shard: a.shard, elapsedMs: 0, cleanup: started ? "incomplete" : "complete" }, trace: null })
      publishLabShard(options.directory, graph, [record])
    }
    inventory = resumeLabInventory(options.directory, graph)
  }
  const reduction = inventory.records.length === 24 ? reduceLabRecords(graph, inventory.records, { layout: options.layout, machineRoot: options.machineRoot, ledgerRoot: inventory.ledgerRoot, threadIds: pool.threadIds, mode: options.job.kind }) : null
  return { records: inventory.records, reduction, dispatched: dispatch.length, threadIds: pool.threadIds, ledgerRoot: inventory.ledgerRoot }
}
