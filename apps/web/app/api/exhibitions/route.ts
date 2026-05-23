import type { StrategyRevisionId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../competitive/server.js"
import { competitiveErrorResponse } from "../../competitive/http.js"
import {
  getAccountSessionId,
  isGoExhibitionsSelected,
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
    if (isGoExhibitionsSelected()) {
      const result = await requireSelectedGoBackendClient(
        "exhibitions",
      ).createMatchSet(await getAccountSessionId(), {
        presetId: body.presetId,
        revisionIds,
      })
      return Response.json(
        {
          matchSetId: result.matchSetId,
          status: "queued",
          matchCount: result.matchCount ?? 0,
        },
        { status: 201 },
      )
    }
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const result = await competitiveServer.createExhibition(user, {
      presetId: body.presetId as never,
      revisionIds,
    })
    return Response.json(result, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
