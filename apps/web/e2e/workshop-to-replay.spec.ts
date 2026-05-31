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

test("Workshop failure sample opens owner debug replay without leaking public replay data", async ({
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

  const ownerReplayLink = page.getByRole("link", {
    name: "Open owner debug",
  })
  await expect(
    ownerReplayLink.first(),
    "[replay_projection] owner replay link was not exposed for the Workshop participant",
  ).toBeVisible()
  const ownerHref = await ownerReplayLink.first().getAttribute("href")
  expect(ownerHref).toContain("ownerDebug=1")
  expect(ownerHref).toContain("ownerPlayerId=player%3Aworkshop-local")

  await ownerReplayLink.first().click()
  await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
  const ownerToggle = page.getByTestId("replay-owner-debug-toggle")
  await expect(ownerToggle).toBeVisible()
  await expect(ownerToggle).not.toBeChecked()
  await expect(page.getByText("Why this Soldier did nothing")).toHaveCount(0)

  const explanation = page.getByTestId("replay-soldier-inactivity-explanation")
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
  for (
    let soldierIndex = 0;
    soldierIndex < ownerSoldierCount;
    soldierIndex += 1
  ) {
    await ownerSoldiers.nth(soldierIndex).click()
    for (
      let eventIndex = 0;
      eventIndex < runtimeViolationCount;
      eventIndex += 1
    ) {
      await runtimeViolationEvents.nth(eventIndex).click()
      await ownerToggle.check()
      if ((await explanation.count()) === 0) {
        continue
      }
      if (
        (await explanation.getAttribute("data-cause-code")) ===
        "THROWN_EXCEPTION"
      ) {
        break
      }
    }
    if (
      (await explanation.count()) > 0 &&
      (await explanation.getAttribute("data-cause-code")) === "THROWN_EXCEPTION"
    ) {
      break
    }
  }

  await expect(explanation).toBeVisible()
  await expect(explanation).toHaveAttribute(
    "data-cause-code",
    "THROWN_EXCEPTION",
  )
  await expect(
    explanation.getByText("Why this Soldier did nothing"),
  ).toBeVisible()
  await expect(explanation.getByText("Strategy threw")).toBeVisible()

  const publicReplayPath = page
    .url()
    .replace(/[?&]ownerDebug=1/g, "")
    .replace(/[?&]ownerPlayerId=[^&]+/g, "")
  await page.goto(publicReplayPath)
  await expect(page.locator(".replay-status-chip")).toHaveText("Public view")
  const publicBody = await page.locator("body").innerText()
  for (const marker of privateReplayMarkers) {
    expect(
      publicBody,
      `[public_privacy] public persisted replay leaked ${marker}`,
    ).not.toContain(marker)
  }
})
