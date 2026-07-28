export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * The direct TypeScript Match worker is retired for every purpose. Keep this
 * historical test-support path fail-closed until its callers move to the
 * service-owned Go/runtime-service proof topology.
 */
export const createRunWorkerOnceHandler = () =>
  async (): Promise<Response> =>
    Response.json({ error: "Not found" }, { status: 404 })

export const POST = createRunWorkerOnceHandler()
