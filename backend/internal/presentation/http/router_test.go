package api

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"so1.dev/fmt/backend/internal/application"
	"so1.dev/fmt/backend/internal/infrastructure/sqlite"
)

func TestCollectAndPrometheus(t *testing.T) {
	db, err := sqlite.Open(filepath.Join(t.TempDir(), "metrics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })

	handler := API{
		App: &application.Service{
			Visits: db,
			Now:    func() time.Time { return time.Date(2026, 10, 23, 12, 0, 0, 0, time.UTC) },
		},
		Token: "secret",
	}.Handler()

	body := bytes.NewBufferString(`{
		"visitId":"11111111-1111-4111-8111-111111111111",
		"kind":"event",
		"name":"format",
		"target":"/formatter/json"
	}`)
	request := httptest.NewRequest(http.MethodPost, "/api/metrics/collect", body)
	request.RemoteAddr = "198.51.100.8:1234"
	request.Header.Set("CF-IPCountry", "DE")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusNoContent {
		t.Fatalf("collect = %d %s", response.Code, response.Body.String())
	}

	gone := httptest.NewRecorder()
	handler.ServeHTTP(gone, httptest.NewRequest(http.MethodGet, "/api/dashboard", nil))
	if gone.Code != http.StatusNotFound {
		t.Fatalf("dashboard = %d", gone.Code)
	}

	denied := httptest.NewRecorder()
	handler.ServeHTTP(denied, httptest.NewRequest(http.MethodGet, "/api/metrics", nil))
	if denied.Code != http.StatusUnauthorized {
		t.Fatalf("denied = %d", denied.Code)
	}

	health := httptest.NewRecorder()
	handler.ServeHTTP(health, httptest.NewRequest(http.MethodGet, "/api/healthz", nil))
	if health.Code != http.StatusOK || health.Body.String() != "ok" {
		t.Fatalf("health = %d %s", health.Code, health.Body.String())
	}

	metrics := httptest.NewRequest(http.MethodGet, "/api/metrics", nil)
	metrics.Header.Set("Authorization", "Bearer secret")
	metricsResponse := httptest.NewRecorder()
	handler.ServeHTTP(metricsResponse, metrics)
	text := metricsResponse.Body.String()
	if metricsResponse.Code != http.StatusOK || !strings.Contains(text, "fmt_visits") || !strings.Contains(text, `action="format"`) || !strings.Contains(text, `country="DE"`) {
		t.Fatalf("metrics = %d %s", metricsResponse.Code, text)
	}

	root := httptest.NewRecorder()
	handler.ServeHTTP(root, httptest.NewRequest(http.MethodGet, "/", nil))
	if root.Code != http.StatusNotFound {
		t.Fatalf("root = %d", root.Code)
	}
}
