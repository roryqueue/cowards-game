import type { SpawnSyncReturns } from "node:child_process"
import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  STRATEGY_RUNTIME_ABI_VERSION,
  SoldierBrainInputSchema,
  StrategyInputSchema,
  createSelectedRuntimeInvocationRequestV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationBudgetV117,
  serializeRuntimeInvocationRequestV117,
  verifySelectedRuntimeInvocationRequestV117,
  verifyRuntimeInvocationResponseV117,
  type AuthenticatedRuntimeInvocationRequestV117,
  type AwarenessCell,
  type RuntimeViolationType,
  type RuntimeInvocationExecutionReceiptEvidenceV117,
  type RuntimeInvocationSigningIdentityV117,
  type SoldierBrainInput,
  type SoldierSnapshot,
  type StrategyInput,
  type StrategyRevision,
  type StrategyRevisionValidationCode,
} from "@cowards/spec"
import type { StrategyExecutionAdapter } from "./adapter.js"
import { createRuntimeFromRevision } from "./executor.js"
import { buildStrategyRevision } from "./revision.js"
import { createSubprocessStrategyExecutionAdapter } from "./subprocess-adapter.js"
import { SubprocessSystemFailure } from "./subprocess-ipc.js"
import { createWorkerThreadStrategyExecutionAdapter } from "./worker-thread-adapter.js"
import { registerCandidateEvidenceFixture } from "./candidate-evidence-fixture.js"
import { encodeCandidateHostEnvelopeV117 } from "./candidate-host-envelope.js"

const legacyRuntimeIsSelected =
  String(STRATEGY_RUNTIME_ABI_VERSION) === "strategy-runtime-abi-v1.14"

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

const strategyInput: StrategyInput = StrategyInputSchema.parse({
  phaseNumber: 1,
  roundNumber: 1,
  activationCount: 1,
  initialInitiativePlayerId: "bottom",
  hasInitialInitiative: true,
  roundInitiativePlayerId: "bottom",
  hasRoundInitiative: true,
  board: {
    bounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    soldiers: [bottomSoldier, topSoldier],
    terrainStones: [],
  },
  mySoldiers: [bottomSoldier],
  enemySoldiers: [topSoldier],
  strategyMemory: {},
})

const soldierBrainInput: SoldierBrainInput = {
  ...SoldierBrainInputSchema.parse({
    self: bottomSoldier,
    awarenessGrid: { cells: awarenessCells() },
    cycleIndex: 0,
    maxCycles: 12,
    hasAdvancedThisActivation: false,
    soldierMemory: {},
  }),
  objective: null,
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
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "forbidden global crypto.randomUUID",
    source: sourceWithSelectBody(`
crypto.randomUUID()
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "forbidden global crypto.getRandomValues",
    source: sourceWithSelectBody(`
crypto.getRandomValues(new Uint8Array(1))
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "forbidden global performance.now",
    source: sourceWithSelectBody(`
performance.now()
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
    subprocess: true,
  },
  {
    label: "forbidden global Buffer.from",
    source: sourceWithSelectBody(`
Buffer.from("abc")
return { activationOrders: [], strategyMemory: {} }
`),
    method: "selectActivations",
    forgeValidRevision: true,
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
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
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
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
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
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
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
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
    expectedViolations: ["INVALID_OUTPUT", "FORBIDDEN_CAPABILITY"],
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

const candidateIdentity: RuntimeInvocationSigningIdentityV117 = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:runtime-invocation-v1.17:secret",
}

const candidateHash = (value: string): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(value).digest("hex")}`

const expectedCandidateRequest = createSelectedRuntimeInvocationRequestV117(
  {
    requestId: "request:runtime-js:hostile:v1.17",
    invocationId: "invocation:runtime-js:hostile:v1.17",
    kernelRequestId: "kernel-request:runtime-js:hostile:v1.17",
    method: "selectActivations",
    semanticTuple: {
      rules: "cowards-rules-v1.4",
      engine: "engine-kernel-v1.37-candidate-1",
      runtimeAbi: "strategy-runtime-abi-v1.17",
      chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
      arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
      setPolicy: "canonical-set-policy-v1.4",
    },
    sourceIdentity: {
      strategyRevisionId: "strategy-revision:runtime-js:hostile:v1.17",
      originalSourceSha256: candidateHash(validSource),
      normalizedSourceSha256: candidateHash(validSource),
      artifactSha256: candidateHash(validSource),
    },
    budget: createRuntimeInvocationBudgetV117("selectActivations"),
    accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
    input: { value: { cycleIndex: 0, phase: "ROUND" } },
    retry: {
      retryId: "retry:runtime-js:hostile:v1.17",
      attempt: 0,
      previousRequestSha256: null,
    },
  },
  candidateIdentity,
)

const candidateRequestBytes = serializeRuntimeInvocationRequestV117(
  expectedCandidateRequest,
)
const admittedCandidateRequest = verifySelectedRuntimeInvocationRequestV117(
  candidateRequestBytes,
  candidateIdentity,
)
if (admittedCandidateRequest.kind !== "success") {
  throw new Error("candidate request fixture failed runtime-js test admission")
}
const admittedExpectedCandidateRequest =
  admittedCandidateRequest.value as AuthenticatedRuntimeInvocationRequestV117

type CandidateAdapter = StrategyExecutionAdapter & {
  executeV117(input: {
    requestBytes: Uint8Array
    executableSource: string
    signingIdentity: RuntimeInvocationSigningIdentityV117
  }): Uint8Array
}

const completeCandidateEvidence =
  (): RuntimeInvocationExecutionReceiptEvidenceV117 => {
    const prestate = admittedExpectedCandidateRequest.accounting.prestate
    const counters = Object.fromEntries(
      [
        "wallMilliseconds",
        "computeFuel",
        "payloadBytes",
        "stdoutBytes",
        "stderrBytes",
      ].map((counter) => [
        counter,
        {
          status: "measured" as const,
          delta: counter === "stderrBytes" ? 0 : 1,
          cumulative:
            prestate.cumulative[counter as keyof typeof prestate.cumulative] +
            (counter === "stderrBytes" ? 0 : 1),
        },
      ]),
    ) as RuntimeInvocationExecutionReceiptEvidenceV117["counters"]
    return {
      attribution: "proven_strategy",
      counters,
      memory: {
        status: "measured",
        peakBytes: 1,
        cumulativePeakBytes: 1,
      },
      process: {
        status: "verified",
        processes: 1,
        threads: 1,
        children: 0,
      },
      capabilities: {
        status: "verified",
        filesystem: "none",
        network: "disabled",
        environment: "empty",
        shell: "disabled",
      },
      cancellation: {
        status: "verified",
        terminationRequired: false,
        receiptPresent: false,
        graceMilliseconds: 0,
      },
      accountingEvidence: {
        status: "verified",
        signatureVerified: true,
        monotonic: true,
      },
    }
  }

const executeCandidate = (
  stdout: string,
  resultOverrides: Partial<SpawnSyncReturns<string>> = {},
  receiptEvidence?: RuntimeInvocationExecutionReceiptEvidenceV117,
) => {
  const adapter = createSubprocessStrategyExecutionAdapter({
    spawnSync: () => {
      const frame = Buffer.from(stdout)
      const stdoutBuffer =
        resultOverrides.error !== undefined || frame.byteLength === 0
          ? frame
          : encodeCandidateHostEnvelopeV117({
              frame,
              goNanoseconds: process.hrtime.bigint(),
            })
      return {
        pid: 123,
        output: [Buffer.alloc(0), stdoutBuffer, Buffer.alloc(0)],
        stdout: stdoutBuffer,
        stderr: Buffer.alloc(0),
        status: 0,
        signal: null,
        terminationReceiptPresent: true,
        stdoutEof: true,
        stderrEof: true,
        containerCleanupRequired: false,
        containerCleanupVerified: true,
        ...resultOverrides,
      } as unknown as SpawnSyncReturns<string>
    },
  }) as CandidateAdapter
  const invocation = {
    requestBytes: Uint8Array.from(candidateRequestBytes),
    executableSource: validSource,
    signingIdentity: candidateIdentity,
  }
  if (receiptEvidence !== undefined) {
    registerCandidateEvidenceFixture(invocation, (observation) => {
      const prestate = admittedExpectedCandidateRequest.accounting.prestate
      const wallMilliseconds = observation.methodDeadlineExceeded
        ? admittedExpectedCandidateRequest.budget.methodLimit.counters
            .wallMilliseconds.maximum + 1
        : 1
      return {
        ...receiptEvidence,
        counters: {
          ...receiptEvidence.counters,
          wallMilliseconds: {
            status: "measured" as const,
            delta: wallMilliseconds,
            cumulative: prestate.cumulative.wallMilliseconds + wallMilliseconds,
          },
          payloadBytes: {
            status: "measured" as const,
            delta: observation.payloadBytes,
            cumulative:
              prestate.cumulative.payloadBytes + observation.payloadBytes,
          },
          stdoutBytes: {
            status: "measured" as const,
            delta: observation.stdoutBytes,
            cumulative:
              prestate.cumulative.stdoutBytes + observation.stdoutBytes,
          },
          stderrBytes: {
            status: "measured" as const,
            delta: observation.stderrBytes,
            cumulative:
              prestate.cumulative.stderrBytes + observation.stderrBytes,
          },
        },
        cancellation: {
          status: "verified" as const,
          ...observation.cancellation,
        },
      }
    })
  }
  const responseBytes = adapter.executeV117(invocation)
  return verifyRuntimeInvocationResponseV117(
    responseBytes,
    admittedExpectedCandidateRequest,
    candidateIdentity,
  )
}

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
          timeoutMs: hostileCase.timeoutMs ?? 5_000,
        })

        const execute = () =>
          hostileCase.method === "selectActivations"
            ? runtime.selectActivations(strategyInput)
            : runtime.runSoldierBrain(soldierBrainInput)

        let result: ReturnType<typeof execute>
        try {
          result = execute()
        } catch (error) {
          expect(error).toBeInstanceOf(SubprocessSystemFailure)
          const code = (error as SubprocessSystemFailure).code
          expect(hostileCase.allowedSystemFailures ?? []).toContain(code)
          return
        }
        expect(result.ok).toBe(false)
        if (
          !legacyRuntimeIsSelected &&
          revision.validation.valid &&
          !hostileCase.forgeValidRevision
        ) {
          expect(result).toMatchObject({
            systemFailure: { code: "MALFORMED_IPC", retryable: false },
          })
          return
        }
        if (!result.ok) {
          expect(hostileCase.expectedViolations).toContain(
            result.violation.type,
          )
        }
      })
    })
  }

  describe("v1.17 hostile raw-byte ownership", () => {
    it("requires complete accounting before assigning a duplicate payload to the player", () => {
      const stdout =
        'S{"activationOrders":[],"strategyMemory":{},"strategyMemory":{"private":"source token stderr /Users/owner"}}'
      const unaccounted = executeCandidate(stdout)
      expect(unaccounted.kind).toBe("success")
      if (unaccounted.kind === "success") {
        expect(unaccounted.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: { code: "AMBIGUOUS_ATTRIBUTION" },
        })
        expect(unaccounted.value.accounting.disposition).toBe("no_commit")
        expect(unaccounted.value.accounting.poststate).toEqual(
          admittedExpectedCandidateRequest.accounting.prestate,
        )
      }

      const result = executeCandidate(stdout, {}, completeCandidateEvidence())

      expect(result.kind).toBe("success")
      if (result.kind !== "success") return
      expect(result.value.outcome).toMatchObject({
        kind: "player_violation",
        violation: {
          code: "INVALID_OUTPUT",
          publicMessage: "Strategy returned an invalid payload.",
        },
      })
      expect(JSON.stringify(result.value.outcome)).not.toMatch(
        /private|source token|stderr|\/Users\/owner/iu,
      )
      expect(Object.keys(result.value.outcome).sort()).toEqual([
        "kind",
        "trace",
        "violation",
      ])
    })

    it("keeps malformed IPC and ambiguous host timeout system-owned", () => {
      const malformed = executeCandidate("not-a-successor-frame")
      const timedOut = executeCandidate("", {
        status: null,
        error: Object.assign(new Error("private host timeout diagnostics"), {
          code: "ETIMEDOUT",
        }),
      })

      for (const [label, result] of [
        ["malformed", malformed],
        ["timed-out", timedOut],
      ] as const) {
        expect(result.kind, label).toBe("success")
        if (result.kind !== "success") continue
        expect(result.value.outcome.kind, label).toBe("system_failure")
        expect(JSON.stringify(result.value.outcome), label).not.toMatch(
          /private host|diagnostics|stderr|stack|source/iu,
        )
        expect(Object.keys(result.value.outcome).sort(), label).toEqual([
          "failure",
          "kind",
          "trace",
        ])
      }
      if (timedOut.kind === "success") {
        expect(timedOut.value.outcome).toMatchObject({
          kind: "system_failure",
          failure: {
            code: "AMBIGUOUS_ATTRIBUTION",
            publicMessage: "Runtime system failure.",
            retryable: false,
          },
        })
      }
    })
  })
})
