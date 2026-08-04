import { useCallback, useEffect, useState } from "react";
import { superBen, superCikis, superToken } from "./lib/superApi";
import { useTema } from "./hooks/useTema";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Isletmeler from "./screens/Isletmeler";
import Raporlar from "./screens/Raporlar";
import Abonelikler from "./screens/Abonelikler";
import Kayitlar from "./screens/Kayitlar";
import { Yukleme } from "./components/Ui";
import PlatformAmblemi from "./components/PlatformAmblemi";

function TemaDugmesi({ koyu, degistir, sabit }) {
  return (
    <button
      type="button"
      className={"tema-dugmesi" + (sabit ? " tema-dugmesi--sabit" : "")}
      onClick={degistir}
      aria-label={koyu ? "Aydınlık temaya geç" : "Koyu temaya geç"}
      title={koyu ? "Aydınlık temaya geç" : "Koyu temaya geç"}
    >
      {koyu ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}

const HAREKETSIZLIK = 30 * 60 * 1000;
const NAV = [
  { yol: "/", ad: "Genel Bakış", ikon: "genel" },
  { yol: "/isletmeler", ad: "İşletmeler", ikon: "isletme" },
  { yol: "/raporlar", ad: "Raporlar", ikon: "rapor" },
  { yol: "/abonelikler", ad: "Abonelikler", ikon: "abonelik" },
  { yol: "/kayitlar", ad: "Denetim İzi", ikon: "kayit" },
];
const TEMEL = String(import.meta.env.BASE_URL || "/super-admin/").replace(/\/$/, "");

function PlatformIkonu({ tur }) {
  const icerik = {
    genel: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    isletme: <><path d="M4 21V6l8-3 8 3v15" /><path d="M9 21v-5h6v5M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" /></>,
    rapor: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    abonelik: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18M7 15h4" /></>,
    kayit: <><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></>,
    cikis: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 3h5a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-5" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icerik[tur]}</svg>;
}

function yoluOku() {
  const yol = window.location.pathname.startsWith(TEMEL) ? window.location.pathname.slice(TEMEL.length) : "/";
  const temiz = `/${String(yol || "").replace(/^\/+|\/+$/g, "")}`;
  return NAV.some((oge) => oge.yol === temiz) ? temiz : "/";
}

function Panel({ superAdmin, cikis, yol, git, koyu, temaDegistir }) {
  const ekranlar = {
    "/": <Dashboard />,
    "/isletmeler": <Isletmeler />,
    "/raporlar": <Raporlar />,
    "/abonelikler": <Abonelikler />,
    "/kayitlar": <Kayitlar />,
  };
  const aktifSayfa = NAV.find((oge) => oge.yol === yol) || NAV[0];
  const kullaniciHarfi = String(superAdmin.ad || "S").charAt(0).toUpperCase();

  return (
    <div className="platform">
      <aside className="platform-sidebar">
        <div className="platform-marka">
          <PlatformAmblemi className="platform-logo" />
          <div><b>Platform Merkezi</b><small>SUPER ADMIN</small></div>
        </div>

        <nav aria-label="Platform yönetimi">
          <span className="platform-nav-etiket">YÖNETİM</span>
          {NAV.map((oge) => (
            <a
              key={oge.yol}
              className={yol === oge.yol ? "active" : ""}
              href={`${TEMEL}${oge.yol === "/" ? "/" : oge.yol}`}
              onClick={(e) => { e.preventDefault(); git(oge.yol); }}
            >
              <i><PlatformIkonu tur={oge.ikon} /></i>
              <span>{oge.ad}</span>
              <em>›</em>
            </a>
          ))}
        </nav>

        <footer>
          <div className="platform-kullanici">
            <i>{kullaniciHarfi}</i>
            <span><b>{superAdmin.ad}</b><small>{superAdmin.email}</small></span>
          </div>
          <button onClick={cikis}><PlatformIkonu tur="cikis" /><span>Güvenli Çıkış</span></button>
        </footer>
      </aside>

      <main>
        <header className="platform-ust">
          <div className="platform-ust-baslik">
            <small>SİSTEM / PLATFORM YÖNETİMİ</small>
            <h1>{aktifSayfa.ad}</h1>
          </div>
          <div className="platform-ust-durum">
            <span className="platform-canli"><i /> Sistemler çalışıyor</span>
            <span className="yetki-rozeti">Yüksek yetkili · 24 saat</span>
            <TemaDugmesi koyu={koyu} degistir={temaDegistir} />
            <span className="platform-mini-avatar">{kullaniciHarfi}</span>
          </div>
        </header>
        <section className="platform-icerik">{ekranlar[yol] || ekranlar["/"]}</section>
      </main>
    </div>
  );
}

export default function App() {
  const [yol, setYol] = useState(yoluOku);
  const [durum, setDurum] = useState({ yukleniyor: Boolean(superToken.al()), superAdmin: null });
  const [koyu, temaDegistir] = useTema();
  const git = useCallback((hedef = "/", { replace = false } = {}) => {
    const temiz = NAV.some((oge) => oge.yol === hedef) ? hedef : "/";
    const adres = `${TEMEL}${temiz === "/" ? "/" : temiz}`;
    window.history[replace ? "replaceState" : "pushState"]({}, "", adres);
    setYol(temiz);
  }, []);
  const cikis = useCallback(async () => {
    try { if (superToken.al()) await superCikis(); } catch { /* Token zaten geçersiz olabilir. */ }
    superToken.sil();
    setDurum({ yukleniyor: false, superAdmin: null });
    git("/", { replace: true });
  }, [git]);

  useEffect(() => {
    const geriIleri = () => setYol(yoluOku());
    window.addEventListener("popstate", geriIleri);
    const beklenen = `${TEMEL}${yol === "/" ? "/" : yol}`;
    if (window.location.pathname !== beklenen) git(yol, { replace: true });
    return () => window.removeEventListener("popstate", geriIleri);
  }, [git, yol]);

  useEffect(() => {
    if (!superToken.al()) return;
    superBen().then(({ superAdmin }) => setDurum({ yukleniyor: false, superAdmin })).catch(() => setDurum({ yukleniyor: false, superAdmin: null }));
  }, []);

  useEffect(() => {
    const oturumBitti = () => { superToken.sil(); setDurum({ yukleniyor: false, superAdmin: null }); };
    window.addEventListener("super-admin-oturum-bitti", oturumBitti);
    return () => window.removeEventListener("super-admin-oturum-bitti", oturumBitti);
  }, []);

  useEffect(() => {
    if (!durum.superAdmin) return;
    let zamanlayici;
    const yenile = () => { clearTimeout(zamanlayici); zamanlayici = setTimeout(cikis, HAREKETSIZLIK); };
    const olaylar = ["pointerdown", "keydown", "scroll", "touchstart"];
    olaylar.forEach((olay) => window.addEventListener(olay, yenile, { passive: true }));
    yenile();
    return () => { clearTimeout(zamanlayici); olaylar.forEach((olay) => window.removeEventListener(olay, yenile)); };
  }, [cikis, durum.superAdmin]);

  // Panel kendi başlığının içine gömülü bir tema düğmesi taşıyor (header'ın
  // flex akışının gerçek bir parçası); henüz header yokken (yükleniyor/giriş)
  // sabit konumlu bir tane gösteriyoruz ki her ekranda erişilebilir olsun.
  if (durum.yukleniyor) return <><TemaDugmesi koyu={koyu} degistir={temaDegistir} sabit /><Yukleme yazi="Yüksek yetkili oturum doğrulanıyor…" /></>;
  if (!durum.superAdmin) return <><TemaDugmesi koyu={koyu} degistir={temaDegistir} sabit /><Login onGiris={(superAdmin) => setDurum({ yukleniyor: false, superAdmin })} /></>;
  return <Panel superAdmin={durum.superAdmin} cikis={cikis} yol={yol} git={git} koyu={koyu} temaDegistir={temaDegistir} />;
}
