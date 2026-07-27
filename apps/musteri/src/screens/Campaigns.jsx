import { motion } from "framer-motion";
import { kampanyalar } from "../data/mockData";
import { IconClock, IconInvite } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { siraliKonteyner, siraliOge } from "../lib/animasyonlar";
import "./Campaigns.css";

// Etikete göre küçük ikon seçimi (saat / davet / öğrenci)
function EtiketIkon({ etiket }) {
  if (etiket.includes(":")) return <IconClock className="rozet-ikon" />;
  if (etiket === "Davet Et") return <IconInvite className="rozet-ikon" />;
  return <span className="rozet-emoji">🎓</span>;
}

export default function Campaigns() {
  return (
    <div className="ekran campaigns">
      <OrtakHeader />
      <SayfaSarici>
        <div className="camp-govde">
          <h1 className="camp-baslik">Özel Fırsatlar ve Kampanyalar</h1>
          <p className="camp-alt">Sana özel hazırladığımız lezzetli fırsatları kaçırma.</p>

          <motion.div className="camp-liste" {...siraliKonteyner} initial="initial" animate="animate">
            {kampanyalar.map((k) => (
              <motion.article key={k.id} className="camp-kart" variants={siraliOge}>
                <div className="camp-gorsel-wrap">
                  <img className="camp-gorsel" src={k.gorsel} alt={k.baslik} />
                  <span className="camp-rozet">
                    <EtiketIkon etiket={k.etiket} />
                    {k.etiket}
                  </span>
                </div>
                <div className="camp-icerik">
                  <div className="camp-baslik-satir">
                    <h3 className="camp-kart-baslik">{k.baslik}</h3>
                    {k.fiyat && <span className="camp-fiyat">₺{k.fiyat}</span>}
                  </div>
                  <p className="camp-aciklama">{k.aciklama}</p>
                  <motion.button
                    className={"camp-btn " + (k.butonTipi === "primary" ? "camp-btn--primary" : "camp-btn--charcoal")}
                    whileTap={{ scale: 0.95 }}
                  >
                    {k.buton}
                  </motion.button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </SayfaSarici>
    </div>
  );
}
