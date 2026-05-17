import { workshopServer } from "../../../workshop/server.js"
import type {
  WorkshopErrorResponse,
  WorkshopLaunchTestRequest,
} from "../../../workshop/types.js"

const isWorkshopInputError = (error: unknown): error is Error =>
  error instanceof Error && error.name === "WorkshopInputError"

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

  try {
    return Response.json(await workshopServer.launchTest(body), { status: 201 })
  } catch (error) {
    if (isWorkshopInputError(error)) {
      return Response.json(
        { error: error.message } satisfies WorkshopErrorResponse,
        { status: 400 },
      )
    }
    return Response.json(
      {
        error: "Storage is unavailable; start local services and retry.",
      } satisfies WorkshopErrorResponse,
      { status: 503 },
    )
  }
}
