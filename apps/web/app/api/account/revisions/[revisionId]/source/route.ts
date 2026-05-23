import type { StrategyRevisionId } from "@cowards/spec"
import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"
import {
  getAccountSessionId,
  isGoAccountRevisionsSelected,
  requireSelectedGoBackendClient,
} from "../../../../../../lib/account-service-adapter.js"

export async function GET(
  _request: Request,
  context: { params: Promise<{ revisionId: string }> | { revisionId: string } },
): Promise<Response> {
  try {
    const params = await context.params
    if (isGoAccountRevisionsSelected()) {
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
    }

    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const source = await competitiveServer.getAccountRevisionSource(
      user,
      decodeURIComponent(params.revisionId) as StrategyRevisionId,
    )
    if (source === null) {
      return Response.json(
        { error: "StrategyRevision not found." },
        { status: 404 },
      )
    }
    return new Response(source, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
      },
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
