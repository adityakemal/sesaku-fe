# ===== Build stage (Bun) =====
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run build

# ===== Production stage (nginx) =====
FROM nginx:alpine

# hapus default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# copy config kita
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy hasil build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80