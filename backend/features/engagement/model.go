package engagement

import (
	"time"

	"github.com/geo1796/vigie-citoyenne-poitiers/features/deliberation"
	"github.com/google/uuid"
)

// Status décrit l'état d'avancement d'un engagement à un instant donné.
// Il est porté par les mises à jour (engagement_updates) ; le statut « courant »
// d'un engagement est celui de sa mise à jour la plus récente.
type Status string

const (
	StatusEnAttente Status = "en_attente"
	StatusEnCours   Status = "en_cours"
	StatusTenu      Status = "tenu"
	StatusRompu     Status = "rompu"
)

// Engagement est la représentation publique d'un engagement de campagne.
// Son `Status` est dérivé de la mise à jour la plus récente (défaut « en_attente »).
type Engagement struct {
	ID uuid.UUID `json:"id"`

	Title  string `json:"title"`
	Status Status `json:"status"`

	AuthorEmail string `json:"authorEmail"`

	// EventDate est la date la plus récente parmi les `event_date` des mises à jour
	// de l'engagement (nil tant qu'aucune mise à jour n'a été enregistrée).
	EventDate *time.Time `json:"eventDate"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// EngagementUpdate est une entrée de la timeline d'un engagement : elle justifie
// un statut et référence, de façon optionnelle et indépendante, une délibération
// et/ou une source externe (ex. un article de presse).
type EngagementUpdate struct {
	ID uuid.UUID `json:"id"`

	Status  Status `json:"status"`
	Content string `json:"content"`

	// EventDate est la date de l'événement documenté, saisie par le contributeur.
	EventDate time.Time `json:"eventDate"`

	ExternalSource *string                    `json:"externalSource"`
	Deliberation   *deliberation.Deliberation `json:"deliberation"`

	AuthorEmail string `json:"authorEmail"`

	CreatedAt time.Time `json:"createdAt"`
}

// CreateEngagementInput est le corps attendu pour la création d'un engagement.
// Un engagement n'est qu'un intitulé ; son avancement se documente ensuite via
// des mises à jour.
type CreateEngagementInput struct {
	Title string `json:"title" validate:"required"`
}

// CreateEngagementUpdateInput est le corps attendu pour l'ajout d'une mise à jour.
// La note (`content`) est obligatoire ; la délibération et la source externe sont
// toutes deux optionnelles.
type CreateEngagementUpdateInput struct {
	Status Status `json:"status" validate:"required,oneof=en_attente en_cours tenu rompu"`
	// EventDate est attendue au format ISO « YYYY-MM-DD ».
	EventDate      string     `json:"eventDate" validate:"required"`
	Content        string     `json:"content" validate:"required"`
	DeliberationID *uuid.UUID `json:"deliberationId"`
	ExternalSource *string    `json:"externalSource" validate:"omitempty,url"`
}

// UpdateEngagementUpdateInput est le corps attendu pour la modification d'une mise à jour.
// Les cinq champs sont remplacés à chaque appel (sémantique PUT) ; les mêmes règles de
// validation que la création s'appliquent.
type UpdateEngagementUpdateInput struct {
	Status Status `json:"status" validate:"required,oneof=en_attente en_cours tenu rompu"`
	// EventDate est attendue au format ISO « YYYY-MM-DD ».
	EventDate      string     `json:"eventDate" validate:"required"`
	Content        string     `json:"content" validate:"required"`
	DeliberationID *uuid.UUID `json:"deliberationId"`
	ExternalSource *string    `json:"externalSource" validate:"omitempty,url"`
}
