import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"
import { createDatabasePool } from "@cowards/persistence/db"

type ProofPool = ReturnType<typeof createDatabasePool>

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN
const databaseUrl = process.env.DATABASE_URL
const artifactDir = ".planning/artifacts"
const proofJsonPath = path.join(
  artifactDir,
  "v1.28-signed-in-operations-recovery-proof.json",
)
const proofMarkdownPath = path.join(
  artifactDir,
  "v1.28-signed-in-operations-recovery-proof.md",
)

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objective payload",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "runtimeInternals",
  "DATABASE_URL",
  "postgres://",
  "postgresql://",
  "Bearer ",
  "COWARDS_GO_BACKEND_INTERNAL_TOKEN",
  "/Users/",
] as const

test.skip(
  process.env.RUN_V1_28_PROOF !== "1",
  "v1.28 signed-in operations recovery proof requires local web, live Go backend, Postgres, COWARDS_GO_BACKEND_INTERNAL_TOKEN, DATABASE_URL, and RUN_V1_28_PROOF=1.",
)

interface Timed<T> {
  value: T
  durationMs: number
}

interface RecoveryResponse {
  status: string
  actionId: string
  actionType: string
  jobId: string
  matchId: string
  idempotencyKey: string
  reason?: string
  result?: {
    publicContractChanged?: boolean
    previousJobStatus?: string
    previousMatchStatus?: string
    authorizedAdditionalRun?: boolean
  }
}

interface SeededRecoveryRow {
  prefix: string
  userId: string
  strategyId: string
  revisionId: string
  arenaId: string
  matchId: string
  jobId: string
  quarantineId: string
}

const timed = async <T>(fn: () => Promise<T>): Promise<Timed<T>> => {
  const startedAt = performance.now()
  const value = await fn()
  return { value, durationMs: Math.round(performance.now() - startedAt) }
}

const expectPublicSafe = async (page: Page): Promise<number> => {
  const bodyText = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(bodyText, `[public_privacy] leaked ${marker}`).not.toContain(marker)
  }
  return bodyText.length
}

const saveRevision = async (
  request: APIRequestContext,
  input: {
    source: string
    sourceFormat: "typescript"
    label: string
    notes: string
  },
): Promise<string> => {
  const response = await request.post("/api/account/revisions/save", {
    data: input,
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = (await response.json()) as {
    revision?: { id?: string }
    strategyRevisionId?: string
  }
  const revisionId = body.revision?.id ?? body.strategyRevisionId
  expect(revisionId, "saved Strategy Revision id").toBeTruthy()
  return revisionId!
}

const seedRecoverableJob = async (
  pool: ProofPool,
  input: { prefix: string; revisionId: string },
): Promise<SeededRecoveryRow> => {
  const client = await pool.connect()
  try {
    await client.query("begin")
    const revision = await client.query<{
      strategy_id: string
      owner_user_id: string
    }>(
      `
      select sr.strategy_id, s.owner_user_id
      from strategy_revisions sr
      join strategies s on s.id = sr.strategy_id
      where sr.id = $1
      `,
      [input.revisionId],
    )
    expect(revision.rowCount, "saved revision available in DB").toBe(1)
    const strategyId = revision.rows[0]!.strategy_id
    const userId = revision.rows[0]!.owner_user_id
    const ids: SeededRecoveryRow = {
      prefix: input.prefix,
      userId,
      strategyId,
      revisionId: input.revisionId,
      arenaId: `arena:${input.prefix}`,
      matchId: `match:${input.prefix}`,
      jobId: `match-job:${input.prefix}`,
      quarantineId: `match-execution-quarantine:${input.prefix}`,
    }

    await client.query(
      `
      insert into arena_variants (id, name, version, config, metadata)
      values ($1, $2, 'arena-v1', '{}'::jsonb, '{}'::jsonb)
      on conflict (id) do nothing
      `,
      [ids.arenaId, `v1.28 operations proof ${input.prefix}`],
    )
    await client.query(
      `
      insert into matches (
        id, bottom_strategy_revision_id, top_strategy_revision_id,
        arena_variant_id, seed, status, bottom_player_id, top_player_id,
        failure_category, failure_message, completed_at
      )
      values ($1, $2, $2, $3, $4, 'failed_system', $5, $6,
        'runtime_unavailable', 'runtime service unavailable', now())
      `,
      [
        ids.matchId,
        ids.revisionId,
        ids.arenaId,
        `seed:${input.prefix}`,
        `player:bottom:${input.prefix}`,
        `player:top:${input.prefix}`,
      ],
    )
    await client.query(
      `
      insert into match_jobs (
        id, match_id, status, attempts, max_attempts,
        worker_id, lease_token, lease_expires_at, run_after
      )
      values ($1, $2, 'failed_system', 1, 1,
        $3, $4, null, now())
      `,
      [
        ids.jobId,
        ids.matchId,
        `worker:${input.prefix}`,
        `lease:${input.prefix}`,
      ],
    )
    await client.query(
      `
      insert into match_execution_quarantines (
        id, job_id, match_id, status, reason, failure_category,
        retryable, attempt_number, operator_evidence
      )
      values ($1, $2, $3, 'active', 'retry_exhausted',
        'runtime_unavailable', true, 1,
        '{"workerId":"redacted-proof-worker","publicContractChanged":false}'::jsonb)
      `,
      [ids.quarantineId, ids.jobId, ids.matchId],
    )
    await client.query("commit")
    return ids
  } catch (error) {
    await client.query("rollback")
    throw error
  } finally {
    client.release()
  }
}

const recoverJob = async (
  request: APIRequestContext,
  input: {
    jobId: string
    idempotencyKey: string
  },
): Promise<RecoveryResponse> => {
  const response = await request.post(
    `${goBackendUrl}/internal/match-execution/requeue`,
    {
      headers: { "X-Cowards-Internal-Token": internalToken ?? "" },
      data: {
        jobId: input.jobId,
        operatorId: "operator:v1.28-signed-in-proof",
        idempotencyKey: input.idempotencyKey,
      },
    },
  )
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json()) as RecoveryResponse
}

const verifyRecoveredJob = async (
  pool: ProofPool,
  jobId: string,
): Promise<{
  jobStatus: string
  matchStatus: string
  attempts: number
  maxAttempts: number
  quarantineStatus: string
  operatorActionCount: number
}> => {
  const result = await pool.query<{
    job_status: string
    match_status: string
    attempts: number
    max_attempts: number
    quarantine_status: string
    operator_action_count: string
  }>(
    `
    select
      j.status::text as job_status,
      m.status::text as match_status,
      j.attempts,
      j.max_attempts,
      q.status as quarantine_status,
      (
        select count(*)
        from match_execution_operator_actions a
        where a.job_id = j.id
      )::text as operator_action_count
    from match_jobs j
    join matches m on m.id = j.match_id
    join match_execution_quarantines q on q.job_id = j.id
    where j.id = $1
    `,
    [jobId],
  )
  expect(result.rowCount, "recovered job row").toBe(1)
  return {
    jobStatus: result.rows[0]!.job_status,
    matchStatus: result.rows[0]!.match_status,
    attempts: result.rows[0]!.attempts,
    maxAttempts: result.rows[0]!.max_attempts,
    quarantineStatus: result.rows[0]!.quarantine_status,
    operatorActionCount: Number(result.rows[0]!.operator_action_count),
  }
}

const writeProofArtifacts = (proof: {
  account: { handle: string; signupMs: number }
  revision: { id: string; sourceFormat: string }
  topology: {
    command: string
    webBaseUrl: string
    goBackendUrl: string
    database: string
    runtimeService: string
  }
  recovery: {
    actionId: string
    duplicateStatus: string
    jobId: string
    matchId: string
    jobStatus: string
    matchStatus: string
    quarantineStatus: string
    operatorActionCount: number
  }
  privateEvidence: {
    operatorActionTable: string
    quarantineTable: string
    actionId: string
    jobId: string
    matchId: string
  }
  publicPages: { href: string; bodyLength: number }[]
  totals: {
    privateMarkerScanPassed: boolean
    jsTsCountedPathChecked: boolean
    operatorRecoveryChecked: boolean
    publicContractChanged: boolean
  }
}): void => {
  mkdirSync(artifactDir, { recursive: true })
  const artifact = {
    schemaVersion: "v1.28-signed-in-operations-recovery-proof",
    generatedAt: new Date().toISOString(),
    contractVersion: "match-execution-app-v1",
    ...proof,
    betaRegressionLanes: {
      python:
        "not executed by Phase 208 local proof; remains non-counted exhibition beta only",
      rust: "not executed by Phase 208 local proof; remains non-counted exhibition beta only",
      zig: "not executed by Phase 208 local proof; remains non-counted exhibition beta only",
    },
    nonClaims: [
      "No public result/replay contract expansion",
      "No runtime promotion",
      "No production sandbox certification",
      "No direct-export ABI migration",
      "No Component Model/WIT ABI migration",
      "No counted non-JS play",
    ],
  }
  writeFileSync(proofJsonPath, `${JSON.stringify(artifact, null, 2)}\n`)

  const lines = [
    "# v1.28 Signed-In Operations Recovery Proof",
    "",
    `Account: @${proof.account.handle}`,
    `Saved JS/TS Strategy Revision: ${proof.revision.id}`,
    `Operator action: ${proof.recovery.actionId}`,
    `Duplicate recovery status: ${proof.recovery.duplicateStatus}`,
    `Recovered job: ${proof.recovery.jobId} -> ${proof.recovery.jobStatus}`,
    `Recovered Match: ${proof.recovery.matchId} -> ${proof.recovery.matchStatus}`,
    `Quarantine: ${proof.recovery.quarantineStatus}`,
    `Operator action count: ${proof.recovery.operatorActionCount}`,
    `Private marker scan passed: ${proof.totals.privateMarkerScanPassed ? "yes" : "no"}`,
    "",
    "## Public Pages",
    "",
    "| Page | Body length |",
    "| --- | ---: |",
    ...proof.publicPages.map((page) => `| ${page.href} | ${page.bodyLength} |`),
    "",
    "## Topology",
    "",
    `- Command: \`${proof.topology.command}\``,
    `- Web: ${proof.topology.webBaseUrl}`,
    `- Go backend: ${proof.topology.goBackendUrl}`,
    `- Database: ${proof.topology.database}`,
    `- Runtime-service: ${proof.topology.runtimeService}`,
    `- Private evidence: ${proof.privateEvidence.operatorActionTable}, ${proof.privateEvidence.quarantineTable}.`,
    "",
    "## Non-Claims",
    "",
    "- No public result/replay contract expansion.",
    "- No runtime promotion.",
    "- No production sandbox certification.",
    "- No direct-export ABI migration.",
    "- No Component Model/WIT ABI migration.",
    "- No counted non-JS play.",
    "",
  ]
  writeFileSync(proofMarkdownPath, lines.join("\n"))
}

test("signed-in v1.28 proof covers operator recovery and public-safe pages", async ({
  page,
}) => {
  test.setTimeout(180_000)
  expect(databaseUrl, "DATABASE_URL is required").toBeTruthy()
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const pool = createDatabasePool({ connectionString: databaseUrl! })
  try {
    const suffix = Date.now().toString(36)
    const handle = `v128-${suffix}`
    const workshop = await page.request.get("/api/workshop")
    expect(workshop.status(), await workshop.text()).toBe(200)
    const workshopBody = (await workshop.json()) as { templateSource: string }

    const signupTiming = await timed(async () => {
      const signup = await page.request.post("/api/auth/sign-up", {
        data: {
          username: `v128_${suffix}`,
          handle,
          displayName: "v1.28 Operations Proof",
          password: `v128-proof-${suffix}`,
        },
      })
      expect(signup.status(), await signup.text()).toBe(201)
    })

    const revisionId = await saveRevision(page.request, {
      source: workshopBody.templateSource,
      sourceFormat: "typescript",
      label: "v1.28 JS/TS operations recovery proof revision",
      notes: "Signed-in v1.28 JS/TS counted-path operations proof.",
    })
    await page.goto("/account")
    await expect(page.getByText("TypeScript · counted")).toBeVisible()

    const seeded = await seedRecoverableJob(pool, {
      prefix: `v128-${suffix}`,
      revisionId,
    })
    const idempotencyKey = `v1.28-proof-${suffix}`
    const recovery = await recoverJob(page.request, {
      jobId: seeded.jobId,
      idempotencyKey,
    })
    expect(recovery.status).toBe("applied")
    expect(recovery.result?.publicContractChanged).toBe(false)
    expect(recovery.result?.authorizedAdditionalRun).toBe(true)

    const duplicate = await recoverJob(page.request, {
      jobId: seeded.jobId,
      idempotencyKey,
    })
    expect(duplicate.status).toBe("duplicate")
    const recovered = await verifyRecoveredJob(pool, seeded.jobId)
    expect(recovered).toMatchObject({
      jobStatus: "queued",
      matchStatus: "pending",
      attempts: 1,
      maxAttempts: 2,
      quarantineStatus: "released",
      operatorActionCount: 1,
    })

    const publicPages = []
    for (const href of [
      "/matchsets/match-set%3Afixture%3Aunavailable-runtime",
      "/matchsets/match-set%3Afixture%3Astale-artifact",
      "/matchsets/match-set%3Afixture%3Amalformed-runtime-result",
      "/matches/match%3Afixture%3Apublic-safe-replay/replay",
    ]) {
      await page.goto(href)
      const bodyLength = await expectPublicSafe(page)
      publicPages.push({ href, bodyLength })
    }

    writeProofArtifacts({
      account: { handle, signupMs: signupTiming.durationMs },
      revision: { id: revisionId, sourceFormat: "typescript" },
      topology: {
        command:
          "base=http://localhost:3001 database=<redacted> go=http://127.0.0.1:8087 internal-token=<redacted> pnpm e2e:v1.28-proof",
        webBaseUrl: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        goBackendUrl: goBackendUrl!,
        database: "local Postgres via redacted connection string",
        runtimeService:
          "not required for the seeded operator recovery control proof",
      },
      recovery: {
        actionId: recovery.actionId,
        duplicateStatus: duplicate.status,
        jobId: seeded.jobId,
        matchId: seeded.matchId,
        jobStatus: recovered.jobStatus,
        matchStatus: recovered.matchStatus,
        quarantineStatus: recovered.quarantineStatus,
        operatorActionCount: recovered.operatorActionCount,
      },
      privateEvidence: {
        operatorActionTable: "match_execution_operator_actions",
        quarantineTable: "match_execution_quarantines",
        actionId: recovery.actionId,
        jobId: seeded.jobId,
        matchId: seeded.matchId,
      },
      publicPages,
      totals: {
        privateMarkerScanPassed: true,
        jsTsCountedPathChecked: true,
        operatorRecoveryChecked: true,
        publicContractChanged: false,
      },
    })
  } finally {
    await pool.end()
  }
})
