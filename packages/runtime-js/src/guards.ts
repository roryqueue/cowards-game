import type { RuntimeViolation, RuntimeViolationType } from "@cowards/spec"

export const RUNTIME_TIMEOUT_MS = 50
export const RUNTIME_OUTPUT_BYTES = 256 * 1024

export const createRuntimeViolation = (
  type: RuntimeViolationType,
  message: string,
): RuntimeViolation => ({ type, message })

export const isForbiddenRuntimeError = (error: unknown): boolean =>
  error instanceof Error && error.message.startsWith("FORBIDDEN_CAPABILITY:")

export const toThrownExceptionViolation = (
  error: unknown,
): RuntimeViolation => {
  if (isForbiddenRuntimeError(error)) {
    return createRuntimeViolation("FORBIDDEN_CAPABILITY", String(error))
  }

  return createRuntimeViolation(
    "THROWN_EXCEPTION",
    error instanceof Error ? error.message : String(error),
  )
}

export const toInvalidOutputViolation = (error: unknown): RuntimeViolation =>
  createRuntimeViolation(
    "INVALID_OUTPUT",
    error instanceof Error ? error.message : String(error),
  )

export const toOversizedOutputViolation = (message: string): RuntimeViolation =>
  createRuntimeViolation("OVERSIZED_OUTPUT", message)
