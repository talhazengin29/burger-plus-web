import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBell, IconBag } from "./Icons";
import { badgePop } from "../lib/animasyonlar";

/* `selamlama` açıkken sol tarafta marka adı yerine kişisel karşılama görünür
   (ana sayfa). Diğer ekranlar prop vermeden çağırır, görünümleri değişmez. */
export default function OrtakHeader({ selamlama = false }) {
  const git = useNavigate();
  const { sepetAdet, kullanici, misafir } = useApp();

  const ad = kullanici ? kullanici.ad : misafir ? "Misafir" : "Dostum";

  return (
    <header className="home-header">
      {selamlama ? (
        <div className="selam">
          <span className="selam-ust">Merhaba,</span>
          <span className="selam-ad">
            {ad} <span aria-hidden="true">👋</span>
          </span>
        </div>
      ) : (
        <div className="brand">
          <span className="brand-name">BURGER PLUS</span>
        </div>
      )}
      <div className="home-header-sag">
        <motion.button
          className="ikon-btn"
          aria-label="Bildirimler"
          whileTap={{ scale: 0.88 }}
        >
          <IconBell />
        </motion.button>
        <motion.button
          className="ikon-btn sepet-btn"
          aria-label="Sepet"
          onClick={() => git("/sepet")}
          whileTap={{ scale: 0.88 }}
        >
          <IconBag />
          <AnimatePresence>
            {sepetAdet > 0 && (
              <motion.span
                className="sepet-badge"
                key={sepetAdet}
                {...badgePop}
              >
                {sepetAdet}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <motion.button
          className="avatar-sm avatar-harf"
          onClick={() => git("/profil")}
          aria-label="Profil"
          whileTap={{ scale: 0.9 }}
        >
          {kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}
        </motion.button>
      </div>
    </header>
  );
}
