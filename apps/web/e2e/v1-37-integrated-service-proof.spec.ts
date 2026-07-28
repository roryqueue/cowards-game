import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { expect, test, type Page, type Response } from "@playwright/test"
import { assertPublicOutputLeakSafe, PUBLIC_OUTPUT_FORBIDDEN_MARKERS } from "@cowards/spec"
type PublicMatchSet = {
  matchSetId: string
  status: string
  matches: Array<{
    matchId: string
    status: string
    replayAvailable: boolean
    replayHref?: string
    chronicleHash?: string
    arenaVariantId?: string
  }>
  contract: {
    lifecycle: { state: string; terminal: boolean }
  }
}
type PublicReplayMetadata = {
  kind: string
  matchId: string
  metadata: {
    matchId: string
    hash: string
    eventCount: number
    arenaVariantId: string
  }
}

type Handoff = { capabilityReceiptDigest?: string }
const handoffPath = process.env.COWARDS_V1_37_BROWSER_PROOF_HANDOFF_PATH
const observationsPath = process.env.COWARDS_V1_37_BROWSER_PROOF_OBSERVATIONS_PATH
if (!handoffPath || !observationsPath || process.env.PLAYWRIGHT_TEST !== "1") throw new Error("V137_BROWSER_PROOF_LIVE_ENV_REQUIRED")
const initialHandoff = JSON.parse(readFileSync(handoffPath, "utf8")) as Handoff
if (!initialHandoff.capabilityReceiptDigest) throw new Error("V137_BROWSER_PROOF_HANDOFF_INVALID")
const hash = (value: string): `sha256:${string}` => `sha256:${createHash("sha256").update(value).digest("hex")}`
const scan = (body: string, label: string, privateValues: readonly string[] = []): void => {
  for (const marker of PUBLIC_OUTPUT_FORBIDDEN_MARKERS.filter((value) => value !== "stack trace")) expect(body, label).not.toContain(marker)
  for (const value of privateValues) expect(body, label).not.toContain(value)
  try { assertPublicOutputLeakSafe(JSON.parse(body), label) } catch (error) { if (!body.trimStart().startsWith("<")) throw error }
}
const scanText = (body: string, label: string, privateValues: readonly string[]): void => {
  for (const marker of PUBLIC_OUTPUT_FORBIDDEN_MARKERS.filter((value) => value !== "stack trace")) expect(body, label).not.toContain(marker)
  for (const value of privateValues) expect(body, label).not.toContain(value)
}
const tracked = (response: Response): boolean => response.request().resourceType() === "document" || response.url().includes("/api/")
const attachPublicResponseScanner = (page: Page): ((privateValues: readonly string[]) => Promise<string>) => {
  const bodies: string[] = []
  const scans: Promise<void>[] = []
  page.on("response", (response) => { if (tracked(response)) scans.push(response.text().then((body) => { scan(body, `live response ${response.url()}`); bodies.push(body) })) })
  return async (privateValues) => {
    // Responses can arrive while earlier bodies are being read; wait for a stable snapshot.
    let observed = -1
    while (observed !== scans.length) { observed = scans.length; await Promise.all(scans); await page.waitForTimeout(0) }
    for (const [index, body] of bodies.entries()) scan(body, `live response ${index}`, privateValues)
    return hash(bodies.join("\n"))
  }
}
const boardRealism = async (page: Page): Promise<void> => {
  const canvas = page.locator("canvas"); await expect(canvas).toHaveCount(1)
  const bytes = await canvas.evaluate((value) => (value as HTMLCanvasElement).toDataURL("image/png").length)
  expect(bytes).toBeGreaterThan(500)
  const board = page.locator(".replay-board-host"); await expect(board).toBeVisible()
  const [boardBox, canvasBox] = await Promise.all([board.boundingBox(), canvas.boundingBox()])
  expect(boardBox).not.toBeNull(); expect(canvasBox).not.toBeNull()
  expect(canvasBox!.x).toBeGreaterThanOrEqual(boardBox!.x); expect(canvasBox!.y).toBeGreaterThanOrEqual(boardBox!.y)
  expect(canvasBox!.x + canvasBox!.width).toBeLessThanOrEqual(boardBox!.x + boardBox!.width + 1)
}
test("live v1.37 public pages are private-safe and board-realistic", async ({ page }, testInfo) => {
  const scanResponses = attachPublicResponseScanner(page)
  const matchSetId = "match-set:fixture:public-safe-replay"
  const replayMatchId = "match:runtime-service:golden"
  const replayHref = `/matches/${encodeURIComponent(replayMatchId)}/replay`
  await page.goto(`/matchsets/${encodeURIComponent(matchSetId)}`)
  await expect(page.getByRole("main")).toBeVisible()
  await expect(page.locator("body")).toContainText(/complete|non-counted|MatchSet/i)
  const matchSetResponse = await page.request.get(`/api/matchsets/${encodeURIComponent(matchSetId)}`)
  expect(matchSetResponse.status(), await matchSetResponse.text()).toBe(200)
  const matchSetBody = await matchSetResponse.text()
  scan(matchSetBody, "fixture-backed MatchSet API")
  const matchSet = JSON.parse(matchSetBody) as PublicMatchSet
  const replayMatch = matchSet.matches.find((match) => match.matchId === replayMatchId)
  expect(matchSet.matchSetId).toBe(matchSetId)
  expect(matchSet.status).toBe("complete")
  expect(matchSet.contract.lifecycle).toEqual(expect.objectContaining({ state: "complete", terminal: true }))
  expect(replayMatch).toEqual(expect.objectContaining({ status: "complete", replayAvailable: true, replayHref }))
  const metadataResponse = await page.request.get(`/api/replays/${encodeURIComponent(replayMatchId)}/metadata`)
  expect(metadataResponse.status(), await metadataResponse.text()).toBe(200)
  const metadataBody = await metadataResponse.text()
  scan(metadataBody, "fixture-backed replay metadata API")
  const metadata = JSON.parse(metadataBody) as PublicReplayMetadata
  expect(metadata).toEqual(expect.objectContaining({ kind: "publicReplayMetadata", matchId: replayMatchId }))
  expect(metadata.metadata).toEqual(expect.objectContaining({ matchId: replayMatchId, hash: replayMatch?.chronicleHash, arenaVariantId: replayMatch?.arenaVariantId }))
  expect(metadata.metadata.eventCount).toBeGreaterThan(1)
  await page.goto(replayHref)
  await expect(page.getByRole("heading", { name: "Replay" })).toBeVisible()
  const board = page.locator(".replay-board-host")
  await expect(board).toHaveAttribute("aria-label", /sequence 0, MATCH_STARTED/)
  const soldierProofs = page.locator('[data-testid^="replay-board-proof-soldier-"]')
  await expect(soldierProofs).toHaveCount(16)
  await boardRealism(page)
  const terminalButton = page.getByRole("button", { name: /Timeline event \d+: MATCH_ENDED/ })
  await expect(terminalButton).toHaveCount(1)
  await terminalButton.click()
  await expect(board).toHaveAttribute("aria-label", /MATCH_ENDED/)
  await boardRealism(page)
  const bodyText = await page.locator("body").innerText()
  const documentHtml = await page.locator("html").evaluate((node) => node.outerHTML)
  const privateValues = [
    "internal_runtime_result",
    "runtime-service-semantic-receipt:v1",
    "semanticReceipt",
    "authorityBundleHash",
    "registryGeneration",
  ].filter(Boolean)
  scanText(bodyText, "live replay body", privateValues)
  scan(documentHtml, "live replay document", privateValues)
  const responseRootSha256 = await scanResponses(privateValues)
  const observation = { project: testInfo.project.name, status: "passed", network: "live-scanned", document: "scanned", board: "nonblank-contained-in-bounds-terminal-consistent", responseRootSha256 }
  const existing = existsSync(observationsPath) ? JSON.parse(readFileSync(observationsPath, "utf8")) as { observations?: unknown[] } : {}
  writeFileSync(observationsPath, JSON.stringify({ observations: [...(existing.observations ?? []).filter((entry) => (entry as { project?: string }).project !== testInfo.project.name), observation] }), { mode: 0o600 })
})
