import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"
import { CompetitionGovernanceActionRequestBodySchema } from "@cowards/spec"

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ matchSetId: string }> | { matchSetId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const { matchSetId } = await params
    const parsed = CompetitionGovernanceActionRequestBodySchema.safeParse(
      await request.json(),
    )
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid governance action." },
        { status: 422 },
      )
    }
    await competitiveServer.applyCompetitionGovernanceAction(user, {
      matchSetIds: [matchSetId],
      ...parsed.data,
    })
    return Response.json({ ok: true })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
