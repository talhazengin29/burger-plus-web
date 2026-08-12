import { useEffect, useMemo, useRef, useState } from "react";
import { useIsletme } from "../../context/IsletmeContext";
import { logoYukle, temaKaydet } from "../../lib/adminApi";
import { hexRgba, KONSEPTLER, METIN_ALANLARI } from "../../data/konseptler";
import "./TemaYonetimi.css";

const HEX = /^#[0-9a-f]{6}$/i;
const RENK_ALANLARI = [
  ["accent", "Vurgu rengi", "Butonlar ve öne çıkan detaylar"],
  ["bgPrimary", "Ana arka plan", "Uygulamanın genel zemin rengi"],
  ["bgCard", "Kart ve yüzey", "Kartlar ve içerik panelleri"],
];

function renkHexineCevir(renk, arkaPlan = "#000000") {
  const deger = String(renk || "").trim();
  if (HEX.test(deger)) return deger.toUpperCase();
  const rgba = deger.match(/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|1|0?\.\d+)\s*\)$/i);
  if (!rgba) return arkaPlan.toUpperCase();
  const taban = HEX.test(arkaPlan) ? arkaPlan.slice(1).match(/.{2}/g).map((kanal) => Number.parseInt(kanal, 16)) : [0, 0, 0];
  const alfa = Number(rgba[4]);
  return `#${rgba.slice(1, 4).map((kanal, indeks) => Math.round(Number(kanal) * alfa + taban[indeks] * (1 - alfa)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function varsayilanRenkleriGetir(konsept) {
  const renkler = KONSEPTLER[konsept].renkler;
  const bgPrimary = renkHexineCevir(renkler.bgPrimary);
  return { accent: renkHexineCevir(renkler.accent), bgPrimary, bgCard: renkHexineCevir(renkler.bgCard, bgPrimary) };
}

function baslangicFormu(isletme, tema) {
  const konsept = KONSEPTLER[isletme?.konsept] ? isletme.konsept : "burger";
  const varsayilan = KONSEPTLER[konsept];
  const varsayilanRenkler = varsayilanRenkleriGetir(konsept);
  return {
    konsept,
    ozelPalet: tema?.ozelPalet === true,
    accent: renkHexineCevir(tema?.renkler?.accent || varsayilanRenkler.accent),
    bgPrimary: renkHexineCevir(tema?.renkler?.bgPrimary || varsayilanRenkler.bgPrimary),
    bgCard: renkHexineCevir(tema?.renkler?.bgCard || varsayilanRenkler.bgCard, tema?.renkler?.bgPrimary || varsayilanRenkler.bgPrimary),
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [
      alan,
      tema?.metinler?.[alan] && tema.metinler[alan] !== varsayilan.metinler[alan] ? tema.metinler[alan] : "",
    ])),
  };
}

export default function TemaYonetimi() {
  const { isletme, tema, isletmeyiGuncelle } = useIsletme();
  const [form, setForm] = useState(() => baslangicFormu(isletme, tema));
  const [logoOnizleme, setLogoOnizleme] = useState(isletme.logoUrl || tema?.logoUrl || "");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [logoYukleniyor, setLogoYukleniyor] = useState(false);
  const [bildirim, setBildirim] = useState("");
  const [hata, setHata] = useState("");
  const dosyaRef = useRef(null);
  const nesneUrlRef = useRef("");

  useEffect(() => {
    setForm(baslangicFormu(isletme, tema));
    setLogoOnizleme(isletme.logoUrl || tema?.logoUrl || "");
  }, [isletme, tema]);

  useEffect(() => () => {
    if (nesneUrlRef.current) URL.revokeObjectURL(nesneUrlRef.current);
  }, []);

  const varsayilan = KONSEPTLER[form.konsept];
  const onizleme = useMemo(() => ({
    renkler: form.ozelPalet ? { ...varsayilan.renkler, accent: form.accent, accentGlow: hexRgba(form.accent), bgPrimary: form.bgPrimary, bgCard: form.bgCard } : varsayilan.renkler,
    metinler: {
      ...varsayilan.metinler,
      ...Object.fromEntries(Object.entries(form.metinler).filter(([, deger]) => deger.trim())),
    },
  }), [form, varsayilan]);

  const konseptSec = (konsept) => setForm({
    konsept,
    ozelPalet: false,
    ...varsayilanRenkleriGetir(konsept),
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [alan, ""])),
  });

  const kaydet = async (e) => {
    e.preventDefault();
    const gecersizRenk = RENK_ALANLARI.find(([alan]) => !HEX.test(form[alan]));
    if (form.ozelPalet && gecersizRenk) {
      setHata(`${gecersizRenk[1]} #RRGGBB biçiminde geçerli bir HEX değeri olmalı.`);
      return;
    }
    setKaydediliyor(true);
    setHata("");
    setBildirim("");
    try {
      const yanit = await temaKaydet({
        konsept: form.konsept,
        ozelPalet: form.ozelPalet,
        renkler: form.ozelPalet ? { accent: form.accent, accentGlow: hexRgba(form.accent), bgPrimary: form.bgPrimary, bgCard: form.bgCard } : {},
        metinler: form.metinler,
      });
      isletmeyiGuncelle(yanit.isletme, yanit.tema);
      setBildirim("Tema kaydedildi ve müşteri uygulamasına yansıtıldı.");
    } catch (istekHatasi) {
      setHata(istekHatasi.message);
    } finally {
      setKaydediliyor(false);
    }
  };

  const logoSecildi = async (e) => {
    const dosya = e.target.files?.[0];
    e.target.value = "";
    if (!dosya) return;
    if (nesneUrlRef.current) URL.revokeObjectURL(nesneUrlRef.current);
    nesneUrlRef.current = URL.createObjectURL(dosya);
    setLogoOnizleme(nesneUrlRef.current);
    setLogoYukleniyor(true);
    setHata("");
    setBildirim("");
    try {
      const yanit = await logoYukle(dosya);
      isletmeyiGuncelle(yanit.isletme, yanit.tema);
      setLogoOnizleme(yanit.isletme.logoUrl);
      setBildirim("Logo yüklendi ve tüm ekranlarda güncellendi.");
    } catch (istekHatasi) {
      setLogoOnizleme(isletme.logoUrl || tema?.logoUrl || "");
      setHata(istekHatasi.message);
    } finally {
      setLogoYukleniyor(false);
      if (nesneUrlRef.current) URL.revokeObjectURL(nesneUrlRef.current);
      nesneUrlRef.current = "";
    }
  };

  return (
    <form className="tema-yonetimi" onSubmit={kaydet}>
      <section className="tema-editor">
        <header className="tema-baslik">
          <div><span>MARKA GÖRÜNÜMÜ</span><h2>Tema ve konsept</h2><p>Renkleri, logoyu ve müşteri uygulamasındaki temel metinleri işletmene göre düzenle.</p></div>
          <button type="submit" disabled={kaydediliyor}>{kaydediliyor ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}</button>
        </header>

        {bildirim && <div className="tema-bildirim basarili">✓ {bildirim}</div>}
        {hata && <div className="tema-bildirim hatali">{hata}</div>}

        <fieldset className="tema-kutu">
          <legend>Konsept seçimi</legend>
          <p>Konsept; varsayılan renkleri, yazı tiplerini ve metinleri belirler.</p>
          <div className="konsept-kartlari">
            {Object.entries(KONSEPTLER).map(([kod, bilgi]) => (
              <button type="button" key={kod} className={form.konsept === kod ? "secili" : ""} onClick={() => konseptSec(kod)}>
                <span className="konsept-renkleri"><i style={{ background: bilgi.renkler.accent }} /><i style={{ background: bilgi.renkler.bgPrimary }} /><i style={{ background: bilgi.renkler.bgCard }} /></span>
                <strong>{bilgi.ad}</strong><small>{bilgi.font.baslik}</small>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="tema-kutu logo-kutusu">
          <legend>Logo</legend>
          <div className="logo-satiri">
            <span className="logo-onizleme">{logoOnizleme ? <img src={logoOnizleme} alt={`${isletme.ad} logosu`} /> : <b>{isletme.ad}</b>}</span>
            <div><p>PNG, JPG, WebP veya SVG · en fazla 2 MB<br />Boş kenarlar otomatik kırpılır ve tüm ekranlar için standartlaştırılır.</p><button type="button" disabled={logoYukleniyor} onClick={() => dosyaRef.current?.click()}>{logoYukleniyor ? "Yükleniyor…" : "Logo Yükle"}</button></div>
            <input ref={dosyaRef} type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={logoSecildi} />
          </div>
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Renk özelleştirme</legend>
          <label className="tema-toggle"><input type="checkbox" checked={form.ozelPalet} onChange={(e) => setForm({ ...form, ozelPalet: e.target.checked, ...(!e.target.checked ? varsayilanRenkleriGetir(form.konsept) : {}) })} /><span /><b>{form.ozelPalet ? "Kendi renklerimi seç" : "Konsept renklerini kullan"}</b></label>
          {form.ozelPalet && <div className="renk-secimleri">{RENK_ALANLARI.map(([alan, etiket, aciklama]) => <div className="renk-secimi" key={alan}><input type="color" value={HEX.test(form[alan]) ? form[alan] : varsayilanRenkleriGetir(form.konsept)[alan]} onChange={(e) => setForm({ ...form, [alan]: e.target.value.toUpperCase() })} aria-label={etiket} /><label><span>{etiket}</span><input maxLength="7" value={form[alan]} onChange={(e) => setForm({ ...form, [alan]: e.target.value.slice(0, 7).toUpperCase() })} placeholder={varsayilanRenkleriGetir(form.konsept)[alan]} /><small>{aciklama}</small></label></div>)}</div>}
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Metin özelleştirme</legend>
          <p>Boş bıraktığın alanlarda seçilen konseptin varsayılan metni kullanılır.</p>
          <div className="tema-metinleri">
            {METIN_ALANLARI.map(([alan, etiket]) => <label key={alan}><span>{etiket}</span><input maxLength="120" value={form.metinler[alan]} placeholder={varsayilan.metinler[alan]} onChange={(e) => setForm({ ...form, metinler: { ...form.metinler, [alan]: e.target.value } })} /><small>{form.metinler[alan].length}/120</small></label>)}
          </div>
        </fieldset>
      </section>

      <aside className="tema-canli" style={{ "--onizleme-accent": onizleme.renkler.accent, "--onizleme-bg": onizleme.renkler.bgPrimary, "--onizleme-card": onizleme.renkler.bgCard }}>
        <div className="tema-telefon">
          <header>{logoOnizleme ? <img src={logoOnizleme} alt="" /> : <b>{isletme.ad}</b>}<i /></header>
          <main><small>Merhaba 👋</small><h2>{onizleme.metinler.slogan}</h2><span>{onizleme.metinler.kampanyaBaslik}</span><article><b>{onizleme.metinler.damgaMetni.replace("{hedef}", "5")}</b><div><i /><i /><i /><i /><i /></div></article><h3>{varsayilan.metinler.urunBolumBaslik}</h3><section><i /><i /></section></main>
          <footer><i /><i /><i /></footer>
        </div>
        <p>Canlı önizleme</p><small>Kaydetmeden önce görünümü burada kontrol edebilirsin.</small>
      </aside>
    </form>
  );
}
