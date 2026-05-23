import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"
import {
  getAccountSessionId,
  isGoAccountForksSelected,
  requireSelectedGoBackendClient,
} from "../../../../lib/account-service-adapter.js"
import { listAccountReadRevisions } from "../../../../lib/account-service-boundary.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (isGoAccountForksSelected()) {
      const created = await requireSelectedGoBackendClient(
        "account revisions",
      ).forkAdvancedStrategy(await getAccountSessionId(), body.advancedId)
      const revision =
        (await listAccountReadRevisions()).find(
          (candidate) => candidate.id === created.strategyRevisionId,
        ) ?? null
      if (!revision) {
        throw new Error("Go advanced fork did not return a listable revision.")
      }
      return Response.json({ ok: true, revision }, { status: 201 })
    }

    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const revision = await competitiveServer.forkAdvancedStrategy(user, {
      advancedId: body.advancedId,
    })
    return Response.json({ ok: true, revision }, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
