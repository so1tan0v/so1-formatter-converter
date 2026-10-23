// Package config читает окружение процесса.
package config

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Config — параметры запуска.
type Config struct {
	Addr          string
	DBPath        string
	GeoPath       string
	Token         string
	RetentionDays int
}

// FromEnv собирает конфиг. Пустое хранение — 30 дней, 0 и forever — навсегда.
func FromEnv() Config {
	dbPath := env("BACKEND_DB", "data/backend.sqlite")

	return Config{
		Addr:          ":" + env("PORT", "8081"),
		DBPath:        dbPath,
		GeoPath:       filepath.Join(env("GEOIP_DIR", filepath.Dir(dbPath)), "geoip-country-ipv4.csv"),
		Token:         os.Getenv("BACKEND_TOKEN"),
		RetentionDays: retentionDays(os.Getenv("BACKEND_RETENTION_DAYS")),
	}
}

// RetentionLabel подпись окна хранения для лога.
func RetentionLabel(days int) string {
	if days == 0 {
		return "forever"
	}

	return strconv.Itoa(days) + "d"
}

func env(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}

	return value
}

func retentionDays(raw string) int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return 30
	}

	if strings.EqualFold(raw, "forever") {
		return 0
	}

	days, err := strconv.Atoi(raw)
	if err != nil || days < 0 {
		return 30
	}

	return days
}
