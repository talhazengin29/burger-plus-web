import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBell, IconBag, IconService } from "./Icons";
import { badgePop } from "../lib/animasyonlar";
import { duyurulariGetir } from "../lib/authApi";
import { socket } from "../lib/socket";
import { useIsletme } from "../context/IsletmeContext";
import MarkaLogosu from "./MarkaLogosu";
import { useDil } from "../dil/DilContext";

const okunanlariGetir = (anahtar) => {
  try {
    const kayit = JSON.parse(localStorage.getItem(anahtar) || "[]");
    return Array.isArray(kayit) ? kayit.map(String) : [];
  } catch {
    return [];
  }
};

const okunanlariKaydet = (anahtar, duyuruIdleri) => {
  try {
    localStorage.setItem(anahtar, JSON.stringify(duyuruIdleri));
  } catch {
    // Depolama kapalıysa sayaç mevcut oturumda state üzerinden çalışmayı sürdürür.
  }
};

/* `selamlama` açıkken sol tarafta marka adı yerine kişisel karşılama görünür
   (ana sayfa). Diğer ekranlar prop vermeden çağırır, görünümleri değişmez. */
export default function OrtakHeader({ selamlama = false }) {
  const { t } = useDil();
  const git = useIsletmeNavigate();
  const { isletme, isletmeSlug } = useIsletme();
  const {
    sepetAdet, kullanici, misafir, avatar, ozetMasaNo,
    personelCagrisi, personelCagriHazir, personelCagriYukleniyor,
    personelCagriHatasi, personelCagir,
  } = useApp();
  const [bildirimlerAcik, setBildirimlerAcik] = useState(false);
  const [personelPaneliAcik, setPersonelPaneliAcik] = useState(false);
  const [duyurular, setDuyurular] = useState([]);
  const okunanAnahtari = `bp_okunan_duyurular_${isletmeSlug}_${kullanici?.id || (misafir ? "misafir" : "anonim")}`;
  const [okunanDuyurular, setOkunanDuyurular] = useState(() => okunanlariGetir(okunanAnahtari));
  const okunmamisSayisi = useMemo(
    () => duyurular.filter((duyuru) => !okunanDuyurular.includes(String(duyuru.id))).length,
    [duyurular, okunanDuyurular]
  );

  const ad = kullanici ? kullanici.ad : misafir ? t("header.guest") : t("header.friend");
  const aktifCagri = ["bekliyor", "goruldu"].includes(personelCagrisi?.durum);
  const cagriDurumMetni = personelCagrisi?.durum === "goruldu"
    ? t("header.callSeen")
    : personelCagrisi?.durum === "bekliyor"
      ? t("header.callWaiting")
      : personelCagrisi?.durum === "tamamlandi"
        ? t("header.callDone")
        : personelCagrisi?.durum === "masada_yok"
          ? t("header.callAbsent")
          : t("header.callIntro");

  const duyurulariYukle = useCallback(() => {
    return duyurulariGetir().then(setDuyurular).catch(() => setDuyurular([]));
  }, []);

  useEffect(() => {
    duyurulariYukle();
    socket.on("duyurular-guncellendi", duyurulariYukle);
    return () => socket.off("duyurular-guncellendi", duyurulariYukle);
  }, [duyurulariYukle]);

  useEffect(() => {
    setOkunanDuyurular(okunanlariGetir(okunanAnahtari));
  }, [okunanAnahtari]);

  useEffect(() => {
    if (!bildirimlerAcik) return undefined;
    const escIleKapat = (olay) => {
      if (olay.key === "Escape") setBildirimlerAcik(false);
    };
    window.addEventListener("keydown", escIleKapat);
    return () => window.removeEventListener("keydown", escIleKapat);
  }, [bildirimlerAcik]);

  const bildirimleriAcKapat = () => {
    setPersonelPaneliAcik(false);
    setBildirimlerAcik((acik) => {
      const sonrakiDurum = !acik;
      if (sonrakiDurum) duyurulariYukle();
      return sonrakiDurum;
    });
  };

  const duyuruyaGit = (duyuru) => {
    const duyuruId = String(duyuru.id);
    setOkunanDuyurular((onceki) => {
      if (onceki.includes(duyuruId)) return onceki;
      const sonraki = [...onceki, duyuruId].slice(-200);
      okunanlariKaydet(okunanAnahtari, sonraki);
      return sonraki;
    });
    setBildirimlerAcik(false);
    git(duyuru.hedef || "/anasayfa");
  };

  return (
    <header className="home-header">
      {selamlama ? (
        <div className="selam">
          <span className="selam-ust">{t("header.hello")}</span>
          <span className="selam-ad">
            {ad} <span aria-hidden="true">👋</span>
          </span>
        </div>
      ) : (
        <div className="brand">
          <MarkaLogosu className="brand-logo" alt={isletme.ad} />
        </div>
      )}
      <div className="home-header-sag">
        {ozetMasaNo && (
          <motion.button
            className={`ikon-btn personel-cagir-btn${aktifCagri ? " personel-cagir-btn--aktif" : ""}`}
            aria-label={t("header.callStaff")}
            onClick={() => { setBildirimlerAcik(false); setPersonelPaneliAcik(true); }}
            whileTap={{ scale: 0.88 }}
          >
            <IconService />
            {aktifCagri && <span />}
          </motion.button>
        )}
        <div className="bildirim-sarici">
          <motion.button
            className="ikon-btn bildirim-btn"
            aria-label={t("header.notifications")}
            aria-expanded={bildirimlerAcik}
            onClick={bildirimleriAcKapat}
            whileTap={{ scale: 0.88 }}
          >
            <IconBell />
            {okunmamisSayisi > 0 && <span className="bildirim-badge">{okunmamisSayisi > 9 ? "9+" : okunmamisSayisi}</span>}
          </motion.button>
        </div>
        <motion.button
          className="ikon-btn sepet-btn"
          aria-label={t("header.cart")}
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
        {!misafir && (
          <motion.button
            className="avatar-sm avatar-harf"
            onClick={() => git("/profil")}
            aria-label={t("header.profile")}
            whileTap={{ scale: 0.9 }}
          >
            {avatar ? <img className="avatar-gorsel" src={avatar} alt={t("header.profile")} /> : kullanici ? kullanici.ad.charAt(0).toUpperCase() : "?"}
          </motion.button>
        )}
      </div>
      {createPortal(
        <AnimatePresence>
          {bildirimlerAcik && (
            <div className="bildirim-katman">
              <motion.button
                type="button"
                className="bildirim-perde"
                aria-label={t("common.close")}
                onClick={() => setBildirimlerAcik(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.section
                className="bildirim-panel"
                role="dialog"
                aria-modal="false"
                aria-label={t("header.notifications")}
                initial={{ opacity: 0, y: -10, scale: .98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: .98 }}
              >
                <header><b>{t("header.notifications")}</b><span>{okunmamisSayisi ? t("header.unread", { count: okunmamisSayisi }) : t("header.upToDate")}</span></header>
                {duyurular.length ? <div>{duyurular.slice(0, 6).map((duyuru) => {
                  const okundu = okunanDuyurular.includes(String(duyuru.id));
                  return <button className={okundu ? "okundu" : "okunmadi"} key={duyuru.id} onClick={() => duyuruyaGit(duyuru)}><i>•</i><span><b>{duyuru.baslik}</b><small>{duyuru.mesaj}</small></span><em>›</em></button>;
                })}</div> : <p>{t("header.noNews")}</p>}
              </motion.section>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          {personelPaneliAcik && (
            <div className="personel-cagri-katman">
              <motion.button className="personel-cagri-perde" aria-label={t("common.close")} onClick={() => setPersonelPaneliAcik(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.section className="personel-cagri-panel" role="dialog" aria-modal="true" aria-label={t("header.callStaff")} initial={{ opacity: 0, y: 20, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: .97 }}>
                <header><div><small>{t("header.tableLabel", { number: ozetMasaNo })}</small><h2>{t("header.callTitle")}</h2></div><button onClick={() => setPersonelPaneliAcik(false)} aria-label={t("common.close")}>×</button></header>
                <p className={`personel-cagri-durum${aktifCagri ? " personel-cagri-durum--aktif" : ""}`}>{cagriDurumMetni}</p>
                {!aktifCagri && personelCagrisi?.durum !== "masada_yok" && (
                  <div className="personel-cagri-secenekler">
                    {[
                      ["siparis", t("header.callOrder"), t("header.callOrderHint")],
                      ["hesap", t("header.callBill"), t("header.callBillHint")],
                      ["ihtiyac", t("header.callNeed"), t("header.callNeedHint")],
                      ["temizlik", t("header.callClean"), t("header.callCleanHint")],
                    ].map(([neden, baslik, aciklama]) => (
                      <button key={neden} disabled={!personelCagriHazir || personelCagriYukleniyor} onClick={() => personelCagir(neden).catch(() => {})}>
                        <span><b>{baslik}</b><small>{aciklama}</small></span><em>›</em>
                      </button>
                    ))}
                  </div>
                )}
                {personelCagriHatasi && <div className="personel-cagri-hata" role="alert">{personelCagriHatasi}</div>}
                {personelCagriYukleniyor && <span className="personel-cagri-yukleniyor">{t("common.loading")}</span>}
              </motion.section>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
}
