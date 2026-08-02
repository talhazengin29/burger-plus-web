import { useState, useEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import Login from "./screens/Login";
import Kitchen from "./screens/Kitchen";
import Salon from "./screens/Salon";
import Admin from "./screens/Admin";
import { adminToken, erisimTokeniniCoz, personelOturumunuDogrula } from "./lib/adminApi";
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

function ImpersonationYonlendir() {
  const [arama] = useSearchParams();
  const token = arama.get("erisim") || "";
  const [hedef, setHedef] = useState(null);
  useEffect(() => {
    const erisim = erisimTokeniniCoz(token);
    if (!erisim) {
      setHedef("/burger-plus");
      return;
    }
    const slug = String(erisim.isletmeSlug).trim().toLowerCase();
    adminToken.kaydet(token, slug);
    sessionStorage.setItem(`${OTURUM}_${slug}`, "admin");
    setHedef(`/${encodeURIComponent(slug)}/yonetim/genel-bakis`);
  }, [token]);
  if (!hedef) return <main className="tenant-durum">Erişim doğrulanıyor…</main>;
  return <Navigate to={hedef} replace />;
}

function PersonelPaneli() {
  const git = useIsletmeNavigate();
  const { isletme, isletmeSlug } = useIsletme();
  const oturumAnahtari = `${OTURUM}_${isletmeSlug}`;
  const [rol, setRol] = useState(null); // "mutfak" | "salon" | null
  const [aktifSekme, setAktifSekme] = useState("mutfak");
  const [impersonation, setImpersonation] = useState(null);
  const [oturumYukleniyor, setOturumYukleniyor] = useState(true);

  useEffect(() => {
    const kayitli = sessionStorage.getItem(oturumAnahtari);
    let iptal = false;
    const izinler = { admin: ["admin"], mutfak: ["mutfak", "admin"], salon: ["salon", "kasiyer", "admin"] };

    async function oturumuYukle() {
      try {
        const kullanici = kayitli && adminToken.al() ? await personelOturumunuDogrula() : null;
        if (iptal) return;
        if (kullanici && izinler[kayitli]?.includes(kullanici.rol)) {
          setRol(kayitli);
          setImpersonation(kullanici.impersonation || null);
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
  }, [oturumAnahtari]);

  // Personel ekranları işletmenin yalnızca vurgu rengini alır; zemin koyu kalır.
  useEffect(() => {
    document.documentElement.setAttribute("data-tema", "koyu");
  }, []);

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
    setImpersonation(null);
    git("/");
  };

  useEffect(() => {
    window.addEventListener("personel-oturum-bitti", cikis);
    return () => window.removeEventListener("personel-oturum-bitti", cikis);
  });

  if (oturumYukleniyor) return <main className="tenant-durum">Oturum doğrulanıyor…</main>;
  if (!rol) return <Login onGirisBasarili={girisBasarili} />;
  if (rol === "admin") return (
    <div className={impersonation ? "impersonation-oturumu" : ""}>
      {impersonation && (
        <aside className="impersonation-bandi" role="status">
          <span>⚠️ Super admin erişimi — <b>{isletme?.ad || isletmeSlug}</b> adına işlem yapıyorsunuz.</span>
          <button type="button" onClick={cikis}>Çık</button>
        </aside>
      )}
      <Admin onCikis={cikis} />
    </div>
  );

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
      <Route path="/" element={<ImpersonationYonlendir />} />
      <Route path="/:isletmeSlug/*" element={<IsletmeSarici><PersonelPaneli /></IsletmeSarici>} />
      <Route path="*" element={<Navigate to="/burger-plus" replace />} />
    </Routes>
  );
}
