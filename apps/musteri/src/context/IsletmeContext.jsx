import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AppProvider } from "./AppContext";
import { isletmeBilgisiniGetir } from "../lib/authApi";
import { socket, socketIsletmesiniAyarla } from "../lib/socket";
import { TemaSaglayici } from "./TemaContext";
import varsayilanLogo from "../assets/logo-full-transparent.png";

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

  useEffect(() => {
    const temaGuncellendi = ({ isletme, tema } = {}) => {
      if (isletme?.slug !== isletmeSlug || !tema) return;
      setDurum({ yukleniyor: false, isletme: { ...isletme, tema }, hata: "" });
    };
    socket.on("tema-guncellendi", temaGuncellendi);
    return () => socket.off("tema-guncellendi", temaGuncellendi);
  }, [isletmeSlug]);

  const deger = useMemo(() => ({
    isletme: durum.isletme,
    isletmeSlug: durum.isletme?.slug || isletmeSlug,
    tema: durum.isletme?.tema || null,
  }), [durum.isletme, isletmeSlug]);

  if (durum.yukleniyor) return <div className="isletme-durum"><img className="isletme-splash-logo" src={varsayilanLogo} alt="" /><div className="isletme-spinner" /><p>İşletme yükleniyor…</p></div>;
  if (!durum.isletme) return <div className="isletme-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></div>;

  return (
    <IsletmeContext.Provider value={deger}>
      <TemaSaglayici tema={durum.isletme.tema} isletme={durum.isletme}>
        <AppProvider key={durum.isletme.slug}>
          <Outlet />
        </AppProvider>
      </TemaSaglayici>
    </IsletmeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useIsletme() {
  const context = useContext(IsletmeContext);
  if (!context) throw new Error("useIsletme, IsletmeSarici içinde kullanılmalı");
  return context;
}
