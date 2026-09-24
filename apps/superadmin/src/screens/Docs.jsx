import { useCallback, useEffect, useState } from "react";
import { backendAdresi, backendDurumuGetir } from "../lib/superApi";
import "./Docs.css";

const AKIS = [
  { no: "01", ad: "İstemci", alt: "Landing · Müşteri · Personel · Super Admin", ton: "mavi", ikon: "ekran" },
  { no: "02", ad: "Güvenlik kapısı", alt: "Helmet · CORS · body limiti · rate limit", ton: "mor", ikon: "kalkan" },
  { no: "03", ad: "Tenant çözümleme", alt: "X-Isletme → işletme kaydı → req.isletme", ton: "turuncu", ikon: "sube" },
  { no: "04", ad: "Kimlik ve yetki", alt: "JWT · 2FA · rol · masa erişim tokenı", ton: "sari", ikon: "anahtar" },
  { no: "05", ad: "İş servisi", alt: "Sipariş · stok · ödeme · sadakat · rapor", ton: "yesil", ikon: "islem" },
  { no: "06", ad: "Kalıcı veri", alt: "PostgreSQL · transaction · dosya depolama", ton: "turkuaz", ikon: "veri" },
  { no: "07", ad: "Canlı yayın", alt: "Socket.IO · tenant odaları · ekran güncelleme", ton: "pembe", ikon: "yayin" },
];

const AKISLAR = [
  {
    ad: "QR sipariş",
    etiket: "Gerçek zamanlı",
    adimlar: ["QR ile işletme ve masa doğrulanır", "Ürün sunucuda tenant kapsamında işlenir", "Sipariş PostgreSQL'e yazılır", "Mutfak, salon ve masa odalarına yayınlanır"],
  },
  {
    ad: "Online ödeme",
    etiket: "iyzico",
    adimlar: ["Sunucu güncel ürünlerden ödeme taslağı üretir", "iyzico Checkout başlatılır", "Callback ve doğrulama sunucuda kontrol edilir", "Başarılı ödeme stok, mutfak ve sadakate yansır"],
  },
  {
    ad: "Yönetim değişikliği",
    etiket: "Rol korumalı",
    adimlar: ["Admin JWT ve rolü doğrulanır", "İşletme kapsamı her sorguya eklenir", "Değişiklik ve denetim kaydı saklanır", "İlgili istemci odalarına güncel veri gönderilir"],
  },
];

const KATMANLAR = [
  { ad: "HTTP ve güvenlik", dosyalar: "server.js · auth.js", aciklama: "Express rotaları, CORS allowlist, Helmet, istek sınırları, JWT, 2FA ve rol kontrolleri." },
  { ad: "Tenant çekirdeği", dosyalar: "isletmeDb.js · slug.js", aciklama: "Slug ve X-Isletme başlığını tek işletme kaydına çözümler; sorgular işletme kimliğiyle sınırlandırılır." },
  { ad: "Sipariş ve ödeme", dosyalar: "db.js · iyzico.js · cuzdanDb.js", aciklama: "Masa, sipariş, stok rezervasyonu, nakit, cüzdan ve ödeme sağlayıcı akışlarını yönetir." },
  { ad: "Operasyon", dosyalar: "adminDb.js · receteDb.js · giderDb.js", aciklama: "Ürün, reçete, stok, finans, personel, kampanya ve raporlama servislerini taşır." },
  { ad: "Müşteri deneyimi", dosyalar: "sadakatDb.js · masaZekasi.js", aciklama: "Sadakat, ödül, ortak masa tercihleri ve restoran verisiyle öneri üretimini yürütür." },
  { ad: "Canlı senkronizasyon", dosyalar: "server.js / Socket.IO", aciklama: "Her işletmeyi ayrı odalara ayırır; masa, mutfak, salon, yönetim ve kullanıcı ekranlarını günceller." },
];

const API_GRUPLARI = [
  ["Müşteri", "/api/*", "Tenant + opsiyonel/kullanıcı JWT", "Menü, masa, sadakat, ödeme"],
  ["Personel", "/api/personel/*", "Tenant + personel rolü", "Salon, mutfak, rezervasyon"],
  ["İşletme yönetimi", "/api/admin/*", "Tenant + admin JWT", "Ürün, stok, finans, rapor"],
  ["Platform yönetimi", "/api/super/*", "Super admin JWT + 2FA", "İşletme, abonelik, denetim"],
];

function Ikon({ tur }) {
  const yollar = {
    ekran: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    kalkan: <path d="M12 3l7 3v5c0 4.7-2.9 8.1-7 10-4.1-1.9-7-5.3-7-10V6l7-3zM9 12l2 2 4-5" />,
    sube: <><path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>,
    anahtar: <><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8M15 8l2 2M17 6l2 2" /></>,
    islem: <><path d="M4 6h16M4 12h16M4 18h10" /><circle cx="7" cy="6" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="10" cy="18" r="1" /></>,
    veri: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
    yayin: <><circle cx="12" cy="12" r="2" /><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{yollar[tur]}</svg>;
}

function tarihSaat(deger) {
  if (!deger) return "Henüz kontrol edilmedi";
  return new Date(deger).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Docs() {
  const [saglik, setSaglik] = useState({ yukleniyor: true, veri: null, hata: "" });
  const denetle = useCallback(async () => {
    setSaglik((onceki) => ({ ...onceki, yukleniyor: true, hata: "" }));
    try {
      const veri = await backendDurumuGetir();
      setSaglik({ yukleniyor: false, veri, hata: "" });
    } catch (hata) {
      setSaglik((onceki) => ({ yukleniyor: false, veri: onceki.veri, hata: hata.message || "Backend'e erişilemedi." }));
    }
  }, []);

  useEffect(() => {
    denetle();
    const zamanlayici = setInterval(denetle, 30_000);
    return () => clearInterval(zamanlayici);
  }, [denetle]);

  const calisiyor = Boolean(saglik.veri?.erisilebilir) && !saglik.hata;

  return (
    <div className="sayfa docs-sayfa">
      <section className="docs-hero">
        <div>
          <span className="docs-kicker">SİSTEM REFERANSI · CANLI KONTROL</span>
          <h2>Backend nasıl çalışıyor?</h2>
          <p>İstek platforma girdiği andan veritabanına yazılıp ilgili ekranlara canlı olarak dönene kadar güncel MasanPOS akışı.</p>
        </div>
        <div className={`docs-canli-kart ${calisiyor ? "calisiyor" : "hata"}`}>
          <header>
            <span><i /> {saglik.yukleniyor ? "Kontrol ediliyor" : calisiyor ? "Backend erişilebilir" : "Kontrol gerekli"}</span>
            <button type="button" onClick={denetle} disabled={saglik.yukleniyor} aria-label="Backend durumunu yenile">↻</button>
          </header>
          <code>{backendAdresi()}</code>
          <footer>
            <span><b>{saglik.veri?.gecikmeMs ? `${saglik.veri.gecikmeMs} ms` : "—"}</b> HTTP yanıtı</span>
            <span><b>{tarihSaat(saglik.veri?.kontrolZamani)}</b> son kontrol</span>
          </footer>
          {saglik.hata && <p>{saglik.hata}</p>}
        </div>
      </section>

      <section className="docs-bolum">
        <header className="docs-bolum-baslik"><div><span>01 / ANA AKIŞ</span><h3>Bir isteğin backend yolculuğu</h3></div><small>Soldan sağa · senkron istek, ardından canlı yayın</small></header>
        <div className="docs-akis">
          {AKIS.map((adim, index) => (
            <div className="docs-akis-parca" key={adim.no}>
              <article className={`docs-akis-kart ${adim.ton}`}>
                <header><span>{adim.no}</span><i><Ikon tur={adim.ikon} /></i></header>
                <h4>{adim.ad}</h4><p>{adim.alt}</p>
              </article>
              {index < AKIS.length - 1 && <span className="docs-ok" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
        <aside className="docs-not"><b>Tenant izolasyonu</b><span>Super admin uçları dışında her iş akışı işletme kimliğiyle sınırlandırılır. Socket odaları da <code>i&#123;isletmeId&#125;:oda</code> biçiminde ayrılır.</span></aside>
      </section>

      <section className="docs-iki-kolon">
        <div className="docs-bolum">
          <header className="docs-bolum-baslik"><div><span>02 / İŞ AKIŞLARI</span><h3>Kritik senaryolar</h3></div></header>
          <div className="docs-senaryolar">
            {AKISLAR.map((akis) => <article key={akis.ad}><header><h4>{akis.ad}</h4><span>{akis.etiket}</span></header><ol>{akis.adimlar.map((adim) => <li key={adim}>{adim}</li>)}</ol></article>)}
          </div>
        </div>
        <div className="docs-bolum">
          <header className="docs-bolum-baslik"><div><span>03 / API SINIRLARI</span><h3>Kim, nereye erişir?</h3></div></header>
          <div className="docs-api-listesi">
            {API_GRUPLARI.map(([ad, yol, yetki, kapsam]) => <article key={yol}><div><span>{ad}</span><code>{yol}</code></div><p>{yetki}</p><small>{kapsam}</small></article>)}
          </div>
        </div>
      </section>

      <section className="docs-bolum">
        <header className="docs-bolum-baslik"><div><span>04 / KOD HARİTASI</span><h3>Backend modülleri</h3></div><small>Kaynak: masanpos-backend güncel modül yapısı</small></header>
        <div className="docs-katmanlar">
          {KATMANLAR.map((katman, index) => <article key={katman.ad}><span>{String(index + 1).padStart(2, "0")}</span><div><h4>{katman.ad}</h4><code>{katman.dosyalar}</code><p>{katman.aciklama}</p></div></article>)}
        </div>
      </section>

      <p className="docs-dipnot">Bu ekran yalnızca mimariyi gösterir; token, ortam değişkeni, veritabanı bağlantısı veya müşteri verisi yayınlamaz. Canlı durum `/saglik` uç noktasından 30 saniyede bir yenilenir.</p>
    </div>
  );
}
