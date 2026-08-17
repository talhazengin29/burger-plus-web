import { useCallback, useEffect, useMemo, useState } from "react";
import { rezervasyonDurumuGuncelle, rezervasyonKaydet, rezervasyonlariGetir, rezervasyonSil } from "../lib/adminApi";
import "./Rezervasyonlar.css";

const DURUMLAR = { bekliyor: "Bekleniyor", geldi: "Geldi", tamamlandi: "Tamamlandı", gelmedi: "Gelmedi", iptal: "İptal" };
const yerelTarih = (ekGun = 0) => { const d = new Date(); d.setDate(d.getDate() + ekGun); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const BOS_FORM = () => ({ musteriAdi:"", telefon:"", tarih:yerelTarih(), saat:"19:00", masaNo:"", kisiSayisi:2, sureDakika:120, not:"", durum:"bekliyor" });
const tarihBasligi = (tarih) => new Date(`${tarih}T12:00:00`).toLocaleDateString("tr-TR", { weekday:"long", day:"numeric", month:"long" });

export default function Rezervasyonlar() {
  const [rezervasyonlar,setRezervasyonlar]=useState([]); const [form,setForm]=useState(null);
  const [filtre,setFiltre]=useState("yaklasan"); const [arama,setArama]=useState(""); const [yukleniyor,setYukleniyor]=useState(true);
  const [islem,setIslem]=useState(""); const [hata,setHata]=useState(""); const [bildirim,setBildirim]=useState("");
  const yenile=useCallback(async()=>{setYukleniyor(true);try{setRezervasyonlar(await rezervasyonlariGetir({baslangic:yerelTarih(-30),bitis:yerelTarih(120)}));setHata("");}catch(e){setHata(e.message);}finally{setYukleniyor(false);}},[]);
  useEffect(()=>{yenile();const id=setInterval(yenile,60000);return()=>clearInterval(id);},[yenile]);
  useEffect(()=>{if(!bildirim)return;const id=setTimeout(()=>setBildirim(""),2500);return()=>clearTimeout(id);},[bildirim]);
  const bugun=yerelTarih();
  const gorunen=useMemo(()=>rezervasyonlar.filter((r)=>{
    if(filtre==="bugun"&&r.tarih!==bugun)return false;
    if(filtre==="yaklasan"&&(r.tarih<bugun||["tamamlandi","iptal","gelmedi"].includes(r.durum)))return false;
    if(filtre==="gecmis"&&(r.tarih>=bugun&&!["tamamlandi","iptal","gelmedi"].includes(r.durum)))return false;
    const q=arama.trim().toLocaleLowerCase("tr");return !q||`${r.musteriAdi} ${r.telefon} ${r.masaNo}`.toLocaleLowerCase("tr").includes(q);
  }),[rezervasyonlar,filtre,arama,bugun]);
  const gruplar=useMemo(()=>Object.entries(gorunen.reduce((a,r)=>{(a[r.tarih]??=[]).push(r);return a;},{})),[gorunen]);
  const kaydet=async(e)=>{e.preventDefault();setIslem("kaydet");setHata("");try{await rezervasyonKaydet(form);setForm(null);setBildirim("Rezervasyon kaydedildi.");await yenile();}catch(err){setHata(err.message);}finally{setIslem("");}};
  const durumDegistir=async(r,durum)=>{setIslem(r.id);try{await rezervasyonDurumuGuncelle(r.id,durum);await yenile();}catch(e){setHata(e.message);}finally{setIslem("");}};
  const sil=async(r)=>{if(!window.confirm(`${r.musteriAdi} adına olan rezervasyon silinsin mi?`))return;setIslem(r.id);try{await rezervasyonSil(r.id);setBildirim("Rezervasyon silindi.");await yenile();}catch(e){setHata(e.message);}finally{setIslem("");}};
  return <main className="rezervasyon-ekrani">
    <header className="rezervasyon-hero"><div><small>SALON PLANI</small><h1>Rezervasyon takibi</h1><p>Gelecek misafirleri tarih, saat ve masa bazında tek yerden yönetin.</p></div><button onClick={()=>setForm(BOS_FORM())}><span>＋</span> Yeni rezervasyon</button></header>
    <section className="rezervasyon-ozet">
      <div><span>Bugün</span><strong>{rezervasyonlar.filter(r=>r.tarih===bugun&&!["iptal","gelmedi"].includes(r.durum)).length}</strong><small>rezervasyon</small></div>
      <div><span>Beklenen kişi</span><strong>{rezervasyonlar.filter(r=>r.tarih===bugun&&r.durum==="bekliyor").reduce((a,r)=>a+r.kisiSayisi,0)}</strong><small>bugün</small></div>
      <div><span>Yaklaşan</span><strong>{rezervasyonlar.filter(r=>r.tarih>=bugun&&r.durum==="bekliyor").length}</strong><small>aktif kayıt</small></div>
    </section>
    {(hata||bildirim)&&<div className={`rezervasyon-mesaj ${hata?"hata":"basari"}`}>{hata||bildirim}</div>}
    <section className="rezervasyon-araclar"><div>{[["yaklasan","Yaklaşan"],["bugun","Bugün"],["tumu","Tümü"],["gecmis","Geçmiş"]].map(([id,ad])=><button key={id} className={filtre===id?"aktif":""} onClick={()=>setFiltre(id)}>{ad}</button>)}</div><input value={arama} onChange={e=>setArama(e.target.value.slice(0,80))} placeholder="İsim, telefon veya masa ara..." /></section>
    {yukleniyor?<div className="rezervasyon-bos">Rezervasyonlar yükleniyor…</div>:gruplar.length===0?<div className="rezervasyon-bos"><b>Rezervasyon bulunamadı</b><span>Yeni bir kayıt ekleyebilir veya filtreyi değiştirebilirsiniz.</span></div>:<div className="rezervasyon-gunler">{gruplar.map(([tarih,kayitlar])=><section key={tarih} className="rezervasyon-gun"><header><div><b>{tarihBasligi(tarih)}</b><small>{tarih===bugun?"BUGÜN":tarih}</small></div><span>{kayitlar.length} rezervasyon</span></header><div className="rezervasyon-liste">{kayitlar.map(r=><article key={r.id} className={`rezervasyon-kart durum-${r.durum}`}><time>{r.saat}<small>{r.sureDakika} dk</small></time><div className="rezervasyon-kisi"><b>{r.musteriAdi}</b><span>{r.telefon||"Telefon girilmedi"}</span>{r.not&&<p>{r.not}</p>}</div><div className="rezervasyon-detay"><b>Masa {r.masaNo}</b><span>{r.kisiSayisi} kişi</span></div><span className="rezervasyon-durum">{DURUMLAR[r.durum]}</span><div className="rezervasyon-islemler"><button onClick={()=>setForm({...r})}>Düzenle</button>{r.durum==="bekliyor"&&<button className="olumlu" disabled={islem===r.id} onClick={()=>durumDegistir(r,"geldi")}>Geldi</button>}{r.durum==="geldi"&&<button className="olumlu" disabled={islem===r.id} onClick={()=>durumDegistir(r,"tamamlandi")}>Tamamla</button>}<button className="tehlike" disabled={islem===r.id} onClick={()=>sil(r)}>Sil</button></div></article>)}</div></section>)}</div>}
    {form&&<div className="rezervasyon-modal-perde" onMouseDown={e=>{if(e.target===e.currentTarget)setForm(null);}}><form className="rezervasyon-form" onSubmit={kaydet}><header><div><small>{form.id?"KAYDI GÜNCELLE":"YENİ KAYIT"}</small><h2>{form.id?"Rezervasyonu düzenle":"Yeni rezervasyon"}</h2></div><button type="button" onClick={()=>setForm(null)}>×</button></header><div className="rezervasyon-form-grid"><label className="tam">Müşteri adı<input required minLength="2" maxLength="120" value={form.musteriAdi} onChange={e=>setForm({...form,musteriAdi:e.target.value})} placeholder="Ad soyad" /></label><label className="tam">Telefon<input maxLength="30" value={form.telefon} onChange={e=>setForm({...form,telefon:e.target.value})} placeholder="05XX XXX XX XX" /></label><label>Tarih<input required type="date" value={form.tarih} onChange={e=>setForm({...form,tarih:e.target.value})} /></label><label>Saat<input required type="time" value={form.saat} onChange={e=>setForm({...form,saat:e.target.value})} /></label><label>Masa<input required maxLength="30" value={form.masaNo} onChange={e=>setForm({...form,masaNo:e.target.value})} placeholder="Örn. 12" /></label><label>Kişi sayısı<input required type="number" min="1" max="100" value={form.kisiSayisi} onChange={e=>setForm({...form,kisiSayisi:Number(e.target.value)})} /></label><label>Süre<select value={form.sureDakika} onChange={e=>setForm({...form,sureDakika:Number(e.target.value)})}>{[60,90,120,150,180,240].map(d=><option key={d} value={d}>{d} dakika</option>)}</select></label><label>Durum<select value={form.durum} onChange={e=>setForm({...form,durum:e.target.value})}>{Object.entries(DURUMLAR).map(([id,ad])=><option key={id} value={id}>{ad}</option>)}</select></label><label className="tam">Not<textarea maxLength="500" rows="3" value={form.not} onChange={e=>setForm({...form,not:e.target.value})} placeholder="Müşteri talebi, özel gün veya ek bilgi..." /></label></div><footer><button type="button" onClick={()=>setForm(null)}>Vazgeç</button><button className="kaydet" disabled={islem==="kaydet"}>{islem==="kaydet"?"Kaydediliyor…":"Rezervasyonu kaydet"}</button></footer></form></div>}
  </main>;
}
