import { useCallback, useEffect, useRef, useState } from "react";
import { adminIstek } from "../../lib/adminApi";
import { socket } from "../../lib/socket";
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

const CANLI_OLAY_ADLARI = {
  siparis: "Yeni sipariş alındı",
  nakit: "Nakit akışı güncellendi",
  mutfak: "Mutfak durumu değişti",
  masa: "Masa durumu değişti",
  stok: "Stok hareketi işlendi",
  urun: "Ürün durumu güncellendi",
  personel: "Ekip bilgisi güncellendi",
  vardiya: "Vardiya durumu değişti",
};

const CANLI_OLAY_IKONLARI = {
  siparis: "receipt",
  nakit: "card",
  mutfak: "kitchen",
  masa: "floor",
  stok: "stock",
  urun: "products",
  personel: "users",
  vardiya: "clock",
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
  const [canliBagli, setCanliBagli] = useState(socket.connected);
  const [sonCanliOlay, setSonCanliOlay] = useState(null);
  const [canliOlaylar, setCanliOlaylar] = useState([]);
  const [degisenMetrikler, setDegisenMetrikler] = useState([]);
  const [sunumModu, setSunumModu] = useState(false);
  const [ozetKopyalandi, setOzetKopyalandi] = useState(false);
  const istekSuruyor = useRef(false);
  const canliYenileme = useRef(null);
  const olayGizleme = useRef(null);
  const degisimGizleme = useRef(null);
  const kopyaGizleme = useRef(null);
  const oncekiMetrikler = useRef(null);
  const olaySirasi = useRef(0);
  const pulseRef = useRef(null);

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

  useEffect(() => {
    const baglandi = () => setCanliBagli(true);
    const baglantiKesildi = () => setCanliBagli(false);
    const nabizDegisti = (olay = {}) => {
      const kayit = { ...olay, alindi: Date.now(), sira: ++olaySirasi.current };
      setSonCanliOlay(kayit);
      setCanliOlaylar((onceki) => [kayit, ...onceki].slice(0, 6));
      clearTimeout(canliYenileme.current);
      clearTimeout(olayGizleme.current);
      canliYenileme.current = setTimeout(() => nabziYukle({ sessiz: true }), 240);
      olayGizleme.current = setTimeout(() => setSonCanliOlay(null), 4_500);
    };

    socket.on("connect", baglandi);
    socket.on("disconnect", baglantiKesildi);
    socket.on("operasyon-nabzi-guncellendi", nabizDegisti);

    return () => {
      clearTimeout(canliYenileme.current);
      clearTimeout(olayGizleme.current);
      socket.off("connect", baglandi);
      socket.off("disconnect", baglantiKesildi);
      socket.off("operasyon-nabzi-guncellendi", nabizDegisti);
    };
  }, [nabziYukle]);

  useEffect(() => {
    const yeniMetrikler = veri?.metrikler;
    if (!yeniMetrikler) return;
    if (oncekiMetrikler.current) {
      const degisenler = METRIKLER
        .map(([alan]) => alan)
        .filter((alan) => Number(oncekiMetrikler.current[alan] ?? 0) !== Number(yeniMetrikler[alan] ?? 0));
      if (degisenler.length) {
        setDegisenMetrikler(degisenler);
        clearTimeout(degisimGizleme.current);
        degisimGizleme.current = setTimeout(() => setDegisenMetrikler([]), 1_800);
      }
    }
    oncekiMetrikler.current = { ...yeniMetrikler };
  }, [veri]);

  useEffect(() => {
    const ekranDegisti = () => setSunumModu(document.fullscreenElement === pulseRef.current);
    document.addEventListener("fullscreenchange", ekranDegisti);
    return () => {
      clearTimeout(degisimGizleme.current);
      clearTimeout(kopyaGizleme.current);
      document.removeEventListener("fullscreenchange", ekranDegisti);
    };
  }, []);

  const sunumModunuDegistir = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await pulseRef.current?.requestFullscreen?.();
    } catch {
      setSunumModu(false);
    }
  };

  const ozetiKopyala = async () => {
    const metin = veri?.yoneticiOzeti?.metin;
    if (!metin) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(metin);
      } else {
        const alan = document.createElement("textarea");
        alan.value = metin;
        alan.style.position = "fixed";
        alan.style.opacity = "0";
        document.body.appendChild(alan);
        alan.select();
        document.execCommand("copy");
        alan.remove();
      }
      setOzetKopyalandi(true);
      clearTimeout(kopyaGizleme.current);
      kopyaGizleme.current = setTimeout(() => setOzetKopyalandi(false), 2_000);
    } catch {
      setOzetKopyalandi(false);
    }
  };

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
  const ongoru = veri.ongoru || {};
  const ongoruGuveni = ongoru.guven || {};
  const ongoruPersoneli = ongoru.personel || {};
  const yoneticiOzeti = veri.yoneticiOzeti || {
    baslik: "Operasyon özeti hazırlanıyor",
    durum: "normal",
    metin: "Canlı operasyon verileri tamamlandığında yönetici özeti burada görünecek.",
  };

  return <section className="pulse-merkezi" ref={pulseRef}>
    <header className="pulse-ust">
      <div className="pulse-ust-baslik">
        <span className={canliBagli ? "bagli" : "baglanti-bekliyor"}><i /> {canliBagli ? "CANLI BAĞLI" : "YENİDEN BAĞLANIYOR"}</span>
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
        <button type="button" onClick={sunumModunuDegistir} title={sunumModu ? "Sunum modundan çık" : "Sunum moduna geç"}>
          <AdminIcon name={sunumModu ? "minimize" : "maximize"} />
        </button>
        <button type="button" className={yenileniyor ? "donuyor" : ""} onClick={() => nabziYukle({ sessiz: true })} disabled={yenileniyor} title="Operasyon verisini yenile">
          <AdminIcon name="refresh" />
        </button>
        <time>{sonCanliOlay
          ? `${CANLI_OLAY_ADLARI[sonCanliOlay.tur] || "Operasyon güncellendi"}${sonCanliOlay.masaNo ? ` · Masa ${sonCanliOlay.masaNo}` : ""}`
          : `Son güncelleme ${tarihSaat(veri.uretimZamani)}`}</time>
      </div>
    </header>

    {hata && <div className="pulse-uyari"><AdminIcon name="alert" /><span>Son yenileme tamamlanamadı: {hata}</span></div>}

    <div className="pulse-metrikler">
      {METRIKLER.map(([alan, etiket, ikon, tur]) => <article key={alan} className={[
        ((alan === "kritikStok" && Number(metrikler[alan]) > 0) || (alan === "tahsilatBekleyenTutar" && Number(metrikler[alan]) > 0)) ? "uyari" : "",
        degisenMetrikler.includes(alan) ? "degisti" : "",
      ].filter(Boolean).join(" ")}>
        <i><AdminIcon name={ikon} /></i>
        <span>{etiket}</span>
        <strong>{metrikDegeri(metrikler[alan], tur)}</strong>
      </article>)}
    </div>

    <section className={`pulse-ongoru ${ongoru.risk || "belirsiz"}`}>
      <div className="pulse-ongoru-anlatim">
        <i><AdminIcon name="bolt" /></i>
        <div>
          <span>30 DAKİKALIK OPERASYON ÖNGÖRÜSÜ</span>
          <h3>{ongoru.baslik || "Tahmin için veri birikiyor"}</h3>
          <p>{ongoru.aciklama || "Benzer gün verileri tamamlandığında öngörü burada görünecek."}</p>
        </div>
      </div>
      <dl className="pulse-ongoru-metrikler">
        <div><dt>Beklenen sipariş</dt><dd>{ongoru.hazir ? `~${Number(ongoru.beklenenSiparis || 0).toLocaleString("tr-TR")}` : "—"}</dd></div>
        <div><dt>Beklenen ciro</dt><dd>{ongoru.hazir ? para(ongoru.beklenenCiro) : "—"}</dd></div>
        <div><dt>Gün sonu tahmini</dt><dd>{ongoru.hazir ? para(ongoru.gunSonuCiroTahmini) : "—"}</dd></div>
        <div><dt>Vardiya kapasitesi</dt><dd>{ongoru.hazir ? `${ongoruPersoneli.mevcut || 0} / ${ongoruPersoneli.onerilen || 0}` : "—"}</dd></div>
      </dl>
      <div className="pulse-ongoru-guven">
        {ongoru.hazir && ongoru.tempoDegisimiYuzde != null && <b className={Number(ongoru.tempoDegisimiYuzde) >= 0 ? "pozitif" : "negatif"}>
          Tempo {Number(ongoru.tempoDegisimiYuzde) >= 0 ? "+" : ""}{Number(ongoru.tempoDegisimiYuzde).toLocaleString("tr-TR")}%
        </b>}
        <span><small>Tahmin güveni</small><i><b style={{ width: `${Math.min(100, Math.max(0, Number(ongoruGuveni.oran || 0)))}%` }} /></i><strong>%{ongoruGuveni.oran || 0}</strong></span>
        <em>{ongoruGuveni.aktifGun || 0}/{ongoruGuveni.ornekGun || 6} benzer gün</em>
      </div>
    </section>

    <div className="pulse-sunum-grid">
      <section className={`pulse-yonetici-ozeti ${yoneticiOzeti.durum || "normal"}`}>
        <i><AdminIcon name="activity" /></i>
        <div>
          <span>YÖNETİCİ ÖZETİ</span>
          <h3>{yoneticiOzeti.baslik}</h3>
          <p>{yoneticiOzeti.metin}</p>
        </div>
        <button type="button" onClick={ozetiKopyala} title="Yönetici özetini kopyala">
          <AdminIcon name={ozetKopyalandi ? "check" : "copy"} />
          <span>{ozetKopyalandi ? "Kopyalandı" : "Kopyala"}</span>
        </button>
      </section>

      <section className="pulse-canli-akis" aria-live="polite">
        <header><div><span>CANLI OLAY AKIŞI</span><h3>Operasyon hareketleri</h3></div><small>{canliOlaylar.length || "—"}</small></header>
        {canliOlaylar.length ? <div>
          {canliOlaylar.map((olay) => <article key={olay.sira}>
            <i><AdminIcon name={CANLI_OLAY_IKONLARI[olay.tur] || "activity"} /></i>
            <span><b>{CANLI_OLAY_ADLARI[olay.tur] || "Operasyon güncellendi"}</b><small>{olay.masaNo ? (String(olay.masaNo) === "algotur" ? "Gel Al" : `Masa ${olay.masaNo}`) : "İşletme geneli"}</small></span>
            <time>{tarihSaat(olay.zaman || olay.alindi)}</time>
          </article>)}
        </div> : <div className="pulse-akis-bos"><i /><span>Canlı bağlantı hazır</span></div>}
      </section>
    </div>

    <div className="pulse-ana-grid">
      <section className="pulse-panel pulse-masa-paneli">
        <header className="pulse-panel-baslik">
          <div><span>SALON DURUMU</span><h3>Canlı masa haritası</h3></div>
          <small>{masalar.length} açık nokta</small>
        </header>
        {masalar.length ? <div className="pulse-masalar">
          {masalar.map((masa) => <article className={`pulse-masa ${masa.durum}${sonCanliOlay?.masaNo && String(sonCanliOlay.masaNo) === String(masa.masaNo) ? " canli-degisti" : ""}`} key={`${masa.tip}-${masa.masaNo}`}>
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
      <section className={`pulse-panel pulse-mutfak-paneli${["siparis", "mutfak"].includes(sonCanliOlay?.tur) ? " canli-degisti" : ""}`}>
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

      <section className={`pulse-panel pulse-nakit-paneli${sonCanliOlay?.tur === "nakit" ? " canli-degisti" : ""}`}>
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

      <section className={`pulse-panel pulse-stok-paneli${["stok", "urun"].includes(sonCanliOlay?.tur) ? " canli-degisti" : ""}`}>
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
