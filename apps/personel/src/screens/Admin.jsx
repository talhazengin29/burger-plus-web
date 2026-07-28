import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, jsonGonder } from "../lib/adminApi";
import "./Admin.css";

const BOS_URUN = { ad: "", fiyat: "", kategori: "Burgerler", temelMiktar: "", gorsel: "", aciklama: "", malzemeler: "", alerjenler: "", aktif: true };
const BOS_STOK = { ad: "", kategori: "Mutfak", birim: "adet", mevcut: "", kritikSeviye: "", birimMaliyet: "" };
const BOS_PERSONEL = { ad: "", soyad: "", rol: "Mutfak", email: "", telefon: "", saatlikUcret: "" };

const BOLUMLER = [
  ["genel", "Genel Bakış", "▦"],
  ["urunler", "Ürünler", "◆"],
  ["stok", "Stok & Mutfak", "▤"],
  ["personel", "Personel", "♟"],
  ["raporlar", "Satış Raporları", "↗"],
];

const para = (n) => `₺${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tarihSaat = (d) => d ? new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

export default function Admin({ onCikis }) {
  const [bolum, setBolum] = useState("genel");
  const [dashboard, setDashboard] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [stoklar, setStoklar] = useState([]);
  const [stokHareketleri, setStokHareketleri] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [rapor, setRapor] = useState({ gunluk: [], urunler: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [urunForm, setUrunForm] = useState(null);
  const [stokForm, setStokForm] = useState(null);
  const [personelForm, setPersonelForm] = useState(null);
  const [hareket, setHareket] = useState(null);
  const [receteUrun, setReceteUrun] = useState(null);
  const [recete, setRecete] = useState({});

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    try {
      const [d, u, s, sh, p, r] = await Promise.all([
        adminIstek("/dashboard"), adminIstek("/urunler"), adminIstek("/stok"),
        adminIstek("/stok/hareketler"), adminIstek("/personeller"), adminIstek("/raporlar/satis?gun=30"),
      ]);
      setDashboard(d); setUrunler(u.urunler || []); setStoklar(s.stoklar || []);
      setStokHareketleri(sh.hareketler || []); setPersoneller(p.personeller || []); setRapor(r);
    } catch (err) {
      setHata(err.message);
    } finally {
      setYukleniyor(false);
    }
  }, []);

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

  const stokKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/stok", jsonGonder("POST", stokForm)), "Stok kalemi kaydedildi.")) setStokForm(null);
  };

  const personelKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/personeller", jsonGonder("POST", personelForm)), "Personel kaydı güncellendi.")) setPersonelForm(null);
  };

  const hareketKaydet = async (e) => {
    e.preventDefault();
    const miktar = Number(hareket.miktar) * (hareket.yon === "cikis" ? -1 : 1);
    if (await islem(
      () => adminIstek(`/stok/${hareket.stok.id}/hareket`, jsonGonder("POST", { miktar, tip: hareket.yon, aciklama: hareket.aciklama })),
      "Stok hareketi işlendi."
    )) setHareket(null);
  };

  const receteAc = async (urun) => {
    setReceteUrun(urun);
    try {
      const d = await adminIstek(`/urunler/${urun.id}/recete`);
      setRecete(Object.fromEntries((d.kalemler || []).map((k) => [k.stokId, k.miktar])));
    } catch (err) { setHata(err.message); }
  };

  const receteKaydet = async () => {
    const kalemler = Object.entries(recete).filter(([, miktar]) => Number(miktar) > 0).map(([stokId, miktar]) => ({ stokId: Number(stokId), miktar: Number(miktar) }));
    if (await islem(() => adminIstek(`/urunler/${receteUrun.id}/recete`, jsonGonder("PUT", { kalemler })), "Ürün reçetesi kaydedildi.")) setReceteUrun(null);
  };

  const enYuksekCiro = Math.max(1, ...rapor.gunluk.map((g) => Number(g.ciro)));
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
                <Metrik ad="Kritik stok" deger={dashboard.kritikStok} alt={dashboard.kritikStok ? "İşlem gerekli" : "Stoklar sağlıklı"} renk={dashboard.kritikStok ? "kirmizi" : "yesil"} />
                <Metrik ad="Stok değeri" deger={para(dashboard.stokDegeri)} alt={`${stoklar.length} stok kalemi`} renk="mavi" />
                <Metrik ad="Ekip" deger={`${dashboard.vardiyada}/${dashboard.personel}`} alt="Şu an vardiyada" renk="mor" />
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Son 30 gün satış hareketi" alt={para(toplamCiro)}>
                  <MiniGrafik veriler={rapor.gunluk} max={enYuksekCiro} />
                </Panel>
                <Panel baslik="En çok satanlar" alt="Son 30 gün">
                  <div className="admin-siralama">{dashboard.populer?.length ? dashboard.populer.map((u, i) => (
                    <div key={u.urun_ad}><span>{i + 1}</span><b>{u.urun_ad}</b><small>{u.adet} adet</small><strong>{para(u.ciro)}</strong></div>
                  )) : <Bos yazi="Henüz satış verisi yok." />}</div>
                </Panel>
              </section>
              <Panel baslik="Operasyon uyarıları" alt="Canlı kontrol">
                <div className="admin-uyarilar">
                  {stoklar.filter((s) => s.kritik).slice(0, 5).map((s) => <div key={s.id}><i /> <b>{s.ad}</b><span>{s.mevcut} {s.birim} kaldı</span></div>)}
                  {!stoklar.some((s) => s.kritik) && <Bos yazi="Kritik seviyede stok bulunmuyor." />}
                </div>
              </Panel>
            </>}

            {bolum === "urunler" && <>
              <BolumBaslik baslik="Menü kataloğu" aciklama="Müşteri uygulamasında yayınlanan ürünleri ve üretim reçetelerini yönetin." buton="+ Yeni ürün" onClick={() => setUrunForm({ ...BOS_URUN })} />
              <div className="admin-kart-grid">{urunler.map((u) => (
                <article className={`admin-urun-kart ${!u.aktif ? "pasif" : ""}`} key={u.id}>
                  <img src={u.gorsel || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"} alt="" />
                  <div><span className="admin-rozet">{u.kategori}</span><h3>{u.ad}</h3><p>{u.temelMiktar || "—"} {u.kategori === "İçecekler" ? "ml" : "gr"} · {u.satilabilirAdet == null ? "Reçete yok" : `${u.satilabilirAdet} porsiyon`}</p><strong>{para(u.fiyat)}</strong></div>
                  <footer><button onClick={() => setUrunForm({ ...u, malzemeler: (u.malzemeler || []).join(", "), alerjenler: (u.alerjenler || []).join(", ") })}>Düzenle</button><button onClick={() => receteAc(u)}>Reçete</button><button className="tehlike" onClick={() => islem(() => adminIstek(`/urunler/${u.id}/aktif`, jsonGonder("PATCH", { aktif: !u.aktif })), u.aktif ? "Ürün yayından kaldırıldı." : "Ürün yayınlandı.")}>{u.aktif ? "Pasife al" : "Yayınla"}</button></footer>
                </article>
              ))}</div>
            </>}

            {bolum === "stok" && <>
              <BolumBaslik baslik="Mutfak stokları" aciklama="Hammadde, ambalaj ve sarf malzemelerinin canlı miktarları." buton="+ Stok kalemi" onClick={() => setStokForm({ ...BOS_STOK })} />
              <Panel baslik="Stok listesi" alt={`${stoklar.filter((s) => s.kritik).length} kritik kalem`}>
                <div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Malzeme</th><th>Kategori</th><th>Mevcut</th><th>Kritik seviye</th><th>Değer</th><th /></tr></thead><tbody>{stoklar.map((s) => (
                  <tr key={s.id} className={s.kritik ? "kritik" : ""}><td><b>{s.ad}</b>{s.kritik && <small>Kritik stok</small>}</td><td>{s.kategori}</td><td><strong>{s.mevcut} {s.birim}</strong></td><td>{s.kritik_seviye} {s.birim}</td><td>{para(s.mevcut * s.birim_maliyet)}</td><td><button className="tablo-btn" onClick={() => setHareket({ stok: s, yon: "giris", miktar: "", aciklama: "" })}>Hareket</button><button className="tablo-btn" onClick={() => setStokForm({ id: s.id, ad: s.ad, kategori: s.kategori, birim: s.birim, mevcut: s.mevcut, kritikSeviye: s.kritik_seviye, birimMaliyet: s.birim_maliyet })}>Düzenle</button></td></tr>
                ))}</tbody></table></div>
              </Panel>
              <Panel baslik="Son stok hareketleri" alt="Satış, tedarik ve fire kayıtları">
                <div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Tarih</th><th>Malzeme</th><th>Tip</th><th>Miktar</th><th>Açıklama</th></tr></thead><tbody>{stokHareketleri.slice(0, 30).map((h) => <tr key={h.id}><td>{tarihSaat(h.olusturma)}</td><td><b>{h.ad}</b></td><td>{h.tip}</td><td><strong className={h.miktar < 0 ? "eksi" : "arti"}>{h.miktar > 0 ? "+" : ""}{h.miktar} {h.birim}</strong></td><td>{h.aciklama || "—"}</td></tr>)}</tbody></table>{!stokHareketleri.length && <Bos yazi="Henüz stok hareketi yok." />}</div>
              </Panel>
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
              <Panel baslik="Günlük ciro" alt="30 gün"><MiniGrafik veriler={rapor.gunluk} max={enYuksekCiro} /></Panel>
              <Panel baslik="Ürün performansı" alt={`${rapor.urunler.length} ürün`}><div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Ürün</th><th>Satılan</th><th>Ciro</th><th>Pay</th></tr></thead><tbody>{rapor.urunler.map((u) => <tr key={u.urun_ad}><td><b>{u.urun_ad}</b></td><td>{u.adet}</td><td><strong>{para(u.ciro)}</strong></td><td>%{toplamCiro ? ((u.ciro / toplamCiro) * 100).toFixed(1) : 0}</td></tr>)}</tbody></table></div></Panel>
            </>}
          </div>
        )}
      </main>

      {urunForm && <Modal baslik={urunForm.id ? "Ürünü düzenle" : "Yeni ürün"} kapat={() => setUrunForm(null)}><form className="admin-form" onSubmit={urunKaydet}><Ikili><Alan etiket="Ürün adı"><input required value={urunForm.ad} onChange={(e) => setUrunForm({ ...urunForm, ad: e.target.value })} /></Alan><Alan etiket="Kategori"><select value={urunForm.kategori} onChange={(e) => setUrunForm({ ...urunForm, kategori: e.target.value })}><option>Burgerler</option><option>Yan Lezzetler</option><option>İçecekler</option></select></Alan></Ikili><Ikili><Alan etiket="Fiyat (₺)"><input required type="number" min="0" step="0.01" value={urunForm.fiyat} onChange={(e) => setUrunForm({ ...urunForm, fiyat: e.target.value })} /></Alan><Alan etiket="Temel miktar (gr/ml)"><input required type="number" min="1" value={urunForm.temelMiktar} onChange={(e) => setUrunForm({ ...urunForm, temelMiktar: e.target.value })} /></Alan></Ikili><Alan etiket="Görsel URL"><input value={urunForm.gorsel || ""} onChange={(e) => setUrunForm({ ...urunForm, gorsel: e.target.value })} /></Alan><Alan etiket="Açıklama"><textarea value={urunForm.aciklama || ""} onChange={(e) => setUrunForm({ ...urunForm, aciklama: e.target.value })} /></Alan><Alan etiket="Malzemeler (virgülle)"><input value={urunForm.malzemeler || ""} onChange={(e) => setUrunForm({ ...urunForm, malzemeler: e.target.value })} /></Alan><Alan etiket="Alerjenler (virgülle)"><input value={urunForm.alerjenler || ""} onChange={(e) => setUrunForm({ ...urunForm, alerjenler: e.target.value })} /></Alan><FormAlt kapat={() => setUrunForm(null)} /></form></Modal>}
      {stokForm && <Modal baslik={stokForm.id ? "Stok kalemini düzenle" : "Stok kalemi ekle"} kapat={() => setStokForm(null)}><form className="admin-form" onSubmit={stokKaydet}><Ikili><Alan etiket="Malzeme adı"><input required value={stokForm.ad} onChange={(e) => setStokForm({ ...stokForm, ad: e.target.value })} /></Alan><Alan etiket="Kategori"><input value={stokForm.kategori} onChange={(e) => setStokForm({ ...stokForm, kategori: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Birim"><select value={stokForm.birim} onChange={(e) => setStokForm({ ...stokForm, birim: e.target.value })}><option>adet</option><option>gr</option><option>kg</option><option>ml</option><option>lt</option></select></Alan><Alan etiket="Mevcut"><input required type="number" step="0.01" value={stokForm.mevcut} onChange={(e) => setStokForm({ ...stokForm, mevcut: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Kritik seviye"><input type="number" step="0.01" value={stokForm.kritikSeviye} onChange={(e) => setStokForm({ ...stokForm, kritikSeviye: e.target.value })} /></Alan><Alan etiket="Birim maliyet"><input type="number" step="0.01" value={stokForm.birimMaliyet} onChange={(e) => setStokForm({ ...stokForm, birimMaliyet: e.target.value })} /></Alan></Ikili><FormAlt kapat={() => setStokForm(null)} /></form></Modal>}
      {personelForm && <Modal baslik={personelForm.id ? "Personeli düzenle" : "Personel ekle"} kapat={() => setPersonelForm(null)}><form className="admin-form" onSubmit={personelKaydet}><Ikili><Alan etiket="Ad"><input required value={personelForm.ad} onChange={(e) => setPersonelForm({ ...personelForm, ad: e.target.value })} /></Alan><Alan etiket="Soyad"><input required value={personelForm.soyad} onChange={(e) => setPersonelForm({ ...personelForm, soyad: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Rol"><select value={personelForm.rol} onChange={(e) => setPersonelForm({ ...personelForm, rol: e.target.value })}><option>Mutfak</option><option>Salon</option><option>Kasiyer</option><option>Yönetici</option></select></Alan><Alan etiket="Saatlik ücret"><input type="number" value={personelForm.saatlikUcret} onChange={(e) => setPersonelForm({ ...personelForm, saatlikUcret: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="E-posta"><input type="email" value={personelForm.email} onChange={(e) => setPersonelForm({ ...personelForm, email: e.target.value })} /></Alan><Alan etiket="Telefon"><input value={personelForm.telefon} onChange={(e) => setPersonelForm({ ...personelForm, telefon: e.target.value })} /></Alan></Ikili><FormAlt kapat={() => setPersonelForm(null)} /></form></Modal>}
      {hareket && <Modal baslik={`${hareket.stok.ad} · stok hareketi`} kapat={() => setHareket(null)}><form className="admin-form" onSubmit={hareketKaydet}><Alan etiket="Hareket tipi"><select value={hareket.yon} onChange={(e) => setHareket({ ...hareket, yon: e.target.value })}><option value="giris">Stok girişi</option><option value="cikis">Fire / çıkış</option></select></Alan><Alan etiket={`Miktar (${hareket.stok.birim})`}><input required autoFocus type="number" min="0.01" step="0.01" value={hareket.miktar} onChange={(e) => setHareket({ ...hareket, miktar: e.target.value })} /></Alan><Alan etiket="Açıklama"><input value={hareket.aciklama} onChange={(e) => setHareket({ ...hareket, aciklama: e.target.value })} placeholder="Tedarik, fire, sayım düzeltmesi…" /></Alan><FormAlt kapat={() => setHareket(null)} /></form></Modal>}
      {receteUrun && <Modal baslik={`${receteUrun.ad} · üretim reçetesi`} kapat={() => setReceteUrun(null)}><p className="modal-aciklama">Bir porsiyon hazırlanırken tüketilen stok miktarlarını girin. Satış geldiğinde bu miktarlar otomatik düşülür.</p><div className="recete-liste">{stoklar.map((s) => <label key={s.id}><span><b>{s.ad}</b><small>Mevcut: {s.mevcut} {s.birim}</small></span><input type="number" min="0" step="0.01" value={recete[s.id] || ""} onChange={(e) => setRecete({ ...recete, [s.id]: e.target.value })} placeholder={s.birim} /></label>)}</div><div className="form-alt"><button onClick={() => setReceteUrun(null)}>Vazgeç</button><button className="primary" onClick={receteKaydet}>Reçeteyi kaydet</button></div></Modal>}
    </div>
  );
}

function Metrik({ ad, deger, alt, renk }) { return <article className={`admin-metrik ${renk}`}><span>{ad}</span><strong>{deger}</strong><small>{alt}</small></article>; }
function Panel({ baslik, alt, children }) { return <section className="admin-panel"><header><h2>{baslik}</h2><span>{alt}</span></header>{children}</section>; }
function Bos({ yazi }) { return <div className="admin-bos">{yazi}</div>; }
function BolumBaslik({ baslik, aciklama, buton, onClick }) { return <div className="admin-bolum-baslik"><div><h2>{baslik}</h2><p>{aciklama}</p></div>{buton && <button onClick={onClick}>{buton}</button>}</div>; }
function MiniGrafik({ veriler, max }) { return <div className="mini-grafik">{veriler.length ? veriler.slice(-14).map((g) => <div key={g.gun} title={`${g.gun}: ${para(g.ciro)}`}><i style={{ height: `${Math.max(5, (g.ciro / max) * 100)}%` }} /><small>{new Date(g.gun).getDate()}</small></div>) : <Bos yazi="Grafik için satış verisi bekleniyor." />}</div>; }
function Modal({ baslik, kapat, children }) { return <div className="admin-modal-perde" onMouseDown={(e) => e.target === e.currentTarget && kapat()}><section className="admin-modal"><header><h2>{baslik}</h2><button onClick={kapat}>×</button></header>{children}</section></div>; }
function Alan({ etiket, children }) { return <label className="admin-alan"><span>{etiket}</span>{children}</label>; }
function Ikili({ children }) { return <div className="admin-ikili">{children}</div>; }
function FormAlt({ kapat }) { return <div className="form-alt"><button type="button" onClick={kapat}>Vazgeç</button><button className="primary" type="submit">Kaydet</button></div>; }
