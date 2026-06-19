package ingester

import (
	"fmt"
	"strconv"
	"time"
)

func parseDate(s string) (time.Time, bool) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return t, false
	}
	return t, true
}

func parseInt32(s string) (int32, error) {
	if s == "" {
		return 0, nil
	}
	n, err := strconv.ParseInt(s, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("invalid integer %q", s)
	}
	return int32(n), nil
}
