import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { kayitOl, tokeniKaydet } from "../lib/authApi";
import { IconBack } from "../components/Icons";
import "./Login.css";

export default function Kayit() {
  const git = useNavigate();
  const { girisiTamamla } = useApp();
  const [form, setForm] = useState({
    ad: "", soyad: "", cinsiyet: "", email: "", telefon: "", sifre: "",
  });
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const guncelle = (alan, deger) => {
    setForm((f) => ({ ...f, [alan]: deger }));
    setHata("");
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    setYukleniyor(true);
    try {
      const sonuc = await kayitOl(form);
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        tokeniKaydet(sonuc.token);
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
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git("/")} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Kayıt Ol</h1>
        <span className="alt-header-bosluk" />
      </header>

      <form className="login-form kayit-form" onSubmit={gonder}>
        <div className="kayit-ikili">
          <div className="kayit-alan">
            <label className="login-etiket">Ad</label>
            <input className="login-input" value={form.ad}
              onChange={(e) => guncelle("ad", e.target.value)} placeholder="Adın" />
          </div>
          <div className="kayit-alan">
            <label className="login-etiket">Soyad</label>
            <input className="login-input" value={form.soyad}
              onChange={(e) => guncelle("soyad", e.target.value)} placeholder="Soyadın" />
          </div>
        </div>

        <label className="login-etiket">Cinsiyet</label>
        <div className="cinsiyet-secim">
          {["Kadın", "Erkek", "Diğer"].map((c) => (
            <button type="button" key={c}
              className={"cinsiyet-btn " + (form.cinsiyet === c ? "cinsiyet-btn--aktif" : "")}
              onClick={() => guncelle("cinsiyet", c)}>
              {c}
            </button>
          ))}
        </div>

        <label className="login-etiket">E-posta</label>
        <input type="email" className="login-input" value={form.email}
          onChange={(e) => guncelle("email", e.target.value)}
          placeholder="ornek@eposta.com" autoComplete="email" />

        <label className="login-etiket">Telefon</label>
        <input type="tel" className="login-input" value={form.telefon}
          onChange={(e) => guncelle("telefon", e.target.value)}
          placeholder="05XX XXX XX XX" autoComplete="tel" />

        <label className="login-etiket">Şifre</label>
        <input type="password" className="login-input" value={form.sifre}
          onChange={(e) => guncelle("sifre", e.target.value)}
          placeholder="En az 6 karakter" autoComplete="new-password" />

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn"
          disabled={yukleniyor || !form.ad || !form.soyad || !form.email || !form.sifre}>
          {yukleniyor ? "Kaydediliyor..." : "Kayıt Ol"}
        </button>
      </form>

      <p className="login-kayit-yonlendir">
        Zaten hesabın var mı?{" "}
        <button className="login-kayit-link" onClick={() => git("/")}>Giriş Yap</button>
      </p>
    </div>
  );
}
