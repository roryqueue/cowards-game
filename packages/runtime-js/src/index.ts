export const runtimeJsPackage = "@cowards/runtime-js"
export const RUNTIME_JS_NAME = "runtime-js"

export {
  createStrategyRevisionId,
  hashStrategySource,
  stableStringify,
} from "./hash.js"
export {
  FORBIDDEN_SOURCE_PATTERNS,
  validateStrategySource,
} from "./validation.js"
export { transpileStrategySource } from "./transpile.js"
export { buildStrategyRevision, isValidStrategyRevision } from "./revision.js"

export type {
  StrategyRevision,
  StrategyRevisionValidationReport,
} from "@cowards/spec"
