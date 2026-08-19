import { useEffect, useMemo, useState } from "react";
import { useIsletme } from "../context/IsletmeContext";
import { socket } from "../lib/socket";
import "./Kitchen.css";

const DURUM_BILGI = {
  yeni: { etiket: "Yeni sipariş", renk: "info" },
  hazirlaniyor: { etiket: "Hazırlanıyor", renk: "uyari" },
  hazir: { etiket: "Servise hazır", renk: "basari" },
};

const FILTRELER = [["tumu", "Tüm siparişler"], ["yeni", "Yeni"], ["hazirlaniyor", "Hazırlanıyor"], ["hazir", "Hazır"]];
const gelAlSiparisiMi = (masaNo) => String(masaNo || "").trim().toLocaleLowerCase("tr-TR").replace(/[\s_-]+/g, "") === "algotur";

function boyutMetinleri(secimler) {
  return [
    secimler.boyutEtiketi && `${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`,
    secimler.yanBoyutEtiketi && `${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi} (${secimler.yanBoyutMiktar} ${secimler.yanBoyutBirim})`,
    secimler.icecekBoyutEtiketi && `${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi} (${secimler.icecekBoyutMiktar} ${secimler.icecekBoyutBirim})`,
  ].filter(Boolean);
}

function gecenSure(tarih, simdi) {
  if (!tarih) return "Zaman bilgisi yok";
  const fark = Math.max(0, Math.floor((simdi - new Date(tarih).getTime()) / 60000));
  if (fark < 1) return "Az önce";
  if (fark < 60) return `${fark} dk önce`;
  return `${Math.floor(fark / 60)} sa ${fark % 60} dk önce`;
}

function siparisYasi(tarih, simdi) {
  if (!tarih) return 0;
  return Math.max(0, Math.floor((simdi - new Date(tarih).getTime()) / 60000));
}

function saatMetni(tarih) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(tarih);
}

export default function Kitchen() {
  const { isletme } = useIsletme();
  const [masalar, setMasalar] = useState([]);
  const [bagli, setBagli] = useState(socket.connected);
  const [islemdeSiparisler, setIslemdeSiparisler] = useState(new Set());
  const [aktifFiltre, setAktifFiltre] = useState("tumu");
  const [simdi, setSimdi] = useState(Date.now());

  useEffect(() => {
    const zamanlayici = window.setInterval(() => setSimdi(Date.now()), 30000);
    return () => window.clearInterval(zamanlayici);
  }, []);

  useEffect(() => {
    const acildi = () => { setBagli(true); socket.emit("mutfaga-katil"); };
    const kapandi = () => setBagli(false);
    const guncelle = (yeniMasalar) => setMasalar(Array.isArray(yeniMasalar) ? yeniMasalar : []);
    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("mutfak-guncellendi", guncelle);
    if (socket.connected) acildi();
    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("mutfak-guncellendi", guncelle);
    };
  }, []);

  const durumDegistir = (masaNo, siparisNo, durum) => {
    const islemAnahtari = `${masaNo}-${siparisNo || "legacy"}`;
    if (islemdeSiparisler.has(islemAnahtari)) return;
    setIslemdeSiparisler((onceki) => new Set(onceki).add(islemAnahtari));
    socket.timeout(8000).emit("masa-durum-degistir", { masaNo, siparisNo, durum }, () => {
      setIslemdeSiparisler((onceki) => {
        const sonraki = new Set(onceki);
        sonraki.delete(islemAnahtari);
        return sonraki;
      });
    });
  };

  const siraliSiparisler = useMemo(() => {
    const sira = { yeni: 0, hazirlaniyor: 1, hazir: 2 };
    const siparisler = masalar.flatMap((masa) => {
      const gruplar = new Map();
      (masa.kalemler || []).forEach((kalem) => {
        const siparisNo = kalem.siparis_no || `LEGACY-${masa.masaNo}`;
        if (!gruplar.has(siparisNo)) gruplar.set(siparisNo, []);
        gruplar.get(siparisNo).push(kalem);
      });
      return [...gruplar.entries()].map(([siparisNo, kalemler]) => {
        const durum = kalemler.every((kalem) => kalem.durum === "hazir") ? "hazir" : kalemler.some((kalem) => kalem.durum === "hazirlaniyor") ? "hazirlaniyor" : "yeni";
        return {
          masaNo: masa.masaNo,
          siparisNo,
          kalemler,
          durum,
          toplam: kalemler.reduce((toplam, kalem) => toplam + Number(kalem.fiyat || 0) * Number(kalem.adet || 1), 0),
          urunAdedi: kalemler.reduce((toplam, kalem) => toplam + Number(kalem.adet || 1), 0),
          olusturma: kalemler.reduce((ilk, kalem) => !ilk || new Date(kalem.olusturma) < new Date(ilk) ? kalem.olusturma : ilk, null),
        };
      });
    });
    return siparisler.sort((a, b) => (sira[a.durum] ?? 3) - (sira[b.durum] ?? 3) || new Date(a.olusturma) - new Date(b.olusturma));
  }, [masalar]);

  const sayilar = useMemo(() => ({
    tumu: siraliSiparisler.length,
    yeni: siraliSiparisler.filter((siparis) => siparis.durum === "yeni").length,
    hazirlaniyor: siraliSiparisler.filter((siparis) => siparis.durum === "hazirlaniyor").length,
    hazir: siraliSiparisler.filter((siparis) => siparis.durum === "hazir").length,
  }), [siraliSiparisler]);
  const gorunenSiparisler = aktifFiltre === "tumu" ? siraliSiparisler : siraliSiparisler.filter((siparis) => siparis.durum === aktifFiltre);

  return (
    <main className="mutfak">
      <header className="mutfak-header">
        <div className="mutfak-baslik-alani">
          <span className="mutfak-ust-etiket">CANLI OPERASYON</span>
          <h1>Mutfak sipariş akışı</h1>
          <p>{isletme?.ad || "İşletme"} · Siparişleri geliş sırasına göre yönetin.</p>
        </div>
        <div className="mutfak-canli-bilgi">
          <div className="mutfak-saat"><small>Şu an</small><strong>{saatMetni(new Date(simdi))}</strong></div>
          <span className={`baglanti ${bagli ? "baglanti--acik" : "baglanti--kapali"}`}><i />{bagli ? "Canlı bağlantı" : "Bağlantı kesildi"}</span>
        </div>
      </header>

      <section className="mutfak-ozet" aria-label="Sipariş özeti">
        <button type="button" className={`ozet-kart ozet-kart--toplam ${aktifFiltre === "tumu" ? "aktif" : ""}`} onClick={() => setAktifFiltre("tumu")}><span>Aktif sipariş</span><strong>{sayilar.tumu}</strong><small>Tüm akış</small></button>
        <button type="button" className={`ozet-kart ozet-kart--yeni ${aktifFiltre === "yeni" ? "aktif" : ""}`} onClick={() => setAktifFiltre("yeni")}><span>Yeni</span><strong>{sayilar.yeni}</strong><small>İşlem bekliyor</small></button>
        <button type="button" className={`ozet-kart ozet-kart--hazirlaniyor ${aktifFiltre === "hazirlaniyor" ? "aktif" : ""}`} onClick={() => setAktifFiltre("hazirlaniyor")}><span>Hazırlanıyor</span><strong>{sayilar.hazirlaniyor}</strong><small>Mutfakta</small></button>
        <button type="button" className={`ozet-kart ozet-kart--hazir ${aktifFiltre === "hazir" ? "aktif" : ""}`} onClick={() => setAktifFiltre("hazir")}><span>Hazır</span><strong>{sayilar.hazir}</strong><small>Servis bekliyor</small></button>
      </section>

      <section className="mutfak-araclar">
        <div className="mutfak-filtreler" role="group" aria-label="Sipariş durumuna göre filtrele">
          {FILTRELER.map(([kod, etiket]) => <button type="button" key={kod} className={aktifFiltre === kod ? "aktif" : ""} aria-pressed={aktifFiltre === kod} onClick={() => setAktifFiltre(kod)}>{etiket}<span>{sayilar[kod]}</span></button>)}
        </div>
        <p><i /> En eski siparişler önce gösterilir</p>
      </section>

      {gorunenSiparisler.length === 0 ? (
        <section className="bos-durum">
          <div className="bos-ikon" aria-hidden="true"><span /><span /><span /></div>
          <h2>{siraliSiparisler.length ? "Bu durumda sipariş yok" : "Mutfak şu an sakin"}</h2>
          <p>{siraliSiparisler.length ? "Başka bir durum filtresi seçebilirsiniz." : "Yeni sipariş geldiğinde kartı otomatik olarak burada görünecek."}</p>
          {!bagli && <strong>Canlı bağlantıyı kontrol edin.</strong>}
        </section>
      ) : (
        <section className="masa-liste" aria-live="polite">
          {gorunenSiparisler.map((siparis) => {
            const durum = siparis.durum;
            const dbilgi = DURUM_BILGI[durum];
            const islemAnahtari = `${siparis.masaNo}-${siparis.siparisNo || "legacy"}`;
            const gonderilenSiparisNo = siparis.siparisNo.startsWith("LEGACY-") ? null : siparis.siparisNo;
            const islemde = islemdeSiparisler.has(islemAnahtari);
            const yas = siparisYasi(siparis.olusturma, simdi);
            const gecikiyor = durum !== "hazir" && yas >= 15;
            const gelAl = gelAlSiparisiMi(siparis.masaNo);
            return (
              <article key={islemAnahtari} className={`masa-kart durum-${dbilgi.renk} ${gecikiyor ? "masa-kart--geciken" : ""}`}>
                <header className="masa-kart-ust">
                  <div className="masa-kimlik"><span className="masa-ikon" aria-hidden="true">{gelAl ? "GA" : siparis.masaNo}</span><div><small>{gelAl ? "SİPARİŞ TİPİ" : "MASA"}</small><h2>{gelAl ? "Gel Al" : siparis.masaNo}</h2></div></div>
                  <span className={`durum-rozet durum-${dbilgi.renk}`}><i />{dbilgi.etiket}</span>
                </header>
                <div className="siparis-meta">
                  <span><small>Sipariş</small><b>{gonderilenSiparisNo ? `#${gonderilenSiparisNo}` : "Eski kayıt"}</b></span>
                  <span className={gecikiyor ? "gecikiyor" : ""}><small>Bekleme</small><b>{gecenSure(siparis.olusturma, simdi)}</b></span>
                  <span><small>Ürün</small><b>{siparis.urunAdedi} adet</b></span>
                </div>
                {gecikiyor && <div className="gecikme-uyarisi"><i>!</i> Sipariş {yas} dakikadır bekliyor</div>}
                <ul className="kalem-liste">
                  {siparis.kalemler.map((k) => {
                    const secimler = k.secimler || {};
                    const haric = k.haricMalzemeler || k.haric_malzemeler || secimler.haricMalzemeler;
                    const dahil = secimler.dahilMalzemeler || [];
                    const gramaj = Number(secimler.toplamGramaj) > 0
                      ? `${secimler.toplamGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Gramaj"}${Number(secimler.ekstraGramaj) > 0 ? ` (+${secimler.ekstraGramaj})` : " (Standart)"}`
                      : Number(secimler.ekstraGramaj) > 0 ? `+${secimler.ekstraGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Ekstra gramaj"}` : null;
                    const boyutlar = boyutMetinleri(secimler);
                    const ekstralar = Array.isArray(secimler.ekstraMalzemeler) ? secimler.ekstraMalzemeler : [];
                    return (
                      <li key={k.id} className="kalem">
                        <span className="kalem-adet">{k.adet}<small>×</small></span>
                        <div className="kalem-bilgi">
                          <strong className="kalem-ad">{k.urun_ad}</strong>
                          {(gramaj || boyutlar.length > 0) && <div className="kalem-ozellikler">{gramaj && <span>{gramaj}</span>}{boyutlar.map((boyut) => <span key={boyut}>{boyut}</span>)}</div>}
                          {ekstralar.length > 0 && <span className="kalem-not kalem-ekstra"><b>EKSTRA</b>{ekstralar.map((ekstra) => ekstra.ad).join(", ")}</span>}
                          {dahil.length > 0 && <span className="kalem-not"><b>DAHİL</b>{dahil.join(", ")}</span>}
                          {haric?.length > 0 && <span className="kalem-not kalem-haric"><b>ÇIKAR</b>{haric.join(", ")}</span>}
                          {k.kisi_adi && <span className="kalem-kisi">Kişi: {k.kisi_adi}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="masa-alt">
                  <div className="masa-toplam"><small>Sipariş toplamı</small><strong>₺{Number(siparis.toplam).toFixed(2)}</strong></div>
                  {durum === "yeni" && <button className="siparis-aksiyon siparis-aksiyon--baslat" disabled={islemde} onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazirlaniyor")}>{islemde ? "Güncelleniyor…" : "Hazırlamaya başla"}<span>→</span></button>}
                  {durum === "hazirlaniyor" && <button className="siparis-aksiyon siparis-aksiyon--hazir" disabled={islemde} onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazir")}>{islemde ? "Güncelleniyor…" : "Hazır olarak işaretle"}<span>✓</span></button>}
                  {durum === "hazir" && <div className="hazir-not"><span>✓</span><div><strong>Servise hazır</strong><small>Salon ekibine iletildi</small></div></div>}
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
