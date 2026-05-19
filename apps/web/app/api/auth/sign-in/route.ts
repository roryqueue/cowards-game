import { competitiveServer } from "../../../competitive/server.js"
import {
  competitiveErrorResponse,
  sessionCookie,
} from "../../../competitive/http.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
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
