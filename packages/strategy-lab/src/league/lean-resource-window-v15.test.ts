/** Portable NON-AUTHORIZING resource contracts; no routes, provider or Match. */
import { expect, it } from "vitest"
import { labRoot } from "../contracts.js"
import * as lean from "./lean-experiment.js"

it("enumerates only four unused global resource-window ordinals", () => {
  for (const mode of ["v15-2", "v15-3", "v15-4", "v15-5"]) expect(lean.isLeanResourceWindowModeV15(mode)).toBe(true)
  for (const mode of ["v15-1", "v15-6", "v15-02", "v14-2", null, {}]) expect(lean.isLeanResourceWindowModeV15(mode)).toBe(false)
})

it("roots the approved continuous window and separates memory from unchanged disk", () => {
  const p = lean.LEAN_RESOURCE_WINDOW_V15_POLICY, { root, ...body } = p
  expect(root).toBe(labRoot(p.schemaVersion, body))
  expect(p).toMatchObject({ memoryBytes: 3000000000, externalReserveBytes: 512000000, guardBytes: 335544320, priorElapsedMs: 108000000, startedAtMs: 1791455941097, elapsedMs: 223171903, absoluteDeadlineMs: 1791571113000, reserveMs: 1860000, excludedIdleMs: 0, charged: 36 })
  expect(lean.admitLeanRetryTimeboxExtension(p)).toBe(p)
  expect(() => lean.admitLeanRetryTimeboxExtension({ ...p, memoryBytes: 3000000001 })).toThrow()
  expect(() => lean.admitLeanRetryTimeboxExtension({ ...p, undocumented: true })).toThrow()
  expect(lean.leanRetryRootElapsedFloorV8(1791556713000, p)).toBe(208771903)
  expect(lean.leanRetryRootElapsedFloorV8(1791571113000, p)).toBe(223171903)
  expect(lean.LEAN_CAPS.scratchBytes).toBe(2000000000)
  expect(lean.LEAN_POST_V13_FIVE_PAIR_V14_CAPS.elapsedMs).toBe(165600000)
})

it("checks all aggregate operands and exact boundary without accepting a caller ceiling", () => {
  const p = lean.LEAN_RESOURCE_WINDOW_V15_POLICY
  expect(lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1000000000, childRssBytes: 1152455680 }, p)).toBe(3000000000)
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1000000000, childRssBytes: 1152455681 }, p)).toThrow()
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: -1, childRssBytes: 0 }, p)).toThrow()
  expect(() => lean.assertLeanAggregateMemoryV15({ parentRssBytes: 1, childRssBytes: 2 }, { ...p, memoryBytes: 9000000000 })).toThrow()
})

it("selects exact dated finite v15 paths without altering consumed v14", () => {
  for (const n of [2, 3, 4, 5] as const) for (const route of ["diagnostic", "baseline"] as const) {
    const mode = `v15-${n}` as const, paths = lean.leanCorrectionRoutePaths(route, mode)
    expect(paths.store).toBe(`.strategy-lab/lean-correction-supervisor-${route}-20261009-${mode}`)
    expect(paths.check).toBe(`correction-supervisor-${route}-check-${mode}.json`)
    expect(lean.leanRetryOrdinal(mode)).toBe(n)
  }
  expect(lean.leanCorrectionRoutePaths("diagnostic", "v14-1").store).toBe(".strategy-lab/lean-correction-supervisor-diagnostic-20261008-v14-1")
})
