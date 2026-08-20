import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { isletmeBilgisiniGetir } from "../lib/adminApi";
import { socket } from "../lib/socket";

const IsletmeContext = createContext(null);
const TEMA_DEGISKENLERI = [
  "--primary", "--primary-hafif", "--accent", "--accent-glow",
  "--font-baslik", "--font-govde", "--logo-olcegi",
];
const PERSONEL_ZEMIN_DEGISKENLERI = ["--bg", "--panel", "--panel-2", "--panel-3", "--border", "--metin", "--metin-soluk"];

export function IsletmeSarici({ children }) {
  const { isletmeSlug } = useParams();
  const [durum, setDurum] = useState({ yukleniyor: true, isletme: null, hata: "" });
  useEffect(() => {
    let aktif = true;
    setDurum({ yukleniyor: true, isletme: null, hata: "" });
    isletmeBilgisiniGetir(isletmeSlug)
      .then((isletme) => { if (aktif) setDurum({ yukleniyor: false, isletme, hata: "" }); })
      .catch((hata) => { if (aktif) setDurum({ yukleniyor: false, isletme: null, hata: hata.message }); });
    return () => { aktif = false; };
  }, [isletmeSlug]);

  useEffect(() => {
    const temaGuncellendi = ({ isletme, tema } = {}) => {
      if (isletme?.slug !== isletmeSlug || !tema) return;
      setDurum({ yukleniyor: false, isletme: { ...isletme, tema }, hata: "" });
    };
    socket.on("tema-guncellendi", temaGuncellendi);
    return () => socket.off("tema-guncellendi", temaGuncellendi);
  }, [isletmeSlug]);

  useLayoutEffect(() => {
    const kok = document.documentElement;
    const isletme = durum.isletme;
    const renkler = isletme?.tema?.renkler;
    // Personel arayüzünün açık/koyu zemini işletme temasından bağımsızdır.
    // Önceki sürümlerden veya canlı tema güncellemesinden kalan inline
    // değişkenler CSS'teki [data-tema] değerlerini ezmesin.
    PERSONEL_ZEMIN_DEGISKENLERI.forEach((ad) => kok.style.removeProperty(ad));
    if (!isletme || !renkler) return undefined;

    const accent = renkler.accent || "#8B5CF6";
    const font = isletme.tema?.font || {};
    const degiskenler = {
      "--primary": accent,
      "--primary-hafif": `color-mix(in srgb, ${accent} 20%, transparent)`,
      "--accent": accent,
      "--accent-glow": renkler.accentGlow || `color-mix(in srgb, ${accent} 40%, transparent)`,
      "--logo-olcegi": String(Math.min(180, Math.max(60, Number(isletme.tema?.logoOlcegi) || 100)) / 100),
      "--font-baslik": `"${font.baslik || "Montserrat"}", sans-serif`,
      "--font-govde": `"${font.govde || "Plus Jakarta Sans"}", sans-serif`,
    };
    Object.entries(degiskenler).forEach(([ad, deger]) => kok.style.setProperty(ad, deger));
    kok.dataset.konsept = isletme.tema?.konsept || "isletme";
    document.title = `${isletme.ad} · Yönetim`;

    return () => {
      TEMA_DEGISKENLERI.forEach((ad) => kok.style.removeProperty(ad));
      delete kok.dataset.konsept;
    };
  }, [durum.isletme]);

  const isletmeyiGuncelle = useCallback((isletme, tema) => {
    setDurum((onceki) => ({
      yukleniyor: false,
      hata: "",
      isletme: { ...(onceki.isletme || {}), ...(isletme || {}), tema: tema || isletme?.tema || onceki.isletme?.tema },
    }));
  }, []);
  const deger = useMemo(() => ({
    isletme: durum.isletme,
    isletmeSlug: durum.isletme?.slug || isletmeSlug,
    tema: durum.isletme?.tema || null,
    isletmeyiGuncelle,
  }), [durum.isletme, isletmeSlug, isletmeyiGuncelle]);
  if (durum.yukleniyor || (durum.isletme && durum.isletme.slug !== isletmeSlug)) return <main className="tenant-durum">İşletme yükleniyor…</main>;
  if (!durum.isletme) return <main className="tenant-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></main>;
  return <IsletmeContext.Provider key={durum.isletme.slug} value={deger}>{children}</IsletmeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIsletme() {
  const context = useContext(IsletmeContext);
  if (!context) throw new Error("useIsletme, IsletmeSarici içinde kullanılmalı");
  return context;
}
