import { Buffer } from "node:buffer"
import { inflateSync } from "node:zlib"
import { expect, test, type Locator, type Page } from "@playwright/test"

type FixtureScenario = {
  id: string
  replayHref: string
}

type FixtureCatalogResponse = {
  scenarios: FixtureScenario[]
}

const screenshotOptions = {
  animations: "disabled" as const,
  maxDiffPixelRatio: 0.06,
}

const pngSignature = "89504e470d0a1a0a"

const paeth = (left: number, up: number, upLeft: number): number => {
  const prediction = left + up - upLeft
  const leftDistance = Math.abs(prediction - left)
  const upDistance = Math.abs(prediction - up)
  const upLeftDistance = Math.abs(prediction - upLeft)
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) {
    return left
  }
  return upDistance <= upLeftDistance ? up : upLeft
}

const countNonblankPngPixels = (png: Buffer): number => {
  if (png.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("[ui rendering] Replay board screenshot is not a PNG")
  }

  let offset = 8
  let width = 0
  let height = 0
  let bytesPerPixel = 0
  const idatChunks: Buffer[] = []

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.subarray(offset + 4, offset + 8).toString("ascii")
    const data = png.subarray(offset + 8, offset + 8 + length)
    offset += 12 + length

    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      const bitDepth = data[8]
      const colorType = data[9]
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(
          `[ui rendering] Unsupported replay board PNG format bitDepth=${bitDepth} colorType=${colorType}`,
        )
      }
      bytesPerPixel = colorType === 6 ? 4 : 3
    } else if (type === "IDAT") {
      idatChunks.push(data)
    } else if (type === "IEND") {
      break
    }
  }

  if (width <= 0 || height <= 0 || bytesPerPixel <= 0) {
    throw new Error(
      "[ui rendering] Replay board screenshot is missing IHDR data",
    )
  }

  const inflated = inflateSync(Buffer.concat(idatChunks))
  const rowBytes = width * bytesPerPixel
  const previous = Buffer.alloc(rowBytes)
  const current = Buffer.alloc(rowBytes)
  let sourceOffset = 0
  let nonblankPixels = 0

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset]
    sourceOffset += 1
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[sourceOffset + x] ?? 0
      const left = x >= bytesPerPixel ? (current[x - bytesPerPixel] ?? 0) : 0
      const up = previous[x] ?? 0
      const upLeft = x >= bytesPerPixel ? (previous[x - bytesPerPixel] ?? 0) : 0
      current[x] =
        (raw +
          (filter === 0
            ? 0
            : filter === 1
              ? left
              : filter === 2
                ? up
                : filter === 3
                  ? Math.floor((left + up) / 2)
                  : paeth(left, up, upLeft))) &
        0xff
    }
    sourceOffset += rowBytes

    for (let x = 0; x < rowBytes; x += bytesPerPixel) {
      const red = current[x] ?? 0
      const green = current[x + 1] ?? 0
      const blue = current[x + 2] ?? 0
      const alpha = bytesPerPixel === 4 ? (current[x + 3] ?? 0) : 255
      if (alpha > 0 && (red < 250 || green < 250 || blue < 250)) {
        nonblankPixels += 1
      }
    }

    current.copy(previous)
  }

  return nonblankPixels
}

const calloutScenarios = [
  {
    scenarioId: "push",
    eventType: "PUSH_RESOLVED",
    screenshotName: "replay-board-push-callout.png",
  },
  {
    scenarioId: "legal-backstab",
    eventType: "BACKSTAB_RESOLVED",
    screenshotName: "replay-board-legal-backstab-callout.png",
  },
  {
    scenarioId: "runtime-failure",
    eventType: "RUNTIME_VIOLATION",
    screenshotName: "replay-board-runtime-failure-callout.png",
  },
  {
    scenarioId: "endgame",
    eventType: "MATCH_ENDED",
    screenshotName: "replay-board-endgame-callout.png",
  },
] as const

const loadFixtureCatalog = async (
  page: Page,
): Promise<FixtureCatalogResponse> => {
  const response = await page.request.get("/api/test-support/replay-fixture")
  if (!response.ok()) {
    throw new Error(
      `[ui rendering] replay fixture catalog request failed with ${response.status()}`,
    )
  }
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
    throw new Error(
      `[ui rendering] missing replay fixture scenario ${scenarioId}`,
    )
  }
  return scenario.replayHref
}

const expectNonblankCanvasPixels = async (page: Page): Promise<void> => {
  const canvas = page.getByLabel("Replay board canvas")
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toBeVisible()
  const screenshot = await canvas.screenshot({ animations: "disabled" })
  const nonblankPixels = countNonblankPngPixels(screenshot)

  if (nonblankPixels <= 0) {
    throw new Error(
      "[ui rendering] Replay board canvas screenshot has no nonblank pixels",
    )
  }
}

const parseSequence = (label: string | null, eventType: string): number => {
  const match = label?.match(/^Timeline event (\d+): (.+)$/)
  if (!match || match[2] !== eventType) {
    throw new Error(
      `[ui rendering] timeline event label did not match ${eventType}: ${label ?? "missing"}`,
    )
  }
  return Number(match[1])
}

const openScenario = async (page: Page, scenarioId: string): Promise<void> => {
  const catalog = await loadFixtureCatalog(page)
  await page.goto(scenarioHref(catalog, scenarioId))
  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
}

const replayBoard = (
  page: Page,
  sequence: number,
  eventType: string,
): Locator =>
  page.getByRole("img", {
    name: `Replay board at sequence ${sequence}, ${eventType}`,
  })

const forceScrubbedSequence = async (
  page: Page,
  sequence: number,
): Promise<void> => {
  await page
    .getByRole("slider", { name: "Replay timeline" })
    .evaluate((node, value) => {
      const input = node as HTMLInputElement
      input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }))
      input.value = String(value)
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.dispatchEvent(new Event("change", { bubbles: true }))
    }, sequence)
}

const selectEvent = async (
  page: Page,
  eventType: string,
): Promise<{ board: Locator; sequence: number }> => {
  const button = page
    .getByRole("button", {
      name: new RegExp(`^Timeline event \\d+: ${eventType}$`),
    })
    .first()
  const sequence = parseSequence(
    await button.getAttribute("aria-label"),
    eventType,
  )

  await button.click()
  await forceScrubbedSequence(page, sequence)
  const board = replayBoard(page, sequence, eventType)
  await expect(board).toBeVisible()
  await expectNonblankCanvasPixels(page)
  return { board, sequence }
}

test("[ui rendering] board scale captures generated compound tour board", async ({
  page,
}) => {
  await openScenario(page, "compound-tour")
  const board = replayBoard(page, 0, "MATCH_STARTED")
  await expect(board).toBeVisible()
  await expectNonblankCanvasPixels(page)
  await expect(board).toHaveScreenshot(
    "replay-board-compound-tour-scale.png",
    screenshotOptions,
  )
})

test("[ui rendering] Soldier positions capture push checkpoint", async ({
  page,
}) => {
  await openScenario(page, "push")
  const { board } = await selectEvent(page, "PUSH_RESOLVED")
  await expect(board).toHaveScreenshot(
    "replay-board-push-soldier-positions.png",
    screenshotOptions,
  )
})

test("[ui rendering] contraction bounds capture contraction checkpoint", async ({
  page,
}) => {
  await openScenario(page, "contraction")
  const { board } = await selectEvent(page, "CONTRACTION_RESOLVED")
  await expect(board).toHaveScreenshot(
    "replay-board-contraction-bounds.png",
    screenshotOptions,
  )
})

for (const scenario of calloutScenarios) {
  test(`[ui rendering] event callouts capture ${scenario.scenarioId}`, async ({
    page,
  }) => {
    await openScenario(page, scenario.scenarioId)
    const { board } = await selectEvent(page, scenario.eventType)
    await expect(board).toHaveScreenshot(
      scenario.screenshotName,
      screenshotOptions,
    )
  })
}
