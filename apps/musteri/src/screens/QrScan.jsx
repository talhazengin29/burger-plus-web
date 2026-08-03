import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import QrScanner from "qr-scanner";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { IconBack } from "../components/Icons";
import "./QrScan.css";

/*
  QR okutma ekranı — gerçek kamera + QR çözümleme (qr-scanner).
  Masa QR'ları "{origin}/{slug}/masa?no=N" biçiminde bir URL taşır (bkz.
  QrGenerator.jsx, superadmin/lib/qrPdf.js); burada sadece "no" parametresi
  ayıklanıyor. Düz bir sayı okutulursa (ör. test amaçlı) da kabul edilir.

  ?mod=algotur  → okutunca ödeme ekranına git
  ?mod=masa     → okutunca masa siparişi ekranına git (QR'dan gelen masa no ile)
*/
export default function QrScan() {
  const git = useIsletmeNavigate();
  const [params] = useSearchParams();
  const mod = params.get("mod") || "algotur";
  const masaModu = mod === "masa";

  const videoRef = useRef(null);
  const tarayiciRef = useRef(null);
  const [durum, setDurum] = useState("baslatiliyor"); // baslatiliyor | tariyor | izin-yok | kamera-yok
  const [manuelNo, setManuelNo] = useState("");

  useEffect(() => {
    let iptalEdildi = false;
    const videoOgesi = videoRef.current;
    if (!videoOgesi) return undefined;

    const masaNosuGetir = (metin) => {
      try {
        return new URL(metin).searchParams.get("no");
      } catch {
        const eslesme = String(metin || "").match(/\d+/);
        return eslesme ? eslesme[0] : null;
      }
    };

    const tarayici = new QrScanner(
      videoOgesi,
      (sonuc) => {
        if (iptalEdildi) return;
        iptalEdildi = true;
        tarayici.stop();
        if (masaModu) {
          const masaNo = masaNosuGetir(sonuc.data);
          git(masaNo ? `/odeme?masa=${masaNo}` : "/odeme");
        } else {
          git("/odeme");
        }
      },
      { preferredCamera: "environment", highlightScanRegion: false, highlightCodeOutline: false, maxScansPerSecond: 5 },
    );
    tarayiciRef.current = tarayici;

    tarayici.start()
      .then(() => { if (!iptalEdildi) setDurum("tariyor"); })
      .catch((err) => {
        if (iptalEdildi) return;
        setDurum(err?.name === "NotAllowedError" ? "izin-yok" : "kamera-yok");
      });

    return () => {
      iptalEdildi = true;
      tarayici.stop();
      tarayici.destroy();
    };
  }, [git, masaModu]);

  const manuelGonder = (e) => {
    e.preventDefault();
    const no = manuelNo.trim();
    if (masaModu) {
      git(no ? `/odeme?masa=${no}` : "/odeme");
    } else {
      git("/odeme");
    }
  };

  const kameraSorunuVar = durum === "izin-yok" || durum === "kamera-yok";

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
            ? "Masandaki QR kodu çerçeveye getir, siparişini o masaya iletelim."
            : "Kasadaki QR kodu çerçeveye getirerek siparişini başlat."}
        </p>

        <div className="qr-cerceve">
          <video ref={videoRef} className="qr-video" muted playsInline />
          {!kameraSorunuVar && (
            <>
              <span className="qr-kose qr-kose--sol-ust" />
              <span className="qr-kose qr-kose--sag-ust" />
              <span className="qr-kose qr-kose--sol-alt" />
              <span className="qr-kose qr-kose--sag-alt" />
              {durum === "tariyor" && <div className="qr-tarama-cizgi" />}
            </>
          )}
        </div>

        {durum === "baslatiliyor" && <p className="qrscan-not">Kamera açılıyor…</p>}
        {durum === "tariyor" && <p className="qrscan-not">QR kodu çerçeve içine hizala</p>}
        {durum === "izin-yok" && (
          <p className="qrscan-not qrscan-not--hata">Kamera izni verilmedi. Tarayıcı ayarlarından bu sayfa için kameraya izin verip yeniden dene.</p>
        )}
        {durum === "kamera-yok" && (
          <p className="qrscan-not qrscan-not--hata">Kameraya erişilemedi. Aşağıdan masa numarasını elle girebilirsin.</p>
        )}

        {kameraSorunuVar && (
          <form className="qrscan-manuel" onSubmit={manuelGonder}>
            {masaModu && (
              <input
                type="number"
                inputMode="numeric"
                min="1"
                className="qrscan-manuel-input"
                placeholder="Masa numarası"
                value={manuelNo}
                onChange={(e) => setManuelNo(e.target.value)}
              />
            )}
            <button type="submit" className="qr-okut-btn">Devam Et</button>
          </form>
        )}
      </div>
    </div>
  );
}
