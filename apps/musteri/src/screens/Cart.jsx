import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { IconBack, IconPlus, IconMinus, IconTrash, IconBag } from "../components/Icons";
import "./Cart.css";

export default function Cart() {
  const git = useNavigate();
  const { sepet, adetArtir, adetAzalt, sepettenCikar, sepetToplam, aktifMasa, odemeyiTamamla } = useApp();

  // Sepette sadece hediye ürünler varsa (toplam 0₺) ödeme ekranına gerek yok.
  const bedava = sepet.length > 0 && sepetToplam === 0;
  const siparisiTamamla = () => {
    odemeyiTamamla(0, "tam", aktifMasa || null, sepet);
    git("/odeme-basarili");
  };

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
        <div className="sepet-bos">
          <IconBag className="sepet-bos-ikon" />
          <p className="sepet-bos-yazi">Sepetin şu an boş</p>
          <button className="sepet-bos-btn" onClick={() => git("/anasayfa")}>
            Menüye Dön
          </button>
        </div>
      ) : (
        <>
          <div className="cart-govde">
            <div className="cart-liste">
              {sepet.map((u) => (
                <article key={u.id} className="cart-satir">
                  <img className="cart-gorsel" src={u.gorsel} alt={u.ad} />
                  <div className="cart-orta">
                    <h3 className="cart-ad">{u.ad}</h3>
                    {u.hediyeMi ? (
                      <span className="cart-hediye-etiket">HEDİYE 🎁</span>
                    ) : (
                      <span className="cart-birim">₺{u.fiyat.toFixed(2)}</span>
                    )}
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
          </div>

          {/* Alt sabit özet + sipariş tipi seçimi */}
          <div className="cart-alt-bar">
            <div className="cart-toplam-satir">
              <span>Toplam</span>
              <span className="cart-toplam-tutar">₺{sepetToplam.toFixed(2)}</span>
            </div>

            {aktifMasa ? (
              /* QR ile masa seçili — doğrudan o masaya ödeme (bedavaysa direkt tamamla) */
              <>
                <div className="cart-masa-bilgi">🍽️ Masa {aktifMasa}'desin</div>
                <button
                  className="odeme-gec-btn"
                  onClick={bedava ? siparisiTamamla : () => git(`/odeme?masa=${aktifMasa}`)}
                >
                  {bedava ? "Siparişi Tamamla" : "Ödemeye Geç"}
                </button>
              </>
            ) : (
              /* Masa seçili değil — Al Götür veya QR ile Masaya Servis */
              <>
                <p className="cart-secim-baslik">Nasıl sipariş vermek istersin?</p>
                <div className="cart-secim-butonlar">
                  <button
                    className="siparis-tip-btn siparis-tip-btn--algotur"
                    onClick={bedava ? siparisiTamamla : () => git("/odeme")}
                  >
                    <span className="siparis-tip-emoji">🥡</span>
                    {bedava ? "Siparişi Tamamla" : "Al Götür"}
                  </button>
                  <button className="siparis-tip-btn siparis-tip-btn--masa" onClick={() => git("/qr?mod=masa")}>
                    <span className="siparis-tip-emoji">🍽️</span>
                    Masaya Servis
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
