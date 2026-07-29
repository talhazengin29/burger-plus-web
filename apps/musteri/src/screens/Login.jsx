import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { girisYap, tokeniKaydet } from "../lib/authApi";
import { IconEye, IconEyeOff } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar } from "../lib/dogrulama";
import logoFull from "../assets/logo-full.png";
import "./Login.css";

export default function Login() {
  const git = useNavigate();
  const { girisiTamamla, kullanici, authYuklendi, setMisafir } = useApp();
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [yukleniyor, setYukleniyor] = useState(false);

  // Zaten giriş yapılmışsa ana sayfaya yönlendir (F5 sonrası oturum korunur)
  useEffect(() => {
    if (authYuklendi && kullanici) git("/anasayfa", { replace: true });
  }, [authYuklendi, kullanici, git]);

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    const hatalar = formuDogrula({ email, sifre }, {
      email: kurallar.email,
      sifre: kurallar.girisSifresi,
    });
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata("Lütfen işaretli alanları kontrol et.");
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await girisYap(emailTemizle(email), sifre);
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        tokeniKaydet(sonuc.token, beniHatirla);
        girisiTamamla(sonuc.kullanici);
        git("/anasayfa");
      }
    } catch {
      setHata("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
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
        <img className="login-logo" src={logoFull} alt="Burger Plus" />
        <p className="login-slogan">Lezzet ve puanlar seni bekliyor</p>
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
        <h2 className="login-baslik">Giriş Yap</h2>

        <label className="login-etiket">E-posta</label>
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

        <label className="login-etiket">Şifre</label>
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
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"} title={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}>
            {sifreGorunur ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {alanHatalari.sifre && <small id="login-sifre-hata" className="alan-hata alan-hata--sifre">{alanHatalari.sifre}</small>}

        {/* Beni hatırla */}
        <label className="beni-hatirla">
          <input
            type="checkbox"
            checked={beniHatirla}
            onChange={(e) => setBeniHatirla(e.target.checked)}
          />
          <span>Beni hatırla</span>
        </label>

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor}>
          {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </motion.form>

      {/* Alt linkler — gecikmeli fade */}
      <motion.p
        className="login-kayit-yonlendir"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Hesabın yok mu?{" "}
        <button className="login-kayit-link" onClick={() => git("/kayit")}>
          Kayıt Ol
        </button>
      </motion.p>

      <motion.button
        className="login-misafir-link"
        onClick={() => { setMisafir(true); git("/anasayfa"); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Misafir olarak devam et
      </motion.button>
    </div>
  );
}
