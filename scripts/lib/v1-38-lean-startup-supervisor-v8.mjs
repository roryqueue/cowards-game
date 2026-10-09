/** Closure-free trusted host control. Lifecycle signals failure, never READY. */
export async function superviseLeanStartupV8(binding, hostBudgetMs, host) {
  const entered = host.now(), deadline = entered + Math.min(5000, hostBudgetMs), startupDeadline = Math.min(deadline, entered + 2500)
  const bucket = ms => !Number.isFinite(ms) || ms < 0 ? "unknown" : ms < 10 ? "0_9ms" : ms < 50 ? "10_49ms" : ms < 100 ? "50_99ms" : ms < 250 ? "100_249ms" : ms < 500 ? "250_499ms" : ms < 1000 ? "500_999ms" : ms < 2500 ? "1000_2499ms" : "2500_plus"
  const remaining = () => Math.max(0, Math.floor(deadline - host.now()))
  let completed, worker = false, ready = false, go = false, wait = "unavailable", stage = "startup", branch = "construction_failure", termination = "unknown", unknown = true
  let constructorDurationBucket = "unknown", prefixMilestone = "unknown", readyPublicationDurationBucket = "unknown", finalAtomicState = "unavailable", lifecycleBeforeTermination = "unknown", deadlineOutcome = "construction_failure"
  const lifecycle = () => typeof host.lifecycle === "function" ? host.lifecycle() : "unknown"
  const failed = () => ["error_seen", "exit_seen", "both_seen"].includes(lifecycle())
  const waitUntil = async (state, limit) => {
    while (host.load() === state && host.now() < limit && !failed()) {
      const result = await Promise.race([host.waitAsync(state, Math.min(remaining(), Math.max(0, limit - host.now()))), host.lifecycleFailure().then(() => "lifecycle")])
      wait = result === "timed-out" ? "timed_out" : "changed"
      if (result === "lifecycle") break
    }
  }
  try {
    if (!Number.isFinite(hostBudgetMs) || hostBudgetMs <= 0 || hostBudgetMs > 5000 || typeof host.waitAsync !== "function" || typeof host.lifecycleFailure !== "function") throw new Error("ASYNC_STARTUP_UNAVAILABLE_V8")
    worker = true
    host.construct()
    constructorDurationBucket = bucket(host.now() - entered)
    branch = "inconsistent_state"; deadlineOutcome = "unknown"
    await waitUntil(0, startupDeadline)
    if (host.now() >= startupDeadline) { branch = "startup_expired"; wait = "timed_out"; deadlineOutcome = host.load() === 1 ? "late_or_boundary" : "startup_deadline" }
    else if (failed()) branch = "lifecycle_failure"
    else if (host.load() !== 1) branch = "inconsistent_state"
    else {
      ready = true; deadlineOutcome = "ready_before_deadline"
      if (remaining() < 2500) branch = "go_refused"
      else {
        const guestDeadline = host.now() + 1000
        if (host.compareExchange(1, 2) !== 1) throw new Error("GO_STATE_V8")
        go = true; stage = "guest"; host.notify()
        await waitUntil(2, Math.min(deadline, guestDeadline))
        if (host.now() >= guestDeadline) { branch = "guest_expired"; wait = "timed_out"; unknown = false }
        else if (host.load() !== 3 && failed()) branch = "lifecycle_failure"
        else if (host.load() !== 3) branch = "inconsistent_state"
        else {
          stage = "receipt"; branch = "lifecycle_failure"
          const output = await host.reconcile(remaining())
          if (remaining() <= 0) { stage = "host"; branch = "host_expired" }
          else { termination = "not_required"; unknown = false; branch = "complete"; completed = { output } }
        }
      }
    }
  } catch { unknown = true; if (branch === "construction_failure") constructorDurationBucket = bucket(host.now() - entered) }
  finally {
    // Snapshot before forced termination. Later cleanup events cannot rewrite attribution.
    try { lifecycleBeforeTermination = lifecycle() } catch {}
    try { const state = host.load(); finalAtomicState = [0, 1, 2, 3].includes(state) ? `state_${state}` : "unknown" } catch {}
    try { const a = host.attribution(); prefixMilestone = a.prefixMilestone; readyPublicationDurationBucket = bucket(a.readyPublicationMs) } catch {}
    if (termination !== "not_required" && worker) { const began = host.now(); try { const budget = Math.min(100, remaining()); if (budget <= 0) throw new Error("TERMINATION_BUDGET_V8"); await host.terminate(budget); termination = host.now() - began <= budget && remaining() > 0 ? "completed" : "failed" } catch { termination = "failed" } if (termination === "failed") unknown = true }
    try { host.close() } catch { termination = "failed"; unknown = true; completed = undefined; branch = "lifecycle_failure" }
  }
  if (completed && remaining() <= 0) { completed = undefined; stage = "host"; branch = "host_expired"; termination = "unknown"; unknown = true }
  return { ok: !!completed, output: completed?.output, origin: { ...binding, schemaVersion: "v1.38-lean-startup-origin-v8", stage, branch, ready, go, wait, termination, unknown, constructorDurationBucket, prefixMilestone, readyPublicationDurationBucket, finalAtomicState, lifecycleBeforeTermination, deadlineOutcome } }
}
