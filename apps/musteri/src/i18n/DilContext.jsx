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
  const adayDiller = useMemo(() => {
    const etkinDiller = (Array.isArray(ayarlar.etkinDiller) ? ayarlar.etkinDiller : DESTEKLENEN_DILLER)
      .filter((etkinDil) => DESTEKLENEN_DILLER.includes(etkinDil));
    return etkinDiller.length ? etkinDiller : ["tr"];
  }, [ayarlar.etkinDiller]);
  const [hazirlik, setHazirlik] = useState({ yuklendi: false, en: false });
  const diller = useMemo(() => adayDiller.filter((adayDil) => adayDil === "tr" || (hazirlik.yuklendi && hazirlik[adayDil])), [adayDiller, hazirlik]);
  const varsayilanDil = diller.includes(ayarlar.varsayilanDil) ? ayarlar.varsayilanDil : "tr";
  const depoAnahtari = `bp_dil_${isletme.slug}`;
  const [dil, diliAyarla] = useState(() => {
    const kayitli = localStorage.getItem(depoAnahtari);
    return adayDiller.includes(kayitli) ? kayitli : (adayDiller.includes(ayarlar.varsayilanDil) ? ayarlar.varsayilanDil : "tr");
  });
  const etkinDil = hazirlik.yuklendi && diller.includes(dil) ? dil : "tr";
  const sozlukDepoAnahtari = `bp_i18n_${isletme.slug}_${etkinDil}`;
  const [dbSozluk, setDbSozluk] = useState(() => onbellektenOku(`bp_i18n_${isletme.slug}_tr`));

  const hazirligiYenile = useCallback(async () => {
    if (!adayDiller.includes("en")) {
      setHazirlik({ yuklendi: true, en: false });
      return;
    }
    try {
      const yanit = await istekAt("/api/i18n/hazirlik?dil=en");
      if (!yanit.ok) throw new Error("Language readiness could not be loaded.");
      const rapor = await yanit.json();
      setHazirlik({ yuklendi: true, en: rapor.hazir === true });
    } catch {
      setHazirlik({ yuklendi: true, en: false });
    }
  }, [adayDiller]);

  useEffect(() => {
    if (hazirlik.yuklendi && !diller.includes(dil)) diliAyarla(varsayilanDil);
  }, [dil, diller, hazirlik.yuklendi, varsayilanDil]);

  useEffect(() => {
    let aktif = true;
    hazirligiYenile().catch(() => { if (aktif) setHazirlik({ yuklendi: true, en: false }); });
    return () => { aktif = false; };
  }, [hazirligiYenile, isletme.slug]);

  useEffect(() => {
    document.documentElement.lang = etkinDil;
    localStorage.setItem(depoAnahtari, etkinDil);
  }, [depoAnahtari, etkinDil]);

  const sozluguYenile = useCallback(async () => {
    try {
      const yanit = await istekAt(`/api/i18n?dil=${encodeURIComponent(etkinDil)}`);
      if (!yanit.ok) throw new Error("Sözlük alınamadı.");
      const veri = await yanit.json();
      const sozluk = veri?.sozluk && typeof veri.sozluk === "object" ? veri.sozluk : {};
      setDbSozluk(sozluk);
      localStorage.setItem(`bp_i18n_${isletme.slug}_${etkinDil}`, JSON.stringify(sozluk));
    } catch {
      setDbSozluk(onbellektenOku(`bp_i18n_${isletme.slug}_${etkinDil}`));
    }
  }, [etkinDil, isletme.slug]);

  useEffect(() => {
    setDbSozluk(onbellektenOku(sozlukDepoAnahtari));
    sozluguYenile();
  }, [sozlukDepoAnahtari, sozluguYenile]);

  useEffect(() => {
    const guncellendi = ({ isletmeSlug } = {}) => {
      if (!isletmeSlug || isletmeSlug === isletme.slug) {
        sozluguYenile();
        hazirligiYenile();
      }
    };
    socket.on("i18n-guncellendi", guncellendi);
    socket.on("kategoriler-guncellendi", hazirligiYenile);
    socket.on("urunler-guncellendi", hazirligiYenile);
    socket.on("kampanyalar-guncellendi", hazirligiYenile);
    socket.on("duyurular-guncellendi", hazirligiYenile);
    return () => {
      socket.off("i18n-guncellendi", guncellendi);
      socket.off("kategoriler-guncellendi", hazirligiYenile);
      socket.off("urunler-guncellendi", hazirligiYenile);
      socket.off("kampanyalar-guncellendi", hazirligiYenile);
      socket.off("duyurular-guncellendi", hazirligiYenile);
    };
  }, [hazirligiYenile, isletme.slug, sozluguYenile]);

  const t = useCallback((anahtar, degerler) => {
    const sozluk = CEVIRILER[etkinDil] || CEVIRILER.tr;
    // English must never silently fall back to Turkish. An untranslated static
    // key stays visible as a key so it is immediately detectable in testing.
    const metin = dbSozluk[anahtar] ?? sozluk[anahtar] ?? (etkinDil === "tr" ? CEVIRILER.tr[anahtar] : undefined) ?? anahtar;
    return yerTutuculariDoldur(metin, degerler);
  }, [dbSozluk, etkinDil]);

  const tc = useCallback((anahtar, sayi, degerler = {}) => {
    const kural = new Intl.PluralRules(etkinDil).select(Number(sayi));
    return t(`${anahtar}_${kural}`, { ...degerler, count: sayi });
  }, [etkinDil, t]);

  const yerellestir = useCallback((deger, ceviriler, alan, dbAnahtari) => {
    if (dbAnahtari && dbSozluk[dbAnahtari]) return dbSozluk[dbAnahtari];
    const adaylar = alan ? ceviriler?.[alan] : ceviriler;
    if (typeof adaylar === "string") return adaylar;
    if (adaylar && typeof adaylar === "object") return adaylar[etkinDil] || (etkinDil === "tr" ? adaylar.tr : "") || (etkinDil === "tr" ? String(deger || "") : "");
    return etkinDil === "tr" ? String(deger || "") : "";
  }, [dbSozluk, etkinDil]);

  const tarihSaat = useCallback((deger, secenekler = {}) => new Intl.DateTimeFormat(etkinDil === "tr" ? "tr-TR" : "en-GB", secenekler).format(new Date(deger)), [etkinDil]);
  const sayi = useCallback((deger, secenekler = {}) => new Intl.NumberFormat(etkinDil === "tr" ? "tr-TR" : "en-GB", secenekler).format(Number(deger || 0)), [etkinDil]);
  const para = useCallback((deger) => new Intl.NumberFormat(etkinDil === "tr" ? "tr-TR" : "en-GB", { style: "currency", currency: "TRY" }).format(Number(deger || 0)), [etkinDil]);

  const deger = useMemo(() => ({ dil: etkinDil, diliAyarla, diller, t, tc, yerellestir, tarihSaat, sayi, para, dilHazirligi: hazirlik }), [diller, etkinDil, hazirlik, para, sayi, t, tarihSaat, tc, yerellestir]);
  return <DilContext.Provider value={deger}>{children}</DilContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDil() {
  const context = useContext(DilContext);
  if (!context) throw new Error("useDil, DilSaglayici içinde kullanılmalı");
  return context;
}
