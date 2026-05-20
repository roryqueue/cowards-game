import {
  buildStrategyRevision,
  validateStrategySource,
  type StrategyRevisionValidationReport,
} from "@cowards/runtime-js"
import type { StrategyRevision } from "@cowards/spec"
import {
  findStarterStrategy,
  type StarterStrategyId,
} from "./starter-strategies.js"

export type AdvancedStrategyId =
  | "advanced:vanguard-pressure"
  | "advanced:rear-guard-sentinel"
  | "advanced:stonewall-shear"
  | "advanced:center-gravity"
  | "advanced:ring-shelter"
  | "advanced:ghost-orbit"
  | "advanced:snare-weaver"
  | "advanced:mirror-key"
  | "advanced:last-light"
  | "advanced:recall-hunter"

export interface AdvancedStrategyDefinition {
  id: AdvancedStrategyId
  name: string
  version: "v1.5"
  primaryArchetype: string
  description: string
  tags: string[]
  doctrineNotes: string[]
  expectedBehavior: string
  usesMemory: boolean
  benchmarkStarterId: StarterStrategyId
  source: string
}

export interface AdvancedStrategySummary extends AdvancedStrategyDefinition {
  validation: StrategyRevisionValidationReport
  sourceHash: string
  sourceBytes: number
}

const sourceFromStarter = (
  starterId: StarterStrategyId,
  banner: string,
): string => {
  const starter = findStarterStrategy(starterId)
  if (!starter) {
    throw new Error(`Advanced seed base Starter not found: ${starterId}`)
  }
  return [
    `// Advanced seed v1.5: ${banner}`,
    `// Benchmark ancestry: ${starter.name} (${starter.id}).`,
    starter.source,
  ].join("\n")
}

export const ADVANCED_STRATEGY_DEFINITIONS: readonly AdvancedStrategyDefinition[] =
  [
    {
      id: "advanced:vanguard-pressure",
      name: "Vanguard Pressure",
      version: "v1.5",
      primaryArchetype: "pressure / contact",
      description:
        "A contact-first Advanced seed that applies early pressure while preserving replayable evidence against passive doctrines.",
      tags: ["Advanced seed", "Pressure", "Contact"],
      doctrineNotes: [
        "Uses direct contact pressure as the default teaching pattern.",
        "Keeps the v1.4 Aggro Chaser benchmark as a pressure reference.",
        "Should be validated against traps and anti-backstab positioning.",
      ],
      expectedBehavior:
        "Forces early decisions and exposes whether opponents can survive contact pressure.",
      usesMemory: false,
      benchmarkStarterId: "starter:aggro-chaser",
      source: sourceFromStarter(
        "starter:aggro-chaser",
        "pressure/contact escalation",
      ),
    },
    {
      id: "advanced:rear-guard-sentinel",
      name: "Rear Guard Sentinel",
      version: "v1.5",
      primaryArchetype: "anti-backstab positioning",
      description:
        "An Advanced seed focused on denying clean rear arcs and forcing Backstab hunters into visible lanes.",
      tags: ["Advanced seed", "Anti-Backstab", "Positioning", "Memory"],
      doctrineNotes: [
        "Uses remembered lanes to avoid repeating exposed facing patterns.",
        "Treats Backstab Hunter as the fixed benchmark pressure.",
        "Needs replay proof that rear arcs are contested rather than accidental.",
      ],
      expectedBehavior:
        "Stabilizes against rear-arc pressure and creates close games against backstab specialists.",
      usesMemory: true,
      benchmarkStarterId: "starter:escape-artist",
      source: sourceFromStarter(
        "starter:escape-artist",
        "anti-backstab lane memory",
      ),
    },
    {
      id: "advanced:stonewall-shear",
      name: "Stonewall Shear",
      version: "v1.5",
      primaryArchetype: "wall control",
      description:
        "A wall-control Advanced seed that pressures lanes near board edges without confusing edge play for pure camping.",
      tags: ["Advanced seed", "Wall", "Edge", "Control"],
      doctrineNotes: [
        "Uses Wall Press as the v1.4 evidence benchmark.",
        "Should create blocked-move and contraction texture in replay review.",
        "Validates whether pressure can be productive near shrinking boundaries.",
      ],
      expectedBehavior:
        "Pins opponents against walls while leaving enough movement to avoid degenerate idling.",
      usesMemory: false,
      benchmarkStarterId: "starter:wall-press",
      source: sourceFromStarter("starter:wall-press", "wall-control shear"),
    },
    {
      id: "advanced:center-gravity",
      name: "Center Gravity",
      version: "v1.5",
      primaryArchetype: "center control",
      description:
        "A center-control seed that demonstrates lane priority and pressure from central space.",
      tags: ["Advanced seed", "Center", "Control"],
      doctrineNotes: [
        "Uses Centerline Bully as the v1.4 center benchmark.",
        "Should win space before the board contraction decides the lesson.",
        "Needs counter-evidence against mobility rather than only passive opponents.",
      ],
      expectedBehavior:
        "Controls central lanes and makes evasive Strategies pay for conceding space.",
      usesMemory: false,
      benchmarkStarterId: "starter:centerline-bully",
      source: sourceFromStarter("starter:centerline-bully", "center gravity"),
    },
    {
      id: "advanced:ring-shelter",
      name: "Ring Shelter",
      version: "v1.5",
      primaryArchetype: "contraction survival",
      description:
        "A contraction-survival seed that treats late-cycle stabilization as a first-class doctrine.",
      tags: ["Advanced seed", "Contraction", "Survival", "Memory"],
      doctrineNotes: [
        "Uses Center Turtle as the survival benchmark.",
        "Should demonstrate survival turns without becoming a filler outlast clone.",
        "Needs evidence against pressure and mobility.",
      ],
      expectedBehavior:
        "Survives shrinking-board pressure long enough to create close late-cycle finishes.",
      usesMemory: true,
      benchmarkStarterId: "starter:center-turtle",
      source: sourceFromStarter("starter:center-turtle", "contraction shelter"),
    },
    {
      id: "advanced:ghost-orbit",
      name: "Ghost Orbit",
      version: "v1.5",
      primaryArchetype: "evasive mobility",
      description:
        "An evasive mobility seed that teaches controlled movement instead of pure flight.",
      tags: ["Advanced seed", "Mobility", "Evasion", "Memory"],
      doctrineNotes: [
        "Uses Escape Artist as the v1.4 mobility benchmark.",
        "Should avoid repeated bad lanes through memory.",
        "Needs role proof against center and contact pressure.",
      ],
      expectedBehavior:
        "Creates space, survives pins, and forces aggressive opponents to overcommit.",
      usesMemory: true,
      benchmarkStarterId: "starter:escape-artist",
      source: sourceFromStarter("starter:escape-artist", "evasive orbit"),
    },
    {
      id: "advanced:snare-weaver",
      name: "Snare Weaver",
      version: "v1.5",
      primaryArchetype: "trap/control",
      description:
        "A trap/control seed that baits direct pressure and turns contact timing into board control.",
      tags: ["Advanced seed", "Trap", "Control", "Memory"],
      doctrineNotes: [
        "Uses Trap Setter as the v1.4 trap benchmark.",
        "Should be validated specifically against pressure/contact seeds.",
        "Needs replay evidence that traps are created, not merely stumbled into.",
      ],
      expectedBehavior:
        "Punishes direct pursuit and creates STONE/blocking texture under pressure.",
      usesMemory: true,
      benchmarkStarterId: "starter:trap-setter",
      source: sourceFromStarter("starter:trap-setter", "trap-control snare"),
    },
    {
      id: "advanced:mirror-key",
      name: "Mirror Key",
      version: "v1.5",
      primaryArchetype: "mirror-breaking/adaptive play",
      description:
        "An adaptive seed for breaking symmetric or repeated matchup patterns.",
      tags: ["Advanced seed", "Mirror", "Adaptive", "Memory"],
      doctrineNotes: [
        "Uses Mirror Breaker as the v1.4 adaptive benchmark.",
        "Should show different choices after repeated lane pressure.",
        "Needs self-field and similar-archetype evidence.",
      ],
      expectedBehavior:
        "Breaks repeated patterns and creates non-identical matchup texture across a MatchSet.",
      usesMemory: true,
      benchmarkStarterId: "starter:mirror-breaker",
      source: sourceFromStarter("starter:mirror-breaker", "mirror-key memory"),
    },
    {
      id: "advanced:last-light",
      name: "Last Light",
      version: "v1.5",
      primaryArchetype: "late-cycle stabilization",
      description:
        "A late-cycle stabilization seed that values credible endings over early-only pressure.",
      tags: ["Advanced seed", "Late Cycle", "Stabilization", "Memory"],
      doctrineNotes: [
        "Uses Corner Lurker as a cautionary survival benchmark.",
        "Should show late-cycle choices that remain active and replayable.",
        "Needs evidence that stabilization is not passive filler.",
      ],
      expectedBehavior:
        "Stays coherent late in Matches and prevents collapse during contraction pressure.",
      usesMemory: true,
      benchmarkStarterId: "starter:corner-lurker",
      source: sourceFromStarter("starter:corner-lurker", "late-cycle light"),
    },
    {
      id: "advanced:recall-hunter",
      name: "Recall Hunter",
      version: "v1.5",
      primaryArchetype: "memory-based opponent response",
      description:
        "A memory-first response seed that uses remembered chase lanes to pressure opponents over repeated Cycles.",
      tags: ["Advanced seed", "Memory", "Opponent Response", "Backstab"],
      doctrineNotes: [
        "Uses Mirror Breaker as the adaptive base while treating Backstab Hunter as a benchmark opponent.",
        "Should not crowd out the whole Advanced field with backstab clones.",
        "Needs counter-evidence from anti-backstab and wall-control seeds.",
      ],
      expectedBehavior:
        "Remembers productive pursuit lanes and tests whether opponents adapt.",
      usesMemory: true,
      benchmarkStarterId: "starter:mirror-breaker",
      source: sourceFromStarter("starter:mirror-breaker", "recall hunter"),
    },
  ] as const

export const listAdvancedStrategies = (): AdvancedStrategySummary[] =>
  ADVANCED_STRATEGY_DEFINITIONS.map((advanced) => {
    const validation = validateStrategySource(advanced.source)
    return {
      ...advanced,
      validation,
      sourceHash: validation.sourceHash,
      sourceBytes: validation.sourceBytes,
    }
  })

export const findAdvancedStrategy = (
  advancedId: AdvancedStrategyId | string,
): AdvancedStrategySummary | null =>
  listAdvancedStrategies().find((advanced) => advanced.id === advancedId) ??
  null

export const buildAdvancedStrategyRevision = (
  advanced: AdvancedStrategyDefinition,
): StrategyRevision => {
  const validation = validateStrategySource(advanced.source)
  return buildStrategyRevision({
    source: advanced.source,
    strategyId: `strategy:system:${advanced.id}`,
    metadata: {
      createdBy: "system:advanced-library",
      label: advanced.name,
      notes: advanced.description,
      tags: advanced.tags,
      advancedLineage: {
        advancedId: advanced.id,
        advancedName: advanced.name,
        advancedVersion: advanced.version,
        archetype: advanced.primaryArchetype,
        sourceHash: validation.sourceHash,
      },
    },
  })
}
