package middleware

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sa-nafi/mediq/backend/internal/db"
)

// statusRecorder is a custom ResponseWriter that captures the HTTP status code.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}

// Unwrap allows http.ResponseController to access the underlying ResponseWriter
func (r *statusRecorder) Unwrap() http.ResponseWriter {
	return r.ResponseWriter
}

// TransactionMiddleware wraps the HTTP request in a database transaction.
func TransactionMiddleware(dbPool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			tx, err := dbPool.Begin(ctx)
			if err != nil {
				slog.Error("Failed to begin transaction", "error", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}

			// Defer transaction rollback/commit
			recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			defer func() {
				// Recover from panic to ensure rollback
				if p := recover(); p != nil {
					tx.Rollback(ctx)
					panic(p) // re-throw panic after rollback
				} else if recorder.status >= 400 {
					tx.Rollback(ctx)
				} else {
					if err := tx.Commit(ctx); err != nil {
						slog.Error("Failed to commit transaction", "error", err)
					}
				}
			}()

			// Check if user_id is in context to set app.current_user_id for audit triggers
			userIDObj := ctx.Value(UserIDKey)
			if userIDObj != nil {
				if userID, ok := userIDObj.(int); ok {
					// Set the session variable for Postgres triggers using set_config (true = local to transaction)
					_, err := tx.Exec(ctx, "SELECT set_config('app.current_user_id', $1, true)", strconv.Itoa(userID))
					if err != nil {
						slog.Error("Failed to set app.current_user_id", "error", err)
						http.Error(w, "Internal Server Error", http.StatusInternalServerError)
						return
					}
				}
			}

			// Inject tx into context
			ctx = db.WithTx(ctx, tx)

			// Call next handler
			next.ServeHTTP(recorder, r.WithContext(ctx))
		})
	}
}
