# MedIQ Backend

MedIQ is a comprehensive hospital management system backend built with Go and PostgreSQL. It relies entirely on standard library routing (Go 1.22+) and raw SQL via `pgx` to keep dependencies minimal and performance high.

## Prerequisites
- Go 1.22 or higher
- PostgreSQL 15 or higher

## Setup Instructions

1. **Environment Variables**
   Create a `.env` file in the root directory (or ensure it exists). It should contain at minimum:
   ```env
   SERVER_PORT=8080
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=mediq_db
   JWT_SECRET=your_super_secret_key_here
   ```

2. **Database Setup & Migrations**
   Make sure your PostgreSQL server is running and the database specified in `.env` exists. Then, run the migration tool to set up the schema and tables:
   ```bash
   go run cmd/migrate/main.go up
   ```
   *(To rollback migrations, you can run `go run cmd/migrate/main.go down`)*

3. **Running the Server**
   To start the backend server:
   ```bash
   go run cmd/server/main.go
   ```
   The server will start on the port specified in your `.env` file (default `8080`).

## Maintenance Notes
**Refresh Tokens:** The application tracks issued refresh tokens in the `Refresh_Tokens` table for stateful rotation and revocation. Over time, expired tokens will accumulate. It is recommended to occasionally run a cleanup job to delete expired rows:
```sql
DELETE FROM Refresh_Tokens WHERE expires_at < NOW();
```
