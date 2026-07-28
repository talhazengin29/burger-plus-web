/* ==========================================================================
   Sahte veri. Şu an her şey buradan besleniyor.
   İleride gerçek backend bağlanınca sadece bu dosya değişir, ekranlar aynı kalır.
   ========================================================================== */

// Görseller Unsplash'ten (tasarımdaki yemek fotoğrafı vurgusuna uygun)
// Not: Gerçek kullanıcı bilgisi (ad, e-posta, puan) artık backend'den gelir.
// Bu nesne yalnızca henüz gerçek sisteme bağlanmamış arayüz varsayılanlarını tutar
// (sadakat damgası, hedef puan, varsayılan avatar görseli).
export const sadakatVarsayilan = {
  avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  hedefPuan: 2000,
  // "5 al 1 bedava" damga sayacı (henüz gerçek sisteme bağlı değil)
  burgerDamga: 0,
  burgerDamgaHedef: 5,
};

export const kategoriler = ["Tümü", "Burgerler", "Yan Lezzetler", "İçecekler"];

// Ana sayfadaki yuvarlak kategori rozetlerinin görselleri.
// Anahtar = `kategoriler` içindeki ad. Yeni kategori eklenirse buraya da bir
// görsel eklenir; eksikse rozet görselsiz (sadece yazı) gösterilir.
export const kategoriGorseller = {
  "Tümü": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=160&h=160&fit=crop",
  "Burgerler": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop",
  "Yan Lezzetler": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=160&h=160&fit=crop",
  "İçecekler": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=160&h=160&fit=crop",
};

export const urunler = [
  {
    id: 1,
    ad: "Classic Burger",
    fiyat: 180,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    aciklama: "Özel soslu, taze malzemelerle hazırlanan klasik lezzet.",
    malzemeler: ["Dana köfte", "Cheddar", "Marul", "Domates", "Soğan", "Turşu", "Özel sos"],
    besinDegerleri: { kalori: "520 kcal", protein: "32g", karbonhidrat: "38g", yag: "26g" },
    alerjenler: ["Gluten", "Süt Ürünleri"],
    gramajOpsiyonu: {
      aktif: true,
      etiket: "Köfte gramajı",
      birim: "gr",
      artisMiktari: 50,
      maxAdim: 3,
      fiyatArtisi: 35,
    },
  },
  {
    id: 2,
    ad: "BBQ Smoke Burger",
    fiyat: 220,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop",
    aciklama: "Dumanlı BBQ sosu ve çıtır soğanla zenginleştirilmiş, dolgun bir burger.",
    malzemeler: ["Dana köfte", "Cheddar", "Çıtır soğan", "BBQ sos", "Marul", "Turşu"],
    besinDegerleri: { kalori: "610 kcal", protein: "35g", karbonhidrat: "42g", yag: "32g" },
    alerjenler: ["Gluten", "Süt Ürünleri", "Hardal"],
    gramajOpsiyonu: {
      aktif: true,
      etiket: "Köfte gramajı",
      birim: "gr",
      artisMiktari: 75,
      maxAdim: 2,
      fiyatArtisi: 50,
    },
  },
  {
    id: 3,
    ad: "Vegan Burger",
    fiyat: 195,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop",
    aciklama: "Bitkisel köfte ve taze sebzelerle hazırlanan hafif, doyurucu seçenek.",
    malzemeler: ["Bitkisel köfte", "Marul", "Domates", "Soğan", "Vegan sos"],
    besinDegerleri: { kalori: "410 kcal", protein: "18g", karbonhidrat: "44g", yag: "16g" },
    alerjenler: ["Gluten", "Soya"],
  },
  {
    id: 4,
    ad: "Double Cheese",
    fiyat: 250,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop",
    aciklama: "İki kat köfte, iki kat cheddar — peynir severler için doyurucu klasik.",
    malzemeler: ["Dana köfte x2", "Cheddar x2", "Marul", "Domates", "Özel sos"],
    besinDegerleri: { kalori: "720 kcal", protein: "44g", karbonhidrat: "40g", yag: "42g" },
    alerjenler: ["Gluten", "Süt Ürünleri"],
  },
  {
    id: 5,
    ad: "Çıtır Patates",
    fiyat: 75,
    kategori: "Yan Lezzetler",
    gorsel: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
    aciklama: "Dışı çıtır, içi yumuşacık, taze kızartılmış patates.",
    malzemeler: ["Patates", "Ayçiçek yağı", "Tuz"],
    besinDegerleri: { kalori: "340 kcal", protein: "5g", karbonhidrat: "42g", yag: "17g" },
    alerjenler: [],
    gramajOpsiyonu: {
      aktif: true,
      etiket: "Patates porsiyonu",
      birim: "gr",
      artisMiktari: 100,
      maxAdim: 2,
      fiyatArtisi: 30,
    },
  },
  {
    id: 6,
    ad: "Soğan Halkası",
    fiyat: 85,
    kategori: "Yan Lezzetler",
    gorsel: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=400&fit=crop",
    aciklama: "Çıtır galeta kaplamalı, altın sarısı kızarmış soğan halkaları.",
    malzemeler: ["Soğan", "Galeta unu", "Un", "Baharatlar"],
    besinDegerleri: { kalori: "380 kcal", protein: "6g", karbonhidrat: "46g", yag: "18g" },
    alerjenler: ["Gluten", "Yumurta"],
  },
  {
    id: 7,
    ad: "Kola",
    fiyat: 40,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
    aciklama: "Soğuk ve gazlı, klasik kola.",
    malzemeler: ["Karbonatlı su", "Şeker", "Kola aroması"],
    besinDegerleri: { kalori: "140 kcal", protein: "0g", karbonhidrat: "36g", yag: "0g" },
    alerjenler: [],
  },
  {
    id: 8,
    ad: "Limonata",
    fiyat: 55,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop",
    aciklama: "Taze sıkılmış limon ve naneyle serinletici ev yapımı limonata.",
    malzemeler: ["Limon", "Şeker", "Nane", "Su"],
    besinDegerleri: { kalori: "110 kcal", protein: "0g", karbonhidrat: "28g", yag: "0g" },
    alerjenler: [],
  },
  {
    id: 9,
    ad: "Ayran",
    fiyat: 35,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop",
    aciklama: "Geleneksel usul, köpüklü ve serinletici ayran.",
    malzemeler: ["Yoğurt", "Su", "Tuz"],
    besinDegerleri: { kalori: "70 kcal", protein: "3g", karbonhidrat: "5g", yag: "3g" },
    alerjenler: ["Süt Ürünleri"],
  },
  {
    id: 10,
    ad: "Su",
    fiyat: 15,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1616118132534-381148898bb4?w=400&h=400&fit=crop",
    aciklama: "Doğal kaynak suyu, 500 ml.",
    malzemeler: ["Doğal kaynak suyu"],
    besinDegerleri: { kalori: "0 kcal", protein: "0g", karbonhidrat: "0g", yag: "0g" },
    alerjenler: [],
  },
  {
    id: 11,
    ad: "Soda",
    fiyat: 30,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop",
    aciklama: "Buz gibi, gazlı maden sodası.",
    malzemeler: ["Karbonatlı maden suyu"],
    besinDegerleri: { kalori: "0 kcal", protein: "0g", karbonhidrat: "0g", yag: "0g" },
    alerjenler: [],
  },
  {
    id: 12,
    ad: "Çay",
    fiyat: 20,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=400&fit=crop",
    aciklama: "Demli, sıcak servis edilen açık çay.",
    malzemeler: ["Çay yaprağı", "Su"],
    besinDegerleri: { kalori: "5 kcal", protein: "0g", karbonhidrat: "1g", yag: "0g" },
    alerjenler: [],
  },
];

export const kampanyalar = [
  {
    id: 1,
    etiket: "14:00 - 17:00",
    baslik: "Happy Hour",
    aciklama: "14:00-17:00 arası tüm içeceklerde %30 indirim!",
    buton: "Sipariş Ver",
    butonTipi: "primary",
    gorsel: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=400&fit=crop",
    aktif: true,
    baslangicSaat: 14,
    bitisSaat: 17,
    indirimYuzde: 30,
    gecerliKategoriler: ["İçecekler"],
    kampanyaTipi: "saatli",
  },
  {
    id: 2,
    etiket: "Öğrenciye Özel",
    baslik: "Öğrenci Menüsü",
    aciklama: "Tüm burgerlerde her zaman %15 indirim. Öğrenci kimliğini göstermeyi unutma!",
    buton: "Sipariş Ver",
    butonTipi: "primary",
    gorsel: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop",
    aktif: true,
    baslangicSaat: null,
    bitisSaat: null,
    indirimYuzde: 15,
    gecerliKategoriler: ["Burgerler"],
    kampanyaTipi: "surekli",
  },
  {
    id: 3,
    etiket: "Davet Et",
    baslik: "Arkadaşını Getir",
    aciklama: "Davet kodunla arkadaşını Burger Plus'a getir, o ilk siparişini versin, ikinize de bedava dondurma hediye edelim!",
    buton: "Davet Kodu Oluştur",
    butonTipi: "charcoal",
    gorsel: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&h=400&fit=crop",
    aktif: true,
    baslangicSaat: null,
    bitisSaat: null,
    indirimYuzde: 0,
    gecerliKategoriler: [],
    kampanyaTipi: "surekli",
  },
];

// Kampanya şu anda (verilen saatte) geçerli mi? Saatli kampanyalar için
// başlangıç/bitiş saatine, sürekli kampanyalar için sadece aktif bayrağına bakar.
export function kampanyaAktifMi(kampanya, simdi = new Date()) {
  if (!kampanya.aktif) return false;
  if (kampanya.kampanyaTipi === "surekli") return true;
  if (kampanya.kampanyaTipi === "saatli") {
    const saat = simdi.getHours();
    return saat >= kampanya.baslangicSaat && saat < kampanya.bitisSaat;
  }
  return false;
}

// Kampanya kartında gösterilecek canlı durum rozeti.
export function kampanyaDurumu(kampanya, simdi = new Date()) {
  if (kampanya.kampanyaTipi !== "saatli") {
    return kampanyaAktifMi(kampanya, simdi) ? "aktif" : "pasif";
  }
  const saat = simdi.getHours();
  if (saat < kampanya.baslangicSaat) return "baslamadi";
  if (saat >= kampanya.bitisSaat) return "sonaerdi";
  return "aktif";
}

export const oduller = [
  {
    id: 1,
    ad: "Küçük Boy Patates",
    puan: 300,
    gorsel: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    ad: "Seçili İçecek",
    puan: 400,
    gorsel: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    ad: "Classic Burger",
    puan: 1200,
    gorsel: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    ad: "%25 İndirim Çeki",
    puan: 800,
    gorsel: null, // görsel yerine ikon gösterilecek
  },
];

export const puanGecmisi = [
  { id: 1, baslik: "Akşam Yemeği Siparişi", tarih: "12.05.2024", puan: 120, tip: "kazanc" },
  { id: 2, baslik: "Ödül Kullanımı: İçecek", tarih: "08.05.2024", puan: -400, tip: "harcama" },
  { id: 3, baslik: "Öğle Yemeği Menüsü", tarih: "01.05.2024", puan: 85, tip: "kazanc" },
];

// Puan kazanım oranı: her kaç TL'ye 1 puan.
// 10 → her 10 TL'ye 1 puan (200 TL = 20 puan). Oranı değiştirmek istersen tek yer burası.
export const PUAN_ORANI_TL = 10;

// Harcamadan kazanılacak puanı hesaplar
export function puanHesapla(tutar) {
  return Math.floor(tutar / PUAN_ORANI_TL);
}
