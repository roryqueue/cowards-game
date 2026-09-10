import { admitCanonicalJsonValue } from "@cowards/spec"
import { freezeLabValue, labRoot } from "./contracts.js"
import { validateLabTaskGraph, type LabTaskGraph } from "./tasks.js"
import { validateLabStoredRecord, type LabStoredRecord } from "./shards.js"

export const reduceLabRecords = (input: LabTaskGraph, values: readonly LabStoredRecord[], operationalContext: unknown = { kind: "offline-reduction" }) => {
  const graph = validateLabTaskGraph(input)
  if (values.length !== graph.attempts.length) throw new TypeError("LAB_REDUCTION_COVERAGE")
  const records = values.map((v) => validateLabStoredRecord(graph, v))
  if (new Set(records.map((r) => r.attempt.attemptRoot)).size !== graph.attempts.length) throw new TypeError("LAB_REDUCTION_DUPLICATE")
  records.sort((a,b) => a.attempt.ordinal - b.attempt.ordinal)
  const counts = { allocated: 24, success: 0, playerViolation: 0, systemFailure: 0, unused: 0, scientificCells: 8 }
  for (const r of records) {
    if (r.attempt.classification === "success") counts.success += 1
    else if (r.attempt.classification === "player_violation") counts.playerViolation += 1
    else if (r.attempt.classification === "system_failure") counts.systemFailure += 1
    else counts.unused += 1
  }
  let comparable = true
  const semantic = graph.tasks.map((task) => {
    const taskRecords = records.filter((r) => r.attempt.taskRoot === task.id)
    if (taskRecords.length !== 2 || labRoot("semantic-equality", taskRecords[0]!.semantic) !== labRoot("semantic-equality", taskRecords[1]!.semantic)) comparable = false
    // Explicit schema-owned semantic projection, not recursive metadata stripping.
    return { taskId: task.id, purpose: task.purpose, representativeId: task.representativeId, record: taskRecords[0]!.semantic }
  }).sort((a,b) => a.taskId < b.taskId ? -1 : a.taskId > b.taskId ? 1 : 0)
  // These schema-owned roots must represent geometry-equivalent gameplay and
  // runtime semantics, not request/attempt/arena-label or trace identities.
  const geometrySemantics = (record: LabStoredRecord["semantic"]) => record === null ? null : ({
    classification: record.classification, outcome: record.outcome,
    finalStateRoot: record.finalStateRoot, transitionRoot: record.transitionRoot,
    runtimeAccountingRoot: record.runtimeAccountingRoot,
  })
  for (const alias of semantic.filter((entry) => entry.purpose === "alias-compatibility")) {
    const representative = semantic.find((entry) => entry.taskId === alias.representativeId && entry.purpose === "scientific")
    if (!representative || labRoot("alias-semantics", geometrySemantics(alias.record)) !== labRoot("alias-semantics", geometrySemantics(representative.record))) comparable = false
  }
  const complete = counts.success === 24 && comparable && records.every((r) => r.operational.cleanup === "complete")
  const payoffs = complete ? semantic.filter((s) => s.purpose === "scientific").map((s) => ({ taskId: s.taskId, outcome: s.record!.outcome, bottomScore: s.record!.outcome === "DRAW" ? 0.5 : s.record!.outcome === "bottom" ? 1 : 0 })) : []
  const payload = { schemaVersion: "lab-semantic-reduction-v1", graphRoot: graph.root, semantic, payoffs, status: complete ? "complete" : "non_pass" }
  const encoded = admitCanonicalJsonValue(payload, { profile: "canonical-manifest" })
  if (!encoded.ok) throw new TypeError("LAB_REDUCTION_CANONICAL")
  return { ...freezeLabValue({ status: complete ? "complete" as const : "non_pass" as const, counts, payoffs, semanticRoot: labRoot("semantic-reduction", payload), operationalRoot: labRoot("operational-reduction", { records, operationalContext }) }), semanticBytes: encoded.canonicalBytes }
}
