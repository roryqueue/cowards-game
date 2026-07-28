export const runtimeJsPackage = "@cowards/runtime-js"
export const RUNTIME_JS_NAME = "runtime-js"

export { createStrategyRevisionId, hashStrategySource } from "./hash.js"
export {
  FORBIDDEN_SOURCE_PATTERNS,
  validateStrategySource,
} from "./validation.js"
export { transpileStrategySource } from "./transpile.js"
export { buildTypeScriptSourceArtifact } from "./source-artifact.js"
export { buildStrategyRevision, isValidStrategyRevision } from "./revision.js"
export { buildStrategyRevisionV117 } from "./revision-v1-17.js"
export {
  COUNTED_TYPESCRIPT_RUNTIME_V1_18,
  createTypeScriptAdapterBuildIdentityV118,
  createTypeScriptRuntimeCompilerIdentityV118,
} from "./revision-v1-18.js"
export {
  CANDIDATE_OBSERVATION_TRANSPORT_V1_19,
  admitCandidateObservationTransportV119,
  createCandidateObservationTransportRequestV119,
  executeCandidateObservationTransportV119,
  type AdmittedCandidateObservationV119,
  type CandidateObservationTransportRequestV119,
  type CandidateObservationTransportResultV119,
  type CreateCandidateObservationTransportRequestV119,
} from "./revision-v1-19.js"
export {
  createCountedTypeScriptSupervisedAdapterV118,
  isVerifiedCountedTypeScriptSupervisedResultV118,
  type CountedTypeScriptSupervisedAdapterV118,
  type CountedTypeScriptSupervisedExecutionInputV118,
  type CountedTypeScriptSupervisedResultV118,
  type RuntimeEvidenceSignatureV118,
  type TypeScriptLanguageIdentityObservationV118,
  type TypeScriptSignedEvidenceV118,
  type TypeScriptSupervisorHostLaunchResultV118,
  type TypeScriptSupervisorHostLaunchV118,
} from "./supervised-subprocess-adapter.js"
export type {
  StrategyRevision,
  StrategyRevisionValidationReport,
} from "@cowards/spec"
