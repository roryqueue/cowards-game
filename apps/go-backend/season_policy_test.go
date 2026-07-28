package main

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestSeasonLifecycleProjectionParity(t *testing.T) {
	opened := time.Date(2026, 7, 11, 0, 0, 0, 0, time.UTC)
	closed := opened.Add(24 * time.Hour)

	entry := trialSeasonEntryWindow("archived", &opened, &closed)
	if stringValue(entry, "state") != "closed" || stringValue(entry, "publicLabel") != "Counted entries closed" {
		t.Fatalf("unexpected archived entry window: %+v", entry)
	}
	scheduling := trialSeasonSchedulingWindow("scheduling", &closed)
	if stringValue(scheduling, "state") != "open" || stringValue(scheduling, "publicLabel") != "Scheduling frozen entrant snapshots" {
		t.Fatalf("unexpected scheduling window: %+v", scheduling)
	}
	archivedScheduling := trialSeasonSchedulingWindow("archived", &closed)
	if stringValue(archivedScheduling, "state") != "closed" || stringValue(archivedScheduling, "closedAt") == "" {
		t.Fatalf("archived scheduling window lost stable timestamps: %+v", archivedScheduling)
	}
}

func TestSeasonOutcomeProjectionIsHonestAndPublicSafe(t *testing.T) {
	tests := []struct {
		status string
		label  string
	}{
		{"pending", "Outcome pending"},
		{"scheduled", "Scheduled evidence"},
		{"insufficient_evidence", "Insufficient evidence"},
	}
	for _, test := range tests {
		outcome := trialSeasonOutcomeProjection(test.status, nil)
		if stringValue(outcome, "status") != test.status || stringValue(outcome, "publicLabel") != test.label {
			t.Fatalf("unexpected %s outcome: %+v", test.status, outcome)
		}
		serialized, err := json.Marshal(outcome)
		if err != nil {
			t.Fatal(err)
		}
		for _, forbidden := range []string{"strategySource", "strategyMemory", "objectivePayload", "rawDiagnostics", "operatorOnly", "databaseUrl"} {
			if strings.Contains(string(serialized), forbidden) {
				t.Fatalf("Season outcome leaked %s: %s", forbidden, string(serialized))
			}
		}
	}
}

func TestLadderMatchSetSummaryPublishesReplayOnlyWithEvidence(t *testing.T) {
	matchID := "match:season:one"
	withReplay := ladderMatchSetSummary(
		"match-set:season",
		"season:one",
		"complete",
		"counted",
		nil,
		nil,
		[]string{"entry:one"},
		&matchID,
	)
	if stringValue(withReplay, "resultHref") != "/matchsets/match-set%3Aseason" || stringValue(withReplay, "replayHref") != "/matches/match%3Aseason%3Aone/replay" {
		t.Fatalf("stable result/replay links missing: %+v", withReplay)
	}
	withoutReplay := ladderMatchSetSummary("match-set:pending", "season:one", "pending", "pending", nil, nil, nil, nil)
	if _, ok := withoutReplay["replayHref"]; ok {
		t.Fatalf("pending MatchSet must not claim replay evidence: %+v", withoutReplay)
	}
}
