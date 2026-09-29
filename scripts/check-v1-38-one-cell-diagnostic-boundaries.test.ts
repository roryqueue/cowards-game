import { describe, expect, it } from "vitest"
import { checkOneCellDiagnosticBoundaries } from "./check-v1-38-one-cell-diagnostic-boundaries.js"

describe("one-cell private diagnostic boundary", () => {
  it("does not expose v3 records through web, API, Go or public packages", () => {
    const result = checkOneCellDiagnosticBoundaries()
    expect(result.violations).toEqual([])
    expect(result.scannedFiles).toBeGreaterThan(100)
  })
  it("rejects injected public reachability and raw exception fields", () => {
    const result = checkOneCellDiagnosticBoundaries({ files: { "apps/web/src/v3-leak.ts": 'import "../../../../packages/strategy-lab/src/league/diagnostic-one-cell.js"', "packages/strategy-lab/src/league/diagnostic-one-cell.ts": "interface DiagnosticOneCellTerminal { rawError: string }" }, goFiles: {} })
    expect(result.violations.length).toBeGreaterThan(0)
  })
})
