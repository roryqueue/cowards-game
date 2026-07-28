import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "./account-service-adapter.js"
import { listAccountReadRevisions } from "./account-service-boundary.js"
import { CompetitiveInputError } from "./competitive-errors.js"

export const exactStrategySource = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new CompetitiveInputError("Strategy source must be a string.", {
      status: 400,
    })
  }
  if (value.trim().length === 0) {
    throw new CompetitiveInputError("Strategy source must not be empty.", {
      status: 400,
    })
  }
  return value
}

export async function saveAccountRevisionFromRequest(
  request: Request,
): Promise<Response> {
  const body = (await request.json()) as Record<string, unknown>
  if (
    body.sourceFormat !== undefined &&
    body.sourceFormat !== "typescript" &&
    body.sourceFormat !== "python" &&
    body.sourceFormat !== "rust" &&
    body.sourceFormat !== "zig"
  ) {
    return Response.json({ error: "unsupported sourceFormat" }, { status: 400 })
  }
  const created = await requireSelectedGoBackendClient(
    "account revisions",
  ).createStrategyRevision(await getAccountSessionId(), {
    source: exactStrategySource(body.source),
    sourceFormat: body.sourceFormat ?? "typescript",
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
