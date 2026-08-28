import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, giderBelgesiYukle, jsonGonder } from "../../lib/adminApi";
import { socket } from "../../lib/socket";
import AdminIcon from "../../components/AdminIcon";
import FinansRaporlari from "./FinansRaporlari";
import "./FinansYonetimi.css";

const BUGUN = new Date().toISOString().slice(0, 10);
const BOS_GIDER = { baslik: "", aciklama: "", tutar: "", kdvOrani: 20, kategoriId: "", tedarikciId: "", odemeYontemi: "nakit", giderTarihi: BUGUN, odemeTarihi: "", belgeUrl: "" };
const BOS_TEDARIKCI = { ad: "", yetkili: "", telefon: "", email: "", vergiNo: "", notlar: "" };
const BOS_DUZENLI = { ...BOS_GIDER, periyot: "aylik", sonrakiTarih: BUGUN, bitisTarihi: "", aktif: true };
const ODEME_ADLARI = { nakit: "Nakit kasa", banka: "Banka", kredi_karti: "Kredi kartı", vadeli: "Tedarikçi hesabı", isletme_sahibi: "İşletme sahibi" };
const DURUM_ADLARI = { onay_bekliyor: "Onay bekliyor", onaylandi: "Onaylandı", reddedildi: "Reddedildi", iptal: "İptal edildi" };

const para = (deger) => `₺${Number(deger || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tarih = (deger) => deger ? new Date(`${String(deger).slice(0, 10)}T12:00:00`).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function Modal({ baslik, aciklama, onKapat, children, genis = false }) {
  return <div className="finans-modal-arkaplan" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onKapat()}>
    <section className={`finans-modal ${genis ? "genis" : ""}`} role="dialog" aria-modal="true" aria-label={baslik}>
      <header><div><span>FİNANS MERKEZİ</span><h2>{baslik}</h2><p>{aciklama}</p></div><button type="button" onClick={onKapat} aria-label="Kapat"><AdminIcon name="close" /></button></header>
      {children}
    </section>
  </div>;
}

function Alan({ etiket, children, genis = false }) {
  return <label className={`finans-alan ${genis ? "genis" : ""}`}><span>{etiket}</span>{children}</label>;
}

export default function FinansYonetimi() {
  const [veri, setVeri] = useState({ giderler: [], kategoriler: [], tedarikciler: [], duzenliGiderler: [], ozet: {} });
  const [sekme, setSekme] = useState("giderler");
  const [filtre, setFiltre] = useState({ arama: "", durum: "", kategoriId: "", baslangic: "", bitis: "" });
  const [giderForm, setGiderForm] = useState(null);
  const [tedarikciForm, setTedarikciForm] = useState(null);
  const [duzenliForm, setDuzenliForm] = useState(null);
  const [kategoriFormuAcik, setKategoriFormuAcik] = useState(false);
  const [kategoriForm, setKategoriForm] = useState({ ad: "", renk: "#ff6b00" });
  const [odemeForm, setOdemeForm] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islemde, setIslemde] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [hata, setHata] = useState("");

  const yukle = useCallback(async () => {
    setYukleniyor(true); setHata("");
    try {
      const q = new URLSearchParams(Object.entries(filtre).filter(([, d]) => String(d || "").trim()));
      setVeri(await adminIstek(`/finans${q.size ? `?${q}` : ""}`));
    } catch (e) { setHata(e.message); } finally { setYukleniyor(false); }
  }, [filtre]);

  useEffect(() => { const timer = setTimeout(yukle, 180); return () => clearTimeout(timer); }, [yukle]);
  useEffect(() => {
    const yenile = () => yukle();
    socket.on("finans-guncellendi", yenile);
    return () => socket.off("finans-guncellendi", yenile);
  }, [yukle]);

  const bildir = (metin) => { setMesaj(metin); setTimeout(() => setMesaj(""), 3500); };
  const islem = async (fn, basari) => {
    setIslemde(true); setHata("");
    try { await fn(); bildir(basari); await yukle(); return true; }
    catch (e) { setHata(e.message); return false; }
    finally { setIslemde(false); }
  };

  const aktifKategoriler = useMemo(() => veri.kategoriler.filter((k) => k.aktif), [veri.kategoriler]);
  const aktifTedarikciler = useMemo(() => veri.tedarikciler.filter((t) => t.aktif), [veri.tedarikciler]);
  const bekleyenler = useMemo(() => veri.giderler.filter((g) => g.durum === "onay_bekliyor"), [veri.giderler]);

  const giderAc = (gider = null) => setGiderForm(gider ? { ...gider, giderTarihi: String(gider.giderTarihi).slice(0, 10), odemeTarihi: String(gider.odemeTarihi || "").slice(0, 10), kategoriId: String(gider.kategoriId), tedarikciId: gider.tedarikciId ? String(gider.tedarikciId) : "" } : { ...BOS_GIDER, kategoriId: String(aktifKategoriler[0]?.id || "") });
  const duzenliAc = (kayit = null) => setDuzenliForm(kayit ? { ...kayit, kategoriId: String(kayit.kategoriId), tedarikciId: kayit.tedarikciId ? String(kayit.tedarikciId) : "", sonrakiTarih: String(kayit.sonrakiTarih).slice(0, 10), bitisTarihi: String(kayit.bitisTarihi || "").slice(0, 10) } : { ...BOS_DUZENLI, kategoriId: String(aktifKategoriler[0]?.id || "") });

  const giderKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/giderler", jsonGonder("POST", giderForm)), "Gider onaya gönderildi.")) setGiderForm(null);
  };
  const belgeSec = async (dosya) => {
    if (!dosya) return;
    setIslemde(true); setHata("");
    try { const sonuc = await giderBelgesiYukle(dosya); setGiderForm((g) => ({ ...g, belgeUrl: sonuc.belgeUrl })); }
    catch (e) { setHata(e.message); } finally { setIslemde(false); }
  };
  const durumDegistir = async (gider, durum) => {
    let neden = "";
    if (durum === "reddedildi") { neden = window.prompt("Red nedenini yazın:") || ""; if (!neden.trim()) return; }
    const soru = durum === "onaylandi" ? `${gider.baslik} gideri onaylansın mı? Kasa/tedarikçi hareketi bu anda oluşur.` : `${gider.baslik} gideri ${durum === "iptal" ? "ters kayıtla iptal" : "reddedilsin"} mi?`;
    if (!window.confirm(soru)) return;
    await islem(() => adminIstek(`/giderler/${gider.id}/durum`, jsonGonder("PATCH", { durum, neden })), `Gider ${DURUM_ADLARI[durum].toLocaleLowerCase("tr-TR")}.`);
  };
  const kategoriKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/gider-kategorileri", jsonGonder("POST", kategoriForm)), "Gider kategorisi kaydedildi.")) { setKategoriForm({ ad: "", renk: "#ff6b00" }); setKategoriFormuAcik(false); }
  };
  const tedarikciKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/tedarikciler", jsonGonder("POST", tedarikciForm)), "Tedarikçi kaydedildi.")) setTedarikciForm(null);
  };
  const tedarikciOde = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek(`/tedarikciler/${odemeForm.id}/odemeler`, jsonGonder("POST", odemeForm)), "Tedarikçi ödemesi kaydedildi.")) setOdemeForm(null);
  };
  const duzenliKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/duzenli-giderler", jsonGonder("POST", duzenliForm)), "Düzenli gider planı kaydedildi.")) setDuzenliForm(null);
  };

  return <section className="finans-merkezi">
    <header className="finans-hero">
      <div><span>GELİR + GİDER KONTROLÜ</span><h2>İşletmenin gerçek nakit hareketini görün</h2><p>Giderleri belgeleyin, onaylayın; nakit kasayı, vadeli tedarikçi borçlarını ve yaklaşan ödemeleri tek yerde takip edin.</p></div>
      <button type="button" onClick={() => giderAc()}><AdminIcon name="receipt" /> Yeni gider</button>
    </header>

    {mesaj && <div className="finans-mesaj basari"><AdminIcon name="check" />{mesaj}</div>}
    {hata && <div className="finans-mesaj hata"><AdminIcon name="alert" />{hata}</div>}

    <div className="finans-metrikler">
      <article><span>Bu ay gider</span><strong>{para(veri.ozet?.ayGideri)}</strong><small>Onaylanan kayıtlar</small></article>
      <article><span>Bugün</span><strong>{para(veri.ozet?.bugunGideri)}</strong><small>Günlük gider</small></article>
      <article className="bekleyen"><span>Onay bekleyen</span><strong>{veri.ozet?.bekleyenAdet || 0}</strong><small>{para(veri.ozet?.bekleyenTutar)}</small></article>
      <article className="kasa"><span>Nakit gider hareketi</span><strong>{para(Math.abs(veri.ozet?.kasaGiderHareketi || 0))}</strong><small>Kasa kayıtları toplamı</small></article>
    </div>

    <nav className="finans-sekmeler" aria-label="Finans bölümleri">
      <button type="button" className={sekme === "giderler" ? "aktif" : ""} onClick={() => setSekme("giderler")}><AdminIcon name="receipt" />Giderler <b>{veri.giderler.length}</b></button>
      <button type="button" className={sekme === "onay" ? "aktif" : ""} onClick={() => setSekme("onay")}><AdminIcon name="check" />Onay kuyruğu <b>{bekleyenler.length}</b></button>
      <button type="button" className={sekme === "tedarikciler" ? "aktif" : ""} onClick={() => setSekme("tedarikciler")}><AdminIcon name="users" />Tedarikçiler</button>
      <button type="button" className={sekme === "duzenli" ? "aktif" : ""} onClick={() => setSekme("duzenli")}><AdminIcon name="refresh" />Düzenli giderler</button>
      <button type="button" className={sekme === "rapor" ? "aktif" : ""} onClick={() => setSekme("rapor")}><AdminIcon name="chart" />Raporlar ve bütçe</button>
    </nav>

    {(sekme === "giderler" || sekme === "onay") && <>
      <div className="finans-araclar">
        <label><AdminIcon name="search" /><input value={filtre.arama} onChange={(e) => setFiltre({ ...filtre, arama: e.target.value })} placeholder="Gider ara…" /></label>
        <select value={filtre.durum} onChange={(e) => setFiltre({ ...filtre, durum: e.target.value })}><option value="">Tüm durumlar</option>{Object.entries(DURUM_ADLARI).map(([d, ad]) => <option key={d} value={d}>{ad}</option>)}</select>
        <select value={filtre.kategoriId} onChange={(e) => setFiltre({ ...filtre, kategoriId: e.target.value })}><option value="">Tüm kategoriler</option>{aktifKategoriler.map((k) => <option key={k.id} value={k.id}>{k.ad}</option>)}</select>
        <input type="date" value={filtre.baslangic} onChange={(e) => setFiltre({ ...filtre, baslangic: e.target.value })} aria-label="Başlangıç tarihi" />
        <input type="date" value={filtre.bitis} onChange={(e) => setFiltre({ ...filtre, bitis: e.target.value })} aria-label="Bitiş tarihi" />
      </div>
      <div className="finans-kategori-seridi">
        {aktifKategoriler.slice(0, 8).map((k) => <button type="button" key={k.id} style={{ "--kategori-renk": k.renk }} onClick={() => setFiltre({ ...filtre, kategoriId: String(k.id) })}>{k.ad}</button>)}
        <button type="button" className="ekle" onClick={() => setKategoriFormuAcik(true)}>+ Kategori</button>
      </div>
      <div className="gider-tablosu-wrap">
        <table className="gider-tablosu"><thead><tr><th>Gider</th><th>Kategori</th><th>Tarih</th><th>Ödeme</th><th>Durum</th><th>Tutar</th><th>İşlem</th></tr></thead><tbody>
          {(sekme === "onay" ? bekleyenler : veri.giderler).map((g) => <tr key={g.id}>
            <td><div className="gider-ana"><i style={{ background: veri.kategoriler.find((k) => k.id === g.kategoriId)?.renk }} /><span><b>{g.baslik}</b><small>{g.tedarikciAdi || g.olusturanAdi}{g.belgeUrl && <> · <a href={g.belgeUrl} target="_blank" rel="noreferrer">Belgeyi aç</a></>}</small></span></div></td>
            <td>{g.kategoriAdi}</td><td>{tarih(g.giderTarihi)}</td><td>{ODEME_ADLARI[g.odemeYontemi]}</td>
            <td><span className={`gider-durum ${g.durum}`}>{DURUM_ADLARI[g.durum]}</span>{g.redNedeni && <small className="red-notu">{g.redNedeni}</small>}</td>
            <td className="gider-tutar">{para(g.tutar)}<small>KDV {para(g.kdvTutari)}</small></td>
            <td><div className="gider-islemler">{["onay_bekliyor", "reddedildi"].includes(g.durum) && <button type="button" onClick={() => giderAc(g)}>Düzenle</button>}{g.durum === "onay_bekliyor" && <><button type="button" className="onay" onClick={() => durumDegistir(g, "onaylandi")}>Onayla</button><button type="button" className="red" onClick={() => durumDegistir(g, "reddedildi")}>Reddet</button></>}{g.durum === "onaylandi" && <button type="button" className="red" onClick={() => durumDegistir(g, "iptal")}>İptal</button>}</div></td>
          </tr>)}
        </tbody></table>
        {!yukleniyor && !(sekme === "onay" ? bekleyenler : veri.giderler).length && <div className="finans-bos"><AdminIcon name="receipt" /><b>Kayıt bulunamadı</b><span>Yeni gider ekleyebilir veya filtreleri temizleyebilirsiniz.</span></div>}
        {yukleniyor && <div className="finans-bos">Finans kayıtları hazırlanıyor…</div>}
      </div>
    </>}

    {sekme === "tedarikciler" && <>
      <div className="finans-bolum-baslik"><div><span>TEDARİKÇİ HESAPLARI</span><h3>Borç ve ödeme takibi</h3><p>Vadeli onaylanan giderler otomatik olarak ilgili tedarikçinin bakiyesine eklenir.</p></div><button type="button" onClick={() => setTedarikciForm({ ...BOS_TEDARIKCI })}>+ Yeni tedarikçi</button></div>
      <div className="tedarikci-grid">{veri.tedarikciler.map((t) => <article className={!t.aktif ? "pasif" : ""} key={t.id}><header><span><i>{t.ad.slice(0, 2).toLocaleUpperCase("tr-TR")}</i><b>{t.ad}</b><small>{t.yetkili || "Yetkili belirtilmedi"}</small></span><strong>{para(t.bakiye)}<small>Açık bakiye</small></strong></header><dl><div><dt>Telefon</dt><dd>{t.telefon || "—"}</dd></div><div><dt>E-posta</dt><dd>{t.email || "—"}</dd></div><div><dt>Vergi no</dt><dd>{t.vergiNo || "—"}</dd></div></dl><footer><button type="button" onClick={() => setTedarikciForm({ ...t })}>Düzenle</button>{t.aktif && <button type="button" className="odeme" onClick={() => setOdemeForm({ id: t.id, ad: t.ad, tutar: "", odemeYontemi: "banka", aciklama: "" })}>Ödeme gir</button>}{t.aktif && <button type="button" className="red" onClick={() => window.confirm(`${t.ad} arşivlensin mi?`) && islem(() => adminIstek(`/tedarikciler/${t.id}`, { method: "DELETE" }), "Tedarikçi arşivlendi.")}>Arşivle</button>}</footer></article>)}</div>
    </>}

    {sekme === "rapor" && <FinansRaporlari kategoriler={veri.kategoriler} onBildirim={bildir} onHata={setHata} />}

    {sekme === "duzenli" && <>
      <div className="finans-bolum-baslik"><div><span>OTOMATİK TAKVİM</span><h3>Düzenli gider planları</h3><p>Vadesi gelen kayıtlar otomatik olarak onay kuyruğuna düşer; onay verilmeden kasayı etkilemez.</p></div><button type="button" onClick={() => duzenliAc()}>+ Düzenli gider</button></div>
      <div className="duzenli-liste">{veri.duzenliGiderler.map((d) => <article className={!d.aktif ? "pasif" : ""} key={d.id}><i><AdminIcon name="refresh" /></i><div><span>{d.periyot.toLocaleUpperCase("tr-TR")}</span><h3>{d.baslik}</h3><p>{d.kategoriAdi}{d.tedarikciAdi ? ` · ${d.tedarikciAdi}` : ""} · {ODEME_ADLARI[d.odemeYontemi]}</p></div><strong>{para(d.tutar)}<small>Sonraki: {tarih(d.sonrakiTarih)}</small></strong><footer><button type="button" onClick={() => duzenliAc(d)}>Düzenle</button>{d.aktif && <button type="button" className="red" onClick={() => window.confirm(`${d.baslik} planı durdurulsun mu?`) && islem(() => adminIstek(`/duzenli-giderler/${d.id}`, { method: "DELETE" }), "Düzenli gider durduruldu.")}>Durdur</button>}</footer></article>)}</div>
    </>}

    {giderForm && <Modal baslik={giderForm.id ? "Gideri düzenle" : "Yeni gider kaydı"} aciklama="Kaydı onaya gönderin; yalnızca onaylanan giderler finans hesaplarına yansır." onKapat={() => setGiderForm(null)} genis><GiderFormu form={giderForm} setForm={setGiderForm} kategoriler={aktifKategoriler} tedarikciler={aktifTedarikciler} onSubmit={giderKaydet} onBelge={belgeSec} islemde={islemde} /></Modal>}
    {kategoriFormuAcik && <Modal baslik="Gider kategorisi" aciklama="İşletmenize özel yeni bir harcama grubu oluşturun." onKapat={() => setKategoriFormuAcik(false)}><form className="finans-form" onSubmit={kategoriKaydet}><Alan etiket="Kategori adı" genis><input required maxLength="80" value={kategoriForm.ad} onChange={(e) => setKategoriForm({ ...kategoriForm, ad: e.target.value })} /></Alan><Alan etiket="Kategori rengi" genis><input type="color" value={kategoriForm.renk} onChange={(e) => setKategoriForm({ ...kategoriForm, renk: e.target.value })} /></Alan><div className="finans-form-alt"><button type="button" onClick={() => setKategoriFormuAcik(false)}>Vazgeç</button><button className="primary" disabled={islemde}>Kaydet</button></div></form></Modal>}
    {tedarikciForm && <Modal baslik={tedarikciForm.id ? "Tedarikçiyi düzenle" : "Yeni tedarikçi"} aciklama="İletişim ve cari takip bilgilerini kaydedin." onKapat={() => setTedarikciForm(null)} genis><form className="finans-form finans-form-grid" onSubmit={tedarikciKaydet}><Alan etiket="Tedarikçi adı"><input required value={tedarikciForm.ad} onChange={(e) => setTedarikciForm({ ...tedarikciForm, ad: e.target.value })} /></Alan><Alan etiket="Yetkili"><input value={tedarikciForm.yetkili} onChange={(e) => setTedarikciForm({ ...tedarikciForm, yetkili: e.target.value })} /></Alan><Alan etiket="Telefon"><input value={tedarikciForm.telefon} onChange={(e) => setTedarikciForm({ ...tedarikciForm, telefon: e.target.value })} /></Alan><Alan etiket="E-posta"><input type="email" value={tedarikciForm.email} onChange={(e) => setTedarikciForm({ ...tedarikciForm, email: e.target.value })} /></Alan><Alan etiket="Vergi numarası"><input value={tedarikciForm.vergiNo} onChange={(e) => setTedarikciForm({ ...tedarikciForm, vergiNo: e.target.value })} /></Alan><Alan etiket="Notlar"><textarea value={tedarikciForm.notlar} onChange={(e) => setTedarikciForm({ ...tedarikciForm, notlar: e.target.value })} /></Alan><div className="finans-form-alt"><button type="button" onClick={() => setTedarikciForm(null)}>Vazgeç</button><button className="primary" disabled={islemde}>Tedarikçiyi kaydet</button></div></form></Modal>}
    {odemeForm && <Modal baslik={`${odemeForm.ad} ödemesi`} aciklama="Ödeme tedarikçi bakiyesinden düşer; nakit seçilirse kasaya da yansır." onKapat={() => setOdemeForm(null)}><form className="finans-form" onSubmit={tedarikciOde}><Alan etiket="Ödenen tutar" genis><input required type="number" min="0.01" step="0.01" value={odemeForm.tutar} onChange={(e) => setOdemeForm({ ...odemeForm, tutar: e.target.value })} /></Alan><Alan etiket="Ödeme yöntemi" genis><select value={odemeForm.odemeYontemi} onChange={(e) => setOdemeForm({ ...odemeForm, odemeYontemi: e.target.value })}>{Object.entries(ODEME_ADLARI).filter(([id]) => id !== "vadeli").map(([id, ad]) => <option value={id} key={id}>{ad}</option>)}</select></Alan><Alan etiket="Açıklama" genis><textarea value={odemeForm.aciklama} onChange={(e) => setOdemeForm({ ...odemeForm, aciklama: e.target.value })} /></Alan><div className="finans-form-alt"><button type="button" onClick={() => setOdemeForm(null)}>Vazgeç</button><button className="primary" disabled={islemde}>Ödemeyi kaydet</button></div></form></Modal>}
    {duzenliForm && <Modal baslik="Düzenli gider planı" aciklama="Vade tarihinde otomatik onay kaydı oluşturulur." onKapat={() => setDuzenliForm(null)} genis><GiderFormu form={duzenliForm} setForm={setDuzenliForm} kategoriler={aktifKategoriler} tedarikciler={aktifTedarikciler} onSubmit={duzenliKaydet} islemde={islemde} duzenli /></Modal>}
  </section>;
}

function GiderFormu({ form, setForm, kategoriler, tedarikciler, onSubmit, onBelge, islemde, duzenli = false }) {
  return <form className="finans-form finans-form-grid" onSubmit={onSubmit}>
    <Alan etiket="Gider başlığı"><input required maxLength="140" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} placeholder="Örn. Haftalık sebze alımı" /></Alan>
    <Alan etiket="Kategori"><select required value={form.kategoriId} onChange={(e) => setForm({ ...form, kategoriId: e.target.value })}><option value="">Kategori seçin</option>{kategoriler.map((k) => <option value={k.id} key={k.id}>{k.ad}</option>)}</select></Alan>
    <Alan etiket="Toplam tutar"><input required type="number" min="0.01" step="0.01" value={form.tutar} onChange={(e) => setForm({ ...form, tutar: e.target.value })} /></Alan>
    <Alan etiket="KDV oranı (%)"><input required type="number" min="0" max="100" step="0.01" value={form.kdvOrani} onChange={(e) => setForm({ ...form, kdvOrani: e.target.value })} /></Alan>
    <Alan etiket="Ödeme yöntemi"><select value={form.odemeYontemi} onChange={(e) => setForm({ ...form, odemeYontemi: e.target.value })}>{Object.entries(ODEME_ADLARI).map(([id, ad]) => <option value={id} key={id}>{ad}</option>)}</select></Alan>
    <Alan etiket="Tedarikçi"><select required={form.odemeYontemi === "vadeli"} value={form.tedarikciId || ""} onChange={(e) => setForm({ ...form, tedarikciId: e.target.value })}><option value="">Tedarikçi seçilmedi</option>{tedarikciler.map((t) => <option value={t.id} key={t.id}>{t.ad}</option>)}</select></Alan>
    {!duzenli && <><Alan etiket="Gider tarihi"><input required type="date" value={form.giderTarihi} onChange={(e) => setForm({ ...form, giderTarihi: e.target.value })} /></Alan><Alan etiket="Ödeme tarihi"><input type="date" value={form.odemeTarihi || ""} onChange={(e) => setForm({ ...form, odemeTarihi: e.target.value })} /></Alan></>}
    {duzenli && <><Alan etiket="Tekrarlama"><select value={form.periyot} onChange={(e) => setForm({ ...form, periyot: e.target.value })}><option value="haftalik">Her hafta</option><option value="aylik">Her ay</option><option value="yillik">Her yıl</option></select></Alan><Alan etiket="Sonraki kayıt tarihi"><input required type="date" value={form.sonrakiTarih} onChange={(e) => setForm({ ...form, sonrakiTarih: e.target.value })} /></Alan><Alan etiket="Bitiş tarihi"><input type="date" value={form.bitisTarihi || ""} onChange={(e) => setForm({ ...form, bitisTarihi: e.target.value })} /></Alan></>}
    <Alan etiket="Açıklama" genis><textarea maxLength="1500" value={form.aciklama || ""} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} placeholder="Giderle ilgili notlar…" /></Alan>
    {!duzenli && <div className="finans-belge"><div><AdminIcon name="receipt" /><span><b>{form.belgeUrl ? "Belge yüklendi" : "Fiş veya fatura ekle"}</b><small>PNG, JPG veya WebP · en fazla 5 MB</small></span></div><label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => onBelge(e.target.files?.[0])} />{form.belgeUrl ? "Belgeyi değiştir" : "Dosya seç"}</label>{form.belgeUrl && <a href={form.belgeUrl} target="_blank" rel="noreferrer">Görüntüle</a>}</div>}
    <div className="finans-form-alt"><span>{duzenli ? "Kayıt vadesinde onay kuyruğuna düşer." : "Onay verilmeden kasa ve raporlar etkilenmez."}</span><button className="primary" disabled={islemde}>{islemde ? "Kaydediliyor…" : duzenli ? "Planı kaydet" : "Onaya gönder"}</button></div>
  </form>;
}
