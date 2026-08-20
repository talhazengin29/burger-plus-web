import { createContext, useContext, useLayoutEffect, useMemo } from "react";
import { useDil } from "../dil/DilContext";

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
  gorunum: "koyu",
  logoUrl: null,
  logoOlcegi: 100,
  logoKonumX: 0,
  logoKonumY: 0,
};

const DEGISKEN_ADI = (ad) => `--${ad.replace(/[A-Z]/g, (harf) => `-${harf.toLowerCase()}`)}`;

function googleFontParametresi(aile) {
  return String(aile || "").trim().replace(/\s+/g, "+");
}

function googleFontAgirliklari() {
  return "400;500;600;700;800";
}

export function TemaSaglayici({ tema, isletme, children }) {
  const { dil } = useDil();
  const aktifTema = tema || VARSAYILAN_TEMA;
  const logoUrl = aktifTema.logoUrl || isletme.logoUrl || null;
  const yerelMetinler = useMemo(() => dil === "en"
    ? { ...aktifTema.metinler, ...(aktifTema.ceviriler?.en?.metinler || {}) }
    : aktifTema.metinler, [aktifTema, dil]);

  useLayoutEffect(() => {
    const kok = document.documentElement;
    const gorunum = aktifTema.gorunum === "acik" ? "acik" : "koyu";
    kok.dataset.gorunum = gorunum;
    for (const [ad, deger] of Object.entries(aktifTema.renkler || {})) {
      if (gorunum === "acik" && ["bgPrimary", "bgCard"].includes(ad)) {
        kok.style.removeProperty(DEGISKEN_ADI(ad));
        continue;
      }
      kok.style.setProperty(DEGISKEN_ADI(ad), deger);
    }
    kok.style.setProperty("--font-baslik", `"${aktifTema.font.baslik}", sans-serif`);
    kok.style.setProperty("--font-govde", `"${aktifTema.font.govde}", sans-serif`);
    kok.style.setProperty("--logo-olcegi", String(Math.min(180, Math.max(60, Number(aktifTema.logoOlcegi) || 100)) / 100));
    kok.style.setProperty("--logo-konum-x", `${Math.min(80, Math.max(-80, Number(aktifTema.logoKonumX) || 0))}px`);
    kok.style.setProperty("--logo-konum-y", `${Math.min(30, Math.max(-30, Number(aktifTema.logoKonumY) || 0))}px`);
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
    const favicon = document.querySelector("link[rel~='icon']");
    const oncekiFavicon = favicon?.getAttribute("href") || "";
    if (favicon && logoUrl) favicon.setAttribute("href", logoUrl);
    return () => {
      if (favicon && oncekiFavicon) favicon.setAttribute("href", oncekiFavicon);
      kok.style.removeProperty("--logo-olcegi");
      kok.style.removeProperty("--logo-konum-x");
      kok.style.removeProperty("--logo-konum-y");
      delete kok.dataset.gorunum;
    };
  }, [aktifTema, isletme.ad, logoUrl]);

  const deger = useMemo(() => ({
    ...aktifTema,
    metinler: yerelMetinler,
    logoUrl,
    isletmeAdi: isletme.ad,
    isletmeSlug: isletme.slug,
  }), [aktifTema, isletme, logoUrl, yerelMetinler]);

  return <TemaContext.Provider value={deger}>{children}</TemaContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema() {
  const context = useContext(TemaContext);
  if (!context) throw new Error("useTema, TemaSaglayici içinde kullanılmalıdır.");
  return context;
}
