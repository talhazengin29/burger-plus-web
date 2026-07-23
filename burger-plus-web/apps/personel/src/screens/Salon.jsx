import { useState, useEffect } from "react";
import { socket } from "../lib/socket";
import "./Salon.css";

/*
  Salon ekrani (garson/kasiyer). Tum acik masalari, hesaplarini ve kimin ne
  aldigini gosterir. "Masayi Kapat" ile oturumu kapatir → masa temizlenir,
  yeni gelen musteriler temiz masa gorur.
*/

function gecenSure(tarih) {
  if (!tarih) return "";
  const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 60000);
  if (fark < 1) return "Az önce";
  if (fark < 60) return `${fark} dk`;
  const saat = Math.floor(fark / 60);
  return `${saat}s ${fark % 60}dk`;
}

// Kaleme göre durum etiketi
const DURUM_ETIKET = {
  yeni: "Yeni",
  hazirlaniyor: "Hazırlanıyor",
  hazir: "Hazır",
};

export default function Salon() {
  const [masalar, setMasalar] = useState([]);
  const [bagli, setBagli] = useState(socket.connected);
  const [onayMasa, setOnayMasa] = useState(null); // kapatma onayı beklenen masa

  useEffect(() => {
    const acildi = () => setBagli(true);
    const kapandi = () => setBagli(false);
    const guncelle = (yeniMasalar) => setMasalar(yeniMasalar);

    socket.on("connect", acildi);
    socket.on("disconnect", kapandi);
    socket.on("salon-guncellendi", guncelle);

    socket.emit("salona-katil");

    return () => {
      socket.off("connect", acildi);
      socket.off("disconnect", kapandi);
      socket.off("salon-guncellendi", guncelle);
    };
  }, []);

  const masayiKapat = (masaNo) => {
    socket.emit("masa-kapat", masaNo);
    setOnayMasa(null);
  };

  return (
    <div className="salon">
      <header className="salon-header">
        <span className="salon-etiket">🍽️ SALON</span>
        <div className="salon-header-sag">
          <span className={"baglanti " + (bagli ? "baglanti--acik" : "baglanti--kapali")}>
            {bagli ? "● Bağlı" : "● Bağlantı yok"}
          </span>
          <span className="salon-sayi">{masalar.length} dolu masa</span>
        </div>
      </header>

      {masalar.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-emoji">🪑</div>
          <h2>Dolu masa yok</h2>
          <p>Müşteriler sipariş verdiğinde masalar burada görünecek.</p>
        </div>
      ) : (
        <div className="salon-liste">
          {masalar.map((masa) => (
            <article key={masa.masaNo} className="salon-kart">
              <div className="salon-kart-ust">
                <div className="salon-masa-baslik">
                  <span className="salon-masa-no">Masa {masa.masaNo}</span>
                  <span className="salon-masa-sure">
                    {masa.kalemler.length} ürün · {gecenSure(masa.kalemler[0]?.olusturma)} önce açıldı
                  </span>
                </div>
                <span className="salon-hesap">₺{Number(masa.toplam).toFixed(2)}</span>
              </div>

              {/* Kim ne aldı */}
              <div className="salon-kalemler">
                {masa.kalemler.map((k) => (
                  <div key={k.id} className="salon-kalem">
                    <span className="salon-kalem-adet">{k.adet}×</span>
                    <span className="salon-kalem-ad">{k.urun_ad}</span>
                    <span className={"salon-kalem-durum durum-" + k.durum}>
                      {DURUM_ETIKET[k.durum] || k.durum}
                    </span>
                    <span className="salon-kalem-kisi">{k.kisi_adi}</span>
                  </div>
                ))}
              </div>

              {/* Kapat butonu / onay */}
              <div className="salon-kart-alt">
                {onayMasa === masa.masaNo ? (
                  <div className="salon-onay">
                    <span className="salon-onay-yazi">Masa {masa.masaNo} kapatılsın mı?</span>
                    <div className="salon-onay-butonlar">
                      <button className="salon-btn-iptal" onClick={() => setOnayMasa(null)}>
                        Vazgeç
                      </button>
                      <button className="salon-btn-kapat" onClick={() => masayiKapat(masa.masaNo)}>
                        Evet, Kapat
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="salon-btn-ana" onClick={() => setOnayMasa(masa.masaNo)}>
                    Masayı Kapat
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
