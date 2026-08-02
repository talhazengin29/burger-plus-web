import { useEffect, useMemo, useState } from "react";
import { ciroRaporu, kullaniciRaporu, siparisRaporu } from "../lib/superApi";
import { CizgiGrafik, CubukGrafik, Hata, para, sayi, Yukleme } from "../components/Ui";

function csvIndir(satirlar) {
  const kacis = (d) => `"${String(d ?? "").replace(/"/g, '""')}"`;
  const icerik = [["İşletme", "Ciro", "Sipariş", "Ortalama Sepet", "Yeni Kullanıcı"], ...satirlar.map((s) => [s.ad, s.ciro, s.siparis, s.ortalamaSepet, s.yeniKullanici])].map((s) => s.map(kacis).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", icerik], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `burger-plus-platform-raporu-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
}

export default function Raporlar() {
  const [gun, setGun] = useState(30), [ozel, setOzel] = useState({ baslangic: "", bitis: "" }), [veri, setVeri] = useState(null), [hata, setHata] = useState(""), [sira, setSira] = useState("ciro");
  const etkinGun = gun === "ozel" && ozel.baslangic && ozel.bitis ? Math.max(1, Math.ceil((new Date(ozel.bitis) - new Date(ozel.baslangic)) / 86400000) + 1) : Number(gun) || 30;
  useEffect(() => {
    let aktif = true;
    const aralik = gun === "ozel" && ozel.baslangic && ozel.bitis ? { baslangic: ozel.baslangic, bitis: ozel.bitis } : etkinGun;
    setVeri(null); setHata("");
    Promise.all([ciroRaporu(aralik), siparisRaporu(aralik), kullaniciRaporu(typeof aralik === "object" ? aralik : null)])
      .then(([ciro, siparis, kullanici]) => { if (aktif) setVeri({ ciro, siparis, kullanici }); })
      .catch((e) => { if (aktif) setHata(e.message); });
    return () => { aktif = false; };
  }, [etkinGun, gun, ozel.baslangic, ozel.bitis]);
  const satirlar = useMemo(() => {
    if (!veri) return [];
    const kullanicilar = new Map(veri.kullanici.isletmeler.map((i) => [i.isletmeId, i]));
    return veri.ciro.isletmeler.map((i) => ({ ...i, yeniKullanici: kullanicilar.get(i.isletmeId)?.yeniKullanici || 0, kullaniciSayisi: kullanicilar.get(i.isletmeId)?.kullaniciSayisi || 0 })).sort((a, b) => Number(b[sira] || 0) - Number(a[sira] || 0));
  }, [sira, veri]);
  const gunluk = useMemo(() => {
    const toplam = new Map(); (veri?.ciro.gunluk || []).forEach((g) => toplam.set(String(g.tarih).slice(0, 10), (toplam.get(String(g.tarih).slice(0, 10)) || 0) + g.ciro));
    return [...toplam].map(([tarih, ciro]) => ({ ay: tarih, ciro }));
  }, [veri]);
  return <div className="sayfa"><div className="sayfa-araclari"><div><h2>Çapraz platform raporları</h2><p>İşletmeleri aynı dönem ve metriklerde karşılaştırın.</p></div><button disabled={!satirlar.length} onClick={() => csvIndir(satirlar)}>CSV Dışa Aktar</button></div><section className="filtreler rapor-filtre"><select value={gun} onChange={(e) => setGun(e.target.value)}><option value="7">Son 7 gün</option><option value="30">Son 30 gün</option><option value="90">Son 90 gün</option><option value="ozel">Özel aralık</option></select>{gun === "ozel" && <><input type="date" value={ozel.baslangic} onChange={(e) => setOzel({ ...ozel, baslangic: e.target.value })} /><input type="date" value={ozel.bitis} onChange={(e) => setOzel({ ...ozel, bitis: e.target.value })} /></>}<select value={sira} onChange={(e) => setSira(e.target.value)}><option value="ciro">Ciroya göre</option><option value="siparis">Siparişe göre</option><option value="ortalamaSepet">Sepet ortalamasına göre</option><option value="yeniKullanici">Kullanıcı artışına göre</option></select><span>{etkinGun} günlük görünüm</span></section><Hata mesaj={hata} />{!veri && !hata ? <Yukleme /> : veri && <><section className="iki-kolon"><article className="panel"><header><div><h2>Ciro karşılaştırması</h2><p>Seçilen dönemde işletme performansı</p></div></header><CubukGrafik veriler={satirlar} /></article><article className="panel"><header><div><h2>Zaman içindeki performans</h2><p>Platformun günlük toplam cirosu</p></div></header><CizgiGrafik veriler={gunluk} /></article></section><section className="tablo-panel rapor-tablosu"><table><thead><tr><th>İşletme</th><th>Ciro</th><th>Sipariş</th><th>Ortalama sepet</th><th>Toplam kullanıcı</th><th>Son 30 gün kayıt</th></tr></thead><tbody>{satirlar.map((s) => <tr key={s.isletmeId}><td><b>{s.ad}</b><small>/{s.slug}</small></td><td><strong>{para(s.ciro)}</strong></td><td>{sayi(s.siparis)}</td><td>{para(s.ortalamaSepet)}</td><td>{sayi(s.kullaniciSayisi)}</td><td>{sayi(s.yeniKullanici)}</td></tr>)}</tbody></table></section></>}</div>;
}
