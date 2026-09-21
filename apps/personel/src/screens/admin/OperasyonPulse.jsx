import { useCallback, useEffect, useRef, useState } from "react";
import { adminIstek } from "../../lib/adminApi";
import { useIsletmeNavigate } from "../../hooks/useIsletmeNavigate";
import AdminIcon from "../../components/AdminIcon";
import "./OperasyonPulse.css";

const YOGUNLUK = {
  sakin: { ad: "Sakin", oran: 18 },
  normal: { ad: "Dengeli", oran: 42 },
  yogun: { ad: "Yoğun", oran: 72 },
  kritik: { ad: "Kritik", oran: 100 },
};

const MASA_DURUMLARI = {
  personel_onayi: "Onay bekliyor",
  hazirlaniyor: "Hazırlanıyor",
  yeni: "Mutfağa alındı",
  hazir: "Servise hazır",
  tahsilat_bekliyor: "Tahsilat bekliyor",
  acik: "Masa açık",
};

const SIPARIS_DURUMLARI = {
  yeni: "Yeni",
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
};

const AKSIYON_HEDEFLERI = {
  nakit_onay: "/yonetim/satislar",
  nakit_tahsilat: "/yonetim/satislar",
  mutfak_gecikme: "/yonetim/mutfak-kayitlari",
  stok: "/yonetim/stok-takibi",
  personel: "/yonetim/personel",
};

const METRIKLER = [
  ["bugunTahsilat", "Bugünkü tahsilat", "receipt", "para"],
  ["bugunSiparis", "Sipariş", "chart", "sayi"],
  ["ortalamaSepet", "Ortalama sepet", "wallet", "para"],
  ["aktifMasa", "Aktif masa", "floor", "sayi"],
  ["mutfakKuyrugu", "Mutfak kuyruğu", "kitchen", "sayi"],
  ["ortalamaHazirlamaDakika", "Hazırlama", "clock", "dakika"],
  ["tahsilatBekleyenTutar", "Bekleyen nakit", "card", "para"],
  ["kritikStok", "Kritik stok", "stock", "sayi"],
];

const para = (deger) => `₺${Number(deger || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const tarihSaat = (deger) => deger ? new Date(deger).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
const metrikDegeri = (deger, tur) => {
  if (tur === "para") return para(deger);
  if (tur === "dakika") return deger == null ? "—" : `${Number(deger).toLocaleString("tr-TR")} dk`;
  return Number(deger || 0).toLocaleString("tr-TR");
};

function PulseBos({ ikon, baslik, aciklama }) {
  return <div className="pulse-bos"><AdminIcon name={ikon} /><b>{baslik}</b><span>{aciklama}</span></div>;
}

export default function OperasyonPulse() {
  const git = useIsletmeNavigate();
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [hata, setHata] = useState("");
  const istekSuruyor = useRef(false);

  const nabziYukle = useCallback(async ({ sessiz = false } = {}) => {
    if (istekSuruyor.current) return;
    istekSuruyor.current = true;
    if (sessiz) setYenileniyor(true);
    else setYukleniyor(true);
    try {
      const sonuc = await adminIstek("/operasyon-nabzi");
      setVeri(sonuc);
      setHata("");
    } catch (istekHatasi) {
      setHata(istekHatasi.message || "Operasyon verisi alınamadı.");
    } finally {
      istekSuruyor.current = false;
      setYukleniyor(false);
      setYenileniyor(false);
    }
  }, []);

  useEffect(() => {
    nabziYukle();
    const zamanlayici = setInterval(() => nabziYukle({ sessiz: true }), 15_000);
    return () => clearInterval(zamanlayici);
  }, [nabziYukle]);

  if (yukleniyor && !veri) {
    return <section className="pulse-yukleniyor" aria-label="Operasyon verileri yükleniyor">
      <span /><span /><span /><span />
    </section>;
  }

  if (!veri) {
    return <section className="pulse-hata">
      <AdminIcon name="alert" />
      <div><b>Operasyon verisi alınamadı</b><span>{hata}</span></div>
      <button type="button" onClick={() => nabziYukle()}>Tekrar dene</button>
    </section>;
  }

  const metrikler = veri.metrikler || {};
  const mutfak = veri.mutfak || {};
  const nakit = veri.nakit || {};
  const personel = veri.personel || {};
  const masalar = veri.masalar || [];
  const aksiyonlar = veri.aksiyonlar || [];
  const stoklar = [...(veri.stok?.hammaddeler || []), ...(veri.stok?.paketliUrunler || [])];
  const yogunluk = YOGUNLUK[mutfak.yogunluk] || YOGUNLUK.sakin;

  return <section className="pulse-merkezi">
    <header className="pulse-ust">
      <div className="pulse-ust-baslik">
        <span><i /> CANLI OPERASYON</span>
        <h2>MasanPOS Pulse</h2>
        <p>{metrikler.aktifMasa || mutfak.kuyruktakiSiparis
          ? `${metrikler.aktifMasa || 0} aktif masa · ${mutfak.kuyruktakiSiparis || 0} sipariş mutfak kuyruğunda`
          : "Operasyon dengeli, açık sipariş bulunmuyor."}</p>
      </div>
      <div className="pulse-ust-durum">
        <div className={`pulse-yogunluk-etiketi ${mutfak.yogunluk || "sakin"}`}>
          <AdminIcon name="activity" />
          <span><small>MUTFAK YOĞUNLUĞU</small><b>{yogunluk.ad}</b></span>
        </div>
        <button type="button" className={yenileniyor ? "donuyor" : ""} onClick={() => nabziYukle({ sessiz: true })} disabled={yenileniyor} title="Operasyon verisini yenile">
          <AdminIcon name="refresh" />
        </button>
        <time>Son güncelleme {tarihSaat(veri.uretimZamani)}</time>
      </div>
    </header>

    {hata && <div className="pulse-uyari"><AdminIcon name="alert" /><span>Son yenileme tamamlanamadı: {hata}</span></div>}

    <div className="pulse-metrikler">
      {METRIKLER.map(([alan, etiket, ikon, tur]) => <article key={alan} className={(alan === "kritikStok" && Number(metrikler[alan]) > 0) || (alan === "tahsilatBekleyenTutar" && Number(metrikler[alan]) > 0) ? "uyari" : ""}>
        <i><AdminIcon name={ikon} /></i>
        <span>{etiket}</span>
        <strong>{metrikDegeri(metrikler[alan], tur)}</strong>
      </article>)}
    </div>

    <div className="pulse-ana-grid">
      <section className="pulse-panel pulse-masa-paneli">
        <header className="pulse-panel-baslik">
          <div><span>SALON DURUMU</span><h3>Canlı masa haritası</h3></div>
          <small>{masalar.length} açık nokta</small>
        </header>
        {masalar.length ? <div className="pulse-masalar">
          {masalar.map((masa) => <article className={`pulse-masa ${masa.durum}`} key={`${masa.tip}-${masa.masaNo}`}>
            <header>
              <i><AdminIcon name={masa.tip === "gel_al" ? "receipt" : "floor"} /></i>
              <span><b>{masa.tip === "gel_al" ? "Gel Al" : `Masa ${masa.masaNo}`}</b><small>{MASA_DURUMLARI[masa.durum] || masa.durum}</small></span>
              <em />
            </header>
            <strong>{para(masa.toplam)}</strong>
            <footer>
              <span>{masa.onayBekleyen ? `${masa.onayBekleyen} onay` : `${masa.siparisSayisi} sipariş`}</span>
              <span>{masa.urunAdedi} ürün</span>
              <span>{masa.beklemeDakika > 0 ? `${Math.round(masa.beklemeDakika)} dk` : "Yeni"}</span>
            </footer>
          </article>)}
        </div> : <PulseBos ikon="floor" baslik="Salon sakin" aciklama="Şu anda açık masa veya bekleyen masa siparişi yok." />}
      </section>

      <section className="pulse-panel pulse-aksiyon-paneli">
        <header className="pulse-panel-baslik">
          <div><span>ÖNCELİKLİ AKSİYONLAR</span><h3>Şimdi ne yapılmalı?</h3></div>
          <small>{aksiyonlar.length} görev</small>
        </header>
        {aksiyonlar.length ? <div className="pulse-aksiyonlar">
          {aksiyonlar.map((aksiyon) => <button type="button" className={aksiyon.oncelik} key={aksiyon.id} onClick={() => git(AKSIYON_HEDEFLERI[aksiyon.tur] || "/yonetim/genel-bakis")}>
            <i><AdminIcon name={aksiyon.tur === "stok" ? "stock" : aksiyon.tur === "personel" ? "users" : aksiyon.tur === "mutfak_gecikme" ? "kitchen" : "alert"} /></i>
            <span><b>{aksiyon.baslik}</b><small>{aksiyon.aciklama}</small></span>
            <AdminIcon name="chevron" className="pulse-aksiyon-ok" />
          </button>)}
        </div> : <PulseBos ikon="check" baslik="Operasyon dengeli" aciklama="Şu anda müdahale gerektiren bir durum bulunmuyor." />}
      </section>
    </div>

    <div className="pulse-ikincil-grid">
      <section className="pulse-panel pulse-mutfak-paneli">
        <header className="pulse-panel-baslik">
          <div><span>MUTFAK</span><h3>Kuyruk ve kapasite</h3></div>
          <small>{personel.vardiyada || 0}/{personel.toplam || 0} vardiyada</small>
        </header>
        <div className="pulse-yogunluk-cubugu">
          <div><span>Yoğunluk</span><b>{yogunluk.ad}</b></div>
          <i><b className={mutfak.yogunluk || "sakin"} style={{ width: `${yogunluk.oran}%` }} /></i>
        </div>
        <div className="pulse-mutfak-adimlari">
          <article><i className="yeni" /><span><b>{mutfak.yeniSiparis || 0}</b><small>Yeni</small></span></article>
          <article><i className="hazirlaniyor" /><span><b>{mutfak.hazirlananSiparis || 0}</b><small>Hazırlanıyor</small></span></article>
          <article><i className="hazir" /><span><b>{mutfak.hazirSiparis || 0}</b><small>Hazır</small></span></article>
        </div>
        <dl className="pulse-mutfak-detay">
          <div><dt>Kuyruktaki ürün</dt><dd>{mutfak.kuyruktakiUrun || 0}</dd></div>
          <div><dt>En uzun bekleme</dt><dd>{Math.round(mutfak.enUzunBeklemeDakika || 0)} dk</dd></div>
          <div><dt>Gecikme eşiği</dt><dd>{mutfak.gecikmeEsigiDakika || 15} dk</dd></div>
        </dl>
      </section>

      <section className="pulse-panel pulse-nakit-paneli">
        <header className="pulse-panel-baslik">
          <div><span>NAKİT AKIŞI</span><h3>Bekleyen işlemler</h3></div>
          <small>{para(nakit.tahsilatBekleyenTutar)}</small>
        </header>
        <div className="pulse-nakit-sayilar">
          <article><i><AdminIcon name="clock" /></i><span><b>{nakit.onayBekleyen || 0}</b><small>Personel onayı</small></span></article>
          <article><i><AdminIcon name="card" /></i><span><b>{nakit.tahsilatBekleyen || 0}</b><small>Tahsilat</small></span></article>
        </div>
        <div className="pulse-nakit-alt"><span>En eski bekleme</span><strong>{Math.round(nakit.enEskiBeklemeDakika || 0)} dk</strong></div>
      </section>

      <section className="pulse-panel pulse-stok-paneli">
        <header className="pulse-panel-baslik">
          <div><span>STOK RİSKİ</span><h3>Kritik kalemler</h3></div>
          <button type="button" onClick={() => git("/yonetim/stok-takibi")}>Tümünü aç</button>
        </header>
        {stoklar.length ? <div className="pulse-stok-listesi">
          {stoklar.slice(0, 5).map((stok) => <button type="button" key={`${stok.tur}-${stok.id}`} onClick={() => git("/yonetim/stok-takibi")}>
            <i className={stok.durum} />
            <span><b>{stok.ad}</b><small>{stok.tur === "hammadde" ? "Hammadde" : "Paketli ürün"}</small></span>
            <strong>{Number(stok.mevcut).toLocaleString("tr-TR")} {stok.birim}</strong>
          </button>)}
        </div> : <PulseBos ikon="check" baslik="Stoklar yeterli" aciklama="Kritik seviyede stok kalemi bulunmuyor." />}
      </section>
    </div>

    <section className="pulse-panel pulse-siparis-paneli">
      <header className="pulse-panel-baslik">
        <div><span>BUGÜN</span><h3>Son sipariş hareketleri</h3></div>
        <button type="button" onClick={() => git("/yonetim/satislar")}>Canlı satışları aç</button>
      </header>
      {(veri.sonSiparisler || []).length ? <div className="pulse-siparis-listesi">
        {(veri.sonSiparisler || []).map((siparis) => <article key={siparis.siparisNo}>
          <i className={siparis.durum}><AdminIcon name="receipt" /></i>
          <span><b>{siparis.siparisNo}</b><small>{siparis.kisiAdi}</small></span>
          <em>{String(siparis.masaNo) === "algotur" ? "Gel Al" : `Masa ${siparis.masaNo}`}</em>
          <small>{siparis.urunAdedi} ürün</small>
          <strong>{para(siparis.tutar)}</strong>
          <time>{tarihSaat(siparis.olusturma)}</time>
          <b className={`pulse-siparis-durum ${siparis.durum}`}>{SIPARIS_DURUMLARI[siparis.durum] || siparis.durum}</b>
        </article>)}
      </div> : <PulseBos ikon="receipt" baslik="Henüz sipariş yok" aciklama="Bugünün siparişleri burada görünecek." />}
    </section>
  </section>;
}
