import type { StrategyArtifactSourceFormat } from "@cowards/spec"

export const runtimeExhibitionStatusLabel = (input: {
  languageId?: string | undefined
  languageLabel?: string | undefined
  countedPlayLabel?: string | undefined
}): string => {
  const label = input.languageLabel ?? "JS/TS"
  switch (input.languageId) {
    case "python":
      return `${label} · non-counted exhibition beta`
    case "rust":
      return `${label} · non-counted exhibition beta`
    case "zig":
      return `${label} · non-counted exhibition beta`
    default:
      return `${label} · ${input.countedPlayLabel ?? "Counted eligible"}`
  }
}

export const sourceFormatExhibitionLabel = (
  sourceFormat?: string | undefined,
): string | null => {
  switch (sourceFormat) {
    case "python":
      return "Python · non-counted exhibition beta"
    case "rust":
      return "Rust · non-counted exhibition beta"
    case "zig":
      return "Zig · non-counted exhibition beta"
    default:
      return null
  }
}

export const sourceFormatShortLabel = (
  sourceFormat: Extract<
    StrategyArtifactSourceFormat,
    "typescript" | "python" | "rust" | "zig"
  >,
): string => {
  switch (sourceFormat) {
    case "python":
      return "PY beta"
    case "rust":
      return "Rust beta"
    case "zig":
      return "Zig beta"
    default:
      return "TS"
  }
}

export const sourceFormatRuntimeCue = (
  sourceFormat: Extract<
    StrategyArtifactSourceFormat,
    "typescript" | "python" | "rust" | "zig"
  >,
): string | null => {
  switch (sourceFormat) {
    case "python":
      return "Python is non-counted exhibition beta and runs only through the Runtime Broker."
    case "rust":
      return "Rust is non-counted exhibition beta and executes immutable WASM/WASI artifacts through the Runtime Broker."
    case "zig":
      return "Zig is non-counted exhibition beta after no-std WASI Preview 1 compile, artifact, import audit, and Wasmtime ABI proof."
    default:
      return null
  }
}
