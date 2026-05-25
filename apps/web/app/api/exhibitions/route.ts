import type { StrategyRevisionId } from "@cowards/spec"
import { competitiveErrorResponse } from "../../competitive/http.js"
import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "../../../lib/account-service-adapter.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const revisionIds = Array.isArray(body.revisionIds)
      ? body.revisionIds.filter(
          (revisionId): revisionId is StrategyRevisionId =>
            typeof revisionId === "string",
        )
      : []
    const result = await requireSelectedGoBackendClient(
      "exhibitions",
    ).createMatchSet(await getAccountSessionId(), {
      presetId: body.presetId,
      revisionIds,
      ...(body.counted === false ? { counted: false } : {}),
    })
    return Response.json(
      {
        matchSetId: result.matchSetId,
        status: "queued",
        matchCount: result.matchCount ?? 0,
      },
      { status: 201 },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
