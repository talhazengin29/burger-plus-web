import { useState } from "react";
import "./MasaSec.css";

/*
  Masa seçim modalı. Kullanıcı numara girer veya listeden seçer.
  "Masa X'e katılmak istediğinize emin misiniz?" onayı sorar.
  onSec(masaNo) callback'i ile seçilen masayı döner.
*/
const MASA_SAYISI = 20; // kafedeki toplam masa

export default function MasaSec({ onSec, onKapat, baslik = "Masa Seç" }) {
  const [secilen, setSecilen] = useState(null);
  const [onayModu, setOnayModu] = useState(false);

  const masaSec = (no) => {
    setSecilen(no);
    setOnayModu(true);
  };

  const onayla = () => {
    if (secilen) onSec(secilen);
  };

  return (
    <div className="masa-sec-overlay" onClick={onKapat}>
      <div className="masa-sec-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="masa-sec-baslik">{baslik}</h2>

        {onayModu ? (
          /* Onay ekranı */
          <div className="masa-sec-onay">
            <div className="masa-sec-onay-ikon">🍽️</div>
            <p className="masa-sec-onay-yazi">
              <strong>Masa {secilen}</strong>'e katılmak istediğine emin misin?
            </p>
            <div className="masa-sec-onay-btn-grup">
              <button className="masa-sec-btn-iptal" onClick={() => setOnayModu(false)}>
                Geri Dön
              </button>
              <button className="masa-sec-btn-onayla" onClick={onayla}>
                Evet, Katıl
              </button>
            </div>
          </div>
        ) : (
          /* Masa grid'i */
          <>
            <p className="masa-sec-aciklama">Oturduğun masanın numarasını seç</p>
            <div className="masa-sec-grid">
              {Array.from({ length: MASA_SAYISI }, (_, i) => i + 1).map((no) => (
                <button
                  key={no}
                  className={"masa-sec-hucre" + (secilen === no ? " masa-sec-hucre--aktif" : "")}
                  onClick={() => masaSec(no)}
                >
                  {no}
                </button>
              ))}
            </div>
            <button className="masa-sec-kapat" onClick={onKapat}>İptal</button>
          </>
        )}
      </div>
    </div>
  );
}
