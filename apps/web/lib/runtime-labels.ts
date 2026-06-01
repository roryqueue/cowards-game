import {
  getSupportedStrategyLanguageBySourceFormat,
  getSupportedStrategyLanguageRecord,
  type StrategyArtifactSourceFormat,
} from "@cowards/spec"

export type WorkshopEditorSourceFormat = Extract<
  StrategyArtifactSourceFormat,
  "typescript" | "python" | "rust" | "zig"
>

export const WORKSHOP_EDITOR_SOURCE_FORMATS = [
  "typescript",
  "python",
  "rust",
  "zig",
] as const satisfies readonly WorkshopEditorSourceFormat[]

export const runtimeExhibitionStatusLabel = (input: {
  languageId?: string | undefined
  languageLabel?: string | undefined
  countedPlayLabel?: string | undefined
}): string => {
  const language = getSupportedStrategyLanguageRecord(input.languageId)
  const label = input.languageLabel ?? language?.label ?? "JS/TS"
  if (language && input.countedPlayLabel === undefined) {
    return language.publicLabel
  }
  if (language && language.countedEligibility !== "eligible") {
    return language.publicLabel
  }
  return `${label} · ${input.countedPlayLabel ?? "Counted eligible"}`
}

export const sourceFormatExhibitionLabel = (
  sourceFormat?: string | undefined,
): string | null => {
  const language = getSupportedStrategyLanguageBySourceFormat(sourceFormat)
  return language?.publicLabel ?? null
}

export const sourceFormatShortLabel = (
  sourceFormat: WorkshopEditorSourceFormat,
): string => {
  return (
    getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.shortLabel ?? "TS"
  )
}

export const sourceFormatLanguageLabel = (
  sourceFormat?: string | undefined,
): string =>
  getSupportedStrategyLanguageBySourceFormat(sourceFormat)?.label ??
  "TypeScript"

export const sourceFormatRuntimeCue = (
  sourceFormat: WorkshopEditorSourceFormat,
): string | null => {
  const language = getSupportedStrategyLanguageBySourceFormat(sourceFormat)
  return language?.publicRuntimeCue ?? null
}
