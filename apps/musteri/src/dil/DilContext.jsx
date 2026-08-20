import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DESTEKLENEN_DILLER, SOZLUK } from "./sozluk";

const DilContext = createContext(null);
const DIL_ANAHTARI = "burger-plus-musteri-dil";

function anahtariOku(nesne, anahtar) {
  return anahtar.split(".").reduce((deger, parca) => deger?.[parca], nesne);
}

function degiskenleriYerlestir(metin, degiskenler) {
  return String(metin).replace(/{{\s*(\w+)\s*}}/g, (_, anahtar) => degiskenler[anahtar] ?? "");
}

export function DilSaglayici({ children }) {
  const [dil, setDil] = useState(() => {
    const kayitli = localStorage.getItem(DIL_ANAHTARI);
    if (DESTEKLENEN_DILLER.includes(kayitli)) return kayitli;
    const tarayici = navigator.language?.split("-")[0];
    return DESTEKLENEN_DILLER.includes(tarayici) ? tarayici : "tr";
  });

  useEffect(() => {
    localStorage.setItem(DIL_ANAHTARI, dil);
    document.documentElement.lang = dil;
  }, [dil]);

  const deger = useMemo(() => ({
    dil,
    dilDegistir: (yeniDil) => DESTEKLENEN_DILLER.includes(yeniDil) && setDil(yeniDil),
    t: (anahtar, degiskenler = {}) => degiskenleriYerlestir(anahtariOku(SOZLUK[dil], anahtar) ?? anahtariOku(SOZLUK.tr, anahtar) ?? anahtar, degiskenler),
    yerelMetin: (metin) => metin && typeof metin === "object" ? metin[dil] || metin.tr || metin.en || "" : metin,
    locale: dil === "en" ? "en-US" : "tr-TR",
  }), [dil]);

  return <DilContext.Provider value={deger}>{children}</DilContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDil() {
  const context = useContext(DilContext);
  if (!context) throw new Error("useDil, DilSaglayici içinde kullanılmalı");
  return context;
}
