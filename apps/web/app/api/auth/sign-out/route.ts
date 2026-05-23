import {
  competitiveServer,
  getSessionIdFromCookies,
} from "../../../competitive/server.js"
import {
  clearSessionCookie,
  competitiveErrorResponse,
} from "../../../competitive/http.js"
import {
  isGoAuthSessionSelected,
  requireSelectedGoBackendClient,
} from "../../../../lib/account-service-adapter.js"

export async function POST(): Promise<Response> {
  try {
    const sessionId = await getSessionIdFromCookies()
    if (isGoAuthSessionSelected()) {
      await requireSelectedGoBackendClient("auth/session").revokeSession(
        sessionId,
      )
    } else {
      await competitiveServer.signOut(sessionId)
    }
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": clearSessionCookie() } },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
