import { expect, test, type Page } from "@playwright/test"

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "reporterUserId",
  "operatorNote",
  "privateDetail",
  "recoveryEvidence",
  "databaseUrl",
  "Bearer ",
] as const

const expectPublicSafeAndFramed = async (page: Page) => {
  const body = await page.locator("body").innerText()
  for (const marker of privateMarkers) expect(body).not.toContain(marker)
  const dimensions = await page.evaluate(() => ({
    scrollWidth: globalThis.document.documentElement.scrollWidth,
    viewportWidth: globalThis.document.documentElement.clientWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth + 1,
  )
}

test("v1.36 public competition trust surfaces stay calm and public-safe", async ({
  page,
}) => {
  for (const path of [
    "/competitions",
    "/competitions/fair-play",
    "/account/recovery",
    "/matchsets/match-set%3Afixture%3Acomplete",
  ]) {
    await page.goto(path)
    await expect(page.locator("main")).toBeVisible()
    await expectPublicSafeAndFramed(page)
  }

  await page.goto("/competitions/fair-play")
  await expect(
    page.getByRole("heading", { name: "Fair play and result reports" }),
  ).toBeVisible()
  await expect(page.locator("body")).toContainText(
    "Reports do not guarantee automatic action",
  )

  await page.goto("/account/recovery")
  await expect(page.locator("body")).toContainText(
    "not available in this public beta",
  )
  await expect(page.locator("form")).toHaveCount(0)
})

test("v1.36 replay board starts plausibly and remains in frame", async ({
  page,
}) => {
  await page.goto("/matches/match%3Afixture%3Apublic-safe-replay/replay")
  const canvas = page.getByLabel("Replay board canvas")
  await expect(canvas).toBeVisible()
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
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
  await expect(page.locator("body")).toContainText("STONE")
  await expectPublicSafeAndFramed(page)
})
