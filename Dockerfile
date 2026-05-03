# ===== Build stage (Bun) =====
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run build

# ===== Production stage (nginx) =====
FROM nginx:alpine

# hapus default config (optional tapi bagus)
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80