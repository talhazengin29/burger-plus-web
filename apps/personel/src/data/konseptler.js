export const KONSEPTLER = {
  burger: {
    ad: "Burger",
    renkler: { accent: "#FF6B00", accentGlow: "rgba(255,107,0,0.4)", bgPrimary: "#0D0D0D", bgCard: "rgba(255,255,255,0.06)" },
    font: { baslik: "Montserrat", govde: "Plus Jakarta Sans" },
    metinler: {
      slogan: "Lezzetli Yemek, Harika Deneyim!", sloganVurgu: "Harika Deneyim!", kampanyaBaslik: "Ye Kazan",
      damgaMetni: "{hedef} Burger Ye, 1 Burger HEDİYE!", damgaBirim: "Burger", sepetBos: "Sepetin şu an boş",
      urunBolumBaslik: "Popüler Ürünler", aramaPlaceholder: "Menüde ara...",
    },
  },
  cafe: {
    ad: "Cafe",
    renkler: { accent: "#C8873E", accentGlow: "rgba(200,135,62,0.4)", bgPrimary: "#0F0D0B", bgCard: "rgba(255,248,240,0.05)" },
    font: { baslik: "Playfair Display", govde: "Plus Jakarta Sans" },
    metinler: {
      slogan: "Günün Her Anına Eşlik Eden Lezzet", sloganVurgu: "Eşlik Eden Lezzet", kampanyaBaslik: "İç Kazan",
      damgaMetni: "{hedef} Kahve İç, 1 Kahve HEDİYE!", damgaBirim: "Kahve", sepetBos: "Sepetin şu an boş",
      urunBolumBaslik: "Öne Çıkanlar", aramaPlaceholder: "Kahve, tatlı ara...",
    },
  },
  pizza: {
    ad: "Pizza",
    renkler: { accent: "#E63946", accentGlow: "rgba(230,57,70,0.4)", bgPrimary: "#0D0A0A", bgCard: "rgba(255,255,255,0.06)" },
    font: { baslik: "Baloo 2", govde: "Plus Jakarta Sans" },
    metinler: {
      slogan: "Taş Fırından Sofrana", sloganVurgu: "Sofrana", kampanyaBaslik: "Ye Kazan",
      damgaMetni: "{hedef} Pizza Ye, 1 Pizza HEDİYE!", damgaBirim: "Pizza", sepetBos: "Sepetin şu an boş",
      urunBolumBaslik: "Fırından Yeni Çıkanlar", aramaPlaceholder: "Pizza, makarna ara...",
    },
  },
};

export const METIN_ALANLARI = [
  ["slogan", "Slogan"],
  ["sloganVurgu", "Vurgu kelimesi / bölümü"],
  ["kampanyaBaslik", "Kampanya başlığı"],
  ["damgaBirim", "Damga birimi"],
];

export function hexRgba(hex, alfa = 0.4) {
  const temiz = String(hex || "").replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(temiz)) return "rgba(255,107,0,0.4)";
  const [r, g, b] = [0, 2, 4].map((baslangic) => Number.parseInt(temiz.slice(baslangic, baslangic + 2), 16));
  return `rgba(${r},${g},${b},${alfa})`;
}
