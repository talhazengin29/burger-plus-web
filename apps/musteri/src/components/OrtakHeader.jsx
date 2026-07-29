import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBell, IconBag } from "./Icons";
import { badgePop } from "../lib/animasyonlar";
import { duyurulariGetir } from "../lib/authApi";
import { socket } from "../lib/socket";

/* `selamlama` açıkken sol tarafta marka adı yerine kişisel karşılama görünür
   (ana sayfa). Diğer ekranlar prop vermeden çağırır, görünümleri değişmez. */
export default function OrtakHeader({ selamlama = false }) {
  const git = useNavigate();
  const { sepetAdet, kullanici, misafir, avatar } = useApp();
  const [bildirimlerAcik, setBildirimlerAcik] = useState(false);
  const [duyurular, setDuyurular] = useState([]);

  const ad = kullanici ? kullanici.ad : misafir ? "Misafir" : "Dostum";

  const duyurulariYukle = useCallback(() => {
    return duyurulariGetir().then(setDuyurular).catch(() => setDuyurular([]));
  }, []);

  useEffect(() => {
    duyurulariYukle();
    socket.on("duyurular-guncellendi", duyurulariYukle);
    return () => socket.off("duyurular-guncellendi", duyurulariYukle);
  }, [duyurulariYukle]);

  const bildirimleriAcKapat = () => {
    setBildirimlerAcik((acik) => {
      const sonrakiDurum = !acik;
      if (sonrakiDurum) duyurulariYukle();
      return sonrakiDurum;
    });
  };

  const duyuruyaGit = (hedef) => {
    setBildirimlerAcik(false);
    git(hedef || "/anasayfa");
  };

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
        <div className="bildirim-sarici">
          <motion.button
            className="ikon-btn bildirim-btn"
            aria-label="Bildirimler"
            aria-expanded={bildirimlerAcik}
            onClick={bildirimleriAcKapat}
            whileTap={{ scale: 0.88 }}
          >
            <IconBell />
            {duyurular.length > 0 && <span className="bildirim-badge">{Math.min(duyurular.length, 9)}</span>}
          </motion.button>
          <AnimatePresence>
            {bildirimlerAcik && <motion.div className="bildirim-panel" initial={{ opacity: 0, y: -8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .98 }}>
              <header><b>Bildirimler</b><span>{duyurular.length ? `${duyurular.length} yeni` : "Güncelsin"}</span></header>
              {duyurular.length ? <div>{duyurular.slice(0, 6).map((duyuru) => <button key={duyuru.id} onClick={() => duyuruyaGit(duyuru.hedef)}><i>•</i><span><b>{duyuru.baslik}</b><small>{duyuru.mesaj}</small></span><em>›</em></button>)}</div> : <p>Şu an için yeni bir duyuru yok.</p>}
            </motion.div>}
          </AnimatePresence>
        </div>
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
          {avatar ? <img className="avatar-gorsel" src={avatar} alt="Profil" /> : kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}
        </motion.button>
      </div>
    </header>
  );
}
