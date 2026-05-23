import { expect, test, type Locator, type Page } from "@playwright/test"

type FixtureScenario = {
  id: string
  replayHref: string
}

type FixtureCatalogResponse = {
  matchId: string
  replayHref: string
  scenarioId: string
  scenarios: FixtureScenario[]
}

const privateMarkers = [
  "ownerDebug",
  "soldierInactivity",
  "soldierInactivityExplanations",
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "awarenessGrid",
  "strategySource",
  "rawRuntimeDetails",
]

const expectNonblankCanvasPixels = async (canvas: Locator) => {
  await expect(canvas).toBeVisible()
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
}

const loadFixtureCatalog = async (
  page: Page,
): Promise<FixtureCatalogResponse> => {
  const response = await page.request.get("/api/test-support/replay-fixture")
  expect(response.ok()).toBe(true)
  return (await response.json()) as FixtureCatalogResponse
}

const scenarioHref = (
  catalog: FixtureCatalogResponse,
  scenarioId: string,
): string => {
  const scenario = catalog.scenarios.find(
    (candidate) => candidate.id === scenarioId,
  )
  if (!scenario) {
    throw new Error(
      `[ui rendering] missing replay fixture scenario ${scenarioId}`,
    )
  }
  return scenario.replayHref
}

const selectFirstTimelineEvent = async (
  page: Page,
  eventType: string,
): Promise<number> => {
  const button = page
    .getByRole("button", {
      name: new RegExp(`^Timeline event \\d+: ${eventType}$`),
    })
    .first()
  await expect(button).toBeVisible()
  const label = await button.getAttribute("aria-label")
  const match = label?.match(/^Timeline event (\d+): /)
  if (!match) {
    throw new Error(`[ui rendering] unable to parse timeline label ${label}`)
  }
  await button.click()
  return Number.parseInt(match[1]!, 10)
}

test("replay fixture renders board, timeline, inspector, callouts, and public privacy", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const fixture = await loadFixtureCatalog(page)

  expect(fixture.scenarioId).toBe("compound-tour")
  expect(fixture.scenarios.map((scenario) => scenario.id)).toEqual(
    expect.arrayContaining([
      "push",
      "fall",
      "contraction",
      "legal-backstab",
      "runtime-failure",
      "endgame",
      "compound-tour",
    ]),
  )

  await page.goto(fixture.replayHref)

  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByText("Public view")).toBeVisible()
  await expect(page.getByText("Match start").first()).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
  await expectNonblankCanvasPixels(page.locator("canvas"))

  await page
    .getByRole("button", { name: "Step forward" })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText(/Round 1/).first()).toBeVisible()
  await page
    .getByRole("button", { name: "Step back" })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText("Match start").first()).toBeVisible()

  await page
    .getByRole("slider", { name: "Replay timeline" })
    .evaluate((node) => {
      const input = node as HTMLInputElement
      input.value = "3"
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
  const actionSequence = await selectFirstTimelineEvent(page, "ACTION_EMITTED")
  await expect(
    page.getByText(new RegExp(`Sequence ${actionSequence}`)).first(),
  ).toBeVisible()
  await expect(page.getByText("Selected event")).toBeVisible()

  await page
    .getByRole("button", { name: /Soldier bottom:bottom-soldier-1/ })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText("Owner").first()).toBeVisible()
  await expect(page.getByText("bottom").first()).toBeVisible()
  await expect(page.getByText("Facing").first()).toBeVisible()
  await expect(page.getByText("UP").first()).toBeVisible()

  for (const label of ["Move", "Turn", "Stone", "Contraction", "Outcome"]) {
    await expect(page.getByText(label).first()).toBeVisible()
  }

  await page.goto(scenarioHref(fixture, "runtime-failure"))
  await page
    .getByRole("button", { name: /Timeline event \d+: RUNTIME_VIOLATION/ })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText("Runtime violation").first()).toBeVisible()

  const body = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }
  expect(body).not.toContain("Owner debug")
  expect(body).not.toContain("Why this Soldier did nothing")
  expect(body).not.toContain("Strategy timed out")
  expect(body).not.toContain("Reduce per-call work")
  expect(body).not.toContain("TIMEOUT")
})

test("owner debug replay fixture exposes Awareness Grid only through gated owner mode", async ({
  page,
}) => {
  const fixture = await loadFixtureCatalog(page)
  const replayHref = scenarioHref(fixture, "push")

  await page.goto(replayHref)
  await expect(page.getByText("Public view")).toBeVisible()
  await expect(page.getByText("Owner debug")).toHaveCount(0)
  await expect(page.getByText("Awareness Grid")).toHaveCount(0)

  await page.goto(`${replayHref}?ownerDebug=1&ownerPlayerId=bottom`)
  await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
  const ownerToggle = page.getByTestId("replay-owner-debug-toggle")
  await expect(ownerToggle).toBeVisible()
  await expect(ownerToggle).not.toBeChecked()
  await ownerToggle.check()
  const awarenessGrid = page.getByLabel("Awareness Grid")
  const awarenessEvents = page.getByRole("button", {
    name: /^Timeline event \d+: AWARENESS_GRID_OBSERVED$/,
  })
  const awarenessEventCount = await awarenessEvents.count()
  expect(awarenessEventCount).toBeGreaterThan(0)

  for (let index = 0; index < awarenessEventCount; index += 1) {
    await awarenessEvents.nth(index).click()
    if (await awarenessGrid.isVisible()) {
      break
    }
  }

  await expect(awarenessGrid).toBeVisible()
  await expect(
    awarenessGrid.getByText(/FRIENDLY|EMPTY|ENEMY/).first(),
  ).toBeVisible()
})

test("owner debug replay fixture shows Soldier inactivity explanations only after explicit owner opt-in", async ({
  page,
}) => {
  const fixture = await loadFixtureCatalog(page)
  const replayHref = scenarioHref(fixture, "runtime-failure")

  await page.goto(`${replayHref}?ownerDebug=1`)
  await expect(page.getByText("Public view")).toBeVisible()
  await expect(page.getByText("Owner debug")).toHaveCount(0)
  await expect(page.getByText("Why this Soldier did nothing")).toHaveCount(0)

  await page.goto(`${replayHref}?ownerDebug=1&ownerPlayerId=bottom`)
  await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
  const ownerToggle = page.getByTestId("replay-owner-debug-toggle")
  await expect(ownerToggle).toBeVisible()
  await expect(ownerToggle).not.toBeChecked()
  await expect(page.getByText("Why this Soldier did nothing")).toHaveCount(0)

  await page
    .getByRole("button", { name: /Timeline event \d+: RUNTIME_VIOLATION/ })
    .click()
  await ownerToggle.check()

  const explanation = page.getByTestId("replay-soldier-inactivity-explanation")
  await expect(explanation).toBeVisible()
  await expect(explanation).toHaveAttribute("data-cause-code", "TIMEOUT")
  await expect(
    explanation.getByText("Why this Soldier did nothing"),
  ).toBeVisible()
  await expect(explanation.getByText("Strategy timed out")).toBeVisible()
  await expect(explanation.getByText("Reduce per-call work")).toBeVisible()
})
