import { expect, test, type Locator } from "@playwright/test"

const privateMarkers = [
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

test("replay fixture renders board, timeline, inspector, callouts, and public privacy", async ({
  page,
}) => {
  test.setTimeout(60_000)
  const fixture = (await (
    await page.request.get("/api/test-support/replay-fixture")
  ).json()) as { matchId: string; replayHref: string }

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
  await page
    .getByRole("button", { name: /Turn/ })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText(/Sequence 4/).first()).toBeVisible()
  await expect(page.getByText("Selected event")).toBeVisible()

  await page
    .getByRole("button", { name: /Soldier player:bottom:1/ })
    .evaluate((node) => (node as HTMLButtonElement).click())
  await expect(page.getByText("Owner").first()).toBeVisible()
  await expect(page.getByText("player:bottom").first()).toBeVisible()
  await expect(page.getByText("Facing").first()).toBeVisible()
  await expect(page.getByText("RIGHT").first()).toBeVisible()

  for (const label of [
    "Move",
    "Turn",
    "Push",
    "Fall",
    "Stone",
    "Blocked",
    "Contraction",
    "Runtime violation",
    "Outcome",
  ]) {
    await expect(page.getByText(label).first()).toBeVisible()
  }

  const body = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }
})

test("owner debug replay fixture exposes Awareness Grid only through gated owner mode", async ({
  page,
}) => {
  const fixture = (await (
    await page.request.get("/api/test-support/replay-fixture")
  ).json()) as { matchId: string; replayHref: string }

  await page.goto(fixture.replayHref)
  await expect(page.getByText("Public view")).toBeVisible()
  await expect(page.getByText("Owner debug")).toHaveCount(0)
  await expect(page.getByText("Awareness Grid")).toHaveCount(0)

  await page.goto(
    `${fixture.replayHref}?ownerDebug=1&ownerPlayerId=player%3Abottom`,
  )
  await expect(page.locator(".replay-status-chip")).toHaveText("Owner debug")
  await page.getByRole("button", { name: "Awareness" }).click()
  const awarenessGrid = page.getByLabel("Awareness Grid")
  await expect(awarenessGrid).toBeVisible()
  await expect(awarenessGrid.getByText("FRIENDLY_ACTIVE")).toBeVisible()
})
