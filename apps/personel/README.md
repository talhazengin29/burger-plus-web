# Burger Plus — Personel Uygulaması

Mutfak + Salon rollerini içeren personel paneli.
Vite + React + Socket.io. Port 5174.

## Rol bazlı güvenli giriş

- **Mutfak** — siparişleri görür, "Hazırlamaya Başla" / "Hazır" der
- **Salon/Kasiyer** — masaları ve hesabı görür, "Masayı Kapat" ile oturumu kapatır
- **Yönetici** — yönetim paneline erişir

Her personel yönetim panelinden e-posta, rol ve en az 8 karakterli şifreyle
tanımlanır. Giriş backend tarafından doğrulanır; kullanıcı yalnızca yetkili olduğu
ekrana ve Socket.io olaylarına erişebilir.

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

Yönetim panelindeki **Personel > Düzenle** formunda yeni şifre belirlenir.
