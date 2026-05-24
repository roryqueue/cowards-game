package main

import (
	"reflect"
	"testing"
)

func TestGoMatchSetScoringTieBreakers(t *testing.T) {
	score := scoreMatchSet([]matchScoreInput{
		matchScoreForTest(matchScoreInput{
			MatchID:                  "match:1",
			WinnerStrategyRevisionID: stringPtr("strategy-revision:b"),
			SurvivingSoldiers:        1,
			BottomSurvivingSoldiers:  0,
			TopSurvivingSoldiers:     1,
			SurvivalTurns:            10,
			BottomSurvivalTurns:      10,
			TopSurvivalTurns:         10,
		}),
		matchScoreForTest(matchScoreInput{
			MatchID:                  "match:2",
			BottomStrategyRevisionID: "strategy-revision:c",
			TopStrategyRevisionID:    "strategy-revision:d",
			WinnerStrategyRevisionID: stringPtr("strategy-revision:c"),
			SurvivingSoldiers:        2,
			BottomSurvivingSoldiers:  2,
			TopSurvivingSoldiers:     0,
			SurvivalTurns:            8,
			BottomSurvivalTurns:      8,
			TopSurvivalTurns:         8,
		}),
		matchScoreForTest(matchScoreInput{
			MatchID:                  "match:3",
			BottomStrategyRevisionID: "strategy-revision:e",
			TopStrategyRevisionID:    "strategy-revision:f",
			WinnerStrategyRevisionID: stringPtr("strategy-revision:e"),
			SurvivingSoldiers:        2,
			BottomSurvivingSoldiers:  2,
			TopSurvivingSoldiers:     0,
			SurvivalTurns:            12,
			BottomSurvivalTurns:      12,
			TopSurvivalTurns:         12,
		}),
	})

	got := strategyRevisionIDsFromRankings(score.Rankings)
	want := []string{
		"strategy-revision:e",
		"strategy-revision:c",
		"strategy-revision:b",
		"strategy-revision:f",
		"strategy-revision:a",
		"strategy-revision:d",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("unexpected ranking order: got %v want %v", got, want)
	}
}

func TestGoMatchSetScoringSideSpecificSurvivors(t *testing.T) {
	score := scoreMatchSet([]matchScoreInput{
		matchScoreForTest(matchScoreInput{
			BottomStrategyRevisionID: "strategy-revision:a",
			TopStrategyRevisionID:    "strategy-revision:b",
			WinnerStrategyRevisionID: stringPtr("strategy-revision:a"),
			BottomSurvivingSoldiers:  1,
			TopSurvivingSoldiers:     0,
		}),
		matchScoreForTest(matchScoreInput{
			BottomStrategyRevisionID: "strategy-revision:b",
			TopStrategyRevisionID:    "strategy-revision:a",
			WinnerStrategyRevisionID: stringPtr("strategy-revision:b"),
			BottomSurvivingSoldiers:  3,
			TopSurvivingSoldiers:     0,
		}),
	})

	gotOrder := strategyRevisionIDsFromRankings(score.Rankings)
	if !reflect.DeepEqual(gotOrder, []string{"strategy-revision:b", "strategy-revision:a"}) {
		t.Fatalf("unexpected ranking order: %v", gotOrder)
	}
	gotSurvivors := []int{score.Rankings[0].SurvivingSoldiers, score.Rankings[1].SurvivingSoldiers}
	if !reflect.DeepEqual(gotSurvivors, []int{3, 1}) {
		t.Fatalf("unexpected survivor totals: %v", gotSurvivors)
	}
}

func TestGoMatchSetScoringStrategyFailurePenalty(t *testing.T) {
	score := scoreMatchSet([]matchScoreInput{
		matchScoreForTest(matchScoreInput{
			MatchID:                   "match:penalty",
			WinnerStrategyRevisionID:  stringPtr("strategy-revision:a"),
			StrategyFailureRevisionID: stringPtr("strategy-revision:b"),
		}),
	})

	if score.Rankings[0].StrategyRevisionID != "strategy-revision:a" || score.Rankings[0].Points != 3 || len(score.Rankings[0].Penalties) != 0 {
		t.Fatalf("unexpected winner score: %+v", score.Rankings[0])
	}
	failed := score.Rankings[1]
	if failed.StrategyRevisionID != "strategy-revision:b" || failed.Points != -1 || failed.PenaltyPoints != -1 || len(failed.Penalties) != 1 {
		t.Fatalf("unexpected penalty score: %+v", failed)
	}
	if failed.Penalties[0].MatchID != "match:penalty" || failed.Penalties[0].Reason != "strategy_failure" || failed.Penalties[0].Points != -1 {
		t.Fatalf("unexpected penalty entry: %+v", failed.Penalties[0])
	}
}

func TestGoMatchSetScoringFailedSystemDegraded(t *testing.T) {
	score := scoreMatchSet([]matchScoreInput{
		matchScoreForTest(matchScoreInput{Status: matchStatusFailedSystem, MatchID: "match:failed"}),
	})

	if !score.Degraded || score.Complete {
		t.Fatalf("expected degraded incomplete scoring: %+v", score)
	}
	if score.Rankings[0].FailedSystemMatches != 1 || score.Rankings[1].FailedSystemMatches != 1 {
		t.Fatalf("expected failed-system participation for both entrants: %+v", score.Rankings)
	}
	status := determineMatchSetStatus(score, []string{matchStatusComplete, matchStatusFailedSystem})
	if status != matchSetStatusDegraded {
		t.Fatalf("expected degraded status, got %s", status)
	}
}

func TestGoMatchSetStatusParity(t *testing.T) {
	completeScore := scoreMatchSet([]matchScoreInput{
		matchScoreForTest(matchScoreInput{WinnerStrategyRevisionID: stringPtr("strategy-revision:a")}),
	})
	if determineMatchSetStatus(completeScore, []string{matchStatusComplete}) != matchSetStatusComplete {
		t.Fatal("expected complete MatchSet status")
	}
	if determineMatchSetStatus(matchSetScore{}, []string{matchStatusPending}) != matchSetStatusPending {
		t.Fatal("expected pending MatchSet status")
	}
	if determineMatchSetStatus(matchSetScore{}, []string{matchStatusRunning}) != matchSetStatusRunning {
		t.Fatal("expected running MatchSet status")
	}
	if determineMatchSetStatus(matchSetScore{}, []string{matchStatusBlocked}) != matchSetStatusBlocked {
		t.Fatal("expected blocked MatchSet status")
	}
}

func matchScoreForTest(input matchScoreInput) matchScoreInput {
	if input.MatchID == "" {
		input.MatchID = "match:test"
	}
	if input.BottomStrategyRevisionID == "" {
		input.BottomStrategyRevisionID = "strategy-revision:a"
	}
	if input.TopStrategyRevisionID == "" {
		input.TopStrategyRevisionID = "strategy-revision:b"
	}
	if input.Status == "" {
		input.Status = matchStatusComplete
	}
	return input
}

func strategyRevisionIDsFromRankings(rankings []matchSetStrategyScore) []string {
	ids := make([]string, 0, len(rankings))
	for _, ranking := range rankings {
		ids = append(ids, ranking.StrategyRevisionID)
	}
	return ids
}
