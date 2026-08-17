import { useEffect, useMemo, useState } from "react";
import { CEVIRILER } from "../../../../musteri/src/i18n/ceviriler";
import { i18nHazirlikRaporunuGetir, i18nSozlukleriniGetir, i18nSozlukleriniKaydet } from "../../lib/adminApi";
import "./SozlukYonetimi.css";

const DILLER = ["tr", "en"];
const GRUP_ADLARI = {
  common: "Genel", nav: "Navigasyon", header: "Üst alan", home: "Ana sayfa", stamp: "Damga kartı",
  auth: "Giriş ve üyelik", orders: "Siparişler", profile: "Profil", campaigns: "Kampanyalar",
  cart: "Sepet", wallet: "Cüzdan", language: "Dil seçimi",
};

function yerTutucular(metin) {
  return [...String(metin || "").matchAll(/\{(\w+)\}/g)].map((eslesme) => eslesme[1]).sort().join("|");
}

export default function SozlukYonetimi() {
  const [sozlukler, setSozlukler] = useState(() => ({ tr: { ...CEVIRILER.tr }, en: { ...CEVIRILER.en } }));
  const [dbKayitlari, setDbKayitlari] = useState({ tr: {}, en: {} });
  const [dinamikKatalog, setDinamikKatalog] = useState([]);
  const [arama, setArama] = useState("");
  const [grup, setGrup] = useState("tumu");
  const [acikDil, setAcikDil] = useState("en");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  useEffect(() => {
    Promise.all([i18nSozlukleriniGetir(), i18nHazirlikRaporunuGetir("en")])
      .then(([{ sozlukler: db = {} }, rapor]) => {
        const gelen = { tr: db.tr || {}, en: db.en || {} };
        const katalog = Array.isArray(rapor.katalog) ? rapor.katalog : [];
        const katalogTr = Object.fromEntries(katalog.map((kayit) => [kayit.anahtar, kayit.turkce]));
        const katalogEn = Object.fromEntries(katalog.map((kayit) => [kayit.anahtar, kayit.varsayilanEn || ""]));
        setDinamikKatalog(katalog);
        setDbKayitlari(gelen);
        setSozlukler({ tr: { ...CEVIRILER.tr, ...katalogTr, ...gelen.tr }, en: { ...CEVIRILER.en, ...katalogEn, ...gelen.en } });
      })
      .catch((e) => setHata(e.message))
      .finally(() => setYukleniyor(false));
  }, []);

  const anahtarlar = useMemo(() => [...new Set([...Object.keys(CEVIRILER.tr), ...Object.keys(CEVIRILER.en), ...dinamikKatalog.map((kayit) => kayit.anahtar)])].sort(), [dinamikKatalog]);
  const gruplar = useMemo(() => [...new Set(anahtarlar.map((anahtar) => anahtar.split(".")[0]))], [anahtarlar]);
  const filtreli = useMemo(() => anahtarlar.filter((anahtar) => {
    if (grup !== "tumu" && !anahtar.startsWith(`${grup}.`)) return false;
    const q = arama.trim().toLocaleLowerCase("tr");
    return !q || anahtar.toLowerCase().includes(q) || DILLER.some((dil) => String(sozlukler[dil][anahtar] || "").toLocaleLowerCase("tr").includes(q));
  }), [anahtarlar, arama, grup, sozlukler]);
  const eksikSayisi = anahtarlar.filter((anahtar) => !String(sozlukler.en[anahtar] || "").trim()).length;
  const yerTutucuHatalari = anahtarlar.filter((anahtar) => yerTutucular(sozlukler.tr[anahtar]) !== yerTutucular(sozlukler.en[anahtar]));

  const kaydet = async () => {
    if (yerTutucuHatalari.length) {
      setHata(`Değişkenler eşleşmiyor: ${yerTutucuHatalari.slice(0, 3).join(", ")}`);
      return;
    }
    setKaydediliyor(true); setHata(""); setMesaj("");
    try {
      const sonuc = await i18nSozlukleriniKaydet(sozlukler);
      setDbKayitlari(sonuc.sozlukler || sozlukler);
      setMesaj(`${sonuc.kayitSayisi || anahtarlar.length * 2} sözlük kaydı veritabanına yazıldı.`);
    } catch (e) { setHata(e.message); }
    finally { setKaydediliyor(false); }
  };

  if (yukleniyor) return <section className="sozluk-yonetimi"><p>Sözlük yükleniyor…</p></section>;
  return (
    <section className="sozluk-yonetimi">
      <header><div><span>DİNAMİK I18N</span><h2>Uygulama sözlüğü</h2><p>Metinler işletmeye özel olarak veritabanından yayınlanır. Yerel sözlük yalnızca kesinti durumunda fallback olarak kalır.</p></div><button type="button" onClick={kaydet} disabled={kaydediliyor || yerTutucuHatalari.length > 0}>{kaydediliyor ? "Kaydediliyor…" : "Sözlüğü yayınla"}</button></header>
      <div className="sozluk-ozet"><span><b>{anahtarlar.length}</b> anahtar</span><span><b>{Object.keys(dbKayitlari.en || {}).length}</b> DB çevirisi</span><span><b>{dinamikKatalog.length}</b> işletme içeriği</span><span className={eksikSayisi ? "uyari" : "tamam"}><b>{eksikSayisi}</b> eksik English</span></div>
      {eksikSayisi > 0 && <div className="sozluk-mesaj hatali">English müşteri uygulaması kilitli. Karışık dil gösterilmemesi için {eksikSayisi} eksik alanı tamamlayıp sözlüğü yayınlayın.</div>}
      {mesaj && <div className="sozluk-mesaj basarili">✓ {mesaj}</div>}{hata && <div className="sozluk-mesaj hatali">{hata}</div>}
      <div className="sozluk-araclar"><input type="search" value={arama} onChange={(e) => setArama(e.target.value.slice(0, 100))} placeholder="Anahtar veya metin ara…" /><select value={grup} onChange={(e) => setGrup(e.target.value)}><option value="tumu">Tüm gruplar</option>{gruplar.map((kod) => <option key={kod} value={kod}>{GRUP_ADLARI[kod] || kod}</option>)}</select><div>{DILLER.map((dil) => <button type="button" className={acikDil === dil ? "secili" : ""} key={dil} onClick={() => setAcikDil(dil)}>{dil.toUpperCase()}</button>)}</div></div>
      <div className="sozluk-liste">{filtreli.map((anahtar) => {
        const dbDegeri = dbKayitlari[acikDil]?.[anahtar];
        const yerTutucuHatasi = yerTutucular(sozlukler.tr[anahtar]) !== yerTutucular(sozlukler.en[anahtar]);
        return <label key={`${acikDil}-${anahtar}`} className={yerTutucuHatasi ? "degisken-hatasi" : ""}><span><code>{anahtar}</code><small>{dbDegeri ? "DB" : "FALLBACK"}</small></span><textarea rows="2" maxLength="1000" value={sozlukler[acikDil][anahtar] || ""} onChange={(e) => setSozlukler((onceki) => ({ ...onceki, [acikDil]: { ...onceki[acikDil], [anahtar]: e.target.value } }))} /><em>{yerTutucuHatasi ? "{değişken} adları TR ile aynı olmalı" : `${String(sozlukler[acikDil][anahtar] || "").length}/1000`}</em></label>;
      })}</div>
    </section>
  );
}
