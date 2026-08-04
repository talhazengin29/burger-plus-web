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

// --- WhatsApp iletişim butonu ------------------------------------------------
//
// ⚠️ NUMARA GİRİLMEDEN BUTON GÖRÜNMEZ.
// Buraya uydurma bir numara yazılmadı: yanlış bir numara yayına çıkarsa
// müşteriler alakasız birine mesaj atar. `numara` boş bırakıldığı sürece
// yüzen buton hiç render edilmez.
//
// Biçim: ülke kodu + numara, sadece rakam. Türkiye için 90 ile başlar.
// Örnek: "905321112233"
export const WHATSAPP = {
  numara: "",
  // Sohbet açıldığında mesaj kutusuna hazır gelen metin.
  hazirMesaj: "Merhaba, QR Menü Pro hakkında bilgi almak istiyorum.",
  etiket: "WhatsApp'tan yazın",
};

// --- Ücretsiz deneme ---------------------------------------------------------
// Deneme, abonelik kaydı "deneme" durumuyla açılarak veriliyor
// (bkz. burger-plus-backend/superAdminDb.js → abonelikOlustur).
// Otomatik değil: talep geldikten sonra kurulum ekip tarafından yapılıyor.
export const DENEME = {
  gunSayisi: 14,
  baslik: "Tüm paketlerde 14 gün ücretsiz deneme",
  aciklama: "Kurulumu ve menü aktarımını ekibimiz yapar. Deneme sonunda devam etmezseniz ücret alınmaz.",
  buton: "14 Gün Ücretsiz Dene",
};

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
  heroRozet: "Sipariş, mutfak ve ödeme tek akışta",
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
// Yıllık fiyat, aylık ücretin tek kaynağından (fiyatAylik) türetilir — bkz.
// YILLIK_BEDAVA_AY ve paketKartlariHtml. Kurumsal'da fiyatAylik yok, o yüzden
// aylık/yıllık anahtarından etkilenmeden hep "Özel Fiyat" gösterir.
export const YILLIK_BEDAVA_AY = 2;

export const PAKETLER = [
  {
    ad: "Başlangıç",
    hedefKitle: "Tek şubeli küçük işletmeler",
    fiyatAylik: 499,
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
    fiyatAylik: 999,
    ozellikler: [
      "Başlangıç paketindeki her şey",
      "Masadan canlı sipariş alma",
      "Canlı mutfak ve salon paneli",
      "iyzico ile online ödeme",
      "Sadakat programı ve raporlar",
    ],
    buton: DENEME.buton,
    deneme: true,
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

// WhatsApp sohbet adresi. Numara tanımlı değilse null döner.
export function whatsappAdresi() {
  const rakamlar = String(WHATSAPP.numara || "").replace(/\D/g, "");
  if (!rakamlar) return null;
  return `https://wa.me/${rakamlar}?text=${encodeURIComponent(WHATSAPP.hazirMesaj)}`;
}

// Deneme talebi nereye gitsin: WhatsApp varsa oraya, yoksa iletişim bölümüne.
export function denemeBaglantisi() {
  return whatsappAdresi() || BASLA_BAGLANTISI;
}

export function whatsappButonuHtml() {
  const adres = whatsappAdresi();
  if (!adres) return "<!-- WhatsApp butonu: src/icerik.js icindeki WHATSAPP.numara bos oldugu icin render edilmedi -->";

  return `
    <a class="whatsapp-buton" href="${adres}" target="_blank" rel="noopener noreferrer" aria-label="${kacis(WHATSAPP.etiket)}">
      <span class="whatsapp-halka" aria-hidden="true"></span>
      <svg class="whatsapp-ikon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.2 5.07 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.23 8.21z"/>
      </svg>
      <span class="whatsapp-etiket">${kacis(WHATSAPP.etiket)}</span>
    </a>`;
}

export function denemeSeridiHtml() {
  const adres = denemeBaglantisi();
  const disKaynak = adres.startsWith("http");
  return `
    <div class="deneme-serit isik-kart mb-12 flex flex-col items-center gap-4 rounded-2xl border border-marka-turuncu-500/40 bg-marka-turuncu-500/[0.06] px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p class="font-baslik text-lg font-bold text-marka-metin">${kacis(DENEME.baslik)}</p>
        <p class="mt-1 text-sm leading-relaxed text-marka-gri-300">${kacis(DENEME.aciklama)}</p>
      </div>
      <a class="marka-buton shrink-0 whitespace-nowrap rounded-full px-7 py-3 text-sm font-medium" href="${adres}"${
        disKaynak ? ' target="_blank" rel="noopener noreferrer"' : ""
      }>${kacis(DENEME.buton)}</a>
    </div>`;
}

export function navBaglantilariHtml() {
  return NAV_BAGLANTILARI.map(
    (baglanti) => `
      <a class="nav-baglanti text-sm text-marka-gri-300 transition-colors hover:text-marka-metin" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a>`,
  ).join("");
}

export function mobilNavBaglantilariHtml() {
  return NAV_BAGLANTILARI.map(
    (baglanti) => `
      <a class="rounded-lg px-3 py-3 text-base text-marka-gri-300 transition-colors hover:bg-white/5 hover:text-marka-metin" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a>`,
  ).join("");
}

export function konseptSeridiHtml() {
  return KONSEPTLER.map(
    (konsept) => `
      <li class="konsept-oge flex items-center gap-3 font-baslik text-lg font-bold tracking-wide sm:text-xl">
        <svg class="h-6 w-6 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ikonCizimi(konsept.ikon)}</svg>
        <span>${kacis(konsept.ad)}</span>
      </li>`,
  ).join("");
}

export function ozellikKartlariHtml() {
  return OZELLIKLER.map(
    (ozellik) => `
      <article class="ozellik-kart isik-kart cam-panel group rounded-2xl p-6 transition-colors duration-300 hover:border-marka-turuncu-500/50">
        <div class="ozellik-ikon mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-marka-gri-300 transition-colors group-hover:bg-marka-turuncu-500/15 group-hover:text-marka-turuncu-500">
          <svg class="h-7 w-7" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ikonCizimi(ozellik.ikon)}</svg>
        </div>
        <h3 class="metin-akan metin-akan--yumusak mb-2 font-baslik text-lg font-semibold">${kacis(ozellik.baslik)}</h3>
        <p class="text-sm leading-relaxed text-marka-gri-300">${kacis(ozellik.metin)}</p>
      </article>`,
  ).join("");
}

export function adimKartlariHtml() {
  return ADIMLAR.map(
    (adim) => `
      <li class="adim-kart cam-panel relative rounded-2xl p-6">
        <span class="font-baslik text-4xl font-extrabold text-marka-turuncu-500/30" aria-hidden="true">${kacis(adim.sira)}</span>
        <h3 class="metin-akan metin-akan--yumusak mb-2 mt-3 font-baslik text-lg font-semibold">${kacis(adim.baslik)}</h3>
        <p class="text-sm leading-relaxed text-marka-gri-300">${kacis(adim.metin)}</p>
      </li>`,
  ).join("");
}

// Şerit kesintisiz dönebilmek için kart listesi iki kez basılır. İkinci küme
// yalnızca görseldir; ekran okuyucular metni iki kez okumasın diye
// yorumKartlariKopyasiHtml() her kartı aria-hidden ile işaretler.
export function yorumKartlariKopyasiHtml() {
  return yorumKartlariHtml().replace(/<figure class="/g, '<figure aria-hidden="true" class="');
}

export function yorumKartlariHtml() {
  return YORUMLAR.map(
    (yorum) => `
      <figure class="yorum-kart isik-kart rounded-2xl border border-marka-cizgi bg-marka-kart p-8">
        <svg class="mb-6 h-8 w-8 text-marka-turuncu-500" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
        <blockquote class="mb-8 text-sm leading-relaxed text-marka-gri-300">${kacis(yorum.metin)}</blockquote>
        <figcaption class="flex items-center gap-3">
          <img class="h-10 w-10 rounded-full border border-marka-cizgi object-cover" src="${yorum.gorsel}" alt="${kacis(yorum.gorselAlt)}" width="40" height="40" loading="lazy" decoding="async"/>
          <span class="block">
            <span class="block text-sm font-semibold text-marka-metin">${kacis(yorum.kisi)}</span>
            <span class="block text-xs text-marka-gri-400">${kacis(yorum.rol)}</span>
          </span>
        </figcaption>
      </figure>`,
  ).join("");
}

function paraFormatla(sayi) {
  return `₺${Math.round(sayi).toLocaleString("tr-TR")}`;
}

// Aylık/yıllık anahtarına göre görünürlüğü arayuz.js değiştirir (bkz.
// fiyatAnahtari()); JS çalışmazsa aylık blok zaten varsayılan görünür kalır.
function fiyatBlokHtml(paket) {
  if (paket.fiyatAylik == null) {
    return `
        <p class="mb-8">
          <span class="font-baslik text-3xl font-bold text-marka-turuncu-500">${kacis(paket.fiyat)}</span><span class="text-marka-gri-400">${kacis(paket.periyot || "")}</span>
        </p>`;
  }

  const aylik = paket.fiyatAylik;
  const yillikToplam = aylik * (12 - YILLIK_BEDAVA_AY);
  const yillikAylikEsdeger = yillikToplam / 12;
  const tasarruf = aylik * 12 - yillikToplam;

  return `
        <p class="mb-1">
          <span class="fiyat-aylik-blok">
            <span class="font-baslik text-3xl font-bold text-marka-turuncu-500">${paraFormatla(aylik)}</span><span class="text-marka-gri-400">/ay</span>
          </span>
          <span class="fiyat-yillik-blok hidden">
            <span class="font-baslik text-3xl font-bold text-marka-turuncu-500">${paraFormatla(yillikAylikEsdeger)}</span><span class="text-marka-gri-400">/ay</span>
          </span>
        </p>
        <p class="fiyat-aylik-blok mb-8 text-xs text-marka-gri-500">Yıllık ödemede ${YILLIK_BEDAVA_AY} ay hediye</p>
        <p class="fiyat-yillik-blok hidden mb-8 text-xs font-semibold text-marka-turuncu-400">${paraFormatla(yillikToplam)}/yıl toplam · ${paraFormatla(tasarruf)} tasarruf</p>`;
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

    // Deneme butonu WhatsApp'a (tanımlıysa) gider; diğerleri iletişim bölümüne.
    const hedef = paket.deneme ? denemeBaglantisi() : BASLA_BAGLANTISI;
    const disKaynak = hedef.startsWith("http") ? ' target="_blank" rel="noopener noreferrer"' : "";
    const buton = paket.populer
      ? `<a class="marka-buton block w-full rounded-xl py-3 text-center text-sm font-medium" href="${hedef}"${disKaynak}>${kacis(paket.buton)}</a>`
      : `<a class="block w-full rounded-xl border border-marka-cizgi py-3 text-center text-sm font-medium text-marka-metin transition-colors hover:border-marka-gri-400 hover:bg-white/5" href="${hedef}"${disKaynak}>${kacis(paket.buton)}</a>`;

    return `
      <article class="paket-kart isik-kart relative flex flex-col rounded-2xl p-8 ${
        paket.populer
          ? "nefes-hale border border-marka-turuncu-500/50 bg-marka-zemin"
          : "border border-marka-cizgi bg-marka-kart"
      }">
        ${rozet}
        <h3 class="metin-akan metin-akan--yumusak mb-1 font-baslik text-xl font-bold">${kacis(paket.ad)}</h3>
        <p class="mb-6 text-sm text-marka-gri-400">${kacis(paket.hedefKitle)}</p>
        ${fiyatBlokHtml(paket)}
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
          <button class="sss-dugme flex w-full items-center justify-between gap-4 py-5 text-left font-baslik text-base font-medium text-marka-metin transition-colors hover:text-marka-turuncu-500 md:text-lg"
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
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-marka-metin">${kacis(kolon.baslik)}</h3>
        <ul class="flex flex-col gap-2 text-sm text-marka-gri-400">${kolon.baglantilar
          .map(
            (baglanti) => `
          <li><a class="transition-colors hover:text-marka-metin" href="${baglanti.hedef}"${
            baglanti.yakinda ? ' data-durum="yakinda"' : ""
          }>${kacis(baglanti.ad)}</a></li>`,
          )
          .join("")}
        </ul>
      </div>`,
  ).join("");
}
