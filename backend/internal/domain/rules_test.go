package domain

import "testing"

func TestRules(t *testing.T) {
	id, err := ParseVisitID("11111111-1111-4111-8111-111111111111")
	if err != nil || id != "11111111-1111-4111-8111-111111111111" {
		t.Fatalf("visit = %s %v", id, err)
	}

	if _, err := ParseVisitID("not-a-uuid"); err != ErrInvalid {
		t.Fatalf("invalid uuid = %v", err)
	}

	if _, err := Action("format"); err != nil {
		t.Fatal(err)
	}

	if _, err := Action("drop"); err != ErrInvalid {
		t.Fatalf("action = %v", err)
	}

	if Language("RU") != "ru" || CountryCode("xx") != "" || Path("formatter") != "" {
		t.Fatal("normalization")
	}

	if ClampDuration(-1) != 0 || ClampDuration(13*60*60*1000) != 12*60*60*1000 {
		t.Fatal("duration")
	}
}
