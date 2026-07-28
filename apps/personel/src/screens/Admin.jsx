import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, jsonGonder } from "../lib/adminApi";
import "./Admin.css";

const BOS_URUN = { ad: "", fiyat: "", kategori: "Burgerler", temelMiktar: "", gorsel: "", aciklama: "", malzemeler: "", alerjenler: "", aktif: true };
const BOS_PERSONEL = { ad: "", soyad: "", rol: "Mutfak", email: "", telefon: "", saatlikUcret: "" };

const BOLUMLER = [
  ["genel", "Genel Bakış", "▦"],
  ["urunler", "Ürünler", "◆"],
  ["personel", "Personel", "♟"],
  ["raporlar", "Satış Raporları", "↗"],
];

const para = (n) => `₺${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tarihSaat = (d) => d ? new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function Admin({ onCikis }) {
  const [bolum, setBolum] = useState("genel");
  const [dashboard, setDashboard] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [rapor, setRapor] = useState({ gunluk: [], urunler: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [urunForm, setUrunForm] = useState(null);
  const [personelForm, setPersonelForm] = useState(null);

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    const istekler = [
      ["Genel bakış", "/dashboard"], ["Ürünler", "/urunler"], ["Personel", "/personeller"],
      ["Satış raporları", "/raporlar/satis?gun=30"],
    ];
    const sonuclar = await Promise.allSettled(istekler.map(([, yol]) => adminIstek(yol)));
    const yetkiHatasi = sonuclar.find((sonuc) =>
      sonuc.status === "rejected" && [401, 403].includes(sonuc.reason?.status)
    );
    if (yetkiHatasi) {
      setYukleniyor(false);
      onCikis();
      return;
    }

    const [d, u, p, r] = sonuclar.map((sonuc) =>
      sonuc.status === "fulfilled" ? sonuc.value : null
    );
    if (d) setDashboard(d);
    if (u) setUrunler(u.urunler || []);
    if (p) setPersoneller(p.personeller || []);
    if (r) setRapor(r);

    const hatalar = sonuclar.flatMap((sonuc, index) =>
      sonuc.status === "rejected" ? [`${istekler[index][0]}: ${sonuc.reason.message}`] : []
    );
    setHata(hatalar.join(" • "));
    setYukleniyor(false);
  }, [onCikis]);

  useEffect(() => { verileriYukle(); }, [verileriYukle]);
  useEffect(() => {
    if (!bildirim) return;
    const timer = setTimeout(() => setBildirim(""), 3000);
    return () => clearTimeout(timer);
  }, [bildirim]);

  const islem = async (fn, mesaj) => {
    setHata("");
    try { await fn(); setBildirim(mesaj); await verileriYukle(); return true; }
    catch (err) { setHata(err.message); return false; }
  };

  const urunKaydet = async (e) => {
    e.preventDefault();
    const veri = {
      ...urunForm,
      fiyat: Number(urunForm.fiyat), temelMiktar: Number(urunForm.temelMiktar),
      malzemeler: urunForm.malzemeler.split(",").map((x) => x.trim()).filter(Boolean),
      alerjenler: urunForm.alerjenler.split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (await islem(() => adminIstek("/urunler", jsonGonder("POST", veri)), "Ürün kataloğu güncellendi.")) setUrunForm(null);
  };

  const personelKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/personeller", jsonGonder("POST", personelForm)), "Personel kaydı güncellendi.")) setPersonelForm(null);
  };

  const toplamCiro = useMemo(() => rapor.gunluk.reduce((t, g) => t + Number(g.ciro), 0), [rapor]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-marka"><span>BP</span><div>Burger Plus<small>Yönetim Merkezi</small></div></div>
        <nav>{BOLUMLER.map(([id, ad, ikon]) => (
          <button key={id} className={bolum === id ? "aktif" : ""} onClick={() => setBolum(id)}><b>{ikon}</b>{ad}</button>
        ))}</nav>
        <div className="admin-sidebar-alt"><i className={hata ? "durum-hata" : ""} />{hata ? "Bağlantı sorunu" : "Sistem çevrimiçi"}</div>
      </aside>

      <main className="admin-main">
        <header className="admin-ust">
          <div><span className="admin-kicker">İŞLETME YÖNETİMİ</span><h1>{BOLUMLER.find(([id]) => id === bolum)?.[1]}</h1></div>
          <div className="admin-ust-sag"><button onClick={verileriYukle}>↻ Yenile</button><button onClick={onCikis}>Çıkış</button><span className="admin-avatar">A</span></div>
        </header>

        {bildirim && <div className="admin-toast">✓ {bildirim}</div>}
        {hata && <div className="admin-hata">{hata}</div>}
        {yukleniyor && !dashboard ? <div className="admin-yukleniyor">Veriler hazırlanıyor…</div> : (
          <div className="admin-icerik">
            {bolum === "genel" && dashboard && <>
              <section className="admin-metrikler">
                <Metrik ad="Bugünkü ciro" deger={para(dashboard.bugunCiro)} alt={`${dashboard.bugunSiparis} sipariş`} renk="turuncu" />
                <Metrik ad="Bugünkü sipariş" deger={dashboard.bugunSiparis} alt="Toplam sipariş" renk="yesil" />
                <Metrik ad="Menü" deger={urunler.length} alt="Katalogdaki ürünler" renk="mavi" />
                <Metrik ad="Ekip" deger={`${dashboard.vardiyada}/${dashboard.personel}`} alt="Şu an vardiyada" renk="mor" />
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Son 30 gün satış hareketi" alt={para(toplamCiro)}>
                  <SatisCizgiGrafigi veriler={rapor.gunluk} />
                </Panel>
                <Panel baslik="En çok satanlar" alt="Son 30 gün">
                  <div className="admin-siralama">{dashboard.populer?.length ? dashboard.populer.map((u, i) => (
                    <div key={u.urun_ad}><span>{i + 1}</span><b>{u.urun_ad}</b><small>{u.adet} adet</small><strong>{para(u.ciro)}</strong></div>
                  )) : <Bos yazi="Henüz satış verisi yok." />}</div>
                </Panel>
              </section>
            </>}

            {bolum === "urunler" && <>
              <BolumBaslik baslik="Menü kataloğu" aciklama="Müşteri uygulamasında yayınlanan ürünleri yönetin." buton="+ Yeni ürün" onClick={() => setUrunForm({ ...BOS_URUN })} />
              <div className="admin-kart-grid">{urunler.map((u) => (
                <article className={`admin-urun-kart ${!u.aktif ? "pasif" : ""}`} key={u.id}>
                  <img src={u.gorsel || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"} alt="" />
                  <div><span className="admin-rozet">{u.kategori}</span><h3>{u.ad}</h3><p>{u.temelMiktar || "—"} {u.kategori === "İçecekler" ? "ml" : "gr"}</p><strong>{para(u.fiyat)}</strong></div>
                  <footer><button onClick={() => setUrunForm({ ...u, malzemeler: (u.malzemeler || []).join(", "), alerjenler: (u.alerjenler || []).join(", ") })}>Düzenle</button><button className="tehlike" onClick={() => islem(() => adminIstek(`/urunler/${u.id}/aktif`, jsonGonder("PATCH", { aktif: !u.aktif })), u.aktif ? "Ürün yayından kaldırıldı." : "Ürün yayınlandı.")}>{u.aktif ? "Pasife al" : "Yayınla"}</button></footer>
                </article>
              ))}</div>
            </>}

            {bolum === "personel" && <>
              <BolumBaslik baslik="Ekip ve vardiyalar" aciklama="Giriş–çıkış saatleri, çalışma süresi ve tahmini ücret takibi." buton="+ Personel ekle" onClick={() => setPersonelForm({ ...BOS_PERSONEL })} />
              <div className="admin-personel-grid">{personeller.map((p) => (
                <article className="admin-personel" key={p.id}><div className="personel-avatar">{p.ad[0]}{p.soyad[0]}</div><div className="personel-bilgi"><h3>{p.ad} {p.soyad}</h3><span>{p.rol}</span><small>{p.acik_vardiya_id ? `Giriş: ${tarihSaat(p.vardiya_giris)}` : "Vardiyada değil"}</small></div><div className="personel-saat"><b>{p.aylik_saat.toFixed(1)} sa</b><small>{para(p.aylik_saat * p.saatlik_ucret)}</small></div><button className={p.acik_vardiya_id ? "vardiya-cikis" : "vardiya-giris"} onClick={() => islem(() => adminIstek(`/personeller/${p.id}/vardiya`, jsonGonder("POST", { islem: p.acik_vardiya_id ? "cikis" : "giris" })), p.acik_vardiya_id ? "Çıkış kaydedildi." : "Giriş kaydedildi.")}>{p.acik_vardiya_id ? "Çıkış yap" : "Giriş yap"}</button><button className="duzenle-link" onClick={() => setPersonelForm({ id: p.id, ad: p.ad, soyad: p.soyad, rol: p.rol, email: p.email || "", telefon: p.telefon || "", saatlikUcret: p.saatlik_ucret })}>Düzenle</button></article>
              ))}</div>
            </>}

            {bolum === "raporlar" && <>
              <BolumBaslik baslik="Satış analizi" aciklama="Son 30 günün ürün, adet ve ciro performansı." />
              <section className="admin-metrikler rapor-metrik"><Metrik ad="30 günlük ciro" deger={para(toplamCiro)} alt={`${rapor.gunluk.reduce((t, g) => t + g.adet, 0)} ürün`} renk="turuncu" /><Metrik ad="Günlük ortalama" deger={para(toplamCiro / Math.max(1, rapor.gunluk.length))} alt={`${rapor.gunluk.length} aktif satış günü`} renk="mavi" /></section>
              <Panel baslik="Ciro ve sipariş trendi" alt="Son 30 gün"><SatisCizgiGrafigi veriler={rapor.gunluk} /></Panel>
              <Panel baslik="Ürün performansı" alt={`${rapor.urunler.length} ürün`}><div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Ürün</th><th>Satılan</th><th>Ciro</th><th>Pay</th></tr></thead><tbody>{rapor.urunler.map((u) => <tr key={u.urun_ad}><td><b>{u.urun_ad}</b></td><td>{u.adet}</td><td><strong>{para(u.ciro)}</strong></td><td>%{toplamCiro ? ((u.ciro / toplamCiro) * 100).toFixed(1) : 0}</td></tr>)}</tbody></table></div></Panel>
            </>}
          </div>
        )}
      </main>

      {urunForm && <Modal baslik={urunForm.id ? "Ürünü düzenle" : "Yeni ürün"} kapat={() => setUrunForm(null)}><form className="admin-form" onSubmit={urunKaydet}><Ikili><Alan etiket="Ürün adı"><input required value={urunForm.ad} onChange={(e) => setUrunForm({ ...urunForm, ad: e.target.value })} /></Alan><Alan etiket="Kategori"><select value={urunForm.kategori} onChange={(e) => setUrunForm({ ...urunForm, kategori: e.target.value })}><option>Burgerler</option><option>Yan Lezzetler</option><option>İçecekler</option></select></Alan></Ikili><Ikili><Alan etiket="Fiyat (₺)"><input required type="number" min="0" step="0.01" value={urunForm.fiyat} onChange={(e) => setUrunForm({ ...urunForm, fiyat: e.target.value })} /></Alan><Alan etiket="Temel miktar (gr/ml)"><input required type="number" min="1" value={urunForm.temelMiktar} onChange={(e) => setUrunForm({ ...urunForm, temelMiktar: e.target.value })} /></Alan></Ikili><Alan etiket="Görsel URL"><input value={urunForm.gorsel || ""} onChange={(e) => setUrunForm({ ...urunForm, gorsel: e.target.value })} /></Alan><Alan etiket="Açıklama"><textarea value={urunForm.aciklama || ""} onChange={(e) => setUrunForm({ ...urunForm, aciklama: e.target.value })} /></Alan><Alan etiket="Malzemeler (virgülle)"><input value={urunForm.malzemeler || ""} onChange={(e) => setUrunForm({ ...urunForm, malzemeler: e.target.value })} /></Alan><Alan etiket="Alerjenler (virgülle)"><input value={urunForm.alerjenler || ""} onChange={(e) => setUrunForm({ ...urunForm, alerjenler: e.target.value })} /></Alan><FormAlt kapat={() => setUrunForm(null)} /></form></Modal>}
      {personelForm && <Modal baslik={personelForm.id ? "Personeli düzenle" : "Personel ekle"} kapat={() => setPersonelForm(null)}><form className="admin-form" onSubmit={personelKaydet}><Ikili><Alan etiket="Ad"><input required value={personelForm.ad} onChange={(e) => setPersonelForm({ ...personelForm, ad: e.target.value })} /></Alan><Alan etiket="Soyad"><input required value={personelForm.soyad} onChange={(e) => setPersonelForm({ ...personelForm, soyad: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Rol"><select value={personelForm.rol} onChange={(e) => setPersonelForm({ ...personelForm, rol: e.target.value })}><option>Mutfak</option><option>Salon</option><option>Kasiyer</option><option>Yönetici</option></select></Alan><Alan etiket="Saatlik ücret"><input type="number" value={personelForm.saatlikUcret} onChange={(e) => setPersonelForm({ ...personelForm, saatlikUcret: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="E-posta"><input type="email" value={personelForm.email} onChange={(e) => setPersonelForm({ ...personelForm, email: e.target.value })} /></Alan><Alan etiket="Telefon"><input value={personelForm.telefon} onChange={(e) => setPersonelForm({ ...personelForm, telefon: e.target.value })} /></Alan></Ikili><FormAlt kapat={() => setPersonelForm(null)} /></form></Modal>}
    </div>
  );
}

function Metrik({ ad, deger, alt, renk }) { return <article className={`admin-metrik ${renk}`}><span>{ad}</span><strong>{deger}</strong><small>{alt}</small></article>; }
function Panel({ baslik, alt, children }) { return <section className="admin-panel"><header><h2>{baslik}</h2><span>{alt}</span></header>{children}</section>; }
function Bos({ yazi }) { return <div className="admin-bos">{yazi}</div>; }
function BolumBaslik({ baslik, aciklama, buton, onClick }) { return <div className="admin-bolum-baslik"><div><h2>{baslik}</h2><p>{aciklama}</p></div>{buton && <button onClick={onClick}>{buton}</button>}</div>; }
function SatisCizgiGrafigi({ veriler }) {
  const [secili, setSecili] = useState(null);
  const gunler = sonOtuzGunuDoldur(veriler);
  const ciroMax = Math.max(1, ...gunler.map((g) => g.ciro));
  const adetMax = Math.max(1, ...gunler.map((g) => g.adet));
  const w = 680;
  const h = 236;
  const pad = { sol: 12, sag: 12, ust: 18, alt: 31 };
  const x = (i) => pad.sol + (i / Math.max(1, gunler.length - 1)) * (w - pad.sol - pad.sag);
  const y = (deger, max) => pad.ust + (1 - deger / max) * (h - pad.ust - pad.alt);
  const noktalar = (alan, max) => gunler.map((g, i) => `${x(i)},${y(g[alan], max)}`).join(" ");
  const alan = `M ${x(0)} ${h - pad.alt} L ${gunler.map((g, i) => `${x(i)} ${y(g.ciro, ciroMax)}`).join(" L ")} L ${x(gunler.length - 1)} ${h - pad.alt} Z`;
  const seciliGun = secili == null ? gunler[gunler.length - 1] : gunler[secili];
  const enYuksek = gunler.reduce((en, g) => g.ciro > en.ciro ? g : en, gunler[0]);
  const sonYedi = gunler.slice(-7).reduce((t, g) => t + g.ciro, 0);
  const oncekiYedi = gunler.slice(-14, -7).reduce((t, g) => t + g.ciro, 0);
  const degisim = oncekiYedi ? ((sonYedi - oncekiYedi) / oncekiYedi) * 100 : null;

  if (!veriler.length) return <Bos yazi="Grafik için satış verisi bekleniyor." />;

  return <div className="cizgi-grafik">
    <div className="cizgi-grafik-ust">
      <div className="cizgi-lejant"><span><i className="ciro" />Ciro</span><span><i className="adet" />Ürün adedi</span></div>
      <div className="cizgi-secili"><b>{gunEtiketi(seciliGun.gun)}</b><span>{para(seciliGun.ciro)} · {seciliGun.adet} ürün</span></div>
    </div>
    <div className="cizgi-cizim">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Son 30 gün ciro ve ürün adedi çizgi grafiği">
        <defs>
          <linearGradient id="ciro-alani" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ff6b00" stopOpacity=".32" /><stop offset="1" stopColor="#ff6b00" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((oran) => <line key={oran} className="cizgi-grid" x1={pad.sol} x2={w - pad.sag} y1={pad.ust + oran * (h - pad.ust - pad.alt)} y2={pad.ust + oran * (h - pad.ust - pad.alt)} />)}
        <path d={alan} fill="url(#ciro-alani)" />
        <polyline className="cizgi ciro" points={noktalar("ciro", ciroMax)} />
        <polyline className="cizgi adet" points={noktalar("adet", adetMax)} />
        {gunler.map((g, i) => <g key={g.gun} onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} tabIndex={0} role="button" aria-label={`${gunEtiketi(g.gun)}: ${para(g.ciro)}, ${g.adet} ürün`}>
          <line className="cizgi-hedef" x1={x(i) - 8} x2={x(i) + 8} y1={pad.ust} y2={h - pad.alt} />
          <circle className={`cizgi-nokta ${secili === i ? "aktif" : ""}`} cx={x(i)} cy={y(g.ciro, ciroMax)} r={secili === i ? "4.5" : "2.5"} />
        </g>)}
        {gunler.filter((_, i) => i === 0 || i === gunler.length - 1 || i % 7 === 0).map((g, i) => <text className="cizgi-etiket" key={g.gun} x={x(gunler.indexOf(g))} y={h - 8} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{new Date(g.gun).getDate()}</text>)}
      </svg>
    </div>
    <div className="cizgi-ozet">
      <div><span>En yüksek gün</span><b>{para(enYuksek.ciro)}</b><small>{gunEtiketi(enYuksek.gun)}</small></div>
      <div><span>Günlük ortalama</span><b>{para(gunler.reduce((t, g) => t + g.ciro, 0) / gunler.length)}</b><small>30 günlük görünüm</small></div>
      <div><span>Son 7 gün</span><b className={degisim != null && degisim < 0 ? "eksi" : "arti"}>{degisim == null ? "Yeni veri" : `${degisim >= 0 ? "+" : ""}%${degisim.toFixed(1)}`}</b><small>Önceki 7 güne göre</small></div>
    </div>
  </div>;
}

function sonOtuzGunuDoldur(veriler) {
  const kayitlar = new Map(veriler.map((g) => [String(g.gun).slice(0, 10), { ciro: Number(g.ciro || 0), adet: Number(g.adet || 0) }]));
  return Array.from({ length: 30 }, (_, i) => {
    const tarih = new Date();
    tarih.setHours(12, 0, 0, 0);
    tarih.setDate(tarih.getDate() - (29 - i));
    const gun = tarih.toISOString().slice(0, 10);
    return { gun, ...(kayitlar.get(gun) || { ciro: 0, adet: 0 }) };
  });
}

function gunEtiketi(gun) { return new Date(`${gun}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }
function Modal({ baslik, kapat, children }) { return <div className="admin-modal-perde" onMouseDown={(e) => e.target === e.currentTarget && kapat()}><section className="admin-modal"><header><h2>{baslik}</h2><button onClick={kapat}>×</button></header>{children}</section></div>; }
function Alan({ etiket, children }) { return <label className="admin-alan"><span>{etiket}</span>{children}</label>; }
function Ikili({ children }) { return <div className="admin-ikili">{children}</div>; }
function FormAlt({ kapat }) { return <div className="form-alt"><button type="button" onClick={kapat}>Vazgeç</button><button className="primary" type="submit">Kaydet</button></div>; }
