package domain

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
)

// ErrInvalid означает, что отчёт нельзя сохранить.
var ErrInvalid = errors.New("invalid analytics report")

const maxLabel = 180

// ParseVisitID принимает UUID визита.
func ParseVisitID(value string) (string, error) {
	id, err := uuid.Parse(strings.TrimSpace(value))
	if err != nil {
		return "", ErrInvalid
	}

	return id.String(), nil
}

// Action оставляет только известные действия интерфейса.
func Action(value string) (string, error) {
	switch value {
	case "view", "format", "convert", "render", "copy", "sample", "download", "swap", "diff", "open":
		return value, nil
	default:
		return "", ErrInvalid
	}
}

// Language оставляет русский и английский.
func Language(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "ru", "en":
		return strings.ToLower(strings.TrimSpace(value))
	default:
		return ""
	}
}

// CountryCode принимает двухбуквенный код и отбрасывает служебные значения CDN.
func CountryCode(value string) string {
	code := strings.ToUpper(strings.TrimSpace(value))
	if len(code) == 2 && code != "XX" && code != "T1" {
		return code
	}

	return ""
}

// Path оставляет короткий путь сайта.
func Path(value string) string {
	value = strings.TrimSpace(value)
	if !strings.HasPrefix(value, "/") || strings.ContainsAny(value, "\r\n") {
		return ""
	}

	if len(value) > maxLabel {
		return value[:maxLabel]
	}

	return value
}

// Label оставляет короткую подпись, если это не путь.
func Label(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || strings.ContainsAny(value, "\r\n") || len(value) > maxLabel {
		return ""
	}

	return value
}

// ClampDuration ограничивает видимое время двенадцатью часами.
func ClampDuration(value int64) int64 {
	if value < 0 {
		return 0
	}

	const maxDuration = 12 * time.Hour
	if value > maxDuration.Milliseconds() {
		return maxDuration.Milliseconds()
	}

	return value
}
