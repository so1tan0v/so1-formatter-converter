// Package geo сопоставляет IPv4 со страной по CSV DB-IP.
package geo

import (
	"bufio"
	"encoding/binary"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const sourceURL = "https://raw.githubusercontent.com/sapics/ip-location-db/main/dbip-country/dbip-country-ipv4.csv"

// DB — отсортированные диапазоны стран.
type DB struct {
	ranges []ipRange
}

type ipRange struct {
	start   uint32
	end     uint32
	country string
}

// Load читает CSV с диска.
func Load(path string) (*DB, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	return Parse(file)
}

// Parse читает строки start,end,country.
func Parse(reader io.Reader) (*DB, error) {
	scanner := bufio.NewScanner(reader)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	var ranges []ipRange
	for scanner.Scan() {
		start, end, country, ok := parseLine(scanner.Text())
		if ok {
			ranges = append(ranges, ipRange{start: start, end: end, country: country})
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return &DB{ranges: ranges}, nil
}

// Country возвращает код страны или пустую строку.
func (db *DB) Country(ip string) string {
	if db == nil {
		return ""
	}

	parsed := net.ParseIP(strings.TrimPrefix(ip, "::ffff:"))
	if parsed == nil {
		return ""
	}

	v4 := parsed.To4()
	if v4 == nil {
		return ""
	}

	value := binary.BigEndian.Uint32(v4)
	low, high := 0, len(db.ranges)
	for low < high {
		mid := (low + high) / 2
		if db.ranges[mid].start <= value {
			low = mid + 1
		} else {
			high = mid
		}
	}

	if low == 0 {
		return ""
	}

	item := db.ranges[low-1]
	if value >= item.start && value <= item.end {
		return item.country
	}

	return ""
}

// Ensure скачивает справочник, если файла ещё нет.
func Ensure(path string) error {
	info, err := os.Stat(path)
	if err == nil && info.Size() > 1000 {
		return nil
	}

	client := &http.Client{Timeout: 30 * time.Second}
	response, err := client.Get(sourceURL)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return io.ErrUnexpectedEOF
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = io.Copy(file, response.Body)

	return err
}

func parseLine(line string) (uint32, uint32, string, bool) {
	line = strings.TrimSpace(line)
	if line == "" || strings.HasPrefix(line, "#") {
		return 0, 0, "", false
	}

	parts := strings.Split(line, ",")
	if len(parts) < 3 {
		return 0, 0, "", false
	}

	start, ok := ipv4(strings.Trim(parts[0], `"`))
	if !ok {
		return 0, 0, "", false
	}

	end, ok := ipv4(strings.Trim(parts[1], `"`))
	if !ok {
		return 0, 0, "", false
	}

	country := strings.ToUpper(strings.Trim(strings.TrimSpace(parts[2]), `"`))
	if len(country) != 2 {
		return 0, 0, "", false
	}

	return start, end, country, true
}

func ipv4(value string) (uint32, bool) {
	parsed := net.ParseIP(value)
	if parsed == nil {
		return 0, false
	}

	v4 := parsed.To4()
	if v4 == nil {
		return 0, false
	}

	return binary.BigEndian.Uint32(v4), true
}
