import { useState } from "react";
import { adminGiris } from "../lib/adminApi";
import "./Login.css";

// Rol şifreleri. Gerçek üründe backend'de doğrulanmalı; şimdilik istemcide.
const SIFRELER = {
  mutfak: "1234",
  salon: "5678",
};

export default function Login({ onGirisBasarili }) {
  const [rol, setRol] = useState("mutfak");
  const [sifre, setSifre] = useState("");
  const [email, setEmail] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const gonder = async (e) => {
    e.preventDefault();
    if (rol === "admin") {
      setYukleniyor(true);
      try {
        await adminGiris(email, sifre);
        onGirisBasarili("admin");
      } catch (err) {
        setHata(err.message);
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

  return (
    <div className="login">
      <form className="login-kart" onSubmit={gonder}>
        <div className="login-logo">🍔</div>
        <h1 className="login-baslik">Burger Plus</h1>
        <p className="login-alt">Personel Girişi</p>

        {/* Rol seçimi */}
        <div className="rol-secim">
          <button
            type="button"
            className={"rol-btn " + (rol === "mutfak" ? "rol-btn--aktif" : "")}
            onClick={() => { setRol("mutfak"); setHata(""); }}
          >
            🍳 Mutfak
          </button>
          <button
            type="button"
            className={"rol-btn " + (rol === "salon" ? "rol-btn--aktif" : "")}
            onClick={() => { setRol("salon"); setHata(""); }}
          >
            🍽️ Salon
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
        <input
          type="password"
          className="login-input"
          value={sifre}
          onChange={(e) => { setSifre(e.target.value); setHata(""); }}
          autoFocus={rol !== "admin"}
          placeholder="••••"
        />
        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-btn" disabled={!sifre || (rol === "admin" && !email) || yukleniyor}>
          {yukleniyor ? "Doğrulanıyor…" : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
