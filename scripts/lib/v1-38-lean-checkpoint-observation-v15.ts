/** Trusted synchronous host operations only. No observation escapes this call. */
export interface LeanCheckpointOperationsV15 {
  assertParent(): void
  authenticateAllocation(): void
  childRss(): { current: number; maximum: number }
  parentRss(): number
  freeBytes(): number
  elapsedMs(): number
  physicalBytes(): number
  charged(): number
  availableMemoryBytes(): number
  disk(): { bufferBytes: number; scratchBytes: number }
  prefix(m: { childRss: number; parentRss: number; freeBytes: number; allocatedBytes: number; elapsedMs: number }): number
  correction(m: { childRss: number; parentRss: number; freeBytes: number; physicalBytes: number; elapsedMs: number; charged: number; availableMemoryBytes: number }): number
  diskGuard(m: { physicalBytes: number; bufferBytes: number; scratchBytes: number }): void
}
const natural = (n: number): number => {
  if (!Number.isSafeInteger(n) || n < 0) throw new Error("LEAN_CHECKPOINT_OBSERVATION")
  return n
}
export const checkpointLeanObservationV15 = (ops: LeanCheckpointOperationsV15, additionalBytes = 0): number => {
  natural(additionalBytes)
  ops.assertParent()
  ops.authenticateAllocation()
  const child = ops.childRss(), childRss = natural(Math.max(natural(child.current), natural(child.maximum)) + additionalBytes)
  const parentRss = natural(ops.parentRss()), freeBytes = natural(ops.freeBytes()), elapsedMs = natural(ops.elapsedMs())
  if (parentRss === 0 || childRss === 0) throw new Error("LEAN_CHECKPOINT_OBSERVATION")
  const physicalBytes = natural(ops.physicalBytes()), charged = natural(ops.charged()), availableMemoryBytes = natural(ops.availableMemoryBytes())
  const disk = ops.disk(), bufferBytes = natural(natural(disk.bufferBytes) + additionalBytes), scratchBytes = natural(disk.scratchBytes)
  // Independent identity admission after all observation operations, including
  // the ledger read. Never carry an admitted allocation across a callback.
  ops.authenticateAllocation()
  ops.assertParent()
  const prefix = ops.prefix({ childRss, parentRss, freeBytes, allocatedBytes: physicalBytes, elapsedMs })
  const correction = ops.correction({ childRss, parentRss, freeBytes, physicalBytes, elapsedMs, charged, availableMemoryBytes })
  ops.diskGuard({ physicalBytes, bufferBytes, scratchBytes })
  ops.assertParent()
  return Math.max(natural(prefix), natural(correction))
}
