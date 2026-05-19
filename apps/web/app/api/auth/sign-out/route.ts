import {
  competitiveServer,
  getSessionIdFromCookies,
} from "../../../competitive/server.js"
import {
  clearSessionCookie,
  competitiveErrorResponse,
} from "../../../competitive/http.js"

export async function POST(): Promise<Response> {
  try {
    await competitiveServer.signOut(await getSessionIdFromCookies())
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": clearSessionCookie() } },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
