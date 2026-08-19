import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek } from "../../lib/adminApi";
import { socket } from "../../lib/socket";
import "./DegerlendirmeRaporu.css";

const puanMetni = (puan) => puan == null ? "—" : Number(puan).toLocaleString("tr-TR", { minimumFractionDigits:1, maximumFractionDigits:2 });
const tarihMetni = (tarih) => new Date(tarih).toLocaleDateString("tr-TR", { day:"2-digit", month:"short" });
const tarihSaat = (tarih) => new Date(tarih).toLocaleString("tr-TR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

function PuanKarti({ ad, puan, aciklama }) {
  return <article className="deger-metrik"><span>{ad}</span><strong>{puanMetni(puan)}<small>/5</small></strong><div>{"★".repeat(Math.round(puan || 0))}<i>{"★".repeat(5-Math.round(puan || 0))}</i></div><p>{aciklama}</p></article>;
}
function TrendGrafigi({ veriler }) {
  const noktalar = useMemo(() => {
    if (!veriler.length) return "";
    return veriler.map((oge, i) => `${veriler.length === 1 ? 50 : 5+(i/(veriler.length-1))*90},${90-((Number(oge.ortalama)-1)/4)*75}`).join(" ");
  }, [veriler]);
  if (!veriler.length) return <div className="deger-bos">Bu dönem için değerlendirme verisi yok.</div>;
  return <div className="deger-trend"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Günlük değerlendirme ortalaması"><defs><linearGradient id="degerAlan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".28"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>{[15,33.75,52.5,71.25,90].map((y)=><line key={y} x1="4" x2="96" y1={y} y2={y}/>) }<polygon points={`5,90 ${noktalar} 95,90`} fill="url(#degerAlan)"/><polyline points={noktalar}/></svg><div>{veriler.map((oge)=><span key={oge.tarih} title={`${puanMetni(oge.ortalama)} puan · ${oge.adet} değerlendirme`}><b>{puanMetni(oge.ortalama)}</b><small>{tarihMetni(oge.tarih)}</small></span>)}</div></div>;
}

export default function DegerlendirmeRaporu() {
  const [gun,setGun]=useState(30); const [rapor,setRapor]=useState(null); const [hata,setHata]=useState(""); const [yukleniyor,setYukleniyor]=useState(true);
  const yukle=useCallback(async()=>{setYukleniyor(true);try{setRapor((await adminIstek(`/degerlendirmeler?gun=${gun}`)).rapor);setHata("");}catch(e){setHata(e.message);}finally{setYukleniyor(false);}},[gun]);
  useEffect(()=>{yukle();},[yukle]);
  useEffect(()=>{const guncelle=()=>yukle();socket.on("degerlendirmeler-guncellendi",guncelle);return()=>socket.off("degerlendirmeler-guncellendi",guncelle);},[yukle]);
  const enYuksek=Math.max(1,...Object.values(rapor?.dagilim||{}));
  return <div className="deger-rapor">
    <section className="deger-hero"><div><small>MÜŞTERİ İÇGÖRÜLERİ</small><h2>Sipariş değerlendirmeleri</h2><p>Ürün kalitesini ve servis deneyimini gerçek müşteri puanlarıyla takip edin.</p></div><div>{[[7,"7 gün"],[30,"30 gün"],[90,"90 gün"],[365,"1 yıl"]].map(([id,ad])=><button key={id} className={gun===id?"aktif":""} onClick={()=>setGun(id)}>{ad}</button>)}</div></section>
    {hata&&<div className="deger-hata">{hata}</div>}
    {yukleniyor&&!rapor?<div className="deger-bos">Değerlendirmeler hazırlanıyor…</div>:rapor&&<><section className="deger-metrikler"><PuanKarti ad="Genel deneyim" puan={rapor.ozet.genel} aciklama={`${rapor.ozet.adet} değerlendirme`}/><PuanKarti ad="Servis hızı" puan={rapor.ozet.servisHizi} aciklama="Bekleme ve teslim süresi"/><PuanKarti ad="Personel" puan={rapor.ozet.personel} aciklama="İlgi ve hizmet kalitesi"/><PuanKarti ad="Sipariş doğruluğu" puan={rapor.ozet.siparisDogrulugu} aciklama="Eksiksiz ve doğru teslimat"/></section>
    <section className="deger-grid"><article className="deger-panel deger-panel--trend"><header><div><small>ZAMAN İÇİNDE</small><h3>Genel puan eğilimi</h3></div><span>Son {rapor.gun} gün</span></header><TrendGrafigi veriler={rapor.gunluk}/></article><article className="deger-panel"><header><div><small>PUAN DAĞILIMI</small><h3>Müşteri memnuniyeti</h3></div></header><div className="deger-dagilim">{[5,4,3,2,1].map((p)=><div key={p}><span>{p} ★</span><i><b style={{width:`${(rapor.dagilim[p]/enYuksek)*100}%`}}/></i><strong>{rapor.dagilim[p]}</strong></div>)}</div></article></section>
    <section className="deger-panel"><header><div><small>ÜRÜN PERFORMANSI</small><h3>Ürün bazlı puanlar</h3></div><span>{rapor.urunler.length} ürün</span></header>{rapor.urunler.length?<div className="deger-urunler"><div className="deger-urun-baslik"><span>Ürün</span><span>Ortalama</span><span>Yanıt</span><span>Düşük puan</span></div>{rapor.urunler.map((urun)=><div key={`${urun.urunId}-${urun.urunAdi}`}><b>{urun.urunAdi}</b><span className="deger-urun-puan"><i style={{width:`${(urun.ortalama/5)*100}%`}}/>{puanMetni(urun.ortalama)} ★</span><span>{urun.adet}</span><span className={urun.dusukPuan?"uyari":""}>{urun.dusukPuan}</span></div>)}</div>:<div className="deger-bos">Henüz ürün puanı bulunmuyor.</div>}</section>
    <section className="deger-panel"><header><div><small>SON YORUMLAR</small><h3>Müşteri geri bildirimleri</h3></div><span>{rapor.yorumlar.length} yorum</span></header>{rapor.yorumlar.length?<div className="deger-yorumlar">{rapor.yorumlar.map((yorum)=><article key={yorum.id}><header><div><b>{yorum.musteriAdi}</b><span>#{yorum.siparisNo} · {tarihSaat(yorum.tarih)}</span></div><strong>{yorum.genelPuan} ★</strong></header><p>{yorum.yorum}</p><footer><span>Hız {yorum.servisHiziPuani}/5</span><span>Personel {yorum.personelPuani}/5</span><span>Doğruluk {yorum.siparisDogruluguPuani}/5</span></footer></article>)}</div>:<div className="deger-bos">Bu dönemde yazılı yorum bulunmuyor.</div>}</section></>}</div>;
}

