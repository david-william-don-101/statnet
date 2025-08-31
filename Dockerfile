# Stage 1: Build the Next.js static application
FROM oven/bun:alpine AS frontend_builder

WORKDIR /app

# Copy package.json and bun.lock
COPY package.json bun.lock ./

# Install frontend dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the frontend code
COPY . .

# Build the Next.js static app
RUN bun run build

# Stage 2: Build the Go backend
FROM golang:alpine3.21 AS backend_builder

WORKDIR /app

# Copy backend source code
COPY backend/ ./

# Download Go modules and build the binary
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server

# Stage 3: Final scratch image
FROM scratch

WORKDIR /app

# Copy the Go binary from the backend builder
COPY --from=backend_builder /app/server /app/server

# Copy the static Next.js output from the frontend builder
COPY --from=frontend_builder /app/out /app/static

# Expose port 80 (where the Go server will listen)
EXPOSE 80

# Run the Go server
ENTRYPOINT ["/app/server"]