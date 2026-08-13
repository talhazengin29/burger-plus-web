import { useState, useEffect, useMemo } from "react";
import { socket } from "../lib/socket";
import "./Kitchen.css";

/*
  Mutfak ekrani. Backend'e mutfaga-katil ile baglanir, tum acik masalari
  canli gosterir. Her masa karti icin "Hazirlaniyor" ve "Hazir" butonlari,
  o masanin tum kalemlerini o duruma gecirir ve musteri telefonlarina
  aninda haber gider.
*/

// Durum etiketleri ve renkleri
const DURUM_BILGI = {
  yeni: { etiket: "Yeni", renk: "info" },
  hazirlaniyor: { etiket: "Hazirlaniyor", renk: "uyari" },
  hazir: { etiket: "Hazir", renk: "basari" },
};

function boyutMetinleri(secimler) {
  return [
    secimler.boyutEtiketi && `${secimler.boyutEtiketi}: ${secimler.boyutMiktar} ${secimler.boyutBirim}`,
    secimler.yanBoyutEtiketi && `${secimler.yanLezzetAd}: ${secimler.yanBoyutEtiketi} (${secimler.yanBoyutMiktar} ${secimler.yanBoyutBirim})`,
    secimler.icecekBoyutEtiketi && `${secimler.icecekAd}: ${secimler.icecekBoyutEtiketi} (${secimler.icecekBoyutMiktar} ${secimler.icecekBoyutBirim})`,
  ].filter(Boolean);
}

// Zamanı okunaklı göster (10 dakika önce vb.)
function gecenSure(tarih) {
  if (!tarih) return "";
  const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 60000);
  if (fark < 0) return "Az önce";       // saat farkı/senkron sorunlarına karşı
  if (fark < 1) return "Az önce";
  if (fark < 60) return `${fark} dk önce`;
  const saat = Math.floor(fark / 60);
  return `${saat} saat ${fark % 60} dk önce`;
}

export default function Kitchen() {
  const [masalar, setMasalar] = useState([]);
  const [bagli, setBagli] = useState(socket.connected);
  const [islemdeSiparisler, setIslemdeSiparisler] = useState(new Set());

  useEffect(() => {
    const acildi = () => {
      setBagli(true);
      socket.emit("mutfaga-katil");
    };
    const kapandi = () => setBagli(false);
    const guncelle = (yeniMasalar) => setMasalar(yeniMasalar);

    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("mutfak-guncellendi", guncelle);

    // Her yeniden bağlantıda odaya tekrar katıl.
    if (socket.connected) acildi();

    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("mutfak-guncellendi", guncelle);
    };
  }, []);

  // Bir masanin tum kalemlerinin durumunu degistir
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

  // Masaları öncelik sırasına diz: yeni siparişler önce, sonra hazırlanıyor, sonra hazır
  const siraliSiparisler = useMemo(() => {
    const sira = { yeni: 0, hazirlaniyor: 1, hazir: 2 };
    const siparisler = masalar.flatMap((masa) => {
      const gruplar = new Map();
      masa.kalemler.forEach((kalem) => {
        const siparisNo = kalem.siparis_no || `LEGACY-${masa.masaNo}`;
        if (!gruplar.has(siparisNo)) gruplar.set(siparisNo, []);
        gruplar.get(siparisNo).push(kalem);
      });
      return [...gruplar.entries()].map(([siparisNo, kalemler]) => {
        const durum = kalemler.every((kalem) => kalem.durum === "hazir")
          ? "hazir"
          : kalemler.some((kalem) => kalem.durum === "hazirlaniyor") ? "hazirlaniyor" : "yeni";
        return {
          masaNo: masa.masaNo,
          siparisNo,
          kalemler,
          durum,
          toplam: kalemler.reduce((toplam, kalem) => toplam + Number(kalem.fiyat || 0) * Number(kalem.adet || 1), 0),
          olusturma: kalemler.reduce((ilk, kalem) => !ilk || new Date(kalem.olusturma) < new Date(ilk) ? kalem.olusturma : ilk, null),
        };
      });
    });
    return siparisler.sort((a, b) => (sira[a.durum] ?? 3) - (sira[b.durum] ?? 3) || new Date(a.olusturma) - new Date(b.olusturma));
  }, [masalar]);

  return (
    <div className="mutfak">
      <header className="mutfak-header">
        <div className="mutfak-header-sol">
          <span className="mutfak-etiket">🍳 MUTFAK</span>
        </div>
        <div className="mutfak-header-sag">
          <span className={"baglanti " + (bagli ? "baglanti--acik" : "baglanti--kapali")}>
            {bagli ? "● Bağlı" : "● Bağlantı yok"}
          </span>
          <span className="mutfak-sayi">
            {siraliSiparisler.length} aktif sipariş
          </span>
        </div>
      </header>

      {siraliSiparisler.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-emoji">🍽️</div>
          <h2>Aktif sipariş yok</h2>
          <p>Yeni siparişler geldiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="masa-liste">
          {siraliSiparisler.map((siparis) => {
            const durum = siparis.durum;
            const dbilgi = DURUM_BILGI[durum];
            const islemAnahtari = `${siparis.masaNo}-${siparis.siparisNo || "legacy"}`;
            const gonderilenSiparisNo = siparis.siparisNo.startsWith("LEGACY-") ? null : siparis.siparisNo;
            return (
              <article key={islemAnahtari} className={`masa-kart durum-${dbilgi.renk}`}>
                <div className="masa-kart-ust">
                  <div className="masa-baslik">
                    <span className="masa-no">Masa {siparis.masaNo}</span>
                    <span className="masa-sure">
                      {gonderilenSiparisNo || "Eski sipariş"} · {gecenSure(siparis.olusturma)}
                    </span>
                  </div>
                  <span className={`durum-rozet durum-${dbilgi.renk}`}>
                    {dbilgi.etiket}
                  </span>
                </div>

                <ul className="kalem-liste">
                  {siparis.kalemler.map((k) => {
                    // Backend alanı henüz snake_case'e taşımamış olabilir — ikisini de destekle.
                    const secimler = k.secimler || {};
                    const haric = k.haricMalzemeler || k.haric_malzemeler || secimler.haricMalzemeler;
                    const dahil = secimler.dahilMalzemeler || [];
                    const gramaj = Number(secimler.toplamGramaj) > 0
                      ? `${secimler.toplamGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Gramaj"}${Number(secimler.ekstraGramaj) > 0 ? ` (+${secimler.ekstraGramaj})` : " (Standart)"}`
                      : Number(secimler.ekstraGramaj) > 0
                        ? `+${secimler.ekstraGramaj} ${secimler.gramajBirim || "gr"} ${secimler.gramajEtiketi || "Ekstra gramaj"}`
                        : null;
                    const boyutlar = boyutMetinleri(secimler);
                    const ekstralar = Array.isArray(secimler.ekstraMalzemeler) ? secimler.ekstraMalzemeler : [];
                    return (
                      <li key={k.id} className="kalem">
                        <span className="kalem-adet">{k.adet}×</span>
                        <div className="kalem-bilgi">
                          <span className="kalem-ad">{k.urun_ad}</span>
                          {gramaj && <span className="kalem-gramaj">{gramaj}</span>}
                          {boyutlar.map((boyut) => <span className="kalem-gramaj" key={boyut}>{boyut}</span>)}
                          {ekstralar.length > 0 && <span className="kalem-dahil">Ekstra: {ekstralar.map((ekstra) => ekstra.ad).join(", ")}</span>}
                          {dahil.length > 0 && (
                            <span className="kalem-dahil">Dahil: {dahil.join(", ")}</span>
                          )}
                          {haric?.length > 0 && (
                            <span className="kalem-haric">Haric: {haric.join(", ")}</span>
                          )}
                          {k.kisi_adi && <span className="kalem-kisi">Kişi: {k.kisi_adi}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="masa-alt">
                  <span className="masa-toplam">Toplam: ₺{Number(siparis.toplam).toFixed(2)}</span>
                  <div className="masa-butonlar">
                    {durum === "yeni" && (
                      <button
                        className="btn btn-uyari"
                        disabled={islemdeSiparisler.has(islemAnahtari)}
                        onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazirlaniyor")}
                      >
                        Hazırlamaya Başla
                      </button>
                    )}
                    {durum === "hazirlaniyor" && (
                      <button
                        className="btn btn-basari"
                        disabled={islemdeSiparisler.has(islemAnahtari)}
                        onClick={() => durumDegistir(siparis.masaNo, gonderilenSiparisNo, "hazir")}
                      >
                        Hazır ✓
                      </button>
                    )}
                    {durum === "hazir" && (
                      <span className="hazir-not">Servise gönderildi</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
