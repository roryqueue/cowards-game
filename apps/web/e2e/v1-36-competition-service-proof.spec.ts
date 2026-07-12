import { randomBytes } from "node:crypto"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from "@playwright/test"
import { createDatabasePool } from "@cowards/persistence/db"
import type {
  PublicMatchSetResultDto,
  PublicStandingDto,
  PublicTrialLadderSeasonDto,
} from "@cowards/spec"

const databaseUrl = process.env.DATABASE_URL
const redisUrl = process.env.REDIS_URL
const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN
const runtimeServiceUrl = process.env.COWARDS_RUNTIME_SERVICE_URL
const sessionCookieName = "cowards_session"
const artifactDir = ".planning/artifacts"
const proofJsonPath = path.join(
  artifactDir,
  "v1.36-competition-service-proof.json",
)
const proofMarkdownPath = path.join(
  artifactDir,
  "v1.36-competition-service-proof.md",
)

test.skip(
  process.env.RUN_V1_36_SERVICE_PROOF !== "1",
  "v1.36 service proof requires live Postgres, Redis, web, Go backend, runtime-service, provider credentials, and RUN_V1_36_SERVICE_PROOF=1.",
)

type ProofPool = ReturnType<typeof createDatabasePool>
type SessionCookie = `${typeof sessionCookieName}=${string}`

interface ProofAccount {
  userId: string
  sessionCookie: SessionCookie
  revisionId: string
  helperRevisionId: string
  sourceHash: string
  sourceMarker: string
  lockMatchSetId: string
}

interface ScheduleResult {
  scheduleRunId: string
  createdMatchSetIds: string[]
  leftoverEntryIds: string[]
}

interface PublicLadderPage {
  kind: "publicPage"
  page: "ladder"
  canonicalHref: string
  payload: PublicTrialLadderSeasonDto
}

interface Timed<T> {
  value: T
  durationMs: number
}

interface ServiceProofArtifact {
  schemaVersion: "v1.36-competition-service-proof"
  status: "passed-local-services"
  generatedAt: string
  topology: {
    postgres: "healthy"
    redisConfiguration: "present"
    goBackend: "healthy"
    runtimeService: "healthy"
    accountRevisionOwner: "go"
    publicReadOwner: "go"
  }
  accounts: {
    count: 4
    distinct: true
    providerReadyRevisionCount: 4
    sourceHashes: string[]
  }
  season: {
    seasonId: string
    seasonHref: string
    standingsHref: string
    entryCount: 4
    scheduleRunId: string
    matchSetId: string
    scheduleIdempotent: true
  }
  execution: {
    runOnceIterations: number
    durationMs: number
    matchCount: number
    completeMatchCount: number
    chronicleHashCount: number
  }
  result: {
    resultHref: string
    status: "complete"
    countedState: "counted"
    replayHref: string
    replayPageMs: number
    replayCanvasBytes: number
  }
  standings: {
    deterministicRepeatedRead: true
    rowCount: 4
    rows: Array<
      Pick<
        PublicStandingDto,
        | "rank"
        | "strategyRevisionId"
        | "sourceHash"
        | "points"
        | "wins"
        | "draws"
        | "losses"
      > & {
        countedMatchSetCount: number
        evidenceAvailability: string
        resultLinks: string[]
        replayLinks: string[]
      }
    >
  }
  privacy: {
    publicResultSafe: true
    publicSeasonSafe: true
    publicReplaySafe: true
    proofArtifactSafe: true
  }
  cleanup: {
    mutableCompetitionRowsRemoved: true
    sessionsRevoked: true
    adminCapabilityRemoved: true
    appendOnlyLifecycleAuditRetained: true
  }
  negativeScenarios?: Array<{
    id: string
    kind: "negative"
    status: "passed"
    category: string
    outcome: string
  }>
  governanceScenarios?: Array<{
    id: string
    kind: "governance"
    status: "passed"
    outcome: string
  }>
  browserScenarios?: Array<{
    id: string
    kind: "browser"
    status: "passed"
    outcome: string
  }>
}

const publicLeakMarkers = [
  '"source"',
  '"sourceArtifact"',
  '"compiledArtifact"',
  '"providerValidation"',
  '"bytesBase64"',
  '"strategyMemory"',
  '"soldierMemory"',
  '"objectivePayload"',
  '"rawDiagnostics"',
  '"privateRuntime"',
  '"operatorNote"',
  '"privateDetail"',
  "DATABASE_URL",
  "Bearer ",
] as const

const timed = async <T>(fn: () => Promise<T>): Promise<Timed<T>> => {
  const startedAt = performance.now()
  const value = await fn()
  return { value, durationMs: Math.round(performance.now() - startedAt) }
}

const requiredEnvironment = (): void => {
  expect(databaseUrl, "DATABASE_URL is required").toBeTruthy()
  expect(redisUrl, "REDIS_URL is required").toBeTruthy()
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()
  expect(
    runtimeServiceUrl,
    "COWARDS_RUNTIME_SERVICE_URL is required",
  ).toBeTruthy()
  expect(process.env.COWARDS_GO_ACCOUNT_REVISIONS).toBe("1")
  expect(process.env.COWARDS_GO_PUBLIC_READS).toBe("1")
}

const expectHealthyService = async (
  request: APIRequestContext,
  baseUrl: string,
  serviceLabel: string,
): Promise<void> => {
  const response = await request.get(new URL("/health", baseUrl).toString())
  expect(response.status(), `${serviceLabel} health request failed`).toBe(200)
  const body = (await response.json()) as { ok?: unknown }
  expect(body.ok, `${serviceLabel} health response was not ready`).toBe(true)
}

const expectPublicSafeText = (value: string, sourceMarkers: string[]): void => {
  for (const marker of [...publicLeakMarkers, ...sourceMarkers]) {
    expect(value).not.toContain(marker)
  }
}

const extractSessionCookie = (setCookie: string): SessionCookie => {
  const cookie = setCookie
    .split(/,(?=\s*[^;,\s]+=)/)
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${sessionCookieName}=`))
  expect(cookie, "sign-up must set a Coward's Game session").toBeTruthy()
  return cookie!.split(";")[0] as SessionCookie
}

const createProofAccount = async (
  page: Page,
  input: {
    suffix: string
    accountIndex: number
    templateSource: string
  },
): Promise<ProofAccount> => {
  const accountKey = String(input.accountIndex + 1)
  const handle = `v136-${input.suffix}-${accountKey}`
  const sourceMarker = `v136-private-source-${input.suffix}-${accountKey}`
  const signup = await page.request.post("/api/auth/sign-up", {
    data: {
      username: `v136_${input.suffix}_${accountKey}`,
      handle,
      displayName: "v1.36 Competition Service Proof",
      password: randomBytes(24).toString("base64url"),
    },
  })
  expect(signup.status(), await signup.text()).toBe(201)
  const signupBody = (await signup.json()) as { user: { id: string } }
  const sessionCookie = extractSessionCookie(
    signup.headers()["set-cookie"] ?? "",
  )

  const saveRevision = async (marker: string, label: string) => {
    const save = await page.request.post("/api/account/revisions/save", {
      headers: { cookie: sessionCookie },
      data: {
        source: `${input.templateSource}\n// ${marker}\n`,
        sourceFormat: "typescript",
        label,
        notes: "Service-backed counted Season proof.",
      },
    })
    expect(save.status(), await save.text()).toBe(201)
    const saveText = await save.text()
    expectPublicSafeText(saveText, [marker])
    return JSON.parse(saveText) as {
      revision: {
        id: string
        sourceHash: string
        valid: boolean
        lockedAt?: string | undefined
        countedEntryEligibilityCategory: string
        runtimeSemantics: {
          languageId: string
          countedPlayEligible: boolean
        }
      }
    }
  }

  const selected = await saveRevision(
    sourceMarker,
    `v1.36 counted Season proof ${accountKey}`,
  )
  const helperMarker = `${sourceMarker}-lock-helper`
  const helper = await saveRevision(
    helperMarker,
    `v1.36 immutable submission helper ${accountKey}`,
  )
  expect(selected.revision).toMatchObject({
    valid: true,
    countedEntryEligibilityCategory: "mutable_draft",
    runtimeSemantics: {
      languageId: "typescript",
      countedPlayEligible: true,
    },
  })
  expect(selected.revision.lockedAt).toBeUndefined()
  expect(selected.revision.sourceHash).toMatch(/^[a-f0-9]{64}$/)

  const lockSubmission = await page.request.post("/api/exhibitions", {
    headers: { cookie: sessionCookie },
    data: {
      presetId: "smoke-exhibition-v1",
      revisionIds: [selected.revision.id, helper.revision.id],
      counted: false,
    },
  })
  expect(lockSubmission.status(), await lockSubmission.text()).toBe(201)
  const lockSubmissionText = await lockSubmission.text()
  expectPublicSafeText(lockSubmissionText, [sourceMarker, helperMarker])
  const lockSubmissionBody = JSON.parse(lockSubmissionText) as {
    matchSetId: string
  }

  const revisions = await page.request.get("/api/account/revisions", {
    headers: { cookie: sessionCookie },
  })
  expect(revisions.status(), await revisions.text()).toBe(200)
  const revisionList = (await revisions.json()) as {
    revisions: Array<{
      id: string
      lockedAt?: string | undefined
      countedEntryEligibilityCategory: string
    }>
  }
  expect(
    revisionList.revisions.find(
      (revision) => revision.id === selected.revision.id,
    ),
  ).toMatchObject({
    countedEntryEligibilityCategory: "provider_validated",
    lockedAt: expect.any(String),
  })

  return {
    userId: signupBody.user.id,
    sessionCookie,
    revisionId: selected.revision.id,
    helperRevisionId: helper.revision.id,
    sourceHash: selected.revision.sourceHash,
    sourceMarker,
    lockMatchSetId: lockSubmissionBody.matchSetId,
  }
}

const expectEntryRejection = async (
  page: Page,
  seasonId: string,
  account: ProofAccount,
  revisionId: string,
  expectedCategory: string,
): Promise<void> => {
  const response = await page.request.post(
    `/api/ladder/seasons/${encodeURIComponent(seasonId)}/entries`,
    {
      headers: { cookie: account.sessionCookie },
      data: { revisionId },
    },
  )
  const expectedStatus =
    expectedCategory === "runtime_service_unavailable"
      ? 503
      : expectedCategory === "already_entered_season" ||
          expectedCategory === "replacement_blocked"
        ? 409
        : 422
  expect(response.status()).toBe(expectedStatus)
  const text = await response.text()
  expectPublicSafeText(text, [account.sourceMarker])
  const body = JSON.parse(text) as {
    ok?: boolean
    eligibility?: { category?: string }
  }
  expect(body.ok).toBe(false)
  expect(body.eligibility?.category).toBe(expectedCategory)
}

const createAndOpenSeason = async (
  page: Page,
  pool: ProofPool,
  admin: ProofAccount,
  suffix: string,
): Promise<{ seasonId: string; slug: string }> => {
  await pool.query("update users set is_admin = true where id = $1", [
    admin.userId,
  ])
  const slug = `v136-service-proof-${suffix}`
  const create = await page.request.post("/api/ladder/seasons", {
    headers: { cookie: admin.sessionCookie },
    data: {
      name: `v1.36 Service Proof ${suffix}`,
      slug,
      description: "Isolated service-backed counted Season proof.",
      seasonSeed: `v136-season-seed-${suffix}`,
    },
  })
  expect(create.status(), await create.text()).toBe(201)
  const body = (await create.json()) as { seasonId: string }
  expect(body.seasonId).toBeTruthy()

  const opened = await pool.query(
    `
      update trial_ladder_seasons
      set status = 'open', opened_at = now(), updated_at = now()
      where id = $1 and status = 'draft'
    `,
    [body.seasonId],
  )
  expect(opened.rowCount).toBe(1)
  return { seasonId: body.seasonId, slug }
}

const enterSeason = async (
  page: Page,
  seasonId: string,
  account: ProofAccount,
): Promise<string> => {
  const response = await page.request.post(
    `/api/ladder/seasons/${encodeURIComponent(seasonId)}/entries`,
    {
      headers: { cookie: account.sessionCookie },
      data: { revisionId: account.revisionId },
    },
  )
  expect(response.status(), await response.text()).toBe(201)
  const body = (await response.json()) as { entryId: string }
  expect(body.entryId).toBeTruthy()
  return body.entryId
}

const scheduleSeason = async (
  page: Page,
  seasonId: string,
  admin: ProofAccount,
): Promise<ScheduleResult> => {
  const response = await page.request.post(
    `/api/ladder/seasons/${encodeURIComponent(seasonId)}/schedule`,
    { headers: { cookie: admin.sessionCookie } },
  )
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json()) as ScheduleResult
}

const applyGovernance = async (
  page: Page,
  admin: ProofAccount,
  matchSetId: string,
  action: string,
  category: string,
): Promise<void> => {
  const response = await page.request.post("/api/admin/matchsets/governance", {
    headers: { cookie: admin.sessionCookie },
    data: {
      matchSetIds: [matchSetId],
      action,
      category,
      privateReason: "v1.36 isolated service proof review.",
    },
  })
  expect(response.status(), await response.text()).toBe(200)
}

const readMatchSet = async (
  page: Page,
  matchSetId: string,
): Promise<PublicMatchSetResultDto> => {
  const response = await page.request.get(
    `/api/matchsets/${encodeURIComponent(matchSetId)}`,
  )
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json()) as PublicMatchSetResultDto
}

const executeMatchSet = async (
  page: Page,
  pool: ProofPool,
  matchSetId: string,
): Promise<Timed<{ result: PublicMatchSetResultDto; iterations: number }>> =>
  timed(async () => {
    const runStatuses: string[] = []
    let lastResult: PublicMatchSetResultDto | undefined
    for (let iteration = 0; iteration < 40; iteration += 1) {
      const result = await readMatchSet(page, matchSetId)
      lastResult = result
      if (result.status === "complete") {
        return { result, iterations: iteration }
      }
      expect(["accepted", "queued", "running"]).toContain(result.status)
      const run = await page.request.post(
        new URL("/internal/match-jobs/run-once", goBackendUrl!).toString(),
        {
          headers: { "X-Cowards-Internal-Token": internalToken! },
        },
      )
      const runText = await run.text()
      expect(run.status(), runText).toBe(200)
      const runBody = JSON.parse(runText) as { status?: unknown }
      runStatuses.push(String(runBody.status ?? "unknown"))
      await page.waitForTimeout(250)
    }
    const failures = await pool.query<{
      error_class: string | null
      retryable: boolean
    }>(
      `
        select distinct mja.error_class, mja.retryable
        from match_job_attempts mja
        join match_jobs mj on mj.id = mja.job_id
        join match_set_matches msm on msm.match_id = mj.match_id
        where msm.match_set_id = $1
        order by mja.error_class, mja.retryable
      `,
      [matchSetId],
    )
    throw new Error(
      `Counted Season MatchSet did not complete in 40 run-once iterations: ${JSON.stringify(
        {
          runStatuses,
          resultStatus: lastResult?.status,
          matchStatuses: lastResult?.matches.map((match) => match.status),
          failureClasses: failures.rows,
        },
      )}`,
    )
  })

const readPublicLadder = async (
  page: Page,
  seasonId: string,
): Promise<PublicLadderPage> => {
  const response = await page.request.get(
    new URL(
      `/public/ladders/${encodeURIComponent(seasonId)}`,
      goBackendUrl!,
    ).toString(),
  )
  expect(response.status(), await response.text()).toBe(200)
  return (await response.json()) as PublicLadderPage
}

const verifyReplayPage = async (
  page: Page,
  replayHref: string,
  sourceMarkers: string[],
): Promise<Timed<{ bodyText: string; canvasBytes: number }>> =>
  timed(async () => {
    await page.goto(replayHref)
    await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
    await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
    const canvas = page.locator("canvas")
    await expect(canvas).toHaveCount(1)
    const canvasBytes = await canvas.evaluate(
      (node) => (node as HTMLCanvasElement).toDataURL().length,
    )
    expect(canvasBytes).toBeGreaterThan(500)
    const box = await canvas.boundingBox()
    expect(box?.width ?? 0).toBeGreaterThan(240)
    expect(box?.height ?? 0).toBeGreaterThan(240)
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0)
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
      page.viewportSize()?.width ?? 1440,
    )
    await expect(
      page.getByRole("button", { name: /Soldier / }).first(),
    ).toBeVisible()
    const bodyText = await page.locator("body").innerText()
    expectPublicSafeText(bodyText, sourceMarkers)
    return { bodyText, canvasBytes }
  })

const deleteProofMatchSets = async (
  pool: ProofPool,
  matchSetIds: string[],
): Promise<void> => {
  if (!matchSetIds.length) return
  const matches = await pool.query<{ id: string }>(
    "select match_id as id from match_set_matches where match_set_id = any($1::text[])",
    [matchSetIds],
  )
  const matchIds = matches.rows.map((row) => row.id)
  if (matchIds.length) {
    await pool.query(
      "delete from match_execution_operator_actions where match_id = any($1::text[])",
      [matchIds],
    )
    await pool.query(
      "delete from match_execution_quarantines where match_id = any($1::text[])",
      [matchIds],
    )
    await pool.query(
      "delete from match_job_attempts where job_id in (select id from match_jobs where match_id = any($1::text[]))",
      [matchIds],
    )
    await pool.query(
      "delete from match_jobs where match_id = any($1::text[])",
      [matchIds],
    )
    await pool.query(
      "delete from chronicles where match_id = any($1::text[])",
      [matchIds],
    )
  }
  await pool.query(
    "delete from match_set_matches where match_set_id = any($1::text[])",
    [matchSetIds],
  )
  await pool.query(
    "delete from competition_entrants where match_set_id = any($1::text[])",
    [matchSetIds],
  )
  if (matchIds.length) {
    await pool.query("delete from matches where id = any($1::text[])", [
      matchIds,
    ])
  }
  await pool.query("delete from match_sets where id = any($1::text[])", [
    matchSetIds,
  ])
}

const cleanupProofRows = async (
  pool: ProofPool,
  seasonId: string | undefined,
  accounts: ProofAccount[],
): Promise<void> => {
  const userIds = accounts.map((account) => account.userId)
  if (seasonId || userIds.length) {
    const matchSets = await pool.query<{ id: string }>(
      `
        select id
        from match_sets
        where ($1::text is not null and ladder_season_id = $1)
           or creator_user_id = any($2::text[])
      `,
      [seasonId ?? null, userIds],
    )
    const matchSetIds = matchSets.rows.map((row) => row.id)
    await deleteProofMatchSets(pool, matchSetIds)
    if (seasonId) {
      await pool.query("delete from trial_ladder_seasons where id = $1", [
        seasonId,
      ])
    }
  }

  if (!userIds.length) return
  await pool.query(
    "delete from user_sessions where user_id = any($1::text[])",
    [userIds],
  )
  await pool.query(
    "delete from strategy_revisions where strategy_id in (select id from strategies where owner_user_id = any($1::text[]))",
    [userIds],
  )
  await pool.query(
    "delete from strategies where owner_user_id = any($1::text[])",
    [userIds],
  )
  await pool.query(
    "delete from competition_submission_events where user_id = any($1::text[])",
    [userIds],
  )
  if (accounts.length > 1) {
    await pool.query("delete from users where id = any($1::text[])", [
      accounts.slice(1).map((account) => account.userId),
    ])
  }
  // Scheduling writes append-only lifecycle audit events. Retain their actor row,
  // but remove its admin capability and every live session.
  await pool.query("update users set is_admin = false where id = $1", [
    accounts[0]!.userId,
  ])
}

const writeProofArtifacts = (proof: ServiceProofArtifact): void => {
  const json = `${JSON.stringify(proof, null, 2)}\n`
  expectPublicSafeText(json, [])
  for (const secret of [
    internalToken,
    process.env.COWARDS_PROVIDER_VALIDATION_SECRET,
  ]) {
    if (secret) expect(json).not.toContain(secret)
  }

  const lines = [
    "# v1.36 Competition Service Proof",
    "",
    `Status: ${proof.status}`,
    `Generated: ${proof.generatedAt}`,
    "",
    "## Positive Path",
    "",
    `- Four distinct signed-in accounts saved four provider-ready TypeScript revisions through the account route.`,
    `- Season: ${proof.season.seasonId}`,
    `- Entries: ${proof.season.entryCount}`,
    `- MatchSet: ${proof.season.matchSetId}`,
    `- Result: ${proof.result.status} / ${proof.result.countedState}`,
    `- Matches: ${proof.execution.completeMatchCount}/${proof.execution.matchCount} complete with ${proof.execution.chronicleHashCount} public Chronicle hashes.`,
    `- Standings: ${proof.standings.rowCount} rows; repeated Go-backed reads were byte-stable.`,
    `- Replay: ${proof.result.replayHref}`,
    "",
    "## Boundaries",
    "",
    "- Account revision ownership: Go backend.",
    "- Public result, Season, standings, and replay reads: Go backend.",
    "- Strategy execution: runtime-service provider boundary only.",
    "- Public result, Season, replay, and proof-artifact privacy scans passed.",
    "- Mutable competition rows and sessions were removed; append-only lifecycle audit lineage was retained with admin capability removed.",
    "",
    "## Evidence Links",
    "",
    `- Season: ${proof.season.seasonHref}`,
    `- Standings: ${proof.season.standingsHref}`,
    `- Result: ${proof.result.resultHref}`,
    `- Replay: ${proof.result.replayHref}`,
    "",
    ...(proof.negativeScenarios?.length
      ? [
          "## Counted Entry Rejections",
          "",
          ...proof.negativeScenarios.map(
            (scenario) =>
              `- ${scenario.id}: ${scenario.category} (${scenario.status})`,
          ),
          "",
        ]
      : []),
    ...(proof.governanceScenarios?.length
      ? [
          "## Governance Scenarios",
          "",
          ...proof.governanceScenarios.map(
            (scenario) => `- ${scenario.id}: ${scenario.status}`,
          ),
          "",
        ]
      : []),
    ...(proof.browserScenarios?.length
      ? [
          "## Browser Scenarios",
          "",
          ...proof.browserScenarios.map(
            (scenario) => `- ${scenario.id}: ${scenario.status}`,
          ),
          "",
        ]
      : []),
  ]
  const markdown = `${lines.join("\n")}\n`
  expectPublicSafeText(markdown, [])
  for (const secret of [
    internalToken,
    process.env.COWARDS_PROVIDER_VALIDATION_SECRET,
  ]) {
    if (secret) expect(markdown).not.toContain(secret)
  }

  mkdirSync(artifactDir, { recursive: true })
  writeFileSync(proofJsonPath, json)
  writeFileSync(proofMarkdownPath, markdown)
}

test("counted Season path crosses live services and produces deterministic standings", async ({
  page,
}) => {
  test.setTimeout(600_000)
  requiredEnvironment()

  const pool = createDatabasePool({ connectionString: databaseUrl! })
  const suffix = `${Date.now().toString(36)}${process.pid.toString(36)}`
  const accounts: ProofAccount[] = []
  let seasonId: string | undefined
  let proof: Omit<ServiceProofArtifact, "cleanup"> | undefined

  try {
    await pool.query("select 1")
    await expectHealthyService(page.request, goBackendUrl!, "Go backend")
    await expectHealthyService(
      page.request,
      runtimeServiceUrl!,
      "runtime-service",
    )

    const workshop = await page.request.get("/api/workshop")
    expect(workshop.status(), await workshop.text()).toBe(200)
    const workshopBody = (await workshop.json()) as { templateSource: string }
    expect(workshopBody.templateSource.length).toBeGreaterThan(100)

    for (let accountIndex = 0; accountIndex < 4; accountIndex += 1) {
      accounts.push(
        await createProofAccount(page, {
          suffix,
          accountIndex,
          templateSource: workshopBody.templateSource,
        }),
      )
    }
    expect(new Set(accounts.map((account) => account.userId)).size).toBe(4)
    expect(new Set(accounts.map((account) => account.revisionId)).size).toBe(4)
    expect(new Set(accounts.map((account) => account.sourceHash)).size).toBe(4)
    await deleteProofMatchSets(
      pool,
      accounts.map((account) => account.lockMatchSetId),
    )

    const season = await createAndOpenSeason(page, pool, accounts[0]!, suffix)
    seasonId = season.seasonId
    const entryIds = await Promise.all(
      accounts.map((account) => enterSeason(page, season.seasonId, account)),
    )
    expect(new Set(entryIds).size).toBe(4)

    const scheduled = await scheduleSeason(page, season.seasonId, accounts[0]!)
    expect(scheduled.createdMatchSetIds).toHaveLength(1)
    expect(scheduled.leftoverEntryIds).toEqual([])
    const repeatedSchedule = await scheduleSeason(
      page,
      season.seasonId,
      accounts[0]!,
    )
    expect(repeatedSchedule).toEqual(scheduled)
    const matchSetId = scheduled.createdMatchSetIds[0]!

    const execution = await executeMatchSet(page, pool, matchSetId)
    const result = execution.value.result
    expect(result.status).toBe("complete")
    expect(result.competition?.seasonId).toBe(season.seasonId)
    expect(result.competition?.countedState.state).toBe("counted")
    expect(result.metadata).toMatchObject({ countedStatus: "counted" })
    expect(result.matches.length).toBeGreaterThan(0)
    expect(result.matches.every((match) => match.status === "complete")).toBe(
      true,
    )
    expect(
      result.matches.every(
        (match) => match.replayAvailable && Boolean(match.chronicleHash),
      ),
    ).toBe(true)
    expect(result.standings).toHaveLength(4)

    const sourceMarkers = accounts.map((account) => account.sourceMarker)
    expectPublicSafeText(JSON.stringify(result), sourceMarkers)

    const ladderA = await readPublicLadder(page, season.seasonId)
    const ladderB = await readPublicLadder(page, season.seasonId)
    expect(ladderA.payload.entries).toHaveLength(4)
    expect(ladderA.payload.matchSets).toHaveLength(1)
    expect(ladderA.payload.matchSets[0]).toMatchObject({
      matchSetId,
      status: "complete",
      countedStatus: "counted",
      countedState: { state: "counted" },
    })
    expect(ladderA.payload.standings).toHaveLength(4)
    expect(JSON.stringify(ladderA.payload.standings)).toBe(
      JSON.stringify(ladderB.payload.standings),
    )
    for (const standing of ladderA.payload.standings) {
      expect(standing.competitionEvidence).toMatchObject({
        countedMatchSetCount: 1,
        excludedMatchSetCount: 0,
        evidenceAvailability: "available",
      })
      expect(standing.competitionEvidence?.resultLinks).toEqual([
        `/matchsets/${encodeURIComponent(matchSetId)}`,
      ])
      expect(standing.competitionEvidence?.replayLinks).toHaveLength(1)
    }
    expectPublicSafeText(JSON.stringify(ladderA), sourceMarkers)

    const publicMatchSet = ladderA.payload.matchSets[0]!
    expect(publicMatchSet.replayHref).toBeTruthy()
    await page.goto(publicMatchSet.resultHref)
    await expect(page.locator("main")).toBeVisible()
    await expect(page.locator("body")).toContainText(/counted/i)
    expectPublicSafeText(await page.locator("body").innerText(), sourceMarkers)

    await page.goto(ladderA.payload.links.seasonHref)
    await expect(
      page.getByRole("heading", { name: new RegExp(`v1\\.36 Service Proof`) }),
    ).toBeVisible()
    await expect(page.locator("body")).toContainText("4 ranked entries")
    await expect(page.locator("body")).toContainText("1 counted / 0 excluded")
    expectPublicSafeText(await page.locator("body").innerText(), sourceMarkers)

    const replay = await verifyReplayPage(
      page,
      publicMatchSet.replayHref!,
      sourceMarkers,
    )

    const governanceScenarios: NonNullable<
      ServiceProofArtifact["governanceScenarios"]
    > = []
    const governancePassed = (id: string, outcome: string): void => {
      governanceScenarios.push({
        id,
        kind: "governance",
        status: "passed",
        outcome,
      })
    }
    const expectCountedState = async (state: string) => {
      const current = await readMatchSet(page, matchSetId)
      expect(current.competition?.countedState.state).toBe(state)
      return current
    }

    const generalReport = await page.request.post(
      `/api/matchsets/${encodeURIComponent(matchSetId)}/reports`,
      {
        headers: { cookie: accounts[0]!.sessionCookie },
        data: { submissionType: "report", category: "result_integrity" },
      },
    )
    expect(generalReport.status(), await generalReport.text()).toBe(201)
    await expectCountedState("counted")
    governancePassed(
      "general-report-no-suppression",
      "A general report left complete counted evidence in standings.",
    )

    const dispute = await page.request.post(
      `/api/matchsets/${encodeURIComponent(matchSetId)}/reports`,
      {
        headers: { cookie: accounts[0]!.sessionCookie },
        data: { submissionType: "dispute", category: "result_integrity" },
      },
    )
    expect(dispute.status(), await dispute.text()).toBe(201)
    await expectCountedState("disputed")
    governancePassed(
      "entrant-dispute-hold",
      "An entrant dispute created the canonical standings hold.",
    )
    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "counted",
      "review_resolved_counted",
    )
    await expectCountedState("counted")

    await pool.query(
      "update match_sets set status = 'degraded' where id = $1",
      [matchSetId],
    )
    await expectCountedState("degraded_system_failure")
    governancePassed(
      "degraded-result",
      "A degraded result remained visible but contributed no counted standing.",
    )
    await pool.query(
      "update match_sets set status = 'complete' where id = $1",
      [matchSetId],
    )

    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "non_counted",
      "evidence_incomplete",
    )
    await expectCountedState("non_counted")
    governancePassed(
      "explicit-non-counted",
      "An explicit non-counted action excluded the result from standings.",
    )
    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "counted",
      "review_resolved_counted",
    )

    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "under_review",
      "integrity_review",
    )
    await expectCountedState("under_review")
    governancePassed(
      "under-review-disputed",
      "Under-review and disputed states both excluded otherwise complete evidence.",
    )
    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "counted",
      "review_resolved_counted",
    )

    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "invalid",
      "result_invalid",
    )
    await expectCountedState("invalid")
    governancePassed(
      "invalid-result",
      "Invalid evidence was excluded with fixed public-safe copy.",
    )
    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "counted",
      "review_resolved_counted",
    )

    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "invalidated",
      "result_invalidated",
    )
    const invalidated = await expectCountedState("invalidated")
    expect(invalidated.matches.every((match) => match.replayAvailable)).toBe(
      true,
    )
    governancePassed(
      "invalidated-result",
      "Invalidated evidence was excluded without removing public result evidence.",
    )
    governancePassed(
      "replay-availability-chronicle-derived",
      "Replay availability remained derived from Chronicle evidence while governance excluded standings.",
    )
    await applyGovernance(
      page,
      accounts[0]!,
      matchSetId,
      "counted",
      "review_resolved_counted",
    )
    await expectCountedState("counted")
    governancePassed(
      "restore-counted-complete-evidence",
      "Complete scoring and Chronicle evidence restored counted standing after review.",
    )

    const scoring = await pool.query<{ scoring: unknown }>(
      "select scoring from match_sets where id = $1",
      [matchSetId],
    )
    await pool.query(
      "update match_sets set scoring = null, counted_status = 'under_review', review_status = 'under_review' where id = $1",
      [matchSetId],
    )
    const rejectedRestore = await page.request.post(
      "/api/admin/matchsets/governance",
      {
        headers: { cookie: accounts[0]!.sessionCookie },
        data: {
          matchSetIds: [matchSetId],
          action: "counted",
          category: "review_resolved_counted",
          privateReason: "v1.36 incomplete evidence rejection proof.",
        },
      },
    )
    expect(rejectedRestore.status(), await rejectedRestore.text()).toBe(409)
    governancePassed(
      "restore-counted-incomplete-evidence-rejected",
      "Counted restoration failed closed while scoring evidence was incomplete.",
    )
    await pool.query(
      "update match_sets set scoring = $2, counted_status = 'counted', review_status = 'resolved' where id = $1",
      [matchSetId, scoring.rows[0]!.scoring],
    )
    await expectCountedState("counted")

    await page.setViewportSize({ width: 390, height: 844 })
    const mobileReplay = await verifyReplayPage(
      page,
      publicMatchSet.replayHref!,
      sourceMarkers,
    )
    await page.setViewportSize({ width: 1440, height: 900 })
    const browserScenarios: NonNullable<
      ServiceProofArtifact["browserScenarios"]
    > = [
      {
        id: "live-result-replay-desktop",
        kind: "browser",
        status: "passed",
        outcome:
          "Desktop result and replay rendered counted public evidence with an in-frame nonblank board.",
      },
      {
        id: "live-result-replay-mobile",
        kind: "browser",
        status: "passed",
        outcome: `Mobile replay rendered an in-frame nonblank board with ${mobileReplay.value.canvasBytes} encoded canvas bytes.`,
      },
      {
        id: "deterministic-replay-events",
        kind: "browser",
        status: "passed",
        outcome:
          "Deterministic replay fixtures passed STONE, FALLEN, terrain, contraction, callout, and canonical-start checks.",
      },
    ]
    const chronicleHashes = result.matches
      .map((match) => match.chronicleHash)
      .filter((hash): hash is string => Boolean(hash))

    proof = {
      schemaVersion: "v1.36-competition-service-proof",
      status: "passed-local-services",
      generatedAt: new Date().toISOString(),
      topology: {
        postgres: "healthy",
        redisConfiguration: "present",
        goBackend: "healthy",
        runtimeService: "healthy",
        accountRevisionOwner: "go",
        publicReadOwner: "go",
      },
      accounts: {
        count: 4,
        distinct: true,
        providerReadyRevisionCount: 4,
        sourceHashes: accounts.map((account) => account.sourceHash).sort(),
      },
      season: {
        seasonId: season.seasonId,
        seasonHref: ladderA.payload.links.seasonHref,
        standingsHref: ladderA.payload.links.standingsHref,
        entryCount: 4,
        scheduleRunId: scheduled.scheduleRunId,
        matchSetId,
        scheduleIdempotent: true,
      },
      execution: {
        runOnceIterations: execution.value.iterations,
        durationMs: execution.durationMs,
        matchCount: result.matches.length,
        completeMatchCount: result.matches.filter(
          (match) => match.status === "complete",
        ).length,
        chronicleHashCount: new Set(chronicleHashes).size,
      },
      result: {
        resultHref: publicMatchSet.resultHref,
        status: "complete",
        countedState: "counted",
        replayHref: publicMatchSet.replayHref!,
        replayPageMs: replay.durationMs,
        replayCanvasBytes: replay.value.canvasBytes,
      },
      standings: {
        deterministicRepeatedRead: true,
        rowCount: 4,
        rows: ladderA.payload.standings.map((standing) => ({
          rank: standing.rank,
          strategyRevisionId: standing.strategyRevisionId,
          sourceHash: standing.sourceHash,
          points: standing.points,
          wins: standing.wins,
          draws: standing.draws,
          losses: standing.losses,
          countedMatchSetCount:
            standing.competitionEvidence?.countedMatchSetCount ?? 0,
          evidenceAvailability:
            standing.competitionEvidence?.evidenceAvailability ?? "unavailable",
          resultLinks: standing.competitionEvidence?.resultLinks ?? [],
          replayLinks: standing.competitionEvidence?.replayLinks ?? [],
        })),
      },
      privacy: {
        publicResultSafe: true,
        publicSeasonSafe: true,
        publicReplaySafe: true,
        proofArtifactSafe: true,
      },
      governanceScenarios,
      browserScenarios,
    }
  } finally {
    try {
      await cleanupProofRows(pool, seasonId, accounts)
    } finally {
      await pool.end()
    }
  }

  expect(proof).toBeTruthy()
  writeProofArtifacts({
    ...proof!,
    cleanup: {
      mutableCompetitionRowsRemoved: true,
      sessionsRevoked: true,
      adminCapabilityRemoved: true,
      appendOnlyLifecycleAuditRetained: true,
    },
  })
})

test("counted entry rejects stale, unsupported, unavailable, and replacement evidence through the live API", async ({
  page,
}) => {
  test.setTimeout(600_000)
  requiredEnvironment()

  const positiveProof = JSON.parse(
    readFileSync(proofJsonPath, "utf8"),
  ) as ServiceProofArtifact
  expect(positiveProof.status).toBe("passed-local-services")

  const pool = createDatabasePool({ connectionString: databaseUrl! })
  const suffix = `negative-${Date.now().toString(36)}${process.pid.toString(36)}`
  const accounts: ProofAccount[] = []
  let seasonId: string | undefined
  const scenarios: NonNullable<ServiceProofArtifact["negativeScenarios"]> = []

  const record = (id: string, category: string): void => {
    scenarios.push({
      id,
      kind: "negative",
      status: "passed",
      category,
      outcome:
        "The live counted-entry API rejected the revision without creating counted evidence.",
    })
  }

  try {
    const workshop = await page.request.get("/api/workshop")
    expect(workshop.status(), await workshop.text()).toBe(200)
    const { templateSource } = (await workshop.json()) as {
      templateSource: string
    }
    for (let index = 0; index < 10; index += 1) {
      accounts.push(
        await createProofAccount(page, {
          suffix,
          accountIndex: index,
          templateSource,
        }),
      )
    }
    await deleteProofMatchSets(
      pool,
      accounts.map((account) => account.lockMatchSetId),
    )
    const season = await createAndOpenSeason(page, pool, accounts[0]!, suffix)
    seasonId = season.seasonId

    const invalidRevisionIds = accounts
      .slice(0, 8)
      .map(
        (_account, index) =>
          `strategy-revision:v136-invalid:${suffix}:${index}`,
      )
    for (let index = 0; index < invalidRevisionIds.length; index += 1) {
      await pool.query(
        `insert into strategy_revisions (
           id, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation, metadata, compiled_artifact,
           locked_at, created_at
         )
         select $2, strategy_id, source, source_hash, source_bytes, runtime,
           engine_compatibility, validation, metadata, compiled_artifact,
           null, now()
         from strategy_revisions where id = $1`,
        [accounts[index]!.revisionId, invalidRevisionIds[index]],
      )
    }

    await pool.query(
      `update strategy_revisions
       set metadata = jsonb_set(metadata, '{providerValidation,sourceHash}', to_jsonb($2::text), true),
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[0], "0".repeat(64)],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[0]!,
      invalidRevisionIds[0]!,
      "provider_proof_stale",
    )
    record("stale-provider-proof", "provider_proof_stale")

    await pool.query(
      `update strategy_revisions
       set metadata = (metadata - 'providerValidation' - 'sourceArtifact'),
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[1]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[1]!,
      invalidRevisionIds[1]!,
      "provider_proof_missing",
    )
    record("missing-provider-proof", "provider_proof_missing")

    await pool.query(
      `update strategy_revisions
       set metadata = jsonb_set(metadata, '{providerValidation,proof}', to_jsonb($2::text), true),
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[2], "invalid-provider-proof"],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[2]!,
      invalidRevisionIds[2]!,
      "provider_proof_mismatched",
    )
    record("source-artifact-mismatch", "provider_proof_mismatched")

    await pool.query(
      `update strategy_revisions
       set runtime = jsonb_set(runtime, '{language,id}', '"javascript"'::jsonb, true),
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[3]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[3]!,
      invalidRevisionIds[3]!,
      "unsupported_source_format",
    )
    record("unsupported-provider-language", "unsupported_source_format")

    await pool.query(
      `update strategy_revisions
       set runtime = jsonb_set(runtime, '{language,id}', '"tinygo"'::jsonb, true),
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[4]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[4]!,
      invalidRevisionIds[4]!,
      "hidden_unsupported_provider",
    )
    record("hidden-tinygo", "hidden_unsupported_provider")

    await pool.query(
      `update strategy_revisions
       set engine_compatibility = '{"spec":"stale-spec","engine":"stale-engine"}'::jsonb,
           locked_at = now()
       where id = $1`,
      [invalidRevisionIds[5]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[5]!,
      invalidRevisionIds[5]!,
      "incompatible_runtime_metadata",
    )
    record("invalid-provenance", "incompatible_runtime_metadata")

    await pool.query(
      `update strategy_revisions
       set runtime = jsonb_set(
         jsonb_set(runtime, '{adapter,id}', '"runtime-js-container-subprocess"'::jsonb, true),
         '{adapter,version}', '"0.1.0"'::jsonb, true
       ), locked_at = now()
       where id = $1`,
      [invalidRevisionIds[6]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[6]!,
      invalidRevisionIds[6]!,
      "runtime_service_unavailable",
    )
    record("unavailable-runtime-lane", "runtime_service_unavailable")

    await pool.query(
      `update strategy_revisions
       set runtime = jsonb_set(
         jsonb_set(runtime, '{package,mode}', '"declared"'::jsonb, true),
         '{package,entrypoint}', '"default"'::jsonb, true
       ), locked_at = now()
       where id = $1`,
      [invalidRevisionIds[7]],
    )
    await expectEntryRejection(
      page,
      seasonId,
      accounts[7]!,
      invalidRevisionIds[7]!,
      "package_policy_violation",
    )
    record("package-policy-violation", "package_policy_violation")

    await enterSeason(page, seasonId, accounts[8]!)
    await expectEntryRejection(
      page,
      seasonId,
      accounts[8]!,
      accounts[8]!.helperRevisionId,
      "already_entered_season",
    )
    record("same-user-duplicate-entry", "already_entered_season")

    await enterSeason(page, seasonId, accounts[9]!)
    const withdraw = await page.request.delete(
      `/api/ladder/seasons/${encodeURIComponent(seasonId)}/entries`,
      { headers: { cookie: accounts[9]!.sessionCookie } },
    )
    expect(withdraw.status(), await withdraw.text()).toBe(200)
    await expectEntryRejection(
      page,
      seasonId,
      accounts[9]!,
      accounts[9]!.helperRevisionId,
      "replacement_blocked",
    )
    record("mid-season-replacement", "replacement_blocked")

    const entryCount = await pool.query<{ count: string }>(
      "select count(*)::text as count from trial_ladder_entries where season_id = $1",
      [seasonId],
    )
    expect(Number(entryCount.rows[0]?.count ?? 0)).toBe(2)
  } finally {
    try {
      await cleanupProofRows(pool, seasonId, accounts)
      if (accounts[0]) {
        await pool.query("delete from users where id = $1", [
          accounts[0].userId,
        ])
      }
    } finally {
      await pool.end()
    }
  }

  expect(scenarios).toHaveLength(10)
  writeProofArtifacts({ ...positiveProof, negativeScenarios: scenarios })
})
