import type { WorkshopAnalyticsSnapshot } from "@cowards/spec"
import { workshopAnalyticsReadService } from "./workshop-analytics-service-adapter.js"

export const getWorkshopAnalyticsReadData =
  async (): Promise<WorkshopAnalyticsSnapshot> =>
    workshopAnalyticsReadService.getWorkshopAnalyticsSnapshot()
