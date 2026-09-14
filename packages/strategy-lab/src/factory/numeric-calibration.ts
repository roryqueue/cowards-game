export const NUMERIC_DIMENSIONS = ["sourceStructure", "lineage", "dependency", "legalInput", "chronicle", "matchup"] as const
export type NumericDimension = typeof NUMERIC_DIMENSIONS[number]
export type NumericClassification = "correlated" | "distinct" | "unresolved"

export interface NumericCalibrationEvidence {
  readonly sourceStructureTokens: readonly string[]
  readonly lineageEdgeTokens: readonly ConcreteEdgeToken[]
  readonly dependencyEdgeTokens: readonly ConcreteEdgeToken[]
  readonly legalInputSamples: Readonly<Record<string, readonly string[]>>
  readonly chronicleSamples: Readonly<Record<string, readonly string[]>>
  readonly matchupSamples: Readonly<Record<string, readonly string[]>>
}
export interface ConcreteEdgeToken { readonly label: string; readonly from: string; readonly to: string }
export interface NumericDimensionComparison { readonly score: number | null; readonly informativeCount: number }
export interface NumericComparison {
  readonly dimensions: Record<NumericDimension, NumericDimensionComparison>
  readonly informativeDimensions: number
  readonly weightedMean: number | null
}
export type NumericControlId = "S01/S02" | "S03/S04" | "S05/S06" | "S01/S07" | "S01/S08" | "S11/S12"
export type NumericControlTable = Readonly<Record<NumericControlId, NumericComparison>>
export interface NumericCalibrationThreshold {
  readonly positiveFloors: Readonly<Record<NumericDimension, number>>
  readonly distinctCeiling: number
  readonly requiredInformativeDimensions: 3
  readonly minimumSeparationMargin: 0.05
}
export type NumericThresholdFit =
  | Readonly<{ status: "frozen"; threshold: Readonly<NumericCalibrationThreshold>; controls: NumericControlTable }>
  | Readonly<{ status: "unresolved"; reasons: readonly string[] }>

const fail = (): never => { throw new TypeError("NUMERIC_CALIBRATION_EVIDENCE") }
const HASH = /^sha256:[0-9a-f]{64}$/u
const finiteScore = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
const tokens = (value: readonly string[]): ReadonlySet<string> => {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.length === 0 || entry.length > 256)) return fail()
  return new Set(value)
}
const jaccard = (left: ReadonlySet<string>, right: ReadonlySet<string>): number => {
  const union = new Set([...left, ...right]); if (union.size === 0) return fail()
  let shared = 0; for (const token of left) if (right.has(token)) shared += 1
  return shared / union.size
}
const tokenDimension = (leftValue: readonly string[], rightValue: readonly string[]): NumericDimensionComparison => {
  const left = tokens(leftValue), right = tokens(rightValue)
  if (left.size === 0 || right.size === 0) return Object.freeze({ score: null, informativeCount: 0 })
  return Object.freeze({ score: jaccard(left, right), informativeCount: new Set([...left, ...right]).size })
}
const edges = (value: readonly ConcreteEdgeToken[]): readonly string[] => {
  if (!Array.isArray(value)) return fail()
  return value.map((edge) => {
    if (!edge || typeof edge !== "object" || Object.keys(edge).sort().join("\0") !== ["from", "label", "to"].sort().join("\0") || [edge.label, edge.from, edge.to].some((entry) => typeof entry !== "string" || entry.length === 0 || entry.length > 256 || HASH.test(entry))) return fail()
    return `${edge.label}:${edge.from}->${edge.to}`
  })
}
const sampleDimension = (leftValue: Readonly<Record<string, readonly string[]>>, rightValue: Readonly<Record<string, readonly string[]>>): NumericDimensionComparison => {
  if (!leftValue || !rightValue || Array.isArray(leftValue) || Array.isArray(rightValue)) return fail()
  const leftKeys = Object.keys(leftValue), rightKeys = new Set(Object.keys(rightValue))
  if ([...leftKeys, ...rightKeys].some((key) => key.length === 0 || key.length > 256)) return fail()
  const matched = leftKeys.filter((key) => rightKeys.has(key)).sort(), scores: number[] = []
  for (const key of matched) {
    const left = tokens(leftValue[key]!), right = tokens(rightValue[key]!)
    if (left.size > 0 && right.size > 0) scores.push(jaccard(left, right))
  }
  return scores.length === 0 ? Object.freeze({ score: null, informativeCount: 0 }) : Object.freeze({ score: scores.reduce((sum, score) => sum + score, 0) / scores.length, informativeCount: scores.length })
}
const summarize = (dimensions: Record<NumericDimension, NumericDimensionComparison>): Readonly<NumericComparison> => {
  const informative = NUMERIC_DIMENSIONS.filter((key) => dimensions[key].informativeCount > 0 && dimensions[key].score !== null)
  return Object.freeze({ dimensions: Object.freeze(dimensions), informativeDimensions: informative.length, weightedMean: informative.length === 0 ? null : informative.reduce((sum, key) => sum + dimensions[key].score!, 0) / informative.length })
}

export const compareNumericEvidence = (left: NumericCalibrationEvidence, right: NumericCalibrationEvidence): Readonly<NumericComparison> => summarize({
  sourceStructure: tokenDimension(left.sourceStructureTokens, right.sourceStructureTokens),
  lineage: tokenDimension(edges(left.lineageEdgeTokens), edges(right.lineageEdgeTokens)),
  dependency: tokenDimension(edges(left.dependencyEdgeTokens), edges(right.dependencyEdgeTokens)),
  legalInput: sampleDimension(left.legalInputSamples, right.legalInputSamples),
  chronicle: sampleDimension(left.chronicleSamples, right.chronicleSamples),
  matchup: sampleDimension(left.matchupSamples, right.matchupSamples),
})

/** Parses inert TypeScript as data and normalizes local binding names while retaining operators, literals and property names. */
export const extractSourceStructureTokens = (source: string): readonly string[] => {
  if (typeof source !== "string" || source.length === 0 || source.length > 65_536) return fail()
  const ast = ts.createSourceFile("factory-calibration-source.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  if (((ast as unknown as { readonly parseDiagnostics?: readonly unknown[] }).parseDiagnostics?.length ?? 0) > 0) return fail()
  const properties = new Set<string>()
  const collect = (node: ts.Node): void => {
    const name = (ts.isPropertyAccessExpression(node) || ts.isPropertyAssignment(node) || ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) ? node.name : null
    if (name && (ts.isIdentifier(name) || ts.isStringLiteralLike(name))) properties.add(`${name.getStart(ast)}:${name.getEnd()}`)
    ts.forEachChild(node, collect)
  }
  collect(ast)
  const scanner = ts.createScanner(ts.ScriptTarget.ES2022, true, ts.LanguageVariant.Standard, source), result: string[] = []
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    const raw = scanner.getTokenText(), span = `${scanner.getTokenPos()}:${scanner.getTextPos()}`
    if (kind === ts.SyntaxKind.Identifier) result.push(properties.has(span) ? `property:${raw}` : "identifier")
    else if (kind === ts.SyntaxKind.StringLiteral || kind === ts.SyntaxKind.NumericLiteral || kind === ts.SyntaxKind.BigIntLiteral || kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) result.push(`literal:${raw}`)
    else result.push(`syntax:${ts.SyntaxKind[kind]}`)
  }
  return Object.freeze(result)
}

const validatedComparison = (value: NumericComparison): NumericComparison | null => {
  if (!value || !value.dimensions) return null
  let count = 0, total = 0
  for (const key of NUMERIC_DIMENSIONS) {
    const dimension = value.dimensions[key]
    if (!dimension || !Number.isSafeInteger(dimension.informativeCount) || dimension.informativeCount < 0) return null
    if (dimension.informativeCount === 0 ? dimension.score !== null : !finiteScore(dimension.score)) return null
    if (dimension.score !== null) { count += 1; total += dimension.score }
  }
  const mean = count === 0 ? null : total / count
  return value.informativeDimensions === count && (mean === null ? value.weightedMean === null : finiteScore(value.weightedMean) && Math.abs(value.weightedMean - mean) <= Number.EPSILON * 8) ? value : null
}

export const classifyNumericComparison = (comparison: NumericComparison, threshold: NumericCalibrationThreshold): NumericClassification => {
  const valid = validatedComparison(comparison)
  if (!valid || threshold.requiredInformativeDimensions !== 3 || threshold.minimumSeparationMargin !== 0.05 || !finiteScore(threshold.distinctCeiling) || NUMERIC_DIMENSIONS.some((key) => !finiteScore(threshold.positiveFloors[key])) || valid.informativeDimensions < threshold.requiredInformativeDimensions || valid.weightedMean === null) return "unresolved"
  const informative = NUMERIC_DIMENSIONS.filter((key) => valid.dimensions[key].score !== null)
  if (informative.every((key) => valid.dimensions[key].score! >= threshold.positiveFloors[key])) return "correlated"
  if (valid.weightedMean <= threshold.distinctCeiling) return "distinct"
  return "unresolved"
}

export const freezeNumericCalibrationThreshold = (controls: NumericControlTable): Readonly<NumericThresholdFit> => {
  const ids: readonly NumericControlId[] = ["S01/S02", "S03/S04", "S05/S06", "S01/S07", "S01/S08", "S11/S12"]
  if (!controls || Object.keys(controls).sort().join("\0") !== [...ids].sort().join("\0")) return Object.freeze({ status: "unresolved", reasons: Object.freeze(["control_table_mismatch"]) })
  const valid = Object.fromEntries(ids.map((id) => [id, validatedComparison(controls[id])])) as Record<NumericControlId, NumericComparison | null>
  if (ids.some((id) => valid[id] === null || valid[id]!.informativeDimensions < 3 || valid[id]!.weightedMean === null)) return Object.freeze({ status: "unresolved", reasons: Object.freeze(["insufficient_or_invalid_control"] ) })
  const positives = [valid["S01/S02"]!, valid["S03/S04"]!, valid["S05/S06"]!]
  const floors = Object.fromEntries(NUMERIC_DIMENSIONS.map((key) => [key, Math.min(...positives.map((entry) => entry.dimensions[key].score ?? 1))])) as Record<NumericDimension, number>
  const latent = valid["S01/S08"]!, minimumPositiveMean = Math.min(...positives.map((entry) => entry.weightedMean!)), distinctCeiling = latent.weightedMean!
  const threshold: NumericCalibrationThreshold = Object.freeze({ positiveFloors: Object.freeze(floors), distinctCeiling, requiredInformativeDimensions: 3, minimumSeparationMargin: 0.05 })
  const reasons: string[] = []
  if (minimumPositiveMean - distinctCeiling < threshold.minimumSeparationMargin) reasons.push("separation_margin")
  if (positives.some((entry) => classifyNumericComparison(entry, threshold) !== "correlated")) reasons.push("positive_control")
  if (classifyNumericComparison(latent, threshold) !== "distinct") reasons.push("latent_control")
  if (classifyNumericComparison(valid["S01/S07"]!, threshold) !== "unresolved") reasons.push("near_borderline")
  if (classifyNumericComparison(valid["S11/S12"]!, threshold) !== "unresolved") reasons.push("false_positive_borderline")
  return reasons.length > 0 ? Object.freeze({ status: "unresolved", reasons: Object.freeze(reasons) }) : Object.freeze({ status: "frozen", threshold, controls })
}
import ts from "typescript"
