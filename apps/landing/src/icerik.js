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

const SITE_URL = String(process.env.VITE_SITE_URL || "").replace(/\/$/, "");

// ============================================================================
// ⚙️ KURULUM — YAYINA ÇIKMADAN ÖNCE DOLDURULACAK TEK YER
//
// Aşağıdaki İLETİŞİM ve YASAL blokları sayfanın "canlıya hazır" olup olmadığını
// belirler. İkisi de boşken sayfa yine sorunsuz çalışır, ama:
//   • İLETİŞİM boşsa  → form ve WhatsApp yerine şeffaf demo durumu gösterilir.
//   • YASAL boşsa     → yasal sayfalar yayında [KÖŞELİ] yer tutucularla çıkar.
// ============================================================================

// --- İletişim kanalları ------------------------------------------------------
//
// ⚠️ UYDURMA DEĞER YAZILMADI. Yanlış bir numara/e-posta yayına çıkarsa
// müşteri adayları alakasız birine ulaşır. En az BİRİ doldurulduğunda talep
// formu otomatik görünür hale gelir (bkz. iletisimKanaliVarMi).
//
// whatsapp → ülke kodu + numara, yalnızca rakam. Türkiye için 90 ile başlar.
//            Örnek: "905321112233"
// eposta   → formun WhatsApp yoksa kullanacağı yedek kanal ve yasal metinlerde
//            görünen başvuru adresi. Örnek: "iletisim@ornek.com"
// telefon  → altbilgide görünen, insanın okuyacağı biçim. Örnek: "0532 111 22 33"
export const ILETISIM = {
  whatsapp: "",
  eposta: "",
  telefon: "",
};

// --- Yasal / künye bilgileri -------------------------------------------------
//
// yasal/*.html sayfaları bu değerleri kullanır. Boş bırakılan her alan
// sayfada köşeli parantezli yer tutucu olarak görünür — böylece eksik bilgi
// gözden kaçmaz, uydurma bir künye de yayına çıkmaz.
export const YASAL = {
  sirketUnvani: "",       // "Örnek Yazılım Ticaret Limited Şirketi"
  adres: "",              // Tam tebligat adresi
  vergiDairesi: "",
  vergiNo: "",
  mersisNo: "",
  kepAdresi: "",          // varsa
  veriSorumlusu: "",      // genelde şirket ünvanının aynısı
  sonGuncelleme: "",      // "4 Ağustos 2026"
};

// Dolu alan olduğu gibi basılır; boş alan gözle görülür bir yer tutucuya
// dönüşür (bkz. .yasal-yer-tutucu) — eksik künye yayında fark edilsin diye.
function yerTutucu(deger, etiket) {
  const temiz = String(deger || "").trim();
  return temiz ? kacis(temiz) : `<span class="yasal-yer-tutucu">[${etiket}]</span>`;
}

// Yasal metinlerde kullanılan, boşsa yer tutucuya düşen alanlar.
export const yasalUnvan = () => yerTutucu(YASAL.sirketUnvani, "ŞİRKET ÜNVANI");
export const yasalAdres = () => yerTutucu(YASAL.adres, "AÇIK ADRES");
export const yasalVergiDairesi = () => yerTutucu(YASAL.vergiDairesi, "VERGİ DAİRESİ");
export const yasalVergiNo = () => yerTutucu(YASAL.vergiNo, "VERGİ NUMARASI");
export const yasalMersis = () => yerTutucu(YASAL.mersisNo, "MERSİS NUMARASI");
export const yasalKep = () => yerTutucu(YASAL.kepAdresi, "KEP ADRESİ");
export const yasalVeriSorumlusu = () => yerTutucu(YASAL.veriSorumlusu || YASAL.sirketUnvani, "VERİ SORUMLUSU ÜNVANI");
export const yasalEposta = () => yerTutucu(ILETISIM.eposta, "İLETİŞİM E-POSTASI");
export const yasalTelefon = () => yerTutucu(ILETISIM.telefon, "TELEFON");
export const yasalSonGuncelleme = () => yerTutucu(YASAL.sonGuncelleme, "GÜNCELLEME TARİHİ");

// --- Yasal sayfa adresleri ---------------------------------------------------
// .html uzantısı bilinçli: Vercel'de cleanUrls kapalı ve kök seviyedeki
// slug rewrite'ı uzantısız yolları müşteri uygulamasına yönlendirirdi
// (bkz. vercel.json → "yasal" hariç tutma kuralı).
export const YASAL_SAYFALAR = {
  kvkk: "/yasal/kvkk.html",
  gizlilik: "/yasal/gizlilik.html",
  kosullar: "/yasal/kosullar.html",
  cerez: "/yasal/cerez.html",
};

// TODO(kayit-akisi): Platformda self-servis işletme kaydı YOK. Yeni işletme
// kurulumu yalnızca super admin panelinden yapılıyor (POST /api/super/isletmeler/kurulum,
// apps/superadmin → KurulumSihirbazi). Talep formu bu boşluğu kapatır: gelen
// talep WhatsApp/e-posta ile ekibe düşer, kurulum sihirbazına elle işlenir.
// Gerçek bir kayıt/deneme uçu eklendiğinde formun action'ı değiştirilmelidir.

// İletişim kanalı tanımlıysa talep formuna, değilse demo kapanışına gider.
export function baslaBaglantisi() {
  return iletisimKanaliVarMi() ? "#iletisim" : "#basla";
}

// --- WhatsApp iletişim butonu ------------------------------------------------
//
// ⚠️ NUMARA GİRİLMEDEN BUTON GÖRÜNMEZ.
// Numara artık ILETISIM.whatsapp içinde tutuluyor (tek kaynak).
export const WHATSAPP = {
  get numara() {
    return ILETISIM.whatsapp;
  },
  // Sohbet açıldığında mesaj kutusuna hazır gelen metin.
  hazirMesaj: "Merhaba, orQRestro hakkında bilgi almak istiyorum.",
  etiket: "WhatsApp'tan yazın",
};

// --- Ücretsiz deneme ---------------------------------------------------------
// Deneme, abonelik kaydı "deneme" durumuyla açılarak veriliyor
// (bkz. burger-plus-backend/superAdminDb.js → abonelikOlustur).
// Otomatik değil: talep geldikten sonra kurulum ekip tarafından yapılıyor.
export const DENEME = {
  gunSayisi: 0,
  baslik: "Platform şu anda demo aşamasında",
  aciklama: "Ticari paketler ve fiyatlar kesinleşmeden önce müşteri deneyimini canlı demoda inceleyebilirsiniz.",
  buton: "Canlı Demoyu Aç",
};

// --- Talep formu -------------------------------------------------------------
// Self-servis kayıt olmadığı için dönüşüm bu formdan geçer: ziyaretçi
// bilgilerini bırakır, form içeriği tek mesaja dönüşüp WhatsApp'a (yoksa
// e-postaya) aktarılır. Gönderim tamamen istemci tarafındadır; hiçbir veri
// bu sayfada saklanmaz veya üçüncü bir sunucuya iletilmez.
export const TALEP_FORMU = {
  etiket: "Demo durumu",
  baslik: "ŞEFFAF",
  vurgu: "İLERLİYORUZ",
  aciklama: "Ürünü bugün inceleyebilirsiniz. Satış ve pilot işletme başvuruları başladığında doğrulanmış iletişim bilgileri bu bölümde yayınlanacak.",
  buton: "Talebi Gönder",
  butonEposta: "E-posta ile Gönder",
  gizlilikNotu: "Formu göndererek {kvkkBaglantisi} okuduğunuzu kabul edersiniz. Bilgileriniz yalnızca size dönüş yapmak için kullanılır.",
  kvkkBaglantiMetni: "KVKK Aydınlatma Metni'ni",
  alanlar: {
    ad: { etiket: "Ad Soyad", tutucu: "Adınız ve soyadınız", zorunlu: true },
    isletme: { etiket: "İşletme Adı", tutucu: "Örn. Lezzet Durağı", zorunlu: true },
    telefon: { etiket: "Telefon", tutucu: "05XX XXX XX XX", zorunlu: true },
    eposta: { etiket: "E-posta", tutucu: "ornek@isletmeniz.com", zorunlu: false },
    masaSayisi: { etiket: "Masa Sayısı", tutucu: "Örn. 12", zorunlu: false },
    mesaj: { etiket: "Eklemek istedikleriniz", tutucu: "Konseptiniz, sorularınız…", zorunlu: false },
  },
  paketEtiketi: "İlgilendiğiniz paket",
  hatalar: {
    zorunlu: "Bu alan zorunludur.",
    telefon: "Geçerli bir telefon numarası girin (örn. 0532 111 22 33).",
    eposta: "Geçerli bir e-posta adresi girin.",
  },
};

const YIL = new Date().getFullYear();

export const ICERIK = {
  // --- Marka ---------------------------------------------------------------
  markaAdi: "orQRestro",
  markaAdiHtml: 'or<span class="marka-qr-vurgu">QR</span>estro',
  markaAciklamasi: "Yeni nesil dijital restoran yönetim sistemi.",
  telifSatiri: `© ${YIL} orQRestro. Tüm hakları saklıdır.`,

  // --- SEO / Open Graph ----------------------------------------------------
  sayfaBasligi: "orQRestro | QR Menü ve Restoran Yönetimi",
  sayfaAciklamasi:
    "QR kodla masadan sipariş, canlı mutfak paneli, sadakat programı ve detaylı raporlar. Restoran yönetim platformunun çalışan demo akışlarını inceleyin.",
  ogGorsel: "/gorseller/hero-telefon.jpg",
  ogGorselAlt: "orQRestro müşteri uygulamasının telefon ekranındaki görünümü",

  // --- Hero ----------------------------------------------------------------
  heroRozet: "Canlı ürün demosu kullanıma açık",
  heroBaslikBir: "MASANIZ",
  heroVurguBir: "DİJİTAL",
  heroBaslikIki: "MUTFAĞINIZ",
  heroVurguIki: "CANLI",
  heroAciklama: "Müşterinin QR menüsünden mutfak ekranına, salon krokisinden işletme raporlarına kadar bütün restoran akışını tek demoda görün.",
  heroBirincilButon: "Müşteri Demosunu Aç",
  heroIkincilButon: "Ürün Turunu İncele",

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

  yorumlarEtiket: "Operasyon etkisi",
  yorumlarBaslik: "PLATFORM NEYİ",
  yorumlarVurgu: "İYİLEŞTİRİR?",

  fiyatEtiket: "Fiyatlandırma",
  fiyatBaslik: "İHTİYACA GÖRE",
  fiyatVurgu: "PAKETLER",
  fiyatAciklama: "Paket kapsamları demo geri bildirimleriyle şekilleniyor. Aşağıdaki yapı ürün planını gösterir; fiyatlar henüz satış teklifi değildir.",

  sssEtiket: "SSS",
  sssBaslik: "SIK SORULAN",
  sssVurgu: "SORULAR",

  ctaBaslik: "ÜRÜNÜ ANLATMAYALIM,",
  ctaVurgu: "GÖSTERELİM",
  ctaAciklama: "Müşteri uygulamasını tarayıcıda açın ve restoran deneyimini doğrudan test edin. Yetkili demo hesapları personel panelinden giriş yapabilir.",
  ctaBirincilButon: "Personel Paneline Giriş",
  ctaIkincilButon: "Canlı Müşteri Demosu",
};

// --- Navigasyon --------------------------------------------------------------
export const NAV_BAGLANTILARI = [
  { ad: "Ana Sayfa", hedef: "#ust" },
  { ad: "Ürün Turu", hedef: "#urun-turu" },
  { ad: "Özellikler", hedef: "#ozellikler" },
  { ad: "Fiyatlandırma", hedef: "#fiyatlandirma" },
];

// --- Konsept şeridi ----------------------------------------------------------
// Uydurma müşteri logoları yerine backend'in gerçekten desteklediği konseptler
// gösteriliyor (bkz. burger-plus-backend/konseptler.js).
export const KONSEPTLER = [
  { ad: "Burger", ikon: "burger" },
  { ad: "Cafe", ikon: "kahve" },
  { ad: "Pizza", ikon: "pizza" },
  { ad: "Online Ödeme Altyapısı", ikon: "kart" },
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
    baslik: "Ödemeye Hazır Altyapı",
    metin: "Ödeme tutarı sunucuda doğrulanır. Canlı kartlı ödeme, sağlayıcı sözleşmesi ve işletme ayarları tamamlandıktan sonra etkinleştirilir.",
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

// Demo aşamasında doğrulanmamış müşteri yorumu yerine ürünün doğrudan
// iyileştirdiği operasyon alanları anlatılır.
export const SONUCLAR = [
  { sira: "01", baslik: "Sipariş akışı sadeleşir", metin: "Müşteri, mutfak ve salon aynı sipariş durumunu görür; sözlü aktarım ve tekrar azalır.", detay: "Tek sipariş kaynağı", ikon: "qr" },
  { sira: "02", baslik: "Yoğunluk görünür olur", metin: "Bekleyen masalar, hazırlık süreleri ve kritik stoklar yönetim ekranında birlikte izlenir.", detay: "Canlı operasyon", ikon: "grafik" },
  { sira: "03", baslik: "Müşteri geri gelir", metin: "Puan, damga kartı, kampanya ve uygulama içi cüzdan aynı müşteri hesabında çalışır.", detay: "Sadakat araçları", ikon: "yildiz" },
  { sira: "04", baslik: "Marka korunur", metin: "Logo, tema, içerik ve kampanyalar her işletmeye özel yönetilir; müşteri restoranın markasını görür.", detay: "White-label deneyim", ikon: "marka" },
];

// --- Paketler ----------------------------------------------------------------
// Demo paket kapsamları; ticari fiyatlar anlaşmalar tamamlanınca eklenecek.
export const PAKETLER = [
  {
    ad: "Başlangıç",
    hedefKitle: "Tek şubeli küçük işletmeler",
    fiyat: "Fiyat yakında",
    ozellikler: [
      "Sınırsız QR menü görüntüleme",
      "Temel tema özelleştirme",
      "Ürün ve kategori yönetimi",
      "E-posta desteği",
    ],
    buton: "Demoyu İncele",
    populer: false,
  },
  {
    ad: "Profesyonel",
    hedefKitle: "Masadan sipariş alan işletmeler",
    fiyat: "Fiyat yakında",
    ozellikler: [
      "Başlangıç paketindeki her şey",
      "Masadan canlı sipariş alma",
      "Canlı mutfak ve salon paneli",
      "Online ödeme entegrasyonuna hazır altyapı",
      "Sadakat programı ve raporlar",
    ],
    buton: "Canlı Demoyu Aç",
    populer: true,
    rozet: "TAM ÜRÜN DENEYİMİ",
  },
  {
    ad: "Kurumsal",
    hedefKitle: "Çok şubeli zincirler",
    fiyat: "Planlanıyor",
    periyot: "",
    ozellikler: [
      "Profesyonel paketteki her şey",
      "Çoklu şube yönetimi",
      "Özel sadakat kurgusu",
      "İki adımlı doğrulama zorunluluğu",
      "Öncelikli destek",
    ],
    buton: "Kapsamı İncele",
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
      "Ödeme entegrasyonunda sipariş tutarı istemciden değil sunucuda hesaplanır ve sağlayıcı sonucu ayrıca doğrulanır. Platform demo aşamasındadır; canlı kartlı ödeme ancak ödeme kuruluşu sözleşmesi ve işletmeye özel ayarlar tamamlandıktan sonra etkinleştirilir.",
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
    baslik: "Yasal",
    baglantilar: [
      { ad: "Kullanım Koşulları", hedef: YASAL_SAYFALAR.kosullar },
      { ad: "Gizlilik Politikası", hedef: YASAL_SAYFALAR.gizlilik },
      { ad: "KVKK Aydınlatma Metni", hedef: YASAL_SAYFALAR.kvkk },
      { ad: "Çerez Politikası", hedef: YASAL_SAYFALAR.cerez },
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

export function seoMetaHtml() {
  if (!SITE_URL) return "<!-- VITE_SITE_URL tanımlandığında canonical ve og:url otomatik eklenir. -->";
  return `<link rel="canonical" href="${kacis(SITE_URL)}/"/><meta property="og:url" content="${kacis(SITE_URL)}/"/>`;
}

export function yapilandirilmisVeriHtml() {
  const veri = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "SoftwareApplication", name: ICERIK.markaAdi, applicationCategory: "BusinessApplication", operatingSystem: "Web", description: ICERIK.sayfaAciklamasi, url: SITE_URL || undefined },
      { "@type": "FAQPage", mainEntity: SORULAR.map((oge) => ({ "@type": "Question", name: oge.soru, acceptedAnswer: { "@type": "Answer", text: oge.cevap } })) },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(veri).replace(/</g, "\\u003c")}</script>`;
}

// WhatsApp sohbet adresi. Numara tanımlı değilse null döner.
export function whatsappAdresi() {
  const rakamlar = String(WHATSAPP.numara || "").replace(/\D/g, "");
  if (!rakamlar) return null;
  return `https://wa.me/${rakamlar}?text=${encodeURIComponent(WHATSAPP.hazirMesaj)}`;
}

// Form gönderimi için en az bir kanal tanımlı mı? İkisi de boşsa satış formu
// yerine demo sürecini açıklayan bilgilendirme kartı gösterilir.
export function iletisimKanaliVarMi() {
  return Boolean(String(ILETISIM.whatsapp || "").replace(/\D/g, "") || String(ILETISIM.eposta || "").trim());
}

// Tüm dönüşüm butonları buraya gider (form varsa forma, yoksa kapanışa).
export function denemeBaglantisi() {
  return baslaBaglantisi();
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
  return `
    <div class="deneme-serit isik-kart mb-12 flex flex-col items-center gap-4 rounded-2xl border border-marka-turuncu-500/40 bg-marka-turuncu-500/[0.06] px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
      <div>
        <p class="font-baslik text-lg font-bold text-marka-metin">${kacis(DENEME.baslik)}</p>
        <p class="mt-1 text-sm leading-relaxed text-marka-gri-300">${kacis(DENEME.aciklama)}</p>
      </div>
      <a class="marka-buton shrink-0 whitespace-nowrap rounded-full px-7 py-3 text-sm font-medium" href="${ROTALAR.musteriDemo}">${kacis(DENEME.buton)}</a>
    </div>`;
}

// Talep formu render edilmişse menüye "İletişim" de eklenir.
function navBaglantilari() {
  return iletisimKanaliVarMi()
    ? [...NAV_BAGLANTILARI, { ad: "İletişim", hedef: "#iletisim" }]
    : NAV_BAGLANTILARI;
}

export function navBaglantilariHtml() {
  return navBaglantilari().map(
    (baglanti) => `
      <a class="nav-baglanti text-sm text-marka-gri-300 transition-colors hover:text-marka-metin" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a>`,
  ).join("");
}

export function mobilNavBaglantilariHtml() {
  return navBaglantilari().map(
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

export function sonucKartlariHtml() {
  return SONUCLAR.map((sonuc) => `<article class="sonuc-karti isik-kart"><header><span>${sonuc.sira}</span><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ikonCizimi(sonuc.ikon)}</svg></header><h3>${kacis(sonuc.baslik)}</h3><p>${kacis(sonuc.metin)}</p><small>${kacis(sonuc.detay)}</small></article>`).join("");
}

function fiyatBlokHtml(paket) {
  return `<p class="mb-8"><span class="font-baslik text-2xl font-bold text-marka-turuncu-500">${kacis(paket.fiyat)}</span></p>`;
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

    const hedef = ROTALAR.musteriDemo;
    const paketVerisi = ` data-paket="${kacis(paket.ad)}"`;
    const buton = paket.populer
      ? `<a class="marka-buton block w-full rounded-xl py-3 text-center text-sm font-medium" href="${hedef}"${paketVerisi}>${kacis(paket.buton)}</a>`
      : `<a class="block w-full rounded-xl border border-marka-cizgi py-3 text-center text-sm font-medium text-marka-metin transition-colors hover:border-marka-gri-400 hover:bg-white/5" href="${hedef}"${paketVerisi}>${kacis(paket.buton)}</a>`;

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

export function paketKarsilastirmaHtml() {
  const satirlar = [
    ["QR menü ve ürün yönetimi", true, true, true], ["Tema ve marka özelleştirme", true, true, true],
    ["Masadan canlı sipariş", false, true, true], ["Mutfak ve salon paneli", false, true, true],
    ["Sadakat, kampanya ve cüzdan", false, true, true], ["Raporlama ve değerlendirme", false, true, true],
    ["Çoklu şube planı", false, false, true], ["Öncelikli destek planı", false, false, true],
  ];
  const isaret = (varMi) => varMi ? '<span class="karsilastirma-var" aria-label="Dahil">✓</span>' : '<span class="karsilastirma-yok" aria-label="Dahil değil">—</span>';
  return `<div class="paket-karsilastirma"><table><thead><tr><th>Kapsam</th><th>Başlangıç</th><th>Profesyonel</th><th>Kurumsal</th></tr></thead><tbody>${satirlar.map(([ad, ...degerler]) => `<tr><th>${kacis(ad)}</th>${degerler.map((deger) => `<td>${isaret(deger)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
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

// --- Talep formu / demo durumu ----------------------------------------------
export function talepFormuHtml() {
  if (!iletisimKanaliVarMi()) {
    return `<div class="demo-iletisim-durumu cam-panel"><span class="demo-rozet">ŞEFFAF DEMO SÜRECİ</span><h3>Henüz satış başvurusu toplamıyoruz</h3><p>Platform aktif geliştirme ve demo aşamasında. İşletme anlaşmaları başladığında doğrulanmış iletişim kanalları ve başvuru formu burada açılacak.</p><div><a class="marka-buton" href="${ROTALAR.musteriDemo}">Müşteri Demosunu Aç</a><a href="${ROTALAR.personelGiris}">Demo hesabın varsa giriş yap</a></div><small>Telefon, e-posta veya müşteri bilgisi uydurulmamıştır.</small></div>`;
  }

  const A = TALEP_FORMU.alanlar;
  const zorunluIsareti = '<span class="text-marka-turuncu-500" aria-hidden="true">*</span>';

  const alan = (ad, tanim, tur = "text", ekAttr = "") => `
        <div class="talep-alan">
          <label class="talep-etiket" for="talep-${ad}">
            ${kacis(tanim.etiket)}${tanim.zorunlu ? ` ${zorunluIsareti}` : ""}
          </label>
          <input class="talep-girdi" id="talep-${ad}" name="${ad}" type="${tur}"
                 placeholder="${kacis(tanim.tutucu)}"${tanim.zorunlu ? " required" : ""}
                 aria-describedby="talep-${ad}-hata"${ekAttr}/>
          <p class="talep-hata" id="talep-${ad}-hata" role="alert" hidden></p>
        </div>`;

  const paketSecenekleri = PAKETLER.map(
    (paket) => `<option value="${kacis(paket.ad)}">${kacis(paket.ad)}</option>`,
  ).join("");

  const gizlilikNotu = TALEP_FORMU.gizlilikNotu.replace(
    "{kvkkBaglantisi}",
    `<a class="talep-yasal-baglanti" href="${YASAL_SAYFALAR.kvkk}">${kacis(TALEP_FORMU.kvkkBaglantiMetni)}</a>`,
  );

  // JavaScript çalışmazsa form gönderilemez; bu yüzden doğrudan kanallar
  // yedek olarak gösterilir (aşamalı geliştirme).
  const wa = whatsappAdresi();
  const eposta = String(ILETISIM.eposta || "").trim();
  const yedekBaglantilar = [
    wa ? `<a class="talep-yedek-baglanti" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp'tan yazın</a>` : "",
    eposta ? `<a class="talep-yedek-baglanti" href="mailto:${kacis(eposta)}">${kacis(eposta)}</a>` : "",
  ].filter(Boolean).join(" · ");

  // Kanal ve hedef HTML'e gömülür; arayuz.js bunları okuyup gönderim adresini
  // kurar (icerik.js build sırasında çalışır, tarayıcıya taşınmaz).
  const waRakamlari = String(ILETISIM.whatsapp || "").replace(/\D/g, "");
  const kanal = waRakamlari ? "whatsapp" : "eposta";
  const kanalHedefi = waRakamlari || eposta;

  return `
      <form class="talep-form isik-kart" id="talep-formu" novalidate
            data-kanal="${kanal}" data-hedef="${kacis(kanalHedefi)}">
        <div class="talep-izgara">
          ${alan("ad", A.ad, "text", ' autocomplete="name"')}
          ${alan("isletme", A.isletme, "text", ' autocomplete="organization"')}
          ${alan("telefon", A.telefon, "tel", ' autocomplete="tel" inputmode="tel"')}
          ${alan("eposta", A.eposta, "email", ' autocomplete="email"')}
          ${alan("masaSayisi", A.masaSayisi, "number", ' min="1" max="999" inputmode="numeric"')}
          <div class="talep-alan">
            <label class="talep-etiket" for="talep-paket">${kacis(TALEP_FORMU.paketEtiketi)}</label>
            <select class="talep-girdi" id="talep-paket" name="paket">
              ${paketSecenekleri}
              <option value="Kararsızım">Kararsızım</option>
            </select>
          </div>
        </div>

        <div class="talep-alan talep-alan--genis">
          <label class="talep-etiket" for="talep-mesaj">${kacis(A.mesaj.etiket)}</label>
          <textarea class="talep-girdi talep-girdi--metin" id="talep-mesaj" name="mesaj" rows="3"
                    placeholder="${kacis(A.mesaj.tutucu)}"></textarea>
        </div>

        <label class="talep-onay">
          <input type="checkbox" id="talep-kvkk" name="kvkk" required/>
          <span>${gizlilikNotu}</span>
        </label>
        <p class="talep-hata" id="talep-kvkk-hata" role="alert" hidden></p>

        <button class="marka-buton talep-gonder" type="submit">${kacis(wa ? TALEP_FORMU.buton : TALEP_FORMU.butonEposta)}</button>

        <p class="talep-durum" id="talep-durum" role="status" aria-live="polite"></p>

        <noscript>
          <p class="talep-yedek">Formu göndermek için JavaScript gerekir. Doğrudan ulaşın: ${yedekBaglantilar}</p>
        </noscript>
      </form>`;
}

// Altbilgide görünen iletişim bilgileri. Tanımlı olan alanlar basılır.
export function altbilgiIletisimHtml() {
  const satirlar = [];
  const eposta = String(ILETISIM.eposta || "").trim();
  const telefon = String(ILETISIM.telefon || "").trim();
  if (eposta) satirlar.push(`<li><a class="transition-colors hover:text-marka-metin" href="mailto:${kacis(eposta)}">${kacis(eposta)}</a></li>`);
  if (telefon) satirlar.push(`<li><a class="transition-colors hover:text-marka-metin" href="tel:${telefon.replace(/[^\d+]/g, "")}">${kacis(telefon)}</a></li>`);
  const wa = whatsappAdresi();
  if (wa) satirlar.push(`<li><a class="transition-colors hover:text-marka-metin" href="${wa}" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>`);
  if (!satirlar.length) return "<!-- Altbilgi iletisim: ILETISIM alanlari bos. -->";

  return `
      <div>
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-marka-metin">İletişim</h3>
        <ul class="flex flex-col gap-2 text-sm text-marka-gri-400">${satirlar.join("")}
        </ul>
      </div>`;
}

export function altbilgiKolonlariHtml() {
  return ALTBILGI_KOLONLARI.map(
    (kolon) => `
      <div>
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-marka-metin">${kacis(kolon.baslik)}</h3>
        <ul class="flex flex-col gap-2 text-sm text-marka-gri-400">${kolon.baglantilar
          .map(
            (baglanti) => `
          <li><a class="transition-colors hover:text-marka-metin" href="${baglanti.hedef}">${kacis(baglanti.ad)}</a></li>`,
          )
          .join("")}
        </ul>
      </div>`,
  ).join("");
}
