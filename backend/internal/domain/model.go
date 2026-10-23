// Package domain описывает визит, действие и сводку статистики.
package domain

import "time"

const (
	KindStart     = "start"
	KindHeartbeat = "heartbeat"
	KindEnd       = "end"
	KindEvent     = "event"
)

// Visit — одно пребывание во вкладке.
type Visit struct {
	ID         string
	StartedAt  int64
	IP         string
	Country    string
	Lang       string
	Embed      bool
	Path       string
	DurationMs int64
}

// Event — что посетитель сделал во время визита.
type Event struct {
	VisitID string
	Name    string
	Target  string
	At      int64
}

// Stats — сводка для дашборда и Prometheus.
type Stats struct {
	Visits    int
	Days      []Count
	Actions   []Count
	Tools     []Count
	Duration  Duration
	Countries []Count
	Recent    []Recent
}

// Count — подпись и число.
type Count struct {
	Label string
	Value int
}

// Duration — видимое время на сайте.
type Duration struct {
	AverageMs int64
	MedianMs  int64
	Samples   int
	Buckets   []Count
}

// Recent — строка последних визитов.
type Recent struct {
	StartedAt  int64
	DurationMs int64
	IP         string
	Country    string
	Lang       string
	Embed      bool
	Path       string
}

// Clock — часы приложения. В тестах их подменяют.
type Clock func() time.Time
