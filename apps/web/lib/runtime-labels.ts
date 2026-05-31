import {
  getSupportedStrategyLanguageBySourceFormat,
  getSupportedStrategyLanguageRecord,
  type StrategyArtifactSourceFormat,
} from "@cowards/spec"

export const runtimeExhibitionStatusLabel = (input: {
  languageId?: string | undefined
  languageLabel?: string | undefined
  countedPlayLabel?: string | undefined
}): string => {
  const label = input.languageLabel ?? "JS/TS"
  const language = getSupportedStrategyLanguageRecord(input.languageId)
  if (language && language.countedEligibility !== "eligible") {
    return language.publicLabel
  }
  return `${label} · ${input.countedPlayLabel ?? "Counted eligible"}`
}

export const sourceFormatExhibitionLabel = (
  sourceFormat?: string | undefined,
): string | null => {
  const language = getSupportedStrategyLanguageBySourceFormat(sourceFormat)
  return language && language.countedEligibility !== "eligible"
    ? language.publicLabel
    : null
}

export const sourceFormatShortLabel = (
  sourceFormat: Extract<
    StrategyArtifactSourceFormat,
    "typescript" | "python" | "rust" | "zig"
  >,
): string => {
  return (
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.shortLabel ?? "TS"
  )
}

export const sourceFormatRuntimeCue = (
  sourceFormat: Extract<
    StrategyArtifactSourceFormat,
    "typescript" | "python" | "rust" | "zig"
  >,
): string | null => {
  const language = getSupportedStrategyLanguageBySourceFormat(sourceFormat)
  return language && language.countedEligibility !== "eligible"
    ? language.publicRuntimeCue
    : null
}
