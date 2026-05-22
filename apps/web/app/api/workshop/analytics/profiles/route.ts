import { workshopServer } from "../../../../workshop/server.js"
import { isStorageUnavailableError } from "../../../../workshop/server.js"

const noStore = { "cache-control": "no-store" } as const
const localAnalyticsAllowed = (): boolean =>
  process.env.NODE_ENV !== "production" || process.env.PLAYWRIGHT_TEST === "1"

export async function POST(): Promise<Response> {
  if (!localAnalyticsAllowed()) {
    return Response.json(
      { error: "Analytics profile save is available only locally or to owners." },
      { status: 403, headers: noStore },
    )
  }
  let profile
  try {
    profile = await workshopServer.saveAnalyticsProfile()
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return Response.json(
        { error: "Storage is unavailable; start local services and retry." },
        { status: 503, headers: noStore },
      )
    }
    throw error
  }
  if (!profile) {
    return Response.json(
      { error: "No analytics profile is available" },
      { status: 404, headers: noStore },
    )
  }
  return Response.json({ profile }, { status: 201, headers: noStore })
}
