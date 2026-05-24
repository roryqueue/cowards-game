import { readFileSync } from "node:fs"
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
      parseTopologyOptions([
        "--require-web",
        "--require-go",
        "--require-web-go-public-strategy-read",
        "--require-v1-16-selected-go-pages",
        "--require-runtime-container",
        "--require-v1-15-lifecycle",
        "--require-v1-16-no-typescript-backend",
      ]),
    ).toMatchObject({
      requireWeb: true,
      requireWebPageSmoke: true,
      requireGo: true,
      requireWebGoPublicStrategyRead: true,
      requireV116SelectedGoPages: true,
      requireRuntimeService: true,
      requireRuntimeContainer: true,
      requireV115Lifecycle: true,
      requireV116NoTypeScriptBackend: true,
      webUrl: "http://localhost:3000",
      goUrl: "http://127.0.0.1:8087",
      runtimeServiceUrl: "http://127.0.0.1:3107",
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
        requireWebPageSmoke: false,
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
      runtimeServiceUrl: null,
      requireWeb: false,
      requireWebPageSmoke: false,
      requireGo: false,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })

    expect(checks.every((check) => check.ok)).toBe(true)
    expect(checks.map((check) => check.layer)).toEqual(
      expect.arrayContaining([
        "env_setup",
        "fixture_loading",
        "typescript_service",
        "worker_runtime",
        "runtime_isolation",
        "web_process",
        "web_page_smoke",
        "go_readonly",
        "privacy",
      ]),
    )
  }, 30_000)

  it("validates v1.16 no-TypeScript-backend artifacts as a required topology check", async () => {
    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: null,
      runtimeServiceUrl: null,
      requireWeb: false,
      requireWebPageSmoke: false,
      requireGo: false,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: true,
      requireV116SelectedGoPages: false,
      json: false,
    })
    const v116Topology = checks.find(
      (check) => check.name === "v1.16 no-TypeScript-backend topology",
    )

    expect(v116Topology).toMatchObject({
      layer: "v116_topology",
      ok: true,
      required: true,
    })
    expect(v116Topology?.detail).toContain(
      "v1.16 no-TypeScript-backend contracts checked",
    )
  }, 30_000)

  it("fails v1.16 strict topology when web health is frontend-only instead of Go-backed", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/service/health")) {
        return Response.json({
          ok: true,
          service: "cowards-web",
          backendAuthority: "frontend-only",
        })
      }
      return Response.json({ ok: true, service: "cowards-service" })
    })

    const checks = await evaluateLocalTopology({
      webUrl: "http://localhost:3000",
      goUrl: null,
      runtimeServiceUrl: null,
      requireWeb: true,
      requireWebPageSmoke: false,
      requireGo: false,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: true,
      requireV116SelectedGoPages: false,
      json: false,
    })
    const webHealth = checks.find(
      (check) => check.name === "web service health route",
    )

    expect(webHealth).toMatchObject({ ok: false, required: true })
    expect(webHealth?.detail).toContain("COWARDS_NO_TYPESCRIPT_BACKEND")
  }, 30_000)

  it("can require web-through-Go public Strategy read evidence", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/service/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "cowards-service",
            version: "service-api-v1.8",
          }),
          { status: 200 },
        )
      }
      if (url.includes("127.0.0.1:8087/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "cowards-service",
            version: "service-api-v1.8",
          }),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/replays/") &&
        url.endsWith("/evidence")
      ) {
        return new Response(
          readFileSync(
            "apps/go-backend/testdata/service-fixtures/public-replay-evidence.json",
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/players/") ||
        url.includes("127.0.0.1:8087/public/ladders/")
      ) {
        const fixture = url.includes("/public/players/")
          ? "public-player-page.json"
          : "public-ladder-page.json"
        return new Response(
          readFileSync(
            `apps/go-backend/testdata/service-fixtures/${fixture}`,
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/matchsets/") ||
        url.includes("127.0.0.1:8087/public/replays/") ||
        url.includes("127.0.0.1:8087/public/strategies/")
      ) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      if (url.includes("127.0.0.1:8087/analytics/runs/")) {
        return new Response(
          JSON.stringify({
            code: "FORBIDDEN",
            message: "Forbidden.",
            publicSafe: true,
            status: 403,
          }),
          { status: 403 },
        )
      }
      if (url.includes("/strategies/strategy%3Ago-parity%3Asentinel")) {
        return new Response("<h1>Go Parity Sentinel</h1>", { status: 200 })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    const checks = await evaluateLocalTopology({
      webUrl: "http://localhost:3000",
      goUrl: "http://127.0.0.1:8087",
      runtimeServiceUrl: null,
      requireWeb: true,
      requireWebPageSmoke: false,
      requireGo: true,
      requireWebGoPublicStrategyRead: true,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })
    const webGoRead = checks.find(
      (check) => check.name === "web-through-Go public Strategy read",
    )

    expect(webGoRead).toMatchObject({
      layer: "web_go_read",
      ok: true,
      required: true,
    })
  }, 30_000)

  it("can require representative web page-load smoke", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      if (url.includes("/api/service/health")) {
        return new Response(
          JSON.stringify({
            ok: true,
            service: "cowards-service",
            version: "service-api-v1.8",
          }),
          { status: 200 },
        )
      }
      return new Response(
        [
          "Strategy Workshop",
          "Competitive Alpha",
          "Sign in",
          "Create account",
          "Competitive account",
          "Evidence Explorer",
          "Player profile",
          "Go Parity Player",
          "Public Strategy card",
          "Go Parity Sentinel",
          "Competition Trust Beta",
          "Demo Trial Ladder",
          "Smoke exhibition",
          "Replay",
          "golden:v1-7:match",
        ].join(" "),
        { status: 200 },
      )
    })

    const checks = await evaluateLocalTopology({
      webUrl: "http://localhost:3000",
      goUrl: null,
      runtimeServiceUrl: null,
      requireWeb: true,
      requireWebPageSmoke: true,
      requireGo: false,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })
    const pageSmoke = checks.find(
      (check) => check.name === "representative page loads",
    )

    expect(pageSmoke).toMatchObject({
      layer: "web_page_smoke",
      ok: true,
      required: true,
    })
    expect(pageSmoke?.detail).toContain("11 representative page types")
  }, 30_000)

  it("can require v1.16 selected Go page smoke without counting Workshop as Go-owned", async () => {
    const seen: string[] = []
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input)
      seen.push(url)
      if (url.includes("/api/service/health")) {
        return Response.json({ ok: true, service: "cowards-web" })
      }
      if (
        url.includes("127.0.0.1:8087/public/replays/") &&
        url.endsWith("/evidence")
      ) {
        return new Response(
          readFileSync(
            "apps/go-backend/testdata/service-fixtures/public-replay-evidence.json",
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/public/players/") ||
        url.includes("127.0.0.1:8087/public/ladders/")
      ) {
        const fixture = url.includes("/public/players/")
          ? "public-player-page.json"
          : "public-ladder-page.json"
        return new Response(
          readFileSync(
            `apps/go-backend/testdata/service-fixtures/${fixture}`,
            "utf8",
          ),
          { status: 200 },
        )
      }
      if (
        url.includes("127.0.0.1:8087/health") ||
        url.includes("127.0.0.1:8087/public/matchsets/") ||
        url.includes("127.0.0.1:8087/public/replays/") ||
        url.includes("127.0.0.1:8087/public/strategies/")
      ) {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(
        [
          "Competitive account",
          "Competitive Alpha",
          "Player profile",
          "Go Parity Player",
          "Public Strategy card",
          "Go Parity Sentinel",
          "Competition Trust Beta",
          "Demo Trial Ladder",
          "Smoke exhibition",
          "Replay",
          "golden:v1-7:match",
        ].join(" "),
        { status: 200 },
      )
    })

    const checks = await evaluateLocalTopology({
      webUrl: "http://localhost:3000",
      goUrl: "http://127.0.0.1:8087",
      runtimeServiceUrl: "http://127.0.0.1:3107",
      requireWeb: true,
      requireWebPageSmoke: false,
      requireGo: true,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: true,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      requireV116SelectedGoPages: true,
      json: false,
    })
    const selectedSmoke = checks.find(
      (check) => check.name === "v1.16 selected Go page smoke",
    )

    expect(selectedSmoke).toMatchObject({
      layer: "web_page_smoke",
      ok: true,
      required: true,
    })
    expect(selectedSmoke?.detail).toContain("replay board realism checked")
    expect(selectedSmoke?.detail).toContain(
      "rendered replay board visual smoke harness checks canvas pixels",
    )
    expect(seen.some((url) => url.includes("/workshop"))).toBe(false)
  }, 30_000)

  it("reports required live Go failures without leaking private diagnostics", async () => {
    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: "http://127.0.0.1:1",
      runtimeServiceUrl: null,
      requireWeb: false,
      requireWebPageSmoke: false,
      requireGo: true,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })
    const goChecks = checks.filter((check) => check.layer === "go_readonly")

    expect(goChecks.some((check) => !check.ok && check.required)).toBe(true)
    expect(JSON.stringify(checks)).not.toContain("Strategy source")
    expect(JSON.stringify(checks)).not.toContain("privateDiagnostics")
  }, 30_000)

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
      runtimeServiceUrl: null,
      requireWeb: false,
      requireWebPageSmoke: false,
      requireGo: true,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: false,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })
    const authGate = checks.find(
      (check) => check.name === "owner analytics auth gate",
    )

    expect(authGate).toMatchObject({ ok: false, required: true })
    expect(authGate?.detail).toContain("expected HTTP 401/403")
  }, 30_000)

  it("fails loudly when required runtime container evidence is skipped", async () => {
    const checks = await evaluateLocalTopology({
      webUrl: null,
      goUrl: null,
      runtimeServiceUrl: null,
      requireWeb: false,
      requireWebPageSmoke: false,
      requireGo: false,
      requireWebGoPublicStrategyRead: false,
      requireRuntimeService: false,
      requireRuntimeContainer: true,
      requireV115Lifecycle: false,
      requireV116NoTypeScriptBackend: false,
      json: false,
    })
    const runtimeIsolation = checks.find(
      (check) => check.name === "runtime isolation readiness",
    )

    expect(runtimeIsolation).toMatchObject({
      layer: "runtime_isolation",
      ok: false,
      required: true,
    })
    expect(runtimeIsolation?.detail).toContain(
      "Required sandbox candidate container-subprocess did not pass",
    )
  }, 30_000)
})
