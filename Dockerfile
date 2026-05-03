# Gunakan image bun yang ringan
FROM oven/bun:1-slim

WORKDIR /app

# Copy file manifest untuk install dependencies
COPY package.json ./
# Jika Anda punya bun.lockb, sebaiknya ikut di-copy agar versi package konsisten
COPY bun.lockb* ./

# Install dependencies
RUN bun install

# Copy semua source code
COPY . .

# Build aplikasi (output akan berada di folder /dist)
RUN bun run build

# Pastikan folder dist ada (opsional untuk debugging)
RUN ls -la dist

# Gunakan port 5073
EXPOSE 5073

# Jalankan server statis menggunakan bunx serve
# -s : SPA mode (untuk React Router agar tidak 404 saat refresh)
# -l : Listen port
CMD ["bunx", "serve", "-s", "dist", "-l", "5073"]