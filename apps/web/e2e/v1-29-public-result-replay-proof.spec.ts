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

const replayUnavailableFixtures = [
  ["match:fixture:missing-chronicle", "missing-chronicle"],
  ["match:fixture:no-result", "no-result"],
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

test("v1.29 public result and replay trust proof stays app-side", async ({
  page,
}) => {
  for (const fixtureId of resultFixtures) {
    await page.goto(`/matchsets/match-set%3Afixture%3A${fixtureId}`)
    await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
    await expect(page.getByTestId("matchset-evidence-panel")).toContainText(
      "result state",
    )
    await expect(page.getByTestId("matchset-evidence-panel")).toContainText(
      "privacy",
    )
    await expectPublicSafeBody(page.locator("body"))
  }

  await page.goto("/matches/match%3Afixture%3Apublic-safe-replay/replay")
  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
  await expect(page.locator("canvas")).toHaveCount(1)
  await expectNonblankCanvasPixels(page.locator("canvas"))
  const replayTimeline = page.getByRole("slider", { name: "Replay timeline" })
  await expect(replayTimeline).toHaveValue("0")
  await page.getByRole("button", { name: "Play replay" }).click()
  await expect
    .poll(async () => Number(await replayTimeline.inputValue()))
    .toBeGreaterThan(0)
  await expectPublicSafeBody(page.locator("body"))

  for (const [matchId, reason] of replayUnavailableFixtures) {
    await page.goto(`/matches/${encodeURIComponent(matchId)}/replay`)
    await expect(
      page.getByRole("heading", { name: "Replay unavailable" }),
    ).toBeVisible()
    await expect(page.getByTestId("replay-unavailable-message")).toContainText(
      reason,
    )
    await expect(page.getByTestId("replay-unavailable-message")).toContainText(
      "privacy",
    )
    await expectPublicSafeBody(page.locator("body"))
  }
})
