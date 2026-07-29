import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { puanHesapla } from "../data/mockData";
import { IconBack, IconWallet, IconUsers, IconBag, IconMinus, IconPlus, IconCheck } from "../components/Icons";
import { gramajMetni, haricMalzemeleriGetir } from "../lib/urunSecimleri";
import { iyzicoOdemesiniBaslat, odemeTaslagiOlustur } from "../lib/authApi";
import "./Payment.css";

const YONTEMLER = [
  { id: "tam", ad: "Tamamını Öde", Ikon: IconWallet, aciklama: "Hesabın tamamını sen öde" },
  { id: "esit", ad: "Eşit Böl", Ikon: IconUsers, aciklama: "Çoklu ödeme oturumu ile yakında", devreDisi: true },
  { id: "urun", ad: "Ürüne Göre", Ikon: IconBag, aciklama: "Sadece kendi ürünlerini öde" },
];

export default function Payment() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("masa");
  const masaModu = !!masaNo;
  const { sepet, sepetToplam, kullanici, misafir } = useApp();

  const [yontem, setYontem] = useState("tam");
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [islemde, setIslemde] = useState(false);
  const [odemeHatasi, setOdemeHatasi] = useState("");
  const [alici, setAlici] = useState(() => ({
    ad: kullanici?.ad || "", soyad: kullanici?.soyad || "", email: kullanici?.email || "",
    telefon: kullanici?.telefon || "+905", kimlikNo: "", adres: "", il: "", postaKodu: "",
  }));

  const aliciDegistir = (alan, deger) => setAlici((onceki) => ({ ...onceki, [alan]: deger }));

  // Ürüne göre ödeme: her ürün için kaç adet ödeneceğini tutan obje
  // { urunId: adet }  (0 = seçilmemiş, 1+ = o kadar adet ödeniyor)
  const [seciliAdetler, setSeciliAdetler] = useState({});

  if (sepet.length === 0) {
    return (
      <div className="ekran payment">
        <header className="alt-header">
          <button className="geri-btn" onClick={() => git("/anasayfa")} aria-label="Geri"><IconBack /></button>
          <h1 className="alt-header-baslik">Ödeme</h1>
          <span className="alt-header-bosluk" />
        </header>
        <div className="odeme-bos">
          <p>Sepetin boş, önce ürün ekle.</p>
          <button onClick={() => git("/anasayfa")}>Menüye Dön</button>
        </div>
      </div>
    );
  }

  // Ürün seçiminde adet artır/azalt
  const adetArtir = (id, maxAdet) => {
    setSeciliAdetler((o) => {
      const mevcut = o[id] || 0;
      if (mevcut >= maxAdet) return o;
      return { ...o, [id]: mevcut + 1 };
    });
  };
  const adetAzalt = (id) => {
    setSeciliAdetler((o) => {
      const mevcut = o[id] || 0;
      if (mevcut <= 0) return o;
      const yeni = { ...o };
      if (mevcut - 1 === 0) delete yeni[id];
      else yeni[id] = mevcut - 1;
      return yeni;
    });
  };
  // Tümünü seç / kaldır toggle
  const tumunuSec = (id, maxAdet) => {
    setSeciliAdetler((o) => {
      if ((o[id] || 0) > 0) {
        const yeni = { ...o };
        delete yeni[id];
        return yeni;
      }
      return { ...o, [id]: maxAdet };
    });
  };

  // Ödenen ürünleri hesapla (ürüne göre modda)
  const seciliUrunListesi = sepet
    .filter((u) => (seciliAdetler[u.sepetAnahtari] || 0) > 0)
    .map((u) => ({ ...u, adet: seciliAdetler[u.sepetAnahtari] }));

  // Ödenecek tutarı yönteme göre hesapla
  let odenecek = sepetToplam;
  let odenenUrunler = sepet; // tamamını öde → tüm sepet
  if (yontem === "esit") {
    odenecek = sepetToplam / kisiSayisi;
    // Eşit bölmede de tüm ürünler mutfağa gider
  } else if (yontem === "urun") {
    odenecek = seciliUrunListesi.reduce((t, u) => t + u.fiyat * u.adet, 0);
    odenenUrunler = seciliUrunListesi;
  }

  const kazanilacakPuan = puanHesapla(odenecek);
  const odemeAktif = yontem !== "urun" || seciliUrunListesi.length > 0;

  const odeyVeBitir = async () => {
    if (!odemeAktif || islemde) return;
    setIslemde(true);
    setOdemeHatasi("");
    try {
      const taslak = await odemeTaslagiOlustur({
        masaNo: masaNo || null,
        yontem,
        urunler: odenenUrunler.map((u) => ({
          id: u.id,
          adet: u.adet,
          secimler: u.secimler || {},
          haricMalzemeler: u.haricMalzemeler || [],
        })),
      });

      const paymentPageUrl = await iyzicoOdemesiniBaslat(taslak.id, alici);
      window.location.assign(paymentPageUrl);
    } catch (e) {
      setOdemeHatasi(e.message || "Ödeme başlatılamadı. Lütfen tekrar dene.");
    } finally {
      setIslemde(false);
    }
  };

  return (
    <div className="ekran payment">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Ödeme</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="payment-govde">
        {masaModu && (
          <div className="odeme-masa-rozet">🍽️ Masa {masaNo} — Masaya Servis</div>
        )}

        {misafir && (
          <div className="misafir-rozet">👤 Misafir olarak devam ediyorsun</div>
        )}

        <section className="secim-kutu odeme-urun-ozeti">
          <h3 className="secim-baslik">Sipariş özeti</h3>
          {sepet.map((u) => (
            <div key={u.sepetAnahtari || u.id} className="odeme-ozet-satir">
              <span className="odeme-ozet-ad">
                {u.ad} ×{u.adet}
                {gramajMetni(u.secimler) && <small>{gramajMetni(u.secimler)}</small>}
                {haricMalzemeleriGetir(u).length > 0 && <small>Haric: {haricMalzemeleriGetir(u).join(", ")}</small>}
              </span>
              <strong>₺{(u.fiyat * u.adet).toFixed(2)}</strong>
            </div>
          ))}
        </section>

        <section className="secim-kutu odeme-bilgi-kutu">
          <h3 className="secim-baslik">Fatura bilgileri</h3>
          <p className="odeme-bilgi-not">Kart bilgilerin İyzico’nun güvenli ödeme sayfasında girilir.</p>
          <div className="odeme-bilgi-grid">
            <label>Ad<input value={alici.ad} onChange={(e) => aliciDegistir("ad", e.target.value)} autoComplete="given-name" /></label>
            <label>Soyad<input value={alici.soyad} onChange={(e) => aliciDegistir("soyad", e.target.value)} autoComplete="family-name" /></label>
            <label className="tam-genislik">E-posta<input type="email" value={alici.email} onChange={(e) => aliciDegistir("email", e.target.value)} autoComplete="email" /></label>
            <label className="tam-genislik">Telefon<input inputMode="tel" placeholder="+905XXXXXXXXX" value={alici.telefon} onChange={(e) => aliciDegistir("telefon", e.target.value)} autoComplete="tel" /></label>
            <label className="tam-genislik">T.C. kimlik no<input inputMode="numeric" maxLength="11" value={alici.kimlikNo} onChange={(e) => aliciDegistir("kimlikNo", e.target.value.replace(/\D/g, ""))} /></label>
            <label className="tam-genislik">Adres<textarea rows="2" value={alici.adres} onChange={(e) => aliciDegistir("adres", e.target.value)} autoComplete="street-address" /></label>
            <label>İl<input value={alici.il} onChange={(e) => aliciDegistir("il", e.target.value)} autoComplete="address-level1" /></label>
            <label>Posta kodu<input value={alici.postaKodu} onChange={(e) => aliciDegistir("postaKodu", e.target.value)} autoComplete="postal-code" /></label>
          </div>
        </section>

        {/* Yöntem seçimi — misafir sadece tamamını öder */}
        {!misafir && (
          <>
            <h2 className="odeme-bolum-baslik">Nasıl ödemek istersin?</h2>
            <div className="yontem-grid">
              {YONTEMLER.map(({ id, ad, Ikon, aciklama, devreDisi }) => (
                <button
                  key={id}
                  className={"yontem-kart" + (yontem === id ? " yontem-kart--aktif" : "") + (devreDisi ? " yontem-kart--pasif" : "")}
                  onClick={() => !devreDisi && setYontem(id)}
                  disabled={devreDisi}
                >
                  <Ikon className="yontem-ikon" />
                  <span className="yontem-ad">{ad}</span>
                  <span className="yontem-aciklama">{aciklama}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Eşit böl: kişi sayısı */}
        {!misafir && yontem === "esit" && (
          <section className="secim-kutu">
            <h3 className="secim-baslik">Kaç kişi paylaşıyor?</h3>
            <div className="kisi-secici">
              <button onClick={() => setKisiSayisi((k) => Math.max(2, k - 1))} aria-label="Azalt"><IconMinus /></button>
              <span className="kisi-sayi">{kisiSayisi}</span>
              <button onClick={() => setKisiSayisi((k) => Math.min(20, k + 1))} aria-label="Artır"><IconPlus /></button>
            </div>
            <p className="kisi-not">Kişi başı ₺{(sepetToplam / kisiSayisi).toFixed(2)}</p>
          </section>
        )}

        {/* Ürüne göre: adet bazlı seçim */}
        {!misafir && yontem === "urun" && (
          <section className="secim-kutu">
            <h3 className="secim-baslik">Ödeyeceğin ürünleri seç</h3>
            <div className="urun-sec-liste">
              {sepet.map((u) => {
                const anahtar = u.sepetAnahtari;
                const seciliAdet = seciliAdetler[anahtar] || 0;
                const secili = seciliAdet > 0;
                return (
                  <div
                    key={anahtar}
                    className={"urun-sec-satir" + (secili ? " urun-sec-satir--secili" : "")}
                  >
                    {/* Sol: ürün bilgisi + tıklayınca tümünü seç/kaldır */}
                    <button
                      className="urun-sec-sol"
                      onClick={() => tumunuSec(anahtar, u.adet)}
                    >
                      <span className={"sec-kutu" + (secili ? " sec-kutu--dolu" : "")}>
                        {secili && <IconCheck />}
                      </span>
                      <span className="urun-sec-ad">
                        {u.ad}
                        {gramajMetni(u.secimler) && <small>{gramajMetni(u.secimler)}</small>}
                        {haricMalzemeleriGetir(u).length > 0 && <small>Haric: {haricMalzemeleriGetir(u).join(", ")}</small>}
                      </span>
                    </button>

                    {/* Sağ: adet seçici (birden fazla ise) */}
                    <div className="urun-sec-sag">
                      {u.adet > 1 ? (
                        <div className="urun-adet-secici">
                          <button
                            className="urun-adet-btn"
                            onClick={() => adetAzalt(anahtar)}
                            disabled={seciliAdet === 0}
                          >
                            <IconMinus />
                          </button>
                          <span className="urun-adet-sayi">{seciliAdet}/{u.adet}</span>
                          <button
                            className="urun-adet-btn"
                            onClick={() => adetArtir(anahtar, u.adet)}
                            disabled={seciliAdet === u.adet}
                          >
                            <IconPlus />
                          </button>
                        </div>
                      ) : null}
                      <span className="urun-sec-fiyat">
                        ₺{(u.fiyat * (secili ? seciliAdet : u.adet)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Puan bilgisi */}
        {!misafir && (
          <div className="puan-bilgi">
            <span className="puan-bilgi-ikon">⭐</span>
            <span>Bu ödemeden <strong>{kazanilacakPuan} puan</strong> kazanacaksın</span>
          </div>
        )}
        {odemeHatasi && <p className="odeme-hata" role="alert">{odemeHatasi}</p>}
      </div>

      {/* Alt sabit ödeme bar */}
      <div className="payment-alt-bar">
        <div className="odenecek-satir">
          <span>Ödenecek Tutar</span>
          <span className="odenecek-tutar">₺{odenecek.toFixed(2)}</span>
        </div>
        <button
          className={"ode-btn" + (!odemeAktif ? " ode-btn--pasif" : "")}
          onClick={odeyVeBitir}
          disabled={!odemeAktif || islemde}
        >
          {islemde ? "Güvenli ödeme hazırlanıyor…" : "Ödeme Yap"}
        </button>
      </div>
    </div>
  );
}
