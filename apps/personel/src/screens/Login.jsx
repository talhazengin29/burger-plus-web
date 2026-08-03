import { useEffect, useState } from "react";
import { adminGiris, personelGiris, personelIkiFaktorGirisiniTamamla, ilkYerelAdminOlustur, yerelAdminDurumu } from "../lib/adminApi";
import { useIsletme } from "../context/IsletmeContext";
import BurgerPlusLogosu from "../../../musteri/src/components/BurgerPlusLogosu";
import "./Login.css";

function PersonelMarkasi() {
  const { isletme, isletmeSlug } = useIsletme();
  const yukluLogo = isletme.tema?.logoUrl || isletme.logoUrl || "";

  return (
    <div className="personel-login-ust">
      {yukluLogo
        ? <img className="login-logo login-logo--yuklu" src={yukluLogo} alt={isletme.ad} />
        : isletmeSlug === "burger-plus"
          ? <BurgerPlusLogosu className="login-logo" alt={isletme.ad} />
          : <strong className="login-logo-metin">{isletme.ad}</strong>}
      <span>EKİP PORTALI</span>
    </div>
  );
}

export default function Login({ onGirisBasarili }) {
  const { isletme } = useIsletme();
  const [rol, setRol] = useState("mutfak");
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [email, setEmail] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [adminKurulumGoster, setAdminKurulumGoster] = useState(false);
  const [ikiFaktorToken, setIkiFaktorToken] = useState("");
  const [ikiFaktorKodu, setIkiFaktorKodu] = useState("");

  useEffect(() => {
    if (rol !== "admin") return;
    yerelAdminDurumu().then(setAdminKurulumGoster).catch(() => {});
  }, [rol]);

  const gonder = async (e) => {
    e.preventDefault();
    setYukleniyor(true);
    setHata("");
    try {
      if (ikiFaktorToken) {
        await personelIkiFaktorGirisiniTamamla(ikiFaktorToken, ikiFaktorKodu, rol);
      } else {
        const sonuc = rol === "admin"
          ? await adminGiris(email, sifre)
          : await personelGiris(email, sifre, rol);
        if (sonuc?.ikiFaktorGerekli) {
          setIkiFaktorToken(sonuc.ikiFaktorToken);
          setSifre("");
          return;
        }
      }
      onGirisBasarili(rol);
    } catch (err) {
      setHata(err.message);
      setSifre("");
      if (rol === "admin") setAdminKurulumGoster(true);
    } finally {
      setYukleniyor(false);
    }
  };

  const ilkAdminiKur = async () => {
    setYukleniyor(true);
    setHata("");
    try {
      await ilkYerelAdminOlustur(email, sifre);
      await adminGiris(email, sifre);
      onGirisBasarili("admin");
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  };

  if (ikiFaktorToken) {
    return (
      <div className="login">
        <form className="login-kart" onSubmit={gonder}>
          <PersonelMarkasi />
          <h1 className="login-baslik">Güvenlik Kodu</h1>
          <p className="login-alt">Authenticator kodunu veya kurtarma kodunu gir</p>
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
          <button type="submit" className="login-btn" disabled={!ikiFaktorKodu || yukleniyor}>{yukleniyor ? "Doğrulanıyor…" : "Kodu Doğrula"}</button>
          <button type="button" className="login-kurulum-btn" onClick={() => { setIkiFaktorToken(""); setIkiFaktorKodu(""); setHata(""); }}>Şifre ekranına dön</button>
        </form>
      </div>
    );
  }

  return (
    <div className="login">
      <form className="login-kart" onSubmit={gonder}>
        <PersonelMarkasi />
        <h1 className="login-baslik">{isletme.ad}</h1>
        <p className="login-alt">Personel Girişi</p>

        <div className="rol-secim">
          <button type="button" className={`rol-btn ${rol === "mutfak" ? "rol-btn--aktif" : ""}`} onClick={() => { setRol("mutfak"); setHata(""); }}>Mutfak</button>
          <button type="button" className={`rol-btn ${rol === "salon" ? "rol-btn--aktif" : ""}`} onClick={() => { setRol("salon"); setHata(""); }}>Salon</button>
          <button type="button" className={`rol-btn ${rol === "admin" ? "rol-btn--aktif" : ""}`} onClick={() => { setRol("admin"); setHata(""); }}>Yönetim</button>
        </div>

        <label className="login-etiket">E-posta</label>
        <input
          type="email"
          className="login-input login-input--email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setHata(""); }}
          autoFocus
          placeholder={rol === "admin" ? "admin@isletme.com" : "personel@isletme.com"}
        />

        <label className="login-etiket">
          {rol === "mutfak" ? "Mutfak Şifresi" : rol === "salon" ? "Salon Şifresi" : "Yönetici Şifresi"}
        </label>
        <div className="sifre-alani">
          <input
            type={sifreGorunur ? "text" : "password"}
            className="login-input"
            value={sifre}
            onChange={(e) => { setSifre(e.target.value); setHata(""); }}
            autoFocus={rol !== "admin"}
            placeholder="••••"
          />
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"} title={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}>
            <GozIkonu kapali={sifreGorunur} />
          </button>
        </div>
        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-btn" disabled={!sifre || !email || yukleniyor}>
          {yukleniyor ? "Doğrulanıyor…" : "Giriş Yap"}
        </button>
        {rol === "admin" && adminKurulumGoster && (
          <button type="button" className="login-kurulum-btn" onClick={ilkAdminiKur} disabled={!email || sifre.length < 8 || yukleniyor}>
            İlk yerel yöneticiyi oluştur
          </button>
        )}
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
