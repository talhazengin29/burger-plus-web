import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { urunler } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { IconBack, IconMinus, IconPlus, IconWarning } from "../components/Icons";
import { siraliKonteyner, siraliOge } from "../lib/animasyonlar";
import "./UrunDetay.css";

// Besin değerleri sabit sırayla gösterilir
const besinEtiketleri = [
  { anahtar: "kalori", etiket: "Kalori" },
  { anahtar: "protein", etiket: "Protein" },
  { anahtar: "karbonhidrat", etiket: "Karbonhidrat" },
  { anahtar: "yag", etiket: "Yağ" },
];

export default function UrunDetay() {
  const { id } = useParams();
  const git = useNavigate();
  const { sepeteEkle, indirimliFiyat, misafir, aktifKampanyalar } = useApp();
  const [adet, setAdet] = useState(1);
  const [haricMalzemeler, setHaricMalzemeler] = useState([]);

  const urun = urunler.find((u) => String(u.id) === id);
  if (!urun) return <Navigate to="/anasayfa" replace />;

  const indirim = indirimliFiyat(urun);
  const birimFiyat = indirim ? indirim.fiyat : urun.fiyat;
  const misafirIcinFirsatVar =
    !indirim && misafir && aktifKampanyalar.some((k) => k.gecerliKategoriler?.includes(urun.kategori));

  const malzemeToggle = (malzeme) => {
    setHaricMalzemeler((onceki) =>
      onceki.includes(malzeme)
        ? onceki.filter((m) => m !== malzeme) // tekrar tıkla → geri ekle
        : [...onceki, malzeme]                 // tıkla → çıkar
    );
  };

  const sepeteEkleyeBas = () => {
    for (let i = 0; i < adet; i++) sepeteEkle({ ...urun, haricMalzemeler });
    git(-1);
  };

  return (
    <div className="ekran urun-detay">
      <div className="urun-detay-govde">
        {/* Üst görsel — yukarıdan fade ile gelir */}
        <motion.div
          className="urun-detay-gorsel-wrap"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img className="urun-detay-gorsel" src={urun.gorsel} alt={urun.ad} />
          <button className="urun-detay-geri" onClick={() => git(-1)} aria-label="Geri">
            <IconBack />
          </button>
        </motion.div>

        <motion.div
          className="urun-detay-icerik"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        >
          {/* Ad + fiyat + açıklama */}
          <section className="urun-detay-kart urun-detay-ozet">
            <h1 className="urun-detay-ad">{urun.ad}</h1>
            {indirim ? (
              <span className="urun-detay-fiyat-grup">
                <span className="urun-detay-fiyat-eski">₺{indirim.orijinalFiyat.toFixed(2)}</span>
                <span className="urun-detay-fiyat urun-detay-fiyat--indirim">₺{indirim.fiyat.toFixed(2)}</span>
              </span>
            ) : (
              <span className="urun-detay-fiyat">₺{urun.fiyat.toFixed(2)}</span>
            )}
            {misafirIcinFirsatVar && (
              <p className="urun-detay-uye-not">Üyelere özel fiyat — üye ol, indirimden faydalan</p>
            )}
            {urun.aciklama && <p className="urun-detay-aciklama">{urun.aciklama}</p>}
          </section>

          {/* Besin değerleri — sıralı animasyonla gelir */}
          {urun.besinDegerleri && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">Besin Değerleri</h2>
              <motion.div
                className="besin-grid"
                {...siraliKonteyner}
                initial="initial"
                animate="animate"
              >
                {besinEtiketleri.map(({ anahtar, etiket }) => (
                  <motion.div key={anahtar} className="besin-hucre" variants={siraliOge}>
                    <span className="besin-deger">{urun.besinDegerleri[anahtar]}</span>
                    <span className="besin-etiket">{etiket}</span>
                  </motion.div>
                ))}
              </motion.div>
            </section>
          )}

          {/* Alerjen bilgisi */}
          {urun.alerjenler && urun.alerjenler.length > 0 && (
            <section className="urun-detay-kart urun-detay-alerjen">
              <h2 className="urun-detay-baslik">Alerjen Bilgisi</h2>
              <ul className="alerjen-liste">
                {urun.alerjenler.map((a) => (
                  <li key={a} className="alerjen-satir">
                    <IconWarning className="alerjen-ikon" aria-hidden="true" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* İçindekiler — tıklayınca çıkarılabilir malzeme özelleştirmesi */}
          {urun.malzemeler && urun.malzemeler.length > 0 && (
            <section className="urun-detay-kart">
              <h2 className="urun-detay-baslik">İçindekiler</h2>
              <p className="urun-detay-malzeme-not">İstemediğin malzemeye dokun</p>
              <div className="malzeme-liste">
                {urun.malzemeler.map((m) => {
                  const haric = haricMalzemeler.includes(m);
                  return (
                    <motion.button
                      key={m}
                      type="button"
                      className={"malzeme-etiket " + (haric ? "malzeme--haric" : "malzeme--dahil")}
                      onClick={() => malzemeToggle(m)}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="malzeme-ikon">{haric ? "✕" : "✓"}</span>
                      {m}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          )}
        </motion.div>
      </div>

      {/* Alt sabit bar — adet seçici + sepete ekle */}
      <div className="urun-detay-alt-bar">
        <div className="adet-kontrol">
          <button onClick={() => setAdet((a) => Math.max(1, a - 1))} aria-label="Azalt">
            <IconMinus />
          </button>
          <span className="adet-sayi">{adet}</span>
          <button onClick={() => setAdet((a) => a + 1)} aria-label="Artır">
            <IconPlus />
          </button>
        </div>
        <motion.button
          type="button"
          className="urun-detay-sepet-btn"
          onClick={sepeteEkleyeBas}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Sepete Ekle — ₺{(birimFiyat * adet).toFixed(2)}
        </motion.button>
      </div>
    </div>
  );
}
