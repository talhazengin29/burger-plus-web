import { useState, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./screens/Login";
import Kitchen from "./screens/Kitchen";
import Salon from "./screens/Salon";
import Admin from "./screens/Admin";
import { adminToken, personelOturumunuDogrula } from "./lib/adminApi";
import { personelSocketiniBagla, personelSocketiniKes } from "./lib/socket";
import { IsletmeSarici, useIsletme } from "./context/IsletmeContext";
import { useIsletmeNavigate } from "./hooks/useIsletmeNavigate";
import "./App.css";

/*
  Personel uygulaması. İki rol var:
   - mutfak: siparişleri hazırlar (Kitchen ekranı)
   - salon: masaları yönetir, hesabı görür, masayı kapatır (Salon ekranı)
  Giriş şifreye göre rolü belirler. Giriş sonrası iki sekme arası geçilebilir,
  ama kişi hangi rolle girdiyse ona öncelik verilir.
*/

const OTURUM = "burger-plus-personel";
const TEMA_ANAHTARI = "burger-plus-personel-tema";

function PersonelPaneli() {
  const git = useIsletmeNavigate();
  const { isletmeSlug } = useIsletme();
  const oturumAnahtari = `${OTURUM}_${isletmeSlug}`;
  const temaAnahtari = `${TEMA_ANAHTARI}_${isletmeSlug}`;
  const [rol, setRol] = useState(null); // "mutfak" | "salon" | null
  const [aktifSekme, setAktifSekme] = useState("mutfak");
  const [tema, setTema] = useState("koyu"); // "koyu" | "acik"
  const [oturumYukleniyor, setOturumYukleniyor] = useState(true);

  useEffect(() => {
    const kayitli = sessionStorage.getItem(oturumAnahtari);
    const kayitliTema = localStorage.getItem(temaAnahtari);
    if (kayitliTema) setTema(kayitliTema);
    let iptal = false;
    const izinler = { admin: ["admin"], mutfak: ["mutfak", "admin"], salon: ["salon", "kasiyer", "admin"] };

    async function oturumuYukle() {
      try {
        const kullanici = kayitli && adminToken.al() ? await personelOturumunuDogrula() : null;
        if (iptal) return;
        if (kullanici && izinler[kayitli]?.includes(kullanici.rol)) {
          setRol(kayitli);
          setAktifSekme(window.location.pathname.includes("salon") ? "salon" : kayitli === "admin" ? "mutfak" : kayitli);
          personelSocketiniBagla();
        } else {
          sessionStorage.removeItem(oturumAnahtari);
          adminToken.sil();
          personelSocketiniKes();
        }
      } catch {
        if (!iptal) personelSocketiniKes();
      } finally {
        if (!iptal) setOturumYukleniyor(false);
      }
    }

    oturumuYukle();
    return () => { iptal = true; };
  }, [oturumAnahtari, temaAnahtari]);

  // Temayı <html data-tema> ile uygula
  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem(temaAnahtari, tema);
  }, [tema, temaAnahtari]);

  const temaDegistir = () => setTema((t) => (t === "koyu" ? "acik" : "koyu"));

  const girisBasarili = (girenRol) => {
    sessionStorage.setItem(oturumAnahtari, girenRol);
    setRol(girenRol);
    setAktifSekme(girenRol);
    personelSocketiniBagla();
    git(girenRol === "admin" ? "/yonetim/genel-bakis" : `/${girenRol}`);
  };

  const cikis = () => {
    sessionStorage.removeItem(oturumAnahtari);
    adminToken.sil();
    personelSocketiniKes();
    setRol(null);
    git("/");
  };

  if (oturumYukleniyor) return <main className="tenant-durum">Oturum doğrulanıyor…</main>;
  if (!rol) return <Login onGirisBasarili={girisBasarili} />;
  if (rol === "admin") return <Admin onCikis={cikis} />;

  return (
    <div className="personel">
      <nav className="sekme-bar">
        {(rol === "mutfak" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "mutfak" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("mutfak"); git("/mutfak"); }}
        >
          🍳 Mutfak
        </button>
        )}
        {(rol === "salon" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "salon" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("salon"); git("/salon"); }}
        >
          🍽️ Salon
        </button>
        )}
        <button className="sekme-tema" onClick={temaDegistir} title="Tema değiştir">
          {tema === "koyu" ? "☀️" : "🌙"}
        </button>
        <button className="sekme-cikis" onClick={cikis}>Çıkış</button>
      </nav>

      <div className="sekme-icerik">
        {aktifSekme === "mutfak" ? <Kitchen /> : <Salon />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/burger-plus" replace />} />
      <Route path="/:isletmeSlug/*" element={<IsletmeSarici><PersonelPaneli /></IsletmeSarici>} />
      <Route path="*" element={<Navigate to="/burger-plus" replace />} />
    </Routes>
  );
}
