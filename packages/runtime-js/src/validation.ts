import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_SOURCE_BYTES,
  type StrategyRevisionValidationCode,
  type StrategyRevisionValidationIssue,
  type StrategyRevisionValidationReport,
} from "@cowards/spec"
import { hashStrategySource } from "./hash.js"
import { transpileStrategySource } from "./transpile.js"

export const FORBIDDEN_SOURCE_PATTERNS = [
  {
    pattern: "static import",
    code: "IMPORT_NOT_ALLOWED",
    regex: /(^|\n)\s*import\s+(?:[\s\S]*?\s+from\s+)?["'][^"']+["']/m,
  },
  {
    pattern: "dynamic import",
    code: "IMPORT_NOT_ALLOWED",
    regex: /\bimport\s*\(/,
  },
  { pattern: "eval", code: "FORBIDDEN_PATTERN", regex: /\beval\s*\(/ },
  {
    pattern: "Function constructor",
    code: "FORBIDDEN_PATTERN",
    regex: /\b(?:new\s+)?Function\s*\(/,
  },
  {
    pattern: "constructor recovery",
    code: "FORBIDDEN_PATTERN",
    regex: /\.constructor\s*(?:\.|\[|\()/,
  },
  {
    pattern: "process.env",
    code: "FORBIDDEN_PATTERN",
    regex: /\bprocess\.env\b/,
  },
  { pattern: "process", code: "FORBIDDEN_PATTERN", regex: /\bprocess\b/ },
  { pattern: "require", code: "FORBIDDEN_PATTERN", regex: /\brequire\s*\(/ },
  { pattern: "node:fs", code: "FORBIDDEN_PATTERN", regex: /["']node:fs["']/ },
  {
    pattern: "fs/promises",
    code: "FORBIDDEN_PATTERN",
    regex: /["']fs\/promises["']/,
  },
  {
    pattern: "node:http",
    code: "FORBIDDEN_PATTERN",
    regex: /["']node:http["']/,
  },
  {
    pattern: "node:https",
    code: "FORBIDDEN_PATTERN",
    regex: /["']node:https["']/,
  },
  { pattern: "fetch", code: "FORBIDDEN_PATTERN", regex: /\bfetch\s*\(/ },
  { pattern: "Date.now", code: "FORBIDDEN_PATTERN", regex: /\bDate\.now\s*\(/ },
  { pattern: "new Date", code: "FORBIDDEN_PATTERN", regex: /\bnew\s+Date\b/ },
  {
    pattern: "Math.random",
    code: "FORBIDDEN_PATTERN",
    regex: /\bMath\.random\s*\(/,
  },
  { pattern: "Worker", code: "FORBIDDEN_PATTERN", regex: /\bWorker\s*\(/ },
  {
    pattern: "worker_threads",
    code: "FORBIDDEN_PATTERN",
    regex: /\bworker_threads\b/,
  },
  {
    pattern: "child_process",
    code: "FORBIDDEN_PATTERN",
    regex: /\bchild_process\b/,
  },
  {
    pattern: "WebAssembly",
    code: "FORBIDDEN_PATTERN",
    regex: /\bWebAssembly\b/,
  },
  {
    pattern: "npm install",
    code: "FORBIDDEN_PATTERN",
    regex: /\bnpm\s+install\b/,
  },
  { pattern: "pnpm add", code: "FORBIDDEN_PATTERN", regex: /\bpnpm\s+add\b/ },
  { pattern: "yarn add", code: "FORBIDDEN_PATTERN", regex: /\byarn\s+add\b/ },
] as const satisfies readonly {
  pattern: string
  code: StrategyRevisionValidationCode
  regex: RegExp
}[]

const sourceByteLength = (source: string): number =>
  new TextEncoder().encode(source).length

const issue = (
  code: StrategyRevisionValidationCode,
  message: string,
  pattern?: string,
): StrategyRevisionValidationIssue => ({
  code,
  severity: "error",
  message,
  ...(pattern === undefined ? {} : { pattern }),
})

const ASYNC_METHOD_PATTERNS = [
  /\basync\s+selectActivations\s*\(/,
  /\bselectActivations\s*:\s*async\b/,
  /\basync\s+soldierBrain\s*\(/,
  /\bsoldierBrain\s*:\s*async\b/,
]

export const validateStrategySource = (
  source: string,
  options?: {
    runtimeVersion?: string
    specVersion?: string
    engineVersion?: string
  },
): StrategyRevisionValidationReport => {
  const sourceBytes = sourceByteLength(source)
  const errors: StrategyRevisionValidationIssue[] = []
  const forbiddenPatterns: string[] = []

  if (sourceBytes > STRATEGY_SOURCE_BYTES) {
    errors.push(
      issue(
        "SOURCE_TOO_LARGE",
        `Strategy source exceeds ${STRATEGY_SOURCE_BYTES} bytes`,
      ),
    )
  }

  for (const forbidden of FORBIDDEN_SOURCE_PATTERNS) {
    if (forbidden.regex.test(source)) {
      forbiddenPatterns.push(forbidden.pattern)
      errors.push(
        issue(
          forbidden.code,
          `Strategy source contains forbidden capability: ${forbidden.pattern}`,
          forbidden.pattern,
        ),
      )
    }
  }

  if (ASYNC_METHOD_PATTERNS.some((pattern) => pattern.test(source))) {
    errors.push(
      issue(
        "ASYNC_METHOD_NOT_ALLOWED",
        "Strategy methods must return synchronously",
        "async strategy method",
      ),
    )
  }

  if (!/\bexport\s+default\b/.test(source)) {
    errors.push(
      issue(
        "MISSING_DEFAULT_EXPORT",
        "Strategy source must contain export default",
      ),
    )
  }

  if (!/\bselectActivations\b/.test(source)) {
    errors.push(
      issue(
        "MISSING_SELECT_ACTIVATIONS",
        "Strategy source must define selectActivations",
      ),
    )
  }

  if (!/\bsoldierBrain\b/.test(source)) {
    errors.push(
      issue(
        "MISSING_SOLDIER_BRAIN",
        "Strategy source must define soldierBrain",
      ),
    )
  }

  const transpiled = transpileStrategySource(source)
  if (!transpiled.ok) {
    errors.push(
      issue(
        "TRANSPILE_FAILED",
        `Strategy source failed to transpile: ${transpiled.message}`,
      ),
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    sourceBytes,
    forbiddenPatterns,
    sourceHash: hashStrategySource(source),
    runtimeVersion: options?.runtimeVersion ?? COMPATIBILITY_VERSIONS.runtimeJs,
    engineCompatibility: {
      spec: options?.specVersion ?? COMPATIBILITY_VERSIONS.spec,
      engine: options?.engineVersion ?? COMPATIBILITY_VERSIONS.engine,
    },
  }
}
