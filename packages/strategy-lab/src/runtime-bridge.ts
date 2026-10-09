import { MATCH_KERNEL, type RuntimeResult, type GameState, type TransitionResult } from "@cowards/engine"
import { LAB_ADMITTED_ROOTS, freezeLabValue, labRoot, type LabRoot } from "./contracts.js"

export type LabKernelRequest = Extract<ReturnType<typeof MATCH_KERNEL.stepMatch>, { kind: "effect" }>["request"]
type Transition = Extract<ReturnType<typeof MATCH_KERNEL.stepMatch>, { kind: "transition" }>["record"]
export interface LabRuntimeIdentity {
  revisionId: string; sourceRoot: LabRoot; executableRoot: LabRoot; tupleId: string; tupleRoot: string;
  image: string; harnessRoot: LabRoot; budgetRoot: LabRoot; attemptRoot: LabRoot; runtimeLimitsRoot: string;
}
export interface LabRuntimeEvidence {
  identity: LabRuntimeIdentity; requestId: string; method: LabKernelRequest["kind"]; inputRoot: LabRoot;
  ordinal: number; invocationRoot: LabRoot; charged: boolean; completed: boolean; outputBytes: number;
  result: RuntimeResult<unknown>;
}
export interface LabSupervisedProvider {
  readonly identity: LabRuntimeIdentity;
  invoke(request: LabKernelRequest, admittedRuntimeIdentity: LabRuntimeIdentity): LabRuntimeEvidence | Promise<LabRuntimeEvidence>;
  /** Checks exact-object issuance by the trusted host, not a serializable claim. */
  verify(evidence: LabRuntimeEvidence): boolean;
  close(): { cleanupComplete: boolean; orphanedChild: boolean };
}
export type LabMatchExecution =
  | { kind: "completed"; privacy: "private_offline"; result: TransitionResult; transitions: readonly Transition[]; accounting: readonly LabRuntimeEvidence[] }
  | { kind: "failure"; privacy: "private_offline"; transitions: readonly []; unchangedState: GameState | null; failure: { classification: "system_failure"; code: string }; accounting: readonly LabRuntimeEvidence[] };

export const LAB_HOST_PHASES_V15 = Object.freeze(["machine_construction", "provider_binding", "kernel_step", "provider_invoke", "evidence_verification", "result_projection", "cleanup"] as const)
export type LabHostPhaseV15 = typeof LAB_HOST_PHASES_V15[number] | "unknown"
export type LabHostCodeV15 = "HOST_THROW" | "HOST_REFUSAL" | "CLEANUP_INCOMPLETE" | "UNKNOWN"
export interface LabHostBindingV15 { readonly allocationRoot: LabRoot; readonly chargeRoot: LabRoot; readonly slotRoot: LabRoot }
export interface LabHostFailureV15 extends LabHostBindingV15 {
  readonly schemaVersion: "lean-private-host-failure-v15-4-v1"; readonly phase: LabHostPhaseV15; readonly code: LabHostCodeV15
  readonly phaseTotalsMs: Readonly<Record<typeof LAB_HOST_PHASES_V15[number], number>>
}
const hostFailuresV15 = new WeakMap<object, LabHostFailureV15>()
const zeroHostTotalsV15 = () => Object.fromEntries(LAB_HOST_PHASES_V15.map(phase => [phase, 0])) as Record<typeof LAB_HOST_PHASES_V15[number], number>
const hostRootV15 = (v: unknown): v is LabRoot => typeof v === "string" && /^sha256:[a-f0-9]{64}$/u.test(v)
const unknownHostFailureV15 = (binding: LabHostBindingV15): LabHostFailureV15 => freezeLabValue({ schemaVersion: "lean-private-host-failure-v15-4-v1", allocationRoot: binding.allocationRoot, chargeRoot: binding.chargeRoot, slotRoot: binding.slotRoot, phase: "unknown", code: "UNKNOWN", phaseTotalsMs: zeroHostTotalsV15() })
/** Only this returned execution object is issued. Never inspect thrown values,
 * caller exception fields, copied execution properties or a root-key map. */
export const readLabHostFailureV15 = (execution: unknown, binding: LabHostBindingV15): LabHostFailureV15 => {
  const issued = execution !== null && typeof execution === "object" ? hostFailuresV15.get(execution) : undefined
  return issued && issued.allocationRoot === binding.allocationRoot && issued.chargeRoot === binding.chargeRoot && issued.slotRoot === binding.slotRoot ? issued : unknownHostFailureV15(binding)
}

/** Public protocol pump only. No Chronicle certificate, scheduling, or rule implementation. */
export const runCanonicalLabMatch = async (options: {
  match: Parameters<typeof MATCH_KERNEL.createMachineV119>[0];
  providers: Readonly<Record<string, LabSupervisedProvider>>;
  hostBindingV15?: LabHostBindingV15;
  hostClockV15?: () => number;
}): Promise<LabMatchExecution> => {
  let initial: GameState | null = null
  const accounting: LabRuntimeEvidence[] = []
  const failure = (code: string): LabMatchExecution => ({ kind: "failure", privacy: "private_offline", transitions: [], unchangedState: initial, failure: { classification: "system_failure", code }, accounting })
  let execution: LabMatchExecution
  const suppliedBinding = options.hostBindingV15
  const binding = suppliedBinding && [suppliedBinding.allocationRoot, suppliedBinding.chargeRoot, suppliedBinding.slotRoot].every(hostRootV15) ? Object.freeze({ allocationRoot: suppliedBinding.allocationRoot, chargeRoot: suppliedBinding.chargeRoot, slotRoot: suppliedBinding.slotRoot }) : undefined
  const totals = zeroHostTotalsV15()
  let phase: LabHostPhaseV15 = "unknown", phaseStart = 0, timingValid = typeof options.hostClockV15 === "function"
  let firstFailure: { phase: LabHostPhaseV15; code: LabHostCodeV15 } | undefined
  const now = () => {
    try {
      const n = options.hostClockV15?.()
      if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) { timingValid = false; return 0 }
      return n
    } catch { timingValid = false; return 0 }
  }
  const enter = (next: LabHostPhaseV15) => {
    if (!binding) return
    const end = now(), duration = end - phaseStart
    if (duration < 0) timingValid = false
    if (timingValid && phase !== "unknown") {
      const total = totals[phase] + duration
      if (!Number.isSafeInteger(Math.ceil(total)) || duration < 0 || total < 0) timingValid = false
      else {
        totals[phase] = total
        if (!Number.isSafeInteger(LAB_HOST_PHASES_V15.reduce((sum, key) => sum + Math.ceil(totals[key]), 0))) timingValid = false
      }
    }
    phase = next; phaseStart = end
  }
  const remember = (code: LabHostCodeV15) => { if (binding && !firstFailure) firstFailure = { phase, code } }
  try {
    enter("machine_construction")
    let machine = MATCH_KERNEL.createMachineV119(options.match)
    initial = structuredClone(machine.initialState)
    enter("provider_binding")
    const identities = new Map<LabSupervisedProvider, LabRuntimeIdentity>()
    const ordinals = new Map<LabSupervisedProvider, number>()
    for (const [player, revision] of [[options.match.bottomPlayerId, options.match.bottomStrategyRevisionId], [options.match.topPlayerId, options.match.topStrategyRevisionId]] as const) {
      const p = options.providers[player]
      if (!p || p.identity.revisionId !== revision || p.identity.tupleId !== machine.semanticTuple.tupleId || p.identity.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || p.identity.image !== LAB_ADMITTED_ROOTS.image || p.identity.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) { remember("HOST_REFUSAL"); throw Error("LAB_RUNTIME_IDENTITY") }
      identities.set(p, freezeLabValue(structuredClone(p.identity)))
      ordinals.set(p, 0)
    }
    const transitions: Transition[] = []
    const consumed = new Set<string>()
    execution = failure("LAB_KERNEL_STEP_BOUND")
    for (let step = 0; step < 1_010_000; step++) {
      enter("kernel_step")
      let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (next.kind === "effect") {
        enter("provider_binding")
        const request = freezeLabValue(structuredClone(next.request))
        const provider = options.providers[String(request.coordinates.actingPlayerId)]
        const identity = provider && identities.get(provider)
        if (!provider || !identity) { remember("HOST_REFUSAL"); throw Error("LAB_RUNTIME_BINDING") }
        enter("provider_invoke")
        const e = await provider.invoke(request, identity)
        enter("evidence_verification")
        accounting.push(e)
        if (!provider.verify(e) || labRoot("runtime-identity", e.identity) !== labRoot("runtime-identity", identity) ||
          e.requestId !== request.requestId || e.method !== request.kind || e.inputRoot !== labRoot("runtime-input", request.input) ||
          e.ordinal !== ordinals.get(provider) || !e.charged || !e.completed || !Number.isSafeInteger(e.outputBytes) || e.outputBytes < 0 || e.outputBytes > 262144 ||
          consumed.has(e.invocationRoot)) { remember("HOST_REFUSAL"); throw Error("LAB_RUNTIME_BINDING") }
        consumed.add(e.invocationRoot); ordinals.set(provider, e.ordinal + 1)
        const base = { kind: "runtime_resume" as const, requestId: request.requestId, effectKind: request.kind }
        const r = e.result
        enter("kernel_step")
        next = MATCH_KERNEL.stepMatch(next.machine, r.ok ? { ...base, classification: "success", value: r.value }
          : "systemFailure" in r ? { ...base, classification: "system_failure", failure: r.systemFailure }
          : { ...base, classification: "player_violation", violation: r.violation })
      }
      if (next.kind === "failure") { remember("HOST_REFUSAL"); execution = failure(next.failure.code); break }
      if (next.kind === "effect") { remember("HOST_REFUSAL"); throw Error("LAB_NESTED_EFFECT") }
      enter("result_projection")
      transitions.push(next.record); machine = next.machine
      if (next.kind === "completed") {
        execution = { kind: "completed", privacy: "private_offline", result: { state: machine.state, events: transitions.flatMap((t) => t.events) }, transitions, accounting }
        break
      }
    }
    if (execution.kind === "failure") remember("HOST_REFUSAL")
  } catch { remember("HOST_THROW"); execution = failure("LAB_SUPERVISOR_FAILURE") }
  enter("cleanup")
  let clean = true
  for (const provider of new Set(Object.values(options.providers))) {
    try { const result = provider.close(); clean = clean && result.cleanupComplete && !result.orphanedChild; if (!clean) remember("CLEANUP_INCOMPLETE") }
    catch { clean = false; remember("CLEANUP_INCOMPLETE") }
  }
  enter("unknown")
  const returned = clean ? execution : failure("LAB_CLEANUP_INCOMPLETE")
  if (binding && returned.kind === "failure") hostFailuresV15.set(returned, freezeLabValue({ schemaVersion: "lean-private-host-failure-v15-4-v1", ...binding, phase: firstFailure?.phase ?? "unknown", code: firstFailure?.code ?? "UNKNOWN", phaseTotalsMs: timingValid ? Object.fromEntries(LAB_HOST_PHASES_V15.map(key => [key, Math.ceil(totals[key])])) as LabHostFailureV15["phaseTotalsMs"] : zeroHostTotalsV15() }))
  return returned
}
