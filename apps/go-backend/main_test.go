package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthDTO(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", nil)

	NewServer().routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}

	var dto ServiceHealthDTO
	if err := json.Unmarshal(response.Body.Bytes(), &dto); err != nil {
		t.Fatal(err)
	}
	if dto.Version != serviceAPIVersion {
		t.Fatalf("expected %s, got %s", serviceAPIVersion, dto.Version)
	}
}

func TestPublicMatchSetSummaryDTO(t *testing.T) {
	response := httptest.NewRecorder()
	request := httptest.NewRequest(
		http.MethodGet,
		"/public/matchsets/match-set%3Ago-spike/summary",
		nil,
	)

	NewServer().routes().ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", response.Code)
	}

	var dto PublicMatchSetSummaryDTO
	if err := json.Unmarshal(response.Body.Bytes(), &dto); err != nil {
		t.Fatal(err)
	}
	if dto.APIVersion != serviceAPIVersion || dto.Kind != "publicMatchSetSummary" {
		t.Fatalf("unexpected DTO envelope: %#v", dto)
	}
}
