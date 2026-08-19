import { useEffect, useMemo, useRef, useState } from "react";
import { adminIstek, jsonGonder } from "../../lib/adminApi";
import "./SalonKrokisiYonetimi.css";

const kimlik = (onEk) => `${onEk}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
const sinirla = (deger, alt, ust) => Math.min(ust, Math.max(alt, deger));

export default function SalonKrokisiYonetimi() {
  const [kroki, setKroki] = useState(null);
  const [katId, setKatId] = useState("");
  const [masaId, setMasaId] = useState("");
  const [durum, setDurum] = useState("Yükleniyor…");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const alanRef = useRef(null);
  const surukleme = useRef(null);

  useEffect(() => {
    adminIstek("/salon-krokisi").then(({ kroki: veri }) => {
      setKroki(veri); setKatId(veri.katlar[0]?.id || ""); setDurum("");
    }).catch((e) => setDurum(e.message));
  }, []);

  const kat = useMemo(() => kroki?.katlar.find((oge) => oge.id === katId) || kroki?.katlar[0], [kroki, katId]);
  const masa = kat?.masalar.find((oge) => oge.id === masaId);
  const krokiyiDegistir = (islem) => setKroki((onceki) => {
    const kopya = structuredClone(onceki); islem(kopya); return kopya;
  });
  const katiDegistir = (islem) => krokiyiDegistir((kopya) => {
    const hedef = kopya.katlar.find((oge) => oge.id === kat.id); if (hedef) islem(hedef);
  });

  const katEkle = () => {
    const id = kimlik("kat");
    krokiyiDegistir((kopya) => kopya.katlar.push({ id, ad: `${kopya.katlar.length + 1}. Kat`, sira: kopya.katlar.length + 1, masalar: [] }));
    setKatId(id); setMasaId("");
  };
  const katSil = () => {
    if (kroki.katlar.length === 1) return setDurum("En az bir kat bulunmalı.");
    const kalan = kroki.katlar.filter((oge) => oge.id !== kat.id);
    setKroki({ ...kroki, katlar: kalan.map((oge, i) => ({ ...oge, sira: i + 1 })) });
    setKatId(kalan[0].id); setMasaId("");
  };
  const masaEkle = () => {
    const kullanilan = new Set(kroki.katlar.flatMap((oge) => oge.masalar.map((m) => String(m.masaNo))));
    let no = 1; while (kullanilan.has(String(no))) no += 1;
    const id = kimlik("masa");
    katiDegistir((hedef) => hedef.masalar.push({ id, masaNo: String(no), ad: `Masa ${no}`, x: 8, y: 8, genislik: 16, yukseklik: 17, sekil: "kare", kapasite: 4, bolum: "", aktif: true }));
    setMasaId(id);
  };
  const masaDegistir = (alan, deger) => katiDegistir((hedef) => {
    const secili = hedef.masalar.find((oge) => oge.id === masaId); if (secili) secili[alan] = deger;
  });

  const suruklemeyiBaslat = (event, oge) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setMasaId(oge.id);
    surukleme.current = { pointerId: event.pointerId, masaId: oge.id, baslangicX: event.clientX, baslangicY: event.clientY, x: oge.x, y: oge.y };
  };
  const surukle = (event) => {
    const bilgi = surukleme.current; const alan = alanRef.current;
    if (!bilgi || !alan || bilgi.pointerId !== event.pointerId) return;
    const rect = alan.getBoundingClientRect();
    katiDegistir((hedef) => {
      const oge = hedef.masalar.find((m) => m.id === bilgi.masaId); if (!oge) return;
      oge.x = sinirla(bilgi.x + ((event.clientX - bilgi.baslangicX) / rect.width) * 100, 0, 100 - oge.genislik);
      oge.y = sinirla(bilgi.y + ((event.clientY - bilgi.baslangicY) / rect.height) * 100, 0, 100 - oge.yukseklik);
    });
  };
  const kaydet = async () => {
    setKaydediliyor(true); setDurum("");
    try { const sonuc = await adminIstek("/salon-krokisi", jsonGonder("PUT", { kroki })); setKroki(sonuc.kroki); setDurum("Kroki kaydedildi ve personel ekranına yansıtıldı."); }
    catch (e) { setDurum(e.message); }
    finally { setKaydediliyor(false); }
  };

  if (!kroki) return <div className="kroki-bildirim">{durum}</div>;
  return <div className="kroki-yonetim">
    <section className="kroki-ust">
      <div><small>SALON DÜZENİ</small><h2>Katlar ve masa krokisi</h2><p>Masaları sürükleyerek gerçek yerleşime göre konumlandırın.</p></div>
      <button onClick={kaydet} disabled={kaydediliyor}>{kaydediliyor ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}</button>
    </section>
    {durum && <div className="kroki-bildirim">{durum}</div>}
    <div className="kroki-kat-cubugu">
      {kroki.katlar.map((oge) => <button key={oge.id} className={oge.id === kat.id ? "aktif" : ""} onClick={() => { setKatId(oge.id); setMasaId(""); }}>{oge.ad}<span>{oge.masalar.length} masa</span></button>)}
      <button className="kroki-ekle" onClick={katEkle}>+ Kat ekle</button>
    </div>
    <div className="kroki-icerik">
      <section className="kroki-tuval-karti">
        <header><label>Kat adı<input value={kat.ad} onChange={(e) => katiDegistir((hedef) => { hedef.ad = e.target.value; })} /></label><div><button onClick={masaEkle}>+ Masa ekle</button><button className="tehlike" onClick={katSil}>Katı sil</button></div></header>
        <div className="kroki-tuval" ref={alanRef} onPointerMove={surukle} onPointerUp={() => { surukleme.current = null; }} onPointerCancel={() => { surukleme.current = null; }}>
          <span className="kroki-giris">GİRİŞ</span>
          {kat.masalar.map((oge) => <button key={oge.id} className={`kroki-masa kroki-masa--${oge.sekil}${oge.id === masaId ? " secili" : ""}${!oge.aktif ? " pasif" : ""}`} style={{ left: `${oge.x}%`, top: `${oge.y}%`, width: `${oge.genislik}%`, height: `${oge.yukseklik}%` }} onPointerDown={(e) => suruklemeyiBaslat(e, oge)}><b>{oge.ad}</b><span>{oge.kapasite} kişi</span></button>)}
        </div>
      </section>
      <aside className="kroki-ayarlar">
        {masa ? <><h3>Masa ayarları</h3>
          <label>Masa numarası<input value={masa.masaNo} onChange={(e) => masaDegistir("masaNo", e.target.value)} /></label>
          <label>Görünen ad<input value={masa.ad} onChange={(e) => masaDegistir("ad", e.target.value)} /></label>
          <label>Bölüm / alan<input placeholder="Teras, pencere önü…" value={masa.bolum} onChange={(e) => masaDegistir("bolum", e.target.value)} /></label>
          <div className="kroki-iki"><label>Kapasite<input type="number" min="1" max="30" value={masa.kapasite} onChange={(e) => masaDegistir("kapasite", Number(e.target.value))} /></label><label>Şekil<select value={masa.sekil} onChange={(e) => masaDegistir("sekil", e.target.value)}><option value="kare">Kare</option><option value="yuvarlak">Yuvarlak</option><option value="dikdortgen">Dikdörtgen</option></select></label></div>
          <label>Genişlik <span>%{Math.round(masa.genislik)}</span><input type="range" min="6" max="36" value={masa.genislik} onChange={(e) => masaDegistir("genislik", Number(e.target.value))} /></label>
          <label>Yükseklik <span>%{Math.round(masa.yukseklik)}</span><input type="range" min="7" max="36" value={masa.yukseklik} onChange={(e) => masaDegistir("yukseklik", Number(e.target.value))} /></label>
          <label className="kroki-switch"><input type="checkbox" checked={masa.aktif} onChange={(e) => masaDegistir("aktif", e.target.checked)} />Masa kullanımda</label>
          <button className="kroki-masa-sil" onClick={() => { katiDegistir((hedef) => { hedef.masalar = hedef.masalar.filter((oge) => oge.id !== masa.id); }); setMasaId(""); }}>Masayı kaldır</button>
        </> : <div className="kroki-secim-bos"><b>Bir masa seçin</b><p>Konum, kapasite, boyut ve masa numarası ayarları burada açılır.</p></div>}
      </aside>
    </div>
  </div>;
}
