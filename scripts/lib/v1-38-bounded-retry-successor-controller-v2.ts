import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  recoverV138AdmittedObservationWithoutRoute,
} from "./v1-38-bounded-retry-integrity-successor-v1.js"
import {
  appendV138RetryV2JournalRecord,
  createV138InactiveRetryV2Envelope,
  type V138RetryV2JournalRecord,
} from "./v1-38-bounded-retry-envelope-v2.js"
import { durablyPublishV138PairV2 } from "./v1-38-durable-pair-successor-v2.js"
import { applyV138RestartableLifecycleTransactionV2 } from "./v1-38-restartable-lifecycle-successor-v2.js"
import {
  completeV138EffectV2,
  recoverV138EffectDecisionV2,
  type V138EffectRecordV2,
} from "./v1-38-successor-effect-state-machine-v2.js"
import { sha256V138Secure, trustedRootV138 } from "./v1-38-secure-workspace-path-v2.js"

const fail = (code: string): never => { throw new TypeError(code) }
const SHA_A = `sha256:${"a".repeat(64)}` as const
const SHA_B = `sha256:${"b".repeat(64)}` as const

export const V138_SUCCESSOR_CONTROLLER_V2_CLI = fileURLToPath(import.meta.url)
export const V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS = Object.freeze([
  "recover_admitted_observation",
  "complete_semantic_effect",
  "recover_semantic_decision",
  "publish_canonical_pair",
  "apply_lifecycle_transaction",
] as const)

export type V138SuccessorControllerV2Operations = Readonly<{
  recoverAdmittedObservation: typeof recoverV138AdmittedObservationWithoutRoute
  completeSemanticEffect: typeof completeV138EffectV2
  recoverSemanticDecision: typeof recoverV138EffectDecisionV2
  publishCanonicalPair: typeof durablyPublishV138PairV2
  applyLifecycleTransaction: typeof applyV138RestartableLifecycleTransactionV2
}>

const REAL_OPERATIONS: V138SuccessorControllerV2Operations = Object.freeze({
  recoverAdmittedObservation: recoverV138AdmittedObservationWithoutRoute,
  completeSemanticEffect: completeV138EffectV2,
  recoverSemanticDecision: recoverV138EffectDecisionV2,
  publishCanonicalPair: durablyPublishV138PairV2,
  applyLifecycleTransaction: applyV138RestartableLifecycleTransactionV2,
})

export const runV138SyntheticSuccessorProtocolV2 = async (
  trustedRootInput: string,
  operations: V138SuccessorControllerV2Operations = REAL_OPERATIONS,
): Promise<Readonly<{ operations: typeof V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS; acceptedCells: 0; workspaceWrites: false }>> => {
  const trustedRoot = trustedRootV138(trustedRootInput)
  for (const relative of ["artifacts", "reviews", "planning"]) mkdirSync(path.join(trustedRoot, relative), { mode: 0o700 })

  const envelope = createV138InactiveRetryV2Envelope({
    sourceRoot: SHA_A,
    reviewRoot: SHA_B,
    sealRoot: SHA_A,
    protectedHistoryRoot: SHA_B,
    protectedHistoricalIdentities: ["retry-envelope:v1"],
  })
  let journal: readonly V138RetryV2JournalRecord[] = []
  journal = appendV138RetryV2JournalRecord(journal, { kind: "reserve_preflight", identity: "preflight:v2:0", owner: "synthetic-controller" }, 1, envelope.envelopeRoot)
  journal = appendV138RetryV2JournalRecord(journal, { kind: "observe_preflight", identity: "preflight:v2:0", owner: "synthetic-controller", effectiveAvailableBasisPoints: 2_500 }, 2, envelope.envelopeRoot)
  operations.recoverAdmittedObservation({ envelope, records: journal, owner: "synthetic-controller", nowMilliseconds: 3, appendDurableRecord: () => undefined })

  const effectRecords: V138EffectRecordV2[] = []
  let clock = 10
  const completed = await operations.completeSemanticEffect({
    effectKind: "preflight",
    effectIdentity: "synthetic:preflight",
    owner: "synthetic-controller",
    deadlineMilliseconds: 100,
    monotonicMilliseconds: () => clock++,
    runEffect: async () => ({ status: "observed", acceptedCells: 0, completeCleanup: true }),
    appendDurableRecord: (record) => effectRecords.push(record),
  })
  operations.recoverSemanticDecision({ records: completed.records, deadlineMilliseconds: 100, appendDurableRecord: () => undefined })

  operations.publishCanonicalPair({
    trustedRoot,
    transactionId: "synthetic-pair",
    intentPath: "synthetic-pair.intent",
    members: [
      { target: "artifacts/synthetic-review.json", bytes: '{"authority":false}\n' },
      { target: "reviews/synthetic-review.md", bytes: "# Synthetic non-authorizing review\n" },
    ],
  })
  const before = "status: before\n"
  writeFileSync(path.join(trustedRoot, "planning/status.md"), before)
  operations.applyLifecycleTransaction({
    trustedRoot,
    transactionId: "synthetic-lifecycle",
    intentPath: "synthetic-lifecycle.intent",
    steps: [{ id: "status", target: "planning/status.md", beforeSha256: sha256V138Secure(before), afterBytes: "status: synthetic-complete\n" }],
    lifecycle: { target: "synthetic-lifecycle.json", bytes: '{"authority":false,"status":"synthetic_complete"}\n' },
  })
  return Object.freeze({ operations: V138_SUCCESSOR_CONTROLLER_V2_OPERATIONS, acceptedCells: 0 as const, workspaceWrites: false as const })
}

export const checkV138SuccessorControllerV2Source = (sourcePath: string): true => {
  const source = readFileSync(sourcePath, "utf8")
  for (const symbol of ["recoverAdmittedObservation", "completeSemanticEffect", "recoverSemanticDecision", "publishCanonicalPair", "applyLifecycleTransaction"]) {
    if (!source.includes(`operations.${symbol}(`)) fail("V138_SUCCESSOR_CONTROLLER_ROUTE_INCOMPLETE")
  }
  for (const relative of ["v1-38-durable-pair-successor-v2.ts", "v1-38-restartable-lifecycle-successor-v2.ts"]) {
    const constituent = readFileSync(path.join(path.dirname(sourcePath), relative), "utf8")
    for (const forbidden of ["--synthetic-pair", "--pair-worker", "--synthetic-lifecycle", "--lifecycle-worker"]) {
      if (constituent.includes(forbidden)) fail("V138_SUCCESSOR_CONTROLLER_WRITE_CLI_FORBIDDEN")
    }
  }
  return true
}

if (process.argv[1] === V138_SUCCESSOR_CONTROLLER_V2_CLI) {
  if (process.argv[2] === "--source-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    process.stdout.write("successor_controller_source_only=true\n")
  } else if (process.argv[2] === "--synthetic-check") {
    checkV138SuccessorControllerV2Source(V138_SUCCESSOR_CONTROLLER_V2_CLI)
    const root = mkdtempSync(path.join(tmpdir(), "v138-successor-controller-v2-"))
    try {
      const result = await runV138SyntheticSuccessorProtocolV2(root)
      process.stdout.write(`${JSON.stringify({ sourceOnly: true, liveSideEffects: false, ...result })}\n`)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  } else {
    fail("V138_SUCCESSOR_CONTROLLER_SOURCE_ONLY")
  }
}
