package engagement

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/validatorx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/indicateur"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ---------- ListEngagements ----------

type ListEngagementsHandler interface {
	ListEngagements() http.HandlerFunc
}

type listEngagementsHandler struct {
	queries *dao.Queries
}

func NewListEngagementsHandler(queries *dao.Queries) ListEngagementsHandler {
	return &listEngagementsHandler{queries}
}

type ListEngagementsOutput struct {
	HasMore    bool         `json:"hasMore"`
	NextOffset int          `json:"nextOffset"`
	Items      []Engagement `json:"items"`
}

func (h *listEngagementsHandler) ListEngagements() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		limit := int32(25)
		if limitParam := r.URL.Query().Get("limit"); limitParam != "" {
			parsed, err := strconv.Atoi(limitParam)
			if err != nil {
				return httpx.NewError(http.StatusBadRequest, "failed to parse 'limit'")
			}
			limit = int32(parsed)
		}

		offset := int32(0)
		if offsetParam := r.URL.Query().Get("offset"); offsetParam != "" {
			parsed, err := strconv.Atoi(offsetParam)
			if err != nil {
				return httpx.NewError(http.StatusBadRequest, "failed to parse 'offset'")
			}
			offset = int32(parsed)
		}

		// On demande une ligne de plus que `limit` pour savoir s'il reste des
		// résultats (pattern utilisé par la feature deliberation).
		rows, err := h.queries.ListEngagements(r.Context(), dao.ListEngagementsParams{
			Limit:  limit + 1,
			Offset: offset,
		})
		if err != nil {
			return fmt.Errorf("ListEngagements failed: %w", err)
		}

		hasMore := len(rows) > int(limit)
		nextOffset := 0
		if hasMore {
			rows = rows[:limit]
			nextOffset = int(offset) + len(rows)
		}

		items := make([]Engagement, len(rows))
		for i, row := range rows {
			items[i] = Engagement{
				ID:          row.ID,
				Title:       row.Title,
				Content:     row.Content,
				AuthorEmail: row.AuthorEmail,
				CreatedAt:   row.CreatedAt,
				UpdatedAt:   row.UpdatedAt,
			}
		}

		return httpx.JSON(w, http.StatusOK, ListEngagementsOutput{
			HasMore:    hasMore,
			NextOffset: nextOffset,
			Items:      items,
		})
	})
}

// ---------- FindEngagement ----------

type FindEngagementHandler interface {
	FindEngagement() http.HandlerFunc
}

type findEngagementHandler struct {
	queries *dao.Queries
}

func NewFindEngagementHandler(queries *dao.Queries) FindEngagementHandler {
	return &findEngagementHandler{queries}
}

type FindEngagementOutput struct {
	Engagement    Engagement                  `json:"engagement"`
	Deliberations []deliberation.Deliberation `json:"deliberations"`
	Observations  []indicateur.Observation    `json:"observations"`
}

func (h *findEngagementHandler) FindEngagement() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		row, err := h.queries.FindEngagementByID(r.Context(), id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return httpx.NewError(http.StatusNotFound, err.Error())
			}
			return fmt.Errorf("FindEngagement failed: %w", err)
		}

		delibRows, err := h.queries.ListEngagementDeliberations(r.Context(), id)
		if err != nil {
			return fmt.Errorf("FindEngagement failed: %w", err)
		}

		deliberations := make([]deliberation.Deliberation, len(delibRows))
		for i, d := range delibRows {
			deliberations[i] = deliberation.Deliberation{
				ID:               d.ID,
				DelibID:          d.DelibID,
				Collectivite:     deliberation.Collectivite(d.Collectivite),
				Instance:         deliberation.Instance(d.Instance),
				CollNom:          d.CollNom,
				CollSiret:        d.CollSiret,
				DelibDate:        d.DelibDate,
				DelibMatiereCode: d.DelibMatiereCode,
				DelibMatiereNom:  d.DelibMatiereNom,
				DelibObjet:       d.DelibObjet,
				PrefID:           d.PrefID,
				PrefDate:         d.PrefDate,
				VoteEffectif:     int(d.VoteEffectif),
				VoteReel:         int(d.VoteReel),
				VotePour:         int(d.VotePour),
				VoteContre:       int(d.VoteContre),
				VoteAbstention:   int(d.VoteAbstention),
				CreatedAt:        d.CreatedAt,
				UpdatedAt:        d.UpdatedAt,
			}
		}

		obsRows, err := h.queries.ListEngagementObservations(r.Context(), id)
		if err != nil {
			return fmt.Errorf("FindEngagement failed: %w", err)
		}

		observations := make([]indicateur.Observation, len(obsRows))
		for i, o := range obsRows {
			var data map[string]any
			if err = json.Unmarshal(o.Data, &data); err != nil {
				return fmt.Errorf("FindEngagement failed: %w", err)
			}
			observations[i] = indicateur.Observation{
				ID:        o.ID,
				Key:       indicateur.Key(o.Key),
				Reference: o.Reference,
				Data:      data,
				CreatedAt: o.CreatedAt,
				UpdatedAt: o.UpdatedAt,
			}
		}

		return httpx.JSON(w, http.StatusOK, FindEngagementOutput{
			Engagement: Engagement{
				ID:          row.ID,
				Title:       row.Title,
				Content:     row.Content,
				AuthorEmail: row.AuthorEmail,
				CreatedAt:   row.CreatedAt,
				UpdatedAt:   row.UpdatedAt,
			},
			Deliberations: deliberations,
			Observations:  observations,
		})
	})
}

// ---------- CreateEngagement ----------

type CreateEngagementHandler interface {
	CreateEngagement() http.HandlerFunc
}

type createEngagementHandler struct {
	queries *dao.Queries
	service CreateEngagementService
}

func NewCreateEngagementHandler(queries *dao.Queries, service CreateEngagementService) CreateEngagementHandler {
	return &createEngagementHandler{queries, service}
}

func (h *createEngagementHandler) CreateEngagement() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		authedUser, ok := r.Context().Value("authedUser").(auth.AuthedUser)
		if !ok {
			return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
		}

		var in CreateEngagementInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		created, err := h.service.CreateEngagement(r.Context(), in, authedUser.ID)
		if err != nil {
			if errors.Is(err, ErrInvalidReference) {
				return httpx.NewError(http.StatusBadRequest, err.Error())
			}
			return fmt.Errorf("CreateEngagement failed: %w", err)
		}

		return httpx.JSON(w, http.StatusCreated, Engagement{
			ID:          created.ID,
			Title:       created.Title,
			Content:     created.Content,
			AuthorEmail: authedUser.Email,
			CreatedAt:   created.CreatedAt,
			UpdatedAt:   created.UpdatedAt,
		})
	})
}
