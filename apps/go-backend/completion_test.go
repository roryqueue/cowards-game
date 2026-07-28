package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestGoMatchCompletionFields(t *testing.T) {
	fields, err := deriveGoMatchCompletionFields(completionFinalStateForTest("match:complete:001"))
	if err != nil {
		t.Fatal(err)
	}
	if fields.MatchID != "match:complete:001" || fields.SurvivingSoldiers != 1 || fields.BottomSurvivingSoldiers != 1 || fields.TopSurvivingSoldiers != 0 || fields.SurvivalTurns != 48 {
		t.Fatalf("unexpected completion fields: %+v", fields)
	}
	if fields.WinnerPlayerID == nil || *fields.WinnerPlayerID != "player:bottom:complete:001" {
		t.Fatalf("unexpected winner: %+v", fields.WinnerPlayerID)
	}
}

func candidateConditionIdentityV119ForTest() successorConditionIdentityV119 {
	return successorConditionIdentityV119{
		SemanticAuthorityKey:      "runtime-v1.19",
		MatchSetID:                "match-set:successor",
		MatchID:                   "match:successor",
		ScenarioID:                "set-scenario:sha256:" + strings.Repeat("1", 64),
		ConditionID:               "set-condition:sha256:" + strings.Repeat("2", 64),
		ConditionOrdinal:          0,
		RequestIdentity:           "set-request:sha256:" + strings.Repeat("3", 64),
		SignedRequestSHA256:       "sha256:" + strings.Repeat("4", 64),
		Seed:                      "seed:successor",
		ArenaID:                   "arena:smoke:v1",
		ArenaCatalogVersion:       "canonical-arena-catalog-v1.37",
		ArenaSemanticGeometryHash: "sha256:39aecc22c184660c1c08ab810fbfa3066da1a650b20e91d72a838ed7fb70a0e1",
		SemanticTupleID:           "sha256:37c9a07425d454c74859112debcc3ef362d43e80d5767560d9bde28a3c8d5e73",
		Bottom: successorRevisionRevalidationIdentityV119{
			EntrantKey: "entrant:a", PlayerID: "player:a", StrategyRevisionID: "revision:a",
			RevalidationID: "revalidation:a", RevalidationRoot: "sha256:" + strings.Repeat("7", 64),
		},
		Top: successorRevisionRevalidationIdentityV119{
			EntrantKey: "entrant:b", PlayerID: "player:b", StrategyRevisionID: "revision:b",
			RevalidationID: "revalidation:b", RevalidationRoot: "sha256:" + strings.Repeat("8", 64),
		},
		InitialInitiativeEntrantKey: "entrant:a",
		InitialInitiativePlayerID:   "player:a",
	}
}

func TestCandidateConditionIdentityCompletionV119(t *testing.T) {
	scheduled := candidateConditionIdentityV119ForTest()
	for _, terminalKind := range []string{"success", "player_violation"} {
		terminal := successorConditionTerminalEvidenceV119{successorConditionIdentityV119: scheduled, TerminalKind: terminalKind}
		admitted, err := admitSuccessorConditionTerminalV119(scheduled, terminal)
		if err != nil || admitted.TerminalKind != terminalKind || !reflect.DeepEqual(admitted.Identity, scheduled) {
			t.Fatalf("exact %s terminal was rejected: admitted=%+v err=%v", terminalKind, admitted, err)
		}
	}

	mutations := map[string]func(*successorConditionIdentityV119){
		"condition": func(value *successorConditionIdentityV119) {
			value.ConditionID = "set-condition:sha256:" + strings.Repeat("9", 64)
		},
		"request identity": func(value *successorConditionIdentityV119) {
			value.RequestIdentity = "set-request:sha256:" + strings.Repeat("a", 64)
		},
		"signed request": func(value *successorConditionIdentityV119) {
			value.SignedRequestSHA256 = "sha256:" + strings.Repeat("b", 64)
		},
		"seed": func(value *successorConditionIdentityV119) { value.Seed = "seed:changed" },
		"arena": func(value *successorConditionIdentityV119) {
			value.ArenaSemanticGeometryHash = "sha256:" + strings.Repeat("c", 64)
		},
		"side": func(value *successorConditionIdentityV119) { value.Bottom, value.Top = value.Top, value.Bottom },
		"initiative": func(value *successorConditionIdentityV119) {
			value.InitialInitiativeEntrantKey, value.InitialInitiativePlayerID = value.Top.EntrantKey, value.Top.PlayerID
		},
		"tuple": func(value *successorConditionIdentityV119) {
			value.SemanticTupleID = "sha256:" + strings.Repeat("d", 64)
		},
		"revision":        func(value *successorConditionIdentityV119) { value.Bottom.StrategyRevisionID = "revision:substituted" },
		"revalidation id": func(value *successorConditionIdentityV119) { value.Bottom.RevalidationID = "revalidation:substituted" },
		"revalidation root": func(value *successorConditionIdentityV119) {
			value.Bottom.RevalidationRoot = "sha256:" + strings.Repeat("e", 64)
		},
	}
	for name, mutate := range mutations {
		t.Run(name, func(t *testing.T) {
			changed := scheduled
			mutate(&changed)
			terminal := successorConditionTerminalEvidenceV119{successorConditionIdentityV119: changed, TerminalKind: "success"}
			if _, err := admitSuccessorConditionTerminalV119(scheduled, terminal); err == nil {
				t.Fatal("changed frozen condition identity was admitted")
			}
		})
	}

	for _, terminalKind := range []string{"", "system_failure", "cancelled"} {
		terminal := successorConditionTerminalEvidenceV119{successorConditionIdentityV119: scheduled, TerminalKind: terminalKind}
		if _, err := admitSuccessorConditionTerminalV119(scheduled, terminal); err == nil {
			t.Fatalf("nonterminal class %q was admitted", terminalKind)
		}
	}
}

func TestCandidateCompletionV119UsesClosedSelectionWithoutSemanticAuthority(t *testing.T) {
	for _, current := range []currentSemanticAuthorityGeneratedSelection{
		currentSemanticAuthorityGenerated(),
		simulatedCurrentSemanticAuthorityV119(),
	} {
		selection, root, err := resolveCurrentGoSemanticAuthoritySelection(current)
		if err != nil || selection.SemanticAuthorityKey != current.SemanticAuthorityKey || root == "" {
			t.Fatalf("completion current selection is not closed: current=%+v selection=%+v root=%q err=%v", current, selection, root, err)
		}
	}
	source, err := os.ReadFile("completion.go")
	if err != nil {
		t.Fatal(err)
	}
	body := goFunctionSource(t, string(source), "admitSuccessorConditionTerminalV119")
	for _, forbidden := range []string{"Chronicle", "event", "snapshot", "transition", "gameState", "Strategy"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("candidate completion acquired semantic authority through %q", forbidden)
		}
	}
}

func TestPhase259CurrentV118CompletionHasNoGoChronicleSemanticAuthority(t *testing.T) {
	source, err := os.ReadFile("completion.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	start := strings.Index(text, "func createGoChronicleMetadataV118")
	if start < 0 {
		t.Fatal("v1.18 structural Chronicle completion boundary is missing")
	}
	end := strings.Index(text[start:], "func terminalChronicleOutcome")
	if end < 0 {
		t.Fatal("v1.18 structural Chronicle completion boundary is missing")
	}
	current := text[start : start+end]
	for _, forbidden := range []string{
		"validateGoChronicleShape", "validateChronicleEventSequence",
		"validateChronicleSnapshots", "validateChronicleBoard",
		"terminalChronicleOutcome", "chroniclePlayerIDs",
	} {
		if strings.Contains(current, forbidden) {
			t.Fatalf("v1.18 completion reintroduced Go Chronicle semantics through %q", forbidden)
		}
	}
}

func TestMatchCompletionIntegrityContract(t *testing.T) {
	source, err := os.ReadFile("completion.go")
	if err != nil {
		t.Fatal(err)
	}
	text := string(source)
	lockIndex := strings.Index(text, "lockCompletionIntegrity")
	insertIndex := strings.Index(text, "insert into chronicles")
	if lockIndex < 0 || insertIndex < 0 || lockIndex > insertIndex {
		t.Fatal("completion must lock and compare exact integrity before Chronicle insertion")
	}
	for _, required := range []string{
		"integrity_match_set_id", "compatibility_tuple_id", "compatibility_rules_version",
		"authority_publication_id", "authority_install_receipt_id", "authority_source_manifest_hash",
		"bottom_execution_entrant_key", "top_execution_entrant_key", "execution_evidence_pair_hash",
	} {
		if !strings.Contains(text, required) {
			t.Fatalf("completion omitted Chronicle integrity field %q", required)
		}
	}
}

func TestGoChronicleMetadataValidation(t *testing.T) {
	chronicle := completionChronicleForTest("match:complete:001")
	metadata, err := createGoChronicleMetadata(chronicle)
	if err != nil {
		t.Fatal(err)
	}
	if metadata.MatchID != "match:complete:001" || metadata.EventCount != 4 || metadata.SnapshotCount != 2 || metadata.Outcome == nil || metadata.ID == "" || metadata.Hash == "" {
		t.Fatalf("unexpected metadata: %+v", metadata)
	}
	invalid := completionChronicleForTest("match:private")
	invalidEvents := invalid["events"].([]any)
	invalidEvents[1].(map[string]any)["payload"] = map[string]any{"ownerDebug": "leak"}
	if _, err := createGoChronicleMetadata(invalid); err == nil {
		t.Fatal("expected private marker validation failure")
	}
	ownerPrivate := completionChronicleForTest("match:owner-private")
	ownerPrivate["private"] = map[string]any{"byPlayerId": map[string]any{"player:bottom": map[string]any{"strategyMemory": "PRIVATE_allowed_in_private_section"}}}
	if _, err := createGoChronicleMetadata(ownerPrivate); err != nil {
		t.Fatalf("expected owner-private Chronicle section to persist without public leak failure: %v", err)
	}
	missingTerminal := completionChronicleForTest("match:missing-terminal")
	missingTerminal["snapshots"] = []any{}
	if _, err := createGoChronicleMetadata(missingTerminal); err == nil {
		t.Fatal("expected missing terminal validation failure")
	}
	nonContiguous := completionChronicleForTest("match:non-contiguous")
	nonContiguousEvents := nonContiguous["events"].([]any)
	nonContiguousEvents[2].(map[string]any)["sequence"] = 9
	if _, err := createGoChronicleMetadata(nonContiguous); err == nil {
		t.Fatal("expected non-contiguous event sequence validation failure")
	}
	invalidBoard := completionChronicleForTest("match:invalid-board")
	invalidSnapshots := invalidBoard["snapshots"].([]any)
	invalidSnapshots[0].(map[string]any)["board"] = map[string]any{}
	if _, err := createGoChronicleMetadata(invalidBoard); err == nil {
		t.Fatal("expected invalid board validation failure")
	}
	withIntegrity := completionChronicleForTest("match:hash-parity")
	withIntegrity["integrity"] = map[string]any{"normalizedContentHash": "ignored"}
	withIntegrity["storageMetadata"] = map[string]any{"hostPath": "/Users/private/ignored"}
	hashWithExtra, err := hashChronicleArtifact(withIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	withoutIntegrity := completionChronicleForTest("match:hash-parity")
	hashWithoutExtra, err := hashChronicleArtifact(withoutIntegrity)
	if err != nil {
		t.Fatal(err)
	}
	if hashWithExtra != hashWithoutExtra {
		t.Fatalf("expected Chronicle hash to ignore integrity/storage metadata: %s != %s", hashWithExtra, hashWithoutExtra)
	}
}

func TestGoMatchCompletionIntegration(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for Go completion integration tests")
	}
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	if err := ensurePersistenceSchema(ctx, pool); err != nil {
		t.Fatal(err)
	}

	t.Run("completes atomically with Chronicle", func(t *testing.T) {
		prefix := "phase99-complete"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		defer func() {
			if _, err := pool.Exec(ctx, "delete from match_sets where id = $1", "match-set:"+prefix); err != nil {
				t.Fatal(err)
			}
		}()
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		if _, err := pool.Exec(ctx, "insert into match_sets (id, status, matrix) values ($1, 'pending', '{}'::jsonb)", "match-set:"+prefix); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, "insert into match_set_matches (match_set_id, match_id, matrix_index) values ($1, $2, 0)", "match-set:"+prefix, ids.matchID); err != nil {
			t.Fatal(err)
		}
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:complete")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:complete"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		result, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != ids.matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected completion result: %+v", result)
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "complete", 1, "worker:go:complete", "lease:go:complete")
		assertPhase97MatchStatus(t, ctx, pool, ids.matchID, "complete")
		assertChronicleExists(t, ctx, pool, ids.matchID)
		assertPhase97Attempt(t, ctx, pool, ids.jobID, 1, "complete")
		assertPhase100MatchSetStored(t, ctx, pool, "match-set:"+prefix, matchSetStatusComplete, false, true)

		duplicate, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		})
		if err != nil {
			t.Fatal(err)
		}
		if duplicate.ChronicleID != result.ChronicleID {
			t.Fatalf("duplicate completion returned different Chronicle: %+v", duplicate)
		}
	})

	t.Run("fails closed on invalid lease or invalid Chronicle", func(t *testing.T) {
		prefix := "phase99-invalid"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:invalid")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:invalid"})
		if err != nil {
			t.Fatal(err)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: "wrong-token",
			Chronicle:  completionChronicleForTest(ids.matchID),
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid lease completion to fail")
		}
		invalidChronicle := completionChronicleForTest(ids.matchID)
		invalidChronicle["snapshots"] = []any{}
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  invalidChronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected invalid Chronicle completion to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:invalid", "lease:go:invalid")
	})

	t.Run("rejects a lease for a different Match", func(t *testing.T) {
		prefixA := "phase99-wrong-job-a"
		prefixB := "phase99-wrong-job-b"
		cleanupPhase97Rows(t, ctx, pool, prefixA)
		cleanupPhase97Rows(t, ctx, pool, prefixB)
		defer cleanupPhase97Rows(t, ctx, pool, prefixA)
		defer cleanupPhase97Rows(t, ctx, pool, prefixB)
		idsA := seedPhase97MatchJob(t, ctx, pool, prefixA, 3, "queued", 0, nil)
		idsB := seedPhase97MatchJob(t, ctx, pool, prefixB, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:wrong-job")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:wrong-job"})
		if err != nil {
			t.Fatal(err)
		}
		if claimed.JobID != idsA.jobID {
			t.Fatalf("expected first seeded job to be claimed, got %s", claimed.JobID)
		}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  completionChronicleForTest(idsB.matchID),
			FinalState: completionFinalStateForTest(idsB.matchID),
		}); err == nil {
			t.Fatal("expected wrong-job lease completion to fail")
		}
		assertPhase97MatchStatus(t, ctx, pool, idsB.matchID, "pending")
	})

	t.Run("rejects outcome drift between final state and Chronicle", func(t *testing.T) {
		prefix := "phase99-outcome-drift"
		cleanupPhase97Rows(t, ctx, pool, prefix)
		defer cleanupPhase97Rows(t, ctx, pool, prefix)
		ids := seedPhase97MatchJob(t, ctx, pool, prefix, 3, "queued", 0, nil)
		lifecycle := newTestMatchJobLifecycle(pool, time.Date(2026, 5, 16, 12, 0, 0, 0, time.UTC), "lease:go:outcome-drift")
		claimed, err := lifecycle.claimNextMatchJob(ctx, claimMatchJobInput{WorkerID: "worker:go:outcome-drift"})
		if err != nil {
			t.Fatal(err)
		}
		chronicle := completionChronicleForTest(ids.matchID)
		snapshots := chronicle["snapshots"].([]any)
		snapshots[1].(map[string]any)["outcome"] = map[string]any{"type": "WIN", "winnerPlayerId": "player:top:" + strings.TrimPrefix(ids.matchID, "match:")}
		service := newMatchCompletionService(pool)
		service.allowLegacyTestCompletion = true
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID:      claimed.JobID,
			LeaseToken: claimed.LeaseToken,
			Chronicle:  chronicle,
			FinalState: completionFinalStateForTest(ids.matchID),
		}); err == nil {
			t.Fatal("expected outcome drift to fail")
		}
		assertPhase97Job(t, ctx, pool, ids.jobID, "running", 1, "worker:go:outcome-drift", "lease:go:outcome-drift")
	})
}

func TestMatchCompletionSemanticDatabase(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for semantic completion PostgreSQL proof")
	}
	ctx := context.Background()
	pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
	now := selectedSemanticAuthorityInstantForTest(t, time.Date(2026, 7, 13, 16, 0, 0, 0, time.UTC))
	fixture := seedSemanticCurrentAuthority(t, ctx, pool, now)
	service := newMatchCompletionService(pool)
	service.semanticReceiptSecret = selectedCompletionSemanticReceiptSecretForTest()
	service.successorAuthorityTrustDomain = selectedCompletionSuccessorTrustDomainForTest()
	service.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
	service.now = func() time.Time { return now }

	t.Run("null current receipt is rejected before mutation", func(t *testing.T) {
		current := fixture.seedMatch(t, ctx, pool, "null-receipt")
		before := semanticCompletionSnapshot(t, ctx, pool)
		input := current.input(fixture.identity)
		if input.SemanticReceiptV117 != nil {
			input.SemanticReceiptV117 = nil
		} else {
			input.SemanticReceipt = runtimeSemanticReceipt{}
		}
		if _, err := service.completeMatch(ctx, input); err == nil {
			t.Fatal("current completion persisted without a semantic receipt")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("null receipt rejection mutated rows: before=%s after=%s", before, after)
		}
	})

	for _, forbidden := range []string{"integrity", "storageMetadata"} {
		forbidden := forbidden
		t.Run("forbidden Chronicle "+forbidden+" is rejected before mutation", func(t *testing.T) {
			current := fixture.seedMatch(t, ctx, pool, "forbidden-"+strings.ToLower(forbidden))
			before := semanticCompletionSnapshot(t, ctx, pool)
			input := current.input(fixture.identity)
			input.Chronicle = semanticCloneValue(t, current.chronicle).(map[string]any)
			input.Chronicle[forbidden] = map[string]any{"sha256": "sha256:" + strings.Repeat("a", 64)}
			if _, err := service.completeMatch(ctx, input); err == nil {
				t.Fatalf("current completion admitted Chronicle %s", forbidden)
			}
			after := semanticCompletionSnapshot(t, ctx, pool)
			if !jsonValuesEqual(before, after) {
				t.Fatalf("Chronicle %s rejection mutated rows: before=%s after=%s", forbidden, before, after)
			}
		})
	}

	t.Run("uppercase signature is rejected without mutation and lowercase retry succeeds", func(t *testing.T) {
		current := fixture.seedMatch(t, ctx, pool, "uppercase-signature")
		before := semanticCompletionSnapshot(t, ctx, pool)
		input := current.input(fixture.identity)
		if input.SemanticReceiptV117 != nil {
			input.SemanticReceiptV117.Signature = "hmac-sha256:" + strings.ToUpper(strings.TrimPrefix(input.SemanticReceiptV117.Signature, "hmac-sha256:"))
		} else {
			input.SemanticReceipt.Signature = "hmac-sha256:" + strings.ToUpper(strings.TrimPrefix(input.SemanticReceipt.Signature, "hmac-sha256:"))
		}
		if _, err := service.completeMatch(ctx, input); err == nil {
			t.Fatal("current completion admitted an uppercase semantic receipt signature")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("uppercase signature rejection mutated rows: before=%s after=%s", before, after)
		}
		result, err := service.completeMatch(ctx, current.input(fixture.identity))
		if err != nil {
			t.Fatalf("lowercase retry failed after uppercase rejection: %v", err)
		}
		if result.Status != "complete" || result.MatchID != current.matchID {
			t.Fatalf("unexpected lowercase retry result: %+v", result)
		}
	})

	t.Run("early invalidity leaves canonical rows exact", func(t *testing.T) {
		current := fixture.seedMatch(t, ctx, pool, "early")
		before := semanticCompletionSnapshot(t, ctx, pool)
		tampered := semanticCloneValue(t, current.finalState).(map[string]any)
		tampered["matchId"] = "match:tampered"
		if _, err := service.completeMatch(ctx, completeMatchInput{
			JobID: current.jobID, LeaseToken: current.leaseToken, Chronicle: current.chronicle,
			FinalState: tampered, Integrity: fixture.identity,
		}); err == nil {
			t.Fatal("semantically invalid current state reached completion")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("early semantic failure mutated canonical rows: before=%s after=%s", before, after)
		}
	})

	t.Run("post Chronicle insert failure rolls back exact rows", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "rollback")
		before := semanticCompletionSnapshot(t, ctx, pool)
		if _, err := pool.Exec(ctx, fmt.Sprintf(`
			create function %s() returns trigger language plpgsql as $$
			begin
			  if new.id = %s and new.status = 'complete' then
			    raise exception 'forced semantic completion rollback';
			  end if;
			  return new;
			end $$;
			create trigger %s before update on matches for each row execute function %s()
		`, pgx.Identifier{"reject_semantic_completion"}.Sanitize(), semanticSQLLiteral(candidate.matchID), pgx.Identifier{"reject_semantic_completion"}.Sanitize(), pgx.Identifier{"reject_semantic_completion"}.Sanitize())); err != nil {
			t.Fatal(err)
		}
		if _, err := service.completeMatch(ctx, candidate.input(fixture.identity)); err == nil {
			t.Fatal("forced post-insert failure unexpectedly committed")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("post-insert failure escaped transaction: before=%s after=%s", before, after)
		}
		if _, err := pool.Exec(ctx, "drop trigger reject_semantic_completion on matches; drop function reject_semantic_completion()"); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("exact current input stores one locked Chronicle and is idempotent", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "success")
		result, err := service.completeMatch(ctx, candidate.input(fixture.identity))
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" || result.MatchID != candidate.matchID || result.ChronicleID == "" {
			t.Fatalf("unexpected current completion result: %+v", result)
		}
		first := semanticCompletionSnapshot(t, ctx, pool)
		duplicate, err := service.completeMatch(ctx, candidate.input(fixture.identity))
		if err != nil {
			t.Fatal(err)
		}
		second := semanticCompletionSnapshot(t, ctx, pool)
		if duplicate.ChronicleID != result.ChronicleID || !jsonValuesEqual(first, second) {
			t.Fatalf("current completion was not exact/idempotent: first=%s second=%s duplicate=%+v", first, second, duplicate)
		}
		var tupleID, engine, publicationID string
		if err := pool.QueryRow(ctx, `select compatibility_tuple_id,compatibility_engine_version,authority_publication_id from chronicles where match_id=$1`, candidate.matchID).Scan(&tupleID, &engine, &publicationID); err != nil {
			t.Fatal(err)
		}
		if tupleID != fixture.identity.CompatibilityTupleID || engine != fixture.identity.CompatibilityTuple.Engine || publicationID != fixture.identity.PublicationID {
			t.Fatalf("persisted Chronicle lost locked current identity: %q %q %q", tupleID, engine, publicationID)
		}
		var receipt map[string]any
		var receiptHash string
		if err := pool.QueryRow(ctx, `select runtime_semantic_receipt,runtime_semantic_receipt_hash from chronicles where match_id=$1`, candidate.matchID).Scan(&receipt, &receiptHash); err != nil {
			t.Fatal(err)
		}
		if receipt == nil || !isPrefixedLowerSHA256(receiptHash) {
			t.Fatalf("current completion omitted persisted receipt: receipt=%v hash=%q", receipt, receiptHash)
		}
		if _, err := pool.Exec(ctx, `update chronicles set runtime_semantic_receipt_hash=$1 where match_id=$2`, "sha256:"+strings.Repeat("0", 64), candidate.matchID); err == nil {
			t.Fatal("persisted semantic receipt hash was mutable")
		}
		if _, err := pool.Exec(ctx, "alter table chronicles disable trigger chronicles_runtime_semantic_receipt_immutable"); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `update chronicles set runtime_semantic_receipt_hash=null where match_id=$1`, candidate.matchID); err == nil {
			t.Fatal("receipt all-or-none constraint admitted a one-sided value")
		}
		if _, err := pool.Exec(ctx, "alter table chronicles enable trigger chronicles_runtime_semantic_receipt_immutable"); err != nil {
			t.Fatal(err)
		}
	})

	t.Run("late installed receipt drift leaves gameplay exact", func(t *testing.T) {
		candidate := fixture.seedMatch(t, ctx, pool, "receipt-drift")
		receipt := semanticCurrentReceipt(fixture.identity)
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
			(id,publication_id,event_kind,attempt_id,envelope_sha256,reason_code,receipt,occurred_at)
			values ($1,$2,'uncertain','attempt:late',$3,'RENAME_UNCONFIRMED',$4,$5)`,
			"candidate:event:uncertain", fixture.identity.PublicationID, fixture.identity.EnvelopeSHA256, receipt, now.Add(time.Minute)); err != nil {
			t.Fatal(err)
		}
		before := semanticCompletionSnapshot(t, ctx, pool)
		if _, err := service.completeMatch(ctx, candidate.input(fixture.identity)); err == nil {
			t.Fatal("late installed receipt drift reached completion")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if !jsonValuesEqual(before, after) {
			t.Fatalf("late receipt drift mutated gameplay rows: before=%s after=%s", before, after)
		}
	})
}

func TestPhase259RuntimeServiceV118CompletionIsStructuralAndTransactional(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set COWARDS_GO_BACKEND_TEST_DATABASE_URL for v1.18 completion proof")
	}
	previous := selectedRuntimeServiceContractVersion
	selectedRuntimeServiceContractVersion = func() string { return runtimeExecutionServiceVersionV118 }
	t.Cleanup(func() { selectedRuntimeServiceContractVersion = previous })

	ctx := context.Background()
	pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
	now := selectedSemanticAuthorityInstantForTest(t, time.Time{})
	fixture := seedSemanticCurrentAuthority(t, ctx, pool, now)
	attachConformance := func(
		evidence *goEntrantExecutionEvidence,
		claimed *claimedRuntimeServiceEntrantV117,
	) {
		reference := evidence.ContainmentCertificateRef
		reference.Kind = "conformance"
		reference.CertificateID += ":conformance"
		reference.CertificateRecordHash = hashString(reference.CertificateID)
		evidence.ConformanceCertificateRef = &reference
		evidence.SchedulingDecision.Status = executableLaneEvidenceCounted
		evidence.SchedulingDecision.ReasonCode = "CONFORMANCE_CURRENT"
		id, kind := reference.CertificateID, reference.Kind
		claimed.ConformanceCertificateID = &id
		claimed.ConformanceCertificateKind = &kind
		lane := evidence.LaneIdentity.LanguageID + ":" + evidence.LaneIdentity.AdapterID
		claimed.ConformanceLaneID = &lane
	}
	attachConformance(&fixture.identity.Bottom, &fixture.identity.RuntimeServiceV117.Bottom)
	attachConformance(&fixture.identity.Top, &fixture.identity.RuntimeServiceV117.Top)
	service := newMatchCompletionService(pool)
	service.successorAuthorityTrustDomain = runtimeEvidenceAuthorityFixtureTrustDomain
	service.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
	service.now = func() time.Time { return now }
	service.lockIntegrity = func(_ context.Context, _ pgx.Tx, _ string, _ string, expected *claimedMatchIntegrityIdentity) (*claimedMatchIntegrityIdentity, error) {
		if expected != fixture.identity {
			return nil, errors.New("fixture integrity changed")
		}
		return fixture.identity, nil
	}

	t.Run("hash substitution fails before mutation", func(t *testing.T) {
		current := fixture.seedMatch(t, ctx, pool, "v118-hash-reject")
		before := semanticCompletionSnapshot(t, ctx, pool)
		input := current.input(fixture.identity)
		input.Chronicle = semanticCloneValue(t, input.Chronicle).(map[string]any)
		input.Chronicle["events"].([]any)[0].(map[string]any)["type"] = "SUBSTITUTED"
		if _, err := service.completeMatch(ctx, input); err == nil {
			t.Fatal("v1.18 completion admitted changed Chronicle bytes")
		}
		after := semanticCompletionSnapshot(t, ctx, pool)
		if before != after {
			t.Fatalf("v1.18 early rejection mutated rows: before=%s after=%s", before, after)
		}
	})

	t.Run("authenticated shared admission persists without Go event semantics", func(t *testing.T) {
		current := fixture.seedMatch(t, ctx, pool, "v118-structural")
		input := current.input(fixture.identity)
		input.Chronicle = semanticCloneValue(t, input.Chronicle).(map[string]any)
		events := input.Chronicle["events"].([]any)
		events[0].(map[string]any)["type"] = "SHARED_VALIDATOR_OWNED"
		events[0].(map[string]any)["sequence"] = 900
		snapshots := input.Chronicle["snapshots"].([]any)
		snapshots[0].(map[string]any)["kind"] = "SHARED_RECONSTRUCTION_OWNED"
		claim := input.VerifiedReceiptV118.Claim
		claim.ChronicleCanonicalHash, _ = canonicalCompletionHashV118(input.Chronicle)
		receiptBytes, signed, trustedKey := signRuntimeSemanticReceiptForTestV118(t, claim)
		verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
			ReceiptBytes: receiptBytes, TrustedKey: trustedKey, ExpectedClaim: signed.Claim,
		})
		if failure != nil || verified == nil {
			t.Fatalf("re-signed shared admission fixture failed: %+v", failure)
		}
		input.VerifiedReceiptV118 = verified
		input.ReceiptBytesV118 = receiptBytes
		result, err := service.completeMatch(ctx, input)
		if err != nil {
			t.Fatal(err)
		}
		if result.Status != "complete" {
			t.Fatalf("unexpected v1.18 completion: %+v", result)
		}
		var version, schema string
		if err := pool.QueryRow(ctx, `
			select runtime_semantic_receipt_version,
			       coalesce(
			         runtime_semantic_receipt->>'schemaVersion',
			         runtime_semantic_receipt->'claim'->>'schemaVersion'
			       )
			  from chronicles where match_id=$1
		`, current.matchID).Scan(&version, &schema); err != nil {
			t.Fatal(err)
		}
		if version != runtimeSemanticReceiptSchemaVersionV118 || schema != runtimeSemanticReceiptSchemaVersionV118 {
			t.Fatalf("v1.18 receipt version was not strict: version=%q schema=%q", version, schema)
		}
	})
}

func TestPhase258CompletionRollbackPostgres(t *testing.T) {
	databaseURL := os.Getenv("COWARDS_GO_BACKEND_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Fatal("COWARDS_GO_BACKEND_TEST_DATABASE_URL is required for TestPhase258CompletionRollbackPostgres")
	}
	ctx := context.Background()
	pool := semanticCurrentIsolatedPool(t, ctx, databaseURL)
	now := selectedSemanticAuthorityInstantForTest(t, time.Date(2026, 7, 14, 16, 0, 0, 0, time.UTC))
	fixture := seedSemanticCurrentAuthority(t, ctx, pool, now)
	service := newMatchCompletionService(pool)
	service.semanticReceiptSecret = selectedCompletionSemanticReceiptSecretForTest()
	service.successorAuthorityTrustDomain = selectedCompletionSuccessorTrustDomainForTest()
	service.loadAuthority = func() (*verifiedRuntimeEvidenceAuthority, error) { return fixture.authority, nil }
	service.now = func() time.Time { return now }

	faults := []struct {
		name        string
		table       string
		deferred    bool
		rowSelector func(semanticCurrentMatchFixture) string
	}{
		{name: "after Chronicle", table: "matches", rowSelector: func(candidate semanticCurrentMatchFixture) string {
			return "new.id = " + semanticSQLLiteral(candidate.matchID)
		}},
		{name: "after Match", table: "match_jobs", rowSelector: func(candidate semanticCurrentMatchFixture) string {
			return "new.id = " + semanticSQLLiteral(candidate.jobID)
		}},
		{name: "after job", table: "match_job_attempts", rowSelector: func(candidate semanticCurrentMatchFixture) string {
			return "new.job_id = " + semanticSQLLiteral(candidate.jobID)
		}},
		{name: "after attempt", table: "match_sets", rowSelector: func(candidate semanticCurrentMatchFixture) string {
			return "new.id = " + semanticSQLLiteral(candidate.matchSetID)
		}},
		{name: "at commit", table: "match_job_attempts", deferred: true, rowSelector: func(candidate semanticCurrentMatchFixture) string {
			return "new.job_id = " + semanticSQLLiteral(candidate.jobID)
		}},
	}
	for index, fault := range faults {
		fault := fault
		t.Run("rolls back persistence fault "+fault.name, func(t *testing.T) {
			candidate := fixture.seedMatch(t, ctx, pool, fmt.Sprintf("phase258-fault-%d", index))
			before := semanticCompletionSnapshot(t, ctx, pool)
			functionName := pgx.Identifier{fmt.Sprintf("phase258_fault_%d", index)}.Sanitize()
			triggerName := pgx.Identifier{fmt.Sprintf("phase258_fault_%d", index)}.Sanitize()
			triggerKind := "create trigger " + triggerName + " before update"
			if fault.deferred {
				triggerKind = "create constraint trigger " + triggerName + " after update"
			}
			deferred := ""
			if fault.deferred {
				deferred = " deferrable initially deferred"
			}
			if _, err := pool.Exec(ctx, fmt.Sprintf(`
				create function %s() returns trigger language plpgsql as $$
				begin
				  if %s then
				    raise exception 'forced Phase 258 persistence fault: %s';
				  end if;
				  return new;
				end $$;
				%s on %s%s for each row execute function %s()
			`, functionName, fault.rowSelector(candidate), fault.name, triggerKind, pgx.Identifier{fault.table}.Sanitize(), deferred, functionName)); err != nil {
				t.Fatal(err)
			}
			_, completionErr := service.completeMatch(ctx, candidate.input(fixture.identity))
			if completionErr == nil {
				t.Fatalf("forced persistence fault %s unexpectedly committed", fault.name)
			}
			after := semanticCompletionSnapshot(t, ctx, pool)
			if !jsonValuesEqual(before, after) {
				t.Fatalf("persistence fault %s escaped transaction: before=%s after=%s", fault.name, before, after)
			}
			if _, err := pool.Exec(ctx, fmt.Sprintf("drop trigger %s on %s; drop function %s()", triggerName, pgx.Identifier{fault.table}.Sanitize(), functionName)); err != nil {
				t.Fatal(err)
			}
		})
	}

	drifts := []struct {
		name       string
		triggerSQL func(semanticCurrentMatchFixture, string, string) string
		table      string
	}{
		{
			name:  "Match status after Chronicle",
			table: "chronicles",
			triggerSQL: func(candidate semanticCurrentMatchFixture, functionName string, triggerName string) string {
				return fmt.Sprintf(`
					create function %s() returns trigger language plpgsql as $$
					begin
					  if new.match_id = %s then update matches set status='failed_system' where id=new.match_id; end if;
					  return new;
					end $$;
					create trigger %s after insert on chronicles for each row execute function %s()
				`, functionName, semanticSQLLiteral(candidate.matchID), triggerName, functionName)
			},
		},
		{
			name:  "job status after Match",
			table: "matches",
			triggerSQL: func(candidate semanticCurrentMatchFixture, functionName string, triggerName string) string {
				return fmt.Sprintf(`
					create function %s() returns trigger language plpgsql as $$
					begin
					  if new.id = %s and new.status='complete' then update match_jobs set status='failed_system' where id=%s; end if;
					  return new;
					end $$;
					create trigger %s before update on matches for each row execute function %s()
				`, functionName, semanticSQLLiteral(candidate.matchID), semanticSQLLiteral(candidate.jobID), triggerName, functionName)
			},
		},
		{
			name:  "attempt status after job",
			table: "match_jobs",
			triggerSQL: func(candidate semanticCurrentMatchFixture, functionName string, triggerName string) string {
				return fmt.Sprintf(`
					create function %s() returns trigger language plpgsql as $$
					begin
					  if new.id = %s and new.status='complete' then update match_job_attempts set status='failed_system' where job_id=new.id; end if;
					  return new;
					end $$;
					create trigger %s before update on match_jobs for each row execute function %s()
				`, functionName, semanticSQLLiteral(candidate.jobID), triggerName, functionName)
			},
		},
	}
	for index, drift := range drifts {
		drift := drift
		t.Run("fails closed on late "+drift.name, func(t *testing.T) {
			candidate := fixture.seedMatch(t, ctx, pool, fmt.Sprintf("phase258-drift-%d", index))
			before := semanticCompletionSnapshot(t, ctx, pool)
			functionName := pgx.Identifier{fmt.Sprintf("phase258_drift_%d", index)}.Sanitize()
			triggerName := pgx.Identifier{fmt.Sprintf("phase258_drift_%d", index)}.Sanitize()
			if _, err := pool.Exec(ctx, drift.triggerSQL(candidate, functionName, triggerName)); err != nil {
				t.Fatal(err)
			}
			if _, err := service.completeMatch(ctx, candidate.input(fixture.identity)); err == nil {
				t.Fatalf("late %s was overwritten by completion", drift.name)
			}
			after := semanticCompletionSnapshot(t, ctx, pool)
			if !jsonValuesEqual(before, after) {
				t.Fatalf("late %s escaped rollback: before=%s after=%s", drift.name, before, after)
			}
			if _, err := pool.Exec(ctx, fmt.Sprintf("drop trigger %s on %s; drop function %s()", triggerName, pgx.Identifier{drift.table}.Sanitize(), functionName)); err != nil {
				t.Fatal(err)
			}
		})
	}
}

type semanticCurrentAuthorityFixture struct {
	authority *verifiedRuntimeEvidenceAuthority
	identity  *claimedMatchIntegrityIdentity
	request   runtimeServiceRequest
	nextIndex int
}

func TestPhase258RuntimeServiceV117CompletionAdmissionBindsClaimedEvidence(t *testing.T) {
	nested := validRuntimeServiceRequestForTest()
	nested.Match.MatchID = "match:phase258:v117:completion"
	nested.RequestID = "runtime-request:phase258:v117:completion"
	nestedBytes, err := runtimeInvocationV117CanonicalValue(nested)
	if err != nil {
		t.Fatal(err)
	}
	_, integrity := claimedIntegrityFixture(t, time.Date(2026, 7, 15, 13, 30, 0, 0, time.UTC))
	integrity.CompatibilityTupleID = runtimeSuccessorSemanticTupleIDV117
	integrity.CompatibilityTuple = runtimeSuccessorCanonicalTupleV117
	integrity.Bottom.LaneIdentity.SemanticTupleID = runtimeSuccessorSemanticTupleIDV117
	integrity.Bottom.LaneIdentity.SemanticTuple = runtimeSuccessorCanonicalTupleV117
	integrity.Top.LaneIdentity.SemanticTupleID = runtimeSuccessorSemanticTupleIDV117
	integrity.Top.LaneIdentity.SemanticTuple = runtimeSuccessorCanonicalTupleV117
	integrity.Bottom.StrategyRevisionID = nested.Match.BottomStrategyRevisionID
	integrity.Top.StrategyRevisionID = nested.Match.TopStrategyRevisionID
	binding := claimedRuntimeServiceFixtureV117(integrity)
	integrity.RuntimeServiceV117 = binding
	request := runtimeServiceRequestV117{
		ContractVersion: runtimeExecutionServiceVersionV117, Kind: "executeMatch",
		RequestID: nested.RequestID, MatchID: nested.Match.MatchID,
		CompatibilityTupleID: integrity.CompatibilityTupleID, Match: nestedBytes,
	}
	request.Authority.BundleHash = binding.Authority.BundleHash
	request.Authority.SourceManifestHash = binding.Authority.SourceManifestHash
	request.Authority.RegistryGeneration = binding.Authority.RegistryGeneration
	request.LegacyAuthority.BundleHash = integrity.AuthorityBundleHash
	request.LegacyAuthority.SourceManifestHash = integrity.SourceManifestHash
	request.LegacyAuthority.RegistryGeneration = integrity.RegistryGeneration
	request.Entrants.Bottom = runtimeServiceEntrantFixtureFromClaimedV117(binding.Bottom, "1")
	request.Entrants.Top = runtimeServiceEntrantFixtureFromClaimedV117(binding.Top, "2")
	request.Accounting.BudgetProfileSHA256 = binding.BudgetProfileSHA256
	request.Accounting.LedgerPrestateRoot = binding.LedgerPrestateRoot
	chronicle := orchestratorChronicleForRequest(nested, false)
	finalState := orchestratorFinalStateForRequest(nested)
	response := signedRuntimeServiceSuccessResponseV117ForTest(t, request, chronicle, finalState, "sha256:"+strings.Repeat("8", 64), runtimeServiceV117FixtureSecret)
	input := completeMatchInput{
		Chronicle: chronicle, FinalState: finalState, Integrity: integrity,
		RuntimeRequestV117: &request, SemanticReceiptV117: &response.Result.SemanticReceipt,
	}
	if err := validateVersionedRuntimeSemanticReceiptForCompletion(input, integrity, runtimeServiceV117FixtureSecret); err != nil {
		t.Fatalf("exact v1.17 completion admission failed: %v", err)
	}
	mutated := response.Result.SemanticReceipt
	mutated.LedgerPrestateRoot = "sha256:" + strings.Repeat("9", 64)
	input.SemanticReceiptV117 = &mutated
	if err := validateVersionedRuntimeSemanticReceiptForCompletion(input, integrity, runtimeServiceV117FixtureSecret); err == nil {
		t.Fatal("v1.17 completion admitted a mutated accounting receipt")
	}

	t.Run("rejects a re-signed reconstructed terminal hash substitution", func(t *testing.T) {
		candidate := response.Result.SemanticReceipt
		candidate.ReconstructedTerminalStateHash = "sha256:" + strings.Repeat("9", 64)
		signRuntimeServiceReceiptV117(t, &candidate)
		candidateInput := completeMatchInput{
			Chronicle: chronicle, FinalState: finalState, Integrity: integrity,
			RuntimeRequestV117: &request, SemanticReceiptV117: &candidate,
		}
		if err := validateVersionedRuntimeSemanticReceiptForCompletion(candidateInput, integrity, runtimeServiceV117FixtureSecret); err == nil {
			t.Fatal("v1.17 completion admitted a re-signed reconstructed terminal hash substitution")
		}
	})

	t.Run("rejects re-signed Chronicle terminal state divergence", func(t *testing.T) {
		candidateChronicle := semanticCloneValue(t, chronicle).(map[string]any)
		for _, raw := range candidateChronicle["snapshots"].([]any) {
			snapshot := raw.(map[string]any)
			board := snapshot["board"].(map[string]any)
			bottom := board["soldiers"].([]any)[0].(map[string]any)
			bottom["position"] = map[string]any{"x": 1, "y": 2}
		}
		chronicleBytes, err := runtimeInvocationV117CanonicalValue(candidateChronicle)
		if err != nil {
			t.Fatal(err)
		}
		chronicleHash, err := hashRuntimeServiceCanonicalValueV117("cowards-game:runtime-semantic-chronicle-canonical-json:v1.17", chronicleBytes)
		if err != nil {
			t.Fatal(err)
		}
		candidate := response.Result.SemanticReceipt
		candidate.ChronicleCanonicalHash = chronicleHash
		signRuntimeServiceReceiptV117(t, &candidate)
		candidateInput := completeMatchInput{
			Chronicle: candidateChronicle, FinalState: finalState, Integrity: integrity,
			RuntimeRequestV117: &request, SemanticReceiptV117: &candidate,
		}
		if err := validateVersionedRuntimeSemanticReceiptForCompletion(candidateInput, integrity, runtimeServiceV117FixtureSecret); err == nil {
			t.Fatal("v1.17 completion admitted Chronicle state that diverged from final state")
		}
	})

	t.Run("rejects re-signed final state divergence", func(t *testing.T) {
		candidateFinalState := semanticCloneValue(t, finalState).(map[string]any)
		bottom := candidateFinalState["soldiers"].([]any)[0].(map[string]any)
		bottom["position"] = map[string]any{"x": 1, "y": 2}
		finalStateBytes, err := runtimeInvocationV117CanonicalValue(candidateFinalState)
		if err != nil {
			t.Fatal(err)
		}
		finalStateHash, err := hashRuntimeServiceCanonicalValueV117("cowards-game:runtime-semantic-final-state-canonical-json:v1.17", finalStateBytes)
		if err != nil {
			t.Fatal(err)
		}
		candidate := response.Result.SemanticReceipt
		candidate.FinalStateCanonicalHash = finalStateHash
		signRuntimeServiceReceiptV117(t, &candidate)
		candidateInput := completeMatchInput{
			Chronicle: chronicle, FinalState: candidateFinalState, Integrity: integrity,
			RuntimeRequestV117: &request, SemanticReceiptV117: &candidate,
		}
		if err := validateVersionedRuntimeSemanticReceiptForCompletion(candidateInput, integrity, runtimeServiceV117FixtureSecret); err == nil {
			t.Fatal("v1.17 completion admitted final state that diverged from Chronicle reconstruction")
		}
	})
}

type semanticCurrentMatchFixture struct {
	matchID              string
	matchSetID           string
	jobID                string
	leaseToken           string
	chronicle            map[string]any
	finalState           map[string]any
	semanticReceipt      runtimeSemanticReceipt
	semanticWireEvidence runtimeSemanticWireEvidence
	runtimeRequestV117   *runtimeServiceRequestV117
	semanticReceiptV117  *runtimeSemanticReceiptV117
	runtimeRequestV118   *runtimeServiceRequestV118
	verifiedReceiptV118  *verifiedRuntimeSemanticReceiptV118
	receiptBytesV118     []byte
}

func (current semanticCurrentMatchFixture) input(identity *claimedMatchIntegrityIdentity) completeMatchInput {
	var runtimeRequestV117 *runtimeServiceRequestV117
	if current.runtimeRequestV117 != nil {
		request := *current.runtimeRequestV117
		runtimeRequestV117 = &request
	}
	var semanticReceiptV117 *runtimeSemanticReceiptV117
	if current.semanticReceiptV117 != nil {
		receipt := *current.semanticReceiptV117
		semanticReceiptV117 = &receipt
	}
	return completeMatchInput{
		JobID: current.jobID, LeaseToken: current.leaseToken,
		Chronicle: current.chronicle, FinalState: current.finalState,
		SemanticReceipt:      current.semanticReceipt,
		SemanticWireEvidence: current.semanticWireEvidence.clone(),
		RuntimeRequestV117:   runtimeRequestV117,
		SemanticReceiptV117:  semanticReceiptV117,
		RuntimeRequestV118:   current.runtimeRequestV118,
		VerifiedReceiptV118:  current.verifiedReceiptV118,
		ReceiptBytesV118:     append([]byte(nil), current.receiptBytesV118...),
		Integrity:            identity,
	}
}

func semanticCurrentIsolatedPool(t *testing.T, ctx context.Context, databaseURL string) *pgxpool.Pool {
	t.Helper()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	schema := "semantic_completion_" + strings.ReplaceAll(randomID(), "-", "")
	if _, err := admin.Exec(ctx, "create schema "+pgx.Identifier{schema}.Sanitize()); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = admin.Exec(ctx, "drop schema "+pgx.Identifier{schema}.Sanitize()+" cascade") })
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	config.AfterConnect = func(ctx context.Context, connection *pgx.Conn) error {
		_, err := connection.Exec(ctx, "set search_path to "+pgx.Identifier{schema}.Sanitize())
		return err
	}
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	files, err := filepath.Glob("../../packages/persistence/migrations/*.sql")
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(files)
	for _, file := range files {
		migration, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, string(migration)); err != nil {
			t.Fatalf("migration %s: %v", filepath.Base(file), err)
		}
	}
	return pool
}

func seedSemanticCurrentAuthority(t *testing.T, ctx context.Context, pool *pgxpool.Pool, now time.Time) *semanticCurrentAuthorityFixture {
	fixture, _ := seedSemanticAuthorityFixture(
		t,
		ctx,
		pool,
		now,
		selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV117 ||
			selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV118,
	)
	return fixture
}

func selectedCompletionSemanticReceiptSecretForTest() string {
	if selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV117 ||
		selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV118 {
		return runtimeServiceV117FixtureSecret
	}
	return "fixture-semantic-receipt-secret-v1"
}

func selectedCompletionSuccessorTrustDomainForTest() string {
	if selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV117 {
		return runtimeEvidenceAuthorityFixtureTrustDomain
	}
	return runtimeEvidenceAuthorityProductionTrustDomain
}

func selectedSemanticAuthorityInstantForTest(t *testing.T, legacy time.Time) time.Time {
	t.Helper()
	if selectedRuntimeServiceContractVersion() != runtimeExecutionServiceVersionV117 &&
		selectedRuntimeServiceContractVersion() != runtimeExecutionServiceVersionV118 {
		return legacy
	}
	fixture := loadRuntimeSuccessorAuthorityFixtureV117(t)
	return mustParseFixtureInstantV117(t, fixture.InstallFixture.EvaluationInstant)
}

func seedSemanticSuccessorAuthority(t *testing.T, ctx context.Context, pool *pgxpool.Pool, now time.Time) (*semanticCurrentAuthorityFixture, *goDeploymentLaneRegistry) {
	return seedSemanticAuthorityFixture(t, ctx, pool, now, true)
}

func seedSemanticAuthorityFixture(t *testing.T, ctx context.Context, pool *pgxpool.Pool, now time.Time, successor bool) (*semanticCurrentAuthorityFixture, *goDeploymentLaneRegistry) {
	t.Helper()
	if successor {
		return seedExactSemanticSuccessorAuthorityFixtureV117(t, ctx, pool, now)
	}
	tuple := registeredCompatibilityTuple{TupleID: currentCanonicalTupleID, Tuple: currentCanonicalTuple}
	authority := &verifiedRuntimeEvidenceAuthority{
		AuthorityBundleHash: "sha256:" + strings.Repeat("b", 64), EnvelopeSHA256: "sha256:" + strings.Repeat("c", 64),
		RegistryGeneration: "1", SemanticTupleManifestHash: tuple.TupleID, CompatibilityTuple: tuple,
		TrustDomain: runtimeEvidenceAuthorityProductionTrustDomain,
		Payload: runtimeEvidenceAuthorityPayload{
			RegistryGeneration: "1", IssuedAt: now.Add(-time.Hour).Format(canonicalJSONInstantLayout),
			ValidFrom: now.Add(-time.Hour).Format(canonicalJSONInstantLayout), ValidUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout),
			SemanticTupleManifestHash: tuple.TupleID,
		},
	}
	baseRequest := validRuntimeServiceRequestForTest()
	baseRequest.Match.BottomPlayerID = "candidate:player:bottom"
	baseRequest.Match.TopPlayerID = "candidate:player:top"
	baseRequest.Match.BottomStrategyRevisionID = "candidate:revision:bottom"
	baseRequest.Match.TopStrategyRevisionID = "candidate:revision:top"
	baseRequest.Strategies.Bottom.ID = baseRequest.Match.BottomStrategyRevisionID
	baseRequest.Strategies.Top.ID = baseRequest.Match.TopStrategyRevisionID
	baseRequest.Match.ArenaVariant["id"] = "candidate:arena"
	baseRequest.Match.ArenaVariant["name"] = "Candidate isolated arena"

	if _, err := pool.Exec(ctx, `insert into users(id,display_name) values ('candidate:user','Candidate')`); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into strategies(id,owner_user_id,name) values ('candidate:strategy','candidate:user','Candidate')`); err != nil {
		t.Fatal(err)
	}
	for _, strategy := range []runtimeServiceStrategyRevision{baseRequest.Strategies.Bottom, baseRequest.Strategies.Top} {
		if _, err := pool.Exec(ctx, `insert into strategy_revisions
			(id,strategy_id,source,source_hash,source_bytes,runtime,engine_compatibility,validation,metadata,locked_at)
			values ($1,'candidate:strategy',$2,$3,$4,$5,$6,$7,$8,$9)`, strategy.ID, strategy.Source, strategy.SourceHash, strategy.SourceBytes, strategy.Runtime, strategy.EngineCompatibility, strategy.Validation, strategy.Metadata, now); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into arena_variants(id,name,version,config) values ($1,'Candidate isolated arena','0.1.0',$2)`, baseRequest.Match.ArenaVariant["id"], baseRequest.Match.ArenaVariant); err != nil {
		t.Fatal(err)
	}

	entrants := make([]goEntrantExecutionEvidence, 0, 2)
	attestationIDs := make([]string, 0, 2)
	certificateIDs := make([]string, 0, 2)
	sourceHashes := map[string]string{}
	for index, revisionID := range []string{baseRequest.Match.BottomStrategyRevisionID, baseRequest.Match.TopStrategyRevisionID} {
		lane := goExecutableLaneIdentity{
			ProviderID: "candidate:provider", LanguageID: []string{"typescript", "python"}[index], RuntimeID: "candidate:runtime", RuntimeVersion: "1",
			ToolchainID: "candidate:toolchain", ToolchainVersion: "1", AdapterID: "candidate:adapter", AdapterVersion: "1",
			PolicyID: "candidate:policy", PolicyVersion: "1", CorpusID: "candidate:corpus", CorpusVersion: "1",
			ArtifactID: fmt.Sprintf("candidate:artifact:%d", index), ArtifactSHA256: fmt.Sprintf("%064x", index+10),
			ImplementationID: "candidate:implementation", BuildID: fmt.Sprintf("candidate:build:%d", index),
			SemanticTupleID: tuple.TupleID, SemanticTuple: tuple.Tuple,
		}
		laneHash := hashCreationLaneIdentity(lane)
		attestationID := fmt.Sprintf("candidate:attestation:%d", index)
		certificateID := fmt.Sprintf("candidate:certificate:%d", index)
		attestationHash := fmt.Sprintf("%064x", index+20)
		certificateHash := fmt.Sprintf("%064x", index+30)
		graphHash := fmt.Sprintf("%064x", index+40)
		attestationIDs = append(attestationIDs, attestationID)
		certificateIDs = append(certificateIDs, certificateID)
		sourceHashes[attestationID] = "sha256:" + attestationHash
		sourceHashes[certificateID] = "sha256:" + certificateHash
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_verified_attestations
				(id,attestation_sha256,verification_status,certificate_kind,producer_id,producer_key_id,trust_domain,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,runtime_id,runtime_version,toolchain_id,toolchain_version,adapter_id,adapter_version,artifact_id,artifact_hash,lane_identity_hash,semantic_tuple_id,result_manifest_hash,result_graph_hash,original_evidence_hash,derived_certificate_version,derived_certificate_record_hash,registry_generation,lane_identity,issued_at,valid_until)
				values ($1,$2,'passed','containment','candidate:producer','candidate:key','production','candidate:schema','candidate:command',$3,'candidate:corpus',$3,'candidate:policy',$3,'candidate:runtime','1','candidate:toolchain','1','candidate:adapter','1',$4,$5,$6,$7,$3,$8,$3,'candidate:certificate-v1',$9,'1',$10,$11,$12)`,
			attestationID, attestationHash, strings.Repeat("d", 64), lane.ArtifactID, lane.ArtifactSHA256, laneHash, tuple.TupleID, graphHash, certificateHash, lane, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_certificates
				(id,certificate_kind,certificate_version,certificate_record_hash,certificate_status,verified_attestation_id,verified_attestation_status,producer_id,schema_version,command_id,command_digest,corpus_id,corpus_hash,policy_id,policy_hash,toolchain_id,toolchain_version,artifact_id,artifact_hash,lane_identity_hash,lane_identity,result_graph_hash,registry_generation,issued_at,fresh_until)
				values ($1,'containment','candidate:certificate-v1',$2,'passed',$3,'passed','candidate:producer','candidate:schema','candidate:command',$4,'candidate:corpus',$4,'candidate:policy',$4,'candidate:toolchain','1',$5,$6,$7,$8,$9,'1',$10,$11)`,
			certificateID, certificateHash, attestationID, strings.Repeat("d", 64), lane.ArtifactID, lane.ArtifactSHA256, laneHash, lane, graphHash, now.Add(-time.Hour), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		certificate := runtimeEvidenceAuthorityCertificate{
			Kind: "containment", CertificateID: certificateID, CertificateVersion: "candidate:certificate-v1",
			CertificateRecordHash: "sha256:" + certificateHash, LaneIdentityHash: "sha256:" + laneHash,
		}
		authority.Payload.Certificates = append(authority.Payload.Certificates, certificate)
		entrants = append(entrants, goEntrantExecutionEvidence{
			EntrantKey: fmt.Sprintf("candidate:entrant:%d", index), StrategyRevisionID: revisionID, LaneIdentity: lane,
			ContainmentCertificateRef: creationCertificateSnapshot(runtimeEvidenceCertificateReferenceFor(certificate, "1")),
			SchedulingDecision:        goSchedulingDecision{Status: executableLaneEvidenceExhibitionOnly, ReasonCode: "CONFORMANCE_MISSING", EvaluatedAt: now.Format(canonicalJSONInstantLayout), FreshUntil: now.Add(time.Hour).Format(canonicalJSONInstantLayout), RegistryGeneration: "1"},
		})
	}
	integrity, err := createGoMatchSetIntegrityIdentity(authority, entrants)
	if err != nil {
		t.Fatal(err)
	}
	pair, err := integrity.pair(entrants[0].EntrantKey, entrants[1].EntrantKey, entrants[0].StrategyRevisionID, entrants[1].StrategyRevisionID)
	if err != nil {
		t.Fatal(err)
	}
	sort.Strings(attestationIDs)
	sort.Strings(certificateIDs)
	sourceSet := map[string]any{"attestationIds": attestationIDs, "certificateIds": certificateIDs, "revocationIds": []string{}, "supersessionIds": []string{}, "laneControlIds": []string{}}
	identity := &claimedMatchIntegrityIdentity{
		MatchSetID: "candidate:match-set", CompatibilityTupleID: tuple.TupleID, CompatibilityTuple: tuple.Tuple,
		AuthorityBundleHash: authority.AuthorityBundleHash, RegistryGeneration: "1", EvidenceSetHash: integrity.EvidenceSetHash, PairHash: pair.PairHash,
		PublicationID: "candidate:publication", InstallReceiptID: "candidate:event:installed", PayloadSHA256: authority.AuthorityBundleHash,
		EnvelopeSHA256: authority.EnvelopeSHA256, SourceManifestHash: "sha256:" + strings.Repeat("e", 64), SourceSet: sourceSet,
		Bottom: entrants[0], Top: entrants[1],
	}
	receipt := semanticCurrentReceipt(identity)
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publications
		(id,generation,semantic_tuple_manifest_hash,source_manifest_hash,payload_sha256,envelope_sha256,signer_key_id,trust_domain,issued_at,valid_from,valid_until,payload_bytes,envelope_bytes,attestation_ids,certificate_ids,revocation_ids,supersession_ids,lane_control_ids)
		values ($1,1,$2,$3,$4,$5,'candidate:key',$6,$7,$7,$8,'candidate-payload','candidate-envelope',$9,$10,'[]','[]','[]')`,
		identity.PublicationID, identity.CompatibilityTupleID, identity.SourceManifestHash, identity.PayloadSHA256, identity.EnvelopeSHA256, runtimeEvidenceAuthorityProductionTrustDomain, now.Add(-time.Hour), now.Add(time.Hour), attestationIDs, certificateIDs); err != nil {
		t.Fatal(err)
	}
	for _, sourceID := range attestationIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,attestation_id) values ($1,'attestation',$2,$3,$2)`, identity.PublicationID, sourceID, sourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	for _, sourceID := range certificateIDs {
		if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_sources(publication_id,source_type,source_id,source_record_hash,certificate_id) values ($1,'certificate',$2,$3,$2)`, identity.PublicationID, sourceID, sourceHashes[sourceID]); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := pool.Exec(ctx, `insert into runtime_evidence_authority_publication_events
		(id,publication_id,event_kind,attempt_id,envelope_sha256,receipt,occurred_at)
		values ($1,$2,'installed','attempt:installed',$3,$4,$5)`, identity.InstallReceiptID, identity.PublicationID, identity.EnvelopeSHA256, receipt, now); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_sets
		(id,status,matrix,compatibility_tuple_id,compatibility_rules_version,compatibility_engine_version,compatibility_runtime_abi_version,compatibility_chronicle_version,compatibility_arena_catalog_version,compatibility_set_policy_version,authority_bundle_hash,authority_registry_generation,execution_evidence_set,execution_evidence_set_hash,authority_publication_id,authority_install_receipt_id,authority_payload_sha256,authority_envelope_sha256,authority_source_manifest_hash,authority_source_set)
		values ($1,'running','{}',$2,$3,$4,$5,$6,$7,$8,$9,'1',$10,$11,$12,$13,$14,$15,$16,$17)`,
		identity.MatchSetID, identity.CompatibilityTupleID, tuple.Tuple.Rules, tuple.Tuple.Engine, tuple.Tuple.RuntimeABI, tuple.Tuple.Chronicle, tuple.Tuple.ArenaCatalog, tuple.Tuple.SetPolicy,
		strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), entrants, identity.EvidenceSetHash, identity.PublicationID, identity.InstallReceiptID, identity.PayloadSHA256, identity.EnvelopeSHA256, identity.SourceManifestHash, identity.SourceSet); err != nil {
		t.Fatal(err)
	}
	for _, entrant := range entrants {
		if _, err := pool.Exec(ctx, `insert into match_set_execution_entrants
			(match_set_id,entrant_key,strategy_revision_id,lane_identity,lane_identity_hash,containment_certificate_kind,containment_certificate_id,containment_certificate_version,containment_certificate_hash,scheduling_status,scheduling_reason_code,scheduling_evaluated_at,scheduling_fresh_until,authority_bundle_hash,authority_registry_generation,execution_snapshot)
			values ($1,$2,$3,$4,$5,'containment',$6,$7,$8,'exhibition_only','CONFORMANCE_MISSING',$9,$10,$11,'1',$12)`,
			identity.MatchSetID, entrant.EntrantKey, entrant.StrategyRevisionID, entrant.LaneIdentity, hashCreationLaneIdentity(entrant.LaneIdentity),
			entrant.ContainmentCertificateRef.CertificateID, entrant.ContainmentCertificateRef.CertificateVersion, entrant.ContainmentCertificateRef.CertificateRecordHash,
			now, now.Add(time.Hour), strings.TrimPrefix(identity.AuthorityBundleHash, "sha256:"), entrant); err != nil {
			t.Fatal(err)
		}
	}
	return &semanticCurrentAuthorityFixture{authority: authority, identity: identity, request: baseRequest}, nil
}

func semanticCurrentReceipt(identity *claimedMatchIntegrityIdentity) map[string]any {
	return map[string]any{
		"schemaVersion": "v1.37-runtime-evidence-authority-install-receipt-v1", "generation": identity.RegistryGeneration,
		"payloadSha256": identity.PayloadSHA256, "envelopeSha256": identity.EnvelopeSHA256,
		"sourceManifestHash": identity.SourceManifestHash, "sourceIds": identity.SourceSet,
	}
}

func (fixture *semanticCurrentAuthorityFixture) seedMatch(t *testing.T, ctx context.Context, pool *pgxpool.Pool, suffix string) semanticCurrentMatchFixture {
	t.Helper()
	request := fixture.request
	matchID := "current:match:" + suffix
	seed := "current:seed:" + suffix
	if selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV118 {
		matchID = "match:phase259:" + suffix
		seed = "seed:phase259:" + suffix
	}
	jobID := "candidate:job:" + suffix
	leaseToken := "candidate:lease:" + suffix
	bottomPlayerID := request.Match.BottomPlayerID
	topPlayerID := request.Match.TopPlayerID
	bottomSoldierID := "current:soldier:bottom:" + suffix
	topSoldierID := "current:soldier:top:" + suffix
	outcome := map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}
	board := map[string]any{
		"bounds": map[string]any{"minX": 0, "maxX": 4, "minY": 0, "maxY": 4},
		"soldiers": []any{
			map[string]any{"id": bottomSoldierID, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 3}},
			map[string]any{"id": topSoldierID, "ownerPlayerId": topPlayerID, "status": "FALLEN", "position": map[string]any{"x": 3, "y": 1}},
		},
		"terrainStones": []any{},
	}
	finalState := map[string]any{
		"matchId": matchID, "seed": seed, "phaseNumber": 2, "roundNumber": 3, "activationCount": 4,
		"players": []any{
			map[string]any{"id": bottomPlayerID, "side": "bottom", "strategyRevisionId": request.Match.BottomStrategyRevisionID, "strategyMemory": map[string]any{}},
			map[string]any{"id": topPlayerID, "side": "top", "strategyRevisionId": request.Match.TopStrategyRevisionID, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": bottomSoldierID, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE"},
			map[string]any{"id": topSoldierID, "ownerPlayerId": topPlayerID, "status": "FALLEN"},
		},
		"outcome": outcome,
	}
	chronicle := map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId": matchID, "seed": seed, "arenaVariantId": request.Match.ArenaVariant["id"], "arenaVariantVersion": "0.1.0",
			"strategyRevisionIds": []any{request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID},
			"versions":            map[string]any{"spec": "cowards-rules-v1.4", "engine": "engine-kernel-v1.37-candidate-1", "runtimeJs": "0.1.0", "chronicle": "chronicle-v1.4", "strategyRevision": "0.1.4", "arenaVariant": "0.1.0"},
		},
		"events": []any{
			map[string]any{"type": "MATCH_STARTED", "sequence": 0, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": matchID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 1, "context": map[string]any{"actingPlayerId": bottomPlayerID}, "privacy": "private", "privateRef": "private:event:1", "payload": map[string]any{"playerId": bottomPlayerID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 2, "context": map[string]any{"actingPlayerId": topPlayerID}, "privacy": "private", "privateRef": "private:event:2", "payload": map[string]any{"playerId": topPlayerID}},
			map[string]any{"type": "MATCH_ENDED", "sequence": 3, "context": map[string]any{}, "privacy": "public", "payload": outcome},
		},
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": 3, "context": map[string]any{}, "outcome": outcome, "board": board},
		},
	}
	request.Match.MatchID = matchID
	request.Match.Seed = seed
	request.RequestID = "runtime-request:" + matchID
	request.EvidenceSnapshot.Compatibility = runtimeServiceCompatibilityReference{
		TupleID: fixture.identity.CompatibilityTupleID,
		Tuple:   fixture.identity.CompatibilityTuple,
	}
	request.EvidenceSnapshot.AuthorityBundleHash = fixture.identity.AuthorityBundleHash
	request.EvidenceSnapshot.RegistryGeneration = fixture.identity.RegistryGeneration
	finalState = orchestratorFinalStateForRequest(request)
	chronicle = orchestratorChronicleForRequest(request, false)
	var semanticReceipt runtimeSemanticReceipt
	var semanticWireEvidence runtimeSemanticWireEvidence
	var runtimeRequestV117 *runtimeServiceRequestV117
	var semanticReceiptV117 *runtimeSemanticReceiptV117
	var runtimeRequestV118 *runtimeServiceRequestV118
	var verifiedReceiptV118 *verifiedRuntimeSemanticReceiptV118
	var receiptBytesV118 []byte
	if binding := fixture.identity.RuntimeServiceV117; binding != nil &&
		selectedRuntimeServiceContractVersion() == runtimeExecutionServiceVersionV118 {
		nestedBytes, err := runtimeInvocationV117CanonicalValue(request)
		if err != nil {
			t.Fatal(err)
		}
		source := func(revision runtimeServiceStrategyRevision, evidence goEntrantExecutionEvidence, claimed claimedRuntimeServiceEntrantV117, side string) runtimeCertificateReferenceV118 {
			identity, ok := runtimeServiceSourceIdentityFromPersistedRevisionV117(revision, evidence)
			if !ok || evidence.ConformanceCertificateRef == nil {
				t.Fatal("v1.18 source/certificate fixture unavailable")
			}
			return runtimeCertificateReferenceV118{
				Side: side, CertificateID: evidence.ConformanceCertificateRef.CertificateID,
				CertificateRecordHash: "sha256:" + evidence.ConformanceCertificateRef.CertificateRecordHash,
				RegistryGeneration:    evidence.ConformanceCertificateRef.RegistryGeneration,
				Lane:                  *claimed.ConformanceLaneID,
				FreshUntil:            evidence.SchedulingDecision.FreshUntil,
				SourceIdentity: runtimeCertificateSourceIdentityV118{
					Side: side, StrategyRevisionID: evidence.StrategyRevisionID,
					OriginalSourceSHA256: identity.OriginalSourceSHA256, NormalizedSourceSHA256: identity.NormalizedSourceSHA256,
					ArtifactSHA256: identity.ArtifactSHA256, IdentityManifestRoot: claimed.IdentityManifestRoot,
					EvidenceGraphRoot: claimed.EvidenceGraphRoot, LaneIdentityHash: claimed.LaneIdentityHash,
				},
			}
		}
		currentRequest := runtimeServiceRequestV118{
			ContractVersion: runtimeExecutionServiceVersionV118, Kind: "executeMatch",
			RequestID: request.RequestID, MatchID: request.Match.MatchID,
			SemanticTuple: runtimeSemanticTupleV118{
				TupleID: fixture.identity.CompatibilityTupleID,
				Components: runtimeSemanticTupleComponentsV118{
					Rules: fixture.identity.CompatibilityTuple.Rules, Engine: fixture.identity.CompatibilityTuple.Engine,
					RuntimeABI: fixture.identity.CompatibilityTuple.RuntimeABI, Chronicle: fixture.identity.CompatibilityTuple.Chronicle,
					ArenaCatalog: fixture.identity.CompatibilityTuple.ArenaCatalog, SetPolicy: fixture.identity.CompatibilityTuple.SetPolicy,
				},
			},
			AuthorityGeneration: binding.Authority.RegistryGeneration,
			EvaluationInstant:   fixture.identity.Bottom.SchedulingDecision.EvaluatedAt,
			Match:               nestedBytes,
		}
		currentRequest.CertificateReferences.Bottom = source(request.Strategies.Bottom, fixture.identity.Bottom, binding.Bottom, "bottom")
		currentRequest.CertificateReferences.Top = source(request.Strategies.Top, fixture.identity.Top, binding.Top, "top")
		currentRequest.Accounting.BudgetProfileRoot = binding.BudgetProfileSHA256
		currentRequest.Accounting.LedgerPrestateRoot = binding.LedgerPrestateRoot
		chronicleHash, _ := canonicalCompletionHashV118(chronicle)
		finalHash, _ := canonicalCompletionHashV118(finalState)
		outcomeHash, _ := canonicalCompletionHashV118(finalState["outcome"])
		result := runtimeServiceSuccessResultV118{
			Privacy: "public_receipt", ChronicleCanonicalHash: chronicleHash,
			TransitionTraceRoot:     runtimeInvocationV117SHA256Value([]byte("trace:" + suffix)),
			FinalStateCanonicalHash: finalHash, OutcomeCanonicalHash: outcomeHash,
			Terminal: runtimeSemanticTerminalV118{Status: "complete", Reason: "shared-admission"},
			Accounting: runtimeExecutionAccountingResultV118{
				BudgetProfileRoot: binding.BudgetProfileSHA256, LedgerPrestateRoot: binding.LedgerPrestateRoot,
				LedgerPoststateRoot: runtimeInvocationV117SHA256Value([]byte("ledger-poststate:" + suffix)),
			},
			ResultClass: "success", Ownership: "gameplay", Retryable: false, MutationStatus: "committed",
		}
		claim, err := runtimeServiceExpectedClaimV118(currentRequest, result)
		if err != nil {
			t.Fatalf("%v request=%+v", err, currentRequest)
		}
		receiptBytes, signed, trustedKey := signRuntimeSemanticReceiptForTestV118(t, claim)
		verified, failure := verifyRuntimeSemanticReceiptV118(runtimeSemanticReceiptVerificationInputV118{
			ReceiptBytes: receiptBytes, TrustedKey: trustedKey, ExpectedClaim: signed.Claim,
		})
		if failure != nil || verified == nil {
			t.Fatalf("v1.18 fixture receipt rejected: %+v", failure)
		}
		runtimeRequestV118 = &currentRequest
		verifiedReceiptV118 = verified
		receiptBytesV118 = receiptBytes
	} else if binding := fixture.identity.RuntimeServiceV117; binding != nil {
		nestedBytes, err := runtimeInvocationV117CanonicalValue(request)
		if err != nil {
			t.Fatal(err)
		}
		currentRequest := runtimeServiceRequestV117{
			ContractVersion:      runtimeExecutionServiceVersionV117,
			Kind:                 "executeMatch",
			RequestID:            request.RequestID,
			MatchID:              request.Match.MatchID,
			CompatibilityTupleID: fixture.identity.CompatibilityTupleID,
			Match:                nestedBytes,
		}
		currentRequest.Authority.BundleHash = binding.Authority.BundleHash
		currentRequest.Authority.SourceManifestHash = binding.Authority.SourceManifestHash
		currentRequest.Authority.RegistryGeneration = binding.Authority.RegistryGeneration
		currentRequest.LegacyAuthority.BundleHash = fixture.identity.AuthorityBundleHash
		currentRequest.LegacyAuthority.SourceManifestHash = fixture.identity.SourceManifestHash
		currentRequest.LegacyAuthority.RegistryGeneration = fixture.identity.RegistryGeneration
		currentRequest.Entrants.Bottom = runtimeServiceEntrantFixtureFromClaimedV117(binding.Bottom, "1")
		currentRequest.Entrants.Top = runtimeServiceEntrantFixtureFromClaimedV117(binding.Top, "2")
		currentRequest.Accounting.BudgetProfileSHA256 = binding.BudgetProfileSHA256
		currentRequest.Accounting.LedgerPrestateRoot = binding.LedgerPrestateRoot
		response := signedRuntimeServiceSuccessResponseV117ForTest(
			t,
			currentRequest,
			chronicle,
			finalState,
			runtimeInvocationV117SHA256Value([]byte("ledger-poststate:"+suffix)),
			runtimeServiceV117FixtureSecret,
		)
		runtimeRequestV117 = &currentRequest
		receipt := response.Result.SemanticReceipt
		semanticReceiptV117 = &receipt
	} else {
		signedResult := signedRuntimeServiceSuccessResultForTest(
			t,
			request,
			chronicle,
			finalState,
			selectedCompletionSemanticReceiptSecretForTest(),
		)
		semanticReceipt = signedResult.SemanticReceipt
		semanticWireEvidence = signedResult.SemanticWireEvidence.clone()
	}
	if _, err := pool.Exec(ctx, `insert into matches
		(id,bottom_strategy_revision_id,top_strategy_revision_id,arena_variant_id,seed,status,bottom_player_id,top_player_id,integrity_match_set_id,bottom_execution_entrant_key,top_execution_entrant_key,bottom_execution_evidence,top_execution_evidence,execution_evidence_pair_hash)
		values ($1,$2,$3,$4,$5,'running',$6,$7,$8,$9,$10,$11,$12,$13)`,
		matchID, request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID, request.Match.ArenaVariant["id"], seed,
		request.Match.BottomPlayerID, request.Match.TopPlayerID, fixture.identity.MatchSetID, fixture.identity.Bottom.EntrantKey, fixture.identity.Top.EntrantKey,
		fixture.identity.Bottom, fixture.identity.Top, fixture.identity.PairHash); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_set_matches(match_set_id,match_id,matrix_index) values ($1,$2,$3)`, fixture.identity.MatchSetID, matchID, fixture.nextIndex); err != nil {
		t.Fatal(err)
	}
	fixture.nextIndex++
	if _, err := pool.Exec(ctx, `insert into match_jobs
		(id,match_id,status,attempts,max_attempts,worker_id,lease_token,lease_expires_at,integrity_match_set_id,bottom_execution_entrant_key,top_execution_entrant_key,bottom_execution_evidence,top_execution_evidence,execution_evidence_pair_hash)
		values ($1,$2,'running',1,3,'candidate:worker',$3,now()+interval '5 minutes',$4,$5,$6,$7,$8,$9)`,
		jobID, matchID, leaseToken, fixture.identity.MatchSetID, fixture.identity.Bottom.EntrantKey, fixture.identity.Top.EntrantKey,
		fixture.identity.Bottom, fixture.identity.Top, fixture.identity.PairHash); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `insert into match_job_attempts(id,job_id,attempt_number,worker_id,status) values ($1,$2,1,'candidate:worker','running')`, "candidate:attempt:"+suffix, jobID); err != nil {
		t.Fatal(err)
	}
	return semanticCurrentMatchFixture{
		matchID: matchID, matchSetID: fixture.identity.MatchSetID, jobID: jobID, leaseToken: leaseToken, chronicle: chronicle, finalState: finalState,
		semanticReceipt: semanticReceipt, semanticWireEvidence: semanticWireEvidence,
		runtimeRequestV117: runtimeRequestV117, semanticReceiptV117: semanticReceiptV117,
		runtimeRequestV118: runtimeRequestV118, verifiedReceiptV118: verifiedReceiptV118,
		receiptBytesV118: receiptBytesV118,
	}
}

func semanticCompletionSnapshot(t *testing.T, ctx context.Context, pool *pgxpool.Pool) string {
	t.Helper()
	rows, err := pool.Query(ctx, `
		select tablename
		from pg_tables
		where schemaname = current_schema()
		order by tablename
	`)
	if err != nil {
		t.Fatal(err)
	}
	tables := []string{}
	for rows.Next() {
		var table string
		if err := rows.Scan(&table); err != nil {
			rows.Close()
			t.Fatal(err)
		}
		tables = append(tables, table)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		t.Fatal(err)
	}
	rows.Close()
	snapshot := map[string]any{}
	for _, table := range tables {
		var serialized []byte
		query := fmt.Sprintf(`select coalesce(
			jsonb_agg(to_jsonb(row_data) order by to_jsonb(row_data)::text),
			'[]'::jsonb
		) from (select * from %s) row_data`, pgx.Identifier{table}.Sanitize())
		if err := pool.QueryRow(ctx, query).Scan(&serialized); err != nil {
			t.Fatal(err)
		}
		var tableRows any
		if err := decodeStrictJSONUseNumber(serialized, &tableRows); err != nil {
			t.Fatal(err)
		}
		snapshot[table] = tableRows
	}
	serialized, err := json.Marshal(snapshot)
	if err != nil {
		t.Fatal(err)
	}
	return string(serialized)
}

func semanticSQLLiteral(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}

func completionFinalStateForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	return map[string]any{
		"matchId":         matchID,
		"seed":            "seed:" + matchID,
		"phaseNumber":     2,
		"roundNumber":     3,
		"activationCount": 4,
		"players": []any{
			map[string]any{"id": bottomPlayerID, "side": "bottom", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
			map[string]any{"id": topPlayerID, "side": "top", "strategyRevisionId": "strategy-revision:" + suffix, "strategyMemory": map[string]any{}},
		},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE"},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN"},
		},
		"outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID},
	}
}

func completionChronicleForTest(matchID string) map[string]any {
	suffix := strings.TrimPrefix(matchID, "match:")
	bottomPlayerID := "player:bottom:" + suffix
	topPlayerID := "player:top:" + suffix
	board := map[string]any{
		"bounds": map[string]any{"minX": 0, "maxX": 4, "minY": 0, "maxY": 4},
		"soldiers": []any{
			map[string]any{"id": "soldier:bottom:" + suffix, "ownerPlayerId": bottomPlayerID, "status": "ACTIVE", "position": map[string]any{"x": 1, "y": 3}},
			map[string]any{"id": "soldier:top:" + suffix, "ownerPlayerId": topPlayerID, "status": "FALLEN", "position": map[string]any{"x": 3, "y": 1}},
		},
		"terrainStones": []any{
			map[string]any{"x": 2, "y": 2},
		},
	}
	return map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId":             matchID,
			"seed":                "seed:" + matchID,
			"arenaVariantId":      "arena:" + suffix,
			"arenaVariantVersion": "arena-v1",
			"strategyRevisionIds": []any{"strategy-revision:" + suffix, "strategy-revision:" + suffix},
			"versions":            map[string]any{"spec": "cowards-rules-v1.4", "engine": "0.1.4", "runtimeJs": "0.1.0", "chronicle": "chronicle-v1.4", "strategyRevision": "0.1.0", "arenaVariant": "arena-v1"},
		},
		"events": []any{
			map[string]any{"type": "MATCH_STARTED", "sequence": 0, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": matchID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 1, "context": map[string]any{"actingPlayerId": bottomPlayerID}, "privacy": "private", "privateRef": "private:event:1", "payload": map[string]any{"playerId": bottomPlayerID}},
			map[string]any{"type": "STRATEGY_EVALUATED", "sequence": 2, "context": map[string]any{"actingPlayerId": topPlayerID}, "privacy": "private", "privateRef": "private:event:2", "payload": map[string]any{"playerId": topPlayerID}},
			map[string]any{"type": "MATCH_ENDED", "sequence": 3, "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}},
		},
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": 3, "context": map[string]any{}, "outcome": map[string]any{"type": "WIN", "winnerPlayerId": bottomPlayerID}, "board": board},
		},
	}
}

func assertChronicleExists(t *testing.T, ctx context.Context, pool *pgxpool.Pool, matchID string) {
	t.Helper()
	var count int
	if err := pool.QueryRow(ctx, "select count(*) from chronicles where match_id = $1", matchID).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("expected one Chronicle, got %d", count)
	}
}

func decodeJSONMapForCompletion(t *testing.T, bytes []byte) map[string]any {
	t.Helper()
	var value map[string]any
	if err := json.Unmarshal(bytes, &value); err != nil {
		t.Fatal(err)
	}
	return value
}
