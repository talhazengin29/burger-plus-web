import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, jsonGonder } from "../../lib/adminApi";
import { socket } from "../../lib/socket";
import "./ReceteStokYonetimi.css";

const para = (deger) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(deger || 0));
const miktar = (deger) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 3 }).format(Number(deger || 0));
const BOS_HAMMADDE = { ad: "", birim: "gr", minimumStok: 0, musteriyeGoster: false, musteriAdi: "", aktif: true };

function Modal({ baslik, aciklama, onKapat, children }) {
  return <div className="recete-modal-perde" onMouseDown={(e) => e.target === e.currentTarget && onKapat()}>
    <section className="recete-modal" role="dialog" aria-modal="true" aria-label={baslik}>
      <header><div><h3>{baslik}</h3><p>{aciklama}</p></div><button type="button" onClick={onKapat} aria-label="Kapat">×</button></header>
      {children}
    </section>
  </div>;
}

export default function ReceteStokYonetimi({ onUrunlerYenile }) {
  const [veri, setVeri] = useState({ hammaddeler: [], receteler: [], hareketler: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [hammaddeForm, setHammaddeForm] = useState(null);
  const [hareketForm, setHareketForm] = useState(null);
  const [receteForm, setReceteForm] = useState(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yenile = useCallback(async ({ sessiz = false } = {}) => {
    if (!sessiz) setYukleniyor(true);
    try {
      const sonuc = await adminIstek("/recete-stok");
      setVeri({ hammaddeler: sonuc.hammaddeler || [], receteler: sonuc.receteler || [], hareketler: sonuc.hareketler || [] });
      setHata("");
    } catch (e) { setHata(e.message); }
    finally { if (!sessiz) setYukleniyor(false); }
  }, []);

  useEffect(() => { yenile(); }, [yenile]);
  useEffect(() => {
    const sessizYenile = () => yenile({ sessiz: true });
    socket.on("recete-stok-guncellendi", sessizYenile);
    socket.on("yonetim-satis-guncellendi", sessizYenile);
    return () => {
      socket.off("recete-stok-guncellendi", sessizYenile);
      socket.off("yonetim-satis-guncellendi", sessizYenile);
    };
  }, [yenile]);

  const ozet = useMemo(() => ({
    aktif: veri.hammaddeler.filter((h) => h.aktif).length,
    kritik: veri.hammaddeler.filter((h) => h.kritik).length,
    deger: veri.hammaddeler.reduce((t, h) => t + Number(h.stokDegeri || 0), 0),
    receteli: veri.receteler.filter((r) => r.satirlar.length).length,
  }), [veri]);

  const islem = async (fonksiyon, mesaj, kapat) => {
    setKaydediliyor(true); setHata(""); setBildirim("");
    try {
      await fonksiyon();
      kapat?.();
      await yenile({ sessiz: true });
      await onUrunlerYenile?.();
      setBildirim(mesaj);
    }
    catch (e) { setHata(e.message); }
    finally { setKaydediliyor(false); }
  };

  const hammaddeKaydet = (e) => {
    e.preventDefault();
    islem(() => adminIstek("/hammaddeler", jsonGonder("POST", { ...hammaddeForm, minimumStok: Number(hammaddeForm.minimumStok) })), "Hammadde kaydedildi.", () => setHammaddeForm(null));
  };

  const hareketKaydet = (e) => {
    e.preventDefault();
    islem(() => adminIstek(`/hammaddeler/${hareketForm.hammadde.id}/stok-hareketi`, jsonGonder("POST", {
      tur: hareketForm.tur, miktar: Number(hareketForm.miktar), toplamMaliyet: Number(hareketForm.toplamMaliyet || 0),
      aciklama: hareketForm.aciklama, istekAnahtari: crypto.randomUUID(),
    })), "Hammadde stoğu güncellendi.", () => setHareketForm(null));
  };

  const receteAc = (recete) => setReceteForm({
    urunId: recete.urunId,
    urunAdi: recete.urunAdi,
    malzemeleriOtomatikGuncelle: recete.malzemeleriOtomatikGuncelle !== false,
    satirlar: recete.satirlar.map((s) => ({ hammaddeId: String(s.hammaddeId), miktar: s.miktar, fireOrani: s.fireOrani })),
  });
  const receteSatiriEkle = () => setReceteForm((f) => ({ ...f, satirlar: [...f.satirlar, { hammaddeId: "", miktar: "", fireOrani: 0 }] }));
  const receteSatiriGuncelle = (index, alan, deger) => setReceteForm((f) => ({ ...f, satirlar: f.satirlar.map((s, i) => i === index ? { ...s, [alan]: deger } : s) }));
  const receteSatiriSil = (index) => setReceteForm((f) => ({ ...f, satirlar: f.satirlar.filter((_, i) => i !== index) }));
  const receteKaydet = (e) => {
    e.preventDefault();
    const satirlar = receteForm.satirlar.map((s) => ({ hammaddeId: Number(s.hammaddeId), miktar: Number(s.miktar), fireOrani: Number(s.fireOrani || 0) }));
    islem(() => adminIstek(`/urunler/${receteForm.urunId}/recete`, jsonGonder("PUT", {
      satirlar,
      malzemeleriOtomatikGuncelle: receteForm.malzemeleriOtomatikGuncelle,
    })), "Ürün reçetesi, maliyeti ve müşteri içeriği güncellendi.", () => setReceteForm(null));
  };

  const formMaliyeti = useMemo(() => (receteForm?.satirlar || []).reduce((toplam, s) => {
    const h = veri.hammaddeler.find((x) => x.id === Number(s.hammaddeId));
    return toplam + Number(s.miktar || 0) * (1 + Number(s.fireOrani || 0) / 100) * Number(h?.birimMaliyet || 0);
  }, 0), [receteForm, veri.hammaddeler]);

  if (yukleniyor) return <section className="recete-yukleniyor">Reçete ve hammadde stokları yükleniyor…</section>;

  return <section className="recete-merkezi">
    <div className="recete-bolum-baslik">
      <div><span>HAMMADDE & MALİYET</span><h2>Reçete stok merkezi</h2><p>Alışları kaydedin; ürün maliyetini ve satış sonrası hammadde tüketimini otomatik yönetin.</p></div>
      <div><button type="button" className="ikincil" onClick={() => yenile()}>Yenile</button><button type="button" onClick={() => setHammaddeForm({ ...BOS_HAMMADDE })}>+ Hammadde ekle</button></div>
    </div>
    {hata && <div className="recete-mesaj hata">{hata}</div>}
    {bildirim && <div className="recete-mesaj basari">{bildirim}</div>}
    <div className="recete-metrikler">
      <article><span>Hammadde</span><strong>{ozet.aktif}</strong><small>aktif kalem</small></article>
      <article className={ozet.kritik ? "uyari" : ""}><span>Kritik stok</span><strong>{ozet.kritik}</strong><small>eşik altında</small></article>
      <article><span>Stok değeri</span><strong>{para(ozet.deger)}</strong><small>ağırlıklı maliyet</small></article>
      <article><span>Reçeteli ürün</span><strong>{ozet.receteli}</strong><small>{veri.receteler.length} ürün içinde</small></article>
    </div>

    <div className="recete-iki-kolon">
      <section className="recete-panel">
        <header><div><span>DEPO</span><h3>Hammaddeler</h3></div><small>Stok / maliyet / alarm</small></header>
        <div className="hammadde-listesi">
          {veri.hammaddeler.map((h) => <article key={h.id} className={`${h.kritik ? "kritik" : ""} ${!h.aktif ? "pasif" : ""}`}>
            <div><b>{h.ad}</b><small>{para(h.birimMaliyet)} / {h.birim} · min. {miktar(h.minimumStok)} {h.birim}</small><small className={`hammadde-gorunurluk ${h.musteriyeGoster ? "gorunur" : "gizli"}`}>{h.musteriyeGoster ? `Müşteride: ${h.musteriAdi || h.ad}` : "Müşteriye gizli"}</small></div>
            <span><strong>{miktar(h.stokMiktari)}</strong><small>{h.birim} kullanılabilir{h.rezerveMiktar > 0 ? ` · ${miktar(h.rezerveMiktar)} rezerve` : ""}</small></span>
            <em>{para(h.stokDegeri)}</em>
            <div className="hammadde-islemler"><button type="button" onClick={() => setHareketForm({ hammadde: h, tur: "giris", miktar: "", toplamMaliyet: "", aciklama: "" })}>Stok işlemi</button><button type="button" onClick={() => setHammaddeForm({ ...h })}>Düzenle</button></div>
          </article>)}
          {!veri.hammaddeler.length && <p className="recete-bos">İlk reçeteyi kurmak için hammadde ekleyin.</p>}
        </div>
      </section>

      <section className="recete-panel">
        <header><div><span>ÜRÜN MALİYETİ</span><h3>Reçeteler</h3></div><small>Satış fiyatına göre</small></header>
        <div className="recete-urun-listesi">
          {veri.receteler.map((r) => <button type="button" key={r.urunId} onClick={() => receteAc(r)}>
            <span><b>{r.urunAdi}</b><small>{r.satirlar.length ? `${r.satirlar.length} hammadde` : "Reçete tanımlanmamış"}</small></span>
            <span><small>Maliyet</small><strong>{para(r.maliyet)}</strong></span>
            <span><small>Brüt kâr</small><strong className={r.brutKar < 0 ? "zarar" : ""}>{para(r.brutKar)}</strong></span>
            <em className={r.maliyetOrani > 40 ? "yuksek" : ""}>%{r.maliyetOrani}</em>
          </button>)}
        </div>
      </section>
    </div>

    {veri.hareketler.length > 0 && <section className="recete-panel hareket-paneli">
      <header><div><span>HAREKETLER</span><h3>Son stok işlemleri</h3></div><small>Son 50 kayıt</small></header>
      <div className="recete-hareketler">{veri.hareketler.slice(0, 12).map((h) => <div key={h.id}><b>{h.hammaddeAdi}</b><span>{h.tur.replaceAll("_", " ")}</span><strong className={h.miktar < 0 ? "eksi" : "arti"}>{h.miktar > 0 ? "+" : ""}{miktar(h.miktar)} {h.birim}</strong><small>{new Date(h.olusturma).toLocaleString("tr-TR")}</small></div>)}</div>
    </section>}

    {hammaddeForm && <Modal baslik={hammaddeForm.id ? "Hammaddeyi düzenle" : "Yeni hammadde"} aciklama="Tüketim için temel birim kullanın: kilogram yerine gr, litre yerine ml." onKapat={() => setHammaddeForm(null)}>
      <form className="recete-form" onSubmit={hammaddeKaydet}>
        <label className="genis">Hammadde adı<input required minLength="2" maxLength="120" value={hammaddeForm.ad} onChange={(e) => setHammaddeForm({ ...hammaddeForm, ad: e.target.value })} placeholder="Örn. Kaşar peyniri" /></label>
        <label>Temel birim<select disabled={Boolean(hammaddeForm.id)} value={hammaddeForm.birim} onChange={(e) => setHammaddeForm({ ...hammaddeForm, birim: e.target.value })}><option value="gr">Gram (gr)</option><option value="ml">Mililitre (ml)</option><option value="adet">Adet</option></select>{hammaddeForm.id && <small>Reçete miktarlarını bozmamak için kayıt sonrasında değiştirilemez.</small>}</label>
        <label>Kritik stok eşiği<input required type="number" min="0" step="0.001" value={hammaddeForm.minimumStok} onChange={(e) => setHammaddeForm({ ...hammaddeForm, minimumStok: e.target.value })} /></label>
        <label className="recete-onay genis"><input type="checkbox" checked={hammaddeForm.musteriyeGoster === true} onChange={(e) => setHammaddeForm({ ...hammaddeForm, musteriyeGoster: e.target.checked, musteriAdi: e.target.checked ? (hammaddeForm.musteriAdi || hammaddeForm.ad) : hammaddeForm.musteriAdi })} /><span><b>Müşteriye ürün içeriğinde göster</b><small>Kapalıysa yağ, ambalaj ve fire gibi iç maliyet kalemleri uygulamada görünmez.</small></span></label>
        {hammaddeForm.musteriyeGoster === true && <label className="genis">Müşteriye görünen ad<input required minLength="2" maxLength="120" value={hammaddeForm.musteriAdi || ""} onChange={(e) => setHammaddeForm({ ...hammaddeForm, musteriAdi: e.target.value })} placeholder={hammaddeForm.ad || "Örn. Kaşar peyniri"} /><small>Stok birimi ve reçete miktarı müşteriye gösterilmez; yalnızca bu ad kullanılır.</small></label>}
        {hammaddeForm.id && <label className="recete-onay genis"><input type="checkbox" checked={hammaddeForm.aktif} onChange={(e) => setHammaddeForm({ ...hammaddeForm, aktif: e.target.checked })} /> Aktif olarak kullan</label>}
        <footer><button type="button" onClick={() => setHammaddeForm(null)}>Vazgeç</button><button className="primary" disabled={kaydediliyor}>Kaydet</button></footer>
      </form>
    </Modal>}

    {hareketForm && <Modal baslik={`${hareketForm.hammadde.ad} · stok işlemi`} aciklama={`Kullanılabilir stok: ${miktar(hareketForm.hammadde.stokMiktari)} ${hareketForm.hammadde.birim}`} onKapat={() => setHareketForm(null)}>
      <form className="recete-form" onSubmit={hareketKaydet}>
        <label className="genis">İşlem<select value={hareketForm.tur} onChange={(e) => setHareketForm({ ...hareketForm, tur: e.target.value })}><option value="giris">Mal alımı / stok girişi</option><option value="fire">Fire / zayi çıkışı</option><option value="sayim">Sayım sonucu kesin stok</option></select></label>
        <label>{hareketForm.tur === "sayim" ? "Yeni kesin stok" : "Miktar"}<input required type="number" min={hareketForm.tur === "sayim" ? "0" : "0.0001"} step="0.001" value={hareketForm.miktar} onChange={(e) => setHareketForm({ ...hareketForm, miktar: e.target.value })} /><small>{hareketForm.hammadde.birim}</small></label>
        {hareketForm.tur === "giris" && <label>Toplam alış tutarı<input required type="number" min="0" step="0.01" value={hareketForm.toplamMaliyet} onChange={(e) => setHareketForm({ ...hareketForm, toplamMaliyet: e.target.value })} /><small>Ağırlıklı birim maliyet otomatik hesaplanır.</small></label>}
        <label className="genis">Açıklama<input maxLength="500" value={hareketForm.aciklama} onChange={(e) => setHareketForm({ ...hareketForm, aciklama: e.target.value })} placeholder="Fatura, tedarikçi veya sayım notu" /></label>
        <footer><button type="button" onClick={() => setHareketForm(null)}>Vazgeç</button><button className="primary" disabled={kaydediliyor}>Stoğu güncelle</button></footer>
      </form>
    </Modal>}

    {receteForm && <Modal baslik={`${receteForm.urunAdi} reçetesi`} aciklama="Bir adet ürün satıldığında tüketilecek net miktarı ve fire payını yazın." onKapat={() => setReceteForm(null)}>
      <form className="recete-form recete-editor" onSubmit={receteKaydet}>
        <div className="recete-editor-ozet"><span>Güncel reçete maliyeti</span><strong>{para(formMaliyeti)}</strong><small>Alış fiyatları değiştiğinde otomatik güncellenir.</small></div>
        <label className="recete-onay recete-musteri-senkron genis"><input type="checkbox" checked={receteForm.malzemeleriOtomatikGuncelle === true} onChange={(e) => setReceteForm({ ...receteForm, malzemeleriOtomatikGuncelle: e.target.checked })} /><span><b>Müşteri malzeme listesini reçeteden otomatik oluştur</b><small>Yalnızca “müşteriye göster” olarak işaretlenen hammaddeler ürün detayına aktarılır.</small></span></label>
        <div className="recete-satir-baslik"><span>Hammadde</span><span>Net miktar</span><span>Fire %</span><i /></div>
        {receteForm.satirlar.map((s, index) => <div className="recete-satir" key={index}>
          <select required value={s.hammaddeId} onChange={(e) => receteSatiriGuncelle(index, "hammaddeId", e.target.value)}><option value="">Hammadde seç</option>{veri.hammaddeler.filter((h) => h.aktif).map((h) => <option key={h.id} value={h.id}>{h.ad} ({h.birim})</option>)}</select>
          <input required type="number" min="0.0001" step="0.001" value={s.miktar} onChange={(e) => receteSatiriGuncelle(index, "miktar", e.target.value)} />
          <input required type="number" min="0" max="100" step="0.1" value={s.fireOrani} onChange={(e) => receteSatiriGuncelle(index, "fireOrani", e.target.value)} />
          <button type="button" onClick={() => receteSatiriSil(index)} aria-label="Satırı sil">×</button>
        </div>)}
        <button type="button" className="recete-satir-ekle" onClick={receteSatiriEkle} disabled={!veri.hammaddeler.some((h) => h.aktif)}>+ Hammadde satırı ekle</button>
        <footer><button type="button" onClick={() => setReceteForm(null)}>Vazgeç</button><button className="primary" disabled={kaydediliyor}>Reçeteyi kaydet</button></footer>
      </form>
    </Modal>}
  </section>;
}
