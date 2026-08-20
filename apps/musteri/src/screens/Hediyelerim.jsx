import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { useState } from "react";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconGift } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import { siraliKonteyner, siraliOge } from "../lib/animasyonlar";
import { useDil } from "../dil/DilContext";
import "./Hediyelerim.css";

function kaynakMetni(h, t) {
  return h.tip === "puan" ? t("gifts.earnedWithPoints", { points: h.puan }) : t("gifts.earnedWithStamp");
}
function tarihGoster(iso, locale) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function HediyeKart({ h, kullanilmis, onKullan, islemde, t, locale, yerelAlan }) {
  const ad = yerelAlan(h, "ad", h.ad);
  return (
    <motion.article
      className={"hediye-kart" + (kullanilmis ? " hediye-kart--kullanilmis" : "")}
      variants={siraliOge}
    >
      <div className="hediye-gorsel-wrap">
        {h.gorsel ? (
          <img className="hediye-gorsel" src={h.gorsel} alt={ad} />
        ) : (
          <div className="hediye-gorsel-yer"><IconGift /></div>
        )}
      </div>
      <div className="hediye-icerik">
        <h3 className="hediye-ad">{ad}</h3>
        <span className="hediye-kaynak">{kaynakMetni(h, t)}</span>
        <span className="hediye-tarih">{tarihGoster(h.tarih, locale)}</span>
        {kullanilmis ? (
          <span className="hediye-kullanildi-rozet">{t("gifts.used")}</span>
        ) : (
          <button className="hediye-sepet-btn" disabled={islemde} onClick={() => onKullan(h)}>
            {islemde ? t("gifts.processing") : t("gifts.use")}
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function Hediyelerim() {
  const { t, locale, yerelAlan } = useDil();
  const { misafir, hediyeler, hediyeKullan, odemeyiTamamla } = useApp();
  const git = useIsletmeNavigate();
  const [islemde, setIslemde] = useState(null);
  const [hata, setHata] = useState("");

  if (misafir) {
    return (
      <UyeOl
        baslik={t("gifts.joinTitle")}
        aciklama={t("gifts.joinText")}
      />
    );
  }

  const kullanilabilir = hediyeler.filter((h) => !h.kullanildi);
  const kullanilmis = hediyeler.filter((h) => h.kullanildi);

  const hediyeyiKullan = async (h) => {
    if (islemde) return;
    setIslemde(h.id);
    setHata("");
    try {
      const odeme = await hediyeKullan(h);
      odemeyiTamamla(odeme);
      git("/odeme-sonuc");
    } catch (e) {
      setHata(e.message || t("gifts.failed"));
    } finally {
      setIslemde(null);
    }
  };

  return (
    <div className="ekran hediyelerim">
      <OrtakHeader />
      <SayfaSarici>
        <div className="hediyelerim-govde">
          <h1 className="hediyelerim-baslik">{t("gifts.title")}</h1>
          {hata && <p className="hediyelerim-bos" role="alert">{hata}</p>}

          <h2 className="hediyelerim-bolum-baslik">{t("gifts.available")}</h2>
          {kullanilabilir.length === 0 ? (
            <p className="hediyelerim-bos">{t("gifts.noneAvailable")}</p>
          ) : (
            <motion.div className="hediye-liste" {...siraliKonteyner} initial="initial" animate="animate">
              {kullanilabilir.map((h) => (
                <HediyeKart key={h.id} h={h} kullanilmis={false} onKullan={hediyeyiKullan} islemde={islemde === h.id} t={t} locale={locale} yerelAlan={yerelAlan} />
              ))}
            </motion.div>
          )}

          <h2 className="hediyelerim-bolum-baslik">{t("gifts.usedTitle")}</h2>
          {kullanilmis.length === 0 ? (
            <p className="hediyelerim-bos">{t("gifts.noneUsed")}</p>
          ) : (
            <motion.div className="hediye-liste" {...siraliKonteyner} initial="initial" animate="animate">
              {kullanilmis.map((h) => (
                <HediyeKart key={h.id} h={h} kullanilmis={true} t={t} locale={locale} yerelAlan={yerelAlan} />
              ))}
            </motion.div>
          )}
        </div>
      </SayfaSarici>
    </div>
  );
}
