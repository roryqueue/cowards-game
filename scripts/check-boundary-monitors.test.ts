import { describe, expect, it } from "vitest"
import {
  assertMonitorPublicPayload,
  checkRuntimeAdapterBridge,
  findUnknownReportOnlyOffenses,
  runBoundaryMonitorChecks,
} from "./check-boundary-monitors.ts"

describe("boundary drift monitors", () => {
  it("allows removed baseline web offenses but fails unknown new ones", () => {
    expect(findUnknownReportOnlyOffenses([])).toEqual([])
    expect(
      findUnknownReportOnlyOffenses([
        {
          path: "apps/web/app/api/auth/sign-in/route.ts",
          line: 1,
          pattern: "competitive/server",
          statementText:
            'import { competitiveServer } from "../../../competitive/server.js"',
        },
        {
          path: "apps/web/app/api/new-runtime/route.ts",
          line: 1,
          pattern: "@cowards/runtime-js",
        },
      ]),
    ).toEqual(["apps/web/app/api/new-runtime/route.ts:1:@cowards/runtime-js"])
  })

  it("uses the canonical public DTO leak guard", () => {
    expect(() => assertMonitorPublicPayload({ ok: true })).not.toThrow()
    expect(() =>
      assertMonitorPublicPayload({ privateDiagnostics: { stack: "nope" } }),
    ).toThrow(/private field/)
  })

  it("detects runtime registry and adapter metadata drift", () => {
    expect(
      checkRuntimeAdapterBridge({
        selector: "worker-thread",
        specAdapterId: "runtime-js-worker-thread",
      }),
    ).toContain("worker-thread")
    expect(() =>
      checkRuntimeAdapterBridge({
        selector: "worker-thread",
        specAdapterId: "runtime-js-subprocess",
      }),
    ).toThrow(/drifted/)
  })

  it("passes the live repository monitor checks", async () => {
    const checks = await runBoundaryMonitorChecks()
    expect(checks.every((check) => check.ok)).toBe(true)
    expect(checks.map((check) => check.layer)).toEqual(
      expect.arrayContaining([
        "contract_drift",
        "privacy",
        "web_boundary",
        "runtime_adapter",
        "go_parity",
        "topology",
      ]),
    )
  })
})
