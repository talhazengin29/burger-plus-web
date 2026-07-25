# Burger Plus — Yayına Çıkış Rehberi

Sistemi internete taşıyoruz. Üç servis kullanacağız, üçü de ücretsiz:

| Parça | Servis | Ne yapıyor |
|---|---|---|
| Veritabanı | **Supabase** | PostgreSQL (kullanıcılar, siparişler) |
| Backend | **Render** | Socket.io sunucusu (canlı sipariş akışı) |
| Frontend | **Vercel** | Müşteri + personel uygulaması |

**Sıra önemli:** Önce veritabanı, sonra backend, en son frontend. Çünkü her biri
bir öncekinin adresine ihtiyaç duyuyor.

Toplam süre: yaklaşık 30-45 dakika.

---

## ADIM 0 — Hazırlık: GitHub'a yükle

Render ve Vercel, kodu GitHub'dan çeker. O yüzden önce kodu GitHub'a koymalısın.

1. [github.com](https://github.com) → hesabın yoksa aç
2. Sağ üstte **+** → **New repository**
3. İki depo (repository) oluştur:
   - `burger-plus-backend` (Private seçebilirsin)
   - `burger-plus-web` (Private seçebilirsin)

Sonra bilgisayarında, her klasör için sırayla (GitHub'ın verdiği komutlar da işini görür):

```bash
cd C:\Users\HP\Desktop\burger-plus-backend
git init
git add .
git commit -m "ilk yukleme"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/burger-plus-backend.git
git push -u origin main
```

Aynısını `burger-plus-web` klasörü için de yap (adres kısmını değiştirerek).

> **Not:** `.env` dosyası GitHub'a gitmemeli (şifreler var). `.gitignore` içinde
> zaten ekli olmalı; değilse ekle.

---

## ADIM 1 — Supabase (Veritabanı)

1. [supabase.com](https://supabase.com) → **Start your project** → GitHub ile giriş yap
2. **New project**:
   - **Name:** `burger-plus`
   - **Database Password:** güçlü bir şifre belirle → **bir yere kaydet, birazdan lazım**
   - **Region:** `Central EU (Frankfurt)` (Türkiye'ye en yakın)
   - **Create new project** → 1-2 dakika kurulum bekler

3. Proje açılınca sol menüden **Project Settings** (dişli) → **Database**

4. **Connection string** bölümünü bul → **URI** sekmesini seç. Şuna benzer bir
   satır göreceksin:

   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```

5. Bu satırı kopyala. İçindeki `[YOUR-PASSWORD]` kısmını, 2. adımda belirlediğin
   şifreyle **değiştir**. Ortaya çıkan tam adresi bir yere kaydet —
   buna bundan sonra **DATABASE_URL** diyeceğiz.

> Tablolar otomatik oluşacak (backend ilk çalıştığında kendisi kuruyor),
> Supabase'de elle tablo oluşturmana gerek yok.

---

## ADIM 2 — Render (Backend)

1. [render.com](https://render.com) → **Get Started** → GitHub ile giriş yap
2. **New +** → **Web Service**
3. **Connect a repository** → `burger-plus-backend` deposunu seç
   (GitHub erişimi isterse izin ver)

4. Ayarları şöyle doldur:

   | Alan | Değer |
   |---|---|
   | **Name** | `burger-plus-backend` |
   | **Region** | `Frankfurt (EU Central)` |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

5. Aşağıda **Environment Variables** bölümüne şunları ekle
   (**Add Environment Variable** ile tek tek):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Supabase'den aldığın tam adres (Adım 1.5) |
   | `JWT_SECRET` | Uzun ve rastgele bir metin yaz (örn: `bp-2026-gizli-anahtar-x7k9m2p4` ) |

   > **JWT_SECRET önemli:** Bu, kullanıcı oturumlarının güvenlik anahtarı.
   > Kimseyle paylaşma, tahmin edilebilir bir şey yazma.

6. **Create Web Service** → kurulum başlar (2-5 dakika)

7. Kurulum bitince üstte adresin görünür:
   ```
   https://burger-plus-backend.onrender.com
   ```
   **Bu adresi kaydet** — frontend'e vereceğiz.

8. **Kontrol:** Tarayıcıda `https://burger-plus-backend.onrender.com/saglik`
   adresini aç. `{"durum":"calisiyor",...}` görüyorsan backend ayakta.

> **Render ücretsiz katman notu:** 15 dakika hiç istek gelmezse servis uykuya
> geçer. Sonraki ilk istek 30-50 saniye sürer, sonra normale döner. Gerçek
> kullanımda (kafede sürekli sipariş varken) bu sorun olmaz.

---

## ADIM 3 — Vercel (Frontend)

1. [vercel.com](https://vercel.com) → **Sign Up** → GitHub ile giriş yap
2. **Add New...** → **Project**
3. `burger-plus-web` deposunu seç → **Import**

4. **Configure Project** ekranında:
   - **Framework Preset:** `Other` (otomatik algılamazsa)
   - **Root Directory:** boş bırak (kök)
   - **Build Command / Output Directory:** dokunma —
     `vercel.json` dosyası bunları zaten ayarlıyor

5. **Environment Variables** bölümünü aç, şunu ekle:

   | Key | Value |
   |---|---|
   | `VITE_BACKEND_URL` | `https://burger-plus-backend.onrender.com` (Adım 2.7) |

   > Sonunda **eğik çizgi olmasın**. Doğru: `...onrender.com`

6. **Deploy** → 2-4 dakika sürer

7. Bitince adresin hazır:
   ```
   https://burger-plus-web.vercel.app
   ```

---

## ADIM 4 — Kontrol

Sırayla test et:

1. **Müşteri uygulaması:** `https://burger-plus-web.vercel.app`
   → Giriş ekranı, logo görünmeli

2. **Personel paneli:** `https://burger-plus-web.vercel.app/personel`
   → Mutfak / Salon seçimi görünmeli (şifreler: Mutfak `1234`, Salon `5678`)

3. **Uçtan uca:**
   - Müşteri uygulamasında kayıt ol
   - `https://burger-plus-web.vercel.app/masa?no=3` adresine git
   - Sipariş ver, öde
   - Personel panelinde Mutfak sekmesinde siparişin görünmeli

> İlk denemede backend uyanıyorsa 30-50 saniye bekleyebilir. Sonrası hızlı.

---

## ADIM 5 — Kendini admin yap

QR üretme ekranını görmek için hesabını admin yapmalısın.

1. Supabase → projen → sol menüden **SQL Editor**
2. **New query** → şunu yapıştır (kendi e-postanı yaz):

   ```sql
   UPDATE kullanicilar SET rol='admin' WHERE email='senin@epostan.com';
   ```

3. **Run** → `Success` görmelisin
4. Uygulamada çıkış yapıp tekrar gir → Profil'de "İşletme → Masa QR Kodları" görünecek

---

## ADIM 6 — QR kodları üret

1. Admin hesabınla giriş yap → **Profil** → **İşletme** → **Masa QR Kodları**
2. Kaç masan varsa o kadar QR üret
3. QR'lar artık gerçek internet adresini taşıyor:
   `https://burger-plus-web.vercel.app/masa?no=3`
4. Yazdır, masalara yapıştır

Müşteri telefonuyla okuttuğunda doğrudan o masanın sayfasına gelir.

---

## Sonradan güncelleme

Kodda değişiklik yaptığında:

```bash
git add .
git commit -m "degisiklik aciklamasi"
git push
```

Render ve Vercel değişikliği görüp **otomatik** yeniden yayınlar. Elle bir şey
yapmana gerek yok.

---

## Sorun giderme

**"Sunucuya ulaşılamadı" hatası**
→ Backend uykuda olabilir. `https://...onrender.com/saglik` adresini açıp
  uyandır, 1 dakika bekle, tekrar dene.
→ Vercel'de `VITE_BACKEND_URL` doğru mu kontrol et (sonunda eğik çizgi olmamalı).

**Personel paneli açılmıyor (/personel)**
→ Adresin sonuna eğik çizgi ekle: `/personel/`
→ Vercel'de yeniden deploy et (**Deployments** → son deploy → **Redeploy**)

**Veritabanı bağlantı hatası (Render loglarında)**
→ `DATABASE_URL` içindeki `[YOUR-PASSWORD]` kısmını gerçek şifreyle
  değiştirdiğinden emin ol.
→ Supabase projesi duraklatılmış olabilir (ücretsiz katmanda 1 hafta
  kullanılmazsa duruyor) → Supabase panelinden **Restore** et.

**Siparişler mutfağa gitmiyor**
→ Backend uyanık mı kontrol et (`/saglik`)
→ Tarayıcıda F12 → Console'da kırmızı hata var mı bak

---

## Maliyet

Üçü de ücretsiz katmanda başlıyor:

- **Supabase:** 500 MB veritabanı, 1 hafta kullanılmazsa duraklatılır (elle
  geri açılır)
- **Render:** Aylık 750 saat, 15 dk sonra uyku
- **Vercel:** Aylık 100 GB trafik

Gerçek bir kafede günlük kullanım için bu limitler fazlasıyla yeter. Büyürsen
Render'ın ücretli katmanı (aylık ~7$) uyku sorununu kaldırır.
