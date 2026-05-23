import { getWorkshopAnalyticsComparisonRead } from "../../../../../../../lib/workshop-read-service-boundary.js"
import { isStorageUnavailableError } from "../../../../../../../lib/storage-unavailable-error.js"

const noStore = { "cache-control": "no-store" } as const
const localAnalyticsAllowed = (): boolean =>
  process.env.NODE_ENV !== "production" || process.env.PLAYWRIGHT_TEST === "1"

interface RouteContext {
  params: Promise<{ profileId: string }> | { profileId: string }
}

type ReadWorkshopAnalyticsComparison = typeof getWorkshopAnalyticsComparisonRead

export const createWorkshopAnalyticsCompareGetHandler =
  (
    readComparison: ReadWorkshopAnalyticsComparison = getWorkshopAnalyticsComparisonRead,
    analyticsAllowed = localAnalyticsAllowed,
  ) =>
  async (_request: Request, context: RouteContext): Promise<Response> => {
    if (!analyticsAllowed()) {
      return Response.json(
        {
          error: "Analytics comparison is available only locally or to owners.",
        },
        { status: 403, headers: noStore },
      )
    }
    const params = await Promise.resolve(context.params)
    let result
    try {
      result = await readComparison(params.profileId)
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
    return Response.json(result.comparison, { headers: noStore })
  }

export const GET = createWorkshopAnalyticsCompareGetHandler()
