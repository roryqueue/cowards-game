import { StrategyInputV119Schema } from "./schemas.js"
import type { StrategyInputV119 } from "./types.js"

export {
  SoldierBrainInputV119Schema,
  StrategyInputV119Schema,
} from "./schemas.js"
export type { SoldierBrainInputV119, StrategyInputV119 } from "./types.js"

const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child)
    }
    Object.freeze(value)
  }
  return value
}

export const STRATEGY_OBSERVATION_ABI_V1_19 = deepFreeze({
  schemaVersion: "strategy-observation-abi-v1.19-contract-v1",
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  lifecycle: {
    status: "candidate",
    active: false,
    activationOwner: "Phase-260-Plan-14",
  },
  ownership: {
    initiative: "canonical-match-kernel",
    hasAdvancedThisActivation: "activation-slot-scheduler-state",
    transport: "runtime-service-and-language-adapters-only",
  },
  semantics: {
    observationOnly: true,
    changesActionLegality: false,
    changesNoAdvanceCleanup: false,
    addsHoldOrEndActivation: false,
    initiativeDerivedPerSelectActivationsInvocation: true,
    soldierBrainValueObservedBeforeRequestedAction: true,
    hasAdvancedThisActivation: {
      startsFalseForEverySelectedActivationSlot: true,
      becomesTrueAfterSuccessfulSelfAdvance: true,
      successfulPushCountsActorDisplacement: true,
      turnDoesNotSet: true,
      blockedMoveOrPushDoesNotSet: true,
      beingPushedDoesNotSet: true,
      remainsTrueForLaterCallsInSameSlot: true,
      resetsWhenNewSlotIsSelected: true,
      storedInStrategyOrSoldierMemory: false,
    },
  },
  compatibility: {
    additiveFieldsImplyCompatibility: false,
    requiresExecutionRevalidation: true,
    phase259CertificatesRemainHistoricalForExactTuple: true,
    releasedV117AndSupervisorV118RemainUnchanged: true,
  },
} as const)

export interface StrategyInputValidationContextV119 {
  readonly entrantPlayerIds: readonly [string, string]
  readonly observingPlayerId: string
}

export const STRATEGY_INPUT_VALIDATION_ERROR_CODES_V1_19 = [
  "INVALID_STRATEGY_INPUT",
  "INVALID_ENTRANT_CONTEXT",
  "INVALID_OBSERVING_PLAYER",
  "UNKNOWN_INITIAL_INITIATIVE_PLAYER",
  "INITIAL_INITIATIVE_RELATIVE_MISMATCH",
  "UNKNOWN_ROUND_INITIATIVE_PLAYER",
  "ROUND_INITIATIVE_RELATIVE_MISMATCH",
] as const

export type StrategyInputValidationErrorCodeV119 =
  (typeof STRATEGY_INPUT_VALIDATION_ERROR_CODES_V1_19)[number]

export interface StrategyInputValidationErrorV119 {
  readonly code: StrategyInputValidationErrorCodeV119
  readonly path: readonly (string | number)[]
}

export type StrategyInputValidationResultV119 =
  | Readonly<{ ok: true; value: StrategyInputV119 }>
  | Readonly<{ ok: false; error: StrategyInputValidationErrorV119 }>

const failure = (
  code: StrategyInputValidationErrorCodeV119,
  path: readonly (string | number)[],
): StrategyInputValidationResultV119 => ({
  ok: false,
  error: { code, path },
})

export const validateStrategyInputV119 = (
  value: unknown,
  context: StrategyInputValidationContextV119,
): StrategyInputValidationResultV119 => {
  const [entrantA, entrantB] = context.entrantPlayerIds
  if (
    typeof entrantA !== "string" ||
    entrantA.length === 0 ||
    typeof entrantB !== "string" ||
    entrantB.length === 0 ||
    entrantA === entrantB
  ) {
    return failure("INVALID_ENTRANT_CONTEXT", ["entrantPlayerIds"])
  }
  if (
    context.observingPlayerId !== entrantA &&
    context.observingPlayerId !== entrantB
  ) {
    return failure("INVALID_OBSERVING_PLAYER", ["observingPlayerId"])
  }

  const parsed = StrategyInputV119Schema.safeParse(value)
  if (!parsed.success) {
    const issuePath = (parsed.error.issues[0]?.path ?? []).map((segment) =>
      typeof segment === "symbol"
        ? (segment.description ?? "symbol")
        : segment,
    )
    return failure(
      "INVALID_STRATEGY_INPUT",
      issuePath,
    )
  }

  const input = parsed.data
  if (
    input.initialInitiativePlayerId !== entrantA &&
    input.initialInitiativePlayerId !== entrantB
  ) {
    return failure("UNKNOWN_INITIAL_INITIATIVE_PLAYER", [
      "initialInitiativePlayerId",
    ])
  }
  if (
    input.hasInitialInitiative !==
    (input.initialInitiativePlayerId === context.observingPlayerId)
  ) {
    return failure("INITIAL_INITIATIVE_RELATIVE_MISMATCH", [
      "hasInitialInitiative",
    ])
  }
  if (
    input.roundInitiativePlayerId !== entrantA &&
    input.roundInitiativePlayerId !== entrantB
  ) {
    return failure("UNKNOWN_ROUND_INITIATIVE_PLAYER", [
      "roundInitiativePlayerId",
    ])
  }
  if (
    input.hasRoundInitiative !==
    (input.roundInitiativePlayerId === context.observingPlayerId)
  ) {
    return failure("ROUND_INITIATIVE_RELATIVE_MISMATCH", [
      "hasRoundInitiative",
    ])
  }

  return { ok: true, value: input }
}
