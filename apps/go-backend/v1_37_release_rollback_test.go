package main

import "testing"

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
