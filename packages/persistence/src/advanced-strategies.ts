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

interface AdvancedDoctrineProfile {
  banner: string
  doctrine: string
  contactBias: number
  centerBias: number
  wallBias: number
  mobilityBias: number
  trapBias: number
  memoryBias: number
  lateBias: number
}

const assertStarterBenchmarkExists = (starterId: StarterStrategyId): void => {
  if (!findStarterStrategy(starterId)) {
    throw new Error(`Advanced seed benchmark Starter not found: ${starterId}`)
  }
}

const makeAdvancedSource = (
  benchmarkStarterId: StarterStrategyId,
  profile: AdvancedDoctrineProfile,
): string => {
  assertStarterBenchmarkExists(benchmarkStarterId)
  return `// Advanced seed v1.5: ${profile.banner}
// Benchmark reference: ${benchmarkStarterId}.
// Shared baseline: leave starting edge early, take rear-square chances, avoid outer-ring contraction risk,
// avoid self-stoning, avoid off-board moves, and keep archetype flavor as a secondary priority.
const profile = ${JSON.stringify(profile, null, 2)}
const directions = ["UP", "RIGHT", "DOWN", "LEFT"]
const reverse = { UP: "DOWN", RIGHT: "LEFT", DOWN: "UP", LEFT: "RIGHT" }
const dx = { UP: 0, RIGHT: 1, DOWN: 0, LEFT: -1 }
const dy = { UP: -1, RIGHT: 0, DOWN: 1, LEFT: 0 }
const step = (p, d) => p ? { x: p.x + dx[d], y: p.y + dy[d] } : null
const inside = (p, b) => p && p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY
const dist = (a, b) => a && b ? Math.abs(a.x - b.x) + Math.abs(a.y - b.y) : 99
const centerDist = (p, b) => p ? Math.abs(p.x - (b.minX + b.maxX) / 2) + Math.abs(p.y - (b.minY + b.maxY) / 2) : 99
const toward = (a, b, f) => !a || !b ? f : Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (b.x > a.x ? "RIGHT" : "LEFT") : b.y !== a.y ? (b.y > a.y ? "DOWN" : "UP") : f
const edge = (p, b) => p && (p.x === b.minX || p.x === b.maxX || p.y === b.minY || p.y === b.maxY)
const nearEnemy = (s, es) => es.filter((e) => e.status === "ACTIVE" && e.position).sort((a, b) => dist(s.position, a.position) - dist(s.position, b.position))[0] ?? null
const c = (g, d) => g.cells.find((x) => x.dx === dx[d] && x.dy === dy[d])
const rc = (g, x, y) => g.cells.find((cell) => cell.dx === x && cell.dy === y)
const relDir = (x, y, f) => Math.abs(x) > Math.abs(y) ? (x > 0 ? "RIGHT" : "LEFT") : y ? (y > 0 ? "DOWN" : "UP") : f
const behind = (f) => f === "UP" ? [0, 1] : f === "DOWN" ? [0, -1] : f === "LEFT" ? [1, 0] : [-1, 0]
const safeBoard = (s, input) =>
  directions.filter((d) => inside(step(s.position, d), input.board.bounds))
const backstabBoard = (s, input) => {
  for (const e of input.enemySoldiers) {
    if (e.status !== "ACTIVE" || !e.position || !e.facing) continue
    const b = behind(e.facing)
    const target = { x: e.position.x + b[0], y: e.position.y + b[1] }
    if (inside(target, input.board.bounds) && dist(s.position, target) === 1) return toward(s.position, target, s.facing ?? "UP")
  }
  return null
}
const prefer = (s, input) => {
  const e = nearEnemy(s, input.enemySoldiers)
  const toEnemy = toward(s.position, e?.position, s.facing ?? "UP")
  const toCenter = directions.filter((d) => inside(step(s.position, d), input.board.bounds)).sort((a, b) => centerDist(step(s.position, a), input.board.bounds) - centerDist(step(s.position, b), input.board.bounds))[0] ?? toEnemy
  if (profile.centerBias + profile.lateBias + profile.mobilityBias > profile.contactBias + profile.wallBias) return toCenter
  return backstabBoard(s, input) ?? toEnemy
}
const rearMove = (g) => {
  for (const e of g.cells) {
    if (e.contents !== "ENEMY_ACTIVE" || !e.facing) continue
    const b = behind(e.facing)
    const tx = e.dx + b[0]
    const ty = e.dy + b[1]
    if (Math.abs(tx) + Math.abs(ty) === 1 && rc(g, tx, ty)?.contents === "EMPTY") return relDir(tx, ty, "UP")
    if (tx === 0 && ty === 0 && Math.abs(e.dx) + Math.abs(e.dy) === 1) return relDir(e.dx, e.dy, "UP")
  }
  return null
}
const wallAway = (g, d) => g.cells.reduce((n, x) => n + (x.contents !== "WALL" ? 0 : x.dx < 0 && d === "RIGHT" ? 8 : x.dx > 0 && d === "LEFT" ? 8 : x.dy < 0 && d === "DOWN" ? 8 : x.dy > 0 && d === "UP" ? 8 : 0), 0)
const score = (input, d, o, m) => {
  const cell = c(input.awarenessGrid, d)
  if (!cell || cell.contents === "WALL" || cell.contents === "TERRAIN_STONE" || cell.contents.endsWith("STONE")) return -999
  if (input.self.lastSuccessfulMoveDirection === reverse[d]) return -998
  const activeContact = cell.contents === "ENEMY_ACTIVE" || cell.contents === "FRIENDLY_ACTIVE"
  if (activeContact && (cell.facing === d || cell.facing === reverse[d])) return -997
  if (cell.contents === "FRIENDLY_ACTIVE" && rc(input.awarenessGrid, dx[d] * 2, dy[d] * 2)?.contents === "WALL") return -997
  let s = cell.contents === "ENEMY_ACTIVE" ? 6 + profile.contactBias : cell.contents === "FRIENDLY_ACTIVE" ? -3 : 1
  if (d === o.preferred) s += 12
  if ((o.safeDirs ?? []).includes(d)) s += 5
  if (d === m.last) s += profile.memoryBias
  s += wallAway(input.awarenessGrid, d) * (o.contractionSoon ? 3 : 1)
  if (profile.mobilityBias && d !== m.tried) s += profile.mobilityBias
  if (o.contractionSoon && cell.contents === "EMPTY") s += profile.lateBias
  if (cell.contents === "ENEMY_ACTIVE") s += profile.trapBias
  return s
}

export default {
  selectActivations(input) {
    const memory = input.strategyMemory && typeof input.strategyMemory === "object" ? input.strategyMemory : {}
    const contractionSoon = input.roundNumber === 4
    const active = input.mySoldiers.filter((soldier) => soldier.status === "ACTIVE" && soldier.position)
    const ranked = active
      .map((soldier, index) => {
        const unmoved = soldier.lastSuccessfulMoveDirection ? 0 : 1
        const enemy = nearEnemy(soldier, input.enemySoldiers)
        const edgeRisk = edge(soldier.position, input.board.bounds) ? 1 : 0
        const backstabReady = backstabBoard(soldier, input) ? 1 : 0
        const pressure = 20 - dist(soldier.position, enemy?.position)
        const center = 20 - centerDist(soldier.position, input.board.bounds)
        const score =
          unmoved * 1000 +
          backstabReady * 700 +
          (contractionSoon ? edgeRisk * 600 : edgeRisk * 80) +
          pressure * profile.contactBias +
          center * (profile.centerBias + profile.lateBias) +
          (profile.mobilityBias * (soldier.id === memory.lastSelected ? -3 : 1)) +
          index * -0.01
        return { soldier, score }
      })
      .sort((left, right) => right.score - left.score)
    const selected = ranked.slice(0, input.activationCount).map(({ soldier }) => {
      const preferred = prefer(soldier, input)
      return {
        soldierId: soldier.id,
        objective: {
          doctrine: profile.doctrine,
          preferred,
          safeDirs: safeBoard(soldier, input),
          contractionSoon,
          seekBackstab: true,
        },
      }
    })
    return {
      activationOrders: selected,
      strategyMemory: {
        ...memory,
        lastSelected: selected[0]?.soldierId ?? memory.lastSelected ?? null,
        selectedThisRound: selected.map((entry) => entry.soldierId),
      },
    }
  },
  soldierBrain(input) {
    const memory = input.soldierMemory && typeof input.soldierMemory === "object" ? input.soldierMemory : {}
    const objective = input.objective && typeof input.objective === "object" ? input.objective : {}
    const backstab = rearMove(input.awarenessGrid)
    const best = directions
      .map((direction) => [direction, score(input, direction, objective, memory)])
      .sort((left, right) => right[1] - left[1])
    const chosen = backstab && score(input, backstab, objective, memory) > -900 ? backstab : (best[0]?.[1] > -900 ? best[0][0] : null)
    if (chosen) {
      return {
        action: { type: "MOVE", direction: chosen },
        soldierMemory: {
          ...memory,
          last: chosen,
          tried: chosen,
          doctrine: profile.doctrine,
        },
      }
    }
    const seen = input.awarenessGrid.cells.filter((cell) => cell.contents === "ENEMY_ACTIVE").sort((a, b) => Math.abs(a.dx) + Math.abs(a.dy) - (Math.abs(b.dx) + Math.abs(b.dy)))[0]
    const turn = objective.preferred ?? (seen ? relDir(seen.dx, seen.dy, input.self.facing ?? "UP") : input.self.facing ?? "UP")
    return {
      action: { type: "TURN", direction: turn },
      soldierMemory: {
        ...memory,
        tried: turn,
        doctrine: profile.doctrine,
      },
    }
  }
}
`.trim()
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
      source: makeAdvancedSource("starter:aggro-chaser", {
        banner: "pressure/contact escalation",
        doctrine: "vanguard-pressure",
        contactBias: 5,
        centerBias: 1,
        wallBias: 1,
        mobilityBias: 1,
        trapBias: 0,
        memoryBias: 0,
        lateBias: 1,
      }),
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
      source: makeAdvancedSource("starter:escape-artist", {
        banner: "anti-backstab lane memory",
        doctrine: "rear-guard-sentinel",
        contactBias: 2,
        centerBias: 2,
        wallBias: 0,
        mobilityBias: 4,
        trapBias: 1,
        memoryBias: 5,
        lateBias: 2,
      }),
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
      source: makeAdvancedSource("starter:wall-press", {
        banner: "wall-control shear",
        doctrine: "stonewall-shear",
        contactBias: 4,
        centerBias: 0,
        wallBias: 5,
        mobilityBias: 1,
        trapBias: 1,
        memoryBias: 0,
        lateBias: 1,
      }),
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
      source: makeAdvancedSource("starter:centerline-bully", {
        banner: "center gravity",
        doctrine: "center-gravity",
        contactBias: 3,
        centerBias: 5,
        wallBias: 0,
        mobilityBias: 1,
        trapBias: 0,
        memoryBias: 0,
        lateBias: 2,
      }),
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
      source: makeAdvancedSource("starter:center-turtle", {
        banner: "contraction shelter",
        doctrine: "ring-shelter",
        contactBias: 1,
        centerBias: 4,
        wallBias: 0,
        mobilityBias: 3,
        trapBias: 1,
        memoryBias: 4,
        lateBias: 5,
      }),
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
      source: makeAdvancedSource("starter:escape-artist", {
        banner: "evasive orbit",
        doctrine: "ghost-orbit",
        contactBias: 1,
        centerBias: 2,
        wallBias: 0,
        mobilityBias: 5,
        trapBias: 0,
        memoryBias: 4,
        lateBias: 3,
      }),
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
      source: makeAdvancedSource("starter:trap-setter", {
        banner: "trap-control snare",
        doctrine: "snare-weaver",
        contactBias: 2,
        centerBias: 1,
        wallBias: 2,
        mobilityBias: 2,
        trapBias: 5,
        memoryBias: 4,
        lateBias: 2,
      }),
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
      source: makeAdvancedSource("starter:mirror-breaker", {
        banner: "mirror-key memory",
        doctrine: "mirror-key",
        contactBias: 3,
        centerBias: 2,
        wallBias: 1,
        mobilityBias: 3,
        trapBias: 1,
        memoryBias: 5,
        lateBias: 2,
      }),
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
      source: makeAdvancedSource("starter:corner-lurker", {
        banner: "late-cycle light",
        doctrine: "last-light",
        contactBias: 1,
        centerBias: 3,
        wallBias: 0,
        mobilityBias: 3,
        trapBias: 1,
        memoryBias: 4,
        lateBias: 6,
      }),
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
      source: makeAdvancedSource("starter:mirror-breaker", {
        banner: "recall hunter",
        doctrine: "recall-hunter",
        contactBias: 4,
        centerBias: 1,
        wallBias: 1,
        mobilityBias: 2,
        trapBias: 1,
        memoryBias: 6,
        lateBias: 1,
      }),
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
