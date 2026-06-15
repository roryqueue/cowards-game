import type { WorkshopErrorResponse } from "../../../../../workshop/types.js"

const deprecatedWorkshopSourceAliasResponse = (): Response =>
  Response.json(
    {
      error:
        "Workshop revision source aliases are deprecated. Use account-owned Strategy source routes with a server-authorized account session.",
    } satisfies WorkshopErrorResponse,
    {
      status: 410,
      headers: {
        "cache-control": "private, no-store",
      },
    },
  )

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> | { revisionId: string } },
): Promise<Response> {
  await context.params
  return deprecatedWorkshopSourceAliasResponse()
}
