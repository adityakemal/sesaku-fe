FROM oven/bun:1-slim

WORKDIR /app

COPY package.json bun.lockb* ./
RUN bun install

COPY . .
RUN bun run build

# Install serve untuk menghandle routing SPA (biar refresh tidak 404)
RUN bun add -g serve

# Pakai port 80 (Standard Production)
EXPOSE 80

# Jalankan server
# -s : SPA mode (menangani refresh halaman agar tidak 404)
# -l 80 : Listen di port 80
CMD ["serve", "-s", "dist", "-l", "80"]