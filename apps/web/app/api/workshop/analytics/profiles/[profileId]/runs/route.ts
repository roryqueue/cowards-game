import { workshopServer } from "../../../../../../workshop/server.js"
import { isStorageUnavailableError } from "../../../../../../workshop/server.js"

const noStore = { "cache-control": "no-store" } as const
const localAnalyticsAllowed = (): boolean =>
  process.env.NODE_ENV !== "production" || process.env.PLAYWRIGHT_TEST === "1"

interface RouteContext {
  params: Promise<{ profileId: string }> | { profileId: string }
}

export async function POST(_request: Request, context: RouteContext) {
  if (!localAnalyticsAllowed()) {
    return Response.json(
      { error: "Analytics rerun is available only locally or to owners." },
      { status: 403, headers: noStore },
    )
  }
  const params = await Promise.resolve(context.params)
  let result
  try {
    result = await workshopServer.rerunAnalyticsProfile(params.profileId)
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return Response.json(
        { error: "Storage is unavailable; start local services and retry." },
        { status: 503, headers: noStore },
      )
    }
    throw error
  }
  if (!result) {
    return Response.json(
      { error: "Analytics profile not found" },
      { status: 404, headers: noStore },
    )
  }
  return Response.json(result, { status: 201, headers: noStore })
}
