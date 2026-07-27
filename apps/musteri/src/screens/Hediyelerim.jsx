import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconGift } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import { siraliKonteyner, siraliOge } from "../lib/animasyonlar";
import "./Hediyelerim.css";

function kaynakMetni(h) {
  return h.tip === "puan" ? `${h.puan} Puan ile kazanıldı` : "Ye Kazan ile kazanıldı";
}
function tarihGoster(iso) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function HediyeKart({ h, kullanilmis, onSepeteEkle }) {
  return (
    <motion.article
      className={"hediye-kart" + (kullanilmis ? " hediye-kart--kullanilmis" : "")}
      variants={siraliOge}
    >
      <div className="hediye-gorsel-wrap">
        {h.gorsel ? (
          <img className="hediye-gorsel" src={h.gorsel} alt={h.ad} />
        ) : (
          <div className="hediye-gorsel-yer"><IconGift /></div>
        )}
      </div>
      <div className="hediye-icerik">
        <h3 className="hediye-ad">{h.ad}</h3>
        <span className="hediye-kaynak">{kaynakMetni(h)}</span>
        <span className="hediye-tarih">{tarihGoster(h.tarih)}</span>
        {kullanilmis ? (
          <span className="hediye-kullanildi-rozet">Kullanıldı ✓</span>
        ) : (
          <button className="hediye-sepet-btn" onClick={() => onSepeteEkle(h)}>
            Sepete Ekle
          </button>
        )}
      </div>
    </motion.article>
  );
}

export default function Hediyelerim() {
  const { misafir, hediyeler, hediyeSepeteEkle } = useApp();
  const git = useNavigate();

  if (misafir) {
    return (
      <UyeOl
        baslik="Hediyelerini Gör"
        aciklama="Hediyeler üyelere özel. Üye ol, Ye Kazan ve puan ödüllerini burada topla."
      />
    );
  }

  const kullanilabilir = hediyeler.filter((h) => !h.kullanildi);
  const kullanilmis = hediyeler.filter((h) => h.kullanildi);

  const sepeteEkleyeBas = (h) => {
    hediyeSepeteEkle(h);
    git("/sepet");
  };

  return (
    <div className="ekran hediyelerim">
      <OrtakHeader />
      <SayfaSarici>
        <div className="hediyelerim-govde">
          <h1 className="hediyelerim-baslik">Hediyelerim</h1>

          <h2 className="hediyelerim-bolum-baslik">Kullanılabilir Hediyeler</h2>
          {kullanilabilir.length === 0 ? (
            <p className="hediyelerim-bos">Henüz hediye kazanmadın</p>
          ) : (
            <motion.div className="hediye-liste" {...siraliKonteyner} initial="initial" animate="animate">
              {kullanilabilir.map((h) => (
                <HediyeKart key={h.id} h={h} kullanilmis={false} onSepeteEkle={sepeteEkleyeBas} />
              ))}
            </motion.div>
          )}

          <h2 className="hediyelerim-bolum-baslik">Kullanılmış Hediyeler</h2>
          {kullanilmis.length === 0 ? (
            <p className="hediyelerim-bos">Henüz kullanılmış hediye yok</p>
          ) : (
            <motion.div className="hediye-liste" {...siraliKonteyner} initial="initial" animate="animate">
              {kullanilmis.map((h) => (
                <HediyeKart key={h.id} h={h} kullanilmis={true} />
              ))}
            </motion.div>
          )}
        </div>
      </SayfaSarici>
    </div>
  );
}
