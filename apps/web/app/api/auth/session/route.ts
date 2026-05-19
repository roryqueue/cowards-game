import {
  competitiveServer,
  getSessionIdFromCookies,
} from "../../../competitive/server.js"
import { competitiveErrorResponse } from "../../../competitive/http.js"

export async function GET(): Promise<Response> {
  try {
    return Response.json(
      await competitiveServer.getSnapshot(await getSessionIdFromCookies()),
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
