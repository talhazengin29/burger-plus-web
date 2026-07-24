import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconBack, IconPlus, IconMinus, IconTrash, IconBag } from "../components/Icons";
import MasaSec from "./MasaSec";
import "./Cart.css";

/*
  Sepet ekranı.
  - Sepet doluyken: ürünler + alt barda "Masa Seç" / "Al Götür" seçenekleri
    (QR ile masa seçilmişse doğrudan o masa görünür)
  - Sepet boşken: "Masaya Geç" butonu — başka bir telefondan masadaki
    siparişleri görmek için (arkadaşlarının eklediği ürünleri görürsün)
*/

export default function Cart() {
  const git = useNavigate();
  const {
    sepet, adetArtir, adetAzalt, sepettenCikar, sepetToplam,
    aktifMasa, setAktifMasa, masaOzeti, ozetMasaNo,
  } = useApp();

  const [masaSecAcik, setMasaSecAcik] = useState(false);
  const [masaGecAcik, setMasaGecAcik] = useState(false);

  // Masa seçildiğinde
  const masaSecildi = (no) => {
    setAktifMasa(String(no));
    setMasaSecAcik(false);
  };

  // "Masaya Geç" ile boş sepetten masaya katıl
  const masayaGec = (no) => {
    setAktifMasa(String(no));
    setMasaGecAcik(false);
  };

  // Masadaki başkalarının siparişleri (kendi sepetim hariç)
  const masaKalemleri = masaOzeti?.kalemler || [];
  const masadaAktifMi = !!(aktifMasa || ozetMasaNo);
  const gorunenMasaNo = aktifMasa || ozetMasaNo;

  return (
    <div className="ekran cart">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri">
          <IconBack />
        </button>
        <h1 className="alt-header-baslik">Sepetim</h1>
        <span className="alt-header-bosluk" />
      </header>

      {sepet.length === 0 ? (
        /* ====== SEPET BOŞ ====== */
        <div className="sepet-bos">
          <IconBag className="sepet-bos-ikon" />
          <p className="sepet-bos-yazi">Sepetin şu an boş</p>
          <button className="sepet-bos-btn" onClick={() => git("/anasayfa")}>
            Menüye Dön
          </button>

          {/* Masaya Geç: başka telefondan masadaki siparişleri görmek için */}
          <div className="masaya-gec-blok">
            <p className="masaya-gec-aciklama">
              Arkadaşların zaten sipariş verdi mi?
            </p>
            <button className="masaya-gec-btn" onClick={() => setMasaGecAcik(true)}>
              🍽️ Masaya Geç
            </button>
          </div>

          {/* Masaya katıldıysa, masadaki siparişleri göster */}
          {masadaAktifMi && masaKalemleri.length > 0 && (
            <div className="masa-siparisler-blok">
              <h3 className="masa-siparisler-baslik">
                Masa {gorunenMasaNo} — Masadaki Siparişler
              </h3>
              <div className="masa-kalem-liste">
                {masaKalemleri.map((k, i) => (
                  <div key={i} className="masa-kalem-satir">
                    <span className="masa-kalem-adet">{k.adet}×</span>
                    <span className="masa-kalem-ad">{k.urun_adi}</span>
                    <span className="masa-kalem-kisi">{k.kisi_adi}</span>
                    <span className="masa-kalem-fiyat">₺{(k.fiyat * k.adet).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="masa-toplam-satir">
                <span>Masa Toplamı</span>
                <span className="masa-toplam-tutar">₺{masaOzeti.toplam?.toFixed(2)}</span>
              </div>
              <button className="sepet-bos-btn" onClick={() => git("/anasayfa")}>
                Ben de Sipariş Ekle
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ====== SEPET DOLU ====== */
        <>
          <div className="cart-govde">
            <div className="cart-liste">
              {sepet.map((u) => (
                <article key={u.id} className="cart-satir">
                  <img className="cart-gorsel" src={u.gorsel} alt={u.ad} />
                  <div className="cart-orta">
                    <h3 className="cart-ad">{u.ad}</h3>
                    <span className="cart-birim">₺{u.fiyat.toFixed(2)}</span>
                  </div>
                  <div className="cart-sag">
                    <button className="cart-sil" onClick={() => sepettenCikar(u.id)} aria-label="Kaldır">
                      <IconTrash />
                    </button>
                    <div className="adet-kontrol">
                      <button onClick={() => adetAzalt(u.id)} aria-label="Azalt"><IconMinus /></button>
                      <span className="adet-sayi">{u.adet}</span>
                      <button onClick={() => adetArtir(u.id)} aria-label="Artır"><IconPlus /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Masadaki diğer siparişler (varsa) */}
            {masadaAktifMi && masaKalemleri.length > 0 && (
              <div className="cart-masa-ozet">
                <h3 className="cart-masa-ozet-baslik">
                  Masa {gorunenMasaNo} — Diğer Siparişler
                </h3>
                {masaKalemleri.map((k, i) => (
                  <div key={i} className="masa-kalem-satir">
                    <span className="masa-kalem-adet">{k.adet}×</span>
                    <span className="masa-kalem-ad">{k.urun_adi}</span>
                    <span className="masa-kalem-kisi">{k.kisi_adi}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alt sabit bar */}
          <div className="cart-alt-bar">
            <div className="cart-toplam-satir">
              <span>Toplam</span>
              <span className="cart-toplam-tutar">₺{sepetToplam.toFixed(2)}</span>
            </div>

            {aktifMasa ? (
              /* Masa seçili (QR veya elle) — doğrudan ödemeye */
              <>
                <div className="cart-masa-bilgi">🍽️ Masa {aktifMasa}</div>
                <button
                  className="odeme-gec-btn"
                  onClick={() => git(`/odeme?masa=${aktifMasa}`)}
                >
                  Ödemeye Geç
                </button>
              </>
            ) : (
              /* Masa seçili değil — seçenekler */
              <>
                <p className="cart-secim-baslik">Nasıl sipariş vermek istersin?</p>
                <div className="cart-secim-butonlar">
                  <button
                    className="siparis-tip-btn siparis-tip-btn--masa"
                    onClick={() => setMasaSecAcik(true)}
                  >
                    <span className="siparis-tip-emoji">🍽️</span>
                    Masa Seç
                  </button>
                  <button
                    className="siparis-tip-btn siparis-tip-btn--algotur"
                    onClick={() => git("/odeme")}
                  >
                    <span className="siparis-tip-emoji">🥡</span>
                    Al Götür
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Masa seçici modali — sepet doluyken */}
      {masaSecAcik && (
        <MasaSec
          baslik="Hangi Masadasın?"
          onSec={masaSecildi}
          onKapat={() => setMasaSecAcik(false)}
        />
      )}

      {/* Masaya geç modali — sepet boşken */}
      {masaGecAcik && (
        <MasaSec
          baslik="Masaya Geç"
          onSec={masayaGec}
          onKapat={() => setMasaGecAcik(false)}
        />
      )}
    </div>
  );
}
