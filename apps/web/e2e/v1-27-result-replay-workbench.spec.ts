import { expect, test, type Locator, type Page } from "@playwright/test"

const privateMarkers = [
  "Strategy source",
  "StrategyMemory",
  "SoldierMemory",
  "objective payloads",
  "raw diagnostics",
  "host paths",
  "env values",
  "environment values",
  "tokens",
  "DB details",
  "package paths",
  "private runtime internals",
  "stackTrace",
  "strategyMemory",
  "soldierMemory",
  "objectivePayload",
  "rawDiagnostics",
  "privateRuntime",
  "databaseUrl",
  "Bearer ",
] as const

const fixtureIds = [
  "complete",
  "running",
  "queued",
  "strategy-failure",
  "system-failure",
  "timeout",
  "unavailable-runtime",
  "malformed-runtime-result",
  "stale-artifact",
  "public-safe-replay",
] as const

const resultHref = (fixtureId: string): string =>
  `/matchsets/${encodeURIComponent(`match-set:fixture:${fixtureId}`)}`

const scanPublicOutput = async (page: Page) => {
  const body = await page.locator("body").innerText()
  const html = await page
    .locator("html")
    .evaluate((node) => (node as HTMLElement).outerHTML)
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
    expect(html).not.toContain(marker)
  }
}

const expectNonblankCanvas = async (canvas: Locator) => {
  await expect(canvas).toBeVisible()
  const dataUrl = await canvas.evaluate((node) =>
    (node as HTMLCanvasElement).toDataURL(),
  )
  expect(dataUrl.length).toBeGreaterThan(500)
}

const expectInside = async (container: Locator, point: Locator) => {
  await expect(point).toBeAttached()
  const [containerBox, pointBox] = await Promise.all([
    container.boundingBox(),
    point.boundingBox(),
  ])
  expect(containerBox).not.toBeNull()
  expect(pointBox).not.toBeNull()
  expect(pointBox!.x).toBeGreaterThanOrEqual(containerBox!.x)
  expect(pointBox!.y).toBeGreaterThanOrEqual(containerBox!.y)
  expect(pointBox!.x + pointBox!.width).toBeLessThanOrEqual(
    containerBox!.x + containerBox!.width,
  )
  expect(pointBox!.y + pointBox!.height).toBeLessThanOrEqual(
    containerBox!.y + containerBox!.height,
  )
}

test.describe("v1.27 result and replay workbench fixtures", () => {
  test("fixture catalog is gated, useful, and links every result fixture", async ({
    page,
  }) => {
    await page.goto("/test-support/match-execution-fixtures")

    await expect(
      page.getByRole("heading", { name: "Match Execution Fixtures" }),
    ).toBeVisible()
    await expect(
      page.getByText("No live execution service required"),
    ).toBeVisible()

    for (const fixtureId of fixtureIds) {
      await expect(page.getByTestId(`fixture-card-${fixtureId}`)).toBeVisible()
      await expect(
        page.locator(`a[href="${resultHref(fixtureId)}"]`),
      ).toHaveCount(1)
    }

    await page.screenshot({
      fullPage: true,
      path: test.info().outputPath("fixture-catalog.png"),
    })
    await scanPublicOutput(page)
  })

  for (const fixtureId of fixtureIds) {
    test(`result fixture ${fixtureId} renders public workbench evidence`, async ({
      page,
    }) => {
      await page.goto(resultHref(fixtureId))

      await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "Lifecycle" }),
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "Availability" }),
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "Runtime Eligibility" }),
      ).toBeVisible()
      await expect(
        page.getByRole("heading", { name: "Proof and Privacy" }),
      ).toBeVisible()

      const body = await page.locator("body").innerText()
      expect(body).not.toContain("Not found")
      if (fixtureId === "unavailable-runtime") {
        expect(body).toContain("Runtime unavailable")
        expect(body).toContain("Retryable")
        expect(body).toContain("Result none")
      }
      if (fixtureId === "public-safe-replay") {
        await expect(page.getByRole("link", { name: "Replay" })).toBeVisible()
      }

      await page.screenshot({
        fullPage: true,
        path: test.info().outputPath(`result-${fixtureId}.png`),
      })
      await scanPublicOutput(page)
    })
  }

  test("public-safe replay fixture is nonblank, in bounds, and public-safe", async ({
    page,
  }) => {
    await page.goto(resultHref("public-safe-replay"))
    await page.getByRole("link", { name: "Replay" }).click()

    await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
    await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
    await expect(page.locator("canvas")).toHaveCount(1)
    await expectNonblankCanvas(page.locator("canvas"))
    await expect(
      page.getByText("fixture-bottom-soldier-1").first(),
    ).toBeVisible()
    await expect(page.getByText("fixture-top-soldier-1").first()).toBeVisible()
    await expect(page.getByTestId("replay-owner-debug-toggle")).toHaveCount(0)

    const board = page.locator(".replay-board-host")
    const canvasBox = await page.locator("canvas").boundingBox()
    expect(canvasBox?.width ?? 0).toBeGreaterThan(240)
    expect(canvasBox?.height ?? 0).toBeGreaterThan(240)
    await expectInside(
      board,
      page.locator(
        '[data-testid^="replay-board-proof-soldier-"][data-testid$="fixture-bottom-soldier-1"]',
      ),
    )
    await expectInside(
      board,
      page.locator(
        '[data-testid^="replay-board-proof-soldier-"][data-testid$="fixture-top-soldier-1"]',
      ),
    )
    await expectInside(
      board,
      page.getByTestId("replay-board-proof-terrain-2-2"),
    )

    await page.screenshot({
      fullPage: true,
      path: test.info().outputPath("public-safe-replay.png"),
    })
    await scanPublicOutput(page)
  })
})
