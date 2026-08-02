import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import MarkaLogosu from "./MarkaLogosu";
import "./PerdeGecis.css";

const SURELER = {
  normal: { kapanma: 400, bekleme: 400, acilma: 400 },
  kutlama: { kapanma: 450, bekleme: 500, acilma: 450 },
};

export default function PerdeGecis({ aktif, varyant = "normal", altMetin = "", onKapandi, onTamamlandi }) {
  const hareketAzalt = useReducedMotion();
  const [asama, setAsama] = useState("kapaniyor");
  const kapandiRef = useRef(onKapandi);
  const tamamlandiRef = useRef(onTamamlandi);

  useEffect(() => { kapandiRef.current = onKapandi; }, [onKapandi]);
  useEffect(() => { tamamlandiRef.current = onTamamlandi; }, [onTamamlandi]);

  useEffect(() => {
    if (!aktif) return undefined;
    const sureler = hareketAzalt ? { kapanma: 50, bekleme: 50, acilma: 50 } : SURELER[varyant] || SURELER.normal;
    setAsama("kapaniyor");

    const kapanmaZamani = window.setTimeout(() => {
      setAsama("bekliyor");
      kapandiRef.current?.();
    }, sureler.kapanma);
    const acilmaZamani = window.setTimeout(() => setAsama("aciliyor"), sureler.kapanma + sureler.bekleme);
    const bitisZamani = window.setTimeout(() => tamamlandiRef.current?.(), sureler.kapanma + sureler.bekleme + sureler.acilma);

    return () => {
      window.clearTimeout(kapanmaZamani);
      window.clearTimeout(acilmaZamani);
      window.clearTimeout(bitisZamani);
    };
  }, [aktif, hareketAzalt, varyant]);

  const aciliyor = asama === "aciliyor";
  const panelSuresi = hareketAzalt ? 0.05 : varyant === "kutlama" ? 0.45 : 0.4;
  const panelGecisi = { duration: panelSuresi, ease: aciliyor ? "easeOut" : "easeIn" };
  const ustKonum = hareketAzalt ? 0 : aciliyor ? "-100%" : 0;
  const altKonum = hareketAzalt ? 0 : aciliyor ? "100%" : 0;

  return (
    <AnimatePresence>
      {aktif && (
        <motion.div
          className={`perde-gecis perde-gecis--${varyant} perde-gecis--${asama}`}
          initial={{ opacity: hareketAzalt ? 0 : 1 }}
          animate={{ opacity: aciliyor && hareketAzalt ? 0 : 1 }}
          exit={{ opacity: 0, pointerEvents: "none" }}
          transition={{ duration: hareketAzalt ? 0.05 : 0.08 }}
          aria-hidden="true"
        >
          <motion.div className="perde-panel perde-panel--ust" initial={hareketAzalt ? { opacity: 0 } : { y: "-100%" }} animate={hareketAzalt ? { opacity: aciliyor ? 0 : 1 } : { y: ustKonum }} transition={panelGecisi} />
          <motion.div className="perde-panel perde-panel--alt" initial={hareketAzalt ? { opacity: 0 } : { y: "100%" }} animate={hareketAzalt ? { opacity: aciliyor ? 0 : 1 } : { y: altKonum }} transition={panelGecisi} />

          <motion.div
            className="perde-merkez"
            initial={{ opacity: 0, scale: 0.88, x: "-50%", y: "-50%" }}
            animate={{ opacity: asama === "bekliyor" ? 1 : 0, scale: asama === "bekliyor" ? 1 : aciliyor ? 1.04 : 0.88, x: "-50%", y: "-50%" }}
            transition={{ duration: hareketAzalt ? 0.03 : 0.22, ease: "easeOut" }}
          >
            <MarkaLogosu alt="" />
            {altMetin && <strong>{altMetin}</strong>}
            <span className="perde-ilerleme"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: asama === "kapaniyor" ? 0 : 1 }} transition={{ duration: hareketAzalt ? 0.05 : 0.6, ease: "easeInOut" }} /></span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
