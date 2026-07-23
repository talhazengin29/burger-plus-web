import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconBack } from "../components/Icons";
import "./Login.css";
import "./ProfilDuzenle.css";

/*
  Profil düzenleme. Kullanıcı e-posta ve telefonunu değiştirebilir.
  Ad, soyad, cinsiyet KALICI (değiştirilemez, salt-okunur gösterilir).
*/
export default function ProfilDuzenle() {
  const git = useNavigate();
  const { kullanici, profiliGuncelle } = useApp();

  const [email, setEmail] = useState(kullanici?.email || "");
  const [telefon, setTelefon] = useState(kullanici?.telefon || "");
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Giriş yapılmamışsa profile geri gönder
  if (!kullanici) {
    git("/profil");
    return null;
  }

  const kaydet = async (e) => {
    e.preventDefault();
    setHata(""); setBasari(false); setYukleniyor(true);
    try {
      const sonuc = await profiliGuncelle(email, telefon);
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        setBasari(true);
        setTimeout(() => git("/profil"), 900);
      }
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="ekran login">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git("/profil")} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Profili Düzenle</h1>
        <span className="alt-header-bosluk" />
      </header>

      <form className="login-form kayit-form" onSubmit={kaydet}>
        {/* Kalıcı bilgiler — salt okunur */}
        <div className="pd-kilitli-blok">
          <div className="pd-kilitli-baslik">
            <span>Hesap Bilgileri</span>
            <span className="pd-kilit">🔒 Değiştirilemez</span>
          </div>
          <div className="pd-kilitli-satir">
            <span className="pd-etiket">Ad Soyad</span>
            <span className="pd-deger">{kullanici.ad} {kullanici.soyad}</span>
          </div>
          <div className="pd-kilitli-satir">
            <span className="pd-etiket">Cinsiyet</span>
            <span className="pd-deger">{kullanici.cinsiyet || "—"}</span>
          </div>
        </div>

        {/* Düzenlenebilir */}
        <label className="login-etiket">E-posta</label>
        <input type="email" className="login-input" value={email}
          onChange={(e) => { setEmail(e.target.value); setHata(""); }}
          placeholder="ornek@eposta.com" autoComplete="email" />

        <label className="login-etiket">Telefon</label>
        <input type="tel" className="login-input" value={telefon}
          onChange={(e) => { setTelefon(e.target.value); setHata(""); }}
          placeholder="05XX XXX XX XX" autoComplete="tel" />

        {hata && <p className="login-hata">{hata}</p>}
        {basari && <p className="pd-basari">✓ Bilgilerin güncellendi</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor || !email}>
          {yukleniyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
