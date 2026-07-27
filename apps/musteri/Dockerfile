# ============================================================================
# Burger Plus — İki aşamalı (multi-stage) Docker imajı
#
# 1. AŞAMA (build): Node ile projeyi derler, dist/ klasörünü üretir.
# 2. AŞAMA (serve): Sadece dist/ çıktısını hafif bir nginx sunucusuna kopyalar.
#
# Böylece son imaj küçük olur (Node ve node_modules son imajda YOK,
# sadece hazır statik dosyalar ve nginx var).
# ============================================================================

# ---- 1. AŞAMA: Derleme ----
FROM node:22-alpine AS build

# Konteyner içindeki çalışma klasörü
WORKDIR /app

# Önce sadece bağımlılık dosyalarını kopyala (Docker katman önbelleği için:
# kod değişse bile package.json aynıysa npm install tekrar çalışmaz)
COPY package*.json ./
RUN npm install

# Şimdi tüm kaynak kodu kopyala ve derle
COPY . .
RUN npm run build

# ---- 2. AŞAMA: Sunum ----
FROM nginx:alpine

# 1. aşamada üretilen dist/ klasörünü nginx'in yayın klasörüne kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# Kendi nginx ayarımızı koy (React Router adresleri için — aşağıda açıklandı)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# nginx 80 portunda yayın yapar
EXPOSE 80

# Konteyner çalışınca nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]
