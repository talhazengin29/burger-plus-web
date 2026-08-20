import { useState, useEffect } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Login from "./screens/Login";
import GenelGiris from "./screens/GenelGiris";
import Kitchen from "./screens/Kitchen";
import Salon from "./screens/Salon";
import Admin from "./screens/Admin";
import CuzdanYukleme from "./components/CuzdanYukleme";
import Rezervasyonlar from "./screens/Rezervasyonlar";
import DilSecici from "./components/DilSecici";
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
const TEMA_ANAHTARI = "burger-plus-personel-tema";

function TemaButonu({ tema, onDegistir, className = "" }) {
  const { t } = useTranslation();
  const acikTema = tema === "acik";
  return (
    <button type="button" className={`tema-dugmesi ${className}`.trim()} onClick={onDegistir}
      aria-label={t(acikTema ? "common.switchToDark" : "common.switchToLight")}
      title={t(acikTema ? "common.switchToDark" : "common.switchToLight")}>
      <span className="tema-dugmesi-ikon" aria-hidden="true">{acikTema ? "☾" : "☀"}</span>
      <span className="tema-dugmesi-metin">{t(acikTema ? "common.dark" : "common.light")}</span>
    </button>
  );
}

// Kök yol ("/"): impersonation bağlantısıysa (?erisim=...) doğru işletmenin
// yönetim paneline yönlendirir; aksi halde (normal ziyaret) tek panelden
// giriş ekranını (GenelGiris) gösterir — belirli bir işletmeye sabitlenmez,
// çünkü bu platformda artık birden fazla işletme var.
function KokEkrani() {
  const { t } = useTranslation();
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

  if (!kontrolEdildi) return <main className="tenant-durum">{t("session.verifyingAccess")}</main>;
  if (hedef) return <Navigate to={hedef} replace />;
  return <GenelGiris />;
}

function PersonelPaneli({ tema, temaDegistir }) {
  const { t } = useTranslation();
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
          setAktifSekme(window.location.pathname.includes("rezervasyonlar") ? "rezervasyon" : window.location.pathname.includes("cuzdan-yukleme") ? "cuzdan" : window.location.pathname.includes("salon") ? "salon" : ekran === "admin" ? "mutfak" : ekran);
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
    // Impersonation ile girilmiş bir oturumdan çıkış, bu uygulamanın kendi
    // giriş ekranına değil, super admini geldiği super admin paneline geri
    // götürmeli (bkz. superadmin/src/lib/superApi.js#personelPanelineGit —
    // buradaki VITE_PERSONEL_URL'nin aynası).
    if (impersonation) {
      const temel = String(import.meta.env.VITE_SUPERADMIN_URL || `${window.location.origin}/super-admin`).replace(/\/$/, "");
      window.location.assign(temel);
      return;
    }
    setRol(null);
    setImpersonation(null);
    git("/");
  };

  useEffect(() => {
    window.addEventListener("personel-oturum-bitti", cikis);
    return () => window.removeEventListener("personel-oturum-bitti", cikis);
  });

  if (oturumYukleniyor) return <main className="tenant-durum">{t("session.verifyingSession")}</main>;
  if (!rol) return <Login onGirisBasarili={girisBasarili} />;
  if (rol === "admin") return (
    <div className={impersonation ? "impersonation-oturumu" : ""}>
      {impersonation && (
        <aside className="impersonation-bandi" role="status">
          <span>⚠️ {t("session.impersonation", { business: isletme?.ad || isletmeSlug })}</span>
          <button type="button" onClick={cikis}>{t("common.exit")}</button>
        </aside>
      )}
      <Admin onCikis={cikis} tema={tema} temaDegistir={temaDegistir} />
    </div>
  );

  return (
    <div className="personel">
      <nav className="sekme-bar">
        <div className="personel-kimlik">
          <span className="personel-kimlik-ikon">{String(isletme?.ad || "İ").slice(0, 1).toUpperCase()}</span>
          <div><strong>{isletme?.ad || t("common.business")}</strong><small>{t("common.personnelCenter")}</small></div>
        </div>
        <div className="sekme-grup">
        {(rol === "mutfak" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "mutfak" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("mutfak"); git("/mutfak"); }}
        >
          <span className="sekme-ikon">M</span>{t("nav.kitchen")}
        </button>
        )}
        {(rol === "salon" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "rezervasyon" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("rezervasyon"); git("/rezervasyonlar"); }}
        >
          <span className="sekme-ikon">R</span>{t("nav.reservations")}
        </button>
        )}
        {(rol === "salon" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "salon" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("salon"); git("/salon"); }}
        >
          <span className="sekme-ikon">S</span>{t("nav.floor")}
        </button>
        )}
        {(rol === "salon" || rol === "admin") && (
        <button
          className={"sekme " + (aktifSekme === "cuzdan" ? "sekme--aktif" : "")}
          onClick={() => { setAktifSekme("cuzdan"); git("/cuzdan-yukleme"); }}
        >
          <span className="sekme-ikon">₺</span>{t("nav.wallet")}
        </button>
        )}
        </div>
        <DilSecici />
        <TemaButonu tema={tema} onDegistir={temaDegistir} />
        <button className="sekme-cikis" onClick={cikis}><span>↗</span>{t("common.exit")}</button>
      </nav>

      <div className="sekme-icerik">
        {aktifSekme === "mutfak" ? <Kitchen /> : aktifSekme === "cuzdan" ? <div className="cuzdan-sekme-ekrani"><CuzdanYukleme /></div> : aktifSekme === "rezervasyon" ? <Rezervasyonlar /> : <Salon />}
      </div>
    </div>
  );
}

export default function App() {
  const [tema, setTema] = useState(() => {
    const kayitliTema = localStorage.getItem(TEMA_ANAHTARI);
    if (kayitliTema === "acik" || kayitliTema === "koyu") return kayitliTema;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "acik" : "koyu";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-tema", tema);
    document.documentElement.style.colorScheme = tema === "acik" ? "light" : "dark";
    localStorage.setItem(TEMA_ANAHTARI, tema);
  }, [tema]);

  const temaDegistir = () => setTema((onceki) => onceki === "acik" ? "koyu" : "acik");

  return (
    <Routes>
      <Route path="/" element={<KokEkrani />} />
      <Route path="/:isletmeSlug/*" element={<IsletmeSarici><PersonelPaneli tema={tema} temaDegistir={temaDegistir} /></IsletmeSarici>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
