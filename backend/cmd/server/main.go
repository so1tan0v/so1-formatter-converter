package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"so1.dev/fmt/backend/internal/application"
	"so1.dev/fmt/backend/internal/config"
	"so1.dev/fmt/backend/internal/infrastructure/geo"
	"so1.dev/fmt/backend/internal/infrastructure/sqlite"
	"so1.dev/fmt/backend/internal/presentation/http"
)

func main() {
	cfg := config.FromEnv()
	if err := os.MkdirAll(filepath.Dir(cfg.DBPath), 0o755); err != nil {
		log.Fatal(err)
	}

	db, err := sqlite.Open(cfg.DBPath)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := geo.Ensure(cfg.GeoPath); err != nil {
		log.Printf("country database unavailable: %v", err)
	}

	var countries *geo.DB
	if loaded, err := geo.Load(cfg.GeoPath); err == nil {
		countries = loaded
	}

	app := &application.Service{Visits: db, Countries: countries}
	go purge(app, cfg.RetentionDays)

	handler := api.API{
		App:   app,
		Token: cfg.Token,
	}.Handler()
	log.Printf("backend listening on %s, retention %s", cfg.Addr, config.RetentionLabel(cfg.RetentionDays))
	if err := http.ListenAndServe(cfg.Addr, handler); err != nil {
		log.Fatal(err)
	}
}

func purge(app *application.Service, days int) {
	if _, err := app.Purge(context.Background(), days); err != nil {
		log.Printf("purge: %v", err)
	}

	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		if _, err := app.Purge(context.Background(), days); err != nil {
			log.Printf("purge: %v", err)
		}
	}
}
