package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strings"
)

const serviceAPIVersion = "service-api-v1.7"

type ServiceHealthDTO struct {
	OK      bool   `json:"ok"`
	Service string `json:"service"`
	Version string `json:"version"`
}

type PublicMatchSetSummaryDTO struct {
	APIVersion string         `json:"apiVersion"`
	Kind       string         `json:"kind"`
	MatchSetID string         `json:"matchSetId"`
	Result     map[string]any `json:"result"`
}

type PublicReplayMetadataDTO struct {
	APIVersion string `json:"apiVersion"`
	Kind       string `json:"kind"`
	MatchID    string `json:"matchId"`
	Chronicle  struct {
		ID           string `json:"id"`
		Hash         string `json:"hash"`
		SchemaVersion string `json:"schemaVersion"`
		EventCount   int    `json:"eventCount"`
	} `json:"chronicle"`
	ReplayAvailable bool `json:"replayAvailable"`
}

type Server struct {
	matchSets map[string]PublicMatchSetSummaryDTO
	replays   map[string]PublicReplayMetadataDTO
}

func NewServer() *Server {
	matchSet := PublicMatchSetSummaryDTO{
		APIVersion: serviceAPIVersion,
		Kind:       "publicMatchSetSummary",
		MatchSetID: "match-set:go-spike",
		Result: map[string]any{
			"matchSetId": "match-set:go-spike",
			"status":     "complete",
			"visibility": "public",
			"publication": map[string]any{
				"publicResults":        true,
				"publicReplayEvidence": true,
				"privateFieldsExcluded": []string{
					"Strategy source",
					"StrategyMemory",
					"SoldierMemory",
					"objective payloads",
				},
			},
		},
	}

	replay := PublicReplayMetadataDTO{
		APIVersion:     serviceAPIVersion,
		Kind:           "publicReplayMetadata",
		MatchID:        "match:go-spike",
		ReplayAvailable: true,
	}
	replay.Chronicle.ID = "chronicle:go-spike"
	replay.Chronicle.Hash = "go-spike-hash"
	replay.Chronicle.SchemaVersion = "chronicle-v1.4"
	replay.Chronicle.EventCount = 1

	return &Server{
		matchSets: map[string]PublicMatchSetSummaryDTO{
			matchSet.MatchSetID: matchSet,
		},
		replays: map[string]PublicReplayMetadataDTO{
			replay.MatchID: replay,
		},
	}
}

func (server *Server) routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", server.health)
	mux.HandleFunc("GET /public/matchsets/{matchSetId}/summary", server.matchSetSummary)
	mux.HandleFunc("GET /public/replays/{matchId}/metadata", server.replayMetadata)
	return mux
}

func (server *Server) health(writer http.ResponseWriter, _ *http.Request) {
	writeJSON(writer, http.StatusOK, ServiceHealthDTO{
		OK:      true,
		Service: "cowards-go-backend",
		Version: serviceAPIVersion,
	})
}

func (server *Server) matchSetSummary(writer http.ResponseWriter, request *http.Request) {
	matchSetID := decodePathValue(request.PathValue("matchSetId"))
	dto, ok := server.matchSets[matchSetID]
	if !ok {
		writeError(writer, http.StatusNotFound, "MatchSet not found.")
		return
	}
	writeJSON(writer, http.StatusOK, dto)
}

func (server *Server) replayMetadata(writer http.ResponseWriter, request *http.Request) {
	matchID := decodePathValue(request.PathValue("matchId"))
	dto, ok := server.replays[matchID]
	if !ok {
		writeError(writer, http.StatusNotFound, "Replay metadata not found.")
		return
	}
	writeJSON(writer, http.StatusOK, dto)
}

func decodePathValue(value string) string {
	return strings.ReplaceAll(value, "%3A", ":")
}

func writeError(writer http.ResponseWriter, status int, message string) {
	writeJSON(writer, status, map[string]any{
		"apiVersion": serviceAPIVersion,
		"error": map[string]any{
			"code":    http.StatusText(status),
			"message": message,
		},
	})
}

func writeJSON(writer http.ResponseWriter, status int, value any) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(status)
	if err := json.NewEncoder(writer).Encode(value); err != nil {
		log.Printf("write response: %v", err)
	}
}

func listenAddr() string {
	addr := os.Getenv("COWARDS_GO_BACKEND_ADDR")
	if addr == "" {
		return "127.0.0.1:8087"
	}
	return addr
}

func main() {
	server := NewServer()
	addr := listenAddr()
	log.Printf("cowards-go-backend listening on http://%s", addr)
	if err := http.ListenAndServe(addr, server.routes()); !errors.Is(err, http.ErrServerClosed) {
		log.Fatal(err)
	}
}
