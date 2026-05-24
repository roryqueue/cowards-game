import type { StrategyRevisionId } from "@cowards/spec"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"
import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "../../../../../../lib/account-service-adapter.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> | { revisionId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    const dto = await requireSelectedGoBackendClient(
      "account revisions",
    ).getStrategyRevisionSource(
      await getAccountSessionId(),
      decodeURIComponent(params.revisionId) as StrategyRevisionId,
    )
    if (dto === null) {
      return Response.json(
        { error: "StrategyRevision not found." },
        { status: 404 },
      )
    }
    return new Response(dto.source, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
      },
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
