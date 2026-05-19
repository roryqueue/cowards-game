import { competitiveServer } from "../../../competitive/server.js"
import {
  competitiveErrorResponse,
  sessionCookie,
} from "../../../competitive/http.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const result = await competitiveServer.signUp({
      username: body.username,
      password: body.password,
      handle: body.handle,
      displayName: body.displayName,
    })
    return Response.json(
      { user: result.user },
      {
        status: 201,
        headers: { "Set-Cookie": sessionCookie(result.sessionId) },
      },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
