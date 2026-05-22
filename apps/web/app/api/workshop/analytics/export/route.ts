import { workshopServer } from "../../../../workshop/server.js"

const noStore = { "cache-control": "no-store" } as const

const localAnalyticsAllowed = (): boolean =>
  process.env.NODE_ENV !== "production" || process.env.PLAYWRIGHT_TEST === "1"

const readFormat = (request: Request): "json" | "csv" | null => {
  const format = new URL(request.url).searchParams.get("format") ?? "json"
  return format === "json" || format === "csv" ? format : null
}

export async function GET(request: Request): Promise<Response> {
  if (!localAnalyticsAllowed()) {
    return Response.json(
      { error: "Analytics export is available only to local or owning users." },
      { status: 403, headers: noStore },
    )
  }
  const format = readFormat(request)
  if (!format) {
    return Response.json(
      { error: "format must be json or csv" },
      { status: 400, headers: noStore },
    )
  }
  const exported = await workshopServer.exportAnalytics(format)
  if (format === "csv") {
    return new Response(exported as string, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        ...noStore,
      },
    })
  }
  return Response.json(exported, {
    headers: noStore,
  })
}
