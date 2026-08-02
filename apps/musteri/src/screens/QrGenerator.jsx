import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { IconBack } from "../components/Icons";
import { useIsletme } from "../context/IsletmeContext";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { istekAt } from "../lib/authApi";
import "./QrGenerator.css";

/*
  İşletme için QR üretme ekranı (işletme paneli başlangıcı).
  Masa sayısı girilir, her masa için /masa?no=X adresini içeren QR üretilir.
  Yazdırılıp masalara konur. Müşteri okutunca TableWelcome ekranı açılır.
*/
export default function QrGenerator() {
  const git = useIsletmeNavigate();
  const { isletme, isletmeSlug } = useIsletme();
  const [masaSayisi, setMasaSayisi] = useState(10);
  const [qrler, setQrler] = useState([]); // { no, dataUrl }

  // Uygulamanın kök adresi (gerçek sitede otomatik doğru gelir)
  const kokAdres = window.location.origin;

  const uret = async (istenenAdet = masaSayisi) => {
    const adet = Math.min(500, Math.max(1, Number(istenenAdet) || 10));
    const sonuc = [];
    for (let i = 1; i <= adet; i++) {
      const url = `${kokAdres}/${isletmeSlug}/masa?no=${i}`;
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
    let iptal = false;
    istekAt("/api/admin/kurulum-ayarlari")
      .then(async (yanit) => {
        if (!yanit.ok) throw new Error("Masa ayarı alınamadı.");
        const ayar = await yanit.json();
        const adet = Math.min(500, Math.max(1, Number(ayar.masaSayisi) || 10));
        if (iptal) return;
        setMasaSayisi(adet);
        await uret(adet);
      })
      .catch(() => { if (!iptal) uret(10); });
    return () => { iptal = true; };
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
            <button onClick={() => setMasaSayisi((s) => Math.min(500, s + 1))}>+</button>
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
              <div className="qr-kart-marka">{isletme?.ad || "Burger Plus"}</div>
              <div className="qr-kart-alt">Okut · Sipariş Ver · Öde</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
