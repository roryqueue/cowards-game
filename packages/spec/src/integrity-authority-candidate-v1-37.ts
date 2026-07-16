import {
  hashCanonicalCompatibilityTuple,
  type CanonicalCompatibilityTuple,
} from "./integrity-authority.js"
import type { ChronicleEventType } from "./types.js"
import { COMPATIBILITY_VERSIONS } from "./versions.js"

/**
 * Inactive migration material for the Phase 257 atomic authority flip.
 *
 * Candidate symbols from this module are deliberately absent from
 * `src/index.ts`. Nothing here is a current tuple, schema, publication source,
 * receipt, or execution grant.
 */

export const INACTIVE_V1_37_KERNEL_CANDIDATE_SCHEMA_VERSION =
  "v1.37-kernel-integrity-candidate-v1" as const

export const INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION =
  "generate-v1-37-kernel-integrity-candidate-v1" as const

export const CURRENT_AUTHORITY_BYTE_BASELINE = Object.freeze({
  "packages/spec/src/versions.ts":
    "98ac9b63482c0a392694551db9a5de2443aa3119f62387316457f03d64341821",
  "packages/spec/src/integrity-authority.ts":
    "11ed27e5646f8f908e2d2b9558a144b28f362ebe395c7a66b58c308953ca83b9",
  "packages/spec/artifacts/v1.37-integrity-authority.json":
    "90bd23acff825349ed80b3df6b8e350ecd91153de44e17c952f5a302c7d3499d",
  "packages/spec/artifacts/v1.37-integrity-authority-hash-vectors.json":
    "cf8ac66719f06c7ebfb4db987524809495be6b6b5a2cbbb75fefbf1c06daafad",
} as const)

export const V1_37_KERNEL_CANDIDATE_COMPONENTS = Object.freeze({
  engine: "engine-kernel-v1.37-candidate-1",
  chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
  arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
} as const)

export const V1_37_KERNEL_CANDIDATE_EVENT_VOCABULARY = Object.freeze([
  "MATCH_STARTED",
  "ROUND_STARTED",
  "STRATEGY_EVALUATED",
  "ACTIVATION_STARTED",
  "ACTIVATION_SKIPPED",
  "ACTIVATION_ENDED",
  "CYCLE_STARTED",
  "CYCLE_ENDED",
  "AWARENESS_GRID_OBSERVED",
  "ACTION_EMITTED",
  "MOVE_ADVANCED",
  "MOVE_BLOCKED",
  "TURN_RESOLVED",
  "PUSH_RESOLVED",
  "PUSH_BLOCKED",
  "BACKSTAB_RESOLVED",
  "SOLDIER_STONED",
  "SOLDIER_FELL",
  "CONTRACTION_RESOLVED",
  "MATCH_ENDED",
  "RUNTIME_VIOLATION",
] as const satisfies readonly Exclude<ChronicleEventType, "PUSH_ATTEMPTED">[])

const candidateTuple: CanonicalCompatibilityTuple = {
  rules: COMPATIBILITY_VERSIONS.spec,
  engine: V1_37_KERNEL_CANDIDATE_COMPONENTS.engine,
  runtimeAbi: "strategy-runtime-abi-v1.14",
  chronicle: V1_37_KERNEL_CANDIDATE_COMPONENTS.chronicle,
  arenaCatalog: V1_37_KERNEL_CANDIDATE_COMPONENTS.arenaCatalog,
  setPolicy: "canonical-set-policy-v1.4",
}

const candidateTupleSha256 = hashCanonicalCompatibilityTuple(candidateTuple)

const candidateContract = {
  schemaVersion: INACTIVE_V1_37_KERNEL_CANDIDATE_SCHEMA_VERSION,
  generatorVersion: INACTIVE_V1_37_KERNEL_CANDIDATE_GENERATOR_VERSION,
  kind: "kernel-integrity-authority-candidate",
  status: "inactive-candidate",
  trustState: "untrusted-non-publishable",
  candidateTuple: { ...candidateTuple },
  candidateTupleSha256,
  candidateTupleId: `sha256:${candidateTupleSha256}`,
  authorityOwners: {
    rules: {
      packageName: "@cowards/spec",
      symbol: "COMPATIBILITY_VERSIONS",
    },
    engineKernel: { packageName: "@cowards/engine", symbol: "runMatch" },
    runtimeAbi: {
      packageName: "@cowards/spec",
      symbol: "STRATEGY_RUNTIME_ABI_VERSION",
    },
    chronicleRecorder: {
      packageName: "@cowards/replay",
      symbol: "recordChronicleFromExecution",
    },
    currentEventValidator: {
      packageName: "@cowards/replay",
      symbol: "validateCurrentChronicle",
    },
    semanticArenaValidator: {
      packageName: "@cowards/spec",
      symbol: "validateCanonicalArena",
    },
    setPolicy: {
      packageName: "@cowards/persistence",
      symbol: "scheduleTrialLadderSeason",
    },
  },
  eventVocabulary: {
    candidateCurrent: [...V1_37_KERNEL_CANDIDATE_EVENT_VOCABULARY],
    removedFromCandidateCurrent: ["PUSH_ATTEMPTED"],
    historicalOnly: [],
  },
  activation: {
    currentTuplePointer: false,
    currentSchema: false,
    currentArtifact: false,
    publication: false,
    receipt: false,
    countedExecution: false,
  },
  currentAuthorityByteBaseline: { ...CURRENT_AUTHORITY_BYTE_BASELINE },
} as const

type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T

const deepFreeze = <T>(value: T): DeepReadonly<T> => {
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
    Object.freeze(value)
  }
  return value as DeepReadonly<T>
}

export type InactiveV137KernelIntegrityCandidate = DeepReadonly<
  typeof candidateContract
>

export const INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE =
  deepFreeze(candidateContract)

const expectedBytes = JSON.stringify(INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE)

export const assertInactiveV137KernelIntegrityCandidate = (
  value: unknown,
): InactiveV137KernelIntegrityCandidate => {
  let actualBytes: string
  try {
    actualBytes = JSON.stringify(value)
  } catch {
    throw new Error(
      "Inactive v1.37 kernel integrity candidate must be the exact closed candidate contract.",
    )
  }
  if (actualBytes !== expectedBytes) {
    throw new Error(
      "Inactive v1.37 kernel integrity candidate is missing, mixed, duplicate, current, or partially activated.",
    )
  }
  return INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE
}

export const cloneInactiveV137KernelIntegrityCandidate = () =>
  globalThis.structuredClone(INACTIVE_V1_37_KERNEL_INTEGRITY_CANDIDATE)
