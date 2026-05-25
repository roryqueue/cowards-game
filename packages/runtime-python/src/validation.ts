import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
import { spawnSync } from "node:child_process"
import {
  COMPATIBILITY_VERSIONS,
  STRATEGY_SOURCE_BYTES,
  StrategyRevisionSchema,
  runtimeCompatibilityKey,
  type StrategyRevision,
  type StrategyRevisionMetadata,
  type StrategyRevisionValidationIssue,
  type StrategyRevisionValidationReport,
} from "@cowards/spec"
import { pythonExperimentalRuntimeMetadata } from "./metadata.js"
import {
  PYTHON_RUNTIME_ENVIRONMENT,
  PYTHON_RUNTIME_EXECUTABLE,
  pythonIsolatedHostArgs,
} from "./python-host-config.js"

const validationHostPath = decodeURIComponent(
  new URL("./python_validation_host.py", import.meta.url).pathname,
)

const hashStrategySource = (source: string): string =>
  createHash("sha256").update(source).digest("hex")

const issue = (
  code: StrategyRevisionValidationIssue["code"],
  message: string,
  options: Omit<
    StrategyRevisionValidationIssue,
    "code" | "severity" | "message"
  > = {},
): StrategyRevisionValidationIssue => ({
  code,
  severity: "error",
  message,
  ...options,
})

interface PythonValidationHostIssue {
  code: StrategyRevisionValidationIssue["code"]
  message: string
  pattern?: string | undefined
  line?: number | undefined
  column?: number | undefined
}

interface PythonValidationHostResponse {
  ok: boolean
  issues?: PythonValidationHostIssue[] | undefined
  forbiddenPatterns?: string[] | undefined
}

export const pythonValidationHostArgs = (): readonly string[] => [
  ...pythonIsolatedHostArgs(validationHostPath),
]

const validationIssueMetadata = (
  code: StrategyRevisionValidationIssue["code"],
  pattern?: string | undefined,
): Pick<
  StrategyRevisionValidationIssue,
  "constraint" | "remediation" | "reference"
> => {
  switch (code) {
    case "IMPORT_NOT_ALLOWED":
    case "FORBIDDEN_PATTERN":
    case "FORBIDDEN_CAPABILITY":
      return {
        constraint:
          "Python Strategies must be self-contained and cannot use host, filesystem, network, import, package, dynamic execution, or process capabilities.",
        remediation: pattern
          ? `Remove ${pattern} and use only Strategy input data.`
          : "Use only Strategy input data.",
        reference: "runtime/capabilities",
      }
    case "MISSING_SELECT_ACTIVATIONS":
      return {
        constraint: "Python Strategy API requires select_activations(input).",
        remediation:
          "Add select_activations that returns activationOrders and strategyMemory.",
        reference: "examples/python-exhibition-beta",
      }
    case "MISSING_SOLDIER_BRAIN":
      return {
        constraint: "Python Strategy API requires soldier_brain(input).",
        remediation: "Add soldier_brain that returns action and soldierMemory.",
        reference: "examples/python-exhibition-beta",
      }
    case "ASYNC_METHOD_NOT_ALLOWED":
      return {
        constraint: "Python Strategy methods must be synchronous.",
        remediation: "Use deterministic synchronous functions.",
        reference: "runtime/capabilities",
      }
    case "TRANSPILE_FAILED":
      return {
        constraint: "Python source must pass AST parse and compile checks.",
        remediation: "Fix the syntax near the reported location.",
        reference: "examples/python-exhibition-beta",
      }
    default:
      return {
        constraint: "Python Strategy validation must pass before execution.",
        remediation: "Review the reported validation issue.",
        reference: "runtime/validation",
      }
  }
}

const runPythonValidationHost = (
  source: string,
): PythonValidationHostResponse => {
  const result = spawnSync(
    PYTHON_RUNTIME_EXECUTABLE,
    pythonValidationHostArgs(),
    {
      input: JSON.stringify({ source }),
      encoding: "utf8",
      env: PYTHON_RUNTIME_ENVIRONMENT,
      shell: false,
      timeout: 1_000,
      maxBuffer: 128 * 1024,
    },
  )
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      issues: [
        {
          code: "TRANSPILE_FAILED",
          message: "Python validation host failed closed.",
          pattern: "validation-host",
        },
      ],
      forbiddenPatterns: [],
    }
  }
  try {
    return JSON.parse(result.stdout ?? "") as PythonValidationHostResponse
  } catch {
    return {
      ok: false,
      issues: [
        {
          code: "TRANSPILE_FAILED",
          message: "Python validation host returned malformed diagnostics.",
          pattern: "validation-host",
        },
      ],
      forbiddenPatterns: [],
    }
  }
}

export const validatePythonStrategySource = (
  source: string,
): StrategyRevisionValidationReport => {
  const sourceBytes = Buffer.byteLength(source)
  const sourceHash = hashStrategySource(source)
  const errors: StrategyRevisionValidationIssue[] = []
  const forbidden = new Set<string>()

  if (sourceBytes > STRATEGY_SOURCE_BYTES) {
    errors.push(
      issue(
        "SOURCE_TOO_LARGE",
        `Strategy source exceeds ${STRATEGY_SOURCE_BYTES} bytes`,
        {
          constraint: `Python Strategy source must be ${STRATEGY_SOURCE_BYTES} bytes or less.`,
          remediation: "Remove unused source or helper data.",
          reference: "runtime/limits",
        },
      ),
    )
  }

  const hostReport = runPythonValidationHost(source)
  for (const pattern of hostReport.forbiddenPatterns ?? []) {
    forbidden.add(pattern)
  }
  for (const hostIssue of hostReport.issues ?? []) {
    if (hostIssue.pattern) {
      forbidden.add(hostIssue.pattern)
    }
    errors.push(
      issue(hostIssue.code, hostIssue.message, {
        pattern: hostIssue.pattern,
        line: hostIssue.line,
        column: hostIssue.column,
        ...validationIssueMetadata(hostIssue.code, hostIssue.pattern),
      }),
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [
      {
        code: "NON_COUNTED_RUNTIME",
        severity: "warning",
        message:
          "Python is a non-counted exhibition beta runtime and not ranked/counted eligible.",
        constraint:
          "Python may run only in non-counted Workshop or exhibition beta proof paths in v1.18.",
        remediation: "Use JS/TS for counted play.",
        reference: "runtime/counting",
      },
    ],
    sourceBytes,
    forbiddenPatterns: [...forbidden].sort(),
    sourceHash,
    runtimeVersion: pythonExperimentalRuntimeMetadata().adapter.version,
    engineCompatibility: {
      spec: COMPATIBILITY_VERSIONS.spec,
      engine: COMPATIBILITY_VERSIONS.engine,
    },
  }
}

export const buildPythonStrategyRevision = (input: {
  source: string
  strategyId?: string | undefined
  metadata?: StrategyRevisionMetadata | undefined
}): StrategyRevision => {
  const runtime = pythonExperimentalRuntimeMetadata()
  const validation = validatePythonStrategySource(input.source)
  const compatibility = runtimeCompatibilityKey({
    runtime,
    sourceHash: validation.sourceHash,
    specVersion: COMPATIBILITY_VERSIONS.spec,
    engineVersion: COMPATIBILITY_VERSIONS.engine,
  })
  const compatibilityHash = createHash("sha256")
    .update(JSON.stringify(compatibility))
    .digest("hex")

  return StrategyRevisionSchema.parse({
    id: `strategy-revision:python:${validation.sourceHash}:${compatibilityHash.slice(0, 16)}`,
    ...(input.strategyId === undefined ? {} : { strategyId: input.strategyId }),
    source: input.source,
    sourceHash: validation.sourceHash,
    sourceBytes: validation.sourceBytes,
    runtime,
    engineCompatibility: validation.engineCompatibility,
    validation,
    metadata: input.metadata ?? {},
  })
}
