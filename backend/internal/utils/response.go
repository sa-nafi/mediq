package utils

import (
	"encoding/json"
	"net/http"
)

// WriteJSON writes a JSON response to the ResponseWriter.
func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// ErrorResponse represents a standard error format.
type ErrorResponse struct {
	Error string `json:"error"`
}

// WriteError writes a JSON error response to the ResponseWriter.
func WriteError(w http.ResponseWriter, status int, message string) {
	WriteJSON(w, status, ErrorResponse{Error: message})
}
