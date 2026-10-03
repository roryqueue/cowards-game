import {
  admitCanonicalJsonValue,
  CANONICAL_ARENA_CATALOG_V1_37,
} from "@cowards/spec"
import { MATCH_KERNEL } from "../../packages/engine/src/index.js"
import {
  LAB_ADMITTED_ROOTS,
  labRoot,
  type LabRoot,
} from "../../packages/strategy-lab/src/contracts.js"
import {
  deriveFactoryExecutionCommitment,
  deriveFactoryOrderedRecordDescriptor,
  deriveFactorySupervisionReceiptRoot,
} from "../../packages/strategy-lab/src/factory/admission.js"
import {
  factoryCandidateFixture,
  factoryProposalFromPacket,
  factoryValidationFixture,
} from "../../packages/strategy-lab/src/factory/contracts.js"
import { deriveFactoryCandidateRoot } from "../../packages/strategy-lab/src/factory/identity.js"
import {
  createFactoryAttemptStart,
  createFactoryAttemptTerminal,
} from "../../packages/strategy-lab/src/factory/ledger.js"
import {
  createFactoryRepository,
  publishFactoryArtifact,
  recordFactoryAttemptStart,
  publishFactoryAttemptTerminal,
} from "../../packages/strategy-lab/src/factory/repository.js"
import { createFactoryExecutionEvidenceFixture } from "./factory-execution-evidence-fixture.js"
import {
  createFactoryAuthoringAllocation,
  type FactorySourceSlot,
} from "../v1-38-factory-allocation.js"
import {
  FACTORY_CONTROL_BASES,
  type FactoryControlSlot,
} from "../v1-38-factory-controls.js"
import { ingestNamedFactoryPacket } from "../ingest-v1-38-factory-packet.js"
import { prepareFreshFactoryCalibration } from "../prepare-v1-38-factory-calibration.js"
import { deriveFixedMechanicsOpponentIdentityRoot } from "../run-v1-38-factory-calibration.js"
import {
  readFreshFactoryCalibration,
  readFactoryCanonicalRecord,
} from "../v1-38-factory-fresh-evidence.js"
import {
  assessFactoryIndependence,
  readRetainedFactoryLedger,
} from "../assess-v1-38-factory-independence.js"

const encode = (value: unknown) => {
  const admitted = admitCanonicalJsonValue(value, {
    profile: "canonical-manifest",
  })
  if (!admitted.ok) throw new Error("synthetic canonical record")
  return admitted.canonicalBytes
}

/** Inert, complete retained evidence. No Strategy, provider, container, or Match runs. */
export const createCompleteHistoricalFactoryFixture = async () => {
  const author = await createFactoryExecutionEvidenceFixture()
  const repository = author.repository
  const put = (value: unknown) =>
    publishFactoryArtifact(repository, encode(value))
  const rooted = (domain: string, value: Record<string, unknown>) =>
    put({ ...value, root: labRoot(domain, value) })
  const slots = {} as Record<FactorySourceSlot, LabRoot>
  for (const slot of ["S01", "S03", "S05"] as const)
    slots[slot] = put(author.fresh.ingestions[slot])
  for (const slot of Object.keys(
    FACTORY_CONTROL_BASES,
  ) as FactoryControlSlot[]) {
    const result = await ingestNamedFactoryPacket(
      {
        producerIdentity: "materializeFactoryCalibrationControl",
        origin: "calibration-control",
        evidenceClass: "calibration_only",
        producerInput: {
          slot,
          baseIngestionArtifactRoot: slots[FACTORY_CONTROL_BASES[slot]],
        },
      },
      repository,
    )
    if (result.disposition !== "accepted") throw new Error(`control ${slot}`)
    slots[slot] = result.artifactRoot
  }
  const protocolBody = {
    schemaVersion: "factory-calibration-protocol-v1",
    phase: "264",
    purpose: "development-independence-calibration",
    split: "development",
  }
  const protocol = {
    ...protocolBody,
    root: labRoot("factory-calibration-protocol-v1", protocolBody),
  }
  const prepared = prepareFreshFactoryCalibration(
    {
      allocation: createFactoryAuthoringAllocation(),
      slotIngestionArtifactRoots: slots,
      protocolRoot: protocol.root,
      protocolArtifactRoot: put(protocol),
      studyPolicyRoot:
        "sha256:e004fed152f38ab7ac5570c7df6c95b59025244f821698eb504263494b9d5a17",
      measurementPolicyRoot:
        "sha256:7c0df85ac1dc0f983619fb93066c70ee4cd7eab727e730e8a25bb3f61b9a8e95",
      opponentIdentityRoot: deriveFixedMechanicsOpponentIdentityRoot(),
      supervision: {
        adapterId: "runtime-js-container-subprocess",
        runtimeAbi: "strategy-runtime-abi-v1.19",
        image: LAB_ADMITTED_ROOTS.image,
        runtimeProfileRoot: LAB_ADMITTED_ROOTS.runtimeLimitsRoot,
      },
    },
    repository,
  )
  const executionBody = {
    ...author.values.executionValue,
    manifestRoot: prepared.manifest.root,
  }
  const executionEvidenceArtifactRoot = rooted(
    "factory-calibration-execution-evidence-v1",
    executionBody,
  )
  const fresh = readFreshFactoryCalibration(
    repository,
    prepared.manifest,
    deriveFixedMechanicsOpponentIdentityRoot(),
  )
  for (const slot of fresh.allocation.sourceSlots) {
    const sourceBytes = new TextEncoder().encode(
      fresh.ingestions[slot].sourceUtf8,
    )
    if (
      publishFactoryArtifact(repository, sourceBytes) !==
      fresh.ingestions[slot].sourceRoot
    )
      throw new Error(`source root ${slot}`)
  }
  const terminalRoots: LabRoot[] = [],
    supervisionArtifactRoots: LabRoot[] = [],
    candidateArtifactRoots: LabRoot[] = [],
    pairingArtifactRoots: LabRoot[] = []
  const receiptRoots = new Map<LabRoot, LabRoot>()
  const candidates = [] as Array<{
    slot: FactorySourceSlot
    publicationRoot: LabRoot
    supervisionArtifactRoot: LabRoot
    start: ReturnType<typeof createFactoryAttemptStart>
    terminal: ReturnType<typeof createFactoryAttemptTerminal>
  }>
  const traceAction = (slot: FactorySourceSlot) =>
    ["S07", "S08", "S12"].includes(slot) ? "TURN_TO_STONE" : "ADVANCE"
  for (const [ordinal, cell] of fresh.cells.entries()) {
    const workload = fresh.workloads[ordinal]!,
      workloadRef = prepared.manifest.workloads[ordinal]!,
      ingestion = fresh.ingestions[cell.slot]
    const startedAtMs = 1000 + ordinal * 1000
    const accountingRoot = put({
      schemaVersion: "factory-calibration-accounting-v1",
      manifestRoot: prepared.manifest.root,
      allocationRoot: prepared.manifest.allocationRoot,
      ordinal,
      workloadArtifactRoot: workloadRef.artifactRoot,
      firstWorkloadStartedAtMs: 1000,
      startedAtMs,
      maxInvocations: 256,
      maxLifetimeMs: 120000,
    })
    const start = createFactoryAttemptStart({
      taskRoot: prepared.manifest.protocolRoot,
      budgetRoot: labRoot("factory-calibration-attempt-budget-v1", {
        allocationRoot: prepared.manifest.allocationRoot,
        ordinal,
      }),
      candidateRoot: ingestion.packetRoot,
      authoringMechanism: "automated-oracle",
      inputRoot: workloadRef.artifactRoot,
      resourceAccountingRoot: accountingRoot,
      retryParentRoot: null,
    })
    recordFactoryAttemptStart(repository, start)
    const proposal = factoryProposalFromPacket(ingestion.packet),
      validation = factoryValidationFixture(proposal)
    put(ingestion.packet)
    put(proposal)
    put(validation)
    const revisionId = `synthetic-revision-${ordinal}`
    const arenaVariant = CANONICAL_ARENA_CATALOG_V1_37.arenas.find(
      (arena) => arena.id === workload.condition.arenaId,
    )!
    const candidateIsBottom = cell.candidateSide === "bottom"
    const match = {
      matchId: `factory-calibration-${workload.root.slice(7, 23)}-${start.root.slice(7, 15)}`,
      seed: cell.seed,
      arenaVariant,
      bottomPlayerId: candidateIsBottom
        ? "factory-candidate"
        : "factory-fixed-mechanics-v1",
      topPlayerId: candidateIsBottom
        ? "factory-fixed-mechanics-v1"
        : "factory-candidate",
      bottomStrategyRevisionId: candidateIsBottom
        ? revisionId
        : "factory-fixed-mechanics-v1",
      topStrategyRevisionId: candidateIsBottom
        ? "factory-fixed-mechanics-v1"
        : revisionId,
      initialInitiativePlayerId:
        cell.initialInitiative === "candidate"
          ? "factory-candidate"
          : "factory-fixed-mechanics-v1",
      maxPhases: 1,
    }
    const admission = {
      sourceRoot: ingestion.sourceRoot,
      packetRoot: ingestion.packetRoot,
      proposalRoot: proposal.root,
      validationRoot: validation.root,
      authorizationRoot: labRoot(
        "synthetic-supervision-authorization",
        start.root,
      ),
      nativeLane: proposal.nativeLane,
      artifacts: {
        source: ingestion.sourceRoot,
        packet: slots[cell.slot],
        proposal: put(proposal),
        validation: put(validation),
      },
    }
    const candidateIdentity = {
      revisionId,
      sourceRoot: ingestion.sourceRoot,
      executableRoot: ingestion.sourceRoot,
      tupleId: MATCH_KERNEL.tupleId,
      tupleRoot: LAB_ADMITTED_ROOTS.tupleRoot,
      image: LAB_ADMITTED_ROOTS.image,
      harnessRoot: labRoot("synthetic-harness", ordinal),
      budgetRoot: start.budgetRoot,
      attemptRoot: start.root,
      runtimeLimitsRoot: proposal.nativeLane.runtimeProfileRoot,
      nativeLane: proposal.nativeLane,
      factoryPacketRoot: ingestion.packetRoot,
      factoryProposalRoot: proposal.root,
      factoryValidationRoot: validation.root,
    }
    const matchup = {
      status: "verified" as const,
      conditionRoot: labRoot("factory-supervision-match-condition-v1", match),
      opponentRoot: deriveFixedMechanicsOpponentIdentityRoot(),
      side: cell.candidateSide,
      initialInitiative: cell.initialInitiative === "candidate",
    }
    const action = traceAction(cell.slot)
    const latent = cell.slot === "S08",
      modelBase = cell.slot === "S05" || cell.slot === "S06",
      divergent = latent || modelBase
    const trace = {
      root: labRoot("synthetic-trace", ordinal),
      invocationRoot: labRoot("synthetic-invocation", ordinal),
      inputRoot: labRoot("synthetic-input", ordinal),
      method: "soldierBrain",
      ordinal: 0,
      classification: "success",
      requestProjection: {
        self: {
          id: "soldier",
          status: "ACTIVE",
          position: { x: modelBase ? 8 : 2, y: modelBase ? 9 : 3 },
        },
        hasAdvancedThisActivation: modelBase,
      },
      decisionProjection: {
        action: {
          type: action,
          ...(divergent
            ? { direction: "UP", duration: 3, priority: 2, target: "front" }
            : {}),
        },
      },
    }
    const resultEvent = {
      type: action === "TURN_TO_STONE" ? "SOLDIER_STONED" : "SOLDIER_ADVANCED",
      payload: {
        soldierId: "soldier",
        ...(divergent
          ? {
              phaseNumber: 7,
              roundNumber: 8,
              activationCount: 9,
              reason: latent ? "latent-control" : "model-base",
              cycleIndex: 4,
            }
          : {}),
      },
    }
    const execution = {
      kind: "completed" as const,
      privacy: "private_offline" as const,
      result: {
        state: {
          outcome: { type: "DRAW" },
          ...(divergent
            ? {
                phaseNumber: 7,
                roundNumber: 8,
                activationCount: 9,
                board: { bounds: { minX: 0, minY: 0, maxX: 11, maxY: 11 } },
              }
            : {}),
        },
        events: [resultEvent],
      },
      transitions: [
        {
          transitionKind: "synthetic",
          sequence: 0,
          ...(divergent
            ? {
                phaseNumber: 7,
                roundNumber: 8,
                activationCount: 9,
                cause: latent ? "latent-control" : "model-base",
                direction: "UP",
                duration: 3,
              }
            : {}),
        },
      ],
      accounting: [{ outputBytes: 2, result: { ok: true } }],
    }
    const receiptBody = {
      admission,
      candidatePlayerId: "factory-candidate",
      candidateIdentity,
      matchup,
      execution,
      traces: [trace],
    }
    const receiptRoot = deriveFactorySupervisionReceiptRoot(
      receiptBody as never,
    )
    const receiptMetadata = {
      admission,
      candidatePlayerId: "factory-candidate",
      candidateIdentity,
      matchup,
      root: receiptRoot,
    }
    const records = [
      { kind: "receipt", ordinal: 0, value: receiptMetadata },
      {
        kind: "execution",
        ordinal: 0,
        value: {
          kind: "completed",
          privacy: "private_offline",
          resultMetadata: {},
        },
      },
      { kind: "result-state", ordinal: 0, value: execution.result.state },
      { kind: "result-event", ordinal: 0, value: resultEvent },
      { kind: "transition", ordinal: 0, value: execution.transitions[0] },
      { kind: "accounting", ordinal: 0, value: execution.accounting[0] },
      { kind: "trace", ordinal: 0, value: trace },
    ]
    const bytes = new Uint8Array(
      records.flatMap((record) => [...encode(record), 10]),
    )
    const bytesRoot = publishFactoryArtifact(repository, bytes)
    const chunkRoot = put({
      schemaVersion: "factory-supervision-chunk-v1",
      ordinal: 0,
      previousRoot: null,
      bytesRoot,
      byteLength: bytes.length,
    })
    const descriptorBody = {
      schemaVersion: "factory-supervision-artifacts-v1",
      privacy: "private_offline",
      receiptRoot,
      executionRoot: labRoot(
        "factory-stored-execution-v1",
        deriveFactoryExecutionCommitment(execution as never),
      ),
      tracesRoot: deriveFactoryOrderedRecordDescriptor(
        "factory-supervision-trace",
        [trace],
      ).root,
      recordCount: records.length,
      byteLength: bytes.length,
      chunkCount: 1,
      tailRoot: chunkRoot,
    }
    const supervisionArtifactRoot = rooted(
      "factory-supervision-artifacts-v1",
      descriptorBody,
    )
    const usageRoot = put({
      schemaVersion: "factory-calibration-actual-usage-v1",
      startRoot: start.root,
      receiptRoot,
      supervisionArtifactRoot,
      totalInvocations: 1,
      candidateInvocations: 1,
      outputBytes: 2,
      retainedRecordCount: records.length,
      retainedByteLength: bytes.length,
      startedAtMs,
      completedAtMs: startedAtMs + 1,
    })
    const finalEvidenceRoot = put({
      schemaVersion: "factory-calibration-terminal-evidence-v1",
      startRoot: start.root,
      disposition: "unresolved",
      supervisionArtifactRoot,
      actualUsageRoot: usageRoot,
      pairing: "pending_retained_group",
    })
    const terminal = createFactoryAttemptTerminal({
      startRoot: start.root,
      disposition: "unresolved",
      outputRoot: supervisionArtifactRoot,
      validationRoot: validation.root,
      duplicateEvidenceRoot: labRoot("synthetic-duplicate", ordinal),
      finalEvidenceRoot,
    })
    publishFactoryAttemptTerminal(repository, start, terminal)
    terminalRoots.push(terminal.root)
    supervisionArtifactRoots.push(supervisionArtifactRoot)
    receiptRoots.set(workload.root, receiptRoot)
    const candidateBase = factoryCandidateFixture(
        proposal,
        validation,
        receiptRoot,
      ),
      candidate = {
        ...candidateBase,
        root: deriveFactoryCandidateRoot(candidateBase),
      }
    const publicationBody = {
      schemaVersion: "factory-candidate-publication-v1",
      privacy: "private_offline",
      candidate,
      independenceReceipt: {
        evidenceRoot: labRoot("synthetic-fingerprint", ordinal),
        evidenceArtifactRoot: labRoot(
          "synthetic-fingerprint-artifact",
          ordinal,
        ),
      },
      supervisionReceiptRoot: receiptRoot,
      independenceStatus: "unresolved",
    }
    const publicationRoot = rooted(
      "factory-candidate-publication-v1",
      publicationBody,
    )
    candidateArtifactRoots.push(publicationRoot)
    candidates.push({
      slot: cell.slot,
      publicationRoot,
      supervisionArtifactRoot,
      start,
      terminal,
    })
  }
  for (const group of [
    ...new Set(fresh.workloads.map((workload) => workload.pairGroup)),
  ]) {
    const workloads = fresh.workloads.filter(
      (workload) => workload.pairGroup === group,
    )
    const body = {
      schemaVersion: "factory-calibration-pairing-v1",
      privacy: "private_offline",
      pairGroup: group,
      status: "paired",
      workloadRoots: workloads.map((workload) => workload.root),
      receiptRoots: workloads.map((workload) =>
        receiptRoots.get(workload.root),
      ),
    }
    pairingArtifactRoots.push(rooted("factory-calibration-pairing-v1", body))
  }
  const input = {
    manifestArtifactRoot: prepared.artifactRoot,
    executionEvidenceArtifactRoot,
    ledgerRoot: readRetainedFactoryLedger(repository).ledgerRoot,
    terminalRoots,
    supervisionArtifactRoots,
    pairingArtifactRoots,
    candidateArtifactRoots,
    windowTerminalArtifactRoot: null,
  }
  const assessment = assessFactoryIndependence(repository, input)
  return {
    repository,
    input,
    assessment,
    candidates,
    slots,
    directory: repository.directory,
    read: (root: LabRoot) => readFactoryCanonicalRecord(repository, root),
    put,
    rooted,
  }
}
