import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { isletmeBilgisiniGetir } from "../lib/adminApi";

const IsletmeContext = createContext(null);

export function IsletmeSarici({ children }) {
  const { isletmeSlug } = useParams();
  const [durum, setDurum] = useState({ yukleniyor: true, isletme: null, hata: "" });
  useEffect(() => {
    let aktif = true;
    isletmeBilgisiniGetir(isletmeSlug)
      .then((isletme) => { if (aktif) setDurum({ yukleniyor: false, isletme, hata: "" }); })
      .catch((hata) => { if (aktif) setDurum({ yukleniyor: false, isletme: null, hata: hata.message }); });
    return () => { aktif = false; };
  }, [isletmeSlug]);
  const deger = useMemo(() => ({ isletme: durum.isletme, isletmeSlug: durum.isletme?.slug || isletmeSlug }), [durum.isletme, isletmeSlug]);
  if (durum.yukleniyor) return <main className="tenant-durum">İşletme yükleniyor…</main>;
  if (!durum.isletme) return <main className="tenant-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></main>;
  return <IsletmeContext.Provider value={deger}>{children}</IsletmeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIsletme() {
  const context = useContext(IsletmeContext);
  if (!context) throw new Error("useIsletme, IsletmeSarici içinde kullanılmalı");
  return context;
}
