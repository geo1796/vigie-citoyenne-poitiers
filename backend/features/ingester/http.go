package ingester

import (
	"net/http"
	"time"
)

const userAgent = "vigie-citoyenne-poitiers/0.1 (+https://poitiers.vigie-citoyenne.fr, contact@vigie-citoyenne.fr)"

type customTransport struct {
	next http.RoundTripper
}

func (t *customTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	// The RoundTripper contract forbids mutating the request we're handed,
	// so we clone before touching the header.
	r := req.Clone(req.Context())
	if r.Header.Get("User-Agent") == "" {
		r.Header.Set("User-Agent", userAgent)
	}
	return t.next.RoundTrip(r)
}

func NewHTTPClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout:   timeout,
		Transport: &customTransport{next: http.DefaultTransport},
	}
}
