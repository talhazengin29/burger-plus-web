# Burger Plus 🍔

Yerel restoran/kafeler için sadakat + QR ödeme uygulaması. React (Vite) ile geliştirildi.

## Çalıştırma

```bash
npm install
npm run dev
```

Ardından tarayıcıda açılan adrese git (genelde http://localhost:5173).
Uygulama Giriş ekranıyla açılır; herhangi bir giriş butonuna basınca ana sayfaya geçer.

## Ekranlar & Akış

**Sadakat tarafı:** Giriş → Ana Sayfa → Kampanyalar → Puanlarım → Profil

**Sipariş & ödeme akışı:**
Ana sayfada ürüne + bas → üstteki sepet ikonundan Sepet → Ödemeye Geç →
Ödeme ekranında 3 seçenek:
  - **Tamamını Öde** — hesabın tamamı
  - **Eşit Böl** — Alman usulü, kişi sayısı seçilir, kişi payı ödenir
  - **Ürüne Göre** — sadece seçilen ürünler ödenir
→ Ödeme Yap → Ödeme Başarılı ekranı (kazanılan puan + güncel toplam)

## Puan sistemi

Her ödemede, **gerçekten ödenen tutar** üzerinden puan kazanılır.
Oran: her 10 TL = 1 puan (200 TL → 20 puan).
Oranı değiştirmek için tek yer: `src/data/mockData.js` içindeki `PUAN_ORANI_TL`.

## Gerçek ödeme (POS) entegrasyonu

Şu an "Ödeme Yap" tuşu ödemeyi başarılı sayar ve puanı ekler (POS henüz bağlı değil).
Gerçek POS bağlanınca sadece `src/context/AppContext.jsx` içindeki `odemeyiTamamla`
fonksiyonunun içine POS çağrısı eklenir — ekranların hiçbiri değişmez.

## Yapı

```
src/
  screens/
    Login.jsx / Home.jsx / Campaigns.jsx / Rewards.jsx / Profile.jsx
    Cart.jsx           Sepet
    Payment.jsx        Ödeme (3 bölüşme modu)
    PaymentSuccess.jsx Ödeme başarılı + puan
  components/   Ortak parçalar (alt menü, ikonlar)
  context/      Sepet + puan + ödeme state'i (odemeyiTamamla puanı burada artırır)
  data/         Sahte veriler + puan oranı
  theme.css     Renkler, fontlar, açık/karanlık tema
```

## Karanlık tema

Profil ekranındaki "Karanlık Tema" anahtarından açılır, tüm uygulamaya yansır.

## QR Sistemi (kendi QR'ların — aracı platform yok)

**QR üretme (işletme):** Profil → İşletme → "Masa QR Kodları" ekranından, kaç masan
varsa o kadar QR üretilir ve yazdırılır. Her QR `siteadresin/masa?no=X` adresini içerir.

**Müşteri akışı:** Masadaki QR'ı telefon kamerasıyla okutur → uygulama açılır ve
"Masa X - Hoş Geldin" ekranı gelir → menüden sipariş → ödeme (masa numarası otomatik
taşınır) → puan kazanır. Aracı bir QR platformu kullanılmaz, QR'lar kendi siteninden üretilir.

> Not: QR'lar `window.location.origin` (sitenin adresi) üzerine kurulur. Yerelde
> `localhost` olur; siteyi yayına aldığında otomatik gerçek alan adın olur, QR'ları
> o zaman üretmen yeterli.

## Backend bağlantısı (çok telefon + canlı sipariş)

Uygulama artık gerçek zamanlı sipariş için **burger-plus-backend** sunucusuna
bağlanıyor. İki projeyi birlikte çalıştır:

**1. Backend'i başlat** (ayrı terminal):
```bash
cd burger-plus-backend
npm install
npm start        # http://localhost:4000
```

**2. Frontend'i başlat:**
```bash
cd burger-plus
npm run dev
```

Masaya servis modunda (QR ile gelince) sepet artık sunucuda tutulur; aynı masaya
bağlanan tüm telefonların siparişi birleşir ve canlı güncellenir. Al götür modu
yerel çalışır (masası olmadığı için).

### Backend adresi

Frontend varsayılan olarak `http://localhost:4000`'e bağlanır. Telefondan/Docker'dan
kullanırken backend'in gerçek adresini `VITE_BACKEND_URL` ortam değişkeniyle ver
(örn. bir `.env` dosyasında `VITE_BACKEND_URL=http://192.168.1.34:4000`).
