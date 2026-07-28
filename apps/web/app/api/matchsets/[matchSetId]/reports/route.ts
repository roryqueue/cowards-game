import { SubmitCompetitionReportRequestBodySchema } from "@cowards/spec"
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
    const parsed = SubmitCompetitionReportRequestBodySchema.safeParse(
      await request.json(),
    )
    if (!parsed.success) {
      return Response.json(
        { error: "Choose a valid report type and category." },
        { status: 422 },
      )
    }
    const { matchSetId } = await params
    const receipt = await competitiveServer.submitCompetitionReport(user, {
      matchSetId,
      ...parsed.data,
    })
    return Response.json(receipt, {
      status: receipt.disposition === "created" ? 201 : 200,
    })
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
