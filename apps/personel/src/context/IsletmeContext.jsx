import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { isletmeBilgisiniGetir } from "../lib/adminApi";
import { socket } from "../lib/socket";

const IsletmeContext = createContext(null);

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
    const renkler = durum.isletme?.tema?.renkler;
    if (!renkler) return;
    const kok = document.documentElement;
    kok.style.setProperty("--primary", renkler.accent);
    kok.style.setProperty("--primary-hafif", `color-mix(in srgb, ${renkler.accent} 20%, transparent)`);
    kok.style.setProperty("--accent", renkler.accent);
    kok.style.setProperty("--accent-glow", renkler.accentGlow);
  }, [durum.isletme?.tema]);

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
  if (durum.yukleniyor) return <main className="tenant-durum">İşletme yükleniyor…</main>;
  if (!durum.isletme) return <main className="tenant-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></main>;
  return <IsletmeContext.Provider key={durum.isletme.slug} value={deger}>{children}</IsletmeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIsletme() {
  const context = useContext(IsletmeContext);
  if (!context) throw new Error("useIsletme, IsletmeSarici içinde kullanılmalı");
  return context;
}
