import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { IconBag } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import { gramajMetni, haricMalzemeleriGetir } from "../lib/urunSecimleri";
import { istekAt } from "../lib/authApi";
import { useIsletmeNavigate } from "../hooks/useIsletmeNavigate";
import "./Orders.css";
import { useDil } from "../i18n/DilContext";

/*
  Siparişlerim ekranı — KİŞİSEL, iki bölüm:
   1) Aktif Siparişler: masa hâlâ açıkken (durum canlı: Alındı/Hazırlanıyor/Hazır)
   2) Geçmiş Siparişler: masa kapatıldıktan sonra ("Ödeme tamamlandı" olarak kalır)
*/

// Tek bir sipariş kartı
function SiparisKart({ s, durum, gecmis, onTekrarSiparisVer }) {
  const { t, tarihSaat, para, yerellestir } = useDil();
  return (
    <article className={"siparis-kart" + (gecmis ? " siparis-kart--gecmis" : "")}>
      <div className="siparis-kart-ust">
        <div className="siparis-ust-sol">
          <span className="siparis-tip-rozet">
            {s.tip === "masa" ? `🍽️ ${t("orders.table", { number: s.masaNo })}` : `🥡 ${t("orders.takeaway")}`}
          </span>
          <span className="siparis-tarih">{tarihSaat(s.tarih, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {!gecmis && (
          <span className={"siparis-durum-rozet " + durum.sinif}>{durum.yazi}</span>
        )}
      </div>

      <div className="siparis-urunler">
        {s.urunler.map((u) => (
          <div key={u.sepetAnahtari || u.id} className="siparis-urun-satir">
            {u.gorsel
              ? <img className="siparis-urun-gorsel" src={u.gorsel} alt={u.ad} />
              : <span className="siparis-urun-gorsel siparis-urun-gorselsiz">{u.ad?.charAt(0) || "?"}</span>}
            <div className="siparis-urun-orta">
              <span className="siparis-urun-ad">{yerellestir(u.ad, u.ceviriler, "ad")}</span>
              <span className="siparis-urun-birim">{para(u.fiyat)}</span>
              {gramajMetni(u.secimler) && <span className="siparis-urun-secim">{gramajMetni(u.secimler)}</span>}
              {haricMalzemeleriGetir(u).length > 0 && (
                <span className="siparis-urun-haric">{t("orders.excluded", { items: haricMalzemeleriGetir(u).join(", ") })}</span>
              )}
            </div>
            <span className="siparis-urun-adet">{u.adet}×</span>
          </div>
        ))}
      </div>

      <div className="siparis-alt">
        <div className="siparis-toplam">
          <span>{t("orders.total")}</span>
          <span className="siparis-toplam-tutar">{para(s.tutar)}</span>
        </div>
        {!s.misafir && s.kazanilanPuan > 0 && (
          <span className="siparis-puan">{t("orders.points", { count: s.kazanilanPuan })}</span>
        )}
      </div>
      <p className="siparis-not siparis-not--odendi">{t("orders.paid")}</p>
      <button className="siparis-tekrar-btn" onClick={() => onTekrarSiparisVer(s)}>
        {t("orders.repeat")}
      </button>
    </article>
  );
}

export default function Orders() {
  const { t } = useDil();
  const git = useIsletmeNavigate();
  const { siparislerim, siparisleriYenile, masaDurumu, ozetMasaNo, ozetMasaTokeni, sepeteEkle, urunler } = useApp();

  const [mesaj, setMesaj] = useState(null); // { tip: "basari" | "hata", metin }
  useEffect(() => {
    if (!mesaj) return;
    const t = setTimeout(() => setMesaj(null), 2500);
    return () => clearTimeout(t);
  }, [mesaj]);

  const tekrarSiparisVer = (s) => {
    let eklenen = 0, eksik = 0;
    for (const kalem of s.urunler) {
      const guncelUrun = urunler.find((u) => Number(u.id) === Number(kalem.id));
      if (!guncelUrun) { eksik++; continue; }
      for (let i = 0; i < (kalem.adet || 1); i++) sepeteEkle(guncelUrun);
      eklenen++;
    }
    if (eklenen === 0) {
      setMesaj({ tip: "hata", metin: "Bu siparişteki ürünler artık mevcut değil." });
      return;
    }
    if (eksik > 0) {
      setMesaj({ tip: "hata", metin: `${eksik} ürün artık mevcut değil, eklenemedi.` });
      setTimeout(() => git("/sepet"), 1200);
      return;
    }
    git("/sepet");
  };

  useEffect(() => {
    siparisleriYenile().catch(() => {});
    const zamanlayici = setInterval(() => siparisleriYenile().catch(() => {}), 5000);
    return () => clearInterval(zamanlayici);
  }, [siparisleriYenile]);

  // Yedek: socket kopmuş olabilir. Masaların durumunu sunucudan da sorguluyoruz.
  const [masaDurumlari, setMasaDurumlari] = useState({});
  // İlk poll sonucu gelene kadar aktif/geçmiş bölümlerini göstermeyip bekleriz —
  // aksi halde masaDurumlari boşken sipariş bir an "Hazırlanıyor" görünüp poll
  // sonucu "kapali" gelince aniden Geçmiş'e düşüyordu (görsel flaş).
  const [ilkSorguTamam, setIlkSorguTamam] = useState(false);
  useEffect(() => {
    // Zaten tamamlandı işaretli siparişler için sorgulamaya gerek yok.
    const masalar = [...new Set(
      siparislerim
        .filter((s) => s.tip === "masa" && s.masaNo && !s.tamamlandi)
        .map((s) => String(s.masaNo))
    )];
    if (masalar.length === 0) { setIlkSorguTamam(true); return; }

    let iptal = false;
    const sorgula = async () => {
      const yeni = {};
      for (const no of masalar) {
        if (String(ozetMasaNo) !== no || !ozetMasaTokeni) continue;
        try {
          const r = await istekAt(`/api/masa/${encodeURIComponent(no)}`, {
            headers: { "X-Masa-Token": ozetMasaTokeni },
          });
          if (!r.ok) continue;
          const d = await r.json();
          const k = d.kalemler || [];
          // Masa boş → oturum kapatılmış → sipariş tamamlanmış
          if (k.length === 0) { yeni[no] = "kapali"; continue; }
          if (k.every((x) => x.durum === "hazir")) yeni[no] = "hazir";
          else if (k.some((x) => x.durum === "hazirlaniyor")) yeni[no] = "hazirlaniyor";
          else yeni[no] = "yeni";
        } catch { /* sunucu yok, sessizce geç */ }
      }
      if (!iptal) {
        setMasaDurumlari(yeni);
        setIlkSorguTamam(true);
      }
    };
    sorgula();
    const zamanlayici = setInterval(sorgula, 5000);
    return () => { iptal = true; clearInterval(zamanlayici); };
  }, [siparislerim, ozetMasaNo, ozetMasaTokeni]);

  const durumBilgi = (s) => {
    if (s.tip === "masa" && s.masaNo) {
      const no = String(s.masaNo);
      const d = (String(ozetMasaNo) === no && masaDurumu) || masaDurumlari[no];
      if (d === "hazir") return { yazi: t("orders.ready"), sinif: "durum--hazir" };
      if (d === "hazirlaniyor") return { yazi: t("orders.preparing"), sinif: "durum--hazirlaniyor" };
      if (d === "yeni") return { yazi: t("orders.received"), sinif: "durum--yeni" };
    }
    return { yazi: t("orders.preparing"), sinif: "durum--hazirlaniyor" };
  };

  // Masa kapatıldıysa sipariş geçmişe düşer
  const tamamlandiMi = (s) => {
    if (s.tamamlandi) return true;
    if (s.tip === "masa" && s.masaNo && masaDurumlari[String(s.masaNo)] === "kapali") return true;
    return false;
  };

  const aktifler = siparislerim.filter((s) => !tamamlandiMi(s));
  const gecmisler = siparislerim.filter((s) => tamamlandiMi(s));

  // Durumu henüz bilinmeyen (poll edilmemiş) masa siparişi varsa bölümleri
  // gösterme — aksi halde sipariş yanlış bölümde görünüp sonra sıçrar.
  const bekleniyor = siparislerim.some(
    (s) => s.tip === "masa" && s.masaNo && !s.tamamlandi && !ilkSorguTamam
  );

  return (
    <div className="ekran orders">
      <OrtakHeader />
      <SayfaSarici>

      <div className="orders-govde">
        <h1 className="orders-baslik">{t("orders.title")}</h1>

        <AnimatePresence>
          {mesaj && (
            <motion.div
              className={"orders-toast orders-toast--" + mesaj.tip}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {mesaj.metin}
            </motion.div>
          )}
        </AnimatePresence>

        {siparislerim.length === 0 ? (
          <div className="orders-bos">
            <IconBag className="orders-bos-ikon" />
            <p className="orders-bos-yazi">{t("orders.empty")}</p>
            <p className="orders-bos-alt">{t("orders.emptyInfo")}</p>
            <button className="orders-bos-btn" onClick={() => git("/anasayfa")}>
              {t("orders.goMenu")}
            </button>
          </div>
        ) : bekleniyor ? (
          <div className="orders-yukleniyor">
            <p className="orders-bos-alt">{t("orders.loading")}</p>
          </div>
        ) : (
          <>
            {/* Aktif siparişler (masa açık) */}
            {aktifler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">{t("orders.active")}</h2>
                <div className="orders-liste">
                  {aktifler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={false} onTekrarSiparisVer={tekrarSiparisVer} />
                  ))}
                </div>
              </section>
            )}

            {/* Geçmiş siparişler (masa kapatıldı) */}
            {gecmisler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">{t("orders.history")}</h2>
                <div className="orders-liste">
                  {gecmisler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={true} onTekrarSiparisVer={tekrarSiparisVer} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      </SayfaSarici>
    </div>
  );
}
