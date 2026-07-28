import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import {
  ChronicleEventSchema,
  RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS,
  createAuthenticatedRuntimeInvocationRequestV117,
  createAuthenticatedRuntimeInvocationResponseV117,
  createRuntimeAbiV117ExecutionLedger,
  createRuntimeInvocationExecutionReceiptV117,
  createRuntimeInvocationBudgetV117,
  createRuntimeInvocationTraceV117,
  encodeCanonicalJson,
  type AuthenticatedRuntimeInvocationRequestV117,
  type JsonValue,
  type RuntimeInvocationResultV117,
  type RuntimeInvocationTraceV117,
  type SoldierBrainInput,
  type SoldierBrainResult,
  type StrategyInput,
  type StrategyResult,
} from "@cowards/spec"
import { MATCH_KERNEL } from "../index.js"
import type { GameState } from "../types.js"
import type { KernelEffectRequest } from "./types.js"
import type { CandidateBoundRuntimeInvocationV117 } from "./types.js"

const matchInput = {
  matchId: "phase-258-runtime-ownership",
  seed: "phase-258-runtime-ownership-seed",
  arenaVariant: {
    id: "phase-258-runtime-ownership-arena",
    name: "Phase 258 runtime ownership arena",
    initialBounds: { minX: 0, maxX: 11, minY: 0, maxY: 11 },
    terrainStones: [],
  },
  bottomPlayerId: "phase-258-bottom",
  topPlayerId: "phase-258-top",
  bottomStrategyRevisionId: "phase-258-bottom-revision",
  topStrategyRevisionId: "phase-258-top-revision",
}

const sha256 = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex")

const candidateSigningIdentity = {
  keyId: RUNTIME_INVOCATION_V1_17_TEST_KEY_ID,
  secret: "fixture-only:phase-258-engine-binding",
} as const

const candidateRequestFor = (
  request: KernelEffectRequest,
): AuthenticatedRuntimeInvocationRequestV117 =>
  createAuthenticatedRuntimeInvocationRequestV117(
    {
      requestId: "runtime-request:phase-258",
      invocationId: `invocation:${request.requestId}`,
      kernelRequestId: request.requestId,
      method: request.kind,
      semanticTuple: {
        rules: "cowards-rules-v1.4",
        engine: "engine-kernel-v1.37-candidate-1",
        runtimeAbi: "strategy-runtime-abi-v1.17",
        chronicle: "chronicle-recorder-current-events-v1.37-candidate-1",
        arenaCatalog: "semantic-arena-catalog-v1.37-candidate-1",
        setPolicy: "canonical-set-policy-v1.4",
      },
      sourceIdentity: {
        strategyRevisionId: "strategy-revision:phase-258",
        originalSourceSha256: `sha256:${"a".repeat(64)}`,
        normalizedSourceSha256: `sha256:${"b".repeat(64)}`,
        artifactSha256: `sha256:${"c".repeat(64)}`,
      },
      budget: createRuntimeInvocationBudgetV117(request.kind),
      accounting: { prestate: createRuntimeAbiV117ExecutionLedger() },
      input: { value: request.input as unknown as JsonValue },
      retry: {
        retryId: `retry:${request.requestId}`,
        attempt: 0,
        previousRequestSha256: null,
      },
    },
    candidateSigningIdentity,
  )

const traceFor = (
  request: KernelEffectRequest,
  overrides: Partial<RuntimeInvocationTraceV117> = {},
): RuntimeInvocationTraceV117 => {
  const candidate = candidateRequestFor(request)
  return {
    ...createRuntimeInvocationTraceV117(candidate, []),
    ...overrides,
  }
}

const measuredReceiptFor = (
  request: AuthenticatedRuntimeInvocationRequestV117,
  outcome: RuntimeInvocationResultV117<JsonValue>,
) => {
  const prestate = request.accounting.prestate
  const measuredCounter = (
    counter:
      | "wallMilliseconds"
      | "computeFuel"
      | "payloadBytes"
      | "stdoutBytes"
      | "stderrBytes",
    delta = 1,
  ) => ({
    status: "measured" as const,
    delta,
    cumulative: prestate.cumulative[counter] + delta,
  })
  const successPayload =
    outcome.kind === "success"
      ? encodeCanonicalJson(outcome.value, {
          context: "authenticated-outer-envelope",
        })
      : undefined
  if (successPayload !== undefined && !successPayload.ok) {
    throw new Error("engine runtime fixture payload is not canonical")
  }
  const payloadByteLength = successPayload?.bytes.byteLength ?? 1
  const stdoutByteLength = successPayload?.bytes.byteLength
    ? successPayload.bytes.byteLength + 1
    : 1
  const stderrByteLength = successPayload === undefined ? 1 : 0
  const resourceExhaustion =
    outcome.kind === "player_violation" &&
    outcome.violation.code === "RESOURCE_EXHAUSTION"
  const oversizedOutput =
    outcome.kind === "player_violation" &&
    outcome.violation.code === "OVERSIZED_OUTPUT"
  return createRuntimeInvocationExecutionReceiptV117(request, {
    attribution:
      outcome.kind === "system_failure"
        ? ("ambiguous" as const)
        : ("proven_strategy" as const),
    counters: {
      wallMilliseconds: measuredCounter("wallMilliseconds"),
      computeFuel: measuredCounter(
        "computeFuel",
        resourceExhaustion ? 10_000_001 : 1,
      ),
      payloadBytes: measuredCounter(
        "payloadBytes",
        oversizedOutput
          ? request.budget.methodLimit.counters.payloadBytes.maximum + 1
          : payloadByteLength,
      ),
      stdoutBytes: measuredCounter(
        "stdoutBytes",
        oversizedOutput
          ? request.budget.methodLimit.counters.stdoutBytes.maximum + 1
          : stdoutByteLength,
      ),
      stderrBytes: measuredCounter("stderrBytes", stderrByteLength),
    },
    memory: {
      status: "measured",
      peakBytes: 1,
      cumulativePeakBytes: Math.max(prestate.cumulative.memoryBytes, 1),
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
  })
}

/* eslint-disable no-redeclare -- Overloads preserve the request-specific Strategy result type in this test fixture. */
function bindOutcome(
  request: RuntimeRequestFor<"selectActivations">,
  outcome: RuntimeInvocationResultV117<StrategyResult>,
  authenticate?: boolean,
): CandidateBoundRuntimeInvocationV117<StrategyResult>
function bindOutcome(
  request: RuntimeRequestFor<"soldierBrain">,
  outcome: RuntimeInvocationResultV117<SoldierBrainResult>,
  authenticate?: boolean,
): CandidateBoundRuntimeInvocationV117<SoldierBrainResult>
function bindOutcome(
  request: KernelEffectRequest,
  outcome:
    | RuntimeInvocationResultV117<StrategyResult>
    | RuntimeInvocationResultV117<SoldierBrainResult>,
  authenticate = true,
): CandidateBoundRuntimeInvocationV117<StrategyResult | SoldierBrainResult> {
  const candidate = candidateRequestFor(request)
  const boundOutcome = authenticate
    ? createAuthenticatedRuntimeInvocationResponseV117(
        candidate,
        outcome as RuntimeInvocationResultV117<JsonValue>,
        measuredReceiptFor(
          candidate,
          outcome as RuntimeInvocationResultV117<JsonValue>,
        ),
        candidateSigningIdentity,
      ).outcome
    : outcome
  return {
    kind: "v1_17_bound",
    request: candidate,
    outcome: boundOutcome as RuntimeInvocationResultV117<
      StrategyResult | SoldierBrainResult
    >,
  }
}
/* eslint-enable no-redeclare */

const initialState = (): GameState =>
  (MATCH_KERNEL.createMachine(matchInput) as { state: GameState }).state

const withPrivateMemory = (): GameState => {
  const state = globalThis.structuredClone(initialState())
  state.players[0].strategyMemory = { retainedStrategy: "bottom" }
  state.players[1].strategyMemory = { retainedStrategy: "top" }
  state.soldiers = state.soldiers.map((soldier, index) => ({
    ...soldier,
    soldierMemory: { retainedSoldier: index },
  }))
  return state
}

type RuntimeRequestFor<TKind extends KernelEffectRequest["kind"]> = Extract<
  KernelEffectRequest,
  { kind: TKind }
>

const soldierEffectFor = (
  state: GameState,
  soldierId: string,
): RuntimeRequestFor<"soldierBrain"> => {
  let machine = MATCH_KERNEL.createActivationMachineV117({ state, soldierId })
  for (let step = 0; step < 20; step += 1) {
    const result = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
    if (result.kind === "effect") {
      if (result.request.kind !== "soldierBrain") {
        throw new Error("candidate activation yielded wrong effect")
      }
      return result.request
    }
    if (result.kind !== "transition") {
      throw new Error("candidate activation failed before Soldier effect")
    }
    machine = result.machine
  }
  throw new Error("candidate activation did not yield a Soldier effect")
}

describe("Phase 258 successor runtime ownership", () => {
  it("selects the exact legacy or authenticated current runtime call contract", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    soldier.soldierMemory = { n: 0 }
    let callContract: unknown
    const selectedV117 =
      String(MATCH_KERNEL.tuple.runtimeAbi) === "strategy-runtime-abi-v1.17"

    const execution = MATCH_KERNEL.runActivationFromState({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ) {
          callContract = {
            argumentCount: arguments.length,
            inputFrozen: Object.isFrozen(input),
            memoryFrozen: Object.isFrozen(input.soldierMemory),
          }
          if (selectedV117) {
            if (!request) throw new Error("driver omitted kernel request")
            return bindOutcome(request, {
              kind: "success",
              value: {
                action: { type: "TURN_TO_STONE" as const },
                soldierMemory: { n: 1 },
              },
              trace: traceFor(request),
            })
          }
          ;(input.soldierMemory as { n: number }).n += 1
          return {
            kind: "legacy-user-metadata",
            ok: true as const,
            value: {
              action: { type: "TURN_TO_STONE" as const },
              soldierMemory: input.soldierMemory,
            },
          }
        },
      },
    })

    expect(callContract).toEqual({
      argumentCount: selectedV117 ? 2 : 1,
      inputFrozen: selectedV117,
      memoryFrozen: selectedV117,
    })
    expect(execution).toMatchObject({ kind: "completed" })
    expect(
      execution.result?.state.soldiers.find(({ id }) => id === soldier.id)
        ?.soldierMemory,
    ).toEqual({ n: 1 })
  })

  it("rejects an unbound legacy success on the v1.17-only runtime path", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain() {
          return {
            ok: true as const,
            value: {
              action: { type: "TURN_TO_STONE" as const },
              soldierMemory: { unboundMustNotCommit: true },
            },
          }
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_UNDECODABLE",
      },
      unchangedState: state,
    })
  })

  it("makes v1.17 effect identity unique to the complete prestate", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    const same = globalThis.structuredClone(state)
    const hidden = globalThis.structuredClone(state)
    const hiddenSoldier = hidden.soldiers.find(({ id }) => id !== soldier.id)
    if (!hiddenSoldier) throw new Error("missing hidden fixture soldier")
    hiddenSoldier.soldierMemory = { hiddenPrestate: "different" }
    const initiative = globalThis.structuredClone(state)
    initiative.initiativePlayerId = initiative.players[1].id
    const match = globalThis.structuredClone(state)
    match.matchId = `${match.matchId}:different`

    const request = soldierEffectFor(state, soldier.id)
    const sameRequest = soldierEffectFor(same, soldier.id)
    const hiddenRequest = soldierEffectFor(hidden, soldier.id)
    const initiativeRequest = soldierEffectFor(initiative, soldier.id)
    const matchRequest = soldierEffectFor(match, soldier.id)

    expect(sameRequest.requestId).toBe(request.requestId)
    expect(hiddenRequest.input).toEqual(request.input)
    expect(initiativeRequest.input).toEqual(request.input)
    expect(hiddenRequest.requestId).not.toBe(request.requestId)
    expect(initiativeRequest.requestId).not.toBe(request.requestId)
    expect(matchRequest.requestId).not.toBe(request.requestId)

    const replayed = MATCH_KERNEL.runActivationFromStateV117({
      state: hidden,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain() {
          return bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { replayMustNotCommit: true },
            },
            trace: traceFor(request),
          })
        },
      },
    })

    expect(replayed).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: hidden,
    })
  })

  it("normalizes a v1.17 success only at the driver seam", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations(
          _input: StrategyInput,
          request?: RuntimeRequestFor<"selectActivations">,
        ): CandidateBoundRuntimeInvocationV117<StrategyResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "success",
            value: { activationOrders: [], strategyMemory: null },
            trace: traceFor(request),
          })
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: { committedOnlyAfterValidation: true },
            },
            trace: traceFor(request),
          })
        },
      },
    })

    expect(execution.kind).toBe("completed")
    if (execution.kind !== "completed" || !execution.result) return
    expect(
      execution.result.state.soldiers.find(({ id }) => id === soldier.id)
        ?.soldierMemory,
    ).toEqual({ committedOnlyAfterValidation: true })
  })

  it("applies only the engine-owned v1.4 consequence to an adapter-classified player violation", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    const beforeMemory = sha256({
      players: state.players.map(({ strategyMemory }) => strategyMemory),
      soldiers: state.soldiers.map(({ soldierMemory }) => soldierMemory),
    })
    const observations: SoldierBrainInput[] = []

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          observations.push(globalThis.structuredClone(input))
          return bindOutcome(request, {
            kind: "player_violation",
            violation:
              RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.RESOURCE_EXHAUSTION,
            trace: traceFor(request, {
              safeCodes: ["STRATEGY_RESOURCE_EXHAUSTION_PROVEN"],
            }),
          })
        },
      },
    })

    expect(execution.kind).toBe("completed")
    if (
      execution.kind !== "completed" ||
      !execution.result ||
      !execution.recorderMaterial
    )
      return
    const after = execution.result.state
    const memoryAfter = sha256({
      players: after.players.map(({ strategyMemory }) => strategyMemory),
      soldiers: after.soldiers.map(({ soldierMemory }) => soldierMemory),
    })
    expect(memoryAfter).toBe(beforeMemory)
    expect(observations).toHaveLength(1)
    expect(execution.result.events.map(({ type }) => type)).toEqual([
      "ACTIVATION_STARTED",
      "CYCLE_STARTED",
      "AWARENESS_GRID_OBSERVED",
      "RUNTIME_VIOLATION",
      "SOLDIER_STONED",
      "ACTIVATION_ENDED",
    ])
    expect(after.soldiers.find(({ id }) => id === soldier.id)?.status).toBe(
      "STONE",
    )
    const violationEvent = execution.result.events.find(
      ({ type }) => type === "RUNTIME_VIOLATION",
    )
    expect(violationEvent?.payload).toMatchObject({ type: "TIMEOUT" })
    const privateViolationEvent = execution.recorderMaterial.events.find(
      ({ type }) => type === "RUNTIME_VIOLATION",
    )
    expect(privateViolationEvent?.privatePayload).toMatchObject({
      violation: { type: "RESOURCE_EXHAUSTION" },
    })
    expect(ChronicleEventSchema.safeParse(violationEvent).success).toBe(true)
  })

  it("preserves historical OVERSIZED_OUTPUT gameplay and Chronicle vocabulary", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(request, {
            kind: "player_violation",
            violation:
              RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.OVERSIZED_OUTPUT,
            trace: traceFor(request, { safeCodes: ["PAYLOAD_CAP_EXCEEDED"] }),
          })
        },
      },
    })

    expect(execution.kind).toBe("completed")
    if (
      execution.kind !== "completed" ||
      !execution.result ||
      !execution.recorderMaterial
    )
      return
    const violationEvent = execution.result.events.find(
      ({ type }) => type === "RUNTIME_VIOLATION",
    )
    expect(violationEvent?.payload).toMatchObject({ type: "OVERSIZED_OUTPUT" })
    const privateViolationEvent = execution.recorderMaterial.events.find(
      ({ type }) => type === "RUNTIME_VIOLATION",
    )
    expect(privateViolationEvent?.privatePayload).toMatchObject({
      violation: { type: "OVERSIZED_OUTPUT" },
    })
  })

  it.each([
    ["adapter-crash", "ADAPTER_CRASH", true],
    ["wrong-binding", "OUTER_FRAME_WRONG_BINDING", false],
  ] as const)(
    "rolls back private state, events, outcome, and observations for %s",
    (_caseName, code, retryable) => {
      const state = withPrivateMemory()
      const soldier = state.soldiers.find(
        (candidate) => candidate.ownerPlayerId === state.players[0].id,
      )
      if (!soldier) throw new Error("missing fixture soldier")
      const before = sha256(state)
      const observations: SoldierBrainInput[] = []

      const execution = MATCH_KERNEL.runActivationFromStateV117({
        state,
        soldierId: soldier.id,
        runtime: {
          selectActivations() {
            throw new Error("selection is unreachable in activation mode")
          },
          runSoldierBrain(
            input: SoldierBrainInput,
            request?: RuntimeRequestFor<"soldierBrain">,
          ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
            if (!request) throw new Error("driver omitted kernel request")
            observations.push(globalThis.structuredClone(input))
            expect(Object.isFrozen(input)).toBe(true)
            expect(Object.isFrozen(input.soldierMemory)).toBe(true)
            expect(() => {
              ;(
                input.soldierMemory as Record<string, unknown>
              ).attemptMutation = "must-not-reach-gameplay"
            }).toThrow()
            return bindOutcome(request, {
              kind: "system_failure",
              failure: {
                code,
                publicMessage: "Runtime system failure.",
                retryable,
              },
              trace: traceFor(request),
            })
          },
        },
      })

      expect(execution).toMatchObject({
        kind: "failure",
        transitions: [],
        failure: {
          classification: "system_failure",
          category: "RUNTIME_SYSTEM_FAILURE",
          code,
          retryable,
        },
      })
      expect(sha256(execution.unchangedState)).toBe(before)
      expect(observations).toHaveLength(1)
      expect(observations[0]?.soldierMemory).not.toHaveProperty(
        "attemptMutation",
      )
    },
  )

  it("maps a thrown v1.17 runtime call to registered ADAPTER_CRASH without mutation", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    const before = sha256(state)

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain() {
          throw new Error("private adapter stack token=must-not-leak")
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        category: "RUNTIME_SYSTEM_FAILURE",
        code: "ADAPTER_CRASH",
        retryable: true,
      },
    })
    expect(sha256(execution.unchangedState)).toBe(before)
    expect(JSON.stringify(execution)).not.toContain("must-not-leak")
  })

  it("rejects a v1.17 response bound to another kernel request without a player penalty", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(
            request,
            {
              kind: "player_violation",
              violation:
                RUNTIME_INVOCATION_V1_17_PLAYER_VIOLATIONS.INVALID_OUTPUT,
              trace: traceFor(request, {
                kernelRequestId: `${request.requestId}:forged`,
              }),
            },
            false,
          )
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
    expect(JSON.stringify(execution)).not.toContain("RUNTIME_VIOLATION")
  })

  it("rejects a structurally valid clone that lacks exact-object admission", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          const bound = bindOutcome(request, {
            kind: "success",
            value: {
              action: { type: "TURN_TO_STONE" },
              soldierMemory: null,
            },
            trace: traceFor(request),
          })
          return {
            ...bound,
            request: globalThis.structuredClone(bound.request),
          }
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
  })

  it.each([
    ["accounting identity", "accountingIdentitySha256"],
    ["idempotency key", "idempotencyKeySha256"],
  ] as const)("rejects a trace with a forged %s", (_label, field) => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(
            request,
            {
              kind: "success",
              value: {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: null,
              },
              trace: traceFor(request, {
                [field]: `sha256:${"9".repeat(64)}`,
              }),
            },
            false,
          )
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
  })

  it("rejects a response whose signed input identity belongs to another prestate", () => {
    const state = withPrivateMemory()
    const soldier = state.soldiers.find(
      (candidate) => candidate.ownerPlayerId === state.players[0].id,
    )
    if (!soldier) throw new Error("missing fixture soldier")
    soldier.soldierMemory = { retainedSoldier: "different-prestate" }

    const execution = MATCH_KERNEL.runActivationFromStateV117({
      state,
      soldierId: soldier.id,
      runtime: {
        selectActivations() {
          throw new Error("selection is unreachable in activation mode")
        },
        runSoldierBrain(
          _input: SoldierBrainInput,
          request?: RuntimeRequestFor<"soldierBrain">,
        ): CandidateBoundRuntimeInvocationV117<SoldierBrainResult> {
          if (!request) throw new Error("driver omitted kernel request")
          return bindOutcome(
            request,
            {
              kind: "success",
              value: {
                action: { type: "TURN_TO_STONE" },
                soldierMemory: { mustNotCommit: true },
              },
              trace: traceFor(request, {
                inputSha256: `sha256:${"9".repeat(64)}`,
              }),
            },
            false,
          )
        },
      },
    })

    expect(execution).toMatchObject({
      kind: "failure",
      transitions: [],
      failure: {
        classification: "system_failure",
        code: "OUTER_FRAME_WRONG_BINDING",
      },
      unchangedState: state,
    })
  })
})
