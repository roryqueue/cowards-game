export const runtimeJsPackage = "@cowards/runtime-js"
export const RUNTIME_JS_NAME = "runtime-js"

export {
  createStrategyRevisionId,
  hashStrategySource,
  stableStringify,
} from "./hash.js"

export type {
  StrategyRevision,
  StrategyRevisionValidationReport,
} from "@cowards/spec"
