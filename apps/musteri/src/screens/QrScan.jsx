import { useNavigate, useSearchParams } from "react-router-dom";
import { IconBack, IconQr } from "../components/Icons";
import "./QrScan.css";

/*
  QR okutma ekranı — şimdilik SİMÜLASYON.
  Gerçek kamera yok; "Okut" butonu okutmuş gibi davranır.
  Gerçek QR sonradan eklenecek (kamera + masa numarası çözümleme).

  ?mod=algotur  → okutunca ödeme ekranına git
  ?mod=masa     → okutunca masa siparişi ekranına git (masa no simüle)
*/
export default function QrScan() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const mod = params.get("mod") || "algotur";

  const masaModu = mod === "masa";

  const okut = () => {
    if (masaModu) {
      // Simülasyon: masa numarasını rastgele üret (gerçekte QR'dan gelecek)
      const masaNo = Math.floor(Math.random() * 12) + 1;
      // Masaya servis de ödemeyle devam eder; masa no'yu ödeme ekranına taşı
      git(`/odeme?masa=${masaNo}`);
    } else {
      git("/odeme");
    }
  };

  return (
    <div className="ekran qrscan">
      <header className="alt-header alt-header--seffaf">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">QR Okut</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="qrscan-govde">
        <p className="qrscan-aciklama">
          {masaModu
            ? "Masandaki QR kodu okutarak siparişini o masaya ilet."
            : "Kasadaki QR kodu okutarak siparişini başlat."}
        </p>

        {/* Kamera görüntüsü yerine çerçeve (simülasyon) */}
        <div className="qr-cerceve">
          <IconQr className="qr-cerceve-ikon" />
          <span className="qr-kose qr-kose--sol-ust" />
          <span className="qr-kose qr-kose--sag-ust" />
          <span className="qr-kose qr-kose--sol-alt" />
          <span className="qr-kose qr-kose--sag-alt" />
          <div className="qr-tarama-cizgi" />
        </div>

        <p className="qrscan-not">Kamera burada açılacak (yakında)</p>

        <button className="qr-okut-btn" onClick={okut}>
          {masaModu ? "QR'ı Okut (Masa)" : "QR'ı Okut"}
        </button>
      </div>
    </div>
  );
}
