# Burger Plus Müşteri Uygulaması — Geliştirici Rehberi

Bu belge `apps/musteri` uygulamasının ne yaptığını, kodun nerede bulunduğunu ve yeni bir özellik eklerken hangi dosyaya bakılması gerektiğini anlatır. İçerik, 17 Ağustos 2026 tarihindeki kaynak kod esas alınarak hazırlanmıştır.

> Kapsam: Yalnızca müşteri uygulaması. Personel paneli, süper admin ve backend ancak müşteri uygulamasıyla bağlantılı oldukları yerlerde açıklanır.

## 1. Uygulama ne yapıyor?

Müşteri uygulaması çok işletmeli bir restoran uygulamasıdır. Aynı frontend farklı işletmeleri URL'deki işletme kimliğine göre açar:

```text
/{isletmeSlug}/anasayfa
/{isletmeSlug}/kampanyalar
/{isletmeSlug}/urun/123
```

Örnek:

```text
/burger-plus/anasayfa
/tost-point/anasayfa
```

Her işletmenin şu verileri birbirinden ayrıdır:

- Tema, renkler, görünüm ve logo
- Ürünler, kategoriler ve kampanyalar
- Kullanıcı oturumu ve token
- Masa bağlantısı ve masa tokenı
- Misafir sipariş geçmişi
- Sadakat, damga kartı, ödüller ve cüzdan

Uygulama üyeli girişe ek olarak misafir kullanımını, masa QR akışını, ürün özelleştirmeyi, sepeti, nakit/kart/cüzdan ödemesini, kampanyaları ve sadakat sistemini destekler.

## 2. Teknoloji ve kütüphaneler

Temel bağımlılıklar `apps/musteri/package.json` dosyasındadır.

| Kütüphane | Sürüm | Kullanıldığı yer |
|---|---:|---|
| React | 19.2.7 | Bileşenler, context ve uygulama state'i |
| React DOM | 19.2.7 | React uygulamasını DOM'a bağlama |
| React Router DOM | 7.18.2 | İşletme bazlı URL ve ekran yönlendirmeleri |
| Framer Motion | 12.42.2 | Sayfa, kart, modal ve geçiş animasyonları |
| Socket.IO Client | 4.8.3 | Canlı ürün, kategori, kampanya, masa, cüzdan ve tema güncellemeleri |
| qr-scanner | 1.4.2 | Telefon kamerasından masa QR kodu okuma |
| qrcode | 1.5.4 | İşletme/masa QR kodu üretme |
| Vite | 8.1.1 | Geliştirme sunucusu ve production build |
| Oxlint | 1.71.0 | Statik kod kontrolü |

Uygulama JavaScript ve JSX kullanır; TypeScript kullanılmıyor. Stil sistemi ayrı CSS dosyaları, CSS değişkenleri ve `data-gorunum`/`data-konsept` nitelikleri üzerine kuruludur.

## 3. Uygulamanın başlangıç noktası

```text
src/main.jsx
  └─ src/App.jsx
      └─ /:isletmeSlug
          └─ IsletmeSarici
              ├─ TemaSaglayici
              ├─ PerdeSaglayici
              └─ AppProvider
                  └─ ekranlar
```

### `src/main.jsx`

- `theme.css` dosyasını yükler.
- React uygulamasını `#root` elementine bağlar.
- Geliştirme sırasında ek kontroller için `StrictMode` kullanır.

### `src/App.jsx`

- Bütün route tanımları buradadır.
- Uygulamayı telefon çerçevesine yerleştirir.
- Hangi ekranlarda alt menünün görüneceğini belirler.
- Üye/misafir korumasını `Korumali` ile uygular.
- `qr-uret` ekranını yalnızca admin rolüne açar.

Kök `/` adresi varsayılan olarak `/burger-plus` adresine yönlenir. Bilinmeyen yollar da aynı varsayılan işletmeye döner.

## 4. Route ve ekran haritası

Tüm yolların başında `/:isletmeSlug` bulunur.

| Yol | Dosya | Görevi | Koruma |
|---|---|---|---|
| `/` | `Login.jsx` | Giriş, misafir devamı ve 2FA akışı | Herkese açık |
| `/kayit` | `Kayit.jsx` | Yeni müşteri kaydı | Herkese açık |
| `/sifremi-unuttum` | `SifremiUnuttum.jsx` | Şifre sıfırlama isteği | Herkese açık |
| `/sifre-sifirla` | `SifreSifirla.jsx` | Token ile yeni şifre belirleme | Herkese açık |
| `/masa` | `TableWelcome.jsx` | QR'dan gelen masa ve tokenı oturuma bağlama | Geçerli masa QR'ı gerekir |
| `/anasayfa` | `Home.jsx` | Slogan, damga kartı, kategoriler, arama ve ürün listesi | Üye veya misafir |
| `/urun/:id` | `UrunDetay.jsx` | Ürün detayı, gramaj, hariç/ekstra malzeme ve menü seçimleri | Üye veya misafir |
| `/sepet` | `Cart.jsx` | Sepet, adetler ve çapraz satış önerileri | Üye veya misafir |
| `/odeme` | `Payment.jsx` | Nakit, iyzico ve cüzdan ödeme akışları | Üye veya misafir |
| `/odeme-sonuc` | `PaymentSuccess.jsx` | Ödeme dönüşünü backend üzerinden doğrulama | Üye veya misafir |
| `/odeme-basarili` | `PaymentSuccess.jsx` | Alternatif başarı route'u | Üye veya misafir |
| `/siparislerim` | `Orders.jsx` | Sipariş geçmişi ve canlı masa özeti | Üye veya misafir |
| `/kampanyalar` | `Campaigns.jsx` | Aktif ve zamanlı kampanyalar | Üye veya misafir |
| `/puanlarim` | `Rewards.jsx` | Puan geçmişi ve puanla alınabilen ödüller | Üye veya misafir |
| `/hediyelerim` | `Hediyelerim.jsx` | Kazanılmış hediyeler ve kullanım işlemi | Üye veya misafir |
| `/cuzdanim` | `Wallet.jsx` | Bakiye, hareketler ve yükleme kampanyası bilgisi | Üye veya misafir; gerçek veri üyede |
| `/profil` | `Profile.jsx` | Profil, davet, QR ve hesap ayarları | Üye veya misafir |
| `/profil-duzenle` | `ProfilDuzenle.jsx` | E-posta/telefon ve güvenlik ayarları | Üye veya misafir |
| `/qr` | `QrScan.jsx` | Kamerayla masa QR kodu okuma | Üye veya misafir |
| `/qr-uret` | `QrGenerator.jsx` | Masa QR kodları üretme | Yalnızca admin |

### Route'a bağlı olmayan dosyalar

Şu dosyalar `src/screens` altında bulunur fakat güncel `App.jsx` içinde doğrudan route olarak kullanılmaz:

- `TableOrder.jsx`
- `OrderReceived.jsx`
- `UyeOl.jsx`
- `Placeholder.jsx`

Bunları silmeden önce başka bir bileşenden import edilip edilmediği `rg` ile kontrol edilmelidir.

## 5. Klasör yapısı

```text
apps/musteri/
├─ public/                 Statik favicon ve ikon dosyaları
├─ src/
│  ├─ assets/             Uygulamayla paketlenen logo dosyaları
│  ├─ components/         Birden fazla ekranda kullanılan parçalar
│  ├─ context/            İşletme, tema ve uygulama genel state'i
│  ├─ data/               Varsayılan/fallback ürün ve konsept verileri
│  ├─ hooks/              Tekrar kullanılabilir React hook'ları
│  ├─ lib/                API, socket, doğrulama ve ürün seçim yardımcıları
│  ├─ screens/            Route seviyesindeki ekranlar ve ekran CSS'leri
│  ├─ App.jsx             Route ağacı ve telefon yerleşimi
│  ├─ App.css             Uygulama kabuğu, splash ve telefon çerçevesi
│  ├─ main.jsx            React giriş noktası
│  └─ theme.css           Global tema tokenları ve ortak stiller
├─ Dockerfile             İki aşamalı Node build + nginx imajı
├─ nginx.conf             SPA route fallback ve statik cache ayarları
├─ vite.config.js         Vite React eklentisi
└─ package.json           Komutlar ve bağımlılıklar
```

## 6. Context yapısı ve veri sorumlulukları

### `context/IsletmeContext.jsx`

İlk önce çalışan katmandır. URL'deki `isletmeSlug` değerini alır ve `/api/isletme/:slug` isteğiyle işletmeyi yükler.

Sorumlulukları:

- Aktif işletmeyi ve temasını getirmek
- Socket bağlantısını doğru işletme odasına bağlamak
- İşletme yüklenirken logo/tema splash ekranını göstermek
- `tema-guncellendi` olayını dinlemek
- Personel panelindeki gerçek canlı önizleme için `postMessage` kabul etmek
- Alt provider'ları doğru işletme verisiyle başlatmak

### `context/TemaContext.jsx`

Backend'den gelen temayı CSS değişkenlerine çevirir.

Önemli değişkenler:

```css
--accent
--accent-glow
--bg-primary
--bg-card
--font-baslik
--font-govde
--logo-olcegi
--logo-konum-x
--logo-konum-y
```

Ayrıca:

- Koyu/açık görünümü `document.documentElement.dataset.gorunum` ile ayarlar.
- Konsepti `data-konsept` olarak yazar.
- İşletme fontlarını Google Fonts üzerinden yükler.
- Sayfa başlığını ve favicon'u işletmeye göre değiştirir.

### `context/AppContext.jsx`

Uygulamanın en büyük ve en merkezi state katmanıdır. `useApp()` kullanan bütün ekranlar bu veriye erişir.

Başlıca sorumlulukları:

- Kullanıcı oturumu ve rol
- Misafir oturumu
- Ürünler ve kategoriler
- Kampanyalar ve indirim hesabı
- Sepet ve çapraz satış önerileri
- Aktif masa ve masa tokenı
- Canlı masa özeti
- Ödeme sonrası state güncellemesi
- Sipariş geçmişi
- Damga kartı, puan, ödül ve hediyeler
- Avatarın cihazda saklanması

Yeni global özellik eklerken önce gerçekten bütün ekranların ortak state'e ihtiyacı olup olmadığı düşünülmelidir. Yalnızca tek ekranda kullanılan veri o ekranın yerel state'inde tutulmalıdır.

## 7. API katmanı

### `lib/authApi.js`

Bütün HTTP isteklerinin ana giriş noktasıdır.

Backend adresi:

```js
import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"
```

`istekAt()` normalde her isteğe otomatik olarak şunları ekler:

```http
X-Isletme: tost-point
Authorization: Bearer <token>   # token varsa
```

Önemli API grupları:

| Grup | İstemci fonksiyonları |
|---|---|
| İşletme | `isletmeBilgisiniGetir` |
| Auth | `kayitOl`, `girisYap`, `beniGetir`, `tokeniKaydet`, `tokeniSil` |
| 2FA | `ikiFaktorGirisiniTamamla`, `ikiFaktorKurulumBaslat`, `ikiFaktorKurulumOnayla`, `ikiFaktorKapat` |
| Şifre | `sifirlamaTalep`, `tokenDogrula`, `sifreSifirla` |
| Profil | `profilGuncelle`, `davetOzetiniGetir`, `duyurulariGetir` |
| Sipariş | `siparisGecmisiniGetir`, `nakitSiparisGonder`, `nakitMasaDurumunuGetir` |
| Sadakat | `sadakatOzetiniGetir`, `damgaKartiAyariniGetir`, `puanlaOdulSatinAl`, `kullaniciHediyesiniKullan` |
| Cüzdan | `cuzdanOzetiniGetir`, `cuzdanlaOdemeyiOnayla` |
| Ödeme | `odemeTaslagiOlustur`, `iyzicoOdemesiniBaslat`, `iyzicoOdemesiniDogrula`, `odemeSonucunuGetir` |

Yeni endpoint kullanırken doğrudan ekran içinde dağınık `fetch()` yazmak yerine fonksiyon `authApi.js` içine eklenmelidir.

## 8. Gerçek zamanlı bağlantı

### `lib/socket.js`

Socket.IO bağlantısını kurar. Bağlantı auth verisi içinde işletme slug'ı ve varsa kullanıcı tokenı gönderilir. İşletme değiştiğinde bağlantı yeniden kurulur.

Müşteri uygulamasında kullanılan başlıca olaylar:

| Olay | Etki |
|---|---|
| `tema-guncellendi` | İşletme temasını canlı yeniler |
| `urunler-guncellendi` | Ürün kataloğunu yeniler |
| `kategoriler-guncellendi` | Kategori listesini yeniler |
| `kampanyalar-guncellendi` | Kampanyaları yeniler |
| `sadakat-ayari-guncellendi` | Damga kartı ayarını yeniler |
| `oduller-guncellendi` | Kullanıcının sadakat özetini yeniler |
| `cuzdan-guncellendi` | Cüzdan bakiyesini/hareketlerini yeniler |
| `cuzdan-ayari-guncellendi` | Bakiye kampanyası ayarını yeniler |
| `masa-guncellendi` | Masanın sipariş özetini yeniler |
| `nakit-masa-guncellendi` | Nakit ödeme bekleme durumunu yeniler |
| `masa-kapandi` | Masa bağlantısını ve yerel masa state'ini temizler |
| `duyurular-guncellendi` | Header bildirimlerini yeniler |

Masaya katılım şu veriyle yapılır:

```js
socket.emit("masaya-katil", { masaNo, masaToken });
```

Masa numarası tek başına yetmez; geçerli `masaToken` da gönderilmelidir.

## 9. Ürün, kategori ve sepet akışı

1. `AppContext` `/api/urunler`, `/api/kategoriler` ve `/api/kampanyalar` isteklerini yapar.
2. Backend verileri kullanılabilir durumdaysa ekranlar bunlarla beslenir.
3. Burger Plus işletmesinde eksik alanlar `data/mockData.js` içindeki varsayılanlarla tamamlanabilir.
4. Ürün detayında gramaj, hariç malzeme, ekstra malzeme ve menü seçimleri hazırlanır.
5. `lib/urunSecimleri.js` seçilmiş varyasyonlardan benzersiz bir `sepetAnahtari` üretir.
6. Aynı ürün ve aynı seçimler sepette adet olarak birleşir; farklı seçimler ayrı satır olur.
7. Sepet değişince `/api/oneriler` isteği 300 ms debounce ile gönderilir.

Önemli dosyalar:

- Listeleme ve filtreleme: `screens/Home.jsx`
- Ürün yapılandırma: `screens/UrunDetay.jsx`
- Sepet: `screens/Cart.jsx`
- Seçim anahtarı ve yardımcılar: `lib/urunSecimleri.js`
- Varsayılan ürün kuralları: `data/mockData.js`

## 10. Sipariş ve ödeme akışı

```text
Ürün detayı
  → sepet
  → ödeme ekranı
  → backend ödeme taslağı
      ├─ iyzico ödeme sayfası
      ├─ uygulama içi cüzdan
      └─ masada nakit ödeme
  → backend doğrulaması
  → ödeme sonuç ekranı
  → sipariş/sadakat/cüzdan yenileme
```

### Kart/iyzico

- `Payment.jsx` backend'de ödeme taslağı oluşturur.
- Backend'in döndürdüğü iyzico ödeme sayfasına geçilir.
- Dönüşte `PaymentSuccess.jsx` sonucu backend üzerinden doğrular.
- Frontend URL parametresine bakarak kendi başına ödeme başarılı kabul etmez.

### Cüzdan

- Cüzdan özeti backend'den alınır.
- Ödeme taslağı `cuzdanlaOdemeyiOnayla` ile tamamlanır.
- Bakiye değişimi socket üzerinden de yenilenebilir.

### Nakit masa siparişi

- Geçerli masa numarası ve masa tokenı gerekir.
- Sipariş kasaya/personel ekranına gönderilir.
- Müşteri ekranda onay veya ret durumunu canlı takip eder.

### Ödeme sonrası

`AppContext.odemeyiTamamla()` yalnızca backend tarafından onaylanmış ödeme nesnesini işler. Ardından:

- Son ödeme özetini saklar.
- Puan/damga bilgisini günceller.
- Üye siparişlerini backend'den yeniler.
- Misafir siparişini cihazdaki geçmişe ekler.
- Sepeti ve aktif masa seçimini temizler.

## 11. Kimlik doğrulama ve depolama

Tokenlar işletme slug'ına göre ayrılır:

```text
bp_token_burger-plus
bp_token_tost-point
```

“Beni hatırla” açıksa token `localStorage`, kapalıysa `sessionStorage` içinde tutulur.

Diğer önemli kayıtlar:

| Kayıt | Depolama | Amaç |
|---|---|---|
| `bp_misafir_{slug}` | sessionStorage | Misafir oturumunun yenilemede korunması |
| `bp_aktifMasa_{slug}` | sessionStorage | Aktif sipariş masasını koruma |
| `bp_aktifMasaTokeni_{slug}` | sessionStorage | Aktif masaya yetkili erişim |
| `bp_ozetMasa_{slug}` | localStorage | Masa durumunu tarayıcı kapanınca da takip etme |
| `bp_ozetMasaTokeni_{slug}` | localStorage | Masa özetine yetkili erişim |
| `bp_misafirSiparisler_{slug}` | localStorage | Misafirin son 20 siparişini cihazda gösterme |
| `bp_avatar_{slug}_{userId}` | localStorage | Kullanıcının cihazdaki avatarı |

Frontend'deki route koruması güvenlik sınırı değildir. Gerçek yetki kontrolü backend endpoint ve socket olaylarında da yapılmalıdır.

## 12. Ortak bileşenler

| Bileşen | Görevi |
|---|---|
| `BottomNav.jsx` | Alt gezinme menüsü ve aktif route durumu |
| `OrtakHeader.jsx` | İşletme logosu, bildirimler, sepet ve kullanıcı alanı |
| `MarkaLogosu.jsx` | İşletme logosu, Burger Plus varsayılanı veya metin fallback'i |
| `BurgerPlusLogosu.jsx` | Paket içindeki Burger Plus logosunu standart biçimde gösterir |
| `Korumali.jsx` | Üye veya misafir değilse login'e yönlendirir |
| `SayfaSarici.jsx` | Ortak Framer Motion sayfa giriş animasyonu |
| `PerdeGecis.jsx` | Sayfalar/ödeme arasında markalı tam ekran geçiş |
| `Icons.jsx` | Uygulamanın ortak SVG ikon bileşenleri |

## 13. Hook ve yardımcı dosyalar

| Dosya | Kullanım |
|---|---|
| `hooks/useIsletmeNavigate.js` | Hedef route'un başına otomatik işletme slug'ı ekler |
| `hooks/usePerde.js` | Markalı geçiş animasyonunu başlatır ve ardından yönlendirir |
| `hooks/useSuruklenebilir.js` | Sürüklenebilir arayüz davranışı sağlar |
| `lib/animasyonlar.js` | Ortak Framer Motion ayarları |
| `lib/dogrulama.js` | Form temizleme ve doğrulama kuralları |
| `lib/urunSecimleri.js` | Ürün varyasyonları ve sepet satırı anahtarı |

Uygulama içi route değişimlerinde mümkün olduğunca `useNavigate` yerine `useIsletmeNavigate` kullanılmalıdır. Aksi durumda işletme slug'ı kaybedilebilir.

## 14. Stil ve tema mimarisi

- `theme.css`: global reset, tema tokenları ve ortak sınıflar.
- `App.css`: telefon kabuğu, uygulama splash'i ve kök yerleşim.
- Her ekranın kendi `.css` dosyası: ekranın özel görünümü.
- Koyu/açık tema: `[data-gorunum="koyu"]` ve `[data-gorunum="acik"]` seçicileri.
- Konsept farkları: `data-konsept` ve backend'den gelen CSS değişkenleri.
- Glassmorphism: yarı saydam arka plan, `backdrop-filter`, ince border ve kontrollü gölge kombinasyonu.

Yeni bir renk eklerken sabit hex değerini birçok dosyaya yazmak yerine uygun tema değişkeni kullanılmalıdır. Açık tema ayrıca kontrol edilmelidir; koyu temada güzel görünen siyah transparan yüzey açık temada kirli bir leke gibi görünebilir.

## 15. Yerelde çalıştırma

### Yalnızca müşteri uygulaması

Repo kökünden:

```bash
npm run dev:musteri
```

veya:

```bash
cd apps/musteri
npm install
npm run dev
```

Backend varsayılan olarak şu adreste beklenir:

```text
http://localhost:4000
```

Farklı backend için `apps/musteri/.env.local` oluşturulabilir:

```env
VITE_BACKEND_URL=http://localhost:4000
```

### Kontrol komutları

```bash
cd apps/musteri
npm run lint
npm run build
```

Monorepo'nun deployment biçimine uygun müşteri build'i:

```bash
npm run build:musteri
```

Bu kök komut müşteri uygulamasını `--base=/uygulama/` ile derler.

## 16. Docker ve nginx

`Dockerfile` iki aşamalıdır:

1. Node 22 Alpine üzerinde Vite build alınır.
2. Yalnızca `dist` çıktısı nginx imajına kopyalanır.

`nginx.conf` içindeki kritik kural:

```nginx
try_files $uri $uri/ /index.html;
```

Bu kural olmazsa kullanıcı `/tost-point/anasayfa` gibi bir route'u doğrudan açtığında nginx gerçek bir dosya bulamayacağı için 404 döndürür.

## 17. Sık yapılan değişikliklerde nereye bakılır?

| İstenen değişiklik | İlk bakılacak yer |
|---|---|
| Yeni müşteri ekranı | `screens/`, ardından `App.jsx` |
| Alt menüye yeni sekme | `components/BottomNav.jsx` ve `App.jsx` içindeki `altMenuluYollar` |
| Header/logo/bildirim | `components/OrtakHeader.jsx`, `MarkaLogosu.jsx`, `screens/Home.css` |
| Yeni API çağrısı | `lib/authApi.js` |
| Canlı güncelleme | `lib/socket.js` ve ilgili context/ekran |
| Global sepet/sadakat state'i | `context/AppContext.jsx` |
| İşletme veya tema | `context/IsletmeContext.jsx`, `TemaContext.jsx` |
| Ürün seçenekleri | `screens/UrunDetay.jsx`, `lib/urunSecimleri.js` |
| Kampanya görünümü | `screens/Campaigns.jsx` ve `AppContext.jsx` |
| Ödeme yöntemi | `screens/Payment.jsx`, `PaymentSuccess.jsx`, `lib/authApi.js` |
| Form doğrulaması | `lib/dogrulama.js` |
| Animasyon | `lib/animasyonlar.js`, `SayfaSarici.jsx`, `PerdeGecis.jsx` |
| Açık/koyu tema hatası | İlgili ekran CSS'i ve `theme.css` |

## 18. Yeni özellik ekleme kontrol listesi

1. Özellik yalnızca bir ekrana mı ait, yoksa global state mi gerekiyor?
2. Route gerekiyorsa `App.jsx` güncellendi mi?
3. İşletme slug'ı korunuyor mu?
4. API çağrısı `authApi.js` üzerinden mi yapılıyor?
5. `X-Isletme`, kullanıcı tokenı veya masa tokenı gerekiyor mu?
6. Backend yetki ve veri doğrulaması yapıyor mu?
7. Misafir ve üye davranışları ayrı ayrı denendi mi?
8. Masa siparişi ve normal Gel Al akışı kontrol edildi mi?
9. Açık ve koyu temada görünüm test edildi mi?
10. Farklı logo oranları ve işletme temaları denendi mi?
11. Mobil dar ekran ve taşma durumları kontrol edildi mi?
12. Socket listener'ı eklenmişse cleanup içinde `socket.off` var mı?
13. `npm run lint` ve `npm run build` başarılı mı?

## 19. Dikkat edilmesi gereken teknik noktalar

- `AppContext.jsx` çok fazla sorumluluk taşıyor. Büyük yeni modüllerde cüzdan, katalog, masa ve sadakat state'lerini ayrı provider/hook'lara bölmek ileride bakımı kolaylaştırır.
- `data/mockData.js` tamamen kullanılmayan bir demo dosyası değildir; Burger Plus için fallback ve ürün kuralları hâlâ buradan gelebilir.
- Eski `apps/musteri/README.md` içindeki ödeme ve veri kaynağı açıklamalarının bir kısmı güncel koddan geride kalmıştır. Güncel davranış için kaynak kod ve bu rehber esas alınmalıdır.
- Misafir sipariş geçmişi backend hesabına değil, kullanılan tarayıcıya bağlıdır.
- Masa erişiminde numaranın yanında token da zorunlu tutulmalıdır; yalnızca masa numarasıyla veri okunmamalıdır.
- Ödeme başarısı frontend yönlendirmesine güvenilerek verilmemeli, backend sonucu doğrulanmalıdır.
- Socket event payload'ları işletme izolasyonunu bozmamalıdır.
- Yeni yerel depolama anahtarları `tenantDepoAnahtari()` ile işletmeye özel oluşturulmalıdır.

## 20. Hızlı başlangıç özeti

Projeye ilk kez giren geliştirici şu sırayla okumalıdır:

1. `src/App.jsx` — hangi ekran nerede?
2. `src/context/IsletmeContext.jsx` — işletme nasıl seçiliyor?
3. `src/context/TemaContext.jsx` — tema nasıl uygulanıyor?
4. `src/context/AppContext.jsx` — ortak veri nerede tutuluyor?
5. `src/lib/authApi.js` — backend ile nasıl konuşuluyor?
6. `src/lib/socket.js` — canlı güncellemeler nasıl geliyor?
7. Değiştirilecek özelliğin `screens/` altındaki JSX ve CSS dosyası.

Bu sıralama, müşteri uygulamasındaki veri akışını ve ekran bağlantılarını en kısa yoldan anlamayı sağlar.
