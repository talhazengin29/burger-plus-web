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

  useEffect(() => {
    const acildi = () => setBagli(true);
    const kapandi = () => setBagli(false);
    const guncelle = (yeniMasalar) => setMasalar(yeniMasalar);

    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("mutfak-guncellendi", guncelle);

    // Mutfak odasına katıl (backend mevcut masaları gönderir)
    socket.emit("mutfaga-katil");

    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("mutfak-guncellendi", guncelle);
    };
  }, []);

  // Bir masanin tum kalemlerinin durumunu degistir
  const durumDegistir = (masaNo, durum) => {
    socket.emit("masa-durum-degistir", { masaNo, durum });
  };

  // Masaları öncelik sırasına diz: yeni siparişler önce, sonra hazırlanıyor, sonra hazır
  const siraliMasalar = useMemo(() => {
    const sira = { yeni: 0, hazirlaniyor: 1, hazir: 2 };
    return [...masalar].sort((a, b) => {
      const durumA = a.kalemler[0]?.durum || "yeni";
      const durumB = b.kalemler[0]?.durum || "yeni";
      return (sira[durumA] ?? 3) - (sira[durumB] ?? 3);
    });
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
            {masalar.length} aktif masa
          </span>
        </div>
      </header>

      {siraliMasalar.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-emoji">🍽️</div>
          <h2>Aktif sipariş yok</h2>
          <p>Yeni siparişler geldiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="masa-liste">
          {siraliMasalar.map((masa) => {
            // Masanin durumu = ilk kaleminin durumu (topluca degisir)
            const durum = masa.kalemler[0]?.durum || "yeni";
            const dbilgi = DURUM_BILGI[durum];
            return (
              <article key={masa.masaNo} className={`masa-kart durum-${dbilgi.renk}`}>
                <div className="masa-kart-ust">
                  <div className="masa-baslik">
                    <span className="masa-no">Masa {masa.masaNo}</span>
                    <span className="masa-sure">
                      {gecenSure(masa.kalemler[0]?.olusturma)}
                    </span>
                  </div>
                  <span className={`durum-rozet durum-${dbilgi.renk}`}>
                    {dbilgi.etiket}
                  </span>
                </div>

                <ul className="kalem-liste">
                  {masa.kalemler.map((k) => (
                    <li key={k.id} className="kalem">
                      <span className="kalem-adet">{k.adet}×</span>
                      <span className="kalem-ad">{k.urun_ad}</span>
                      {k.kisi_adi && <span className="kalem-kisi">{k.kisi_adi}</span>}
                    </li>
                  ))}
                </ul>

                <div className="masa-alt">
                  <span className="masa-toplam">Toplam: ₺{Number(masa.toplam).toFixed(2)}</span>
                  <div className="masa-butonlar">
                    {durum === "yeni" && (
                      <button
                        className="btn btn-uyari"
                        onClick={() => durumDegistir(masa.masaNo, "hazirlaniyor")}
                      >
                        Hazırlamaya Başla
                      </button>
                    )}
                    {durum === "hazirlaniyor" && (
                      <button
                        className="btn btn-basari"
                        onClick={() => durumDegistir(masa.masaNo, "hazir")}
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
