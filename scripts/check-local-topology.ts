#!/usr/bin/env -S pnpm exec tsx
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createWorkerRuntimeConfig } from "../apps/worker/src/runtime-config.ts"
import {
  assertRequiredSandboxCandidatesPassed,
  assertRuntimeIsolationReadinessGuardrails,
  evaluateRuntimeSandboxes,
} from "../packages/runtime-js/src/sandbox-evaluation.ts"
import { createCowardsLocalService } from "../packages/service/src/index.ts"
import {
  SERVICE_API_VERSION,
  STRATEGY_RUNTIME_ABI_VERSION,
  assertPublicServiceDtoLeakSafe,
} from "../packages/spec/src/index.ts"

type Layer =
  | "env_setup"
  | "fixture_loading"
  | "typescript_service"
  | "worker_runtime"
  | "runtime_isolation"
  | "web_process"
  | "go_readonly"
  | "privacy"

interface TopologyCheck {
  layer: Layer
  name: string
  required: boolean
  ok: boolean
  detail: string
}

interface TopologyOptions {
  webUrl: string | null
  goUrl: string | null
  requireWeb: boolean
  requireGo: boolean
  requireRuntimeContainer: boolean
  json: boolean
}

interface RouteManifestEntry {
  id: string
  method: string
  samplePath: string
  authScope: string
  privacyClass: string
  requiresBearerToken?: boolean
}

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
)

const privateMarkers = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payload",
  "owner debug",
  "privateDiagnostics",
  "sourceText",
  "process.env",
  "stack trace",
  "stderr",
] as const

const localCommands = [
  "pnpm services:up",
  "pnpm dev",
  "pnpm --filter @cowards/worker dev",
  "cd apps/go-backend && COWARDS_GO_BACKEND_OWNER_TOKENS=<secret>=user:local go run .",
  "pnpm sandbox:evaluate:container",
  "pnpm topology:check -- --web-url http://localhost:3000 --go-url http://127.0.0.1:8087",
] as const

const sensitiveQueryKeys = new Set([
  "access_token",
  "api_key",
  "auth",
  "authorization",
  "bearer",
  "key",
  "password",
  "secret",
  "session",
  "token",
])

export const parseTopologyOptions = (argv: string[]): TopologyOptions => {
  const options: TopologyOptions = {
    webUrl: process.env.COWARDS_WEB_URL ?? null,
    goUrl: process.env.COWARDS_GO_BACKEND_URL ?? null,
    requireWeb: false,
    requireGo: false,
    requireRuntimeContainer: false,
    json: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case "--":
        break
      case "--json":
        options.json = true
        break
      case "--require-web":
        options.requireWeb = true
        options.webUrl ??= "http://localhost:3000"
        break
      case "--require-go":
        options.requireGo = true
        options.goUrl ??= "http://127.0.0.1:8087"
        break
      case "--require-runtime-container":
        options.requireRuntimeContainer = true
        break
      case "--web-url":
        options.webUrl = requireOptionValue(argv, index, arg)
        index += 1
        break
      case "--go-url":
        options.goUrl = requireOptionValue(argv, index, arg)
        index += 1
        break
      default:
        throw new Error(`Unknown topology option: ${arg}`)
    }
  }
  return options
}

const requireOptionValue = (
  argv: string[],
  index: number,
  flag: string,
): string => {
  const value = argv[index + 1]
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a URL value`)
  }
  return value
}

export const sanitizeDiagnosticUrl = (raw: string): string => {
  try {
    const url = new URL(raw)
    url.username = ""
    url.password = ""
    for (const key of [...url.searchParams.keys()]) {
      if (sensitiveQueryKeys.has(key.toLowerCase())) {
        url.searchParams.set(key, "[redacted]")
      }
    }
    return url.href
  } catch {
    return raw
  }
}

export const safeDetail = (detail: string): string => {
  let next = detail
  for (const marker of privateMarkers) {
    next = next.split(marker).join("[redacted]")
  }
  next = next.replace(/https?:\/\/[^\s|]+/gi, (match) =>
    sanitizeDiagnosticUrl(match),
  )
  return next.replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
}

const check = async (
  layer: Layer,
  name: string,
  required: boolean,
  run: () => Promise<string> | string,
): Promise<TopologyCheck> => {
  try {
    return { layer, name, required, ok: true, detail: safeDetail(await run()) }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { layer, name, required, ok: false, detail: safeDetail(message) }
  }
}

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as T

const routeManifestPath =
  "apps/go-backend/testdata/service-fixtures/route-manifest.json"

const routeManifest = (): RouteManifestEntry[] =>
  readJson<RouteManifestEntry[]>(routeManifestPath)

const sampleRoute = (id: string): RouteManifestEntry => {
  const route = routeManifest().find((entry) => entry.id === id)
  if (!route) {
    throw new Error(`Go route manifest missing ${id}`)
  }
  return route
}

const fetchJson = async (url: URL): Promise<unknown> => {
  const response = await fetch(url)
  const body = await parseResponseJson(response, url)
  if (!response.ok) {
    throw new Error(
      `${sanitizeDiagnosticUrl(url.href)} returned HTTP ${response.status}`,
    )
  }
  return body
}

const parseResponseJson = async (
  response: Response,
  url: URL,
): Promise<unknown> => {
  const text = await response.text()
  try {
    return text.length ? JSON.parse(text) : null
  } catch {
    throw new Error(
      `${sanitizeDiagnosticUrl(url.href)} returned non-JSON response`,
    )
  }
}

const smokeJson = async (
  baseUrl: string,
  samplePath: string,
): Promise<unknown> => fetchJson(new URL(samplePath, baseUrl))

const checkPublicPayload = (value: unknown): string => {
  assertPublicServiceDtoLeakSafe(value)
  const serialized = JSON.stringify(value)
  return `${serialized.length} public-safe bytes`
}

export const evaluateLocalTopology = async (
  options: TopologyOptions,
): Promise<TopologyCheck[]> => {
  const checks: TopologyCheck[] = []
  const packageJson = readJson<{ scripts: Record<string, string> }>(
    "package.json",
  )

  checks.push(
    await check("env_setup", "topology commands", true, () => {
      for (const script of [
        "services:up",
        "dev",
        "preflight",
        "go:parity",
        "sandbox:evaluate:container",
      ]) {
        if (!packageJson.scripts[script]) {
          throw new Error(`package.json missing ${script}`)
        }
      }
      return `start with: ${localCommands.join(" | ")}`
    }),
  )

  checks.push(
    await check("fixture_loading", "Go route manifest", true, () => {
      const routes = routeManifest()
      const expectedRoutes: Record<
        string,
        {
          authScope: RouteManifestEntry["authScope"]
          privacyClass: RouteManifestEntry["privacyClass"]
          requiresBearerToken?: boolean
        }
      > = {
        health: { authScope: "public", privacyClass: "public" },
        getPublicMatchSetSummary: {
          authScope: "public",
          privacyClass: "public",
        },
        getPublicReplayMetadata: {
          authScope: "public",
          privacyClass: "public",
        },
        getAnalyticsRunSummary: {
          authScope: "owner",
          privacyClass: "owner",
          requiresBearerToken: true,
        },
      }
      for (const [routeId, expected] of Object.entries(expectedRoutes)) {
        const route = routes.find((entry) => entry.id === routeId)
        if (!route) {
          throw new Error(`missing route ${routeId}`)
        }
        if (route.method !== "GET") {
          throw new Error(`${routeId} must be GET, got ${route.method}`)
        }
        if (route.authScope !== expected.authScope) {
          throw new Error(
            `${routeId} authScope must be ${expected.authScope}, got ${route.authScope}`,
          )
        }
        if (route.privacyClass !== expected.privacyClass) {
          throw new Error(
            `${routeId} privacyClass must be ${expected.privacyClass}, got ${route.privacyClass}`,
          )
        }
        if (
          expected.requiresBearerToken !== undefined &&
          route.requiresBearerToken !== expected.requiresBearerToken
        ) {
          throw new Error(`${routeId} must declare bearer-token ownership`)
        }
      }
      return `${routes.length} read-only routes from ${routeManifestPath}`
    }),
  )

  checks.push(
    await check("fixture_loading", "Go fixture files", true, () => {
      for (const file of [
        "fixture-manifest.json",
        "health.json",
        "public-match-set-summary.json",
        "public-replay-metadata.json",
        "analytics-run-summary.json",
      ]) {
        const fixturePath = path.join(
          repoRoot,
          "apps/go-backend/testdata/service-fixtures",
          file,
        )
        if (!existsSync(fixturePath)) {
          throw new Error(`missing fixture ${file}`)
        }
        readJson(`apps/go-backend/testdata/service-fixtures/${file}`)
      }
      for (const file of [
        "health.json",
        "public-match-set-summary.json",
        "public-replay-metadata.json",
        "forbidden-error.json",
        "not-found-error.json",
      ]) {
        checkPublicPayload(
          readJson(`apps/go-backend/testdata/service-fixtures/${file}`),
        )
      }
      return "committed Go parity fixtures parse and public fixtures are privacy-safe"
    }),
  )

  checks.push(
    await check("typescript_service", "service health", true, () => {
      const service = createCowardsLocalService({
        withPool: async () => {
          throw new Error("health does not require persistence")
        },
      })
      const health = service.health()
      if (health.version !== SERVICE_API_VERSION) {
        throw new Error(
          `expected ${SERVICE_API_VERSION}, got ${health.version}`,
        )
      }
      return `${health.service} ${health.version}`
    }),
  )

  checks.push(
    await check("worker_runtime", "runtime adapter metadata", true, () => {
      const runtime = createWorkerRuntimeConfig()
      return `${runtime.metadata.id}; abi=${STRATEGY_RUNTIME_ABI_VERSION}; boundary=${runtime.metadata.isolationBoundary}`
    }),
  )

  checks.push(
    await check(
      "runtime_isolation",
      "runtime isolation readiness",
      true,
      () => {
        const report = evaluateRuntimeSandboxes()
        assertRuntimeIsolationReadinessGuardrails(report)
        if (options.requireRuntimeContainer) {
          assertRequiredSandboxCandidatesPassed(report, [
            "container-subprocess",
          ])
        }
        const container = report.candidates.find(
          (candidate) => candidate.id === "container-subprocess",
        )
        return [
          `status=${report.runtimeIsolationReadiness.status}`,
          `selected=${report.runtimeIsolationReadiness.selectedCandidate}`,
          `container=${container?.status ?? "missing"}`,
          `criteria=${report.runtimeIsolationReadiness.criteria.length}`,
          `noFallback=${report.runtimeIsolationReadiness.noSilentFallback}`,
        ].join("; ")
      },
    ),
  )

  if (options.webUrl || options.requireWeb) {
    checks.push(
      await check(
        "web_process",
        "web service health route",
        options.requireWeb,
        async () => {
          const health = await fetchJson(
            new URL(
              "/api/service/health",
              options.webUrl ?? "http://localhost:3000",
            ),
          )
          checkPublicPayload(health)
          return `web health ok at ${sanitizeDiagnosticUrl(options.webUrl ?? "http://localhost:3000")}`
        },
      ),
    )
  } else {
    checks.push({
      layer: "web_process",
      name: "web service health route",
      required: false,
      ok: true,
      detail: "skipped; pass --web-url or --require-web for live web smoke",
    })
  }

  if (options.goUrl || options.requireGo) {
    const goUrl = options.goUrl ?? "http://127.0.0.1:8087"
    checks.push(
      await check("go_readonly", "Go health", options.requireGo, async () => {
        const health = await smokeJson(goUrl, sampleRoute("health").samplePath)
        checkPublicPayload(health)
        return `go health ok at ${sanitizeDiagnosticUrl(goUrl)}`
      }),
    )
    for (const routeId of [
      "getPublicMatchSetSummary",
      "getPublicReplayMetadata",
    ]) {
      checks.push(
        await check("go_readonly", routeId, options.requireGo, async () => {
          const body = await smokeJson(goUrl, sampleRoute(routeId).samplePath)
          return checkPublicPayload(body)
        }),
      )
    }
    checks.push(
      await check(
        "go_readonly",
        "owner analytics auth gate",
        options.requireGo,
        async () => {
          const response = await fetch(
            new URL(sampleRoute("getAnalyticsRunSummary").samplePath, goUrl),
          )
          const body = await parseResponseJson(
            response,
            new URL(sampleRoute("getAnalyticsRunSummary").samplePath, goUrl),
          )
          checkPublicPayload(body)
          if (response.status !== 401 && response.status !== 403) {
            throw new Error(
              `owner analytics expected HTTP 401/403 without bearer token, got HTTP ${response.status}`,
            )
          }
          return `owner analytics rejected unauthenticated request with HTTP ${response.status}`
        },
      ),
    )
  } else {
    checks.push({
      layer: "go_readonly",
      name: "Go live smoke",
      required: false,
      ok: true,
      detail: "skipped; pass --go-url or --require-go for live Go smoke",
    })
  }

  checks.push(
    await check("privacy", "diagnostic output", true, () => {
      checkPublicPayload({
        commands: localCommands,
        checks: checks.map(({ layer, name, ok, required, detail }) => ({
          layer,
          name,
          ok,
          required,
          detail,
        })),
      })
      return "diagnostics contain no private markers"
    }),
  )

  return checks
}

const run = async (): Promise<number> => {
  const options = parseTopologyOptions(process.argv.slice(2))
  const checks = await evaluateLocalTopology(options)
  if (options.json) {
    console.log(
      JSON.stringify({ ok: checks.every((item) => item.ok), checks }, null, 2),
    )
  } else {
    console.log("Coward's Game local topology")
    for (const command of localCommands) {
      console.log(`[CMD] ${command}`)
    }
    for (const result of checks) {
      const marker = result.ok ? "PASS" : result.required ? "FAIL" : "WARN"
      console.log(
        `[${marker}] [${result.layer}] ${result.name}: ${result.detail}`,
      )
    }
  }
  return checks.some((result) => result.required && !result.ok) ? 1 : 0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then((code) => {
      process.exitCode = code
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    })
}
