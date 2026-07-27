import { useState } from "react";
import "./Login.css";

// Rol şifreleri. Gerçek üründe backend'de doğrulanmalı; şimdilik istemcide.
const SIFRELER = {
  mutfak: "1234",
  salon: "5678",
};

export default function Login({ onGirisBasarili }) {
  const [rol, setRol] = useState("mutfak");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");

  const gonder = (e) => {
    e.preventDefault();
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
        </div>

        <label className="login-etiket">
          {rol === "mutfak" ? "Mutfak Şifresi" : "Salon Şifresi"}
        </label>
        <input
          type="password"
          className="login-input"
          value={sifre}
          onChange={(e) => { setSifre(e.target.value); setHata(""); }}
          autoFocus
          placeholder="••••"
        />
        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-btn" disabled={!sifre}>
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
