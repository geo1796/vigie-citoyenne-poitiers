# ---------- Stage 1 : build du front ----------
FROM node:24-alpine AS web

WORKDIR /app
RUN corepack enable

COPY frontend/web/package.json frontend/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/web/ ./
RUN pnpm build


# ---------- Stage 2 : build du back ----------
FROM golang:1.26-alpine AS api

WORKDIR /src

COPY backend/go.mod backend/go.sum ./
RUN go mod download

COPY backend/ ./

# Le dist du front est embarqué dans le binaire via embed.FS
COPY --from=web /app/dist ./server/spa/dist

RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/vigie \
    ./server


# ---------- Stage 3 : runtime ----------
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -S vigie && \
    adduser -S -G vigie vigie

COPY --from=api /out/vigie /usr/local/bin/vigie

USER vigie:vigie
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/vigie"]