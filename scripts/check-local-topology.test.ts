import { afterEach, describe, expect, it, vi } from "vitest"
import {
  evaluateLocalTopology,
  parseTopologyOptions,
  safeDetail,
  sanitizeDiagnosticUrl,
} from "./check-local-topology.js"

describe("local topology harness", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("parses optional and required live topology URLs", () => {
    expect(
      parseTopologyOptions([
        "--web-url",
        "http://localhost:3000",
        "--go-url",
        "http://127.0.0.1:8087",
        "--json",
      ]),
    ).toMatchObject({
      webUrl: "http://localhost:3000",
      goUrl: "http://127.0.0.1:8087",
      json: true,
    })
    expect(
      parseTopologyOptions(["--require-web", "--require-go"]),
    ).toMatchObject({
      requireWeb: true,
      requireGo: true,
      webUrl: "http://localhost:3000",
      goUrl: "http://127.0.0.1:8087",
    })
  })

  it("uses explicit topology environment URLs as optional live checks", () => {
    const previousWebUrl = process.env.COWARDS_WEB_URL
    const previousGoUrl = process.env.COWARDS_GO_BACKEND_URL
    process.env.COWARDS_WEB_URL = "http://localhost:3100"
    process.env.COWARDS_GO_BACKEND_URL = "http://127.0.0.1:8187"
    try {
      expect(parseTopologyOptions([])).toMatchObject({
        requireWeb: false,
        requireGo: false,
        webUrl: "http://localhost:3100",
        goUrl: "http://127.0.0.1:8187",
      })
    } finally {
      if (previousWebUrl === undefined) {
        delete process.env.COWARDS_WEB_URL
      } else {
        process.env.COWARDS_WEB_URL = previousWebUrl
      }
      if (previousGoUrl === undefined) {
        delete process.env.COWARDS_GO_BACKEND_URL
      } else {
        process.env.COWARDS_GO_BACKEND_URL = previousGoUrl
      }
    }
  })

  it("redacts secret-bearing diagnostic URLs", () => {
    expect(
      sanitizeDiagnosticUrl(
        "http://user:password@localhost:3000/path?token=abc&safe=yes&api_key=xyz",
      ),
    ).toBe(
      "http://localhost:3000/path?token=%5Bredacted%5D&safe=yes&api_key=%5Bredacted%5D",
    )
    expect(
      safeDetail(
        "failed at http://user:password@localhost:3000/path?token=abc with Bearer secret",
      ),
    ).toBe(
      "failed at http://localhost:3000/path?token=%5Bredacted%5D with Bearer [redacted]",
    )
  })

  it("passes static topology checks without requiring live web or Go", async () => {
    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: null,
      requireWeb: false,
      requireGo: false,
      json: false,
    })

    expect(checks.every((check) => check.ok)).toBe(true)
    expect(checks.map((check) => check.layer)).toEqual(
      expect.arrayContaining([
        "env_setup",
        "fixture_loading",
        "typescript_service",
        "worker_runtime",
        "web_process",
        "go_readonly",
        "privacy",
      ]),
    )
  })

  it("reports required live Go failures without leaking private diagnostics", async () => {
    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: "http://127.0.0.1:1",
      requireWeb: false,
      requireGo: true,
      json: false,
    })
    const goChecks = checks.filter((check) => check.layer === "go_readonly")

    expect(goChecks.some((check) => !check.ok && check.required)).toBe(true)
    expect(JSON.stringify(checks)).not.toContain("Strategy source")
    expect(JSON.stringify(checks)).not.toContain("privateDiagnostics")
  })

  it("fails owner analytics smoke when the route does not prove auth rejection", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/analytics/runs/")) {
        return new Response(
          JSON.stringify({
            code: "NOT_FOUND",
            message: "Resource not found.",
            publicSafe: true,
            status: 404,
          }),
          { status: 404 },
        )
      }
      return new Response(
        JSON.stringify({
          ok: true,
          service: "cowards-service",
          version: "service-api-v1.8",
        }),
        { status: 200 },
      )
    })

    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: "http://127.0.0.1:8087",
      requireWeb: false,
      requireGo: true,
      json: false,
    })
    const authGate = checks.find(
      (check) => check.name === "owner analytics auth gate",
    )

    expect(authGate).toMatchObject({ ok: false, required: true })
    expect(authGate?.detail).toContain("expected HTTP 401/403")
  })
})
