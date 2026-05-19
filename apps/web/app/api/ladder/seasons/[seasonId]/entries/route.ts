import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ seasonId: string }> | { seasonId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const { seasonId } = await params
    const body = (await request.json()) as Record<string, unknown>
    const result = await competitiveServer.enterTrialLadderSeason(user, {
      seasonId,
      revisionId: body.revisionId,
    })
    return Response.json(result, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ seasonId: string }> | { seasonId: string } },
): Promise<Response> {
  try {
    const user = await getCurrentCompetitiveUser()
    if (!user) {
      return Response.json({ error: "Sign in is required." }, { status: 401 })
    }
    const { seasonId } = await params
    await competitiveServer.withdrawTrialLadderEntry(user, seasonId)
    return Response.json({ ok: true })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
