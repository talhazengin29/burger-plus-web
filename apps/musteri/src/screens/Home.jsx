import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { kategoriler, kategoriGorseller, urunler } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { useSuruklenebilir } from "../hooks/useSuruklenebilir";
import { IconPlus, IconSearch, IconFilter, IconArrowRight } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import { siraliKonteyner, siraliOge, barDolumu, asagiAcilma } from "../lib/animasyonlar";
import "./Home.css";

// Arama çubuğundaki filtre düğmesinin sıralama seçenekleri
const siralamalar = [
  { id: "onerilen", etiket: "Önerilen" },
  { id: "artan", etiket: "Fiyat: Artan" },
  { id: "azalan", etiket: "Fiyat: Azalan" },
];

export default function Home() {
  const [aktifKategori, setAktifKategori] = useState("Burgerler");
  const [arama, setArama] = useState("");
  const [siralama, setSiralama] = useState("onerilen");
  const [filtreAcik, setFiltreAcik] = useState(false);
  const { sepeteEkle, burgerDamga, burgerDamgaHedef, misafir } = useApp();
  const chipRef = useSuruklenebilir();

  // Kategori + arama + sıralama; hepsi yalnızca listelemeyi etkiler
  const gosterilen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase("tr");
    const liste = urunler.filter(
      (u) =>
        (aktifKategori === "Tümü" || u.kategori === aktifKategori) &&
        (q === "" || u.ad.toLocaleLowerCase("tr").includes(q))
    );
    if (siralama === "artan") return [...liste].sort((a, b) => a.fiyat - b.fiyat);
    if (siralama === "azalan") return [...liste].sort((a, b) => b.fiyat - a.fiyat);
    return liste;
  }, [aktifKategori, arama, siralama]);

  const damgaYuzde = (burgerDamga / burgerDamgaHedef) * 100;

  // "Tümünü Gör" — kategori/arama filtrelerini kaldırıp tüm menüyü gösterir
  const tumunuGoster = () => {
    setAktifKategori("Tümü");
    setArama("");
  };

  return (
    <div className="ekran home">
      <OrtakHeader selamlama />

      <div className="home-govde">
        {/* Kahraman başlık */}
        <motion.h1
          className="home-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          Lezzetli Yemek
          <br />
          <span className="vurgu">Harika Deneyim!</span>
        </motion.h1>

        {/* Arama çubuğu — cam, solda arama ikonu, sağda sıralama filtresi */}
        <motion.div
          className="arama-sarici"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        >
          <div className="arama-kutu">
            <IconSearch className="arama-ikon" aria-hidden="true" />
            <input
              className="arama-input"
              type="search"
              value={arama}
              onChange={(e) => setArama(e.target.value)}
              placeholder="Menüde ara..."
              aria-label="Menüde ara"
            />
            <motion.button
              type="button"
              className={"filtre-btn" + (filtreAcik ? " filtre-btn--acik" : "")}
              onClick={() => setFiltreAcik((v) => !v)}
              aria-label="Sıralama seçenekleri"
              aria-expanded={filtreAcik}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <IconFilter className="filtre-ikon" />
            </motion.button>
          </div>

          <AnimatePresence>
            {filtreAcik && (
              <>
                {/* Dışarı tıklayınca menü kapansın */}
                <button
                  type="button"
                  className="filtre-perde"
                  aria-label="Sıralama menüsünü kapat"
                  onClick={() => setFiltreAcik(false)}
                />
                <motion.div className="filtre-menu" {...asagiAcilma}>
                  {siralamalar.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={"filtre-secenek" + (siralama === s.id ? " filtre-secenek--aktif" : "")}
                      onClick={() => {
                        setSiralama(s.id);
                        setFiltreAcik(false);
                      }}
                    >
                      {s.etiket}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Ye Kazan damga kartı */}
        <motion.section
          className="damga-kart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          <div className="damga-ust">
            <div>
              <span className="damga-rozet">YE KAZAN</span>
              <h2 className="damga-baslik">
                {burgerDamgaHedef} Burger Ye, <span className="vurgu">1 Burger HEDİYE!</span>
              </h2>
            </div>
            {!misafir && (
              <span className="damga-sayac">
                {burgerDamga}
                <span className="damga-sayac-hedef">/{burgerDamgaHedef}</span>
              </span>
            )}
          </div>

          {misafir ? (
            <p className="damga-misafir-not">
              Giriş yap veya üye ol, bu kampanyaya dahil ol!
            </p>
          ) : (
            <>
              <div className="ilerleme-ray">
                {/* Bar dolumu animasyonu — açılışta 0'dan yüzdeye kadar dolar */}
                <motion.div className="ilerleme-dolgu" {...barDolumu(damgaYuzde)} />
              </div>
              <span className="damga-durum">
                {burgerDamgaHedef - burgerDamga} burger sonra hediyen hazır
              </span>
            </>
          )}
        </motion.section>

        {/* Kategoriler — yuvarlak görseller, yatay kaydırma */}
        <div className="kategori-satir" ref={chipRef}>
          {kategoriler.map((k) => (
            <motion.button
              key={k}
              type="button"
              className={"kategori" + (k === aktifKategori ? " kategori--aktif" : "")}
              onClick={() => setAktifKategori(k)}
              aria-pressed={k === aktifKategori}
              whileTap={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="kategori-daire">
                {kategoriGorseller[k] && (
                  <img className="kategori-gorsel" src={kategoriGorseller[k]} alt="" loading="lazy" />
                )}
              </span>
              <span className="kategori-ad">{k}</span>
            </motion.button>
          ))}
        </div>

        {/* Bölüm başlığı + tümünü gör */}
        <div className="bolum-satir">
          <h3 className="bolum-baslik">Popüler Ürünler</h3>
          <button type="button" className="tumu-link" onClick={tumunuGoster}>
            Tümünü Gör
            <IconArrowRight className="tumu-ikon" aria-hidden="true" />
          </button>
        </div>

        {/* Ürün grid — sıralı animasyonla gelir */}
        <AnimatePresence mode="wait">
          <motion.div
            className="urun-grid"
            key={aktifKategori + siralama + arama}
            {...siraliKonteyner}
            initial="initial"
            animate="animate"
          >
            {gosterilen.map((u) => (
              <motion.article key={u.id} className="urun-kart" variants={siraliOge}>
                <div className="urun-gorsel-wrap">
                  <img className="urun-gorsel" src={u.gorsel} alt={u.ad} loading="lazy" />
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

        {gosterilen.length === 0 && (
          <p className="bos-sonuc">"{arama}" için sonuç bulunamadı.</p>
        )}
      </div>
    </div>
  );
}
