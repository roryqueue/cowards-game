import { admitCanonicalJsonBytes } from "@cowards/spec"
import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { admitFactoryCalibrationManifest, admitFactoryCalibrationWorkload, createFactoryCalibrationWorkload, type FactoryCalibrationManifest } from "../packages/strategy-lab/src/factory/calibration.js"
import { admitFactoryAuthoringAllocation, FACTORY_SOURCE_RECIPES, type FactorySourceSlot } from "./v1-38-factory-allocation.js"
import { createFreshFactoryCalibrationCells } from "./prepare-v1-38-factory-calibration.js"
import { readFactoryIngestion, type FactoryIngestionRecord } from "./ingest-v1-38-factory-packet.js"
import { FACTORY_CONTROL_BASES, type FactoryControlSlot } from "./v1-38-factory-controls.js"

const fail = (code: string): never => { throw new TypeError(`FACTORY_FRESH_${code}`) }
const same = (left: unknown, right: unknown) => labRoot("factory-fresh-compare-v1", left) === labRoot("factory-fresh-compare-v1", right)
export const readFactoryCanonicalRecord = (repository: FactoryRepository, artifactRoot: LabRoot): Record<string, unknown> => {
  const result = admitCanonicalJsonBytes(readFactoryArtifact(repository, artifactRoot), { profile: "canonical-manifest", operation: "require-canonical" })
  if (!result.ok || !result.value || typeof result.value !== "object" || Array.isArray(result.value)) return fail("ARTIFACT")
  return result.value as Record<string, unknown>
}
export const requireFactoryRecordRoot = (value: Record<string, unknown>, domain: string, expected?: LabRoot) => {
  const { root, ...rest } = value
  if (root !== labRoot(domain, rest) || (expected !== undefined && root !== expected)) return fail("ROOT")
}
/** Reserve five seconds for bounded cleanup; never extend the 120s worker cap. */
export const remainingFreshWorkloadLifetime = (firstStartedAtMs: number, nowMs: number): number => {
  if (![firstStartedAtMs, nowMs].every(Number.isSafeInteger) || firstStartedAtMs < 0 || nowMs < firstStartedAtMs) return fail("CLOCK")
  return Math.max(0, Math.min(120_000, 5_400_000 - (nowMs - firstStartedAtMs) - 5000))
}

/** Read-only source/allocation reopening. Does not validate a guest or grant execution. */
export const readFreshFactoryCalibration = (repository: FactoryRepository, supplied: FactoryCalibrationManifest, opponentIdentityRoot: LabRoot) => {
  if (supplied.maxAttempts !== 48 || supplied.maxInvocationsPerAttempt !== 256 || supplied.maxLifetimeMs !== 120_000) return fail("BOUNDS")
  const manifest = admitFactoryCalibrationManifest(supplied)
  const authorization = readFactoryCanonicalRecord(repository, manifest.authorizationArtifactRoot)
  const keys = ["schemaVersion", "status", "allocationRoot", "sourceSlots", "slotIngestionArtifactRoots", "cellRoots", "workloadArtifactRoots", "geometryDesign", "competitiveClaim", "root"]
  if (!exactLabKeys(authorization, keys) || authorization.schemaVersion !== "factory-calibration-authorization-v2" || authorization.status !== "authorized" || authorization.geometryDesign !== "two_geometry_side_confounded_pilot" || authorization.competitiveClaim !== "none") return fail("AUTHORIZATION")
  requireFactoryRecordRoot(authorization, "factory-calibration-authorization-v2", manifest.authorizationRoot)
  const allocation = admitFactoryAuthoringAllocation(readFactoryCanonicalRecord(repository, manifest.allocationArtifactRoot))
  if (allocation.root !== manifest.allocationRoot || authorization.allocationRoot !== allocation.root || !same(authorization.sourceSlots, allocation.sourceSlots)) return fail("ALLOCATION")
  const slots = authorization.slotIngestionArtifactRoots as Record<FactorySourceSlot, LabRoot>
  if (!exactLabKeys(slots, Object.keys(FACTORY_SOURCE_RECIPES)) || new Set(Object.values(slots)).size !== 12 || manifest.ingestions.length !== 12 || manifest.workloads.length !== 48) return fail("SLOTS")
  const ingestions = {} as Record<FactorySourceSlot, Readonly<FactoryIngestionRecord>>
  const bases = { S01: "emitTacticalFactoryPacket", S03: "emitTeacherFactoryPacket", S05: "emitModelFactoryPacket" } as const
  for (const slot of allocation.sourceSlots) {
    const record = readFactoryIngestion(repository, slots[slot]); ingestions[slot] = record
    const listed = manifest.ingestions.find((entry) => entry.artifactRoot === slots[slot])
    if (!listed || !same(listed, { artifactRoot: slots[slot], packetRoot: record.packetRoot, sourceRoot: record.sourceRoot, producerIdentity: record.producerIdentity, origin: record.origin, evidenceClass: record.evidenceClass }) || record.packet.split !== "development") return fail("INGESTION")
    if (Object.hasOwn(bases, slot)) {
      if (record.producerIdentity !== bases[slot as keyof typeof bases] || record.evidenceClass !== "real_producer") return fail("BASE")
    } else {
      const proof = record.producerInput as { slot: unknown; baseIngestionArtifactRoot: unknown }
      if (record.producerIdentity !== "materializeFactoryCalibrationControl" || record.evidenceClass !== "calibration_only" || proof.slot !== slot || proof.baseIngestionArtifactRoot !== slots[FACTORY_CONTROL_BASES[slot as FactoryControlSlot]]) return fail("CONTROL")
    }
  }
  const cells = createFreshFactoryCalibrationCells()
  if (!same(authorization.cellRoots, cells.map((cell) => cell.root)) || !same(authorization.workloadArtifactRoots, manifest.workloads.map((entry) => entry.artifactRoot))) return fail("CELLS")
  const workloads = cells.map((cell, index) => {
    const reference = manifest.workloads[index]!, workload = admitFactoryCalibrationWorkload(readFactoryCanonicalRecord(repository, reference.artifactRoot))
    const expected = createFactoryCalibrationWorkload({ candidateIngestionArtifactRoot: slots[cell.slot], pairGroup: `${cell.slot.toLowerCase()}-${cell.block.toLowerCase()}`, pairAxis: "initialInitiative", condition: { arenaId: cell.arenaId, seed: cell.seed, candidateSide: cell.candidateSide, initialInitiative: cell.initialInitiative, maxPhases: 1 }, opponent: { kind: "fixed_mechanics", opponentId: "factory-fixed-mechanics-v1", identityRoot: opponentIdentityRoot }, budget: { maxInvocations: 256, maxLifetimeMs: 120_000 }, lineageManifestArtifactRoot: workload.lineageManifestArtifactRoot, dependencyManifestArtifactRoot: workload.dependencyManifestArtifactRoot })
    if (workload.root !== expected.root || reference.root !== workload.root || reference.candidateIngestionArtifactRoot !== workload.candidateIngestionArtifactRoot || reference.pairGroup !== workload.pairGroup) return fail("WORKLOAD")
    return workload
  })
  const protocol = readFactoryCanonicalRecord(repository, manifest.protocolArtifactRoot)
  if (!exactLabKeys(protocol, ["schemaVersion", "phase", "purpose", "split", "root"]) || protocol.schemaVersion !== "factory-calibration-protocol-v1" || protocol.phase !== "264" || protocol.purpose !== "development-independence-calibration" || protocol.split !== "development") return fail("PROTOCOL")
  requireFactoryRecordRoot(protocol, "factory-calibration-protocol-v1", manifest.protocolRoot)
  return { manifest, authorization, allocation, slots, ingestions, cells, workloads }
}
