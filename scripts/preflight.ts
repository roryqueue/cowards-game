#!/usr/bin/env -S pnpm exec tsx
import net from "node:net"
import { randomUUID } from "node:crypto"
import path from "node:path"
import { clearTimeout, setTimeout } from "node:timers"
import { fileURLToPath } from "node:url"
import { setTimeout as sleep } from "node:timers/promises"
/* eslint-disable-next-line no-restricted-imports -- Preflight intentionally composes workspace source entry points before packages are built. */
import {
  createDatabasePool,
  migrate,
  runDevelopmentMatchSetSmoke,
  type DevelopmentMatchSetSmokeResult,
} from "../packages/persistence/src/index.ts"
/* eslint-disable-next-line no-restricted-imports -- Local preflight must opt into fixture-domain authority explicitly and cannot use it in production. */
import { createFixtureMatchSetEvidenceResolver } from "../packages/persistence/src/matchset-service.ts"
/* eslint-disable-next-line no-restricted-imports -- Preflight intentionally composes workspace source entry points before packages are built. */
import {
  createReplay,
  projectPublicChronicle,
} from "../packages/replay/src/index.ts"
/* eslint-disable-next-line no-restricted-imports -- Preflight needs the candidate contract before package build output exists. */
import {
  RUNTIME_ABI_V1_17,
  createRuntimeAbiV117PreflightLedger,
  debitRuntimeAbiV117Ledger,
  type Chronicle,
  type MatchId,
  type MatchSetId,
  type RuntimeAbiV117LedgerDebitResult,
  type RuntimeAbiV117PreflightLedger,
  type RuntimeAbiV117PreflightLedgerReceipt,
  type RuntimeAbiV117PreflightProfile,
} from "../packages/spec/src/index.ts"
import { checkRuntimeBudgetCapabilitiesV117Artifact } from "./generate-runtime-budget-capabilities-v1-17.js"

export type Layer =
  | "contract_validation"
  | "service_startup"
  | "migration"
  | "seeding"
  | "worker_execution"
  | "chronicle_validation"
  | "replay_projection"
  | "ui_rendering"

export interface CheckResult {
  layer: Layer
  name: string
  ok: boolean
  detail: string
  required: boolean
}

interface Options {
  requireRedis: boolean
  requireWeb: boolean
  webUrl: string | undefined
  goBackendUrl: string | undefined
  goBackendInternalToken: string | undefined
}

export const PREFLIGHT_NON_CERTIFICATION_NOTICE =
  "A passing contract-only validation and operational smoke does not certify toolchain identity, containment, executable conformance, or any counted runtime lane."

export interface PreflightFoldResult<
  TProfile extends RuntimeAbiV117PreflightProfile,
> {
  readonly ledger: RuntimeAbiV117PreflightLedger<TProfile>
  readonly outcomes: readonly RuntimeAbiV117LedgerDebitResult<
    RuntimeAbiV117PreflightLedger<TProfile>
  >[]
}

export const foldPreflightLedgerV117 = <
  TProfile extends RuntimeAbiV117PreflightProfile,
>(
  profile: TProfile,
  receipts: readonly RuntimeAbiV117PreflightLedgerReceipt[],
): PreflightFoldResult<TProfile> => {
  let ledger = createRuntimeAbiV117PreflightLedger(profile)
  const outcomes: RuntimeAbiV117LedgerDebitResult<
    RuntimeAbiV117PreflightLedger<TProfile>
  >[] = []
  for (const receipt of receipts) {
    const outcome = debitRuntimeAbiV117Ledger(ledger, receipt)
    outcomes.push(outcome)
    ledger = outcome.ledger
    if (outcome.kind === "system_failure") break
  }
  return Object.freeze({ ledger, outcomes: Object.freeze(outcomes) })
}

interface PreflightDependencies {
  readonly checkCapabilityArtifact: typeof checkRuntimeBudgetCapabilitiesV117Artifact
  readonly createPool: typeof createDatabasePool
  readonly environment: Readonly<Record<string, string | undefined>>
  readonly fetch: typeof globalThis.fetch
  readonly writeLine: (line: string) => void
}

const defaultDependencies: PreflightDependencies = {
  checkCapabilityArtifact: checkRuntimeBudgetCapabilitiesV117Artifact,
  createPool: createDatabasePool,
  environment: process.env,
  fetch: globalThis.fetch,
  writeLine: (line) => console.log(line),
}

class SafePreflightError extends Error {}

const safePreflightError = (detail: string): SafePreflightError =>
  new SafePreflightError(detail)

const safeFailureDetail = (error: unknown): string =>
  error instanceof SafePreflightError
    ? error.message
    : "Preflight check failed; details are intentionally redacted."

const normalizeHttpOrigin = (
  value: string | undefined,
  label: "COWARDS_GO_BACKEND_URL" | "COWARDS_WEB_URL",
): string | undefined => {
  if (value === undefined) return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw safePreflightError(`${label} must be a valid HTTP(S) origin.`)
  }
  if (
    (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== ""
  ) {
    throw safePreflightError(
      `${label} must be an HTTP(S) origin without credentials, path, query, or fragment.`,
    )
  }
  return parsed.origin
}

const normalizeGoBackendOrigin = (
  value: string | undefined,
): string | undefined => normalizeHttpOrigin(value, "COWARDS_GO_BACKEND_URL")

const normalizeWebOrigin = (value: string | undefined): string | undefined =>
  normalizeHttpOrigin(value, "COWARDS_WEB_URL")

const parseOptions = (
  argv: string[],
  environment: Readonly<Record<string, string | undefined>>,
): Options => {
  const options: Options = {
    requireRedis: true,
    requireWeb: environment.COWARDS_WEB_URL !== undefined,
    webUrl: normalizeWebOrigin(environment.COWARDS_WEB_URL),
    goBackendUrl: normalizeGoBackendOrigin(environment.COWARDS_GO_BACKEND_URL),
    goBackendInternalToken:
      environment.COWARDS_GO_BACKEND_INTERNAL_TOKEN?.trim() || undefined,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case "--":
        break
      case "--skip-redis":
        options.requireRedis = false
        break
      case "--require-redis":
        options.requireRedis = true
        break
      case "--require-web":
        options.requireWeb = true
        options.webUrl ??= "http://localhost:3000"
        break
      case "--skip-web":
        options.requireWeb = false
        options.webUrl = undefined
        break
      case "--go-backend-url": {
        const value = argv[index + 1]
        if (!value || value.startsWith("--")) {
          throw safePreflightError("--go-backend-url requires a URL value")
        }
        options.goBackendUrl = normalizeGoBackendOrigin(value)
        index += 1
        break
      }
      case "--web-url": {
        const value = argv[index + 1]
        if (!value || value.startsWith("--")) {
          throw safePreflightError("--web-url requires a URL value")
        }
        options.webUrl = normalizeWebOrigin(value)
        options.requireWeb = true
        index += 1
        break
      }
      default:
        throw safePreflightError("Unknown preflight option.")
    }
  }

  if (options.requireWeb && !options.webUrl?.trim()) {
    throw safePreflightError("Web preflight requires a non-empty web URL")
  }
  return options
}

const check = async (
  layer: Layer,
  name: string,
  required: boolean,
  run: () => Promise<string>,
): Promise<CheckResult> => {
  try {
    return { layer, name, ok: true, required, detail: await run() }
  } catch (error) {
    return {
      layer,
      name,
      ok: false,
      required,
      detail: safeFailureDetail(error),
    }
  }
}

const checkTcp = (
  host: string,
  port: number,
  timeoutMs = 2_000,
): Promise<string> =>
  new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port })
    const timeout = setTimeout(() => {
      socket.destroy()
      reject(new Error(`Timed out connecting to ${host}:${port}`))
    }, timeoutMs)

    socket.once("connect", () => {
      clearTimeout(timeout)
      socket.end()
      resolve("Redis TCP connection accepted")
    })
    socket.once("error", (error) => {
      clearTimeout(timeout)
      reject(error)
    })
  })

const latestChronicle = async (
  pool: ReturnType<typeof createDatabasePool>,
  matchSetId: MatchSetId,
): Promise<{ matchId: MatchId; chronicle: Chronicle }> => {
  const result = await pool.query<{ match_id: MatchId; artifact: Chronicle }>(
    `
      select c.match_id, c.artifact
      from match_set_matches msm
      join chronicles c on c.match_id = msm.match_id
      where msm.match_set_id = $1
      order by msm.matrix_index asc
      limit 1
    `,
    [matchSetId],
  )
  const row = result.rows[0]
  if (!row) {
    throw new Error(`No persisted Chronicle found for ${matchSetId}.`)
  }
  return { matchId: row.match_id, chronicle: row.artifact }
}

const PREFLIGHT_HTTP_TIMEOUT_MS = 5_000

const safeHttpFetch = async (
  url: URL,
  init: RequestInit,
  fetchImplementation: typeof globalThis.fetch,
  label: "Go-owned preflight" | "Web replay",
): Promise<Response> => {
  try {
    return await fetchImplementation(url, {
      ...init,
      redirect: "error",
      signal: globalThis.AbortSignal.timeout(PREFLIGHT_HTTP_TIMEOUT_MS),
    })
  } catch {
    throw safePreflightError(
      `${label} transport failed or exceeded ${PREFLIGHT_HTTP_TIMEOUT_MS} ms; transport details are intentionally redacted.`,
    )
  }
}

export const runGoMatchJobOnce = async (
  options: Pick<Options, "goBackendUrl" | "goBackendInternalToken">,
  matchIds: readonly string[],
  fetchImplementation: typeof globalThis.fetch = globalThis.fetch,
): Promise<string> => {
  const goBackendOrigin = normalizeGoBackendOrigin(options.goBackendUrl)
  const internalToken = options.goBackendInternalToken?.trim()
  if (!goBackendOrigin || !internalToken) {
    throw safePreflightError(
      "Go-owned execution requires COWARDS_GO_BACKEND_URL and COWARDS_GO_BACKEND_INTERNAL_TOKEN.",
    )
  }
  const response = await safeHttpFetch(
    new URL("/internal/match-jobs/run-once", goBackendOrigin),
    {
      method: "POST",
      body: JSON.stringify({ matchIds }),
      headers: {
        "Content-Type": "application/json",
        "X-Cowards-Internal-Token": internalToken,
      },
    },
    fetchImplementation,
    "Go-owned preflight",
  )
  if (!response.ok) {
    throw safePreflightError(
      `Go-owned run-once returned HTTP ${response.status}; response body is intentionally not echoed.`,
    )
  }
  const body: unknown = await response.json()
  if (
    body === null ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof (body as { status?: unknown }).status !== "string"
  ) {
    throw safePreflightError(
      "Go-owned run-once returned an invalid status envelope.",
    )
  }
  const status = (body as { status: string }).status
  const matchId = (body as { matchId?: unknown }).matchId
  if (
    !new Set(["idle", "complete", "retry_queued", "failed_system"]).has(status)
  ) {
    throw safePreflightError("Go-owned run-once returned an unknown status.")
  }
  if (
    status !== "idle" &&
    (typeof matchId !== "string" || !matchIds.includes(matchId))
  ) {
    throw safePreflightError(
      "Go-owned run-once returned a Match outside its allowlist.",
    )
  }
  if (status === "failed_system") {
    throw safePreflightError(
      "Go-owned run-once reported a terminal system failure.",
    )
  }
  return status
}

const writeResults = (
  results: readonly CheckResult[],
  writeLine: (line: string) => void,
): void => {
  writeLine("Coward's Game preflight")
  for (const result of results) {
    const marker = result.ok ? "PASS" : result.required ? "FAIL" : "WARN"
    writeLine(`[${marker}] [${result.layer}] ${result.name}: ${result.detail}`)
  }
  writeLine(`[NOTICE] ${PREFLIGHT_NON_CERTIFICATION_NOTICE}`)
}

export const runPreflight = async (
  argv: readonly string[],
  overrides: Partial<PreflightDependencies> = {},
): Promise<number> => {
  const dependencies = { ...defaultDependencies, ...overrides }
  const options = parseOptions([...argv], dependencies.environment)
  const results: CheckResult[] = []
  let smokeResult: DevelopmentMatchSetSmokeResult | undefined

  results.push(
    await check(
      "contract_validation",
      "Runtime ABI v1.17 capability artifact",
      true,
      async () => {
        const findings = dependencies.checkCapabilityArtifact()
        if (findings.length > 0) {
          throw safePreflightError(
            "Capability artifact failed closed; details are intentionally redacted.",
          )
        }
        const profiles = Object.keys(
          RUNTIME_ABI_V1_17.budgets.preflight.profiles,
        ) as RuntimeAbiV117PreflightProfile[]
        const ledgers = profiles.map((profile) =>
          foldPreflightLedgerV117(profile, []),
        )
        if (
          ledgers.some(
            ({ ledger, outcomes }) =>
              ledger.domain !== "preflight" ||
              ledger.revision !== 0 ||
              ledger.cumulative.operationCount !== 0 ||
              ledger.commitments.length !== 0 ||
              outcomes.length !== 0 ||
              !Object.isFrozen(ledger),
          ) ||
          new Set(ledgers.map(({ ledger }) => ledger.profile)).size !==
            profiles.length
        ) {
          throw safePreflightError(
            "Separate preflight ledger initialization failed closed.",
          )
        }
        return `exact contract-owned bytes accepted; initialized separate ${profiles.join(", ")} ledgers with zero candidate-resource receipts; candidate lanes remain uncertified`
      },
    ),
  )

  if (results.some((result) => result.required && !result.ok)) {
    writeResults(results, dependencies.writeLine)
    return 1
  }

  results.push(
    await check(
      "service_startup",
      "Go-owned Match orchestration configuration",
      true,
      async () => {
        if (!options.goBackendUrl || !options.goBackendInternalToken) {
          throw safePreflightError(
            "COWARDS_GO_BACKEND_URL and COWARDS_GO_BACKEND_INTERNAL_TOKEN are required; the retired TypeScript worker is never used as a fallback.",
          )
        }
        return "explicit Go backend URL and internal credential are configured"
      },
    ),
  )
  if (results.some((result) => result.required && !result.ok)) {
    writeResults(results, dependencies.writeLine)
    return 1
  }

  results.push(
    await check("service_startup", "Go backend health", true, async () => {
      if (!options.goBackendUrl) {
        throw safePreflightError("Go backend origin is unavailable.")
      }
      const response = await safeHttpFetch(
        new URL("/health", options.goBackendUrl),
        { method: "GET" },
        dependencies.fetch,
        "Go-owned preflight",
      )
      if (!response.ok) {
        throw safePreflightError(
          `Go backend health returned HTTP ${response.status}; response body is intentionally not echoed.`,
        )
      }
      return "health endpoint accepted without forwarding the internal credential"
    }),
  )
  if (results.some((result) => result.required && !result.ok)) {
    writeResults(results, dependencies.writeLine)
    return 1
  }

  const pool = dependencies.createPool()
  let cleanupFailed = false

  try {
    results.push(
      await check("service_startup", "Postgres", true, async () => {
        await pool.query("select 1")
        return "database query succeeded"
      }),
    )

    if (options.requireRedis) {
      results.push(
        await check("service_startup", "Redis", true, () =>
          checkTcp("localhost", 6379),
        ),
      )
    } else {
      results.push({
        layer: "service_startup",
        name: "Redis",
        ok: true,
        required: false,
        detail: "skipped; Redis is not required for this path",
      })
    }

    results.push(
      await check("migration", "Database migrations", true, async () => {
        const result = await migrate(pool)
        return `applied ${result.applied.length}, skipped ${result.skipped.length}`
      }),
    )

    results.push(
      await check(
        "seeding",
        "Development seed and MatchSet smoke",
        true,
        async () => {
          smokeResult = await runDevelopmentMatchSetSmoke(pool, {
            matchSetId: `match-set:preflight:${randomUUID()}` as MatchSetId,
            evidenceResolver: createFixtureMatchSetEvidenceResolver(),
            runQueuedMatch: async (matchIds) => {
              const remaining = new Set(matchIds)
              const maxAttempts = matchIds.length + 16
              for (let index = 0; index < maxAttempts; index += 1) {
                const status = await runGoMatchJobOnce(
                  options,
                  matchIds,
                  dependencies.fetch,
                )
                if (status === "idle") {
                  await sleep(100)
                }
                const completed = await pool.query<{ id: string }>(
                  "select id from matches where id = any($1) and status = 'complete'",
                  [matchIds],
                )
                for (const row of completed.rows) {
                  remaining.delete(row.id)
                }
                if (remaining.size === 0) {
                  break
                }
              }
              if (remaining.size > 0) {
                throw safePreflightError(
                  `Go-owned orchestration did not complete the allowed Match set after ${maxAttempts} attempts; Match identifiers are intentionally not echoed.`,
                )
              }
            },
          })
          if (
            smokeResult.status !== "complete" ||
            smokeResult.chronicleCount < smokeResult.matchCount
          ) {
            throw safePreflightError(
              `Development MatchSet smoke did not complete; chronicles=${smokeResult.chronicleCount}/${smokeResult.matchCount}.`,
            )
          }
          return `MatchSet complete; chronicles=${smokeResult.chronicleCount}/${smokeResult.matchCount}`
        },
      ),
    )

    results.push(
      await check(
        "chronicle_validation",
        "Preflight MatchSet Chronicle replay parse",
        true,
        async () => {
          if (!smokeResult) {
            throw new Error("Smoke MatchSet did not complete.")
          }
          const { chronicle } = await latestChronicle(
            pool,
            smokeResult.matchSetId,
          )
          const replay = createReplay(chronicle)
          if (!replay.ok) {
            throw new Error(
              replay.errors[0]?.message ?? "Chronicle could not be replayed.",
            )
          }
          return `${chronicle.events.length} Chronicle events accepted`
        },
      ),
    )

    results.push(
      await check(
        "replay_projection",
        "Preflight MatchSet public projection",
        true,
        async () => {
          if (!smokeResult) {
            throw new Error("Smoke MatchSet did not complete.")
          }
          const { chronicle } = await latestChronicle(
            pool,
            smokeResult.matchSetId,
          )
          const projection = projectPublicChronicle(chronicle)
          return `${projection.events.length} public events projected`
        },
      ),
    )

    if (options.requireWeb) {
      results.push(
        await check("ui_rendering", "Web replay route", true, async () => {
          if (!smokeResult) {
            throw new Error("Smoke MatchSet did not complete.")
          }
          if (!options.webUrl) {
            throw new Error("Web preflight requires a non-empty web URL")
          }
          const { matchId } = await latestChronicle(
            pool,
            smokeResult.matchSetId,
          )
          const replayUrl = new URL(
            `/matches/${encodeURIComponent(matchId)}/replay`,
            options.webUrl,
          )
          const response = await safeHttpFetch(
            replayUrl,
            { method: "GET" },
            dependencies.fetch,
            "Web replay",
          )
          if (!response.ok) {
            throw safePreflightError(
              `Web replay route returned HTTP ${response.status}; response body is intentionally not echoed.`,
            )
          }
          const html = await response.text()
          if (!html.includes("Replay")) {
            throw safePreflightError(
              "Web replay route did not render expected public content.",
            )
          }
          return "Web replay route returned public replay content"
        }),
      )
    }
  } finally {
    try {
      await pool.end()
    } catch {
      cleanupFailed = true
    }
  }

  if (cleanupFailed) {
    results.push({
      layer: "service_startup",
      name: "Postgres cleanup",
      ok: false,
      required: true,
      detail: "Preflight database cleanup failed; details are redacted.",
    })
  }

  writeResults(results, dependencies.writeLine)

  return results.some((result) => result.required && !result.ok) ? 1 : 0
}

const isMain =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  runPreflight(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code
    })
    .catch(() => {
      console.error(
        "[FAIL] [service_startup] preflight crashed; details are intentionally redacted.",
      )
      process.exitCode = 1
    })
}
