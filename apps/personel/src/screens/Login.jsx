import { useEffect, useState } from "react";
import { adminGiris, ilkYerelAdminOlustur, yerelAdminDurumu } from "../lib/adminApi";
import logoFull from "../../../musteri/src/assets/logo-full.png";
import "./Login.css";

// Rol şifreleri. Gerçek üründe backend'de doğrulanmalı; şimdilik istemcide.
const SIFRELER = {
  mutfak: "1234",
  salon: "5678",
};

export default function Login({ onGirisBasarili }) {
  const [rol, setRol] = useState("mutfak");
  const [sifre, setSifre] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [email, setEmail] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [adminKurulumGoster, setAdminKurulumGoster] = useState(false);

  useEffect(() => {
    if (rol !== "admin") return;
    yerelAdminDurumu().then(setAdminKurulumGoster).catch(() => {});
  }, [rol]);

  const gonder = async (e) => {
    e.preventDefault();
    if (rol === "admin") {
      setYukleniyor(true);
      try {
        await adminGiris(email, sifre);
        onGirisBasarili("admin");
      } catch (err) {
        setHata(err.message);
        setAdminKurulumGoster(true);
      } finally {
        setYukleniyor(false);
      }
      return;
    }
    if (sifre === SIFRELER[rol]) {
      onGirisBasarili(rol);
    } else {
      setHata("Şifre yanlış");
      setSifre("");
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

  return (
    <div className="login">
      <form className="login-kart" onSubmit={gonder}>
        <div className="personel-login-ust"><img className="login-logo" src={logoFull} alt="Burger Plus" /><span>EKİP PORTALI</span></div>
        <h1 className="login-baslik">Burger Plus</h1>
        <p className="login-alt">Personel Girişi</p>

        {/* Rol seçimi */}
        <div className="rol-secim">
          <button
            type="button"
            className={"rol-btn " + (rol === "mutfak" ? "rol-btn--aktif" : "")}
            onClick={() => { setRol("mutfak"); setHata(""); }}
          >
            Mutfak
          </button>
          <button
            type="button"
            className={"rol-btn " + (rol === "salon" ? "rol-btn--aktif" : "")}
            onClick={() => { setRol("salon"); setHata(""); }}
          >
            Salon
          </button>
          <button
            type="button"
            className={"rol-btn " + (rol === "admin" ? "rol-btn--aktif" : "")}
            onClick={() => { setRol("admin"); setHata(""); }}
          >
            Yönetim
          </button>
        </div>

        {rol === "admin" && (
          <>
            <label className="login-etiket">Yönetici E-postası</label>
            <input
              type="email"
              className="login-input login-input--email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setHata(""); }}
              autoFocus
              placeholder="admin@burgerplus.com"
            />
          </>
        )}
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

        <button type="submit" className="login-btn" disabled={!sifre || (rol === "admin" && !email) || yukleniyor}>
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
