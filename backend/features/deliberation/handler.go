package deliberation

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------- ListDeliberations ----------

type ListDeliberationsHandler interface {
	ListDeliberations() http.HandlerFunc
}

type listDeliberationsHandler struct {
	queries *dao.Queries
}

func NewListDeliberationsHandler(queries *dao.Queries) ListDeliberationsHandler {
	return &listDeliberationsHandler{queries}
}

type ListDeliberationsOutput struct {
	HasMore    bool           `json:"hasMore"`
	NextOffset int            `json:"nextOffset"`
	Items      []Deliberation `json:"items"`
}

func (h *listDeliberationsHandler) ListDeliberations() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		params, err := h.parseURLParams(r)
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		rows, err := h.queries.ListDeliberations(r.Context(), params)
		if err != nil {
			return fmt.Errorf("ListDeliberations failed: %w", err)
		}

		hasMore := len(rows) > int(params.Limit)
		nextOffset := 0
		if hasMore {
			rows = rows[:params.Limit]
			nextOffset = int(params.Offset) + len(rows)
		}

		items := make([]Deliberation, len(rows))
		for i, row := range rows {
			items[i] = Deliberation{
				ID:               row.ID,
				DelibID:          row.DelibID,
				Collectivite:     Collectivite(row.Collectivite),
				Instance:         Instance(row.Instance),
				CollNom:          row.CollNom,
				CollSiret:        row.CollSiret,
				DelibDate:        row.DelibDate,
				DelibMatiereCode: row.DelibMatiereCode,
				DelibMatiereNom:  row.DelibMatiereNom,
				DelibObjet:       row.DelibObjet,
				PrefID:           row.PrefID,
				PrefDate:         row.PrefDate,
				VoteEffectif:     int(row.VoteEffectif),
				VoteReel:         int(row.VoteReel),
				VotePour:         int(row.VotePour),
				VoteContre:       int(row.VoteContre),
				VoteAbstention:   int(row.VoteAbstention),
				CreatedAt:        row.CreatedAt,
				UpdatedAt:        row.UpdatedAt,
			}
		}

		return httpx.JSON(w, http.StatusOK, ListDeliberationsOutput{
			HasMore:    hasMore,
			NextOffset: nextOffset,
			Items:      items,
		})
	})
}

func (h *listDeliberationsHandler) parseURLParams(r *http.Request) (dao.ListDeliberationsParams, error) {
	var dateFrom *time.Time
	dateFromParam := r.URL.Query().Get("dateFrom")
	if dateFromParam != "" {
		if parsed, err := parseDate(dateFromParam); err != nil {
			return dao.ListDeliberationsParams{}, fmt.Errorf("failed to parse 'dateFrom': %w", err)
		} else {
			dateFrom = &parsed
		}
	}

	var dateTo *time.Time
	dateToParam := r.URL.Query().Get("dateTo")
	if dateToParam != "" {
		if parsed, err := parseDate(dateToParam); err != nil {
			return dao.ListDeliberationsParams{}, fmt.Errorf("failed to parse 'dateTo': %w", err)
		} else {
			dateTo = &parsed
		}
	}

	limit := int32(25)
	limitParam := r.URL.Query().Get("limit")
	if limitParam != "" {
		if parsed, err := parseInt32(limitParam); err != nil {
			return dao.ListDeliberationsParams{}, fmt.Errorf("failed to parse 'limit': %w", err)
		} else {
			limit = parsed
		}
	}

	offset := int32(0)
	offsetParam := r.URL.Query().Get("offset")
	if offsetParam != "" {
		if parsed, err := parseInt32(offsetParam); err != nil {
			return dao.ListDeliberationsParams{}, fmt.Errorf("failed to parse 'offset': %w", err)
		} else {
			offset = parsed
		}
	}

	collectivites := r.URL.Query()["collectivites"]
	//support csv
	if len(collectivites) == 1 && strings.Contains(collectivites[0], ",") {
		collectivites = strings.Split(collectivites[0], ",")
	}

	instances := r.URL.Query()["instances"]
	//support csv
	if len(instances) == 1 && strings.Contains(instances[0], ",") {
		instances = strings.Split(instances[0], ",")
	}

	var search *string
	searchParam := r.URL.Query().Get("search")
	if searchParam != "" {
		search = &searchParam
	}

	sortAsc := r.URL.Query().Get("sortAsc") == "true"

	return dao.ListDeliberationsParams{
		Search:        search,
		Collectivites: collectivites,
		Instances:     instances,
		DateFrom:      dateFrom,
		DateTo:        dateTo,
		Limit:         limit,
		Offset:        offset,
		SortAsc:       sortAsc,
	}, nil
}

// ---------- FindDeliberation ----------

type FindDeliberationHandler interface {
	FindDeliberation() http.HandlerFunc
}

type findDeliberationHandler struct {
	queries *dao.Queries
}

func NewFindDeliberationHandler(queries *dao.Queries) FindDeliberationHandler {
	return &findDeliberationHandler{queries}
}

type FindDeliberationOutput struct {
	Deliberation Deliberation `json:"deliberation"`
	Documents    []Document   `json:"documents"`
}

func (h *findDeliberationHandler) FindDeliberation() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		row, err := h.queries.FindDeliberationByID(r.Context(), id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return httpx.NewError(http.StatusNotFound, err.Error())
			}
			return fmt.Errorf("FindDeliberation failed: %w", err)
		}

		var documents []Document
		if err = json.Unmarshal(row.Documents, &documents); err != nil {
			return fmt.Errorf("FindDeliberation failed: %w", err)
		}

		return httpx.JSON(w, http.StatusOK, FindDeliberationOutput{
			Documents: documents,
			Deliberation: Deliberation{
				ID:               row.ID,
				DelibID:          row.DelibID,
				Collectivite:     Collectivite(row.Collectivite),
				Instance:         Instance(row.Instance),
				CollNom:          row.CollNom,
				CollSiret:        row.CollSiret,
				DelibDate:        row.DelibDate,
				DelibMatiereCode: row.DelibMatiereCode,
				DelibMatiereNom:  row.DelibMatiereNom,
				DelibObjet:       row.DelibObjet,
				PrefID:           row.PrefID,
				PrefDate:         row.PrefDate,
				VoteEffectif:     int(row.VoteEffectif),
				VoteReel:         int(row.VoteReel),
				VotePour:         int(row.VotePour),
				VoteContre:       int(row.VoteContre),
				VoteAbstention:   int(row.VoteAbstention),
				CreatedAt:        row.CreatedAt,
				UpdatedAt:        row.UpdatedAt,
			},
		})
	})
}
