import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconShop, IconTicket, IconCutlery, IconGift } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import { siraliKonteyner, siraliOge, barDolumu } from "../lib/animasyonlar";
import { useTema } from "../context/TemaContext";
import { useDil } from "../dil/DilContext";
import "./Rewards.css";

const ODUL_IKONLARI = { IconTicket, IconCutlery, IconGift };

export default function Rewards() {
  const { metinler } = useTema();
  const { locale, t, yerelAlan } = useDil();
  const { puan, misafir, odulSatinAl, oduller, puanGecmisi } = useApp();
  const [mesaj, setMesaj] = useState(null); // { tip: "basari" | "hata", metin }
  const [islemde, setIslemde] = useState(null);

  useEffect(() => {
    if (!mesaj) return;
    const t = setTimeout(() => setMesaj(null), 2500);
    return () => clearTimeout(t);
  }, [mesaj]);

  if (misafir) {
    return (
      <UyeOl
        baslik={t("rewards.joinTitle")}
        aciklama={t("rewards.joinText")}
      />
    );
  }

  const hedef = oduller.find((odul) => /burger/i.test(odul.ad))?.puan || oduller.at(-1)?.puan || 1200;
  const yuzde = Math.min((puan / hedef) * 100, 100);
  const kalan = Math.max(hedef - puan, 0);

  const odulAlTiklandi = async (o) => {
    if (islemde) return;
    setIslemde(o.id);
    try {
      await odulSatinAl(o);
      setMesaj({ tip: "basari", metin: t("rewards.added", { name: yerelAlan(o, "ad", o.ad) }) });
    } catch (e) {
      setMesaj({ tip: "hata", metin: e.message || t("rewards.failed") });
    } finally {
      setIslemde(null);
    }
  };

  return (
    <div className="ekran rewards">
      <OrtakHeader />
      <SayfaSarici>
        <div className="rewards-govde">
          <AnimatePresence>
            {mesaj && (
              <motion.div
                className={"rewards-toast rewards-toast--" + mesaj.tip}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {mesaj.metin}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toplam puan kartı */}
          <motion.section
            className="puan-kart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="puan-kart-baslik">{t("rewards.total")}</h2>
            <div className="puan-buyuk">
              <span className="puan-sayi">{puan.toLocaleString(locale)}</span>
              <span className="puan-etiket">{t("rewards.point")}</span>
            </div>
            <div className="puan-ilerleme-bilgi">
              <span>{t("rewards.start")}</span>
              <span className="puan-hedef">{t("rewards.target", { unit: metinler.damgaBirim, points: hedef.toLocaleString(locale) })}</span>
            </div>
            <div className="puan-ilerleme-ray">
              <motion.div className="puan-ilerleme-dolgu" {...barDolumu(yuzde)} />
            </div>
            <p className="puan-kalan">{t("rewards.remaining", { points: kalan.toLocaleString(locale) })}</p>
          </motion.section>

          {/* Ödül Marketi */}
          <div className="bolum-basrivi">
            <h3 className="bolum-baslik">{t("rewards.market")}</h3>
            <IconShop className="bolum-ikon" />
          </div>

          <motion.div className="odul-grid" {...siraliKonteyner} initial="initial" animate="animate">
            {oduller.map((o) => {
              const Ikon = ODUL_IKONLARI[o.ikon] || IconGift;
              return (
                <motion.article key={o.id} className="odul-kart" variants={siraliOge}>
                  <div className="odul-gorsel-wrap">
                    {o.gorsel
                      ? <img className="odul-gorsel" src={o.gorsel} alt={yerelAlan(o, "ad", o.ad)} />
                      : <div className="odul-gorsel-yer"><Ikon /></div>}
                  </div>
                  <div className="odul-alt">
                    <h4 className="odul-ad">{yerelAlan(o, "ad", o.ad)}</h4>
                    <div className="odul-fiyat-satir">
                      <span className="odul-puan">{o.puan.toLocaleString(locale)} {t("rewards.point")}</span>
                      <motion.button
                        className="odul-ekle"
                        aria-label={t("rewards.buy", { name: yerelAlan(o, "ad", o.ad) })}
                        onClick={() => odulAlTiklandi(o)}
                        disabled={islemde === o.id}
                        whileTap={{ scale: 0.85 }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {/* Puan geçmişi */}
          <div className="bolum-basrivi">
            <h3 className="bolum-baslik">{t("rewards.history")}</h3>
          </div>
          <div className="gecmis-liste">
            {puanGecmisi.map((g) => (
              <div key={g.id} className="gecmis-satir">
                <div className="gecmis-sol">
                  <span className="gecmis-baslik">{g.baslik}</span>
                  <span className="gecmis-tarih">{new Date(g.tarih).toLocaleDateString(locale)}</span>
                </div>
                <span className={"gecmis-puan " + (g.tip === "kazanc" ? "arti" : "eksi")}>
                  {g.puan > 0 ? `+${g.puan}` : g.puan}
                </span>
              </div>
            ))}
          </div>
          <button className="tumunu-gor">{t("rewards.seeAll")}</button>
        </div>
      </SayfaSarici>
    </div>
  );
}
