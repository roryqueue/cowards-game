package main

import (
	"os"
	"testing"
)

func v137ReleaseRollbackGoScenarioIDs() []string {
	return []string{
		"schedule-and-claim-staleness",
		"completion-transaction-rollback",
		"idempotent-retry",
		"standings-recomputation",
		"runtime-service-exact-rollback",
		"mixed-tuple-rejection",
	}
}

func runV137ReleaseRollbackGoOwners(t *testing.T) {
	t.Helper()
	if os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL") == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required for D-11 release proof")
	}
	owners := []struct {
		name string
		run  func(*testing.T)
	}{
		{"schedule-and-claim-staleness", TestMatchJobLifecycleIntegration},
		{"completion-transaction-rollback", TestPhase258CompletionRollbackPostgres},
		{"idempotent-retry", TestMatchCompletionSemanticDatabase},
		{"standings-recomputation", TestCandidateMatchSetScoringV119MatchesTypeScriptCanonicalVectors},
		{"runtime-service-exact-rollback", TestRuntimeEvidenceAuthorityBootstrapRefreshRestartAndRollback},
		{"mixed-tuple-rejection", TestGoSemanticAuthorityHeadRejectsPendingMixedAndStaleValues},
	}
	for _, owner := range owners {
		owner := owner
		if !t.Run(owner.name, owner.run) {
			t.Fatalf("D-11 Go owner failed: %s", owner.name)
		}
	}
}

func TestV137ReleaseRollback(t *testing.T) {
	want := []string{
		"schedule-and-claim-staleness",
		"completion-transaction-rollback",
		"idempotent-retry",
		"standings-recomputation",
		"runtime-service-exact-rollback",
		"mixed-tuple-rejection",
	}
	if got := v137ReleaseRollbackGoScenarioIDs(); !equalStrings(got, want) {
		t.Fatalf("unexpected D-11 Go scenario inventory: got=%v want=%v", got, want)
	}
	runV137ReleaseRollbackGoOwners(t)
}
