import type { WorkshopErrorResponse } from "../../../workshop/types.js"

const deprecatedWorkshopSourceAliasResponse = (): Response =>
  Response.json(
    {
      error:
        "Workshop source aliases are deprecated. Use account-owned Strategy source routes with a server-authorized account session.",
    } satisfies WorkshopErrorResponse,
    {
      status: 410,
      headers: {
        "cache-control": "private, no-store",
      },
    },
  )

export async function GET(request: Request): Promise<Response> {
  const revisionId = new URL(request.url).searchParams.get("revisionId")
  if (!revisionId) {
    return Response.json(
      { error: "revisionId is required" } satisfies WorkshopErrorResponse,
      { status: 400 },
    )
  }

  return deprecatedWorkshopSourceAliasResponse()
}
