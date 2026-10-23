package api

import (
	"context"
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"so1.dev/fmt/backend/internal/application"
	"so1.dev/fmt/backend/internal/domain"
)

var (
	visitsDesc = prometheus.NewDesc(
		"fmt_visits",
		"Stored visits.",
		nil,
		nil,
	)
	actionsDesc = prometheus.NewDesc(
		"fmt_actions",
		"Recorded interface actions.",
		[]string{"action"},
		nil,
	)
	toolsDesc = prometheus.NewDesc(
		"fmt_tool_views",
		"Views of a tool path.",
		[]string{"path"},
		nil,
	)
	countriesDesc = prometheus.NewDesc(
		"fmt_country_visits",
		"Visits by country.",
		[]string{"country"},
		nil,
	)
	sessionAvgDesc = prometheus.NewDesc(
		"fmt_session_seconds_average",
		"Average visible time on the site.",
		nil,
		nil,
	)
	sessionMedianDesc = prometheus.NewDesc(
		"fmt_session_seconds_median",
		"Median visible time on the site.",
		nil,
		nil,
	)
	sessionBucketsDesc = prometheus.NewDesc(
		"fmt_session_buckets",
		"Visits grouped by visible time.",
		[]string{"bucket"},
		nil,
	)
)

func (a API) metrics() http.Handler {
	registry := prometheus.NewRegistry()
	registry.MustRegister(collector{app: a.App})

	return promhttp.HandlerFor(registry, promhttp.HandlerOpts{})
}

type collector struct {
	app *application.Service
}

func (c collector) Describe(ch chan<- *prometheus.Desc) {
	ch <- visitsDesc
	ch <- actionsDesc
	ch <- toolsDesc
	ch <- countriesDesc
	ch <- sessionAvgDesc
	ch <- sessionMedianDesc
	ch <- sessionBucketsDesc
}

func (c collector) Collect(ch chan<- prometheus.Metric) {
	stats, err := c.app.Stats(context.Background())
	if err != nil {
		ch <- prometheus.NewInvalidMetric(visitsDesc, err)
		return
	}

	ch <- prometheus.MustNewConstMetric(visitsDesc, prometheus.GaugeValue, float64(stats.Visits))
	emitCounts(ch, actionsDesc, stats.Actions)
	emitCounts(ch, toolsDesc, stats.Tools)
	emitCounts(ch, countriesDesc, stats.Countries)
	ch <- prometheus.MustNewConstMetric(
		sessionAvgDesc,
		prometheus.GaugeValue,
		float64(stats.Duration.AverageMs)/1000,
	)
	ch <- prometheus.MustNewConstMetric(
		sessionMedianDesc,
		prometheus.GaugeValue,
		float64(stats.Duration.MedianMs)/1000,
	)
	emitCounts(ch, sessionBucketsDesc, stats.Duration.Buckets)
}

func emitCounts(ch chan<- prometheus.Metric, desc *prometheus.Desc, items []domain.Count) {
	for _, item := range items {
		ch <- prometheus.MustNewConstMetric(
			desc,
			prometheus.GaugeValue,
			float64(item.Value),
			item.Label,
		)
	}
}
