import { expect, test, type Locator, type Page } from "@playwright/test"

type FixtureScenario = {
  id: string
  replayHref: string
}

type FixtureCatalogResponse = {
  replayHref: string
  scenarios: FixtureScenario[]
}

const resultFixtures = [
  "complete",
  "queued",
  "running",
  "strategy-failure",
  "system-failure",
  "timeout",
  "unavailable-runtime",
  "malformed-runtime-result",
  "stale-artifact",
  "missing-chronicle",
  "no-result",
] as const

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawDiagnostics",
  "ownerPrivate",
  "awarenessGrid",
  "databaseUrl",
  "Bearer ",
] as const

const expectPublicSafeBody = async (locator: Locator) => {
  const body = await locator.innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }
}

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
    throw new Error(`missing replay fixture scenario ${scenarioId}`)
  }
  return scenario.replayHref
}

test("v1.30 result pages render public-safe Match intelligence states", async ({
  page,
}) => {
  for (const fixtureId of resultFixtures) {
    await page.goto(`/matchsets/match-set%3Afixture%3A${fixtureId}`)
    const panel = page.getByTestId("match-intelligence-panel")

    await expect(panel).toBeVisible()
    await expect(panel).toContainText("Match Intelligence")
    await expect(panel).toContainText(/evidence|confidence/i)
    await expectPublicSafeBody(page.locator("body"))
  }
})

test("v1.30 replay workbench renders annotations, tactical panels, and realistic board proof", async ({
  page,
}) => {
  const catalog = await loadFixtureCatalog(page)
  await page.goto(scenarioHref(catalog, "compound-tour"))

  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByTestId("replay-intelligence-panel")).toBeVisible()
  const tacticalPanels = page.getByTestId("replay-tactical-panels")
  await expect(tacticalPanels).toBeVisible()
  await expect(page.getByText("Timeline Intelligence")).toBeVisible()
  await expect(tacticalPanels.getByText("Board Control")).toBeVisible()
  await expect(tacticalPanels.getByText("Action Mix")).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
  await expectNonblankCanvasPixels(page.locator("canvas"))

  await page.getByRole("button", { name: "status" }).click()
  await expect(
    page.getByText(/Soldier became (STONE|FALLEN)/).first(),
  ).toBeVisible()
  await page.getByRole("link", { name: "Open focus" }).first().click()
  await expect(page.getByTestId("replay-focus-banner")).toBeVisible()
  await expectPublicSafeBody(page.locator("body"))
})

test("v1.30 replay intelligence distinguishes unavailable public states", async ({
  page,
}) => {
  await page.goto("/matches/match%3Afixture%3Amissing-chronicle/replay")
  await expect(
    page.getByRole("heading", { name: "Replay unavailable" }),
  ).toBeVisible()
  await expect(page.getByTestId("replay-unavailable-message")).toContainText(
    "missing-chronicle",
  )
  await expect(page.getByTestId("replay-intelligence-panel")).toHaveCount(0)
  await expectPublicSafeBody(page.locator("body"))
})
