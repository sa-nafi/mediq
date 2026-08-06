package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/sa-nafi/mediq/backend/internal/repository"
	"github.com/sa-nafi/mediq/backend/internal/utils"
)

type AdminHandler struct {
	auditRepo *repository.AuditRepository
}

func NewAdminHandler(auditRepo *repository.AuditRepository) *AdminHandler {
	return &AdminHandler{auditRepo: auditRepo}
}

func (h *AdminHandler) GetAuditLogsHandler(w http.ResponseWriter, r *http.Request) {
	limit, cursor := utils.ParseCursorParams(r)
	
	tableFilter := r.URL.Query().Get("table")
	actionFilter := r.URL.Query().Get("action")
	userIdFilter := r.URL.Query().Get("user_id")

	logs, nextCursor, err := h.auditRepo.GetAuditLogs(r.Context(), tableFilter, actionFilter, userIdFilter, cursor, limit)
	if err != nil {
		if errors.Is(err, utils.ErrInvalidCursor) {
			utils.WriteError(w, http.StatusBadRequest, "Invalid cursor provided")
			return
		}
		utils.WriteError(w, http.StatusInternalServerError, "Failed to retrieve audit logs")
		return
	}

	utils.WriteCursorPaginatedJSON(w, http.StatusOK, logs, nextCursor, limit)
}

func (h *AdminHandler) GetAuditLogByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, "Invalid audit log ID")
		return
	}

	logDetail, err := h.auditRepo.GetAuditLogByID(r.Context(), id)
	if err != nil {
		utils.WriteError(w, http.StatusNotFound, "Audit log not found")
		return
	}

	utils.WriteJSON(w, http.StatusOK, logDetail)
}
