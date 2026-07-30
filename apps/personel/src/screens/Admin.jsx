import { useCallback, useEffect, useMemo, useState } from "react";
import { adminIstek, gorselYukle, jsonGonder } from "../lib/adminApi";
import logoFull from "../../../musteri/src/assets/logo-full-transparent.png";
import "./Admin.css";

const BOS_GRAMAJ = { aktif: true, etiket: "Köfte gramajı", birim: "gr", artisMiktari: 50, maxAdim: 3, fiyatArtisi: 35 };
const BOS_BOYUTLAR = (birim = "gr") => [
  { kod: "kucuk", etiket: "Küçük Boy", miktar: "", birim, fiyatFarki: 0, varsayilan: true },
  { kod: "orta", etiket: "Orta Boy", miktar: "", birim, fiyatFarki: "", varsayilan: false },
  { kod: "buyuk", etiket: "Büyük Boy", miktar: "", birim, fiyatFarki: "", varsayilan: false },
];
const BOS_MENU = { burgerUrunId: "", yanLezzetUrunId: "", icecekUrunId: "", varsayilanYanBoyut: "", varsayilanIcecekBoyut: "" };
const BOS_URUN = { ad: "", fiyat: "", kategori: "Burgerler", urunTipi: "burger", temelMiktar: "", gorsel: "", aciklama: "", malzemeler: "", alerjenler: "", aktif: true, populer: false, onerilenUrunler: [], gramajOpsiyonu: BOS_GRAMAJ, boyutSecenekleri: [], menuYapisi: BOS_MENU };
const BOS_KATEGORI = { ad: "", gorsel: "", sira: 10 };
const BOS_PERSONEL = { ad: "", soyad: "", rol: "Mutfak", email: "", telefon: "", saatlikUcret: "", sifre: "" };
const BOS_DUYURU = { baslik: "", mesaj: "", hedef: "/anasayfa" };
const BOS_KAMPANYA = { etiket: "", baslik: "", aciklama: "", buton: "Sipariş Ver", butonTipi: "primary", gorsel: "", aktif: true, baslangicSaat: 14, bitisSaat: 17, indirimYuzde: 10, gecerliKategoriler: [], kampanyaTipi: "surekli", sira: 10 };
const BOS_ODUL = { ad: "", puan: 300, urunId: "", gorsel: "", aktif: true };

const BOLUMLER = [
  ["genel", "Genel Bakış", "▦"],
  ["urunler", "Ürünler", "◆"],
  ["kampanyalar", "Kampanyalar", "%"],
  ["oduller", "Puan Marketi", "★"],
  ["duyurular", "Duyurular", "●"],
  ["personel", "Personel", "♟"],
  ["raporlar", "Satış Raporları", "↗"],
];

const para = (n) => `₺${Number(n || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TIP_ETIKETLERI = { burger: "Burger", yan_lezzet: "Yan Lezzet", icecek: "İçecek", menu: "Menü" };
const tarihSaat = (d) => d ? new Date(d).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const GRAMAJ_KURALLARI = {
  "Burgerler": { etiket: "Köfte gramajı", birim: "gr", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .20, fiyatYuvarlama: 5 },
  "Yan Lezzetler": { etiket: "Porsiyon gramajı", birim: "gr", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .40, fiyatYuvarlama: 5 },
  "İçecekler": { etiket: "İçecek hacmi", birim: "ml", artisOrani: .25, miktarYuvarlama: 25, fiyatArtisOrani: .25, fiyatYuvarlama: 5 },
};

const enYakinaYuvarla = (deger, adim) => Math.max(adim, Math.round(deger / adim) * adim);
const gramajVarsayilani = (urun) => {
  const kural = GRAMAJ_KURALLARI[urun.kategori];
  const temel = Number(urun.temelMiktar);
  const fiyat = Number(urun.fiyat);
  if (!kural || !Number.isFinite(temel) || temel <= 0) return { ...BOS_GRAMAJ, etiket: kural?.etiket || BOS_GRAMAJ.etiket, birim: kural?.birim || "gr" };
  return {
    aktif: true,
    etiket: kural.etiket,
    birim: kural.birim,
    artisMiktari: enYakinaYuvarla(temel * kural.artisOrani, kural.miktarYuvarlama),
    maxAdim: 3,
    fiyatArtisi: enYakinaYuvarla((Number.isFinite(fiyat) ? fiyat : 0) * kural.fiyatArtisOrani, kural.fiyatYuvarlama),
  };
};

const yeniUrunFormu = (kategori = "Burgerler") => ({ ...BOS_URUN, kategori, gramajOpsiyonu: { ...BOS_GRAMAJ }, boyutSecenekleri: [], menuYapisi: { ...BOS_MENU } });
const urunuFormaCevir = (urun) => ({
  ...urun,
  populer: urun.populer === true,
  onerilenUrunler: (urun.onerilenUrunler || []).map(Number).filter(Number.isInteger),
  malzemeler: (urun.malzemeler || []).join(", "),
  alerjenler: (urun.alerjenler || []).join(", "),
  gramajOpsiyonu: { ...gramajVarsayilani(urun), ...(urun.gramajOpsiyonu || {}) },
  boyutSecenekleri: (urun.boyutSecenekleri || []).map((boyut) => ({ ...boyut })),
  menuYapisi: { ...BOS_MENU, ...(urun.menuYapisi || {}) },
});

export default function Admin({ onCikis }) {
  const [bolum, setBolum] = useState("genel");
  const [dashboard, setDashboard] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [personeller, setPersoneller] = useState([]);
  const [duyurular, setDuyurular] = useState([]);
  const [kampanyalar, setKampanyalar] = useState([]);
  const [oduller, setOduller] = useState([]);
  const [rapor, setRapor] = useState({ gunluk: [], urunler: [], kategoriler: [], saatlik: [], haftalik: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [urunForm, setUrunForm] = useState(null);
  const [urunArama, setUrunArama] = useState("");
  const [urunKategoriFiltre, setUrunKategoriFiltre] = useState("tumu");
  const [urunTipFiltre, setUrunTipFiltre] = useState("tumu");
  const [urunDurumFiltre, setUrunDurumFiltre] = useState("tumu");
  const [urunSiralama, setUrunSiralama] = useState("yeni");
  const [oneriArama, setOneriArama] = useState("");
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);
  const [kategoriForm, setKategoriForm] = useState(null);
  const [personelForm, setPersonelForm] = useState(null);
  const [duyuruForm, setDuyuruForm] = useState(null);
  const [kampanyaForm, setKampanyaForm] = useState(null);
  const [odulForm, setOdulForm] = useState(null);

  const verileriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata("");
    const istekler = [
      ["Genel bakış", "/dashboard"], ["Ürünler", "/urunler"], ["Personel", "/personeller"],
      ["Satış raporları", "/raporlar/satis?gun=30"], ["Duyurular", "/duyurular"], ["Kategoriler", "/kategoriler"],
      ["Kampanyalar", "/kampanyalar"], ["Puan marketi", "/oduller"],
    ];
    const sonuclar = await Promise.allSettled(istekler.map(([, yol]) => adminIstek(yol)));
    const yetkiHatasi = sonuclar.find((sonuc) =>
      sonuc.status === "rejected" && [401, 403].includes(sonuc.reason?.status)
    );
    if (yetkiHatasi) {
      setYukleniyor(false);
      onCikis();
      return;
    }

    const [d, u, p, r, duy, k, kamp, od] = sonuclar.map((sonuc) =>
      sonuc.status === "fulfilled" ? sonuc.value : null
    );
    if (d) setDashboard(d);
    if (u) setUrunler(u.urunler || []);
    if (p) setPersoneller(p.personeller || []);
    if (r) setRapor(r);
    if (duy) setDuyurular(duy.duyurular || []);
    if (k) setKategoriler(k.kategoriler || []);
    else if (u) setKategoriler(Array.from(new Set((u.urunler || []).map((urun) => urun.kategori))).map((ad, index) => ({ id: `urun-${ad}`, ad, gorsel: (u.urunler || []).find((urun) => urun.kategori === ad)?.gorsel || null, sira: (index + 1) * 10, aktif: true })));
    if (kamp) setKampanyalar(kamp.kampanyalar || []);
    if (od) setOduller(od.oduller || []);

    const hatalar = sonuclar.flatMap((sonuc, index) =>
      sonuc.status === "rejected" ? [`${istekler[index][0]}: ${sonuc.reason.message}`] : []
    );
    setHata(hatalar.join(" • "));
    setYukleniyor(false);
  }, [onCikis]);

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
    if (gorselYukleniyor) return setHata("Görsel yüklemesi tamamlanmadan ürünü kaydedemezsin.");
    if (!urunForm.gorsel) return setHata("Ürün için bir görsel yüklemelisin.");
    const veri = {
      ...urunForm,
      fiyat: Number(urunForm.fiyat), temelMiktar: Number(urunForm.temelMiktar),
      gramajOpsiyonu: urunForm.urunTipi === "burger" ? {
        aktif: urunForm.gramajOpsiyonu?.aktif === true,
        etiket: String(urunForm.gramajOpsiyonu?.etiket || "").trim(),
        birim: String(urunForm.gramajOpsiyonu?.birim || "gr").trim().toLowerCase(),
        artisMiktari: Number(urunForm.gramajOpsiyonu?.artisMiktari),
        maxAdim: Number(urunForm.gramajOpsiyonu?.maxAdim),
        fiyatArtisi: Number(urunForm.gramajOpsiyonu?.fiyatArtisi),
      } : null,
      boyutSecenekleri: (urunForm.boyutSecenekleri || []).map((boyut) => ({
        ...boyut, miktar: Number(boyut.miktar), fiyatFarki: Number(boyut.fiyatFarki),
      })),
      menuYapisi: urunForm.urunTipi === "menu" ? {
        ...urunForm.menuYapisi,
        burgerUrunId: Number(urunForm.menuYapisi.burgerUrunId),
        yanLezzetUrunId: Number(urunForm.menuYapisi.yanLezzetUrunId),
        icecekUrunId: Number(urunForm.menuYapisi.icecekUrunId),
      } : null,
      populer: urunForm.populer === true,
      onerilenUrunler: [...new Set((urunForm.onerilenUrunler || []).map(Number).filter(Number.isInteger))].slice(0, 5),
      malzemeler: urunForm.malzemeler.split(",").map((x) => x.trim()).filter(Boolean),
      alerjenler: urunForm.alerjenler.split(",").map((x) => x.trim()).filter(Boolean),
    };
    if (await islem(() => adminIstek("/urunler", jsonGonder("POST", veri)), "Ürün kataloğu güncellendi.")) setUrunForm(null);
  };

  const urunTipiniDegistir = (urunTipi) => setUrunForm((onceki) => ({
    ...onceki,
    urunTipi,
    temelMiktar: urunTipi === "burger" ? onceki.temelMiktar : "",
    gramajOpsiyonu: urunTipi === "burger" ? { ...BOS_GRAMAJ, ...onceki.gramajOpsiyonu } : null,
    boyutSecenekleri: ["yan_lezzet", "icecek"].includes(urunTipi)
      ? (onceki.boyutSecenekleri?.length ? onceki.boyutSecenekleri : BOS_BOYUTLAR(urunTipi === "icecek" ? "ml" : "gr"))
      : [],
    menuYapisi: urunTipi === "menu" ? { ...BOS_MENU, ...onceki.menuYapisi } : { ...BOS_MENU },
  }));

  const boyutGuncelle = (index, alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    boyutSecenekleri: onceki.boyutSecenekleri.map((boyut, sira) => ({
      ...boyut,
      ...(alan === "varsayilan" ? { varsayilan: sira === index } : (sira === index ? { [alan]: deger } : {})),
    })),
  }));

  const urunGorseliSec = async (dosya) => {
    if (!dosya) return;
    setGorselYukleniyor(true);
    setHata("");
    try {
      const { gorsel } = await gorselYukle(dosya);
      setUrunForm((onceki) => onceki ? { ...onceki, gorsel } : onceki);
    } catch (err) {
      setHata(err.message);
    } finally {
      setGorselYukleniyor(false);
    }
  };

  const gramajGuncelle = (alan, deger) => setUrunForm((onceki) => ({
    ...onceki,
    gramajOpsiyonu: { ...onceki.gramajOpsiyonu, [alan]: deger },
  }));

  const urunKategorisiDegistir = (kategori) => setUrunForm((onceki) => {
    const varsayilan = gramajVarsayilani({ ...onceki, kategori });
    return {
      ...onceki,
      kategori,
      gramajOpsiyonu: { ...onceki.gramajOpsiyonu, etiket: varsayilan.etiket, birim: varsayilan.birim },
    };
  });

  const kategoriKaydet = async (e) => {
    e.preventDefault();
    const veri = {
      ...kategoriForm,
      ad: String(kategoriForm.ad || "").trim(),
      gorsel: String(kategoriForm.gorsel || "").trim(),
      sira: Number(kategoriForm.sira),
    };
    if (await islem(() => adminIstek("/kategoriler", jsonGonder("POST", veri)), "Kategori uygulama menüsüne kaydedildi.")) setKategoriForm(null);
  };

  const personelKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/personeller", jsonGonder("POST", personelForm)), "Personel kaydı güncellendi.")) setPersonelForm(null);
  };

  const duyuruKaydet = async (e) => {
    e.preventDefault();
    if (await islem(() => adminIstek("/duyurular", jsonGonder("POST", duyuruForm)), "Duyuru yayınlandı.")) setDuyuruForm(null);
  };

  const kampanyaKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...kampanyaForm, indirimYuzde: Number(kampanyaForm.indirimYuzde), sira: Number(kampanyaForm.sira), baslangicSaat: Number(kampanyaForm.baslangicSaat), bitisSaat: Number(kampanyaForm.bitisSaat) };
    if (await islem(() => adminIstek("/kampanyalar", jsonGonder("POST", veri)), "Kampanya uygulamaya kaydedildi.")) setKampanyaForm(null);
  };

  const odulKaydet = async (e) => {
    e.preventDefault();
    const veri = { ...odulForm, puan: Number(odulForm.puan), urunId: Number(odulForm.urunId) };
    if (await islem(() => adminIstek("/oduller", jsonGonder("POST", veri)), "Puan marketi güncellendi.")) setOdulForm(null);
  };

  const kampanyaKategoriDegistir = (kategori) => setKampanyaForm((onceki) => ({
    ...onceki,
    gecerliKategoriler: onceki.gecerliKategoriler.includes(kategori)
      ? onceki.gecerliKategoriler.filter((ad) => ad !== kategori)
      : [...onceki.gecerliKategoriler, kategori],
  }));

  const toplamCiro = useMemo(() => rapor.gunluk.reduce((t, g) => t + Number(g.ciro), 0), [rapor]);
  const toplamUrun = useMemo(() => rapor.gunluk.reduce((t, g) => t + Number(g.adet), 0), [rapor]);
  const yogunSaat = useMemo(() => (rapor.saatlik || []).reduce((en, s) => s.adet > en.adet ? s : en, { saat: null, adet: 0 }), [rapor]);
  const filtreliUrunler = useMemo(() => {
    const arama = urunArama.trim().toLocaleLowerCase("tr");
    const liste = urunler.filter((urun) =>
      (!arama || urun.ad.toLocaleLowerCase("tr").includes(arama)) &&
      (urunKategoriFiltre === "tumu" || urun.kategori === urunKategoriFiltre) &&
      (urunTipFiltre === "tumu" || urun.urunTipi === urunTipFiltre) &&
      (urunDurumFiltre === "tumu" || (urunDurumFiltre === "aktif" ? urun.aktif : !urun.aktif))
    );
    return [...liste].sort((a, b) => {
      if (urunSiralama === "fiyat-artan") return a.fiyat - b.fiyat;
      if (urunSiralama === "fiyat-azalan") return b.fiyat - a.fiyat;
      if (urunSiralama === "ad") return a.ad.localeCompare(b.ad, "tr");
      return Number(b.id) - Number(a.id);
    });
  }, [urunler, urunArama, urunKategoriFiltre, urunTipFiltre, urunDurumFiltre, urunSiralama]);
  const burgerUrunleri = urunler.filter((urun) => urun.urunTipi === "burger" && urun.aktif);
  const yanLezzetUrunleri = urunler.filter((urun) => urun.urunTipi === "yan_lezzet" && urun.aktif);
  const icecekUrunleri = urunler.filter((urun) => urun.urunTipi === "icecek" && urun.aktif);
  const onerilebilecekUrunler = urunler.filter((urun) => urun.aktif && String(urun.id) !== String(urunForm?.id || ""));
  const filtreliOneriUrunleri = onerilebilecekUrunler.filter((urun) => urun.ad.toLocaleLowerCase("tr").includes(oneriArama.trim().toLocaleLowerCase("tr")));
  const onerilenUrunuDegistir = (urunId) => {
    const seciliIdler = urunForm?.onerilenUrunler || [];
    if (seciliIdler.includes(urunId)) {
      setUrunForm({ ...urunForm, onerilenUrunler: seciliIdler.filter((id) => id !== urunId) });
    } else if (seciliIdler.length >= 5) {
      setHata("En fazla 5 önerilen ürün seçebilirsin.");
    } else {
      setUrunForm({ ...urunForm, onerilenUrunler: [...seciliIdler, urunId] });
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-marka"><img src={logoFull} alt="Burger Plus" /><small>Yönetim Merkezi</small></div>
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
                <Metrik ad="Bugünkü sipariş" deger={dashboard.bugunSiparis} alt="Toplam sipariş" renk="yesil" />
                <Metrik ad="Menü" deger={urunler.length} alt="Katalogdaki ürünler" renk="mavi" />
                <Metrik ad="Ekip" deger={`${dashboard.vardiyada}/${dashboard.personel}`} alt="Şu an vardiyada" renk="mor" />
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Son 30 gün satış hareketi" alt={para(toplamCiro)}>
                  <SatisCizgiGrafigi veriler={rapor.gunluk} />
                </Panel>
                <Panel baslik="En çok satanlar" alt="Son 30 gün">
                  <div className="admin-siralama">{dashboard.populer?.length ? dashboard.populer.map((u, i) => (
                    <div key={u.urun_ad}><span>{i + 1}</span><b>{u.urun_ad}</b><small>{u.adet} adet</small><strong>{para(u.ciro)}</strong></div>
                  )) : <Bos yazi="Henüz satış verisi yok." />}</div>
                </Panel>
              </section>
              <section className="admin-grid-3">
                <Panel baslik="Saatlik talep" alt="Satılan ürün adedi"><MiniCizgiGrafigi veriler={saatleriDoldur(rapor.saatlik || [])} deger="adet" etiket={(s) => `${String(s.saat).padStart(2, "0")}:00`} renk="mavi" /></Panel>
                <Panel baslik="Kategori dağılımı" alt="Son 30 gün"><KategoriDagilimi veriler={rapor.kategoriler || []} toplam={toplamUrun} /></Panel>
                <Panel baslik="Haftalık ritim" alt="Hangi gün daha yoğun?"><MiniCizgiGrafigi veriler={haftayiDoldur(rapor.haftalik || [])} deger="adet" etiket={(g) => haftaAdi(g.gun)} renk="mor" /></Panel>
              </section>
            </>}

            {bolum === "urunler" && <>
              <BolumBaslik baslik="Menü kataloğu" aciklama="Burger, boyutlu ürün ve menü yapılarını müşteri uygulamasıyla birlikte yönetin." buton="+ Yeni ürün" onClick={() => setUrunForm(yeniUrunFormu(kategoriler[0]?.ad))} />
              <section className="kategori-yonetim-karti">
                <header><div><span>UYGULAMA MENÜSÜ</span><h3>Kategoriler</h3><p>Buradaki sıralama ve görseller müşteri uygulamasına anında yansır.</p></div><button type="button" onClick={() => setKategoriForm({ ...BOS_KATEGORI, sira: (kategoriler.at(-1)?.sira || 0) + 10 })}>+ Kategori ekle</button></header>
                <div className="kategori-yonetim-listesi">
                  {kategoriler.map((kategori) => (
                    <button type="button" className={!kategori.aktif ? "pasif" : ""} key={kategori.id} onClick={() => setKategoriForm({ ...kategori })}>
                      <span className="kategori-yonetim-gorsel">{kategori.gorsel ? <img src={kategori.gorsel} alt="" /> : <b>{kategori.ad.charAt(0)}</b>}</span>
                      <span><b>{kategori.ad}</b><small>{urunler.filter((urun) => urun.kategori === kategori.ad).length} ürün · sıra {kategori.sira}</small></span>
                      <em>Düzenle</em>
                    </button>
                  ))}
                </div>
              </section>
              <section className="urun-filtreleri">
                <input type="search" value={urunArama} onChange={(e) => setUrunArama(e.target.value.slice(0, 80))} placeholder="Ürün adına göre ara…" aria-label="Ürün ara" />
                <select value={urunKategoriFiltre} onChange={(e) => setUrunKategoriFiltre(e.target.value)} aria-label="Kategori filtresi"><option value="tumu">Tüm kategoriler</option>{kategoriler.map((kategori) => <option key={kategori.id} value={kategori.ad}>{kategori.ad}</option>)}</select>
                <select value={urunTipFiltre} onChange={(e) => setUrunTipFiltre(e.target.value)} aria-label="Ürün türü filtresi"><option value="tumu">Tüm türler</option>{Object.entries(TIP_ETIKETLERI).map(([tip, etiket]) => <option key={tip} value={tip}>{etiket}</option>)}</select>
                <select value={urunDurumFiltre} onChange={(e) => setUrunDurumFiltre(e.target.value)} aria-label="Durum filtresi"><option value="tumu">Tüm durumlar</option><option value="aktif">Yayında</option><option value="pasif">Pasif</option></select>
                <select value={urunSiralama} onChange={(e) => setUrunSiralama(e.target.value)} aria-label="Ürün sıralaması"><option value="yeni">Son eklenen</option><option value="ad">Ada göre</option><option value="fiyat-artan">Fiyat artan</option><option value="fiyat-azalan">Fiyat azalan</option></select>
                <small>{filtreliUrunler.length} ürün</small>
              </section>
              <div className="admin-kart-grid">{filtreliUrunler.map((u) => (
                <article className={`admin-urun-kart ${!u.aktif ? "pasif" : ""}`} key={u.id}>
                  {u.gorsel ? <img src={u.gorsel} alt="" /> : <div className="admin-urun-gorselsiz">Görsel</div>}
                  <div><span className="admin-rozet">{u.kategori} · {TIP_ETIKETLERI[u.urunTipi] || "Ürün"}</span><h3>{u.ad}</h3>{u.urunTipi === "burger" && <p>{u.temelMiktar || "—"} {u.gramajOpsiyonu?.birim || "gr"}</p>}{u.boyutSecenekleri?.length > 0 && <small className="admin-gramaj-ozet">{u.boyutSecenekleri.map((boyut) => boyut.etiket).join(" · ")}</small>}{u.urunTipi === "menu" && <small className="admin-gramaj-ozet">Burger + Yan lezzet + İçecek</small>}{u.gramajOpsiyonu?.aktif && <small className="admin-gramaj-ozet">+{u.gramajOpsiyonu.artisMiktari} {u.gramajOpsiyonu.birim} · {para(u.gramajOpsiyonu.fiyatArtisi)} / adım</small>}<strong>{para(u.fiyat)}</strong></div>
                  <footer><button onClick={() => setUrunForm(urunuFormaCevir(u))}>Düzenle</button><button onClick={() => islem(() => adminIstek(`/urunler/${u.id}/aktif`, jsonGonder("PATCH", { aktif: !u.aktif })), u.aktif ? "Ürün yayından kaldırıldı." : "Ürün yayınlandı.")}>{u.aktif ? "Pasife al" : "Yayınla"}</button><button className="tehlike" onClick={() => { if (window.confirm(`${u.ad} katalogdan silinsin mi? Geçmiş siparişler korunacak.`)) islem(() => adminIstek(`/urunler/${u.id}`, { method: "DELETE" }), "Ürün katalogdan silindi."); }}>Sil</button></footer>
              </article>
              ))}{filtreliUrunler.length === 0 && <Bos yazi={urunler.length ? "Filtreye uygun ürün bulunamadı." : "Katalog boş. İlk ürünü yönetim panelinden ekleyebilirsin."} />}</div>
            </>}

            {bolum === "kampanyalar" && <>
              <BolumBaslik baslik="Kampanya yönetimi" aciklama="Uygulamada görünen kampanyaları, geçerli kategorileri ve indirim saatlerini yönetin." buton="+ Yeni kampanya" onClick={() => setKampanyaForm({ ...BOS_KAMPANYA, gecerliKategoriler: [] })} />
              <div className="yonetim-kart-grid">{kampanyalar.length ? kampanyalar.map((kampanya) => (
                <article className={`yonetim-kart kampanya-yonetim-kart ${!kampanya.aktif ? "pasif" : ""}`} key={kampanya.id}>
                  <div className="yonetim-kart-gorsel">
                    {kampanya.gorsel ? <img src={kampanya.gorsel} alt="" /> : <span>%{kampanya.indirimYuzde}</span>}
                    <b>{kampanya.aktif ? "YAYINDA" : "PASİF"}</b>
                  </div>
                  <div className="yonetim-kart-icerik">
                    <small>{kampanya.etiket}</small><h3>{kampanya.baslik}</h3><p>{kampanya.aciklama}</p>
                    <div className="yonetim-etiketler">
                      {Number(kampanya.indirimYuzde) > 0 && <span>%{kampanya.indirimYuzde} indirim</span>}
                      <span>{kampanya.kampanyaTipi === "saatli" ? `${String(kampanya.baslangicSaat).padStart(2, "0")}:00–${String(kampanya.bitisSaat).padStart(2, "0")}:00` : "Sürekli"}</span>
                      {(kampanya.gecerliKategoriler || []).map((kategori) => <span key={kategori}>{kategori}</span>)}
                    </div>
                  </div>
                  <footer><button type="button" onClick={() => setKampanyaForm({ ...kampanya, gecerliKategoriler: [...(kampanya.gecerliKategoriler || [])] })}>Düzenle</button></footer>
                </article>
              )) : <Bos yazi="Henüz kampanya tanımlanmamış." />}</div>
            </>}

            {bolum === "oduller" && <>
              <BolumBaslik baslik="Puan marketi" aciklama="Müşterilerin puanlarıyla alabileceği ürünleri ve gerekli puan tutarını belirleyin." buton="+ Yeni ödül" onClick={() => setOdulForm({ ...BOS_ODUL, urunId: urunler.find((urun) => urun.aktif)?.id || urunler[0]?.id || "" })} />
              <div className="yonetim-kart-grid">{oduller.length ? oduller.map((odul) => (
                <article className={`yonetim-kart odul-yonetim-kart ${!odul.aktif ? "pasif" : ""}`} key={odul.id}>
                  <div className="yonetim-kart-gorsel">
                    {odul.gorsel ? <img src={odul.gorsel} alt="" /> : <span>★</span>}
                    <b>{odul.aktif ? "MARKETTE" : "PASİF"}</b>
                  </div>
                  <div className="yonetim-kart-icerik"><small>PUAN ÖDÜLÜ</small><h3>{odul.ad}</h3><strong>{Number(odul.puan).toLocaleString("tr-TR")} Puan</strong><p>Bağlı ürün: {odul.urunAd}</p><div className="yonetim-etiketler"><span>{odul.kazanilmaSayisi} kez kazanıldı</span></div></div>
                  <footer><button type="button" onClick={() => setOdulForm({ ...odul })}>Düzenle</button></footer>
                </article>
              )) : <Bos yazi="Puan marketinde henüz ödül yok." />}</div>
            </>}

            {bolum === "duyurular" && <>
              <BolumBaslik baslik="Müşteri duyuruları" aciklama="Yayınlanan duyurular müşterilerin bildirim panelinde görünür." buton="+ Duyuru yayınla" onClick={() => setDuyuruForm({ ...BOS_DUYURU })} />
              <div className="duyuru-liste">{duyurular.length ? duyurular.map((duyuru) => <article key={duyuru.id} className={!duyuru.aktif ? "pasif" : ""}><span>DUYURU</span><h3>{duyuru.baslik}</h3><p>{duyuru.mesaj}</p><footer><small>{tarihSaat(duyuru.olusturma)}</small><b>{duyuru.hedef}</b></footer></article>) : <Bos yazi="Henüz yayınlanmış duyuru yok." />}</div>
            </>}

            {bolum === "personel" && <>
              <BolumBaslik baslik="Ekip ve vardiyalar" aciklama="Giriş–çıkış saatleri, çalışma süresi ve tahmini ücret takibi." buton="+ Personel ekle" onClick={() => setPersonelForm({ ...BOS_PERSONEL })} />
              <div className="admin-personel-grid">{personeller.map((p) => (
                <article className="admin-personel" key={p.id}><div className="personel-avatar">{p.ad[0]}{p.soyad[0]}</div><div className="personel-bilgi"><h3>{p.ad} {p.soyad}</h3><span>{p.rol}</span><small>{p.acik_vardiya_id ? `Giriş: ${tarihSaat(p.vardiya_giris)}` : "Vardiyada değil"}</small></div><div className="personel-saat"><b>{p.aylik_saat.toFixed(1)} sa</b><small>{para(p.aylik_saat * p.saatlik_ucret)}</small></div><button className={p.acik_vardiya_id ? "vardiya-cikis" : "vardiya-giris"} onClick={() => islem(() => adminIstek(`/personeller/${p.id}/vardiya`, jsonGonder("POST", { islem: p.acik_vardiya_id ? "cikis" : "giris" })), p.acik_vardiya_id ? "Çıkış kaydedildi." : "Giriş kaydedildi.")}>{p.acik_vardiya_id ? "Çıkış yap" : "Giriş yap"}</button><button className="duzenle-link" onClick={() => setPersonelForm({ id: p.id, ad: p.ad, soyad: p.soyad, rol: p.rol, email: p.email || "", telefon: p.telefon || "", saatlikUcret: p.saatlik_ucret, sifre: "" })}>Düzenle</button></article>
              ))}</div>
            </>}

            {bolum === "raporlar" && <>
              <BolumBaslik baslik="Satış analizi" aciklama="Son 30 günün ürün, adet ve ciro performansı." />
              <section className="admin-metrikler rapor-metrik"><Metrik ad="30 günlük ciro" deger={para(toplamCiro)} alt={`${toplamUrun} ürün`} renk="turuncu" /><Metrik ad="Günlük ortalama" deger={para(toplamCiro / Math.max(1, rapor.gunluk.length))} alt={`${rapor.gunluk.length} aktif satış günü`} renk="mavi" /><Metrik ad="Satılan ürün" deger={toplamUrun} alt={`${rapor.urunler.length} farklı ürün`} renk="yesil" /><Metrik ad="Yoğun saat" deger={yogunSaat.saat == null ? "—" : `${String(yogunSaat.saat).padStart(2, "0")}:00`} alt={`${yogunSaat.adet} ürün satıldı`} renk="mor" /></section>
              <Panel baslik="Ciro ve sipariş trendi" alt="Son 30 gün"><SatisCizgiGrafigi veriler={rapor.gunluk} /></Panel>
              <section className="admin-grid-2">
                <Panel baslik="Ürün talep sıralaması" alt="Kaç adet satıldı?"><UrunAdetGrafigi veriler={rapor.urunler} /></Panel>
                <Panel baslik="Günün yoğun saatleri" alt="Ürün adedi"><MiniCizgiGrafigi veriler={saatleriDoldur(rapor.saatlik || [])} deger="adet" etiket={(s) => `${String(s.saat).padStart(2, "0")}:00`} renk="mavi" /></Panel>
              </section>
              <section className="admin-grid-2">
                <Panel baslik="Kategori payları" alt="Ürün adedi"><KategoriDagilimi veriler={rapor.kategoriler || []} toplam={toplamUrun} detayli /></Panel>
                <Panel baslik="Haftanın satış ritmi" alt="Ürün adedi"><MiniCizgiGrafigi veriler={haftayiDoldur(rapor.haftalik || [])} deger="adet" etiket={(g) => haftaAdi(g.gun)} renk="mor" /></Panel>
              </section>
              <Panel baslik="Ürün performansı" alt={`${rapor.urunler.length} ürün`}><div className="admin-tablo-sarici"><table className="admin-tablo"><thead><tr><th>Ürün</th><th>Satılan</th><th>Ciro</th><th>Pay</th></tr></thead><tbody>{rapor.urunler.map((u) => <tr key={u.urun_ad}><td><b>{u.urun_ad}</b></td><td>{u.adet}</td><td><strong>{para(u.ciro)}</strong></td><td>%{toplamCiro ? ((u.ciro / toplamCiro) * 100).toFixed(1) : 0}</td></tr>)}</tbody></table></div></Panel>
            </>}
          </div>
        )}
      </main>

      {urunForm && (
        <Modal baslik={urunForm.id ? "Ürünü düzenle" : "Yeni ürün"} aciklama="Ürün bilgileri, fiyatlandırma ve porsiyon seçenekleri" sinif="admin-modal--urun" kapat={() => setUrunForm(null)}>
          <form className="admin-form urun-duzenleme-form" onSubmit={urunKaydet}>
            <div className="urun-form-onizleme">
              <span className="urun-form-gorsel">{urunForm.gorsel ? <img src={urunForm.gorsel} alt="Ürün önizleme" /> : <b>BP</b>}</span>
              <div><small>{urunForm.kategori || "KATEGORİ"} · {TIP_ETIKETLERI[urunForm.urunTipi]}</small><h3>{urunForm.ad || "Yeni ürün"}</h3><p>{para(urunForm.fiyat)}{urunForm.urunTipi === "burger" ? ` · Standart ${urunForm.temelMiktar || "—"} ${urunForm.gramajOpsiyonu?.birim || "gr"}` : ""}</p></div>
              <i>{urunForm.id ? "DÜZENLENİYOR" : "YENİ KAYIT"}</i>
            </div>
            <Ikili>
              <Alan etiket="Ürün adı"><input required maxLength="120" value={urunForm.ad} onChange={(e) => setUrunForm({ ...urunForm, ad: e.target.value })} /></Alan>
              <Alan etiket="Kategori"><select value={urunForm.kategori} onChange={(e) => urunKategorisiDegistir(e.target.value)}>{kategoriler.map((kategori) => <option key={kategori.id} value={kategori.ad}>{kategori.ad}</option>)}</select></Alan>
            </Ikili>
            <Ikili>
              <Alan etiket="Ürün türü"><select value={urunForm.urunTipi} onChange={(e) => urunTipiniDegistir(e.target.value)}>{Object.entries(TIP_ETIKETLERI).map(([tip, etiket]) => <option key={tip} value={tip}>{etiket}</option>)}</select></Alan>
              <Alan etiket="Başlangıç fiyatı (₺)"><input required type="number" min="0" max="100000" step="0.01" value={urunForm.fiyat} onChange={(e) => setUrunForm({ ...urunForm, fiyat: e.target.value })} /></Alan>
            </Ikili>

            <section className={`urun-vitrin-kart ${urunForm.populer ? "aktif" : ""}`}>
              <header>
                <div><b>Popüler ürün vitrini</b><small>Açıksa müşteri ana sayfasında bu kategorinin popüler ürünleri arasında gösterilir.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.populer === true} onChange={(e) => setUrunForm({ ...urunForm, populer: e.target.checked })} /><span /></label>
              </header>
            </section>

            <section className="urun-oneri-editoru">
              <header><div><b>Bu ürünle önerilecekler</b><small>Sepette ve ürün detayında gösterilir. En fazla 5 aktif ürün seçebilirsin.</small></div><strong>{urunForm.onerilenUrunler?.length || 0}/5</strong></header>
              <input className="oneri-arama" type="search" value={oneriArama} onChange={(e) => setOneriArama(e.target.value.slice(0, 80))} placeholder="Ürün ara…" aria-label="Önerilecek ürün ara" />
              <div className="oneri-secim-listesi">{filtreliOneriUrunleri.map((urun) => {
                const secili = (urunForm.onerilenUrunler || []).includes(urun.id);
                const devreDisi = !secili && (urunForm.onerilenUrunler || []).length >= 5;
                return <label className={`oneri-secim-karti ${secili ? "secili" : ""} ${devreDisi ? "devre-disi" : ""}`} key={urun.id}>
                  <input type="checkbox" checked={secili} disabled={devreDisi} onChange={() => onerilenUrunuDegistir(urun.id)} />
                  {urun.gorsel ? <img src={urun.gorsel} alt="" /> : <span className="oneri-secim-gorselsiz">BP</span>}
                  <span><b>{urun.ad}</b><small>{para(urun.fiyat)}</small></span><i>✓</i>
                </label>;
              })}</div>
              {onerilebilecekUrunler.length > 0 && !filtreliOneriUrunleri.length && <p>Aramana uygun ürün bulunamadı.</p>}
              {!onerilebilecekUrunler.length && <p>Öneri eklemek için önce başka bir aktif ürün oluşturmalısın.</p>}
            </section>

            {urunForm.urunTipi === "burger" && <Alan etiket="Standart burger gramajı"><input required type="number" min="1" max="10000" step="1" value={urunForm.temelMiktar} onChange={(e) => setUrunForm({ ...urunForm, temelMiktar: e.target.value })} /></Alan>}

            {urunForm.urunTipi === "burger" && <section className={`gramaj-kural-kart ${urunForm.gramajOpsiyonu?.aktif ? "aktif" : ""}`}>
              <header>
                <div><b>Dinamik gramaj artırımı</b><small>Müşteri ürün detayında miktarı adım adım artırabilir.</small></div>
                <label className="admin-switch"><input type="checkbox" checked={urunForm.gramajOpsiyonu?.aktif === true} onChange={(e) => gramajGuncelle("aktif", e.target.checked)} /><span /></label>
              </header>
              {urunForm.gramajOpsiyonu?.aktif && (
                <div className="gramaj-kural-alanlari">
                  <Ikili>
                    <Alan etiket="Müşteriye görünen etiket"><input required maxLength="80" value={urunForm.gramajOpsiyonu.etiket} onChange={(e) => gramajGuncelle("etiket", e.target.value)} placeholder="Köfte gramajı" /></Alan>
                    <Alan etiket="Birim"><select value={urunForm.gramajOpsiyonu.birim} onChange={(e) => gramajGuncelle("birim", e.target.value)}><option value="gr">gr</option><option value="ml">ml</option><option value="adet">adet</option></select></Alan>
                  </Ikili>
                  <div className="gramaj-uc-alan">
                    <Alan etiket="Her adımda artış"><input required type="number" min="1" max="10000" step="1" value={urunForm.gramajOpsiyonu.artisMiktari} onChange={(e) => gramajGuncelle("artisMiktari", e.target.value)} /></Alan>
                    <Alan etiket="Maksimum adım"><input required type="number" min="1" max="20" step="1" value={urunForm.gramajOpsiyonu.maxAdim} onChange={(e) => gramajGuncelle("maxAdim", e.target.value)} /></Alan>
                    <Alan etiket="Adım fiyatı (₺)"><input required type="number" min="0" max="100000" step="0.01" value={urunForm.gramajOpsiyonu.fiyatArtisi} onChange={(e) => gramajGuncelle("fiyatArtisi", e.target.value)} /></Alan>
                  </div>
                  <button type="button" className="gramaj-oneri-btn" onClick={() => setUrunForm((onceki) => ({ ...onceki, gramajOpsiyonu: gramajVarsayilani(onceki) }))}>Kategori önerisini yeniden hesapla</button>
                  <p className="gramaj-onizleme">Örnek: Standart {urunForm.temelMiktar || "—"} {urunForm.gramajOpsiyonu.birim} → ilk artış +{urunForm.gramajOpsiyonu.artisMiktari || "—"} {urunForm.gramajOpsiyonu.birim}, fiyat +{para(urunForm.gramajOpsiyonu.fiyatArtisi)}</p>
                </div>
              )}
            </section>}

            {["yan_lezzet", "icecek"].includes(urunForm.urunTipi) && (
              <section className="boyut-editoru">
                <header><div><b>Boyut seçenekleri</b><small>Miktar ve fiyat farklarını her ürün için ayrı belirle.</small></div></header>
                <div className="boyut-editor-baslik"><span>Varsayılan</span><span>Boyut</span><span>Miktar</span><span>Birim</span><span>Fiyat farkı</span></div>
                {urunForm.boyutSecenekleri.map((boyut, index) => (
                  <div className="boyut-editor-satir" key={boyut.kod}>
                    <input type="radio" name="varsayilan-boyut" checked={boyut.varsayilan === true} onChange={() => boyutGuncelle(index, "varsayilan", true)} aria-label={`${boyut.etiket} varsayılan`} />
                    <input required maxLength="40" value={boyut.etiket} onChange={(e) => boyutGuncelle(index, "etiket", e.target.value)} />
                    <input required type="number" min="1" max="10000" value={boyut.miktar} onChange={(e) => boyutGuncelle(index, "miktar", e.target.value)} />
                    <select value={boyut.birim} onChange={(e) => boyutGuncelle(index, "birim", e.target.value)}><option value="gr">gr</option><option value="ml">ml</option><option value="adet">adet</option></select>
                    <input required type="number" min="0" max="100000" step="0.01" value={boyut.fiyatFarki} onChange={(e) => boyutGuncelle(index, "fiyatFarki", e.target.value)} />
                  </div>
                ))}
              </section>
            )}

            {urunForm.urunTipi === "menu" && (
              <section className="menu-editoru">
                <header><b>Menü içeriği</b><small>Önce burger, yan lezzet ve içecek ürünlerini eklemelisin.</small></header>
                <Alan etiket="Menü burgeri"><select required value={urunForm.menuYapisi.burgerUrunId} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, burgerUrunId: e.target.value } })}><option value="">Burger seç</option>{burgerUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                <Ikili>
                  <Alan etiket="Yan lezzet"><select required value={urunForm.menuYapisi.yanLezzetUrunId} onChange={(e) => { const urun = yanLezzetUrunleri.find((aday) => String(aday.id) === e.target.value); setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, yanLezzetUrunId: e.target.value, varsayilanYanBoyut: urun?.boyutSecenekleri?.find((boyut) => boyut.varsayilan)?.kod || urun?.boyutSecenekleri?.[0]?.kod || "" } }); }}><option value="">Yan lezzet seç</option>{yanLezzetUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                  <Alan etiket="Başlangıç boyutu"><select required value={urunForm.menuYapisi.varsayilanYanBoyut} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, varsayilanYanBoyut: e.target.value } })}><option value="">Boyut seç</option>{(yanLezzetUrunleri.find((urun) => String(urun.id) === String(urunForm.menuYapisi.yanLezzetUrunId))?.boyutSecenekleri || []).map((boyut) => <option key={boyut.kod} value={boyut.kod}>{boyut.etiket} · {boyut.miktar} {boyut.birim}</option>)}</select></Alan>
                </Ikili>
                <Ikili>
                  <Alan etiket="İçecek"><select required value={urunForm.menuYapisi.icecekUrunId} onChange={(e) => { const urun = icecekUrunleri.find((aday) => String(aday.id) === e.target.value); setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, icecekUrunId: e.target.value, varsayilanIcecekBoyut: urun?.boyutSecenekleri?.find((boyut) => boyut.varsayilan)?.kod || urun?.boyutSecenekleri?.[0]?.kod || "" } }); }}><option value="">İçecek seç</option>{icecekUrunleri.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}</option>)}</select></Alan>
                  <Alan etiket="Başlangıç boyutu"><select required value={urunForm.menuYapisi.varsayilanIcecekBoyut} onChange={(e) => setUrunForm({ ...urunForm, menuYapisi: { ...urunForm.menuYapisi, varsayilanIcecekBoyut: e.target.value } })}><option value="">Boyut seç</option>{(icecekUrunleri.find((urun) => String(urun.id) === String(urunForm.menuYapisi.icecekUrunId))?.boyutSecenekleri || []).map((boyut) => <option key={boyut.kod} value={boyut.kod}>{boyut.etiket} · {boyut.miktar} {boyut.birim}</option>)}</select></Alan>
                </Ikili>
                <p>Menünün “İçindekiler” alanında seçilen burgerin malzemeleri gösterilir. Boyut büyütmelerinin fiyatı ilgili yan lezzet ve içecekten alınır.</p>
              </section>
            )}

            <Alan etiket="Ürün görseli (en fazla 5 MB)"><label className={`gorsel-yukleme ${gorselYukleniyor ? "yukleniyor" : ""}`}><input required={!urunForm.gorsel} type="file" accept="image/*" onChange={(e) => urunGorseliSec(e.target.files?.[0])} /><span>{gorselYukleniyor ? "Görsel yükleniyor…" : urunForm.gorsel ? "Görseli değiştir" : "Bilgisayardan görsel seç"}</span><small>{urunForm.gorsel ? "Görsel güvenli depolamaya yüklendi." : "PNG, JPG, WebP, GIF, AVIF ve BMP desteklenir."}</small></label></Alan>
            <Alan etiket="Açıklama"><textarea value={urunForm.aciklama || ""} onChange={(e) => setUrunForm({ ...urunForm, aciklama: e.target.value })} /></Alan>
            {urunForm.urunTipi !== "menu" ? <Alan etiket="Malzemeler (virgülle)"><input value={urunForm.malzemeler || ""} onChange={(e) => setUrunForm({ ...urunForm, malzemeler: e.target.value })} /></Alan> : <p className="menu-malzeme-notu">Menü malzemeleri seçilen burgerden otomatik alınır.</p>}
            <Alan etiket="Alerjenler (virgülle)"><input value={urunForm.alerjenler || ""} onChange={(e) => setUrunForm({ ...urunForm, alerjenler: e.target.value })} /></Alan>
            <FormAlt kapat={() => setUrunForm(null)} />
          </form>
        </Modal>
      )}
      {kategoriForm && (
        <Modal baslik={kategoriForm.id ? "Kategoriyi düzenle" : "Yeni kategori"} aciklama="Kategori adı ve görseli müşteri uygulamasındaki yuvarlak menüde kullanılır." sinif="admin-modal--kategori" kapat={() => setKategoriForm(null)}>
          <form className="admin-form kategori-form" onSubmit={kategoriKaydet}>
            <div className="kategori-form-onizleme">
              <span>{kategoriForm.gorsel ? <img src={kategoriForm.gorsel} alt="Kategori önizleme" /> : <b>{kategoriForm.ad?.charAt(0) || "+"}</b>}</span>
              <div><small>UYGULAMA ÖNİZLEMESİ</small><strong>{kategoriForm.ad || "Kategori adı"}</strong><p>Ana sayfadaki kategori satırında bu şekilde görünür.</p></div>
            </div>
            <Alan etiket="Kategori adı"><input required minLength="2" maxLength="60" value={kategoriForm.ad} onChange={(e) => setKategoriForm({ ...kategoriForm, ad: e.target.value })} placeholder="Örn. Tatlılar" /></Alan>
            <Alan etiket="Kategori görsel URL"><input required type="url" maxLength="1000" value={kategoriForm.gorsel || ""} onChange={(e) => setKategoriForm({ ...kategoriForm, gorsel: e.target.value })} placeholder="https://..." /></Alan>
            <Alan etiket="Menü sırası"><input required type="number" min="0" max="999" step="1" value={kategoriForm.sira} onChange={(e) => setKategoriForm({ ...kategoriForm, sira: e.target.value })} /></Alan>
            <FormAlt kapat={() => setKategoriForm(null)} />
          </form>
        </Modal>
      )}
      {kampanyaForm && (
        <Modal baslik={kampanyaForm.id ? "Kampanyayı düzenle" : "Yeni kampanya"} aciklama="Kaydettiğiniz değişiklikler müşteri uygulamasına anında yansır." sinif="admin-modal--yonetim" kapat={() => setKampanyaForm(null)}>
          <form className="admin-form" onSubmit={kampanyaKaydet}>
            <Ikili><Alan etiket="Kısa etiket"><input required maxLength="80" value={kampanyaForm.etiket} onChange={(e) => setKampanyaForm({ ...kampanyaForm, etiket: e.target.value })} placeholder="Örn. HAFTA SONU" /></Alan><Alan etiket="Kampanya başlığı"><input required maxLength="120" value={kampanyaForm.baslik} onChange={(e) => setKampanyaForm({ ...kampanyaForm, baslik: e.target.value })} /></Alan></Ikili>
            <Alan etiket="Açıklama"><textarea required maxLength="600" value={kampanyaForm.aciklama} onChange={(e) => setKampanyaForm({ ...kampanyaForm, aciklama: e.target.value })} /></Alan>
            <Alan etiket="Kampanya görsel URL"><input type="url" maxLength="1000" value={kampanyaForm.gorsel || ""} onChange={(e) => setKampanyaForm({ ...kampanyaForm, gorsel: e.target.value })} placeholder="https://... (isteğe bağlı)" /></Alan>
            <Ikili><Alan etiket="Kampanya türü"><select value={kampanyaForm.kampanyaTipi} onChange={(e) => setKampanyaForm({ ...kampanyaForm, kampanyaTipi: e.target.value })}><option value="surekli">Sürekli</option><option value="saatli">Saat aralığı</option></select></Alan><Alan etiket="İndirim oranı (%)"><input required type="number" min="0" max="90" step="1" value={kampanyaForm.indirimYuzde} onChange={(e) => setKampanyaForm({ ...kampanyaForm, indirimYuzde: e.target.value })} /></Alan></Ikili>
            {kampanyaForm.kampanyaTipi === "saatli" && <Ikili><Alan etiket="Başlangıç saati"><input required type="number" min="0" max="23" step="1" value={kampanyaForm.baslangicSaat} onChange={(e) => setKampanyaForm({ ...kampanyaForm, baslangicSaat: e.target.value })} /></Alan><Alan etiket="Bitiş saati"><input required type="number" min="1" max="24" step="1" value={kampanyaForm.bitisSaat} onChange={(e) => setKampanyaForm({ ...kampanyaForm, bitisSaat: e.target.value })} /></Alan></Ikili>}
            <fieldset className="kampanya-kategori-secimi"><legend>İndirimin geçerli olduğu kategoriler</legend><p>İndirim oranı sıfırdan büyükse en az bir kategori seçin.</p><div>{kategoriler.filter((kategori) => kategori.aktif !== false).map((kategori) => <label key={kategori.id}><input type="checkbox" checked={(kampanyaForm.gecerliKategoriler || []).includes(kategori.ad)} onChange={() => kampanyaKategoriDegistir(kategori.ad)} /><span>{kategori.ad}</span></label>)}</div></fieldset>
            <Ikili><Alan etiket="Buton metni"><input required maxLength="60" value={kampanyaForm.buton} onChange={(e) => setKampanyaForm({ ...kampanyaForm, buton: e.target.value })} /></Alan><Alan etiket="Buton görünümü"><select value={kampanyaForm.butonTipi} onChange={(e) => setKampanyaForm({ ...kampanyaForm, butonTipi: e.target.value })}><option value="primary">Turuncu</option><option value="charcoal">Koyu</option></select></Alan></Ikili>
            <Ikili><Alan etiket="Gösterim sırası"><input required type="number" min="0" max="999" step="1" value={kampanyaForm.sira} onChange={(e) => setKampanyaForm({ ...kampanyaForm, sira: e.target.value })} /></Alan><label className="yonetim-aktiflik"><input type="checkbox" checked={kampanyaForm.aktif === true} onChange={(e) => setKampanyaForm({ ...kampanyaForm, aktif: e.target.checked })} /><span>Uygulamada yayınla</span></label></Ikili>
            <FormAlt kapat={() => setKampanyaForm(null)} />
          </form>
        </Modal>
      )}
      {odulForm && (
        <Modal baslik={odulForm.id ? "Ödülü düzenle" : "Yeni puan ödülü"} aciklama="Ödül, seçilen gerçek menü ürünüyle eşleşir; fiyat ve sipariş güvenliği backend tarafından korunur." sinif="admin-modal--yonetim" kapat={() => setOdulForm(null)}>
          <form className="admin-form" onSubmit={odulKaydet}>
            <Alan etiket="Markette görünen ad"><input required maxLength="120" value={odulForm.ad} onChange={(e) => setOdulForm({ ...odulForm, ad: e.target.value })} placeholder="Örn. Seçili Burger" /></Alan>
            <Ikili><Alan etiket="Gerekli puan"><input required type="number" min="1" max="1000000" step="1" value={odulForm.puan} onChange={(e) => setOdulForm({ ...odulForm, puan: e.target.value })} /></Alan><Alan etiket="Verilecek ürün"><select required value={odulForm.urunId} onChange={(e) => setOdulForm({ ...odulForm, urunId: e.target.value })}>{urunler.map((urun) => <option key={urun.id} value={urun.id}>{urun.ad}{!urun.aktif ? " (pasif ürün)" : ""}</option>)}</select></Alan></Ikili>
            {Number(odulForm.kazanilmaSayisi) > 0 && <p className="yonetim-uyari">Bu ödül daha önce {odulForm.kazanilmaSayisi} kez kazanılmış. Geçmiş siparişleri korumak için bağlı ürünü değiştirmek isterseniz yeni ödül oluşturun.</p>}
            <Alan etiket="Ödül görsel URL"><input type="url" maxLength="1000" value={odulForm.gorsel || ""} onChange={(e) => setOdulForm({ ...odulForm, gorsel: e.target.value })} placeholder="Boşsa ürün görseli kullanılır" /></Alan>
            <label className="yonetim-aktiflik"><input type="checkbox" checked={odulForm.aktif === true} onChange={(e) => setOdulForm({ ...odulForm, aktif: e.target.checked })} /><span>Puan marketinde yayınla</span></label>
            <FormAlt kapat={() => setOdulForm(null)} />
          </form>
        </Modal>
      )}
      {personelForm && <Modal baslik={personelForm.id ? "Personeli düzenle" : "Personel ekle"} kapat={() => setPersonelForm(null)}><form className="admin-form" onSubmit={personelKaydet}><Ikili><Alan etiket="Ad"><input required value={personelForm.ad} onChange={(e) => setPersonelForm({ ...personelForm, ad: e.target.value })} /></Alan><Alan etiket="Soyad"><input required value={personelForm.soyad} onChange={(e) => setPersonelForm({ ...personelForm, soyad: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="Rol"><select value={personelForm.rol} onChange={(e) => setPersonelForm({ ...personelForm, rol: e.target.value })}><option>Mutfak</option><option>Salon</option><option>Kasiyer</option><option>Yönetici</option></select></Alan><Alan etiket="Saatlik ücret"><input type="number" value={personelForm.saatlikUcret} onChange={(e) => setPersonelForm({ ...personelForm, saatlikUcret: e.target.value })} /></Alan></Ikili><Ikili><Alan etiket="E-posta"><input required type="email" value={personelForm.email} onChange={(e) => setPersonelForm({ ...personelForm, email: e.target.value })} /></Alan><Alan etiket="Telefon"><input value={personelForm.telefon} onChange={(e) => setPersonelForm({ ...personelForm, telefon: e.target.value })} /></Alan></Ikili><Alan etiket={personelForm.id ? "Yeni şifre (değişmeyecekse boş bırak)" : "Giriş şifresi"}><input required={!personelForm.id} minLength="8" maxLength="72" type="password" autoComplete="new-password" value={personelForm.sifre || ""} onChange={(e) => setPersonelForm({ ...personelForm, sifre: e.target.value })} /></Alan><FormAlt kapat={() => setPersonelForm(null)} /></form></Modal>}
      {duyuruForm && <Modal baslik="Yeni duyuru" kapat={() => setDuyuruForm(null)}><form className="admin-form" onSubmit={duyuruKaydet}><Alan etiket="Duyuru başlığı"><input required maxLength="100" value={duyuruForm.baslik} onChange={(e) => setDuyuruForm({ ...duyuruForm, baslik: e.target.value })} placeholder="Örn. Yeni menümüz yayında" /></Alan><Alan etiket="Mesaj"><textarea required maxLength="600" value={duyuruForm.mesaj} onChange={(e) => setDuyuruForm({ ...duyuruForm, mesaj: e.target.value })} placeholder="Müşterilerin bildirim panelinde göreceği açıklama" /></Alan><Alan etiket="Tıklandığında açılacak sayfa"><select value={duyuruForm.hedef} onChange={(e) => setDuyuruForm({ ...duyuruForm, hedef: e.target.value })}><option value="/anasayfa">Ana sayfa</option><option value="/kampanyalar">Kampanyalar</option><option value="/hediyelerim">Hediyelerim</option></select></Alan><FormAlt kapat={() => setDuyuruForm(null)} /></form></Modal>}
    </div>
  );
}

function Metrik({ ad, deger, alt, renk }) { return <article className={`admin-metrik ${renk}`}><span>{ad}</span><strong>{deger}</strong><small>{alt}</small></article>; }
function Panel({ baslik, alt, children }) { return <section className="admin-panel"><header><h2>{baslik}</h2><span>{alt}</span></header>{children}</section>; }
function Bos({ yazi }) { return <div className="admin-bos">{yazi}</div>; }
function BolumBaslik({ baslik, aciklama, buton, onClick }) { return <div className="admin-bolum-baslik"><div><h2>{baslik}</h2><p>{aciklama}</p></div>{buton && <button onClick={onClick}>{buton}</button>}</div>; }
function SatisCizgiGrafigi({ veriler }) {
  const [secili, setSecili] = useState(null);
  const gunler = sonOtuzGunuDoldur(veriler);
  const ciroMax = Math.max(1, ...gunler.map((g) => g.ciro));
  const adetMax = Math.max(1, ...gunler.map((g) => g.adet));
  const w = 680;
  const h = 236;
  const pad = { sol: 12, sag: 12, ust: 18, alt: 31 };
  const x = (i) => pad.sol + (i / Math.max(1, gunler.length - 1)) * (w - pad.sol - pad.sag);
  const y = (deger, max) => pad.ust + (1 - deger / max) * (h - pad.ust - pad.alt);
  const noktalar = (alan, max) => gunler.map((g, i) => `${x(i)},${y(g[alan], max)}`).join(" ");
  const alan = `M ${x(0)} ${h - pad.alt} L ${gunler.map((g, i) => `${x(i)} ${y(g.ciro, ciroMax)}`).join(" L ")} L ${x(gunler.length - 1)} ${h - pad.alt} Z`;
  const seciliGun = secili == null ? gunler[gunler.length - 1] : gunler[secili];
  const enYuksek = gunler.reduce((en, g) => g.ciro > en.ciro ? g : en, gunler[0]);
  const sonYedi = gunler.slice(-7).reduce((t, g) => t + g.ciro, 0);
  const oncekiYedi = gunler.slice(-14, -7).reduce((t, g) => t + g.ciro, 0);
  const degisim = oncekiYedi ? ((sonYedi - oncekiYedi) / oncekiYedi) * 100 : null;

  if (!veriler.length) return <Bos yazi="Grafik için satış verisi bekleniyor." />;

  return <div className="cizgi-grafik">
    <div className="cizgi-grafik-ust">
      <div className="cizgi-lejant"><span><i className="ciro" />Ciro</span><span><i className="adet" />Ürün adedi</span></div>
      <div className="cizgi-secili"><b>{gunEtiketi(seciliGun.gun)}</b><span>{para(seciliGun.ciro)} · {seciliGun.adet} ürün</span></div>
    </div>
    <div className="cizgi-cizim">
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Son 30 gün ciro ve ürün adedi çizgi grafiği">
        <defs>
          <linearGradient id="ciro-alani" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#ff6b00" stopOpacity=".32" /><stop offset="1" stopColor="#ff6b00" stopOpacity="0" /></linearGradient>
        </defs>
        {[0.2, 0.4, 0.6, 0.8].map((oran) => <line key={oran} className="cizgi-grid" x1={pad.sol} x2={w - pad.sag} y1={pad.ust + oran * (h - pad.ust - pad.alt)} y2={pad.ust + oran * (h - pad.ust - pad.alt)} />)}
        <path d={alan} fill="url(#ciro-alani)" />
        <polyline className="cizgi ciro" points={noktalar("ciro", ciroMax)} />
        <polyline className="cizgi adet" points={noktalar("adet", adetMax)} />
        {gunler.map((g, i) => <g key={g.gun} onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} tabIndex={0} role="button" aria-label={`${gunEtiketi(g.gun)}: ${para(g.ciro)}, ${g.adet} ürün`}>
          <line className="cizgi-hedef" x1={x(i) - 8} x2={x(i) + 8} y1={pad.ust} y2={h - pad.alt} />
          <circle className={`cizgi-nokta ${secili === i ? "aktif" : ""}`} cx={x(i)} cy={y(g.ciro, ciroMax)} r={secili === i ? "4.5" : "2.5"} />
        </g>)}
        {gunler.filter((_, i) => i === 0 || i === gunler.length - 1 || i % 7 === 0).map((g, i) => <text className="cizgi-etiket" key={g.gun} x={x(gunler.indexOf(g))} y={h - 8} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>{new Date(g.gun).getDate()}</text>)}
      </svg>
    </div>
    <div className="cizgi-ozet">
      <div><span>En yüksek gün</span><b>{para(enYuksek.ciro)}</b><small>{gunEtiketi(enYuksek.gun)}</small></div>
      <div><span>Günlük ortalama</span><b>{para(gunler.reduce((t, g) => t + g.ciro, 0) / gunler.length)}</b><small>30 günlük görünüm</small></div>
      <div><span>Son 7 gün</span><b className={degisim != null && degisim < 0 ? "eksi" : "arti"}>{degisim == null ? "Yeni veri" : `${degisim >= 0 ? "+" : ""}%${degisim.toFixed(1)}`}</b><small>Önceki 7 güne göre</small></div>
    </div>
  </div>;
}

function sonOtuzGunuDoldur(veriler) {
  const kayitlar = new Map(veriler.map((g) => [String(g.gun).slice(0, 10), { ciro: Number(g.ciro || 0), adet: Number(g.adet || 0) }]));
  return Array.from({ length: 30 }, (_, i) => {
    const tarih = new Date();
    tarih.setHours(12, 0, 0, 0);
    tarih.setDate(tarih.getDate() - (29 - i));
    const gun = tarih.toISOString().slice(0, 10);
    return { gun, ...(kayitlar.get(gun) || { ciro: 0, adet: 0 }) };
  });
}

function gunEtiketi(gun) { return new Date(`${gun}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }); }

function MiniCizgiGrafigi({ veriler, deger, etiket, renk = "turuncu" }) {
  const [secili, setSecili] = useState(null);
  const doluVeri = veriler.some((v) => Number(v[deger]) > 0);
  if (!doluVeri) return <Bos yazi="Bu görünüm için henüz satış verisi yok." />;
  const w = 540;
  const h = 174;
  const pad = { sol: 10, sag: 10, ust: 12, alt: 28 };
  const max = Math.max(1, ...veriler.map((v) => Number(v[deger] || 0)));
  const x = (i) => pad.sol + (i / Math.max(1, veriler.length - 1)) * (w - pad.sol - pad.sag);
  const y = (n) => pad.ust + (1 - Number(n || 0) / max) * (h - pad.ust - pad.alt);
  const points = veriler.map((v, i) => `${x(i)},${y(v[deger])}`).join(" ");
  const alan = `M ${x(0)} ${h - pad.alt} L ${veriler.map((v, i) => `${x(i)} ${y(v[deger])}`).join(" L ")} L ${x(veriler.length - 1)} ${h - pad.alt} Z`;
  const indeks = secili == null ? veriler.length - 1 : secili;
  const secilen = veriler[indeks];
  const etiketAraligi = Math.max(1, Math.ceil((veriler.length - 1) / 4));

  return <div className={`mini-cizgi mini-cizgi--${renk}`}>
    <div className="mini-cizgi-bilgi"><span>{etiket(secilen)}</span><b>{Number(secilen[deger] || 0).toLocaleString("tr-TR")} ürün</b></div>
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Satış yoğunluğu çizgi grafiği">
      <defs><linearGradient id={`mini-alan-${renk}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="currentColor" stopOpacity=".25" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      {[.25, .5, .75].map((oran) => <line key={oran} className="mini-cizgi-grid" x1={pad.sol} x2={w - pad.sag} y1={pad.ust + oran * (h - pad.ust - pad.alt)} y2={pad.ust + oran * (h - pad.ust - pad.alt)} />)}
      <path d={alan} fill={`url(#mini-alan-${renk})`} />
      <polyline className="mini-cizgi-cizgi" points={points} />
      {veriler.map((v, i) => <g key={i} tabIndex={0} role="button" onMouseEnter={() => setSecili(i)} onFocus={() => setSecili(i)} aria-label={`${etiket(v)}: ${v[deger]} ürün`}>
        <line className="mini-cizgi-hedef" x1={x(i)} x2={x(i)} y1={pad.ust} y2={h - pad.alt} />
        <circle className={secili === i ? "aktif" : ""} cx={x(i)} cy={y(v[deger])} r={secili === i ? "4" : "2.25"} />
      </g>)}
      {veriler.map((v, i) => (i === 0 || i === veriler.length - 1 || i % etiketAraligi === 0) && <text className="mini-cizgi-etiket" key={`etiket-${i}`} x={x(i)} y={h - 8} textAnchor={i === 0 ? "start" : i === veriler.length - 1 ? "end" : "middle"}>{etiket(v)}</text>)}
    </svg>
  </div>;
}

function KategoriDagilimi({ veriler, toplam, detayli = false }) {
  if (!veriler.length || !toplam) return <Bos yazi="Kategori dağılımı satışlarla oluşacak." />;
  const renkler = ["turuncu", "mavi", "mor", "yesil", "kirmizi"];
  return <div className={`kategori-dagilim ${detayli ? "detayli" : ""}`}>
    <div className="kategori-yigin">{veriler.map((k, i) => <i key={k.kategori} className={renkler[i % renkler.length]} style={{ width: `${(k.adet / toplam) * 100}%` }} title={`${k.kategori}: ${k.adet} ürün`} />)}</div>
    <div className="kategori-liste">{veriler.map((k, i) => <div key={k.kategori}><span><i className={renkler[i % renkler.length]} />{k.kategori}</span><b>{k.adet} ürün</b>{detayli && <small>{para(k.ciro)} · %{((k.adet / toplam) * 100).toFixed(1)}</small>}</div>)}</div>
  </div>;
}

function UrunAdetGrafigi({ veriler }) {
  const ilkler = veriler.slice(0, 6);
  const max = Math.max(1, ...ilkler.map((u) => Number(u.adet || 0)));
  if (!ilkler.length) return <Bos yazi="Ürün talebi sipariş geldikçe oluşacak." />;
  return <div className="urun-adet-grafik">{ilkler.map((u, i) => <div key={u.urun_ad}><header><span>{i + 1}</span><b>{u.urun_ad}</b><strong>{u.adet} adet</strong></header><div><i style={{ width: `${(u.adet / max) * 100}%` }} /></div></div>)}</div>;
}

function saatleriDoldur(veriler) {
  const kayitlar = new Map(veriler.map((s) => [Number(s.saat), s]));
  return Array.from({ length: 24 }, (_, saat) => kayitlar.get(saat) || { saat, adet: 0, siparis: 0 });
}

function haftayiDoldur(veriler) {
  const kayitlar = new Map(veriler.map((g) => [Number(g.gun), g]));
  return Array.from({ length: 7 }, (_, i) => kayitlar.get(i + 1) || { gun: i + 1, adet: 0, ciro: 0 });
}

function haftaAdi(gun) { return ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][Number(gun) - 1] || "—"; }
function Modal({ baslik, aciklama, sinif = "", kapat, children }) { return <div className="admin-modal-perde" onMouseDown={(e) => e.target === e.currentTarget && kapat()}><section className={`admin-modal ${sinif}`}><header><div><h2>{baslik}</h2>{aciklama && <p>{aciklama}</p>}</div><button type="button" aria-label="Pencereyi kapat" onClick={kapat}>×</button></header>{children}</section></div>; }
function Alan({ etiket, children }) { return <label className="admin-alan"><span>{etiket}</span>{children}</label>; }
function Ikili({ children }) { return <div className="admin-ikili">{children}</div>; }
function FormAlt({ kapat }) { return <div className="form-alt"><button type="button" onClick={kapat}>Vazgeç</button><button className="primary" type="submit">Kaydet</button></div>; }
