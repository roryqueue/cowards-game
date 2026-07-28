import { Buffer } from "node:buffer"
import { inflateSync } from "node:zlib"
import {
  expect,
  test,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test"
import {
  PUBLIC_OUTPUT_FORBIDDEN_MARKERS,
  assertPublicOutputLeakSafe,
  getMatchExecutionContractFixtureByMatchSetId,
} from "@cowards/spec"

const matchSetId = "match-set:fixture:public-safe-replay"
const matchId = "match:runtime-service:golden"
const chronicleHash =
  "sha256:e6122e9111f64940929216db472648e7489a953af05bfbd6c0fdd91a9139b3f5"
const arenaVariantId = "arena-empty-12x12"
const resultHref = `/matchsets/${encodeURIComponent(matchSetId)}`
const replayHref = `/matches/${encodeURIComponent(matchId)}/replay`
const resultApiHref = `/api/matchsets/${encodeURIComponent(matchSetId)}`
const metadataApiHref = `/api/replays/${encodeURIComponent(matchId)}/metadata`

const restrictedPrivateValues = [
  "internal_runtime_result",
  "runtime-service-semantic-receipt:v1",
  "hmac-sha256:deeba5b92e286e2b5ba862fc364fb90ec7c11192100da51a66d1a9c6338ab98b",
  "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  "before\u2028middle\u2029after",
  "日本語",
  "/Users/",
  "semanticReceipt",
  "authorityBundleHash",
  "registryGeneration",
  "chronicleWireBytesHash",
  "finalStateWireBytesHash",
  "reconstructedTerminalStateHash",
  "outcomeWireBytesHash",
] as const

const publicDocumentLeakMarkers = PUBLIC_OUTPUT_FORBIDDEN_MARKERS.filter(
  (marker) => marker !== "stack trace",
)

type ResultApi = {
  matchSetId: string
  preset: { label: string }
  status: string
  matches: Array<{
    matchId: string
    status: string
    replayAvailable: boolean
    replayHref?: string
    chronicleHash?: string
    arenaVariantId?: string
  }>
  provenance: { chronicleHashes: string[] }
  contract: {
    matchSetId: string
    lifecycle: { state: string; terminal: boolean }
    matches: Array<{
      matchId: string
      chronicleHash?: string
      arenaVariantId?: string
    }>
  }
}

type MetadataApi = {
  kind: "publicReplayMetadata"
  matchId: string
  metadata: {
    matchId: string
    hash: string
    eventCount: number
    snapshotCount: number
    arenaVariantId: string
  }
}

const serviceFixture = getMatchExecutionContractFixtureByMatchSetId(matchSetId)
const serviceEvidence = serviceFixture?.service.replayEvidence

if (!serviceEvidence) {
  throw new Error("missing public-safe service-contract replay fixture")
}

const scanText = (text: string, label: string): void => {
  for (const marker of publicDocumentLeakMarkers) {
    expect(
      text,
      `${label} contains canonical private marker ${marker}`,
    ).not.toContain(marker)
  }
  for (const value of restrictedPrivateValues) {
    expect(
      text,
      `${label} contains restricted private value ${value}`,
    ).not.toContain(value)
  }
}

const scanJson = <T>(value: T, label: string): T => {
  assertPublicOutputLeakSafe(value, label)
  scanText(JSON.stringify(value), label)
  return value
}

const trackedPublicResponse = (response: Response): boolean => {
  const contentType = response.headers()["content-type"] ?? ""
  if (response.request().resourceType() === "document") {
    return contentType.includes("text/html")
  }
  return (
    response.url().includes("/api/matchsets/") ||
    response.url().includes("/api/replays/")
  )
}

const attachPublicResponseScanner = (page: Page): (() => Promise<void>) => {
  const scans: Promise<void>[] = []
  page.on("response", (response) => {
    if (!trackedPublicResponse(response)) return
    scans.push(
      response
        .text()
        .then((body) => scanText(body, `public response ${response.url()}`)),
    )
  })
  return async () => {
    await Promise.all(scans)
  }
}

const expectDocumentContained = async (page: Page): Promise<void> => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: globalThis.document.documentElement.scrollWidth,
    viewportWidth: globalThis.document.documentElement.clientWidth,
    bodyWidth: globalThis.document.body.getBoundingClientRect().width,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.viewportWidth + 1,
  )
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1)
}

const expectLocatorInside = async (
  container: Locator,
  point: Locator,
): Promise<void> => {
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

const pngSignature = "89504e470d0a1a0a"

const paeth = (left: number, up: number, upLeft: number): number => {
  const prediction = left + up - upLeft
  const leftDistance = Math.abs(prediction - left)
  const upDistance = Math.abs(prediction - up)
  const upLeftDistance = Math.abs(prediction - upLeft)
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left
  return upDistance <= upLeftDistance ? up : upLeft
}

const readCanvasInk = (
  png: Buffer,
): { width: number; height: number; left: number; right: number } => {
  if (png.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error("replay canvas screenshot is not PNG data")
  }
  let offset = 8
  let width = 0
  let height = 0
  let bytesPerPixel = 0
  const chunks: Buffer[] = []
  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.subarray(offset + 4, offset + 8).toString("ascii")
    const data = png.subarray(offset + 8, offset + 8 + length)
    offset += length + 12
    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      const bitDepth = data[8]
      const colorType = data[9]
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`unsupported replay PNG ${bitDepth}/${colorType}`)
      }
      bytesPerPixel = colorType === 6 ? 4 : 3
    } else if (type === "IDAT") {
      chunks.push(data)
    } else if (type === "IEND") {
      break
    }
  }
  const inflated = inflateSync(Buffer.concat(chunks))
  const rowBytes = width * bytesPerPixel
  const previous = Buffer.alloc(rowBytes)
  const current = Buffer.alloc(rowBytes)
  let sourceOffset = 0
  let leftInk = 0
  let rightInk = 0
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset++]
    for (let x = 0; x < rowBytes; x += 1) {
      const raw = inflated[sourceOffset + x] ?? 0
      const left = x >= bytesPerPixel ? (current[x - bytesPerPixel] ?? 0) : 0
      const up = previous[x] ?? 0
      const upLeft = x >= bytesPerPixel ? (previous[x - bytesPerPixel] ?? 0) : 0
      const filtered =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? up
              : filter === 3
                ? Math.floor((left + up) / 2)
                : paeth(left, up, upLeft)
      current[x] = (raw + filtered) & 0xff
    }
    sourceOffset += rowBytes
    for (let x = 0; x < rowBytes; x += bytesPerPixel) {
      const red = current[x] ?? 255
      const green = current[x + 1] ?? 255
      const blue = current[x + 2] ?? 255
      const alpha = bytesPerPixel === 4 ? (current[x + 3] ?? 0) : 255
      if (alpha > 0 && (red < 235 || green < 235 || blue < 235)) {
        if (x / bytesPerPixel < width / 2) leftInk += 1
        else rightInk += 1
      }
    }
    current.copy(previous)
  }
  return { width, height, left: leftInk, right: rightInk }
}

const expectCanvasRealistic = async (page: Page): Promise<void> => {
  const canvas = page.getByLabel("Replay board canvas")
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(240)
  expect(box!.height).toBeGreaterThanOrEqual(240)
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(
    page.viewportSize()?.width ?? box!.x + box!.width,
  )
  const ink = readCanvasInk(await canvas.screenshot({ animations: "disabled" }))
  expect(ink.width).toBeGreaterThanOrEqual(240)
  expect(ink.height).toBeGreaterThanOrEqual(240)
  expect(ink.left).toBeGreaterThan(ink.height * 3)
  expect(ink.right).toBeGreaterThan(ink.height * 3)
}

test.describe("v1.37 service-contract-backed fixture proof (not live-service proof)", () => {
  test("result, APIs, and replay share one realistic public-safe terminal receipt", async ({
    page,
  }, testInfo) => {
    const flushResponseScans = attachPublicResponseScanner(page)
    const expectedTerminalEvents = serviceEvidence.projection.events.filter(
      (event) => event.type === "MATCH_ENDED",
    )
    expect(serviceFixture?.label).toContain("service-contract fixture")
    expect(serviceEvidence.metadata.outcome).toEqual({ type: "DRAW" })
    expect(expectedTerminalEvents).toHaveLength(1)
    expect(expectedTerminalEvents[0]).toEqual(
      serviceEvidence.projection.events.at(-1),
    )

    await page.goto(resultHref)
    await expect(
      page.getByRole("heading", {
        name: "Service-contract-backed replay fixture",
      }),
    ).toBeVisible()
    await expect(page.getByTestId("matchset-evidence-panel")).toBeVisible()
    await expectDocumentContained(page)

    const resultResponse = await page.request.get(resultApiHref)
    expect(resultResponse.ok()).toBe(true)
    const result = scanJson(
      (await resultResponse.json()) as ResultApi,
      "public MatchSet result API",
    )
    const resultMatch = result.matches[0]
    expect(result.matchSetId).toBe(matchSetId)
    expect(result.status).toBe("complete")
    expect(result.preset.label).toBe("Service-contract-backed replay fixture")
    expect(resultMatch).toMatchObject({
      matchId,
      status: "complete",
      replayAvailable: true,
      replayHref,
      chronicleHash,
      arenaVariantId,
    })
    expect(result.provenance.chronicleHashes).toEqual([chronicleHash])
    expect(result.contract.matchSetId).toBe(matchSetId)
    expect(result.contract.lifecycle).toMatchObject({
      state: "complete",
      terminal: true,
    })
    expect(result.contract.matches[0]).toMatchObject({
      matchId,
      chronicleHash,
      arenaVariantId,
    })

    const metadataResponse = await page.request.get(metadataApiHref)
    expect(metadataResponse.ok()).toBe(true)
    const metadata = scanJson(
      (await metadataResponse.json()) as MetadataApi,
      "public replay metadata API",
    )
    expect(metadata).toMatchObject({
      kind: "publicReplayMetadata",
      matchId,
      metadata: {
        matchId,
        hash: chronicleHash,
        eventCount: 31,
        snapshotCount: 12,
        arenaVariantId,
      },
    })
    expect(metadata.metadata.matchId).toBe(resultMatch?.matchId)
    expect(metadata.metadata.hash).toBe(resultMatch?.chronicleHash)
    expect(metadata.metadata.arenaVariantId).toBe(resultMatch?.arenaVariantId)

    const replayLink = page.getByRole("link", { name: "Replay" }).first()
    await expect(replayLink).toHaveAttribute("href", replayHref)
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`result-${testInfo.project.name}.png`),
    })
    await replayLink.click()
    await expect(page).toHaveURL((url) => url.pathname === replayHref)
    await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
    await expect(page.getByText("Public-safe projection")).toBeVisible()
    await expect(page.getByText("Public view")).toBeVisible()
    await expect(page.getByTestId("replay-evidence-panel")).toBeVisible()
    await expect(page.getByTestId("replay-owner-debug-toggle")).toHaveCount(0)
    await expectDocumentContained(page)

    const timelineEvents = page.getByRole("button", {
      name: /^Timeline event \d+: /,
    })
    await expect(timelineEvents).toHaveCount(31)
    const terminalButton = page.getByRole("button", {
      name: "Timeline event 30: MATCH_ENDED",
    })
    await expect(terminalButton).toHaveCount(1)
    const renderedSequences = (
      await timelineEvents.evaluateAll((buttons) =>
        buttons.map((button) =>
          Number.parseInt(
            button
              .getAttribute("aria-label")
              ?.match(/^Timeline event (\d+):/)?.[1] ?? "-1",
            10,
          ),
        ),
      )
    ).sort((left, right) => left - right)
    expect(renderedSequences).toEqual(
      Array.from({ length: 31 }, (_unused, index) => index),
    )
    await expect(
      page.getByRole("complementary", { name: "Match metadata" }),
    ).toContainText("31")

    const board = page.locator(".replay-board-host")
    await expect(board).toHaveAttribute(
      "aria-label",
      "Replay board at sequence 0, MATCH_STARTED",
    )
    const soldierProofs = page.locator(
      '[data-testid^="replay-board-proof-soldier-"]',
    )
    const terrainProofs = page.locator(
      '[data-testid^="replay-board-proof-terrain-"]',
    )
    await expect(soldierProofs).toHaveCount(16)
    await expect(terrainProofs).toHaveCount(0)
    for (let index = 0; index < (await soldierProofs.count()); index += 1) {
      await expectLocatorInside(board, soldierProofs.nth(index))
    }
    await expectCanvasRealistic(page)
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`replay-start-${testInfo.project.name}.png`),
    })

    await expect(async () => {
      await terminalButton.click()
      await expect(board).toHaveAttribute(
        "aria-label",
        "Replay board at sequence 30, MATCH_ENDED",
        { timeout: 1_000 },
      )
    }).toPass({ timeout: 10_000 })
    await expect(
      page.getByRole("complementary", { name: "Match metadata" }),
    ).toContainText("Draw")
    await expect(
      page.getByText("MATCH_ENDED", { exact: true }).first(),
    ).toBeVisible()
    await expect(soldierProofs).toHaveCount(0)
    await expect(terrainProofs).toHaveCount(0)
    await expectCanvasRealistic(page)
    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath(`replay-terminal-${testInfo.project.name}.png`),
    })

    scanText(await page.locator("body").innerText(), "public replay body")
    scanText(
      await page.locator("html").evaluate((node) => node.outerHTML),
      "public replay document",
    )
    await flushResponseScans()
  })
})
