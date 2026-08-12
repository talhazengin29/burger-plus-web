import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AppProvider } from "./AppContext";
import { TemaSaglayici } from "./TemaContext";
import { PerdeSaglayici } from "../hooks/usePerde";
import { isletmeBilgisiniGetir } from "../lib/authApi";
import { socket, socketIsletmesiniAyarla } from "../lib/socket";
import BurgerPlusLogosu from "../components/BurgerPlusLogosu";

const IsletmeContext = createContext(null);
const ONIZLEME_ANAHTARI = "burger-plus-isletme-onizleme";

function onizlemeAnahtari(slug) {
  return `${ONIZLEME_ANAHTARI}:${String(slug || "").toLowerCase()}`;
}

function isletmeOnizlemesiniOku(slug) {
  try {
    const kayit = JSON.parse(localStorage.getItem(onizlemeAnahtari(slug)) || "null");
    return String(kayit?.slug || "").toLowerCase() === String(slug || "").toLowerCase() ? kayit : null;
  } catch {
    return null;
  }
}

function isletmeOnizlemesiniKaydet(isletme) {
  try {
    const onizleme = {
      slug: isletme.slug,
      ad: isletme.ad,
      logoUrl: isletme.tema?.logoUrl || isletme.logoUrl || null,
      accent: isletme.tema?.renkler?.accent || null,
      logoOlcegi: isletme.tema?.logoOlcegi || 100,
      gorunum: isletme.tema?.gorunum === "acik" ? "acik" : "koyu",
    };
    localStorage.setItem(onizlemeAnahtari(isletme.slug), JSON.stringify(onizleme));
    return onizleme;
  } catch {
    return null;
  }
}

function slugBasligi(slug) {
  return String(slug || "İşletme")
    .split("-")
    .filter(Boolean)
    .map((parca) => parca.charAt(0).toUpperCase() + parca.slice(1))
    .join(" ");
}

function IsletmeYukleniyor({ slug, onizleme }) {
  const [logoHatasi, setLogoHatasi] = useState(false);
  const burgerPlusMu = slug === "burger-plus";
  const logoUrl = onizleme?.logoUrl || "";
  const isletmeAdi = onizleme?.ad || slugBasligi(slug);
  const stil = {
    "--isletme-yukleme-accent": onizleme?.accent || (burgerPlusMu ? "#FF6B00" : "#8B5CF6"),
    "--logo-olcegi": String(Math.min(180, Math.max(60, Number(onizleme?.logoOlcegi) || 100)) / 100),
  };
  const gorunum = onizleme?.gorunum === "acik" ? "acik" : "koyu";

  useEffect(() => setLogoHatasi(false), [logoUrl]);

  return (
    <div className="isletme-durum" data-gorunum={gorunum} style={stil}>
      {logoUrl && !logoHatasi
        ? <img className="isletme-splash-logo isletme-splash-logo--yuklu" src={logoUrl} alt={isletmeAdi} onError={() => setLogoHatasi(true)} />
        : burgerPlusMu
          ? <BurgerPlusLogosu className="isletme-splash-logo" alt={isletmeAdi} />
          : <strong className="isletme-splash-ad">{isletmeAdi}</strong>}
      <div className="isletme-spinner" />
      <p>İşletme yükleniyor…</p>
    </div>
  );
}

export function IsletmeSarici() {
  const { isletmeSlug } = useParams();
  const [durum, setDurum] = useState(() => ({
    yukleniyor: true,
    isletme: null,
    hata: "",
    onizleme: isletmeOnizlemesiniOku(isletmeSlug),
  }));

  useEffect(() => {
    let aktif = true;
    setDurum({ yukleniyor: true, isletme: null, hata: "", onizleme: isletmeOnizlemesiniOku(isletmeSlug) });
    isletmeBilgisiniGetir(isletmeSlug)
      .then((isletme) => {
        if (!aktif) return;
        socketIsletmesiniAyarla(isletme.slug);
        setDurum({ yukleniyor: false, isletme, hata: "", onizleme: isletmeOnizlemesiniKaydet(isletme) });
      })
      .catch((hata) => {
        if (aktif) setDurum((onceki) => ({ ...onceki, yukleniyor: false, isletme: null, hata: hata.message || "İşletme bulunamadı." }));
      });
    return () => { aktif = false; };
  }, [isletmeSlug]);

  useEffect(() => {
    const temaGuncellendi = ({ isletme, tema } = {}) => {
      if (isletme?.slug !== isletmeSlug || !tema) return;
      const guncelIsletme = { ...isletme, tema };
      setDurum({ yukleniyor: false, isletme: guncelIsletme, hata: "", onizleme: isletmeOnizlemesiniKaydet(guncelIsletme) });
    };
    socket.on("tema-guncellendi", temaGuncellendi);
    return () => socket.off("tema-guncellendi", temaGuncellendi);
  }, [isletmeSlug]);

  const deger = useMemo(() => ({
    isletme: durum.isletme,
    isletmeSlug: durum.isletme?.slug || isletmeSlug,
    tema: durum.isletme?.tema || null,
  }), [durum.isletme, isletmeSlug]);

  if (durum.yukleniyor || (durum.isletme && durum.isletme.slug !== isletmeSlug)) return <IsletmeYukleniyor slug={isletmeSlug} onizleme={durum.onizleme} />;
  if (!durum.isletme) return <div className="isletme-durum"><h1>İşletme bulunamadı</h1><p>{durum.hata}</p></div>;

  return (
    <IsletmeContext.Provider value={deger}>
      <TemaSaglayici tema={durum.isletme.tema} isletme={durum.isletme}>
        <PerdeSaglayici>
          <AppProvider key={durum.isletme.slug}>
            <Outlet />
          </AppProvider>
        </PerdeSaglayici>
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
