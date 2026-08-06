package utils

import (
	"encoding/json"
	"net/http"
	"strconv"
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

// PaginatedResponse represents a standardized paginated response format.
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	TotalCount int         `json:"total_count"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

// WritePaginatedJSON writes a paginated JSON response.
func WritePaginatedJSON(w http.ResponseWriter, status int, data interface{}, totalCount, page, limit int) {
	totalPages := 0
	if limit > 0 {
		totalPages = (totalCount + limit - 1) / limit
	}

	response := PaginatedResponse{
		Data:       data,
		TotalCount: totalCount,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}
	WriteJSON(w, status, response)
}

// ParsePaginationParams extracts page and limit from the query string,
// returning safe defaults and the calculated offset.
func ParsePaginationParams(r *http.Request) (page int, limit int, offset int) {
	page = 1
	limit = 20

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	offset = (page - 1) * limit
	return page, limit, offset
}
