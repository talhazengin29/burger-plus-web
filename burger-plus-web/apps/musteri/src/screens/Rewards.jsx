import { motion } from "framer-motion";
import { sadakatVarsayilan, oduller, puanGecmisi } from "../data/mockData";
import { useApp } from "../context/AppContext";
import { IconShop, IconTicket, IconCutlery, IconGift } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import UyeOl from "./UyeOl";
import { siraliKonteyner, siraliOge, barDolumu } from "../lib/animasyonlar";
import "./Rewards.css";

const ODUL_IKONLARI = { IconTicket, IconCutlery, IconGift };

export default function Rewards() {
  const { puan, misafir } = useApp();

  if (misafir) {
    return (
      <UyeOl
        baslik="Puan Kazanmaya Başla"
        aciklama="Puanlar üyelere özel. Üye ol, her siparişte puan biriktir, ödüller kazan."
      />
    );
  }

  const hedef = sadakatVarsayilan.hedefPuan;
  const yuzde = Math.min((puan / hedef) * 100, 100);
  const kalan = Math.max(hedef - puan, 0);

  return (
    <div className="ekran rewards">
      <OrtakHeader />
      <SayfaSarici>
        <div className="rewards-govde">
          {/* Toplam puan kartı */}
          <motion.section
            className="puan-kart"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="puan-kart-baslik">Toplam Puanım</h2>
            <div className="puan-buyuk">
              <span className="puan-sayi">{puan.toLocaleString("tr-TR")}</span>
              <span className="puan-etiket">Puan</span>
            </div>
            <div className="puan-ilerleme-bilgi">
              <span>Başlangıç</span>
              <span className="puan-hedef">Hediye Burger ({hedef.toLocaleString("tr-TR")} Puan)</span>
            </div>
            <div className="puan-ilerleme-ray">
              <motion.div className="puan-ilerleme-dolgu" {...barDolumu(yuzde)} />
            </div>
            <p className="puan-kalan">Hediyeye sadece <strong>{kalan.toLocaleString("tr-TR")} puan</strong> kaldı!</p>
          </motion.section>

          {/* Ödül Marketi */}
          <div className="bolum-basrivi">
            <h3 className="bolum-baslik">Ödül Marketi</h3>
            <IconShop className="bolum-ikon" />
          </div>

          <motion.div className="odul-grid" {...siraliKonteyner} initial="initial" animate="animate">
            {oduller.map((o) => {
              const Ikon = ODUL_IKONLARI[o.ikon] || IconGift;
              return (
                <motion.article key={o.id} className="odul-kart" variants={siraliOge}>
                  <div className="odul-gorsel-wrap">
                    {o.gorsel
                      ? <img className="odul-gorsel" src={o.gorsel} alt={o.ad} />
                      : <div className="odul-gorsel-yer"><Ikon /></div>}
                  </div>
                  <div className="odul-alt">
                    <h4 className="odul-ad">{o.ad}</h4>
                    <div className="odul-fiyat-satir">
                      <span className="odul-puan">{o.puan.toLocaleString("tr-TR")} Puan</span>
                      <motion.button
                        className="odul-ekle"
                        aria-label={`${o.ad} al`}
                        whileTap={{ scale: 0.85 }}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {/* Puan geçmişi */}
          <div className="bolum-basrivi">
            <h3 className="bolum-baslik">Puan Geçmişi</h3>
          </div>
          <div className="gecmis-liste">
            {puanGecmisi.map((g) => (
              <div key={g.id} className="gecmis-satir">
                <div className="gecmis-sol">
                  <span className="gecmis-baslik">{g.baslik}</span>
                  <span className="gecmis-tarih">{g.tarih}</span>
                </div>
                <span className={"gecmis-puan " + (g.tip === "kazanc" ? "arti" : "eksi")}>
                  {g.puan > 0 ? `+${g.puan}` : g.puan}
                </span>
              </div>
            ))}
          </div>
          <button className="tumunu-gor">Tümünü Gör</button>
        </div>
      </SayfaSarici>
    </div>
  );
}
