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

/** Public protocol pump only. No Chronicle certificate, scheduling, or rule implementation. */
export const runCanonicalLabMatch = async (options: {
  match: Parameters<typeof MATCH_KERNEL.createMachineV119>[0];
  providers: Readonly<Record<string, LabSupervisedProvider>>;
}): Promise<LabMatchExecution> => {
  let initial: GameState | null = null
  const accounting: LabRuntimeEvidence[] = []
  const failure = (code: string): LabMatchExecution => ({ kind: "failure", privacy: "private_offline", transitions: [], unchangedState: initial, failure: { classification: "system_failure", code }, accounting })
  let execution: LabMatchExecution
  try {
    let machine = MATCH_KERNEL.createMachineV119(options.match)
    initial = structuredClone(machine.initialState)
    const identities = new Map<LabSupervisedProvider, LabRuntimeIdentity>()
    const ordinals = new Map<LabSupervisedProvider, number>()
    for (const [player, revision] of [[options.match.bottomPlayerId, options.match.bottomStrategyRevisionId], [options.match.topPlayerId, options.match.topStrategyRevisionId]] as const) {
      const p = options.providers[player]
      if (!p || p.identity.revisionId !== revision || p.identity.tupleId !== machine.semanticTuple.tupleId || p.identity.tupleRoot !== LAB_ADMITTED_ROOTS.tupleRoot || p.identity.image !== LAB_ADMITTED_ROOTS.image || p.identity.runtimeLimitsRoot !== LAB_ADMITTED_ROOTS.runtimeLimitsRoot) throw Error("LAB_RUNTIME_IDENTITY")
      identities.set(p, freezeLabValue(structuredClone(p.identity)))
      ordinals.set(p, 0)
    }
    const transitions: Transition[] = []
    const consumed = new Set<string>()
    execution = failure("LAB_KERNEL_STEP_BOUND")
    for (let step = 0; step < 1_010_000; step++) {
      let next = MATCH_KERNEL.stepMatch(machine, { kind: "advance" })
      if (next.kind === "effect") {
        const request = freezeLabValue(structuredClone(next.request))
        const provider = options.providers[String(request.coordinates.actingPlayerId)]
        const identity = provider && identities.get(provider)
        if (!provider || !identity) throw Error("LAB_RUNTIME_BINDING")
        const e = await provider.invoke(request, identity)
        accounting.push(e)
        if (!provider.verify(e) || labRoot("runtime-identity", e.identity) !== labRoot("runtime-identity", identity) ||
          e.requestId !== request.requestId || e.method !== request.kind || e.inputRoot !== labRoot("runtime-input", request.input) ||
          e.ordinal !== ordinals.get(provider) || !e.charged || !e.completed || !Number.isSafeInteger(e.outputBytes) || e.outputBytes < 0 || e.outputBytes > 262144 ||
          consumed.has(e.invocationRoot)) throw Error("LAB_RUNTIME_BINDING")
        consumed.add(e.invocationRoot); ordinals.set(provider, e.ordinal + 1)
        const base = { kind: "runtime_resume" as const, requestId: request.requestId, effectKind: request.kind }
        const r = e.result
        next = MATCH_KERNEL.stepMatch(next.machine, r.ok ? { ...base, classification: "success", value: r.value }
          : "systemFailure" in r ? { ...base, classification: "system_failure", failure: r.systemFailure }
          : { ...base, classification: "player_violation", violation: r.violation })
      }
      if (next.kind === "failure") { execution = failure(next.failure.code); break }
      if (next.kind === "effect") throw Error("LAB_NESTED_EFFECT")
      transitions.push(next.record); machine = next.machine
      if (next.kind === "completed") {
        execution = { kind: "completed", privacy: "private_offline", result: { state: machine.state, events: transitions.flatMap((t) => t.events) }, transitions, accounting }
        break
      }
    }
  } catch { execution = failure("LAB_SUPERVISOR_FAILURE") }
  let clean = true
  for (const provider of new Set(Object.values(options.providers))) {
    try { const result = provider.close(); clean = clean && result.cleanupComplete && !result.orphanedChild }
    catch { clean = false }
  }
  return clean ? execution : failure("LAB_CLEANUP_INCOMPLETE")
}
