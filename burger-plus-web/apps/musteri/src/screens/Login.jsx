import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { girisYap, tokeniKaydet } from "../lib/authApi";
import logoFull from "../assets/logo-full.png";
import "./Login.css";

export default function Login() {
  const git = useNavigate();
  const { girisiTamamla, kullanici, authYuklendi, setMisafir } = useApp();
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [beniHatirla, setBeniHatirla] = useState(true);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // Zaten giriş yapılmışsa ana sayfaya yönlendir (F5 sonrası oturum korunur)
  useEffect(() => {
    if (authYuklendi && kullanici) git("/anasayfa", { replace: true });
  }, [authYuklendi, kullanici, git]);

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    try {
      const sonuc = await girisYap(email, sifre);
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
          onChange={(e) => { setEmail(e.target.value); setHata(""); }}
          placeholder="ornek@eposta.com"
          autoComplete="email"
        />

        <label className="login-etiket">Şifre</label>
        <input
          type="password"
          className="login-input"
          value={sifre}
          onChange={(e) => { setSifre(e.target.value); setHata(""); }}
          placeholder="••••••"
          autoComplete="current-password"
        />

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

        <button type="submit" className="login-giris-btn" disabled={yukleniyor || !email || !sifre}>
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
