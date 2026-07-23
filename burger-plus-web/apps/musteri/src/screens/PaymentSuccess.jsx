import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconCheck } from "../components/Icons";
import "./PaymentSuccess.css";

export default function PaymentSuccess() {
  const git = useNavigate();
  const { sonOdeme, puan } = useApp();

  // Sipariş durumu: al götür siparişi önce hazırlanır, sonra hazır olur.
  // Şimdilik zamanlayıcı ile simüle (gerçekte mutfak onayı ile değişecek).
  const [hazir, setHazir] = useState(false);
  useEffect(() => {
    const zamanlayici = setTimeout(() => setHazir(true), 5000);
    return () => clearTimeout(zamanlayici);
  }, []);

  // Doğrudan bu adrese gelinirse (ödeme yapılmadıysa) ana sayfaya yönlendir
  if (!sonOdeme) {
    return (
      <div className="ekran success">
        <div className="success-icerik">
          <p>Görüntülenecek ödeme yok.</p>
          <button className="success-btn-ana" onClick={() => git("/anasayfa")}>Ana Sayfa</button>
        </div>
      </div>
    );
  }

  const yontemAdi =
    sonOdeme.yontem === "esit" ? "Eşit bölüşüldü" :
    sonOdeme.yontem === "urun" ? "Ürüne göre ödendi" :
    "Tamamı ödendi";

  return (
    <div className="ekran success">
      <div className="success-icerik">
        <div className="success-daire">
          <IconCheck className="success-check" />
        </div>

        <h1 className="success-baslik">Ödeme Başarılı!</h1>
        <p className="success-alt">
          {sonOdeme.masaNo ? `Masa ${sonOdeme.masaNo} • ${yontemAdi}` : yontemAdi}
        </p>

        {/* Sipariş durumu */}
        <div className={"siparis-durum-kart" + (hazir ? " siparis-durum-kart--hazir" : "")}>
          <span className="durum-ikon">{hazir ? "🎉" : "👨‍🍳"}</span>
          <div className="durum-metin">
            <span className="durum-baslik">
              {sonOdeme.masaNo
                ? (hazir ? "Siparişin Masana Getiriliyor!" : "Siparişin Hazırlanıyor")
                : (hazir ? "Siparişin Hazır!" : "Siparişin Hazırlanıyor")}
            </span>
            <span className="durum-alt">
              {sonOdeme.masaNo
                ? (hazir ? `Masa ${sonOdeme.masaNo}'ye getiriliyor, afiyet olsun!` : "Mutfağa iletildi, birazdan...")
                : (hazir ? "Alabilirsin, afiyet olsun!" : "Birazdan hazır olacak...")}
            </span>
          </div>
          {!hazir && <span className="durum-spinner" />}
        </div>

        <div className="success-tutar-kart">
          <span className="success-tutar-etiket">Ödenen Tutar</span>
          <span className="success-tutar">₺{sonOdeme.tutar.toFixed(2)}</span>
        </div>

        {/* Kazanılan puan — sadece daimi kullanıcıya */}
        {sonOdeme.misafir ? (
          <div className="success-misafir-not">
            Afiyet olsun! Üye olsaydın bu ödemeden puan kazanırdın. 🎁
          </div>
        ) : (
          <div className="success-puan-kart">
            <span className="success-puan-ust">Kazandığın Puan</span>
            <span className="success-puan-buyuk">+{sonOdeme.kazanilanPuan}</span>
            <span className="success-puan-toplam">Toplam puanın: {puan.toLocaleString("tr-TR")}</span>
          </div>
        )}

        <div className="success-butonlar">
          <button className="success-btn-ana" onClick={() => git("/anasayfa")}>
            Ana Sayfaya Dön
          </button>
          {!sonOdeme.misafir && (
            <button className="success-btn-puan" onClick={() => git("/puanlarim")}>
              Puanlarımı Gör
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
