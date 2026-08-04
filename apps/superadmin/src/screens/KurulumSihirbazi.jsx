import { useEffect, useMemo, useState } from "react";
import { erisimTokeniOlustur, kurulumTamamla, personelPanelineGit, sablonGetir, slugKontrol } from "../lib/superApi";
import { qrPdfIndir } from "../lib/qrPdf";
import { Hata } from "../components/Ui";
import "./KurulumSihirbazi.css";

const KONSEPTLER = {
  burger: { ad: "Burger", renkler: ["#FF6B00", "#0D0D0D", "#FBBF24"], slogan: "Lezzetli Yemek, Harika Deneyim!", kategoriler: ["Burgerler", "Yan Lezzetler", "İçecekler", "Tatlılar"] },
  cafe: { ad: "Cafe", renkler: ["#C8873E", "#0F0D0B", "#F5E6D3"], slogan: "Günün Her Anına Eşlik Eden Lezzet", kategoriler: ["Sıcak İçecekler", "Soğuk İçecekler", "Tatlılar", "Atıştırmalık"] },
  pizza: { ad: "Pizza", renkler: ["#E63946", "#0D0A0A", "#F1FAEE"], slogan: "Taş Fırından Sofrana", kategoriler: ["Pizzalar", "Makarnalar", "Başlangıçlar", "İçecekler"] },
};
const PLANLAR = {
  baslangic: { ad: "Başlangıç", fiyat: 999, ozellikler: ["Menü ve QR sipariş", "Temel raporlar", "5 personel"] },
  profesyonel: { ad: "Profesyonel", fiyat: 1999, ozellikler: ["Tüm operasyon ekranları", "Gelişmiş raporlar", "Sınırsız personel"] },
  kurumsal: { ad: "Kurumsal", fiyat: 3499, ozellikler: ["Çoklu şube desteğine hazır", "Öncelikli destek", "Özel yapılandırma"] },
};
const ADIM_ADLARI = ["Temel Bilgiler", "Konsept", "Menü", "Hesaplar", "Abonelik ve Onay"];
const bugun = () => new Date().toISOString().slice(0, 10);

function slugUret(deger) {
  return String(deger || "").trim().toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c").replace(/[ğĞ]/g, "g").replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o").replace(/[şŞ]/g, "s").replace(/[üÜ]/g, "u")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-").slice(0, 80).replace(/-+$/g, "");
}

function rastgeleSifre() {
  const alfabe = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const sayilar = new Uint32Array(14);
  crypto.getRandomValues(sayilar);
  return Array.from(sayilar, (sayi) => alfabe[sayi % alfabe.length]).join("");
}

function kopyala(metin) {
  return navigator.clipboard.writeText(String(metin || ""));
}

export default function KurulumSihirbazi({ kapat, tamamlandi }) {
  const [adim, setAdim] = useState(1);
  const [veri, setVeri] = useState({
    ad: "", slug: "", iletisimEmail: "", iletisimTelefon: "", adres: "", masaSayisi: 10,
    konsept: "burger", sablonYukle: true, seciliUrunler: [], urunFiyatlari: {},
    adminHesap: { ad: "", soyad: "", email: "", sifre: "" }, personeller: [],
    abonelik: { plan: "profesyonel", aylikUcret: 1999, baslangicTarihi: bugun(), deneme: false },
  });
  const [slugElle, setSlugElle] = useState(false);
  const [slugDurumu, setSlugDurumu] = useState(null);
  const [sablon, setSablon] = useState(null);
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sonuc, setSonuc] = useState(null);

  useEffect(() => {
    if (!veri.slug) { setSlugDurumu(null); return; }
    let iptal = false;
    setSlugDurumu({ bekliyor: true });
    const zamanlayici = setTimeout(() => {
      slugKontrol(veri.slug).then((durum) => !iptal && setSlugDurumu(durum)).catch((err) => !iptal && setSlugDurumu({ hata: err.message }));
    }, 350);
    return () => { iptal = true; clearTimeout(zamanlayici); };
  }, [veri.slug]);

  useEffect(() => {
    let iptal = false;
    setSablon(null);
    sablonGetir(veri.konsept).then(({ sablon: gelen }) => {
      if (iptal) return;
      setSablon(gelen);
      setVeri((eski) => ({
        ...eski,
        seciliUrunler: gelen.urunler.map((_, indeks) => indeks),
        urunFiyatlari: Object.fromEntries(gelen.urunler.map((urun, indeks) => [indeks, urun.fiyat])),
      }));
    }).catch((err) => !iptal && setHata(err.message));
    return () => { iptal = true; };
  }, [veri.konsept]);

  const kategoriliUrunler = useMemo(() => {
    if (!sablon) return [];
    return sablon.kategoriler.map((kategori) => ({ kategori, urunler: sablon.urunler.map((urun, indeks) => ({ ...urun, indeks })).filter((urun) => urun.kategori === kategori) }));
  }, [sablon]);

  const cik = () => {
    if (sonuc || window.confirm("Kurulum tamamlanmadı, çıkmak istediğinize emin misiniz?")) kapat();
  };
  const temelDegistir = (alan, deger) => setVeri((eski) => ({ ...eski, [alan]: deger }));
  const adminDegistir = (alan, deger) => setVeri((eski) => ({ ...eski, adminHesap: { ...eski.adminHesap, [alan]: deger } }));
  const abonelikDegistir = (alan, deger) => setVeri((eski) => ({ ...eski, abonelik: { ...eski.abonelik, [alan]: deger } }));

  const adimDogrula = () => {
    if (adim === 1) {
      if (veri.ad.trim().length < 2 || !veri.slug) return "İşletme adı ve slug zorunludur.";
      if (!slugDurumu?.musait) return slugDurumu?.oneri ? "Bu slug kullanımda; öneriyi seçin veya başka bir slug yazın." : "Slug müsaitlik kontrolünün tamamlanmasını bekleyin.";
      if (Number(veri.masaSayisi) < 1 || Number(veri.masaSayisi) > 500) return "Masa sayısı 1-500 arasında olmalıdır.";
    }
    if (adim === 2 && !KONSEPTLER[veri.konsept]) return "Bir konsept seçin.";
    if (adim === 3 && veri.sablonYukle) {
      if (!veri.seciliUrunler.length) return "Hazır menü açıksa en az bir ürün seçin.";
      if (veri.seciliUrunler.some((indeks) => !Number.isFinite(Number(veri.urunFiyatlari[indeks])) || Number(veri.urunFiyatlari[indeks]) < 0)) return "Seçili ürün fiyatlarından biri geçersiz.";
    }
    if (adim === 4) {
      const a = veri.adminHesap;
      if (!a.ad.trim() || !a.soyad.trim() || !/^\S+@\S+\.\S+$/.test(a.email) || a.sifre.length < 8) return "Admin adı, soyadı, geçerli e-postası ve en az 8 karakterli şifresi zorunludur.";
      const hatali = veri.personeller.find((p) => !p.ad.trim() || !/^\S+@\S+\.\S+$/.test(p.email) || p.sifre.length < 8);
      if (hatali) return "Her personel için ad, giriş e-postası ve en az 8 karakterli şifre girin.";
    }
    if (adim === 5 && (!PLANLAR[veri.abonelik.plan] || !Number.isFinite(Number(veri.abonelik.aylikUcret)) || Number(veri.abonelik.aylikUcret) < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(veri.abonelik.baslangicTarihi))) return "Abonelik planı, ücreti veya başlangıç tarihi geçersiz.";
    return "";
  };

  const ileri = () => {
    const mesaj = adimDogrula();
    if (mesaj) return setHata(mesaj);
    setHata(""); setAdim((eski) => Math.min(5, eski + 1));
  };
  const personelEkle = (rol = "mutfak", sira = veri.personeller.length + 1) => {
    const yeni = { ad: "", soyad: "Personel", rol, email: `${veri.slug}-${rol}-${sira}@personel.local`, sifre: rastgeleSifre() };
    setVeri((eski) => ({ ...eski, personeller: [...eski.personeller, yeni] }));
  };
  const varsayilanPersoneller = () => setVeri((eski) => ({ ...eski, personeller: [
    { ad: "Mutfak", soyad: "Personeli", rol: "mutfak", email: `${eski.slug}-mutfak-1@personel.local`, sifre: rastgeleSifre() },
    { ad: "Salon", soyad: "Personeli", rol: "salon", email: `${eski.slug}-salon-2@personel.local`, sifre: rastgeleSifre() },
  ] }));
  const personelDegistir = (indeks, alan, deger) => setVeri((eski) => ({ ...eski, personeller: eski.personeller.map((p, sira) => sira === indeks ? { ...p, [alan]: deger } : p) }));

  const kurulumuBitir = async () => {
    const mesaj = adimDogrula();
    if (mesaj) return setHata(mesaj);
    setYukleniyor(true); setHata("");
    try {
      const kurulumSonucu = await kurulumTamamla({ ...veri, masaSayisi: Number(veri.masaSayisi), abonelik: { ...veri.abonelik, aylikUcret: Number(veri.abonelik.aylikUcret), durum: veri.abonelik.deneme ? "deneme" : "aktif" } });
      setSonuc(kurulumSonucu);
      tamamlandi?.(kurulumSonucu);
    } catch (err) { setHata(err.message); } finally { setYukleniyor(false); }
  };

  if (sonuc) return <div className="sihirbaz-perde"><section className="sihirbaz basari-ekrani"><button className="sihirbaz-kapat" onClick={kapat}>×</button><div className="basari-isareti">✓</div><small>KURULUM TAMAMLANDI</small><h2>{sonuc.isletme.ad} oluşturuldu</h2><p>İşletme kullanıma hazır. Giriş bilgilerini güvenli bir yere kaydedin; şifreler tekrar gösterilmez. Admin şifresi geçicidir — ilk girişte kendi şifresini belirlemesi istenecek.</p><div className="kurulum-sayaclari">{Object.entries({ Kategori: sonuc.ozet.kategoriSayisi, Ürün: sonuc.ozet.urunSayisi, Ödül: sonuc.ozet.odulSayisi, Kampanya: sonuc.ozet.kampanyaSayisi, Personel: sonuc.ozet.personelSayisi }).map(([ad, deger]) => <span key={ad}><b>{deger}</b>{ad}</span>)}</div><div className="sonuc-bilgileri"><Kopyalanabilir etiket="Müşteri URL'i" deger={sonuc.musteriUrl} /><Kopyalanabilir etiket="Personel paneli URL'i" deger={sonuc.personelUrl} /><Kopyalanabilir etiket="Admin e-postası" deger={veri.adminHesap.email} /><Kopyalanabilir etiket="Admin geçici şifresi" deger={veri.adminHesap.sifre} gizli /></div>{veri.personeller.length > 0 && <details className="personel-kimlikleri"><summary>Personel giriş bilgileri ({veri.personeller.length})</summary>{veri.personeller.map((p, indeks) => <Kopyalanabilir key={`${p.email}-${indeks}`} etiket={`${p.ad} · ${p.rol}`} deger={`${p.email} / ${p.sifre}`} />)}</details>}<div className="basari-islemleri"><button className="ikincil" onClick={() => qrPdfIndir({ ...sonuc.isletme, masaSayisi: sonuc.ozet.masaSayisi }).catch((err) => setHata(err.message))}>QR Kodlarını İndir</button><button onClick={async () => { try { const erisim = await erisimTokeniOlustur(sonuc.isletme.id); personelPanelineGit(erisim.token); } catch (err) { setHata(err.message); } }}>İşletme Paneline Git ↗</button></div><Hata mesaj={hata} /></section></div>;

  return <div className="sihirbaz-perde"><section className="sihirbaz"><header><div><small>YENİ İŞLETME KURULUMU</small><h2>{ADIM_ADLARI[adim - 1]}</h2></div><button className="sihirbaz-kapat" onClick={cik}>×</button></header><nav className="sihirbaz-adimlari">{ADIM_ADLARI.map((ad, indeks) => <span key={ad} className={adim === indeks + 1 ? "aktif" : adim > indeks + 1 ? "tamam" : ""}><i>{adim > indeks + 1 ? "✓" : indeks + 1}</i><b>{ad}</b></span>)}</nav><div className="sihirbaz-icerik" key={adim}><Hata mesaj={hata} />
    {adim === 1 && <div className="form-grid sihirbaz-form"><label><span>İşletme adı *</span><input autoFocus value={veri.ad} onChange={(e) => { const ad = e.target.value; setVeri((eski) => ({ ...eski, ad, slug: slugElle ? eski.slug : slugUret(ad) })); }} /></label><label><span>Slug *</span><input value={veri.slug} onChange={(e) => { setSlugElle(true); temelDegistir("slug", slugUret(e.target.value)); }} /><small className={`slug-durumu ${slugDurumu?.musait ? "musait" : slugDurumu?.oneri ? "dolu" : ""}`}>{slugDurumu?.bekliyor ? "Kontrol ediliyor…" : slugDurumu?.musait ? "✓ Bu adres müsait" : slugDurumu?.oneri ? <>Bu adres kullanımda. <button onClick={() => temelDegistir("slug", slugDurumu.oneri)}>{slugDurumu.oneri}</button></> : "Adres addan otomatik oluşturulur"}</small></label><label><span>İletişim e-postası</span><input type="email" value={veri.iletisimEmail} onChange={(e) => temelDegistir("iletisimEmail", e.target.value)} /></label><label><span>Telefon</span><input value={veri.iletisimTelefon} onChange={(e) => temelDegistir("iletisimTelefon", e.target.value)} /></label><label><span>Masa sayısı *</span><input type="number" min="1" max="500" value={veri.masaSayisi} onChange={(e) => temelDegistir("masaSayisi", e.target.value)} /></label><label className="tam"><span>Adres</span><textarea value={veri.adres} onChange={(e) => temelDegistir("adres", e.target.value)} /></label></div>}
    {adim === 2 && <div className="konsept-kartlari">{Object.entries(KONSEPTLER).map(([kod, konsept]) => <button key={kod} className={veri.konsept === kod ? "secili" : ""} onClick={() => temelDegistir("konsept", kod)}><div className="renk-noktalari">{konsept.renkler.map((renk) => <i key={renk} style={{ background: renk }} />)}</div><h3>{konsept.ad}</h3><p>{konsept.slogan}</p><ul>{konsept.kategoriler.map((kategori) => <li key={kategori}>{kategori}</li>)}</ul><b>{veri.konsept === kod ? "✓ Seçildi" : "Bu konsepti seç"}</b></button>)}</div>}
    {adim === 3 && <div><label className="anahtar-satiri"><span><b>Hazır menüyü yükle</b><small>Ürünleri ve fiyatları şimdi işletmeye ekler.</small></span><input type="checkbox" checked={veri.sablonYukle} onChange={(e) => temelDegistir("sablonYukle", e.target.checked)} /></label>{!veri.sablonYukle ? <div className="sablon-kapali">Menüyü daha sonra işletme panelinden kendiniz ekleyebilirsiniz.</div> : !sablon ? <div className="durum-ekrani"><i className="spinner" /> Menü yükleniyor…</div> : <div className="menu-secimi">{kategoriliUrunler.map(({ kategori, urunler }) => <section key={kategori}><h3>{kategori}</h3>{urunler.map((urun) => { const secili = veri.seciliUrunler.includes(urun.indeks); return <div key={urun.indeks} className={secili ? "secili" : ""}><input type="checkbox" checked={secili} onChange={() => temelDegistir("seciliUrunler", secili ? veri.seciliUrunler.filter((i) => i !== urun.indeks) : [...veri.seciliUrunler, urun.indeks])} /><span><b>{urun.ad}</b><small>{urun.aciklama}</small></span><label><input type="number" min="0" step="0.01" disabled={!secili} value={veri.urunFiyatlari[urun.indeks] ?? urun.fiyat} onChange={(e) => temelDegistir("urunFiyatlari", { ...veri.urunFiyatlari, [urun.indeks]: e.target.value })} /><em>₺</em></label></div>; })}</section>)}</div>}<p className="menu-ozeti">{sablon?.urunler.length || 0} üründen <b>{veri.sablonYukle ? veri.seciliUrunler.length : 0}'si seçildi</b></p></div>}
    {adim === 4 && <div className="hesap-adimi"><section><header><div><h3>İşletme admin hesabı</h3><p>Bu hesap işletmenin tüm yönetim yetkilerine sahip olur. Girdiğin şifre geçicidir; admin ilk girişinde kendi şifresini belirlemek zorunda kalır.</p></div><button onClick={() => adminDegistir("sifre", rastgeleSifre())}>Rastgele şifre üret</button></header><div className="form-grid"><label><span>Ad *</span><input value={veri.adminHesap.ad} onChange={(e) => adminDegistir("ad", e.target.value)} /></label><label><span>Soyad *</span><input value={veri.adminHesap.soyad} onChange={(e) => adminDegistir("soyad", e.target.value)} /></label><label><span>E-posta *</span><input type="email" value={veri.adminHesap.email} onChange={(e) => adminDegistir("email", e.target.value)} /></label><label><span>Şifre *</span><input value={veri.adminHesap.sifre} onChange={(e) => adminDegistir("sifre", e.target.value)} /></label></div></section><section><header><div><h3>Personel hesapları</h3><p>Opsiyonel mutfak, salon ve kasiyer erişimleri.</p></div><div><button onClick={varsayilanPersoneller}>Varsayılanları oluştur</button><button onClick={() => personelEkle()}>+ Personel</button></div></header><div className="personel-satirlari">{veri.personeller.length === 0 && <p className="bos">Henüz personel eklenmedi.</p>}{veri.personeller.map((p, indeks) => <div key={indeks}><input placeholder="Ad" value={p.ad} onChange={(e) => personelDegistir(indeks, "ad", e.target.value)} /><select value={p.rol} onChange={(e) => personelDegistir(indeks, "rol", e.target.value)}><option value="mutfak">Mutfak</option><option value="salon">Salon</option><option value="kasiyer">Kasiyer</option></select><input type="email" placeholder="Giriş e-postası" value={p.email} onChange={(e) => personelDegistir(indeks, "email", e.target.value)} /><input placeholder="Şifre" value={p.sifre} onChange={(e) => personelDegistir(indeks, "sifre", e.target.value)} /><button className="satir-sil" onClick={() => temelDegistir("personeller", veri.personeller.filter((_, sira) => sira !== indeks))}>×</button></div>)}</div></section></div>}
    {adim === 5 && <div className="onay-adimi"><div className="plan-kartlari">{Object.entries(PLANLAR).map(([kod, plan]) => <button key={kod} className={veri.abonelik.plan === kod ? "secili" : ""} onClick={() => setVeri((eski) => ({ ...eski, abonelik: { ...eski.abonelik, plan: kod, aylikUcret: plan.fiyat } }))}><h3>{plan.ad}</h3><strong>{plan.fiyat.toLocaleString("tr-TR")} ₺<small>/ay</small></strong><ul>{plan.ozellikler.map((ozellik) => <li key={ozellik}>✓ {ozellik}</li>)}</ul></button>)}</div><div className="form-grid abonelik-form"><label><span>Aylık ücret</span><input type="number" min="0" value={veri.abonelik.aylikUcret} onChange={(e) => abonelikDegistir("aylikUcret", e.target.value)} /></label><label><span>Başlangıç tarihi</span><input type="date" value={veri.abonelik.baslangicTarihi} onChange={(e) => abonelikDegistir("baslangicTarihi", e.target.value)} /></label><label className="tam anahtar-satiri"><span><b>30 gün ücretsiz deneme</b><small>Abonelik deneme durumunda oluşturulur.</small></span><input type="checkbox" checked={veri.abonelik.deneme} onChange={(e) => abonelikDegistir("deneme", e.target.checked)} /></label></div><section className="kurulum-ozeti"><h3>Kurulum özeti</h3><dl><div><dt>İşletme</dt><dd>{veri.ad}</dd></div><div><dt>Konsept</dt><dd>{KONSEPTLER[veri.konsept].ad}</dd></div><div><dt>Menü</dt><dd>{veri.sablonYukle ? `${veri.seciliUrunler.length} ürün` : "Sonra eklenecek"}</dd></div><div><dt>Personel</dt><dd>{veri.personeller.length}</dd></div><div><dt>Masa</dt><dd>{veri.masaSayisi}</dd></div><div><dt>Plan</dt><dd>{PLANLAR[veri.abonelik.plan].ad} · {Number(veri.abonelik.aylikUcret).toLocaleString("tr-TR")} ₺</dd></div></dl></section></div>}
  </div><footer><button className="ikincil" onClick={adim === 1 ? cik : () => { setHata(""); setAdim((eski) => eski - 1); }}>{adim === 1 ? "Vazgeç" : "← Geri"}</button><span>Adım {adim} / 5</span>{adim < 5 ? <button onClick={ileri}>İleri →</button> : <button disabled={yukleniyor} onClick={kurulumuBitir}>{yukleniyor ? "Kurulum yapılıyor…" : "Kurulumu Tamamla"}</button>}</footer>{yukleniyor && <div className="kurulum-yukleniyor"><i className="spinner" /><b>İşletme kuruluyor</b><span>Menü, hesaplar ve abonelik tek işlemde hazırlanıyor…</span></div>}</section></div>;
}

function Kopyalanabilir({ etiket, deger, gizli = false }) {
  const [kopyalandi, setKopyalandi] = useState(false);
  return <div><span>{etiket}</span><code className={gizli ? "sifre" : ""}>{deger}</code><button onClick={() => kopyala(deger).then(() => { setKopyalandi(true); setTimeout(() => setKopyalandi(false), 1500); })}>{kopyalandi ? "Kopyalandı" : "Kopyala"}</button></div>;
}
