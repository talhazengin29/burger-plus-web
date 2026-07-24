import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { kategoriler, urunler } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useSuruklenebilir } from "../hooks/useSuruklenebilir";
import { IconBell, IconPlus, IconBag } from "../components/Icons";
import "./Home.css";

export default function Home() {
  const [aktifKategori, setAktifKategori] = useState("Burgerler");
  const { sepeteEkle, sepetAdet, kullanici, burgerDamga, burgerDamgaHedef, misafir } = useApp();
  const git = useNavigate();
  const chipRef = useSuruklenebilir();

  const gosterilen =
    aktifKategori === "Tümü"
      ? urunler
      : urunler.filter((u) => u.kategori === aktifKategori);

  const damgaYuzde = (burgerDamga / burgerDamgaHedef) * 100;

  return (
    <div className="ekran home">
      {/* Üst bar */}
      <header className="home-header">
        <div className="brand">
          <span className="brand-name">BURGER PLUS</span>
        </div>
        <div className="home-header-sag">
          <button className="ikon-btn" aria-label="Bildirimler">
            <IconBell />
          </button>
          <button className="ikon-btn sepet-btn" aria-label="Sepet" onClick={() => git("/sepet")}>
            <IconBag />
            {sepetAdet > 0 && <span className="sepet-badge">{sepetAdet}</span>}
          </button>
          <button className="avatar-sm avatar-harf" onClick={() => git("/profil")} aria-label="Profil">
            {kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}
          </button>
        </div>
      </header>

      <div className="home-govde">
        {/* Damga kartı: 5 al 1 bedava */}
        <section className="damga-kart">
          <span className="damga-rozet">YE KAZAN</span>
          <h2 className="damga-baslik">
            {burgerDamgaHedef} Burger Ye,
            <br />
            <span className="vurgu">1 Burger HEDİYE!</span>
          </h2>
          {misafir ? (
            <p className="damga-misafir-not">
              🔑 Giriş yap veya üye ol, bu kampanyaya dahil ol!
            </p>
          ) : (
            <>
              <div className="damga-alt">
                <span className="damga-durum t-body-sm">
                  {burgerDamga}/{burgerDamgaHedef} Burger Tamamlandı
                </span>
                <span className="damga-ikon">🍔</span>
              </div>
              <div className="ilerleme-ray">
                <div className="ilerleme-dolgu" style={{ width: `${damgaYuzde}%` }} />
              </div>
            </>
          )}
        </section>

        {/* Kategori chip'leri */}
        <div className="chip-satir" ref={chipRef}>
          {kategoriler.map((k) => (
            <button
              key={k}
              className={"chip" + (k === aktifKategori ? " chip--aktif" : "")}
              onClick={() => setAktifKategori(k)}
            >
              {k}
            </button>
          ))}
        </div>

        <h3 className="bolum-baslik">Popüler Ürünler</h3>

        {/* Ürün grid */}
        <div className="urun-grid">
          {gosterilen.map((u) => (
            <article key={u.id} className="urun-kart">
              <div className="urun-gorsel-wrap">
                <img className="urun-gorsel" src={u.gorsel} alt={u.ad} />
              </div>
              <div className="urun-alt">
                <h4 className="urun-ad">{u.ad}</h4>
                <div className="urun-fiyat-satir">
                  <span className="urun-fiyat">₺{u.fiyat.toFixed(2)}</span>
                  <button
                    className="ekle-btn"
                    onClick={() => sepeteEkle(u)}
                    aria-label={`${u.ad} sepete ekle`}
                  >
                    <IconPlus className="ekle-ikon" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
