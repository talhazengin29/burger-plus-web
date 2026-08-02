import { useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { kayitOl, tokeniKaydet } from "../lib/authApi";
import { IconBack, IconEye, IconEyeOff } from "../components/Icons";
import { davetKoduTemizle, emailTemizle, formuDogrula, ilkHata, kurallar, telefonTemizle, temizMetin } from "../lib/dogrulama";
import "./Login.css";

const KAYIT_SEMASI = {
  ad: (deger) => kurallar.ad(deger, "Ad"),
  soyad: (deger) => kurallar.ad(deger, "Soyad"),
  cinsiyet: (deger) => deger ? "" : "Cinsiyet seçimi zorunludur.",
  email: kurallar.email,
  telefon: (deger) => kurallar.telefon(deger, true),
  sifre: kurallar.yeniSifre,
  davetKodu: kurallar.davetKodu,
};

export default function Kayit() {
  const git = useIsletmeNavigate();
  const { girisiTamamla } = useApp();
  const [form, setForm] = useState({
    ad: "", soyad: "", cinsiyet: "", email: "", telefon: "", sifre: "", davetKodu: "",
  });
  const [hata, setHata] = useState("");
  const [alanHatalari, setAlanHatalari] = useState({});
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  const guncelle = (alan, deger) => {
    setForm((f) => ({ ...f, [alan]: deger }));
    setHata("");
    setAlanHatalari((onceki) => ({ ...onceki, [alan]: "" }));
  };

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    const hatalar = formuDogrula(form, KAYIT_SEMASI);
    setAlanHatalari(hatalar);
    if (ilkHata(hatalar)) {
      setHata("Lütfen işaretli alanları kontrol et.");
      return;
    }
    setYukleniyor(true);
    try {
      const sonuc = await kayitOl({
        ...form,
        ad: temizMetin(form.ad, 60),
        soyad: temizMetin(form.soyad, 60),
        email: emailTemizle(form.email),
        telefon: telefonTemizle(form.telefon),
        davetKodu: davetKoduTemizle(form.davetKodu),
      });
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

      <form className="login-form kayit-form" onSubmit={gonder} noValidate>
        <div className="kayit-ikili">
          <div className="kayit-alan">
            <label className="login-etiket">Ad</label>
            <input className="login-input" value={form.ad}
              onChange={(e) => guncelle("ad", e.target.value.slice(0, 60))}
              onBlur={() => setAlanHatalari((o) => ({ ...o, ad: KAYIT_SEMASI.ad(form.ad) }))}
              placeholder="Adın" autoComplete="given-name" maxLength="60" required
              aria-invalid={Boolean(alanHatalari.ad)} aria-describedby={alanHatalari.ad ? "kayit-ad-hata" : undefined} />
            {alanHatalari.ad && <small id="kayit-ad-hata" className="alan-hata">{alanHatalari.ad}</small>}
          </div>
          <div className="kayit-alan">
            <label className="login-etiket">Soyad</label>
            <input className="login-input" value={form.soyad}
              onChange={(e) => guncelle("soyad", e.target.value.slice(0, 60))}
              onBlur={() => setAlanHatalari((o) => ({ ...o, soyad: KAYIT_SEMASI.soyad(form.soyad) }))}
              placeholder="Soyadın" autoComplete="family-name" maxLength="60" required
              aria-invalid={Boolean(alanHatalari.soyad)} aria-describedby={alanHatalari.soyad ? "kayit-soyad-hata" : undefined} />
            {alanHatalari.soyad && <small id="kayit-soyad-hata" className="alan-hata">{alanHatalari.soyad}</small>}
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
        {alanHatalari.cinsiyet && <small className="alan-hata">{alanHatalari.cinsiyet}</small>}

        <label className="login-etiket">E-posta</label>
        <input type="email" className="login-input" value={form.email}
          onChange={(e) => guncelle("email", e.target.value.slice(0, 254))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, email: KAYIT_SEMASI.email(form.email) }))}
          placeholder="ornek@eposta.com" autoComplete="email" maxLength="254" required
          aria-invalid={Boolean(alanHatalari.email)} aria-describedby={alanHatalari.email ? "kayit-email-hata" : undefined} />
        {alanHatalari.email && <small id="kayit-email-hata" className="alan-hata">{alanHatalari.email}</small>}

        <label className="login-etiket">Telefon</label>
        <input type="tel" className="login-input" value={form.telefon}
          onChange={(e) => guncelle("telefon", e.target.value.slice(0, 20))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, telefon: KAYIT_SEMASI.telefon(form.telefon) }))}
          placeholder="05XX XXX XX XX" autoComplete="tel" inputMode="tel" maxLength="20" required
          aria-invalid={Boolean(alanHatalari.telefon)} aria-describedby={alanHatalari.telefon ? "kayit-telefon-hata" : undefined} />
        {alanHatalari.telefon && <small id="kayit-telefon-hata" className="alan-hata">{alanHatalari.telefon}</small>}

        <label className="login-etiket">Şifre</label>
        <div className="sifre-alani">
          <input type={sifreGorunur ? "text" : "password"} className="login-input" value={form.sifre}
            onChange={(e) => guncelle("sifre", e.target.value.slice(0, 72))}
            onBlur={() => setAlanHatalari((o) => ({ ...o, sifre: KAYIT_SEMASI.sifre(form.sifre) }))}
            placeholder="En az 6 karakter" autoComplete="new-password" minLength="6" maxLength="72" required
            aria-invalid={Boolean(alanHatalari.sifre)} aria-describedby={alanHatalari.sifre ? "kayit-sifre-hata" : undefined} />
          <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((onceki) => !onceki)} aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"} title={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}>
            {sifreGorunur ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {alanHatalari.sifre && <small id="kayit-sifre-hata" className="alan-hata alan-hata--sifre">{alanHatalari.sifre}</small>}

        <label className="login-etiket">Davet kodu <span className="istege-bagli">(isteğe bağlı)</span></label>
        <input className="login-input davet-kodu-input" value={form.davetKodu}
          onChange={(e) => guncelle("davetKodu", davetKoduTemizle(e.target.value))}
          onBlur={() => setAlanHatalari((o) => ({ ...o, davetKodu: KAYIT_SEMASI.davetKodu(form.davetKodu) }))}
          placeholder="8 haneli kod" autoComplete="off" inputMode="text" maxLength="8"
          aria-invalid={Boolean(alanHatalari.davetKodu)} aria-describedby="kayit-davet-aciklama" />
        {alanHatalari.davetKodu
          ? <small className="alan-hata">{alanHatalari.davetKodu}</small>
          : <small id="kayit-davet-aciklama" className="alan-yardim">Bir arkadaşın davet ettiyse kodunu buraya yaz.</small>}

        {hata && <p className="login-hata">{hata}</p>}

        <button type="submit" className="login-giris-btn"
          disabled={yukleniyor}>
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
