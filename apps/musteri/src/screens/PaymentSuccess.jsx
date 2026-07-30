import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconCheck } from "../components/Icons";
import { odemeSonucunuGetir } from "../lib/authApi";
import { usePerde } from "../hooks/usePerde";
import "./PaymentSuccess.css";

export default function PaymentSuccess() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const odemeId = params.get("odeme");
  const { sonOdeme, puan, odemeyiTamamla } = useApp();
  const { perdeIleGit } = usePerde();
  const [yukleniyor, setYukleniyor] = useState(!!odemeId);
  const [hata, setHata] = useState(params.get("odemeHatasi") || "");

  useEffect(() => {
    if (!odemeId) return;
    let iptal = false;
    odemeSonucunuGetir(odemeId)
      .then((odeme) => {
        if (iptal) return;
        if (odeme.durum !== "basarili") throw new Error("Ödeme henüz onaylanmadı.");
        odemeyiTamamla(odeme);
        perdeIleGit(() => {}, "kutlama", "Siparişin Alındı 🎉");
      })
      .catch((e) => { if (!iptal) setHata(e.message || "Ödeme sonucu alınamadı."); })
      .finally(() => { if (!iptal) setYukleniyor(false); });
    return () => { iptal = true; };
    // odemeId URL'den sabittir; callback sonrası tek defa işlenmelidir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [odemeId]);

  if (yukleniyor) {
    return <div className="ekran success"><div className="success-icerik"><span className="durum-spinner" /><p className="success-alt">Ödeme sonucun doğrulanıyor…</p></div></div>;
  }

  if (hata) {
    return <div className="ekran success"><div className="success-icerik"><p className="odeme-hata">{hata}</p><button className="success-btn-ana" onClick={() => git("/odeme")}>Ödemeye Dön</button></div></div>;
  }

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
