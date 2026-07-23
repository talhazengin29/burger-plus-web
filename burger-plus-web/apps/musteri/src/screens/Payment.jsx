import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { puanHesapla } from "../data/mockData";
import { IconBack, IconWallet, IconUsers, IconBag, IconMinus, IconPlus, IconCheck } from "../components/Icons";
import "./Payment.css";

const YONTEMLER = [
  { id: "tam", ad: "Tamamını Öde", Ikon: IconWallet, aciklama: "Hesabın tamamını sen öde" },
  { id: "esit", ad: "Eşit Böl", Ikon: IconUsers, aciklama: "Alman usulü — herkes eşit" },
  { id: "urun", ad: "Ürüne Göre", Ikon: IconBag, aciklama: "Sadece kendi ürünlerini öde" },
];

export default function Payment() {
  const git = useNavigate();
  const [params] = useSearchParams();
  const masaNo = params.get("masa"); // varsa masaya servis, yoksa al götür
  const masaModu = !!masaNo;
  const { sepet, sepetToplam, odemeyiTamamla, misafir } = useApp();

  const [yontem, setYontem] = useState("tam");
  const [kisiSayisi, setKisiSayisi] = useState(2);
  const [seciliUrunler, setSeciliUrunler] = useState([]); // ürüne göre: satır id listesi

  // Sepet boşsa ödeme ekranı anlamsız
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

  // Ödenecek tutarı yönteme göre hesapla
  let odenecek = sepetToplam;
  if (yontem === "esit") {
    odenecek = sepetToplam / kisiSayisi;
  } else if (yontem === "urun") {
    odenecek = sepet
      .filter((s) => seciliUrunler.includes(s.id))
      .reduce((t, s) => t + s.fiyat * s.adet, 0);
  }

  const kazanilacakPuan = puanHesapla(odenecek);
  const odemeAktif = yontem !== "urun" || seciliUrunler.length > 0;

  const urunSec = (id) =>
    setSeciliUrunler((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const odeyVeBitir = () => {
    if (!odemeAktif) return;
    odemeyiTamamla(odenecek, yontem, masaNo);
    git("/odeme-basarili");
  };

  return (
    <div className="ekran payment">
      <header className="alt-header">
        <button className="geri-btn" onClick={() => git(-1)} aria-label="Geri"><IconBack /></button>
        <h1 className="alt-header-baslik">Ödeme</h1>
        <span className="alt-header-bosluk" />
      </header>

      <div className="payment-govde">
        {/* Masaya servis ise masa bilgisi */}
        {masaModu && (
          <div className="odeme-masa-rozet">
            🍽️ Masa {masaNo} — Masaya Servis
          </div>
        )}

        {/* Misafir bilgi şeridi */}
        {misafir && (
          <div className="misafir-rozet">
            👤 Misafir olarak devam ediyorsun
          </div>
        )}

        {/* Yöntem seçimi — misafir sadece tamamını öder, seçenek gösterilmez */}
        {!misafir && (
          <>
            <h2 className="odeme-bolum-baslik">Nasıl ödemek istersin?</h2>
            <div className="yontem-grid">
              {YONTEMLER.map(({ id, ad, Ikon, aciklama }) => (
                <button
                  key={id}
                  className={"yontem-kart" + (yontem === id ? " yontem-kart--aktif" : "")}
                  onClick={() => setYontem(id)}
                >
                  <Ikon className="yontem-ikon" />
                  <span className="yontem-ad">{ad}</span>
                  <span className="yontem-aciklama">{aciklama}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Eşit böl: kişi sayısı (misafirde yok) */}
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

        {/* Ürüne göre: hangi ürünleri ödüyorsun (misafirde yok) */}
        {!misafir && yontem === "urun" && (
          <section className="secim-kutu">
            <h3 className="secim-baslik">Ödeyeceğin ürünleri seç</h3>
            <div className="urun-sec-liste">
              {sepet.map((u) => {
                const secili = seciliUrunler.includes(u.id);
                return (
                  <button
                    key={u.id}
                    className={"urun-sec-satir" + (secili ? " urun-sec-satir--secili" : "")}
                    onClick={() => urunSec(u.id)}
                  >
                    <span className={"sec-kutu" + (secili ? " sec-kutu--dolu" : "")}>
                      {secili && <IconCheck />}
                    </span>
                    <span className="urun-sec-ad">{u.ad} {u.adet > 1 && `x${u.adet}`}</span>
                    <span className="urun-sec-fiyat">₺{(u.fiyat * u.adet).toFixed(2)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Puan bilgisi — sadece daimi kullanıcıya */}
        {!misafir && (
          <div className="puan-bilgi">
            <span className="puan-bilgi-ikon">⭐</span>
            <span>Bu ödemeden <strong>{kazanilacakPuan} puan</strong> kazanacaksın</span>
          </div>
        )}
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
          disabled={!odemeAktif}
        >
          Ödeme Yap
        </button>
      </div>
    </div>
  );
}
