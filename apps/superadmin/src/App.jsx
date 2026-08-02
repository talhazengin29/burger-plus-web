import { useCallback, useEffect, useState } from "react";
import { superBen, superCikis, superToken } from "./lib/superApi";
import Login from "./screens/Login";
import Dashboard from "./screens/Dashboard";
import Isletmeler from "./screens/Isletmeler";
import Raporlar from "./screens/Raporlar";
import Abonelikler from "./screens/Abonelikler";
import Kayitlar from "./screens/Kayitlar";
import { Yukleme } from "./components/Ui";

const HAREKETSIZLIK = 30 * 60 * 1000;
const NAV = [["/", "Genel Bakış", "▦"], ["/isletmeler", "İşletmeler", "▤"], ["/raporlar", "Raporlar", "↗"], ["/abonelikler", "Abonelikler", "₺"], ["/kayitlar", "Denetim İzi", "≡"]];
const TEMEL = String(import.meta.env.BASE_URL || "/super-admin/").replace(/\/$/, "");

function yoluOku() {
  const yol = window.location.pathname.startsWith(TEMEL) ? window.location.pathname.slice(TEMEL.length) : "/";
  const temiz = `/${String(yol || "").replace(/^\/+|\/+$/g, "")}`;
  return NAV.some(([aday]) => aday === temiz) ? temiz : "/";
}

function Panel({ superAdmin, cikis, yol, git }) {
  const ekranlar = { "/": <Dashboard />, "/isletmeler": <Isletmeler />, "/raporlar": <Raporlar />, "/abonelikler": <Abonelikler />, "/kayitlar": <Kayitlar /> };
  return <div className="platform"><aside><div className="platform-marka"><i>BP</i><div><b>Platform Yönetimi</b><small>SUPER ADMIN</small></div></div><nav>{NAV.map(([hedef, ad, ikon]) => <a key={hedef} className={yol === hedef ? "active" : ""} href={`${TEMEL}${hedef === "/" ? "/" : hedef}`} onClick={(e) => { e.preventDefault(); git(hedef); }}><i>{ikon}</i>{ad}</a>)}</nav><footer><span>{superAdmin.ad}</span><small>{superAdmin.email}</small><button onClick={cikis}>Güvenli Çıkış</button></footer></aside><main><header className="platform-ust"><div><small>BURGER PLUS PLATFORM</small><h1>{NAV.find(([hedef]) => hedef === yol)?.[1] || "Platform Yönetimi"}</h1></div><span className="yetki-rozeti">Yüksek Yetkili Oturum · 4 saat</span></header><section className="platform-icerik">{ekranlar[yol] || ekranlar["/"]}</section></main></div>;
}

export default function App() {
  const [yol, setYol] = useState(yoluOku);
  const [durum, setDurum] = useState({ yukleniyor: Boolean(superToken.al()), superAdmin: null });
  const git = useCallback((hedef = "/", { replace = false } = {}) => {
    const temiz = NAV.some(([aday]) => aday === hedef) ? hedef : "/";
    const adres = `${TEMEL}${temiz === "/" ? "/" : temiz}`;
    window.history[replace ? "replaceState" : "pushState"]({}, "", adres);
    setYol(temiz);
  }, []);
  const cikis = useCallback(async () => {
    try { if (superToken.al()) await superCikis(); } catch { /* token zaten geçersiz olabilir */ }
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

  if (durum.yukleniyor) return <Yukleme yazi="Yüksek yetkili oturum doğrulanıyor…" />;
  if (!durum.superAdmin) return <Login onGiris={(superAdmin) => setDurum({ yukleniyor: false, superAdmin })} />;
  return <Panel superAdmin={durum.superAdmin} cikis={cikis} yol={yol} git={git} />;
}
