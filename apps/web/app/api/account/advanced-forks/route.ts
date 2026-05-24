import { competitiveErrorResponse } from "../../../competitive/http.js"
import {
  assertGoAccountForksCanReadBack,
  getAccountSessionId,
  isGoAccountForksSelected,
  requireSelectedGoBackendClient,
} from "../../../../lib/account-service-adapter.js"
import { listAccountReadRevisions } from "../../../../lib/account-service-boundary.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (isGoAccountForksSelected()) {
      assertGoAccountForksCanReadBack()
    }
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
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
