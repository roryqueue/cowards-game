import { expect, test } from "@playwright/test"

const privateReplayMarkers = [
  "Owner debug",
  "Why this Soldier did nothing",
  "ownerDebug",
  "soldierInactivity",
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "Awareness Grid",
  "strategySource",
  "rawRuntimeDetails",
]

test.skip(
  process.env.RUN_SERVICE_E2E !== "1",
  "Service-backed Workshop-to-replay smoke requires local Postgres/Redis; set RUN_SERVICE_E2E=1 when services are available.",
)

test("Workshop edit-to-replay path opens a completed Match replay", async ({
  page,
}) => {
  await page.goto("/workshop")
  await expect(
    page.getByRole("heading", { name: "Strategy Workshop" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Validate source" }).click()
  await expect(page.getByText("Valid draft").first()).toBeVisible()

  await page.getByRole("button", { name: "Submit revision" }).click()
  await expect(page.getByText("Revision submitted")).toBeVisible()

  await page.getByRole("button", { name: "Launch test" }).click()
  const workerResponse = await page.request.post(
    "/api/test-support/run-worker-once",
  )
  const workerPayload = await workerResponse.json()
  expect(
    workerResponse.status(),
    `[worker_execution] ${JSON.stringify(workerPayload)}`,
  ).toBe(200)
  expect(
    workerPayload,
    "[worker_execution] worker did not complete queued Match",
  ).toMatchObject({
    status: "ok",
  })

  await expect(
    page.getByText(/Test complete|Some Matches failed/),
    "[chronicle_validation] Match did not reach a replayable terminal state",
  ).toBeVisible()
  await page.getByRole("link", { name: "Open replay" }).first().click()
  await expect(page, "[replay_projection] Replay route did not open").toHaveURL(
    /\/matches\/.*\/replay/,
  )
  await expect(
    page.getByRole("heading", { name: "Replay" }),
    "[ui_rendering] Replay heading did not render",
  ).toBeVisible()
  await expect(
    page.getByRole("slider", { name: "Replay timeline" }),
    "[ui_rendering] Replay timeline did not render",
  ).toBeVisible()
  await expect(
    page.getByText("Inspector"),
    "[ui_rendering] Replay inspector did not render",
  ).toBeVisible()
})

test("Workshop failure sample keeps local replay public-only", async ({
  page,
}) => {
  test.setTimeout(90_000)

  await page.goto("/workshop")
  await expect(
    page.getByRole("heading", { name: "Strategy Workshop" }),
  ).toBeVisible()

  await page
    .locator('[data-sample-id="sample:failure-thrown-exception"]')
    .click()
  await expect(page.getByText("Valid draft").first()).toBeVisible()

  await page.getByRole("button", { name: "Submit revision" }).click()
  await expect(page.getByText("Revision submitted")).toBeVisible()

  await page.getByRole("button", { name: "Launch test" }).click()
  const workerResponse = await page.request.post(
    "/api/test-support/run-worker-once",
  )
  const workerPayload = await workerResponse.json()
  expect(
    workerResponse.status(),
    `[worker_execution] ${JSON.stringify(workerPayload)}`,
  ).toBe(200)
  expect(
    workerPayload,
    "[worker_execution] worker did not complete queued failure-mode Match",
  ).toMatchObject({ status: "ok" })

  await expect(
    page.getByText(/Test complete|Some Matches failed/),
    "[chronicle_validation] failure-mode Match did not reach a replayable terminal state",
  ).toBeVisible()

  const ownerReplayLink = page.getByRole("link", { name: "Open owner debug" })
  await expect(
    ownerReplayLink,
    "[replay_projection] local Workshop identity must not expose owner-debug replay links",
  ).toHaveCount(0)

  await page.getByRole("link", { name: "Open replay" }).first().click()
  await expect(page.locator(".replay-status-chip")).toHaveText("Public view")
  const runtimeViolationEvents = page.getByRole("button", {
    name: /Timeline event \d+: RUNTIME_VIOLATION/,
  })
  const ownerSoldiers = page.getByRole("button", {
    name: /Soldier player:workshop-local:/,
  })
  const runtimeViolationCount = await runtimeViolationEvents.count()
  const ownerSoldierCount = await ownerSoldiers.count()
  expect(runtimeViolationCount).toBeGreaterThan(0)
  expect(ownerSoldierCount).toBeGreaterThan(0)

  const publicBody = await page.locator("body").innerText()
  for (const marker of privateReplayMarkers) {
    expect(
      publicBody,
      `[public_privacy] public persisted replay leaked ${marker}`,
    ).not.toContain(marker)
  }
})
