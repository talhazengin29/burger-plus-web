import { useEffect, useMemo, useRef, useState } from "react";
import { useIsletme } from "../../context/IsletmeContext";
import { logoYukle, temaKaydet } from "../../lib/adminApi";
import { hexRgba, KONSEPTLER, METIN_ALANLARI } from "../../data/konseptler";
import "./TemaYonetimi.css";

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
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [
      alan,
      tema?.metinler?.[alan] && tema.metinler[alan] !== varsayilan.metinler[alan] ? tema.metinler[alan] : "",
    ])),
  };
}

export default function TemaYonetimi({ urunler = [], kategoriler = [], damgaKarti = null }) {
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
    renkler: form.ozelPalet ? { ...varsayilan.renkler, accent: form.accent, accentGlow: hexRgba(form.accent) } : varsayilan.renkler,
    metinler: {
      ...varsayilan.metinler,
      ...Object.fromEntries(Object.entries(form.metinler).filter(([, deger]) => deger.trim())),
    },
  }), [form, varsayilan]);
  const sloganVurguIndex = onizleme.metinler.slogan.lastIndexOf(onizleme.metinler.sloganVurgu);
  const sloganBaslangici = sloganVurguIndex >= 0
    ? onizleme.metinler.slogan.slice(0, sloganVurguIndex).trim()
    : onizleme.metinler.slogan;
  const onizlemeKategorileri = kategoriler.filter((kategori) => kategori.aktif !== false).slice(0, 4);
  const onizlemeUrunleri = urunler.filter((urun) => urun.aktif !== false).slice(0, 2);
  const damgaHedefi = Math.min(6, Math.max(3, Number(damgaKarti?.hedefAdet) || 5));
  const doluDamga = Math.min(2, damgaHedefi);

  const konseptSec = (konsept) => setForm({
    konsept,
    ozelPalet: false,
    gorunum: form.gorunum,
    accent: KONSEPTLER[konsept].renkler.accent,
    logoOlcegi: form.logoOlcegi,
    metinler: Object.fromEntries(METIN_ALANLARI.map(([alan]) => [alan, ""])),
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
            <span className="logo-onizleme">{logoOnizleme ? <img style={{ transform: `scale(${form.logoOlcegi / 100})` }} src={logoOnizleme} alt={`${isletme.ad} logosu`} /> : <b>{isletme.ad}</b>}</span>
            <div><p>PNG, JPG, WebP veya SVG · en fazla 2 MB<br />Boş kenarlar otomatik kırpılır ve tüm ekranlar için standartlaştırılır.</p><button type="button" disabled={logoYukleniyor} onClick={() => dosyaRef.current?.click()}>{logoYukleniyor ? "Yükleniyor…" : "Logo Yükle"}</button></div>
            <input ref={dosyaRef} type="file" hidden accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={logoSecildi} />
          </div>
          <label className="logo-olcek"><span>Logo boyutu</span><input type="range" min="60" max="180" step="5" value={form.logoOlcegi} onChange={(e) => setForm({ ...form, logoOlcegi: Number(e.target.value) })} /><output>{form.logoOlcegi}%</output></label>
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
          <legend>Metin özelleştirme</legend>
          <p>Boş bıraktığın alanlarda seçilen konseptin varsayılan metni kullanılır.</p>
          <div className="tema-metinleri">
            {METIN_ALANLARI.map(([alan, etiket]) => <label key={alan}><span>{etiket}</span><input maxLength="120" value={form.metinler[alan]} placeholder={varsayilan.metinler[alan]} onChange={(e) => setForm({ ...form, metinler: { ...form.metinler, [alan]: e.target.value } })} /><small>{form.metinler[alan].length}/120</small></label>)}
          </div>
        </fieldset>
      </section>

      <aside className={`tema-canli ${form.gorunum === "acik" ? "acik" : "koyu"}`} style={{ "--onizleme-accent": onizleme.renkler.accent, "--onizleme-bg": form.gorunum === "acik" ? "#F5F4F1" : onizleme.renkler.bgPrimary, "--onizleme-card": form.gorunum === "acik" ? "rgba(255,255,255,.72)" : onizleme.renkler.bgCard, "--onizleme-baslik-font": varsayilan.font.baslik, "--onizleme-govde-font": varsayilan.font.govde }}>
        <div className="tema-telefon" aria-label="Müşteri uygulaması ana sayfa önizlemesi">
          <div className="onizleme-uygulama">
            <header className="onizleme-header">
              <div><small>Merhaba,</small><b>Misafir <span>👋</span></b></div>
              <nav aria-hidden="true"><i>♧</i><i>▢</i><i>?</i></nav>
            </header>
            <main className="onizleme-icerik">
              <h1>{sloganBaslangici}{sloganVurguIndex >= 0 && <><br /><em>{onizleme.metinler.sloganVurgu}</em></>}</h1>
              <article className="onizleme-damga">
                <header><div><span>{damgaKarti?.kartEtiketi || onizleme.metinler.kampanyaBaslik}</span><h2>{damgaKarti?.baslik || onizleme.metinler.damgaMetni.replace("{hedef}", String(damgaHedefi))}</h2><p>{damgaKarti?.aciklama || "Her siparişinde damga kazan, ödülüne yaklaş."}</p></div><strong>{doluDamga}<small>/{damgaHedefi}</small><i>TAMAMLANDI</i></strong></header>
                <div className="onizleme-damgalar" style={{ gridTemplateColumns: `repeat(${damgaHedefi}, 1fr)` }}>{Array.from({ length: damgaHedefi }, (_, index) => <i key={index} className={index < doluDamga ? "dolu" : index === doluDamga ? "siradaki" : ""}>{index < doluDamga ? (damgaKarti?.ikon || "★") : index + 1}{(index < doluDamga || index === damgaHedefi - 1) && <small>{index < doluDamga ? "Damga" : "Hediye"}</small>}</i>)}</div>
                <footer><div><small>SIRADAKİ ÖDÜL</small><b>{damgaKarti?.odulMetni || `Ücretsiz ${onizleme.metinler.damgaBirim}`}</b></div><span><b>{damgaHedefi - doluDamga}</b> daha</span></footer>
              </article>
              <section className="onizleme-kategoriler" aria-hidden="true">
                {(onizlemeKategorileri.length ? onizlemeKategorileri : [{ ad: 'Tümü' }, { ad: 'Burgerler' }, { ad: 'Menüler' }, { ad: 'İçecekler' }]).map((kategori, index) => <div className={index === 0 ? "aktif" : ""} key={kategori.id || kategori.ad}><i>{kategori.gorsel ? <img src={kategori.gorsel} alt="" /> : index === 0 ? 'T' : index === 1 ? '🍔' : index === 2 ? '🍟' : '🥤'}</i><span>{kategori.ad}</span></div>)}
              </section>
              <div className="onizleme-arama"><i>⌕</i><span>{onizleme.metinler.aramaPlaceholder}</span><b>≡</b></div>
              <h3>{onizleme.metinler.urunBolumBaslik}</h3>
              <section className="onizleme-urunler" aria-hidden="true">
                {(onizlemeUrunleri.length ? onizlemeUrunleri : [{ id: 'ornek-1', ad: `Klasik ${onizleme.metinler.damgaBirim}`, fiyat: 249, gorsel: '' }, { id: 'ornek-2', ad: 'Avantaj Menü', fiyat: 319, gorsel: '' }]).map((urun, index) => <article key={urun.id || index}><div>{urun.gorsel ? <img src={urun.gorsel} alt="" /> : index ? '🍟' : '🍔'}</div><h4>{urun.ad}</h4><footer><b>₺{Number(urun.fiyat || 0).toLocaleString('tr-TR')}</b><i>+</i></footer></article>)}
              </section>
            </main>
            <footer className="onizleme-alt-nav" aria-hidden="true"><i className="aktif">⌂<small>Ana Sayfa</small></i><i>◇<small>Kampanyalar</small></i><i>♧<small>Sipariş</small></i><i>☆<small>Puanlarım</small></i><i>○<small>Profil</small></i></footer>
          </div>
        </div>
        <p>Canlı önizleme</p><small>Kaydetmeden önce görünümü burada kontrol edebilirsin.</small>
      </aside>
    </form>
  );
}
