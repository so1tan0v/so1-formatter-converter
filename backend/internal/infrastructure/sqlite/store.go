// Package sqlite хранит визиты и действия.
package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"time"

	"so1.dev/fmt/backend/internal/domain"

	_ "modernc.org/sqlite"
)

// Store — файл SQLite со сводкой посещений.
type Store struct {
	db *sql.DB
}

// Open создаёт файл и таблицы.
func Open(path string) (*Store, error) {
	dsn := fmt.Sprintf(
		"file:%s?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)&_pragma=journal_mode(WAL)",
		path,
	)
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)
	store := &Store{db: db}
	if err := store.migrate(); err != nil {
		_ = db.Close()
		return nil, err
	}

	return store, nil
}

// Close закрывает файл.
func (s *Store) Close() error {
	return s.db.Close()
}

// EnsureVisit создаёт визит или обновляет уже открытый.
func (s *Store) EnsureVisit(ctx context.Context, visit domain.Visit) error {
	embed := 0
	if visit.Embed {
		embed = 1
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO visits (
			id, started_at, last_seen_at, duration_ms, ip, country, lang, embed, path
		) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			last_seen_at = excluded.last_seen_at,
			path = CASE WHEN excluded.path = '' THEN visits.path ELSE excluded.path END,
			lang = CASE WHEN excluded.lang = '' THEN visits.lang ELSE excluded.lang END,
			country = CASE WHEN visits.country = '' THEN excluded.country ELSE visits.country END
	`, visit.ID, visit.StartedAt, visit.StartedAt, visit.IP, visit.Country, visit.Lang, embed, visit.Path)

	return err
}

// AddEvent записывает действие.
func (s *Store) AddEvent(ctx context.Context, event domain.Event) error {
	_, err := s.db.ExecContext(
		ctx,
		`INSERT INTO events (visit_id, at, name, target) VALUES (?, ?, ?, ?)`,
		event.VisitID, event.At, event.Name, event.Target,
	)

	return err
}

// Touch обновляет видимое время визита.
func (s *Store) Touch(ctx context.Context, visitID string, at, durationMs int64) error {
	_, err := s.db.ExecContext(
		ctx,
		`UPDATE visits SET duration_ms = MAX(duration_ms, ?), last_seen_at = ? WHERE id = ?`,
		durationMs, at, visitID,
	)

	return err
}

// Purge удаляет визиты старше окна. Ноль дней оставляет всё.
func (s *Store) Purge(ctx context.Context, now time.Time, days int) (int64, error) {
	if days <= 0 {
		return 0, nil
	}

	cutoff := now.AddDate(0, 0, -days).UnixMilli()
	result, err := s.db.ExecContext(ctx, `DELETE FROM visits WHERE started_at < ?`, cutoff)
	if err != nil {
		return 0, err
	}

	return result.RowsAffected()
}

// Stats собирает сводку.
func (s *Store) Stats(ctx context.Context, now time.Time) (domain.Stats, error) {
	var stats domain.Stats
	if err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM visits`).Scan(&stats.Visits); err != nil {
		return stats, err
	}

	days, err := s.days(ctx, now)
	if err != nil {
		return stats, err
	}

	stats.Days = days
	stats.Actions, err = s.counts(ctx, `SELECT name, COUNT(*) FROM events GROUP BY name ORDER BY COUNT(*) DESC`)
	if err != nil {
		return stats, err
	}

	stats.Tools, err = s.counts(ctx, `
		SELECT target, COUNT(*) FROM events
		WHERE name IN ('view', 'format', 'convert', 'render') AND target != ''
		GROUP BY target ORDER BY COUNT(*) DESC LIMIT 12
	`)
	if err != nil {
		return stats, err
	}

	stats.Countries, err = s.counts(ctx, `
		SELECT country, COUNT(*) FROM visits GROUP BY country ORDER BY COUNT(*) DESC
	`)
	if err != nil {
		return stats, err
	}

	stats.Duration, err = s.duration(ctx)
	if err != nil {
		return stats, err
	}

	stats.Recent, err = s.recent(ctx)

	return stats, err
}

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS visits (
			id TEXT PRIMARY KEY,
			started_at INTEGER NOT NULL,
			last_seen_at INTEGER NOT NULL,
			duration_ms INTEGER NOT NULL DEFAULT 0,
			ip TEXT NOT NULL,
			country TEXT NOT NULL DEFAULT '',
			lang TEXT NOT NULL DEFAULT '',
			embed INTEGER NOT NULL DEFAULT 0,
			path TEXT NOT NULL DEFAULT ''
		);
		CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			visit_id TEXT NOT NULL,
			at INTEGER NOT NULL,
			name TEXT NOT NULL,
			target TEXT NOT NULL DEFAULT '',
			FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
		);
		CREATE INDEX IF NOT EXISTS events_name ON events(name);
		CREATE INDEX IF NOT EXISTS visits_started ON visits(started_at);
	`)

	return err
}

func (s *Store) days(ctx context.Context, now time.Time) ([]domain.Count, error) {
	start := startOfUTCDay(now).AddDate(0, 0, -29)
	rows, err := s.db.QueryContext(ctx, `SELECT started_at FROM visits WHERE started_at >= ?`, start.UnixMilli())
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := map[string]int{}
	for day := 0; day < 30; day++ {
		counts[start.AddDate(0, 0, day).Format("2006-01-02")] = 0
	}

	for rows.Next() {
		var started int64
		if err := rows.Scan(&started); err != nil {
			return nil, err
		}

		label := time.UnixMilli(started).UTC().Format("2006-01-02")
		if _, ok := counts[label]; ok {
			counts[label]++
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	out := make([]domain.Count, 0, 30)
	for day := 0; day < 30; day++ {
		label := start.AddDate(0, 0, day).Format("2006-01-02")
		out = append(out, domain.Count{Label: label[5:], Value: counts[label]})
	}

	return out, nil
}

func (s *Store) counts(ctx context.Context, query string) ([]domain.Count, error) {
	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Count
	for rows.Next() {
		var item domain.Count
		if err := rows.Scan(&item.Label, &item.Value); err != nil {
			return nil, err
		}

		if item.Label == "" {
			item.Label = "—"
		}

		out = append(out, item)
	}

	return out, rows.Err()
}

func (s *Store) duration(ctx context.Context) (domain.Duration, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT duration_ms FROM visits WHERE duration_ms > 0`)
	if err != nil {
		return domain.Duration{}, err
	}
	defer rows.Close()

	var values []int64
	var sum int64
	for rows.Next() {
		var value int64
		if err := rows.Scan(&value); err != nil {
			return domain.Duration{}, err
		}

		values = append(values, value)
		sum += value
	}

	if err := rows.Err(); err != nil {
		return domain.Duration{}, err
	}

	summary := domain.Duration{
		Samples: len(values),
		Buckets: []domain.Count{
			{Label: "<10с", Value: 0},
			{Label: "10с–1м", Value: 0},
			{Label: "1–5м", Value: 0},
			{Label: "5–30м", Value: 0},
			{Label: ">30м", Value: 0},
		},
	}
	if len(values) == 0 {
		return summary, nil
	}

	sort.Slice(values, func(i, j int) bool { return values[i] < values[j] })
	summary.AverageMs = sum / int64(len(values))
	mid := len(values) / 2
	if len(values)%2 == 0 {
		summary.MedianMs = (values[mid-1] + values[mid]) / 2
	} else {
		summary.MedianMs = values[mid]
	}

	for _, value := range values {
		switch {
		case value < 10_000:
			summary.Buckets[0].Value++
		case value < 60_000:
			summary.Buckets[1].Value++
		case value < 5*60_000:
			summary.Buckets[2].Value++
		case value < 30*60_000:
			summary.Buckets[3].Value++
		default:
			summary.Buckets[4].Value++
		}
	}

	return summary, nil
}

func (s *Store) recent(ctx context.Context) ([]domain.Recent, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT started_at, duration_ms, ip, country, lang, embed, path
		FROM visits ORDER BY started_at DESC LIMIT 40
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Recent
	for rows.Next() {
		var item domain.Recent
		var embed int
		if err := rows.Scan(
			&item.StartedAt, &item.DurationMs, &item.IP, &item.Country,
			&item.Lang, &embed, &item.Path,
		); err != nil {
			return nil, err
		}

		item.Embed = embed == 1
		out = append(out, item)
	}

	return out, rows.Err()
}

func startOfUTCDay(now time.Time) time.Time {
	year, month, day := now.UTC().Date()

	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}
