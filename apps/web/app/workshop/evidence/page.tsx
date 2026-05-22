import { getWorkshopInitialData } from "../server.js"
import { EvidenceExplorerClient } from "./evidence-client.js"

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
}: EvidencePageProps) {
  const resolvedSearchParams =
    searchParams === undefined ? undefined : await Promise.resolve(searchParams)
  const initialData = await getWorkshopInitialData()

  return (
    <EvidenceExplorerClient
      initialData={initialData}
      defaultOpponentId={readSingle(resolvedSearchParams?.opponent)}
    />
  )
}
