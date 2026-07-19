import { getWorkshopAnalyticsReadData } from "../../../lib/workshop-analytics-service-boundary.js"
import { EvidenceExplorerClient } from "./evidence-client.js"
import type { JSX } from "react"

export const dynamic = "force-dynamic"

interface EvidencePageProps {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>
}

const readSingle = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value)

export default async function EvidencePage({
  searchParams,
}: EvidencePageProps): Promise<JSX.Element> {
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await Promise.resolve(searchParams)
  const analytics = await getWorkshopAnalyticsReadData()

  return (
    <EvidenceExplorerClient
      initialData={{ analytics }}
      defaultOpponentId={readSingle(resolvedSearchParams?.opponent)}
    />
  )
}
