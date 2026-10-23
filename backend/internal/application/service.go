// Package application принимает отчёты о визитах и отдаёт сводку.
package application

import (
	"context"
	"time"

	"so1.dev/fmt/backend/internal/domain"
)

// Repository хранит визиты. Реализация живёт в infrastructure.
type Repository interface {
	EnsureVisit(ctx context.Context, visit domain.Visit) error
	AddEvent(ctx context.Context, event domain.Event) error
	Touch(ctx context.Context, visitID string, at, durationMs int64) error
	Purge(ctx context.Context, now time.Time, days int) (int64, error)
	Stats(ctx context.Context, now time.Time) (domain.Stats, error)
}

// CountryLookup определяет страну по IP.
type CountryLookup interface {
	Country(ip string) string
}

// Report — отчёт браузера после разбора HTTP.
type Report struct {
	VisitID       string
	Kind          string
	Path          string
	Lang          string
	Embed         bool
	Name          string
	Target        string
	DurationMs    *int64
	IP            string
	CountryHeader string
}

// Service — сценарии сбора и чтения статистики.
type Service struct {
	Visits    Repository
	Countries CountryLookup
	Now       domain.Clock
}

// Collect сохраняет открытие визита, сердцебиение или действие.
func (s *Service) Collect(ctx context.Context, report Report) error {
	id, err := domain.ParseVisitID(report.VisitID)
	if err != nil {
		return err
	}

	now := s.clock().UnixMilli()
	country := domain.CountryCode(report.CountryHeader)
	if country == "" && s.Countries != nil {
		country = s.Countries.Country(report.IP)
	}

	err = s.Visits.EnsureVisit(ctx, domain.Visit{
		ID:        id,
		StartedAt: now,
		IP:        report.IP,
		Country:   country,
		Lang:      domain.Language(report.Lang),
		Embed:     report.Embed,
		Path:      domain.Path(report.Path),
	})
	if err != nil {
		return err
	}

	switch report.Kind {
	case domain.KindStart, domain.KindHeartbeat, domain.KindEnd:
		if report.DurationMs == nil {
			return nil
		}

		return s.Visits.Touch(ctx, id, now, domain.ClampDuration(*report.DurationMs))
	case domain.KindEvent:
		name, err := domain.Action(report.Name)
		if err != nil {
			return err
		}

		target := domain.Path(report.Target)
		if target == "" {
			target = domain.Label(report.Target)
		}

		return s.Visits.AddEvent(ctx, domain.Event{
			VisitID: id,
			Name:    name,
			Target:  target,
			At:      now,
		})
	default:
		return domain.ErrInvalid
	}
}

// Stats возвращает сводку на текущий момент.
func (s *Service) Stats(ctx context.Context) (domain.Stats, error) {
	return s.Visits.Stats(ctx, s.clock())
}

// Purge удаляет визиты старше окна хранения.
func (s *Service) Purge(ctx context.Context, days int) (int64, error) {
	return s.Visits.Purge(ctx, s.clock(), days)
}

func (s *Service) clock() time.Time {
	if s.Now == nil {
		return time.Now()
	}

	return s.Now()
}
