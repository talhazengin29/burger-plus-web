import { useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion } from "framer-motion";
import { sifirlamaTalep } from "../lib/authApi";
import { IconCheck } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar } from "../lib/dogrulama";
import MarkaLogosu from "../components/MarkaLogosu";
import { useDil } from "../dil/DilContext";
import "./Login.css";

export default function SifremiUnuttum() {
  const git = useIsletmeNavigate();
  const { t } = useDil();
  const [email, setEmail] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    const hatalar = formuDogrula({ email }, { email: (deger) => kurallar.email(deger) ? t("passwordReset.invalidEmail") : "" });
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata(t("passwordReset.invalidEmail"));
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await sifirlamaTalep(emailTemizle(email));
      if (sonuc?.hata) setHata(sonuc.hata);
      else setGonderildi(true);
    } catch {
      setHata(t("passwordReset.serverError"));
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="ekran login">
      <motion.div
        className="login-ust"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <MarkaLogosu className="login-logo" />
        <p className="login-slogan">{t("passwordReset.forgotSlogan")}</p>
      </motion.div>

      {gonderildi ? (
        <motion.div
          className="login-form sifirlama-basari"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <span className="sifirlama-basari-ikon"><IconCheck /></span>
          <h2 className="login-baslik">{t("passwordReset.linkSent")}</h2>
          <p className="sifirlama-basari-metin">
            {t("passwordReset.linkSentText")}
          </p>
        </motion.div>
      ) : (
        <motion.form
          className="login-form"
          onSubmit={gonder}
          noValidate
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <h2 className="login-baslik">{t("passwordReset.title")}</h2>
          <p className="sifirlama-aciklama">{t("passwordReset.intro")}</p>

          <label className="login-etiket">{t("login.email")}</label>
          <input
            type="email"
            className="login-input"
            value={email}
            onChange={(e) => { setEmail(e.target.value.slice(0, 254)); setHata(""); setAlanHatalari((o) => ({ ...o, email: "" })); }}
            onBlur={() => setAlanHatalari((o) => ({ ...o, email: kurallar.email(email) ? t("passwordReset.invalidEmail") : "" }))}
            placeholder={t("login.emailPlaceholder")}
            autoComplete="email"
            maxLength="254"
            autoFocus
            required
            aria-invalid={Boolean(alanHatalari.email)}
            aria-describedby={alanHatalari.email ? "sifirlama-email-hata" : undefined}
          />
          {alanHatalari.email && <small id="sifirlama-email-hata" className="alan-hata">{alanHatalari.email}</small>}

          {hata && <p className="login-hata">{hata}</p>}

          <button type="submit" className="login-giris-btn" disabled={yukleniyor}>
            {yukleniyor ? t("passwordReset.sending") : t("passwordReset.sendLink")}
          </button>
        </motion.form>
      )}

      <motion.p
        className="login-kayit-yonlendir"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <button className="login-kayit-link" onClick={() => git("/")}>
          {t("passwordReset.backToLogin")}
        </button>
      </motion.p>
    </div>
  );
}
