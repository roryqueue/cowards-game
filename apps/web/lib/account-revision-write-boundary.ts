import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../app/competitive/server.js"
import {
  getAccountSessionId,
  isGoAccountRevisionsSelected,
  requireSelectedGoBackendClient,
} from "./account-service-adapter.js"
import { listAccountReadRevisions } from "./account-service-boundary.js"

export async function saveAccountRevisionFromRequest(
  request: Request,
): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (isGoAccountRevisionsSelected()) {
    const sessionId = await getAccountSessionId()
    const created = await requireSelectedGoBackendClient(
      "account revisions",
    ).createStrategyRevision(sessionId, {
      source: body.source,
      label: body.label,
      notes: body.notes,
      starterId: body.starterId,
      advancedId: body.advancedId,
    })
    const revision =
      (await listAccountReadRevisions()).find(
        (candidate) => candidate.id === created.strategyRevisionId,
      ) ?? null
    if (!revision) {
      throw new Error(
        "Go account revision create did not return a listable revision.",
      )
    }
    return Response.json({ revision }, { status: 201 })
  }

  const user = await getCurrentCompetitiveUser()
  if (!user) {
    return Response.json({ error: "Sign in is required." }, { status: 401 })
  }
  const revision = await competitiveServer.saveAccountRevision(user, {
    source: body.source,
    label: body.label,
    notes: body.notes,
    starterId: body.starterId,
    advancedId: body.advancedId,
  })
  return Response.json({ revision }, { status: 201 })
}
