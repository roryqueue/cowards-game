import { describe, expect, it } from "vitest"
import { GET } from "./route.js"

describe("/api/workshop/revisions/:revisionId/source", () => {
  it("deprecates the legacy revision source alias without returning Strategy source", async () => {
    const response = await GET(
      new Request(
        "http://test.local/api/workshop/revisions/strategy-revision%3Ademo/source",
      ),
      { params: { revisionId: "strategy-revision:demo" } },
    )
    const body = await response.json()

    expect(response.status).toBe(410)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(body.error).toContain("deprecated")
    expect(JSON.stringify(body)).not.toContain("export default")
    expect(JSON.stringify(body)).not.toContain("strategy-revision:demo")
  })
})
