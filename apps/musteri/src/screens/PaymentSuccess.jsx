import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useApp } from "../context/AppContext";
import { IconCheck } from "../components/Icons";
import { iyzicoOdemesiniDogrula, odemeSonucunuGetir } from "../lib/authApi";
import { usePerde } from "../hooks/usePerde";
import "./PaymentSuccess.css";

const SONUC_DENEME_ADEDI = 8;
const SONUC_BEKLEME_MS = 1250;

const bekle = (sure) => new Promise((resolve) => setTimeout(resolve, sure));

export default function PaymentSuccess() {
  const git = useIsletmeNavigate();
  const [params] = useSearchParams();
  const odemeId = params.get("odeme");
  const { sonOdeme, puan, odemeyiTamamla } = useApp();
  const { perdeIleGit } = usePerde();
  const [yukleniyor, setYukleniyor] = useState(!!odemeId);
  const [hata, setHata] = useState(params.get("odemeHatasi") || "");

  useEffect(() => {
    if (!odemeId) return;
    let iptal = false;
    const sonucuDogrula = async () => {
      let sonHata = null;
      let saglayiciDogrulamasiDenendi = false;
      for (let deneme = 0; deneme < SONUC_DENEME_ADEDI; deneme += 1) {
        if (iptal) return null;
        try {
          const odeme = await odemeSonucunuGetir(odemeId);
          if (odeme.durum === "basarili") return odeme;
          if (!saglayiciDogrulamasiDenendi) {
            saglayiciDogrulamasiDenendi = true;
            try {
              return await iyzicoOdemesiniDogrula(odemeId);
            } catch (e) {
              sonHata = e;
            }
          } else if (!sonHata) {
            sonHata = new Error("Ödeme henüz onaylanmadı.");
          }
        } catch (e) {
          sonHata = e;
        }
        if (deneme < SONUC_DENEME_ADEDI - 1) await bekle(SONUC_BEKLEME_MS);
      }
      throw sonHata || new Error("Ödeme sonucu alınamadı.");
    };

    sonucuDogrula()
      .then((odeme) => {
        if (iptal || !odeme) return;
        setHata("");
        odemeyiTamamla(odeme);
        perdeIleGit(() => {}, "kutlama", "Siparişin Alındı 🎉");
      })
      .catch((e) => {
        if (!iptal) setHata(e.message || "Ödeme sonucu alınamadı. Birkaç saniye sonra tekrar deneyin.");
      })
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
