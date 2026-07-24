import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBell, IconBag } from "./Icons";
import { badgePop } from "../lib/animasyonlar";

export default function OrtakHeader() {
  const git = useNavigate();
  const { sepetAdet, kullanici } = useApp();

  return (
    <header className="home-header">
      <div className="brand">
        <span className="brand-name">BURGER PLUS</span>
      </div>
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
