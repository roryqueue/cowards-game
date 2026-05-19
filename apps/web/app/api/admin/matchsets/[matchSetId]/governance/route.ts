import {
  competitiveServer,
  getCurrentCompetitiveUser,
} from "../../../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../../../competitive/http.js"

const countedStatuses = new Set([
  "counted",
  "invalid",
  "non_competitive",
  "non_counted",
])
const publicReasons = new Set([
  "system_failure",
  "incomplete_evidence",
  "invalid_result",
  "governance_hold",
  "non_counted",
])

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
    const countedStatus =
      typeof body.countedStatus === "string" &&
      countedStatuses.has(body.countedStatus)
        ? body.countedStatus
        : "invalid"
    const publicReason =
      typeof body.publicReason === "string" &&
      publicReasons.has(body.publicReason)
        ? body.publicReason
        : "invalid_result"
    await competitiveServer.markMatchSetGovernanceStatus(user, {
      matchSetId,
      countedStatus: countedStatus as never,
      publicReason: publicReason as never,
      reason: typeof body.reason === "string" ? body.reason : "",
      publicExplanation:
        typeof body.publicExplanation === "string"
          ? body.publicExplanation
          : "",
      privateNote:
        typeof body.privateNote === "string" ? body.privateNote : undefined,
      adminUserId: user.id,
    })
    return Response.json({ ok: true })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
