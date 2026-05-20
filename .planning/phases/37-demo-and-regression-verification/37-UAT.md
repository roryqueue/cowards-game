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
   - Result: PASS at `/strategies/strategy%3Ademo%3Av1-5%3Astonewall-shear`.
6. Player profile opens and links to Strategy card.
   - Result: PASS at `/players/v15-stonewall-shear`.
7. Representative replay opens without private data terms.
   - Result: PASS at `/matches/match%3Amatch-set%3Av1-5%3Atournament%3Aadvanced-eight%3A0/replay`.

## Outcome

PASS. No UAT gap plans required.
