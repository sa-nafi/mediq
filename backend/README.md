# MediQ Backend

MediQ is a comprehensive hospital management system backend built with Go and PostgreSQL. It relies entirely on standard library routing (Go 1.22+) and raw SQL via `pgx` to keep dependencies minimal and performance high.

*(For local development startup instructions, please see the [main README](../README.md).)*

## API Specifications

The following endpoints are currently implemented and exposed by the backend.

### System & Health

#### `GET /api/health`
Checks if the HTTP server is running.
- **Auth Required**: No
- **Response**: `200 OK` (plain text or JSON indicating service is alive)

#### `GET /api/ready`
Checks if the application is fully ready to accept traffic, including database connectivity.
- **Auth Required**: No
- **Response**: `200 OK` (if DB is connected), `503 Service Unavailable` otherwise.

---

### Authentication

#### `POST /api/auth/register`
Registers a new patient in the system.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "strongpassword",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "1990-01-01",
      "gender": "M",          // optional
      "blood_type": "O+",     // optional
      "phone": "1234567890",  // optional
      "address": "123 Main"   // optional
  }
  ```
- **Response**: `201 Created`

#### `POST /api/auth/login`
Authenticates a user and issues JWT access and refresh tokens.
- **Auth Required**: No
- **Request Body**:
  ```json
  {
      "email": "user@example.com",
      "password": "strongpassword"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG..."
  }
  ```

#### `POST /api/auth/refresh`
Issues a new access token and rotates the refresh token using a valid, unexpired refresh token.
- **Auth Required**: No (but requires a valid refresh token in the body)
- **Request Body**:
  ```json
  {
      "refresh_token": "eyJhbG..."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
      "access_token": "eyJhbG...",
      "refresh_token": "eyJhbG..."
  }
  ```

#### `POST /api/auth/logout`
Logs the user out by revoking their active refresh token in the database.
- **Auth Required**: Yes (Bearer Token)
- **Request Body**:
  ```json
  {
      "refresh_token": "eyJhbG..."
  }
  ```
- **Response**: `200 OK`

---

### Employees (Admin Only)
- `POST /api/employees`: Create a new employee (e.g., receptionist, lab_tech).
- `GET /api/employees`: Get a paginated list of employees. Supports `?limit` and `?offset`.
- `GET /api/employees/{id}`: Get a specific employee by ID.
- `PUT /api/employees/{id}`: Update employee details.
- `DELETE /api/employees/{id}`: Deactivate/delete an employee.

### Doctors (Admin Only)
- `POST /api/doctors`: Create a new doctor profile.
- `GET /api/doctors`: Get a paginated list of doctors. Supports `?limit` and `?offset`.
- `GET /api/doctors/{id}`: Get a specific doctor by ID.
- `PUT /api/doctors/{id}`: Update doctor details.
- `DELETE /api/doctors/{id}`: Deactivate/delete a doctor.

### Departments (Admin Only)
- `POST /api/departments`: Create a new department.
- `GET /api/departments`: Get a paginated list of departments. Supports `?limit` and `?offset`.
- `GET /api/departments/{id}`: Get a specific department by ID.
- `PUT /api/departments/{id}`: Update department details.
- `DELETE /api/departments/{id}`: Delete a department.

### Medicines (Admin Only)
- `POST /api/medicines`: Add a new medicine to the catalog.
- `GET /api/medicines`: Get a paginated list of medicines. Supports `?search` for wildcard search, `?limit`, and `?offset`.
- `GET /api/medicines/{id}`: Get a specific medicine by ID.
- `PUT /api/medicines/{id}`: Update medicine details.
- `DELETE /api/medicines/{id}`: Delete a medicine from the catalog.

---
## Maintenance Notes
**Refresh Tokens:** The application tracks issued refresh tokens in the `Refresh_Tokens` table for stateful rotation and revocation. Over time, expired tokens will accumulate. It is recommended to occasionally run a cleanup job to delete expired rows:
```sql
DELETE FROM Refresh_Tokens WHERE expires_at < NOW();
```
