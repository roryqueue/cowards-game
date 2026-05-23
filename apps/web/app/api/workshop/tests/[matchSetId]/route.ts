import type { MatchSetId } from "@cowards/spec"
import { getWorkshopTestSummaryRead } from "../../../../../lib/workshop-read-service-boundary.js"
import { isStorageUnavailableError } from "../../../../../lib/storage-unavailable-error.js"
import type { WorkshopErrorResponse } from "../../../../workshop/types.js"

type RouteContext = {
  params: Promise<{ matchSetId: string }> | { matchSetId: string }
}

type ReadWorkshopTestSummary = typeof getWorkshopTestSummaryRead

export const createWorkshopTestSummaryGetHandler =
  (readSummary: ReadWorkshopTestSummary = getWorkshopTestSummaryRead) =>
  async (_request: Request, context: RouteContext): Promise<Response> => {
    const params = await context.params
    let dto
    try {
      dto = await readSummary(params.matchSetId as MatchSetId)
    } catch (error) {
      if (isStorageUnavailableError(error)) {
        return Response.json(
          { error: "Storage is unavailable; start local services and retry." },
          { status: 503 },
        )
      }
      throw error
    }
    if (dto === null) {
      return Response.json(
        { error: "Match set not found" } satisfies WorkshopErrorResponse,
        { status: 404 },
      )
    }

    return Response.json(dto.summary)
  }

export const GET = createWorkshopTestSummaryGetHandler()
