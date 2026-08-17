import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useIsletme } from "../context/IsletmeContext";
import { CEVIRILER, DESTEKLENEN_DILLER } from "./ceviriler";
import { istekAt } from "../lib/authApi";
import { socket } from "../lib/socket";

const DilContext = createContext(null);

const yerTutuculariDoldur = (metin, degerler = {}) => String(metin).replace(/\{(\w+)\}/g, (_, alan) => degerler[alan] ?? `{${alan}}`);

function onbellektenOku(anahtar) {
  try {
    const veri = JSON.parse(localStorage.getItem(anahtar) || "null");
    return veri && typeof veri === "object" && !Array.isArray(veri) ? veri : {};
  } catch {
    return {};
  }
}

export function DilSaglayici({ children }) {
  const { isletme, tema } = useIsletme();
  const ayarlar = tema?.dilAyarlari || {};
  const diller = useMemo(() => {
    const etkinDiller = (Array.isArray(ayarlar.etkinDiller) ? ayarlar.etkinDiller : DESTEKLENEN_DILLER)
      .filter((etkinDil) => DESTEKLENEN_DILLER.includes(etkinDil));
    return etkinDiller.length ? etkinDiller : ["tr"];
  }, [ayarlar.etkinDiller]);
  const varsayilanDil = diller.includes(ayarlar.varsayilanDil) ? ayarlar.varsayilanDil : "tr";
  const depoAnahtari = `bp_dil_${isletme.slug}`;
  const [dil, diliAyarla] = useState(() => {
    const kayitli = localStorage.getItem(depoAnahtari);
    return diller.includes(kayitli) ? kayitli : varsayilanDil;
  });
  const sozlukDepoAnahtari = `bp_i18n_${isletme.slug}_${dil}`;
  const [dbSozluk, setDbSozluk] = useState(() => onbellektenOku(`bp_i18n_${isletme.slug}_${dil}`));

  useEffect(() => {
    if (!diller.includes(dil)) diliAyarla(varsayilanDil);
  }, [dil, diller, varsayilanDil]);

  useEffect(() => {
    document.documentElement.lang = dil;
    localStorage.setItem(depoAnahtari, dil);
  }, [depoAnahtari, dil]);

  const sozluguYenile = useCallback(async () => {
    try {
      const yanit = await istekAt(`/api/i18n?dil=${encodeURIComponent(dil)}`);
      if (!yanit.ok) throw new Error("Sözlük alınamadı.");
      const veri = await yanit.json();
      const sozluk = veri?.sozluk && typeof veri.sozluk === "object" ? veri.sozluk : {};
      setDbSozluk(sozluk);
      localStorage.setItem(`bp_i18n_${isletme.slug}_${dil}`, JSON.stringify(sozluk));
    } catch {
      setDbSozluk(onbellektenOku(`bp_i18n_${isletme.slug}_${dil}`));
    }
  }, [dil, isletme.slug]);

  useEffect(() => {
    setDbSozluk(onbellektenOku(sozlukDepoAnahtari));
    sozluguYenile();
  }, [sozlukDepoAnahtari, sozluguYenile]);

  useEffect(() => {
    const guncellendi = ({ isletmeSlug } = {}) => {
      if (!isletmeSlug || isletmeSlug === isletme.slug) sozluguYenile();
    };
    socket.on("i18n-guncellendi", guncellendi);
    return () => socket.off("i18n-guncellendi", guncellendi);
  }, [isletme.slug, sozluguYenile]);

  const t = useCallback((anahtar, degerler) => {
    const sozluk = CEVIRILER[dil] || CEVIRILER.tr;
    const metin = dbSozluk[anahtar] ?? sozluk[anahtar] ?? CEVIRILER.tr[anahtar] ?? anahtar;
    return yerTutuculariDoldur(metin, degerler);
  }, [dbSozluk, dil]);

  const tc = useCallback((anahtar, sayi, degerler = {}) => {
    const kural = new Intl.PluralRules(dil).select(Number(sayi));
    return t(`${anahtar}_${kural}`, { ...degerler, count: sayi });
  }, [dil, t]);

  const yerellestir = useCallback((deger, ceviriler, alan) => {
    const adaylar = alan ? ceviriler?.[alan] : ceviriler;
    if (typeof adaylar === "string") return adaylar;
    if (adaylar && typeof adaylar === "object") return adaylar[dil] || adaylar.tr || Object.values(adaylar).find(Boolean) || String(deger || "");
    return String(deger || "");
  }, [dil]);

  const tarihSaat = useCallback((deger, secenekler = {}) => new Intl.DateTimeFormat(dil === "tr" ? "tr-TR" : "en-GB", secenekler).format(new Date(deger)), [dil]);
  const sayi = useCallback((deger, secenekler = {}) => new Intl.NumberFormat(dil === "tr" ? "tr-TR" : "en-GB", secenekler).format(Number(deger || 0)), [dil]);
  const para = useCallback((deger) => new Intl.NumberFormat(dil === "tr" ? "tr-TR" : "en-GB", { style: "currency", currency: "TRY" }).format(Number(deger || 0)), [dil]);

  const deger = useMemo(() => ({ dil, diliAyarla, diller, t, tc, yerellestir, tarihSaat, sayi, para }), [dil, diller, para, sayi, t, tarihSaat, tc, yerellestir]);
  return <DilContext.Provider value={deger}>{children}</DilContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDil() {
  const context = useContext(DilContext);
  if (!context) throw new Error("useDil, DilSaglayici içinde kullanılmalı");
  return context;
}
