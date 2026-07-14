export const RUNTIME_BUDGET_CAPABILITY_DIMENSIONS_V1_17 = [] as const
export const RUNTIME_BUDGET_CAPABILITY_PINS_V1_17 = [] as const
export const RUNTIME_BUDGET_CAPABILITY_LANES_V1_17 = [] as const

export const RUNTIME_BUDGET_CAPABILITY_CONTRACT_V1_17 = Object.freeze({})
export const RUNTIME_BUDGET_CAPABILITY_EVIDENCE_INPUTS_V1_17 = Object.freeze(
  [],
)

export class RuntimeBudgetCapabilitiesV117Error extends Error {}

export const buildRuntimeBudgetCapabilitiesV117 = (
  _options: Readonly<Record<string, unknown>> = {},
): Readonly<Record<string, unknown>> => {
  throw new RuntimeBudgetCapabilitiesV117Error(
    "Runtime budget capabilities v1.17 are not implemented",
  )
}

export const validateRuntimeBudgetCapabilitiesV117 = (
  _value: unknown,
): readonly Readonly<Record<string, unknown>>[] => [
  { code: "NOT_IMPLEMENTED" },
]

export const assertRuntimeBudgetCapabilitiesV117 = (
  _value: unknown,
): void => {
  throw new RuntimeBudgetCapabilitiesV117Error(
    "Runtime budget capabilities v1.17 are not implemented",
  )
}

export const renderRuntimeBudgetCapabilitiesV117 = (
  _value?: unknown,
): string => {
  throw new RuntimeBudgetCapabilitiesV117Error(
    "Runtime budget capabilities v1.17 are not implemented",
  )
}

export const RUNTIME_BUDGET_CAPABILITIES_V1_17 = Object.freeze({})
