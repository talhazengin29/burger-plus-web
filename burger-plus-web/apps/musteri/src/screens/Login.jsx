import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { girisYap, tokeniKaydet } from "../lib/authApi";
import logoFull from "../assets/logo-full.png";
import "./Login.css";

export default function Login() {
  const git = useNavigate();
  const { girisiTamamla, kullanici, authYuklendi } = useApp();
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
      <div className="login-ust">
        <img className="login-logo" src={logoFull} alt="Burger Plus" />
        <p className="login-slogan">Lezzet ve puanlar seni bekliyor</p>
      </div>

      <form className="login-form" onSubmit={gonder}>
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
      </form>

      <p className="login-kayit-yonlendir">
        Hesabın yok mu?{" "}
        <button className="login-kayit-link" onClick={() => git("/kayit")}>
          Kayıt Ol
        </button>
      </p>

      <button className="login-misafir-link" onClick={() => git("/anasayfa")}>
        Misafir olarak devam et
      </button>
    </div>
  );
}
