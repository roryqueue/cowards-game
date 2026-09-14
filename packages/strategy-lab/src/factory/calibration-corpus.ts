import { freezeLabValue, labRoot, type LabRoot } from "../contracts.js"
import { deriveFactorySourceStructureRoot } from "./fingerprint.js"

export type FactoryCalibrationCaseKind = "semantic_rewrite" | "shared_selector_variant" | "symmetry_opaque_id_variant" | "near_identical_behavior" | "latent_divergence" | "expected_false_positive"
type Relation = "correlated" | "distinct" | "borderline"
type Dimension = "sourceStructure" | "lineage" | "dependency" | "legalInputDecision" | "chronicleBehavior" | "matchupResponse"

/** Hand-authored projection fixtures, not runtime results or candidate packets. */
interface ProjectionFixture {
  readonly sourceUtf8: string
  readonly lineage: readonly string[]
  readonly dependencies: readonly Readonly<{ specifier: string; sourceUtf8: string }>[]
  readonly samples: readonly Readonly<{
    condition: string
    soldierId: string
    side: "bottom" | "top"
    x: number
    decision: "TURN_TO_STONE" | "MOVE"
    behavior: Readonly<{ active: number; stone: number; contacts: number }>
    response: "retreat" | "contact"
  }>[]
}
export interface FactoryCalibrationCase {
  readonly caseId: string
  readonly caseKind: FactoryCalibrationCaseKind
  readonly split: "development"
  readonly evidenceClass: "mechanics_only"
  readonly expectedRelation: Relation
  readonly left: ProjectionFixture
  readonly right: ProjectionFixture
}
export interface FactoryCalibrationObservation {
  readonly schemaVersion: "factory-calibration-observation-v1"
  readonly caseId: string
  readonly caseRoot: LabRoot
  readonly evidenceClass: "mechanics_only"
  readonly dimensions: Readonly<Record<Dimension, Readonly<{ leftRoot: LabRoot; rightRoot: LabRoot; equal: boolean }>>>
  readonly agreement: Readonly<{ samples: number; decisions: number; behaviors: number; matchupResponses: number }>
  readonly classification: Relation
  readonly expectedRelation: Relation
  readonly matchesExpected: boolean
  readonly independence: "unresolved"
  readonly root: LabRoot
}

const baseSource = "const choose = (input) => input.contacts > 0 ? 'MOVE' : 'TURN_TO_STONE';"
const rewriteSource = "// renamed local binding, unchanged expression\nconst renamed=(observation)=>observation.contacts>0?'MOVE':'TURN_TO_STONE';"
const alternativeSource = "function choose(input) { if (input.contacts === 0) return 'TURN_TO_STONE'; return 'MOVE'; }"
const sharedDependency = { specifier: "fixture-selector", sourceUtf8: baseSource }
const samples = (changes: readonly number[] = [], mirrored = false): ProjectionFixture["samples"] => Array.from({ length: 4 }, (_, ordinal) => ({
  condition: `development-condition-${ordinal}`,
  soldierId: mirrored ? `opaque-renamed-${ordinal}` : `opaque-original-${ordinal}`,
  side: mirrored ? "top" as const : "bottom" as const,
  x: mirrored ? 11 - (2 + ordinal) : 2 + ordinal,
  decision: changes.includes(ordinal) ? "MOVE" as const : "TURN_TO_STONE" as const,
  behavior: changes.includes(ordinal) ? { active: 2, stone: 0, contacts: 1 } : { active: 1, stone: 1, contacts: 0 },
  response: changes.includes(ordinal) ? "contact" as const : "retreat" as const,
}))
const base: ProjectionFixture = { sourceUtf8: baseSource, lineage: ["fixture-origin-a"], dependencies: [sharedDependency], samples: samples() }
const caseOf = (caseId: string, caseKind: FactoryCalibrationCaseKind, expectedRelation: Relation, right: ProjectionFixture): FactoryCalibrationCase => ({
  caseId, caseKind, expectedRelation, split: "development", evidenceClass: "mechanics_only", left: base, right,
})

/** Concrete bounded paired records. No supplied source is evaluated or imported. */
export const FACTORY_CALIBRATION_CORPUS: readonly FactoryCalibrationCase[] = freezeLabValue([
  caseOf("semantic-rewrite", "semantic_rewrite", "correlated", { ...base, sourceUtf8: rewriteSource }),
  caseOf("shared-selector", "shared_selector_variant", "correlated", { ...base, sourceUtf8: "const choose = (input) => selector(input);", lineage: ["fixture-origin-b"] }),
  caseOf("symmetry-opaque-id", "symmetry_opaque_id_variant", "correlated", { ...base, samples: samples([], true) }),
  caseOf("near-identical-behavior", "near_identical_behavior", "borderline", { ...base, sourceUtf8: alternativeSource, samples: samples([3]) }),
  caseOf("latent-divergence", "latent_divergence", "distinct", { sourceUtf8: alternativeSource, lineage: ["fixture-origin-c"], dependencies: [{ specifier: "fixture-alternative", sourceUtf8: alternativeSource }], samples: samples([2, 3]) }),
  caseOf("expected-false-positive", "expected_false_positive", "borderline", { sourceUtf8: alternativeSource, lineage: ["fixture-origin-d"], dependencies: [{ specifier: "fixture-independent", sourceUtf8: alternativeSource }], samples: samples() }),
])

const issued = new WeakSet<object>()
const roots = (fixture: ProjectionFixture): Readonly<Record<Dimension, LabRoot>> => ({
  sourceStructure: deriveFactorySourceStructureRoot(new TextEncoder().encode(fixture.sourceUtf8)),
  lineage: labRoot("factory-corpus-lineage-v1", fixture.lineage),
  dependency: labRoot("factory-corpus-dependency-v1", fixture.dependencies),
  // Opaque ids and fixture reflection are deliberately not behavioral diversity.
  legalInputDecision: labRoot("factory-corpus-decision-v1", fixture.samples.map((entry) => ({ condition: entry.condition, x: entry.side === "top" ? 11 - entry.x : entry.x, decision: entry.decision }))),
  chronicleBehavior: labRoot("factory-corpus-behavior-v1", fixture.samples.map((entry) => ({ condition: entry.condition, behavior: entry.behavior }))),
  matchupResponse: labRoot("factory-corpus-matchup-v1", fixture.samples.map((entry) => ({ condition: entry.condition, response: entry.response }))),
})

/** Threshold-free signals only. A `distinct` fixture is never independent evidence. */
export const evaluateFactoryCalibrationCorpus = (): readonly Readonly<FactoryCalibrationObservation>[] => freezeLabValue(FACTORY_CALIBRATION_CORPUS.map((entry) => {
  const left = roots(entry.left), right = roots(entry.right)
  const dimensions = Object.fromEntries((Object.keys(left) as Dimension[]).map((key) => [key, { leftRoot: left[key], rightRoot: right[key], equal: left[key] === right[key] }])) as unknown as FactoryCalibrationObservation["dimensions"]
  const agreement = { samples: entry.left.samples.length, decisions: 0, behaviors: 0, matchupResponses: 0 }
  for (let ordinal = 0; ordinal < entry.left.samples.length; ordinal += 1) {
    const a = entry.left.samples[ordinal]!, b = entry.right.samples[ordinal]!
    if (a.condition !== b.condition) throw new TypeError("FACTORY_CALIBRATION_CORPUS_UNPAIRED")
    if (a.decision === b.decision) agreement.decisions += 1
    if (labRoot("factory-corpus-behavior-sample-v1", a.behavior) === labRoot("factory-corpus-behavior-sample-v1", b.behavior)) agreement.behaviors += 1
    if (a.response === b.response) agreement.matchupResponses += 1
  }
  const behaviorEqual = dimensions.legalInputDecision.equal && dimensions.chronicleBehavior.equal && dimensions.matchupResponse.equal
  const sharedStructure = dimensions.sourceStructure.equal || dimensions.dependency.equal
  const separateStructure = !dimensions.sourceStructure.equal && !dimensions.lineage.equal && !dimensions.dependency.equal
  const classification: Relation = behaviorEqual && sharedStructure ? "correlated" : !behaviorEqual && separateStructure ? "distinct" : "borderline"
  const value = { schemaVersion: "factory-calibration-observation-v1" as const, caseId: entry.caseId, caseRoot: labRoot("factory-calibration-concrete-case-v1", entry), evidenceClass: "mechanics_only" as const, dimensions, agreement, classification, expectedRelation: entry.expectedRelation, matchesExpected: classification === entry.expectedRelation, independence: "unresolved" as const }
  const observation = freezeLabValue({ ...value, root: labRoot("factory-calibration-observation-v1", value) })
  issued.add(observation)
  return observation
}))

export const requireIssuedFactoryCalibrationObservations = (observations: readonly FactoryCalibrationObservation[]): readonly FactoryCalibrationObservation[] => {
  if (!Array.isArray(observations) || observations.length !== FACTORY_CALIBRATION_CORPUS.length || observations.some((entry, ordinal) => !issued.has(entry) || entry.caseId !== FACTORY_CALIBRATION_CORPUS[ordinal]?.caseId || entry.evidenceClass !== "mechanics_only" || entry.independence !== "unresolved")) throw new TypeError("FACTORY_CALIBRATION_UNISSUED_OBSERVATIONS")
  return observations
}
