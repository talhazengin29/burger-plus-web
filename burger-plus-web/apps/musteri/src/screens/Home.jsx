import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { kategoriler, urunler } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useSuruklenebilir } from "../hooks/useSuruklenebilir";
import { IconPlus } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import { kartGirisi, siraliKonteyner, siraliOge, butonTiklama, barDolumu } from "../lib/animasyonlar";
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
      <OrtakHeader />

      <div className="home-govde">
        {/* Damga kartı — fade in + yukarı kayma */}
        <motion.section
          className="damga-kart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
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
                {/* Bar dolumu animasyonu — açılışta 0'dan yüzdeye kadar dolar */}
                <motion.div
                  className="ilerleme-dolgu"
                  {...barDolumu(damgaYuzde)}
                />
              </div>
            </>
          )}
        </motion.section>

        {/* Kategori chip'leri */}
        <div className="chip-satir" ref={chipRef}>
          {kategoriler.map((k) => (
            <motion.button
              key={k}
              className={"chip" + (k === aktifKategori ? " chip--aktif" : "")}
              onClick={() => setAktifKategori(k)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {k}
            </motion.button>
          ))}
        </div>

        <h3 className="bolum-baslik">Popüler Ürünler</h3>

        {/* Ürün grid — sıralı animasyonla gelir */}
        <AnimatePresence mode="wait">
          <motion.div
            className="urun-grid"
            key={aktifKategori}
            {...siraliKonteyner}
            initial="initial"
            animate="animate"
          >
            {gosterilen.map((u) => (
              <motion.article
                key={u.id}
                className="urun-kart"
                variants={siraliOge}
              >
                <div className="urun-gorsel-wrap">
                  <img className="urun-gorsel" src={u.gorsel} alt={u.ad} />
                </div>
                <div className="urun-alt">
                  <h4 className="urun-ad">{u.ad}</h4>
                  <div className="urun-fiyat-satir">
                    <span className="urun-fiyat">₺{u.fiyat.toFixed(2)}</span>
                    <motion.button
                      className="ekle-btn"
                      onClick={() => sepeteEkle(u)}
                      aria-label={`${u.ad} sepete ekle`}
                      whileTap={{ scale: 0.85 }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <IconPlus className="ekle-ikon" />
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
