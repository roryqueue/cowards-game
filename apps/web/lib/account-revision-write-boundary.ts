import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "./account-service-adapter.js"
import { listAccountReadRevisions } from "./account-service-boundary.js"

export async function saveAccountRevisionFromRequest(
  request: Request,
): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  const created = await requireSelectedGoBackendClient(
    "account revisions",
  ).createStrategyRevision(await getAccountSessionId(), {
    source: body.source,
    sourceFormat: body.sourceFormat === "python" ? "python" : "typescript",
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
