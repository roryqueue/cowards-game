import { expect, test } from "@playwright/test"

test.skip(
  process.env.RUN_SERVICE_E2E !== "1",
  "Service-backed Workshop-to-replay smoke requires local Postgres/Redis; set RUN_SERVICE_E2E=1 when services are available.",
)

test("Workshop edit-to-replay path opens a completed Match replay", async ({
  page,
}) => {
  await page.goto("/")
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
  expect([200, 503]).toContain(workerResponse.status())

  await expect(
    page.getByText(/Test complete|Some Matches failed/),
  ).toBeVisible()
  await page.getByRole("link", { name: "Open replay" }).first().click()
  await expect(page).toHaveURL(/\/matches\/.*\/replay/)
  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(
    page.getByRole("slider", { name: "Replay timeline" }),
  ).toBeVisible()
  await expect(page.getByText("Inspector")).toBeVisible()
})
