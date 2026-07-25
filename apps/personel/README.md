# Burger Plus — Personel Uygulaması

Mutfak + Salon rollerini içeren personel paneli.
Vite + React + Socket.io. Port 5174.

## İki rol, iki şifre

- **Mutfak** (şifre: 1234) — siparişleri görür, "Hazırlamaya Başla" / "Hazır" der
- **Salon** (şifre: 5678) — masaları/hesabı görür, "Masayı Kapat" ile oturumu kapatır

Giriş sonrası iki sekme (Mutfak / Salon) arasında geçilebilir.

## Masayı Kapat neden önemli?

Masa kapatılmazsa aynı masaya oturan tüm müşterilerin siparişi birikir.
Salon "Masayı Kapat" deyince oturum kapanır, yeni gelen müşteriler temiz masa
görür (eski siparişler arşivde kalır, raporlar için).

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5174
```

Backend (burger-plus-backend) çalışıyor olmalı.

## Şifreleri değiştirme

`src/screens/Login.jsx` içindeki SIFRELER nesnesinden değiştirilir.
(Gerçek üründe bu backend'de doğrulanmalı; şu an istemci tarafında.)
