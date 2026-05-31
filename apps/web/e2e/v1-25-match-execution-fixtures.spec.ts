import { expect, test, type Locator } from "@playwright/test"

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "host paths",
  "env values",
  "stackTrace",
  "package paths",
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "databaseUrl",
  "Bearer ",
] as const

const matchSetFixtureIds = [
  "complete",
  "running",
  "queued",
  "strategy-failure",
  "system-failure",
  "timeout",
  "unavailable-runtime",
  "malformed-runtime-result",
  "stale-artifact",
  "missing-chronicle",
  "no-result",
  "public-safe-replay",
] as const

const expectNonblankCanvasPixels = async (canvas: Locator) => {
  await expect(canvas).toBeVisible()
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
}

test("v1.25 Match execution fixture result and replay pages are public-safe", async ({
  page,
}) => {
  for (const fixtureId of matchSetFixtureIds) {
    await page.goto(`/matchsets/match-set%3Afixture%3A${fixtureId}`)
    await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
    const scenarioText = await page.locator("body").innerText()
    expect(scenarioText).not.toContain("Not found")
    for (const marker of privateMarkers) {
      expect(scenarioText).not.toContain(marker)
    }
  }

  await page.goto("/matchsets/match-set%3Afixture%3Aunavailable-runtime")

  await expect(
    page.getByRole("heading", { name: "Unavailable runtime fixture" }),
  ).toBeVisible()
  const matchSetEvidence = page.getByTestId("matchset-evidence-panel")
  await expect(matchSetEvidence).toBeVisible()
  await expect(matchSetEvidence).toContainText("unavailable")
  await expect(matchSetEvidence).toContainText("retryable")
  await expect(matchSetEvidence).toContainText("result: none")

  let body = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }

  await page.goto("/matchsets/match-set%3Afixture%3Apublic-safe-replay")
  await expect(
    page.getByRole("heading", { name: "Public safe replay fixture" }),
  ).toBeVisible()
  await page.getByRole("link", { name: "Replay" }).click()

  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
  await expectNonblankCanvasPixels(page.locator("canvas"))
  await expect(page.getByText("fixture-bottom-soldier-1").first()).toBeVisible()
  await expect(page.getByText("fixture-top-soldier-1").first()).toBeVisible()

  body = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }

  for (const [matchId, reason] of [
    ["match:fixture:missing-chronicle", "missing-chronicle"],
    ["match:fixture:no-result", "no-result"],
  ] as const) {
    await page.goto(`/matches/${encodeURIComponent(matchId)}/replay`)
    await expect(
      page.getByRole("heading", { name: "Replay unavailable" }),
    ).toBeVisible()
    await expect(page.getByTestId("replay-unavailable-message")).toContainText(
      reason,
    )
    body = await page.locator("body").innerText()
    for (const marker of privateMarkers) {
      expect(body).not.toContain(marker)
    }
  }
})
