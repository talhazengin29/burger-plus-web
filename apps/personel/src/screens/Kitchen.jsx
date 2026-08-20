import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsletme } from "../context/IsletmeContext";
import { socket } from "../lib/socket";
import "./Kitchen.css";

const DURUM_BILGI = {
  yeni: { etiket: "kitchen.statusNew", renk: "info" },
  hazirlaniyor: { etiket: "kitchen.statusPreparing", renk: "uyari" },
  hazir: { etiket: "kitchen.statusReady", renk: "basari" },
};

const FILTRELER = [["tumu", "kitchen.allOrders"], ["yeni", "kitchen.new"], ["hazirlaniyor", "kitchen.preparing"], ["hazir", "kitchen.ready"]];
const gelAlSiparisiMi = (masaNo) => String(masaNo || "").trim().toLocaleLowerCase("tr-TR").replace(/[\s_-]+/g, "") === "algotur";

function boyutMetinleri(secimler) {
  return [
    secimler.boyutEtiketi && `${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`,
    secimler.yanBoyutEtiketi && `${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi} (${secimler.yanBoyutMiktar} ${secimler.yanBoyutBirim})`,
    secimler.icecekBoyutEtiketi && `${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi} (${secimler.icecekBoyutMiktar} ${secimler.icecekBoyutBirim})`,
  ].filter(Boolean);
}

function gecenSure(tarih, simdi, t) {
  if (!tarih) return t("kitchen.timeUnavailable");
  const fark = Math.max(0, Math.floor((simdi - new Date(tarih).getTime()) / 60000));
  if (fark < 1) return t("kitchen.justNow");
  if (fark < 60) return t("kitchen.minutesAgo", { count: fark });
  return t("kitchen.hoursMinutesAgo", { hours: Math.floor(fark / 60), minutes: fark % 60 });
}

function siparisYasi(tarih, simdi) {
  if (!tarih) return 0;
  return Math.max(0, Math.floor((simdi - new Date(tarih).getTime()) / 60000));
}

function saatMetni(tarih, dil) {
  return new Intl.DateTimeFormat(dil, { hour: "2-digit", minute: "2-digit" }).format(tarih);
}

export default function Kitchen() {
  const { t, i18n } = useTranslation();
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
          <span className="mutfak-ust-etiket">{t("kitchen.liveOperation")}</span>
          <h1>{t("kitchen.title")}</h1>
          <p>{t("kitchen.subtitle", { business: isletme?.ad || t("common.business") })}</p>
        </div>
        <div className="mutfak-canli-bilgi">
          <div className="mutfak-saat"><small>{t("kitchen.now")}</small><strong>{saatMetni(new Date(simdi), i18n.resolvedLanguage)}</strong></div>
          <span className={`baglanti ${bagli ? "baglanti--acik" : "baglanti--kapali"}`}><i />{t(bagli ? "kitchen.connected" : "kitchen.disconnected")}</span>
        </div>
      </header>

      <section className="mutfak-ozet" aria-label={t("kitchen.summaryLabel")}>
        <button type="button" className={`ozet-kart ozet-kart--toplam ${aktifFiltre === "tumu" ? "aktif" : ""}`} onClick={() => setAktifFiltre("tumu")}><span>{t("kitchen.activeOrders")}</span><strong>{sayilar.tumu}</strong><small>{t("kitchen.allFlow")}</small></button>
        <button type="button" className={`ozet-kart ozet-kart--yeni ${aktifFiltre === "yeni" ? "aktif" : ""}`} onClick={() => setAktifFiltre("yeni")}><span>{t("kitchen.new")}</span><strong>{sayilar.yeni}</strong><small>{t("kitchen.waitingAction")}</small></button>
        <button type="button" className={`ozet-kart ozet-kart--hazirlaniyor ${aktifFiltre === "hazirlaniyor" ? "aktif" : ""}`} onClick={() => setAktifFiltre("hazirlaniyor")}><span>{t("kitchen.preparing")}</span><strong>{sayilar.hazirlaniyor}</strong><small>{t("kitchen.inKitchen")}</small></button>
        <button type="button" className={`ozet-kart ozet-kart--hazir ${aktifFiltre === "hazir" ? "aktif" : ""}`} onClick={() => setAktifFiltre("hazir")}><span>{t("kitchen.ready")}</span><strong>{sayilar.hazir}</strong><small>{t("kitchen.waitingService")}</small></button>
      </section>

      <section className="mutfak-araclar">
        <div className="mutfak-filtreler" role="group" aria-label={t("kitchen.filtersLabel")}>
          {FILTRELER.map(([kod, etiket]) => <button type="button" key={kod} className={aktifFiltre === kod ? "aktif" : ""} aria-pressed={aktifFiltre === kod} onClick={() => setAktifFiltre(kod)}>{t(etiket)}<span>{sayilar[kod]}</span></button>)}
        </div>
        <p><i /> {t("kitchen.oldestFirst")}</p>
      </section>

      {gorunenSiparisler.length === 0 ? (
        <section className="bos-durum">
          <div className="bos-ikon" aria-hidden="true"><span /><span /><span /></div>
          <h2>{t(siraliSiparisler.length ? "kitchen.noOrderInStatus" : "kitchen.quiet")}</h2>
          <p>{t(siraliSiparisler.length ? "kitchen.chooseOtherFilter" : "kitchen.newOrderHint")}</p>
          {!bagli && <strong>{t("kitchen.checkConnection")}</strong>}
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
                  <div className="masa-kimlik"><span className="masa-ikon" aria-hidden="true">{gelAl ? "GA" : siparis.masaNo}</span><div><small>{t(gelAl ? "kitchen.orderType" : "kitchen.table")}</small><h2>{gelAl ? t("kitchen.pickup") : siparis.masaNo}</h2></div></div>
                  <span className={`durum-rozet durum-${dbilgi.renk}`}><i />{t(dbilgi.etiket)}</span>
                </header>
                <div className="siparis-meta">
                  <span><small>{t("kitchen.order")}</small><b>{gonderilenSiparisNo ? `#${gonderilenSiparisNo}` : t("kitchen.legacy")}</b></span>
                  <span className={gecikiyor ? "gecikiyor" : ""}><small>{t("kitchen.wait")}</small><b>{gecenSure(siparis.olusturma, simdi, t)}</b></span>
                  <span><small>{t("kitchen.product")}</small><b>{t("kitchen.quantity", { count: siparis.urunAdedi })}</b></span>
                </div>
                {gecikiyor && <div className="gecikme-uyarisi"><i>!</i> {t("kitchen.delayed", { count: yas })}</div>}
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
                          {ekstralar.length > 0 && <span className="kalem-not kalem-ekstra"><b>{t("kitchen.extra")}</b>{ekstralar.map((ekstra) => ekstra.ad).join(", ")}</span>}
                          {dahil.length > 0 && <span className="kalem-not"><b>{t("kitchen.included")}</b>{dahil.join(", ")}</span>}
                          {haric?.length > 0 && <span className="kalem-not kalem-haric"><b>{t("kitchen.remove")}</b>{haric.join(", ")}</span>}
                          {k.kisi_adi && <span className="kalem-kisi">{t("kitchen.person", { name: k.kisi_adi })}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="masa-alt">
                  <div className="masa-toplam"><small>{t("kitchen.orderTotal")}</small><strong>{new Intl.NumberFormat(i18n.resolvedLanguage, { style: "currency", currency: "TRY" }).format(Number(siparis.toplam))}</strong></div>
                  {durum === "yeni" && <button className="siparis-aksiyon siparis-aksiyon--baslat" disabled={islemde} onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazirlaniyor")}>{t(islemde ? "kitchen.updating" : "kitchen.startPreparing")}<span>→</span></button>}
                  {durum === "hazirlaniyor" && <button className="siparis-aksiyon siparis-aksiyon--hazir" disabled={islemde} onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazir")}>{t(islemde ? "kitchen.updating" : "kitchen.markReady")}<span>✓</span></button>}
                  {durum === "hazir" && <div className="hazir-not"><span>✓</span><div><strong>{t("kitchen.statusReady")}</strong><small>{t("kitchen.sentToFloor")}</small></div></div>}
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
