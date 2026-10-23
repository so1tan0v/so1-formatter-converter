FROM golang:1.26-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/backend ./cmd/server

FROM alpine:3.22

RUN apk add --no-cache ca-certificates wget
COPY --from=build /out/backend /usr/local/bin/backend

ENV PORT=8081 \
    BACKEND_DB=/data/backend.sqlite \
    BACKEND_RETENTION_DAYS=30 \
    GEOIP_DIR=/data

EXPOSE 8081
ENTRYPOINT ["backend"]
