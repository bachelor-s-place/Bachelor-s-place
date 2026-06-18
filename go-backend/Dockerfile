# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install make since the project uses a Makefile
RUN apk add --no-cache make

# Copy go mod and sum files first for better caching
COPY go.mod go.sum ./

# Download all dependencies
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application using the existing Makefile
RUN make build

# Final stage - use a minimal alpine image
FROM alpine:latest

WORKDIR /app

# Copy the pre-built binary file from the previous stage
COPY --from=builder /app/bin/api .

# Expose port (Render sets the PORT environment variable dynamically, but documenting 8080 is good practice)
EXPOSE 8080

# Command to run the executable
CMD ["./api"]
