package ingester

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
)

type Service interface {
	Ingest(ctx context.Context, args []string) error
	IngestDeliberations(ctx context.Context) error
	IngestIndicateurs(ctx context.Context) error
	IngestDeliberationsDocuments(ctx context.Context) error
}

type service struct {
	webdelib WebdelibClient
	datafair DatafairClient
	queries  *dao.Queries
}

func NewService(client *http.Client, queries *dao.Queries) (Service, error) {
	return &service{
		webdelib: NewWebdelibClient(client),
		datafair: NewDatafairClient(client),
		queries:  queries,
	}, nil
}

func (s *service) Ingest(ctx context.Context, args []string) error {
	if len(args) < 1 {
		return errors.New("args must not be empty")
	}

	switch args[0] {
	case "deliberations":
		if len(args) == 2 && args[1] == "documents" {
			return s.IngestDeliberationsDocuments(ctx)
		}
		return s.IngestDeliberations(ctx)
	case "indicateurs":
		return s.IngestIndicateurs(ctx)
	default:
		return fmt.Errorf("unsupported args: %v", args)
	}
}
