import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { IconBack } from "../components/Icons";
import "./QrGenerator.css";

/*
  İşletme için QR üretme ekranı (işletme paneli başlangıcı).
  Masa sayısı girilir, her masa için /masa?no=X adresini içeren QR üretilir.
  Yazdırılıp masalara konur. Müşteri okutunca TableWelcome ekranı açılır.
*/
export default function QrGenerator() {
  const git = useNavigate();
  const [masaSayisi, setMasaSayisi] = useState(5);
  const [qrler, setQrler] = useState([]); // { no, dataUrl }

  // Uygulamanın kök adresi (gerçek sitede otomatik doğru gelir)
  const kokAdres = window.location.origin;

  const uret = async () => {
    const sonuc = [];
    for (let i = 1; i <= masaSayisi; i++) {
      const url = `${kokAdres}/masa?no=${i}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: "#1b1c19", light: "#ffffff" },
      });
      sonuc.push({ no: i, dataUrl, url });
    }
    setQrler(sonuc);
  };

  // İlk açılışta otomatik üret
  useEffect(() => {
    uret();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yazdir = () => window.print();

  return (
    <div className="ekran qr-gen">
      <header className="alt-header no-print">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Masa QR Kodları</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="qr-gen-govde">
        {/* Kontroller (yazdırırken gizlenir) */}
        <div className="qr-gen-kontrol no-print">
          <label className="qr-gen-label">Kaç masa için QR üretilsin?</label>
          <div className="qr-gen-secici">
            <button onClick={() => setMasaSayisi((s) => Math.max(1, s - 1))}>−</button>
            <span className="qr-gen-sayi">{masaSayisi}</span>
            <button onClick={() => setMasaSayisi((s) => Math.min(50, s + 1))}>+</button>
          </div>
          <button className="qr-gen-uret-btn" onClick={uret}>QR'ları Oluştur</button>
          {qrler.length > 0 && (
            <button className="qr-gen-yazdir-btn" onClick={yazdir}>🖨️ Yazdır</button>
          )}
          <p className="qr-gen-bilgi">
            QR'ları yazdırıp masalara yapıştır. Müşteri okutunca otomatik o masaya bağlanır.
          </p>
        </div>

        {/* QR kartları */}
        <div className="qr-gen-liste">
          {qrler.map((q) => (
            <div key={q.no} className="qr-kart">
              <div className="qr-kart-baslik">Masa {q.no}</div>
              <img className="qr-kart-img" src={q.dataUrl} alt={`Masa ${q.no} QR`} />
              <div className="qr-kart-marka">🍔 BURGER PLUS</div>
              <div className="qr-kart-alt">Okut · Sipariş Ver · Öde</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
