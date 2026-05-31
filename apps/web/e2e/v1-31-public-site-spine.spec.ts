import { expect, test, type Locator, type Page } from "@playwright/test"

const privateMarkers = [
  "Strategy source",
  "StrategyMemory",
  "strategyMemory",
  "SoldierMemory",
  "soldierMemory",
  "objective payloads",
  "objectivePayload",
  "rawDiagnostics",
  "host paths",
  "env values",
  "Bearer ",
  "DATABASE_URL",
  "privateRuntime",
  "operator action details",
  "operatorAction",
  "quarantine details",
  "recovery payloads",
  "recoveryPayload",
] as const

const expectPublicSafeBody = async (locator: Locator) => {
  const body = await locator.innerText()
  for (const marker of privateMarkers) {
    expect(body).not.toContain(marker)
  }
}

const expectSafePublicHrefs = async (page: Page) => {
  const hrefs = await page
    .locator("a")
    .evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter(Boolean),
    )
  for (const href of hrefs) {
    expect(href, `unsafe href ${href}`).not.toMatch(
      /^(?:javascript:|data:|https?:\/\/|\/\/)/i,
    )
    expect(href, `unsafe href ${href}`).not.toContain("\\")
  }
}

test("v1.31 anonymous public discovery spine links to evidence", async ({
  page,
}) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Coward's Game" }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "Watch" }).first()).toBeVisible()
  await expect(page.getByLabel("Coward's Game arena preview")).toBeVisible()
  await expectPublicSafeBody(page.locator("body"))
  await expectSafePublicHrefs(page)

  await page.goto("/watch")
  await expect(
    page.getByRole("heading", { name: "Public MatchSet evidence" }),
  ).toBeVisible()
  await expect(page.getByText("Replay-ready Chronicle evidence")).toBeVisible()
  await page.getByRole("link", { name: "Result" }).first().click()
  await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
  await expectPublicSafeBody(page.locator("body"))
  await expectSafePublicHrefs(page)
})

test("v1.31 competition discovery and entry spine are reachable", async ({
  page,
}) => {
  await page.goto("/competitions")
  await expect(
    page.getByRole("heading", {
      name: "Tournaments, ladders, and exhibitions",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Standard Exhibition" }).first(),
  ).toBeVisible()
  await page
    .locator('a[href="/competitions/exhibition%3Astandard-exhibition-v1"]')
    .first()
    .click()
  await expect(page.getByRole("heading", { name: /Exhibition/ })).toBeVisible()
  await expect(
    page.getByRole("heading", { name: "Replay coverage" }),
  ).toBeVisible()

  await page.goto("/competitions/exhibition%3Astandard-exhibition-v1/enter")
  await expect(
    page.getByRole("heading", { name: "Sign in required" }),
  ).toBeVisible()
  await expectPublicSafeBody(page.locator("body"))
  await expectSafePublicHrefs(page)
})

test("v1.31 learn, workshop, and account links form the public shell", async ({
  page,
}) => {
  await page.goto("/learn")
  await expect(
    page.getByRole("heading", { name: "Rules, terms, and trust" }),
  ).toBeVisible()
  await page.getByRole("link", { name: "Workshop" }).first().click()
  await expect(page.getByText("Strategy Workshop").first()).toBeVisible()
  await page.getByRole("link", { name: "Account" }).first().click()
  await expect(
    page.getByRole("heading", { name: /Sign in required|@/ }),
  ).toBeVisible()
  await expectPublicSafeBody(page.locator("body"))
  await expectSafePublicHrefs(page)
})
