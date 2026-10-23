package geo

import (
	"strings"
	"testing"
)

func TestCountry(t *testing.T) {
	db, err := Parse(strings.NewReader("1.0.0.0,1.0.0.255,AU\n8.8.8.0,8.8.8.255,US\n"))
	if err != nil {
		t.Fatal(err)
	}

	if got := db.Country("8.8.8.8"); got != "US" {
		t.Fatalf("country = %s", got)
	}

	if got := db.Country("9.9.9.9"); got != "" {
		t.Fatalf("missing = %s", got)
	}

	if got := db.Country("::ffff:1.0.0.8"); got != "AU" {
		t.Fatalf("mapped = %s", got)
	}
}
