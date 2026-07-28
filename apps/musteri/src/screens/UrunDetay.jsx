import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  const { sepeteEkle, indirimliFiyat, urunler } = useApp();
  const [adet, setAdet] = useState(1);
  const [haricMalzemeler, setHaricMalzemeler] = useState([]);
  const [gramajAdimi, setGramajAdimi] = useState(0);

  const urun = urunler.find((u) => String(u.id) === id);
  if (!urun) return <Navigate to="/anasayfa" replace />;

  const indirim = indirimliFiyat(urun);
  const gramajOpsiyonu = urun.gramajOpsiyonu?.aktif ? urun.gramajOpsiyonu : null;
  const ekstraGramaj = gramajOpsiyonu ? gramajAdimi * gramajOpsiyonu.artisMiktari : 0;
  const toplamGramaj = Number(urun.temelMiktar || 0) + ekstraGramaj;
  const gramajFiyatArtisi = gramajOpsiyonu ? gramajAdimi * gramajOpsiyonu.fiyatArtisi : 0;
  const birimFiyat = (indirim ? indirim.fiyat : urun.fiyat) + gramajFiyatArtisi;

  const malzemeToggle = (malzeme) => {
    setHaricMalzemeler((onceki) =>
      onceki.includes(malzeme)
        ? onceki.filter((m) => m !== malzeme) // tekrar tıkla → geri ekle
        : [...onceki, malzeme]                 // tıkla → çıkar
    );
  };

  const sepeteEkleyeBas = () => {
    const dahilMalzemeler = (urun.malzemeler || []).filter((m) => !haricMalzemeler.includes(m));
    const secimler = {
      dahilMalzemeler,
      ...(gramajOpsiyonu ? {
        ekstraGramaj,
        standartGramaj: Number(urun.temelMiktar || 0),
        toplamGramaj,
        gramajEtiketi: gramajOpsiyonu.etiket,
        gramajBirim: gramajOpsiyonu.birim,
      } : {}),
    };
    for (let i = 0; i < adet; i++) {
      sepeteEkle({ ...urun, haricMalzemeler, secimler, gramajFiyatArtisi });
    }
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
            {urun.aciklama && <p className="urun-detay-aciklama">{urun.aciklama}</p>}
          </section>

          {gramajOpsiyonu && (
            <section className="urun-detay-kart gramaj-kart">
              <div className="gramaj-bilgi">
                <h2 className="urun-detay-baslik">{gramajOpsiyonu.etiket}</h2>
                <span className="gramaj-deger">
                  {toplamGramaj} {gramajOpsiyonu.birim}
                </span>
                <span className="gramaj-standart">Standart: {urun.temelMiktar} {gramajOpsiyonu.birim}{ekstraGramaj > 0 ? ` · +${ekstraGramaj} ${gramajOpsiyonu.birim}` : ""}</span>
                <span className="gramaj-fiyat">
                  Her +{gramajOpsiyonu.artisMiktari} {gramajOpsiyonu.birim} için +₺{gramajOpsiyonu.fiyatArtisi.toFixed(2)}
                </span>
              </div>
              <div className="gramaj-kontrol" aria-label={`${gramajOpsiyonu.etiket} seçimi`}>
                <button
                  type="button"
                  onClick={() => setGramajAdimi((a) => Math.max(0, a - 1))}
                  disabled={gramajAdimi === 0}
                  aria-label="Gramajı azalt"
                >
                  <IconMinus />
                </button>
                <span>{gramajAdimi}</span>
                <button
                  type="button"
                  onClick={() => setGramajAdimi((a) => Math.min(gramajOpsiyonu.maxAdim, a + 1))}
                  disabled={gramajAdimi === gramajOpsiyonu.maxAdim}
                  aria-label="Gramajı artır"
                >
                  <IconPlus />
                </button>
              </div>
            </section>
          )}

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
          {`Sepete Ekle — ₺${(birimFiyat * adet).toFixed(2)}`}
        </motion.button>
      </div>
    </div>
  );
}
