import { useEffect, useMemo, useRef, useState } from "react";
import { adminIstek, jsonGonder } from "../../lib/adminApi";
import "./SalonKrokisiYonetimi.css";
import "./SalonKrokisiAlanlari.css";

const kimlik = (onEk) => `${onEk}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;
const sinirla = (deger, alt, ust) => Math.min(ust, Math.max(alt, deger));
const ALAN_TURLERI = {
  mutfak: { ad: "Mutfak", ikon: "♨", genislik: 24, yukseklik: 20 },
  wc: { ad: "WC", ikon: "WC", genislik: 12, yukseklik: 14 },
  kasa: { ad: "Kasa", ikon: "₺", genislik: 18, yukseklik: 12 },
  giris: { ad: "Giriş", ikon: "↳", genislik: 14, yukseklik: 9 },
  cikis: { ad: "Çıkış", ikon: "↗", genislik: 14, yukseklik: 9 },
  merdiven: { ad: "Merdiven", ikon: "≋", genislik: 16, yukseklik: 18 },
  bar: { ad: "Bar", ikon: "▰", genislik: 22, yukseklik: 12 },
  servis: { ad: "Servis Alanı", ikon: "◇", genislik: 18, yukseklik: 12 },
  ic_mekan: { ad: "İç Mekân", ikon: "⌂", genislik: 42, yukseklik: 70, bolge: true },
  dis_mekan: { ad: "Dış Mekân", ikon: "☀", genislik: 42, yukseklik: 70, bolge: true },
};

export default function SalonKrokisiYonetimi() {
  const [kroki, setKroki] = useState(null);
  const [katId, setKatId] = useState("");
  const [masaId, setMasaId] = useState("");
  const [alanId, setAlanId] = useState("");
  const [eklenecekTur, setEklenecekTur] = useState("mutfak");
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
  const seciliAlan = kat?.alanlar?.find((oge) => oge.id === alanId);
  const krokiyiDegistir = (islem) => setKroki((onceki) => {
    const kopya = structuredClone(onceki); islem(kopya); return kopya;
  });
  const katiDegistir = (islem) => krokiyiDegistir((kopya) => {
    const hedef = kopya.katlar.find((oge) => oge.id === kat.id); if (hedef) islem(hedef);
  });

  const katEkle = () => {
    const id = kimlik("kat");
    krokiyiDegistir((kopya) => kopya.katlar.push({ id, ad: `${kopya.katlar.length + 1}. Kat`, sira: kopya.katlar.length + 1, mekanTuru: "ic_mekan", masalar: [], alanlar: [] }));
    setKatId(id); setMasaId(""); setAlanId("");
  };
  const katSil = () => {
    if (kroki.katlar.length === 1) return setDurum("En az bir kat bulunmalı.");
    const kalan = kroki.katlar.filter((oge) => oge.id !== kat.id);
    setKroki({ ...kroki, katlar: kalan.map((oge, i) => ({ ...oge, sira: i + 1 })) });
    setKatId(kalan[0].id); setMasaId(""); setAlanId("");
  };
  const masaEkle = () => {
    const kullanilan = new Set(kroki.katlar.flatMap((oge) => oge.masalar.map((m) => String(m.masaNo))));
    let no = 1; while (kullanilan.has(String(no))) no += 1;
    const id = kimlik("masa");
    katiDegistir((hedef) => hedef.masalar.push({ id, masaNo: String(no), ad: `Masa ${no}`, x: 8, y: 8, genislik: 16, yukseklik: 17, sekil: "kare", kapasite: 4, bolum: "", aktif: true }));
    setMasaId(id); setAlanId("");
  };
  const masaDegistir = (alan, deger) => katiDegistir((hedef) => {
    const secili = hedef.masalar.find((oge) => oge.id === masaId); if (secili) secili[alan] = deger;
  });
  const alanEkle = () => {
    const sablon = ALAN_TURLERI[eklenecekTur]; const id = kimlik("alan");
    katiDegistir((hedef) => { hedef.alanlar ||= []; hedef.alanlar.push({ id, tur: eklenecekTur, ad: sablon.ad, x: 4, y: 4, genislik: sablon.genislik, yukseklik: sablon.yukseklik, aktif: true }); });
    setAlanId(id); setMasaId("");
  };
  const alanDegistir = (alan, deger) => katiDegistir((hedef) => {
    const secili = (hedef.alanlar || []).find((oge) => oge.id === alanId); if (secili) secili[alan] = deger;
  });

  const suruklemeyiBaslat = (event, oge) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const tur = oge.masaNo != null ? "masa" : "alan";
    if (tur === "masa") { setMasaId(oge.id); setAlanId(""); } else { setAlanId(oge.id); setMasaId(""); }
    surukleme.current = { pointerId: event.pointerId, ogeId: oge.id, tur, baslangicX: event.clientX, baslangicY: event.clientY, x: oge.x, y: oge.y };
  };
  const surukle = (event) => {
    const bilgi = surukleme.current; const alan = alanRef.current;
    if (!bilgi || !alan || bilgi.pointerId !== event.pointerId) return;
    const rect = alan.getBoundingClientRect();
    katiDegistir((hedef) => {
      const oge = (bilgi.tur === "masa" ? hedef.masalar : (hedef.alanlar || [])).find((m) => m.id === bilgi.ogeId); if (!oge) return;
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
      <div><small>SALON DÜZENİ</small><h2>Katlar ve işletme krokisi</h2><p>Masaları, iç/dış mekânları ve hizmet noktalarını gerçek yerleşime göre konumlandırın.</p></div>
      <button onClick={kaydet} disabled={kaydediliyor}>{kaydediliyor ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}</button>
    </section>
    {durum && <div className="kroki-bildirim">{durum}</div>}
    <div className="kroki-kat-cubugu">
      {kroki.katlar.map((oge) => <button key={oge.id} className={oge.id === kat.id ? "aktif" : ""} onClick={() => { setKatId(oge.id); setMasaId(""); setAlanId(""); }}>{oge.ad}<span>{oge.masalar.length} masa · {(oge.alanlar || []).length} alan</span></button>)}
      <button className="kroki-ekle" onClick={katEkle}>+ Kat ekle</button>
    </div>
    <div className="kroki-icerik">
      <section className="kroki-tuval-karti">
        <header><div className="kroki-kat-bilgileri"><label>Kat adı<input value={kat.ad} onChange={(e) => katiDegistir((hedef) => { hedef.ad = e.target.value; })} /></label><label>Mekân yapısı<select value={kat.mekanTuru || "ic_mekan"} onChange={(e) => katiDegistir((hedef) => { hedef.mekanTuru = e.target.value; })}><option value="ic_mekan">İç mekân</option><option value="dis_mekan">Dış mekân</option><option value="karma">İç + dış mekân</option></select></label></div><div><button onClick={masaEkle}>+ Masa ekle</button><button className="tehlike" onClick={katSil}>Katı sil</button></div></header>
        <div className="kroki-oge-ekle"><label>Yerleşim öğesi<select value={eklenecekTur} onChange={(e) => setEklenecekTur(e.target.value)}>{Object.entries(ALAN_TURLERI).map(([id, oge]) => <option key={id} value={id}>{oge.ad}</option>)}</select></label><button onClick={alanEkle}>+ Plana ekle</button><span>Mutfak, WC, kasa, giriş, servis ve iç/dış mekân bölgeleri ekleyebilirsiniz.</span></div>
        <div className={`kroki-tuval kroki-tuval--${kat.mekanTuru || "ic_mekan"}`} ref={alanRef} onPointerMove={surukle} onPointerUp={() => { surukleme.current = null; }} onPointerCancel={() => { surukleme.current = null; }}>
          {(kat.alanlar || []).map((oge) => { const sablon = ALAN_TURLERI[oge.tur] || ALAN_TURLERI.servis; return <button key={oge.id} className={`kroki-alan kroki-alan--${oge.tur}${sablon.bolge ? " kroki-alan--bolge" : ""}${oge.id === alanId ? " secili" : ""}${!oge.aktif ? " pasif" : ""}`} style={{ left: `${oge.x}%`, top: `${oge.y}%`, width: `${oge.genislik}%`, height: `${oge.yukseklik}%` }} onPointerDown={(e) => suruklemeyiBaslat(e, oge)}><i>{sablon.ikon}</i><b>{oge.ad}</b></button>; })}
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
        </> : seciliAlan ? <><h3>Yerleşim öğesi</h3><div className={`kroki-alan-tur kroki-alan-tur--${seciliAlan.tur}`}><i>{ALAN_TURLERI[seciliAlan.tur]?.ikon}</i><span>{ALAN_TURLERI[seciliAlan.tur]?.ad}</span></div>
          <label>Görünen ad<input value={seciliAlan.ad} onChange={(e) => alanDegistir("ad", e.target.value)} /></label>
          <label>Öğe türü<select value={seciliAlan.tur} onChange={(e) => alanDegistir("tur", e.target.value)}>{Object.entries(ALAN_TURLERI).map(([id, oge]) => <option key={id} value={id}>{oge.ad}</option>)}</select></label>
          <label>Genişlik <span>%{Math.round(seciliAlan.genislik)}</span><input type="range" min="6" max="100" value={seciliAlan.genislik} onChange={(e) => alanDegistir("genislik", Number(e.target.value))} /></label>
          <label>Yükseklik <span>%{Math.round(seciliAlan.yukseklik)}</span><input type="range" min="6" max="100" value={seciliAlan.yukseklik} onChange={(e) => alanDegistir("yukseklik", Number(e.target.value))} /></label>
          <label className="kroki-switch"><input type="checkbox" checked={seciliAlan.aktif} onChange={(e) => alanDegistir("aktif", e.target.checked)} />Öğe görünür</label>
          <button className="kroki-masa-sil" onClick={() => { katiDegistir((hedef) => { hedef.alanlar = (hedef.alanlar || []).filter((oge) => oge.id !== seciliAlan.id); }); setAlanId(""); }}>Öğeyi kaldır</button>
        </> : <div className="kroki-secim-bos"><b>Bir masa veya alan seçin</b><p>Konum, kapasite, ad ve boyut ayarları burada açılır.</p></div>}
      </aside>
    </div>
  </div>;
}
