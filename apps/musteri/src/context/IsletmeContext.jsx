import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AppProvider } from "./AppContext";
import { isletmeBilgisiniGetir } from "../lib/authApi";
import { socketIsletmesiniAyarla } from "../lib/socket";

const IsletmeContext = createContext(null);

export function IsletmeSarici() {
  const { isletmeSlug } = useParams();
  const [durum, setDurum] = useState({ yukleniyor: true, isletme: null, hata: "" });

  useEffect(() => {
    let aktif = true;
    setDurum({ yukleniyor: true, isletme: null, hata: "" });
    isletmeBilgisiniGetir(isletmeSlug)
      .then((isletme) => {
        if (!aktif) return;
        socketIsletmesiniAyarla(isletme.slug);
        setDurum({ yukleniyor: false, isletme, hata: "" });
      })
      .catch((hata) => {
        if (aktif) setDurum({ yukleniyor: false, isletme: null, hata: hata.message || "İşletme bulunamadı." });
      });
    return () => { aktif = false; };
  }, [isletmeSlug]);

  const deger = useMemo(() => ({ isletme: durum.isletme, isletmeSlug: durum.isletme?.slug || isletmeSlug }), [durum.isletme, isletmeSlug]);

  if (durum.yukleniyor) return <div className="isletme-durum"><div className="isletme-spinner" /><p>İşletme yükleniyor…</p></div>;
  if (!durum.isletme) return <div className="isletme-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></div>;

  return (
    <IsletmeContext.Provider value={deger}>
      <AppProvider key={durum.isletme.slug}>
        <Outlet />
      </AppProvider>
    </IsletmeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIsletme() {
  const context = useContext(IsletmeContext);
  if (!context) throw new Error("useIsletme, IsletmeSarici içinde kullanılmalı");
  return context;
}
