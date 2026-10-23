// Package api принимает события метрик и отдаёт их Prometheus под /api.
package api

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httprate"

	"so1.dev/fmt/backend/internal/application"
	"so1.dev/fmt/backend/internal/domain"
	"so1.dev/fmt/backend/internal/infrastructure/clientip"
)

// API связывает HTTP с прикладным слоем.
type API struct {
	App   *application.Service
	Token string
}

// Handler собирает маршруты. Все они начинаются с /api.
func (a API) Handler() http.Handler {
	router := chi.NewRouter()
	router.Use(middleware.Recoverer)
	router.Route("/api", func(router chi.Router) {
		router.Get("/healthz", health)
		router.With(requireToken(a.Token)).Method(http.MethodGet, "/metrics", a.metrics())
		router.With(httprate.Limit(
			120,
			time.Minute,
			httprate.WithKeyFuncs(func(r *http.Request) (string, error) {
				return clientip.FromRequest(r), nil
			}),
		)).Post("/metrics/collect", a.collect)
	})

	return router
}

func health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	_, _ = io.WriteString(w, "ok")
}

func (a API) collect(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	var payload struct {
		VisitID    string `json:"visitId"`
		Kind       string `json:"kind"`
		Path       string `json:"path"`
		Lang       string `json:"lang"`
		Embed      bool   `json:"embed"`
		Name       string `json:"name"`
		Target     string `json:"target"`
		DurationMs *int64 `json:"durationMs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	err := a.App.Collect(r.Context(), application.Report{
		VisitID:       payload.VisitID,
		Kind:          payload.Kind,
		Path:          payload.Path,
		Lang:          payload.Lang,
		Embed:         payload.Embed,
		Name:          payload.Name,
		Target:        payload.Target,
		DurationMs:    payload.DurationMs,
		IP:            clientip.FromRequest(r),
		CountryHeader: countryHeader(r.Header),
	})
	if errors.Is(err, domain.ErrInvalid) {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	if err != nil {
		http.Error(w, "unavailable", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func requireToken(token string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if token == "" {
				next.ServeHTTP(w, r)
				return
			}

			got := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
			if got == r.Header.Get("Authorization") {
				got = r.URL.Query().Get("token")
			}

			if subtle.ConstantTimeCompare([]byte(got), []byte(token)) != 1 {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func countryHeader(header http.Header) string {
	for _, key := range []string{"Cf-Ipcountry", "X-Country-Code"} {
		if code := domain.CountryCode(header.Get(key)); code != "" {
			return code
		}
	}

	return ""
}
