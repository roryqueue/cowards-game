# v1.27 Code Review

**Reviewer:** GSD code-review agent plus local fix pass
**Status:** Pass after fixes

## Findings Fixed

1. **Replay proof could pass with a blank board.**
   Fixed by adding board proof anchors for Soldier and terrain cell positions and asserting they remain inside `.replay-board-host` on desktop/tablet/mobile.

2. **Privacy scan only checked visible text.**
   Fixed by scanning visible text and rendered HTML. This exposed serialized replay contract privacy markers, which were removed from client props.

3. **Match row tone ignored `publicReason`.**
   Fixed by prioritizing public failure reasons over `status === "complete"` and adding a unit test.

4. **Boundary monitor omitted changed privacy files.**
   Fixed by scanning `evidence-copy.ts` and `replay-unavailable.tsx` plus the broader public-output marker set.

## Residual Risk

No blocker remains. Full web typecheck is not a usable milestone signal until stale workspace `dist` outputs and older unrelated strictness errors are cleaned up.
