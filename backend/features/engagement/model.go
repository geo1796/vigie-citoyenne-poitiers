package engagement

import (
	"time"

	"github.com/google/uuid"
)

// Engagement est la représentation publique d'un engagement de campagne.
type Engagement struct {
	ID uuid.UUID `json:"id"`

	Title   string `json:"title"`
	Content string `json:"content"`

	AuthorEmail string `json:"authorEmail"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateEngagementInput est le corps attendu pour la création d'un engagement.
// Les listes d'identifiants sont optionnelles : un engagement peut n'être lié à
// aucune délibération ni observation.
type CreateEngagementInput struct {
	Title           string      `json:"title" validate:"required"`
	Content         string      `json:"content" validate:"required"`
	DeliberationIDs []uuid.UUID `json:"deliberationIds"`
	ObservationIDs  []uuid.UUID `json:"observationIds"`
}
