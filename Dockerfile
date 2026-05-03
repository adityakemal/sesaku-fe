# Gunakan image bun
FROM oven/bun:1

WORKDIR /app

# Hanya copy package.json untuk install (menghindari error bun.lockb)
COPY package.json ./

# Install dependencies tanpa bergantung pada lockfile
RUN bun install --no-save

# Copy semua file aplikasi
COPY . .

# Build aplikasi untuk production
# Note: Variabel environment seperti VITE_API_URL di-set pada saat build phase di Coolify
RUN bun run build

# Expose port
EXPOSE 80

# Jalankan server SPA statis menggunakan package "serve" dari bunx
# Flag "-s" penting agar semua route React Router tidak 404 saat di-refresh
CMD ["bunx", "serve", "-s", "dist", "-l", "80"]
