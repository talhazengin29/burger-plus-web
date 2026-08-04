import { createContext, useContext, useLayoutEffect, useMemo } from "react";

const TemaContext = createContext(null);

const VARSAYILAN_TEMA = {
  renkler: {
    accent: "#FF6B00",
    accentGlow: "rgba(255,107,0,0.4)",
    bgPrimary: "#0D0D0D",
    bgCard: "rgba(255,255,255,0.06)",
  },
  font: { baslik: "Montserrat", govde: "Plus Jakarta Sans" },
  metinler: {
    slogan: "Lezzetli Yemek, Harika Deneyim!",
    sloganVurgu: "Harika Deneyim!",
    kampanyaBaslik: "Ye Kazan",
    damgaMetni: "{hedef} Burger Ye, 1 Burger HEDİYE!",
    damgaBirim: "Burger",
    sepetBos: "Sepetin şu an boş",
    urunBolumBaslik: "Popüler Ürünler",
    aramaPlaceholder: "Menüde ara...",
  },
  konsept: "burger",
  logoUrl: null,
};

const DEGISKEN_ADI = (ad) => `--${ad.replace(/[A-Z]/g, (harf) => `-${harf.toLowerCase()}`)}`;

function googleFontParametresi(aile) {
  return String(aile || "").trim().replace(/\s+/g, "+");
}

function googleFontAgirliklari() {
  return "400;500;600;700;800";
}

export function TemaSaglayici({ tema, isletme, children }) {
  const aktifTema = tema || VARSAYILAN_TEMA;

  useLayoutEffect(() => {
    const kok = document.documentElement;
    for (const [ad, deger] of Object.entries(aktifTema.renkler || {})) {
      kok.style.setProperty(DEGISKEN_ADI(ad), deger);
    }
    kok.style.setProperty("--font-baslik", `"${aktifTema.font.baslik}", sans-serif`);
    kok.style.setProperty("--font-govde", `"${aktifTema.font.govde}", sans-serif`);
    kok.dataset.konsept = aktifTema.konsept;

    const aileler = [...new Set([aktifTema.font.baslik, aktifTema.font.govde].filter(Boolean))];
    let fontLink = document.getElementById("konsept-font");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "konsept-font";
      fontLink.rel = "stylesheet";
      document.head.appendChild(fontLink);
    }
    fontLink.href = `https://fonts.googleapis.com/css2?${aileler.map((aile) => `family=${googleFontParametresi(aile)}:wght@${googleFontAgirliklari()}`).join("&")}&display=swap`;
    document.title = isletme.ad;
  }, [aktifTema, isletme.ad]);

  const deger = useMemo(() => ({
    ...aktifTema,
    logoUrl: aktifTema.logoUrl || isletme.logoUrl || null,
    isletmeAdi: isletme.ad,
    isletmeSlug: isletme.slug,
  }), [aktifTema, isletme]);

  return <TemaContext.Provider value={deger}>{children}</TemaContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema() {
  const context = useContext(TemaContext);
  if (!context) throw new Error("useTema, TemaSaglayici içinde kullanılmalıdır.");
  return context;
}
