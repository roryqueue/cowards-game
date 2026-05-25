export const PYTHON_RUNTIME_EXECUTABLE = "python3"

export const PYTHON_RUNTIME_ENVIRONMENT: Readonly<Record<string, string>> =
  Object.freeze({})

export const pythonIsolatedHostArgs = (
  scriptPath: string,
): readonly string[] => ["-I", scriptPath]
