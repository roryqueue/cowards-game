import { afterEach, describe, expect, it, vi } from "vitest"
import { POST } from "./route.js"

const request = (body: unknown): Request =>
  new Request("http://test.local/api/workshop/revisions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

describe("/api/workshop/revisions", () => {
  const originalUrl = process.env.COWARDS_RUNTIME_SERVICE_URL

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalUrl === undefined) {
      delete process.env.COWARDS_RUNTIME_SERVICE_URL
    } else {
      process.env.COWARDS_RUNTIME_SERVICE_URL = originalUrl
    }
  })

  it("returns a calm unavailable response when runtime-service fetch fails", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"))

    const response = await POST(
      request({ source: "export default {}", sourceFormat: "rust" }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain("could not reach runtime-service")
    expect(body.error).toContain("has not been judged invalid")
  })

  it("returns a public system response when runtime-service JSON is malformed", async () => {
    process.env.COWARDS_RUNTIME_SERVICE_URL = "http://runtime.test"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 200 }),
    )

    const response = await POST(
      request({ source: "export default {}", sourceFormat: "zig" }),
    )
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error).toContain("unsupported response")
    expect(body.error).not.toContain("not json")
  })
})
