import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconCheck } from "../components/Icons";
import "./PaymentSuccess.css";

export default function PaymentSuccess() {
  const git = useNavigate();
  const { sonOdeme, puan } = useApp();

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
        <div className="siparis-durum-kart">
          <span className="durum-ikon">👨‍🍳</span>
          <div className="durum-metin">
            <span className="durum-baslik">Siparişin Hazırlanıyor</span>
            <span className="durum-alt">Mutfağa iletildi, hazırlanıyor.</span>
          </div>
          <span className="durum-spinner" />
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
