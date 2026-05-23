import type {
  MatchSetId,
  WorkshopAnalyticsComparisonServiceDto,
  WorkshopTestSummaryServiceDto,
} from "@cowards/spec"
import { workshopReadService } from "./workshop-read-service-adapter.js"

export const getWorkshopTestSummaryRead = async (
  matchSetId: MatchSetId,
): Promise<WorkshopTestSummaryServiceDto | null> =>
  workshopReadService.getWorkshopTestSummary(matchSetId)

export const getWorkshopAnalyticsComparisonRead = async (
  profileId: string,
): Promise<WorkshopAnalyticsComparisonServiceDto | null> =>
  workshopReadService.compareWorkshopAnalyticsRuns(profileId)
