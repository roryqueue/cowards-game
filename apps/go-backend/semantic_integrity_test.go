package main

import (
	"encoding/json"
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
	forbidden := map[string]bool{
		"stepMatch": true, "runActivationFromState": true, "resolveRound": true,
		"resolveCycle": true, "resolveActivation": true, "resolveContraction": true,
	}
	paths, err := filepath.Glob("*.go")
	if err != nil {
		t.Fatal(err)
	}
	for _, path := range paths {
		if strings.HasSuffix(path, "_test.go") {
			continue
		}
		source, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, source, 0)
		if err != nil {
			t.Fatal(err)
		}
		ast.Inspect(file, func(node ast.Node) bool {
			switch typed := node.(type) {
			case *ast.FuncDecl:
				if forbidden[typed.Name.Name] {
					t.Errorf("Go gameplay scheduler declaration detected in %s: %s", path, typed.Name.Name)
				}
			case *ast.CallExpr:
				name := ""
				switch called := typed.Fun.(type) {
				case *ast.Ident:
					name = called.Name
				case *ast.SelectorExpr:
					name = called.Sel.Name
				}
				if forbidden[name] {
					t.Errorf("Go gameplay scheduler call detected in %s: %s", path, name)
				}
			}
			return true
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
			mapValue(value, "result")["outcome"] = map[string]any{"type": "DRAW"}
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
	state["bounds"] = semanticCloneValue(t, mapValue(request.Match.ArenaVariant, "initialBounds"))
	state["terrainStones"] = semanticCloneValue(t, sliceValue(request.Match.ArenaVariant, "terrainStones"))
	state["phase"] = "COMPLETE"
	state["phaseNumber"] = json.Number("1")
	state["roundNumber"] = json.Number("1")
	state["activationCount"] = json.Number("1")
	state["initiativePlayerId"] = request.Match.BottomPlayerID
	players := state["players"].([]any)
	bottomPlayer := players[0].(map[string]any)
	topPlayer := players[1].(map[string]any)
	bottomPlayer["id"] = request.Match.BottomPlayerID
	bottomPlayer["strategyRevisionId"] = request.Match.BottomStrategyRevisionID
	topPlayer["id"] = request.Match.TopPlayerID
	topPlayer["strategyRevisionId"] = request.Match.TopStrategyRevisionID
	for index, raw := range state["soldiers"].([]any) {
		soldier := raw.(map[string]any)
		if index < 8 {
			soldier["ownerPlayerId"] = request.Match.BottomPlayerID
		} else {
			soldier["ownerPlayerId"] = request.Match.TopPlayerID
			soldier["status"] = "FALLEN"
			soldier["position"] = nil
		}
	}
	outcome := map[string]any{"type": "WIN", "winnerPlayerId": request.Match.BottomPlayerID}
	state["outcome"] = outcome
	terminalHash, err := hashCandidateFinalState(state)
	if err != nil {
		t.Fatal(err)
	}
	board := candidateFinalBoard(state)
	events := []any{
		map[string]any{"type": "MATCH_STARTED", "sequence": json.Number("0"), "context": map[string]any{}, "privacy": "public", "payload": map[string]any{"matchId": request.Match.MatchID, "seed": request.Match.Seed}},
		map[string]any{"type": "STRATEGY_EVALUATED", "sequence": json.Number("1"), "context": map[string]any{"actingPlayerId": request.Match.BottomPlayerID}, "privacy": "owner", "payload": map[string]any{"playerId": request.Match.BottomPlayerID}},
		map[string]any{"type": "STRATEGY_EVALUATED", "sequence": json.Number("2"), "context": map[string]any{"actingPlayerId": request.Match.TopPlayerID}, "privacy": "owner", "payload": map[string]any{"playerId": request.Match.TopPlayerID}},
		map[string]any{"type": "MATCH_ENDED", "sequence": json.Number("3"), "context": map[string]any{}, "privacy": "public", "payload": outcome},
	}
	chronicle := map[string]any{
		"schemaVersion": "chronicle-v1.4",
		"reproducibility": map[string]any{
			"matchId": request.Match.MatchID, "seed": request.Match.Seed,
			"arenaVariantId": stringValue(request.Match.ArenaVariant, "id"), "arenaVariantVersion": "0.1.0",
			"strategyRevisionIds": []any{request.Match.BottomStrategyRevisionID, request.Match.TopStrategyRevisionID},
			"versions":            semanticCloneValue(t, state["versions"]),
		},
		"events": events,
		"snapshots": []any{
			map[string]any{"kind": "MATCH_START", "sequence": json.Number("0"), "context": map[string]any{}, "board": board},
			map[string]any{"kind": "MATCH_END", "sequence": json.Number("3"), "context": map[string]any{}, "outcome": outcome, "board": board},
			map[string]any{"kind": "TERMINAL", "sequence": json.Number("3"), "context": map[string]any{}, "outcome": outcome, "board": board},
		},
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
