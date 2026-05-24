import type {
  JsonValue,
  RuntimeExecutionServiceSystemFailureCode,
} from "@cowards/spec"

const REDACTED_PUBLIC_MESSAGE = "Runtime execution failed before completion."

const SENSITIVE_PATTERNS: readonly RegExp[] = [
  /export\s+default/gi,
  /strategyMemory/gi,
  /soldierMemory/gi,
  /objectivePayload/gi,
  /objective[_\s-]?payload/gi,
  /owner[_\s-]?debug/gi,
  /awareness\s*grid/gi,
  /stack/gi,
  /stderr/gi,
  /session(?:id|[_\s-]?secret)?/gi,
  /token/gi,
  /(?:postgres(?:ql)?|mysql):\/\/\S+/gi,
  /private\s+runtime\s+internals/gi,
  /\/(?:Users|home|var|tmp)\/[^\s"'`]+/gi,
]

const redactText = (text: string): string =>
  SENSITIVE_PATTERNS.reduce(
    (current, pattern) => current.replace(pattern, "[redacted]"),
    text,
  )

const isJsonScalar = (value: unknown): value is JsonValue =>
  value === null ||
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean"

export const redactedErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return redactText(error.message)
  }
  return redactText(String(error))
}

export const redactedDiagnostics = (
  diagnostics: Record<string, unknown>,
): JsonValue => {
  const safe: Record<string, JsonValue> = {}
  for (const [key, value] of Object.entries(diagnostics)) {
    if (!isJsonScalar(value)) {
      continue
    }
    safe[key] = typeof value === "string" ? redactText(value) : value
  }
  return safe
}

export const publicSystemFailureMessage = (
  _code: RuntimeExecutionServiceSystemFailureCode,
): string => REDACTED_PUBLIC_MESSAGE
