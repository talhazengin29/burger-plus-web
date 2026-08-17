import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsletme } from "../../context/IsletmeContext";
import { logoYukle, temaKaydet } from "../../lib/adminApi";
import { hexRgba, KONSEPTLER, METIN_ALANLARI } from "../../data/konseptler";
import "./TemaYonetimi.css";
import SozlukYonetimi from "./SozlukYonetimi";

const HEX = /^#[0-9a-f]{6}$/i;

function baslangicFormu(isletme, tema) {
  const konsept = KONSEPTLER[isletme?.konsept] ? isletme.konsept : "burger";
  const varsayilan = KONSEPTLER[konsept];
  return {
    konsept,
    ozelPalet: tema?.ozelPalet === true,
    gorunum: tema?.gorunum === "acik" ? "acik" : "koyu",
    accent: tema?.renkler?.accent || varsayilan.renkler.accent,
    logoOlcegi: Math.min(180, Math.max(60, Number(tema?.logoOlcegi) || 100)),
    logoKonumX: Math.min(80, Math.max(-80, Number(tema?.logoKonumX) || 0)),
    logoKonumY: Math.min(30, Math.max(-30, Number(tema?.logoKonumY) || 0)),
    etkinDiller: Array.isArray(tema?.dilAyarlari?.etkinDiller) ? tema.dilAyarlari.etkinDiller : ["tr", "en"],
    varsayilanDil: tema?.dilAyarlari?.varsayilanDil === "en" ? "en" : "tr",
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [
      alan,
      tema?.metinler?.[alan] && tema.metinler[alan] !== varsayilan.metinler[alan] ? tema.metinler[alan] : "",
    ])),
    metinCevirileri: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [alan, tema?.metinCevirileri?.[alan]?.en || ""])),
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
  const canliOnizlemeRef = useRef(null);
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
    renkler: form.ozelPalet ? { ...varsayilan.renkler, accent: form.accent, accentGlow: hexRgba(form.accent) } : varsayilan.renkler,
    metinler: {
      ...varsayilan.metinler,
      ...Object.fromEntries(Object.entries(form.metinler).filter(([, deger]) => deger.trim())),
    },
  }), [form, varsayilan]);
  const canliOnizlemeTemasi = useMemo(() => ({
    ...tema,
    konsept: form.konsept,
    gorunum: form.gorunum,
    ozelPalet: form.ozelPalet,
    renkler: onizleme.renkler,
    font: varsayilan.font,
    metinler: onizleme.metinler,
    metinCevirileri: Object.fromEntries(Object.entries(form.metinCevirileri).map(([alan, en]) => [alan, { en: en.trim() }]).filter(([, deger]) => deger.en)),
    dilAyarlari: { etkinDiller: form.etkinDiller, varsayilanDil: form.varsayilanDil },
    logoUrl: logoOnizleme || tema?.logoUrl || isletme.logoUrl || null,
    logoOlcegi: form.logoOlcegi,
    logoKonumX: form.logoKonumX,
    logoKonumY: form.logoKonumY,
  }), [form, isletme.logoUrl, logoOnizleme, onizleme, tema, varsayilan.font]);

  const onizlemeMesajiniGonder = useCallback(() => canliOnizlemeRef.current?.contentWindow?.postMessage({
    type: "burger-plus-tema-onizleme",
    isletmeSlug: isletme.slug,
    tema: canliOnizlemeTemasi,
  }, window.location.origin), [canliOnizlemeTemasi, isletme.slug]);

  useEffect(() => { onizlemeMesajiniGonder(); }, [onizlemeMesajiniGonder]);

  useEffect(() => {
    const hazirMesaji = (event) => {
      if (event.origin === window.location.origin && event.data?.type === "burger-plus-tema-onizleme-hazir") onizlemeMesajiniGonder();
    };
    window.addEventListener("message", hazirMesaji);
    return () => window.removeEventListener("message", hazirMesaji);
  }, [onizlemeMesajiniGonder]);

  const konseptSec = (konsept) => setForm({
    konsept,
    ozelPalet: false,
    gorunum: form.gorunum,
    accent: KONSEPTLER[konsept].renkler.accent,
    logoOlcegi: form.logoOlcegi,
    logoKonumX: form.logoKonumX,
    logoKonumY: form.logoKonumY,
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [alan, ""])),
    metinCevirileri: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [alan, ""])),
    etkinDiller: form.etkinDiller,
    varsayilanDil: form.varsayilanDil,
  });

  const kaydet = async (e) => {
    e.preventDefault();
    if (form.ozelPalet && !HEX.test(form.accent)) {
      setHata("Vurgu rengi #RRGGBB biçiminde geçerli bir hex değeri olmalı.");
      return;
    }
    setKaydediliyor(true);
    setHata("");
    setBildirim("");
    try {
      const yanit = await temaKaydet({
        konsept: form.konsept,
        ozelPalet: form.ozelPalet,
        gorunum: form.gorunum,
        renkler: form.ozelPalet ? { accent: form.accent, accentGlow: hexRgba(form.accent), bgPrimary: varsayilan.renkler.bgPrimary, bgCard: varsayilan.renkler.bgCard } : {},
        logoOlcegi: form.logoOlcegi,
        logoKonumX: form.logoKonumX,
        logoKonumY: form.logoKonumY,
        metinler: form.metinler,
        metinCevirileri: Object.fromEntries(Object.entries(form.metinCevirileri).map(([alan, en]) => [alan, { en: en.trim() }]).filter(([, deger]) => deger.en)),
        dilAyarlari: { etkinDiller: form.etkinDiller, varsayilanDil: form.varsayilanDil },
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
            <span className="logo-onizleme">{logoOnizleme ? <img style={{ transform: `translate(${form.logoKonumX}px, ${form.logoKonumY}px) scale(${form.logoOlcegi / 100})` }} src={logoOnizleme} alt={`${isletme.ad} logosu`} /> : <b>{isletme.ad}</b>}</span>
            <div><p>PNG, JPG, WebP veya SVG · en fazla 2 MB<br />Boş kenarlar otomatik kırpılır ve tüm ekranlar için standartlaştırılır.</p><button type="button" disabled={logoYukleniyor} onClick={() => dosyaRef.current?.click()}>{logoYukleniyor ? "Yükleniyor…" : "Logo Yükle"}</button></div>
            <input ref={dosyaRef} type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={logoSecildi} />
          </div>
          <div className="logo-yerlesim-baslik"><b>Logo yerleşimi</b><button type="button" onClick={() => setForm({ ...form, logoOlcegi: 100, logoKonumX: 0, logoKonumY: 0 })}>Sıfırla</button></div>
          <label className="logo-olcek"><span>Boyut</span><input type="range" min="60" max="180" step="5" value={form.logoOlcegi} onChange={(e) => setForm({ ...form, logoOlcegi: Number(e.target.value) })} /><output>{form.logoOlcegi}%</output></label>
          <label className="logo-olcek"><span>Sağ / sol</span><input type="range" min="-80" max="80" step="2" value={form.logoKonumX} onChange={(e) => setForm({ ...form, logoKonumX: Number(e.target.value) })} /><output>{form.logoKonumX}px</output></label>
          <label className="logo-olcek"><span>Yukarı / aşağı</span><input type="range" min="-30" max="30" step="1" value={form.logoKonumY} onChange={(e) => setForm({ ...form, logoKonumY: Number(e.target.value) })} /><output>{form.logoKonumY}px</output></label>
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Uygulama görünümü</legend>
          <p>Müşteri uygulamasının cam yüzeylerini işletmenin tarzına göre koyu veya aydınlık kullan.</p>
          <div className="gorunum-secimi" role="radiogroup" aria-label="Müşteri uygulaması görünümü">
            <button type="button" role="radio" aria-checked={form.gorunum === "koyu"} className={form.gorunum === "koyu" ? "secili" : ""} onClick={() => setForm({ ...form, gorunum: "koyu" })}>
              <i className="gorunum-ornek gorunum-ornek--koyu"><span /><span /></i><b>Koyu</b><small>Siyah cam görünüm</small>
            </button>
            <button type="button" role="radio" aria-checked={form.gorunum === "acik"} className={form.gorunum === "acik" ? "secili" : ""} onClick={() => setForm({ ...form, gorunum: "acik" })}>
              <i className="gorunum-ornek gorunum-ornek--acik"><span /><span /></i><b>Aydınlık</b><small>Beyaz buzlu cam görünüm</small>
            </button>
          </div>
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Renk özelleştirme</legend>
          <label className="tema-toggle"><input type="checkbox" checked={form.ozelPalet} onChange={(e) => setForm({ ...form, ozelPalet: e.target.checked, accent: e.target.checked ? form.accent : varsayilan.renkler.accent })} /><span /><b>{form.ozelPalet ? "Kendi rengimi seç" : "Konsept rengini kullan"}</b></label>
          {form.ozelPalet && <div className="renk-secimi"><input type="color" value={HEX.test(form.accent) ? form.accent : varsayilan.renkler.accent} onChange={(e) => setForm({ ...form, accent: e.target.value.toUpperCase() })} aria-label="Vurgu rengi" /><label><span>Accent rengi</span><input maxLength="7" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value.slice(0, 7) })} placeholder="#FF6B00" /></label></div>}
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Dil ayarları</legend>
          <p>Müşterinin seçebileceği dilleri ve uygulamanın ilk açılış dilini belirle.</p>
          <div className="tema-dil-ayarlari">
            <label className="tema-toggle"><input type="checkbox" checked={form.etkinDiller.includes("en")} onChange={(e) => { const etkinDiller = e.target.checked ? ["tr", "en"] : ["tr"]; setForm({ ...form, etkinDiller, varsayilanDil: etkinDiller.includes(form.varsayilanDil) ? form.varsayilanDil : "tr" }); }} /><span /><b>English seçeneğini göster</b></label>
            <label><span>Varsayılan dil</span><select value={form.varsayilanDil} onChange={(e) => setForm({ ...form, varsayilanDil: e.target.value })}><option value="tr">Türkçe</option>{form.etkinDiller.includes("en") && <option value="en">English</option>}</select></label>
          </div>
        </fieldset>

        <fieldset className="tema-kutu">
          <legend>Metin özelleştirme</legend>
          <p>Türkçe alan boşsa konsept metni kullanılır. English boşsa güvenli şekilde Türkçe metne düşer.</p>
          <div className="tema-metinleri">
            {METIN_ALANLARI.map(([alan, etiket]) => <div className="tema-cok-dilli-alan" key={alan}><b>{etiket}</b><label><span>TR</span><input maxLength="120" value={form.metinler[alan]} placeholder={varsayilan.metinler[alan]} onChange={(e) => setForm({ ...form, metinler: { ...form.metinler, [alan]: e.target.value } })} /><small>{form.metinler[alan].length}/120</small></label>{form.etkinDiller.includes("en") && <label><span>EN</span><input maxLength="120" value={form.metinCevirileri[alan]} placeholder="English translation" onChange={(e) => setForm({ ...form, metinCevirileri: { ...form.metinCevirileri, [alan]: e.target.value } })} /><small>{form.metinCevirileri[alan].length}/120</small></label>}</div>)}
          </div>
        </fieldset>
      </section>

      <aside className="tema-canli">
        <div className="tema-telefon tema-telefon--gercek" aria-label="Gerçek müşteri uygulaması ana sayfa önizlemesi">
          <iframe ref={canliOnizlemeRef} title="Müşteri uygulaması canlı önizleme" src={`/${encodeURIComponent(isletme.slug)}/anasayfa?temaOnizleme=1`} onLoad={onizlemeMesajiniGonder} tabIndex="-1" />
        </div>
        <p>Canlı önizleme</p><small>Müşterinin gördüğü gerçek uygulama ekranıdır.</small>
      </aside>
      <SozlukYonetimi />
    </form>
  );
}
