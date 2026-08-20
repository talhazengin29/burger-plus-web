import { useEffect, useState } from "react";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import { motion, AnimatePresence } from "framer-motion";
import { kampanyaDurumu } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { IconClock, IconInvite } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { siraliKonteyner, siraliOge, fadeIn, asagiAcilma } from "../lib/animasyonlar";
import { davetOzetiniGetir } from "../lib/authApi";
import { useDil } from "../dil/DilContext";
import "./Campaigns.css";

// Etikete göre küçük ikon seçimi (saat / davet / öğrenci)
function EtiketIkon({ ikon, etiket }) {
  if (ikon) return <span className="rozet-emoji" aria-hidden="true">{ikon}</span>;
  if (etiket.includes(":")) return <IconClock className="rozet-ikon" />;
  if (etiket === "Davet Et") return <IconInvite className="rozet-ikon" />;
  return <span className="rozet-emoji">🎓</span>;
}

// Canlı durum rozeti: AKTİF (yeşil) / BAŞLAMADI / SONA ERDİ (gri)
const durumAnahtari = { aktif: "campaigns.active", baslamadi: "campaigns.upcoming", sonaerdi: "campaigns.ended" };

export default function Campaigns() {
  const { t, yerelAlan } = useDil();
  const git = useIsletmeNavigate();
  const { misafir, kullanici, kampanyalar } = useApp();

  // Saatli kampanyaların (Happy Hour) durumu canlı kalsın diye dakikada bir tazelenir.
  const [simdi, setSimdi] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setSimdi(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Misafir kampanyayı görebilir ama faydalanamaz — "Sipariş Ver"e basınca üyelik modalı çıkar.
  const [modalAcik, setModalAcik] = useState(false);
  const [davetAcik, setDavetAcik] = useState(false);
  const [davetOzeti, setDavetOzeti] = useState(null);
  const [davetHatasi, setDavetHatasi] = useState("");
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    if (!kullanici?.id) {
      setDavetOzeti(null);
      return;
    }
    let iptal = false;
    davetOzetiniGetir()
      .then((ozet) => { if (!iptal) setDavetOzeti(ozet); })
      .catch((e) => { if (!iptal) setDavetHatasi(e.message); });
    return () => { iptal = true; };
  }, [kullanici?.id]);

  const siparisVer = (k) => {
    const kategori = k.gecerliKategoriler?.[0];
    git("/anasayfa", kategori ? { state: { kategori } } : undefined);
  };

  const siparisVerTiklandi = (k) => {
    if (misafir) { setModalAcik(true); return; }
    siparisVer(k);
  };

  const davetKodunuGoster = () => {
    if (misafir || !kullanici) { setModalAcik(true); return; }
    setKopyalandi(false);
    setDavetAcik(true);
  };

  const koduKopyala = async () => {
    const davetKodu = davetOzeti?.davetKodu || kullanici?.davetKodu;
    if (!davetKodu) return;
    try {
      await navigator.clipboard.writeText(davetKodu);
      setKopyalandi(true);
    } catch {
      setKopyalandi(false);
    }
  };

  return (
    <div className="ekran campaigns">
      <OrtakHeader />
      <SayfaSarici>
        <div className="camp-govde">
          <h1 className="camp-baslik">{t("campaigns.title")}</h1>
          <p className="camp-alt">{t("campaigns.intro")}</p>

          <motion.div className="camp-liste" {...siraliKonteyner} initial="initial" animate="animate">
            {kampanyalar.map((k) => {
              const durum = kampanyaDurumu(k, simdi);
              const davetKampanyasi = k.kod === "davet-et" || k.etiket === "Davet Et";
              const siparisVerilebilir = !davetKampanyasi;
              const pasif = siparisVerilebilir && durum !== "aktif";
              return (
                <motion.article key={k.id} className="camp-kart" variants={siraliOge}>
                  <div className="camp-gorsel-wrap">
                    <img className="camp-gorsel" src={k.gorsel || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=500&fit=crop"} alt={yerelAlan(k, "baslik", k.baslik)} />
                    <span className="camp-rozet">
                      <EtiketIkon ikon={k.ikon} etiket={k.etiket} />
                      {yerelAlan(k, "etiket", k.etiket)}
                    </span>
                    {durum !== "pasif" && (
                      <span className={"camp-durum-rozet camp-durum-rozet--" + durum}>
                        {t(durumAnahtari[durum])}
                      </span>
                    )}
                  </div>
                  <div className="camp-icerik">
                    <div className="camp-baslik-satir">
                      <h3 className="camp-kart-baslik">{yerelAlan(k, "baslik", k.baslik)}</h3>
                      {k.indirimYuzde > 0 && <span className="camp-fiyat">%{k.indirimYuzde}</span>}
                    </div>
                    <p className="camp-aciklama">{yerelAlan(k, "aciklama", k.aciklama)}</p>
                    {siparisVerilebilir && misafir && (
                      <span className="camp-uye-rozet">{t("campaigns.membersOnly")}</span>
                    )}
                    {davetKampanyasi && davetAcik ? (
                      <div className="davet-kodu-kutu">
                        <span>{t("campaigns.inviteCode")}</span>
                        <strong>{davetOzeti?.davetKodu || kullanici?.davetKodu || t("campaigns.loading")}</strong>
                        <button type="button" onClick={koduKopyala} disabled={!davetOzeti?.davetKodu && !kullanici?.davetKodu}>{kopyalandi ? t("campaigns.copied") : t("campaigns.copy")}</button>
                        {davetHatasi && <small className="davet-hata">{davetHatasi}</small>}
                        <div className="davet-istatistikler">
                          <span><b>{davetOzeti?.davetEdilenSayisi ?? 0}</b> {t("campaigns.invites")}</span>
                          <span><b>{davetOzeti?.kazanilanPuan ?? 0}</b> {t("campaigns.pointsEarned")}</span>
                        </div>
                      </div>
                    ) : (
                      <motion.button
                        className={"camp-btn " + (k.butonTipi === "primary" ? "camp-btn--primary" : "camp-btn--charcoal")}
                        whileTap={{ scale: 0.95 }}
                        disabled={pasif}
                        onClick={siparisVerilebilir ? () => siparisVerTiklandi(k) : davetKampanyasi ? davetKodunuGoster : undefined}
                      >
                        {yerelAlan(k, "buton", k.buton)}
                      </motion.button>
                    )}
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
              <h3 className="uye-modal-baslik">{t("campaigns.modalTitle")}</h3>
              <p className="uye-modal-metin">{t("campaigns.modalText")}</p>
              <div className="uye-modal-butonlar">
                <button className="camp-btn camp-btn--charcoal" onClick={() => setModalAcik(false)}>{t("common.close")}</button>
                <button className="camp-btn camp-btn--primary" onClick={() => git("/kayit")}>{t("campaigns.register")}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
