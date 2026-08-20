import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { girisGenel, ikiFaktorGirisiniTamamlaGenel, ilkSifreBelirle } from "../lib/adminApi";
import { ROL_EKRANI } from "../lib/roller";
import DilSecici from "../components/DilSecici";
import "./Login.css";

/*
  Tek panelden giriş: hangi işletmeye ait olduğun URL'den değil, girdiğin
  e-postadan bulunur (bkz. adminApi.js#girisGenel, backend /api/giris-genel).
  Bu yüzden burada belirli bir işletmenin logosu/teması YOK — birden fazla
  restoranın personeli aynı ekrandan girer, her biri kendi paneline düşer.
*/
function GenelMarka() {
  const { t } = useTranslation();
  return (
    <div className="personel-login-ust">
      <strong className="login-logo-metin">{t("login.staffLogin")}</strong>
      <span>{t("login.allBusinesses")}</span>
    </div>
  );
}

export default function GenelGiris() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [email, setEmail] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ikiFaktorToken, setIkiFaktorToken] = useState("");
  const [ikiFaktorKodu, setIkiFaktorKodu] = useState("");
  const [isletmeSlug, setIsletmeSlug] = useState("");
  const [gecisToken, setGecisToken] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState("");
  const [sifremiUnuttumGoster, setSifremiUnuttumGoster] = useState(false);

  const paneleGit = (sonuc) => {
    const ekran = ROL_EKRANI[sonuc.kullanici?.rol];
    const yol = ekran === "admin" ? "yonetim/genel-bakis" : ekran;
    navigate(`/${sonuc.isletmeSlug}${yol ? `/${yol}` : ""}`, { replace: true });
  };

  const gonder = async (e) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");
    try {
      if (gecisToken) {
        if (yeniSifre.length < 8) { setHata(t("login.passwordTooShort")); return; }
        if (yeniSifre !== yeniSifreTekrar) { setHata(t("login.passwordsMismatch")); return; }
        const sonuc = await ilkSifreBelirle(gecisToken, yeniSifre, isletmeSlug);
        paneleGit({ kullanici: sonuc, isletmeSlug });
        return;
      }
      if (ikiFaktorToken) {
        const sonuc = await ikiFaktorGirisiniTamamlaGenel(ikiFaktorToken, ikiFaktorKodu, isletmeSlug);
        paneleGit(sonuc);
        return;
      }
      const sonuc = await girisGenel(email, sifre);
      if (sonuc.sifreDegisimGerekli) {
        setIsletmeSlug(sonuc.isletmeSlug);
        setGecisToken(sonuc.gecisToken);
        setSifre("");
        return;
      }
      if (sonuc.ikiFaktorGerekli) {
        setIsletmeSlug(sonuc.isletmeSlug);
        setIkiFaktorToken(sonuc.ikiFaktorToken);
        setSifre("");
        return;
      }
      paneleGit(sonuc);
    } catch (err) {
      setHata(err.message);
      setSifre("");
    } finally {
      setYukleniyor(false);
    }
  };

  if (gecisToken) {
    return (
      <div className="login">
        <DilSecici sade />
        <form className="login-kart" onSubmit={gonder}>
          <GenelMarka />
          <h1 className="login-baslik">{t("login.newPasswordTitle")}</h1>
          <p className="login-alt">{t("login.newPasswordHelp")}</p>

          <label className="login-etiket">{t("login.newPassword")}</label>
          <input
            type="password"
            className="login-input"
            value={yeniSifre}
            onChange={(e) => { setYeniSifre(e.target.value); setHata(""); }}
            placeholder={t("login.minEight")}
            autoFocus
          />

          <label className="login-etiket">{t("login.repeatPassword")}</label>
          <input
            type="password"
            className="login-input"
            value={yeniSifreTekrar}
            onChange={(e) => { setYeniSifreTekrar(e.target.value); setHata(""); }}
            placeholder={t("login.enterAgain")}
          />
          {hata && <p className="login-hata">{hata}</p>}
          <button type="submit" className="login-btn" disabled={yeniSifre.length < 8 || !yeniSifreTekrar || yukleniyor}>{t(yukleniyor ? "login.saving" : "login.savePassword")}</button>
          <button type="button" className="login-kurulum-btn" onClick={() => { setGecisToken(""); setYeniSifre(""); setYeniSifreTekrar(""); setHata(""); }}>{t("login.backToPassword")}</button>
        </form>
      </div>
    );
  }

  if (ikiFaktorToken) {
    return (
      <div className="login">
        <DilSecici sade />
        <form className="login-kart" onSubmit={gonder}>
          <GenelMarka />
          <h1 className="login-baslik">{t("login.securityCode")}</h1>
          <p className="login-alt">{t("login.securityCodeHelp")}</p>
          <input
            className="login-input login-2fa-input"
            value={ikiFaktorKodu}
            onChange={(e) => { setIkiFaktorKodu(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11)); setHata(""); }}
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="123456"
            autoFocus
          />
          {hata && <p className="login-hata">{hata}</p>}
          <button type="submit" className="login-btn" disabled={!ikiFaktorKodu || yukleniyor}>{t(yukleniyor ? "login.verifying" : "login.verifyCode")}</button>
          <button type="button" className="login-kurulum-btn" onClick={() => { setIkiFaktorToken(""); setIkiFaktorKodu(""); setHata(""); }}>{t("login.backToPassword")}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="login">
      <DilSecici sade />
      <form className="login-kart" onSubmit={gonder}>
        <GenelMarka />
        <p className="login-alt">{t("login.businessEmailHint")}</p>

        <label className="login-etiket">{t("login.email")}</label>
        <input
          type="email"
          className="login-input login-input--email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setHata(""); }}
          autoFocus
          placeholder="personel@isletme.com"
        />

        <label className="login-etiket">{t("login.password")}</label>
        <div className="sifre-alani">
          <input
            type={sifreGorunur ? "text" : "password"}
            className="login-input"
            value={sifre}
            onChange={(e) => { setSifre(e.target.value); setHata(""); }}
            placeholder="••••"
          />
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={t(sifreGorunur ? "login.hidePassword" : "login.showPassword")} title={t(sifreGorunur ? "login.hidePassword" : "login.showPassword")}>
            <GozIkonu kapali={sifreGorunur} />
          </button>
        </div>
        {hata && <p className="login-hata">{hata}</p>}

        <button type="button" className="login-sifremi-unuttum" onClick={() => setSifremiUnuttumGoster((onceki) => !onceki)}>{t("login.forgotPassword")}</button>
        {sifremiUnuttumGoster && (
          <p className="login-bilgi">{t("login.forgotPasswordHelp")}</p>
        )}

        <button type="submit" className="login-btn" disabled={!sifre || !email || yukleniyor}>
          {t(yukleniyor ? "login.verifying" : "login.signIn")}
        </button>
      </form>
    </div>
  );
}

function GozIkonu({ kapali }) {
  return kapali ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.3A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.1 3.7M6.2 6.5A17.2 17.2 0 0 0 2.5 12S6 18 12 18c1.4 0 2.7-.3 3.8-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="2.8" /></svg>
  );
}
