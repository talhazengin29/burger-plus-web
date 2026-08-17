import { useEffect, useMemo, useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { IconBack, IconChat } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { useApp } from "../context/AppContext";
import { sikayetGonder, sikayetGorseliYukle, sikayetleriGetir } from "../lib/authApi";
import "./Sikayet.css";

const KATEGORILER = [
  ["siparis", "Sipariş"], ["urun", "Ürün / Lezzet"], ["personel", "Personel"],
  ["odeme", "Ödeme"], ["uygulama", "Uygulama"], ["diger", "Diğer"],
];
const DURUMLAR = {
  yeni: ["Alındı", "Başvurunuz işletmeye ulaştı."],
  inceleniyor: ["İnceleniyor", "İşletme başvurunuzu inceliyor."],
  cozuldu: ["Çözüldü", "Başvurunuz sonuçlandırıldı."],
  reddedildi: ["Kapatıldı", "Başvurunuz değerlendirilerek kapatıldı."],
};

export default function Sikayet() {
  const git = useIsletmeNavigate();
  const { kullanici } = useApp();
  const [form, setForm] = useState({ kategori: "siparis", baslik: "", aciklama: "" });
  const [gorsel, setGorsel] = useState(null);
  const [sikayetler, setSikayetler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [basarili, setBasarili] = useState("");
  const onizleme = useMemo(() => gorsel ? URL.createObjectURL(gorsel) : "", [gorsel]);

  useEffect(() => () => { if (onizleme) URL.revokeObjectURL(onizleme); }, [onizleme]);
  useEffect(() => {
    if (!kullanici?.id) { setYukleniyor(false); return; }
    sikayetleriGetir().then(setSikayetler).catch((e) => setHata(e.message)).finally(() => setYukleniyor(false));
  }, [kullanici?.id]);

  const gorselSec = (dosya) => {
    setHata("");
    if (!dosya) return setGorsel(null);
    if (!["image/png", "image/jpeg", "image/webp"].includes(dosya.type)) return setHata("PNG, JPG veya WebP formatında bir görsel seçin.");
    if (dosya.size > 5 * 1024 * 1024) return setHata("Görsel en fazla 5 MB olabilir.");
    setGorsel(dosya);
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata(""); setBasarili("");
    if (form.baslik.trim().length < 5) return setHata("Konu en az 5 karakter olmalıdır.");
    if (form.aciklama.trim().length < 20) return setHata("Açıklama en az 20 karakter olmalıdır.");
    setGonderiliyor(true);
    try {
      const gorselUrl = gorsel ? await sikayetGorseliYukle(gorsel) : null;
      const sikayet = await sikayetGonder({ ...form, gorselUrl, istekAnahtari: crypto.randomUUID() });
      setSikayetler((onceki) => [sikayet, ...onceki]);
      setForm({ kategori: "siparis", baslik: "", aciklama: "" });
      setGorsel(null);
      setBasarili("Şikayetiniz işletmeye iletildi. Durumunu bu ekrandan takip edebilirsiniz.");
    } catch (err) { setHata(err.message || "Şikayet gönderilemedi."); }
    finally { setGonderiliyor(false); }
  };

  return (
    <div className="ekran sikayet-sayfasi">
      <OrtakHeader />
      <SayfaSarici>
        <header className="sikayet-baslik">
          <button onClick={() => git("/profil")} aria-label="Profile dön"><IconBack /></button>
          <div><small>GERİ BİLDİRİM MERKEZİ</small><h1>Şikayet ve öneri</h1><p>Yaşadığınız durumu doğrudan işletme yöneticisine iletin.</p></div>
        </header>

        <form className="sikayet-form" onSubmit={gonder}>
          <div className="sikayet-form-ust"><span><IconChat /></span><div><b>Yeni başvuru</b><small>Açıklayıcı bilgi çözüm süresini hızlandırır.</small></div></div>
          <label>Kategori<select value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })}>{KATEGORILER.map(([id, ad]) => <option value={id} key={id}>{ad}</option>)}</select></label>
          <label>Konu<input required maxLength="120" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} placeholder="Kısaca ne oldu?" /></label>
          <label>Açıklama<textarea required minLength="20" maxLength="3000" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Tarih, masa veya sipariş bilgisiyle birlikte yaşadığınız durumu anlatın." /><small>{form.aciklama.length}/3000</small></label>
          <label className={`sikayet-gorsel-sec${onizleme ? " dolu" : ""}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => gorselSec(e.target.files?.[0])} />
            {onizleme ? <img src={onizleme} alt="Şikayet görseli önizleme" /> : <span>＋</span>}
            <div><b>{gorsel ? gorsel.name : "Görsel ekle"}</b><small>İsteğe bağlı · PNG, JPG veya WebP · en fazla 5 MB</small></div>
          </label>
          {gorsel && <button type="button" className="sikayet-gorsel-kaldir" onClick={() => setGorsel(null)}>Görseli kaldır</button>}
          {hata && <p className="sikayet-mesaj hata" role="alert">{hata}</p>}
          {basarili && <p className="sikayet-mesaj basarili">{basarili}</p>}
          <button className="sikayet-gonder" disabled={gonderiliyor}>{gonderiliyor ? "Gönderiliyor…" : "İşletmeye Gönder"}</button>
        </form>

        <section className="sikayet-gecmis">
          <header><div><small>TAKİP</small><h2>Başvurularım</h2></div><span>{sikayetler.length}</span></header>
          {yukleniyor ? <p className="sikayet-bos">Başvurular yükleniyor…</p> : sikayetler.length ? sikayetler.map((sikayet) => {
            const durum = DURUMLAR[sikayet.durum] || DURUMLAR.yeni;
            return <article key={sikayet.id} className={`sikayet-gecmis-kart ${sikayet.durum}`}>
              <header><span>{KATEGORILER.find(([id]) => id === sikayet.kategori)?.[1] || "Diğer"}</span><time>{new Date(sikayet.olusturma).toLocaleDateString("tr-TR")}</time></header>
              <h3>{sikayet.baslik}</h3><p>{sikayet.aciklama}</p>
              {sikayet.gorselUrl && <img src={sikayet.gorselUrl} alt="Başvuru eki" />}
              <footer><b>{durum[0]}</b><small>{durum[1]}</small></footer>
            </article>;
          }) : <p className="sikayet-bos">Henüz bir başvurunuz bulunmuyor.</p>}
        </section>
      </SayfaSarici>
    </div>
  );
}
