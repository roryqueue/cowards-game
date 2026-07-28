/* eslint-disable no-restricted-imports -- Repository evaluators consume selected source constants directly. */
import { STRATEGY_RUNTIME_ABI_VERSION } from "../packages/spec/src/index.ts"

export const HISTORICAL_RUNTIME_ABI_V1_14 =
  "strategy-runtime-abi-v1.14" as const

/**
 * Projects a historical guest fixture into the selected runtime ABI without
 * mutating the versioned source or its committed evidence.
 */
export const projectSelectedRuntimeAbiSource = (source: string): string =>
  source.replaceAll(HISTORICAL_RUNTIME_ABI_V1_14, STRATEGY_RUNTIME_ABI_VERSION)
