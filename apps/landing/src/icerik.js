// ============================================================================
// Tanıtım sayfası içeriği — TEK KAYNAK.
//
// Bölüm dosyaları (bolumler/*.html) yalnızca yerleşimi tutar; tüm metinler,
// fiyatlar, bağlantılar ve tekrarlayan kart listeleri burada durur. Böylece
// içerik degisikligi icin HTML'e dokunmak gerekmez.
//
// Yerleşim dosyalarındaki {{ anahtar }} ifadeleri build sırasında
// vite-bolum-parcalari.js eklentisi tarafından buradaki değerlerle doldurulur.
// Değer bir fonksiyonsa çağrılır ve dönen metin HTML olarak gömülür.
// ============================================================================

// --- Gerçek uygulama rotaları -----------------------------------------------
// Bunlar Vercel dağıtımındaki (bkz. vercel.json) canlı adreslerdir.
export const ROTALAR = {
  personelGiris: "/personel", // apps/personel → GenelGiris ekranı
  musteriDemo: "/burger-plus", // apps/musteri → varsayılan işletme
};

// TODO(kayit-akisi): Platformda self-servis işletme kaydı YOK. Yeni işletme
// kurulumu yalnızca super admin panelinden yapılıyor (POST /api/super/isletmeler/kurulum,
// apps/superadmin → KurulumSihirbazi). Gerçek bir kayıt/deneme uçu eklendiğinde
// yalnızca aşağıdaki sabit değiştirilmelidir; tüm dönüşüm butonları bunu kullanır.
export const BASLA_BAGLANTISI = "#basla";

const YIL = new Date().getFullYear();

export const ICERIK = {
  // --- Marka ---------------------------------------------------------------
  markaAdi: "QR Menü Pro",
  markaAciklamasi: "Yeni nesil dijital restoran yönetim sistemi.",
  telifSatiri: `© ${YIL} QR Menü Pro. Tüm hakları saklıdır.`,

  // --- SEO / Open Graph ----------------------------------------------------
  sayfaBasligi: "QR Menü Pro | Restoranın İçin Dijital Sipariş Sistemi",
  sayfaAciklamasi:
    "QR kodla masadan sipariş, canlı mutfak paneli, sadakat programı ve detaylı raporlar. Restoranınızın siparişten ödemeye tüm akışını tek sistemde yönetin.",
  ogGorsel: "/gorseller/hero-telefon.jpg",
  ogGorselAlt: "QR Menü Pro müşteri uygulamasının telefon ekranındaki görünümü",

  // --- Hero ----------------------------------------------------------------
  heroBaslikBir: "MASANIZ",
  heroVurguBir: "DİJİTAL",
  heroBaslikIki: "MUTFAĞINIZ",
  heroVurguIki: "CANLI",
  heroAciklama:
    "QR kodla masadan sipariş, mutfağa anlık düşen fişler ve güvenli online ödeme — hepsi tek sistemde.",
  heroBirincilButon: "Paketleri İncele",
  heroIkincilButon: "Özellikleri Gör",

  // --- Panel önizleme (hero altındaki yönetim maketi) ----------------------
  panelIsletmeAdi: "Lezzet Durağı",
  panelYuklemeBaslik: "Ürün görseli yükle",
  panelYuklemeAciklama: "PNG, JPG, WebP veya GIF (en fazla 5 MB)",

  // --- Bölüm başlıkları ----------------------------------------------------
  konseptSeridiEtiket: "Her konsepte hazır",
  ozelliklerEtiket: "Özellikler",
  ozelliklerBaslik: "MUTFAKTAN KASAYA",
  ozelliklerVurgu: "TEK SİSTEM",
  ozelliklerAciklama:
    "Siparişi alan, mutfağa düşüren, ödemeyi kapatan ve müşteriyi geri getiren tek bir sistem — ayrı ayrı uygulamalar değil.",

  adimlarEtiket: "Nasıl çalışır",
  adimlarBaslik: "3 ADIMDA",
  adimlarVurgu: "BAŞLAYIN",

  yorumlarEtiket: "Referans",
  yorumlarBaslik: "İŞLETMELERDEN",
  yorumlarVurgu: "GERİ BİLDİRİM",

  fiyatEtiket: "Fiyatlandırma",
  fiyatBaslik: "NE GÖRÜRSEN",
  fiyatVurgu: "ONU ÖDERSİN",
  fiyatAciklama: "Ciro üzerinden komisyon yok. İşletmenizin boyutuna uygun, sabit aylık ücret.",

  sssEtiket: "SSS",
  sssBaslik: "SIK SORULAN",
  sssVurgu: "SORULAR",

  ctaBaslik: "MASALARINIZI",
  ctaVurgu: "DİJİTALLEŞTİRİN",
  ctaAciklama:
    "İşletme kurulumunu ekibimiz yapar; siz yalnızca menünüzü ve masa sayınızı iletin. Hesabı olan işletmeler doğrudan panele giriş yapabilir.",
  ctaBirincilButon: "Panele Giriş Yap",
  ctaIkincilButon: "Müşteri Uygulamasını Dene",
};

// --- Navigasyon --------------------------------------------------------------
export const NAV_BAGLANTILARI = [
  { ad: "Ana Sayfa", hedef: "#ust" },
  { ad: "Özellikler", hedef: "#ozellikler" },
  { ad: "Nasıl Çalışır", hedef: "#nasil-calisir" },
  { ad: "Fiyatlandırma", hedef: "#fiyatlandirma" },
];

// --- Konsept şeridi ----------------------------------------------------------
// Uydurma müşteri logoları yerine backend'in gerçekten desteklediği konseptler
// gösteriliyor (bkz. burger-plus-backend/konseptler.js).
export const KONSEPTLER = [
  { ad: "Burger", ikon: "burger" },
  { ad: "Cafe", ikon: "kahve" },
  { ad: "Pizza", ikon: "pizza" },
  { ad: "iyzico ile Ödeme", ikon: "kart" },
];

// --- Özellikler --------------------------------------------------------------
export const OZELLIKLER = [
  {
    baslik: "QR ile Sipariş",
    metin: "Müşteri masadaki QR'ı okutur, telefonundan menüyü inceler ve saniyeler içinde garson beklemeden sipariş verir.",
    ikon: "qr",
  },
  {
    baslik: "Canlı Mutfak Paneli",
    metin: "Siparişler anında mutfak ekranına düşer. Hazırlık durumu eş zamanlı olarak müşterinin telefonuna yansır.",
    ikon: "mutfak",
  },
  {
    baslik: "Sadakat Programı",
    metin: "Otomatik puan biriktirme, dijital damga kartı sistemi ve kişiselleştirilmiş hediye kampanyaları oluşturun.",
    ikon: "yildiz",
  },
  {
    baslik: "Güvenli Ödeme",
    metin: "iyzico altyapısıyla masada kredi kartı ile güvenli ödeme alma. Tutar doğrulaması sunucu tarafında yapılır.",
    ikon: "kart",
  },
  {
    baslik: "Detaylı Raporlar",
    metin: "Günlük, haftalık ciro takibi. Ürün bazlı satış analizleri ve personel performans raporlarına anında erişim.",
    ikon: "grafik",
  },
  {
    baslik: "Kendi Markanız",
    metin: "Logonuz, kendi renk paletiniz ve size özel menü tasarımı. Sistemi tamamen kendi markanıza uyarlayın.",
    ikon: "marka",
  },
];

// --- Nasıl çalışır -----------------------------------------------------------
export const ADIMLAR = [
  {
    sira: "01",
    baslik: "Kurulum",
    metin: "Menünüzü dijital ortama aktarın, fiyatları ve ürün görsellerini yükleyin.",
  },
  {
    sira: "02",
    baslik: "QR Kodları Yerleştirin",
    metin: "Sistemden otomatik oluşturulan masaya özel QR kodlarını masalarınıza yapıştırın.",
  },
  {
    sira: "03",
    baslik: "Sipariş Almaya Başlayın",
    metin: "Müşterileriniz masadan sipariş versin, mutfak ekranı siparişi anında görsün.",
  },
];

// --- Yorumlar ----------------------------------------------------------------
// TODO(referanslar): Bunlar TEMSİLİ metinlerdir; gerçek müşteri referansı
// alındığında bu dizi güncellenmelidir. Uydurma kişi/şirket adı kullanılmadı,
// bu yüzden roller jenerik tutuldu ve görseller projedeki mevcut yerel
// fotoğraflardan seçildi.
export const YORUMLAR = [
  {
    metin: "Masadan sipariş açıldıktan sonra garson çağırma trafiği neredeyse bitti. Mutfak fişleri anında düşüyor, sıra karışmıyor.",
    kisi: "Restoran işletmecisi",
    rol: "Temsili değerlendirme",
    gorsel: "/gorseller/kullanici-restoran.jpg",
    gorselAlt: "Restoran işletmecisini temsil eden portre fotoğrafı",
  },
  {
    metin: "Damga kartını dijitale taşımak en çok işimize yarayan kısım oldu. Puan ve hediye takibi tamamen sistemin üzerinde.",
    kisi: "Kafe sahibi",
    rol: "Temsili değerlendirme",
    gorsel: "/gorseller/kullanici-kafe.jpg",
    gorselAlt: "Kafe sahibini temsil eden portre fotoğrafı",
  },
  {
    metin: "Mutfak ekranı sayesinde hangi masanın ne kadar beklediğini görüyoruz. Yoğun saatte en çok bu işe yarıyor.",
    kisi: "Mutfak şefi",
    rol: "Temsili değerlendirme",
    gorsel: "/gorseller/kullanici-sef.jpg",
    gorselAlt: "Mutfak şefini temsil eden portre fotoğrafı",
  },
];

// --- Paketler ----------------------------------------------------------------
export const PAKETLER = [
  {
    ad: "Başlangıç",
    hedefKitle: "Tek şubeli küçük işletmeler",
    fiyat: "₺499",
    periyot: "/ay",
    ozellikler: [
      "Sınırsız QR menü görüntüleme",
      "Temel tema özelleştirme",
      "Ürün ve kategori yönetimi",
      "E-posta desteği",
    ],
    buton: "Paketi Seç",
    populer: false,
  },
  {
    ad: "Profesyonel",
    hedefKitle: "Masadan sipariş alan işletmeler",
    fiyat: "₺999",
    periyot: "/ay",
    ozellikler: [
      "Başlangıç paketindeki her şey",
      "Masadan canlı sipariş alma",
      "Canlı mutfak ve salon paneli",
      "iyzico ile online ödeme",
      "Sadakat programı ve raporlar",
    ],
    buton: "Paketi Seç",
    populer: true,
    rozet: "EN ÇOK TERCİH EDİLEN",
  },
  {
    ad: "Kurumsal",
    hedefKitle: "Çok şubeli zincirler",
    fiyat: "Özel Fiyat",
    periyot: "",
    ozellikler: [
      "Profesyonel paketteki her şey",
      "Çoklu şube yönetimi",
      "Özel sadakat kurgusu",
      "İki adımlı doğrulama zorunluluğu",
      "Öncelikli destek",
    ],
    buton: "Bize Ulaşın",
    populer: false,
  },
];

// --- Sık sorulan sorular -----------------------------------------------------
export const SORULAR = [
  {
    soru: "Müşterinin uygulama indirmesi gerekiyor mu?",
    cevap:
      "Hayır. Masadaki QR kod doğrudan tarayıcıda açılan web uygulamasına gider. Müşteri hiçbir şey indirmeden menüyü görüntüleyip sipariş verebilir.",
  },
  {
    soru: "Aynı masadaki birden fazla telefon aynı siparişi görebiliyor mu?",
    cevap:
      "Evet. Aynı masaya bağlanan tüm cihazlar tek bir oturuma düşer. Biri ürün eklediğinde masadaki herkesin ekranı anında güncellenir; mutfak da aynı anda görür.",
  },
  {
    soru: "Ödeme nasıl alınıyor, güvenli mi?",
    cevap:
      "Ödemeler iyzico Checkout üzerinden alınır. Sipariş tutarı istemciden değil sunucuda hesaplanır; ödeme sonucu iyzico'dan ayrıca sorgulanarak tutar, para birimi ve güvenlik durumu doğrulandıktan sonra sipariş mutfağa aktarılır.",
  },
  {
    soru: "Menümü ve tasarımı kendim yönetebilir miyim?",
    cevap:
      "Evet. Yönetim panelinden ürün, kategori, kampanya ve duyuruları düzenleyebilir; logonuzu ve renk paletinizi değiştirebilirsiniz. Değişiklikler müşteri uygulamasına anlık yansır.",
  },
  {
    soru: "Verilerim nerede tutuluyor?",
    cevap:
      "Tüm veriler PostgreSQL veritabanında kalıcı olarak saklanır. Her işletmenin verisi ayrı tutulur; şifreler bcrypt ile saklanır ve yönetici hesaplarında iki adımlı doğrulama açılabilir.",
  },
];

// --- Alt bilgi ---------------------------------------------------------------
export const ALTBILGI_KOLONLARI = [
  {
    baslik: "Ürün",
    baglantilar: [
      { ad: "Özellikler", hedef: "#ozellikler" },
      { ad: "Nasıl Çalışır", hedef: "#nasil-calisir" },
      { ad: "Fiyatlandırma", hedef: "#fiyatlandirma" },
      { ad: "Sık Sorulanlar", hedef: "#sss" },
    ],
  },
  {
    baslik: "Uygulamalar",
    baglantilar: [
      { ad: "Personel Girişi", hedef: ROTALAR.personelGiris },
      { ad: "Müşteri Uygulaması", hedef: ROTALAR.musteriDemo },
    ],
  },
  {
    // TODO(yasal-sayfalar): Kullanım koşulları / gizlilik politikası sayfaları
    // projede henüz yok. Sayfalar yayına alındığında hedefler güncellenmeli.
    baslik: "Yasal",
    baglantilar: [
      { ad: "Kullanım Koşulları", hedef: "#", yakinda: true },
      { ad: "Gizlilik Politikası", hedef: "#", yakinda: true },
    ],
  },
];

// ============================================================================
// Yerleşim dosyalarına gömülecek tekrarlı kart listeleri.
// Küçük yardımcılar; her biri hazır HTML metni döndürür.
// ============================================================================

// İçerik bizim kontrolümüzde ama metinlerde & < > geçebildiği için kaçışlıyoruz.
function kacis(metin) {
  return String(metin)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const IKONLAR = {
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M20 14v.01M14 20v.01M17 20h4M20 17v4"/>',
  mutfak: '<path d="M5 3v7a2 2 0 0 0 2 2v9M9 3v7a2 2 0 0 1-2 2M15 3c-1.5 1-2 3-2 5s.5 3 2 3v10"/>',
  yildiz: '<path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21.9l1.1-6.5L2.6 9.8l6.5-.9z"/>',
  kart: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10.5h20M6 15.5h4"/>',
  grafik: '<path d="M4 20V10M12 20V4M20 20v-7"/>',
  marka: '<path d="M3 9l1.5-5h15L21 9M3 9v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M8 9v3a2 2 0 0 0 8 0V9"/>',
  burger: '<path d="M4 10a8 8 0 0 1 16 0zM3 14h18M4.5 18h15"/>',
  kahve: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M7 2v2M11 2v2"/>',
  pizza: '<path d="M12 3 3 20l9-2 9 2z"/><circle cx="12" cy="12" r="1"/><circle cx="10" cy="16" r="1"/>',
};

function ikonCizimi(ad) {
  return IKONLAR[ad] || IKONLAR.qr;
}

export function navBaglantilariHtml() {
  return NAV_BAGLANTILARI.map(
    (baglanti) => `
      <a class="nav-baglanti text-sm text-marka-gri-300 transition-colors hover:text-white" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a>`,
  ).join("");
}

export function mobilNavBaglantilariHtml() {
  return NAV_BAGLANTILARI.map(
    (baglanti) => `
      <a class="rounded-lg px-3 py-3 text-base text-marka-gri-300 transition-colors hover:bg-white/5 hover:text-white" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a>`,
  ).join("");
}

export function konseptSeridiHtml() {
  return KONSEPTLER.map(
    (konsept) => `
      <li class="flex items-center gap-3 font-baslik text-lg font-bold tracking-wide sm:text-xl">
        <svg class="h-6 w-6 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ikonCizimi(konsept.ikon)}</svg>
        <span>${kacis(konsept.ad)}</span>
      </li>`,
  ).join("");
}

export function ozellikKartlariHtml() {
  return OZELLIKLER.map(
    (ozellik) => `
      <article class="ozellik-kart cam-panel group rounded-2xl p-6 transition-colors duration-300 hover:border-marka-turuncu-500/50">
        <div class="ozellik-ikon mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-marka-gri-300 transition-colors group-hover:bg-marka-turuncu-500/15 group-hover:text-marka-turuncu-500">
          <svg class="h-7 w-7" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ikonCizimi(ozellik.ikon)}</svg>
        </div>
        <h3 class="mb-2 font-baslik text-lg font-semibold text-white">${kacis(ozellik.baslik)}</h3>
        <p class="text-sm leading-relaxed text-marka-gri-300">${kacis(ozellik.metin)}</p>
      </article>`,
  ).join("");
}

export function adimKartlariHtml() {
  return ADIMLAR.map(
    (adim) => `
      <li class="adim-kart cam-panel relative rounded-2xl p-6">
        <span class="font-baslik text-4xl font-extrabold text-marka-turuncu-500/30" aria-hidden="true">${kacis(adim.sira)}</span>
        <h3 class="mb-2 mt-3 font-baslik text-lg font-semibold text-white">${kacis(adim.baslik)}</h3>
        <p class="text-sm leading-relaxed text-marka-gri-300">${kacis(adim.metin)}</p>
      </li>`,
  ).join("");
}

export function yorumKartlariHtml() {
  return YORUMLAR.map(
    (yorum) => `
      <figure class="yorum-kart rounded-2xl border border-marka-cizgi bg-marka-kart p-8">
        <svg class="mb-6 h-8 w-8 text-marka-turuncu-500" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
        <blockquote class="mb-8 text-sm leading-relaxed text-marka-gri-300">${kacis(yorum.metin)}</blockquote>
        <figcaption class="flex items-center gap-3">
          <img class="h-10 w-10 rounded-full border border-marka-cizgi object-cover" src="${yorum.gorsel}" alt="${kacis(yorum.gorselAlt)}" width="40" height="40" loading="lazy" decoding="async"/>
          <span class="block">
            <span class="block text-sm font-semibold text-white">${kacis(yorum.kisi)}</span>
            <span class="block text-xs text-marka-gri-400">${kacis(yorum.rol)}</span>
          </span>
        </figcaption>
      </figure>`,
  ).join("");
}

export function paketKartlariHtml() {
  return PAKETLER.map((paket) => {
    const madde = (metin) => `
        <li class="flex items-start gap-3">
          <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-marka-turuncu-500" aria-hidden="true"></span>
          <span>${kacis(metin)}</span>
        </li>`;

    const rozet = paket.populer
      ? `<span class="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-marka-turuncu-500 px-3 py-1 text-[11px] font-bold tracking-wide text-white">${kacis(paket.rozet || "")}</span>`
      : "";

    const buton = paket.populer
      ? `<a class="marka-buton block w-full rounded-xl py-3 text-center text-sm font-medium" href="${BASLA_BAGLANTISI}">${kacis(paket.buton)}</a>`
      : `<a class="block w-full rounded-xl border border-marka-cizgi py-3 text-center text-sm font-medium text-white transition-colors hover:border-marka-gri-400 hover:bg-white/5" href="${BASLA_BAGLANTISI}">${kacis(paket.buton)}</a>`;

    return `
      <article class="paket-kart relative flex flex-col rounded-2xl p-8 ${
        paket.populer
          ? "border border-marka-turuncu-500/50 bg-marka-zemin shadow-[0_0_30px_rgba(255,107,0,0.12)]"
          : "border border-marka-cizgi bg-marka-kart"
      }">
        ${rozet}
        <h3 class="mb-1 font-baslik text-xl font-bold text-white">${kacis(paket.ad)}</h3>
        <p class="mb-6 text-sm text-marka-gri-400">${kacis(paket.hedefKitle)}</p>
        <p class="mb-8">
          <span class="font-baslik text-3xl font-bold text-marka-turuncu-500">${kacis(paket.fiyat)}</span><span class="text-marka-gri-400">${kacis(paket.periyot)}</span>
        </p>
        <ul class="mb-8 flex flex-1 flex-col gap-4 text-sm text-marka-gri-300">${paket.ozellikler.map(madde).join("")}
        </ul>
        ${buton}
      </article>`;
  }).join("");
}

export function sorularHtml() {
  // Aşamalı geliştirme: cevaplar HTML'de AÇIK gelir. JavaScript çalışırsa
  // arayuz.js bunları toplayıp akordiyona çevirir. Böylece script
  // yüklenmezse de bütün cevaplar okunabilir kalır.
  return SORULAR.map((oge, sira) => {
    const dugmeId = `sss-dugme-${sira}`;
    const panelId = `sss-panel-${sira}`;
    return `
      <div class="border-b border-marka-cizgi">
        <h3>
          <button class="sss-dugme flex w-full items-center justify-between gap-4 py-5 text-left font-baslik text-base font-medium text-white transition-colors hover:text-marka-turuncu-500 md:text-lg"
                  id="${dugmeId}" type="button" aria-expanded="true" aria-controls="${panelId}">
            <span>${kacis(oge.soru)}</span>
            <svg class="sss-ikon h-5 w-5 shrink-0 text-marka-gri-400 transition-transform duration-300" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 5v14"/><path d="M5 12h14"/>
            </svg>
          </button>
        </h3>
        <div class="sss-panel" id="${panelId}" role="region" aria-labelledby="${dugmeId}">
          <p class="pb-6 pr-8 text-sm leading-relaxed text-marka-gri-300">${kacis(oge.cevap)}</p>
        </div>
      </div>`;
  }).join("");
}

export function altbilgiKolonlariHtml() {
  return ALTBILGI_KOLONLARI.map(
    (kolon) => `
      <div>
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-white">${kacis(kolon.baslik)}</h3>
        <ul class="flex flex-col gap-2 text-sm text-marka-gri-400">${kolon.baglantilar
          .map(
            (baglanti) => `
          <li><a class="transition-colors hover:text-white" href="${baglanti.hedef}"${
            baglanti.yakinda ? ' data-durum="yakinda"' : ""
          }>${kacis(baglanti.ad)}</a></li>`,
          )
          .join("")}
        </ul>
      </div>`,
  ).join("");
}
