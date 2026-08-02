import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { sifreSifirla, tokenDogrula as tokenSunucudaDogrula } from "../lib/authApi";
import { IconCheck, IconEye, IconEyeOff, IconWarning } from "../components/Icons";
import { kurallar } from "../lib/dogrulama";
import logoFull from "../assets/logo-full-transparent.png";
import "./Login.css";

function sifreGucu(sifre) {
  if (sifre.length < 8) return { etiket: "Zayıf", sinif: "zayif", oran: 0.33 };
  if (sifre.length < 12) return { etiket: "Orta", sinif: "orta", oran: 0.66 };
  return { etiket: "Güçlü", sinif: "guclu", oran: 1 };
}

export default function SifreSifirla() {
  const git = useNavigate();
  const [parametreler] = useSearchParams();
  const token = parametreler.get("token") || "";

  const [durum, setDurum] = useState("kontrol"); // kontrol | gecerli | gecersiz | basarili
  const [sifre, setSifre] = useState("");
  const [sifreTekrar, setSifreTekrar] = useState("");
  const [sifreGorunur, setSifreGorunur] = useState(false);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    if (!token) { setDurum("gecersiz"); return; }
    tokenSunucudaDogrula(token).then((sonuc) => {
      setDurum(sonuc?.gecerli ? "gecerli" : "gecersiz");
    });
  }, [token]);

  const gonder = async (e) => {
    e.preventDefault();
    setHata("");
    const sifreHatasi = kurallar.yeniSifre(sifre);
    if (sifreHatasi) { setHata(sifreHatasi); return; }
    if (sifre !== sifreTekrar) { setHata("Şifreler eşleşmiyor."); return; }

    setYukleniyor(true);
    try {
      const sonuc = await sifreSifirla(token, sifre);
      if (sonuc.hata) {
        setHata(sonuc.hata);
      } else {
        setDurum("basarili");
        setTimeout(() => git("/"), 2000);
      }
    } catch {
      setHata("Sunucuya ulaşılamadı. Backend çalışıyor mu?");
    } finally {
      setYukleniyor(false);
    }
  };

  const guc = sifre ? sifreGucu(sifre) : null;

  return (
    <div className="ekran login">
      <motion.div
        className="login-ust"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <img className="login-logo" src={logoFull} alt="Burger Plus" />
        <p className="login-slogan">Yeni şifreni belirle</p>
      </motion.div>

      {durum === "kontrol" && (
        <div className="login-form sifirlama-yukleniyor">Bağlantı kontrol ediliyor…</div>
      )}

      {durum === "gecersiz" && (
        <motion.div
          className="login-form sifirlama-basari"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="sifirlama-basari-ikon sifirlama-hata-ikon"><IconWarning /></span>
          <h2 className="login-baslik">Bağlantı geçersiz</h2>
          <p className="sifirlama-basari-metin">
            Bu sıfırlama bağlantısının süresi dolmuş veya daha önce kullanılmış.
          </p>
          <button type="button" className="login-giris-btn" onClick={() => git("/sifremi-unuttum")}>
            Yeni bağlantı iste
          </button>
        </motion.div>
      )}

      {durum === "basarili" && (
        <motion.div
          className="login-form sifirlama-basari"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="sifirlama-basari-ikon"><IconCheck /></span>
          <h2 className="login-baslik">Şifren güncellendi</h2>
          <p className="sifirlama-basari-metin">Giriş ekranına yönlendiriliyorsun…</p>
        </motion.div>
      )}

      {durum === "gecerli" && (
        <motion.form
          className="login-form"
          onSubmit={gonder}
          noValidate
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="login-baslik">Yeni şifre belirle</h2>

          <label className="login-etiket">Yeni şifre</label>
          <div className="sifre-alani">
            <input
              type={sifreGorunur ? "text" : "password"}
              className="login-input"
              value={sifre}
              onChange={(e) => { setSifre(e.target.value.slice(0, 72)); setHata(""); }}
              placeholder="••••••"
              autoComplete="new-password"
              maxLength="72"
              autoFocus
              required
            />
            <button type="button" className="sifre-goster-btn" onClick={() => setSifreGorunur((o) => !o)} aria-label={sifreGorunur ? "Şifreyi gizle" : "Şifreyi göster"}>
              {sifreGorunur ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
          {guc && (
            <div className={`sifre-guc sifre-guc--${guc.sinif}`}>
              <span className="sifre-guc-cubuk" style={{ "--oran": guc.oran }} />
              <small>{guc.etiket}</small>
            </div>
          )}

          <label className="login-etiket">Yeni şifre (tekrar)</label>
          <div className="sifre-alani">
            <input
              type={sifreGorunur ? "text" : "password"}
              className="login-input"
              value={sifreTekrar}
              onChange={(e) => { setSifreTekrar(e.target.value.slice(0, 72)); setHata(""); }}
              placeholder="••••••"
              autoComplete="new-password"
              maxLength="72"
              required
            />
          </div>
          {sifreTekrar && sifre !== sifreTekrar && <small className="alan-hata">Şifreler eşleşmiyor.</small>}

          {hata && <p className="login-hata">{hata}</p>}

          <button type="submit" className="login-giris-btn" disabled={yukleniyor}>
            {yukleniyor ? "Güncelleniyor..." : "Şifremi Güncelle"}
          </button>
        </motion.form>
      )}
    </div>
  );
}
