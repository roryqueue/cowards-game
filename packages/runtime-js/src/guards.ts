import type {
  RuntimeViolation,
  RuntimeViolationType,
  RuntimeViolationUserGuidance,
} from "@cowards/spec"

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

export const describeRuntimeViolationForUser = (
  violation: RuntimeViolation,
): RuntimeViolationUserGuidance => {
  switch (violation.type) {
    case "INVALID_OUTPUT":
      return {
        label: "Strategy returned invalid output",
        constraint:
          "selectActivations and soldierBrain must return schema-valid Strategy API values.",
        remediation:
          "Return activationOrders with StrategyMemory or one valid Action with SoldierMemory.",
      }
    case "TIMEOUT":
      return {
        label: "Strategy timed out",
        constraint:
          "Strategy methods must finish within the bounded synchronous runtime window.",
        remediation:
          "Simplify loops, avoid heavy searches, and return a result sooner.",
      }
    case "THROWN_EXCEPTION":
      return {
        label: "Strategy threw an exception",
        constraint: "Strategy methods must complete without throwing.",
        remediation:
          "Guard missing data and return a fallback Action instead of throwing.",
      }
    case "FORBIDDEN_CAPABILITY":
      return {
        label: "Strategy used a forbidden capability",
        constraint:
          "Strategy source cannot access host capabilities outside the Strategy API.",
        remediation:
          "Remove host access and rely only on the provided Strategy inputs.",
      }
    case "OVERSIZED_OUTPUT":
      return {
        label: "Strategy output was too large",
        constraint:
          "Strategy output and returned memory must stay within runtime byte limits.",
        remediation: "Store less data and return smaller payloads.",
      }
  }
}
