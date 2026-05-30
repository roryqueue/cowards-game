import { expect, test } from "@playwright/test"

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawRuntimeDetails",
  "privateRuntime",
  "Traceback",
  "stderr",
  "site-packages",
  "DATABASE_URL",
  "Bearer ",
]

const pythonSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"]} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }

def soldier_brain(input):
    return {
        "action": {"type": "TURN_TO_STONE"},
        "soldierMemory": input["soldierMemory"],
    }
`

test.skip(
  process.env.RUN_V1_18_PROOF !== "1",
  "v1.18 signed-in proof requires live web, Go backend, runtime-service, Postgres, and RUN_V1_18_PROOF=1.",
)

test("signed-in Python exhibition beta produces replay-safe evidence", async ({
  page,
}) => {
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const suffix = Date.now().toString(36)
  const signup = await page.request.post("/api/auth/sign-up", {
    data: {
      username: `v118_${suffix}`,
      handle: `v118-${suffix}`,
      displayName: "v1.18 Proof",
      password: `v118-proof-${suffix}`,
    },
  })
  expect(signup.status(), await signup.text()).toBe(201)

  const workshop = await page.request.get("/api/workshop")
  expect(workshop.status(), await workshop.text()).toBe(200)
  const workshopBody = (await workshop.json()) as { templateSource: string }

  const tsRevision = await page.request.post("/api/account/revisions/save", {
    data: {
      source: workshopBody.templateSource,
      sourceFormat: "typescript",
      label: "v1.18 JS/TS proof revision",
      notes: "Signed-in v1.18 exhibition proof.",
    },
  })
  expect(tsRevision.status(), await tsRevision.text()).toBe(201)

  const pyRevision = await page.request.post("/api/account/revisions/save", {
    data: {
      source: pythonSource,
      sourceFormat: "python",
      label: "v1.18 Python exhibition beta revision",
      notes: "Signed-in v1.18 non-counted exhibition beta proof.",
    },
  })
  expect(pyRevision.status(), await pyRevision.text()).toBe(201)

  await page.goto("/account")
  await expect(page.getByText("non-counted exhibition beta")).toBeVisible()

  const revisionList = await page.request.get("/api/account/revisions")
  expect(revisionList.status(), await revisionList.text()).toBe(200)
  const revisionsBody = (await revisionList.json()) as {
    revisions: { id: string; runtimeSemantics: { languageId: string } }[]
  }
  const selectedRevisionIds = [
    revisionsBody.revisions.find(
      (revision) => revision.runtimeSemantics.languageId !== "python",
    )?.id,
    revisionsBody.revisions.find(
      (revision) => revision.runtimeSemantics.languageId === "python",
    )?.id,
  ]
  expect(selectedRevisionIds.every(Boolean)).toBe(true)

  const exhibition = await page.request.post("/api/exhibitions", {
    data: {
      presetId: "smoke-exhibition-v1",
      revisionIds: selectedRevisionIds,
      counted: false,
    },
  })
  expect(exhibition.status(), await exhibition.text()).toBe(201)
  const exhibitionBody = (await exhibition.json()) as {
    matchSetId: string
    publicHref?: string
  }

  for (let index = 0; index < 4; index += 1) {
    const run = await page.request.post(
      `${goBackendUrl}/internal/match-jobs/run-once`,
      {
        headers: { "X-Cowards-Internal-Token": internalToken ?? "" },
      },
    )
    expect(run.status(), await run.text()).toBeLessThan(500)
  }

  await page.goto(
    exhibitionBody.publicHref ??
      `/matchsets/${encodeURIComponent(exhibitionBody.matchSetId)}`,
  )
  await expect(
    page.getByRole("heading", { name: /Smoke exhibition/i }),
  ).toBeVisible()
  await expect(page.getByText("non_counted").first()).toBeVisible()
  const replayLink = page.getByRole("link", { name: "Replay" }).first()
  await expect(replayLink).toBeVisible()
  await replayLink.click()

  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(
    page.getByRole("slider", { name: "Replay timeline" }),
  ).toBeVisible()
  await expect(
    page.getByRole("img", { name: /Replay board at sequence 0/i }),
  ).toBeVisible()
  const bodyText = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(bodyText).not.toContain(marker)
  }
})
