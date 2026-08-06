# MediQ
MediQ - A Healthcare Facility Information System built with React, Go, and PostgreSQL.

## Local Development Setup

### Prerequisites
- Go 1.22 or higher
- PostgreSQL 15 or higher
- Node.js (v18+) and npm

### Backend Setup
1. **Environment Variables**
   Create a `.env` file in the `backend/` directory. It should contain at minimum:
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
   cd backend
   go run cmd/migrate/main.go up
   ```
   *(To rollback migrations, you can run `go run cmd/migrate/main.go down`)*

3. **Running the Server**
   To start the backend server:
   ```bash
   cd backend
   go run cmd/server/main.go
   ```
   The server will start on the port specified in your `.env` file (default `8080`).

### Frontend Setup
1. **Install Dependencies**
   From the `frontend/` directory, install the required packages:
   ```bash
   cd frontend
   npm install
   ```

2. **Running the Development Server**
   Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will typically be accessible at `http://localhost:5173`.
