import {
  clearSessionCookie,
  competitiveErrorResponse,
} from "../../../competitive/http.js"
import {
  getAccountSessionId,
  requireSelectedGoBackendClient,
} from "../../../../lib/account-service-adapter.js"

export async function POST(): Promise<Response> {
  try {
    await requireSelectedGoBackendClient("auth/session").revokeSession(
      await getAccountSessionId(),
    )
    return Response.json(
      { ok: true },
      { headers: { "Set-Cookie": clearSessionCookie() } },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
