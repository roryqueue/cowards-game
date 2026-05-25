import { expect, test, type Page } from "@playwright/test"

const goBackendUrl = process.env.COWARDS_GO_BACKEND_URL
const internalToken = process.env.COWARDS_GO_BACKEND_INTERNAL_TOKEN

const privateMarkers = [
  "StrategyMemory",
  "SoldierMemory",
  "objectivePayload",
  "strategySource",
  "rawRuntimeDetails",
  "privateRuntime",
  "runtimeInternals",
  "Traceback",
  "stderr",
  "site-packages",
  "DATABASE_URL",
  "Bearer ",
]

const pythonScreenSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"], "objective": {"role": "screen"}} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            if (cell["dx"] == 0 and (cell["dy"] == -1 or cell["dy"] == 1)) or (cell["dy"] == 0 and (cell["dx"] == -1 or cell["dx"] == 1)):
                return {"action": {"type": "TURN_TO_STONE"}, "soldierMemory": input["soldierMemory"]}
    return {"action": {"type": "TURN", "direction": input["self"]["facing"] or "UP"}, "soldierMemory": input["soldierMemory"]}
`

const pythonPressureSource = `
def select_activations(input):
    soldiers = [soldier for soldier in input["mySoldiers"] if soldier["status"] == "ACTIVE"]
    return {
        "activationOrders": [{"soldierId": soldier["id"], "objective": {"role": "pressure"}} for soldier in soldiers[: input["activationCount"]]],
        "strategyMemory": input["strategyMemory"],
    }


def soldier_brain(input):
    direction = input["self"]["facing"] or "UP"
    for cell in input["awarenessGrid"]["cells"]:
        if cell["contents"] == "ENEMY_ACTIVE":
            if cell["dy"] < 0:
                direction = "UP"
            elif cell["dy"] > 0:
                direction = "DOWN"
            elif cell["dx"] > 0:
                direction = "RIGHT"
            elif cell["dx"] < 0:
                direction = "LEFT"
            break
    if input["cycleIndex"] == 0:
        action = {"type": "TURN", "direction": direction}
    else:
        action = {"type": "MOVE", "direction": direction}
    return {"action": action, "soldierMemory": input["soldierMemory"]}
`

test.skip(
  process.env.RUN_V1_19_PROOF !== "1",
  "v1.19 signed-in proof requires live web, Go backend, runtime-service, Postgres, and RUN_V1_19_PROOF=1.",
)

const expectPublicSafe = async (page: Page): Promise<void> => {
  const bodyText = await page.locator("body").innerText()
  for (const marker of privateMarkers) {
    expect(bodyText).not.toContain(marker)
  }
}

const saveRevision = async (
  page: Page,
  input: {
    source: string
    sourceFormat: "typescript" | "python"
    label: string
    notes: string
  },
): Promise<string> => {
  const response = await page.request.post("/api/account/revisions/save", {
    data: input,
  })
  expect(response.status(), await response.text()).toBe(201)
  const body = (await response.json()) as { revision: { id: string } }
  return body.revision.id
}

const createExhibition = async (
  page: Page,
  revisionIds: string[],
): Promise<{ matchSetId: string; publicHref?: string | undefined }> => {
  const response = await page.request.post("/api/exhibitions", {
    data: {
      presetId: "smoke-exhibition-v1",
      revisionIds,
      counted: false,
    },
  })
  expect(response.status(), await response.text()).toBe(201)
  return (await response.json()) as {
    matchSetId: string
    publicHref?: string
  }
}

const runWorker = async (page: Page): Promise<void> => {
  for (let index = 0; index < 4; index += 1) {
    const run = await page.request.post(
      `${goBackendUrl}/internal/match-jobs/run-once`,
      {
        headers: { "X-Cowards-Internal-Token": internalToken ?? "" },
      },
    )
    expect(run.status(), await run.text()).toBeLessThan(500)
  }
}

const verifyResultAndReplay = async (
  page: Page,
  exhibition: { matchSetId: string; publicHref?: string | undefined },
): Promise<void> => {
  await page.goto(
    exhibition.publicHref ??
      `/matchsets/${encodeURIComponent(exhibition.matchSetId)}`,
  )
  await expect(
    page.getByRole("heading", { name: /Smoke exhibition/i }),
  ).toBeVisible()
  const matchSetEvidence = page.getByTestId("matchset-evidence-panel")
  await expect(matchSetEvidence).toBeVisible()
  await expect(
    matchSetEvidence.getByText(/non-counted exhibition beta/),
  ).toBeVisible()
  await expect(page.getByText(/execution-path proof is gated/i)).toBeVisible()
  await expectPublicSafe(page)

  const replayLink = page.getByRole("link", { name: "Replay" }).first()
  await expect(replayLink).toBeVisible()
  await replayLink.click()
  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
  await expect(
    page.getByRole("slider", { name: "Replay timeline" }),
  ).toBeVisible()
  await expect(
    page.getByRole("img", { name: /Replay board at sequence 0/i }),
  ).toBeVisible()
  await expectPublicSafe(page)
}

test("signed-in v1.19 Python exhibition beta exposes safe evidence", async ({
  page,
}) => {
  test.setTimeout(360_000)
  expect(goBackendUrl, "COWARDS_GO_BACKEND_URL is required").toBeTruthy()
  expect(
    internalToken,
    "COWARDS_GO_BACKEND_INTERNAL_TOKEN is required",
  ).toBeTruthy()

  const suffix = Date.now().toString(36)
  const signup = await page.request.post("/api/auth/sign-up", {
    data: {
      username: `v119_${suffix}`,
      handle: `v119-${suffix}`,
      displayName: "v1.19 Proof",
      password: `v119-proof-${suffix}`,
    },
  })
  expect(signup.status(), await signup.text()).toBe(201)

  const workshop = await page.request.get("/api/workshop")
  expect(workshop.status(), await workshop.text()).toBe(200)
  const workshopBody = (await workshop.json()) as { templateSource: string }

  const tsRevisionId = await saveRevision(page, {
    source: workshopBody.templateSource,
    sourceFormat: "typescript",
    label: "v1.19 JS/TS proof revision",
    notes: "Signed-in v1.19 JS/TS regression proof.",
  })
  const pythonScreenId = await saveRevision(page, {
    source: pythonScreenSource,
    sourceFormat: "python",
    label: "v1.19 Python screen beta revision",
    notes: "Signed-in v1.19 non-counted exhibition beta proof.",
  })
  const pythonPressureId = await saveRevision(page, {
    source: pythonPressureSource,
    sourceFormat: "python",
    label: "v1.19 Python pressure beta revision",
    notes: "Signed-in v1.19 non-counted exhibition beta proof.",
  })

  await page.goto("/account")
  await expect(
    page.getByText("Python · non-counted exhibition beta"),
  ).toHaveCount(2)

  const mixedExhibition = await createExhibition(page, [
    tsRevisionId,
    pythonScreenId,
  ])
  const pythonOnlyExhibition = await createExhibition(page, [
    pythonScreenId,
    pythonPressureId,
  ])

  await runWorker(page)
  await verifyResultAndReplay(page, mixedExhibition)
  await verifyResultAndReplay(page, pythonOnlyExhibition)
})
