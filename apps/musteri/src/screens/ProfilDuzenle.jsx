import { useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { IconBack } from "../components/Icons";
import { emailTemizle, formuDogrula, ilkHata, kurallar, telefonTemizle } from "../lib/dogrulama";
import "./Login.css";
import "./ProfilDuzenle.css";

/*
  Profil düzenleme. Kullanıcı e-posta ve telefonunu değiştirebilir.
  Ad, soyad, cinsiyet KALICI (değiştirilemez, salt-okunur gösterilir).
*/
export default function ProfilDuzenle() {
  const git = useIsletmeNavigate();
  const { kullanici, profiliGuncelle, avatar, avatarGuncelle } = useApp();

  const [email, setEmail] = useState(kullanici?.email || "");
  const [telefon, setTelefon] = useState(kullanici?.telefon || "");
  const [avatarTaslak, setAvatarTaslak] = useState(avatar);
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [basari, setBasari] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  // Giriş yapılmamışsa profile geri gönder
  if (!kullanici) {
    git("/profil");
    return null;
  }

  const kaydet = async (e) => {
    e.preventDefault();
    setHata(""); setBasari(false);
    const hatalar = formuDogrula({ email, telefon }, {
      email: kurallar.email,
      telefon: (deger) => kurallar.telefon(deger, false),
    });
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata("Lütfen işaretli alanları kontrol et.");
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await profiliGuncelle(emailTemizle(email), telefonTemizle(telefon));
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        avatarGuncelle(avatarTaslak);
        setBasari(true);
        setTimeout(() => git("/profil"), 900);
      }
    } catch {
      setHata("Sunucuya ulaşılamadı.");
    } finally {
      setYukleniyor(false);
    }
  };

  const avatarSecildi = (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!dosya.type.startsWith("image/") || dosya.size > 1_500_000) {
      setHata("Lütfen 1,5 MB'tan küçük bir görsel seç.");
      return;
    }
    const okuyucu = new FileReader();
    okuyucu.onload = () => { setAvatarTaslak(String(okuyucu.result)); setHata(""); };
    okuyucu.readAsDataURL(dosya);
  };

  return (
    <div className="ekran login">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git("/profil")} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Profili Düzenle</h1>
        <span className="alt-header-bosluk" />
      </header>

      <form className="login-form kayit-form" onSubmit={kaydet} noValidate>
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

        <div className="avatar-duzenle-alani">
          {avatarTaslak ? <img src={avatarTaslak} alt="Profil önizleme" /> : <span>{kullanici.ad.charAt(0).toUpperCase()}</span>}
          <div><b>Profil görseli</b><small>JPG, PNG veya WebP · en fazla 1,5 MB</small><label><input type="file" accept="image/*" onChange={avatarSecildi} />Görsel seç</label>{avatarTaslak && <button type="button" onClick={() => setAvatarTaslak(null)}>Görseli kaldır</button>}</div>
        </div>

        {/* Düzenlenebilir */}
        <label className="login-etiket">E-posta</label>
        <input type="email" className="login-input" value={email}
          onChange={(e) => { setEmail(e.target.value.slice(0, 254)); setHata(""); setAlanHatalari((o) => ({ ...o, email: "" })); }}
          onBlur={() => setAlanHatalari((o) => ({ ...o, email: kurallar.email(email) }))}
          placeholder="ornek@eposta.com" autoComplete="email" maxLength="254" required
          aria-invalid={Boolean(alanHatalari.email)} aria-describedby={alanHatalari.email ? "profil-email-hata" : undefined} />
        {alanHatalari.email && <small id="profil-email-hata" className="alan-hata">{alanHatalari.email}</small>}

        <label className="login-etiket">Telefon</label>
        <input type="tel" className="login-input" value={telefon}
          onChange={(e) => { setTelefon(e.target.value.slice(0, 20)); setHata(""); setAlanHatalari((o) => ({ ...o, telefon: "" })); }}
          onBlur={() => setAlanHatalari((o) => ({ ...o, telefon: kurallar.telefon(telefon, false) }))}
          placeholder="05XX XXX XX XX" autoComplete="tel" inputMode="tel" maxLength="20"
          aria-invalid={Boolean(alanHatalari.telefon)} aria-describedby={alanHatalari.telefon ? "profil-telefon-hata" : undefined} />
        {alanHatalari.telefon && <small id="profil-telefon-hata" className="alan-hata">{alanHatalari.telefon}</small>}

        {hata && <p className="login-hata">{hata}</p>}
        {basari && <p className="pd-basari">✓ Bilgilerin güncellendi</p>}

        <button type="submit" className="login-giris-btn" disabled={yukleniyor || !email}>
          {yukleniyor ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
