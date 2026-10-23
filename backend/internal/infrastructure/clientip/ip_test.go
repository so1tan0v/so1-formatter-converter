package clientip

import "testing"

func TestClient(t *testing.T) {
	got := Client("172.18.0.3:41234", "203.0.113.8, 172.18.0.3", "")
	if got != "203.0.113.8" {
		t.Fatalf("forwarded = %s", got)
	}

	got = Client("8.8.8.8:443", "203.0.113.8", "")
	if got != "8.8.8.8" {
		t.Fatalf("public peer = %s", got)
	}

	got = Client("127.0.0.1:8081", "", "::ffff:198.51.100.4")
	if got != "198.51.100.4" {
		t.Fatalf("real ip = %s", got)
	}
}
