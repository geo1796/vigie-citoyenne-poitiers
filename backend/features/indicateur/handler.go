package indicateur

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
)

type ListIndicateursHandler interface {
	ListIndicateurs() http.HandlerFunc
}

type listIndicateursHandler struct {
	queries *dao.Queries
}

func NewListIndicateursHandler(queries *dao.Queries) ListIndicateursHandler {
	return &listIndicateursHandler{queries}
}

func (h *listIndicateursHandler) ListIndicateurs() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		rows, err := h.queries.ListIndicateurs(r.Context())
		if err != nil {
			return fmt.Errorf("ListIndicateurs failed: %w", err)
		}

		items := make([]Indicateur, len(rows))
		for i, row := range rows {
			items[i] = Indicateur{
				Key:               Key(row.Key),
				FirstReference:    row.FirstReference,
				LastReference:     row.LastReference,
				LastUpdate:        row.LastUpdatedAt,
				ObservationsCount: int(row.ObservationsCount),
			}
		}

		return httpx.JSON(w, http.StatusOK, items)
	})
}

type ListIndicateurObservationsHandler interface {
	ListIndicateurObservations() http.HandlerFunc
}

type listIndicateurObservationsHandler struct {
	queries *dao.Queries
}

func NewListIndicateurObservationsHandler(queries *dao.Queries) ListIndicateurObservationsHandler {
	return &listIndicateurObservationsHandler{queries}
}

func (h *listIndicateurObservationsHandler) ListIndicateurObservations() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		key := Key(chi.URLParam(r, "key"))
		if !key.IsValid() {
			return httpx.NewError(http.StatusBadRequest, fmt.Sprintf("invalid indicateur key: %s", key))
		}

		rows, err := h.queries.ListIndicateurObservationsByKey(r.Context(), string(key))
		if err != nil {
			return fmt.Errorf("ListIndicateurObservations failed: %w", err)
		}

		if len(rows) == 0 {
			return httpx.NewError(http.StatusNotFound, fmt.Sprintf("observation not found for indicateur key=%s", key))
		}

		items := make([]Observation, len(rows))
		for i, row := range rows {
			var data map[string]any
			if err := json.Unmarshal(row.Data, &data); err != nil {
				return fmt.Errorf("decode observation: key=%s ref=%s: %w", key, row.Reference, err)
			}
			items[i] = Observation{
				ID:        row.ID,
				Key:       Key(row.Key),
				Reference: row.Reference,
				Data:      data,
				CreatedAt: row.CreatedAt,
				UpdatedAt: row.UpdatedAt,
			}
		}

		return httpx.JSON(w, http.StatusOK, items)
	})
}
