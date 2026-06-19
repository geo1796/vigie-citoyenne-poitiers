package engagement

import (
	"context"
	"errors"

	"github.com/geo1796/vigie-citoyenne-poitiers/postgres"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"
)

// ErrInvalidReference est renvoyée lorsqu'une délibération ou une observation
// référencée par l'engagement n'existe pas (violation de clé étrangère).
var ErrInvalidReference = errors.New("invalid deliberation or observation reference")

type CreateEngagementService interface {
	CreateEngagement(ctx context.Context, input CreateEngagementInput, authorID uuid.UUID) (dao.AppEngagement, error)
}

type createEngagementService struct {
	store postgres.Store
}

func NewCreateEngagementService(store postgres.Store) CreateEngagementService {
	return &createEngagementService{store}
}

func (s *createEngagementService) CreateEngagement(ctx context.Context, input CreateEngagementInput, authorID uuid.UUID) (dao.AppEngagement, error) {
	var created dao.AppEngagement

	err := s.store.ExecTx(ctx, func(q *dao.Queries) error {
		engagement, err := q.CreateEngagement(ctx, dao.CreateEngagementParams{
			Title:     input.Title,
			Content:   input.Content,
			CreatedBy: authorID,
		})
		if err != nil {
			return err
		}
		created = engagement

		if len(input.DeliberationIDs) > 0 {
			params := make([]dao.LinkEngagementDeliberationsParams, len(input.DeliberationIDs))
			for i, id := range input.DeliberationIDs {
				params[i] = dao.LinkEngagementDeliberationsParams{
					EngagementID:   engagement.ID,
					DeliberationID: id,
				}
			}
			batch := q.LinkEngagementDeliberations(ctx, params)
			defer batch.Close()

			var batchErr error
			batch.Exec(func(_ int, execErr error) {
				if execErr != nil && batchErr == nil {
					batchErr = execErr
				}
			})
			if batchErr != nil {
				return batchErr
			}
		}

		if len(input.ObservationIDs) > 0 {
			params := make([]dao.LinkEngagementObservationsParams, len(input.ObservationIDs))
			for i, id := range input.ObservationIDs {
				params[i] = dao.LinkEngagementObservationsParams{
					EngagementID:  engagement.ID,
					ObservationID: id,
				}
			}
			batch := q.LinkEngagementObservations(ctx, params)
			defer batch.Close()

			var batchErr error
			batch.Exec(func(_ int, execErr error) {
				if execErr != nil && batchErr == nil {
					batchErr = execErr
				}
			})
			if batchErr != nil {
				return batchErr
			}
		}

		return nil
	})

	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" {
			return dao.AppEngagement{}, ErrInvalidReference
		}
		return dao.AppEngagement{}, err
	}

	return created, nil
}
