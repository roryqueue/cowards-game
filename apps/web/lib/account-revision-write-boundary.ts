import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../app/competitive/server.js"

export async function saveAccountRevisionFromRequest(
  request: Request,
): Promise<Response> {
  const user = await getCurrentCompetitiveUser()
  if (!user) {
    return Response.json({ error: "Sign in is required." }, { status: 401 })
  }
  const body = (await request.json()) as Record<string, unknown>
  const revision = await competitiveServer.saveAccountRevision(user, {
    source: body.source,
    label: body.label,
    notes: body.notes,
    starterId: body.starterId,
    advancedId: body.advancedId,
  })
  return Response.json({ revision }, { status: 201 })
}
