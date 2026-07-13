package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"os"
	"path/filepath"
	"reflect"
	"sort"
	"strings"
	"testing"
)

type semanticIntegrityExpectedIssue struct {
	Code     string         `json:"code"`
	Path     []any          `json:"path"`
	Metadata map[string]any `json:"metadata"`
}

type semanticIntegrityMutation struct {
	Op    string `json:"op"`
	Path  []any  `json:"path"`
	Value any    `json:"value"`
}

type semanticIntegrityVector struct {
	ID        string                           `json:"id"`
	Scope     string                           `json:"scope"`
	Mutation  *semanticIntegrityMutation       `json:"mutation"`
	Mutations []semanticIntegrityMutation      `json:"mutations"`
	Expected  []semanticIntegrityExpectedIssue `json:"expected"`
}

type semanticIntegrityCorpus struct {
	Profile        string                  `json:"profile"`
	PublicCategory string                  `json:"publicCategory"`
	Ownership      string                  `json:"ownership"`
	FamilyOrder    []string                `json:"familyOrder"`
	Limits         semanticIntegrityLimits `json:"limits"`
	Valid          struct {
		Arena      map[string]any `json:"arena"`
		State      map[string]any `json:"state"`
		Transition map[string]any `json:"transition"`
	} `json:"valid"`
	Vectors    []semanticIntegrityVector `json:"vectors"`
	MultiFault struct {
		ID            string   `json:"id"`
		VectorIDs     []string `json:"vectorIds"`
		ExpectedCodes []string `json:"expectedCodes"`
	} `json:"multiFault"`
}

func loadSemanticIntegrityCorpus(t *testing.T) semanticIntegrityCorpus {
	t.Helper()
	serialized, err := os.ReadFile("../../packages/spec/src/fixtures/semantic-integrity-vectors.json")
	if err != nil {
		t.Fatal(err)
	}
	var corpus semanticIntegrityCorpus
	if err := decodeStrictJSONUseNumber(serialized, &corpus); err != nil {
		t.Fatal(err)
	}
	return corpus
}

func semanticCloneValue(t *testing.T, value any) any {
	t.Helper()
	serialized, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	var clone any
	if err := decodeStrictJSONUseNumber(serialized, &clone); err != nil {
		t.Fatal(err)
	}
	return clone
}

func applySemanticMutation(t *testing.T, root any, mutation semanticIntegrityMutation) {
	t.Helper()
	if len(mutation.Path) == 0 {
		t.Fatal("semantic mutation has an empty path")
	}
	current := root
	for _, segment := range mutation.Path[:len(mutation.Path)-1] {
		if index, numeric := semanticPathInteger(segment); numeric {
			entries, ok := current.([]any)
			if !ok || index < 0 || int(index) >= len(entries) {
				t.Fatalf("semantic mutation array path is invalid: %v", mutation.Path)
			}
			current = entries[index]
			continue
		}
		object, ok := current.(map[string]any)
		if !ok {
			t.Fatalf("semantic mutation object path is invalid: %v", mutation.Path)
		}
		current = object[segment.(string)]
	}
	leaf := mutation.Path[len(mutation.Path)-1]
	object, objectOK := current.(map[string]any)
	if !objectOK {
		t.Fatalf("semantic mutation parent is not an object: %v", mutation.Path)
	}
	key, keyOK := leaf.(string)
	if !keyOK {
		t.Fatalf("semantic mutation leaf is not a key: %v", mutation.Path)
	}
	value := semanticCloneValue(t, mutation.Value)
	if mutation.Op == "append" {
		entries, ok := object[key].([]any)
		if !ok {
			t.Fatalf("semantic append target is not an array: %v", mutation.Path)
		}
		object[key] = append(entries, value)
		return
	}
	if mutation.Op != "set" {
		t.Fatalf("unsupported semantic mutation %q", mutation.Op)
	}
	object[key] = value
}

func semanticMutatedValue(t *testing.T, corpus semanticIntegrityCorpus, vector semanticIntegrityVector) map[string]any {
	t.Helper()
	var base map[string]any
	switch vector.Scope {
	case "arena":
		base = corpus.Valid.Arena
	case "state":
		base = corpus.Valid.State
	default:
		t.Fatalf("vector %s has inapplicable scope %s", vector.ID, vector.Scope)
	}
	value := semanticCloneValue(t, base).(map[string]any)
	mutations := vector.Mutations
	if vector.Mutation != nil {
		mutations = []semanticIntegrityMutation{*vector.Mutation}
	}
	for _, mutation := range mutations {
		applySemanticMutation(t, value, mutation)
	}
	return value
}

func TestSemanticIntegritySharedVectors(t *testing.T) {
	corpus := loadSemanticIntegrityCorpus(t)
	if corpus.Profile != "semantic-integrity-v1" || corpus.PublicCategory != semanticIntegrityPublicCategory || corpus.Ownership != semanticIntegrityOwnership {
		t.Fatalf("unexpected semantic corpus identity: %+v", corpus)
	}
	if !reflect.DeepEqual(corpus.FamilyOrder, semanticIntegrityFamilyOrder) || !reflect.DeepEqual(corpus.Limits, defaultSemanticIntegrityLimits) {
		t.Fatalf("semantic family/limit drift: families=%v limits=%+v", corpus.FamilyOrder, corpus.Limits)
	}
	if len(semanticIntegrityCodeOrder) != 34 {
		t.Fatalf("semantic code vocabulary drifted: %d", len(semanticIntegrityCodeOrder))
	}

	applicable := 0
	for _, vector := range corpus.Vectors {
		if vector.Scope == "transition" {
			continue // Candidate service responses do not contain transition material.
		}
		applicable++
		value := semanticMutatedValue(t, corpus, vector)
		before := semanticCloneValue(t, value)
		var result semanticIntegrityResult
		if vector.Scope == "arena" {
			result = validateGoCanonicalArena(value)
		} else if vector.ID == "arena-start-noncanonical" {
			result = validateGoCanonicalInitialGameState(value)
		} else {
			result = validateGoCanonicalGameState(value)
		}
		if result.OK {
			t.Fatalf("shared vector %s was admitted", vector.ID)
		}
		actual := make([]semanticIntegrityExpectedIssue, 0, len(result.Issues))
		for _, issue := range result.Issues {
			actual = append(actual, semanticIntegrityExpectedIssue{Code: issue.Code, Path: issue.Path, Metadata: issue.Metadata})
		}
		expected := normalizeSemanticExpectedIssues(vector.Expected)
		if !reflect.DeepEqual(actual, expected) {
			t.Fatalf("shared vector %s drifted:\nwant=%#v\n got=%#v", vector.ID, expected, actual)
		}
		if result.Category != corpus.PublicCategory || result.Ownership != corpus.Ownership {
			t.Fatalf("shared vector %s ownership drifted: %+v", vector.ID, result)
		}
		if !reflect.DeepEqual(value, before) {
			t.Fatalf("shared vector %s was mutated by validation", vector.ID)
		}
	}
	if applicable != 21 {
		t.Fatalf("expected every 21 applicable arena/state vectors, got %d", applicable)
	}
}

func normalizeSemanticExpectedIssues(input []semanticIntegrityExpectedIssue) []semanticIntegrityExpectedIssue {
	output := make([]semanticIntegrityExpectedIssue, 0, len(input))
	for _, issue := range input {
		path := make([]any, 0, len(issue.Path))
		for _, segment := range issue.Path {
			if integer, ok := semanticPathInteger(segment); ok {
				path = append(path, int(integer))
			} else {
				path = append(path, segment)
			}
		}
		output = append(output, semanticIntegrityExpectedIssue{Code: issue.Code, Path: path, Metadata: issue.Metadata})
	}
	return output
}

func TestSemanticIntegrityValidStatesAndPurity(t *testing.T) {
	corpus := loadSemanticIntegrityCorpus(t)
	for name, value := range map[string]map[string]any{"arena": corpus.Valid.Arena, "state": corpus.Valid.State} {
		before := semanticCloneValue(t, value)
		result := validateGoCanonicalGameState(value)
		if name == "arena" {
			result = validateGoCanonicalArena(value)
		}
		if !result.OK {
			t.Fatalf("valid %s rejected: %+v", name, result)
		}
		if !reflect.DeepEqual(before, value) {
			t.Fatalf("valid %s mutated", name)
		}
	}
	if result := validateGoCanonicalInitialGameState(corpus.Valid.State); !result.OK {
		t.Fatalf("valid initial state rejected: %+v", result)
	}
	stoned := semanticCloneValue(t, corpus.Valid.State).(map[string]any)
	stonedSoldier := stoned["soldiers"].([]any)[0].(map[string]any)
	stonedSoldier["status"] = "STONE"
	if result := validateGoCanonicalGameState(stoned); !result.OK {
		t.Fatalf("facing-preserving STONE state rejected: %+v", result)
	}
	fallen := semanticCloneValue(t, corpus.Valid.State).(map[string]any)
	fallenSoldier := fallen["soldiers"].([]any)[0].(map[string]any)
	fallenSoldier["status"] = "FALLEN"
	fallenSoldier["position"] = nil
	if result := validateGoCanonicalGameState(fallen); !result.OK {
		t.Fatalf("facing-preserving FALLEN state rejected: %+v", result)
	}
}

func TestSemanticIntegrityBoundsOrderAndPermutations(t *testing.T) {
	issues := make([]semanticIntegrityIssue, 0, 24)
	for index := 0; index < 24; index++ {
		issues = append(issues, semanticIssue(
			"POSITION_OUT_OF_BOUNDS",
			[]any{"soldiers", index, "position", strings.Repeat("é", 200), "tail-1", "tail-2", "tail-3", "tail-4", "tail-5"},
			map[string]any{"side": "bottom", "actual": strings.Repeat("é", 100), "expected": "inside", "count": index, "rule": "position", "hostPath": "/Users/private/source"},
		))
	}
	forward := createSemanticIntegrityResult(issues)
	reverseInput := append([]semanticIntegrityIssue(nil), issues...)
	for left, right := 0, len(reverseInput)-1; left < right; left, right = left+1, right-1 {
		reverseInput[left], reverseInput[right] = reverseInput[right], reverseInput[left]
	}
	reverse := createSemanticIntegrityResult(reverseInput)
	if !reflect.DeepEqual(forward, reverse) || !forward.Truncated || len(forward.Issues) != 16 {
		t.Fatalf("bounded semantic issue result drifted: forward=%+v reverse=%+v", forward, reverse)
	}
	for _, issue := range forward.Issues {
		if len(issue.Path) > 8 || len(issue.Metadata) > 4 {
			t.Fatalf("semantic issue exceeded caps: %+v", issue)
		}
		if _, leaked := issue.Metadata["hostPath"]; leaked {
			t.Fatalf("semantic metadata leaked unsafe key: %+v", issue.Metadata)
		}
	}
	numericBeforeString := createSemanticIntegrityResult([]semanticIntegrityIssue{
		semanticIssue("TRANSITION_HASH_MISMATCH", []any{"events", "10"}, nil),
		semanticIssue("TRANSITION_HASH_MISMATCH", []any{"events", 10}, nil),
		semanticIssue("TRANSITION_HASH_MISMATCH", []any{"events", "é"}, nil),
		semanticIssue("TRANSITION_HASH_MISMATCH", []any{"events", "z"}, nil),
	})
	if numericBeforeString.Issues[0].Path[1] != 10 || numericBeforeString.Issues[1].Path[1] != "10" || numericBeforeString.Issues[2].Path[1] != "z" {
		t.Fatalf("numeric/code-point path order drifted: %+v", numericBeforeString.Issues)
	}
}

func TestSemanticIntegrityGoASTNoScheduler(t *testing.T) {
	violations, err := findGoGameplaySchedulers(".")
	if err != nil {
		t.Fatal(err)
	}
	if len(violations) != 0 {
		t.Fatalf("Go gameplay scheduler detected: %v", violations)
	}
}

func gameplaySchedulerIdentifier(name string) bool {
	lower := strings.ToLower(name)
	for _, operation := range []string{"run", "step", "resolve", "advance", "schedule"} {
		if !strings.Contains(lower, operation) {
			continue
		}
		for _, boundary := range []string{"phase", "round", "cycle", "activation", "contraction"} {
			if strings.Contains(lower, boundary) {
				return true
			}
		}
	}
	return false
}

func findGoGameplaySchedulers(root string) ([]string, error) {
	violations := []string{}
	err := filepath.WalkDir(root, func(path string, entry os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		source, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, source, 0)
		if err != nil {
			return err
		}
		ast.Inspect(file, func(node ast.Node) bool {
			name := ""
			switch typed := node.(type) {
			case *ast.FuncDecl:
				name = typed.Name.Name
			case *ast.CallExpr:
				switch called := typed.Fun.(type) {
				case *ast.Ident:
					name = called.Name
				case *ast.SelectorExpr:
					name = called.Sel.Name
				}
			}
			if gameplaySchedulerIdentifier(name) {
				violations = append(violations, path+":"+name)
			}
			return true
		})
		return nil
	})
	sort.Strings(violations)
	return violations, err
}

func TestSemanticIntegrityGoASTSchedulerGuardMutations(t *testing.T) {
	tests := []struct {
		name       string
		relative   string
		source     string
		violations int
	}{
		{"recursive internal", "internal/gameplay.go", "package internal\nfunc advanceRound() {}\n", 1},
		{"activation alias", "scheduler.go", "package guard\nfunc scheduleActivation() {}\n", 1},
		{"call alias", "caller.go", "package guard\nfunc f() { resolveContraction() }\nfunc resolveContraction() {}\n", 2},
		{"service Match job", "jobs.go", "package guard\nfunc scheduleMatchJob() {}\n", 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			root := t.TempDir()
			path := filepath.Join(root, test.relative)
			if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
				t.Fatal(err)
			}
			if err := os.WriteFile(path, []byte(test.source), 0o600); err != nil {
				t.Fatal(err)
			}
			violations, err := findGoGameplaySchedulers(root)
			if err != nil {
				t.Fatal(err)
			}
			if len(violations) != test.violations {
				t.Fatalf("scheduler guard drifted: got %v", violations)
			}
		})
	}
}

func TestSemanticIntegrityVocabularyMatchesSharedCorpus(t *testing.T) {
	corpus := loadSemanticIntegrityCorpus(t)
	known := map[string]bool{}
	for _, code := range semanticIntegrityCodeOrder {
		known[code] = true
	}
	for _, vector := range corpus.Vectors {
		for _, expected := range vector.Expected {
			if !known[expected.Code] {
				t.Fatalf("shared vector %s uses unknown code %s", vector.ID, expected.Code)
			}
		}
	}
	ordered := append([]string(nil), semanticIntegrityCodeOrder...)
	sort.Strings(ordered)
	for index := 1; index < len(ordered); index++ {
		if ordered[index] == ordered[index-1] {
			t.Fatalf("duplicate semantic code %s", ordered[index])
		}
	}
}

func TestRuntimeServiceCandidateSemanticRoutingAndStrictBytes(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	requestBefore, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}
	response := candidateRuntimeResponseForTest(t, request)
	serialized, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(request, serialized)
	if failure != nil {
		t.Fatalf("exact candidate response rejected: %s", runtimeServiceFailureJSONSafe(failure))
	}
	if decoded == nil || decoded.Profile != "candidate_exhibition" || decoded.CandidateEvidence == nil || !decoded.OK || decoded.Counted || decoded.Publishable {
		t.Fatalf("candidate response routed incorrectly: %+v", decoded)
	}
	if decoded.Compatibility == nil || !semanticTupleExact(*decoded.Compatibility) {
		t.Fatalf("candidate response lost exact tuple: %+v", decoded.Compatibility)
	}
	requestAfter, err := json.Marshal(request)
	if err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(requestBefore, requestAfter) {
		t.Fatal("candidate validation mutated the request")
	}
	if strings.Contains(string(serialized), "transitions") {
		t.Fatal("candidate response fixture fabricated unavailable transition material")
	}

	tests := []struct {
		name   string
		mutate func([]byte) []byte
	}{
		{"duplicate key", func(input []byte) []byte {
			return append([]byte(`{"ok":true,`), input[1:]...)
		}},
		{"unknown top field", func(input []byte) []byte {
			return []byte(strings.Replace(string(input), `{"compatibility":`, `{"unexpected":true,"compatibility":`, 1))
		}},
		{"trailing JSON", func(input []byte) []byte { return append(append([]byte(nil), input...), []byte(` {}`)...) }},
		{"invalid UTF-8", func(input []byte) []byte { return append(append([]byte(nil), input...), 0xff) }},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, failure := decodeRuntimeServiceResponseBytes(request, test.mutate(serialized))
			if failure == nil || (!strings.Contains(failure.ErrorClass, "Malformed") && failure.ErrorClass != "RuntimeServiceSemanticIntegrity") || !failure.Retryable {
				t.Fatalf("strict candidate bytes were admitted: %+v", failure)
			}
			assertRuntimeServiceFailureSafe(t, failure)
		})
	}

	t.Run("partial and mixed tuple", func(t *testing.T) {
		for _, mutate := range []func(map[string]any){
			func(value map[string]any) { delete(mapValue(mapValue(value, "compatibility"), "tuple"), "setPolicy") },
			func(value map[string]any) {
				mapValue(value, "compatibility")["tupleId"] = request.EvidenceSnapshot.Compatibility.TupleID
			},
			func(value map[string]any) { mapValue(mapValue(value, "compatibility"), "tuple")["engine"] = "0.1.4" },
		} {
			invalid := semanticCloneValue(t, response).(map[string]any)
			mutate(invalid)
			bytes, _ := json.Marshal(invalid)
			_, failure := decodeRuntimeServiceResponseBytes(request, bytes)
			if failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" || !failure.Retryable {
				t.Fatalf("partial/mixed candidate tuple was admitted: %+v", failure)
			}
			assertRuntimeServiceFailureSafe(t, failure)
		}
	})

	t.Run("unsafe integer and unknown final field", func(t *testing.T) {
		for _, mutate := range []func(map[string]any){
			func(value map[string]any) {
				mapValue(value, "result")["runtimeViolationEventCount"] = json.Number("9007199254740992")
			},
			func(value map[string]any) {
				mapValue(mapValue(value, "result"), "finalState")["hostState"] = "not canonical"
			},
			func(value map[string]any) {
				soldiers := sliceValue(mapValue(mapValue(value, "result"), "finalState"), "soldiers")
				soldiers[0].(map[string]any)["lastSuccessfulMoveDirection"] = "NORTH"
			},
			func(value map[string]any) {
				soldiers := sliceValue(mapValue(mapValue(value, "result"), "finalState"), "soldiers")
				soldiers[0].(map[string]any)["lastSuccessfulMoveDirection"] = map[string]any{"direction": "UP"}
			},
		} {
			invalid := semanticCloneValue(t, response).(map[string]any)
			mutate(invalid)
			bytes, _ := json.Marshal(invalid)
			_, failure := decodeRuntimeServiceResponseBytes(request, bytes)
			if failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" {
				t.Fatalf("unsafe candidate value was admitted: %+v", failure)
			}
		}
	})
}

func TestRuntimeServiceCandidateSemanticIdentityAndAgreement(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	base := candidateRuntimeResponseForTest(t, request)
	for name, mutate := range map[string]func(map[string]any){
		"request identity": func(value map[string]any) { value["matchId"] = "match:other" },
		"final identity": func(value map[string]any) {
			mapValue(mapValue(value, "result"), "finalState")["matchId"] = "match:other"
		},
		"outcome": func(value map[string]any) {
			mapValue(value, "result")["outcome"] = map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID}
		},
		"terminal hash": func(value map[string]any) {
			mapValue(value, "result")["terminalStateHash"] = "sha256:" + strings.Repeat("0", 64)
		},
		"terminal Chronicle": func(value map[string]any) {
			snapshots := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "snapshots")
			mapValue(snapshots[len(snapshots)-1].(map[string]any), "board")["terrainStones"] = []any{map[string]any{"x": 1, "y": 1}}
		},
	} {
		t.Run(name, func(t *testing.T) {
			invalid := semanticCloneValue(t, base).(map[string]any)
			mutate(invalid)
			bytes, _ := json.Marshal(invalid)
			_, failure := decodeRuntimeServiceResponseBytes(request, bytes)
			if failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" || !failure.Retryable {
				t.Fatalf("candidate %s drift was admitted: %+v", name, failure)
			}
			if failure.Details["status"] != semanticIntegrityPublicCategory {
				t.Fatalf("candidate failure was not bounded semantic evidence: %+v", failure)
			}
			assertRuntimeServiceFailureSafe(t, failure)
		})
	}
}

func TestRuntimeServiceCandidateChronicleGrammarRejectsDrift(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	base := candidateRuntimeResponseForTest(t, request)
	tests := map[string]func(map[string]any){
		"unknown event": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[1].(map[string]any)["type"] = "BOGUS"
		},
		"duplicate Match start": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[1] = semanticCloneValue(t, events[0])
			events[1].(map[string]any)["sequence"] = 1
		},
		"duplicate Match end": func(value map[string]any) {
			chronicle := mapValue(mapValue(value, "result"), "chronicle")
			events := sliceValue(chronicle, "events")
			duplicate := semanticCloneValue(t, events[len(events)-1]).(map[string]any)
			duplicate["sequence"] = len(events)
			chronicle["events"] = append(events, duplicate)
		},
		"unknown event key": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[1].(map[string]any)["hostState"] = true
		},
		"missing required Round": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[1].(map[string]any)["type"] = "STRATEGY_EVALUATED"
			events[1].(map[string]any)["payload"] = map[string]any{"playerId": request.Match.BottomPlayerID}
		},
		"context mismatch": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[2].(map[string]any)["context"].(map[string]any)["roundNumber"] = 2
		},
		"privacy mismatch": func(value map[string]any) {
			events := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "events")
			events[2].(map[string]any)["privacy"] = "public"
		},
		"unreferenced private": func(value map[string]any) {
			chronicle := mapValue(mapValue(value, "result"), "chronicle")
			byPlayer := mapValue(mapValue(chronicle, "private"), "byPlayerId")
			byPlayer[request.Match.BottomPlayerID].(map[string]any)["private:event:999"] = map[string]any{}
		},
		"duplicate terminal": func(value map[string]any) {
			chronicle := mapValue(mapValue(value, "result"), "chronicle")
			snapshots := sliceValue(chronicle, "snapshots")
			chronicle["snapshots"] = append(snapshots, semanticCloneValue(t, snapshots[len(snapshots)-1]))
		},
		"terminal not final": func(value map[string]any) {
			snapshots := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "snapshots")
			snapshots[len(snapshots)-1], snapshots[len(snapshots)-2] = snapshots[len(snapshots)-2], snapshots[len(snapshots)-1]
		},
		"unknown snapshot kind": func(value map[string]any) {
			snapshots := sliceValue(mapValue(mapValue(value, "result"), "chronicle"), "snapshots")
			snapshots[1].(map[string]any)["kind"] = "BOGUS"
		},
		"terminal board at Match start": func(value map[string]any) {
			result := mapValue(value, "result")
			snapshots := sliceValue(mapValue(result, "chronicle"), "snapshots")
			snapshots[0].(map[string]any)["board"] = semanticCloneValue(t, candidateFinalBoard(mapValue(result, "finalState")))
		},
		"unknown Chronicle key": func(value map[string]any) {
			mapValue(mapValue(value, "result"), "chronicle")["storageMetadata"] = map[string]any{}
		},
	}
	for name, mutate := range tests {
		t.Run(name, func(t *testing.T) {
			invalid := semanticCloneValue(t, base).(map[string]any)
			mutate(invalid)
			serialized, err := json.Marshal(invalid)
			if err != nil {
				t.Fatal(err)
			}
			_, failure := decodeRuntimeServiceResponseBytes(request, serialized)
			if failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" {
				t.Fatalf("candidate Chronicle drift was admitted: %+v", failure)
			}
			assertRuntimeServiceFailureSafe(t, failure)
		})
	}
}

func TestCandidateChronicleEventVocabularyAndPayloadContracts(t *testing.T) {
	prototypes := map[string]map[string]any{
		"MATCH_STARTED":           {"matchId": "match", "seed": "seed"},
		"ROUND_STARTED":           {"roundNumber": 1},
		"STRATEGY_EVALUATED":      {"playerId": "player"},
		"ACTIVATION_STARTED":      {"soldierId": "soldier"},
		"ACTIVATION_SKIPPED":      {"soldierId": "soldier", "cycleIndex": 0, "reason": "ENDED"},
		"ACTIVATION_ENDED":        {"soldierId": "soldier", "reason": "ADVANCED"},
		"CYCLE_STARTED":           {"soldierId": "soldier", "cycleIndex": 0},
		"CYCLE_ENDED":             {"soldierId": "soldier", "cycleIndex": 0},
		"AWARENESS_GRID_OBSERVED": {"soldierId": "soldier", "cycleIndex": 0},
		"ACTION_EMITTED":          {"soldierId": "soldier", "action": map[string]any{"type": "MOVE", "direction": "UP"}},
		"MOVE_ADVANCED":           {"soldierId": "soldier", "direction": "UP"},
		"MOVE_BLOCKED":            {"soldierId": "soldier", "reason": "BLOCKED"},
		"TURN_RESOLVED":           {"soldierId": "soldier", "direction": "LEFT"},
		"PUSH_RESOLVED":           {"soldierId": "soldier", "targetSoldierId": "target", "pushedOffBoard": false},
		"PUSH_BLOCKED":            {"soldierId": "soldier", "targetSoldierId": "target"},
		"BACKSTAB_RESOLVED":       {"boundary": "cycle-end", "pairs": []any{}},
		"SOLDIER_STONED":          {"soldierId": "soldier", "reason": "NO_ADVANCE"},
		"SOLDIER_FELL":            {"soldierId": "soldier", "reason": "PUSHED"},
		"CONTRACTION_RESOLVED":    {"bounds": map[string]any{"minX": 1, "maxX": 10, "minY": 1, "maxY": 10}},
		"MATCH_ENDED":             {"type": "DRAW"},
		"RUNTIME_VIOLATION":       {"type": "INVALID_OUTPUT", "playerId": "player"},
	}
	if len(candidateChronicleEventTypes) != 21 || len(prototypes) != 21 {
		t.Fatalf("candidate event vocabulary must remain exactly 21 events: vocabulary=%d prototypes=%d", len(candidateChronicleEventTypes), len(prototypes))
	}
	for eventType := range candidateChronicleEventTypes {
		payload, exists := prototypes[eventType]
		if !exists || !candidateEventPayloadShape(eventType, payload) {
			t.Fatalf("candidate event %s lacks an executable payload contract", eventType)
		}
		withExtra := semanticCloneValue(t, payload).(map[string]any)
		withExtra["unknown"] = true
		if candidateEventPayloadShape(eventType, withExtra) {
			t.Fatalf("candidate event %s admitted an unknown payload field", eventType)
		}
	}
	if candidateEventPayloadShape("BOGUS", map[string]any{}) {
		t.Fatal("unknown candidate event type was admitted")
	}
}

func TestCandidateChronicleAcceptsCanonicalCycleInterleaving(t *testing.T) {
	type eventVector struct {
		typeName string
		context  map[string]any
		payload  map[string]any
	}
	activation := func(index int, playerID string, soldierID string, cycle *int) map[string]any {
		context := map[string]any{
			"phaseNumber": 1, "roundNumber": 1, "activationId": fmt.Sprintf("1:1:%d", index),
			"activationIndex": index, "actingPlayerId": playerID, "soldierId": soldierID,
		}
		if cycle != nil {
			context["cycleIndex"] = *cycle
		}
		return context
	}
	cycle0, cycle1 := 0, 1
	events := []eventVector{
		{"MATCH_STARTED", map[string]any{}, map[string]any{"matchId": "match", "seed": "seed"}},
		{"ROUND_STARTED", map[string]any{"phaseNumber": 1, "roundNumber": 1}, map[string]any{"roundNumber": 1}},
		{"STRATEGY_EVALUATED", map[string]any{"phaseNumber": 1, "roundNumber": 1, "actingPlayerId": "bottom"}, map[string]any{"playerId": "bottom"}},
		{"STRATEGY_EVALUATED", map[string]any{"phaseNumber": 1, "roundNumber": 1, "actingPlayerId": "top"}, map[string]any{"playerId": "top"}},
		{"ACTIVATION_STARTED", activation(0, "bottom", "bottom-1", nil), map[string]any{"soldierId": "bottom-1"}},
		{"ACTIVATION_STARTED", activation(1, "top", "top-1", nil), map[string]any{"soldierId": "top-1"}},
		{"CYCLE_STARTED", activation(0, "bottom", "bottom-1", &cycle0), map[string]any{"soldierId": "bottom-1", "cycleIndex": 0}},
		{"AWARENESS_GRID_OBSERVED", activation(0, "bottom", "bottom-1", &cycle0), map[string]any{"soldierId": "bottom-1", "cycleIndex": 0}},
		{"ACTION_EMITTED", activation(0, "bottom", "bottom-1", &cycle0), map[string]any{"soldierId": "bottom-1", "action": map[string]any{"type": "TURN_TO_STONE"}}},
		{"CYCLE_ENDED", activation(0, "bottom", "bottom-1", &cycle0), map[string]any{"soldierId": "bottom-1", "cycleIndex": 0}},
		{"SOLDIER_STONED", activation(0, "bottom", "bottom-1", nil), map[string]any{"soldierId": "bottom-1", "reason": "NO_ADVANCE"}},
		{"ACTIVATION_ENDED", activation(0, "bottom", "bottom-1", nil), map[string]any{"soldierId": "bottom-1", "reason": "NO_ADVANCE"}},
		{"CYCLE_STARTED", activation(1, "top", "top-1", &cycle0), map[string]any{"soldierId": "top-1", "cycleIndex": 0}},
		{"AWARENESS_GRID_OBSERVED", activation(1, "top", "top-1", &cycle0), map[string]any{"soldierId": "top-1", "cycleIndex": 0}},
		{"ACTION_EMITTED", activation(1, "top", "top-1", &cycle0), map[string]any{"soldierId": "top-1", "action": map[string]any{"type": "MOVE", "direction": "UP"}}},
		{"MOVE_ADVANCED", activation(1, "top", "top-1", &cycle0), map[string]any{"soldierId": "top-1", "direction": "UP"}},
		{"CYCLE_ENDED", activation(1, "top", "top-1", &cycle0), map[string]any{"soldierId": "top-1", "cycleIndex": 0}},
		{"ACTIVATION_ENDED", activation(1, "top", "top-1", nil), map[string]any{"soldierId": "top-1", "reason": "ADVANCED"}},
		{"ACTIVATION_SKIPPED", activation(0, "bottom", "bottom-1", &cycle1), map[string]any{"soldierId": "bottom-1", "cycleIndex": 1, "reason": "NO_ADVANCE"}},
		{"ACTIVATION_SKIPPED", activation(1, "top", "top-1", &cycle1), map[string]any{"soldierId": "top-1", "cycleIndex": 1, "reason": "ADVANCED"}},
		{"MATCH_ENDED", map[string]any{"phaseNumber": 1, "roundNumber": 1}, map[string]any{"type": "DRAW"}},
	}
	state := candidateChronicleGrammarState{
		activations: map[string]candidateChronicleActivation{}, selectionOrder: []string{"bottom", "top"},
		seenEventTypes: map[string]bool{}, referencedPrivate: map[string]string{},
	}
	for index, vector := range events {
		context, contextOK := candidateContext(vector.context)
		if !contextOK || !candidateEventPayloadShape(vector.typeName, vector.payload) || !candidatePayloadContextAgrees(vector.typeName, context, vector.payload) || !validateCandidateEventWindow(&state, vector.typeName, context, vector.payload) {
			t.Fatalf("canonical interleaved event %d (%s) was rejected: state=%+v", index, vector.typeName, state)
		}
	}
	victimContext := activation(1, "top", "top-1", &cycle0)
	if !candidatePayloadContextAgrees("SOLDIER_FELL", victimContext, map[string]any{"soldierId": "bottom-1"}) {
		t.Fatal("victim-oriented event was incorrectly required to name the acting Soldier")
	}
	if candidatePayloadContextAgrees("MOVE_ADVANCED", victimContext, map[string]any{"soldierId": "bottom-1"}) {
		t.Fatal("actor-oriented event admitted a Soldier/context mismatch")
	}
}

func TestRuntimeServiceCandidatePlayerViolationChronicleRoundTrips(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	response := candidateRuntimeResponseForTest(t, request)
	result := mapValue(response, "result")
	chronicle := mapValue(result, "chronicle")
	events := sliceValue(chronicle, "events")
	event := events[2].(map[string]any)
	event["type"] = "RUNTIME_VIOLATION"
	event["payload"] = map[string]any{
		"type": "INVALID_OUTPUT", "category": "STRATEGY", "playerId": request.Match.BottomPlayerID,
		"ownerPlayerId": request.Match.BottomPlayerID,
	}
	privateRef := stringValue(event, "privateRef")
	privateByPlayer := mapValue(mapValue(chronicle, "private"), "byPlayerId")
	privateByPlayer[request.Match.BottomPlayerID].(map[string]any)[privateRef] = map[string]any{
		"ownerPlayerId": request.Match.BottomPlayerID, "playerId": request.Match.BottomPlayerID,
		"type": "INVALID_OUTPUT", "category": "STRATEGY",
	}
	result["runtimeViolationEventCount"] = 1
	serialized, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(request, serialized)
	if failure != nil || decoded == nil || decoded.CandidateEvidence == nil || decoded.CandidateEvidence.ViolationCount != 1 {
		t.Fatalf("canonical player-violation Chronicle did not round-trip: response=%+v failure=%+v", decoded, failure)
	}
}

func TestSemanticIntegrityRejectsInvalidLastSuccessfulMoveDirection(t *testing.T) {
	corpus := loadSemanticIntegrityCorpus(t)
	for _, invalid := range []any{"NORTH", map[string]any{"direction": "UP"}} {
		state := semanticCloneValue(t, corpus.Valid.State).(map[string]any)
		soldiers := sliceValue(state, "soldiers")
		soldiers[0].(map[string]any)["lastSuccessfulMoveDirection"] = invalid
		result := validateGoCanonicalGameState(state)
		if result.OK || len(result.Issues) == 0 || result.Issues[0].Code != "SOLDIER_SHAPE_INVALID" || !reflect.DeepEqual(result.Issues[0].Path, []any{"soldiers", 0, "lastSuccessfulMoveDirection"}) {
			t.Fatalf("invalid reversal history was admitted: %+v", result)
		}
	}
}

func TestSemanticIntegrityCandidateEvidenceRevalidatesFromOriginalBytes(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	response := candidateRuntimeResponseForTest(t, request)
	serialized, err := json.Marshal(response)
	if err != nil {
		t.Fatal(err)
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(request, serialized)
	if failure != nil || decoded == nil || decoded.CandidateEvidence == nil {
		t.Fatalf("candidate evidence setup failed: response=%+v failure=%+v", decoded, failure)
	}
	evidence := decoded.CandidateEvidence
	before := append([]byte(nil), evidence.RawResponse...)
	if failure := revalidateCandidateRuntimeEvidence(evidence); failure != nil {
		t.Fatalf("original candidate evidence failed revalidation: %+v", failure)
	}
	if !reflect.DeepEqual(before, evidence.RawResponse) {
		t.Fatal("candidate revalidation mutated original response bytes")
	}

	tampered := *evidence
	tampered.FinalState = semanticCloneMap(evidence.FinalState)
	tampered.FinalState["matchId"] = "match:tampered"
	if failure := revalidateCandidateRuntimeEvidence(&tampered); failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" {
		t.Fatalf("post-validation candidate mutation was admitted: %+v", failure)
	}
	if err := validateCandidateCompletionInput(completeMatchInput{
		Chronicle: evidence.Chronicle, FinalState: tampered.FinalState, CandidateEvidence: evidence,
	}); err == nil {
		t.Fatal("completion admitted fields that diverged from locked candidate bytes")
	}
}

func candidateRuntimeResponseForTest(t *testing.T, request runtimeServiceRequest) map[string]any {
	t.Helper()
	corpus := loadSemanticIntegrityCorpus(t)
	state := semanticCloneValue(t, corpus.Valid.State).(map[string]any)
	state["matchId"] = request.Match.MatchID
	state["seed"] = request.Match.Seed
	state["arenaVariant"] = semanticCloneValue(t, request.Match.ArenaVariant)
	initialBounds := semanticCloneValue(t, mapValue(request.Match.ArenaVariant, "initialBounds")).(map[string]any)
	parsedBounds, boundsOK := semanticBoundsValue(initialBounds)
	if !boundsOK {
		t.Fatal("candidate recorder fixture arena bounds are invalid")
	}
	state["bounds"] = map[string]any{
		"minX": parsedBounds.MinX + 1, "maxX": parsedBounds.MaxX - 1,
		"minY": parsedBounds.MinY + 1, "maxY": parsedBounds.MaxY - 1,
	}
	state["terrainStones"] = semanticCloneValue(t, sliceValue(request.Match.ArenaVariant, "terrainStones"))
	state["phase"] = "COMPLETE"
	state["phaseNumber"] = json.Number("1")
	state["roundNumber"] = json.Number("4")
	state["activationCount"] = json.Number("4")
	state["initiativePlayerId"] = request.Match.TopPlayerID
	players := state["players"].([]any)
	bottomPlayer := players[0].(map[string]any)
	topPlayer := players[1].(map[string]any)
	bottomPlayer["id"] = request.Match.BottomPlayerID
	bottomPlayer["strategyRevisionId"] = request.Match.BottomStrategyRevisionID
	bottomPlayer["strategyMemory"] = map[string]any{}
	topPlayer["id"] = request.Match.TopPlayerID
	topPlayer["strategyRevisionId"] = request.Match.TopStrategyRevisionID
	topPlayer["strategyMemory"] = map[string]any{}
	for index, raw := range state["soldiers"].([]any) {
		soldier := raw.(map[string]any)
		if index < 8 {
			soldier["ownerPlayerId"] = request.Match.BottomPlayerID
		} else {
			soldier["ownerPlayerId"] = request.Match.TopPlayerID
		}
		soldier["status"] = "FALLEN"
		soldier["position"] = nil
		soldier["lastSuccessfulMoveDirection"] = nil
		soldier["soldierMemory"] = map[string]any{}
	}
	outcome := map[string]any{"type": "DRAW"}
	state["outcome"] = outcome
	terminalHash, err := hashCandidateFinalState(state)
	if err != nil {
		t.Fatal(err)
	}
	initialBoard, err := candidateInitialBoard(state)
	if err != nil {
		t.Fatal(err)
	}
	finalBoard := candidateFinalBoard(state)
	events := []any{
		map[string]any{"type": "MATCH_STARTED", "sequence": json.Number("0"), "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": request.Match.MatchID, "seed": request.Match.Seed}},
	}
	privateByPlayer := map[string]any{request.Match.BottomPlayerID: map[string]any{}, request.Match.TopPlayerID: map[string]any{}}
	sequence := 1
	for round := 1; round <= 4; round++ {
		context := map[string]any{"phaseNumber": 1, "roundNumber": round}
		events = append(events, map[string]any{"type": "ROUND_STARTED", "sequence": sequence, "context": context, "privacy": "public", "payload": map[string]any{"roundNumber": round}})
		sequence++
		for _, playerID := range []string{request.Match.BottomPlayerID, request.Match.TopPlayerID} {
			privateRef := fmt.Sprintf("private:event:%d", sequence)
			events = append(events, map[string]any{
				"type": "STRATEGY_EVALUATED", "sequence": sequence,
				"context": map[string]any{"phaseNumber": 1, "roundNumber": round, "actingPlayerId": playerID},
				"privacy": "owner", "payload": map[string]any{"playerId": playerID}, "privateRef": privateRef,
			})
			privateByPlayer[playerID].(map[string]any)[privateRef] = map[string]any{"playerId": playerID, "strategyMemory": map[string]any{}}
			sequence++
		}
	}
	events = append(events, map[string]any{"type": "CONTRACTION_RESOLVED", "sequence": sequence, "context": map[string]any{"phaseNumber": 1}, "privacy": "public", "payload": map[string]any{"bounds": semanticCloneValue(t, state["bounds"])}})
	sequence++
	for _, raw := range state["soldiers"].([]any) {
		soldier := raw.(map[string]any)
		events = append(events, map[string]any{"type": "SOLDIER_FELL", "sequence": sequence, "context": map[string]any{"phaseNumber": 1}, "privacy": "public", "payload": map[string]any{"soldierId": soldier["id"], "reason": "BOARD_CONTRACTION"}})
		sequence++
	}
	events = append(events, map[string]any{"type": "MATCH_ENDED", "sequence": sequence, "context": map[string]any{"phaseNumber": 1}, "privacy": "public", "payload": outcome})
	snapshots := []any{map[string]any{"kind": "MATCH_START", "sequence": 0, "context": map[string]any{}, "board": semanticCloneValue(t, initialBoard)}}
	for round := 1; round <= 4; round++ {
		startSequence := 1 + (round-1)*3
		context := map[string]any{"phaseNumber": 1, "roundNumber": round}
		snapshots = append(snapshots,
			map[string]any{"kind": "ROUND_START", "sequence": startSequence, "context": context, "board": semanticCloneValue(t, initialBoard)},
			map[string]any{"kind": "ROUND_END", "sequence": startSequence + 2, "context": semanticCloneValue(t, context), "board": semanticCloneValue(t, initialBoard)},
		)
	}
	snapshots = append(snapshots,
		map[string]any{"kind": "CONTRACTION", "sequence": 13, "context": map[string]any{"phaseNumber": 1}, "board": semanticCloneValue(t, finalBoard)},
		map[string]any{"kind": "MATCH_END", "sequence": sequence, "context": map[string]any{}, "outcome": outcome, "board": semanticCloneValue(t, finalBoard)},
		map[string]any{"kind": "TERMINAL", "sequence": sequence, "context": map[string]any{}, "outcome": outcome, "board": semanticCloneValue(t, finalBoard)},
	)
	chronicle := map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId": request.Match.MatchID, "seed": request.Match.Seed,
			"arenaVariantId": stringValue(request.Match.ArenaVariant, "id"), "arenaVariantVersion": "0.1.0",
			"strategyRevisionIds": []any{request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID},
			"versions":            semanticCloneValue(t, state["versions"]),
		},
		"events": events, "snapshots": snapshots, "private": map[string]any{"byPlayerId": privateByPlayer},
	}
	return map[string]any{
		"ok": true, "profile": "candidate_exhibition", "counted": false, "publishable": false,
		"privacy": "internal_candidate_exhibition", "requestId": request.RequestID, "matchId": request.Match.MatchID,
		"compatibility": map[string]any{
			"tupleId": inactiveCandidateTupleID,
			"tuple": map[string]any{
				"rules": inactiveCandidateTuple.Rules, "engine": inactiveCandidateTuple.Engine, "runtimeAbi": inactiveCandidateTuple.RuntimeABI,
				"chronicle": inactiveCandidateTuple.Chronicle, "arenaCatalog": inactiveCandidateTuple.ArenaCatalog, "setPolicy": inactiveCandidateTuple.SetPolicy,
			},
		},
		"result": map[string]any{
			"chronicle": chronicle, "finalState": state, "terminalStateHash": terminalHash,
			"outcome": outcome, "runtimeViolationEventCount": json.Number("0"),
		},
	}
}

func TestCandidateRecorderCorpusBinding(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	request.Match.MatchID = "corpus-match"
	request.Match.Seed = "corpus-seed"
	request.Match.ArenaVariant = map[string]any{"id": "corpus-arena", "name": "Corpus Arena", "initialBounds": map[string]any{"minX": 0, "maxX": 11, "minY": 0, "maxY": 11}, "terrainStones": []any{}}
	request.Match.BottomPlayerID = "corpus-bottom"
	request.Match.TopPlayerID = "corpus-top"
	request.Match.BottomStrategyRevisionID = "corpus-bottom-rev"
	request.Match.TopStrategyRevisionID = "corpus-top-rev"
	response := candidateRuntimeResponseForTest(t, request)
	result := mapValue(response, "result")
	for name, vector := range map[string]struct {
		value any
		want  string
	}{
		"chronicle":  {result["chronicle"], "8fe1c8a5a534edb8f035000333acd605513ca81ac6ae27fe5807a0ecd42e64df"},
		"finalState": {result["finalState"], "cc3219c3daa7df0113d04379487f31fd17ce15f04eac17efc1a43e860d5d7a25"},
	} {
		serialized, err := stableJSON(vector.value)
		if err != nil {
			t.Fatal(err)
		}
		actual := fmt.Sprintf("%x", sha256.Sum256(serialized))
		if actual != vector.want {
			t.Fatalf("%s fixture drifted from the TypeScript candidate recorder corpus: got %s want %s bytes=%d", name, actual, vector.want, len(serialized))
		}
	}
	chronicle := mapValue(result, "chronicle")
	snapshots := sliceValue(chronicle, "snapshots")
	if semanticStableJSONEqual(mapValue(snapshots[0].(map[string]any), "board"), mapValue(snapshots[len(snapshots)-1].(map[string]any), "board")) {
		t.Fatal("candidate recorder corpus reused the terminal board at MATCH_START")
	}
}
