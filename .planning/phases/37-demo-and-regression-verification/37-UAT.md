# v1.5 GSD Verify Work

## Scope

Conversational UAT was completed against generated local v1.5 demo data.

## Tests

1. Strategy Workshop opens with a visible Advanced Library.
   - Result: PASS at `http://localhost:3000/`.
2. Completed demo tournament opens and shows standings.
   - Result: PASS at `/ladder/v1-5-demo`.
3. Tournament MatchSet opens as counted replay-backed evidence.
   - Result: PASS at `/matchsets/match-set%3Av1-5%3Atournament%3Aadvanced-eight`.
4. Representative example MatchSet opens.
   - Result: PASS at `/matchsets/match-set%3Av1-5%3Aexample%3Aanti-backstab-stress`.
5. Advanced Strategy card opens without private source.
   - Result: PASS at `/strategies/strategy%3Ademo%3Av1-5%3Acenter-gravity`.
6. Player profile opens and links to Strategy card.
   - Result: PASS at `/players/v15-center-gravity`.
7. Representative replay opens without private data terms.
   - Result: PASS at `/matches/match%3Amatch-set%3Av1-5%3Atournament%3Aadvanced-eight%3A0/replay`.
8. Retuned Advanced Strategies apply the common tactical baseline.
   - Result: PASS. Regenerated evidence contains `0` blocked moves, `0` direct `TURN_TO_STONE`, `0` `MOVED_OFF_BOARD`, and `412` Backstab resolutions across 33 Chronicles.
9. Retuned tournament remains realistic and non-degenerate.
   - Result: PASS. Center Gravity finished 6-1-0; Stonewall Shear and Rear Guard Sentinel finished 5-2-0; no entrant swept the field.

## Outcome

PASS. No UAT gap plans required.
