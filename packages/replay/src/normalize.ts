import type { Chronicle } from "@cowards/spec"

export const normalizeChronicle = (chronicle: Chronicle) => ({
  schemaVersion: chronicle.schemaVersion,
  reproducibility: chronicle.reproducibility,
  events: chronicle.events,
  snapshots: chronicle.snapshots,
  ...(chronicle.private === undefined ? {} : { private: chronicle.private }),
})
