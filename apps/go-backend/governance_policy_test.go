package main

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
	"time"
)

func TestPublicCompetitionGovernanceParityMatrix(t *testing.T) {
	complete := competitionCountedStateInput{
		ExecutionStatus:     "complete",
		Origin:              "trial",
		ExpectedMatchCount:  2,
		ChronicleMatchCount: 2,
		ScoringAvailable:    true,
	}
	tests := []struct {
		name        string
		input       competitionCountedStateInput
		reviewState string
		status      string
		reason      string
	}{
		{name: "clear", input: complete, reviewState: "none", status: "clear"},
		{name: "under review", input: withStoredCountedState(complete, "under_review"), reviewState: "under_review", status: "under_review", reason: "governance_hold"},
		{name: "disputed", input: withStoredCountedState(complete, "disputed"), reviewState: "disputed", status: "disputed", reason: "disputed"},
		{name: "resolved counted", input: complete, reviewState: "resolved", status: "resolved"},
		{name: "non counted", input: withStoredCountedState(complete, "non_counted"), reviewState: "resolved", status: "non_counted", reason: "non_counted"},
		{name: "non competitive", input: competitionCountedStateInput{ExecutionStatus: "complete", Origin: "non_competitive", ExpectedMatchCount: 2, ChronicleMatchCount: 2, ScoringAvailable: true}, reviewState: "none", status: "non_competitive", reason: "non_competitive"},
		{name: "invalid", input: withStoredCountedState(complete, "invalid"), reviewState: "resolved", status: "invalid", reason: "invalid_result"},
		{name: "invalidated", input: withStoredCountedState(complete, "invalidated"), reviewState: "resolved", status: "invalidated", reason: "invalidated"},
	}

	changedAt := time.Date(2026, time.July, 11, 22, 52, 0, 123456789, time.FixedZone("EDT", -4*60*60))
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			countedState := classifyCompetitionCountedState(test.input)
			projection := projectPublicCompetitionGovernance(countedState, test.reviewState, &changedAt, true)
			if got := stringValue(projection, "status"); got != test.status {
				t.Fatalf("status=%q, want %q: %+v", got, test.status, projection)
			}
			if got := stringValue(projection, "publicReason"); got != test.reason {
				t.Fatalf("reason=%q, want %q: %+v", got, test.reason, projection)
			}
			if stringValue(projection, "publicExplanation") != stringValue(countedState, "publicExplanation") {
				t.Fatalf("governance explanation drifted from counted state: %+v", projection)
			}
			if stringValue(projection, "standingsEffect") != stringValue(countedState, "standingsEffect") {
				t.Fatalf("governance standings effect drifted from counted state: %+v", projection)
			}
			if got := stringValue(projection, "changedAt"); got != "2026-07-12T02:52:00.123456789Z" {
				t.Fatalf("changedAt=%q", got)
			}
			if !boolValue(projection, "replayAvailable") {
				t.Fatalf("Chronicle-backed replay was hidden by governance state: %+v", projection)
			}
		})
	}
}

func TestPublicCompetitionGovernanceReplayAvailabilityIsIndependent(t *testing.T) {
	counted := classifyCompetitionCountedState(competitionCountedStateInput{
		ExecutionStatus:     "complete",
		Origin:              "trial",
		ExpectedMatchCount:  1,
		ChronicleMatchCount: 1,
		ScoringAvailable:    true,
	})
	if boolValue(projectPublicCompetitionGovernance(counted, "none", nil, false), "replayAvailable") {
		t.Fatal("counted state invented replay availability without a Chronicle")
	}
	invalidated := classifyCompetitionCountedState(withStoredCountedState(competitionCountedStateInput{
		ExecutionStatus:     "complete",
		Origin:              "trial",
		ExpectedMatchCount:  1,
		ChronicleMatchCount: 1,
		ScoringAvailable:    true,
	}, "invalidated"))
	if !boolValue(projectPublicCompetitionGovernance(invalidated, "resolved", nil, true), "replayAvailable") {
		t.Fatal("invalidated state suppressed Chronicle-backed replay availability")
	}
}

func TestPublicCompetitionGovernanceProjectionIsLeakSafe(t *testing.T) {
	projection := projectPublicCompetitionGovernance(
		classifyCompetitionCountedState(withStoredCountedState(competitionCountedStateInput{Origin: "trial"}, "disputed")),
		"disputed",
		nil,
		false,
	)
	serialized, err := json.Marshal(projection)
	if err != nil {
		t.Fatal(err)
	}
	for _, forbidden := range []string{
		"reporter", "operator", "privateDetail", "privateNote", "reportCount",
		"audit", "recoveryEvidence", "dedupe", "rateLimit", "StrategyMemory",
		"SoldierMemory", "objective", "token", "hostPath", "databaseUrl",
	} {
		if strings.Contains(strings.ToLower(string(serialized)), strings.ToLower(forbidden)) {
			t.Fatalf("public governance projection leaked %q: %s", forbidden, serialized)
		}
	}
}

func TestPublicGovernanceQueriesUseCanonicalEvidenceOnly(t *testing.T) {
	sourceBytes, err := os.ReadFile("live_backend.go")
	if err != nil {
		t.Fatal(err)
	}
	source := string(sourceBytes)
	for _, functionName := range []string{
		"publicPlayerResults",
		"ladderMatchSetsAndStandings",
		"publicMatchSetResult",
	} {
		body := goFunctionSource(t, source, functionName)
		if !strings.Contains(body, "governance_changed_at") {
			t.Fatalf("public governance read %s does not select the canonical public timestamp", functionName)
		}
		for _, forbidden := range []string{
			"competition_reports",
			"competition_governance_audit",
			"reporter_user_id",
			"operator_user_id",
			"private_detail",
			"before_state",
			"after_state",
			"recovery_evidence",
		} {
			if strings.Contains(strings.ToLower(body), strings.ToLower(forbidden)) {
				t.Fatalf("public governance read %s references private source %q", functionName, forbidden)
			}
		}
	}

	routes := goFunctionSource(t, source, "routes")
	for _, forbidden := range []string{"competition-reports", "governance-actions", "admin/governance"} {
		if strings.Contains(strings.ToLower(routes), forbidden) {
			t.Fatalf("Go public-read parity added mutation route %q", forbidden)
		}
	}
}
