import { useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { IconBack } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar, telefonTemizle } from "../lib/dogrulama";
import { useDil } from "../dil/DilContext";
import "./Login.css";
import "./ProfilDuzenle.css";

const cinsiyetAnahtari = (deger) => ({
  erkek: "male",
  male: "male",
  kadın: "female",
  kadin: "female",
  female: "female",
  diğer: "other",
  diger: "other",
  other: "other",
}[String(deger || "").toLocaleLowerCase("tr-TR")]);

/*
  Profil düzenleme. Kullanıcı e-posta ve telefonunu değiştirebilir.
  Ad, soyad, cinsiyet KALICI (değiştirilemez, salt-okunur gösterilir).
*/
export default function ProfilDuzenle() {
  const git = useIsletmeNavigate();
  const { t } = useDil();
  const { kullanici, profiliGuncelle, avatar, avatarGuncelle } = useApp();

  const [email, setEmail] = useState(kullanici?.email || "");
  const [telefon, setTelefon] = useState(kullanici?.telefon || "");
  const [avatarTaslak, setAvatarTaslak] = useState(avatar);
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [basari, setBasari] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const cinsiyetCevirisi = cinsiyetAnahtari(kullanici?.cinsiyet);

  // Giriş yapılmamışsa profile geri gönder
  if (!kullanici) {
    git("/profil");
    return null;
  }

  const kaydet = async (e) => {
    e.preventDefault();
    setHata(""); setBasari(false);
    const hatalar = formuDogrula({ email, telefon }, {
      email: (deger) => kurallar.email(deger) ? t("profileEdit.invalidEmail") : "",
      telefon: (deger) => kurallar.telefon(deger, false) ? t("profileEdit.invalidPhone") : "",
    });
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata(t("profileEdit.checkFields"));
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await profiliGuncelle(emailTemizle(email), telefonTemizle(telefon));
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        avatarGuncelle(avatarTaslak);
        setBasari(true);
        setTimeout(() => git("/profil"), 900);
      }
    } catch {
      setHata(t("profileEdit.serverError"));
    } finally {
      setYukleniyor(false);
    }
  };

  const avatarSecildi = (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!dosya.type.startsWith("image/") || dosya.size > 1_500_000) {
      setHata(t("profileEdit.imageInvalid"));
      return;
    }
    const okuyucu = new FileReader();
    okuyucu.onload = () => { setAvatarTaslak(String(okuyucu.result)); setHata(""); };
    okuyucu.readAsDataURL(dosya);
  };

  return (
    <div className="ekran login">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git("/profil")} aria-label={t("common.back")}><IconBack /></button>
        <h1 className="alt-header-baslik">{t("profileEdit.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>

      <form className="login-form kayit-form" onSubmit={kaydet} noValidate>
        {/* Kalıcı bilgiler — salt okunur */}
        <div className="pd-kilitli-blok">
          <div className="pd-kilitli-baslik">
            <span>{t("profileEdit.accountInfo")}</span>
            <span className="pd-kilit">🔒 {t("profileEdit.locked")}</span>
          </div>
          <div className="pd-kilitli-satir">
            <span className="pd-etiket">{t("profileEdit.fullName")}</span>
            <span className="pd-deger">{kullanici.ad} {kullanici.soyad}</span>
          </div>
          <div className="pd-kilitli-satir">
            <span className="pd-etiket">{t("profileEdit.gender")}</span>
            <span className="pd-deger">{cinsiyetCevirisi ? t(`profileEdit.genderValues.${cinsiyetCevirisi}`) : kullanici.cinsiyet || "—"}</span>
          </div>
        </div>

        <div className="avatar-duzenle-alani">
          {avatarTaslak ? <img src={avatarTaslak} alt={t("profileEdit.previewAlt")} /> : <span>{kullanici.ad.charAt(0).toUpperCase()}</span>}
          <div><b>{t("profileEdit.profileImage")}</b><small>{t("profileEdit.imageHint")}</small><label><input type="file" accept="image/*" onChange={avatarSecildi} />{t("profileEdit.chooseImage")}</label>{avatarTaslak && <button type="button" onClick={() => setAvatarTaslak(null)}>{t("profileEdit.removeImage")}</button>}</div>
        </div>

        {/* Düzenlenebilir */}
        <label className="login-etiket">{t("profileEdit.email")}</label>
        <input type="email" className="login-input" value={email}
          onChange={(e) => { setEmail(e.target.value.slice(0, 254)); setHata(""); setAlanHatalari((o) => ({ ...o, email: "" })); }}
          onBlur={() => setAlanHatalari((o) => ({ ...o, email: kurallar.email(email) ? t("profileEdit.invalidEmail") : "" }))}
          placeholder={t("profileEdit.emailPlaceholder")} autoComplete="email" maxLength="254" required
          aria-invalid={Boolean(alanHatalari.email)} aria-describedby={alanHatalari.email ? "profil-email-hata" : undefined} />
        {alanHatalari.email && <small id="profil-email-hata" className="alan-hata">{alanHatalari.email}</small>}

        <label className="login-etiket">{t("profileEdit.phone")}</label>
        <input type="tel" className="login-input" value={telefon}
          onChange={(e) => { setTelefon(e.target.value.slice(0, 20)); setHata(""); setAlanHatalari((o) => ({ ...o, telefon: "" })); }}
          onBlur={() => setAlanHatalari((o) => ({ ...o, telefon: kurallar.telefon(telefon, false) ? t("profileEdit.invalidPhone") : "" }))}
          placeholder="05XX XXX XX XX" autoComplete="tel" inputMode="tel" maxLength="20"
          aria-invalid={Boolean(alanHatalari.telefon)} aria-describedby={alanHatalari.telefon ? "profil-telefon-hata" : undefined} />
        {alanHatalari.telefon && <small id="profil-telefon-hata" className="alan-hata">{alanHatalari.telefon}</small>}

        {hata && <p className="login-hata">{hata}</p>}
        {basari && <p className="pd-basari">✓ {t("profileEdit.updated")}</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor || !email}>
          {yukleniyor ? t("profileEdit.saving") : t("profileEdit.save")}
        </button>
      </form>
    </div>
  );
}
