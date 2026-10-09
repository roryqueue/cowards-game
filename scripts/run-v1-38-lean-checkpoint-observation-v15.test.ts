import { expect, it, vi } from "vitest"
import { checkpointLeanObservationV15 } from "./lib/v1-38-lean-checkpoint-observation-v15.js"

const fixture = () => {
  const ops = {
    assertParent: vi.fn(), authenticateAllocation: vi.fn(),
    childRss: vi.fn(() => ({ current: 100, maximum: 200 })), parentRss: vi.fn(() => 300),
    freeBytes: vi.fn(() => 15000000000), elapsedMs: vi.fn(() => 210000000), physicalBytes: vi.fn(() => 25000000),
    charged: vi.fn(() => 37), availableMemoryBytes: vi.fn(() => 2000000000), disk: vi.fn(() => ({ bufferBytes: 400, scratchBytes: 500 })),
    prefix: vi.fn(() => 500), correction: vi.fn(() => 600), diskGuard: vi.fn(),
  }
  return ops
}
it("observes once per call, admits allocation twice, and forwards identical projected actual guard operands", () => {
  const o = fixture()
  expect(checkpointLeanObservationV15(o, 7)).toBe(600)
  expect(o.prefix).toHaveBeenCalledWith({ childRss: 207, parentRss: 300, freeBytes: 15000000000, allocatedBytes: 25000000, elapsedMs: 210000000 })
  expect(o.correction).toHaveBeenCalledWith({ childRss: 207, parentRss: 300, freeBytes: 15000000000, physicalBytes: 25000000, elapsedMs: 210000000, charged: 37, availableMemoryBytes: 2000000000 })
  expect(o.diskGuard).toHaveBeenCalledWith({ physicalBytes: 25000000, bufferBytes: 407, scratchBytes: 500 })
  for (const k of ["childRss", "parentRss", "freeBytes", "elapsedMs", "physicalBytes", "charged", "availableMemoryBytes", "disk"] as const) expect(o[k]).toHaveBeenCalledTimes(1)
  expect(o.authenticateAllocation).toHaveBeenCalledTimes(2)
  checkpointLeanObservationV15(o)
  expect(o.prefix.mock.calls[1][0].childRss).toBe(200)
  expect(o.authenticateAllocation).toHaveBeenCalledTimes(4)
  expect(o.physicalBytes).toHaveBeenCalledTimes(2)
})
it.each(["assertParent", "authenticateAllocation", "physicalBytes", "charged", "disk", "elapsedMs"] as const)("propagates fresh %s refusal without suppressing it", key => {
  const o = fixture(); o[key].mockImplementation(() => { throw new Error("INERT_DRIFT") })
  expect(() => checkpointLeanObservationV15(o)).toThrow("INERT_DRIFT")
})
it("refuses allocation drift during observation before any guard", () => {
  const o = fixture(); o.authenticateAllocation.mockImplementationOnce(() => {}).mockImplementationOnce(() => { throw new Error("ALLOCATION_DRIFT") })
  expect(() => checkpointLeanObservationV15(o)).toThrow("ALLOCATION_DRIFT")
  expect(o.prefix).not.toHaveBeenCalled()
})
it.each([NaN, Infinity, -1, 0.5, Number.MAX_SAFE_INTEGER + 1])("refuses malformed observations and projections %s", n => {
  const o = fixture(); o.parentRss.mockReturnValue(n)
  expect(() => checkpointLeanObservationV15(o)).toThrow()
  expect(() => checkpointLeanObservationV15(fixture(), n)).toThrow()
})
it("does not reuse time, RSS, survivor, disk, memory or ledger values across calls", () => {
  const o = fixture(); checkpointLeanObservationV15(o)
  o.elapsedMs.mockReturnValue(220000000); o.childRss.mockReturnValue({ current: 900, maximum: 1000 }); o.parentRss.mockReturnValue(1200)
  o.physicalBytes.mockReturnValue(35000000); o.charged.mockReturnValue(38); o.freeBytes.mockReturnValue(14000000000); o.availableMemoryBytes.mockReturnValue(1000000000); o.disk.mockReturnValue({ bufferBytes: 600, scratchBytes: 700 })
  checkpointLeanObservationV15(o, 9)
  expect(o.correction.mock.calls[1][0]).toEqual({ elapsedMs: 220000000, charged: 38, physicalBytes: 35000000, childRss: 1009, parentRss: 1200, freeBytes: 14000000000, availableMemoryBytes: 1000000000 })
  expect(o.diskGuard.mock.calls[1][0]).toEqual({ physicalBytes: 35000000, bufferBytes: 609, scratchBytes: 700 })
})
