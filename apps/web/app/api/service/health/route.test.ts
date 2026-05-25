import { afterEach, describe, expect, it, vi } from "vitest"
import { GET } from "./route.js"

describe("/api/service/health", () => {
  const previousOwner = process.env.COWARDS_GO_BACKEND_OWNER
  const previousNoTs = process.env.COWARDS_NO_TYPESCRIPT_BACKEND
  const previousGoUrl = process.env.COWARDS_GO_BACKEND_URL

  afterEach(() => {
    vi.restoreAllMocks()
    if (previousOwner === undefined) {
      delete process.env.COWARDS_GO_BACKEND_OWNER
    } else {
      process.env.COWARDS_GO_BACKEND_OWNER = previousOwner
    }
    if (previousNoTs === undefined) {
      delete process.env.COWARDS_NO_TYPESCRIPT_BACKEND
    } else {
      process.env.COWARDS_NO_TYPESCRIPT_BACKEND = previousNoTs
    }
    if (previousGoUrl === undefined) {
      delete process.env.COWARDS_GO_BACKEND_URL
    } else {
      process.env.COWARDS_GO_BACKEND_URL = previousGoUrl
    }
  })

  it("classifies missing Go backend URL in strict no-TypeScript-backend mode", async () => {
    process.env.COWARDS_NO_TYPESCRIPT_BACKEND = "1"
    delete process.env.COWARDS_GO_BACKEND_URL

    const response = await GET()
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      ok: false,
      service: "go-backend",
      failureClass: "go_backend_unconfigured",
      publicSafe: true,
    })
  })

  it("classifies stopped Go backend failures", async () => {
    process.env.COWARDS_NO_TYPESCRIPT_BACKEND = "1"
    process.env.COWARDS_GO_BACKEND_URL = "http://go.test"
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new Error("connect ECONNREFUSED"),
    )

    const response = await GET()
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      ok: false,
      service: "go-backend",
      failureClass: "go_backend_unavailable",
      publicSafe: true,
    })
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED")
  })

  it("classifies non-JSON Go health responses", async () => {
    process.env.COWARDS_GO_BACKEND_OWNER = "go"
    process.env.COWARDS_GO_BACKEND_URL = "http://go.test"
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("not json", { status: 502 }),
    )

    const response = await GET()
    const body = (await response.json()) as Record<string, unknown>

    expect(response.status).toBe(503)
    expect(body).toMatchObject({
      ok: false,
      service: "go-backend",
      failureClass: "go_backend_non_json",
      publicSafe: true,
    })
  })
})
