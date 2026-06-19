package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/geo1796/vigie-citoyenne-poitiers/logger"
)

// Handler est le type que tu écris dans tes routes.
type Handler func(w http.ResponseWriter, r *http.Request) error

// Adapt transforme un Handler en http.HandlerFunc en gérant erreurs et panics.
func Adapt(h Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			writeError(w, r, err)
		}
	}
}

// Error est une erreur HTTP structurée que les handlers peuvent retourner.
type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string {
	return e.Message
}

// NewError construit une *Error.
func NewError(status int, message string) *Error {
	return &Error{Status: status, Message: message}
}

func writeError(w http.ResponseWriter, r *http.Request, err error) {
	if errors.Is(err, context.Canceled) {
		logger.Debug("client canceled request",
			logger.Any("path", r.URL.Path))
		return
	}

	status := 500

	if httpErr, ok := errors.AsType[*Error](err); ok {
		status = httpErr.Status
	}

	logLevel := logger.LevelWarn
	if status >= 500 {
		logLevel = logger.LevelError
	}

	logger.Log(r.Context(), logLevel, "error handling request",
		logger.Any("path", r.URL.Path),
		logger.Any("method", r.Method),
		logger.Any("status", status),
		logger.Err(err))

	w.WriteHeader(status)
}

// JSON écrit un payload JSON avec le bon status et le bon Content-Type.
func JSON(w http.ResponseWriter, status int, payload any) error {
	return writeJSON(w, status, payload)
}

func writeJSON(w http.ResponseWriter, status int, payload any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload == nil {
		return nil
	}
	return json.NewEncoder(w).Encode(payload)
}

// NoContent répond 204.
func NoContent(w http.ResponseWriter) error {
	w.WriteHeader(http.StatusNoContent)
	return nil
}
