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
  // İlk ekran çizimi için varsayılan; girişten sonra backend sadakat verisi kullanılır.
  burgerDamga: 0,
  burgerDamgaHedef: 5,
};

export const kategoriler = ["Tümü", "Menüler", "Burgerler", "Yan Lezzetler", "İçecekler"];

// Ana sayfadaki yuvarlak kategori rozetlerinin görselleri.
// Anahtar = `kategoriler` içindeki ad. Yeni kategori eklenirse buraya da bir
// görsel eklenir; eksikse rozet görselsiz (sadece yazı) gösterilir.
export const kategoriGorseller = {
  "Tümü": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=160&h=160&fit=crop",
  "Menüler": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&h=160&fit=crop",
  "Burgerler": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=160&h=160&fit=crop",
  "Yan Lezzetler": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=160&h=160&fit=crop",
  "İçecekler": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=160&h=160&fit=crop",
};

// Kategori + ürünün temel miktarı + fiyatından otomatik artış üretir.
// Üründe gramajOpsiyonu tanımlanırsa hesaplanan değerleri ezer;
// gramajOpsiyonu: null verilirse yalnızca o üründe özellik kapatılır.
export const kategoriUrunKurallari = {
  "Burgerler": {
    etiket: "Köfte gramajı",
    birim: "gr",
    artisOrani: 0.25,
    miktarYuvarlama: 25,
    fiyatArtisOrani: 0.20,
    fiyatYuvarlama: 5,
    maxAdim: 3,
  },
  "Yan Lezzetler": {
    etiket: "Porsiyon gramajı",
    birim: "gr",
    artisOrani: 0.25,
    miktarYuvarlama: 25,
    fiyatArtisOrani: 0.40,
    fiyatYuvarlama: 5,
    maxAdim: 3,
  },
  "İçecekler": {
    etiket: "İçecek hacmi",
    birim: "ml",
    artisOrani: 0.25,
    miktarYuvarlama: 25,
    fiyatArtisOrani: 0.25,
    fiyatYuvarlama: 5,
    maxAdim: 3,
  },
};

function enYakinaYuvarla(deger, adim) {
  return Math.max(adim, Math.round(deger / adim) * adim);
}

export function urunKurallariniUygula(urun) {
  if (urun.urunTipi && urun.urunTipi !== "burger") return urun;
  const kategoriKurali = kategoriUrunKurallari[urun.kategori];
  const uruneOzelMi = Object.prototype.hasOwnProperty.call(urun, "gramajOpsiyonu");

  if (!kategoriKurali || !Number.isFinite(urun.temelMiktar) || urun.temelMiktar <= 0) return urun;
  if (uruneOzelMi && !urun.gramajOpsiyonu) return urun;

  const hesaplananGramaj = {
    aktif: true,
    etiket: kategoriKurali.etiket,
    birim: kategoriKurali.birim,
    artisMiktari: enYakinaYuvarla(
      urun.temelMiktar * kategoriKurali.artisOrani,
      kategoriKurali.miktarYuvarlama
    ),
    maxAdim: kategoriKurali.maxAdim,
    fiyatArtisi: enYakinaYuvarla(
      urun.fiyat * kategoriKurali.fiyatArtisOrani,
      kategoriKurali.fiyatYuvarlama
    ),
  };

  return {
    ...urun,
    gramajOpsiyonu: {
      ...hesaplananGramaj,
      ...(urun.gramajOpsiyonu || {}),
    },
  };
}

const temelUrunListesi = [
  {
    id: 1,
    ad: "Classic Burger",
    fiyat: 180,
    kategori: "Burgerler",
    temelMiktar: 200,
    gorsel: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    aciklama: "Özel soslu, taze malzemelerle hazırlanan klasik lezzet.",
    malzemeler: ["Dana köfte", "Cheddar", "Marul", "Domates", "Soğan", "Turşu", "Özel sos"],
    besinDegerleri: { kalori: "520 kcal", protein: "32g", karbonhidrat: "38g", yag: "26g" },
    alerjenler: ["Gluten", "Süt Ürünleri"],
  },
  {
    id: 2,
    ad: "BBQ Smoke Burger",
    fiyat: 220,
    kategori: "Burgerler",
    temelMiktar: 300,
    gorsel: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop",
    aciklama: "Dumanlı BBQ sosu ve çıtır soğanla zenginleştirilmiş, dolgun bir burger.",
    malzemeler: ["Dana köfte", "Cheddar", "Çıtır soğan", "BBQ sos", "Marul", "Turşu"],
    besinDegerleri: { kalori: "610 kcal", protein: "35g", karbonhidrat: "42g", yag: "32g" },
    alerjenler: ["Gluten", "Süt Ürünleri", "Hardal"],
  },
  {
    id: 3,
    ad: "Vegan Burger",
    fiyat: 195,
    kategori: "Burgerler",
    temelMiktar: 180,
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
    temelMiktar: 400,
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
    temelMiktar: 400,
    gorsel: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
    aciklama: "Dışı çıtır, içi yumuşacık, taze kızartılmış patates.",
    malzemeler: ["Patates", "Ayçiçek yağı", "Tuz"],
    besinDegerleri: { kalori: "340 kcal", protein: "5g", karbonhidrat: "42g", yag: "17g" },
    alerjenler: [],
  },
  {
    id: 6,
    ad: "Soğan Halkası",
    fiyat: 85,
    kategori: "Yan Lezzetler",
    temelMiktar: 200,
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
    temelMiktar: 330,
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
    temelMiktar: 400,
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
    temelMiktar: 300,
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
    temelMiktar: 500,
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
    temelMiktar: 200,
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
    temelMiktar: 200,
    gorsel: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=400&fit=crop",
    aciklama: "Demli, sıcak servis edilen açık çay.",
    malzemeler: ["Çay yaprağı", "Su"],
    besinDegerleri: { kalori: "5 kcal", protein: "0g", karbonhidrat: "1g", yag: "0g" },
    alerjenler: [],
  },
];

// Katalog, backend kapalıyken de zengin görünür. Backend aynı id'lerle geldiğinde
// fiyat, aktiflik ve yönetim panelinden değiştirilmiş ürün bilgileri önceliklidir.
const ekUrun = (id, ad, fiyat, kategori, temelMiktar, gorsel, malzemeler, gramajOpsiyonu) => ({
  id, ad, fiyat, kategori, temelMiktar, gorsel, malzemeler,
  aciklama: `${ad}, özenle hazırlanmış Burger Plus lezzeti.`,
  besinDegerleri: {},
  alerjenler: [],
  ...(gramajOpsiyonu === undefined ? {} : { gramajOpsiyonu }),
});

const ekUrunListesi = [
  ekUrun(13, "Trüflü Mushroom Burger", 275, "Burgerler", 220, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop", ["Dana köfte", "Cheddar", "Mantar", "Trüf sos", "Marul"]),
  ekUrun(14, "Acılı Mexican Burger", 260, "Burgerler", 200, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", ["Dana köfte", "Cheddar", "Jalapeno", "Meksika sosu", "Marul"]),
  ekUrun(15, "Crispy Chicken Burger", 220, "Burgerler", 180, "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop", ["Çıtır tavuk", "Cheddar", "Coleslaw", "Ranch sos"]),
  ekUrun(16, "BBQ Ranch Burger", 285, "Burgerler", 250, "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop", ["Dana köfte", "Cheddar", "BBQ sos", "Ranch sos", "Çıtır soğan"]),
  ekUrun(17, "Mozzarella Sticks", 110, "Yan Lezzetler", 180, "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=400&fit=crop", ["Mozzarella", "Galeta unu", "Marinara sos"]),
  ekUrun(18, "Coleslaw Salata", 70, "Yan Lezzetler", 160, "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop", ["Lahana", "Havuç", "Yoğurtlu sos"]),
  ekUrun(19, "Şeftalili Ice Tea", 50, "İçecekler", 330, "https://images.unsplash.com/photo-1497534446932-c925b458314e?w=400&h=400&fit=crop", ["Çay", "Şeftali", "Su"]),
  ekUrun(20, "Çikolatalı Milkshake", 95, "İçecekler", 400, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop", ["Süt", "Çikolata", "Dondurma"]),
  ekUrun(21, "Classic Menü", 255, "Menüler", 200, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", ["Classic Burger", "Çıtır Patates", "Kola"], null),
  ekUrun(22, "BBQ Smoke Menü", 305, "Menüler", 300, "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop", ["BBQ Smoke Burger", "Çıtır Patates", "Kola"], null),
  ekUrun(23, "Double Cheese Menü", 340, "Menüler", 400, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop", ["Double Cheese", "Çıtır Patates", "İçecek"], null),
  ekUrun(24, "Vegan Menü", 275, "Menüler", 180, "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop", ["Vegan Burger", "Patates", "Limonata"], null),
  ekUrun(25, "Crispy Chicken Menü", 305, "Menüler", 180, "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop", ["Crispy Chicken Burger", "Patates", "İçecek"], null),
  ekUrun(26, "Çocuk Menü", 190, "Menüler", 120, "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop", ["Mini Burger", "Patates", "Meyve suyu"], null),
  ekUrun(27, "Mantar Swiss Burger", 265, "Burgerler", 220, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop", ["Dana köfte", "Swiss peynir", "Mantar", "Karamelize soğan"]),
  ekUrun(28, "Firehouse Burger", 270, "Burgerler", 250, "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop", ["Dana köfte", "Cheddar", "Acı sos", "Jalapeno"]),
  ekUrun(29, "Avokadolu Burger", 255, "Burgerler", 180, "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop", ["Dana köfte", "Avokado", "Marul", "Domates"]),
  ekUrun(30, "Smashed Burger", 240, "Burgerler", 200, "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop", ["Smashed köfte", "Cheddar", "Soğan", "Özel sos"]),
  ekUrun(31, "Cheddar Soslu Patates", 95, "Yan Lezzetler", 300, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop", ["Patates", "Cheddar sos", "Taze soğan"]),
  ekUrun(32, "Baharatlı Patates", 90, "Yan Lezzetler", 300, "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop", ["Patates", "Baharat karışımı", "Tuz"]),
  ekUrun(33, "Çıtır Tavuk Parçaları", 135, "Yan Lezzetler", 220, "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop", ["Tavuk", "Çıtır kaplama", "Ranch sos"]),
  ekUrun(34, "Jalapeno Poppers", 115, "Yan Lezzetler", 180, "https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=400&fit=crop", ["Jalapeno", "Krem peynir", "Galeta unu"]),
  ekUrun(35, "Mac & Cheese Bites", 120, "Yan Lezzetler", 180, "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?w=400&h=400&fit=crop", ["Makarna", "Cheddar", "Galeta unu"]),
  ekUrun(36, "Akdeniz Salata", 100, "Yan Lezzetler", 220, "https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop", ["Yeşillik", "Domates", "Zeytin", "Peynir"]),
  ekUrun(37, "Zero Kola", 40, "İçecekler", 330, "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop", ["Karbonatlı su", "Kola aroması"]),
  ekUrun(38, "Fanta", 40, "İçecekler", 330, "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop", ["Karbonatlı su", "Portakal aroması"]),
  ekUrun(39, "Sprite", 40, "İçecekler", 330, "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop", ["Karbonatlı su", "Limon aroması"]),
  ekUrun(40, "Soğuk Kahve", 90, "İçecekler", 300, "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop", ["Kahve", "Süt", "Buz"]),
  ekUrun(41, "Vanilyalı Milkshake", 105, "İçecekler", 400, "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop", ["Süt", "Vanilya", "Dondurma"]),
  ekUrun(42, "Taze Portakal Suyu", 80, "İçecekler", 300, "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop", ["Portakal"]),
];

const _urunListesi = [...temelUrunListesi, ...ekUrunListesi];

// Katalog artık tamamen yönetim paneli ve backend tarafından oluşturulur.
// Bilerek boş bırakılır; eski demo ürünler bağlantı gecikmesinde dahi görünmez.
export const urunler = [];

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
    aciklama: "Kodunla kayıt olan arkadaşının tamamlanan her alışverişinden %5 puan kazan.",
    buton: "Davet Kodumu Göster",
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
