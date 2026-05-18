import { describe, expect, it } from "vitest"
import type {
  AwarenessCell,
  RuntimeViolationType,
  SoldierBrainInput,
  SoldierSnapshot,
  StrategyInput,
  StrategyRevision,
  StrategyRevisionValidationCode,
} from "@cowards/spec"
import type { StrategyExecutionAdapter } from "./adapter.js"
import { createRuntimeFromRevision } from "./executor.js"
import { buildStrategyRevision } from "./revision.js"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"

const bottomSoldier: SoldierSnapshot = {
  id: "bottom-1",
  ownerPlayerId: "bottom",
  status: "ACTIVE",
  position: { x: 5, y: 10 },
  facing: "UP",
  lastSuccessfulMoveDirection: null,
}

const topSoldier: SoldierSnapshot = {
  id: "top-1",
  ownerPlayerId: "top",
  status: "ACTIVE",
  position: { x: 5, y: 1 },
  facing: "DOWN",
  lastSuccessfulMoveDirection: null,
}

const awarenessCells = (): AwarenessCell[] => {
  const cells: AwarenessCell[] = []
  for (const dy of [-2, -1, 0, 1, 2] as const) {
    for (const dx of [-2, -1, 0, 1, 2] as const) {
      cells.push({
        dx,
        dy,
        absoluteX: (bottomSoldier.position?.x ?? 0) + dx,
        absoluteY: (bottomSoldier.position?.y ?? 0) + dy,
        contents: dx === 0 && dy === 0 ? "FRIENDLY_ACTIVE" : "EMPTY",
      })
    }
  }
  return cells
}

const strategyInput: StrategyInput = {
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [bottomSoldier, topSoldier],
    terrainStones: [],
  },
  mySoldiers: [bottomSoldier],
  enemySoldiers: [topSoldier],
  strategyMemory: {},
}

const soldierBrainInput: SoldierBrainInput = {
  self: bottomSoldier,
  awarenessGrid: { cells: awarenessCells() },
  cycleIndex: 0,
  maxCycles: 12,
  soldierMemory: {},
}

const validSource = `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: {},
    }
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { cycle: input.cycleIndex },
    }
  },
}
`

const sourceWithSelectBody = (body: string): string => `
export default {
  selectActivations(input) {
${body
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  },
  soldierBrain(input) {
    return {
      action: { type: "TURN_TO_STONE" },
      soldierMemory: { cycle: input.cycleIndex },
    }
  },
}
`

const sourceWithBrainBody = (body: string): string => `
export default {
  selectActivations(input) {
    return {
      activationOrders: input.mySoldiers.slice(0, input.activationCount).map((soldier) => ({
        soldierId: soldier.id,
        objective: { target: soldier.id },
      })),
      strategyMemory: {},
    }
  },
  soldierBrain(input) {
${body
  .split("\n")
  .map((line) => `    ${line}`)
  .join("\n")}
  },
}
`

const forgedValidRevision = (source: string): StrategyRevision => {
  const revision = buildStrategyRevision({ source: validSource })
  return {
    ...revision,
    source,
    validation: {
      ...revision.validation,
      valid: true,
      errors: [],
    },
  }
}

type HostileCase = {
  label: string
  source: string
  method: "selectActivations" | "soldierBrain"
  forgeValidRevision?: boolean
  timeoutMs?: number
  expectedViolations: readonly RuntimeViolationType[]
  expectedValidationCode?: StrategyRevisionValidationCode
  subprocess?: boolean
  allowedSystemFailures?: readonly string[]
}

const hostileCases: readonly HostileCase[] = [
  {
    label: "forbidden global Math.random",
    source: sourceWithSelectBody(`
Math.random()
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "dynamic import attempt rejected by revision validation",
    source: sourceWithSelectBody(`
import("node:fs")
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    expectedViolations: ["INVALID_OUTPUT"],
    expectedValidationCode: "IMPORT_NOT_ALLOWED",
    subprocess: true,
  },
  {
    label: "process access",
    source: sourceWithSelectBody(`
process.cwd()
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "worker constructor access",
    source: sourceWithSelectBody(`
new Worker("data:text/javascript,void 0")
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "filesystem module access",
    source: sourceWithSelectBody(`
require("node:fs")
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "network fetch access",
    source: sourceWithSelectBody(`
fetch("https://example.invalid")
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "infinite loop",
    source: sourceWithSelectBody("while (true) {}"),
    method: "selectActivations",
    timeoutMs: 25,
    expectedViolations: ["TIMEOUT"],
    subprocess: true,
  },
  {
    label: "memory pressure loop",
    source: sourceWithSelectBody(`
const pressure = []
while (true) {
  pressure.push("x".repeat(1024))
}
`),
    method: "selectActivations",
    timeoutMs: 25,
    expectedViolations: ["TIMEOUT", "OVERSIZED_OUTPUT"],
    subprocess: true,
    allowedSystemFailures: ["SUBPROCESS_SIGNAL"],
  },
  {
    label: "oversized StrategyMemory output",
    source: sourceWithSelectBody(
      'return { activationOrders: [], strategyMemory: "x".repeat(32769) }',
    ),
    method: "selectActivations",
    expectedViolations: ["OVERSIZED_OUTPUT"],
    subprocess: true,
  },
  {
    label: "invalid SoldierBrain output",
    source: sourceWithBrainBody(
      'return { action: { type: "FLY" }, soldierMemory: {} }',
    ),
    method: "soldierBrain",
    expectedViolations: ["INVALID_OUTPUT"],
    subprocess: true,
  },
  {
    label: "thrown Strategy exception",
    source: sourceWithSelectBody('throw new Error("hostile boom")'),
    method: "selectActivations",
    expectedViolations: ["THROWN_EXCEPTION"],
    subprocess: true,
  },
]

const adapters: readonly {
  label: string
  createAdapter: () => StrategyExecutionAdapter
}[] = [
  {
    label: "worker-thread",
    createAdapter: createWorkerThreadStrategyExecutionAdapter,
  },
  {
    label: "subprocess",
    createAdapter: createSubprocessStrategyExecutionAdapter,
  },
]

describe("hostile Strategy matrix", () => {
  it.each(hostileCases)(
    "validation posture is explicit for $label",
    (hostileCase) => {
      const revision = buildStrategyRevision({ source: hostileCase.source })
      const errorCodes = revision.validation.errors.map((error) => error.code)

      if (hostileCase.expectedValidationCode) {
        expect(errorCodes).toContain(hostileCase.expectedValidationCode)
        expect(revision.validation.valid).toBe(false)
      } else if (hostileCase.forgeValidRevision) {
        expect(revision.validation.valid).toBe(false)
      } else {
        expect(revision.validation.valid).toBe(true)
      }
    },
  )

  for (const adapterCase of adapters) {
    const casesForAdapter = hostileCases.filter(
      (hostileCase) =>
        adapterCase.label === "worker-thread" || hostileCase.subprocess,
    )

    describe(`${adapterCase.label} adapter boundary`, () => {
      it.each(casesForAdapter)("fails closed for $label", (hostileCase) => {
        const revision = hostileCase.forgeValidRevision
          ? forgedValidRevision(hostileCase.source)
          : buildStrategyRevision({ source: hostileCase.source })
        const runtime = createRuntimeFromRevision(revision, {
          adapter: adapterCase.createAdapter(),
          timeoutMs: hostileCase.timeoutMs ?? 500,
        })

        const execute = () =>
          hostileCase.method === "selectActivations"
            ? runtime.selectActivations(strategyInput)
            : runtime.runSoldierBrain(soldierBrainInput)

        try {
          const result = execute()
          expect(result.ok).toBe(false)
          if (!result.ok) {
            expect(hostileCase.expectedViolations).toContain(
              result.violation.type,
            )
          }
        } catch (error) {
          expect(error).toBeInstanceOf(SubprocessSystemFailure)
          const code = (error as SubprocessSystemFailure).code
          expect(hostileCase.allowedSystemFailures ?? []).toContain(code)
        }
      })
    })
  }
})
