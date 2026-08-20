import { useEffect, useMemo, useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { IconBack, IconChat } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { useApp } from "../context/AppContext";
import { sikayetGonder, sikayetGorseliYukle, sikayetleriGetir } from "../lib/authApi";
import { useDil } from "../dil/DilContext";
import "./Sikayet.css";

const KATEGORILER = [
  ["siparis", "order"], ["urun", "product"], ["personel", "staff"],
  ["odeme", "payment"], ["uygulama", "app"], ["diger", "other"],
];
const DURUMLAR = {
  yeni: "received",
  inceleniyor: "reviewing",
  cozuldu: "resolved",
  reddedildi: "closed",
};

export default function Sikayet() {
  const git = useIsletmeNavigate();
  const { locale, t } = useDil();
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
    if (!["image/png", "image/jpeg", "image/webp"].includes(dosya.type)) return setHata(t("complaint.imageFormatError"));
    if (dosya.size > 5 * 1024 * 1024) return setHata(t("complaint.imageSizeError"));
    setGorsel(dosya);
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata(""); setBasarili("");
    if (form.baslik.trim().length < 5) return setHata(t("complaint.subjectError"));
    if (form.aciklama.trim().length < 20) return setHata(t("complaint.descriptionError"));
    setGonderiliyor(true);
    try {
      const gorselUrl = gorsel ? await sikayetGorseliYukle(gorsel) : null;
      const sikayet = await sikayetGonder({ ...form, gorselUrl, istekAnahtari: crypto.randomUUID() });
      setSikayetler((onceki) => [sikayet, ...onceki]);
      setForm({ kategori: "siparis", baslik: "", aciklama: "" });
      setGorsel(null);
      setBasarili(t("complaint.sentSuccess"));
    } catch (err) { setHata(err.message || t("complaint.sendFailed")); }
    finally { setGonderiliyor(false); }
  };

  return (
    <div className="ekran sikayet-sayfasi">
      <OrtakHeader />
      <SayfaSarici>
        <header className="sikayet-baslik">
          <button onClick={() => git("/profil")} aria-label={t("complaint.backToProfile")}><IconBack /></button>
          <div><small>{t("complaint.center")}</small><h1>{t("complaint.title")}</h1><p>{t("complaint.intro")}</p></div>
        </header>

        <form className="sikayet-form" onSubmit={gonder}>
          <div className="sikayet-form-ust"><span><IconChat /></span><div><b>{t("complaint.newRequest")}</b><small>{t("complaint.newRequestHint")}</small></div></div>
          <fieldset className="sikayet-kategori-secimi">
            <legend>{t("complaint.category")}</legend>
            <div>{KATEGORILER.map(([id, anahtar]) => <button type="button" className={form.kategori === id ? "aktif" : ""} aria-pressed={form.kategori === id} onClick={() => setForm({ ...form, kategori: id })} key={id}>{t(`complaint.categories.${anahtar}`)}</button>)}</div>
          </fieldset>
          <label>{t("complaint.subject")}<input required maxLength="120" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} placeholder={t("complaint.subjectPlaceholder")} /></label>
          <label>{t("complaint.description")}<textarea required minLength="20" maxLength="3000" value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder={t("complaint.descriptionPlaceholder")} /><small>{form.aciklama.length}/3000</small></label>
          <label className={`sikayet-gorsel-sec${onizleme ? " dolu" : ""}`}>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => gorselSec(e.target.files?.[0])} />
            {onizleme ? <img src={onizleme} alt={t("complaint.imagePreviewAlt")} /> : <span>＋</span>}
            <div><b>{gorsel ? gorsel.name : t("complaint.addImage")}</b><small>{t("complaint.imageHint")}</small></div>
          </label>
          {gorsel && <button type="button" className="sikayet-gorsel-kaldir" onClick={() => setGorsel(null)}>{t("complaint.removeImage")}</button>}
          {hata && <p className="sikayet-mesaj hata" role="alert">{hata}</p>}
          {basarili && <p className="sikayet-mesaj basarili">{basarili}</p>}
          <button className="sikayet-gonder" disabled={gonderiliyor}>{gonderiliyor ? t("complaint.sending") : t("complaint.send")}</button>
        </form>

        <section className="sikayet-gecmis">
          <header><div><small>{t("complaint.tracking")}</small><h2>{t("complaint.myRequests")}</h2></div><span>{sikayetler.length}</span></header>
          {yukleniyor ? <p className="sikayet-bos">{t("complaint.loading")}</p> : sikayetler.length ? sikayetler.map((sikayet) => {
            const durum = DURUMLAR[sikayet.durum] || DURUMLAR.yeni;
            return <article key={sikayet.id} className={`sikayet-gecmis-kart ${sikayet.durum}`}>
              <header><span>{t(`complaint.categories.${KATEGORILER.find(([id]) => id === sikayet.kategori)?.[1] || "other"}`)}</span><time>{new Date(sikayet.olusturma).toLocaleDateString(locale)}</time></header>
              <h3>{sikayet.baslik}</h3><p>{sikayet.aciklama}</p>
              {sikayet.gorselUrl && <img src={sikayet.gorselUrl} alt={t("complaint.attachmentAlt")} />}
              <footer><b>{t(`complaint.status.${durum}.title`)}</b><small>{t(`complaint.status.${durum}.text`)}</small></footer>
            </article>;
          }) : <p className="sikayet-bos">{t("complaint.empty")}</p>}
        </section>
      </SayfaSarici>
    </div>
  );
}
