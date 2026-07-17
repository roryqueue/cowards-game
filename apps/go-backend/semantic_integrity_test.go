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

func TestSemanticIntegrityCandidateSchedulingHasNoGameplayOrStrategyExecutionAuthority(t *testing.T) {
	for _, path := range []string{"live_backend.go", "integrity_creation.go"} {
		source, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, source, 0)
		if err != nil {
			t.Fatal(err)
		}
		forbidden := map[string]bool{
			"executeStrategy": true,
			"runStrategy": true,
			"runMatch": true,
			"stepMatch": true,
			"validateGoCanonicalGameState": true,
			"validateCandidateChronicleEvents": true,
			"hashCandidateArenaGeometry": true,
			"parseConditionFromSeed": true,
		}
		ast.Inspect(file, func(node ast.Node) bool {
			declaration, ok := node.(*ast.FuncDecl)
			if !ok || !strings.Contains(declaration.Name.Name, "V119") {
				return true
			}
			ast.Inspect(declaration.Body, func(child ast.Node) bool {
				call, ok := child.(*ast.CallExpr)
				if !ok {
					return true
				}
				name := ""
				switch called := call.Fun.(type) {
				case *ast.Ident:
					name = called.Name
				case *ast.SelectorExpr:
					name = called.Sel.Name
				}
				if forbidden[name] {
					t.Fatalf("candidate structural scheduler acquired forbidden authority: %s:%s->%s", path, declaration.Name.Name, name)
				}
				return true
			})
			return false
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

func TestRuntimeServiceRetiredCandidateFacadeIsAbsent(t *testing.T) {
	request := validRuntimeServiceRequestForTest()
	payload, err := json.Marshal(map[string]any{
		"ok":            true,
		"profile":       "candidate_exhibition",
		"counted":       false,
		"publishable":   false,
		"privacy":       "internal_candidate_exhibition",
		"compatibility": map[string]any{"tupleId": currentCanonicalTupleID, "tuple": currentCanonicalTuple},
		"result":        map[string]any{},
	})
	if err != nil {
		t.Fatal(err)
	}
	decoded, failure := decodeRuntimeServiceResponseBytes(request, payload)
	if decoded != nil || failure == nil || failure.ErrorClass != "RuntimeServiceSemanticIntegrity" {
		t.Fatalf("retired candidate response did not fail closed: response=%+v failure=%+v", decoded, failure)
	}
	sourceBytes, err := os.ReadFile("semantic_integrity.go")
	if err != nil {
		t.Fatal(err)
	}
	for _, retired := range []string{
		"decodeCandidateRuntimeServiceResponse",
		"candidateRuntimeEvidence",
		"validateCandidateChronicleEvents",
		"hashCandidateFinalState",
	} {
		if strings.Contains(string(sourceBytes), retired) {
			t.Fatalf("retired candidate semantic facade remains executable: %s", retired)
		}
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
