import type {
  WorkshopErrorResponse,
  WorkshopLaunchTestRequest,
} from "../../../workshop/types.js"
import { workshopServer } from "../../../workshop/server.js"

const readLaunchRequest = async (
  request: Request,
): Promise<WorkshopLaunchTestRequest | WorkshopErrorResponse> => {
  const body = (await request.json()) as Record<string, unknown>
  if (
    typeof body.revisionId !== "string" ||
    typeof body.opponentId !== "string" ||
    typeof body.presetId !== "string"
  ) {
    return { error: "revisionId, opponentId, and presetId are required" }
  }

  return {
    revisionId: body.revisionId,
    opponentId: body.opponentId as WorkshopLaunchTestRequest["opponentId"],
    presetId: body.presetId as WorkshopLaunchTestRequest["presetId"],
  }
}

export async function POST(request: Request): Promise<Response> {
  const body = await readLaunchRequest(request)
  if ("error" in body) {
    return Response.json(body, { status: 400 })
  }

  return Response.json(await workshopServer.launchTest(body), { status: 201 })
}
