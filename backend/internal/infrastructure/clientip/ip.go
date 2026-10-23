// Package clientip достаёт адрес посетителя из запроса за прокси.
package clientip

import (
	"net"
	"net/http"
	"strings"
)

// FromRequest доверяет X-Forwarded-For только если сосед — локальный прокси.
func FromRequest(r *http.Request) string {
	return Client(r.RemoteAddr, r.Header.Get("X-Forwarded-For"), r.Header.Get("X-Real-IP"))
}

// Client возвращает адрес посетителя.
func Client(remoteAddr string, forwarded, realIP string) string {
	peer := host(remoteAddr)
	if isPrivate(peer) {
		if client := firstPublic(forwarded); client != "" {
			return client
		}

		if real := normalize(realIP); real != "" {
			return real
		}
	}

	if peer == "" {
		return "0.0.0.0"
	}

	return peer
}

func firstPublic(forwarded string) string {
	for _, part := range strings.Split(forwarded, ",") {
		ip := normalize(part)
		if ip != "" {
			return ip
		}
	}

	return ""
}

func host(remoteAddr string) string {
	if host, _, err := net.SplitHostPort(remoteAddr); err == nil {
		return normalize(host)
	}

	return normalize(remoteAddr)
}

func normalize(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, "[]")
	value = strings.TrimPrefix(value, "::ffff:")
	if host, _, err := net.SplitHostPort(value); err == nil && strings.Count(value, ":") == 1 {
		value = host
	}

	parsed := net.ParseIP(value)
	if parsed == nil {
		return ""
	}

	if v4 := parsed.To4(); v4 != nil {
		return v4.String()
	}

	return parsed.String()
}

func isPrivate(value string) bool {
	parsed := net.ParseIP(value)
	if parsed == nil {
		return true
	}

	return parsed.IsLoopback() || parsed.IsPrivate() || parsed.IsLinkLocalUnicast()
}
