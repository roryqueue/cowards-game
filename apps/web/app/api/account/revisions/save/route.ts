import { saveAccountRevisionFromRequest } from "../../../../../lib/account-revision-write-boundary.js"
import { competitiveErrorResponse } from "../../../../competitive/http.js"

export async function POST(request: Request): Promise<Response> {
  try {
    return await saveAccountRevisionFromRequest(request)
  } catch (error) {
    return competitiveErrorResponse(error)
  }
}
