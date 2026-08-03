import { useState, useEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import Login from "./screens/Login";
import GenelGiris from "./screens/GenelGiris";
import Kitchen from "./screens/Kitchen";
import Salon from "./screens/Salon";
import Admin from "./screens/Admin";
import { adminToken, erisimTokeniniCoz, personelOturumunuDogrula } from "./lib/adminApi";
import { personelSocketiniBagla, personelSocketiniKes } from "./lib/socket";
import { IsletmeSarici, useIsletme } from "./context/IsletmeContext";
import { useIsletmeNavigate } from "./hooks/useIsletmeNavigate";
import { ROL_EKRANI } from "./lib/roller";
import "./App.css";

/*
  Personel uygulaması. Açılacak ekran, giriş yapan hesabın backend'deki
  gerçek rolüne göre otomatik belirlenir (ROL_EKRANI) — kullanıcı hangi
  panele gireceğini seçmez:
   - mutfak: siparişleri hazırlar (Kitchen ekranı)
   - salon / kasiyer: masaları yönetir, hesabı görür, masayı kapatır (Salon ekranı)
   - admin: yönetim panelini açar, ayrıca mutfak/salon sekmeleri arasında geçebilir
*/

const OTURUM = "burger-plus-personel";

// Kök yol ("/"): impersonation bağlantısıysa (?erisim=...) doğru işletmenin
// yönetim paneline yönlendirir; aksi halde (normal ziyaret) tek panelden
// giriş ekranını (GenelGiris) gösterir — belirli bir işletmeye sabitlenmez,
// çünkü bu platformda artık birden fazla işletme var.
function KokEkrani() {
  const [arama] = useSearchParams();
  const token = arama.get("erisim") || "";
  const [hedef, setHedef] = useState(null);
  const [kontrolEdildi, setKontrolEdildi] = useState(!token);

  useEffect(() => {
    if (!token) { setKontrolEdildi(true); return; }
    const erisim = erisimTokeniniCoz(token);
    if (erisim) {
      const slug = String(erisim.isletmeSlug).trim().toLowerCase();
      adminToken.kaydet(token, slug);
      sessionStorage.setItem(`${OTURUM}_${slug}`, "admin");
      setHedef(`/${encodeURIComponent(slug)}/yonetim/genel-bakis`);
    }
    setKontrolEdildi(true);
  }, [token]);

  if (!kontrolEdildi) return <main className="tenant-durum">Erişim doğrulanıyor…</main>;
  if (hedef) return <Navigate to={hedef} replace />;
  return <GenelGiris />;
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
    let iptal = false;

    async function oturumuYukle() {
      try {
        const kullanici = adminToken.al() ? await personelOturumunuDogrula() : null;
        if (iptal) return;
        const ekran = kullanici ? ROL_EKRANI[kullanici.rol] : null;
        if (ekran) {
          sessionStorage.setItem(oturumAnahtari, ekran);
          setRol(ekran);
          setImpersonation(kullanici.impersonation || null);
          setAktifSekme(window.location.pathname.includes("salon") ? "salon" : ekran === "admin" ? "mutfak" : ekran);
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

  // Login.jsx buraya hesabın backend'deki GERÇEK rolünü verir (bir "seçim" değil).
  const girisBasarili = (gercekRol) => {
    const ekran = ROL_EKRANI[gercekRol];
    if (!ekran) return;
    sessionStorage.setItem(oturumAnahtari, ekran);
    setRol(ekran);
    setAktifSekme(ekran);
    personelSocketiniBagla();
    git(ekran === "admin" ? "/yonetim/genel-bakis" : `/${ekran}`);
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
      <Route path="/" element={<KokEkrani />} />
      <Route path="/:isletmeSlug/*" element={<IsletmeSarici><PersonelPaneli /></IsletmeSarici>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
