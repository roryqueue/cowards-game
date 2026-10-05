/** Fixed closure-free trusted control; statically imported by host fixtures and embedded byte-for-byte in the broker. */
export async function superviseLeanStartupV5(binding, hostBudgetMs, host) {
  const entered = host.now(), deadline = entered + Math.min(5000, hostBudgetMs), startupDeadline = Math.min(deadline, entered + 2500)
  let completed
  let ready = false, go = false, worker = false, wait = "unavailable", stage = "startup", branch = "construction_failure", termination = "unknown", unknown = true
  const remaining = () => Math.max(0, Math.floor(deadline - host.now()))
  try {
    if (!Number.isFinite(hostBudgetMs) || hostBudgetMs <= 0 || hostBudgetMs > 5000) throw new Error("HOST_BUDGET_V5")
    worker = true; host.construct()
    while (host.load() === 0 && host.now() < startupDeadline) { const result = host.wait(0, Math.min(remaining(), Math.max(0, startupDeadline - host.now()))); wait = result === "timed-out" ? "timed_out" : "changed" }
    if (host.now() >= startupDeadline) { branch = "startup_expired"; wait = "timed_out" }
    else if (host.load() !== 1) branch = "inconsistent_state"
    else {
      ready = true
      if (remaining() < 2500) branch = "go_refused"
      else {
        const guestDeadline = host.now() + 1000
        branch = "inconsistent_state"
        if (host.compareExchange(1, 2) !== 1) throw new Error("GO_STATE_V5")
        go = true; stage = "guest"; host.notify()
        while (host.load() === 2 && host.now() < guestDeadline) { const result = host.wait(2, Math.min(remaining(), Math.max(0, guestDeadline - host.now()))); wait = result === "timed-out" ? "timed_out" : "changed" }
        if (host.now() >= guestDeadline) { branch = "guest_expired"; wait = "timed_out"; unknown = false }
        else if (host.load() !== 3) branch = "inconsistent_state"
        else {
          stage = "receipt"; branch = "lifecycle_failure"
          const output = await host.reconcile(remaining())
          if (remaining() <= 0) { stage = "host"; branch = "host_expired" }
          else { termination = "not_required"; unknown = false; branch = "complete"; completed = { output } }
        }
      }
    }
  } catch { unknown = true }
  finally {
    if (termination !== "not_required" && worker) { const began = host.now(); try { const budget = Math.min(100, remaining()); if (budget <= 0) throw new Error("TERMINATION_BUDGET_V5"); await host.terminate(budget); termination = host.now() - began <= budget && remaining() > 0 ? "completed" : "failed" } catch { termination = "failed" } if (termination === "failed") unknown = true }
    try { host.close() } catch { termination = "failed"; unknown = true; completed = undefined; branch = "lifecycle_failure" }
  }
  if (completed && remaining() <= 0) { completed = undefined; stage = "host"; branch = "host_expired"; termination = "unknown"; unknown = true }
  if (completed) return { ok: true, output: completed.output, origin: { ...binding, schemaVersion: "v1.38-lean-startup-origin-v5", stage, branch, ready, go, wait, termination, unknown } }
  return { ok: false, output: undefined, origin: { ...binding, schemaVersion: "v1.38-lean-startup-origin-v5", stage, branch, ready, go, wait, termination, unknown } }
}
