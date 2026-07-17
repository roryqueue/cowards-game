package main

import (
	"encoding/json"
	"reflect"
	"strings"
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

func candidateScoringFixtureV119(t *testing.T) ([]candidateFourConditionMatchV119, []successorMatchScoreInputV119) {
	t.Helper()
	expected, err := generateCandidateFourConditionMatchesV119(
		"runtime-v1.19", "match-set:successor-scoring", "arena:smoke:v1", "seed:successor-scoring",
		candidateSetEntrantV119{EntrantKey: "entrant:a", StrategyRevisionID: "strategy-revision:a", PlayerID: "player:a"},
		candidateSetEntrantV119{EntrantKey: "entrant:b", StrategyRevisionID: "strategy-revision:b", PlayerID: "player:b"},
	)
	if err != nil {
		t.Fatal(err)
	}
	revisionEvidence := func(revisionID, entrantKey, digit string) successorRevisionEvidenceV119 {
		return successorRevisionEvidenceV119{
			StrategyRevisionID:        revisionID,
			ScheduledRevalidationID:   "revalidation:" + entrantKey,
			CurrentRevalidationID:     stringPtr("revalidation:" + entrantKey),
			ScheduledRevalidationRoot: "sha256:" + strings.Repeat(digit, 64),
			CurrentRevalidationRoot:   stringPtr("sha256:" + strings.Repeat(digit, 64)),
		}
	}
	matches := make([]successorMatchScoreInputV119, 0, 4)
	for _, condition := range expected {
		input := matchScoreForTest(matchScoreInput{
			MatchID: condition.ID, BottomStrategyRevisionID: condition.BottomStrategyRevisionID,
			TopStrategyRevisionID:    condition.TopStrategyRevisionID,
			WinnerStrategyRevisionID: stringPtr("strategy-revision:a"),
			BottomSurvivingSoldiers:  2, TopSurvivingSoldiers: 1,
			BottomSurvivalTurns: 10, TopSurvivalTurns: 10,
		})
		terminalKind := "success"
		if condition.ConditionOrdinal == 3 {
			terminalKind = "player_violation"
			input.StrategyFailureRevisionID = stringPtr("strategy-revision:b")
		}
		bottomDigit := "2"
		if condition.BottomEntrantKey == "entrant:b" {
			bottomDigit = "3"
		}
		topDigit := "2"
		if condition.TopEntrantKey == "entrant:b" {
			topDigit = "3"
		}
		matches = append(matches, successorMatchScoreInputV119{
			matchScoreInput: input, SemanticAuthorityKey: "runtime-v1.19",
			ScenarioID: condition.ScenarioID, ConditionID: condition.ConditionID,
			ConditionOrdinal: condition.ConditionOrdinal, RequestIdentity: condition.RequestIdentity,
			BottomEntrantKey: condition.BottomEntrantKey, TopEntrantKey: condition.TopEntrantKey,
			InitialInitiativeEntrantKey: condition.InitialInitiativeEntrantKey,
			TerminalKind:                terminalKind, AttemptNumber: 1,
			BottomRevisionEvidence: revisionEvidence(condition.BottomStrategyRevisionID, condition.BottomEntrantKey, bottomDigit),
			TopRevisionEvidence:    revisionEvidence(condition.TopStrategyRevisionID, condition.TopEntrantKey, topDigit),
		})
	}
	return expected, matches
}

func TestCandidateMatchSetScoringV119MatchesTypeScriptCanonicalVectors(t *testing.T) {
	expectedConditions, matches := candidateScoringFixtureV119(t)
	want, err := scoreSuccessorMatchSetV119(expectedConditions, matches)
	if err != nil || !want.Counted || want.Status != "complete" || want.Degraded || !want.Complete {
		t.Fatalf("exact matrix did not count: score=%+v err=%v", want, err)
	}
	encodedWant, _ := json.Marshal(want)
	for _, permutation := range [][]successorMatchScoreInputV119{
		{matches[3], matches[2], matches[1], matches[0]},
		{matches[2], matches[0], matches[3], matches[1]},
	} {
		got, err := scoreSuccessorMatchSetV119(expectedConditions, permutation)
		encodedGot, _ := json.Marshal(got)
		if err != nil || string(encodedGot) != string(encodedWant) {
			t.Fatalf("completion order changed scoring bytes: got=%s want=%s err=%v", encodedGot, encodedWant, err)
		}
	}
	if len(want.Rankings) != 2 || want.Rankings[1].StrategyRevisionID != "strategy-revision:b" || want.Rankings[1].PenaltyPoints != -1 {
		t.Fatalf("TypeScript player-violation vector drifted: %+v", want.Rankings)
	}
}

func TestCandidateMatchSetScoringV119KeepsInvalidMatricesNonCounted(t *testing.T) {
	expected, matches := candidateScoringFixtureV119(t)
	assertNonCounted := func(name string, candidate []successorMatchScoreInputV119, status string) {
		t.Helper()
		got, err := scoreSuccessorMatchSetV119(expected, candidate)
		if err != nil || got.Counted || got.Status != status || len(got.Rankings) != 0 {
			t.Fatalf("%s matrix counted: score=%+v err=%v", name, got, err)
		}
	}
	assertNonCounted("partial", matches[:3], "pending")
	retryable := append([]successorMatchScoreInputV119(nil), matches...)
	retryable[3].Status, retryable[3].TerminalKind, retryable[3].RetryableSystemFailure = matchStatusFailedSystem, "", true
	assertNonCounted("retryable", retryable, "pending")
	exhausted := append([]successorMatchScoreInputV119(nil), retryable...)
	exhausted[3].RetryableSystemFailure = false
	assertNonCounted("exhausted", exhausted, "degraded")
	revoked := append([]successorMatchScoreInputV119(nil), matches...)
	revoked[0].BottomRevisionEvidence.Revoked = true
	assertNonCounted("revoked", revoked, "pending")
	substituted := append([]successorMatchScoreInputV119(nil), matches...)
	substituted[0].BottomRevisionEvidence.CurrentRevalidationRoot = stringPtr("sha256:" + strings.Repeat("f", 64))
	assertNonCounted("substituted", substituted, "pending")

	for name, counterfeit := range map[string][]successorMatchScoreInputV119{
		"duplicate":  {matches[0], matches[0], matches[2], matches[3]},
		"substitute": append([]successorMatchScoreInputV119{{}}, matches[1:]...),
	} {
		if name == "substitute" {
			counterfeit[0] = matches[0]
			counterfeit[0].ConditionID = "set-condition:sha256:" + strings.Repeat("f", 64)
		}
		if _, err := scoreSuccessorMatchSetV119(expected, counterfeit); err == nil {
			t.Fatalf("%s counterfeit was accepted", name)
		}
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
