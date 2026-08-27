package engagement

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/auth"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/httpx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/common/validatorx"
	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/geo1796/vigie-citoyenne-poitiers/postgres/dao"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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
				Status:      Status(row.Status),
				Reference:   row.Reference,
				AuthorEmail: row.AuthorEmail,
				EventDate:   asDatePtr(row.LatestEventDate),
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
	Engagement Engagement         `json:"engagement"`
	Updates    []EngagementUpdate `json:"updates"`
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

		updateRows, err := h.queries.ListEngagementUpdates(r.Context(), id)
		if err != nil {
			return fmt.Errorf("FindEngagement failed: %w", err)
		}

		// Hydratation des délibérations liées en une seule requête, plutôt qu'un
		// LEFT JOIN à une vingtaine de colonnes nullables par mise à jour.
		delibIDs := make([]uuid.UUID, 0, len(updateRows))
		for _, u := range updateRows {
			if u.DeliberationID != nil {
				delibIDs = append(delibIDs, *u.DeliberationID)
			}
		}

		delibByID := make(map[uuid.UUID]deliberation.Deliberation)
		if len(delibIDs) > 0 {
			delibRows, err := h.queries.ListDeliberationsByIDs(r.Context(), delibIDs)
			if err != nil {
				return fmt.Errorf("FindEngagement failed: %w", err)
			}
			for _, d := range delibRows {
				delibByID[d.ID] = mapDeliberation(d)
			}
		}

		updates := make([]EngagementUpdate, len(updateRows))
		for i, u := range updateRows {
			update := EngagementUpdate{
				ID:             u.ID,
				Status:         Status(u.Status),
				Content:        u.Content,
				EventDate:      u.EventDate,
				ExternalSource: u.ExternalSource,
				AuthorEmail:    u.AuthorEmail,
				CreatedAt:      u.CreatedAt,
			}
			if u.DeliberationID != nil {
				if d, ok := delibByID[*u.DeliberationID]; ok {
					update.Deliberation = &d
				}
			}
			updates[i] = update
		}

		return httpx.JSON(w, http.StatusOK, FindEngagementOutput{
			Engagement: Engagement{
				ID:          row.ID,
				Title:       row.Title,
				Status:      Status(row.Status),
				Reference:   row.Reference,
				AuthorEmail: row.AuthorEmail,
				EventDate:   asDatePtr(row.LatestEventDate),
				CreatedAt:   row.CreatedAt,
				UpdatedAt:   row.UpdatedAt,
			},
			Updates: updates,
		})
	})
}

// ---------- CreateEngagement ----------

type CreateEngagementHandler interface {
	CreateEngagement() http.HandlerFunc
}

type createEngagementHandler struct {
	queries *dao.Queries
}

func NewCreateEngagementHandler(queries *dao.Queries) CreateEngagementHandler {
	return &createEngagementHandler{queries}
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

		created, err := h.queries.CreateEngagement(r.Context(), dao.CreateEngagementParams{
			Title:     in.Title,
			Reference: in.Reference,
			CreatedBy: authedUser.ID,
		})
		if err != nil {
			return fmt.Errorf("CreateEngagement failed: %w", err)
		}

		// Un engagement sans mise à jour est « en attente » par défaut.
		return httpx.JSON(w, http.StatusCreated, Engagement{
			ID:          created.ID,
			Title:       created.Title,
			Status:      StatusEnAttente,
			Reference:   created.Reference,
			AuthorEmail: authedUser.Email,
			CreatedAt:   created.CreatedAt,
			UpdatedAt:   created.UpdatedAt,
		})
	})
}

// ---------- UpdateEngagement ----------

type UpdateEngagementHandler interface {
	UpdateEngagement() http.HandlerFunc
}

type updateEngagementHandler struct {
	queries *dao.Queries
}

func NewUpdateEngagementHandler(queries *dao.Queries) UpdateEngagementHandler {
	return &updateEngagementHandler{queries}
}

func (h *updateEngagementHandler) UpdateEngagement() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		authedUser, ok := r.Context().Value("authedUser").(auth.AuthedUser)
		if !ok {
			return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
		}

		id, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		var in UpdateEngagementInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		// L'engagement doit exister : on renvoie 404 plutôt qu'un résultat vide.
		existing, err := h.queries.FindEngagementByID(r.Context(), id)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return httpx.NewError(http.StatusNotFound, "engagement not found")
			}
			return fmt.Errorf("UpdateEngagement failed: %w", err)
		}

		// Seul l'auteur de l'engagement peut le modifier.
		if existing.CreatedBy != authedUser.ID {
			return httpx.NewError(http.StatusForbidden, "forbidden")
		}

		updated, err := h.queries.UpdateEngagement(r.Context(), dao.UpdateEngagementParams{
			Title:     in.Title,
			Reference: in.Reference,
			ID:        id,
		})
		if err != nil {
			return fmt.Errorf("UpdateEngagement failed: %w", err)
		}

		// Le statut et la date d'événement sont dérivés des mises à jour : l'édition du
		// titre/référence ne les change pas, on les reprend de `existing`.
		return httpx.JSON(w, http.StatusOK, Engagement{
			ID:          updated.ID,
			Title:       updated.Title,
			Status:      Status(existing.Status),
			Reference:   updated.Reference,
			AuthorEmail: existing.AuthorEmail,
			EventDate:   asDatePtr(existing.LatestEventDate),
			CreatedAt:   updated.CreatedAt,
			UpdatedAt:   updated.UpdatedAt,
		})
	})
}

// ---------- CreateEngagementUpdate ----------

type CreateEngagementUpdateHandler interface {
	CreateEngagementUpdate() http.HandlerFunc
}

type createEngagementUpdateHandler struct {
	queries *dao.Queries
}

func NewCreateEngagementUpdateHandler(queries *dao.Queries) CreateEngagementUpdateHandler {
	return &createEngagementUpdateHandler{queries}
}

func (h *createEngagementUpdateHandler) CreateEngagementUpdate() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		authedUser, ok := r.Context().Value("authedUser").(auth.AuthedUser)
		if !ok {
			return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
		}

		engagementID, err := uuid.Parse(chi.URLParam(r, "id"))
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		var in CreateEngagementUpdateInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		eventDate, err := time.Parse("2006-01-02", in.EventDate)
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, "invalid eventDate, expected YYYY-MM-DD")
		}

		// L'engagement doit exister : on renvoie 404 plutôt qu'une violation de
		// clé étrangère opaque.
		if _, err := h.queries.FindEngagementByID(r.Context(), engagementID); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return httpx.NewError(http.StatusNotFound, "engagement not found")
			}
			return fmt.Errorf("CreateEngagementUpdate failed: %w", err)
		}

		created, err := h.queries.CreateEngagementUpdate(r.Context(), dao.CreateEngagementUpdateParams{
			EngagementID:   engagementID,
			Status:         string(in.Status),
			Content:        in.Content,
			EventDate:      eventDate,
			DeliberationID: in.DeliberationID,
			ExternalSource: in.ExternalSource,
			CreatedBy:      authedUser.ID,
		})
		if err != nil {
			// Violation de clé étrangère : la délibération référencée n'existe pas.
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				return httpx.NewError(http.StatusBadRequest, "invalid deliberation reference")
			}
			return fmt.Errorf("CreateEngagementUpdate failed: %w", err)
		}

		out := EngagementUpdate{
			ID:             created.ID,
			Status:         Status(created.Status),
			Content:        created.Content,
			EventDate:      created.EventDate,
			ExternalSource: created.ExternalSource,
			AuthorEmail:    authedUser.Email,
			CreatedAt:      created.CreatedAt,
		}
		if created.DeliberationID != nil {
			delibRows, err := h.queries.ListDeliberationsByIDs(r.Context(), []uuid.UUID{*created.DeliberationID})
			if err != nil {
				return fmt.Errorf("CreateEngagementUpdate failed: %w", err)
			}
			if len(delibRows) > 0 {
				d := mapDeliberation(delibRows[0])
				out.Deliberation = &d
			}
		}

		return httpx.JSON(w, http.StatusCreated, out)
	})
}

// ---------- UpdateEngagementUpdate ----------

type UpdateEngagementUpdateHandler interface {
	UpdateEngagementUpdate() http.HandlerFunc
}

type updateEngagementUpdateHandler struct {
	queries *dao.Queries
}

func NewUpdateEngagementUpdateHandler(queries *dao.Queries) UpdateEngagementUpdateHandler {
	return &updateEngagementUpdateHandler{queries}
}

func (h *updateEngagementUpdateHandler) UpdateEngagementUpdate() http.HandlerFunc {
	return httpx.Adapt(func(w http.ResponseWriter, r *http.Request) error {
		authedUser, ok := r.Context().Value("authedUser").(auth.AuthedUser)
		if !ok {
			return httpx.NewError(http.StatusInternalServerError, "authedUser not present in context")
		}

		updateID, err := uuid.Parse(chi.URLParam(r, "updateId"))
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		var in UpdateEngagementUpdateInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}
		if err := validatorx.Validate(in); err != nil {
			return httpx.NewError(http.StatusBadRequest, err.Error())
		}

		eventDate, err := time.Parse("2006-01-02", in.EventDate)
		if err != nil {
			return httpx.NewError(http.StatusBadRequest, "invalid eventDate, expected YYYY-MM-DD")
		}

		// La mise à jour doit exister : on renvoie 404 plutôt qu'un résultat vide.
		existing, err := h.queries.FindEngagementUpdateByID(r.Context(), updateID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return httpx.NewError(http.StatusNotFound, "engagement update not found")
			}
			return fmt.Errorf("UpdateEngagementUpdate failed: %w", err)
		}

		// Seul l'auteur de la mise à jour peut la modifier.
		if existing.CreatedBy != authedUser.ID {
			return httpx.NewError(http.StatusForbidden, "forbidden")
		}

		updated, err := h.queries.UpdateEngagementUpdate(r.Context(), dao.UpdateEngagementUpdateParams{
			ID:             updateID,
			Status:         string(in.Status),
			Content:        in.Content,
			EventDate:      eventDate,
			DeliberationID: in.DeliberationID,
			ExternalSource: in.ExternalSource,
		})
		if err != nil {
			// Violation de clé étrangère : la délibération référencée n'existe pas.
			var pgErr *pgconn.PgError
			if errors.As(err, &pgErr) && pgErr.Code == "23503" {
				return httpx.NewError(http.StatusBadRequest, "invalid deliberation reference")
			}
			return fmt.Errorf("UpdateEngagementUpdate failed: %w", err)
		}

		out := EngagementUpdate{
			ID:             updated.ID,
			Status:         Status(updated.Status),
			Content:        updated.Content,
			EventDate:      updated.EventDate,
			ExternalSource: updated.ExternalSource,
			AuthorEmail:    authedUser.Email,
			CreatedAt:      updated.CreatedAt,
		}
		if updated.DeliberationID != nil {
			delibRows, err := h.queries.ListDeliberationsByIDs(r.Context(), []uuid.UUID{*updated.DeliberationID})
			if err != nil {
				return fmt.Errorf("UpdateEngagementUpdate failed: %w", err)
			}
			if len(delibRows) > 0 {
				d := mapDeliberation(delibRows[0])
				out.Deliberation = &d
			}
		}

		return httpx.JSON(w, http.StatusOK, out)
	})
}

// asDatePtr convertit la valeur brute d'un agrégat SQL nullable (MAX(event_date))
// en *time.Time : pgx décode une DATE non nulle en time.Time, et NULL en nil.
func asDatePtr(v interface{}) *time.Time {
	if t, ok := v.(time.Time); ok {
		return &t
	}
	return nil
}

// mapDeliberation convertit une ligne DAO en DTO public de délibération.
func mapDeliberation(d dao.ListDeliberationsByIDsRow) deliberation.Deliberation {
	return deliberation.Deliberation{
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
