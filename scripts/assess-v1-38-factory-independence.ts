import type { LabRoot } from "../packages/strategy-lab/src/contracts.js"
import type { FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import type { NumericComparison, NumericControlTable } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
export const decideFactoryIndependence = (_controls: NumericControlTable, _baseEdges: Record<string,NumericComparison>, _reasons: readonly string[], _sharing: number): {status:"affirmed"|"unresolved";reasons:readonly string[]} => ({status:"unresolved",reasons:["unimplemented"]})
export interface FactoryAssessmentInput {
  readonly manifestArtifactRoot: LabRoot; readonly executionEvidenceArtifactRoot: LabRoot
  readonly ledgerRoot: LabRoot; readonly terminalRoots: readonly LabRoot[]
  readonly supervisionArtifactRoots: readonly LabRoot[]; readonly pairingArtifactRoots: readonly LabRoot[]
  readonly candidateArtifactRoots: readonly LabRoot[]
  readonly windowTerminalArtifactRoot?: LabRoot | null
}
export interface FactoryAssessmentResult {
  readonly status: "affirmed" | "unresolved"; readonly reasons: readonly string[]
  readonly assessmentRoot: LabRoot; readonly assessmentArtifactRoot: LabRoot | null
  readonly thresholdArtifactRoot: LabRoot | null; readonly manifestRoot: LabRoot; readonly allocationRoot: LabRoot
}
export const assessFactoryIndependence = (_repository: FactoryRepository, _input: FactoryAssessmentInput, _options: {persist?: boolean} = {}): FactoryAssessmentResult => { throw new TypeError("FACTORY_ASSESSMENT_UNIMPLEMENTED") }
