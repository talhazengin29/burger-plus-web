import { useState, useEffect } from "react";
import Login from "./screens/Login";
import Kitchen from "./screens/Kitchen";
import Salon from "./screens/Salon";
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

export default function App() {
  const [rol, setRol] = useState(null); // "mutfak" | "salon" | null
  const [aktifSekme, setAktifSekme] = useState("mutfak");
  const [tema, setTema] = useState("koyu"); // "koyu" | "acik"

  useEffect(() => {
    const kayitli = sessionStorage.getItem(OTURUM);
    if (kayitli) {
      setRol(kayitli);
      setAktifSekme(kayitli);
    }
    const kayitliTema = localStorage.getItem(TEMA_ANAHTARI);
    if (kayitliTema) setTema(kayitliTema);
  }, []);

  // Temayı <html data-tema> ile uygula
  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem(TEMA_ANAHTARI, tema);
  }, [tema]);

  const temaDegistir = () => setTema((t) => (t === "koyu" ? "acik" : "koyu"));

  const girisBasarili = (girenRol) => {
    sessionStorage.setItem(OTURUM, girenRol);
    setRol(girenRol);
    setAktifSekme(girenRol);
  };

  const cikis = () => {
    sessionStorage.removeItem(OTURUM);
    setRol(null);
  };

  if (!rol) return <Login onGirisBasarili={girisBasarili} />;

  return (
    <div className="personel">
      <nav className="sekme-bar">
        <button
          className={"sekme " + (aktifSekme === "mutfak" ? "sekme--aktif" : "")}
          onClick={() => setAktifSekme("mutfak")}
        >
          🍳 Mutfak
        </button>
        <button
          className={"sekme " + (aktifSekme === "salon" ? "sekme--aktif" : "")}
          onClick={() => setAktifSekme("salon")}
        >
          🍽️ Salon
        </button>
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
