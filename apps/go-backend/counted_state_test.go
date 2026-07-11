package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestCompetitionCountedStateParityAllStates(t *testing.T) {
	complete := competitionCountedStateInput{
		ExecutionStatus:     "complete",
		Origin:              "trial",
		ExpectedMatchCount:  2,
		ChronicleMatchCount: 2,
		ScoringAvailable:    true,
	}
	tests := []struct {
		name   string
		input  competitionCountedStateInput
		state  string
		reason string
	}{
		{name: "pending", input: competitionCountedStateInput{ExecutionStatus: "queued", Origin: "trial"}, state: "pending", reason: "incomplete_evidence"},
		{name: "counted", input: complete, state: "counted"},
		{name: "retrying", input: competitionCountedStateInput{ExecutionStatus: "running", Origin: "trial"}, state: "retrying", reason: "incomplete_evidence"},
		{name: "degraded system failure", input: competitionCountedStateInput{ExecutionStatus: "degraded", Origin: "trial"}, state: "degraded_system_failure", reason: "system_failure"},
		{name: "non counted", input: withStoredCountedState(complete, "non_counted"), state: "non_counted", reason: "non_counted"},
		{name: "non competitive", input: competitionCountedStateInput{ExecutionStatus: "complete", Origin: "non_competitive", ExpectedMatchCount: 2, ChronicleMatchCount: 2, ScoringAvailable: true}, state: "non_competitive", reason: "non_competitive"},
		{name: "under review", input: withStoredCountedState(complete, "under_review"), state: "under_review", reason: "governance_hold"},
		{name: "disputed", input: withStoredCountedState(complete, "disputed"), state: "disputed", reason: "disputed"},
		{name: "invalid", input: withStoredCountedState(complete, "invalid"), state: "invalid", reason: "invalid_result"},
		{name: "invalidated", input: withStoredCountedState(complete, "invalidated"), state: "invalidated", reason: "invalidated"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			projection := classifyCompetitionCountedState(test.input)
			if got := stringValue(projection, "state"); got != test.state {
				t.Fatalf("state=%q, want %q: %+v", got, test.state, projection)
			}
			if got := stringValue(projection, "publicReason"); got != test.reason {
				t.Fatalf("reason=%q, want %q: %+v", got, test.reason, projection)
			}
			copy := competitionCountedStatePublicCopy[test.state]
			if stringValue(projection, "publicLabel") != copy.Label || stringValue(projection, "publicExplanation") != copy.Meaning || stringValue(projection, "standingsEffect") != copy.StandingsEffect {
				t.Fatalf("public copy drift for %s: %+v", test.state, projection)
			}
		})
	}
}

func TestCompetitionCountedStateNeverTrustsStoredCountedWithoutCompleteEvidence(t *testing.T) {
	tests := []struct {
		name  string
		input competitionCountedStateInput
	}{
		{name: "execution incomplete", input: competitionCountedStateInput{ExecutionStatus: "queued", StoredState: "counted", Origin: "trial", ExpectedMatchCount: 2, ChronicleMatchCount: 2, ScoringAvailable: true}},
		{name: "no expected Matches", input: competitionCountedStateInput{ExecutionStatus: "complete", StoredState: "counted", Origin: "trial", ScoringAvailable: true}},
		{name: "scoring unavailable", input: competitionCountedStateInput{ExecutionStatus: "complete", StoredState: "counted", Origin: "trial", ExpectedMatchCount: 2, ChronicleMatchCount: 2}},
		{name: "Chronicle coverage incomplete", input: competitionCountedStateInput{ExecutionStatus: "complete", StoredState: "counted", Origin: "trial", ExpectedMatchCount: 2, ChronicleMatchCount: 1, ScoringAvailable: true}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			projection := classifyCompetitionCountedState(test.input)
			if got := stringValue(projection, "state"); got == "counted" {
				t.Fatalf("stored counted bypassed evidence requirements: %+v", projection)
			}
		})
	}
}

func TestCompetitionCountedStateGovernancePrecedence(t *testing.T) {
	input := competitionCountedStateInput{
		ExecutionStatus:     "failed",
		StoredState:         "invalidated",
		ReviewState:         "disputed",
		Origin:              "non_competitive",
		ExpectedMatchCount:  2,
		ChronicleMatchCount: 2,
		ScoringAvailable:    true,
	}
	if got := stringValue(classifyCompetitionCountedState(input), "state"); got != "invalidated" {
		t.Fatalf("invalidated must win precedence, got %q", got)
	}
	input.StoredState = "invalid"
	if got := stringValue(classifyCompetitionCountedState(input), "state"); got != "invalid" {
		t.Fatalf("invalid must win over dispute/origin/failure, got %q", got)
	}
}

func TestLadderStandingsCompetitionEvidenceIsDeterministic(t *testing.T) {
	entries := []map[string]any{
		{"entryId": "entry:b", "strategyRevisionId": "revision:b", "ownerHandle": "b", "displayLabel": "B", "sourceHash": "hash:b"},
		{"entryId": "entry:a", "strategyRevisionId": "revision:a", "ownerHandle": "a", "displayLabel": "A", "sourceHash": "hash:a"},
	}
	build := func(reverse bool) []map[string]any {
		totals := map[string]*matchSetStrategyScore{}
		scores := []matchSetStrategyScore{
			{StrategyRevisionID: "revision:a", Wins: 1, Points: 3, Penalties: []scorePenalty{}},
			{StrategyRevisionID: "revision:b", Losses: 1, Penalties: []scorePenalty{}},
		}
		if reverse {
			scores[0], scores[1] = scores[1], scores[0]
		}
		for _, score := range scores {
			addMatchSetScore(totals, score)
		}
		evidence := map[string]*standingCompetitionEvidence{}
		for _, revisionID := range []string{"revision:a", "revision:b"} {
			item := getStandingCompetitionEvidence(evidence, revisionID)
			item.CountedMatchSetCount = 1
			item.ExcludedMatchSetCount = 1
			item.Availability = []string{"partial", "available"}
			item.ResultLinks["/result:z"] = struct{}{}
			item.ResultLinks["/result:a"] = struct{}{}
			item.ReplayLinks["/replay:z"] = struct{}{}
			item.ReplayLinks["/replay:a"] = struct{}{}
		}
		return ladderStandingsFromScores(totals, entries, evidence)
	}

	left := build(false)
	right := build(true)
	if !reflect.DeepEqual(left, right) {
		leftJSON, _ := json.Marshal(left)
		rightJSON, _ := json.Marshal(right)
		t.Fatalf("recompute is not deterministic:\n%s\n%s", leftJSON, rightJSON)
	}
	competitionEvidence := mapValue(left[0], "competitionEvidence")
	if intValue(competitionEvidence, "countedMatchSetCount") != 1 || intValue(competitionEvidence, "excludedMatchSetCount") != 1 || stringValue(competitionEvidence, "evidenceAvailability") != "partial" {
		t.Fatalf("unexpected competition evidence: %+v", competitionEvidence)
	}
	if got := competitionEvidence["resultLinks"]; !reflect.DeepEqual(got, []string{"/result:a", "/result:z"}) {
		t.Fatalf("result links are not stable: %+v", got)
	}
}

func withStoredCountedState(input competitionCountedStateInput, state string) competitionCountedStateInput {
	input.StoredState = state
	return input
}
