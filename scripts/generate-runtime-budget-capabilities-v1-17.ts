export const runtimeBudgetCapabilitiesV117ArtifactPath =
  "packages/spec/artifacts/runtime-abi-v1.17-budget-capabilities.json" as const

export const buildRuntimeBudgetCapabilitiesV117Artifact = (): Readonly<
  Record<string, unknown>
> => {
  throw new Error("Runtime budget capability generator is not implemented")
}

export const renderRuntimeBudgetCapabilitiesV117Artifact = (): string => {
  throw new Error("Runtime budget capability generator is not implemented")
}

export const checkRuntimeBudgetCapabilitiesV117Artifact = (
  _readArtifact?: (relativePath: string) => string,
): readonly string[] => ["NOT_IMPLEMENTED"]

export const runRuntimeBudgetCapabilitiesV117Generator = (
  _args: readonly string[],
  _io?: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> => {
  throw new Error("Runtime budget capability generator is not implemented")
}
