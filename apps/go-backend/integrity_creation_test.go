package main

import (
	"context"
	"errors"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestCreateExhibitionMatchSetIntegrityRejectsBeforeBegin(t *testing.T) {
	order := []string{}
	beginCalls := 0
	server := &LiveServer{now: func() time.Time {
		return time.Date(2026, 7, 13, 12, 0, 0, 0, time.UTC)
	}}
	dependencies := exhibitionCreationDependencies{
		loadEntrants: func(context.Context, string, []string, time.Time) ([]map[string]any, error) {
			order = append(order, "entrants")
			return []map[string]any{
				{"strategyRevisionId": "revision:bottom", "entrantId": "entrant:0", "entrantIndex": 0},
				{"strategyRevisionId": "revision:top", "entrantId": "entrant:1", "entrantIndex": 1},
			}, nil
		},
		loadAuthority: func() (*verifiedRuntimeEvidenceAuthority, error) {
			order = append(order, "authority")
			return &verifiedRuntimeEvidenceAuthority{}, nil
		},
		resolveEvidence: func(context.Context, *verifiedRuntimeEvidenceAuthority, []map[string]any, bool, time.Time) (*goMatchSetIntegrityIdentity, error) {
			order = append(order, "evidence")
			return nil, errors.New("provider proof is not executable evidence")
		},
		begin: func(context.Context) (pgx.Tx, error) {
			beginCalls++
			return nil, errors.New("Begin must not be reached")
		},
	}

	_, err := server.createExhibitionMatchSetWithDependencies(
		context.Background(),
		"user:owner",
		"smoke-exhibition-v1",
		[]string{"revision:bottom", "revision:top"},
		false,
		dependencies,
	)
	if err == nil || !strings.Contains(err.Error(), "integrity") {
		t.Fatalf("expected safe integrity rejection, got %v", err)
	}
	if beginCalls != 0 {
		t.Fatalf("rejected exact evidence called Begin %d time(s)", beginCalls)
	}
	if !reflect.DeepEqual(order, []string{"entrants", "authority", "evidence"}) {
		t.Fatalf("creation preflight order drifted: %v", order)
	}
}

func TestCreateExhibitionMatchSetIntegrityPurposeFloors(t *testing.T) {
	tests := []struct {
		name    string
		counted bool
		status  executableLaneEvidenceStatus
		allowed bool
	}{
		{name: "counted requires conformance", counted: true, status: executableLaneEvidenceCounted, allowed: true},
		{name: "counted rejects containment only", counted: true, status: executableLaneEvidenceExhibitionOnly, allowed: false},
		{name: "exhibition accepts containment only", counted: false, status: executableLaneEvidenceExhibitionOnly, allowed: true},
		{name: "exhibition accepts fully proved lane", counted: false, status: executableLaneEvidenceCounted, allowed: true},
		{name: "neither purpose accepts disabled", counted: false, status: executableLaneEvidenceDisabled, allowed: false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := creationPurposeAllowsStatus(test.counted, test.status); got != test.allowed {
				t.Fatalf("purpose floor returned %v, want %v", got, test.allowed)
			}
		})
	}
}
