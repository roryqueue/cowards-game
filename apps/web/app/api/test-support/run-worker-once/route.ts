const isWorkerTestSupportEnabled = (): boolean =>
  process.env.PLAYWRIGHT_TEST === "1" || process.env.NODE_ENV === "test"

export async function POST(): Promise<Response> {
  if (!isWorkerTestSupportEnabled()) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json(
    {
      error:
        "run-worker-once requires local Postgres/Redis services and is enabled through the service E2E harness.",
      executed: [],
      status: "service_unavailable",
    },
    { status: 503 },
  )
}
