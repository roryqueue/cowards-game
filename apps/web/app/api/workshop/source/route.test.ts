import { describe, expect, it } from "vitest"
import { GET } from "./route.js"

describe("/api/workshop/source", () => {
  it("deprecates the legacy source alias without returning Strategy source", async () => {
    const response = await GET(
      new Request(
        "http://test.local/api/workshop/source?revisionId=strategy-revision%3Ademo",
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(410)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(body.error).toContain("deprecated")
    expect(JSON.stringify(body)).not.toContain("export default")
    expect(JSON.stringify(body)).not.toContain("strategy-revision:demo")
  })

  it("keeps malformed alias requests public-safe", async () => {
    const response = await GET(
      new Request("http://test.local/api/workshop/source"),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: "revisionId is required" })
  })
})
