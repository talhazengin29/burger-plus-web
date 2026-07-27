import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { IconBag } from "../components/Icons";
import OrtakHeader from "../components/OrtakHeader";
import SayfaSarici from "../components/SayfaSarici";
import "./Orders.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

/*
  Siparişlerim ekranı — KİŞİSEL, iki bölüm:
   1) Aktif Siparişler: masa hâlâ açıkken (durum canlı: Alındı/Hazırlanıyor/Hazır)
   2) Geçmiş Siparişler: masa kapatıldıktan sonra ("Ödeme tamamlandı" olarak kalır)
*/

function tarihGoster(iso) {
  const t = new Date(iso);
  return t.toLocaleString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Tek bir sipariş kartı
function SiparisKart({ s, durum, gecmis }) {
  return (
    <article className={"siparis-kart" + (gecmis ? " siparis-kart--gecmis" : "")}>
      <div className="siparis-kart-ust">
        <div className="siparis-ust-sol">
          <span className="siparis-tip-rozet">
            {s.tip === "masa" ? `🍽️ Masa ${s.masaNo}` : "🥡 Al Götür"}
          </span>
          <span className="siparis-tarih">{tarihGoster(s.tarih)}</span>
        </div>
        {!gecmis && (
          <span className={"siparis-durum-rozet " + durum.sinif}>{durum.yazi}</span>
        )}
      </div>

      <div className="siparis-urunler">
        {s.urunler.map((u) => (
          <div key={u.id} className="siparis-urun-satir">
            <img className="siparis-urun-gorsel" src={u.gorsel} alt={u.ad} />
            <div className="siparis-urun-orta">
              <span className="siparis-urun-ad">{u.ad}</span>
              <span className="siparis-urun-birim">₺{u.fiyat.toFixed(2)}</span>
            </div>
            <span className="siparis-urun-adet">{u.adet}×</span>
          </div>
        ))}
      </div>

      <div className="siparis-alt">
        <div className="siparis-toplam">
          <span>Toplam</span>
          <span className="siparis-toplam-tutar">₺{s.tutar.toFixed(2)}</span>
        </div>
        {!s.misafir && s.kazanilanPuan > 0 && (
          <span className="siparis-puan">+{s.kazanilanPuan} puan</span>
        )}
      </div>
      <p className="siparis-not siparis-not--odendi">✓ Ödeme tamamlandı</p>
    </article>
  );
}

export default function Orders() {
  const git = useNavigate();
  const { siparislerim, masaDurumu, ozetMasaNo } = useApp();

  // Yedek: socket kopmuş olabilir. Masaların durumunu sunucudan da sorguluyoruz.
  const [masaDurumlari, setMasaDurumlari] = useState({});
  useEffect(() => {
    const masalar = [...new Set(
      siparislerim.filter((s) => s.tip === "masa" && s.masaNo).map((s) => String(s.masaNo))
    )];
    if (masalar.length === 0) return;

    let iptal = false;
    const sorgula = async () => {
      const yeni = {};
      for (const no of masalar) {
        try {
          const r = await fetch(`${BACKEND_URL}/api/masa/${no}`);
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
      if (!iptal) setMasaDurumlari(yeni);
    };
    sorgula();
    const zamanlayici = setInterval(sorgula, 5000);
    return () => { iptal = true; clearInterval(zamanlayici); };
  }, [siparislerim]);

  const durumBilgi = (s) => {
    if (s.tip === "masa" && s.masaNo) {
      const no = String(s.masaNo);
      const d = (String(ozetMasaNo) === no && masaDurumu) || masaDurumlari[no];
      if (d === "hazir") return { yazi: "Hazır ✓", sinif: "durum--hazir" };
      if (d === "hazirlaniyor") return { yazi: "Hazırlanıyor", sinif: "durum--hazirlaniyor" };
      if (d === "yeni") return { yazi: "Alındı", sinif: "durum--yeni" };
    }
    return { yazi: "Hazırlanıyor", sinif: "durum--hazirlaniyor" };
  };

  // Masa kapatıldıysa sipariş geçmişe düşer
  const tamamlandiMi = (s) => {
    if (s.tamamlandi) return true;
    if (s.tip === "masa" && s.masaNo && masaDurumlari[String(s.masaNo)] === "kapali") return true;
    return false;
  };

  const aktifler = siparislerim.filter((s) => !tamamlandiMi(s));
  const gecmisler = siparislerim.filter((s) => tamamlandiMi(s));

  return (
    <div className="ekran orders">
      <OrtakHeader />
      <SayfaSarici>

      <div className="orders-govde">
        <h1 className="orders-baslik">Siparişlerim</h1>

        {siparislerim.length === 0 ? (
          <div className="orders-bos">
            <IconBag className="orders-bos-ikon" />
            <p className="orders-bos-yazi">Henüz siparişin yok</p>
            <p className="orders-bos-alt">Sipariş verdiğinde burada görünecek.</p>
            <button className="orders-bos-btn" onClick={() => git("/anasayfa")}>
              Menüye Git
            </button>
          </div>
        ) : (
          <>
            {/* Aktif siparişler (masa açık) */}
            {aktifler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">Aktif Siparişler</h2>
                <div className="orders-liste">
                  {aktifler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={false} />
                  ))}
                </div>
              </section>
            )}

            {/* Geçmiş siparişler (masa kapatıldı) */}
            {gecmisler.length > 0 && (
              <section className="orders-bolum">
                <h2 className="orders-bolum-baslik">Geçmiş Siparişler</h2>
                <div className="orders-liste">
                  {gecmisler.map((s) => (
                    <SiparisKart key={s.id} s={s} durum={durumBilgi(s)} gecmis={true} />
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
