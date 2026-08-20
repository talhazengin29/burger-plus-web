import { useState, useEffect, useRef } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { girisYap, ikiFaktorGirisiniTamamla, tokeniKaydet } from "../lib/authApi";
import { IconEye, IconEyeOff } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar } from "../lib/dogrulama";
import { usePerde } from "../hooks/usePerde";
import MarkaLogosu from "../components/MarkaLogosu";
import { useTema } from "../context/TemaContext";
import { useTranslation } from "react-i18next";
import "./Login.css";

export default function Login() {
  const { t } = useTranslation();
  const { metinler, isletmeSlug } = useTema();
  const git = useIsletmeNavigate();
  const { girisiTamamla, kullanici, authYuklendi, setMisafir } = useApp();
  const { perdeAktif, perdeIleGit } = usePerde();
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [yukleniyor, setYukleniyor] = useState(false);
  const [ikiFaktorToken, setIkiFaktorToken] = useState("");
  const [ikiFaktorKodu, setIkiFaktorKodu] = useState("");
  const girisGecisiRef = useRef(false);

  // Zaten giriş yapılmışsa ana sayfaya yönlendir (F5 sonrası oturum korunur)
  useEffect(() => {
    if (authYuklendi && kullanici && !perdeAktif && !girisGecisiRef.current) git("/anasayfa", { replace: true });
  }, [authYuklendi, kullanici, perdeAktif, git]);

  const basariliGirisiTamamla = (sonuc) => {
    girisGecisiRef.current = true;
    tokeniKaydet(sonuc.token, beniHatirla);
    perdeIleGit(() => git("/anasayfa", { replace: true }), "normal");
    girisiTamamla(sonuc.kullanici);
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    if (ikiFaktorToken) {
      const temizKod = ikiFaktorKodu.trim();
      if (!/^\d{6}$/.test(temizKod) && !/^[A-HJ-NP-Z2-9]{5}-?[A-HJ-NP-Z2-9]{5}$/i.test(temizKod)) {
        setHata(t("login.invalidCode"));
        return;
      }
      setYukleniyor(true);
      try {
        const sonuc = await ikiFaktorGirisiniTamamla(ikiFaktorToken, temizKod);
        if (sonuc.hata) setHata(sonuc.hata);
        else {
          basariliGirisiTamamla(sonuc);
        }
      } catch {
        setHata(t("login.serverError"));
      } finally {
        setYukleniyor(false);
      }
      return;
    }
    const hatalar = formuDogrula({ email, sifre }, {
      email: kurallar.email,
      sifre: kurallar.girisSifresi,
    });
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata(t("login.checkFields"));
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await girisYap(emailTemizle(email), sifre);
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else if (sonuc.ikiFaktorGerekli) {
        setIkiFaktorToken(sonuc.ikiFaktorToken);
        setSifre("");
      } else {
        basariliGirisiTamamla(sonuc);
      }
    } catch {
      setHata(t("login.serverError"));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="ekran login">
      {/* Logo — yukarıdan fade */}
      <motion.div
        className="login-ust"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <MarkaLogosu className="login-logo" />
        <p className="login-slogan">{isletmeSlug === "burger-plus" ? t("login.slogan") : metinler.slogan}</p>
      </motion.div>

      {/* Form — aşağıdan yukarı kayarak gelir */}
      <motion.form
        className="login-form"
        onSubmit={gonder}
        noValidate
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <h2 className="login-baslik">{t(ikiFaktorToken ? "login.securityCode" : "login.title")}</h2>

        {ikiFaktorToken ? (
          <>
            <p className="login-2fa-aciklama">{t("login.securityHelp")}</p>
            <label className="login-etiket">{t("login.verificationCode")}</label>
            <input
              className="login-input login-2fa-input"
              value={ikiFaktorKodu}
              onChange={(e) => { setIkiFaktorKodu(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 11)); setHata(""); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              autoFocus
            />
            <button type="button" className="login-sifremi-unuttum" onClick={() => { setIkiFaktorToken(""); setIkiFaktorKodu(""); setHata(""); }}>
              {t("login.backToPassword")}
            </button>
          </>
        ) : (
          <>

        <label className="login-etiket">{t("login.email")}</label>
        <input
          type="email"
          className="login-input"
          value={email}
          onChange={(e) => { setEmail(e.target.value.slice(0, 254)); setHata(""); setAlanHatalari((o) => ({ ...o, email: "" })); }}
          onBlur={() => setAlanHatalari((o) => ({ ...o, email: kurallar.email(email) }))}
          placeholder="ornek@eposta.com"
          autoComplete="email"
          maxLength="254"
          required
          aria-invalid={Boolean(alanHatalari.email)}
          aria-describedby={alanHatalari.email ? "login-email-hata" : undefined}
        />
        {alanHatalari.email && <small id="login-email-hata" className="alan-hata">{alanHatalari.email}</small>}

        <label className="login-etiket">{t("login.password")}</label>
        <div className="sifre-alani">
          <input
            type={sifreGorunur ? "text" : "password"}
            className="login-input"
            value={sifre}
            onChange={(e) => { setSifre(e.target.value.slice(0, 72)); setHata(""); setAlanHatalari((o) => ({ ...o, sifre: "" })); }}
            onBlur={() => setAlanHatalari((o) => ({ ...o, sifre: kurallar.girisSifresi(sifre) }))}
            placeholder="••••••"
            autoComplete="current-password"
            maxLength="72"
            required
            aria-invalid={Boolean(alanHatalari.sifre)}
            aria-describedby={alanHatalari.sifre ? "login-sifre-hata" : undefined}
          />
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={t(sifreGorunur ? "login.hidePassword" : "login.showPassword")} title={t(sifreGorunur ? "login.hidePassword" : "login.showPassword")}>
            {sifreGorunur ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {alanHatalari.sifre && <small id="login-sifre-hata" className="alan-hata alan-hata--sifre">{alanHatalari.sifre}</small>}

        <button type="button" className="login-sifremi-unuttum" onClick={() => git("/sifremi-unuttum")}>
          {t("login.forgotPassword")}
        </button>

        {/* Beni hatırla */}
        <label className="beni-hatirla">
          <input
            type="checkbox"
            checked={beniHatirla}
            onChange={(e) => setBeniHatirla(e.target.checked)}
          />
          <span>{t("login.rememberMe")}</span>
        </label>
          </>
        )}

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor}>
          {t(yukleniyor ? "login.verifying" : ikiFaktorToken ? "login.verifyCode" : "login.title")}
        </button>
      </motion.form>

      {/* Alt linkler — gecikmeli fade */}
      <motion.p
        className="login-kayit-yonlendir"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {t("login.noAccount")} {" "}
        <button className="login-kayit-link" onClick={() => git("/kayit")}>
          {t("login.register")}
        </button>
      </motion.p>

      <motion.button
        className="login-misafir-link"
        onClick={() => { setMisafir(true); perdeIleGit(() => git("/anasayfa"), "normal"); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {t("login.guest")}
      </motion.button>
    </div>
  );
}
