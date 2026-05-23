import { competitiveServer } from "../../../competitive/server.js"
import {
  competitiveErrorResponse,
  sessionCookie,
} from "../../../competitive/http.js"
import {
  isGoAuthSessionSelected,
  requireSelectedGoBackendClient,
} from "../../../../lib/account-service-adapter.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (isGoAuthSessionSelected()) {
      const result = await requireSelectedGoBackendClient(
        "auth/session",
      ).createSession({
        username: body.username,
        password: body.password,
      })
      if (!result.body.user || !result.setCookie) {
        throw new Error("Go auth/session returned an invalid session result.")
      }
      return Response.json(
        { user: result.body.user },
        { headers: { "Set-Cookie": result.setCookie } },
      )
    }
    const result = await competitiveServer.signIn({
      username: body.username,
      password: body.password,
    })
    return Response.json(
      { user: result.user },
      { headers: { "Set-Cookie": sessionCookie(result.sessionId) } },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
