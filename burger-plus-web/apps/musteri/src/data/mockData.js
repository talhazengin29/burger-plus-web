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

export const urunler = [
  {
    id: 1,
    ad: "Classic Burger",
    fiyat: 180,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    ad: "BBQ Smoke Burger",
    fiyat: 220,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    ad: "Vegan Burger",
    fiyat: 195,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    ad: "Double Cheese",
    fiyat: 250,
    kategori: "Burgerler",
    gorsel: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    ad: "Çıtır Patates",
    fiyat: 75,
    kategori: "Yan Lezzetler",
    gorsel: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    ad: "Soğan Halkası",
    fiyat: 85,
    kategori: "Yan Lezzetler",
    gorsel: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    ad: "Kola",
    fiyat: 40,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    ad: "Limonata",
    fiyat: 55,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop",
  },
  {
    id: 9,
    ad: "Ayran",
    fiyat: 35,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1626196340104-2d6a05b6b0f0?w=400&h=400&fit=crop",
  },
  {
    id: 10,
    ad: "Su",
    fiyat: 15,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1616118132534-381148898bb4?w=400&h=400&fit=crop",
  },
  {
    id: 11,
    ad: "Soda",
    fiyat: 30,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400&h=400&fit=crop",
  },
  {
    id: 12,
    ad: "Çay",
    fiyat: 20,
    kategori: "İçecekler",
    gorsel: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=400&h=400&fit=crop",
  },
];

export const kampanyalar = [
  {
    id: 1,
    etiket: "Öğrenciye Özel",
    baslik: "Öğrenci Menüsü",
    fiyat: 150,
    aciklama: "Seçili burger, çıtır patates ve soğuk içecek ile doyurucu bir öğün. Öğrenci kimliğini göstermeyi unutma!",
    buton: "Hemen Al",
    butonTipi: "primary",
    gorsel: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    etiket: "14:00 - 17:00",
    baslik: "%20 İndirim Fırsatı",
    aciklama: "Hafta içi saat 14:00 ile 17:00 arasında vereceğin tüm siparişlerde anında %20 indirim kazan. Ara öğünleri şölene çevir!",
    buton: "Kampanyaya Katıl",
    butonTipi: "charcoal",
    gorsel: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    etiket: "Davet Et",
    baslik: "Arkadaşını Getir",
    aciklama: "Davet kodunla arkadaşını Burger Plus'a getir, o ilk siparişini versin, ikinize de bedava dondurma hediye edelim!",
    buton: "Davet Kodu Oluştur",
    butonTipi: "charcoal",
    gorsel: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=600&h=400&fit=crop",
  },
];

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
