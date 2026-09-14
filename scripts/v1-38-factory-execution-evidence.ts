import { createHash } from "node:crypto"
import { type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"

export interface FactoryAuthoringRecordRefs {
  readonly start: LabRoot; readonly request: LabRoot; readonly stdin: LabRoot; readonly response: LabRoot
  readonly source: LabRoot | null; readonly terminal: LabRoot; readonly cleanup: LabRoot
}
export interface FactoryExecutionEvidence {
  readonly schemaVersion: "factory-calibration-execution-evidence-v1"; readonly root: LabRoot
  readonly manifestRoot: LabRoot; readonly sourceCommit: string; readonly sourceReviewArtifactRoot: LabRoot
  readonly authoring: readonly FactoryAuthoringRecordRefs[]
  readonly teacherSearchArtifactRoot: LabRoot; readonly teacherTrainingArtifactRoot: LabRoot
  readonly sharedHelperAuditArtifactRoot: LabRoot
  readonly negativeWitnessArtifactRoots: Readonly<Record<"S01" | "S03" | "S05", LabRoot>>
}
export const factoryEvidenceByteRoot = (bytes: Uint8Array | string): LabRoot => `sha256:${createHash("sha256").update(bytes).digest("hex")}`
export const verifyFactoryAuthoringRecords = (_repository: FactoryRepository, _references: readonly FactoryAuthoringRecordRefs[], _bundle: unknown): void => { throw new TypeError("AUTHORING_RECORDS_UNIMPLEMENTED") }
