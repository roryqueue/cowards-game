# Phase 43 Plan: Owner Export and Privacy

## Goal
Add owner-safe JSON and CSV exports for gauntlet analytics while preserving public privacy boundaries.

## Tasks
- Add export helpers for JSON full summaries and CSV matchup records.
- Neutralize CSV formula-leading user-controlled values.
- Add API routes for local owner exports.
- Add Workshop and Explorer export controls with concise privacy copy.

## Verification
- Unit tests for CSV escaping/neutralization.
- Privacy audit scans rendered/exported data for forbidden private markers.
