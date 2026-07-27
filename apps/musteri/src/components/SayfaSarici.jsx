import { motion } from "framer-motion";
import { sayfaGecisi } from "../lib/animasyonlar";

/*
  Her ekranı saran sayfa geçiş animasyonu.
  Kullanım: <SayfaSarici>...içerik...</SayfaSarici>
  Ekran açılırken hafif fade + yukarı kayma yapar.
*/
export default function SayfaSarici({ children }) {
  return (
    <motion.div
      initial={sayfaGecisi.initial}
      animate={sayfaGecisi.animate}
      transition={sayfaGecisi.transition}
      style={{ flex: 1, minHeight: 0 }}
    >
      {children}
    </motion.div>
  );
}
