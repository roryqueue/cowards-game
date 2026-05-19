import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../competitive/http.js"

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
    const body = (await request.json()) as Record<string, unknown>
    const result = await competitiveServer.flagMatchSetResult(user, {
      matchSetId,
      note: body.note,
    })
    return Response.json(result, { status: 201 })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
