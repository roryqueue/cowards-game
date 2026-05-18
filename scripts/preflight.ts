#!/usr/bin/env -S pnpm exec tsx
import net from "node:net"
import { randomUUID } from "node:crypto"
import {
  createDatabasePool,
  migrate,
  runDevelopmentMatchSetSmoke,
} from "../packages/persistence/src/index.ts"
import {
  createReplay,
  projectPublicChronicle,
} from "../packages/replay/src/index.ts"
import { runWorkerOnce } from "../apps/worker/src/runner.ts"
import type { Chronicle, MatchSetId } from "@cowards/spec"

type Layer =
  | "service_startup"
  | "migration"
  | "seeding"
  | "worker_execution"
  | "chronicle_validation"
  | "replay_projection"
  | "ui_rendering"

interface CheckResult {
  layer: Layer
  name: string
  ok: boolean
  detail: string
  required: boolean
}

interface Options {
  requireRedis: boolean
  requireWeb: boolean
  skipSmoke: boolean
  webUrl: string | undefined
}

const parseOptions = (argv: string[]): Options => {
  const options: Options = {
    requireRedis: true,
    requireWeb: false,
    skipSmoke: false,
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
      case "--skip-smoke":
        options.skipSmoke = true
        break
      case "--require-web":
        options.requireWeb = true
        options.webUrl ??= "http://localhost:3000"
        break
      case "--skip-web":
        options.requireWeb = false
        options.webUrl = undefined
        break
      case "--web-url":
        options.webUrl = argv[index + 1]
        options.requireWeb = true
        index += 1
        break
      default:
        throw new Error(`Unknown preflight option: ${arg}`)
    }
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
): Promise<Chronicle> => {
  const result = await pool.query<{ artifact: Chronicle }>(
    "select artifact from chronicles order by id desc limit 1",
  )
  const chronicle = result.rows[0]?.artifact
  if (!chronicle) {
    throw new Error("No persisted Chronicle found after smoke execution.")
  }
  return chronicle
}

const run = async (): Promise<number> => {
  const options = parseOptions(process.argv.slice(2))
  const pool = createDatabasePool()
  const results: CheckResult[] = []

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

  if (!options.skipSmoke) {
    results.push(
      await check(
        "seeding",
        "Development seed and MatchSet smoke",
        true,
        async () => {
          const result = await runDevelopmentMatchSetSmoke(pool, {
            matchSetId: `match-set:preflight:${randomUUID()}` as MatchSetId,
            runQueuedMatch: async () => {
              const status = await runWorkerOnce(pool, {
                workerId: "worker:preflight",
                once: true,
              })
              if (status !== "completed") {
                throw new Error(`worker returned ${status}`)
              }
            },
          })
          return `${result.matchSetId} ${result.status}; chronicles=${result.chronicleCount}`
        },
      ),
    )
  }

  results.push(
    await check(
      "chronicle_validation",
      "Latest Chronicle replay parse",
      true,
      async () => {
        const chronicle = await latestChronicle(pool)
        const replay = createReplay(chronicle)
        if (!replay.ok) {
          throw new Error(
            replay.errors[0]?.message ?? "Chronicle could not be replayed.",
          )
        }
        return `${chronicle.events.length} events accepted`
      },
    ),
  )

  results.push(
    await check(
      "replay_projection",
      "Latest Chronicle public projection",
      true,
      async () => {
        const chronicle = await latestChronicle(pool)
        const projection = projectPublicChronicle(chronicle)
        return `${projection.events.length} public events projected`
      },
    ),
  )

  if (options.requireWeb && options.webUrl) {
    results.push(
      await check("ui_rendering", "Web replay route", true, async () => {
        const response = await fetch(options.webUrl)
        if (!response.ok) {
          throw new Error(`${options.webUrl} returned HTTP ${response.status}`)
        }
        return `${options.webUrl} returned HTTP ${response.status}`
      }),
    )
  }

  await pool.end()

  console.log("Coward's Game preflight")
  for (const result of results) {
    const marker = result.ok ? "PASS" : result.required ? "FAIL" : "WARN"
    console.log(
      `[${marker}] [${result.layer}] ${result.name}: ${result.detail}`,
    )
  }

  return results.some((result) => result.required && !result.ok) ? 1 : 0
}

run()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error(
      `[FAIL] [service_startup] preflight crashed: ${errorMessage(error)}`,
    )
    process.exitCode = 1
  })
