import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { kampanyalar, kampanyaDurumu } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { IconClock, IconInvite } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { siraliKonteyner, siraliOge, fadeIn, asagiAcilma } from "../lib/animasyonlar";
import "./Campaigns.css";

// Etikete göre küçük ikon seçimi (saat / davet / öğrenci)
function EtiketIkon({ etiket }) {
  if (etiket.includes(":")) return <IconClock className="rozet-ikon" />;
  if (etiket === "Davet Et") return <IconInvite className="rozet-ikon" />;
  return <span className="rozet-emoji">🎓</span>;
}

// Canlı durum rozeti: AKTİF (yeşil) / BAŞLAMADI / SONA ERDİ (gri)
const durumMetni = { aktif: "AKTİF", baslamadi: "BAŞLAMADI", sonaerdi: "SONA ERDİ" };

export default function Campaigns() {
  const git = useNavigate();
  const { misafir } = useApp();

  // Saatli kampanyaların (Happy Hour) durumu canlı kalsın diye dakikada bir tazelenir.
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setSimdi(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Misafir kampanyayı görebilir ama faydalanamaz — "Sipariş Ver"e basınca üyelik modalı çıkar.
  const [modalAcik, setModalAcik] = useState(false);

  const siparisVer = (k) => {
    const kategori = k.gecerliKategoriler?.[0];
    git("/anasayfa", kategori ? { state: { kategori } } : undefined);
  };

  const siparisVerTiklandi = (k) => {
    if (misafir) { setModalAcik(true); return; }
    siparisVer(k);
  };

  return (
    <div className="ekran campaigns">
      <OrtakHeader />
      <SayfaSarici>
        <div className="camp-govde">
          <h1 className="camp-baslik">Özel Fırsatlar ve Kampanyalar</h1>
          <p className="camp-alt">Sana özel hazırladığımız lezzetli fırsatları kaçırma.</p>

          <motion.div className="camp-liste" {...siraliKonteyner} initial="initial" animate="animate">
            {kampanyalar.map((k) => {
              const durum = kampanyaDurumu(k, simdi);
              const siparisVerilebilir = k.buton === "Sipariş Ver";
              const pasif = siparisVerilebilir && durum !== "aktif";
              return (
                <motion.article key={k.id} className="camp-kart" variants={siraliOge}>
                  <div className="camp-gorsel-wrap">
                    <img className="camp-gorsel" src={k.gorsel} alt={k.baslik} />
                    <span className="camp-rozet">
                      <EtiketIkon etiket={k.etiket} />
                      {k.etiket}
                    </span>
                    {durum !== "pasif" && (
                      <span className={"camp-durum-rozet camp-durum-rozet--" + durum}>
                        {durumMetni[durum]}
                      </span>
                    )}
                  </div>
                  <div className="camp-icerik">
                    <div className="camp-baslik-satir">
                      <h3 className="camp-kart-baslik">{k.baslik}</h3>
                      {k.indirimYuzde > 0 && <span className="camp-fiyat">%{k.indirimYuzde}</span>}
                    </div>
                    <p className="camp-aciklama">{k.aciklama}</p>
                    {siparisVerilebilir && misafir && (
                      <span className="camp-uye-rozet">🔒 Üyelere Özel</span>
                    )}
                    <motion.button
                      className={"camp-btn " + (k.butonTipi === "primary" ? "camp-btn--primary" : "camp-btn--charcoal")}
                      whileTap={{ scale: 0.95 }}
                      disabled={pasif}
                      onClick={siparisVerilebilir ? () => siparisVerTiklandi(k) : undefined}
                    >
                      {k.buton}
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </SayfaSarici>

      <AnimatePresence>
        {modalAcik && (
          <motion.div className="uye-modal-perde" {...fadeIn} onClick={() => setModalAcik(false)}>
            <motion.div className="uye-modal" {...asagiAcilma} onClick={(e) => e.stopPropagation()}>
              <h3 className="uye-modal-baslik">Üyelere Özel Kampanya</h3>
              <p className="uye-modal-metin">Bu kampanyadan faydalanmak için üye olmalısın.</p>
              <div className="uye-modal-butonlar">
                <button className="camp-btn camp-btn--charcoal" onClick={() => setModalAcik(false)}>Kapat</button>
                <button className="camp-btn camp-btn--primary" onClick={() => git("/kayit")}>Üye Ol</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
