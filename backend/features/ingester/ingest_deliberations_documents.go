package ingester

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

func (s *service) IngestDeliberationsDocuments(ctx context.Context) error {
	rows, err := s.queries.ListDeliberationsWithoutDocuments(ctx, 50)
	if err != nil {
		return fmt.Errorf("failed to list deliberations without documents: %w", err)
	}

	for _, row := range rows {
		docs, err := s.webdelib.ResolveDeliberationDocuments(row.ID, row.DelibID, deliberation.Instance(row.Instance))
		if err != nil {
			logger.Error("failed to resolve deliberation documents",
				logger.Any("row", row),
				logger.Err(err))
			continue
		}

		docsBytes, err := json.Marshal(docs)
		if err != nil {
			logger.Error("failed to marshal deliberation documents",
				logger.Any("row", row),
				logger.Any("docs", docs),
				logger.Err(err))
			continue
		}

		if err := s.queries.SetDeliberationDocuments(ctx, dao.SetDeliberationDocumentsParams{
			ID:        row.ID,
			Documents: docsBytes,
		}); err != nil {
			logger.Error("failed to set deliberation documents",
				logger.Any("row", row),
				logger.Any("docsBytes", docsBytes),
				logger.Err(err))
			continue
		}
	}

	return nil
}
