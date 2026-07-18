#!/usr/bin/env -S pnpm exec tsx
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readFileSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  checkActivationSeamInventory,
  DECLARED_STALE_SEAM_PATHS,
  validateActivationSeamInventory,
  type ActivationSeamInventory,
} from "./audit-v1-37-observation-v1-19-activation-seams.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SHA256 = /^sha256:[0-9a-f]{64}$/u

const LANGUAGES = ["typescript", "python", "rust", "zig"] as const
const REQUIREMENTS = [
  "STRAT-01",
  "STRAT-02",
  "STRAT-03",
  "STRAT-04",
  "SET-01",
  "SET-02",
  "SET-03",
  "SET-04",
  "SET-05",
] as const
const DECISIONS = Array.from(
  { length: 16 },
  (_, index) => `D-${String(index + 1).padStart(2, "0")}`,
)

const EXPECTED_CANDIDATE = Object.freeze({
  semanticRuntimeVersion: "runtime-v1.19",
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  semanticTupleId:
    "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
  arenaCatalogVersion: "canonical-arena-catalog-v1.37",
  setPolicyVersion: "canonical-set-policy-v1.37-four-condition-v1",
  corpus: {
    version: "v3",
    rootSha256:
      "sha256:06d0717a16047cace0364c94a15353e2d53b53da5e8bebef6912f9f30f3d681d",
    pinFileSha256:
      "sha256:bd40526e92122be0e7b00e0c57fdc21f14374e19c18ff90c927215c1e2bcc9c6",
  },
  trace: {
    version: "v1.37-observation-trace-v4",
    rootSha256:
      "sha256:f9821fd2b3a5a3cb17a01b4a8050ea70c2274df04601f314a25adac6da4f428a",
    pinFileSha256:
      "sha256:6dd4cd7cf9bdf2de46a3517062a5eac8f15301e87723fc39c98226a400a1d059",
  },
  workshop: {
    version: "workshop-contract-v1.19",
    rootSha256:
      "sha256:b455b4e44ccae14cb724c6d3e8f41e3fb8dfcdb36976d35058f859dcfc7a385d",
    pinFileSha256:
      "sha256:2ad1c0be0b79beb67308fe1c089c8223d93ed4f33130dbf9c7b88fb4dffca57b",
  },
})

const EXPECTED_BINDINGS = Object.freeze({
  corpus: {
    current: false,
    fileSha256:
      "sha256:ec92ba7506907e65a032083a2c68005022c7ad8d8873a9ddbc59338db2d8d5d0",
    pinFileSha256: EXPECTED_CANDIDATE.corpus.pinFileSha256,
    rootSha256: EXPECTED_CANDIDATE.corpus.rootSha256,
    version: EXPECTED_CANDIDATE.corpus.version,
  },
  schemaVersion: "v1.37-observation-v1.19-candidate-bindings-v1",
  semanticTuple: {
    arenaCatalogVersion: EXPECTED_CANDIDATE.arenaCatalogVersion,
    current: false,
    runtimeAbiVersion: EXPECTED_CANDIDATE.runtimeAbiVersion,
    setPolicyVersion: EXPECTED_CANDIDATE.setPolicyVersion,
    tupleId: EXPECTED_CANDIDATE.semanticTupleId,
    tupleSha256: EXPECTED_CANDIDATE.semanticTupleId.slice("sha256:".length),
  },
  trace: {
    bundleRootSha256:
      "sha256:11fee531edf255b80c2c9780b13c9daf9598581f3218fe5d4d38e38b879a04bd",
    current: false,
    pinFileSha256: EXPECTED_CANDIDATE.trace.pinFileSha256,
    rootSha256: EXPECTED_CANDIDATE.trace.rootSha256,
    version: EXPECTED_CANDIDATE.trace.version,
  },
  workshop: {
    current: false,
    observationSemanticsSha256:
      "sha256:9848ba17da56661e0192373c2e655fb0d7c0644815a4c377a2f427249389790c",
    pinFileSha256: EXPECTED_CANDIDATE.workshop.pinFileSha256,
    rootSha256: EXPECTED_CANDIDATE.workshop.rootSha256,
    version: EXPECTED_CANDIDATE.workshop.version,
  },
})

const INPUT_PATHS = Object.freeze([
  ".planning/artifacts/v1.37-kernel-integrity-proof.json",
  ".planning/artifacts/v1.37-observation-v1.19-stale-seam-inventory.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
  ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
  ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
  ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  "apps/go-backend/arena_set_authority_v1_37_generated.go",
  "apps/go-backend/current_semantic_authority_generated.go",
  "apps/runtime-service/src/production-runtime-config.ts",
  "apps/web/app/matches/replay-ready.ts",
  "apps/web/app/matchsets/result-view-model.ts",
  "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
  "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
  "packages/golden/src/v1-37-conformance-corpus-pin.ts",
  "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
  "packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts",
  "packages/persistence/src/current-workshop-contract-generated.ts",
  "packages/persistence/src/semantic-authority-selection-head.ts",
  "packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts",
  "packages/replay/src/record.ts",
  "packages/replay/src/validate.ts",
  "packages/spec/src/current-semantic-authority-generated.ts",
  "packages/spec/src/current-semantic-authority-source.ts",
  "packages/spec/src/match-execution-contract.ts",
  "scripts/check-service-boundary-imports.ts",
  "scripts/activate-v1-37-observation-v1-19.ts",
  "scripts/audit-v1-37-observation-v1-19-activation-seams.ts",
  "scripts/audit-v1-37-observation-v1-19-activation-seams.test.ts",
  "scripts/evaluate-v1-37-observation-v1-19-preactivation.ts",
  "scripts/evaluate-v1-37-observation-v1-19-preactivation.test.ts",
  ...DECLARED_STALE_SEAM_PATHS,
])

const FIXED_INPUT_SHA256 = new Map<string, string>([
  [
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-typescript.json",
    "sha256:b8511b80d2ceac228d7b50182bdc8a105c7bde4c5281e88691846932a9902228",
  ],
  [
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-python.json",
    "sha256:004a05db94a2f007029532b2d75d27cafe99863643b073a1384ad6c972015108",
  ],
  [
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-rust.json",
    "sha256:8e4a6b31fc3b8d5444d8c2bc703b0c966e965a7715ed111901ab6b8660391fc7",
  ],
  [
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-zig.json",
    "sha256:04e14375199e33b44b38d4bdc9c513b0041349c7c9f5c48ac5978e9bebe41911",
  ],
  [
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json",
    "sha256:3b57751ff2231992b0ce3234a610f72550c841322e3bc5f94873e4e29c9188d7",
  ],
  [
    ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
    "sha256:912d78cef6e3fc894833af71d4f835fa2b83795072cba6266782703a872d7921",
  ],
  [
    "packages/golden/src/v1-37-conformance-corpus-v3-candidate-pin.ts",
    "sha256:bd40526e92122be0e7b00e0c57fdc21f14374e19c18ff90c927215c1e2bcc9c6",
  ],
  [
    "packages/golden/src/v1-37-conformance-trace-v4-candidate-pin.ts",
    "sha256:6dd4cd7cf9bdf2de46a3517062a5eac8f15301e87723fc39c98226a400a1d059",
  ],
  [
    "packages/persistence/src/workshop-contract-v1-19-candidate-pin.ts",
    "sha256:2ad1c0be0b79beb67308fe1c089c8223d93ed4f33130dbf9c7b88fb4dffca57b",
  ],
])

export type V137ObservationV119GateId =
  | "spec"
  | "engine"
  | "generator"
  | "persistence"
  | "go"
  | "runtime"
  | "replay"
  | "public-contract"
  | "web"
  | "privacy"
  | "boundary"
  | "certification"
  | "revalidation"
  | "protected-baseline"

const GATE_IDS: readonly V137ObservationV119GateId[] = [
  "spec",
  "engine",
  "generator",
  "persistence",
  "go",
  "runtime",
  "replay",
  "public-contract",
  "web",
  "privacy",
  "boundary",
  "certification",
  "revalidation",
  "protected-baseline",
]

export interface V137ObservationV119GateReceipt {
  id: V137ObservationV119GateId
  status: "passed"
  command: string
  exitCode: 0
  stdoutSha256: string
  stderrSha256: string
}

export interface V137ObservationV119DatabaseInventory {
  phase259CurrentCandidateRows: number
  phase259CertificateRows: number
  inactiveV119CertificateRows: number
  inactiveV119RunRows: number
  arenaCatalogRows: number
  activeArenaRows: number
  historicalAliasRows: number
  setScenarioRows: number
  setConditionRows: number
  revisionRevalidationRows: number
  successorMatchRows: number
}

interface CandidateRun {
  runId: string
  processId: string
  workspaceId: string
  validUntil: string
  status: "passed"
  complete: true
  freshProcess: true
  freshWorkspace: true
  skippedCaseCount: 0
  unsupportedCaseCount: 0
  fallbackUsed: false
  syntheticEvidence: false
  resultRootSha256: string
  evidenceRootSha256: string
}

interface CandidateLane {
  languageId: (typeof LANGUAGES)[number]
  laneId: string
  candidatePayloadSha256: string
  certificateId: string
  certificateSha256: string
  registryGeneration: "candidate-0"
  status: "installed_inactive"
  runs: CandidateRun[]
}

export interface V137ObservationV119PreactivationProof {
  schemaVersion: "v1.37-observation-v1.19-preactivation-proof-v1"
  milestone: "v1.37"
  phase: 260
  lifecycle: "preactivation-only"
  current: false
  requirements: Array<{ id: string; status: "proved" }>
  decisions: Array<{ id: string; status: "proved" }>
  inputs: Array<{ path: string; sha256: string }>
  candidate: {
    semanticRuntimeVersion: string
    runtimeAbiVersion: string
    semanticTupleId: string
    corpus: { version: string; rootSha256: string; pinFileSha256: string }
    trace: { version: string; rootSha256: string; pinFileSha256: string }
    workshop: { version: string; rootSha256: string; pinFileSha256: string }
    arena: {
      catalogVersion: string
      activeSemanticGeometryCount: 2
      schedulableArenaCount: 2
      historicalAliasCount: 1
      aliasDiversityCount: 0
    }
    set: {
      policyVersion: string
      conditionCount: 4
      typescriptMatrixProved: true
      goMatrixProved: true
      partialMatricesCounted: false
      systemFailuresCounted: false
    }
    lanes: CandidateLane[]
    reusedPhase259RunCount: 0
    revisions: {
      inventoryCount: number
      inventoryRootSha256: string
      revalidatedCount: number
      nonCountedCount: number
      inferenceAllowed: false
      allDispositionsExplicit: true
      selectorActivated: false
    }
    replay: {
      exact: true
      current: false
      publishable: false
      historicalV14Immutable: true
    }
    publicContract: {
      exact: true
      selectedAsCurrent: false
      privateFieldCount: 0
    }
    boundary: { executionOwnershipExact: true; semanticOwnershipExact: true }
  }
  currentInventory: {
    semantic: {
      semanticAuthorityKey: string
      tupleId: string
      runtimeAbiVersion: string
      arenaCatalogVersion: string
      setPolicyVersion: string
      certificateVersion: string
      sourceSha256: string
      outputSha256: string
    }
    corpus: {
      activeVersion: string
      rootSha256: string
      registryFileSha256: string
      reviewedPinFileSha256: string
    }
    trace: {
      activeVersion: string
      rootSha256: string
      registryFileSha256: string
    }
    workshop: {
      contractVersion: string
      runtimeAbiVersion: string
      sourceRoots: string[]
    }
    go: {
      semanticAuthorityKey: string
      tupleId: string
      runtimeAbiVersion: string
    }
    database: V137ObservationV119DatabaseInventory
  }
  seamAudit: {
    status: "passed"
    findingCount: 0
    autoFix: false
    gateStatus: "passed"
    gateExitCode: 0
    dependencyTreeUnchanged: true
    stdoutNormalization: "vitest-stable-v1"
  }
  protectedBaseline: {
    status: "verified"
    protectedPathCount: 2
    baselineSha256: string
  }
  privacy: { publicSafe: true; forbiddenFieldCount: 0 }
  gates: V137ObservationV119GateReceipt[]
}

const sha256 = (bytes: Uint8Array): string =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`
const readBytes = (repoRoot: string, relativePath: string): Buffer =>
  readFileSync(path.join(repoRoot, relativePath))
const readJson = <T>(repoRoot: string, relativePath: string): T =>
  JSON.parse(readBytes(repoRoot, relativePath).toString("utf8")) as T
const exactKeys = (value: unknown, keys: readonly string[]): boolean =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key))

const phase259RunIds = (repoRoot: string): Set<string> =>
  new Set(
    LANGUAGES.flatMap((languageId) => {
      const artifact = readJson<{ candidatePayload: { runs: CandidateRun[] } }>(
        repoRoot,
        `.planning/artifacts/v1.37-language-conformance-${languageId}.json`,
      )
      return artifact.candidatePayload.runs.map(({ runId }) => runId)
    }),
  )

const buildCandidate = (
  repoRoot: string,
): V137ObservationV119PreactivationProof["candidate"] => {
  const receipts = readJson<{
    receipts: Array<{
      languageId: string
      laneId: string
      candidatePayloadSha256: string
      certificateId: string
      certificateSha256: string
      status: string
      ledgerIdentity: { registryGeneration: string }
      candidateAuthority: Record<string, string>
    }>
  }>(
    repoRoot,
    ".planning/artifacts/v1.37-observation-v1.19-language-conformance-import-receipts.json",
  )
  const oldRunIds = phase259RunIds(repoRoot)
  let reusedPhase259RunCount = 0
  const lanes = LANGUAGES.map((languageId): CandidateLane => {
    const artifact = readJson<{
      schemaVersion: string
      status: string
      languageId: string
      candidatePayloadSha256: string
      candidateBindings: {
        corpus: Record<string, unknown>
        trace: Record<string, unknown>
        workshop: Record<string, unknown>
        semanticTuple: Record<string, unknown>
      }
      candidatePayload: { runs: CandidateRun[] }
    }>(
      repoRoot,
      `.planning/artifacts/v1.37-observation-v1.19-language-conformance-${languageId}.json`,
    )
    const receipt = receipts.receipts.find(
      (entry) => entry.languageId === languageId,
    )
    if (
      artifact.schemaVersion !==
        "v1.37-observation-v1.19-reviewed-language-candidate-v1" ||
      artifact.status !== "reviewed_unsigned_candidate" ||
      artifact.languageId !== languageId ||
      receipt === undefined ||
      receipt.candidatePayloadSha256 !== artifact.candidatePayloadSha256 ||
      artifact.candidatePayloadSha256 !==
        sha256(Buffer.from(JSON.stringify(artifact.candidatePayload))) ||
      JSON.stringify(artifact.candidateBindings) !==
        JSON.stringify(EXPECTED_BINDINGS) ||
      artifact.candidatePayload.runs.some(
        (run) =>
          JSON.stringify(
            (run as CandidateRun & { candidateBindings?: unknown })
              .candidateBindings,
          ) !== JSON.stringify(EXPECTED_BINDINGS),
      ) ||
      receipt.status !== "installed_inactive" ||
      receipt.ledgerIdentity.registryGeneration !== "candidate-0" ||
      receipt.candidateAuthority.runtimeAbiVersion !==
        EXPECTED_CANDIDATE.runtimeAbiVersion ||
      receipt.candidateAuthority.semanticTupleId !==
        EXPECTED_CANDIDATE.semanticTupleId ||
      receipt.candidateAuthority.arenaCatalogVersion !==
        EXPECTED_CANDIDATE.arenaCatalogVersion ||
      receipt.candidateAuthority.setPolicyVersion !==
        EXPECTED_CANDIDATE.setPolicyVersion ||
      receipt.candidateAuthority.corpusVersion !==
        EXPECTED_CANDIDATE.corpus.version ||
      receipt.candidateAuthority.corpusRootSha256 !==
        EXPECTED_CANDIDATE.corpus.rootSha256 ||
      receipt.candidateAuthority.corpusPinSha256 !==
        EXPECTED_CANDIDATE.corpus.pinFileSha256 ||
      receipt.candidateAuthority.traceVersion !==
        EXPECTED_CANDIDATE.trace.version ||
      receipt.candidateAuthority.traceRootSha256 !==
        EXPECTED_CANDIDATE.trace.rootSha256 ||
      receipt.candidateAuthority.tracePinSha256 !==
        EXPECTED_CANDIDATE.trace.pinFileSha256 ||
      receipt.candidateAuthority.workshopVersion !==
        EXPECTED_CANDIDATE.workshop.version ||
      receipt.candidateAuthority.workshopRootSha256 !==
        EXPECTED_CANDIDATE.workshop.rootSha256 ||
      receipt.candidateAuthority.workshopPinSha256 !==
        EXPECTED_CANDIDATE.workshop.pinFileSha256
    ) {
      throw new Error(`candidate lane mismatch: ${languageId}`)
    }
    reusedPhase259RunCount += artifact.candidatePayload.runs.filter(
      ({ runId }) => oldRunIds.has(runId),
    ).length
    return {
      languageId,
      laneId: receipt.laneId,
      candidatePayloadSha256: artifact.candidatePayloadSha256,
      certificateId: receipt.certificateId,
      certificateSha256: receipt.certificateSha256,
      registryGeneration: receipt.ledgerIdentity
        .registryGeneration as "candidate-0",
      status: receipt.status as "installed_inactive",
      runs: artifact.candidatePayload.runs,
    }
  })
  const revisions = readJson<{
    status: string
    current: boolean
    selectorActivated: boolean
    inventory: { count: number; rootSha256: string }
    totals: { revalidated: number; nonCounted: number }
    records: Array<{
      outcome: string
      countedCandidateEligible: boolean
      dispositionCode: string
    }>
  }>(
    repoRoot,
    ".planning/artifacts/v1.37-observation-v1.19-strategy-revision-revalidation.json",
  )
  return {
    semanticRuntimeVersion: EXPECTED_CANDIDATE.semanticRuntimeVersion,
    runtimeAbiVersion: EXPECTED_CANDIDATE.runtimeAbiVersion,
    semanticTupleId: EXPECTED_CANDIDATE.semanticTupleId,
    corpus: { ...EXPECTED_CANDIDATE.corpus },
    trace: { ...EXPECTED_CANDIDATE.trace },
    workshop: { ...EXPECTED_CANDIDATE.workshop },
    arena: {
      catalogVersion: EXPECTED_CANDIDATE.arenaCatalogVersion,
      activeSemanticGeometryCount: 2,
      schedulableArenaCount: 2,
      historicalAliasCount: 1,
      aliasDiversityCount: 0,
    },
    set: {
      policyVersion: EXPECTED_CANDIDATE.setPolicyVersion,
      conditionCount: 4,
      typescriptMatrixProved: true,
      goMatrixProved: true,
      partialMatricesCounted: false,
      systemFailuresCounted: false,
    },
    lanes,
    reusedPhase259RunCount: reusedPhase259RunCount as 0,
    revisions: {
      inventoryCount: revisions.inventory.count,
      inventoryRootSha256: revisions.inventory.rootSha256,
      revalidatedCount: revisions.totals.revalidated,
      nonCountedCount: revisions.totals.nonCounted,
      inferenceAllowed: false,
      allDispositionsExplicit: revisions.records.every(
        (record) =>
          record.outcome === "non_counted" &&
          record.countedCandidateEligible === false &&
          record.dispositionCode.length > 0,
      ),
      selectorActivated: revisions.selectorActivated,
    },
    replay: {
      exact: true,
      current: false,
      publishable: false,
      historicalV14Immutable: true,
    },
    publicContract: {
      exact: true,
      selectedAsCurrent: false,
      privateFieldCount: 0,
    },
    boundary: { executionOwnershipExact: true, semanticOwnershipExact: true },
  }
}

const buildCurrentInventory = (
  repoRoot: string,
  database: V137ObservationV119DatabaseInventory,
): V137ObservationV119PreactivationProof["currentInventory"] => {
  const corpus = readJson<{ activeVersion: string; corpusRootSha256: string }>(
    repoRoot,
    "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
  )
  const trace = readJson<{
    activeVersion: string
    candidateRootSha256: string
  }>(
    repoRoot,
    "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
  )
  return {
    semantic: {
      semanticAuthorityKey: "runtime-v1.17",
      tupleId:
        "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      arenaCatalogVersion: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicyVersion: "canonical-set-policy-v1.4",
      certificateVersion: "runtime-conformance-certificate-v1.17",
      sourceSha256:
        "sha256:14296beaf5e79d731dba3de3501dde7239731ce51b0c926bced3d76f5eff29e1",
      outputSha256:
        "sha256:bb814addab77fd473103651eb9aac2980ed45770d5147fb54de1f703143b2ce0",
    },
    corpus: {
      activeVersion: corpus.activeVersion,
      rootSha256: corpus.corpusRootSha256,
      registryFileSha256: sha256(
        readBytes(
          repoRoot,
          "packages/golden/src/fixtures/v1-37-conformance-corpus/registry.json",
        ),
      ),
      reviewedPinFileSha256: sha256(
        readBytes(
          repoRoot,
          "packages/golden/src/v1-37-conformance-corpus-pin.ts",
        ),
      ),
    },
    trace: {
      activeVersion: trace.activeVersion,
      rootSha256: trace.candidateRootSha256,
      registryFileSha256: sha256(
        readBytes(
          repoRoot,
          "packages/golden/src/fixtures/v1-37-conformance-traces/registry.json",
        ),
      ),
    },
    workshop: {
      contractVersion: "workshop-contract-v1.17",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
      sourceRoots: [
        "sha256:c85f2f2acd3bff9a304aeebb778524173691a031ef470360915d109a202c6b3a",
        "sha256:0f5964451211ee5e6557907fe52a507b8875bb6d023b490926f74450280b10d0",
        "sha256:b038431f0b88bc324b417c57ec4709e0279558ed006bcb2c87b8d08d0a8035b5",
        "sha256:5f3f02fb40edf2362a86fb821f6e3133c5e6a7b0639696b99b7f18c420b1fa0d",
      ],
    },
    go: {
      semanticAuthorityKey: "runtime-v1.17",
      tupleId:
        "sha256:0d8a04fdfe49e3aa7261728ee51beb0a9049b661aad978277f2892c3a4bc54fe",
      runtimeAbiVersion: "strategy-runtime-abi-v1.17",
    },
    database,
  }
}

export const buildV137ObservationV119PreactivationProof = (
  repoRoot: string = root,
  gates: V137ObservationV119GateReceipt[] = executeGates(repoRoot),
  database: V137ObservationV119DatabaseInventory = readDatabaseInventory(
    repoRoot,
  ),
): V137ObservationV119PreactivationProof => {
  const baseline = readJson<{ paths: unknown[]; baselineSha256: string }>(
    repoRoot,
    ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  )
  const seamInventory = readJson<ActivationSeamInventory>(
    repoRoot,
    ".planning/artifacts/v1.37-observation-v1.19-stale-seam-inventory.json",
  )
  if (
    validateActivationSeamInventory(seamInventory).length > 0 ||
    seamInventory.status !== "passed" ||
    seamInventory.findingCount !== 0 ||
    seamInventory.gate.status !== "passed" ||
    seamInventory.gate.exitCode !== 0 ||
    seamInventory.gate.dependencyTreeUnchanged !== true
  ) {
    throw new Error("preactivation seam inventory invalid")
  }
  return {
    schemaVersion: "v1.37-observation-v1.19-preactivation-proof-v1",
    milestone: "v1.37",
    phase: 260,
    lifecycle: "preactivation-only",
    current: false,
    requirements: REQUIREMENTS.map((id) => ({ id, status: "proved" })),
    decisions: DECISIONS.map((id) => ({ id, status: "proved" })),
    inputs: INPUT_PATHS.map((relativePath) => ({
      path: relativePath,
      sha256: sha256(readBytes(repoRoot, relativePath)),
    })),
    candidate: buildCandidate(repoRoot),
    currentInventory: buildCurrentInventory(repoRoot, database),
    seamAudit: {
      status: seamInventory.status,
      findingCount: seamInventory.findingCount,
      autoFix: seamInventory.simulation.autoFix,
      gateStatus: seamInventory.gate.status,
      gateExitCode: seamInventory.gate.exitCode,
      dependencyTreeUnchanged: seamInventory.gate.dependencyTreeUnchanged,
      stdoutNormalization: seamInventory.gate.stdoutNormalization,
    },
    protectedBaseline: {
      status: "verified",
      protectedPathCount: baseline.paths.length as 2,
      baselineSha256: baseline.baselineSha256,
    },
    privacy: { publicSafe: true, forbiddenFieldCount: 0 },
    gates,
  }
}

const expectedDatabase: V137ObservationV119DatabaseInventory = {
  phase259CurrentCandidateRows: 0,
  phase259CertificateRows: 4,
  inactiveV119CertificateRows: 4,
  inactiveV119RunRows: 12,
  arenaCatalogRows: 3,
  activeArenaRows: 2,
  historicalAliasRows: 1,
  setScenarioRows: 0,
  setConditionRows: 0,
  revisionRevalidationRows: 0,
  successorMatchRows: 0,
}

const laneErrors = (lanes: CandidateLane[], now: string): boolean => {
  if (lanes.length !== 4) return true
  const runIds = new Set<string>()
  const processIds = new Set<string>()
  const workspaceIds = new Set<string>()
  return lanes.some((lane, index) => {
    if (
      lane.languageId !== LANGUAGES[index] ||
      lane.status !== "installed_inactive" ||
      lane.registryGeneration !== "candidate-0" ||
      lane.runs.length !== 3 ||
      !SHA256.test(lane.candidatePayloadSha256) ||
      !SHA256.test(lane.certificateSha256)
    )
      return true
    return lane.runs.some((run) => {
      const duplicate =
        runIds.has(run.runId) ||
        processIds.has(run.processId) ||
        workspaceIds.has(run.workspaceId)
      runIds.add(run.runId)
      processIds.add(run.processId)
      workspaceIds.add(run.workspaceId)
      return (
        duplicate ||
        run.status !== "passed" ||
        run.complete !== true ||
        run.freshProcess !== true ||
        run.freshWorkspace !== true ||
        run.skippedCaseCount !== 0 ||
        run.unsupportedCaseCount !== 0 ||
        run.fallbackUsed !== false ||
        run.syntheticEvidence !== false ||
        !SHA256.test(run.resultRootSha256) ||
        !SHA256.test(run.evidenceRootSha256) ||
        Date.parse(now) > Date.parse(run.validUntil)
      )
    })
  })
}

export const validateV137ObservationV119PreactivationProof = (
  value: unknown,
  repoRoot: string = root,
  now: string = new Date().toISOString(),
): string[] => {
  if (
    !exactKeys(value, [
      "schemaVersion",
      "milestone",
      "phase",
      "lifecycle",
      "current",
      "requirements",
      "decisions",
      "inputs",
      "candidate",
      "currentInventory",
      "seamAudit",
      "protectedBaseline",
      "privacy",
      "gates",
    ])
  )
    return ["proof shape"]
  const proof = value as V137ObservationV119PreactivationProof
  const errors: string[] = []
  if (
    proof.schemaVersion !== "v1.37-observation-v1.19-preactivation-proof-v1" ||
    proof.milestone !== "v1.37" ||
    proof.phase !== 260 ||
    proof.lifecycle !== "preactivation-only" ||
    proof.current !== false
  )
    errors.push("proof identity")
  if (
    JSON.stringify(proof.requirements) !==
    JSON.stringify(REQUIREMENTS.map((id) => ({ id, status: "proved" })))
  )
    errors.push("requirements")
  if (
    JSON.stringify(proof.decisions) !==
    JSON.stringify(DECISIONS.map((id) => ({ id, status: "proved" })))
  )
    errors.push("decisions")
  if (
    proof.inputs.length !== INPUT_PATHS.length ||
    proof.inputs.some(
      (entry, index) =>
        entry.path !== INPUT_PATHS[index] ||
        entry.sha256 !== sha256(readBytes(repoRoot, entry.path)) ||
        (FIXED_INPUT_SHA256.has(entry.path) &&
          entry.sha256 !== FIXED_INPUT_SHA256.get(entry.path)),
    )
  )
    errors.push("inputs")
  if (
    !exactKeys(proof.candidate, [
      "semanticRuntimeVersion",
      "runtimeAbiVersion",
      "semanticTupleId",
      "corpus",
      "trace",
      "workshop",
      "arena",
      "set",
      "lanes",
      "reusedPhase259RunCount",
      "revisions",
      "replay",
      "publicContract",
      "boundary",
    ])
  )
    return ["proof shape"]
  const derivedCandidate = buildCandidate(repoRoot)
  if (JSON.stringify(proof.candidate) !== JSON.stringify(derivedCandidate)) {
    errors.push("candidate evidence")
  }
  if (laneErrors(proof.candidate.lanes, now)) errors.push("candidate lanes")
  if (
    proof.candidate.semanticRuntimeVersion !==
      EXPECTED_CANDIDATE.semanticRuntimeVersion ||
    proof.candidate.runtimeAbiVersion !==
      EXPECTED_CANDIDATE.runtimeAbiVersion ||
    proof.candidate.semanticTupleId !== EXPECTED_CANDIDATE.semanticTupleId ||
    JSON.stringify(proof.candidate.corpus) !==
      JSON.stringify(EXPECTED_CANDIDATE.corpus) ||
    JSON.stringify(proof.candidate.trace) !==
      JSON.stringify(EXPECTED_CANDIDATE.trace) ||
    JSON.stringify(proof.candidate.workshop) !==
      JSON.stringify(EXPECTED_CANDIDATE.workshop) ||
    proof.candidate.reusedPhase259RunCount !== 0
  )
    errors.push("candidate identity")
  if (
    proof.candidate.arena.catalogVersion !==
      EXPECTED_CANDIDATE.arenaCatalogVersion ||
    proof.candidate.arena.activeSemanticGeometryCount !== 2 ||
    proof.candidate.arena.schedulableArenaCount !== 2 ||
    proof.candidate.arena.historicalAliasCount !== 1 ||
    proof.candidate.arena.aliasDiversityCount !== 0
  )
    errors.push("arena authority")
  if (
    proof.candidate.set.policyVersion !== EXPECTED_CANDIDATE.setPolicyVersion ||
    proof.candidate.set.conditionCount !== 4 ||
    proof.candidate.set.typescriptMatrixProved !== true ||
    proof.candidate.set.goMatrixProved !== true ||
    proof.candidate.set.partialMatricesCounted !== false ||
    proof.candidate.set.systemFailuresCounted !== false
  )
    errors.push("Set authority")
  if (
    proof.candidate.revisions.inventoryCount !== 9 ||
    proof.candidate.revisions.revalidatedCount !== 0 ||
    proof.candidate.revisions.nonCountedCount !== 9 ||
    proof.candidate.revisions.inferenceAllowed !== false ||
    proof.candidate.revisions.allDispositionsExplicit !== true ||
    proof.candidate.revisions.selectorActivated !== false
  )
    errors.push("revision dispositions")
  const derivedCurrent = buildCurrentInventory(
    repoRoot,
    proof.currentInventory.database,
  )
  if (
    JSON.stringify(proof.currentInventory) !== JSON.stringify(derivedCurrent)
  ) {
    errors.push("current inventory")
  }
  if (
    JSON.stringify(proof.currentInventory.database) !==
    JSON.stringify(expectedDatabase)
  ) {
    errors.push("database inventory")
  }
  if (
    JSON.stringify(proof.seamAudit) !==
    JSON.stringify({
      status: "passed",
      findingCount: 0,
      autoFix: false,
      gateStatus: "passed",
      gateExitCode: 0,
      dependencyTreeUnchanged: true,
      stdoutNormalization: "vitest-stable-v1",
    })
  ) {
    errors.push("seam audit")
  }
  if (
    proof.currentInventory.semantic.semanticAuthorityKey !== "runtime-v1.17" ||
    proof.currentInventory.corpus.activeVersion !== "v2" ||
    proof.currentInventory.corpus.rootSha256 !==
      "sha256:238347225defaaabcf9e57141ac7a54b4b277bd149bebe2b21903febc9ce7ac2" ||
    proof.currentInventory.trace.activeVersion !==
      "v1.37-conformance-trace-v3" ||
    proof.currentInventory.workshop.contractVersion !==
      "workshop-contract-v1.17" ||
    proof.currentInventory.go.semanticAuthorityKey !== "runtime-v1.17" ||
    proof.currentInventory.corpus.registryFileSha256 !==
      "sha256:440869c22aaffca1e872245809823cded028fb07783f1e7d6ece7b0b3781f3a0" ||
    proof.currentInventory.corpus.reviewedPinFileSha256 !==
      "sha256:95435d61e57c9e12106b9825d64a0a009b2381ad42ee582da0849ed56a7963ef" ||
    proof.currentInventory.trace.registryFileSha256 !==
      "sha256:f97efb668bd956da600c0ca9bc1514473ad79554eba2477042c49091a698494d" ||
    sha256(
      readBytes(
        repoRoot,
        "packages/persistence/src/current-workshop-contract-generated.ts",
      ),
    ) !==
      "sha256:7eef33f3b8081383e08a6330dc2ed6a5c468503bb72be6ff0cfb27202d1835ad" ||
    sha256(
      readBytes(
        repoRoot,
        "packages/spec/src/current-semantic-authority-source.ts",
      ),
    ) !==
      "sha256:35c90bd1a7d8f69c3a39c72204334485aacd798ca99d5ed6185cf59d883ac9ae" ||
    sha256(
      readBytes(
        repoRoot,
        "packages/spec/src/current-semantic-authority-generated.ts",
      ),
    ) !==
      "sha256:158837d2ccf0b2cec8ef3851d3822a49cde8cd21058f5a350d740e3766492fd4" ||
    sha256(
      readBytes(
        repoRoot,
        "apps/go-backend/current_semantic_authority_generated.go",
      ),
    ) !==
      "sha256:512b83fc6bd300b17214b25b851e737aecb7c58b629642c33bbd6443f6807063"
  )
    errors.push("Phase-259 current selection")
  const baseline = readJson<{ paths: unknown[]; baselineSha256: string }>(
    repoRoot,
    ".planning/artifacts/v1.37-protected-working-tree-baseline.json",
  )
  if (
    proof.protectedBaseline.status !== "verified" ||
    proof.protectedBaseline.protectedPathCount !== 2 ||
    proof.protectedBaseline.baselineSha256 !== baseline.baselineSha256 ||
    baseline.paths.length !== 2
  )
    errors.push("protected baseline")
  if (
    proof.privacy.publicSafe !== true ||
    proof.privacy.forbiddenFieldCount !== 0
  ) {
    errors.push("privacy")
  }
  if (
    proof.gates.length !== GATE_IDS.length ||
    proof.gates.some(
      (gate, index) =>
        gate.id !== GATE_IDS[index] ||
        gate.status !== "passed" ||
        gate.exitCode !== 0 ||
        !SHA256.test(gate.stdoutSha256) ||
        !SHA256.test(gate.stderrSha256),
    )
  )
    errors.push("gates")
  return errors
}

interface GateDefinition {
  id: V137ObservationV119GateId
  command: string
  args: string[]
  cwd?: string
}

const gateDefinitions: GateDefinition[] = [
  {
    id: "spec",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/spec/src/strategy-observation-abi-v1-19.test.ts",
      "packages/spec/src/arena-catalog-v1-37.test.ts",
      "packages/spec/src/set-condition-policy-v1-37.test.ts",
      "packages/spec/src/integrity-authority.test.ts",
    ],
  },
  {
    id: "engine",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/engine/src/test/strategy-observations-v1-19.test.ts",
      "packages/engine/src/test/compatibility-v1-4.test.ts",
    ],
  },
  {
    id: "generator",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "scripts/generate-v1-37-arena-set-authority.test.ts",
      "scripts/generate-v1-37-conformance-corpus.test.ts",
      "scripts/generate-v1-37-conformance-traces.test.ts",
    ],
  },
  {
    id: "persistence",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/persistence/src/migrations.test.ts",
      "packages/persistence/src/matchset-service.test.ts",
      "packages/persistence/src/complete-match.test.ts",
      "packages/persistence/src/matchset-status.test.ts",
      "packages/persistence/src/scoring.test.ts",
      "packages/persistence/src/workshop-contract-v1-19-candidate.test.ts",
    ],
  },
  {
    id: "go",
    command: "go",
    args: ["test", "./...", "-run", "ArenaSetAuthority|Candidate|Cartesian"],
    cwd: "apps/go-backend",
  },
  {
    id: "runtime",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/runtime-js/src/revision-v1-19.test.ts",
      "packages/runtime-python/src/revision-v1-19.test.ts",
      "packages/runtime-wasm-wasi/src/revision-v1-19.test.ts",
      "apps/runtime-service/src/execute-match-v1-19.test.ts",
    ],
  },
  {
    id: "replay",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/replay/src/record.test.ts",
      "packages/replay/src/validate.test.ts",
      "packages/replay/src/historical-v1-4.test.ts",
    ],
  },
  {
    id: "public-contract",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "packages/spec/src/match-execution-contract.test.ts",
    ],
  },
  {
    id: "web",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "apps/web/app/matches/replay-fixture.test.ts",
      "apps/web/app/matchsets/result-view-model.test.ts",
    ],
  },
  {
    id: "privacy",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "apps/runtime-service/src/revalidate-strategy-revision-v1-19.test.ts",
      "packages/spec/src/match-execution-contract.test.ts",
    ],
  },
  { id: "boundary", command: "pnpm", args: ["boundary:imports"] },
  {
    id: "certification",
    command: "pnpm",
    args: [
      "exec",
      "vitest",
      "run",
      "--maxWorkers=1",
      "--no-file-parallelism",
      "scripts/certify-v1-37-observation-v1-19-language-lane.test.ts",
      "scripts/sign-import-v1-37-observation-v1-19-certificates.test.ts",
    ],
  },
  {
    id: "revalidation",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      "scripts/revalidate-v1-37-strategy-revisions-v1-19.ts",
      "--check",
    ],
  },
  {
    id: "protected-baseline",
    command: "pnpm",
    args: [
      "exec",
      "tsx",
      "scripts/capture-v1-37-protected-baseline.ts",
      "--check",
    ],
  },
]

const executeGates = (repoRoot: string): V137ObservationV119GateReceipt[] => {
  if (
    !process.env.DATABASE_URL ||
    !process.env.COWARDS_GO_BACKEND_TEST_DATABASE_URL
  ) {
    throw new Error("preactivation write requires both database URLs")
  }
  return gateDefinitions.map((gate) => {
    const result = spawnSync(gate.command, gate.args, {
      cwd: path.join(repoRoot, gate.cwd ?? "."),
      env: {
        ...process.env,
        PATH: `/usr/local/go/bin:${process.env.PATH ?? ""}`,
      },
      encoding: "buffer",
      maxBuffer: 128 * 1024 * 1024,
      timeout: 20 * 60 * 1_000,
    })
    const stdout = result.stdout ?? Buffer.alloc(0)
    const stderr = result.stderr ?? Buffer.alloc(0)
    if (result.status !== 0 || result.error !== undefined)
      throw new Error(`gate failed: ${gate.id}`)
    return {
      id: gate.id,
      status: "passed",
      command: [gate.command, ...gate.args].join(" "),
      exitCode: 0,
      stdoutSha256: sha256(stdout),
      stderrSha256: sha256(stderr),
    }
  })
}

const readDatabaseInventory = (
  repoRoot: string,
): V137ObservationV119DatabaseInventory => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error("DATABASE_URL is required")
  const sql = `select row_to_json(i) from (
    select
      (select count(*)::integer from runtime_evidence_v1_17_candidates) as "phase259CurrentCandidateRows",
      (select count(*)::integer from runtime_evidence_certificates where certificate_version='runtime-conformance-certificate-v1.17' and exact_certificate_sha256 is not null) as "phase259CertificateRows",
      (select count(*)::integer from runtime_evidence_certificates where certificate_version='runtime-conformance-certificate-v1.19' and registry_generation='candidate-0') as "inactiveV119CertificateRows",
      (select count(*)::integer from runtime_evidence_conformance_certificate_runs r join runtime_evidence_certificates c on c.id=r.certificate_id where c.certificate_version='runtime-conformance-certificate-v1.19') as "inactiveV119RunRows",
      (select count(*)::integer from arena_catalog_entries) as "arenaCatalogRows",
      (select count(*)::integer from arena_catalog_entries where arena_status='active' and schedulable) as "activeArenaRows",
      (select count(*)::integer from arena_catalog_entries where arena_status='historical_alias' and not schedulable) as "historicalAliasRows",
      (select count(*)::integer from set_scenarios) as "setScenarioRows",
      (select count(*)::integer from set_conditions) as "setConditionRows",
      (select count(*)::integer from strategy_revision_v1_19_revalidations) as "revisionRevalidationRows",
      (select count(*)::integer from matches where successor_scenario_id is not null) as "successorMatchRows"
  ) i;`
  const result = spawnSync(
    "psql",
    [databaseUrl, "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", sql],
    {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: 30_000,
    },
  )
  if (result.status !== 0 || result.error !== undefined)
    throw new Error("database inventory failed")
  return JSON.parse(
    result.stdout.trim(),
  ) as V137ObservationV119DatabaseInventory
}

const writeAtomic = (relativePath: string, bytes: Buffer): void => {
  const target = path.join(root, relativePath)
  const temporary = `${target}.tmp-${process.pid}`
  writeFileSync(temporary, bytes, { flag: "wx", mode: 0o644 })
  renameSync(temporary, target)
}

const ARTIFACT_PATH =
  ".planning/artifacts/v1.37-observation-v1.19-preactivation-proof.json"

export const checkV137ObservationV119PreactivationProof = (
  repoRoot: string = root,
): void => {
  const proof = readJson<V137ObservationV119PreactivationProof>(
    repoRoot,
    ARTIFACT_PATH,
  )
  if (
    validateV137ObservationV119PreactivationProof(proof, repoRoot).length > 0
  ) {
    throw new Error("PREACTIVATION_PROOF_INVALID")
  }
  const expected = Buffer.from(`${JSON.stringify(proof)}\n`)
  if (!readBytes(repoRoot, ARTIFACT_PATH).equals(expected))
    throw new Error("PREACTIVATION_PROOF_INVALID")
}

const main = (): void => {
  try {
    const args = process.argv.slice(2)
    if (args.length === 1 && args[0] === "--write") {
      checkActivationSeamInventory()
      const proof = buildV137ObservationV119PreactivationProof()
      const errors = validateV137ObservationV119PreactivationProof(proof)
      if (errors.length > 0) throw new Error(errors.join(","))
      writeAtomic(ARTIFACT_PATH, Buffer.from(`${JSON.stringify(proof)}\n`))
    } else if (args.length === 1 && args[0] === "--check") {
      checkV137ObservationV119PreactivationProof()
    } else throw new Error("usage")
    process.stdout.write(
      `${JSON.stringify({ status: "passed", code: "OBSERVATION_V1_19_PREACTIVATION_PROVED", lifecycle: "preactivation-only" })}\n`,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown"
    const gate = /^gate failed: ([a-z-]+)$/u.exec(message)?.[1]
    process.stderr.write(
      `${JSON.stringify({ status: "failed", code: gate ? `PREACTIVATION_GATE_FAILED_${gate.toUpperCase().replaceAll("-", "_")}` : "PREACTIVATION_PROOF_INVALID" })}\n`,
    )
    process.exitCode = 1
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
