package sqlite

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"so1.dev/fmt/backend/internal/domain"
)

func TestVisitLifecycleAndRetention(t *testing.T) {
	db := openTest(t)
	ctx := context.Background()
	now := time.Date(2026, 10, 23, 12, 0, 0, 0, time.UTC)
	visit := domain.Visit{
		ID:        "11111111-1111-4111-8111-111111111111",
		StartedAt: now.Add(-time.Hour).UnixMilli(),
		IP:        "8.8.8.8",
		Country:   "US",
		Lang:      "en",
		Path:      "/formatter/json",
	}
	if err := db.EnsureVisit(ctx, visit); err != nil {
		t.Fatal(err)
	}

	if err := db.AddEvent(ctx, domain.Event{
		VisitID: visit.ID,
		Name:    "format",
		Target:  "/formatter/json",
		At:      now.UnixMilli(),
	}); err != nil {
		t.Fatal(err)
	}

	if err := db.Touch(ctx, visit.ID, now.UnixMilli(), 90_000); err != nil {
		t.Fatal(err)
	}

	stats, err := db.Stats(ctx, now)
	if err != nil {
		t.Fatal(err)
	}

	if stats.Visits != 1 || stats.Actions[0].Label != "format" || stats.Actions[0].Value != 1 {
		t.Fatalf("stats = %+v", stats)
	}

	if stats.Duration.Samples != 1 || stats.Duration.AverageMs != 90_000 {
		t.Fatalf("duration = %+v", stats.Duration)
	}

	if stats.Countries[0].Label != "US" || stats.Recent[0].IP != "8.8.8.8" {
		t.Fatalf("country/ip = %+v %+v", stats.Countries, stats.Recent)
	}

	old := domain.Visit{
		ID:        "22222222-2222-4222-8222-222222222222",
		StartedAt: now.AddDate(0, 0, -40).UnixMilli(),
		IP:        "1.1.1.1",
		Path:      "/differ",
	}
	if err := db.EnsureVisit(ctx, old); err != nil {
		t.Fatal(err)
	}

	if err := db.AddEvent(ctx, domain.Event{
		VisitID: old.ID,
		Name:    "view",
		Target:  "/differ",
		At:      old.StartedAt,
	}); err != nil {
		t.Fatal(err)
	}

	removed, err := db.Purge(ctx, now, 30)
	if err != nil {
		t.Fatal(err)
	}

	if removed != 1 {
		t.Fatalf("removed = %d", removed)
	}

	kept, err := db.Stats(ctx, now)
	if err != nil {
		t.Fatal(err)
	}

	if kept.Visits != 1 {
		t.Fatalf("visits after purge = %d", kept.Visits)
	}

	forever, err := db.Purge(ctx, now, 0)
	if err != nil || forever != 0 {
		t.Fatalf("forever purge = %d %v", forever, err)
	}
}

func openTest(t *testing.T) *Store {
	t.Helper()
	db, err := Open(filepath.Join(t.TempDir(), "metrics.sqlite"))
	if err != nil {
		t.Fatal(err)
	}

	t.Cleanup(func() { _ = db.Close() })

	return db
}
