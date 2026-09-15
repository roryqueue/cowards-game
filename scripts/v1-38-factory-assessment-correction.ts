import { exactLabKeys, labRoot, type LabRoot } from "../packages/strategy-lab/src/contracts.js"
import { readFactoryArtifact, type FactoryRepository } from "../packages/strategy-lab/src/factory/repository.js"
import { readFactoryCanonicalRecord, requireFactoryRecordRoot } from "./v1-38-factory-fresh-evidence.js"
import { factoryAssessmentImplementationManifest } from "./v1-38-factory-implementation.js"

// This is a data-only correction, not authority for a new execution. The original
// full source snapshot stays bound; only these independently reviewed reader files
// may differ. In particular observations, numerics, generators and runtime cannot.
const READER_FILES = new Set([
  "scripts/assess-v1-38-factory-independence.ts",
  "scripts/v1-38-factory-execution-evidence.ts",
  "scripts/v1-38-factory-implementation.ts",
  "scripts/v1-38-factory-assessment-correction.ts",
  "scripts/v1-38-factory-observation-equality.ts",
])
const fail = (code: string): never => { throw new TypeError(`FACTORY_CORRECTION_${code}`) }
const rootPattern = /^sha256:[a-f0-9]{64}$/u
const asRoot = (value: unknown): LabRoot => typeof value === "string" && rootPattern.test(value) ? value as LabRoot : fail("ROOT")
type Entry = {path: string; root: string}
const entries = (value: unknown): Entry[] => {
  if (!Array.isArray(value) || value.length === 0) return fail("MANIFEST")
  let previous = ""
  return value.map(item => {
    if (!item || !exactLabKeys(item,["path","root"]) || typeof item.path !== "string" || item.path <= previous || item.path.startsWith("/") || item.path.split("/").includes("..")) return fail("MANIFEST")
    previous = item.path
    return {path:item.path,root:asRoot(item.root)}
  })
}
export const factoryAssessmentCorrectionDiff = (historical: unknown, current: unknown): readonly string[] => {
  const before = new Map(entries(historical).map(entry=>[entry.path,entry.root]))
  const after = new Map(entries(current).map(entry=>[entry.path,entry.root]))
  const changed = [...new Set([...before.keys(),...after.keys()])].filter(path=>before.get(path)!==after.get(path)).sort()
  if (changed.length === 0 || changed.some(path=>!READER_FILES.has(path))) return fail("EXECUTION_SOURCE_CHANGED")
  return changed
}
const readPassedReview = (repository: FactoryRepository, root: LabRoot, corrected = false) => {
  const review = readFactoryCanonicalRecord(repository,root)
  requireFactoryRecordRoot(review,"factory-source-review-v1")
  if (!exactLabKeys(review,["schemaVersion","sourceCommit","implementationRoot","reviewerId","authorIds","status","unresolvedFindings","reportArtifactRoot","root"]) || review.schemaVersion!=="factory-source-review-v1" || typeof review.sourceCommit!=="string" || !/^[a-f0-9]{40}$/u.test(review.sourceCommit) || review.status!=="passed" || review.unresolvedFindings!==0 || typeof review.reviewerId!=="string" || !review.reviewerId || !Array.isArray(review.authorIds) || !review.authorIds.length || review.authorIds.some(id=>typeof id!=="string"||!id) || review.authorIds.includes(review.reviewerId)) return fail("REVIEW")
  asRoot(review.implementationRoot)
  const report = new TextDecoder("utf-8",{fatal:true}).decode(readFactoryArtifact(repository,asRoot(review.reportArtifactRoot)))
  if (!report.includes(review.sourceCommit) || (corrected && !report.includes(String(review.implementationRoot)))) return fail("REVIEW_REPORT")
  return review
}
export interface FactoryAssessmentCorrection {
  readonly artifactRoot: LabRoot
  readonly historicalImplementationRoot: LabRoot
  readonly currentImplementationRoot: LabRoot
  readonly executionEvidenceArtifactRoot: LabRoot
  readonly repositoryDirectory: string
}
const issued = new WeakSet<FactoryAssessmentCorrection>()
/** Reopen every link. A caller-supplied root or cast cannot waive the source guard. */
export const readFactoryAssessmentCorrection = (repository: FactoryRepository, artifactRoot: LabRoot, input: unknown): FactoryAssessmentCorrection => {
  const correction = readFactoryCanonicalRecord(repository,artifactRoot)
  requireFactoryRecordRoot(correction,"factory-assessment-correction-v1")
  if (!exactLabKeys(correction,["schemaVersion","reason","executionEvidenceArtifactRoot","historicalManifestArtifactRoot","assessorReviewArtifactRoot","failureArtifactRoot","inputRoot","root"]) || correction.schemaVersion!=="factory-assessment-correction-v1" || correction.reason!=="positive-control-observation-equality-envelope" || correction.inputRoot!==labRoot("factory-assessment-correction-input-v1",input)) return fail("BINDING")
  const executionRoot = asRoot(correction.executionEvidenceArtifactRoot)
  const execution = readFactoryCanonicalRecord(repository,executionRoot)
  requireFactoryRecordRoot(execution,"factory-calibration-execution-evidence-v1")
  if (!input || typeof input!=="object" || (input as Record<string,unknown>).executionEvidenceArtifactRoot!==executionRoot) return fail("INPUT")
  const oldReview = readPassedReview(repository,asRoot(execution.sourceReviewArtifactRoot))
  if (execution.sourceCommit!==oldReview.sourceCommit) return fail("HISTORICAL_SOURCE")
  const historical = readFactoryCanonicalRecord(repository,asRoot(correction.historicalManifestArtifactRoot))
  if (!exactLabKeys(historical,["entries","root"]) || labRoot("factory-reviewed-implementation-v2",entries(historical.entries))!==historical.root || historical.root!==oldReview.implementationRoot) return fail("HISTORICAL_MANIFEST")
  const current = factoryAssessmentImplementationManifest()
  factoryAssessmentCorrectionDiff(historical.entries,current.entries)
  const newReview = readPassedReview(repository,asRoot(correction.assessorReviewArtifactRoot),true)
  if (newReview.implementationRoot!==current.root || newReview.sourceCommit===oldReview.sourceCommit) return fail("CURRENT_REVIEW")
  const failure = readFactoryCanonicalRecord(repository,asRoot(correction.failureArtifactRoot))
  requireFactoryRecordRoot(failure,"factory-264-assessment-failure-v1")
  if (failure.schemaVersion!=="factory-264-assessment-failure-v1" || failure.sourceCommit!==oldReview.sourceCommit || failure.implementationRoot!==oldReview.implementationRoot || labRoot("factory-assessment-correction-input-v1",failure.input)!==correction.inputRoot || failure.error!=="LAB_CANONICAL_VALUE" || failure.stage!=="positive-control-merged-observation-equality" || failure.assessmentArtifactRoot!==null || failure.thresholdArtifactRoot!==null) return fail("ORIGINAL_FAILURE")
  const context = Object.freeze({artifactRoot,historicalImplementationRoot:asRoot(historical.root),currentImplementationRoot:current.root,executionEvidenceArtifactRoot:executionRoot,repositoryDirectory:repository.directory})
  issued.add(context)
  return context
}
export const correctedFactoryExecutionImplementationRoot = (context: FactoryAssessmentCorrection, repository: FactoryRepository, artifactRoot: LabRoot, currentRoot: LabRoot): LabRoot => {
  if (!issued.has(context) || context.repositoryDirectory!==repository.directory || context.executionEvidenceArtifactRoot!==artifactRoot || context.currentImplementationRoot!==currentRoot) return fail("CONTEXT")
  return context.historicalImplementationRoot
}
