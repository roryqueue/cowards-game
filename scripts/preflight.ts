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
/* eslint-disable-next-line no-restricted-imports -- Preflight intentionally composes workspace source entry points before packages are built. */
import {
  createReplay,
  projectPublicChronicle,
} from "../packages/replay/src/index.ts"
/* eslint-disable-next-line no-restricted-imports -- Preflight intentionally invokes the source worker in the local operational smoke. */
import { runWorkerOnce } from "../apps/worker/src/runner.ts"
/* eslint-disable-next-line no-restricted-imports -- Preflight needs the candidate contract before package build output exists. */
import {
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
  readonly writeLine: (line: string) => void
}

const defaultDependencies: PreflightDependencies = {
  checkCapabilityArtifact: checkRuntimeBudgetCapabilitiesV117Artifact,
  createPool: createDatabasePool,
  writeLine: (line) => console.log(line),
}

const parseOptions = (argv: string[]): Options => {
  const options: Options = {
    requireRedis: true,
    requireWeb: process.env.COWARDS_WEB_URL !== undefined,
    webUrl: process.env.COWARDS_WEB_URL,
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
      case "--web-url": {
        const value = argv[index + 1]
        if (!value || value.startsWith("--")) {
          throw new Error("--web-url requires a URL value")
        }
        options.webUrl = value
        options.requireWeb = true
        index += 1
        break
      }
      default:
        throw new Error(`Unknown preflight option: ${arg}`)
    }
  }

  if (options.requireWeb && !options.webUrl?.trim()) {
    throw new Error("Web preflight requires a non-empty web URL")
  }

  return options
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const check = async (
  layer: Layer,
  name: string,
  required: boolean,
  run: () => Promise<string>,
): Promise<CheckResult> => {
  try {
    return { layer, name, ok: true, required, detail: await run() }
  } catch (error) {
    return { layer, name, ok: false, required, detail: errorMessage(error) }
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
      resolve(`${host}:${port} accepted TCP connection`)
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

const writeResults = (
  results: readonly CheckResult[],
  writeLine: (line: string) => void,
): void => {
  writeLine("Coward's Game preflight")
  for (const result of results) {
    const marker = result.ok ? "PASS" : result.required ? "FAIL" : "WARN"
    writeLine(
      `[${marker}] [${result.layer}] ${result.name}: ${result.detail}`,
    )
  }
  writeLine(`[NOTICE] ${PREFLIGHT_NON_CERTIFICATION_NOTICE}`)
}

export const runPreflight = async (
  argv: readonly string[],
  overrides: Partial<PreflightDependencies> = {},
): Promise<number> => {
  const dependencies = { ...defaultDependencies, ...overrides }
  const options = parseOptions([...argv])
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
          throw new Error(
            `capability artifact failed closed: ${findings.join(", ")}`,
          )
        }
        return "exact contract-owned bytes accepted; candidate lanes remain uncertified"
      },
    ),
  )

  if (results.some((result) => result.required && !result.ok)) {
    writeResults(results, dependencies.writeLine)
    return 1
  }

  const pool = dependencies.createPool()

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
          runQueuedMatch: async (matchIds) => {
            const remaining = new Set(matchIds)
            const maxAttempts = matchIds.length + 8
            for (let index = 0; index < maxAttempts; index += 1) {
              const status = await runWorkerOnce(pool, {
                workerId: "worker:preflight",
                once: true,
                matchIds: matchIds as readonly MatchId[],
                jobOwnership: {
                  lifecycleOwner: "go",
                  workerPurpose: "test",
                },
              })
              if (status === "idle") {
                await sleep(100)
                continue
              }
              if (status !== "completed") {
                throw new Error(`worker returned ${status}`)
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
              throw new Error(
                `worker did not complete preflight matches after ${maxAttempts} attempts: ${[...remaining].join(", ")}`,
              )
            }
          },
        })
        if (
          smokeResult.status !== "complete" ||
          smokeResult.chronicleCount < smokeResult.matchCount
        ) {
          throw new Error(
            `${smokeResult.matchSetId} ${smokeResult.status}; chronicles=${smokeResult.chronicleCount}/${smokeResult.matchCount}`,
          )
        }
        return `${smokeResult.matchSetId} complete; chronicles=${smokeResult.chronicleCount}/${smokeResult.matchCount}`
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
        return `${smokeResult.matchSetId} ${chronicle.events.length} events accepted`
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
        return `${smokeResult.matchSetId} ${projection.events.length} public events projected`
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
        const { matchId } = await latestChronicle(pool, smokeResult.matchSetId)
        const replayUrl = new URL(
          `/matches/${encodeURIComponent(matchId)}/replay`,
          options.webUrl,
        )
        const response = await globalThis.fetch(replayUrl)
        if (!response.ok) {
          throw new Error(`${replayUrl.href} returned HTTP ${response.status}`)
        }
        const html = await response.text()
        if (!html.includes("Replay")) {
          throw new Error(`${replayUrl.href} did not render replay content`)
        }
        return `${replayUrl.href} returned replay content`
      }),
    )
  }

  await pool.end()

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
    .catch((error: unknown) => {
      console.error(
        `[FAIL] [service_startup] preflight crashed: ${errorMessage(error)}`,
      )
      process.exitCode = 1
    })
}
