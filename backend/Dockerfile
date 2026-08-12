FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binaries
RUN go build -o server cmd/server/main.go
RUN go build -o migrate cmd/migrate/main.go
RUN go build -o seed cmd/seed/main.go

# Use a lightweight alpine image for the runtime
FROM alpine:latest

WORKDIR /app

# Install bash for the entrypoint script
RUN apk add --no-cache bash

# Copy binaries from builder
COPY --from=builder /app/server .
COPY --from=builder /app/migrate .
COPY --from=builder /app/seed .
COPY --from=builder /app/migrations ./migrations

# Copy the entrypoint script
COPY entrypoint.sh .

# Fix permission and line ending
RUN chmod +x entrypoint.sh
RUN sed -i 's/\r$//' entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
