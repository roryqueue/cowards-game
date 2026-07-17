import { Buffer } from "node:buffer"
import { createHash } from "node:crypto"
import {
  SoldierBrainInputV119Schema,
  admitCanonicalJsonBytes,
  encodeCanonicalJson,
  validateStrategyInputV119,
  type JsonValue,
  type SoldierBrainInputV119,
  type StrategyInputV119,
} from "@cowards/spec"

export const CANDIDATE_OBSERVATION_TRANSPORT_V1_19 = Object.freeze({
  schemaVersion: "runtime-observation-transport-v1.19",
  semanticAuthorityKey: "runtime-v1.19",
  runtimeAbiVersion: "strategy-runtime-abi-v1.19",
  candidateStatus: "inactive-candidate",
  current: false,
  activationPlan: "260-14",
} as const)

export type CandidateObservationMethodV119 =
  | "selectActivations"
  | "soldierBrain"

export interface CreateCandidateObservationTransportRequestV119 {
  readonly method: CandidateObservationMethodV119
  readonly kernelRequestId: string
  readonly semanticTupleId: string
  readonly entrantPlayerIds: readonly [string, string]
  readonly observingPlayerId: string
  readonly input: unknown
}

export interface CandidateObservationTransportRequestV119 {
  readonly schemaVersion: "runtime-observation-transport-v1.19"
  readonly semanticAuthorityKey: "runtime-v1.19"
  readonly runtimeAbiVersion: "strategy-runtime-abi-v1.19"
  readonly candidateStatus: "inactive-candidate"
  readonly current: false
  readonly method: CandidateObservationMethodV119
  readonly kernelRequestId: string
  readonly semanticTupleId: string
  readonly entrantPlayerIds: readonly [string, string]
  readonly observingPlayerId: string
  /** Exact canonical input bytes already bound by the signed kernel request. */
  readonly signedInputBytes: Uint8Array
  readonly inputSha256: `sha256:${string}`
}

export type CandidateObservationTransportSystemCodeV119 =
  | "MIXED_OBSERVATION_VERSION"
  | "OBSERVATION_BINDING_MISMATCH"
  | "MALFORMED_OBSERVATION"
  | "INVALID_OBSERVATION_CONTEXT"
  | "ADAPTER_CRASH"

export type CandidateObservationTransportResultV119<TValue = unknown> =
  | Readonly<{ kind: "success"; value: TValue }>
  | Readonly<{
      kind: "player_violation"
      violation: Readonly<{ code: string; publicMessage: string }>
    }>
  | Readonly<{
      kind: "system_failure"
      failure: Readonly<{
        code: CandidateObservationTransportSystemCodeV119
        publicMessage: "Runtime system failure."
        retryable: boolean
      }>
    }>

export type CandidateObservationInputV119 =
  | StrategyInputV119
  | SoldierBrainInputV119

export interface AdmittedCandidateObservationV119 {
  readonly input: CandidateObservationInputV119
  readonly signedInputBytes: Uint8Array
}

const sha256 = (bytes: Uint8Array): `sha256:${string}` =>
  `sha256:${createHash("sha256").update(bytes).digest("hex")}`

const systemFailure = (
  code: CandidateObservationTransportSystemCodeV119,
  retryable = false,
): Extract<
  CandidateObservationTransportResultV119<never>,
  { kind: "system_failure" }
> => ({
  kind: "system_failure",
  failure: {
    code,
    publicMessage: "Runtime system failure.",
    retryable,
  },
})

const validPublicId = (value: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/u.test(value)

export const createCandidateObservationTransportRequestV119 = (
  input: CreateCandidateObservationTransportRequestV119,
): CandidateObservationTransportRequestV119 => {
  const encoded = encodeCanonicalJson(input.input as JsonValue, {
    context: "authenticated-outer-envelope",
  })
  if (!encoded.ok) {
    throw new TypeError("Candidate observation input is not canonical JSON")
  }
  const signedInputBytes = Uint8Array.from(encoded.bytes)
  return {
    schemaVersion: CANDIDATE_OBSERVATION_TRANSPORT_V1_19.schemaVersion,
    semanticAuthorityKey:
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.semanticAuthorityKey,
    runtimeAbiVersion:
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.runtimeAbiVersion,
    candidateStatus:
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.candidateStatus,
    current: false,
    method: input.method,
    kernelRequestId: input.kernelRequestId,
    semanticTupleId: input.semanticTupleId,
    entrantPlayerIds: [...input.entrantPlayerIds],
    observingPlayerId: input.observingPlayerId,
    signedInputBytes,
    inputSha256: sha256(signedInputBytes),
  }
}

export const admitCandidateObservationTransportV119 = (
  request: CandidateObservationTransportRequestV119,
):
  | Readonly<{ kind: "success"; value: AdmittedCandidateObservationV119 }>
  | Extract<CandidateObservationTransportResultV119, { kind: "system_failure" }> => {
  if (
    request.schemaVersion !==
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.schemaVersion ||
    request.semanticAuthorityKey !==
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.semanticAuthorityKey ||
    request.runtimeAbiVersion !==
      CANDIDATE_OBSERVATION_TRANSPORT_V1_19.runtimeAbiVersion ||
    request.candidateStatus !== "inactive-candidate" ||
    request.current !== false
  ) {
    return systemFailure("MIXED_OBSERVATION_VERSION")
  }
  if (
    !validPublicId(request.kernelRequestId) ||
    !validPublicId(request.semanticTupleId) ||
    !/^sha256:[0-9a-f]{64}$/u.test(request.inputSha256) ||
    request.inputSha256 !== sha256(request.signedInputBytes)
  ) {
    return systemFailure("OBSERVATION_BINDING_MISMATCH")
  }

  const admitted = admitCanonicalJsonBytes(request.signedInputBytes, {
    profile: "host-api-value",
    operation: "require-canonical",
  })
  if (
    !admitted.ok ||
    !Buffer.from(admitted.canonicalBytes).equals(
      Buffer.from(request.signedInputBytes),
    )
  ) {
    return systemFailure("MALFORMED_OBSERVATION")
  }

  if (request.method === "selectActivations") {
    const validated = validateStrategyInputV119(admitted.value, {
      entrantPlayerIds: request.entrantPlayerIds,
      observingPlayerId: request.observingPlayerId,
    })
    if (!validated.ok) {
      return systemFailure(
        validated.error.code === "INVALID_STRATEGY_INPUT"
          ? "MALFORMED_OBSERVATION"
          : "INVALID_OBSERVATION_CONTEXT",
      )
    }
    return {
      kind: "success",
      value: {
        input: validated.value,
        signedInputBytes: Uint8Array.from(request.signedInputBytes),
      },
    }
  }

  const parsed = SoldierBrainInputV119Schema.safeParse(admitted.value)
  if (
    !parsed.success ||
    parsed.data.self.ownerPlayerId !== request.observingPlayerId ||
    !request.entrantPlayerIds.includes(request.observingPlayerId)
  ) {
    return systemFailure(
      parsed.success ? "INVALID_OBSERVATION_CONTEXT" : "MALFORMED_OBSERVATION",
    )
  }
  return {
    kind: "success",
    value: {
      input: parsed.data as SoldierBrainInputV119,
      signedInputBytes: Uint8Array.from(request.signedInputBytes),
    },
  }
}

/**
 * Candidate-only transport gate. It validates exact signed kernel input bytes
 * before invoking a provider and otherwise passes the provider's existing
 * success/player-violation/system-failure classification through unchanged.
 */
export const executeCandidateObservationTransportV119 = <TValue>(
  request: CandidateObservationTransportRequestV119,
  invoke: (
    observation: AdmittedCandidateObservationV119,
  ) => CandidateObservationTransportResultV119<TValue>,
): CandidateObservationTransportResultV119<TValue> => {
  const admitted = admitCandidateObservationTransportV119(request)
  if (admitted.kind !== "success") return admitted
  try {
    return invoke(admitted.value)
  } catch {
    return systemFailure("ADAPTER_CRASH", true)
  }
}
