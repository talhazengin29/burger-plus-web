import { useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { kayitOl, tokeniKaydet } from "../lib/authApi";
import { IconBack, IconEye, IconEyeOff } from "../components/Icons";
import { davetKoduTemizle, emailTemizle, formuDogrula, ilkHata, kurallar, telefonTemizle, temizMetin } from "../lib/dogrulama";
import { useDil } from "../dil/DilContext";
import "./Login.css";

export default function Kayit() {
  const git = useIsletmeNavigate();
  const { t } = useDil();
  const { girisiTamamla } = useApp();
  const [form, setForm] = useState({
    ad: "", soyad: "", cinsiyet: "", email: "", telefon: "", sifre: "", davetKodu: "",
  });
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const kayitSemasi = {
    ad: (deger) => kurallar.ad(deger, "Ad") ? t("register.invalidFirstName") : "",
    soyad: (deger) => kurallar.ad(deger, "Soyad") ? t("register.invalidLastName") : "",
    cinsiyet: (deger) => deger ? "" : t("register.genderRequired"),
    email: (deger) => kurallar.email(deger) ? t("register.invalidEmail") : "",
    telefon: (deger) => kurallar.telefon(deger, true) ? t("register.invalidPhone") : "",
    sifre: (deger) => kurallar.yeniSifre(deger) ? t("register.invalidPassword") : "",
    davetKodu: (deger) => kurallar.davetKodu(deger) ? t("register.invalidInvite") : "",
  };

  const guncelle = (alan, deger) => {
    setForm((f) => ({ ...f, [alan]: deger }));
    setHata("");
    setAlanHatalari((onceki) => ({ ...onceki, [alan]: "" }));
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    const hatalar = formuDogrula(form, kayitSemasi);
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata(t("register.checkFields"));
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await kayitOl({
        ...form,
        ad: temizMetin(form.ad, 60),
        soyad: temizMetin(form.soyad, 60),
        email: emailTemizle(form.email),
        telefon: telefonTemizle(form.telefon),
        davetKodu: davetKoduTemizle(form.davetKodu),
      });
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        tokeniKaydet(sonuc.token);
        girisiTamamla(sonuc.kullanici);
        git("/anasayfa");
      }
    } catch {
      setHata(t("register.serverError"));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="ekran login">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git("/")} aria-label={t("common.back")}><IconBack /></button>
        <h1 className="alt-header-baslik">{t("register.title")}</h1>
        <span className="alt-header-bosluk" />
      </header>

      <form className="login-form kayit-form" onSubmit={gonder} noValidate>
        <div className="kayit-ikili">
          <div className="kayit-alan">
            <label className="login-etiket">{t("register.firstName")}</label>
            <input className="login-input" value={form.ad}
              onChange={(e) => guncelle("ad", e.target.value.slice(0, 60))}
              onBlur={() => setAlanHatalari((o) => ({ ...o, ad: kayitSemasi.ad(form.ad) }))}
              placeholder={t("register.firstNamePlaceholder")} autoComplete="given-name" maxLength="60" required
              aria-invalid={Boolean(alanHatalari.ad)} aria-describedby={alanHatalari.ad ? "kayit-ad-hata" : undefined} />
            {alanHatalari.ad && <small id="kayit-ad-hata" className="alan-hata">{alanHatalari.ad}</small>}
          </div>
          <div className="kayit-alan">
            <label className="login-etiket">{t("register.lastName")}</label>
            <input className="login-input" value={form.soyad}
              onChange={(e) => guncelle("soyad", e.target.value.slice(0, 60))}
              onBlur={() => setAlanHatalari((o) => ({ ...o, soyad: kayitSemasi.soyad(form.soyad) }))}
              placeholder={t("register.lastNamePlaceholder")} autoComplete="family-name" maxLength="60" required
              aria-invalid={Boolean(alanHatalari.soyad)} aria-describedby={alanHatalari.soyad ? "kayit-soyad-hata" : undefined} />
            {alanHatalari.soyad && <small id="kayit-soyad-hata" className="alan-hata">{alanHatalari.soyad}</small>}
          </div>
        </div>
        <label className="login-etiket">{t("register.gender")}</label>
        <div className="cinsiyet-secim">
          {[["Kadın", "female"], ["Erkek", "male"], ["Diğer", "other"]].map(([deger, anahtar]) => (
            <button type="button" key={deger}
              className={"cinsiyet-btn " + (form.cinsiyet === deger ? "cinsiyet-btn--aktif" : "")}
              onClick={() => guncelle("cinsiyet", deger)}>
              {t(`register.genderValues.${anahtar}`)}
            </button>
          ))}
        </div>
        {alanHatalari.cinsiyet && <small className="alan-hata">{alanHatalari.cinsiyet}</small>}

        <label className="login-etiket">{t("register.email")}</label>
        <input type="email" className="login-input" value={form.email}
          onChange={(e) => guncelle("email", e.target.value.slice(0, 254))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, email: kayitSemasi.email(form.email) }))}
          placeholder={t("register.emailPlaceholder")} autoComplete="email" maxLength="254" required
          aria-invalid={Boolean(alanHatalari.email)} aria-describedby={alanHatalari.email ? "kayit-email-hata" : undefined} />
        {alanHatalari.email && <small id="kayit-email-hata" className="alan-hata">{alanHatalari.email}</small>}

        <label className="login-etiket">{t("register.phone")}</label>
        <input type="tel" className="login-input" value={form.telefon}
          onChange={(e) => guncelle("telefon", e.target.value.slice(0, 20))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, telefon: kayitSemasi.telefon(form.telefon) }))}
          placeholder="05XX XXX XX XX" autoComplete="tel" inputMode="tel" maxLength="20" required
          aria-invalid={Boolean(alanHatalari.telefon)} aria-describedby={alanHatalari.telefon ? "kayit-telefon-hata" : undefined} />
        {alanHatalari.telefon && <small id="kayit-telefon-hata" className="alan-hata">{alanHatalari.telefon}</small>}

        <label className="login-etiket">{t("register.password")}</label>
        <div className="sifre-alani">
          <input type={sifreGorunur ? "text" : "password"} className="login-input" value={form.sifre}
            onChange={(e) => guncelle("sifre", e.target.value.slice(0, 72))}
            onBlur={() => setAlanHatalari((o) => ({ ...o, sifre: kayitSemasi.sifre(form.sifre) }))}
            placeholder={t("register.passwordPlaceholder")} autoComplete="new-password" minLength="8" maxLength="72" required
            aria-invalid={Boolean(alanHatalari.sifre)} aria-describedby={alanHatalari.sifre ? "kayit-sifre-hata" : undefined} />
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={sifreGorunur ? t("login.hidePassword") : t("login.showPassword")} title={sifreGorunur ? t("login.hidePassword") : t("login.showPassword")}>
            {sifreGorunur ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {alanHatalari.sifre && <small id="kayit-sifre-hata" className="alan-hata alan-hata--sifre">{alanHatalari.sifre}</small>}

        <label className="login-etiket">{t("register.inviteCode")} <span className="istege-bagli">({t("register.optional")})</span></label>
        <input className="login-input davet-kodu-input" value={form.davetKodu}
          onChange={(e) => guncelle("davetKodu", davetKoduTemizle(e.target.value))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, davetKodu: kayitSemasi.davetKodu(form.davetKodu) }))}
          placeholder={t("register.invitePlaceholder")} autoComplete="off" inputMode="text" maxLength="8"
          aria-invalid={Boolean(alanHatalari.davetKodu)} aria-describedby="kayit-davet-aciklama" />
        {alanHatalari.davetKodu
          ? <small className="alan-hata">{alanHatalari.davetKodu}</small>
          : <small id="kayit-davet-aciklama" className="alan-yardim">{t("register.inviteHint")}</small>}

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn"
          disabled={yukleniyor}>
          {yukleniyor ? t("register.saving") : t("register.title")}
        </button>
      </form>

      <p className="login-kayit-yonlendir">
        {t("register.haveAccount")} {" "}
        <button className="login-kayit-link" onClick={() => git("/")}>{t("login.title")}</button>
      </p>
    </div>
  );
}
