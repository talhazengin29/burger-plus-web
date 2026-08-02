import { useState, useEffect } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { girisYap, ikiFaktorGirisiniTamamla, tokeniKaydet } from "../lib/authApi";
import { IconEye, IconEyeOff } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar } from "../lib/dogrulama";
import { usePerde } from "../hooks/usePerde";
import logoFull from "../assets/logo-full-transparent.png";
import "./Login.css";

export default function Login() {
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

  // Zaten giriş yapılmışsa ana sayfaya yönlendir (F5 sonrası oturum korunur)
  useEffect(() => {
    if (authYuklendi && kullanici && !perdeAktif) git("/anasayfa", { replace: true });
  }, [authYuklendi, kullanici, perdeAktif, git]);

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    if (ikiFaktorToken) {
      const temizKod = ikiFaktorKodu.trim();
      if (!/^\d{6}$/.test(temizKod) && !/^[A-HJ-NP-Z2-9]{5}-?[A-HJ-NP-Z2-9]{5}$/i.test(temizKod)) {
        setHata("6 haneli doğrulama kodunu veya kurtarma kodunu gir.");
        return;
      }
      setYukleniyor(true);
      try {
        const sonuc = await ikiFaktorGirisiniTamamla(ikiFaktorToken, temizKod);
        if (sonuc.hata) setHata(sonuc.hata);
        else {
          tokeniKaydet(sonuc.token, beniHatirla);
          girisiTamamla(sonuc.kullanici);
          perdeIleGit(() => git("/anasayfa"), "normal");
        }
      } catch {
        setHata("Sunucuya ulaşılamadı. Lütfen tekrar dene.");
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
      setHata("Lütfen işaretli alanları kontrol et.");
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
        tokeniKaydet(sonuc.token, beniHatirla);
        girisiTamamla(sonuc.kullanici);
        perdeIleGit(() => git("/anasayfa"), "normal");
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
        <h2 className="login-baslik">{ikiFaktorToken ? "Güvenlik Kodu" : "Giriş Yap"}</h2>

        {ikiFaktorToken ? (
          <>
            <p className="login-2fa-aciklama">Authenticator uygulamandaki 6 haneli kodu gir. Telefonuna erişemiyorsan kurtarma kodlarından birini kullanabilirsin.</p>
            <label className="login-etiket">Doğrulama kodu</label>
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
              Şifre ekranına dön
            </button>
          </>
        ) : (
          <>

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

        <button type="button" className="login-sifremi-unuttum" onClick={() => git("/sifremi-unuttum")}>
          Şifremi unuttum
        </button>

        {/* Beni hatırla */}
        <label className="beni-hatirla">
          <input
            type="checkbox"
            checked={beniHatirla}
            onChange={(e) => setBeniHatirla(e.target.checked)}
          />
          <span>Beni hatırla</span>
        </label>
          </>
        )}

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor}>
          {yukleniyor ? "Doğrulanıyor..." : ikiFaktorToken ? "Kodu Doğrula" : "Giriş Yap"}
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
        onClick={() => { setMisafir(true); perdeIleGit(() => git("/anasayfa"), "normal"); }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Misafir olarak devam et
      </motion.button>
    </div>
  );
}
