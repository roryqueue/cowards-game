import { createHash } from "node:crypto"
import { Buffer } from "node:buffer"
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

const forbiddenPatterns = [
  { pattern: "import", regex: /(^|\n)\s*(from\s+\S+\s+)?import\s+/m },
  { pattern: "__import__", regex: /\b__import__\s*\(/ },
  { pattern: "open", regex: /\bopen\s*\(/ },
  { pattern: "exec", regex: /\bexec\s*\(/ },
  { pattern: "eval", regex: /\beval\s*\(/ },
  { pattern: "compile", regex: /\bcompile\s*\(/ },
  { pattern: "globals", regex: /\bglobals\s*\(/ },
  { pattern: "locals", regex: /\blocals\s*\(/ },
  { pattern: "getattr", regex: /\bgetattr\s*\(/ },
  { pattern: "setattr", regex: /\bsetattr\s*\(/ },
  { pattern: "__", regex: /__/ },
  { pattern: "socket", regex: /\bsocket\b/ },
  { pattern: "subprocess", regex: /\bsubprocess\b/ },
  { pattern: "pathlib", regex: /\bpathlib\b/ },
  { pattern: "site-packages", regex: /\bsite-packages\b/ },
] as const

const syntaxLocation = (
  source: string,
): { line: number; column: number } | null => {
  const lines = source.split("\n")
  const stack: { char: string; line: number; column: number }[] = []
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" }
  const closing = new Set(Object.values(pairs))
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]!
    for (let columnIndex = 0; columnIndex < line.length; columnIndex += 1) {
      const char = line[columnIndex]!
      if (char in pairs) {
        stack.push({ char, line: lineIndex + 1, column: columnIndex })
      } else if (closing.has(char)) {
        const top = stack.pop()
        if (!top || pairs[top.char] !== char) {
          return { line: lineIndex + 1, column: columnIndex }
        }
      }
    }
  }
  const unclosed = stack.pop()
  return unclosed ? { line: unclosed.line, column: unclosed.column } : null
}

export const validatePythonStrategySource = (
  source: string,
): StrategyRevisionValidationReport => {
  const sourceBytes = Buffer.byteLength(source)
  const sourceHash = hashStrategySource(source)
  const errors: StrategyRevisionValidationIssue[] = []
  const forbidden: string[] = []

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

  const syntax = syntaxLocation(source)
  if (syntax) {
    errors.push(
      issue("TRANSPILE_FAILED", "Python source failed parse/compile checks.", {
        line: syntax.line,
        column: syntax.column,
        constraint: "Python source must be syntactically valid.",
        remediation: "Fix the syntax near the reported location.",
        reference: "examples/python-experimental",
      }),
    )
  }

  for (const candidate of forbiddenPatterns) {
    if (candidate.regex.test(source)) {
      forbidden.push(candidate.pattern)
      errors.push(
        issue(
          candidate.pattern === "import"
            ? "IMPORT_NOT_ALLOWED"
            : "FORBIDDEN_PATTERN",
          `Python Strategy source contains forbidden capability: ${candidate.pattern}`,
          {
            pattern: candidate.pattern,
            constraint:
              "Python Strategies must be self-contained and cannot use host, filesystem, network, import, or dynamic execution capabilities.",
            remediation: `Remove ${candidate.pattern} and use only Strategy input data.`,
            reference: "runtime/capabilities",
          },
        ),
      )
    }
  }

  if (!/\bdef\s+select_activations\s*\(/.test(source)) {
    errors.push(
      issue(
        "MISSING_SELECT_ACTIVATIONS",
        "Python Strategy must define select_activations(input).",
        {
          constraint: "Python Strategy API requires select_activations(input).",
          remediation:
            "Add select_activations that returns activationOrders and strategyMemory.",
          reference: "examples/python-experimental",
        },
      ),
    )
  }
  if (!/\bdef\s+soldier_brain\s*\(/.test(source)) {
    errors.push(
      issue(
        "MISSING_SOLDIER_BRAIN",
        "Python Strategy must define soldier_brain(input).",
        {
          constraint: "Python Strategy API requires soldier_brain(input).",
          remediation:
            "Add soldier_brain that returns action and soldierMemory.",
          reference: "examples/python-experimental",
        },
      ),
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [
      {
        code: "NON_COUNTED_RUNTIME",
        severity: "warning",
        message: "Python is experimental and not counted-play eligible.",
        constraint:
          "Python may run only in non-counted Workshop or exhibition proof paths in v1.17.",
        remediation: "Use JS/TS for counted play.",
        reference: "runtime/counting",
      },
    ],
    sourceBytes,
    forbiddenPatterns: forbidden,
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
