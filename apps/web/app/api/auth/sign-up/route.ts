import { competitiveErrorResponse } from "../../../competitive/http.js"
import { requireSelectedGoBackendClient } from "../../../../lib/account-service-adapter.js"

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    const result = await requireSelectedGoBackendClient(
      "auth/session",
    ).createAccount({
      username: body.username,
      password: body.password,
      handle: body.handle,
      displayName: body.displayName,
    })
    if (!result.body.user || !result.setCookie) {
      throw new Error("Go sign-up returned an invalid session result.")
    }
    return Response.json(
      { user: result.body.user },
      {
        status: 201,
        headers: { "Set-Cookie": result.setCookie },
      },
    )
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
