import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, jsonGonder } from "../../lib/adminApi";
import { socket } from "../../lib/socket";
import AdminIcon from "../../components/AdminIcon";
import "./FinansRaporlari.css";

const ISO = (tarih) => `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}-${String(tarih.getDate()).padStart(2, "0")}`;
const BUGUN = new Date();
const AY_BASI = new Date(BUGUN.getFullYear(), BUGUN.getMonth(), 1);
const para = (deger) => `₺${Number(deger || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const kisaPara = (deger) => Number(deger || 0).toLocaleString("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const gunEtiketi = (deger) => new Date(`${String(deger).slice(0, 10)}T12:00:00`).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
const ayEtiketi = (deger) => new Date(`${String(deger).slice(0, 10)}T12:00:00`).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
const YONTEMLER = { nakit: "Nakit", iyzico: "Online ödeme", cuzdan: "Uygulama cüzdanı", puan: "Puan", kart: "Kart" };

function tarihAraligi(tur) {
  const bitis = new Date(); let baslangic = new Date();
  if (tur === "ay") baslangic = new Date(bitis.getFullYear(), bitis.getMonth(), 1);
  if (tur === "30") baslangic.setDate(bitis.getDate() - 29);
  if (tur === "90") baslangic.setDate(bitis.getDate() - 89);
  if (tur === "yil") baslangic = new Date(bitis.getFullYear(), 0, 1);
  return { baslangic: ISO(baslangic), bitis: ISO(bitis) };
}

function DikeyGrafik({ veriler = [], etiketAl, compact = false }) {
  const enYuksek = Math.max(1, ...veriler.flatMap((v) => [Number(v.gelir), Number(v.gider)]));
  return <div className={`finans-dikey-grafik ${compact ? "compact" : ""}`}>
    {veriler.map((v) => <div className="finans-grafik-sutun" key={String(v.tarih || v.ay)} title={`${etiketAl(v)} · Gelir ${para(v.gelir)} · Gider ${para(v.gider)}`}>
      <div className="finans-cubuklar"><i className="gelir" style={{ height: `${Math.max(v.gelir ? 4 : 0, v.gelir / enYuksek * 100)}%` }} /><i className="gider" style={{ height: `${Math.max(v.gider ? 4 : 0, v.gider / enYuksek * 100)}%` }} /></div>
      <span>{etiketAl(v)}</span>
    </div>)}
  </div>;
}

export default function FinansRaporlari({ kategoriler = [], onBildirim, onHata }) {
  const [filtre, setFiltre] = useState({ ...tarihAraligi("ay"), butceAyi: ISO(AY_BASI).slice(0, 7) });
  const [rapor, setRapor] = useState(null);
  const [butceFormu, setButceFormu] = useState({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    try {
      const q = new URLSearchParams({ ...filtre, butceAyi: `${filtre.butceAyi}-01` });
      const sonuc = await adminIstek(`/finans/rapor?${q}`);
      setRapor(sonuc);
      setButceFormu(Object.fromEntries(sonuc.butceler.map((b) => [b.kategoriId, b.butce || ""])));
    } catch (e) { onHata(e.message); }
    finally { setYukleniyor(false); }
  }, [filtre, onHata]);

  useEffect(() => { yukle(); }, [yukle]);
  useEffect(() => { socket.on("finans-guncellendi", yukle); return () => socket.off("finans-guncellendi", yukle); }, [yukle]);

  const preset = (tur) => setFiltre((f) => ({ ...f, ...tarihAraligi(tur) }));
  const butceKaydet = async () => {
    setKaydediliyor(true);
    try {
      await adminIstek("/gider-butceleri", jsonGonder("POST", { donem: filtre.butceAyi, butceler: kategoriler.filter((k) => k.aktif).map((k) => ({ kategoriId: k.id, tutar: butceFormu[k.id] || 0 })) }));
      onBildirim("Aylık gider bütçesi kaydedildi."); await yukle();
    } catch (e) { onHata(e.message); }
    finally { setKaydediliyor(false); }
  };

  const csvIndir = () => {
    if (!rapor) return;
    const satirlar = [["Tarih", "Gelir", "Gider", "Net"], ...rapor.gunluk.map((g) => [String(g.tarih).slice(0, 10), g.gelir, g.gider, g.gelir - g.gider])];
    const csv = `\uFEFF${satirlar.map((s) => s.join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `finans-${filtre.baslangic}-${filtre.bitis}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const enBuyukKategori = useMemo(() => Math.max(1, ...(rapor?.kategoriler || []).map((k) => k.tutar)), [rapor]);
  if (yukleniyor && !rapor) return <div className="finans-bos"><AdminIcon name="chart" /><b>Finans raporu hazırlanıyor</b><span>Tahsilatlar ve onaylı giderler karşılaştırılıyor…</span></div>;
  if (!rapor) return null;

  return <div className="finans-rapor">
    <div className="finans-rapor-araclar">
      <div><button type="button" onClick={() => preset("ay")}>Bu ay</button><button type="button" onClick={() => preset("30")}>Son 30 gün</button><button type="button" onClick={() => preset("90")}>Son 3 ay</button><button type="button" onClick={() => preset("yil")}>Bu yıl</button></div>
      <label>Başlangıç<input type="date" value={filtre.baslangic} onChange={(e) => setFiltre({ ...filtre, baslangic: e.target.value })} /></label>
      <label>Bitiş<input type="date" value={filtre.bitis} onChange={(e) => setFiltre({ ...filtre, bitis: e.target.value })} /></label>
      <button type="button" className="csv" onClick={csvIndir}><AdminIcon name="receipt" /> CSV indir</button>
    </div>

    <section className="finans-rapor-ozet">
      <article><span>TAHSİL EDİLEN CİRO</span><strong>{para(rapor.ozet.ciro)}</strong><small>{rapor.ozet.siparis} başarılı ödeme · Ort. {para(rapor.ozet.ortalamaSepet)}</small></article>
      <article><span>ONAYLI GİDER</span><strong>{para(rapor.ozet.gider)}</strong><small>{rapor.ozet.giderKaydi} kayıt · Cironun %{rapor.ozet.giderOrani}</small></article>
      <article className={rapor.ozet.net >= 0 ? "pozitif" : "negatif"}><span>NET FAALİYET SONUCU</span><strong>{para(rapor.ozet.net)}</strong><small>Kâr marjı %{rapor.ozet.karMarji}</small></article>
      <article><span>GİDER KDV TOPLAMI</span><strong>{para(rapor.ozet.indirilecekKdv)}</strong><small>Muhasebe ön kontrol bilgisi</small></article>
    </section>

    <div className="finans-rapor-grid">
      <section className="finans-rapor-panel genis"><header><div><span>GÜNLÜK AKIŞ</span><h3>Gelir ve gider karşılaştırması</h3></div><div className="finans-grafik-aciklama"><i className="gelir" />Gelir<i className="gider" />Gider</div></header><DikeyGrafik veriler={rapor.gunluk} etiketAl={(v) => gunEtiketi(v.tarih)} compact={rapor.gunluk.length > 45} /></section>
      <section className="finans-rapor-panel"><header><div><span>6 AYLIK EĞİLİM</span><h3>Dönemsel performans</h3></div></header><DikeyGrafik veriler={rapor.aylik} etiketAl={(v) => ayEtiketi(v.ay)} /></section>
      <section className="finans-rapor-panel"><header><div><span>GİDER DAĞILIMI</span><h3>Kategori yoğunluğu</h3></div></header><div className="finans-yatay-liste">{rapor.kategoriler.filter((k) => k.tutar > 0).map((k) => <div key={k.id}><span><b>{k.ad}</b><strong>{para(k.tutar)}</strong></span><i><em style={{ width: `${k.tutar / enBuyukKategori * 100}%`, background: k.renk }} /></i></div>)}{!rapor.kategoriler.some((k) => k.tutar > 0) && <p>Seçilen dönemde onaylı gider bulunmuyor.</p>}</div></section>
      <section className="finans-rapor-panel"><header><div><span>TAHSİLAT KANALLARI</span><h3>Ödeme dağılımı</h3></div></header><div className="finans-odeme-liste">{rapor.odemeYontemleri.map((o) => <div key={o.yontem}><i><AdminIcon name="card" /></i><span><b>{YONTEMLER[o.yontem] || o.yontem}</b><small>{o.adet} ödeme</small></span><strong>{para(o.tutar)}</strong></div>)}{!rapor.odemeYontemleri.length && <p>Seçilen dönemde tahsilat bulunmuyor.</p>}</div></section>
    </div>

    <section className="finans-butce-panel">
      <header><div><span>AYLIK HARCAMA LİMİTLERİ</span><h3>Kategori bütçeleri ve aşım uyarıları</h3><p>Sıfır bırakılan kategoride limit uygulanmaz. Gerçekleşen tutara yalnızca onaylı giderler dahildir.</p></div><label>Bütçe ayı<input type="month" value={filtre.butceAyi} onChange={(e) => setFiltre({ ...filtre, butceAyi: e.target.value })} /></label></header>
      <div className="finans-butce-grid">{rapor.butceler.map((b) => {
        const asildi = b.butce > 0 && b.gerceklesen > b.butce; const yuzde = Math.min(100, b.kullanim);
        return <article className={asildi ? "asildi" : ""} key={b.kategoriId}><header><i style={{ background: b.renk }} /><span><b>{b.ad}</b><small>{b.butce ? `%${b.kullanim} kullanıldı` : "Limit belirlenmedi"}</small></span><strong>{para(b.gerceklesen)}</strong></header><div className="finans-butce-progress"><i style={{ width: `${yuzde}%` }} /></div><footer><label>Aylık limit<input type="number" min="0" step="0.01" value={butceFormu[b.kategoriId] ?? ""} placeholder="0,00" onChange={(e) => setButceFormu({ ...butceFormu, [b.kategoriId]: e.target.value })} /></label><span>{b.butce ? (asildi ? `${para(Math.abs(b.kalan))} aşıldı` : `${para(b.kalan)} kaldı`) : "Sınırsız"}</span></footer></article>;
      })}</div>
      <footer><span><AdminIcon name="alert" /> Limit aşımı gider kaydını engellemez; yöneticiyi görünür biçimde uyarır.</span><button type="button" disabled={kaydediliyor} onClick={butceKaydet}>{kaydediliyor ? "Kaydediliyor…" : "Bütçeleri kaydet"}</button></footer>
    </section>
  </div>;
}
